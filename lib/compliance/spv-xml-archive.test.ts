import { describe, expect, it } from "vitest"
import {
  buildArchiveStats,
  PDF_VS_XML_EDUCATIONAL_TEXT,
  sha256Hex,
  type ArchivedXmlRecord,
} from "./spv-xml-archive"

const NOW = "2026-05-11T10:00:00.000Z"

function makeRecord(over: Partial<ArchivedXmlRecord> = {}): ArchivedXmlRecord {
  return {
    id: "r1",
    spvUploadId: "spv-1",
    invoiceNumber: "F1",
    supplierCif: "RO1",
    issueDateISO: "2026-05-01",
    receivedAtISO: "2026-05-01T12:00:00.000Z",
    archivedAtISO: "2026-05-01T13:00:00.000Z",
    xmlSha256: "abc",
    sizeBytes: 4096,
    storageKey: "spv/abc.xml",
    signed: true,
    direction: "received",
    ...over,
  }
}

describe("spv-xml-archive — buildArchiveStats", () => {
  it("agregă count + size pentru lista mixtă", () => {
    const records: ArchivedXmlRecord[] = [
      makeRecord({ id: "1", direction: "received", sizeBytes: 1024 * 1024 }), // 1 MB
      makeRecord({ id: "2", direction: "issued", sizeBytes: 512 * 1024 }), // 0.5 MB
      makeRecord({ id: "3", direction: "received", sizeBytes: 2048 * 1024 }), // 2 MB
    ]
    const stats = buildArchiveStats(records, NOW)
    expect(stats.total).toBe(3)
    expect(stats.receivedFromSpv).toBe(2)
    expect(stats.issuedByUs).toBe(1)
    expect(stats.totalSizeMB).toBeCloseTo(3.5, 1)
  })

  it("calculează rescuedFromSpvExpiry pentru received >60 zile", () => {
    const old = makeRecord({
      id: "old",
      direction: "received",
      receivedAtISO: "2026-02-01T10:00:00.000Z", // ~99 zile înainte de NOW
    })
    const recent = makeRecord({
      id: "rec",
      direction: "received",
      receivedAtISO: "2026-04-30T10:00:00.000Z", // 11 zile
    })
    const stats = buildArchiveStats([old, recent], NOW)
    expect(stats.rescuedFromSpvExpiry).toBe(1)
  })

  it("nu numără issued ca rescued (n-au expirat din SPV)", () => {
    const old = makeRecord({
      id: "old-issued",
      direction: "issued",
      receivedAtISO: "2026-02-01T10:00:00.000Z",
    })
    const stats = buildArchiveStats([old], NOW)
    expect(stats.rescuedFromSpvExpiry).toBe(0)
  })

  it("listă goală → stats zerooate", () => {
    const stats = buildArchiveStats([], NOW)
    expect(stats.total).toBe(0)
    expect(stats.totalSizeMB).toBe(0)
    expect(stats.rescuedFromSpvExpiry).toBe(0)
  })
})

describe("spv-xml-archive — sha256Hex", () => {
  it("returnează hash hex lungime 64", async () => {
    const hash = await sha256Hex("Hello, World!")
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    // Hash cunoscut pentru "Hello, World!"
    expect(hash).toBe("dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f")
  })

  it("hash determinist pentru același input", async () => {
    const h1 = await sha256Hex("test")
    const h2 = await sha256Hex("test")
    expect(h1).toBe(h2)
  })
})

describe("spv-xml-archive — educational text", () => {
  it("are 4 paragrafe în body", () => {
    expect(PDF_VS_XML_EDUCATIONAL_TEXT.body).toHaveLength(4)
  })

  it("menționează 60 zile retention", () => {
    const fullText = PDF_VS_XML_EDUCATIONAL_TEXT.body.join(" ")
    expect(fullText).toMatch(/60 de zile/)
  })

  it("referință legală corectă", () => {
    expect(PDF_VS_XML_EDUCATIONAL_TEXT.legalReference).toContain("OUG 120/2021")
  })
})
