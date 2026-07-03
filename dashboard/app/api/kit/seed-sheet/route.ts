import { NextResponse } from "next/server";
import { isN8nConfigured, seedSheetData } from "@/lib/n8n-client";

export async function POST() {
  if (!isN8nConfigured()) {
    return NextResponse.json(
      { error: "N8N_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const result = await seedSheetData();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
