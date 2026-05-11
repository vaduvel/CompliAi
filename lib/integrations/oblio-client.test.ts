import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import {
  __test__,
  ensureValidOblioToken,
  fetchOblioAccessToken,
  getOblioInvoice,
  listOblioInvoices,
} from "./oblio-client"

const CREDS = { email: "user@cabinet.ro", token: "secret_xyz_1234567890", cif: "12345678" }

describe("statusFromOblioLabel", () => {
  it("maps known statuses", () => {
    expect(__test__.statusFromOblioLabel("Validat")).toBe("validat")
    expect(__test__.statusFromOblioLabel("Acceptat ANAF")).toBe("validat")
    expect(__test__.statusFromOblioLabel("Respins")).toBe("respins")
    expect(__test__.statusFromOblioLabel("Eroare validare")).toBe("respins")
    expect(__test__.statusFromOblioLabel("Trimis la ANAF")).toBe("trimis")
    expect(__test__.statusFromOblioLabel("Neconectat")).toBe("neconectat")
    expect(__test__.statusFromOblioLabel("Ceva ciudat")).toBe("necunoscut")
    expect(__test__.statusFromOblioLabel(undefined)).toBe("necunoscut")
  })
})

describe("fetchOblioAccessToken", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returnează access_token cu expiry calculat din expires_in", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "abc123", expires_in: 3600, token_type: "Bearer" }),
        { status: 200 },
      ),
    )
    const result = await fetchOblioAccessToken(CREDS)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.accessToken).toBe("abc123")
    expect(result.data.tokenType).toBe("Bearer")
    const expiresMs = new Date(result.data.expiresAtISO).getTime()
    expect(expiresMs - Date.now()).toBeGreaterThan(3500_000)
  })

  it("trimite client_credentials cu Content-Type form-urlencoded", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "x", expires_in: 3600 }), { status: 200 }),
    )
    await fetchOblioAccessToken(CREDS)
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    )
    expect(init.body).toContain("client_id=user%40cabinet.ro")
    expect(init.body).toContain("client_secret=secret_xyz_1234567890")
  })

  it("returnează OB_UNAUTHORIZED pe 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 401 }))
    const result = await fetchOblioAccessToken(CREDS)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("OB_UNAUTHORIZED")
  })

  it("returnează OB_NO_TOKEN dacă răspunsul nu are access_token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const result = await fetchOblioAccessToken(CREDS)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("OB_NO_TOKEN")
  })
})

describe("ensureValidOblioToken", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returnează existing dacă mai are >60s rămase", async () => {
    const future = new Date(Date.now() + 600_000).toISOString()
    const result = await ensureValidOblioToken(CREDS, {
      accessToken: "stale-but-valid",
      expiresAtISO: future,
      tokenType: "Bearer",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.accessToken).toBe("stale-but-valid")
  })

  it("re-fetchează dacă token-ul existent expiră curând", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "fresh", expires_in: 3600 }), { status: 200 }),
    )
    const soon = new Date(Date.now() + 10_000).toISOString() // 10s — sub buffer
    const result = await ensureValidOblioToken(CREDS, {
      accessToken: "old",
      expiresAtISO: soon,
      tokenType: "Bearer",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.accessToken).toBe("fresh")
  })
})

describe("listOblioInvoices", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("convertește răspunsul Oblio la OblioInvoice[]", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          data: [
            {
              seriesName: "FACT",
              number: "001",
              issueDate: "2026-04-15",
              total: 119,
              totalVat: 19,
              currency: "RON",
              client: { name: "Acme SRL", cif: "RO87654321" },
              efactura: { statusMessage: "Respins" },
              collect: { status: "Achitat" },
              link: "https://www.oblio.eu/pdf/abc.pdf",
            },
          ],
          nrPages: 1,
        }),
        { status: 200 },
      ),
    )
    const result = await listOblioInvoices(
      { accessToken: "tok", expiresAtISO: new Date(Date.now() + 3600_000).toISOString(), tokenType: "Bearer" },
      "12345678",
      "2026-04-01",
      "2026-04-30",
      1,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.invoices).toHaveLength(1)
    expect(result.data.invoices[0].efacturaStatus).toBe("respins")
    expect(result.data.invoices[0].collectStatus).toBe("achitata")
    expect(result.data.invoices[0].pdfLink).toBe("https://www.oblio.eu/pdf/abc.pdf")
    expect(result.data.hasMore).toBe(false)
  })

  it("hasMore = true când nrPages > page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [], nrPages: 3 }), { status: 200 }),
    )
    const result = await listOblioInvoices(
      { accessToken: "x", expiresAtISO: new Date(Date.now() + 3600_000).toISOString(), tokenType: "Bearer" },
      "12345678",
      "2026-04-01",
      "2026-04-30",
      1,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.hasMore).toBe(true)
  })

  it("returnează OB_RATE_LIMIT pe 429", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 429 }))
    const result = await listOblioInvoices(
      { accessToken: "x", expiresAtISO: new Date(Date.now() + 3600_000).toISOString(), tokenType: "Bearer" },
      "12345678",
      "2026-04-01",
      "2026-04-30",
      1,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("OB_RATE_LIMIT")
  })
})

describe("getOblioInvoice", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returnează OB_NOT_FOUND dacă răspunsul nu are data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const result = await getOblioInvoice(
      { accessToken: "x", expiresAtISO: new Date(Date.now() + 3600_000).toISOString(), tokenType: "Bearer" },
      "12345678",
      "FACT",
      "001",
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("OB_NOT_FOUND")
  })
})
