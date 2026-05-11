import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import {
  __test__,
  getEFacturaStatus,
  getSmartBillInvoicePdf,
  listSmartBillInvoices,
  listSmartBillSeries,
  verifySmartBillCredentials,
} from "./smartbill-client"

const CREDS = { email: "user@cabinet.ro", token: "tk_abcdef1234567890", cif: "12345678" }

describe("statusFromSmartBillLabel", () => {
  it("maps each known status correctly", () => {
    expect(__test__.statusFromSmartBillLabel("De trimis")).toBe("de_trimis")
    expect(__test__.statusFromSmartBillLabel("In curs de trimitere")).toBe("in_curs")
    expect(__test__.statusFromSmartBillLabel("In validare")).toBe("in_validare")
    expect(__test__.statusFromSmartBillLabel("Valida")).toBe("valida")
    expect(__test__.statusFromSmartBillLabel("Validă")).toBe("valida")
    expect(__test__.statusFromSmartBillLabel("Cu eroare")).toBe("cu_eroare")
  })

  it("falls back to necunoscut for unknown labels", () => {
    expect(__test__.statusFromSmartBillLabel("Ciudat")).toBe("necunoscut")
    expect(__test__.statusFromSmartBillLabel(undefined)).toBe("necunoscut")
    expect(__test__.statusFromSmartBillLabel(null)).toBe("necunoscut")
  })
})

describe("buildBasicAuthHeader", () => {
  it("encodes email:token in base64 cu prefix Basic", () => {
    const header = __test__.buildBasicAuthHeader("a@b.ro", "tok")
    expect(header).toBe("Basic " + Buffer.from("a@b.ro:tok").toString("base64"))
  })
})

describe("listSmartBillSeries", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("parses series list cu fallback default type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          list: [
            { name: "FACT", type: "factura", nextNumber: 42 },
            { name: "PROF", type: "proforma", nextNumber: "10" },
            { name: "X", type: "weird", nextNumber: 0 },
          ],
        }),
        { status: 200 },
      ),
    )
    const result = await listSmartBillSeries(CREDS, "factura")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(3)
    expect(result.data[0].nextNumber).toBe(42)
    expect(result.data[1].nextNumber).toBe(10)
    expect(result.data[2].type).toBe("other")
  })

  it("returns SB_UNAUTHORIZED pe 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 401 }))
    const result = await listSmartBillSeries(CREDS, "factura")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("SB_UNAUTHORIZED")
  })

  it("returns SB_RATE_LIMIT pe 429", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 429 }))
    const result = await listSmartBillSeries(CREDS, "factura")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("SB_RATE_LIMIT")
  })

  it("propagates network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"))
    const result = await listSmartBillSeries(CREDS, "factura")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("SB_NETWORK_ERROR")
  })
})

describe("verifySmartBillCredentials", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("trimite Basic auth corect cu credențialele", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ list: [] }), { status: 200 }))
    await verifySmartBillCredentials(CREDS)
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Basic /)
  })
})

describe("getEFacturaStatus", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("mapează SmartBill response la enum intern", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ statusLabel: "Cu eroare", errorMessage: "CIF invalid" }), {
        status: 200,
      }),
    )
    const result = await getEFacturaStatus(CREDS, "FACT", "100")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe("cu_eroare")
    expect(result.data.errorMessage).toBe("CIF invalid")
  })
})

describe("listSmartBillInvoices", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("convertește răspunsul SmartBill la SmartBillInvoice[]", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          list: [
            {
              seriesName: "FACT",
              number: "001",
              issueDate: "2026-04-15",
              total: 119,
              vatTotal: 19,
              currency: "RON",
              clientName: "Acme SRL",
              clientVatCode: "RO87654321",
              efactura: { statusLabel: "In validare" },
              paid: false,
              partiallyPaid: false,
            },
          ],
          hasMore: false,
        }),
        { status: 200 },
      ),
    )
    const result = await listSmartBillInvoices(CREDS, "2026-04-01", "2026-04-30", 1)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.invoices).toHaveLength(1)
    expect(result.data.invoices[0].efacturaStatus).toBe("in_validare")
    expect(result.data.invoices[0].paymentStatus).toBe("neachitata")
    expect(result.data.hasMore).toBe(false)
  })
})

describe("getSmartBillInvoicePdf", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returnează base64 când PDF e descărcat OK", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // "%PDF"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(pdfBytes.buffer as ArrayBuffer, { status: 200 }),
    )
    const result = await getSmartBillInvoicePdf(CREDS, "FACT", "001")
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.pdfBase64.length).toBeGreaterThan(0)
    // Decode and verify it starts cu %PDF
    const decoded = Buffer.from(result.data.pdfBase64, "base64").toString("binary")
    expect(decoded.slice(0, 4)).toBe("%PDF")
  })

  it("returnează SB_PDF_ERROR pe 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 404 }))
    const result = await getSmartBillInvoicePdf(CREDS, "FACT", "001")
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("SB_PDF_ERROR")
  })
})
