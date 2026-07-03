import type { ExecutionStatus } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  executionStatusLabel,
  executionStatusToPill,
} from "@/lib/status-map";

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <StatusPill
      label={executionStatusLabel(status)}
      color={executionStatusToPill(status)}
    />
  );
}
