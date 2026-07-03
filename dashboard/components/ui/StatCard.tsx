export function StatCard({
  label,
  value,
  sub,
  variant = "default",
  icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  variant?: "default" | "highlighted";
  icon?: React.ReactNode;
  trend?: string;
}) {
  if (variant === "highlighted") {
    return (
      <div className="rounded-card bg-[#0E7C5C] p-5 text-white shadow-card md:p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">
          {label}
        </p>
        <p className="mt-3 text-[32px] font-bold leading-none tracking-tight">
          {value}
        </p>
        {trend && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0B6B4F] px-3 py-1 text-[11px] font-semibold text-white/90">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {trend}
          </span>
        )}
        {sub && !trend && <div className="mt-3 text-xs text-white/80">{sub}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-black/[0.04] bg-white p-5 shadow-card md:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </p>
        {icon ?? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-[#FAFAF9] text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </span>
        )}
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-gray-900">
        {value}
      </p>
      {sub && <div className="mt-3 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
