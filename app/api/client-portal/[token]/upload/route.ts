// Client portal — upload document de la contabilul intern al clientului.
//
// Stocăm metadata + fișierul base64 inline (limit 1 MB) în state.
// Pentru fișiere mai mari, ar trebui Supabase Storage — viitor.

import { NextResponse } from "next/server"
import { resolveSignedShareToken } from "@/lib/server/share-token-store"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { systemEventActor } from "@/lib/server/event-actor"
import type { ComplianceState } from "@/lib/compliance/types"

const MAX_FILE_BYTES = 1 * 1024 * 1024  // 1 MB inline limit
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png", "image/jpeg",
  "application/xml", "text/xml",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

function uid() {
  return `cdoc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
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

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Așteptăm multipart/form-data." }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Form data invalid." }, { status: 400 })
  }

  const file = formData.get("file")
  const note = String(formData.get("note") ?? "").trim().slice(0, 500)
  const uploaderEmail = String(formData.get("email") ?? "").trim() || undefined

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fișier lipsă în câmpul 'file'." }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `Fișier prea mare (>${MAX_FILE_BYTES / 1024} KB).` },
      { status: 413 },
    )
  }
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|xml|zip|xlsx|xls)$/i)) {
    return NextResponse.json(
      { error: `Tip fișier neacceptat: ${file.type}. Acceptat: PDF, imagine, XML, ZIP, Excel.` },
      { status: 415 },
    )
  }

  const state = (await readStateForOrg(payload.orgId)) as ComplianceState | null
  if (!state) {
    return NextResponse.json({ error: "State indisponibil." }, { status: 500 })
  }

  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 =
    typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64")

  // storageKey acum = base64 inline (limit 1 MB). Pentru fișiere mari →
  // Supabase Storage / S3 / Vercel Blob.
  const storageKey = `inline:${base64}`

  const nowISO = new Date().toISOString()
  const doc = {
    id: uid(),
    findingId: payload.documentId,
    fileName: file.name || "upload",
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    uploadedByEmail: uploaderEmail,
    uploadedAtISO: nowISO,
    note: note || undefined,
    storageKey,
  }

  const updated: ComplianceState = {
    ...state,
    clientPortalDocuments: [...(state.clientPortalDocuments ?? []), doc],
    events: appendComplianceEvents(state, [
      createComplianceEvent(
        {
          type: "client_portal.document_uploaded",
          entityType: "finding",
          entityId: payload.documentId,
          message: `Document încărcat de client pe finding ${payload.documentId}: ${doc.fileName} (${(doc.sizeBytes / 1024).toFixed(1)} KB)`,
          createdAtISO: nowISO,
          metadata: {
            docId: doc.id,
            fileName: doc.fileName,
            sizeBytes: doc.sizeBytes,
            contentType: doc.contentType,
            uploaderEmail: uploaderEmail ?? "",
          },
        },
        systemEventActor("CompliScan client-portal"),
      ),
    ]),
  }

  await writeStateForOrg(payload.orgId, updated)

  return NextResponse.json({
    ok: true,
    document: {
      id: doc.id,
      fileName: doc.fileName,
      sizeBytes: doc.sizeBytes,
      uploadedAtISO: doc.uploadedAtISO,
    },
  })
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  const payload = resolveSignedShareToken(token)
  if (!payload || !payload.documentId) {
    return NextResponse.json({ error: "Token invalid." }, { status: 401 })
  }

  const state = (await readStateForOrg(payload.orgId)) as ComplianceState | null
  if (!state) return NextResponse.json({ documents: [] })

  const docs = (state.clientPortalDocuments ?? [])
    .filter((d) => d.findingId === payload.documentId)
    .map((d) => ({
      id: d.id,
      fileName: d.fileName,
      contentType: d.contentType,
      sizeBytes: d.sizeBytes,
      uploadedByEmail: d.uploadedByEmail,
      uploadedAtISO: d.uploadedAtISO,
      note: d.note,
    }))

  return NextResponse.json({ documents: docs })
}
