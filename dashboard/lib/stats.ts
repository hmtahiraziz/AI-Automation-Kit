import type { ExecutionRow } from "@/lib/types";

const FAILURE_STATUSES = new Set(["error", "crashed", "canceled"]);

export type ExecutionStats = {
  total: number;
  success: number;
  failed: number;
  running: number;
  successRate: number | null;
  failRate: number | null;
};

export function computeExecutionStats(rows: ExecutionRow[]): ExecutionStats {
  const total = rows.length;
  const success = rows.filter((row) => row.status === "success").length;
  const failed = rows.filter((row) => FAILURE_STATUSES.has(row.status)).length;
  const running = rows.filter(
    (row) => row.status === "running" || row.status === "waiting",
  ).length;

  return {
    total,
    success,
    failed,
    running,
    successRate: total > 0 ? Math.round((success / total) * 100) : null,
    failRate: total > 0 ? Math.round((failed / total) * 100) : null,
  };
}
