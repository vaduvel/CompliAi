/**
 * FiscCopilot — Client Fiscal Data Extractor
 *
 * Bridge între ClientProfile (date statice) + FiscalEvent[] (date tranzacții)
 * și VerifierData (formatul deterministic).
 *
 * Filozofie:
 *   - User-ul NU completează form-uri pentru verifier
 *   - Datele se trag AUTOMAT din portofoliu (ClientProfile + events)
 *   - Verifierul primește totul gata-fillat → rulează deterministic
 *   - Doar dacă date critice lipsesc → 1 întrebare conversațională
 *
 * Cum se folosește:
 *   const profile = await getClient(orgId, clientId);
 *   const events = await listEvents(orgId, { clientId, limit: 1000 });
 *   const data = extractFiscalData(profile, events, 2026);
 *   const results = runVerifiers(question, data);
 */

import type { ClientProfile, FiscalEvent } from "./match-paths/types";
import type { VerifierData } from "./fiscal-verifiers";

/**
 * Curs BNR aproximativ (TODO: în prod, pull dinamic din BNR API).
 * Pentru conversie lei → EUR la verificările micro 2026.
 */
const CURS_EUR_BNR_31_12_2025 = 4.965;
const CURS_EUR_BNR_CURRENT = 4.95; // estimat

/**
 * Extrage VerifierData din ClientProfile + FiscalEvent[].
 *
 * @param profile - clientul (date statice)
 * @param events - evenimente fiscale (facturi, plăți, declarații, etc.)
 * @param year - anul pentru care extragem datele (ex: 2025 pentru CA 2025)
 */
export function extractFiscalData(
  profile: ClientProfile,
  events: FiscalEvent[] = [],
  year: number = new Date().getFullYear()
): VerifierData {
  const data: VerifierData = {};

  // ── CIFRA DE AFACERI (din events sau profile estimate) ───────────────────
  // Cum calculăm CA:
  //   1. Sumă invoice_emitted pe anul țintă (cea mai exactă)
  //   2. Fallback: estimatedAnnualRevenueEUR × curs
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  const caFromEvents = events
    .filter(
      (e) =>
        e.type === "invoice_emitted" &&
        new Date(e.date).getTime() >= yearStart &&
        new Date(e.date).getTime() < yearEnd
    )
    .reduce((sum, e) => sum + (e.amountRON ?? 0), 0);

  let caYear: number | undefined;
  if (caFromEvents > 0) {
    caYear = caFromEvents;
  } else if (profile.estimatedAnnualRevenueEUR) {
    caYear = profile.estimatedAnnualRevenueEUR * CURS_EUR_BNR_31_12_2025;
  }

  if (caYear !== undefined) {
    if (year === 2025) data.cifraAfaceri2025 = caYear;
    if (year === 2026) data.cifraAfaceri2026 = caYear;
    // Pentru TVA la încasare (anul precedent)
    data.caTvaIncasarePrec = caYear;
    data.anCurent = year + 1; // dacă ne uităm la CA 2025 e pentru analiză 2026
  }

  // ── SALARIAT ─────────────────────────────────────────────────────────────
  // ClientProfile.hasEmployees = bool flag direct
  data.areSalariat = profile.hasEmployees;

  // ── ÎNTREPRINDERI LEGATE ─────────────────────────────────────────────────
  // Flag: "are_asociati_multipli" sugerează verifier extras suplimentar
  // Default: array gol (fără întreprinderi legate cunoscute)
  // TODO: integrare ONRC public scrape pentru cote asociați + cumulare CA
  data.intreprinderiLegateCa = profile.flags.includes("are_asociati_multipli")
    ? [] // placeholder — fără ONRC scrape încă, contabilul confirmă manual
    : [];

  // ── TIP FIRMĂ pentru micro check ─────────────────────────────────────────
  data.estePrimulAn =
    new Date(profile.registeredDate).getTime() >
    Date.now() - 365 * 24 * 60 * 60 * 1000;

  if (data.estePrimulAn) {
    const days = Math.floor(
      (Date.now() - new Date(profile.registeredDate).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    data.zileDeLaInfiintare = days;
  }

  // ── ANC: capital social ──────────────────────────────────────────────────
  // ClientProfile NU are direct capital social (ar trebui adăugat în schemă)
  // Pentru moment: nu populat, verifier ANC va cere clarify dacă activează

  // ── EVENTE FISCALE pentru analize specifice ──────────────────────────────
  // Ex: ultimă plată impozit (pentru bonificație 3%)
  const lastTaxPayment = events
    .filter((e) => e.type === "bank_payment" && e.refDoc?.includes("impozit"))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (lastTaxPayment) {
    data.impozitDatorat = lastTaxPayment.amountRON;
    data.platitLaTermen = true; // assume true (mai bine cu doc verificare termene)
  }

  return data;
}

/**
 * Verifică ce câmpuri critice LIPSESC pentru un verifier specific.
 * Returnează lista de date care trebuie cerute user-ului conversațional.
 *
 * Folosit pentru a întreba MINIMUM (1-2 yes/no) în loc de form complet.
 */
export function findCriticalMissingFields(
  data: VerifierData,
  verifierName: string
): Array<{ key: keyof VerifierData; prompt: string; isYesNo?: boolean }> {
  const missing: Array<{
    key: keyof VerifierData;
    prompt: string;
    isYesNo?: boolean;
  }> = [];

  switch (verifierName) {
    case "micro-eligibility":
      if (data.cifraAfaceri2025 === undefined) {
        missing.push({
          key: "cifraAfaceri2025",
          prompt:
            "Nu am cifra de afaceri 2025 în portofoliu. O știi exact (în lei)?",
        });
      }
      if (data.areSalariat === undefined) {
        missing.push({
          key: "areSalariat",
          prompt: "Firma are cel puțin un salariat activ?",
          isYesNo: true,
        });
      }
      // Întreprinderi legate — întreabă doar dacă flag-ul există
      // (altfel default 0, nu deranjăm user-ul)
      break;

    case "anc":
      if (data.capitalSocial === undefined) {
        missing.push({
          key: "capitalSocial",
          prompt: "Care e capitalul social subscris al firmei? (lei)",
        });
      }
      if (data.activNetContabil === undefined) {
        missing.push({
          key: "activNetContabil",
          prompt: "Care e activul net contabil la 31.12? (lei, poate fi negativ)",
        });
      }
      break;

    case "diurna-plafon":
      if (data.salariuBrutLunar === undefined) {
        missing.push({
          key: "salariuBrutLunar",
          prompt: "Care e salariul brut lunar al persoanei delegate?",
        });
      }
      break;

    default:
      // Pentru alți verifiers, lăsăm verifier-ul însuși să indice ce lipsește
      break;
  }

  return missing;
}

/**
 * Helper pentru afișare friendly a ClientProfile în prompt-ul Gemma.
 */
export function clientProfileToContext(profile: ClientProfile): string {
  return `Client: ${profile.name} (${profile.cui})
- Tip: ${profile.type}
- TVA: ${profile.vatRegime}
- Salariați: ${profile.hasEmployees ? "Da" : "Nu"}
- CAEN: ${profile.caenCodes.join(", ")}
- Estimat CA anual: ${
    profile.estimatedAnnualRevenueEUR
      ? `${profile.estimatedAnnualRevenueEUR.toLocaleString("ro-RO")} EUR`
      : "necunoscut"
  }
- Înregistrat: ${profile.registeredDate}
${profile.flags.length > 0 ? `- Particularități: ${profile.flags.join(", ")}` : ""}`;
}
