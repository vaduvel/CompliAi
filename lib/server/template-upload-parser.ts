import { inflateRawSync } from "node:zlib"
import path from "node:path"

const MAX_TEMPLATE_UPLOAD_BYTES = 2 * 1024 * 1024

export type ParsedCabinetTemplateUpload = {
  content: string
  sourceFileName: string
  detectedInputFormat: "markdown" | "text" | "docx"
}

export async function parseCabinetTemplateUpload(
  uploaded: File
): Promise<
  | { ok: true; template: ParsedCabinetTemplateUpload }
  | { ok: false; error: string }
> {
  if (uploaded.size <= 0) {
    return { ok: false, error: "Fișierul template este gol." }
  }
  if (uploaded.size > MAX_TEMPLATE_UPLOAD_BYTES) {
    return { ok: false, error: "Fișierul template depășește limita de 2MB." }
  }

  const sourceFileName = sanitizeSourceFileName(uploaded.name || "template")
  const extension = path.extname(sourceFileName).toLowerCase()
  const bytes = Buffer.from(await uploaded.arrayBuffer())

  if (extension === ".md" || extension === ".markdown") {
    return {
      ok: true,
      template: {
        content: normalizeTemplateText(bytes.toString("utf8")),
        sourceFileName,
        detectedInputFormat: "markdown",
      },
    }
  }

  if (extension === ".txt") {
    return {
      ok: true,
      template: {
        content: normalizeTemplateText(bytes.toString("utf8")),
        sourceFileName,
        detectedInputFormat: "text",
      },
    }
  }

  if (extension === ".docx") {
    try {
      const xml = extractZipEntry(bytes, "word/document.xml").toString("utf8")
      return {
        ok: true,
        template: {
          content: normalizeTemplateText(extractTextFromWordDocumentXml(xml)),
          sourceFileName,
          detectedInputFormat: "docx",
        },
      }
    } catch {
      return {
        ok: false,
        error:
          "Nu am putut citi fișierul .docx. Încarcă un document Word standard sau copiază conținutul în Markdown.",
      }
    }
  }

  return {
    ok: false,
    error: "Format template neacceptat. Acceptăm .docx, .md, .markdown sau .txt.",
  }
}

function sanitizeSourceFileName(value: string) {
  const normalized = value.replace(/[\r\n]/g, "").trim()
  return normalized.slice(0, 180) || "template"
}

function normalizeTemplateText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function extractZipEntry(zip: Buffer, wantedFileName: string): Buffer {
  const localFileHeader = 0x04034b50
  let offset = 0

  while (offset <= zip.length - 30) {
    const signature = zip.readUInt32LE(offset)
    if (signature !== localFileHeader) {
      offset += 1
      continue
    }

    const flags = zip.readUInt16LE(offset + 6)
    const method = zip.readUInt16LE(offset + 8)
    const compressedSize = zip.readUInt32LE(offset + 18)
    const fileNameLength = zip.readUInt16LE(offset + 26)
    const extraLength = zip.readUInt16LE(offset + 28)
    const fileNameStart = offset + 30
    const fileNameEnd = fileNameStart + fileNameLength
    const fileName = zip.subarray(fileNameStart, fileNameEnd).toString("utf8")
    const dataStart = fileNameEnd + extraLength

    if (flags & 0x08) {
      throw new Error("ZIP_DATA_DESCRIPTOR_UNSUPPORTED")
    }

    const dataEnd = dataStart + compressedSize
    if (dataEnd > zip.length) {
      throw new Error("ZIP_ENTRY_OUT_OF_BOUNDS")
    }

    if (fileName === wantedFileName) {
      const compressed = zip.subarray(dataStart, dataEnd)
      if (method === 0) return Buffer.from(compressed)
      if (method === 8) return inflateRawSync(compressed)
      throw new Error("ZIP_COMPRESSION_METHOD_UNSUPPORTED")
    }

    offset = dataEnd
  }

  throw new Error("ZIP_ENTRY_NOT_FOUND")
}

function extractTextFromWordDocumentXml(xml: string) {
  const withBreaks = xml
    .replace(/<w:tab\s*\/>/g, "\t")
    .replace(/<w:br\s*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")

  return decodeXmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
}
