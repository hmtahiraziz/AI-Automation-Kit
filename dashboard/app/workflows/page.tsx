import { ConfigWarning, ErrorBanner } from "@/components/ConfigWarning";
import { WorkflowCard } from "@/components/WorkflowCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getKitWorkflowRows, isN8nConfigured } from "@/lib/n8n-client";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  if (!isN8nConfigured()) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Workflows"
          title="Automation controls"
          description="Enable or disable kit workflows in n8n"
        />
        <ConfigWarning />
      </div>
    );
  }

  let workflows: Awaited<ReturnType<typeof getKitWorkflowRows>> = [];
  let error: string | null = null;

  try {
    workflows = await getKitWorkflowRows();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load workflows";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader eyebrow="Workflows" title="Automation controls" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Workflows"
        title="Automation controls"
        description="Toggle workflows on or off. Active workflows run on schedule or webhook triggers in n8n."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.name} workflow={workflow} />
        ))}
      </div>
    </div>
  );
}
