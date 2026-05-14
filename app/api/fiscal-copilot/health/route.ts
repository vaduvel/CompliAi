import { NextResponse } from "next/server";
import { checkExpertHealth } from "@/lib/fiscal-copilot/ai-expert";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkExpertHealth();
  return NextResponse.json({
    ok: health.ok,
    reason: health.reason,
    corpus: health.corpus,
    model: process.env.FISCAL_COPILOT_MODEL || "gemma4:e2b",
    ollama_url: process.env.OLLAMA_URL || "http://localhost:11434",
    timestamp: new Date().toISOString(),
  });
}
