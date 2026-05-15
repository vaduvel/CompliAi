import { NextResponse } from "next/server";
import { checkExpertHealth } from "@/lib/fiscal-copilot/ai-expert";
import { sagaCorpusStats } from "@/lib/fiscal-copilot/corpus/saga-manual";
import { forumInsightsStats } from "@/lib/fiscal-copilot/corpus/forum-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const [health, saga, forum] = await Promise.all([
    checkExpertHealth(),
    sagaCorpusStats().catch(() => ({ count: 0, totalChars: 0, topTopics: [] })),
    forumInsightsStats().catch(() => ({ count: 0, totalChars: 0, topTags: [] })),
  ]);
  return NextResponse.json({
    ok: health.ok,
    reason: health.reason,
    corpus: {
      seed: health.corpus,
      sagaManual: saga.count,
      forumInsights: forum.count,
      totalEntries: health.corpus + saga.count + forum.count,
      sagaCharsKB: Math.round(saga.totalChars / 1024),
      forumCharsKB: Math.round(forum.totalChars / 1024),
      topForumTags: forum.topTags,
    },
    model: process.env.FISCAL_COPILOT_MODEL || "gemma4:e2b",
    ollama_url: process.env.OLLAMA_URL || "http://localhost:11434",
    timestamp: new Date().toISOString(),
  });
}
