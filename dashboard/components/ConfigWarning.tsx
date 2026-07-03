import { Card } from "@/components/ui/Card";

export function ConfigWarning() {
  return (
    <Card className="border-[#FDF0D5] bg-[#FFFBF2]">
      <p className="font-semibold text-[#B8860B]">n8n API not configured</p>
      <p className="mt-2 text-sm text-gray-600">
        Copy <code className="rounded bg-white px-1 font-mono text-xs">.env.local.example</code> to{" "}
        <code className="rounded bg-white px-1 font-mono text-xs">.env.local</code> and set{" "}
        <code className="rounded bg-white px-1 font-mono text-xs">N8N_API_KEY</code>.
      </p>
    </Card>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border-[#FDE2E2] bg-[#FFF5F5]">
      <p className="font-semibold text-[#D93636]">Could not reach n8n</p>
      <p className="mt-2 font-mono text-xs text-[#D93636]/80">{message}</p>
    </Card>
  );
}
