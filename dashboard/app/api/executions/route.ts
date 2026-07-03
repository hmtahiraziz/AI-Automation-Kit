import { NextResponse } from "next/server";
import { getExecutionRows, isN8nConfigured } from "@/lib/n8n-client";

export async function GET(request: Request) {
  if (!isN8nConfigured()) {
    return NextResponse.json(
      { error: "N8N_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") ?? undefined;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 50;

    const rows = workflowId
      ? await getExecutionRows({ workflowId, limit })
      : await getExecutionRows({ limit });

    return NextResponse.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
