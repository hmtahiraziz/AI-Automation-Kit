import { kitConfig } from "@/kit.config";
import type {
  ExecutionRow,
  KitCredentialRow,
  KitWorkflowRow,
  N8nCredential,
  N8nExecution,
  N8nExecutionDetail,
  N8nWorkflow,
} from "@/lib/types";
import { getWorkflowLabel } from "@/kit.config";
import { parseExecutionResult } from "@/lib/parse-execution";

const DEFAULT_BASE_URL = "http://localhost:5678";

function getBaseUrl(): string {
  return (
    process.env.N8N_INTERNAL_URL ??
    process.env.N8N_API_URL ??
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
}

function getApiKey(): string {
  const key = process.env.N8N_API_KEY;
  if (!key) {
    throw new Error(
      "N8N_API_KEY is not set. Copy dashboard/.env.local.example to .env.local",
    );
  }
  return key;
}

async function n8nFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}/api/v1${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "X-N8N-API-KEY": getApiKey(),
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`n8n API ${response.status}: ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

interface ListResponse<T> {
  data: T[];
  nextCursor?: string | null;
}

export async function getWorkflows(): Promise<N8nWorkflow[]> {
  const result = await n8nFetch<ListResponse<N8nWorkflow>>("/workflows");
  return result.data ?? [];
}

export async function getWorkflowByName(
  name: string,
): Promise<N8nWorkflow | undefined> {
  const workflows = await getWorkflows();
  return workflows.find((w) => w.name === name);
}

export async function getWorkflowById(
  id: string,
): Promise<N8nWorkflow | undefined> {
  try {
    return await n8nFetch<N8nWorkflow>(`/workflows/${id}`);
  } catch {
    return undefined;
  }
}

export async function setWorkflowActive(
  workflowId: string,
  active: boolean,
): Promise<void> {
  const path = active
    ? `/workflows/${workflowId}/activate`
    : `/workflows/${workflowId}/deactivate`;
  await n8nFetch(path, { method: "POST" });
}

export async function triggerKitWebhook(options: {
  workflowName: string;
  webhookPath: string;
  timeoutMs?: number;
}): Promise<{ ok: boolean; message: string; workflowId: string }> {
  const workflow = await getWorkflowByName(options.workflowName);
  if (!workflow) {
    throw new Error(
      `${options.workflowName} not found. Run import-workflows.ps1`,
    );
  }

  const wasActive = workflow.active;
  if (!wasActive) {
    await setWorkflowActive(workflow.id, true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const timeoutMs = options.timeoutMs ?? 120_000;

  try {
    const baseUrl = getBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/webhook/${options.webhookPath}`, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const message = await response.text();
    if (!response.ok) {
      throw new Error(`Webhook failed (${response.status}): ${message}`);
    }

    let parsedMessage = message || "Workflow completed";
    try {
      const json = JSON.parse(message) as { summary?: string; message?: string };
      parsedMessage = json.summary ?? json.message ?? parsedMessage;
    } catch {
      // plain text response
    }

    return { ok: true, message: parsedMessage, workflowId: workflow.id };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Workflow timed out after ${Math.round(timeoutMs / 1000)}s — check n8n executions`,
      );
    }
    throw error;
  } finally {
    if (!wasActive) {
      try {
        await setWorkflowActive(workflow.id, false);
      } catch {
        // non-fatal
      }
    }
  }
}

export async function runPrimaryWorkflow(): Promise<{
  ok: boolean;
  message: string;
  workflowId: string;
}> {
  return triggerKitWebhook({
    workflowName: kitConfig.primaryWorkflow,
    webhookPath: kitConfig.primaryWebhookPath,
    timeoutMs: 180_000,
  });
}

export async function seedSheetData(): Promise<{
  ok: boolean;
  message: string;
  workflowId: string;
}> {
  return triggerKitWebhook({
    workflowName: kitConfig.seedWorkflow,
    webhookPath: kitConfig.seedWebhookPath,
    timeoutMs: 120_000,
  });
}

export async function getCredentials(): Promise<N8nCredential[]> {
  const result = await n8nFetch<ListResponse<N8nCredential>>("/credentials");
  return result.data ?? [];
}

export async function getExecutions(options?: {
  workflowId?: string;
  limit?: number;
}): Promise<N8nExecution[]> {
  const params = new URLSearchParams();
  if (options?.workflowId) {
    params.set("workflowId", options.workflowId);
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  const query = params.toString();
  const path = query ? `/executions?${query}` : "/executions";
  const result = await n8nFetch<ListResponse<N8nExecution>>(path);
  return result.data ?? [];
}

export async function getExecution(
  id: string,
  includeData = false,
): Promise<N8nExecutionDetail> {
  const query = includeData ? "?includeData=true" : "";
  return n8nFetch<N8nExecutionDetail>(`/executions/${id}${query}`);
}

function executionDurationMs(execution: N8nExecution): number | null {
  if (!execution.stoppedAt) {
    return null;
  }
  const start = new Date(execution.startedAt).getTime();
  const stop = new Date(execution.stoppedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(stop)) {
    return null;
  }
  return Math.max(0, stop - start);
}

export async function getExecutionRows(options?: {
  workflowId?: string;
  limit?: number;
}): Promise<ExecutionRow[]> {
  const [executions, workflows] = await Promise.all([
    getExecutions(options),
    getWorkflows(),
  ]);

  const workflowNames = new Map(workflows.map((w) => [w.id, w.name]));

  return executions.map((execution) => ({
    ...execution,
    workflowName:
      workflowNames.get(execution.workflowId) ??
      getWorkflowLabel(execution.workflowId),
    durationMs: executionDurationMs(execution),
  }));
}

export async function getPrimaryWorkflowExecutions(
  limit = 20,
): Promise<ExecutionRow[]> {
  const primary = await getWorkflowByName(kitConfig.primaryWorkflow);
  if (!primary) {
    return getExecutionRows({ limit });
  }
  return getExecutionRows({ workflowId: primary.id, limit });
}

export async function getLatestPrimaryExecution(): Promise<{
  execution: ExecutionRow | null;
  summary: string | null;
}> {
  const rows = await getPrimaryWorkflowExecutions(1);
  const execution = rows[0] ?? null;
  if (!execution) {
    return { execution: null, summary: null };
  }

  try {
    const detail = await getExecution(execution.id, true);
    const parsed = parseExecutionResult(detail);
    return {
      execution,
      summary: parsed.summary ?? null,
    };
  } catch {
    return { execution, summary: null };
  }
}

export function isN8nConfigured(): boolean {
  return Boolean(process.env.N8N_API_KEY);
}

export function getN8nPublicUrl(): string {
  return (
    process.env.NEXT_PUBLIC_N8N_URL ?? "http://localhost:5678"
  ).replace(/\/$/, "");
}

export function getCredentialConnectUrl(credentialId: string | null): string {
  const base = getN8nPublicUrl();
  if (credentialId) {
    return `${base}/home/credentials/${encodeURIComponent(credentialId)}`;
  }
  return `${base}/home/credentials`;
}

export async function getKitWorkflowRows(): Promise<KitWorkflowRow[]> {
  const remote = await getWorkflows();
  const remoteByName = new Map(
    remote.filter((w) => !w.isArchived).map((w) => [w.name, w]),
  );

  return kitConfig.workflows.map((entry) => {
    const match = remoteByName.get(entry.name);
    return {
      id: match?.id ?? null,
      name: entry.name,
      label: entry.label,
      description: entry.description,
      active: match?.active ?? false,
      found: Boolean(match),
      updatedAt: match?.updatedAt,
    };
  });
}

function credentialAuthKind(type: string): "oauth" | "apiKey" {
  if (type === "googlePalmApi") {
    return "apiKey";
  }
  return "oauth";
}

export async function getKitCredentialRows(): Promise<KitCredentialRow[]> {
  let remote: N8nCredential[] = [];
  try {
    remote = await getCredentials();
  } catch {
    remote = [];
  }

  const remoteByName = new Map(remote.map((c) => [c.name, c]));

  return kitConfig.credentials.map((entry) => {
    const match = remoteByName.get(entry.name);
    return {
      name: entry.name,
      label: entry.label,
      type: entry.type,
      id: match?.id ?? null,
      found: Boolean(match),
      authKind: credentialAuthKind(entry.type),
    };
  });
}

export async function getExecutionDetailRow(id: string): Promise<{
  execution: ExecutionRow;
  parsed: ReturnType<typeof parseExecutionResult>;
  workflowName: string;
} | null> {
  const detail = await getExecution(id, true);
  const workflow = await getWorkflowById(detail.workflowId);
  const workflowName =
    workflow?.name ?? getWorkflowLabel(detail.workflowId);

  return {
    execution: {
      ...detail,
      workflowName,
      durationMs: executionDurationMs(detail),
    },
    parsed: parseExecutionResult(detail),
    workflowName,
  };
}
