export type StatusPillColor = "success" | "error" | "pending" | "info";

const styles: Record<StatusPillColor, string> = {
  success: "bg-[#DCF5E8] text-[#0E7C5C]",
  error: "bg-[#FDE2E2] text-[#D93636]",
  pending: "bg-[#FDF0D5] text-[#B8860B]",
  info: "bg-[#DCE9FD] text-[#1D5FD9]",
};

export function StatusPill({
  label,
  color = "info",
}: {
  label: string;
  color?: StatusPillColor;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[color]}`}
    >
      {label}
    </span>
  );
}
