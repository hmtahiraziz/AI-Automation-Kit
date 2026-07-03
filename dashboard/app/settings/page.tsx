import Link from "next/link";
import { kitConfig } from "@/kit.config";
import { ConfigWarning, ErrorBanner } from "@/components/ConfigWarning";
import { KitActions } from "@/components/KitActions";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getKitCredentialRows,
  getKitWorkflowRows,
  getN8nPublicUrl,
  isN8nConfigured,
} from "@/lib/n8n-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isN8nConfigured()) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader eyebrow="Settings" title="Kit control panel" />
        <ConfigWarning />
      </div>
    );
  }

  let workflows: Awaited<ReturnType<typeof getKitWorkflowRows>> = [];
  let credentials: Awaited<ReturnType<typeof getKitCredentialRows>> = [];
  let error: string | null = null;

  try {
    [workflows, credentials] = await Promise.all([
      getKitWorkflowRows(),
      getKitCredentialRows(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load settings";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader eyebrow="Settings" title="Kit control panel" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  const primary = workflows.find((w) => w.name === kitConfig.primaryWorkflow);
  const seed = workflows.find((w) => w.name === kitConfig.seedWorkflow);
  const connectedCreds = credentials.filter((c) => c.found).length;
  const n8nUrl = getN8nPublicUrl();

  const configRows = [
    { key: "KIT_NAME", value: kitConfig.name },
    { key: "PRIMARY_WORKFLOW", value: kitConfig.primaryWorkflow },
    { key: "RUN_WEBHOOK", value: kitConfig.primaryWebhookPath },
    { key: "SEED_WEBHOOK", value: kitConfig.seedWebhookPath },
    { key: "N8N_URL", value: n8nUrl },
    {
      key: "CREDENTIALS_LINKED",
      value: `${connectedCreds} / ${credentials.length}`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Kit control panel"
        description="Run automations, seed data, and review kit configuration."
      />

      <Card>
        <CardHeader
          title="Quick links"
          description="Jump to common kit management pages."
        />
        <div className="flex flex-wrap gap-3">
          <PillLink href="/workflows" label="Workflow toggles" />
          <PillLink href="/credentials" label="Connect OAuth" />
          <PillLink href="/executions" label="Execution logs" />
          <a
            href={n8nUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Open n8n ↗
          </a>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Kit operations"
            description="Trigger workflows from the dashboard without opening n8n."
          />
          <KitActions
            primaryFound={Boolean(primary?.found)}
            seedFound={Boolean(seed?.found)}
            layout="cards"
          />
        </Card>

        <Card>
          <CardHeader
            title="Configuration"
            description="Fork customization lives in kit.config.ts and root .env."
            action={
              <span className="text-xs font-semibold text-accent">Edit .env</span>
            }
          />
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead className="bg-[#FAFAF9]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Key name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Active value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {configRows.map((row) => (
                  <tr key={row.key}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      {row.key}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Run{" "}
            <code className="rounded bg-accent-light px-1 font-mono text-accent">
              sync-dashboard-env.ps1
            </code>{" "}
            after editing <code className="font-mono">.env</code>.
          </p>
        </Card>
      </div>

      <Card className="bg-accent-light">
        <p className="text-sm text-gray-700">
          <span className="font-bold text-gray-900">Instance health:</span> Dashboard
          connected to n8n. Restart containers after changing encryption keys or
          database credentials.
        </p>
      </Card>
    </div>
  );
}

function PillLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-gray-200 bg-[#FAFAF9] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
    >
      {label}
    </Link>
  );
}
