import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigWarning, ErrorBanner } from "@/components/ConfigWarning";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatDateTime, formatDuration } from "@/lib/format";
import { gradientForKey } from "@/lib/gradients";
import { getExecution, getWorkflowById, isN8nConfigured } from "@/lib/n8n-client";
import { getWorkflowLabel } from "@/kit.config";
import {
  listExecutedNodes,
  parseExecutionError,
  parseExecutionResult,
} from "@/lib/parse-execution";
import type { ExecutionStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isN8nConfigured()) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <BackLink />
        <ConfigWarning />
      </div>
    );
  }

  let error: string | null = null;

  try {
    const detail = await getExecution(id, true);
    const workflow = await getWorkflowById(detail.workflowId);
    const workflowName = workflow?.name ?? getWorkflowLabel(detail.workflowId);
    const parsed = parseExecutionResult(detail);
    const nodeError = parseExecutionError(detail);
    const nodes = listExecutedNodes(detail);

    const durationMs =
      detail.stoppedAt && detail.startedAt
        ? Math.max(
            0,
            new Date(detail.stoppedAt).getTime() -
              new Date(detail.startedAt).getTime(),
          )
        : null;

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <BackLink />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            eyebrow="Execution detail"
            title={`Execution #${detail.id}`}
            description={workflowName}
          />
          <StatusBadge status={detail.status as ExecutionStatus} />
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Started" value={formatDateTime(detail.startedAt)} />
          <StatCard
            label="Stopped"
            value={detail.stoppedAt ? formatDateTime(detail.stoppedAt) : "—"}
          />
          <StatCard label="Duration" value={formatDuration(durationMs)} />
          <StatCard
            variant="highlighted"
            label="Mode"
            value={detail.mode}
            sub="Execution mode"
          />
        </section>

        {nodeError && (
          <Card className="border-[#FDE2E2] bg-[#FFF5F5]">
            <CardHeader title="Error" />
            <p className="font-mono text-sm text-[#D93636]">{nodeError}</p>
          </Card>
        )}

        <Card>
          <CardHeader title="Standup summary" description="Gemini output from this run" />
          {parsed.summary ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {parsed.summary}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              No standup text was stored for this execution.
            </p>
          )}
          {(parsed.workflowName ||
            parsed.finishedAt ||
            parsed.slackChannel ||
            parsed.gmailTo ||
            parsed.providers) && (
            <dl className="mt-6 grid gap-3 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
              {parsed.workflowName && (
                <>
                  <dt className="font-semibold text-gray-500">Workflow</dt>
                  <dd className="text-gray-900">{parsed.workflowName}</dd>
                </>
              )}
              {parsed.finishedAt && (
                <>
                  <dt className="font-semibold text-gray-500">Finished at</dt>
                  <dd className="text-gray-900">{formatDateTime(parsed.finishedAt)}</dd>
                </>
              )}
              {parsed.slackChannel && (
                <>
                  <dt className="font-semibold text-gray-500">Slack channel</dt>
                  <dd className="text-gray-900">{parsed.slackChannel}</dd>
                </>
              )}
              {parsed.gmailTo && (
                <>
                  <dt className="font-semibold text-gray-500">Gmail to</dt>
                  <dd className="text-gray-900">{parsed.gmailTo}</dd>
                </>
              )}
              {parsed.providers && (
                <>
                  <dt className="font-semibold text-gray-500">Providers</dt>
                  <dd className="font-mono text-xs text-gray-900">{parsed.providers}</dd>
                </>
              )}
            </dl>
          )}
        </Card>

        {nodes.length > 0 && (
          <Card>
            <CardHeader title="Nodes executed" description="Pipeline steps for this run" />
            <ul className="flex flex-wrap gap-2">
              {nodes.map((node, index) => (
                <li
                  key={node}
                  className="inline-flex items-center gap-2 rounded-full bg-accent-light px-3 py-1.5 text-xs font-semibold text-accent-dark"
                >
                  <GradientIconBadge
                    gradient={gradientForKey(node + index)}
                    size="sm"
                  />
                  {node}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load execution";
    if (message.includes("404")) {
      notFound();
    }
    error = message;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackLink />
      <ErrorBanner message={error ?? "Unknown error"} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/executions"
      className="text-sm font-semibold text-accent hover:text-accent-dark"
    >
      ← Back to executions
    </Link>
  );
}
