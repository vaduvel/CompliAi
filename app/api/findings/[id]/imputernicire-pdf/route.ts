// POST /api/findings/[id]/imputernicire-pdf
//
// Generator PDF împuternicire ANAF pre-completat pentru cabinet-fiscal care
// vrea să trimită clientului fără împuternicire activă un template gata să
// semneze și să-l înregistreze la ANAF.
//
// Folosit de PatternHExternalContact (EMPUTERNICIRE-MISSING).
//
// Pre-completat:
//   - Denumire + CUI cabinet (din session.orgName + state.orgProfile.cui)
//   - Denumire + CUI client (din finding metadata sau client org state)
//   - Data curentă
//   - Loc semnătură (gol — se completează manual)
//   - Bază legală: OUG 25/2017 art.II / OUG 89/2025

import PDFDocument from "pdfkit"

import { jsonError } from "@/lib/server/api-response"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { resolvePdfkitRuntimeDataFallback } from "@/lib/server/pdf-generator"

// Patch PDFKit pentru a găsi font data în .next chunks (Vercel build)
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

    const finding = state.findings.find((f) => f.id === id)
    if (!finding) return jsonError("Finding negăsit.", 404, "FINDING_NOT_FOUND")

    const cabinetName = session.orgName
    const cabinetCui = state.orgProfile?.cui ?? ""
    const clientCui = extractClientCui(finding.title, finding.detail) ?? ""
    const clientName = extractClientName(finding.title, finding.detail) ?? "Client SRL"
    const today = new Date().toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    // Build PDF
    const doc = new PDFDocument({ size: "A4", margin: 60 })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    })

    // Title
    doc
      .fontSize(16)
      .text("ÎMPUTERNICIRE / PROCURĂ SPECIALĂ", { align: "center" })
      .moveDown(0.3)
      .fontSize(11)
      .text("pentru acces la Spațiul Privat Virtual (SPV) și serviciul RO e-Factura ANAF", {
        align: "center",
      })
      .moveDown(1.5)

    // Body
    doc.fontSize(11).text(`Subsemnatul/a, reprezentant legal al firmei`, { continued: false })
    doc.moveDown(0.4)
    doc.text(`Denumire client: ${clientName}`, { indent: 20 })
    doc.text(`CUI client: ${clientCui || "[se completează]"}`, { indent: 20 })
    doc.moveDown(0.8)
    doc.text(
      `prin prezenta împuternicesc firma de contabilitate ${cabinetName} (CUI: ${cabinetCui || "[se completează]"}) ` +
        `să acceseze, în numele și pentru contul societății mele, Spațiul Privat Virtual (SPV) al ANAF, ` +
        `inclusiv serviciul național RO e-Factura, pentru:`,
      { align: "justify" },
    )
    doc.moveDown(0.5)
    const bullets = [
      "Vizualizarea și descărcarea mesajelor SPV (notificări, facturi primite, alerte e-TVA, controale)",
      "Transmiterea facturilor electronice (e-Factura) prin sistemul RO e-Factura",
      "Depunerea declarațiilor fiscale (D300, D390, D394, D406 / SAF-T, e-TVA)",
      "Răspunsurile la notificări ANAF, contestații, clarificări",
      "Reprezentarea fiscală în relația cu organul fiscal central",
    ]
    bullets.forEach((b) => {
      doc.text(`• ${b}`, { indent: 30 })
    })
    doc.moveDown(0.8)

    doc.text(
      `Această împuternicire este valabilă de la data semnării și până la revocare expresă comunicată ANAF.`,
      { align: "justify" },
    )
    doc.moveDown(0.5)
    doc.text(
      `Baza legală: OUG 25/2017 art. II, OUG 89/2025, Lege 207/2015 (Cod Procedură Fiscală) art. 18, ` +
        `Ordin ANAF 1162/2024.`,
      { align: "justify" },
    )
    doc.moveDown(1.5)

    // Date + Semnături
    doc.text(`Data: ${today}`)
    doc.moveDown(2)

    doc.text("Semnătura reprezentant legal client:", { continued: false })
    doc.moveDown(2)
    doc.text("__________________________________")
    doc.moveDown(0.3)
    doc.text(`${clientName}`)
    doc.moveDown(2)

    doc.text("Semnătura cabinet contabil (împuternicit):", { continued: false })
    doc.moveDown(2)
    doc.text("__________________________________")
    doc.moveDown(0.3)
    doc.text(`${cabinetName}`)
    doc.moveDown(3)

    // Footer
    doc.fontSize(8).fillColor("#666666")
    doc.text(
      `Document generat de CompliScan pentru ${cabinetName}. ` +
        `Înregistrare la ANAF: depune semnat prin SPV (Mesaj nou → Împuternicire) sau ghișeu ANAF.`,
      { align: "center" },
    )
    doc.fillColor("#000000").fontSize(11)

    doc.end()

    const pdfBuffer = await pdfPromise

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=imputernicire-${clientCui || "client"}-${Date.now()}.pdf`,
      },
    })
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare generator PDF împuternicire.",
      500,
      "IMPUTERNICIRE_PDF_FAILED",
    )
  }
}

function extractClientCui(title: string, detail: string): string | null {
  const re = /\bRO?\d{4,12}\b/
  const m = `${title}\n${detail}`.match(re)
  return m ? m[0] : null
}

function extractClientName(title: string, detail: string): string | null {
  // Try to match capitalized words followed by SRL/SA/PFA
  const re = /([A-ZĂÎÂȘȚ][A-Za-zăîâșțĂÎÂȘȚ\s&-]+(?:SRL|SA|PFA|II|SCS))/
  const m = `${title}\n${detail}`.match(re)
  return m ? m[1].trim() : null
}
