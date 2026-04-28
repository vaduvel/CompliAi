import { deflateRawSync } from "node:zlib"

import { describe, expect, it } from "vitest"

import { parseCabinetTemplateUpload } from "@/lib/server/template-upload-parser"

describe("template-upload-parser", () => {
  it("extrage text dintr-un .docx murdar de cabinet", async () => {
    const docx = buildMinimalDocx([
      "DPA procesatori — template cabinet",
      "Comentariu intern: înlocuiește clauza de transfer pentru {{ORG_NAME}}.",
      "Secțiune retenție: datele se păstrează conform contractului.",
    ])

    const result = await parseCabinetTemplateUpload(
      new File([docx], "DPA-procesatori-murdar.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.template.detectedInputFormat).toBe("docx")
    expect(result.template.sourceFileName).toBe("DPA-procesatori-murdar.docx")
    expect(result.template.content).toContain("DPA procesatori")
    expect(result.template.content).toContain("{{ORG_NAME}}")
    expect(result.template.content).toContain("Comentariu intern")
  })

  it("respinge formate legacy .doc fara parser sigur", async () => {
    const result = await parseCabinetTemplateUpload(
      new File(["binary"], "model-vechi.doc", { type: "application/msword" })
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain("Format template neacceptat")
  })
})

function buildMinimalDocx(paragraphs: string[]) {
  const xml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`,
    ...paragraphs.map(
      (paragraph) => `<w:p><w:r><w:t>${escapeXml(paragraph)}</w:t></w:r></w:p>`
    ),
    `</w:body></w:document>`,
  ].join("")
  return buildZipEntry("word/document.xml", Buffer.from(xml, "utf8"))
}

function buildZipEntry(fileName: string, content: Buffer) {
  const compressed = deflateRawSync(content)
  const fileNameBytes = Buffer.from(fileName, "utf8")
  const header = Buffer.alloc(30)

  header.writeUInt32LE(0x04034b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(0, 6)
  header.writeUInt16LE(8, 8)
  header.writeUInt16LE(0, 10)
  header.writeUInt16LE(0, 12)
  header.writeUInt32LE(0, 14)
  header.writeUInt32LE(compressed.length, 18)
  header.writeUInt32LE(content.length, 22)
  header.writeUInt16LE(fileNameBytes.length, 26)
  header.writeUInt16LE(0, 28)

  return Buffer.concat([header, fileNameBytes, compressed])
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
