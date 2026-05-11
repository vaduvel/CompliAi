// API pentru F#4 — Certificate SPV manager (Sprint 1 - 2026-05-11).
//
// GET → returnează snapshot + listă certificate per org cabinet.
// POST → adaugă cert nou în portofoliu (per client).
// PATCH → actualizează cert existent (re-enrollment date, SPV verified status).
// DELETE → șterge cert din portofoliu (cu id în query).

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  buildSnapshot,
  deleteCertRecord,
  recomputeStatus,
  upsertCertRecord,
  type CertSpvRecord,
} from "@/lib/compliance/cert-spv-tracker"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithCert = ComplianceState & {
  certSpvRecords?: CertSpvRecord[]
}

async function authOr401(request: Request, label: string) {
  try {
    return await requireFreshAuthenticatedSession(request, label)
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      throw NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw NextResponse.json({ error: "Auth eșuată." }, { status: 401 })
  }
}

export async function GET(request: Request) {
  let session
  try {
    session = await authOr401(request, "Cert SPV tracker")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "CERT_SPV_AUTH_FAILED")
  }

  const state = (await readStateForOrg(session.orgId)) as StateWithCert | null
  const records = (state?.certSpvRecords ?? []).map((r) =>
    recomputeStatus(r, new Date().toISOString()),
  )
  const snapshot = buildSnapshot(records)

  return NextResponse.json({ ok: true, snapshot, records })
}

export async function POST(request: Request) {
  let session
  try {
    session = await authOr401(request, "Cert SPV add")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "CERT_SPV_AUTH_FAILED")
  }

  let body: {
    clientCif?: string
    clientName?: string
    certSerial?: string
    ownerName?: string
    ownerEmail?: string
    provider?: string
    validFromISO?: string
    validUntilISO?: string
    lastSpvEnrollmentISO?: string
    notes?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid.", 400, "CERT_SPV_INVALID_BODY")
  }

  if (
    !body.clientCif?.trim() ||
    !body.clientName?.trim() ||
    !body.certSerial?.trim() ||
    !body.ownerName?.trim() ||
    !body.validFromISO ||
    !body.validUntilISO
  ) {
    return jsonError(
      "Câmpuri obligatorii: clientCif, clientName, certSerial, ownerName, validFromISO, validUntilISO.",
      400,
      "CERT_SPV_MISSING_FIELDS",
    )
  }

  const state = (await readStateForOrg(session.orgId)) as StateWithCert | null
  if (!state) return jsonError("State indisponibil.", 500, "CERT_SPV_STATE_UNAVAILABLE")

  const nowISO = new Date().toISOString()
  const newRecord: CertSpvRecord = {
    id: `cert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    clientCif: body.clientCif.trim().replace(/\s+/g, "").toUpperCase(),
    clientName: body.clientName.trim(),
    certSerial: body.certSerial.trim(),
    ownerName: body.ownerName.trim(),
    ownerEmail: body.ownerEmail?.trim() || undefined,
    provider: body.provider?.trim() || undefined,
    validFromISO: body.validFromISO,
    validUntilISO: body.validUntilISO,
    lastSpvEnrollmentISO: body.lastSpvEnrollmentISO || undefined,
    notes: body.notes?.trim() || undefined,
    status: "unknown",
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
  }
  const withStatus = recomputeStatus(newRecord, nowISO)

  const updated = upsertCertRecord(state.certSpvRecords ?? [], withStatus)
  await writeStateForOrg(session.orgId, { ...state, certSpvRecords: updated })

  return NextResponse.json({ ok: true, record: withStatus })
}

export async function PATCH(request: Request) {
  let session
  try {
    session = await authOr401(request, "Cert SPV update")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "CERT_SPV_AUTH_FAILED")
  }

  let body: {
    id?: string
    lastSpvEnrollmentISO?: string
    lastSpvVerifiedISO?: string
    lastSpvVerifiedOk?: boolean
    notes?: string
    validUntilISO?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid.", 400, "CERT_SPV_INVALID_BODY")
  }

  if (!body.id) return jsonError("id obligatoriu.", 400, "CERT_SPV_NO_ID")

  const state = (await readStateForOrg(session.orgId)) as StateWithCert | null
  if (!state) return jsonError("State indisponibil.", 500, "CERT_SPV_STATE_UNAVAILABLE")

  const records = state.certSpvRecords ?? []
  const existing = records.find((r) => r.id === body.id)
  if (!existing) return jsonError("Cert necunoscut.", 404, "CERT_SPV_NOT_FOUND")

  const nowISO = new Date().toISOString()
  const patched: CertSpvRecord = {
    ...existing,
    lastSpvEnrollmentISO: body.lastSpvEnrollmentISO ?? existing.lastSpvEnrollmentISO,
    lastSpvVerifiedISO: body.lastSpvVerifiedISO ?? existing.lastSpvVerifiedISO,
    lastSpvVerifiedOk:
      body.lastSpvVerifiedOk !== undefined ? body.lastSpvVerifiedOk : existing.lastSpvVerifiedOk,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    validUntilISO: body.validUntilISO ?? existing.validUntilISO,
    updatedAtISO: nowISO,
  }
  const withStatus = recomputeStatus(patched, nowISO)

  const updated = upsertCertRecord(records, withStatus)
  await writeStateForOrg(session.orgId, { ...state, certSpvRecords: updated })

  return NextResponse.json({ ok: true, record: withStatus })
}

export async function DELETE(request: Request) {
  let session
  try {
    session = await authOr401(request, "Cert SPV delete")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "CERT_SPV_AUTH_FAILED")
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return jsonError("Lipsește parametrul id.", 400, "CERT_SPV_NO_ID")

  const state = (await readStateForOrg(session.orgId)) as StateWithCert | null
  if (!state) return jsonError("State indisponibil.", 500, "CERT_SPV_STATE_UNAVAILABLE")

  const updated = deleteCertRecord(state.certSpvRecords ?? [], id)
  await writeStateForOrg(session.orgId, { ...state, certSpvRecords: updated })

  return NextResponse.json({ ok: true })
}
