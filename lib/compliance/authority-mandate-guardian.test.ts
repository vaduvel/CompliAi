// Tests pentru Authority & Mandate Guardian (FC-10).

import { describe, expect, it } from "vitest"

import {
  generateGuardianAlerts,
  refreshCertificateStatuses,
  refreshMandateStatuses,
  summarizeGuardian,
  type DigitalCertificate,
  type RepresentationMandate,
} from "./authority-mandate-guardian"

function mkCert(over: Partial<DigitalCertificate> = {}): DigitalCertificate {
  return {
    id: `cert-${Math.random().toString(36).slice(2, 6)}`,
    ownerOrgId: "org-1",
    ownerOrgName: "Firma Test SRL",
    holderName: "Ion Pop",
    type: "qualified-signature",
    authority: "certSIGN",
    serialNumber: "SN123",
    issuedAtISO: "2025-01-01T00:00:00Z",
    expiresAtISO: new Date(Date.now() + 365 * 86400000).toISOString(),
    status: "active",
    registeredByEmail: "cabinet@compliai.ro",
    ...over,
  }
}

function mkMandate(over: Partial<RepresentationMandate> = {}): RepresentationMandate {
  return {
    id: `mandate-${Math.random().toString(36).slice(2, 6)}`,
    representativeOrgId: "cab-1",
    representativeOrgName: "Cabinet Y SRL",
    representativeName: "Maria Cabinet",
    clientOrgId: "client-1",
    clientOrgName: "Client X SRL",
    type: "anaf-spv",
    scopes: ["submit-declarations"],
    issuedAtISO: "2025-01-01T00:00:00Z",
    expiresAtISO: new Date(Date.now() + 365 * 86400000).toISOString(),
    status: "active",
    registeredByEmail: "cabinet@compliai.ro",
    ...over,
  }
}

describe("refreshCertificateStatuses", () => {
  it("activ pentru cert cu mai mult de 30 zile", () => {
    const certs = [mkCert({ expiresAtISO: new Date(Date.now() + 60 * 86400000).toISOString() })]
    const r = refreshCertificateStatuses(certs)
    expect(r[0]?.status).toBe("active")
  })

  it("expiring-soon pentru cert cu ≤30 zile", () => {
    const certs = [mkCert({ expiresAtISO: new Date(Date.now() + 10 * 86400000).toISOString() })]
    const r = refreshCertificateStatuses(certs)
    expect(r[0]?.status).toBe("expiring-soon")
  })

  it("expired pentru cert cu data trecută", () => {
    const certs = [mkCert({ expiresAtISO: new Date(Date.now() - 5 * 86400000).toISOString() })]
    const r = refreshCertificateStatuses(certs)
    expect(r[0]?.status).toBe("expired")
  })

  it("revoked se păstrează", () => {
    const certs = [mkCert({ status: "revoked", expiresAtISO: new Date(Date.now() + 60 * 86400000).toISOString() })]
    const r = refreshCertificateStatuses(certs)
    expect(r[0]?.status).toBe("revoked")
  })
})

describe("refreshMandateStatuses", () => {
  it("mandate fără expiresAtISO → active", () => {
    const m = [mkMandate({ expiresAtISO: null })]
    const r = refreshMandateStatuses(m)
    expect(r[0]?.status).toBe("active")
  })

  it("expirat pentru data trecută", () => {
    const m = [mkMandate({ expiresAtISO: new Date(Date.now() - 10 * 86400000).toISOString() })]
    const r = refreshMandateStatuses(m)
    expect(r[0]?.status).toBe("expired")
  })

  it("expiring-soon pentru ≤30 zile", () => {
    const m = [mkMandate({ expiresAtISO: new Date(Date.now() + 15 * 86400000).toISOString() })]
    const r = refreshMandateStatuses(m)
    expect(r[0]?.status).toBe("expiring-soon")
  })
})

describe("generateGuardianAlerts", () => {
  it("nu generează alerte pentru elemente active", () => {
    const certs = [mkCert()]
    const mandates = [mkMandate()]
    const alerts = generateGuardianAlerts(certs, mandates)
    expect(alerts).toHaveLength(0)
  })

  it("generează alert critical pentru cert expirat", () => {
    const certs = [mkCert({ expiresAtISO: new Date(Date.now() - 5 * 86400000).toISOString() })]
    const alerts = generateGuardianAlerts(certs, [])
    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.severity).toBe("critical")
    expect(alerts[0]?.message).toContain("expirat")
  })

  it("generează alert critical pentru cert care expiră ≤7 zile", () => {
    const certs = [mkCert({ expiresAtISO: new Date(Date.now() + 3 * 86400000).toISOString() })]
    const alerts = generateGuardianAlerts(certs, [])
    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.severity).toBe("critical")
  })

  it("warning pentru cert care expiră 8-30 zile", () => {
    const certs = [mkCert({ expiresAtISO: new Date(Date.now() + 20 * 86400000).toISOString() })]
    const alerts = generateGuardianAlerts(certs, [])
    expect(alerts[0]?.severity).toBe("warning")
  })

  it("nu generează alert pentru mandate fără expiresAtISO", () => {
    const mandates = [mkMandate({ expiresAtISO: null })]
    const alerts = generateGuardianAlerts([], mandates)
    expect(alerts).toHaveLength(0)
  })

  it("sortează alertele: critical primul, apoi după zile rămase", () => {
    const certs = [
      mkCert({ id: "c1", expiresAtISO: new Date(Date.now() + 25 * 86400000).toISOString() }), // warning
      mkCert({ id: "c2", expiresAtISO: new Date(Date.now() - 5 * 86400000).toISOString() }), // critical expired
      mkCert({ id: "c3", expiresAtISO: new Date(Date.now() + 3 * 86400000).toISOString() }), // critical
    ]
    const alerts = generateGuardianAlerts(certs, [])
    expect(alerts[0]?.severity).toBe("critical")
    expect(alerts[2]?.severity).toBe("warning")
  })
})

describe("summarizeGuardian", () => {
  it("zero alerte pentru portofoliu sănătos", () => {
    const certs = refreshCertificateStatuses([mkCert()])
    const mandates = refreshMandateStatuses([mkMandate()])
    const alerts = generateGuardianAlerts(certs, mandates)
    const s = summarizeGuardian(certs, mandates, alerts)
    expect(s.totalCertificates).toBe(1)
    expect(s.totalMandates).toBe(1)
    expect(s.totalAlerts).toBe(0)
    expect(s.topRecommendation).toContain("active și valide")
  })

  it("topRecommendation pentru expired certificates", () => {
    const certs = refreshCertificateStatuses([
      mkCert({ expiresAtISO: new Date(Date.now() - 10 * 86400000).toISOString() }),
    ])
    const alerts = generateGuardianAlerts(certs, [])
    const s = summarizeGuardian(certs, [], alerts)
    expect(s.topRecommendation).toContain("EXPIRAT")
  })

  it("clientsWithActiveMandates numără clienții unici", () => {
    const mandates = refreshMandateStatuses([
      mkMandate({ clientOrgId: "c1" }),
      mkMandate({ clientOrgId: "c1", type: "edeclaratii" }),
      mkMandate({ clientOrgId: "c2" }),
    ])
    const s = summarizeGuardian([], mandates, [])
    expect(s.clientsWithActiveMandates).toBe(2)
  })
})
