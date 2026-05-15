/**
 * FiscCopilot — Memory Types
 *
 * Port în TS al arhitecturii de memorie din SUNDAY (canon §9):
 *   9.1 Working   = current Field state (out of scope here — handled by app state)
 *   9.2 Episodic  = append-only log of (event, outcome, context)
 *   9.3 Semantic  = facts (subject/predicate/object) with confidence + decay
 *   9.4 Procedural = action sequences with success stats
 *
 * Adaptat pentru contextul nostru:
 *  - Per-org isolation (orgId scope)
 *  - JSON persistence (no native SQLite dep — upgrade path la better-sqlite3 sau Supabase)
 *  - Sync-friendly API (no asyncio needed în Node.js)
 */

// ============================================================================
// EPISODIC — append-only log of what happened
// ============================================================================

export type EpisodeKind =
  | "ai_query"           // contabilul a întrebat AI-ul
  | "alert_fired"        // un match path a generat alertă
  | "alert_dismissed"    // contabilul a marcat alerta ca rezolvată
  | "client_created"     // adăugare client nou
  | "client_updated"     // editare profil client
  | "event_logged"       // înregistrare diurnă/dividend/etc.
  | "declaration_filed"  // declarație depusă (manual log)
  | "decision_made"      // decizie luată de contabil (cu rationale)
  | "anaf_notification"; // notificare primită de la ANAF

export interface EpisodeRecord {
  id: string;
  orgId: string;          // isolation per cabinet
  clientId?: string;      // dacă e legat de un client anume
  kind: EpisodeKind;
  /** Timestamp Unix în secunde */
  timestamp: number;
  /** Payload structurat — vary by kind */
  payload: Record<string, unknown>;
  /** Outcome — success | error | pending | ignored */
  outcome: "success" | "error" | "pending" | "ignored" | "info";
  /** Optional human note */
  note?: string;
  /** Optional snapshot al unei stări (e.g., portfolio counts at the time) */
  contextSnapshot?: Record<string, unknown>;
}

// ============================================================================
// SEMANTIC — facts about clients (subject/predicate/object + decay)
// ============================================================================

export interface FactRecord {
  id: string;
  orgId: string;
  /** Cui se referă faptul (de obicei un clientId, dar poate fi și un CUI sau o categorie) */
  subject: string;
  /** Tipul de relație (e.g., "uitate_recurent", "preferă_email", "are_problemă_cu") */
  predicate: string;
  /** Valoarea relației (e.g., "D205", "săptămâna trecută", "diurnă") */
  object: string;
  /** Probabilitatea/încrederea în acest fapt (0-1) */
  confidence: number;
  /** Episodes din care derivă acest fapt — trace-back pentru explainability */
  sourceEpisodeIds: string[];
  /** Timestamp Unix creare */
  createdAt: number;
  /** Timestamp ultimă reîntărire (când a fost confirmat din nou) */
  lastReinforcedAt: number;
  /** Numărul de zile peste care faptul decade (default 180) */
  decayDays: number;
}

/**
 * Calculează confidence efectiv ținând cont de decay liniar.
 * Port din SUNDAY: FactRecord.effective_confidence
 */
export function effectiveConfidence(fact: FactRecord, now: number = Date.now() / 1000): number {
  const ageDays = Math.max(0, (now - fact.lastReinforcedAt) / 86400);
  if (ageDays <= fact.decayDays) return fact.confidence;
  if (ageDays >= 2 * fact.decayDays) return 0;
  const remaining = (2 * fact.decayDays - ageDays) / fact.decayDays;
  return Math.max(0, fact.confidence * remaining);
}

// ============================================================================
// PROCEDURAL — action sequences with success stats
// ============================================================================

export interface ProcedureRecord {
  id: string;
  orgId: string;
  /** Numele procedurii (e.g., "distribuire_dividende", "depunere_D205") */
  name: string;
  /** Lista de pași (acțiuni) */
  steps: Array<{
    action: string;
    description?: string;
    /** Ce input cere pasul (e.g., "aga_aprobată", "stat_dividende_completat") */
    requires?: string[];
    /** Ce produce pasul (e.g., "OP_virat", "recipisă_D205") */
    produces?: string[];
  }>;
  /** Cât de des s-a executat această procedură */
  invocations: number;
  /** Câte au fost cu succes (s-a depus, fără erori) */
  successes: number;
  /** Timestamp Unix prima execuție și ultima */
  firstSeenAt: number;
  lastUsedAt: number;
  /** Tag-uri pentru search (e.g., ["dividende", "SRL", "D205"]) */
  tags: string[];
}

export function successRate(p: ProcedureRecord): number {
  if (p.invocations === 0) return 0;
  return p.successes / p.invocations;
}

// ============================================================================
// MEMORY SNAPSHOT — toate cele 3 layere pentru un org
// ============================================================================

export interface MemorySnapshot {
  orgId: string;
  schemaVersion: 1;
  episodes: EpisodeRecord[];
  facts: FactRecord[];
  procedures: ProcedureRecord[];
  /** Stats pentru telemetry */
  stats: {
    totalEpisodes: number;
    totalFacts: number;
    totalProcedures: number;
    lastWriteAt: number;
  };
}

export function newMemorySnapshot(orgId: string): MemorySnapshot {
  return {
    orgId,
    schemaVersion: 1,
    episodes: [],
    facts: [],
    procedures: [],
    stats: {
      totalEpisodes: 0,
      totalFacts: 0,
      totalProcedures: 0,
      lastWriteAt: 0,
    },
  };
}
