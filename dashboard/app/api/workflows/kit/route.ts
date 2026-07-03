import { NextResponse } from "next/server";
import { getKitWorkflowRows, isN8nConfigured } from "@/lib/n8n-client";

export async function GET() {
  if (!isN8nConfigured()) {
    return NextResponse.json(
      { error: "N8N_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const workflows = await getKitWorkflowRows();
    return NextResponse.json({ data: workflows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
