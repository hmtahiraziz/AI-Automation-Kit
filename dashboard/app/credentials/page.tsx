import { ConfigWarning, ErrorBanner } from "@/components/ConfigWarning";
import { CredentialCard } from "@/components/CredentialCard";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getKitCredentialRows, isN8nConfigured } from "@/lib/n8n-client";

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  if (!isN8nConfigured()) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow="Credentials"
          title="Integrations"
          description="Connect integrations via n8n"
        />
        <ConfigWarning />
      </div>
    );
  }

  let credentials: Awaited<ReturnType<typeof getKitCredentialRows>> = [];
  let error: string | null = null;

  try {
    credentials = await getKitCredentialRows();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load credentials";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader eyebrow="Credentials" title="Integrations" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Credentials"
        title="Integrations"
        description={
          <>
            OAuth connections are completed in n8n. API keys are seeded from your{" "}
            <code className="rounded-full bg-accent-light px-2 py-0.5 font-mono text-xs text-accent">
              .env
            </code>{" "}
            file.
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {credentials.map((credential) => (
          <CredentialCard key={credential.name} credential={credential} />
        ))}
      </div>

      <Card className="bg-accent-light">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-gray-900">Need to rotate secrets?</p>
            <p className="mt-1 text-sm text-gray-600">
              Update root <code className="font-mono text-xs">.env</code> and re-run seed scripts.
            </p>
          </div>
          <a
            href="/settings"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Go to Settings
          </a>
        </div>
      </Card>
    </div>
  );
}
