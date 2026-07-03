export function Card({
  children,
  className = "",
  padding = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "default" | "lg";
}) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "lg"
        ? "p-6"
        : "p-5 md:p-6";

  return (
    <div
      className={`rounded-card border border-black/[0.04] bg-surface shadow-card ${paddingClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
