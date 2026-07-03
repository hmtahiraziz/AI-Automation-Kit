import type { N8nExecutionDetail, ParsedExecutionResult } from "@/lib/types";

const RESULT_NODE_NAMES = ["Set Result", "set result"];
const SUMMARY_NODE_NAMES = ["Gemini Summary", "Basic LLM Chain"];

function getNodeOutputJson(
  runData: Record<string, unknown> | undefined,
  nodeName: string,
): Record<string, unknown> | undefined {
  if (!runData || !(nodeName in runData)) {
    return undefined;
  }

  const runs = runData[nodeName] as
    | Array<{ data?: { main?: Array<Array<{ json?: unknown }>> } }>
    | undefined;
  const json = runs?.[0]?.data?.main?.[0]?.[0]?.json;
  return json && typeof json === "object" ? (json as Record<string, unknown>) : undefined;
}

export function parseExecutionResult(
  execution: N8nExecutionDetail,
): ParsedExecutionResult {
  const runData = execution.data?.resultData?.runData;
  if (!runData) {
    return {};
  }

  for (const nodeName of Object.keys(runData)) {
    if (!RESULT_NODE_NAMES.some((n) => n.toLowerCase() === nodeName.toLowerCase())) {
      continue;
    }

    const json = getNodeOutputJson(runData, nodeName);
    if (!json) {
      continue;
    }

    let summary =
      typeof json.summary === "string" && json.summary.trim().length > 0
        ? json.summary
        : undefined;

    if (!summary) {
      for (const summaryNode of SUMMARY_NODE_NAMES) {
        const geminiJson = getNodeOutputJson(runData, summaryNode);
        if (typeof geminiJson?.text === "string" && geminiJson.text.trim().length > 0) {
          summary = geminiJson.text;
          break;
        }
      }
    }

    return {
      success: typeof json.success === "boolean" ? json.success : undefined,
      summary,
      providers: typeof json.providers === "string" ? json.providers : undefined,
      finishedAt: typeof json.finishedAt === "string" ? json.finishedAt : undefined,
      workflowName:
        typeof json.workflowName === "string" ? json.workflowName : undefined,
      slackChannel:
        typeof json.slackChannel === "string" ? json.slackChannel : undefined,
      gmailTo: typeof json.gmailTo === "string" ? json.gmailTo : undefined,
    };
  }

  for (const summaryNode of SUMMARY_NODE_NAMES) {
    const geminiJson = getNodeOutputJson(runData, summaryNode);
    if (typeof geminiJson?.text === "string" && geminiJson.text.trim().length > 0) {
      return { summary: geminiJson.text };
    }
  }

  return {};
}

export function parseExecutionError(
  execution: N8nExecutionDetail,
): string | null {
  const runData = execution.data?.resultData?.runData;
  if (!runData) {
    return null;
  }

  for (const nodeName of Object.keys(runData)) {
    const runs = runData[nodeName];
    for (const run of runs ?? []) {
      const error = (run as { error?: { message?: string } }).error;
      if (error?.message) {
        return `${nodeName}: ${error.message}`;
      }
    }
  }

  return null;
}

export function listExecutedNodes(execution: N8nExecutionDetail): string[] {
  const runData = execution.data?.resultData?.runData;
  if (!runData) {
    return [];
  }
  return Object.keys(runData);
}
