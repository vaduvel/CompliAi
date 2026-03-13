import fs from "node:fs"
import path from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  extractTextFromPdfWithVisionMock: vi.fn(),
  extractTextWithVisionMock: vi.fn(),
  hasVisionConfigMock: vi.fn(),
}))

vi.mock("@/lib/server/google-vision", () => ({
  extractTextFromPdfWithVision: mocks.extractTextFromPdfWithVisionMock,
  extractTextWithVision: mocks.extractTextWithVisionMock,
  hasVisionConfig: mocks.hasVisionConfigMock,
}))

import { initialComplianceState } from "@/lib/compliance/engine"
import { createExtractedScan, validateScanInputPayload } from "@/lib/server/scan-workflow"

function readFixture(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", ...segments), "utf8").trim()
}

describe("ocr fallback fixtures", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasVisionConfigMock.mockReturnValue(false)
  })

  it("accepta fixture-ul PDF base64 ca payload valid", () => {
    const pdfBase64 = readFixture("pdf", "sample-minimal.base64.txt")

    const payload = validateScanInputPayload({
      documentName: "sample.pdf",
      pdfBase64,
    })

    expect(payload.documentName).toBe("sample.pdf")
    expect(payload.pdfBase64).toBe(pdfBase64)
  })

  it("accepta fixture-ul imagine base64 ca payload valid", () => {
    const imageBase64 = readFixture("images", "sample-fake.base64.txt")

    const payload = validateScanInputPayload({
      documentName: "sample.png",
      imageBase64,
    })

    expect(payload.documentName).toBe("sample.png")
    expect(payload.imageBase64).toBe(imageBase64)
  })

  it("expune ocrWarning clar pentru PDF cand OCR cloud nu este configurat", async () => {
    const pdfBase64 = readFixture("pdf", "sample-minimal.base64.txt")

    try {
      await createExtractedScan(initialComplianceState, {
        documentName: "sample.pdf",
        pdfBase64,
      })
      throw new Error("Testul trebuia sa intre pe fallback OCR.")
    } catch (error) {
      const typed = error as Error & { ocrWarning?: string | null }
      expect(typed.message).toContain("Nu am extras continut util")
      expect(typed.ocrWarning).toContain("GOOGLE_CLOUD_VISION_API_KEY")
      expect(mocks.extractTextFromPdfWithVisionMock).not.toHaveBeenCalled()
    }
  })

  it("expune ocrWarning clar pentru imagine cand OCR cloud nu este configurat", async () => {
    const imageBase64 = readFixture("images", "sample-fake.base64.txt")

    try {
      await createExtractedScan(initialComplianceState, {
        documentName: "sample.png",
        imageBase64,
      })
      throw new Error("Testul trebuia sa intre pe fallback OCR.")
    } catch (error) {
      const typed = error as Error & { ocrWarning?: string | null }
      expect(typed.message).toContain("Nu am extras continut util")
      expect(typed.ocrWarning).toContain("GOOGLE_CLOUD_VISION_API_KEY")
      expect(mocks.extractTextWithVisionMock).not.toHaveBeenCalled()
    }
  })
})
