export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E7C5C]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-gray-900 md:text-[32px]">
          {title}
        </h1>
        {typeof description === "string" ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        ) : (
          description
        )}
      </div>
      {action}
    </div>
  );
}
