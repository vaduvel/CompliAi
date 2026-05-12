// GET /api/findings/[id]/xml
//
// Returnează XML-ul facturii asociate unui finding fiscal (EF-003, EF-005, etc.)
// Folosit de PatternAAutoApprove + PatternIRetransmit pentru a încărca XML-ul
// original înainte de repair/submit.
//
// Lookup order:
// 1. state.efacturaValidations — match după documentName extras din finding
// 2. evidence registry — attachments cu mime XML legate de finding
// 3. (future) Supabase blob storage — pentru când stocăm XML-uri large
//
// Returnează 404 dacă nu e disponibil.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"

function extractDocumentName(title: string, detail: string, sourceDocument?: string): string | null {
  const haystack = `${sourceDocument ?? ""}\n${detail}\n${title}`
  // Match F2026-0445 / FACT-2026-0042 / etc.
  const re = /(F[A-Z0-9]*[-_]?[0-9]+[-_]?[0-9]*)/i
  const m = haystack.match(re)
  return m ? m[0] : null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("State organizație negăsit.", 404, "NO_STATE")

    const finding = state.findings.find((f) => f.id === id)
    if (!finding) return jsonError("Finding negăsit.", 404, "FINDING_NOT_FOUND")

    if (finding.category !== "E_FACTURA") {
      return jsonError("XML disponibil doar pentru findings E_FACTURA.", 400, "WRONG_CATEGORY")
    }

    // Try 1: extract document name + match în efacturaValidations
    const docName = extractDocumentName(finding.title, finding.detail, finding.sourceDocument)
    if (docName && state.efacturaValidations) {
      const match = state.efacturaValidations.find((v) =>
        v.documentName.toLowerCase().includes(docName.toLowerCase()),
      )
      if (match) {
        // Validation record may include raw XML if it was preserved
        const rawXml = (match as unknown as { rawXml?: string }).rawXml
        if (rawXml) {
          return NextResponse.json({
            xml: rawXml,
            documentName: match.documentName,
            source: "validation-record",
          })
        }
      }
    }

    // Try 2: attached evidence with XML mime
    const evidenceWithXml =
      state.taskState &&
      Object.values(state.taskState).find((t) => {
        const mime = t.attachedEvidenceMeta?.mimeType ?? ""
        return mime.includes("xml")
      })
    if (evidenceWithXml?.attachedEvidence) {
      try {
        const buf = Buffer.from(evidenceWithXml.attachedEvidence, "base64")
        const decoded = buf.toString("utf-8")
        if (decoded.includes("<?xml")) {
          return NextResponse.json({
            xml: decoded,
            documentName:
              evidenceWithXml.attachedEvidenceMeta?.fileName ?? "evidence.xml",
            source: "evidence-attachment",
          })
        }
      } catch {
        // ignore decode errors
      }
    }

    return jsonError(
      "XML-ul facturii nu e disponibil în finding. Urcă manual prin Validare & emitere.",
      404,
      "XML_NOT_AVAILABLE",
    )
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la fetch XML.",
      500,
      "XML_FETCH_FAILED",
    )
  }
}
