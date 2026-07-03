import Link from "next/link";

export function GeminiPromoCard() {
  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-[20px] bg-gradient-to-br from-[#042F2C] via-[#065A42] to-[#0E7C5C] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.06)]">
      <h3 className="text-[22px] font-bold leading-tight text-white">
        Automate with Gemini
      </h3>
      <p className="mt-4 flex-1 text-sm leading-[1.65] text-white/90">
        Leverage AI to categorize emails, summarize meetings, and generate
        dynamic Slack reports automatically.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-5">
        <Link
          href="/settings"
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#0E7C5C] transition hover:bg-[#E4F3EC]"
        >
          Start Building
        </Link>
        <Link
          href="/workflows"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-white transition hover:text-white/80"
        >
          View templates
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
