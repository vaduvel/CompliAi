/**
 * FiscCopilot — Procedural Memory
 *
 * Action sequences cu success stats.
 * Port din SUNDAY/procedural.py canon §9.4.
 *
 * Used by:
 *  - Match Path Engine (când detectează "distribuire dividende", oferă procedura ca step plan)
 *  - AI Expert (când întrebat "cum fac X?", răspunde cu procedura învățată din practică)
 *  - Onboarding (proceduri standard pre-populate)
 *
 * Diferență față de Match Paths:
 *  - Match Path = REGULĂ care detectează problemă
 *  - Procedure = SEQUENȚĂ DE PAȘI pentru a rezolva o sarcină
 */

import { randomUUID } from "node:crypto";
import { readMemory, writeMemory } from "./store";
import type { ProcedureRecord } from "./types";
import { successRate } from "./types";

export interface UpsertProcedureInput {
  orgId: string;
  name: string;
  steps: ProcedureRecord["steps"];
  tags?: string[];
  title?: string;
  intent?: string;
  documentsRequired?: string[];
  questionsToAskClient?: string[];
  preventiveChecks?: ProcedureRecord["preventiveChecks"];
  outputs?: string[];
  legalReferences?: ProcedureRecord["legalReferences"];
  estimatedTimeManualMin?: number;
  estimatedTimeWithCopilotMin?: number;
  triggeredByPathId?: string;
}

/**
 * Creează o procedure nouă sau o caută pe name.
 */
export async function upsertProcedure(input: UpsertProcedureInput): Promise<ProcedureRecord> {
  let result!: ProcedureRecord;
  await writeMemory(input.orgId, (snap) => {
    const now = Date.now() / 1000;
    const existing = snap.procedures.find((p) => p.name === input.name);

    const fields = {
      steps: input.steps,
      title: input.title,
      intent: input.intent,
      documentsRequired: input.documentsRequired,
      questionsToAskClient: input.questionsToAskClient,
      preventiveChecks: input.preventiveChecks,
      outputs: input.outputs,
      legalReferences: input.legalReferences,
      estimatedTimeManualMin: input.estimatedTimeManualMin,
      estimatedTimeWithCopilotMin: input.estimatedTimeWithCopilotMin,
      triggeredByPathId: input.triggeredByPathId,
    };

    if (existing) {
      Object.assign(existing, fields);
      if (input.tags) existing.tags = input.tags;
      result = existing;
    } else {
      const rec: ProcedureRecord = {
        id: `proc_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        orgId: input.orgId,
        name: input.name,
        ...fields,
        invocations: 0,
        successes: 0,
        firstSeenAt: now,
        lastUsedAt: now,
        tags: input.tags ?? [],
      };
      snap.procedures.push(rec);
      result = rec;
    }
  });
  return result;
}

/**
 * Returnează procedure asociat unui Match Path id (pentru button "Vezi procedura" pe alert).
 */
export async function getProcedureByPathId(
  orgId: string,
  pathId: string
): Promise<ProcedureRecord | null> {
  const mem = await readMemory(orgId);
  return mem.procedures.find((p) => p.triggeredByPathId === pathId) ?? null;
}

/**
 * Înregistrează că procedura a fost folosită (cu sau fără succes).
 */
export async function recordInvocation(
  orgId: string,
  procedureName: string,
  success: boolean
): Promise<ProcedureRecord | null> {
  let result: ProcedureRecord | null = null;
  await writeMemory(orgId, (snap) => {
    const proc = snap.procedures.find((p) => p.name === procedureName);
    if (!proc) return;
    proc.invocations += 1;
    if (success) proc.successes += 1;
    proc.lastUsedAt = Date.now() / 1000;
    result = proc;
  });
  return result;
}

/**
 * Caută proceduri după tag-uri (e.g., findProceduresByTag(orgId, "dividende")).
 */
export async function findProceduresByTag(
  orgId: string,
  tag: string
): Promise<ProcedureRecord[]> {
  const mem = await readMemory(orgId);
  return mem.procedures.filter((p) => p.tags.includes(tag));
}

/**
 * Get procedure by name.
 */
export async function getProcedure(
  orgId: string,
  name: string
): Promise<ProcedureRecord | null> {
  const mem = await readMemory(orgId);
  return mem.procedures.find((p) => p.name === name) ?? null;
}

/**
 * Returnează cele mai folosite proceduri (top N invocations).
 */
export async function topProcedures(
  orgId: string,
  limit = 10
): Promise<ProcedureRecord[]> {
  const mem = await readMemory(orgId);
  return mem.procedures
    .slice()
    .sort((a, b) => b.invocations - a.invocations)
    .slice(0, limit);
}

/**
 * Helper pentru seed default procedures (când un cabinet nou face onboarding).
 *
 * Filozofie: procedurile NU populează ecran upfront — sunt referențiate
 * just-in-time când Match Path-ul declanșează sau AI Expert sugerează.
 */
export async function seedDefaultProcedures(orgId: string): Promise<void> {
  // ==========================================================================
  // 1. Distribuire dividende (triggered by PATH_D205_DEADLINE)
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "distribuire_dividende",
    title: "Distribuie dividende către asociați",
    intent: "Plătesc dividende din profitul net contabil aprobat",
    tags: ["dividende", "SRL", "D205", "D100", "AGA"],
    triggeredByPathId: "d205-deadline",
    estimatedTimeManualMin: 240, // 4h
    estimatedTimeWithCopilotMin: 25,
    documentsRequired: [
      "Bilanț anual aprobat (sau interimar pentru dividende interimare)",
      "Registrul asociaților actualizat",
      "Dovada formării rezervelor legale (5% din profit până la 20% capital social)",
      "Cont curent bancar firmă",
    ],
    questionsToAskClient: [
      "Care e profitul net dorit a fi distribuit? (RON)",
      "Sunt asociați persoane fizice rezidente sau nerezidente?",
      "Rezervele legale sunt complete (5% capital social)?",
      "Capital social este integral vărsat?",
      "Dorești dividende anuale sau interimare (trimestriale)?",
    ],
    preventiveChecks: [
      {
        check: "rezerva_legala < 0.05 * capital_social",
        ifTrueAdvise: "STOP — formare rezervă legală 5% înainte de distribuire. Conform Legea 31/1990 art. 183.",
      },
      {
        check: "capital_social_varsare < 100%",
        ifTrueAdvise: "STOP — capital social trebuie integral vărsat. Verifică balanță cont 1011 vs 1012.",
      },
      {
        check: "exista_pierderi_reportate",
        ifTrueAdvise: "Atenție — pierderile reportate trebuie acoperite înainte. Verifică sold 117.",
      },
    ],
    outputs: [
      "Hotărâre AGA aprobare distribuire (PDF)",
      "Stat dividende per asociat (Excel)",
      "OP virat impozit 8% la buget",
      "Declarația D100 (XML)",
      "Declarația D205 informativă (XML) — până 28 februarie an următor",
      "Recipisa SPV ANAF arhivată",
    ],
    legalReferences: [
      { article: "art. 91", law: "Cod Fiscal (L 227/2015)", url: "https://legislatie.just.ro" },
      { article: "art. 132 alin. (2)", law: "Cod Fiscal (L 227/2015)", url: "https://legislatie.just.ro" },
      { article: "art. 67", law: "Legea societăților 31/1990", url: "https://legislatie.just.ro" },
      { article: "art. 183", law: "Legea societăților 31/1990 (rezerva legală)", url: "https://legislatie.just.ro" },
    ],
    steps: [
      {
        action: "verifica_preconditii",
        description: "Verifică rezerve legale + capital social + pierderi reportate",
        produces: ["preconditii_ok"],
        estimatedMinutes: 5,
      },
      {
        action: "convoca_AGA",
        description: "Convoacă AGA cu ordine zi 'aprobare distribuire dividende' (notificare minim 15 zile)",
        requires: ["preconditii_ok"],
        produces: ["convocator_AGA"],
        estimatedMinutes: 3,
      },
      {
        action: "intocmeste_stat_dividende",
        description: "Calculează: dividend brut per asociat × cota părți. Impozit 8% reținut la sursă.",
        requires: ["convocator_AGA", "registrul_asociatilor"],
        produces: ["stat_dividende"],
        estimatedMinutes: 5,
      },
      {
        action: "tine_AGA_si_aproba",
        description: "Țineți AGA. Verbal: distribuire + sumă + termene. Aprobare 50%+1.",
        requires: ["stat_dividende"],
        produces: ["aga_aprobata", "hotarare_AGA"],
        estimatedMinutes: 3,
      },
      {
        action: "vireaza_op_buget",
        description: "OP virat la trezorerie cu impozit reținut. Termen: 25 ale lunii următoare plății dividendului.",
        requires: ["stat_dividende"],
        produces: ["op_virat"],
        estimatedMinutes: 2,
      },
      {
        action: "declara_D100",
        description: "Completează D100 cu suma impozit dividende. Depune în SPV.",
        requires: ["op_virat"],
        produces: ["recipisa_D100"],
        estimatedMinutes: 3,
      },
      {
        action: "centralizeaza_D205_anual",
        description: "La sfârșit an: centralizează în D205 toți beneficiarii + sume + impozit per cod 401. Termen: 28/29 februarie an următor.",
        requires: ["stat_dividende", "recipisa_D100"],
        produces: ["recipisa_D205"],
        estimatedMinutes: 4,
      },
    ],
  });

  // ==========================================================================
  // 2. Diurnă propagare D112 (triggered by PATH_DIURNA_D112)
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "diurna_propagare_D112",
    title: "Propagă diurnă în state plată + D112",
    intent: "Am înregistrat diurnă pentru un salariat, ce trebuie să fac pentru ca să apară corect în D112",
    tags: ["diurnă", "D112", "state-plată", "salarii"],
    triggeredByPathId: "diurna-d112",
    estimatedTimeManualMin: 30,
    estimatedTimeWithCopilotMin: 3,
    documentsRequired: [
      "Ordin deplasare cu CNP salariat",
      "Decont cheltuieli (chitanțe + bonuri)",
      "Plafon legal diurnă internă (23 RON/zi în țară, plafoane externe per țară)",
    ],
    questionsToAskClient: [
      "Tipul deplasării: internă sau externă?",
      "Câte zile efective de deplasare?",
      "Diurna acordată depășește plafonul neimpozabil?",
    ],
    preventiveChecks: [
      {
        check: "diurna_zilnica > 23_RON_intern",
        ifTrueAdvise: "Partea peste 23 RON/zi e impozabilă — include în venit brut + contribuții. Cod Fiscal art. 76.",
      },
    ],
    outputs: [
      "Înregistrare contabilă 6253 = 542 / 4423",
      "Update stat plată cu partea impozabilă (dacă există)",
      "D112 cu rândul 8 venit brut corect",
    ],
    legalReferences: [
      { article: "art. 76", law: "Cod Fiscal (L 227/2015) — diurne", url: "https://legislatie.just.ro" },
      { article: "OPANAF 1853/2024", law: "Formular D112", url: "https://anaf.ro" },
    ],
    steps: [
      {
        action: "verifica_plafon",
        description: "Compară diurnă/zi cu plafonul legal (23 RON intern, plafoane DM externe)",
        produces: ["plafon_status"],
        estimatedMinutes: 1,
      },
      {
        action: "split_neimpozabil_impozabil",
        description: "Dacă diurnă > plafon: partea peste = impozabilă (include CAS, CASS, impozit)",
        requires: ["plafon_status"],
        produces: ["split_diurna"],
        estimatedMinutes: 1,
      },
      {
        action: "inregistrare_contabila",
        description: "Înregistrează: 6253 (diurna deplasare) = 542 (avans casa) sau 401 (decont)",
        requires: ["split_diurna"],
        produces: ["nota_contabila"],
        estimatedMinutes: 1,
      },
      {
        action: "update_stat_plata",
        description: "Adaugă partea impozabilă în statul de plată al salariatului — afectează rd. 8 venit brut",
        requires: ["split_diurna"],
        produces: ["stat_actualizat"],
        estimatedMinutes: 2,
      },
      {
        action: "valideaza_D112",
        description: "Regenerează D112 — verifică rd. 8 venit brut = stat plată + diurnă impozabilă",
        requires: ["stat_actualizat"],
        produces: ["D112_validat"],
        estimatedMinutes: 1,
      },
    ],
  });

  // ==========================================================================
  // 3. Depunere SAF-T D406
  await upsertProcedure({
    orgId,
    name: "depunere_SAF_T",
    title: "Depune SAF-T D406 (lunar/trimestrial)",
    intent: "Trebuie să trimit fișierul SAF-T pentru perioada curentă",
    tags: ["SAF-T", "D406", "DUKIntegrator"],
    triggeredByPathId: "saft-deadline",
    estimatedTimeManualMin: 90,
    estimatedTimeWithCopilotMin: 15,
    documentsRequired: [
      "Acces soft contabil (Saga / SmartBill / altul) cu drepturi export",
      "DUKIntegrator instalat + token semnătură",
      "Plan conturi cu mapare CAEN actualizată",
    ],
    questionsToAskClient: [
      "Periodicitate TVA: lunar sau trimestrial?",
      "Există mișcări de stocuri în perioada?",
      "Există achiziții intracomunitare / import?",
    ],
    preventiveChecks: [
      {
        check: "DUKIntegrator_version < latest",
        ifTrueAdvise: "Actualizează DUKIntegrator de pe anaf.ro înainte de validare — erori frecvente cu versiuni vechi.",
      },
      {
        check: "balanță_periodă_neînchisă",
        ifTrueAdvise: "Închide luna în soft contabil înainte — altfel jurnale vânzări/cumpărări vor fi incomplete.",
      },
    ],
    outputs: [
      "D406 XML structural valid (33 teste DUKIntegrator)",
      "Recipisă SPV ANAF arhivată",
    ],
    legalReferences: [
      { article: "OPANAF 1783/2021", law: "SAF-T D406", url: "https://anaf.ro/saft" },
      { article: "art. 336", law: "Cod Procedură Fiscală (amenzi)", url: "https://legislatie.just.ro" },
    ],
    steps: [
      {
        action: "extrage_jurnal_vanzari",
        description: "Export jurnal vânzări din soft contabil pentru perioada țintă",
        produces: ["jurnal_vanzari_xml"],
        estimatedMinutes: 2,
      },
      {
        action: "extrage_jurnal_cumparari",
        description: "Export jurnal cumpărări (achiziții interne + intracomunitare + import)",
        produces: ["jurnal_cumparari_xml"],
        estimatedMinutes: 2,
      },
      {
        action: "extrage_master_files",
        description: "Master files: parteneri, articole, mijloace fixe, plan conturi cu mapping",
        produces: ["master_files_xml"],
        estimatedMinutes: 2,
      },
      {
        action: "merge_in_d406",
        description: "Asamblează D406 complet în soft sau cu utilitar dedicat",
        requires: ["jurnal_vanzari_xml", "jurnal_cumparari_xml", "master_files_xml"],
        produces: ["d406_xml"],
        estimatedMinutes: 2,
      },
      {
        action: "valideaza_dukintegrator",
        description: "Rulează DUKIntegrator: 33 teste structurale. Corectează erori dacă apar.",
        requires: ["d406_xml"],
        produces: ["validation_passed"],
        estimatedMinutes: 3,
      },
      {
        action: "depune_in_spv",
        description: "Semnează XML cu token + depune prin SPV ANAF",
        requires: ["validation_passed"],
        produces: ["recipisa_D406"],
        estimatedMinutes: 2,
      },
    ],
  });

  // ==========================================================================
  // 4. Închidere lună (7 pași + adaos trimestrial)
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "inchidere_luna",
    title: "Închide luna contabilă",
    intent: "Trebuie să închid luna fiscală curentă pentru toți clienții",
    tags: ["închidere lună", "balanță", "TVA", "amortizare", "diferențe curs"],
    triggeredByPathId: "inchidere-luna",
    estimatedTimeManualMin: 20,
    estimatedTimeWithCopilotMin: 3,
    documentsRequired: [
      "Soft contabil cu drepturi închidere lună",
      "Balanță verificată",
      "Mijloace fixe actualizate (amortizare)",
      "Cursuri BNR ultima zi lucrătoare lună",
    ],
    preventiveChecks: [
      {
        check: "sold_371_negativ",
        ifTrueAdvise: "STOP — soldul 371 nu poate fi negativ. Verifică intrări/ieșiri și descărcare gestiune.",
      },
      {
        check: "jurnal_TVA_inconsistent_4428",
        ifTrueAdvise: "Reglare TVA necesară: jurnal TVA vânzări/cumpărări trebuie să corespundă cu soldurile 4428.TP/4428.TI.",
      },
    ],
    outputs: [
      "Note contabile generate pe 7 pași",
      "Balanță finală închisă",
      "(Trimester) Notă impozit profit + Registru fiscal",
      "(Trimester) Declarația D100 + recipisă",
      "(Anual) Declarația D101 + recipisă",
    ],
    legalReferences: [
      { article: "OMFP 1802/2014", law: "Reglementări contabile", url: "https://legislatie.just.ro" },
      { article: "art. 76", law: "Cod Fiscal Titlul II (impozit profit)", url: "https://legislatie.just.ro" },
    ],
    steps: [
      {
        action: "operatii_contabile_stocuri",
        description: "Înregistrare note contabile pentru mișcările de stocuri (gestiuni cant-val)",
        produces: ["note_stocuri"],
      },
      {
        action: "descarcare_marfuri_globala",
        description: "Generare note global-valorice cu coeficient K. Sold 371 ≥ 0.",
        requires: ["note_stocuri"],
        produces: ["note_descarcare"],
      },
      {
        action: "inchidere_TVA",
        description:
          "Note de regularizare TVA + compensare TVA plată/recuperat. Verifică jurnale vs solduri 4428.",
        requires: ["note_descarcare"],
        produces: ["note_tva", "decont_d300_pregatit"],
      },
      {
        action: "cheltuieli_venituri_avans",
        description: "Transfer lunar pe costuri/venituri din 471/472.",
        requires: ["note_tva"],
        produces: ["note_avans"],
      },
      {
        action: "amortizare_imobilizari",
        description: "Note amortizare format 16811=280x, 26811=281x.",
        requires: ["note_avans"],
        produces: ["note_amortizare"],
      },
      {
        action: "inchidere_venituri_cheltuieli",
        description: "Transfer prin contul 121 (profit/pierdere) cu analitică per an.",
        requires: ["note_amortizare"],
        produces: ["balanta_inainte_de_curs"],
      },
      {
        action: "calcul_diferente_curs",
        description: "Reevaluare conturi în valută la curs BNR. Note auto, nu manuale.",
        requires: ["balanta_inainte_de_curs"],
        produces: ["balanta_lunii_inchisa"],
      },
      {
        action: "trimestru_impozit_profit",
        description:
          "Doar martie/iunie/septembrie/decembrie. Calcul impozit + nota contabilă + registru fiscal.",
        requires: ["balanta_lunii_inchisa"],
        produces: ["nota_impozit_profit", "registru_fiscal"],
      },
      {
        action: "trimestru_d100",
        description: "Declarația 100 (obligații la buget) + OP/FV.",
        requires: ["nota_impozit_profit"],
        produces: ["recipisa_d100"],
      },
      {
        action: "anual_d101",
        description: "Doar decembrie. Declarația 101 anual + verificare manuală.",
        requires: ["balanta_lunii_inchisa", "recipisa_d100"],
        produces: ["recipisa_d101"],
      },
    ],
  });

  // ==========================================================================
  // 5. Răspuns notificare e-TVA (20 zile legal deadline)
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "raspuns_notificare_etva",
    title: "Răspunde la notificare e-TVA în 20 zile",
    intent: "Am primit notificare ANAF e-TVA cu diferențe între decont precompletat și D300 depus",
    tags: ["e-TVA", "notificare", "D300", "D394"],
    estimatedTimeManualMin: 120,
    estimatedTimeWithCopilotMin: 15,
    documentsRequired: [
      "Notificare e-TVA (PDF din SPV)",
      "D300 depus pentru perioadă",
      "Jurnal vânzări + cumpărări lună",
      "D394 dacă există",
    ],
    preventiveChecks: [
      {
        check: "termen_20_zile_aproape",
        ifTrueAdvise: "URGENT — termenul de 20 zile începe la primirea notificării în SPV. Verifică data exactă.",
      },
    ],
    outputs: [
      "Răspuns oficial SPV cu justificări",
      "(Opțional) Decont rectificativ D300",
      "Recipisă răspuns arhivată",
    ],
    legalReferences: [
      { article: "OUG 70/2024", law: "RO e-TVA", url: "https://monitoruloficial.ro" },
      { article: "OUG 13/2026", law: "Abrogare sancțiune (notificarea rămâne)", url: "https://monitoruloficial.ro" },
    ],
    steps: [
      {
        action: "analiza_diferente",
        description: "Compară decont precompletat ANAF cu D300 depus",
        produces: ["lista_diferente"],
      },
      {
        action: "verifica_facturi_lipsa",
        description: "Verifică în jurnal vânzări/cumpărări dacă există facturi lipsă",
        requires: ["lista_diferente"],
        produces: ["explicatii_justificative"],
      },
      {
        action: "pregateste_raspuns_oficial",
        description:
          "Pregătește răspuns oficial prin SPV sau (dacă e cazul) decont rectificativ",
        requires: ["explicatii_justificative"],
        produces: ["raspuns_pregatit"],
      },
      {
        action: "depune_in_spv",
        description: "Depune răspuns prin SPV (în 20 zile de la primire notificare)",
        requires: ["raspuns_pregatit"],
        produces: ["recipisa_raspuns"],
      },
    ],
  });

  // ==========================================================================
  // 6. Factură fantomă SPV — obiecție 7 zile (CRITICAL deadline legal)
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "obiectie_factura_fantoma_spv",
    title: "Obiectează factură fantomă în SPV (7 zile)",
    intent: "Am primit o factură în SPV care nu-mi aparține (CUI greșit) sau e duplicat",
    tags: ["e-Factura", "SPV", "obiecție", "fantomă"],
    estimatedTimeManualMin: 60,
    estimatedTimeWithCopilotMin: 10,
    documentsRequired: [
      "PDF factură primită în SPV",
      "Datele de identificare ale emitentului (CIF, denumire)",
      "Dovada că nu există relație comercială (opțional, util)",
    ],
    questionsToAskClient: [
      "Cunoști firma emitentă? Există vreo relație comercială?",
      "Sumă/serie corespunde cu o factură legitimă?",
      "În ce dată a apărut în SPV?",
    ],
    preventiveChecks: [
      {
        check: "termen_obiectie_aproape_7_zile",
        ifTrueAdvise: "URGENT — fereastra de obiecție este DOAR 7 zile lucrătoare de la apariție în SPV. După termen, factura devine validă fiscal!",
      },
    ],
    outputs: [
      "Formular obiecție e-Factura completat",
      "Trimitere SPV obiecție",
      "Confirmare arhivată",
    ],
    legalReferences: [
      { article: "OUG 120/2021", law: "Sistemul e-Factura", url: "https://monitoruloficial.ro" },
    ],
    steps: [
      {
        action: "verifica_legitimitate_factura",
        description: "Verifică în softul tău dacă factura corespunde unei tranzacții reale",
        produces: ["status_legitimitate"],
        estimatedMinutes: 3,
      },
      {
        action: "contacteaza_emitentul",
        description: "Sună emitentul, cere stornare voluntară. Dacă acceptă, mai simplu decât obiecție SPV.",
        requires: ["status_legitimitate"],
        produces: ["raspuns_emitent"],
        estimatedMinutes: 2,
      },
      {
        action: "depune_obiectie_spv",
        description: "Dacă emitent refuză: completează Formular Obiecție e-Factura în SPV. Termen STRICT 7 zile lucrătoare.",
        requires: ["raspuns_emitent"],
        produces: ["obiectie_depusa"],
        estimatedMinutes: 3,
      },
      {
        action: "arhiveaza_dovada",
        description: "Arhivează recipisa SPV pentru obiecție. Folosește la D394 dacă apare neconcordanță.",
        requires: ["obiectie_depusa"],
        produces: ["dovada_arhivata"],
        estimatedMinutes: 1,
      },
    ],
  });

  // ==========================================================================
  // 7. Rectificativă D205 (risc dublare sume la dividende interimare)
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "rectificativa_d205",
    title: "Rectifică D205 fără să dublezi sumele",
    intent: "Trebuie să corectez D205 — au apărut erori, declarare incompletă sau coproprietari neidentificați",
    tags: ["D205", "rectificativă", "dividende", "coproprietari"],
    estimatedTimeManualMin: 90,
    estimatedTimeWithCopilotMin: 15,
    documentsRequired: [
      "D205 original depus (recipisă SPV)",
      "Stat dividende original",
      "Date corecte coproprietari (dacă e cazul)",
      "OP-uri impozit reținut",
    ],
    questionsToAskClient: [
      "Ce informație lipsește sau e greșită în D205 inițial?",
      "Există coproprietari nedeclarați (sume împărțite)?",
      "Sumele declarate corespund cu OP-urile virate?",
    ],
    preventiveChecks: [
      {
        check: "rectificativa_contine_pozitii_corecte",
        ifTrueAdvise: "ATENȚIE — rectificativa CUMULEAZĂ, NU înlocuiește. Include doar pozițiile MODIFICATE + cele noi, nu și cele deja corecte. Risc dublare!",
      },
    ],
    outputs: [
      "D205 rectificativă (XML)",
      "Recipisă SPV nouă",
      "Cross-check cu D100 vechi (sume identice)",
    ],
    legalReferences: [
      { article: "OPANAF 587/2016", law: "Formular D205", url: "https://anaf.ro" },
      { article: "art. 132", law: "Cod Fiscal — declarații informative", url: "https://legislatie.just.ro" },
    ],
    steps: [
      {
        action: "analiza_eroare_D205_initial",
        description: "Identifică EXACT ce e greșit: poziție lipsă? sumă incorectă? coproprietari?",
        produces: ["lista_corectii"],
        estimatedMinutes: 5,
      },
      {
        action: "identifica_pozitii_de_inclus",
        description: "Numai pozițiile CORECTATE sau NOI. NU re-incluzi pozițiile corecte (cauzează dublare).",
        requires: ["lista_corectii"],
        produces: ["pozitii_rectificate"],
        estimatedMinutes: 4,
      },
      {
        action: "completeaza_d205_rectificativa",
        description: "Bifează 'rectificativă'. Adaugă pozițiile identificate. Total = OP-uri virate.",
        requires: ["pozitii_rectificate"],
        produces: ["d205_xml_rectificativ"],
        estimatedMinutes: 4,
      },
      {
        action: "valideaza_si_depune",
        description: "Validare DUKIntegrator + depunere SPV",
        requires: ["d205_xml_rectificativ"],
        produces: ["recipisa_rectificativa"],
        estimatedMinutes: 2,
      },
    ],
  });

  // ==========================================================================
  // 8. Casa de marcat (înregistrare AMEF) — pentru cei la prag rulaj
  // ==========================================================================
  await upsertProcedure({
    orgId,
    name: "inregistrare_casa_marcat",
    title: "Înregistrează casă de marcat (AMEF) la ANAF",
    intent: "Am atins pragul de rulaj care impune casă de marcat — trebuie procedură completă",
    tags: ["casa-marcat", "AMEF", "ANAF", "OG 28/1999"],
    triggeredByPathId: "casa-marcat-prag",
    estimatedTimeManualMin: 180,
    estimatedTimeWithCopilotMin: 30,
    documentsRequired: [
      "AMEF achiziționat de la distribuitor autorizat",
      "CIF firmă + adresa punctului de lucru",
      "Cont SPV activ",
    ],
    questionsToAskClient: [
      "Tipul activității (comerț cu amănuntul, HoReCa, servicii)?",
      "Punct de lucru declarat la ONRC?",
      "Are conexiune internet (pentru raportare Z online)?",
    ],
    preventiveChecks: [
      {
        check: "punct_lucru_neinregistrat_ONRC",
        ifTrueAdvise: "Înregistrează punctul de lucru la ONRC ÎNAINTE — AMEF se atribuie pe punct de lucru concret.",
      },
    ],
    outputs: [
      "Cerere atribuire număr unic AMEF (în SPV)",
      "Confirmare ANAF cu seria și numărul AMEF",
      "Profil fiscal AMEF activat",
      "Configurare raportare Z lunară",
    ],
    legalReferences: [
      { article: "OG 28/1999", law: "Casa de marcat", url: "https://legislatie.just.ro" },
      { article: "OPANAF 4156/2017", law: "Procedură AMEF", url: "https://anaf.ro" },
    ],
    steps: [
      {
        action: "achizitioneaza_amef",
        description: "Cumpără AMEF de la distribuitor autorizat (verificat pe lista ANAF)",
        produces: ["amef_fizica"],
        estimatedMinutes: 5,
      },
      {
        action: "cerere_numar_unic",
        description: "Completează cerere atribuire număr unic AMEF în SPV (form C801)",
        requires: ["amef_fizica"],
        produces: ["cerere_depusa"],
        estimatedMinutes: 5,
      },
      {
        action: "primeste_serie_numar_anaf",
        description: "Așteaptă confirmare ANAF cu serie + număr (2-5 zile lucrătoare)",
        requires: ["cerere_depusa"],
        produces: ["serie_amef"],
        estimatedMinutes: 1,
      },
      {
        action: "fiscalizare_si_activare",
        description: "Distribuitor face fiscalizarea + activează profil fiscal AMEF",
        requires: ["serie_amef"],
        produces: ["amef_fiscalizata"],
        estimatedMinutes: 10,
      },
      {
        action: "configurare_raportare_z",
        description: "Setează raportare Z zilnică/lunară. Asigură conexiune internet pentru transmitere ANAF.",
        requires: ["amef_fiscalizata"],
        produces: ["amef_operational"],
        estimatedMinutes: 5,
      },
    ],
  });
}

export { successRate };
