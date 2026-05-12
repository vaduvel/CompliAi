// GET /api/findings/[id]/doc-pdf?type=anaf-response-etva|d300-draft|pfa-form082|fiscal-note
//
// Generator PDF generic pentru documente AI generate via PatternFGenerateDoc.
// Citește draft text salvat în finding evidence (după ce Mircea a generat
// draftul) și-l rendereze ca PDF cu brand cabinet în footer.
//
// Folosit pentru download click în PatternF "Descarcă PDF (brand cabinet)".

import PDFDocument from "pdfkit"

import { jsonError } from "@/lib/server/api-response"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { resolvePdfkitRuntimeDataFallback } from "@/lib/server/pdf-generator"

// PDFKit data fallback patch (Vercel build)
if (typeof process !== "undefined") {
  const originalReadFileSync = require("node:fs").readFileSync
  if (!(originalReadFileSync as { __compliscanPatched?: boolean }).__compliscanPatched) {
    const fs = require("node:fs")
    const patched: typeof fs.readFileSync = (path: string, options?: unknown) => {
      try {
        return originalReadFileSync(path, options)
      } catch (err) {
        if (typeof path === "string") {
          const fallback = resolvePdfkitRuntimeDataFallback(path)
          if (fallback) return originalReadFileSync(fallback, options)
        }
        throw err
      }
    }
    ;(patched as { __compliscanPatched: boolean }).__compliscanPatched = true
    fs.readFileSync = patched
  }
}

const DOC_TYPE_TITLES: Record<string, string> = {
  "anaf-response-etva": "Răspuns ANAF — Notificare e-TVA",
  "d300-draft": "Draft Declarația 300 — TVA lunar",
  "pfa-form082": "Formular 082 PFA — declarație fiscală",
  "fiscal-note": "Notă explicativă fiscală",
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const url = new URL(request.url)
    const docType = url.searchParams.get("type") ?? "fiscal-note"

    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("State organizație negăsit.", 404, "NO_STATE")

    const finding = state.findings.find((f) => f.id === id)
    if (!finding) return jsonError("Finding negăsit.", 404, "FINDING_NOT_FOUND")

    // Caut draft generat în finding metadata sau în events recente
    // pentru această finding (event finding.doc_generated).
    const draftEvent = (state.events ?? [])
      .filter(
        (e) =>
          e.entityType === "finding" &&
          e.entityId === id &&
          typeof e.metadata?.draft === "string",
      )
      .sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1))[0]

    let draft = (draftEvent?.metadata?.draft as string | undefined) ?? ""
    if (!draft) {
      // Fallback — folosesc finding detail + AI explanation placeholder
      draft = `[Draft AI încă nu generat]\n\nFinding: ${finding.title}\n\nDetaliu: ${finding.detail}\n\nGenerează draftul prin Fiscal Resolve Cockpit înainte de a descărca PDF-ul.`
    }

    const docTitle = DOC_TYPE_TITLES[docType] ?? "Document fiscal"
    const cabinetName = session.orgName
    const cabinetCui = state.orgProfile?.cui ?? ""
    const today = new Date().toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const doc = new PDFDocument({ size: "A4", margin: 60 })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    })

    // Header — brand cabinet
    doc
      .fontSize(9)
      .fillColor("#666666")
      .text(`${cabinetName}${cabinetCui ? ` · CUI ${cabinetCui}` : ""}`, { align: "right" })
      .text(today, { align: "right" })
      .moveDown(2)
      .fillColor("#000000")

    // Title
    doc.fontSize(16).text(docTitle, { align: "center" }).moveDown(0.3)
    doc.fontSize(9).fillColor("#666666").text(`Finding ID: ${finding.id}`, { align: "center" })
    doc.fillColor("#000000").fontSize(11).moveDown(1.5)

    // Draft content (preserve linii)
    doc.fontSize(11).text(draft, { align: "justify", lineGap: 4 })
    doc.moveDown(2)

    // Semnătură
    doc.text("Cu stimă,").moveDown(2)
    doc.text("__________________________________")
    doc.text(`${cabinetName}`)
    doc.text("Cabinet contabil CECCAR")
    doc.moveDown(3)

    // Footer disclaimer
    doc.fontSize(8).fillColor("#888888")
    doc.text(
      `Document generat de CompliScan AI. Conform CECCAR Cod Deontologic Art. 14, ` +
        `responsabilitatea profesională pentru conținutul final aparține semnatarului.`,
      { align: "center" },
    )

    doc.end()
    const pdfBuffer = await pdfPromise

    const fileName = `${docType}-${finding.id.slice(0, 8)}-${Date.now()}.pdf`
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${fileName}`,
      },
    })
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare generator PDF.",
      500,
      "DOC_PDF_FAILED",
    )
  }
}
