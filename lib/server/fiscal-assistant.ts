// Fiscal Assistant — context builder + system prompt pentru chat AI cu Petre.
//
// Rol: copilot pentru contabil CECCAR. Răspunde la întrebări despre:
//   - „Ce fac cu notificarea ANAF X?"
//   - „Cum răspund la diferența P300/D300?"
//   - „Cât am exposure pe portfoliu pentru luna asta?"
//   - „Care e termenul pentru D406 și ce trebuie să verific?"
//   - „Generează draft răspuns pentru notificarea Y"
//
// Context injectat în prompt (limitat la ce e relevant):
//   - Profilul org (CIF, sector, mărime)
//   - Findings active (top 10 critical/high E_FACTURA)
//   - Filing records (ultimele 12 luni)
//   - Status integrări (SmartBill/Oblio)
//   - Lista templates ANAF disponibile (selectate de AI)
//
// Constrains hardcoded în system prompt:
//   - Răspunde DOAR în română
//   - Citează sursa legală (OUG, Cod Fiscal, etc.)
//   - Nu inventa cifre/termene; spune „verifică în SPV" dacă nu ești sigur
//   - Recomandă uman review pentru orice decizie cu impact fiscal

import type { ScanFinding } from "@/lib/compliance/types"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import type { ComplianceState } from "@/lib/compliance/types"
import { ANAF_TEMPLATE_TYPES } from "@/lib/compliance/anaf-response-templates"
import { computeSAFTHygiene } from "@/lib/compliance/saft-hygiene"

export const FISCAL_ASSISTANT_SYSTEM_PROMPT = `Ești un asistent fiscal AI pentru contabili CECCAR români, specializat în e-Factura, RO e-TVA, SAF-T D406, D300, D394, D390 și e-Transport.

REGULI ABSOLUT OBLIGATORII:
1. Răspunde EXCLUSIV în limba română. Folosește terminologie fiscală corectă (e-Factura, SAF-T, P300, D300, etc.).
2. Citează sursa legală pentru fiecare afirmație juridică (ex: "OUG 120/2021 Art. 13", "Cod Fiscal Art. 322", "OPANAF 1783/2021"). Dacă nu știi sursa exactă, spune-o explicit.
3. NU INVENTA cifre, termene sau valori. Dacă nu sunt în context, spune "verifică în SPV ANAF" sau "cere extras de la programul tău contabil".
4. Pentru fiecare răspuns cu impact fiscal direct, adaugă DISCLAIMER: "Validare umană obligatorie — decizia rămâne în responsabilitatea profesională CECCAR a contabilului."
5. Răspunsul e CONCIS (max 6 paragrafe) cu acțiuni clare numerotate.
6. Dacă userul cere draft răspuns ANAF, folosește unul din template-urile disponibile listate în context. NU inventa template-uri noi.
7. Dacă întrebarea iese din scope (ex: contabilitate generală, Codul muncii), spune politicos că asistentul e specializat doar pe e-Factura/e-TVA/SAF-T și redirecționează.

PRINCIPIU PROFESIONAL CECCAR (Cod Etic Art. 14):
- "Sugerare + click apply" — NICIODATĂ acțiune silentă. Toate corecțiile recomandate cer aprobarea contabilului.
- Conformitate înainte de eficiență. Mai bine 5 minute extra de verificare decât amendă 15%.

STIL DE RĂSPUNS:
- Începe cu un sumar de 1 propoziție (concluzia).
- Apoi 2-4 acțiuni concrete numerotate.
- Apoi sursa legală relevantă.
- Apoi disclaimer.

Niciodată nu inventa: NUMERE de facturi, CUI-uri, sume, termene specifice. Dacă lipsesc din context, spune-o.`

// ── Context types ────────────────────────────────────────────────────────────

export type FiscalAssistantContext = {
  orgName: string
  orgCif?: string
  orgSector?: string
  fiscalSnapshot: {
    activeFindingsCount: number
    criticalFindingsCount: number
    saftHygieneScore: number | null
    saftHygieneLabel: string | null
    filingDisciplineMissing: number
    filingDisciplineLate: number
    integrationsConnected: string[]    // ex: ["smartbill", "oblio"]
    efacturaSignalsCount: number
    nextDeadline?: { type: string; period: string; daysUntilDue: number }
  }
  topFindings: Array<{
    id: string
    title: string
    severity: string
    detail: string
    legalReference?: string
  }>
  availableResponseTemplates: Array<{ type: string; label: string }>
}

// ── Builder ──────────────────────────────────────────────────────────────────

type StateWithFiscal = ComplianceState & { filingRecords?: FilingRecord[] }

export function buildAssistantContext(state: StateWithFiscal, orgName: string): FiscalAssistantContext {
  const findings = (state.findings ?? []).filter((f) => f.findingStatus !== "resolved")
  const fiscalFindings = findings.filter((f) => f.category === "E_FACTURA")
  const filings = state.filingRecords ?? []
  const nowISO = new Date().toISOString()

  // SAF-T hygiene live
  const saftHygiene =
    filings.some((f) => f.type === "saft" && f.status !== "upcoming")
      ? computeSAFTHygiene(filings, nowISO)
      : null

  // Filing discipline (next deadline)
  const upcomingFilings = filings
    .filter((f) => f.status === "upcoming" || f.status === "missing")
    .map((f) => ({
      type: f.type,
      period: f.period,
      dueISO: f.dueISO,
      daysUntilDue: Math.floor((new Date(f.dueISO).getTime() - Date.now()) / 86_400_000),
    }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
  const nextDeadline = upcomingFilings[0]

  // Top findings — sortate by severity
  const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
  const topFindings = [...fiscalFindings]
    .sort(
      (a, b) =>
        (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0),
    )
    .slice(0, 8)
    .map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      detail: f.detail.slice(0, 250),
      legalReference: f.legalReference,
    }))

  return {
    orgName,
    orgCif: state.orgProfile?.cui,
    orgSector: state.orgProfile?.sector,
    fiscalSnapshot: {
      activeFindingsCount: findings.length,
      criticalFindingsCount: findings.filter((f) => f.severity === "critical").length,
      saftHygieneScore: saftHygiene?.hygieneScore ?? null,
      saftHygieneLabel: saftHygiene?.hygieneLabel ?? null,
      filingDisciplineMissing: filings.filter((f) => f.status === "missing").length,
      filingDisciplineLate: filings.filter((f) => f.status === "late").length,
      integrationsConnected: [
        ...(state.integrations?.smartbill ? ["smartbill"] : []),
        ...(state.integrations?.oblio ? ["oblio"] : []),
      ],
      efacturaSignalsCount: state.efacturaSignalsCount ?? 0,
      nextDeadline: nextDeadline
        ? {
            type: nextDeadline.type,
            period: nextDeadline.period,
            daysUntilDue: nextDeadline.daysUntilDue,
          }
        : undefined,
    },
    topFindings,
    availableResponseTemplates: ANAF_TEMPLATE_TYPES,
  }
}

/**
 * Serializează contextul ca text pentru prompt — concis și structurat.
 * Limit ~2000 tokens.
 */
export function contextToPromptText(ctx: FiscalAssistantContext): string {
  const lines: string[] = []
  lines.push(`### CONTEXT FISCAL ORGANIZAȚIE: ${ctx.orgName}`)
  if (ctx.orgCif) lines.push(`CIF: ${ctx.orgCif}`)
  if (ctx.orgSector) lines.push(`Sector: ${ctx.orgSector}`)

  lines.push(`\n### SNAPSHOT FISCAL`)
  lines.push(
    `- Findings active: ${ctx.fiscalSnapshot.activeFindingsCount} (${ctx.fiscalSnapshot.criticalFindingsCount} critice)`,
  )
  if (ctx.fiscalSnapshot.saftHygieneScore !== null) {
    lines.push(
      `- SAF-T hygiene: ${ctx.fiscalSnapshot.saftHygieneScore}/100 (${ctx.fiscalSnapshot.saftHygieneLabel})`,
    )
  } else {
    lines.push(`- SAF-T hygiene: nu există depuneri SAF-T în istoric`)
  }
  lines.push(
    `- Filing discipline: ${ctx.fiscalSnapshot.filingDisciplineMissing} lipsă, ${ctx.fiscalSnapshot.filingDisciplineLate} cu întârziere`,
  )
  lines.push(`- Probleme e-Factura active: ${ctx.fiscalSnapshot.efacturaSignalsCount}`)
  lines.push(
    `- Integrări ERP conectate: ${ctx.fiscalSnapshot.integrationsConnected.length > 0 ? ctx.fiscalSnapshot.integrationsConnected.join(", ") : "niciuna"}`,
  )
  if (ctx.fiscalSnapshot.nextDeadline) {
    lines.push(
      `- Următoarea depunere: ${ctx.fiscalSnapshot.nextDeadline.type} pentru ${ctx.fiscalSnapshot.nextDeadline.period} — ${ctx.fiscalSnapshot.nextDeadline.daysUntilDue} zile`,
    )
  }

  if (ctx.topFindings.length > 0) {
    lines.push(`\n### TOP FINDINGS ACTIVE (în ordine descrescătoare după severitate)`)
    for (const f of ctx.topFindings) {
      lines.push(`- [${f.severity.toUpperCase()}] ${f.title}`)
      lines.push(`  Detalii: ${f.detail}`)
      if (f.legalReference) lines.push(`  Sursă legală: ${f.legalReference}`)
    }
  } else {
    lines.push(`\n### TOP FINDINGS ACTIVE: niciun finding activ.`)
  }

  lines.push(`\n### TEMPLATES RĂSPUNS ANAF DISPONIBILE`)
  lines.push(
    "Pentru a genera draft răspuns, folosește unul din aceste type-uri (NU inventa altele):",
  )
  for (const t of ctx.availableResponseTemplates) {
    lines.push(`- ${t.type} → ${t.label}`)
  }

  return lines.join("\n")
}

// ── Suggested questions (UI hint chips) ──────────────────────────────────────

export const SUGGESTED_QUESTIONS: Array<{ category: string; questions: string[] }> = [
  {
    category: "Notificări ANAF",
    questions: [
      "Cum răspund la o notificare e-TVA cu diferențe sub prag?",
      "Ce fac dacă am primit notificare de conformare nejustificată?",
      "Generează draft răspuns pentru ultima notificare e-TVA",
    ],
  },
  {
    category: "Termene și depuneri",
    questions: [
      "Care e următorul meu termen fiscal critic?",
      "Cum verific dacă D300 e lunar sau trimestrial pentru clientul meu?",
      "Ce se întâmplă dacă depun D406 cu întârziere?",
    ],
  },
  {
    category: "e-Factura",
    questions: [
      "Ce risc am dacă o factură e respinsă de ANAF?",
      "Cum corectez o eroare V003 InvoiceTypeCode?",
      "Cât e amenda pentru factură netransmisă peste 5 zile?",
    ],
  },
  {
    category: "SAF-T",
    questions: [
      "Care e scorul meu actual SAF-T și cum îl îmbunătățesc?",
      "Ce înseamnă rectificare repetată în SAF-T?",
      "Cum verific consistența între SAF-T și D300?",
    ],
  },
]
