// GAP #4 (Sprint 3) — D406 SAF-T XML upload + parse + hygiene compute.
//
// POST: client trimite conținutul XML (text). Server-side:
//   1. Parse metadata SAF-T (period, dateCreated, cif, isRectification)
//   2. Construim FilingRecord (saft) și îl adăugăm la state.filingRecords
//   3. Rulăm computeSAFTHygiene + buildSAFTHygieneFindings pe totalul nou
//   4. Înlocuim stale findings SAF-T-hygiene cu cele fresh
//   5. Marcăm d406EvidenceSubmitted = true (rezolvă registration finding)
//   6. Audit log în events
//   7. Returnăm hygiene + erori/warnings parser
//
// GET: returnează ultimul status hygiene fără să modifice state.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import { parseSaftMetadata, saftMetadataToFilingRecord } from "@/lib/compliance/saft-xml-parser"
import {
  computeSAFTHygiene,
  buildSAFTHygieneFindings,
} from "@/lib/compliance/saft-hygiene"
import { validateSaftAccountStructure } from "@/lib/compliance/saft-account-validator"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

type StateWithFilings = ComplianceState & { filingRecords?: FilingRecord[] }

const SAFT_HYGIENE_FINDING_PREFIXES = ["saft-hygiene-", "saft-consistency-"]

function isStaleSaftHygieneFinding(id: string): boolean {
  return SAFT_HYGIENE_FINDING_PREFIXES.some((p) => id.startsWith(p))
}

// ── GET — return current SAF-T hygiene snapshot ──────────────────────────────

export async function GET(request: Request) {
  const session = requireRole(request, [...READ_ROLES], "vizualizare SAF-T hygiene")
  const orgId = session.orgId
  const state = (await readStateForOrg(orgId)) as StateWithFilings | null
  if (!state) {
    return jsonError("Nu am putut încărca starea organizației active.", 500, "SAFT_STATE_UNAVAILABLE")
  }

  const records = state.filingRecords ?? []
  const nowISO = new Date().toISOString()
  const hygiene = computeSAFTHygiene(records, nowISO)
  const saftFilings = records.filter((r) => r.type === "saft")

  return NextResponse.json({
    hygiene,
    saftFilings,
    d406EvidenceSubmitted: state.d406EvidenceSubmitted ?? false,
  })
}

// ── POST — upload XML, parse, store FilingRecord, recompute hygiene ──────────

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "upload SAF-T D406")
  const orgId = session.orgId
  const orgName = session.orgName

  // Acceptăm body fie ca text XML direct, fie JSON cu { xml: "..." }
  const contentType = request.headers.get("content-type") ?? ""
  let xml = ""
  let fileName: string | undefined
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { xml?: string; fileName?: string }
      xml = body.xml ?? ""
      fileName = body.fileName
    } else {
      xml = await request.text()
    }
  } catch {
    return jsonError("Body invalid. Trimite XML text sau JSON { xml }.", 400, "SAFT_INVALID_BODY")
  }

  if (!xml || xml.trim().length === 0) {
    return jsonError("Conținutul XML lipsește din request.", 400, "SAFT_EMPTY_XML")
  }

  // Limită basic ca să nu primim 100 MB accidental
  if (xml.length > 50 * 1024 * 1024) {
    return jsonError("Fișier prea mare (> 50 MB). Comprimă și trimite în bucăți.", 413, "SAFT_TOO_LARGE")
  }

  // Parse metadata
  const meta = parseSaftMetadata(xml)

  // Pre-flight validare structură plan conturi (Sprint 7.1 wired)
  const accountFindings = validateSaftAccountStructure(xml)
  const accountErrors = accountFindings.filter((f) => f.severity === "error")

  // Dacă parser-ul a găsit erori critice SAU validatorul plan conturi
  // a găsit erori, refuzăm înregistrarea
  if (meta.errors.length > 0 || accountErrors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        errors: meta.errors,
        warnings: meta.warnings,
        accountValidation: accountFindings,
        meta: {
          period: meta.period,
          cif: meta.cif,
          isRectification: meta.isRectification,
        },
      },
      { status: 422 },
    )
  }

  const state = (await readStateForOrg(orgId)) as StateWithFilings | null
  if (!state) {
    return jsonError("Nu am putut încărca starea organizației active.", 500, "SAFT_STATE_UNAVAILABLE")
  }

  // Calculăm rectificationCount existent pentru aceeași perioadă
  const existingForPeriod = (state.filingRecords ?? []).filter(
    (r) => r.type === "saft" && r.period === meta.period,
  )
  const existingMaxRect = existingForPeriod.reduce(
    (max, r) => Math.max(max, r.rectificationCount ?? 0),
    0,
  )

  const nowISO = new Date().toISOString()
  const newRecord = saftMetadataToFilingRecord(meta, nowISO, existingMaxRect)

  // Pentru rectificări, cosmeticăm ID-ul cu count-ul ca să fie unic
  const recordWithUniqueId: FilingRecord = {
    ...newRecord,
    id: `saft-d406-${meta.period}-${nowISO.replace(/[^0-9]/g, "").slice(0, 14)}`,
  }

  const allFilings: FilingRecord[] = [...(state.filingRecords ?? []), recordWithUniqueId]

  // Recompute hygiene + findings pe noul total
  const hygiene = computeSAFTHygiene(allFilings, nowISO)
  const newFindings = buildSAFTHygieneFindings(hygiene, nowISO)

  // Înlocuim stale findings SAF-T-hygiene cu cele fresh; păstrăm restul findings
  const survivingFindings = (state.findings ?? []).map((f) =>
    f.id === "saft-d406-registration" && f.findingStatus !== "resolved"
      ? { ...f, findingStatus: "resolved" as const }
      : f,
  )
  const filteredFindings = survivingFindings.filter((f) => !isStaleSaftHygieneFinding(f.id))
  const mergedFindings = [...filteredFindings, ...newFindings]

  // Audit log event
  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "saft.upload",
      entityType: "system",
      entityId: recordWithUniqueId.id,
      message: `Upload SAF-T D406 pentru perioada ${meta.period}${meta.isRectification ? " (rectificare)" : ""}.`,
      createdAtISO: nowISO,
      metadata: {
        period: meta.period,
        cif: meta.cif ?? "",
        rectificationCount: recordWithUniqueId.rectificationCount ?? 0,
        isRectification: meta.isRectification,
        fileName: fileName ?? "",
        warnings: meta.warnings.join("; ").slice(0, 200),
      },
    },
    actor,
  )

  const updatedState: StateWithFilings = {
    ...state,
    filingRecords: allFilings,
    findings: mergedFindings,
    d406EvidenceSubmitted: true,
    events: appendComplianceEvents(state, [auditEvent]),
  }

  await writeStateForOrg(orgId, updatedState, orgName)

  return NextResponse.json({
    ok: true,
    filing: recordWithUniqueId,
    hygiene,
    findings: newFindings,
    warnings: meta.warnings,
    accountValidation: accountFindings,  // Sprint 7.1 — plan conturi pre-flight
    meta: {
      period: meta.period,
      reportingPeriodStart: meta.reportingPeriodStart,
      reportingPeriodEnd: meta.reportingPeriodEnd,
      dateCreated: meta.dateCreated,
      cif: meta.cif,
      isRectification: meta.isRectification,
      rectificationCount: meta.rectificationCount,
    },
  })
}
