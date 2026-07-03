import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { parseStandupSections } from "@/lib/parse-standup";

const sections = [
  { key: "project" as const, label: "Primary focus" },
  { key: "issues" as const, label: "Risk assessment" },
  { key: "left" as const, label: "Next milestones" },
  { key: "achieved" as const, label: "Operational health" },
];

export function StandupSummaryCard({ summary }: { summary: string }) {
  const parsed = parseStandupSections(summary);

  return (
    <Card className="h-full">
      <CardHeader
        title="Latest standup summary"
        description="From the most recent successful run."
        action={<StatusPill label="GeminiPro AI" color="info" />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.key} className="rounded-2xl bg-[#FAFAF9] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {section.label}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {parsed[section.key] ?? summary.slice(0, 120)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
