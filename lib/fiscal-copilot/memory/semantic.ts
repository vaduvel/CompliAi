/**
 * FiscCopilot — Semantic Memory
 *
 * Facts (subject/predicate/object) cu confidence + linear decay.
 * Port din SUNDAY/semantic.py canon §9.3.
 *
 * Used by:
 *  - AI Expert (când răspunde despre clientul X, retrieve facts despre X)
 *  - Match Path Engine (escaladare proactivă bazată pe pattern: "Marcel uitates D205")
 *  - Daily Briefing (highlight clienții cu pattern-uri de risc)
 *
 * Source episodes — fiecare fapt are trace-back la episode IDs care l-au creat.
 * Asta permite EXPLAINABILITY: "De ce zici că Marcel uită D205?" → "Pentru că în 2024, 2025
 * și 2026 am detectat alert_fired pentru d205-deadline cu severity=urgent."
 */

import { randomUUID } from "node:crypto";
import { readMemory, writeMemory } from "./store";
import {
  effectiveConfidence,
  type FactRecord,
} from "./types";

export interface UpsertFactInput {
  orgId: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceEpisodeIds?: string[];
  decayDays?: number;
}

/**
 * Upsert fact: dacă există triplu (subject, predicate, object), se reîntărește.
 * Altfel se creează nou.
 *
 * Reîntărire = update confidence cu max() din existing și new + merge source episodes.
 * Lastreinforced = now (reset decay clock).
 */
export async function upsertFact(input: UpsertFactInput): Promise<FactRecord> {
  let result!: FactRecord;
  await writeMemory(input.orgId, (snap) => {
    const now = Date.now() / 1000;
    const existing = snap.facts.find(
      (f) =>
        f.subject === input.subject &&
        f.predicate === input.predicate &&
        f.object === input.object
    );

    if (existing) {
      const newSources = Array.from(
        new Set([...existing.sourceEpisodeIds, ...(input.sourceEpisodeIds ?? [])])
      );
      existing.confidence = Math.max(
        existing.confidence,
        Math.max(0, Math.min(1, input.confidence))
      );
      existing.sourceEpisodeIds = newSources;
      existing.lastReinforcedAt = now;
      if (input.decayDays !== undefined) existing.decayDays = input.decayDays;
      result = existing;
    } else {
      const rec: FactRecord = {
        id: `fact_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        orgId: input.orgId,
        subject: input.subject,
        predicate: input.predicate,
        object: input.object,
        confidence: Math.max(0, Math.min(1, input.confidence)),
        sourceEpisodeIds: input.sourceEpisodeIds ?? [],
        createdAt: now,
        lastReinforcedAt: now,
        decayDays: input.decayDays ?? 180,
      };
      snap.facts.push(rec);
      result = rec;
    }
  });
  return result;
}

/**
 * Caută facts after filter; returnează ordonat după effective confidence desc.
 */
export async function queryFacts(
  orgId: string,
  filter: {
    subject?: string;
    predicate?: string;
    object?: string;
    minEffectiveConfidence?: number;
  } = {}
): Promise<FactRecord[]> {
  const mem = await readMemory(orgId);
  const now = Date.now() / 1000;
  let facts = mem.facts.slice();

  if (filter.subject) facts = facts.filter((f) => f.subject === filter.subject);
  if (filter.predicate) facts = facts.filter((f) => f.predicate === filter.predicate);
  if (filter.object) facts = facts.filter((f) => f.object === filter.object);

  facts = facts
    .map((f) => ({ fact: f, eff: effectiveConfidence(f, now) }))
    .filter((x) => x.eff >= (filter.minEffectiveConfidence ?? 0))
    .sort((a, b) => b.eff - a.eff)
    .map((x) => x.fact);

  return facts;
}

/**
 * Helper: returnează toate facts despre un client (subject = clientId).
 * Folosit pentru a injecta context în AI prompt.
 */
export async function clientFacts(
  orgId: string,
  clientId: string,
  minConfidence = 0.4
): Promise<FactRecord[]> {
  return queryFacts(orgId, {
    subject: clientId,
    minEffectiveConfidence: minConfidence,
  });
}

/**
 * Pretty-print fact pentru injecție în LLM prompt.
 */
export function factToText(fact: FactRecord, now: number = Date.now() / 1000): string {
  const eff = effectiveConfidence(fact, now);
  return `${fact.subject} ${fact.predicate} ${fact.object} (confidence: ${(eff * 100).toFixed(0)}%)`;
}

/**
 * Pretty-print listă facts pentru context AI.
 */
export function factsAsContext(facts: FactRecord[]): string {
  if (facts.length === 0) return "(niciun fapt cunoscut)";
  return facts
    .slice(0, 10) // top 10
    .map((f, i) => `${i + 1}. ${factToText(f)}`)
    .join("\n");
}

/**
 * Șterge fapte cu effective confidence = 0 (decay complet).
 * Util pentru cron de cleanup.
 */
export async function pruneDecayedFacts(orgId: string): Promise<number> {
  let pruned = 0;
  await writeMemory(orgId, (snap) => {
    const now = Date.now() / 1000;
    const before = snap.facts.length;
    snap.facts = snap.facts.filter((f) => effectiveConfidence(f, now) > 0);
    pruned = before - snap.facts.length;
  });
  return pruned;
}
