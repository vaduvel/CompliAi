// API pentru tracker PFA / CNP Form 082 (OG 6/2026 + Ordin ANAF 378/2026).
//
// GET → returnează snapshot + lista clienți PFA per org.
// POST → adaugă client nou în portofoliu (PFA cu CNP).
// PATCH → actualizează status registrare (form_submitted, registered, etc.)
// DELETE → șterge client din portofoliu (cu id în query).

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  buildSnapshot,
  inferPfaCnpScope,
  upsertPfaClient,
  updatePfaStatus,
  type PfaClientRecord,
  type PfaRegistrationStatus,
} from "@/lib/compliance/pfa-form082-tracker"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithPfa = ComplianceState & {
  pfaForm082Clients?: PfaClientRecord[]
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
    session = await authOr401(request, "PFA Form 082 tracker")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "PFA_AUTH_FAILED")
  }

  const state = (await readStateForOrg(session.orgId)) as StateWithPfa | null
  const clients = state?.pfaForm082Clients ?? []
  const snapshot = buildSnapshot(clients, new Date().toISOString())

  return NextResponse.json({ ok: true, snapshot, clients })
}

export async function POST(request: Request) {
  let session
  try {
    session = await authOr401(request, "PFA Form 082 add")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "PFA_AUTH_FAILED")
  }

  let body: { taxId?: string; name?: string; notes?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid.", 400, "PFA_INVALID_BODY")
  }

  if (!body.taxId?.trim() || !body.name?.trim()) {
    return jsonError("taxId și name sunt obligatorii.", 400, "PFA_MISSING_FIELDS")
  }

  const cleanTaxId = body.taxId.trim().replace(/\s+/g, "").toUpperCase()
  const scope = inferPfaCnpScope(cleanTaxId)

  const state = (await readStateForOrg(session.orgId)) as StateWithPfa | null
  if (!state) return jsonError("State indisponibil.", 500, "PFA_STATE_UNAVAILABLE")

  const nowISO = new Date().toISOString()
  const newClient: PfaClientRecord = {
    id: `pfa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    taxId: cleanTaxId,
    name: body.name.trim(),
    status: "unknown",
    notes: body.notes?.trim() || (scope === "cif_company" ? "ATENȚIE: CIF detectat ca companie (nu PFA). Verifică manual." : undefined),
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
  }

  const updated = upsertPfaClient(state.pfaForm082Clients ?? [], newClient)
  await writeStateForOrg(session.orgId, { ...state, pfaForm082Clients: updated })

  return NextResponse.json({ ok: true, client: newClient })
}

export async function PATCH(request: Request) {
  let session
  try {
    session = await authOr401(request, "PFA Form 082 update")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "PFA_AUTH_FAILED")
  }

  let body: {
    id?: string
    status?: PfaRegistrationStatus
    notes?: string
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid.", 400, "PFA_INVALID_BODY")
  }

  if (!body.id || !body.status) {
    return jsonError("id și status sunt obligatorii.", 400, "PFA_MISSING_FIELDS")
  }
  const validStatuses: PfaRegistrationStatus[] = [
    "not_registered",
    "form_submitted",
    "registered",
    "exempt",
    "unknown",
  ]
  if (!validStatuses.includes(body.status)) {
    return jsonError("Status invalid.", 400, "PFA_INVALID_STATUS")
  }

  const state = (await readStateForOrg(session.orgId)) as StateWithPfa | null
  if (!state) return jsonError("State indisponibil.", 500, "PFA_STATE_UNAVAILABLE")

  const clients = state.pfaForm082Clients ?? []
  if (!clients.some((c) => c.id === body.id)) {
    return jsonError("Client necunoscut.", 404, "PFA_CLIENT_NOT_FOUND")
  }

  const updated = updatePfaStatus(
    clients,
    body.id,
    body.status,
    new Date().toISOString(),
    body.notes !== undefined ? { notes: body.notes } : undefined,
  )

  await writeStateForOrg(session.orgId, { ...state, pfaForm082Clients: updated })
  return NextResponse.json({ ok: true, client: updated.find((c) => c.id === body.id) })
}

export async function DELETE(request: Request) {
  let session
  try {
    session = await authOr401(request, "PFA Form 082 delete")
  } catch (err) {
    if (err instanceof NextResponse) return err
    return jsonError("Auth eșuată.", 401, "PFA_AUTH_FAILED")
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return jsonError("Lipsește parametrul id.", 400, "PFA_NO_ID")

  const state = (await readStateForOrg(session.orgId)) as StateWithPfa | null
  if (!state) return jsonError("State indisponibil.", 500, "PFA_STATE_UNAVAILABLE")

  const updated = (state.pfaForm082Clients ?? []).filter((c) => c.id !== id)
  await writeStateForOrg(session.orgId, { ...state, pfaForm082Clients: updated })
  return NextResponse.json({ ok: true })
}
