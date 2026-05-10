// Sprint 6.2 — Cron lunar P300 vs D300 automat.
//
// ANAF publică P300 (declarația 300 pre-completată) după închiderea unei
// luni fiscale, de obicei între zilele 10-15 ale lunii N+1. Acest cron
// rulează zilnic în acest interval, ia ultima D300 din state și încearcă
// să compare cu P300.
//
// Realitate ANAF: ENDPOINT-ul P300 nu e public încă (necesită cont
// fiscal SPV cu acord scris). Pentru acum, cron-ul:
//   1. Identifică orgs cu integrare ANAF + filingRecords D300
//   2. Pentru fiecare D300 nou (din ultima lună), creează un FINDING
//      preventiv „verifică manual P300 în SPV" — alertă proactivă
//   3. Când endpoint P300 ANAF devine accesibil, înlocuim manual check
//      cu apel real (TODO marker în cod)
//
// Schedule: zilnic 09:00 RO între ziua 10-20 a lunii.

import { NextResponse } from "next/server"

import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  type FilingRecord,
} from "@/lib/compliance/filing-discipline"
import { makeResolution } from "@/lib/compliance/finding-resolution"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

type StateWithFilings = ComplianceState & { filingRecords?: FilingRecord[] }

const P300_PROMPT_FINDING_PREFIX = "etva-p300-prompt-"

function previousMonthPeriod(nowISO: string): string {
  const d = new Date(nowISO)
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - 1)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

function buildP300PromptFinding(
  period: string,
  d300FilingId: string,
  nowISO: string,
): ScanFinding {
  return {
    id: `${P300_PROMPT_FINDING_PREFIX}${period}`,
    title: `RO e-TVA: Verifică P300 pre-completat ANAF — ${period}`,
    detail: `Pentru perioada ${period}, ANAF a publicat (sau urmează să publice) declarația 300 pre-completată (P300). Compară valorile cu D300-ul depus de tine pentru a evita notificarea oficială cu termen 20 zile. Folosește comparator-ul preventiv din /dashboard/fiscal → Discrepanțe e-TVA. (Sursa D300 internă: ${d300FilingId})`,
    category: "E_FACTURA",
    severity: "medium",
    risk: "low",
    principles: ["accountability"],
    createdAtISO: nowISO,
    sourceDocument: `D300 ${period}`,
    legalReference: "OUG 70/2024 (modif. 89/2025) · Cod Fiscal Art. 105",
    remediationHint:
      "Descarcă P300 din SPV ANAF (Mesaje > Declarații pre-completate), introdu valorile în comparator-ul CompliScan, decide dacă rectifici preventiv sau aștepți notificarea oficială.",
    resolution: makeResolution(
      `P300 publicat de ANAF pentru perioada ${period} — verificare preventivă recomandată.`,
      "Lipsa comparării preventive duce la primirea unei notificări oficiale ANAF cu termen 20 zile răspuns + posibile penalități subdeclarare.",
      "Descarcă P300 din SPV, rulează comparator-ul, dacă diferența >20% AND ≥5K RON → depune D300 rectificativă.",
      {
        humanStep: "Contabilul descarcă P300 din SPV și rulează comparatorul în CompliScan.",
        closureEvidence: "Snapshot comparator P300 vs D300 sub pragul ANAF, sau D300 rectificativă depusă.",
        revalidation: "Lunar, în jur de ziua 15 a lunii următoare.",
      },
    ),
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const nowISO = new Date().toISOString()
  const nowDay = new Date(nowISO).getUTCDate()

  // Fereastră eligibilă: zilele 10-20 ale lunii (când ANAF publică P300)
  if (nowDay < 10 || nowDay > 20) {
    return NextResponse.json({
      skipped: true,
      reason: `Outside P300 publishing window (day ${nowDay}, eligible 10-20).`,
      timestamp: nowISO,
    })
  }

  const targetPeriod = previousMonthPeriod(nowISO)
  const orgIds = await listAllOrgIds()

  let processed = 0
  let promptedFindings = 0
  let alreadyChecked = 0
  let skipped = 0

  for (const orgId of orgIds) {
    try {
      const state = (await readStateForOrg(orgId)) as StateWithFilings | null
      if (!state) continue

      const filings = state.filingRecords ?? []
      const d300Filing = filings.find(
        (r) => r.type === "d300_tva" && r.period === targetPeriod && r.status !== "missing" && r.status !== "upcoming",
      )

      if (!d300Filing) {
        skipped++
        continue
      }

      // Skip dacă deja a făcut comparator real (există finding etva-p300-prevent-{period})
      const hasRealCheck = (state.findings ?? []).some(
        (f) => f.id === `etva-p300-prevent-${targetPeriod}`,
      )
      if (hasRealCheck) {
        alreadyChecked++
        continue
      }

      // Skip dacă prompt-ul deja există (nu duplicăm)
      const promptId = `${P300_PROMPT_FINDING_PREFIX}${targetPeriod}`
      const hasPrompt = (state.findings ?? []).some((f) => f.id === promptId)
      if (hasPrompt) {
        alreadyChecked++
        continue
      }

      const newFinding = buildP300PromptFinding(targetPeriod, d300Filing.id, nowISO)

      const auditEvent = createComplianceEvent(
        {
          type: "fiscal.p300_prompt_generated",
          entityType: "system",
          entityId: promptId,
          message: `Cron P300: prompt preventiv generat pentru perioada ${targetPeriod} (D300 sursă: ${d300Filing.id}).`,
          createdAtISO: nowISO,
          metadata: {
            period: targetPeriod,
            d300FilingId: d300Filing.id,
          },
        },
        systemEventActor("CompliScan p300-monthly-check cron"),
      )

      const updated: ComplianceState = {
        ...state,
        findings: [...(state.findings ?? []), newFinding],
        events: appendComplianceEvents(state, [auditEvent]),
      }

      await writeStateForOrg(orgId, updated)
      processed++
      promptedFindings++
    } catch (err) {
      console.error(`[p300-monthly-check] org ${orgId} failed:`, err)
    }
  }

  return NextResponse.json({
    processed,
    promptedFindings,
    alreadyChecked,
    skipped,
    targetPeriod,
    timestamp: nowISO,
  })
}
