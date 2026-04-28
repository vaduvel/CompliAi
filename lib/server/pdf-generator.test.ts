import path from "node:path"

import { describe, expect, it } from "vitest"
import { buildPDFFromMarkdown, resolvePdfkitRuntimeDataFallback } from "./pdf-generator"

describe("buildPDFFromMarkdown", () => {
  it("returnează un Buffer non-gol pentru conținut simplu", async () => {
    const buf = await buildPDFFromMarkdown("# Titlu\n\nParagraf simplu.", {
      orgName: "Test SRL",
      documentType: "privacy-policy",
    })
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(100)
  })

  it("acceptă conținut Markdown complex (heading, list, blockquote, hr)", async () => {
    const content = [
      "# Privacy Policy",
      "",
      "## Introducere",
      "",
      "Această politică descrie modul în care colectăm datele.",
      "",
      "### Detalii",
      "",
      "- Element 1",
      "- Element 2",
      "1. Primul pas",
      "2. Al doilea pas",
      "",
      "> Atenție: document informativ.",
      "",
      "---",
      "",
      "Ultimul paragraf.",
    ].join("\n")

    const buf = await buildPDFFromMarkdown(content, {
      orgName: "Firma Test SA",
      documentType: "dpa",
      generatedAt: "2026-03-17T00:00:00.000Z",
    })

    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)
  })

  it("funcționează cu conținut gol (nu aruncă eroare)", async () => {
    const buf = await buildPDFFromMarkdown("", {
      orgName: "Empty Corp",
      documentType: "test",
    })
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })

  it("redirijează lookup-ul AFM din chunks/data către assetele PDFKit trasate", () => {
    const runtimePath = path.join(process.cwd(), ".next", "server", "chunks", "data", "Helvetica.afm")
    const fallback = resolvePdfkitRuntimeDataFallback(runtimePath)

    expect(fallback).toBe(path.join(process.cwd(), "node_modules", "pdfkit", "js", "data", "Helvetica.afm"))
  })

  it("redirijează lookup-ul AFM din vendor-chunks/data către assetele PDFKit trasate", () => {
    const runtimePath = path.join(
      process.cwd(),
      ".next",
      "server",
      "vendor-chunks",
      "data",
      "Helvetica.afm"
    )
    const fallback = resolvePdfkitRuntimeDataFallback(runtimePath)

    expect(fallback).toBe(path.join(process.cwd(), "node_modules", "pdfkit", "js", "data", "Helvetica.afm"))
  })
})
