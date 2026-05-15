import { NextResponse } from "next/server";
import { checkExpertHealth } from "@/lib/fiscal-copilot/ai-expert";
import { sagaCorpusStats } from "@/lib/fiscal-copilot/corpus/saga-manual";
import { forumInsightsStats } from "@/lib/fiscal-copilot/corpus/forum-insights";
import { codFiscalStats } from "@/lib/fiscal-copilot/corpus/cod-fiscal";
import { portalQuestionsStats } from "@/lib/fiscal-copilot/corpus/portal-questions";
import { LEGI_CONEXE_CORPUS } from "@/lib/fiscal-copilot/corpus/legi-conexe";

export const dynamic = "force-dynamic";

export async function GET() {
  const [health, saga, forum, codFiscal, portal] = await Promise.all([
    checkExpertHealth(),
    sagaCorpusStats().catch(() => ({ count: 0, totalChars: 0, topTopics: [] })),
    forumInsightsStats().catch(() => ({ count: 0, totalChars: 0, topTags: [] })),
    codFiscalStats().catch(() => ({ count: 0, totalChars: 0, topTags: [] })),
    portalQuestionsStats().catch(() => ({
      count: 0,
      totalChars: 0,
      topTags: [],
      topSocietyTypes: [],
    })),
  ]);
  return NextResponse.json({
    ok: health.ok,
    reason: health.reason,
    corpus: {
      seed: health.corpus,
      codFiscal: codFiscal.count,
      legiConexe: LEGI_CONEXE_CORPUS.length,
      portalQuestions: portal.count,
      sagaManual: saga.count,
      forumInsights: forum.count,
      totalEntries:
        health.corpus + codFiscal.count + LEGI_CONEXE_CORPUS.length + portal.count + saga.count + forum.count,
      codFiscalCharsKB: Math.round(codFiscal.totalChars / 1024),
      portalCharsKB: Math.round(portal.totalChars / 1024),
      sagaCharsKB: Math.round(saga.totalChars / 1024),
      forumCharsKB: Math.round(forum.totalChars / 1024),
      topCodFiscalTags: codFiscal.topTags,
      topPortalTags: portal.topTags,
      topPortalSocietyTypes: portal.topSocietyTypes,
    },
    model: process.env.FISCAL_COPILOT_MODEL || "gemma4:e2b",
    ollama_url: process.env.OLLAMA_URL || "http://localhost:11434",
    timestamp: new Date().toISOString(),
  });
}
