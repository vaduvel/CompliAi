/**
 * FiscCopilot — Episodic Memory
 *
 * Append-only log of (event, outcome, context).
 * Port din SUNDAY/episodic.py canon §9.2.
 *
 * Used by:
 *  - AI Expert (log fiecare query + answer pentru audit)
 *  - Match Path Engine (log fiecare alert fired)
 *  - UI Manager (log create/update client, file declaration)
 *
 * NU se șterge automat. Cron poate consolida în Semantic după N invocații.
 */

import { randomUUID } from "node:crypto";
import { readMemory, writeMemory } from "./store";
import type { EpisodeKind, EpisodeRecord } from "./types";

export interface LogEpisodeInput {
  orgId: string;
  kind: EpisodeKind;
  payload: Record<string, unknown>;
  outcome?: EpisodeRecord["outcome"];
  clientId?: string;
  note?: string;
  contextSnapshot?: Record<string, unknown>;
}

/**
 * Înregistrează un episode nou. Returnează ID-ul generat.
 */
export async function logEpisode(input: LogEpisodeInput): Promise<EpisodeRecord> {
  const record: EpisodeRecord = {
    id: `ep_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    orgId: input.orgId,
    clientId: input.clientId,
    kind: input.kind,
    timestamp: Date.now() / 1000,
    payload: input.payload,
    outcome: input.outcome ?? "info",
    note: input.note,
    contextSnapshot: input.contextSnapshot,
  };

  await writeMemory(input.orgId, (snap) => {
    snap.episodes.push(record);
    // Capping: keep last 5000 episodes (older se consolidează în semantic)
    if (snap.episodes.length > 5000) {
      snap.episodes = snap.episodes.slice(-5000);
    }
  });

  return record;
}

/**
 * Filtrează episodes cu predicate.
 */
export async function queryEpisodes(
  orgId: string,
  filter: {
    clientId?: string;
    kinds?: EpisodeKind[];
    since?: number; // unix seconds
    until?: number;
    outcomes?: EpisodeRecord["outcome"][];
    limit?: number;
  } = {}
): Promise<EpisodeRecord[]> {
  const mem = await readMemory(orgId);
  let eps = mem.episodes;

  if (filter.clientId) {
    eps = eps.filter((e) => e.clientId === filter.clientId);
  }
  if (filter.kinds && filter.kinds.length > 0) {
    const set = new Set(filter.kinds);
    eps = eps.filter((e) => set.has(e.kind));
  }
  if (filter.since !== undefined) {
    const since = filter.since;
    eps = eps.filter((e) => e.timestamp >= since);
  }
  if (filter.until !== undefined) {
    const until = filter.until;
    eps = eps.filter((e) => e.timestamp <= until);
  }
  if (filter.outcomes && filter.outcomes.length > 0) {
    const set = new Set(filter.outcomes);
    eps = eps.filter((e) => set.has(e.outcome));
  }

  eps = eps.slice().sort((a, b) => b.timestamp - a.timestamp);

  if (filter.limit !== undefined) {
    eps = eps.slice(0, filter.limit);
  }

  return eps;
}

/**
 * Count distincte de episodes by (kind, clientId) — util pentru emergence de facts.
 * Ex: dacă un client are >= 3 episodes de "alert_fired" cu payload.pathId="d205-deadline"
 *     în ultimii 365 zile, putem deriva semantic fact "client X uitates D205 recurent".
 */
export async function countEpisodes(
  orgId: string,
  filter: {
    clientId?: string;
    kind?: EpisodeKind;
    payloadMatch?: (payload: Record<string, unknown>) => boolean;
    sinceDays?: number;
  } = {}
): Promise<number> {
  const since = filter.sinceDays
    ? Date.now() / 1000 - filter.sinceDays * 86400
    : undefined;
  const eps = await queryEpisodes(orgId, {
    clientId: filter.clientId,
    kinds: filter.kind ? [filter.kind] : undefined,
    since,
  });
  if (filter.payloadMatch) {
    return eps.filter((e) => filter.payloadMatch!(e.payload)).length;
  }
  return eps.length;
}

/**
 * Returnează ultimele N episodes pentru un client (useful pentru context AI).
 */
export async function recentClientHistory(
  orgId: string,
  clientId: string,
  limit = 20
): Promise<EpisodeRecord[]> {
  return queryEpisodes(orgId, { clientId, limit });
}
