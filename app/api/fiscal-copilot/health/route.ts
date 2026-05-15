import { NextResponse } from "next/server";
import { checkExpertHealth } from "@/lib/fiscal-copilot/ai-expert";
import { sagaCorpusStats } from "@/lib/fiscal-copilot/corpus/saga-manual";
import { forumInsightsStats } from "@/lib/fiscal-copilot/corpus/forum-insights";
import { codFiscalStats } from "@/lib/fiscal-copilot/corpus/cod-fiscal";

export const dynamic = "force-dynamic";

export async function GET() {
  const [health, saga, forum, codFiscal] = await Promise.all([
    checkExpertHealth(),
    sagaCorpusStats().catch(() => ({ count: 0, totalChars: 0, topTopics: [] })),
    forumInsightsStats().catch(() => ({ count: 0, totalChars: 0, topTags: [] })),
    codFiscalStats().catch(() => ({ count: 0, totalChars: 0, topTags: [] })),
  ]);
  return NextResponse.json({
    ok: health.ok,
    reason: health.reason,
    corpus: {
      seed: health.corpus,
      codFiscal: codFiscal.count,
      sagaManual: saga.count,
      forumInsights: forum.count,
      totalEntries: health.corpus + codFiscal.count + saga.count + forum.count,
      codFiscalCharsKB: Math.round(codFiscal.totalChars / 1024),
      sagaCharsKB: Math.round(saga.totalChars / 1024),
      forumCharsKB: Math.round(forum.totalChars / 1024),
      topCodFiscalTags: codFiscal.topTags,
      topForumTags: forum.topTags,
    },
    model: process.env.FISCAL_COPILOT_MODEL || "gemma4:e2b",
    ollama_url: process.env.OLLAMA_URL || "http://localhost:11434",
    timestamp: new Date().toISOString(),
  });
}
