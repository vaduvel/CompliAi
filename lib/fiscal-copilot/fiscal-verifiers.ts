/**
 * FiscCopilot — Fiscal Verifiers (DETERMINISTIC TOOLS)
 *
 * Funcții pure care verifică praguri, condiții și eligibilități fiscale RO.
 *
 * Filozofie:
 *   - Math + drept fiscal = NU se halucinează
 *   - LLM-ul (Gemma) primește rezultatul verificat ca FAPT
 *   - Updates legislative = update aici, NU re-training
 *
 * Pattern fiecare verifier:
 *   1. detect(question) → returnează applicability boolean + lista de date necesare
 *   2. compute(data) → returnează verdict determinist cu citare legală
 *
 * Cum se folosește în ai-expert.ts:
 *   - Pre-LLM: trecem întrebarea prin VERIFIERS
 *   - Dacă unul detectează aplicabilitate + are toate datele → injectăm verdict în prompt
 *   - Dacă lipsesc date → returnăm "clarifying questions" către user, scurt-circuit LLM
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VerifierData {
  // Cifre de afaceri
  cifraAfaceri2025?: number; // lei
  cifraAfaceri2026?: number;

  // Micro
  areSalariat?: boolean;
  intreprinderiLegateCa?: number[]; // CA fiecărei firme legate (lei)
  estePrimulAn?: boolean;
  zileDeLaInfiintare?: number;

  // TVA la încasare
  caTvaIncasarePrec?: number; // CA an precedent (lei)
  anCurent?: number;

  // Diurnă
  salariuBrutLunar?: number;
  zileDeplsare?: number;
  tipDeplasare?: "RO" | "UE" | "non-UE";

  // ANC
  capitalSocial?: number;
  activNetContabil?: number;

  // Cheltuieli sociale
  fondSalariiAnual?: number;
  cheltuieliSocialeAcordate?: number;

  // Plafon numerar
  sumaIncasare?: number;
  cumulZi?: number;
  tipBeneficiar?: "PJ" | "PF";

  // Cota TVA
  dataFacturaAvans?: string; // ISO
  dataLivrareFinala?: string;
  cotaAvans?: number;

  // Bonificație 3%
  impozitDatorat?: number;
  platitLaTermen?: boolean;
}

export interface VerifierResult {
  /** Verifierul detectează pattern-ul în întrebare? */
  applicable: boolean;
  /** Numele verifierului (pentru debugging + telemetry) */
  name: string;
  /** Topic uman pentru afișare */
  topic: string;
  /** Dacă applicable=true dar lipsesc date, lista de date necesare */
  needsData?: Array<{ key: keyof VerifierData; prompt: string; example?: string }>;
  /** Dacă toate datele sunt furnizate, verdictul determinist */
  verdict?: {
    /** Răspuns scurt pentru afișare în UI */
    label: string;
    /** Concluzie binară sau "depinde" */
    answer: "yes" | "no" | "depends";
    /** Motivare + cifre concrete */
    reason: string;
    /** Articole de lege + OUG-uri citate */
    legalRef: string;
    /** Monografie contabilă dacă aplicabil */
    monografie?: string;
    /** Pași concreti pentru contabil */
    nextSteps?: string[];
  };
}

// ============================================================================
// CONSTANTE (actualizate la 2026-05-15)
// ============================================================================

export const SALARIU_MINIM_BRUT_2025 = 4_050; // RON (HG 1506/2024)
export const SALARIU_MINIM_BRUT_2026 = 4_050; // RON (presupus stabil până la HG nou)
export const PLAFON_MICRO_2026_EUR = 100_000; // OUG 8/2026
export const PLAFON_MICRO_2025_EUR = 500_000; // vechi
export const CURS_EUR_31_12_2025 = 4.965; // BNR (presupus pentru calcule)
export const PLAFON_TVA_INCASARE_2025 = 4_500_000; // lei
export const PLAFON_TVA_INCASARE_2026 = 5_000_000; // OUG 8/2026 (martie-dec)
export const PLAFON_TVA_INCASARE_2027 = 5_500_000;
export const PLAFON_NUMERAR_PJ_ZI = 10_000; // L 70/2015 — per zi B2B (din 2025)
export const PLAFON_NUMERAR_PF_INCASARE = 50_000; // per zi
export const PLAFON_NUMERAR_CASIERIE_SOLD = 50_000;
export const HG_714_DIURNA_INTERNA_PUBLIC = 23; // RON/zi (sector public)
export const DIURNA_INTERNA_PRIVAT_MAX = 23 * 2.5; // 57.5 RON/zi
export const DIURNA_EXTERNA_UE_PUBLIC_EUR_MED = 35;
export const DIURNA_EXTERNA_UE_PRIVAT_MAX_EUR = 35 * 2.5; // ~87.5 EUR/zi

// ============================================================================
// HELPER: detectare keyword
// ============================================================================

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ţ/g, "t")
    .replace(/Ţ/g, "T");
}

function detectKeywords(text: string, keywords: string[][]): boolean {
  const norm = stripDiacritics(text).toLowerCase();
  return keywords.some((group) =>
    group.every((kw) => norm.includes(stripDiacritics(kw).toLowerCase()))
  );
}

// ============================================================================
// VERIFIER 1: Micro 2026 eligibility
// ============================================================================

export function verifyMicroEligibility(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["micro", "2026"],
    ["microintreprindere"],
    ["pot fi micro"],
    ["sunt micro"],
    ["raman micro"],
    ["ramane micro"],
    ["ramane", "micro"],
    ["trec la profit"],
    ["plafon", "micro"],
    ["100", "000", "eur"],
    ["intreprinderi legate"],
    ["pot ramane"],
  ]);

  if (!applicable) return { applicable: false, name: "micro-eligibility", topic: "Micro 2026" };

  // Need: CA 2025, salariat, intreprinderi legate
  const missing: VerifierResult["needsData"] = [];
  if (data?.cifraAfaceri2025 === undefined) {
    missing.push({
      key: "cifraAfaceri2025",
      prompt: "Care a fost cifra de afaceri în 2025? (în lei, fără TVA)",
      example: "350000",
    });
  }
  if (data?.areSalariat === undefined) {
    missing.push({
      key: "areSalariat",
      prompt: "Aveți cel puțin un salariat (CIM normă întreagă) sau contract mandat cu remunerație min. salariu brut?",
      example: "true / false",
    });
  }
  if (data?.intreprinderiLegateCa === undefined) {
    missing.push({
      key: "intreprinderiLegateCa",
      prompt:
        "Asociații dvs. dețin (>25%) și alte firme? Dacă da, listează cifra de afaceri 2025 a fiecăreia. Dacă nu, trimite [].",
      example: "[450000, 80000]",
    });
  }

  if (missing.length) {
    return {
      applicable: true,
      name: "micro-eligibility",
      topic: "Micro 2026 — eligibilitate",
      needsData: missing,
    };
  }

  // Compute deterministically
  const caRO = data!.cifraAfaceri2025!;
  const caCumulat = caRO + (data!.intreprinderiLegateCa ?? []).reduce((s, v) => s + v, 0);
  const pragLei = PLAFON_MICRO_2026_EUR * CURS_EUR_31_12_2025; // ~496.500 lei
  const depasestePrag = caCumulat > pragLei;
  const fararSalariat = !data!.areSalariat;

  let answer: "yes" | "no" | "depends" = "yes";
  const motive: string[] = [];

  if (depasestePrag) {
    answer = "no";
    motive.push(
      `CA cumulat 2025 (firma + întreprinderi legate) = ${caCumulat.toLocaleString("ro-RO")} lei depășește pragul de ${pragLei.toLocaleString("ro-RO")} lei (echiv. ${PLAFON_MICRO_2026_EUR.toLocaleString("ro-RO")} EUR la curs BNR 31.12.2025)`
    );
  }
  if (fararSalariat) {
    if (answer === "yes") answer = "no";
    motive.push(
      "Nu îndepliniți condiția salariat (Cod Fiscal art. 47 alin. 1 lit. g). Excepție: contract mandat cu remunerație ≥ salariu min. brut (art. 51 alin. 4 lit. b)."
    );
  }

  return {
    applicable: true,
    name: "micro-eligibility",
    topic: "Micro 2026 — eligibilitate",
    verdict: {
      label: answer === "yes" ? "ELIGIBIL micro 2026" : "NU este eligibil micro 2026",
      answer,
      reason: motive.length
        ? motive.join(" ")
        : `CA cumulat ${caCumulat.toLocaleString("ro-RO")} lei < prag ${pragLei.toLocaleString("ro-RO")} lei + are salariat. Toate condițiile îndeplinite.`,
      legalRef:
        "Cod Fiscal Titlul III art. 47-51; OUG 8/2026 (plafon redus 100K EUR); Legea 296/2023 (întreprinderi legate)",
      nextSteps:
        answer === "yes"
          ? [
              "Depune bilanț 2025 până la 31 martie 2026 (regula OUG 8/2026)",
              "Cotă: 1% (cu salariat) sau 3% (fără)",
              "Documentație: contract muncă/mandat + listă asociați",
            ]
          : [
              "Trecere la impozit profit 16% începând cu 01.01.2026",
              depasestePrag && data!.intreprinderiLegateCa && data!.intreprinderiLegateCa.length > 0
                ? "Alternativă: cedare poziție >25% într-una din firmele legate (verifică legalitate cu jurist)"
                : "",
              "Recalcul D101 trimestre 2026 + D700 modificare vector fiscal",
            ].filter(Boolean) as string[],
    },
  };
}

// ============================================================================
// VERIFIER 2: TVA la încasare 2026 eligibility
// ============================================================================

export function verifyTvaIncasare(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["tva", "incasare"],
    ["plafon", "tva", "incasare"],
    ["sistem tva", "incasare"],
    ["aplicare", "tva", "incasare"],
  ]);

  if (!applicable) return { applicable: false, name: "tva-incasare", topic: "TVA la încasare" };

  const missing: VerifierResult["needsData"] = [];
  if (data?.caTvaIncasarePrec === undefined) {
    missing.push({
      key: "caTvaIncasarePrec",
      prompt: "Care a fost cifra de afaceri în anul calendaristic precedent? (lei)",
      example: "4200000",
    });
  }
  if (data?.anCurent === undefined) {
    missing.push({
      key: "anCurent",
      prompt: "Pentru ce an analizați eligibilitatea? (ex: 2026)",
      example: "2026",
    });
  }

  if (missing.length) {
    return { applicable: true, name: "tva-incasare", topic: "TVA la încasare — eligibilitate", needsData: missing };
  }

  const an = data!.anCurent!;
  const caPrec = data!.caTvaIncasarePrec!;

  // Plafon valabil PENTRU ANUL PRECEDENT (regula art. 282 alin. 3¹):
  // Eligibilitatea în an = CA an precedent < plafon AN PRECEDENT
  const pragPrecedent = an - 1 === 2025 ? PLAFON_TVA_INCASARE_2025 : an - 1 === 2026 ? PLAFON_TVA_INCASARE_2026 : PLAFON_TVA_INCASARE_2027;
  const pragCurent = an === 2025 ? PLAFON_TVA_INCASARE_2025 : an === 2026 ? PLAFON_TVA_INCASARE_2026 : PLAFON_TVA_INCASARE_2027;

  const eligibil = caPrec <= pragPrecedent;

  return {
    applicable: true,
    name: "tva-incasare",
    topic: "TVA la încasare — eligibilitate",
    verdict: {
      label: eligibil ? `ELIGIBIL TVA la încasare ${an}` : `NU este eligibil TVA la încasare ${an}`,
      answer: eligibil ? "yes" : "no",
      reason: eligibil
        ? `CA ${an - 1} = ${caPrec.toLocaleString("ro-RO")} lei ≤ plafon ${pragPrecedent.toLocaleString("ro-RO")} lei (valabil pentru anul ${an - 1}). La data exercitării opțiunii NU trebuie să fi depășit plafonul ${an} (${pragCurent.toLocaleString("ro-RO")} lei).`
        : `CA ${an - 1} = ${caPrec.toLocaleString("ro-RO")} lei > plafon ${pragPrecedent.toLocaleString("ro-RO")} lei pentru anul ${an - 1}. NU se aplică plafonul nou retroactiv. Reactivare posibilă în ${an + 1} (dacă CA ${an} sub plafon valabil pentru ${an}).`,
      legalRef:
        "Cod Fiscal art. 282 alin. (3)-(8), alin. (3¹) introdus de OUG 8/2026; OPANAF 409/2021 (D097)",
      nextSteps: eligibil
        ? [
            "D097 (Notificare aplicare TVA la încasare) cu min. 25 zile înainte de perioada fiscală dorită",
            "Aplică din prima zi a perioadei fiscale următoare",
            "Mențiune obligatorie pe facturi: 'TVA la încasare'",
          ]
        : [
            `Eligibilitate următoare: ${an + 1} dacă CA ${an} sub ${pragCurent.toLocaleString("ro-RO")} lei`,
            "Sistemul actual: TVA normală (exigibilă la fapt generator)",
          ],
    },
  };
}

// ============================================================================
// VERIFIER 3: Diurnă plafon dublu (33% + 2.5×)
// ============================================================================

export function verifyDiurnaPlafon(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["diurna", "plafon"],
    ["diurna", "neimpozabil"],
    ["plafon", "33"],
    ["delegatie", "plafon"],
    ["calcul diurna"],
  ]);

  if (!applicable) return { applicable: false, name: "diurna-plafon", topic: "Diurnă plafon" };

  const missing: VerifierResult["needsData"] = [];
  if (data?.salariuBrutLunar === undefined) {
    missing.push({
      key: "salariuBrutLunar",
      prompt: "Salariul brut lunar al persoanei delegate (lei)",
      example: "5000",
    });
  }
  if (data?.zileDeplsare === undefined) {
    missing.push({
      key: "zileDeplsare",
      prompt: "Câte zile de delegație în luna respectivă?",
      example: "12",
    });
  }
  if (data?.tipDeplasare === undefined) {
    missing.push({
      key: "tipDeplasare",
      prompt: "Tipul deplasării: RO (intern), UE, sau non-UE?",
      example: "UE",
    });
  }

  if (missing.length) {
    return { applicable: true, name: "diurna-plafon", topic: "Diurnă plafon neimpozabil", needsData: missing };
  }

  const salariu = data!.salariuBrutLunar!;
  const zile = data!.zileDeplsare!;
  const tip = data!.tipDeplasare!;

  // Plafon clasic 2.5× HG 714 × zile
  let perZi: number;
  if (tip === "RO") perZi = DIURNA_INTERNA_PRIVAT_MAX;
  else if (tip === "UE") perZi = DIURNA_EXTERNA_UE_PRIVAT_MAX_EUR * 4.95; // RON
  else perZi = 40 * 2.5 * 4.95; // non-UE aprox

  const plafon25xZile = perZi * zile;
  const plafon33Procente = salariu * 0.33;

  const plafonAplicabil = Math.min(plafon25xZile, plafon33Procente);
  const limitareActiva = plafon33Procente < plafon25xZile ? "33% salariu" : "2.5× HG 714";

  return {
    applicable: true,
    name: "diurna-plafon",
    topic: "Diurnă plafon neimpozabil",
    verdict: {
      label: `Maxim neimpozabil: ${plafonAplicabil.toFixed(0)} RON/lună`,
      answer: "depends",
      reason: `Plafon 2.5× HG 714/2018 (${tip}, ${zile} zile): ${plafon25xZile.toFixed(0)} RON. Plafon 33% × salariu brut ${salariu}: ${plafon33Procente.toFixed(0)} RON. Limita aplicabilă (mai mică): ${plafonAplicabil.toFixed(0)} RON. ACTIVA: ${limitareActiva}.`,
      legalRef:
        "Cod Fiscal art. 76 alin. (4) lit. h), alin. (4¹) introdus 2023; HG 714/2018; Reg. (CE) 883/2004 (A1 detașare UE)",
      nextSteps: [
        `Plătește max ${plafonAplicabil.toFixed(0)} RON ca diurnă neimpozabilă în luna respectivă`,
        "Suma peste plafon → impozabilă ca salariu (impozit 16% + CAS 25% + CASS 10%)",
        "D112 secțiunea F1 (neimpozabilă) + G (impozabilă)",
        tip === "UE" ? "Pentru detașare > 24 luni: formular A1 obligatoriu" : "",
      ].filter(Boolean) as string[],
    },
  };
}

// ============================================================================
// VERIFIER 4: ANC negativ + restricții L 239/2025
// ============================================================================

export function verifyANC(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["activ", "net"],
    ["anc"],
    ["legea 239"],
    ["l 239"],
    ["239/2025"],
    ["restituire", "imprumut"],
    ["restitui", "imprumut"],
    ["distribuire", "dividende"],
    ["capital social", "sub"],
    ["jumatate", "capital"],
  ]);

  if (!applicable) return { applicable: false, name: "anc", topic: "ANC" };

  const missing: VerifierResult["needsData"] = [];
  if (data?.activNetContabil === undefined) {
    missing.push({
      key: "activNetContabil",
      prompt: "Activul net contabil la 31.12 (lei). Poate fi negativ.",
      example: "150000 sau -50000",
    });
  }
  if (data?.capitalSocial === undefined) {
    missing.push({ key: "capitalSocial", prompt: "Capitalul social subscris (lei)", example: "200" });
  }

  if (missing.length) {
    return { applicable: true, name: "anc", topic: "ANC + Legea 239/2025", needsData: missing };
  }

  const anc = data!.activNetContabil!;
  const cap = data!.capitalSocial!;
  const pragJumatateCap = cap / 2;

  let status: "OK" | "SUB_JUMATATE" | "NEGATIV";
  if (anc < 0) status = "NEGATIV";
  else if (anc < pragJumatateCap) status = "SUB_JUMATATE";
  else status = "OK";

  const restrictiiActive = status !== "OK";

  return {
    applicable: true,
    name: "anc",
    topic: "ANC + restricții Legea 239/2025",
    verdict: {
      label:
        status === "OK"
          ? "ANC OK — fără restricții"
          : status === "SUB_JUMATATE"
            ? "ANC < 50% capital — restricții ACTIVE"
            : "ANC NEGATIV — situație gravă",
      answer: status === "OK" ? "yes" : "no",
      reason: `ANC = ${anc.toLocaleString("ro-RO")} lei. Capital social = ${cap.toLocaleString("ro-RO")} lei. Prag 50% = ${pragJumatateCap.toLocaleString("ro-RO")} lei. ${restrictiiActive ? "ANC sub prag → restricții Legea 239/2025 activate." : "ANC peste prag → poate distribui dividende + restitui împrumuturi."}`,
      legalRef:
        "L 239/2025 (modificări L 31/1990); L 31/1990 art. 153^24, art. 67 alin. 23-26, art. 691 (nou)",
      nextSteps: restrictiiActive
        ? [
            "INTERZIS: distribuire dividende (inclusiv interimare) din profitul curent",
            "INTERZIS: restituire împrumuturi asociați",
            "PERMIS: împrumuturi NOI de la asociați (ajută reîntregire)",
            "OBLIGAȚIE: convocare AGA extraordinară în max 6 luni",
            "Termen reglare: până la 31.12 exercițiu următor (art. 153^24 alin. 4)",
            "Opțiuni reglare: majorare capital / aport 1068 / reducere capital / dizolvare",
          ]
        : [
            "Poate distribui dividende conform AGA",
            "Poate restitui împrumuturi asociați",
            "Verifică totuși plafoanele numerar L 70/2015 la distribuire",
          ],
    },
  };
}

// ============================================================================
// VERIFIER 5: Cheltuieli sociale plafon 5%
// ============================================================================

export function verifyCheltuieliSocial5(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["cheltuieli sociale"],
    ["5", "fond salarii"],
    ["8 martie"],
    ["craciun", "salariat"],
    ["team building"],
    ["ajutor inmormantare"],
    ["cadou", "salariat"],
  ]);

  if (!applicable)
    return { applicable: false, name: "cheltuieli-social-5", topic: "Cheltuieli sociale 5%" };

  const missing: VerifierResult["needsData"] = [];
  if (data?.fondSalariiAnual === undefined) {
    missing.push({
      key: "fondSalariiAnual",
      prompt: "Fond salarii anual (cont 641 total, lei)",
      example: "500000",
    });
  }
  if (data?.cheltuieliSocialeAcordate === undefined) {
    missing.push({
      key: "cheltuieliSocialeAcordate",
      prompt: "Total cheltuieli sociale acordate în an (lei) — cadouri, team building, ajutoare, etc.",
      example: "35000",
    });
  }

  if (missing.length) {
    return {
      applicable: true,
      name: "cheltuieli-social-5",
      topic: "Cheltuieli sociale — plafon 5% fond salarii",
      needsData: missing,
    };
  }

  const fond = data!.fondSalariiAnual!;
  const acordate = data!.cheltuieliSocialeAcordate!;
  const plafon5 = fond * 0.05;
  const depaseste = acordate > plafon5;
  const deductibil = Math.min(acordate, plafon5);
  const nedeductibil = Math.max(0, acordate - plafon5);

  return {
    applicable: true,
    name: "cheltuieli-social-5",
    topic: "Cheltuieli sociale — plafon 5% fond salarii",
    verdict: {
      label: depaseste
        ? `Depășire plafon — ${nedeductibil.toLocaleString("ro-RO")} lei NEDEDUCTIBIL`
        : "În plafon — toate deductibile",
      answer: depaseste ? "no" : "yes",
      reason: `Fond salarii: ${fond.toLocaleString("ro-RO")} lei. Plafon 5% = ${plafon5.toLocaleString("ro-RO")} lei. Cheltuieli sociale acordate: ${acordate.toLocaleString("ro-RO")} lei. Deductibil la profit: ${deductibil.toLocaleString("ro-RO")} lei. ${depaseste ? `Nedeductibil: ${nedeductibil.toLocaleString("ro-RO")} lei (adaos în D101 anexa cheltuieli nedeductibile).` : ""}`,
      legalRef: "Cod Fiscal art. 25 alin. (3) lit. b (plafon cheltuieli sociale)",
      nextSteps: depaseste
        ? [
            `Adaugă ${nedeductibil.toLocaleString("ro-RO")} lei la cheltuieli NEDEDUCTIBILE în D101 anexa`,
            "Atenție: TVA pe majoritatea cheltuielilor sociale = NEDEDUCTIBIL (art. 297)",
            "Verifică plafoane individuale: 300 RON/cadou neimpozabil la salariat (Cod Fiscal art. 76 alin. 4)",
          ]
        : [
            "Toate sumele DEDUCTIBILE la calcul profit",
            "Verifică plafoane individuale: 300 RON/cadou neimpozabil la salariat",
            "Abonamente sportive: SEPARAT (până la 100 EUR/lună/salariat, NU intră în 5%)",
          ],
    },
  };
}

// ============================================================================
// VERIFIER 6: Plafon numerar L 70/2015
// ============================================================================

export function verifyPlafonNumerar(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["plafon", "numerar"],
    ["legea 70"],
    ["cash", "plafon"],
    ["plata numerar"],
    ["plati", "numerar"],
    ["plata", "numerar"],
    ["incasare", "numerar"],
    ["lei", "numerar"],
    ["pot plati", "cash"],
  ]);

  if (!applicable) return { applicable: false, name: "plafon-numerar", topic: "Plafon numerar" };

  const missing: VerifierResult["needsData"] = [];
  if (data?.sumaIncasare === undefined) {
    missing.push({
      key: "sumaIncasare",
      prompt: "Suma încasată/plătită în numerar (lei)",
      example: "8000",
    });
  }
  if (data?.tipBeneficiar === undefined) {
    missing.push({
      key: "tipBeneficiar",
      prompt: "Beneficiar/plătitor: PJ (persoană juridică) sau PF (persoană fizică)?",
      example: "PJ",
    });
  }

  if (missing.length) {
    return { applicable: true, name: "plafon-numerar", topic: "Plafon numerar L 70/2015", needsData: missing };
  }

  const suma = data!.sumaIncasare!;
  const tip = data!.tipBeneficiar!;
  const plafonAplicabil = tip === "PJ" ? PLAFON_NUMERAR_PJ_ZI : PLAFON_NUMERAR_PF_INCASARE;
  const depaseste = suma > plafonAplicabil;

  return {
    applicable: true,
    name: "plafon-numerar",
    topic: "Plafon numerar L 70/2015",
    verdict: {
      label: depaseste
        ? `DEPĂȘIRE plafon — RISC AMENDĂ`
        : `În plafon — OK numerar`,
      answer: depaseste ? "no" : "yes",
      reason: `Suma: ${suma.toLocaleString("ro-RO")} lei. Plafon ${tip === "PJ" ? "B2B (PJ→PJ)" : "B2C (PJ↔PF)"}: ${plafonAplicabil.toLocaleString("ro-RO")} lei/zi. ${depaseste ? "Depășire → operațiunea trebuie ÎMPĂRȚITĂ pe zile sau efectuată prin BANCĂ." : "Operațiune validă în numerar."}`,
      legalRef:
        "Legea 70/2015 (disciplina financiară numerar); modificări OUG 156/2024 + OUG 8/2026; Plafoane: 10K/zi B2B, 50K/zi B2C, 50K sold casierie",
      nextSteps: depaseste
        ? [
            `Soluție 1: împărțire plată pe ZILE DIFERITE (max ${plafonAplicabil.toLocaleString("ro-RO")} lei/zi)`,
            "Soluție 2: PLATĂ PRIN BANCĂ (recomandat pentru claritate)",
            "AMENDĂ pentru depășire: 10% din suma depășită (L 70/2015 art. 12)",
            "Atenție: cumul ZILNIC pe AceLAȘI beneficiar",
          ]
        : [
            "Operațiune validă",
            "Document obligatoriu: chitanță/dispoziție de plată sau bon fiscal",
            "Verifică sold casierie la sfârșit de zi: max 50.000 lei (excepție: zi de plată salarii)",
          ],
    },
  };
}

// ============================================================================
// VERIFIER 7: Bonificație 3% OUG 107/2024
// ============================================================================

export function verifyBonificatie3(question: string, data?: VerifierData): VerifierResult {
  const applicable = detectKeywords(question, [
    ["bonificatie", "3"],
    ["bonificatia"],
    ["oug 107"],
    ["reducere", "impozit", "termen"],
  ]);

  if (!applicable) return { applicable: false, name: "bonificatie-3", topic: "Bonificație 3%" };

  const missing: VerifierResult["needsData"] = [];
  if (data?.impozitDatorat === undefined) {
    missing.push({
      key: "impozitDatorat",
      prompt: "Impozit datorat anual (lei)",
      example: "50000",
    });
  }
  if (data?.platitLaTermen === undefined) {
    missing.push({
      key: "platitLaTermen",
      prompt: "Impozitul a fost plătit INTEGRAL în termen?",
      example: "true / false",
    });
  }

  if (missing.length) {
    return { applicable: true, name: "bonificatie-3", topic: "Bonificație 3% OUG 107/2024", needsData: missing };
  }

  const impozit = data!.impozitDatorat!;
  const platit = data!.platitLaTermen!;
  const bonificatie = impozit * 0.03;
  const efectivDePlata = impozit - bonificatie;

  return {
    applicable: true,
    name: "bonificatie-3",
    topic: "Bonificație 3% OUG 107/2024",
    verdict: {
      label: platit
        ? `Bonificație aplicabilă: ${bonificatie.toFixed(0)} lei`
        : "Bonificație PIERDUTĂ — plată cu întârziere",
      answer: platit ? "yes" : "no",
      reason: `Impozit datorat: ${impozit.toLocaleString("ro-RO")} lei. Bonificație 3%: ${bonificatie.toFixed(0)} lei. ${platit ? `Plată efectivă: ${efectivDePlata.toLocaleString("ro-RO")} lei.` : "Plată cu întârziere = bonificație PIERDUTĂ + accesorii."}`,
      legalRef: "OUG 107/2024 (bonificație 3%); Cod Fiscal art. 23 alin. 1 lit. b (venit neimpozabil)",
      monografie: platit
        ? `Înregistrare bonificație (la primirea deciziei ANAF):\n4411 = 7588 (${bonificatie.toFixed(0)} lei) — venit NEIMPOZABIL`
        : undefined,
      nextSteps: platit
        ? [
            `Plată efectivă: ${efectivDePlata.toFixed(0)} lei (cu bonificația scăzută)`,
            "ANAF aplică automat bonificația la depunere D100/D101 în termen",
            "Decizia ANAF apare pe Fișa Plătitor în 30-60 zile",
            "Venit NEIMPOZABIL la calcul profit (cont 7588)",
          ]
        : [
            "Plată INTEGRALĂ impozit + accesorii (dobândă 0.02%/zi + penalitate 0.01%/zi)",
            "Bonificația NU se mai poate recupera retroactiv pentru anul respectiv",
            "Pentru anul următor: depune+plătește la termen ca să nu pierzi din nou",
          ],
    },
  };
}

// ============================================================================
// REGISTRY + ORCHESTRATION
// ============================================================================

export const VERIFIERS = [
  verifyMicroEligibility,
  verifyTvaIncasare,
  verifyDiurnaPlafon,
  verifyANC,
  verifyCheltuieliSocial5,
  verifyPlafonNumerar,
  verifyBonificatie3,
] as const;

/**
 * Rulează toți verifierii pe o întrebare. Returnează cei aplicabili.
 *
 * @returns Lista verifierilor care au detectat aplicabilitate (cu date dacă sunt furnizate)
 */
export function runVerifiers(question: string, data?: VerifierData): VerifierResult[] {
  return VERIFIERS.map((v) => v(question, data)).filter((r) => r.applicable);
}

/**
 * Verifică dacă orice verifier ARE deja un verdict complet (toate datele furnizate).
 */
export function hasVerdict(results: VerifierResult[]): boolean {
  return results.some((r) => r.verdict !== undefined);
}

/**
 * Returnează lista combinată de date solicitate de toți verifierii aplicabili.
 */
export function collectMissingData(results: VerifierResult[]): VerifierResult["needsData"] {
  const all: NonNullable<VerifierResult["needsData"]> = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (!r.needsData) continue;
    for (const item of r.needsData) {
      if (!seen.has(item.key)) {
        seen.add(item.key);
        all.push(item);
      }
    }
  }
  return all.length ? all : undefined;
}

/**
 * Formatează verdicts pentru injectare în prompt-ul Gemma.
 */
export function formatVerdictsForPrompt(results: VerifierResult[]): string {
  const withVerdict = results.filter((r) => r.verdict);
  if (withVerdict.length === 0) return "";

  return `
## VERIFICARE DETERMINISTĂ (calculat algoritmic — sigur, NU halucinat):

${withVerdict
  .map(
    (r) => `### ${r.topic}
**Verdict:** ${r.verdict!.label}
**Răspuns:** ${r.verdict!.answer === "yes" ? "DA" : r.verdict!.answer === "no" ? "NU" : "Depinde"}
**Motiv:** ${r.verdict!.reason}
**Bază legală:** ${r.verdict!.legalRef}
${r.verdict!.nextSteps ? `**Pași concreti:**\n${r.verdict!.nextSteps.map((s) => `- ${s}`).join("\n")}` : ""}
${r.verdict!.monografie ? `**Monografie:**\n${r.verdict!.monografie}` : ""}`
  )
  .join("\n\n")}

Foloseste aceste verdicte în răspuns. Sunt VERIFICATE algoritmic, NU le contrazice.`;
}
