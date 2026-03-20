import { describe, expect, it, vi } from "vitest"

import {
  buildWebsitePrefillSignals,
  enrichOrgProfilePrefillWithWebsiteSignals,
} from "@/lib/server/website-prefill-signals"

describe("website-prefill-signals", () => {
  it("derivează semnale reale din website public", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url === "https://exemplu.ro" || url === "https://exemplu.ro/") {
        return new Response(
          `
            <html>
              <body>
                <a href="/privacy-policy">Privacy Policy</a>
                <a href="/cookies">Cookies</a>
                <form action="/contact">
                  <input type="email" name="email" />
                </form>
                <div>newsletter si contact rapid</div>
              </body>
            </html>
          `,
          { status: 200, headers: { "content-type": "text/html" } }
        )
      }

      if (url === "https://exemplu.ro/privacy-policy") {
        return new Response(
          "<html><body>Politica de confidentialitate si date personale conform GDPR.</body></html>",
          { status: 200, headers: { "content-type": "text/html" } }
        )
      }

      if (url === "https://exemplu.ro/cookies") {
        return new Response(
          "<html><body>Acest site foloseste cookies, analytics si consent banner.</body></html>",
          { status: 200, headers: { "content-type": "text/html" } }
        )
      }

      return new Response("Not found", { status: 404 })
    })

    const result = await buildWebsitePrefillSignals("https://exemplu.ro", fetchMock as typeof fetch)

    expect(result.websiteSignals).toEqual({
      source: "website_signals",
      normalizedWebsite: "https://exemplu.ro",
      pagesChecked: 3,
      matchedSignals: [
        "site cu formulare / cookies / newsletter",
        "privacy policy publică",
        "cookies / consent banner",
        "prelucrare date personale",
      ],
      topPages: ["exemplu.ro", "/privacy-policy", "/cookies"],
    })
    expect(result.suggestions.hasSiteWithForms).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "website_signals",
      })
    )
    expect(result.suggestions.hasSitePrivacyPolicy).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(result.suggestions.hasPrivacyPolicy).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(result.suggestions.processesPersonalData).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
      })
    )
    expect(result.suggestions.hasCookiesConsent).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "medium",
      })
    )
  })

  it("nu suprascrie sugestiile existente mai bune din prefill", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        "<html><body><a href='/privacy-policy'>privacy</a><div>cookies consent</div></body></html>",
        { status: 200, headers: { "content-type": "text/html" } }
      )
    )

    const result = await enrichOrgProfilePrefillWithWebsiteSignals(
      {
        source: "anaf_vat_registry",
        fetchedAtISO: "2026-03-20T10:00:00.000Z",
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "4754",
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        suggestions: {
          hasSiteWithForms: {
            value: true,
            confidence: "high",
            reason: "Semnal mai bun din document memory.",
            source: "document_memory",
          },
        },
      },
      { website: "exemplu.ro" },
      fetchMock as typeof fetch
    )

    expect(result?.normalizedWebsite).toBe("https://exemplu.ro")
    expect(result?.suggestions.hasSiteWithForms).toEqual({
      value: true,
      confidence: "high",
      reason: "Semnal mai bun din document memory.",
      source: "document_memory",
    })
    expect(result?.suggestions.hasCookiesConsent).toEqual(
      expect.objectContaining({
        value: true,
        source: "website_signals",
      })
    )
  })
})
