export type ExecutionStatus =
  | "success"
  | "error"
  | "running"
  | "waiting"
  | "canceled"
  | "crashed"
  | "new"
  | "unknown";

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KitWorkflowRow {
  id: string | null;
  name: string;
  label: string;
  description: string;
  active: boolean;
  found: boolean;
  updatedAt?: string;
}

export interface KitCredentialRow {
  name: string;
  label: string;
  type: string;
  id: string | null;
  found: boolean;
  authKind: "oauth" | "apiKey";
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: ExecutionStatus;
  retryOf?: string;
}

export interface N8nExecutionDetail extends N8nExecution {
  data?: {
    resultData?: {
      runData?: Record<
        string,
        Array<{
          data?: {
            main?: Array<
              Array<{
                json?: Record<string, unknown>;
              }>
            >;
          };
        }>
      >;
    };
  };
}

export interface ParsedExecutionResult {
  success?: boolean;
  summary?: string;
  providers?: string;
  finishedAt?: string;
  workflowName?: string;
  slackChannel?: string;
  gmailTo?: string;
}

export interface ExecutionRow extends N8nExecution {
  workflowName: string;
  durationMs: number | null;
  summary?: string;
}
