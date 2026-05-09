import { describe, it, expect } from "vitest"

import { parseSaftMetadata, saftMetadataToFilingRecord } from "./saft-xml-parser"

const SAMPLE_VALID_SAFT = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="mfp:anaf:dgti:d406:declaratie:v2.4.7">
  <Header>
    <AuditFileVersion>2.4.7</AuditFileVersion>
    <AuditFileCountry>RO</AuditFileCountry>
    <AuditFileDateCreated>2026-04-30</AuditFileDateCreated>
    <DateCreated>2026-04-30T15:30:00</DateCreated>
    <Company>
      <CompanyID>RO12345678</CompanyID>
      <CompanyName>Test SRL</CompanyName>
    </Company>
    <SelectionCriteria>
      <PeriodStart>2026-04-01</PeriodStart>
      <PeriodEnd>2026-04-30</PeriodEnd>
    </SelectionCriteria>
    <RevisionNumber>0</RevisionNumber>
  </Header>
  <MasterFiles></MasterFiles>
  <SourceDocuments></SourceDocuments>
</AuditFile>`

const SAMPLE_RECTIFICATION_SAFT = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile>
  <Header>
    <DateCreated>2026-05-15T10:00:00</DateCreated>
    <Company>
      <CompanyID>RO87654321</CompanyID>
    </Company>
    <SelectionCriteria>
      <PeriodStart>2026-04-01</PeriodStart>
      <PeriodEnd>2026-04-30</PeriodEnd>
    </SelectionCriteria>
    <RevisionNumber>2</RevisionNumber>
  </Header>
</AuditFile>`

const SAMPLE_BROKEN = `<?xml version="1.0"?>
<NotASaftFile>
  <SomeData />
</NotASaftFile>`

const SAMPLE_MISSING_PERIOD = `<?xml version="1.0"?>
<AuditFile>
  <Header>
    <DateCreated>2026-04-30</DateCreated>
    <Company>
      <CompanyID>RO12345678</CompanyID>
    </Company>
  </Header>
</AuditFile>`

describe("parseSaftMetadata — valid SAF-T", () => {
  it("extracts period, dateCreated, cif from valid XML", () => {
    const meta = parseSaftMetadata(SAMPLE_VALID_SAFT)
    expect(meta.period).toBe("2026-04")
    expect(meta.reportingPeriodStart).toBe("2026-04-01")
    expect(meta.reportingPeriodEnd).toBe("2026-04-30")
    expect(meta.cif).toBe("12345678") // RO prefix stripped
    expect(meta.dateCreated).toContain("2026-04-30")
    expect(meta.errors.length).toBe(0)
  })

  it("detects no rectification on RevisionNumber 0", () => {
    const meta = parseSaftMetadata(SAMPLE_VALID_SAFT)
    // RevisionNumber 0 = not rectified
    expect(meta.isRectification).toBe(false)
    expect(meta.rectificationCount).toBe(0)
  })
})

describe("parseSaftMetadata — rectification", () => {
  it("detects rectification on RevisionNumber > 0", () => {
    const meta = parseSaftMetadata(SAMPLE_RECTIFICATION_SAFT)
    expect(meta.isRectification).toBe(true)
    expect(meta.rectificationCount).toBe(2)
    expect(meta.cif).toBe("87654321")
  })
})

describe("parseSaftMetadata — invalid XML", () => {
  it("returns error S002 if root NOT AuditFile", () => {
    const meta = parseSaftMetadata(SAMPLE_BROKEN)
    expect(meta.errors).toContain(
      "S002 Rădăcina XML trebuie să fie AuditFile (SAF-T standard). Verifică schema RO_SAFT.",
    )
  })

  it("returns error S001 if not XML", () => {
    const meta = parseSaftMetadata("not xml content")
    expect(meta.errors[0]).toContain("S001")
  })

  it("returns error S004 if PeriodStart missing", () => {
    const meta = parseSaftMetadata(SAMPLE_MISSING_PERIOD)
    expect(meta.errors).toContain(
      "S004 Lipsește SelectionCriteria.PeriodStart (perioada raportare).",
    )
  })

  it("warning S006 if CIF missing", () => {
    const xmlNoCif = SAMPLE_VALID_SAFT.replace(/<CompanyID>[^<]+<\/CompanyID>/, "")
    const meta = parseSaftMetadata(xmlNoCif)
    expect(meta.cif).toBeNull()
    expect(meta.warnings.some((w) => w.startsWith("S006"))).toBe(true)
  })
})

describe("saftMetadataToFilingRecord", () => {
  it("creates on_time FilingRecord pentru SAF-T fără rectificare", () => {
    const meta = parseSaftMetadata(SAMPLE_VALID_SAFT)
    const record = saftMetadataToFilingRecord(meta, "2026-04-30T15:30:00.000Z")
    expect(record.type).toBe("saft")
    expect(record.period).toBe("2026-04")
    expect(record.status).toBe("on_time")
    expect(record.rectificationCount).toBe(0)
  })

  it("creates rectified FilingRecord cu rectificationCount", () => {
    const meta = parseSaftMetadata(SAMPLE_RECTIFICATION_SAFT)
    const record = saftMetadataToFilingRecord(meta, "2026-05-15T10:00:00.000Z")
    expect(record.status).toBe("rectified")
    expect(record.rectificationCount).toBeGreaterThanOrEqual(2)
  })

  it("preserves filing id pe period (idempotent în acelaș timestamp)", () => {
    const meta = parseSaftMetadata(SAMPLE_VALID_SAFT)
    const record = saftMetadataToFilingRecord(meta, "2026-04-30T15:30:00.000Z")
    expect(record.id).toContain("saft-d406-2026-04")
  })
})
