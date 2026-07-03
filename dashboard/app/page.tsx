import Link from "next/link";
import { kitConfig } from "@/kit.config";
import { ConfigWarning, ErrorBanner } from "@/components/ConfigWarning";
import { ExecutionTable } from "@/components/ExecutionTable";
import { GeminiPromoCard } from "@/components/GeminiPromoCard";
import { StandupSummaryCard } from "@/components/StandupSummaryCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatShortRelative } from "@/lib/format";
import { computeExecutionStats } from "@/lib/stats";
import {
  getKitWorkflowRows,
  getLatestPrimaryExecution,
  getPrimaryWorkflowExecutions,
  isN8nConfigured,
} from "@/lib/n8n-client";

export const dynamic = "force-dynamic";

const STATS_WINDOW = 20;

export default async function OverviewPage() {
  if (!isN8nConfigured()) {
    return (
      <div className="space-y-6">
        <PageHeader title="Operations dashboard" description={kitConfig.description} />
        <ConfigWarning />
      </div>
    );
  }

  let kitWorkflows: Awaited<ReturnType<typeof getKitWorkflowRows>> = [];
  let latest: Awaited<ReturnType<typeof getLatestPrimaryExecution>> | null = null;
  let statsRows: Awaited<ReturnType<typeof getPrimaryWorkflowExecutions>> = [];
  let recentRows: Awaited<ReturnType<typeof getPrimaryWorkflowExecutions>> = [];
  let error: string | null = null;

  try {
    [kitWorkflows, latest, statsRows, recentRows] = await Promise.all([
      getKitWorkflowRows(),
      getLatestPrimaryExecution(),
      getPrimaryWorkflowExecutions(STATS_WINDOW),
      getPrimaryWorkflowExecutions(5),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load data from n8n";
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Operations dashboard" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  const lastExecution = latest?.execution ?? null;
  const lastSummary = latest?.summary ?? null;
  const stats = computeExecutionStats(statsRows);
  const activeWorkflows = kitWorkflows.filter((w) => w.active && w.found).length;
  const totalWorkflows = kitWorkflows.filter((w) => w.found).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations dashboard"
        description={kitConfig.description}
        action={
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-[#FAFAF9]"
          >
            Kit settings →
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          variant="highlighted"
          label="Success rate"
          value={stats.successRate !== null ? `${stats.successRate}%` : "—"}
          trend={
            stats.successRate !== null && stats.total > 0
              ? `${stats.success} successful of ${stats.total}`
              : undefined
          }
        />
        <StatCard
          label="Fail rate"
          value={stats.failRate !== null ? `${stats.failRate}%` : "—"}
          sub={`${stats.failed} failed execution${stats.failed === 1 ? "" : "s"}`}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FDE2E2] text-sm font-bold text-[#D93636]">
              !
            </span>
          }
        />
        <StatCard
          label="Last run"
          value={
            lastExecution ? formatShortRelative(lastExecution.startedAt) : "Never"
          }
          sub={kitConfig.primaryWorkflow}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAFAF9] text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          }
        />
        <StatCard
          label="Workflows"
          value={String(totalWorkflows || kitConfig.workflows.length)}
          sub={
            <StatusPill
              label={`${activeWorkflows} active`}
              color="success"
            />
          }
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAFAF9] text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          }
        />
        <StatCard
          label="Total runs"
          value={String(stats.total)}
          sub={`Last ${STATS_WINDOW} executions`}
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAFAF9] text-gray-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
          }
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {lastSummary ? (
          <StandupSummaryCard summary={lastSummary} />
        ) : (
          <Card className="h-full">
            <CardHeader
              title="Latest standup summary"
              description="Run the pipeline from Settings to generate your first summary."
              action={<StatusPill label="GeminiPro AI" color="info" />}
            />
            <p className="text-sm text-gray-500">
              No standup summary yet. Use{" "}
              <Link href="/settings" className="font-semibold text-[#0E7C5C]">
                Run standup pipeline
              </Link>{" "}
              to create one.
            </p>
          </Card>
        )}
        <GeminiPromoCard />
      </section>

      <section>
        <CardHeader
          title="Recent activity"
          description={`${kitConfig.primaryWorkflow} execution history`}
          action={
            <Link
              href="/executions"
              className="text-sm font-bold text-[#0E7C5C] hover:text-[#0B6B4F]"
            >
              View all →
            </Link>
          }
        />
        <ExecutionTable
          rows={recentRows}
          emptyMessage="No runs yet. Go to Settings and click Run standup pipeline."
        />
      </section>
    </div>
  );
}
