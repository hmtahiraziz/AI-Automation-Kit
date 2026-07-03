"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkflowToggle({
  workflowId,
  initialActive,
  disabled = false,
}: {
  workflowId: string;
  initialActive: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const next = !active;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Toggle failed");
      }

      setActive(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={disabled || loading}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E7C5C]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          active ? "bg-[#0E7C5C]" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-[11px] font-medium text-gray-400">
        {loading ? "Updating…" : active ? "Active" : "Inactive"}
      </span>
      {error && (
        <span className="max-w-[10rem] text-right text-[11px] text-[#D93636]">
          {error}
        </span>
      )}
    </div>
  );
}
