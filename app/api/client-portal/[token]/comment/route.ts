// Client portal — adaugă comentariu pe un finding partajat via magic link.
//
// Auth: token HMAC-validat din /shared-finding/[token]. Recipient = client
// intern (recipientType = "accountant"). Body limitat la 5000 chars.
//
// POST /api/client-portal/[token]/comment — adaugă comentariu nou
// GET /api/client-portal/[token]/comments — listează comentarii pentru finding

import { NextResponse } from "next/server"
import { resolveSignedShareToken } from "@/lib/server/share-token-store"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import type { ComplianceState } from "@/lib/compliance/types"

const MAX_BODY_LENGTH = 5_000

function uid() {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  const payload = resolveSignedShareToken(token)
  if (!payload || !payload.documentId) {
    return NextResponse.json({ error: "Token invalid sau expirat." }, { status: 401 })
  }

  let body: { authorEmail?: string; body?: string }
  try {
    body = (await request.json()) as { authorEmail?: string; body?: string }
  } catch {
    return NextResponse.json({ error: "Body invalid (JSON)." }, { status: 400 })
  }

  const text = body.body?.trim()
  if (!text || text.length < 2) {
    return NextResponse.json({ error: "Comentariu prea scurt." }, { status: 400 })
  }
  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "Comentariu prea lung (max 5000 char)." }, { status: 400 })
  }

  const state = (await readStateForOrg(payload.orgId)) as ComplianceState | null
  if (!state) {
    return NextResponse.json({ error: "State indisponibil." }, { status: 500 })
  }

  const finding = (state.findings ?? []).find((f) => f.id === payload.documentId)
  if (!finding) {
    return NextResponse.json({ error: "Finding-ul nu mai există." }, { status: 404 })
  }

  const nowISO = new Date().toISOString()
  const comment = {
    id: uid(),
    findingId: payload.documentId,
    authorEmail: body.authorEmail?.trim() || undefined,
    authorRole: "client" as const,
    body: text,
    createdAtISO: nowISO,
  }

  const updated: ComplianceState = {
    ...state,
    clientPortalComments: [...(state.clientPortalComments ?? []), comment],
    events: appendComplianceEvents(state, [
      createComplianceEvent(
        {
          type: "client_portal.comment_added",
          entityType: "finding",
          entityId: payload.documentId,
          message: `Comentariu nou de la client pe finding ${payload.documentId}: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`,
          createdAtISO: nowISO,
          metadata: {
            commentId: comment.id,
            authorRole: "client",
            authorEmail: body.authorEmail ?? "",
          },
        },
        systemEventActor("CompliScan client-portal"),
      ),
    ]),
  }

  await writeStateForOrg(payload.orgId, updated)

  return NextResponse.json({ ok: true, comment })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  const payload = resolveSignedShareToken(token)
  if (!payload || !payload.documentId) {
    return NextResponse.json({ error: "Token invalid sau expirat." }, { status: 401 })
  }

  const state = (await readStateForOrg(payload.orgId)) as ComplianceState | null
  if (!state) return NextResponse.json({ comments: [] })

  const comments = (state.clientPortalComments ?? [])
    .filter((c) => c.findingId === payload.documentId)
    .sort((a, b) => a.createdAtISO.localeCompare(b.createdAtISO))

  return NextResponse.json({ comments })
}
