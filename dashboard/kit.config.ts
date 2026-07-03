export const kitConfig = {
  name: process.env.NEXT_PUBLIC_KIT_NAME ?? "S-C Automation Kit",
  description: "n8n automation kit with Google Sheets, Gemini, Slack, and Gmail",
  primaryWorkflow: "Main Automation",
  primaryWebhookPath: "kit-run-main",
  seedWorkflow: "Seed Dummy Sheet Data",
  seedWebhookPath: "kit-seed-sheet",
  workflows: [
    {
      name: "Main Automation",
      label: "Daily Standup",
      description: "Sheet → Gemini standup → Slack + HTML Gmail (scheduled)",
    },
    {
      name: "Seed Dummy Sheet Data",
      label: "Seed Sheet",
      description: "Reset demo standup rows in Google Sheets",
    },
  ],
  credentials: [
    {
      name: "SC - Google Sheets",
      type: "googleSheetsOAuth2Api",
      label: "Google Sheets",
    },
    {
      name: "SC - Gmail",
      type: "gmailOAuth2",
      label: "Gmail",
    },
    {
      name: "SC - Slack",
      type: "slackOAuth2Api",
      label: "Slack",
    },
    {
      name: "SC - Gemini",
      type: "googlePalmApi",
      label: "Gemini",
    },
  ],
} as const;

export type KitWorkflow = (typeof kitConfig.workflows)[number];

export function getWorkflowLabel(name: string): string {
  const match = kitConfig.workflows.find((w) => w.name === name);
  return match?.label ?? name;
}
