// Sprint 13 — Weekly Digest Email tests
import { describe, it, expect } from "vitest"
import { buildDigestEmail, type WeeklyDigest } from "./weekly-digest"

const BASE_DIGEST: WeeklyDigest = {
  orgName: "Firma Test SRL",
  orgId: "org-test123",
  emailAddress: "test@firma.ro",
  currentScore: 72,
  riskLabel: "Mediu",
  openAlerts: 3,
  redAlerts: 1,
  openFindings: [
    { title: "DPA lipsă cu AWS", category: "GDPR", severity: "high" },
    { title: "e-Factura neconectată", category: "E_FACTURA", severity: "medium" },
  ],
  generatedAt: "2026-03-17T08:00:00.000Z",
}

describe("buildDigestEmail", () => {
  it("include orgName și scor în HTML", () => {
    const html = buildDigestEmail(BASE_DIGEST)
    expect(html).toContain("Firma Test SRL")
    expect(html).toContain("72%")
    expect(html).toContain("Mediu")
  })

  it("afișează delta pozitiv față de săptămâna trecută", () => {
    const html = buildDigestEmail({ ...BASE_DIGEST, currentScore: 72, previousScore: 65 })
    expect(html).toContain("+7%")
  })

  it("afișează delta negativ", () => {
    const html = buildDigestEmail({ ...BASE_DIGEST, currentScore: 60, previousScore: 72 })
    expect(html).toContain("-12%")
  })

  it("nu afișează delta când previousScore lipsește", () => {
    const html = buildDigestEmail({ ...BASE_DIGEST, previousScore: undefined })
    expect(html).not.toContain("față de săptămâna trecută")
  })

  it("include findings în HTML", () => {
    const html = buildDigestEmail(BASE_DIGEST)
    expect(html).toContain("DPA lipsă cu AWS")
    expect(html).toContain("e-Factura neconectată")
  })

  it("afișează blocul NIS2 când există incidente deschise", () => {
    const html = buildDigestEmail({
      ...BASE_DIGEST,
      nis2: { openIncidents: 2, pendingVendors: 3, dnscStatus: "not-started" },
    })
    expect(html).toContain("NIS2")
    expect(html).toContain("2 incidente deschise")
    expect(html).toContain("Nepornită")
  })

  it("nu afișează blocul NIS2 dacă totul e în ordine", () => {
    const html = buildDigestEmail({
      ...BASE_DIGEST,
      nis2: { openIncidents: 0, pendingVendors: 0, dnscStatus: "confirmed" },
    })
    expect(html).not.toContain("NIS2")
  })

  it("afișează alerte critice în roșu și fără alerte în verde", () => {
    const withAlerts = buildDigestEmail({ ...BASE_DIGEST, redAlerts: 2 })
    expect(withAlerts).toContain("2 alerte critice")

    const clean = buildDigestEmail({ ...BASE_DIGEST, redAlerts: 0 })
    expect(clean).toContain("Fără alerte critice")
  })

  it("afișează deadline-urile iminente", () => {
    const html = buildDigestEmail({
      ...BASE_DIGEST,
      deadlinesIminente: ["Raport NIS2 DNSC — 20 martie 2026"],
    })
    expect(html).toContain("Raport NIS2 DNSC — 20 martie 2026")
    expect(html).toContain("Deadline-uri iminente")
  })

  it("afișează nextBestAction", () => {
    const html = buildDigestEmail({
      ...BASE_DIGEST,
      nextBestAction: "Completează evaluarea NIS2 pentru sectorul energy",
    })
    expect(html).toContain("Completează evaluarea NIS2")
  })

  it("returnează HTML valid cu DOCTYPE și body", () => {
    const html = buildDigestEmail(BASE_DIGEST)
    expect(html.trim()).toMatch(/^<!DOCTYPE html>/i)
    expect(html).toContain("</html>")
    expect(html).toContain("CompliScan")
  })
})
