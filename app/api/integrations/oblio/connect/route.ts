// Oblio — connect/disconnect endpoints.
//
// User-ul paste email + token Oblio (din Settings > Account Details).
// Validăm prin OAuth token exchange. Salvăm access_token + refresh-info
// în state.integrations.oblio.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { fetchOblioAccessToken } from "@/lib/integrations/oblio-client"
import type { ComplianceState } from "@/lib/compliance/types"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request) {
  const session = requireRole(request, [...READ_ROLES], "vizualizare conexiune Oblio")
  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const ob = state.integrations?.oblio
  if (!ob) return NextResponse.json({ connected: false })

  const tokenExpired = new Date(ob.tokenExpiresAtISO).getTime() < Date.now()
  return NextResponse.json({
    connected: true,
    email: ob.email,
    cif: ob.cif,
    connectedAtISO: ob.connectedAtISO,
    tokenExpiresAtISO: ob.tokenExpiresAtISO,
    tokenExpired,
    lastSyncAtISO: ob.lastSyncAtISO ?? null,
    lastSyncCount: ob.lastSyncCount ?? 0,
  })
}

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "conectare Oblio")

  let body: { email?: string; token?: string; cif?: string }
  try {
    body = (await request.json()) as { email?: string; token?: string; cif?: string }
  } catch {
    return jsonError("Body invalid (JSON).", 400, "OB_INVALID_BODY")
  }

  const email = body.email?.trim()
  const token = body.token?.trim()
  const cif = body.cif?.replace(/^RO/i, "").replace(/\D/g, "")

  if (!email || !email.includes("@")) {
    return jsonError("Email Oblio invalid.", 400, "OB_INVALID_EMAIL")
  }
  if (!token || token.length < 10) {
    return jsonError("Token Oblio invalid (minim 10 caractere).", 400, "OB_INVALID_TOKEN")
  }
  if (!cif || cif.length < 6) {
    return jsonError("CUI invalid.", 400, "OB_INVALID_CIF")
  }

  // Validăm cu OAuth token exchange
  const tokenResult = await fetchOblioAccessToken({ email, token, cif })
  if (!tokenResult.ok) {
    return jsonError(
      `Conectare Oblio eșuată: ${tokenResult.error.message}`,
      tokenResult.error.httpStatus === 401 ? 401 : 502,
      tokenResult.error.code,
    )
  }

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "integration.oblio.connected",
      entityType: "integration",
      entityId: "oblio",
      message: `Oblio conectat (${email}, CIF ${cif}). Token valid până la ${tokenResult.data.expiresAtISO}.`,
      createdAtISO: nowISO,
      metadata: {
        email,
        cif,
        tokenExpiresAt: tokenResult.data.expiresAtISO,
      },
    },
    actor,
  )

  const updated: ComplianceState = {
    ...state,
    integrations: {
      ...(state.integrations ?? {}),
      oblio: {
        email,
        accessToken: tokenResult.data.accessToken,
        tokenExpiresAtISO: tokenResult.data.expiresAtISO,
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
    tokenExpiresAtISO: tokenResult.data.expiresAtISO,
  })
}

export async function DELETE(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "deconectare Oblio")

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const ob = state.integrations?.oblio
  if (!ob) return NextResponse.json({ ok: true, alreadyDisconnected: true })

  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "integration.oblio.disconnected",
      entityType: "integration",
      entityId: "oblio",
      message: `Oblio deconectat (${ob.email}).`,
      createdAtISO: nowISO,
      metadata: { email: ob.email, cif: ob.cif },
    },
    actor,
  )

  const remaining = { ...(state.integrations ?? {}) }
  delete remaining.oblio

  const updated: ComplianceState = {
    ...state,
    integrations: Object.keys(remaining).length > 0 ? remaining : undefined,
    events: appendComplianceEvents(state, [auditEvent]),
  }
  await writeStateForOrg(session.orgId, updated, session.orgName)

  return NextResponse.json({ ok: true })
}
