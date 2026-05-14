/**
 * FiscCopilot — Match Path Engine — types
 *
 * Un Match Path este o REGULĂ FISCALĂ care:
 * 1. Detectează un trigger pe baza datelor unui client (profile + ledger + events)
 * 2. Calculează severitatea (low/medium/high/urgent)
 * 3. Generează o acțiune sugerată cu pași explicați
 * 4. Citează sursa legală
 *
 * Match Paths sunt deterministice (NU folosesc LLM) — sunt pure functions.
 * LLM-ul intervine doar pentru a EXPLICA conversațional un Match Path detectat.
 */

export type ClientType = "PFA" | "II" | "SRL" | "SRL_MICRO" | "ONG";
export type VATRegime = "non_TVA" | "TVA_normal" | "TVA_la_incasare";

export interface ClientProfile {
  id: string;
  name: string;
  cui: string;
  type: ClientType;
  vatRegime: VATRegime;
  hasEmployees: boolean;
  registeredDate: string; // ISO
  caenCodes: string[];
  /** Cifra de afaceri în EUR estimată pe anul fiscal curent */
  estimatedAnnualRevenueEUR?: number;
  /** Particularități: e.g., are auto regie proprie, plătește dividende, vânzări cu numerar etc. */
  flags: Array<
    | "auto_regie_proprie"
    | "distribuie_dividende"
    | "vanzari_numerar"
    | "are_casa_marcat"
    | "tva_la_incasare"
    | "are_asociati_multipli"
    | "are_clienti_externi"
  >;
}

export interface FiscalEvent {
  id: string;
  clientId: string;
  type:
    | "invoice_emitted"
    | "invoice_received"
    | "bank_payment"
    | "bank_receipt"
    | "declaration_submitted"
    | "anaf_notification"
    | "diurna_recorded"
    | "dividend_distribution"
    | "saft_uploaded"
    | "deadline_approaching";
  date: string; // ISO
  amountRON?: number;
  refDoc?: string;
  meta?: Record<string, unknown>;
}

export type MatchPathSeverity = "info" | "low" | "medium" | "high" | "urgent";

export interface MatchPathAlert {
  pathId: string;
  pathName: string;
  clientId: string;
  clientName: string;
  severity: MatchPathSeverity;
  detectedAt: string; // ISO
  /** Title scurt, sub 80 chars */
  title: string;
  /** Explicație 2-4 propoziții, în română, claritate maximă */
  explanation: string;
  /** Pași concreți de urmat */
  actionSteps: string[];
  /** Surse legale citabile */
  legalSources: Array<{ label: string; ref: string }>;
  /** Câmpuri opționale pentru UI */
  estimatedImpactRON?: number;
  deadlineDate?: string;
}

export interface MatchPath {
  id: string;
  name: string;
  description: string;
  /**
   * Detect: primește profile + lista events ale clientului + date curentă.
   * Returnează alert(s) sau array gol dacă nu se aplică.
   */
  detect: (
    client: ClientProfile,
    events: FiscalEvent[],
    today: Date
  ) => MatchPathAlert[];
}
