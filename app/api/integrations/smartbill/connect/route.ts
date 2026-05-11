// SmartBill — connect endpoint.
//
// User-ul paste email + token API SmartBill (din My Account > Integrations).
// Validăm credențialele apelând /series. Dacă e OK, salvăm în state.integrations.
//
// DELETE — disconnect (șterge tokenul).
// GET    — return status conexiune (fără să expunem tokenul).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { verifySmartBillCredentials } from "@/lib/integrations/smartbill-client"
import type { ComplianceState } from "@/lib/compliance/types"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

function maskToken(token: string): string {
  if (token.length <= 8) return "***"
  return `${token.slice(0, 4)}…${token.slice(-4)}`
}

// ── GET — return connection status (no secrets) ──────────────────────────────

export async function GET(request: Request) {
  const session = requireRole(request, [...READ_ROLES], "vizualizare conexiune SmartBill")
  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const sb = state.integrations?.smartbill
  if (!sb) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    email: sb.email,
    cif: sb.cif,
    tokenMasked: maskToken(sb.token),
    connectedAtISO: sb.connectedAtISO,
    lastSyncAtISO: sb.lastSyncAtISO ?? null,
    lastSyncCount: sb.lastSyncCount ?? 0,
    lastSyncError: sb.lastSyncError ?? null,
  })
}

// ── POST — connect (validate + store) ────────────────────────────────────────

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "conectare SmartBill")

  let body: { email?: string; token?: string; cif?: string }
  try {
    body = (await request.json()) as { email?: string; token?: string; cif?: string }
  } catch {
    return jsonError("Body invalid (așteptăm JSON).", 400, "SB_INVALID_BODY")
  }

  const email = body.email?.trim()
  const token = body.token?.trim()
  const cif = body.cif?.replace(/^RO/i, "").replace(/\D/g, "")

  if (!email || !email.includes("@")) {
    return jsonError("Email SmartBill invalid.", 400, "SB_INVALID_EMAIL")
  }
  if (!token || token.length < 10) {
    return jsonError("Token SmartBill invalid (minim 10 caractere).", 400, "SB_INVALID_TOKEN")
  }
  if (!cif || cif.length < 6) {
    return jsonError("CUI invalid — folosește formatul numeric (ex: 12345678).", 400, "SB_INVALID_CIF")
  }

  // Validează credențialele cu apel real la SmartBill /series
  const verification = await verifySmartBillCredentials({ email, token, cif })
  if (!verification.ok) {
    return jsonError(
      `Validare SmartBill eșuată: ${verification.error.message}`,
      verification.error.httpStatus === 401 || verification.error.httpStatus === 403 ? 401 : 502,
      verification.error.code,
    )
  }

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "integration.smartbill.connected",
      entityType: "integration",
      entityId: "smartbill",
      message: `SmartBill conectat (${email}, CIF ${cif}). ${verification.data.seriesCount} serii detectate.`,
      createdAtISO: nowISO,
      metadata: {
        email,
        cif,
        seriesCount: verification.data.seriesCount,
      },
    },
    actor,
  )

  const updated: ComplianceState = {
    ...state,
    integrations: {
      ...(state.integrations ?? {}),
      smartbill: {
        email,
        token,
        cif,
        connectedAtISO: nowISO,
      },
    },
    events: appendComplianceEvents(state, [auditEvent]),
  }

  await writeStateForOrg(session.orgId, updated, session.orgName)

  return NextResponse.json({
    ok: true,
    connectedAtISO: nowISO,
    seriesCount: verification.data.seriesCount,
  })
}

// ── DELETE — disconnect ──────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "deconectare SmartBill")

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const sb = state.integrations?.smartbill
  if (!sb) {
    return NextResponse.json({ ok: true, alreadyDisconnected: true })
  }

  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "integration.smartbill.disconnected",
      entityType: "integration",
      entityId: "smartbill",
      message: `SmartBill deconectat (${sb.email}). Tokenul a fost șters.`,
      createdAtISO: nowISO,
      metadata: {
        email: sb.email,
        cif: sb.cif,
      },
    },
    actor,
  )

  const remaining = { ...(state.integrations ?? {}) }
  delete remaining.smartbill

  const updated: ComplianceState = {
    ...state,
    integrations: Object.keys(remaining).length > 0 ? remaining : undefined,
    events: appendComplianceEvents(state, [auditEvent]),
  }

  await writeStateForOrg(session.orgId, updated, session.orgName)

  return NextResponse.json({ ok: true })
}
