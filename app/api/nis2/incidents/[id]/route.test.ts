import { beforeEach, describe, expect, it, vi } from "vitest"

import { DELETE, PATCH } from "./route"

const mocks = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  readNis2StateMock: vi.fn(),
  updateIncidentMock: vi.fn(),
  deleteIncidentMock: vi.fn(),
  mutateFreshStateMock: vi.fn().mockResolvedValue(undefined),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  readSessionFromRequest: vi.fn().mockReturnValue({ userId: "u1" }),
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/rbac", () => ({
  WRITE_ROLES: ["owner", "compliance", "reviewer"],
  DELETE_ROLES: ["owner", "compliance"],
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: mocks.readNis2StateMock,
  updateIncident: mocks.updateIncidentMock,
  deleteIncident: mocks.deleteIncidentMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateFreshState: mocks.mutateFreshStateMock,
}))

const SESSION = { userId: "user-1", orgId: "org-1", email: "test@site.ro" }
const ORG_CTX = { orgId: "org-1" }
const INCIDENT_ID = "nis2-abc123"

const BASE_INCIDENT = {
  id: INCIDENT_ID,
  title: "Incident test",
  description: "",
  severity: "high",
  status: "open",
  detectedAtISO: "2026-03-17T10:00:00.000Z",
  deadline24hISO: "2026-03-18T10:00:00.000Z",
  deadline72hISO: "2026-03-20T10:00:00.000Z",
  deadlineFinalISO: "2026-04-19T10:00:00.000Z",
  affectedSystems: ["ERP"],
  createdAtISO: "2026-03-17T10:00:00.000Z",
  updatedAtISO: "2026-03-17T10:00:00.000Z",
}

const EARLY_WARNING = {
  submittedAtISO: "2026-03-17T12:00:00.000Z",
  content: "Alertă inițială",
  initialImpactAssessment: "ERP afectat",
  crossBorderEffect: false,
}

const FULL_REPORT = {
  submittedAtISO: "2026-03-19T12:00:00.000Z",
  content: "Raport complet",
  detailedAnalysis: "Analiză detaliată",
  technicalIndicators: "IP: 1.2.3.4",
  affectedDataCategories: ["personale"],
  estimatedAffectedUsers: 100,
}

const FINAL_REPORT = {
  submittedAtISO: "2026-03-25T12:00:00.000Z",
  content: "Raport final",
  rootCauseAnalysis: "Cauza: configurare greșită firewall",
  lessonsLearned: "Testare periodică reguli firewall",
  preventiveMeasures: "Audit trimestrial",
}

function makeState(incident: Record<string, unknown>) {
  return { assessment: null, incidents: [incident], vendors: [], updatedAtISO: "2026-03-17T10:00:00.000Z" }
}

function patchRequest(id: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/nis2/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/nis2/incidents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.readNis2StateMock.mockResolvedValue(makeState(BASE_INCIDENT))
    mocks.updateIncidentMock.mockImplementation(
      (_orgId: string, _id: string, patch: Record<string, unknown>) => ({
        ...BASE_INCIDENT,
        ...patch,
      })
    )
  })

  it("permite early warning pe incident open si auto-avansează la reported-24h", async () => {
    const res = await PATCH(
      patchRequest(INCIDENT_ID, { earlyWarningReport: EARLY_WARNING }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.incident.earlyWarningReport).toEqual(EARLY_WARNING)
    expect(body.incident.status).toBe("reported-24h")
  })

  it("blocheaza raport 72h fara early warning", async () => {
    const res = await PATCH(
      patchRequest(INCIDENT_ID, { fullReport72h: FULL_REPORT }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe("STAGE_SEQUENCE_VIOLATION")
  })

  it("permite raport 72h dupa early warning", async () => {
    mocks.readNis2StateMock.mockResolvedValue(
      makeState({ ...BASE_INCIDENT, status: "reported-24h", earlyWarningReport: EARLY_WARNING })
    )

    const res = await PATCH(
      patchRequest(INCIDENT_ID, { fullReport72h: FULL_REPORT }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.incident.status).toBe("reported-72h")
  })

  it("blocheaza raport final fara raport 72h", async () => {
    mocks.readNis2StateMock.mockResolvedValue(
      makeState({ ...BASE_INCIDENT, status: "reported-24h", earlyWarningReport: EARLY_WARNING })
    )

    const res = await PATCH(
      patchRequest(INCIDENT_ID, { finalReport: FINAL_REPORT }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe("STAGE_SEQUENCE_VIOLATION")
  })

  it("permite raport final dupa 72h si auto-inchide incidentul", async () => {
    mocks.readNis2StateMock.mockResolvedValue(
      makeState({
        ...BASE_INCIDENT,
        status: "reported-72h",
        earlyWarningReport: EARLY_WARNING,
        fullReport72h: FULL_REPORT,
      })
    )

    const res = await PATCH(
      patchRequest(INCIDENT_ID, { finalReport: FINAL_REPORT }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.incident.status).toBe("closed")
    expect(body.incident.finalReport).toEqual(FINAL_REPORT)
  })

  it("blocheaza inchiderea manuala fara raport final", async () => {
    const res = await PATCH(
      patchRequest(INCIDENT_ID, { status: "closed" }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe("STAGE_SEQUENCE_VIOLATION")
  })

  it("blocheaza regresul de status", async () => {
    mocks.readNis2StateMock.mockResolvedValue(
      makeState({ ...BASE_INCIDENT, status: "reported-24h" })
    )

    const res = await PATCH(
      patchRequest(INCIDENT_ID, { status: "open" }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe("STAGE_SEQUENCE_VIOLATION")
  })

  it("permite post-incident tracking pe incident inchis", async () => {
    mocks.readNis2StateMock.mockResolvedValue(
      makeState({
        ...BASE_INCIDENT,
        status: "closed",
        earlyWarningReport: EARLY_WARNING,
        fullReport72h: FULL_REPORT,
        finalReport: FINAL_REPORT,
      })
    )

    const res = await PATCH(
      patchRequest(INCIDENT_ID, {
        postIncidentTracking: {
          remediationStartedAtISO: "2026-03-26T08:00:00.000Z",
          isRemediated: false,
        },
      }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.incident.postIncidentTracking.remediationStartedAtISO).toBeDefined()
  })

  it("permite dnscReference si dnscCorrespondence pe incident inchis", async () => {
    mocks.readNis2StateMock.mockResolvedValue(
      makeState({
        ...BASE_INCIDENT,
        status: "closed",
        earlyWarningReport: EARLY_WARNING,
        fullReport72h: FULL_REPORT,
        finalReport: FINAL_REPORT,
      })
    )

    const res = await PATCH(
      patchRequest(INCIDENT_ID, {
        postIncidentTracking: {
          dnscReference: "DNSC-2026-1234",
          dnscCorrespondence: [
            {
              id: "corr-1",
              date: "2026-03-26T10:00:00.000Z",
              direction: "received",
              summary: "Confirmare primire early warning",
              createdAtISO: "2026-03-26T10:00:00.000Z",
            },
          ],
          isRemediated: false,
        },
      }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.incident.postIncidentTracking.dnscReference).toBe("DNSC-2026-1234")
    expect(body.incident.postIncidentTracking.dnscCorrespondence).toHaveLength(1)
    expect(body.incident.postIncidentTracking.dnscCorrespondence[0].direction).toBe("received")
  })

  it("returneaza 404 pentru incident inexistent", async () => {
    mocks.readNis2StateMock.mockResolvedValue(makeState(BASE_INCIDENT))

    const res = await PATCH(
      patchRequest("nis2-inexistent", { status: "reported-24h" }),
      { params: Promise.resolve({ id: "nis2-inexistent" }) }
    )

    expect(res.status).toBe(404)
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.requireRoleMock.mockImplementation(() => {
      throw new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    })

    const res = await PATCH(
      patchRequest(INCIDENT_ID, { status: "reported-24h" }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    expect(res.status).toBe(401)
  })
})

describe("DELETE /api/nis2/incidents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue(SESSION)
    mocks.getOrgContextMock.mockResolvedValue(ORG_CTX)
    mocks.deleteIncidentMock.mockResolvedValue(true)
  })

  it("sterge incidentul si returneaza ok=true", async () => {
    const res = await DELETE(
      new Request(`http://localhost/api/nis2/incidents/${INCIDENT_ID}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: INCIDENT_ID }) }
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it("returneaza 404 daca incidentul nu exista", async () => {
    mocks.deleteIncidentMock.mockResolvedValue(false)

    const res = await DELETE(
      new Request(`http://localhost/api/nis2/incidents/nis2-inexistent`, { method: "DELETE" }),
      { params: Promise.resolve({ id: "nis2-inexistent" }) }
    )

    expect(res.status).toBe(404)
  })
})
