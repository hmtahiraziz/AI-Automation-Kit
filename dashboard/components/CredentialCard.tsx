import type { KitCredentialRow } from "@/lib/types";
import { getCredentialConnectUrl } from "@/lib/n8n-client";
import { Card } from "@/components/ui/Card";
import { GradientIconBadge } from "@/components/ui/GradientIconBadge";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusPillColor } from "@/components/ui/StatusPill";
import { gradientForKey } from "@/lib/gradients";

export function CredentialCard({ credential }: { credential: KitCredentialRow }) {
  const connectUrl = getCredentialConnectUrl(credential.id);
  const pill = credentialPill(credential);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <GradientIconBadge gradient={gradientForKey(credential.name)} />
        <StatusPill label={pill.label} color={pill.color} />
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-lg font-bold text-gray-900">{credential.label}</h3>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {credential.type}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          {credential.authKind === "apiKey"
            ? "API key credential — managed via seed scripts and .env"
            : "OAuth credential — connect your account in n8n"}
        </p>
        <p className="mt-2 font-mono text-xs text-gray-400">{credential.name}</p>
      </div>

      <a
        href={connectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        {credential.authKind === "oauth" ? "Connect in n8n ↗" : "View in n8n ↗"}
      </a>
    </Card>
  );
}

function credentialPill(credential: KitCredentialRow): {
  label: string;
  color: StatusPillColor;
} {
  if (!credential.found) {
    return { label: "Missing", color: "pending" };
  }
  if (credential.authKind === "apiKey") {
    return { label: "Seeded", color: "success" };
  }
  return { label: "OAuth", color: "info" };
}
