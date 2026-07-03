import type { GradientName } from "@/lib/gradients";

const gradientClass: Record<GradientName, string> = {
  blue: "gradient-blue",
  teal: "gradient-teal",
  orange: "gradient-orange",
  purple: "gradient-purple",
  pink: "gradient-pink",
};

export function GradientIconBadge({
  gradient,
  icon,
  size = "md",
}: {
  gradient: GradientName;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-[10px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-white shadow-sm ${sizeClass} ${gradientClass[gradient]}`}
    >
      {icon ?? (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )}
    </span>
  );
}
