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
}

/**
 * Creează o procedure nouă sau o caută pe name.
 */
export async function upsertProcedure(input: UpsertProcedureInput): Promise<ProcedureRecord> {
  let result!: ProcedureRecord;
  await writeMemory(input.orgId, (snap) => {
    const now = Date.now() / 1000;
    const existing = snap.procedures.find((p) => p.name === input.name);

    if (existing) {
      existing.steps = input.steps;
      if (input.tags) existing.tags = input.tags;
      result = existing;
    } else {
      const rec: ProcedureRecord = {
        id: `proc_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        orgId: input.orgId,
        name: input.name,
        steps: input.steps,
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
 */
export async function seedDefaultProcedures(orgId: string): Promise<void> {
  // Procedura 1: Distribuire dividende
  await upsertProcedure({
    orgId,
    name: "distribuire_dividende",
    tags: ["dividende", "SRL", "D205", "D100", "AGA"],
    steps: [
      {
        action: "convoca_AGA",
        description: "Convoacă AGA pentru aprobarea distribuirii",
        requires: ["situatie_financiara_aprobata"],
        produces: ["aga_aprobata"],
      },
      {
        action: "intocmeste_stat_dividende",
        description: "Întocmește stat dividende per asociat",
        requires: ["aga_aprobata", "registrul_asociatilor"],
        produces: ["stat_dividende"],
      },
      {
        action: "retine_impozit_8pct",
        description: "Reține impozit pe dividende 8% la sursă",
        requires: ["stat_dividende"],
        produces: ["impozit_retinut"],
      },
      {
        action: "vireaza_la_anaf",
        description: "Virează impozit prin OP la ANAF",
        requires: ["impozit_retinut"],
        produces: ["op_virat"],
      },
      {
        action: "declara_D100",
        description: "Declară D100 până 25 ale lunii următoare",
        requires: ["op_virat"],
        produces: ["recipisa_D100"],
      },
      {
        action: "declara_D205",
        description: "Declară D205 până 28/29 februarie anul următor",
        requires: ["stat_dividende", "recipisa_D100"],
        produces: ["recipisa_D205"],
      },
    ],
  });

  // Procedura 2: Depunere SAF-T D406
  await upsertProcedure({
    orgId,
    name: "depunere_SAF_T",
    tags: ["SAF-T", "D406", "DUKIntegrator"],
    steps: [
      {
        action: "extrage_jurnal_vanzari",
        description: "Extrage jurnal vânzări din soft contabil",
        produces: ["jurnal_vanzari_xml"],
      },
      {
        action: "extrage_jurnal_cumparari",
        description: "Extrage jurnal cumpărări din soft contabil",
        produces: ["jurnal_cumparari_xml"],
      },
      {
        action: "extrage_master_files",
        description: "Extrage master files (clienți, furnizori, articole, mijloace fixe)",
        produces: ["master_files_xml"],
      },
      {
        action: "merge_in_d406",
        description: "Asamblează SAF-T D406 XML",
        requires: ["jurnal_vanzari_xml", "jurnal_cumparari_xml", "master_files_xml"],
        produces: ["d406_xml"],
      },
      {
        action: "valideaza_dukintegrator",
        description: "Validează cu DUKIntegrator (33 teste structurale)",
        requires: ["d406_xml"],
        produces: ["validation_passed"],
      },
      {
        action: "depune_in_spv",
        description: "Depune prin SPV ANAF",
        requires: ["validation_passed"],
        produces: ["recipisa_D406"],
      },
    ],
  });

  // Procedura 3: Închidere lună (7 pași + adaos trimestrial)
  await upsertProcedure({
    orgId,
    name: "inchidere_luna",
    tags: ["închidere lună", "balanță", "TVA", "amortizare", "diferențe curs"],
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

  await upsertProcedure({
    orgId,
    name: "raspuns_notificare_etva",
    tags: ["e-TVA", "notificare", "D300", "D394"],
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
}

export { successRate };
