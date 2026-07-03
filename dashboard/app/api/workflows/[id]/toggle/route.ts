import { NextResponse } from "next/server";
import { isN8nConfigured, setWorkflowActive } from "@/lib/n8n-client";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isN8nConfigured()) {
    return NextResponse.json(
      { error: "N8N_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  let body: { active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.active !== "boolean") {
    return NextResponse.json(
      { error: "Body must include { active: boolean }" },
      { status: 400 },
    );
  }

  try {
    await setWorkflowActive(id, body.active);
    return NextResponse.json({ ok: true, active: body.active });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
