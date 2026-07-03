import { WorkflowToggle } from "@/components/WorkflowToggle";
import { Card } from "@/components/ui/Card";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import type { KitWorkflowRow } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { gradientForKey } from "@/lib/gradients";
import { kitConfig } from "@/kit.config";

export function WorkflowCard({ workflow }: { workflow: KitWorkflowRow }) {
  const isPrimary = workflow.name === kitConfig.primaryWorkflow;

  return (
    <Card
      className={
        !workflow.found
          ? "border-dashed border-gray-300 bg-[#FAFAF9]"
          : isPrimary
            ? "ring-1 ring-accent/15"
            : ""
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <GradientIconBadge gradient={gradientForKey(workflow.name)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-900">{workflow.label}</h3>
              {isPrimary && (
                <StatusPill label="Primary" color="info" />
              )}
              {!workflow.found && (
                <StatusPill label="Not imported" color="pending" />
              )}
            </div>
            <p className="mt-1 font-mono text-xs text-gray-400">{workflow.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              {workflow.description}
            </p>
            {workflow.updatedAt && (
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Updated {formatDateTime(workflow.updatedAt)}
              </p>
            )}
          </div>
        </div>

        {workflow.found && workflow.id ? (
          <WorkflowToggle
            workflowId={workflow.id}
            initialActive={workflow.active}
          />
        ) : null}
      </div>

      {!workflow.found && (
        <div className="mt-4 rounded-xl bg-gray-900 px-4 py-3 font-mono text-xs text-gray-300">
          .\n8n\scripts\import-workflows.ps1
        </div>
      )}
    </Card>
  );
}
