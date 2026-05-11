import { describe, it, expect } from "vitest"

import { POST } from "./route"

const VALID_SAFT = `<?xml version="1.0" encoding="UTF-8"?>
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
</AuditFile>`

const RECTIFICATION_SAFT = VALID_SAFT.replace("<RevisionNumber>0</RevisionNumber>", "<RevisionNumber>2</RevisionNumber>")

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/free-tools/saft-hygiene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/free-tools/saft-hygiene — single file", () => {
  it("processes valid SAF-T and returns hygiene score", async () => {
    const res = await POST(makeRequest({ xml: VALID_SAFT, fileName: "april.xml" }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.ok).toBe(true)
    expect(body.filesProcessed).toBe(1)
    expect(body.filings).toBe(1)
    expect(body.hygiene).toBeDefined()
    expect(body.cta).toBeDefined()
  })

  it("flags rectification in perFile breakdown", async () => {
    const res = await POST(makeRequest({ xml: RECTIFICATION_SAFT, fileName: "april-rect.xml" }))
    const body = (await res.json()) as { perFile: Array<{ isRectification: boolean }> }
    expect(body.perFile[0].isRectification).toBe(true)
  })
})

describe("POST /api/free-tools/saft-hygiene — multiple files", () => {
  it("processes batch of 3 files", async () => {
    const res = await POST(
      makeRequest({
        files: [
          { xml: VALID_SAFT, fileName: "01.xml" },
          { xml: VALID_SAFT.replace("2026-04", "2026-03"), fileName: "02.xml" },
          { xml: RECTIFICATION_SAFT, fileName: "03.xml" },
        ],
      }),
    )
    const body = (await res.json()) as Record<string, unknown>
    expect(body.ok).toBe(true)
    expect(body.filesProcessed).toBe(3)
  })
})

describe("POST /api/free-tools/saft-hygiene — error cases", () => {
  it("returns 400 for empty body", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { ok: boolean }
    expect(body.ok).toBe(false)
  })

  it("returns 413 for too many files", async () => {
    const files = Array.from({ length: 10 }, (_, i) => ({
      xml: VALID_SAFT,
      fileName: `f-${i}.xml`,
    }))
    const res = await POST(makeRequest({ files }))
    expect(res.status).toBe(413)
  })

  it("captures parser errors per file without failing batch", async () => {
    const res = await POST(
      makeRequest({
        files: [
          { xml: VALID_SAFT, fileName: "good.xml" },
          { xml: "not xml at all", fileName: "bad.xml" },
        ],
      }),
    )
    const body = (await res.json()) as {
      ok: boolean
      perFile: Array<{ errors: string[]; fileName: string }>
    }
    expect(body.ok).toBe(true)
    expect(body.perFile[0].errors.length).toBe(0)
    expect(body.perFile[1].errors.length).toBeGreaterThan(0)
  })
})
