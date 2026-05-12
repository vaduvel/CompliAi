// POST /api/findings/[id]/resolve
//
// Endpoint generic folosit de toate pattern-urile din Fiscal Resolve Cockpit
// (Pattern A/B/C/D/E/F/G/H/I) pentru a marca un finding ca rezolvat și a
// salva evidence + audit log.
//
// Body: {
//   evidence: {
//     type: "auto-fix-resubmit" | "manual-input" | "compare-decide" |
//           "doc-generated" | "upload" | "search-result" | "external-contact" |
//           "retransmit" | "skip-wait-confirmed" | "manual-attest"
//     [extra fields per type]
//   }
// }
//
// Behavior:
// 1. Verifică sesiune + găsește finding-ul în state
// 2. Marchează findingStatus="resolved" + findingStatusUpdatedAtISO=now
// 3. Adaugă entry în findingResolution + operationalEvidenceNote
// 4. Emit ComplianceEvent în state.events cu actor + evidence summary
// 5. Returnează { ok: true, finding }
//
// Faza 3.5 cleanup — wrapper peste PATCH /api/findings/[id] cu shape clean
// pentru pattern code.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { readFreshStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import type { ScanFinding } from "@/lib/compliance/types"

type EvidenceType =
  | "auto-fix-resubmit"
  | "manual-input"
  | "compare-decide"
  | "doc-generated"
  | "upload"
  | "search-result"
  | "external-contact"
  | "retransmit"
  | "skip-wait-confirmed"
  | "manual-attest"

type ResolveBody = {
  evidence?: {
    type?: EvidenceType
    [key: string]: unknown
  }
}

const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  "auto-fix-resubmit": "Auto-fix XML + retransmitere ANAF SPV",
  "manual-input": "Corecție manuală cu audit log CECCAR Art. 14",
  "compare-decide": "Decizie scenariu (recunosc / contest) după compare diff",
  "doc-generated": "Document generat de AI + trimis manual",
  upload: "Dovadă încărcată (cert nou / SAF-T XML / etc.)",
  "search-result": "Rezultat căutare aplicat (ANAF lookup / ERP search)",
  "external-contact": "Contact extern (împuternicire template trimis client)",
  retransmit: "Retransmitere XML existent la ANAF SPV",
  "skip-wait-confirmed": "Status confirmat ANAF după așteptare prelucrare",
  "manual-attest": "Atestare manuală — rezolvat extern",
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("State organizație negăsit.", 404, "NO_STATE")

    const findingIdx = state.findings.findIndex((f) => f.id === id)
    if (findingIdx === -1) return jsonError("Finding negăsit.", 404, "FINDING_NOT_FOUND")
    const finding = state.findings[findingIdx]

    const body = (await request.json().catch(() => ({}))) as ResolveBody
    const evidenceType = (body.evidence?.type ?? "manual-attest") as EvidenceType
    const evidenceLabel = EVIDENCE_TYPE_LABELS[evidenceType] ?? "Rezolvare manuală"

    const nowISO = new Date().toISOString()

    const updatedFinding: ScanFinding = {
      ...finding,
      findingStatus: "resolved",
      findingStatusUpdatedAtISO: nowISO,
      operationalEvidenceNote: evidenceLabel,
      resolution: {
        ...finding.resolution,
        problem: finding.resolution?.problem ?? finding.title,
        impact: finding.resolution?.impact ?? finding.detail,
        action: finding.resolution?.action ?? evidenceLabel,
        closureEvidence: evidenceLabel,
        reviewedAtISO: nowISO,
      },
    }

    state.findings[findingIdx] = updatedFinding

    // Audit event
    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "finding.resolved",
        entityType: "finding",
        entityId: finding.id,
        message: `Finding rezolvat (${finding.findingTypeId ?? finding.category}): ${evidenceLabel}`,
        createdAtISO: nowISO,
        metadata: {
          findingTypeId: finding.findingTypeId ?? "",
          category: finding.category,
          severity: finding.severity,
          evidenceType,
        },
      },
      actor,
    )
    state.events = appendComplianceEvents(state, [auditEvent])

    await writeStateForOrg(session.orgId, state, session.orgName)

    return NextResponse.json({ ok: true, finding: updatedFinding })
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la rezolvare.",
      500,
      "RESOLVE_FAILED",
    )
  }
}
