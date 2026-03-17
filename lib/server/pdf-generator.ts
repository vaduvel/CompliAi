import PDFDocument from "pdfkit"

type PDFMetadata = {
  orgName: string
  documentType: string
  generatedAt?: string
}

/**
 * Builds a PDF Buffer from Markdown-like content.
 * Parses: # H1, ## H2, ### H3, --- hr, > blockquote, - list, 1. ordered list, paragraphs.
 * Adds header (org name + date) and footer (disclaimer) on every page.
 */
export async function buildPDFFromMarkdown(content: string, metadata: PDFMetadata): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      bufferPages: true,
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const W = doc.page.width - 144 // usable width (minus margins)
    const date = metadata.generatedAt
      ? new Date(metadata.generatedAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })

    // ── Header + footer helpers ──────────────────────────────────────────────

    function drawPageDecorations() {
      const pages = doc.bufferedPageRange()
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(pages.start + i)

        // Header
        doc
          .fontSize(8)
          .fillColor("#94a3b8")
          .text(
            `Generat de CompliAI · ${metadata.orgName} · ${date}`,
            doc.page.margins.left,
            24,
            { width: W, align: "left" }
          )

        // Header separator
        doc
          .moveTo(doc.page.margins.left, 38)
          .lineTo(doc.page.margins.left + W, 38)
          .strokeColor("#e2e8f0")
          .lineWidth(0.5)
          .stroke()

        // Footer separator
        doc
          .moveTo(doc.page.margins.left, doc.page.height - 50)
          .lineTo(doc.page.margins.left + W, doc.page.height - 50)
          .strokeColor("#e2e8f0")
          .lineWidth(0.5)
          .stroke()

        // Footer text
        doc
          .fontSize(7)
          .fillColor("#94a3b8")
          .text(
            "Document informativ, nu constituie consiliere juridică. Verificați cu un specialist înainte de utilizare oficială.",
            doc.page.margins.left,
            doc.page.height - 44,
            { width: W, align: "center" }
          )

        // Page number
        doc
          .fontSize(7)
          .fillColor("#94a3b8")
          .text(
            `${i + 1} / ${pages.count}`,
            doc.page.margins.left,
            doc.page.height - 32,
            { width: W, align: "right" }
          )
      }
    }

    // ── Content rendering ────────────────────────────────────────────────────

    const lines = content.split("\n")
    let firstContent = true

    function ensureSpace(needed: number) {
      if (doc.y + needed > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage()
      }
    }

    for (const line of lines) {
      if (line.startsWith("# ")) {
        ensureSpace(40)
        if (!firstContent) doc.moveDown(0.6)
        doc
          .fontSize(18)
          .fillColor("#0f172a")
          .font("Helvetica-Bold")
          .text(line.slice(2), { width: W })
        doc.moveDown(0.4)
        firstContent = false
      } else if (line.startsWith("## ")) {
        ensureSpace(30)
        if (!firstContent) doc.moveDown(0.5)
        doc
          .fontSize(13)
          .fillColor("#1e293b")
          .font("Helvetica-Bold")
          .text(line.slice(3), { width: W })
        doc.moveDown(0.3)
        firstContent = false
      } else if (line.startsWith("### ")) {
        ensureSpace(24)
        if (!firstContent) doc.moveDown(0.4)
        doc
          .fontSize(10)
          .fillColor("#475569")
          .font("Helvetica-Bold")
          .text(line.slice(4).toUpperCase(), { width: W, characterSpacing: 0.5 })
        doc.moveDown(0.2)
        firstContent = false
      } else if (line.startsWith("---")) {
        doc.moveDown(0.3)
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.margins.left + W, doc.y)
          .strokeColor("#e2e8f0")
          .lineWidth(0.5)
          .stroke()
        doc.moveDown(0.3)
      } else if (line.startsWith("> ")) {
        ensureSpace(24)
        const savedY = doc.y
        doc
          .moveTo(doc.page.margins.left, savedY)
          .lineTo(doc.page.margins.left, savedY + 28)
          .strokeColor("#f59e0b")
          .lineWidth(2)
          .stroke()
        doc
          .fontSize(9)
          .fillColor("#92400e")
          .font("Helvetica")
          .text(line.slice(2), doc.page.margins.left + 10, savedY, { width: W - 10 })
        doc.moveDown(0.4)
        firstContent = false
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        ensureSpace(18)
        doc
          .fontSize(10)
          .fillColor("#475569")
          .font("Helvetica")
          .text(`• ${line.slice(2)}`, doc.page.margins.left + 12, doc.y, { width: W - 12 })
        firstContent = false
      } else if (/^\d+\.\s/.test(line)) {
        ensureSpace(18)
        doc
          .fontSize(10)
          .fillColor("#475569")
          .font("Helvetica")
          .text(line, doc.page.margins.left + 12, doc.y, { width: W - 12 })
        firstContent = false
      } else if (line.trim() === "") {
        if (!firstContent) doc.moveDown(0.25)
      } else {
        ensureSpace(18)
        doc
          .fontSize(10)
          .fillColor("#334155")
          .font("Helvetica")
          .text(line, { width: W, lineGap: 3 })
        firstContent = false
      }
    }

    // Flush pages and draw decorations
    doc.flushPages()
    drawPageDecorations()

    doc.end()
  })
}
