import type { ExecutionStatus } from "@/lib/types";

export type StatusPillColor = "success" | "error" | "pending" | "info";

export function executionStatusToPill(status: ExecutionStatus): StatusPillColor {
  switch (status) {
    case "success":
      return "success";
    case "error":
    case "crashed":
      return "error";
    case "running":
    case "waiting":
      return "pending";
    default:
      return "info";
  }
}

export function executionStatusLabel(status: ExecutionStatus): string {
  switch (status) {
    case "success":
      return "Completed";
    case "error":
      return "Failed";
    case "crashed":
      return "Crashed";
    case "running":
      return "Running";
    case "waiting":
      return "Waiting";
    case "canceled":
      return "Canceled";
    case "new":
      return "New";
    default:
      return "Unknown";
  }
}
