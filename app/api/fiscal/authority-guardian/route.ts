// GET/POST/PATCH/DELETE /api/fiscal/authority-guardian (FC-10).
//
// Cabinet poate înregistra și gestiona:
//   - certificate digitale calificate (eIDAS + ANAF SPV token)
//   - împuterniciri SPV (form 270) + procuri notariale + mandate ONRC
// + primește alerte de expirare.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  generateCertId,
  generateGuardianAlerts,
  generateMandateId,
  refreshCertificateStatuses,
  refreshMandateStatuses,
  summarizeGuardian,
  type DigitalCertificate,
  type RepresentationMandate,
} from "@/lib/compliance/authority-mandate-guardian"
import type { ComplianceState } from "@/lib/compliance/types"

type StateExt = ComplianceState & {
  digitalCertificates?: DigitalCertificate[]
  representationMandates?: RepresentationMandate[]
}

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "vizualizare Authority Guardian",
    )
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const certs = refreshCertificateStatuses(state.digitalCertificates ?? [])
    const mandates = refreshMandateStatuses(state.representationMandates ?? [])
    const alerts = generateGuardianAlerts(certs, mandates)
    const summary = summarizeGuardian(certs, mandates, alerts)

    // Persist updated statuses
    const nextState: StateExt = {
      ...state,
      digitalCertificates: certs,
      representationMandates: mandates,
    }
    await writeStateForOrg(session.orgId, nextState as ComplianceState)

    return NextResponse.json({
      ok: true,
      certificates: certs,
      mandates,
      alerts,
      summary,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare Authority Guardian.",
      500,
      "GUARDIAN_FAILED",
    )
  }
}

type PostBody = {
  kind: "certificate" | "mandate"
  certificate?: Omit<DigitalCertificate, "id" | "status" | "registeredByEmail">
  mandate?: Omit<RepresentationMandate, "id" | "status" | "registeredByEmail">
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "creare element Guardian")
    const body = (await request.json()) as PostBody
    if (!body.kind) return jsonError("kind necesar.", 400, "GUARDIAN_KIND_REQUIRED")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    if (body.kind === "certificate") {
      if (!body.certificate) return jsonError("certificate payload necesar.", 400, "GUARDIAN_CERT_INVALID")
      const newCert: DigitalCertificate = {
        ...body.certificate,
        id: generateCertId(),
        status: "active",
        registeredByEmail: session.email,
      }
      const refreshed = refreshCertificateStatuses([...(state.digitalCertificates ?? []), newCert])
      const nextState: StateExt = { ...state, digitalCertificates: refreshed }
      await writeStateForOrg(session.orgId, nextState as ComplianceState)
      return NextResponse.json({ ok: true, certificate: refreshed.find((c) => c.id === newCert.id) })
    }

    if (body.kind === "mandate") {
      if (!body.mandate) return jsonError("mandate payload necesar.", 400, "GUARDIAN_MANDATE_INVALID")
      const newMandate: RepresentationMandate = {
        ...body.mandate,
        id: generateMandateId(),
        status: "active",
        registeredByEmail: session.email,
      }
      const refreshed = refreshMandateStatuses([...(state.representationMandates ?? []), newMandate])
      const nextState: StateExt = { ...state, representationMandates: refreshed }
      await writeStateForOrg(session.orgId, nextState as ComplianceState)
      return NextResponse.json({ ok: true, mandate: refreshed.find((m) => m.id === newMandate.id) })
    }

    return jsonError("kind invalid.", 400, "GUARDIAN_KIND_INVALID")
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare creare Guardian.",
      500,
      "GUARDIAN_CREATE_FAILED",
    )
  }
}

type DeleteBody = { kind: "certificate" | "mandate"; id: string }

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere element Guardian")
    const body = (await request.json()) as DeleteBody
    if (!body.kind || !body.id) return jsonError("kind + id necesar.", 400, "GUARDIAN_DEL_INVALID")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    if (body.kind === "certificate") {
      const certs = (state.digitalCertificates ?? []).filter((c) => c.id !== body.id)
      const nextState: StateExt = { ...state, digitalCertificates: certs }
      await writeStateForOrg(session.orgId, nextState as ComplianceState)
    } else {
      const mandates = (state.representationMandates ?? []).filter((m) => m.id !== body.id)
      const nextState: StateExt = { ...state, representationMandates: mandates }
      await writeStateForOrg(session.orgId, nextState as ComplianceState)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare ștergere Guardian.",
      500,
      "GUARDIAN_DEL_FAILED",
    )
  }
}
