import { describe, expect, it } from "vitest"

import {
  assessEvidenceQuality,
  formatEvidenceQualityStatus,
  getEvidenceQualitySummary,
} from "@/lib/compliance/evidence-quality"

describe("lib/compliance/evidence-quality", () => {
  it("marcheaza drept slaba o dovada generica si prea mica", () => {
    const result = assessEvidenceQuality({
      fileName: "proof.txt",
      mimeType: "application/octet-stream",
      sizeBytes: 32,
      kind: "other",
      uploadedAtISO: "2026-03-13T10:00:00.000Z",
    })

    expect(result.status).toBe("weak")
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["generic_kind", "generic_filename", "unknown_mime", "very_small_file"])
    )
  })

  it("marcheaza drept suficienta o dovada specifica si consistenta", () => {
    const result = assessEvidenceQuality({
      fileName: "consent-banner-proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128_000,
      kind: "document_bundle",
      uploadedAtISO: "2026-03-13T10:00:00.000Z",
    })

    expect(result.status).toBe("sufficient")
    expect(result.reasonCodes).toEqual([])
  })

  it("ofera rezumat si label pentru UI", () => {
    const result = assessEvidenceQuality({
      fileName: "scan.png",
      mimeType: "image/png",
      sizeBytes: 1024,
      kind: "screenshot",
      uploadedAtISO: "2026-03-13T10:00:00.000Z",
    })

    expect(formatEvidenceQualityStatus(result.status)).toBe("slabă")
    expect(
      getEvidenceQualitySummary({
        quality: result,
      })
    ).toContain("Dovada cere review")
  })
})

