import { describe, it, expect } from "vitest"

import { detectSagaExport, SAGA_EXPORT_STEPS } from "./saga-format-detect"

describe("detectSagaExport", () => {
  it("detectează DBF ca neSupportat", () => {
    const r = detectSagaExport("NOTE.DBF", null)
    expect(r.type).toBe("saga_dbf")
    expect(r.recommendedHandler).toBe("not-supported")
    expect(r.confidence).toBe("high")
  })

  it("detectează SAF-T Saga din XML header", () => {
    const xml = `<?xml version="1.0"?><AuditFile><Header><Creator>Saga Software</Creator></Header></AuditFile>`
    const r = detectSagaExport("export.xml", xml)
    expect(r.type).toBe("saga_saft_d406")
    expect(r.isSagaSpecific).toBe(true)
    expect(r.recommendedHandler).toBe("saft-parser")
  })

  it("detectează SAF-T generic (non-Saga)", () => {
    const xml = `<?xml version="1.0"?><AuditFile><Header><AuditFileCountry>RO</AuditFileCountry></Header></AuditFile>`
    const r = detectSagaExport("d406_aprilie.xml", xml)
    expect(r.type).toBe("saft_generic")
    expect(r.recommendedHandler).toBe("saft-parser")
  })

  it("detectează UBL Invoice generic", () => {
    const xml = `<?xml version="1.0"?><Invoice xmlns="urn:oasis:names:specification:ubl:..."></Invoice>`
    const r = detectSagaExport("invoice-001.xml", xml)
    expect(r.type).toBe("ubl_generic")
    expect(r.recommendedHandler).toBe("efactura-validator")
  })

  it("detectează UBL e-Factura din pattern de filename Saga", () => {
    const xml = `<?xml version="1.0"?><Invoice></Invoice>`
    const r = detectSagaExport("factura12_FACT_RO12345678.xml", xml)
    expect(r.type).toBe("saga_efactura_xml")
    expect(r.isSagaSpecific).toBe(true)
    expect(r.confidence).toBe("medium")
  })

  it("returnează unknown pentru content nerecunoscut", () => {
    const r = detectSagaExport("ceva.xml", "<root></root>")
    expect(r.type).toBe("unknown")
    expect(r.recommendedHandler).toBe("manual-review")
  })

  it("recunoaște filename Saga pentru UBL chiar fără markers XML", () => {
    const xml = `<?xml version="1.0"?><Invoice></Invoice>`
    const r = detectSagaExport("export_saga_aprilie.xml", xml)
    expect(r.isSagaSpecific).toBe(true)
  })
})

describe("SAGA_EXPORT_STEPS", () => {
  it("oferă 4 pași în ordine", () => {
    expect(SAGA_EXPORT_STEPS).toHaveLength(4)
    expect(SAGA_EXPORT_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4])
  })
})
