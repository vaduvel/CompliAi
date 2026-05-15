/**
 * FiscCopilot — Memory Consolidation
 *
 * Port din SUNDAY canon §9.5: consolidation rule.
 *
 * Episodes recurente → derivă Semantic facts (pattern recognition).
 *
 * Exemple consolidări:
 *  - Client X are alert_fired pentru "d205-deadline" cu severity=urgent în 2024 + 2025
 *    → fact: (X, uitates_recurent, D205) cu confidence 0.85
 *
 *  - Client Y depune SAF-T cu 5+ zile întârziere în 4+ luni
 *    → fact: (Y, depune_tarziu, D406) cu confidence 0.75
 *
 *  - Cabinet întreabă "diurna în 2 locuri" de 10+ ori
 *    → fact: (cabinet, are_frecvent_intrebare, diurna_D112) cu confidence 0.9
 *    → could trigger UI hint sau auto-procedure
 *
 * Rulează idemphotent: re-rulează ok, va reîntări faptele existente.
 *
 * Recomandat să ruleze:
 *  - Manual button în UI ("Consolidează memorie")
 *  - Daily cron (post-briefing)
 */

import { countEpisodes, queryEpisodes } from "./episodic";
import { upsertFact } from "./semantic";
import type { EpisodeRecord, FactRecord } from "./types";

export interface ConsolidationReport {
  orgId: string;
  factsCreated: number;
  factsReinforced: number;
  episodesAnalyzed: number;
  durationMs: number;
}

/**
 * Rulează consolidarea pentru un org.
 */
export async function consolidate(orgId: string): Promise<ConsolidationReport> {
  const start = Date.now();
  const report: ConsolidationReport = {
    orgId,
    factsCreated: 0,
    factsReinforced: 0,
    episodesAnalyzed: 0,
    durationMs: 0,
  };

  // ── Rule 1: Client cu N+ alerts urgent/high pe același pathId → "uitates_recurent" ─
  const alertEps = await queryEpisodes(orgId, { kinds: ["alert_fired"] });
  report.episodesAnalyzed += alertEps.length;

  // Group by clientId + pathId
  const groupKey = (e: EpisodeRecord): string | null => {
    if (!e.clientId) return null;
    const pathId = e.payload.pathId as string | undefined;
    const sev = e.payload.severity as string | undefined;
    if (!pathId) return null;
    if (sev !== "urgent" && sev !== "high") return null;
    return `${e.clientId}::${pathId}`;
  };

  const groups = new Map<string, EpisodeRecord[]>();
  for (const ep of alertEps) {
    const k = groupKey(ep);
    if (!k) continue;
    const arr = groups.get(k) ?? [];
    arr.push(ep);
    groups.set(k, arr);
  }

  for (const [key, eps] of groups.entries()) {
    if (eps.length < 2) continue;
    const [clientId, pathId] = key.split("::");
    const objectMap: Record<string, string> = {
      "d205-deadline": "D205",
      "diurna-d112": "diurnă_în_D112",
      "casa-marcat-prag": "casa_de_marcat",
      "micro-prag": "prag_microîntreprindere",
      "saft-deadline": "D406_SAF-T",
    };
    const obj = objectMap[pathId] ?? pathId;
    // Confidence cu N apariții: 1 = 0.5, 2 = 0.7, 3 = 0.85, 4+ = 0.95
    const conf = Math.min(0.95, 0.5 + (eps.length - 1) * 0.15);

    const existed = await upsertFact({
      orgId,
      subject: clientId,
      predicate: "are_problemă_recurentă_cu",
      object: obj,
      confidence: conf,
      sourceEpisodeIds: eps.map((e) => e.id),
      decayDays: 365, // probleme fiscale păstrate 1 an
    });

    if (existed.sourceEpisodeIds.length === eps.length) {
      report.factsCreated += 1;
    } else {
      report.factsReinforced += 1;
    }
  }

  // ── Rule 2: AI queries — întrebări frecvente → "întreabă_des" ─
  const queryEps = await queryEpisodes(orgId, { kinds: ["ai_query"] });
  report.episodesAnalyzed += queryEps.length;

  // Group by topic (simple: count occurrences of declaration codes în queries)
  const topicCounts = new Map<string, EpisodeRecord[]>();
  for (const ep of queryEps) {
    const q = (ep.payload.question as string | undefined) ?? "";
    const codeMatches = q.toUpperCase().match(/\bD\d{3}\b|\bSAF[- ]?T\b|\bE[- ]?FACTURA\b|\bDIURN[AĂ]\b|\bDIVIDEND/g);
    if (!codeMatches) continue;
    for (const topic of new Set(codeMatches)) {
      const arr = topicCounts.get(topic) ?? [];
      arr.push(ep);
      topicCounts.set(topic, arr);
    }
  }

  for (const [topic, eps] of topicCounts.entries()) {
    if (eps.length < 3) continue;
    const conf = Math.min(0.9, 0.4 + (eps.length - 2) * 0.1);
    await upsertFact({
      orgId,
      subject: "cabinet",
      predicate: "întreabă_des_despre",
      object: topic,
      confidence: conf,
      sourceEpisodeIds: eps.slice(-10).map((e) => e.id),
      decayDays: 90, // întrebări vechi de 3+ luni decadează rapid
    });
    report.factsReinforced += 1;
  }

  report.durationMs = Date.now() - start;
  return report;
}
