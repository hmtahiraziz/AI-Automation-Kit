import { kitConfig } from "@/kit.config";
import { ConfigWarning, ErrorBanner } from "@/components/ConfigWarning";
import { ExecutionTable } from "@/components/ExecutionTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { computeExecutionStats } from "@/lib/stats";
import {
  getExecutionRows,
  getPrimaryWorkflowExecutions,
  isN8nConfigured,
} from "@/lib/n8n-client";

export const dynamic = "force-dynamic";

export default async function ExecutionsPage() {
  if (!isN8nConfigured()) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader eyebrow="Executions" title="Execution logs" />
        <ConfigWarning />
      </div>
    );
  }

  let primaryRows: Awaited<ReturnType<typeof getPrimaryWorkflowExecutions>> = [];
  let allRows: Awaited<ReturnType<typeof getExecutionRows>> = [];
  let error: string | null = null;

  try {
    [primaryRows, allRows] = await Promise.all([
      getPrimaryWorkflowExecutions(50),
      getExecutionRows({ limit: 50 }),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load executions";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader eyebrow="Executions" title="Execution logs" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  const rows = primaryRows.length > 0 ? primaryRows : allRows;
  const stats = computeExecutionStats(rows);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Executions"
        title="Execution logs"
        description={
          primaryRows.length > 0
            ? `Showing runs for ${kitConfig.primaryWorkflow}`
            : "Showing all workflow runs (primary workflow not found in n8n)"
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          variant="highlighted"
          label="Success rate"
          value={stats.successRate !== null ? `${stats.successRate}%` : "—"}
          sub={`${stats.total} runs loaded`}
        />
        <StatCard
          label="Fail rate"
          value={stats.failRate !== null ? `${stats.failRate}%` : "—"}
          sub={`${stats.failed} failed`}
        />
        <StatCard label="In progress" value={String(stats.running)} sub="Running or waiting" />
        <StatCard label="Total shown" value={String(stats.total)} sub="Current page" />
      </section>

      <ExecutionTable
        rows={rows}
        emptyMessage="No execution logs yet. Run Main Automation from Settings."
        showFooter={false}
      />
    </div>
  );
}
