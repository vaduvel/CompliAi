import { afterEach, describe, expect, it, vi } from "vitest"

import { lookupOrgProfilePrefillByCui } from "@/lib/server/anaf-company-lookup"

describe("lookupOrgProfilePrefillByCui", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("mapeaza raspunsul ANAF in prefill-ul wizardului", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          found: [
            {
              date_generale: {
                cui: 14399840,
                denumire: "DANTE INTERNATIONAL SA",
                adresa: "BUCURESTI",
                stare_inregistrare: "INREGISTRAT",
                forma_juridica: "SA",
                cod_CAEN: "4754",
                statusRO_e_Factura: true,
              },
              inregistrare_scop_Tva: { scpTVA: true },
              inregistrare_RTVAI: { statusTvaIncasare: false },
              stare_inactiv: { statusInactivi: false },
            },
          ],
          notFound: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    )

    const result = await lookupOrgProfilePrefillByCui("RO14399840", fetchMock as typeof fetch)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(result).toEqual(
      expect.objectContaining({
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        mainCaen: "4754",
        vatRegistered: true,
        efacturaRegistered: true,
        suggestions: expect.objectContaining({
          sector: expect.objectContaining({
            value: "retail",
            confidence: "high",
            source: "anaf_vat_registry",
          }),
          requiresEfactura: expect.objectContaining({
            value: true,
            confidence: "high",
            source: "anaf_vat_registry",
          }),
        }),
      })
    )
  })

  it("intoarce null cand ANAF nu gaseste CUI-ul", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          found: [],
          notFound: [12345678],
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    )

    const result = await lookupOrgProfilePrefillByCui("RO12345678", fetchMock as typeof fetch)

    expect(result).toBeNull()
  })

  it("arunca eroare cand endpointul raspunde cu payload neasteptat", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("oops", { status: 500, headers: { "Content-Type": "text/plain" } })
    )

    await expect(lookupOrgProfilePrefillByCui("RO14399840", fetchMock as typeof fetch)).rejects.toThrow(
      "ANAF_COMPANY_LOOKUP_FAILED:500"
    )
  })
})
