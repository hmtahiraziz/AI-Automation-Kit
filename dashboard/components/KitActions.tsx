"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionState = "idle" | "loading" | "success" | "error";

export function KitActions({
  primaryFound,
  seedFound,
  layout = "cards",
}: {
  primaryFound: boolean;
  seedFound: boolean;
  layout?: "cards" | "inline";
}) {
  const router = useRouter();
  const [runState, setRunState] = useState<ActionState>("idle");
  const [seedState, setSeedState] = useState<ActionState>("idle");
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  async function handleRun() {
    setRunState("loading");
    setRunMessage(null);
    try {
      const response = await fetch("/api/kit/run", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Run failed");
      setRunState("success");
      setRunMessage(payload.message ?? "Standup pipeline completed");
      router.refresh();
    } catch (error) {
      setRunState("error");
      setRunMessage(error instanceof Error ? error.message : "Run failed");
    }
  }

  async function handleSeed() {
    setSeedState("loading");
    setSeedMessage(null);
    try {
      const response = await fetch("/api/kit/seed-sheet", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Seed failed");
      setSeedState("success");
      setSeedMessage(payload.message ?? "Sheet seeded");
      router.refresh();
    } catch (error) {
      setSeedState("error");
      setSeedMessage(error instanceof Error ? error.message : "Seed failed");
    }
  }

  if (layout === "cards") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionTile
          title="Run standup pipeline"
          description="Read sheet → Gemini → Slack + Gmail. Takes 30–90 seconds."
          label="Run standup pipeline"
          loadingLabel="Running pipeline…"
          disabled={!primaryFound}
          state={runState}
          message={runMessage}
          onClick={handleRun}
          variant="primary"
        />
        <ActionTile
          title="Seed demo sheet data"
          description="Reset Google Sheet with Project, Achieved, Left, Issues columns."
          label="Seed demo sheet data"
          loadingLabel="Seeding sheet…"
          disabled={!seedFound}
          state={seedState}
          message={seedMessage}
          onClick={handleSeed}
          variant="secondary"
        />
        {!primaryFound || !seedFound ? (
          <p className="text-xs text-[#B8860B] lg:col-span-2">
            Import workflows in n8n to enable kit actions.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={!primaryFound || runState === "loading"}
        onClick={handleRun}
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {runState === "loading" ? "Running…" : "Run now"}
      </button>
      <button
        type="button"
        disabled={!seedFound || seedState === "loading"}
        onClick={handleSeed}
        className="rounded-xl border-2 border-accent bg-white px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent-light disabled:opacity-50"
      >
        {seedState === "loading" ? "Seeding…" : "Seed sheet"}
      </button>
    </div>
  );
}

function ActionTile({
  title,
  description,
  label,
  loadingLabel,
  disabled,
  state,
  message,
  onClick,
  variant,
}: {
  title: string;
  description: string;
  label: string;
  loadingLabel: string;
  disabled: boolean;
  state: ActionState;
  message: string | null;
  onClick: () => void;
  variant: "primary" | "secondary";
}) {
  const isLoading = state === "loading";

  return (
    <div className="rounded-card border border-gray-200 bg-[#FAFAF9] p-5">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      {message && (
        <p
          className={`mt-3 text-xs ${state === "error" ? "text-[#D93636]" : "text-accent"}`}
        >
          {message}
        </p>
      )}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`mt-5 w-full rounded-2xl px-4 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          variant === "primary"
            ? "bg-[#0E7C5C] text-white hover:bg-[#0B6B4F]"
            : "border-2 border-[#0E7C5C] bg-white text-[#0E7C5C] hover:bg-[#E4F3EC]"
        }`}
      >
        {isLoading ? loadingLabel : label}
      </button>
    </div>
  );
}
