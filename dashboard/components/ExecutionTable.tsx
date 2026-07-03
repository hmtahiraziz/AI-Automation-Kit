import Link from "next/link";
import type { ExecutionRow } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { Card } from "@/components/ui/Card";
import { formatDateTime, formatDuration, formatRelativeTime } from "@/lib/format";
import { gradientForKey } from "@/lib/gradients";
import { getWorkflowPath } from "@/lib/workflow-path";

export function ExecutionTable({
  rows,
  emptyMessage = "No executions yet.",
  showFooter = true,
}: {
  rows: ExecutionRow[];
  emptyMessage?: string;
  showFooter?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-gray-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-[#FAFAF9]">
              {["Started", "Workflow", "Status", "Duration", "Mode", ""].map(
                (header) => (
                  <th
                    key={header || "actions"}
                    className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-[#FAFAF9]/80">
                <td className="whitespace-nowrap px-5 py-4">
                  <p className="font-medium text-gray-900">
                    {formatDateTime(row.startedAt)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {formatRelativeTime(row.startedAt)}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <GradientIconBadge
                      gradient={gradientForKey(row.workflowName + row.id)}
                    />
                    <div>
                      <p className="font-bold text-gray-900">{row.workflowName}</p>
                      <p className="text-xs text-gray-400">
                        {getWorkflowPath(row.workflowName)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-gray-500">
                  {formatDuration(row.durationMs)}
                </td>
                <td className="px-5 py-4">
                  <ModeCell mode={row.mode} />
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <Link
                    href={`/executions/${row.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#FAFAF9] hover:text-gray-700"
                    aria-label="View details"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showFooter && (
        <div className="border-t border-gray-100 px-5 py-3 text-right">
          <Link
            href="/executions"
            className="text-xs font-bold text-[#0E7C5C] hover:text-[#0B6B4F]"
          >
            View all logs →
          </Link>
        </div>
      )}
    </Card>
  );
}

function ModeCell({ mode }: { mode: string }) {
  const isWebhook = mode.toLowerCase().includes("webhook");
  const isTrigger = mode.toLowerCase().includes("trigger");

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-gray-500">
      {isWebhook ? (
        <svg className="h-3.5 w-3.5 text-[#0E7C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {isWebhook ? "Webhook" : isTrigger ? "Manual" : mode}
    </span>
  );
}
