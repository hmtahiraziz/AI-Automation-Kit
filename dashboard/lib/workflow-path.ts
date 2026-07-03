import { kitConfig } from "@/kit.config";

const WORKFLOW_PATHS: Record<string, string> = {
  "Main Automation": "Sheets → Gemini → Slack",
  "Seed Dummy Sheet Data": "Webhook → Sheets",
};

export function getWorkflowPath(name: string): string {
  return WORKFLOW_PATHS[name] ?? kitConfig.primaryWorkflow;
}
