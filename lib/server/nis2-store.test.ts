import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock fs before importing the store
const fsMocks = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  writeFileMock: vi.fn(),
  mkdirMock: vi.fn(),
}))

vi.mock("node:fs", () => ({
  promises: {
    readFile: fsMocks.readFileMock,
    writeFile: fsMocks.writeFileMock,
    mkdir: fsMocks.mkdirMock,
  },
}))

import {
  readNis2State,
  createIncident,
  updateIncident,
  deleteIncident,
  createVendor,
  updateVendor,
  deleteVendor,
  saveNis2Assessment,
  upsertVendorsFromEfactura,
  buildNis2Findings,
  buildNis2Package,
} from "./nis2-store"

const EMPTY_STATE = {
  assessment: null,
  incidents: [],
  vendors: [],
  updatedAtISO: expect.any(String),
}

describe("nis2-store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fsMocks.mkdirMock.mockResolvedValue(undefined)
    fsMocks.writeFileMock.mockResolvedValue(undefined)
  })

  // ── readNis2State ───────────────────────────────────────────────────────────

  it("returneaza starea goala daca fisierul nu exista", async () => {
    fsMocks.readFileMock.mockRejectedValue(new Error("ENOENT"))
    const state = await readNis2State("org-1")
    expect(state.incidents).toEqual([])
    expect(state.vendors).toEqual([])
    expect(state.assessment).toBeNull()
  })

  it("returneaza starea parsata din fisier", async () => {
    const stored = {
      assessment: null,
      incidents: [{ id: "nis2-abc", title: "Test", severity: "high", status: "open" }],
      vendors: [],
      updatedAtISO: "2026-01-01T00:00:00.000Z",
    }
    fsMocks.readFileMock.mockResolvedValue(JSON.stringify(stored))
    const state = await readNis2State("org-1")
    expect(state.incidents).toHaveLength(1)
    expect(state.incidents[0].id).toBe("nis2-abc")
  })

  // ── createIncident ──────────────────────────────────────────────────────────

  it("creeaza incident cu deadline-uri SLA calculate automat", async () => {
    fsMocks.readFileMock.mockRejectedValue(new Error("ENOENT"))

    const incident = await createIncident("org-1", {
      title: "Acces neautorizat",
      description: "Detalii incident",
      severity: "high",
      affectedSystems: ["ERP", "Email"],
      detectedAtISO: "2026-03-17T10:00:00.000Z",
    })

    expect(incident.title).toBe("Acces neautorizat")
    expect(incident.severity).toBe("high")
    expect(incident.status).toBe("open")
    expect(incident.id).toMatch(/^nis2-/)

    // SLA: 24h si 72h de la detectie, final = 72h + 30 zile (nu de la incident)
    const detected = new Date("2026-03-17T10:00:00.000Z").getTime()
    const deadline72 = detected + 72 * 3600_000
    expect(new Date(incident.deadline24hISO).getTime()).toBe(detected + 24 * 3600_000)
    expect(new Date(incident.deadline72hISO).getTime()).toBe(deadline72)
    expect(new Date(incident.deadlineFinalISO).getTime()).toBe(deadline72 + 30 * 24 * 3600_000)

    expect(fsMocks.writeFileMock).toHaveBeenCalledOnce()
  })

  it("foloseste timestamp curent daca detectedAtISO lipseste", async () => {
    fsMocks.readFileMock.mockRejectedValue(new Error("ENOENT"))
    const before = Date.now()

    const incident = await createIncident("org-1", {
      title: "Incident fara data",
      description: "",
      severity: "low",
      affectedSystems: [],
    })

    const after = Date.now()
    const detected = new Date(incident.detectedAtISO).getTime()
    expect(detected).toBeGreaterThanOrEqual(before)
    expect(detected).toBeLessThanOrEqual(after)
  })

  it("prependeaza noul incident la lista", async () => {
    const existing = {
      assessment: null,
      incidents: [
        {
          id: "nis2-old",
          title: "Vechi",
          status: "open",
          severity: "low",
          description: "",
          detectedAtISO: "2026-01-01T00:00:00.000Z",
          deadline24hISO: "2026-01-02T00:00:00.000Z",
          deadline72hISO: "2026-01-04T00:00:00.000Z",
          deadlineFinalISO: "2026-02-03T00:00:00.000Z",
          affectedSystems: [],
          createdAtISO: "2026-01-01T00:00:00.000Z",
          updatedAtISO: "2026-01-01T00:00:00.000Z",
        },
      ],
      vendors: [],
      updatedAtISO: "2026-01-01T00:00:00.000Z",
    }
    fsMocks.readFileMock.mockResolvedValue(JSON.stringify(existing))

    const written: string[] = []
    fsMocks.writeFileMock.mockImplementation((_path: string, content: string) => {
      written.push(content)
      return Promise.resolve()
    })

    await createIncident("org-1", {
      title: "Nou",
      description: "",
      severity: "critical",
      affectedSystems: [],
    })

    const saved = JSON.parse(written[0])
    expect(saved.incidents[0].title).toBe("Nou")
    expect(saved.incidents[1].id).toBe("nis2-old")
  })

  // ── updateIncident ──────────────────────────────────────────────────────────

  it("actualizeaza statusul incidentului", async () => {
    const incidentId = "nis2-abc123"
    const existing = {
      assessment: null,
      incidents: [
        {
          id: incidentId,
          title: "Test",
          description: "",
          severity: "high",
          status: "open",
          detectedAtISO: "2026-03-17T10:00:00.000Z",
          deadline24hISO: "2026-03-18T10:00:00.000Z",
          deadline72hISO: "2026-03-20T10:00:00.000Z",
          deadlineFinalISO: "2026-04-19T10:00:00.000Z",
          affectedSystems: [],
          createdAtISO: "2026-03-17T10:00:00.000Z",
          updatedAtISO: "2026-03-17T10:00:00.000Z",
        },
      ],
      vendors: [],
      updatedAtISO: "2026-03-17T10:00:00.000Z",
    }
    fsMocks.readFileMock.mockResolvedValue(JSON.stringify(existing))

    const updated = await updateIncident("org-1", incidentId, { status: "reported-24h" })

    expect(updated).not.toBeNull()
    expect(updated!.status).toBe("reported-24h")
    expect(fsMocks.writeFileMock).toHaveBeenCalledOnce()
  })

  it("returneaza null pentru incident inexistent", async () => {
    fsMocks.readFileMock.mockResolvedValue(
      JSON.stringify({ assessment: null, incidents: [], vendors: [], updatedAtISO: "" })
    )
    const result = await updateIncident("org-1", "nis2-inexistent", { status: "closed" })
    expect(result).toBeNull()
    expect(fsMocks.writeFileMock).not.toHaveBeenCalled()
  })

  // ── deleteIncident ──────────────────────────────────────────────────────────

  it("sterge incidentul si returneaza true", async () => {
    const existing = {
      assessment: null,
      incidents: [{ id: "nis2-del", title: "De sters", status: "open", severity: "low" }],
      vendors: [],
      updatedAtISO: "",
    }
    fsMocks.readFileMock.mockResolvedValue(JSON.stringify(existing))

    const deleted = await deleteIncident("org-1", "nis2-del")
    expect(deleted).toBe(true)
    expect(fsMocks.writeFileMock).toHaveBeenCalledOnce()
  })

  it("returneaza false daca incidentul nu exista", async () => {
    fsMocks.readFileMock.mockResolvedValue(
      JSON.stringify({ assessment: null, incidents: [], vendors: [], updatedAtISO: "" })
    )
    const deleted = await deleteIncident("org-1", "nis2-inexistent")
    expect(deleted).toBe(false)
    expect(fsMocks.writeFileMock).not.toHaveBeenCalled()
  })

  // ── createVendor ────────────────────────────────────────────────────────────

  it("creeaza vendor cu campuri complete", async () => {
    fsMocks.readFileMock.mockRejectedValue(new Error("ENOENT"))

    const vendor = await createVendor("org-1", {
      name: "AWS Romania",
      service: "Cloud hosting",
      riskLevel: "high",
      hasSecurityClause: true,
      hasIncidentNotification: true,
      hasAuditRight: false,
      notes: "SOC2 Type II",
      contractReviewAtISO: "2027-01-01T00:00:00.000Z",
    })

    expect(vendor.name).toBe("AWS Romania")
    expect(vendor.riskLevel).toBe("high")
    expect(vendor.hasSecurityClause).toBe(true)
    expect(vendor.id).toMatch(/^nis2-/)
    expect(vendor.createdAtISO).toBeDefined()
  })

  it("importa furnizori din e-Factura si pastreaza CUI-ul detectat", async () => {
    fsMocks.readFileMock.mockRejectedValue(new Error("ENOENT"))

    const written: string[] = []
    fsMocks.writeFileMock.mockImplementation((_path: string, content: string) => {
      written.push(content)
      return Promise.resolve()
    })

    const result = await upsertVendorsFromEfactura("org-1", [
      { name: "Amazon Web Services EMEA SARL", cui: "RO12345678", invoiceCount: 2 },
    ])

    expect(result.added).toBe(1)
    expect(result.techVendorsWithoutDpa).toEqual(["Amazon Web Services EMEA SARL"])

    const saved = JSON.parse(written[0])
    expect(saved.vendors[0].name).toBe("Amazon Web Services EMEA SARL")
    expect(saved.vendors[0].cui).toBe("RO12345678")
    expect(saved.vendors[0].notes).toContain("RO12345678")
    expect(saved.vendors[0].notes).toContain("2 validări e-Factura")
  })

  it("nu creeaza duplicate cand vendorul exista deja cu acelasi CUI", async () => {
    fsMocks.readFileMock.mockResolvedValue(
      JSON.stringify({
        assessment: null,
        incidents: [],
        vendors: [
          {
            id: "nis2-aws",
            name: "AWS EMEA",
            cui: "RO12345678",
            service: "Cloud hosting",
            riskLevel: "high",
            hasSecurityClause: false,
            hasIncidentNotification: false,
            hasAuditRight: false,
            notes: "",
            createdAtISO: "2026-01-01T00:00:00.000Z",
            updatedAtISO: "2026-01-01T00:00:00.000Z",
          },
        ],
        updatedAtISO: "2026-01-01T00:00:00.000Z",
      })
    )

    const result = await upsertVendorsFromEfactura("org-1", [
      { name: "Amazon Web Services EMEA SARL", cui: "RO12345678" },
    ])

    expect(result.added).toBe(0)
    expect(result.skipped).toBe(1)
    expect(fsMocks.writeFileMock).not.toHaveBeenCalled()
  })

  // ── updateVendor ────────────────────────────────────────────────────────────

  it("actualizeaza riscul vendor-ului", async () => {
    const vendorId = "nis2-vnd123"
    const existing = {
      assessment: null,
      incidents: [],
      vendors: [
        {
          id: vendorId,
          name: "Vendor X",
          service: "SaaS",
          riskLevel: "medium",
          hasSecurityClause: false,
          hasIncidentNotification: false,
          hasAuditRight: false,
          notes: "",
          createdAtISO: "2026-01-01T00:00:00.000Z",
          updatedAtISO: "2026-01-01T00:00:00.000Z",
        },
      ],
      updatedAtISO: "2026-01-01T00:00:00.000Z",
    }
    fsMocks.readFileMock.mockResolvedValue(JSON.stringify(existing))

    const updated = await updateVendor("org-1", vendorId, { riskLevel: "critical" })
    expect(updated!.riskLevel).toBe("critical")
  })

  it("returneaza null pentru vendor inexistent", async () => {
    fsMocks.readFileMock.mockResolvedValue(
      JSON.stringify({ assessment: null, incidents: [], vendors: [], updatedAtISO: "" })
    )
    const result = await updateVendor("org-1", "nis2-inexistent", { riskLevel: "low" })
    expect(result).toBeNull()
  })

  // ── deleteVendor ────────────────────────────────────────────────────────────

  it("sterge vendor-ul si returneaza true", async () => {
    const existing = {
      assessment: null,
      incidents: [],
      vendors: [{ id: "nis2-vdel", name: "De sters" }],
      updatedAtISO: "",
    }
    fsMocks.readFileMock.mockResolvedValue(JSON.stringify(existing))

    const deleted = await deleteVendor("org-1", "nis2-vdel")
    expect(deleted).toBe(true)
  })

  // ── saveNis2Assessment ──────────────────────────────────────────────────────

  it("salveaza evaluarea NIS2 in starea org-ului", async () => {
    fsMocks.readFileMock.mockRejectedValue(new Error("ENOENT"))

    const written: string[] = []
    fsMocks.writeFileMock.mockImplementation((_p: string, content: string) => {
      written.push(content)
      return Promise.resolve()
    })

    await saveNis2Assessment("org-1", {
      sector: "banking",
      answers: { "nis2-rm-01": "yes", "nis2-ir-01": "partial" },
      savedAtISO: "2026-03-17T10:00:00.000Z",
      score: 72,
      maturityLabel: "partial",
    })

    const saved = JSON.parse(written[0])
    expect(saved.assessment.sector).toBe("banking")
    expect(saved.assessment.score).toBe(72)
    expect(saved.assessment.maturityLabel).toBe("partial")
  })

  // ── buildNis2Findings / buildNis2Package ───────────────────────────────────

  it("genereaza findings NIS2 pachetate din DNSC, assessment, incidente, vendori si maturitate", () => {
    const findings = buildNis2Findings(
      {
        assessment: { score: 41, completedAtISO: "2026-03-17T10:00:00.000Z" } as never,
        incidents: [
          {
            id: "inc-1",
            status: "open",
            severity: "high",
            title: "Atac ransomware",
            detectedAtISO: "2026-03-10T10:00:00.000Z",
          },
        ] as never,
        vendors: [
          {
            id: "vendor-1",
            name: "Cloud Corp",
            riskLevel: "critical",
            nextReviewDue: "2026-03-01T00:00:00.000Z",
          },
        ] as never,
        dnscRegistrationStatus: "not-started",
        maturityAssessment: { overallScore: 28 } as never,
      } as never,
      "2026-03-20T10:00:00.000Z"
    )

    expect(findings.map((finding) => finding.id)).toEqual(
      expect.arrayContaining([
        "nis2-dnsc-registration",
        "nis2-assessment-gap",
        "nis2-open-incident",
        "nis2-vendor-review-overdue",
        "nis2-maturity-low",
      ])
    )
  })

  it("construiește secțiunea nis2Package pentru audit pack", () => {
    const pkg = buildNis2Package(
      {
        assessment: { score: 64, completedAtISO: "2026-03-17T10:00:00.000Z" } as never,
        incidents: [
          { id: "inc-open", status: "open", severity: "medium", title: "Mail outage", detectedAtISO: "2026-03-19T08:00:00.000Z" },
          { id: "inc-closed", status: "closed", severity: "low", title: "Resolved", detectedAtISO: "2026-03-18T08:00:00.000Z" },
        ] as never,
        vendors: [
          { id: "vendor-1", name: "Cloud Corp", riskLevel: "critical", nextReviewDue: "2026-03-01T00:00:00.000Z" },
          { id: "vendor-2", name: "SOC Partner", riskLevel: "medium" },
        ] as never,
        dnscRegistrationStatus: "confirmed",
        maturityAssessment: { overallScore: 55 } as never,
      } as never,
      "2026-03-20T10:00:00.000Z"
    )

    expect(pkg.applicable).toBe(true)
    expect(pkg.dnscStatus).toBe("confirmed")
    expect(pkg.assessmentScore).toBe(64)
    expect(pkg.openIncidents).toBe(1)
    expect(pkg.criticalVendors).toBe(1)
    expect(pkg.maturityScore).toBe(55)
    expect(pkg.handoffNote).toContain("gap")
  })
})
