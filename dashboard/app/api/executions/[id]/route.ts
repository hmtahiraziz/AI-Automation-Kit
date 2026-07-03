import { NextResponse } from "next/server";
import { getExecutionDetailRow, isN8nConfigured } from "@/lib/n8n-client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isN8nConfigured()) {
    return NextResponse.json(
      { error: "N8N_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  try {
    const detail = await getExecutionDetailRow(id);
    if (!detail) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }
    return NextResponse.json({ data: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
