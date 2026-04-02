import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  readStateForOrgMock: vi.fn(),
  requireRoleMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
  readStateForOrg: mocks.readStateForOrgMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

import { POST } from "./route"

describe("POST /api/traceability/family-evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-1",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "reviewer",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({
      orgId: "org-ctx",
      orgName: "Workspace Org",
      workspaceLabel: "Workspace",
      workspaceOwner: "Owner",
      workspaceInitials: "WO",
      userRole: "reviewer",
    })
    mocks.resolveOptionalEventActorMock.mockResolvedValue({
      actorId: "user-1",
      actorLabel: "Ion Popescu",
      actorRole: "reviewer",
      actorSource: "session",
    })
  })

  it("reutilizeaza metadata de evidence hidratata din registrul cloud", async () => {
    const currentState = {
      taskState: {
        "rem-source": {
          status: "done",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
          validationStatus: "passed",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.png",
            mimeType: "image/png",
            sizeBytes: 42,
            uploadedAtISO: "2026-03-13T09:00:00.000Z",
            kind: "screenshot",
            storageProvider: "local_private",
            storageKey: "local/proof.png",
            accessPath: "/api/local-proof",
          },
        },
        "rem-target": {
          status: "todo",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
      events: [],
      traceabilityReviews: {},
    }

    const hydratedState = {
      ...currentState,
      taskState: {
        ...currentState.taskState,
        "rem-source": {
          ...currentState.taskState["rem-source"],
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.png",
            mimeType: "image/png",
            sizeBytes: 42,
            uploadedAtISO: "2026-03-13T09:00:00.000Z",
            kind: "screenshot",
            storageProvider: "supabase_private",
            storageKey: "org/source/proof.png",
            accessPath: "/api/tasks/rem-source/evidence/evidence-1",
          },
        },
      },
    }

    const remediationPlan = [
      {
        id: "source",
        title: "Control sursa",
        severity: "high",
        priority: "P1",
        owner: "DPO",
        evidence: "Screenshot",
        evidenceTypes: ["screenshot"],
        lawReference: "GDPR Art. 7",
        validationKind: "tracking-consent",
      },
      {
        id: "target",
        title: "Control tinta",
        severity: "high",
        priority: "P1",
        owner: "DPO",
        evidence: "Screenshot",
        evidenceTypes: ["screenshot"],
        lawReference: "GDPR Art. 7",
        validationKind: "tracking-consent",
      },
    ]

    const traceabilityMatrix = [
      {
        entryKind: "control_task",
        entryId: "rem-source",
        controlFamily: { key: "privacy-tracking", label: "Consent", description: "Consent" },
        lawReferences: ["GDPR Art. 7"],
      },
      {
        entryKind: "control_task",
        entryId: "rem-target",
        controlFamily: { key: "privacy-tracking", label: "Consent", description: "Consent" },
        lawReferences: ["GDPR Art. 7"],
      },
    ]

    mocks.readStateForOrgMock.mockResolvedValue(currentState)
    mocks.buildDashboardPayloadMock
      .mockResolvedValueOnce({
        state: hydratedState,
        remediationPlan,
        traceabilityMatrix,
      })
      .mockImplementationOnce(async (state) => ({
        state,
        remediationPlan,
        traceabilityMatrix,
      }))

    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: typeof currentState) => unknown) =>
      updater(currentState)
    )

    const response = await POST(
      new Request("http://localhost/api/traceability/family-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyKey: "privacy-tracking" }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.state.taskState["rem-target"].attachedEvidenceMeta.storageProvider).toBe(
      "supabase_private"
    )
    expect(payload.state.taskState["rem-target"].attachedEvidenceMeta.storageKey).toBe(
      "org/source/proof.png"
    )
    expect(payload.message).toContain("Dovada a fost reutilizată")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })

  it("blocheaza reuse-ul cand dovada sursa este marcata ca slaba", async () => {
    const currentState = {
      taskState: {
        "rem-source": {
          status: "done",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
          validationStatus: "passed",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.txt",
            mimeType: "application/octet-stream",
            sizeBytes: 42,
            uploadedAtISO: "2026-03-13T09:00:00.000Z",
            kind: "other",
            quality: {
              status: "weak",
              summary: "Dovada cere review.",
              reasonCodes: ["generic_kind"],
              checkedAtISO: "2026-03-13T09:00:00.000Z",
            },
          },
        },
      },
      events: [],
      traceabilityReviews: {},
      driftRecords: [],
    }

    mocks.readStateForOrgMock.mockResolvedValue(currentState)
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: currentState,
      remediationPlan: [
        {
          id: "source",
          title: "Control sursa",
          severity: "high",
          priority: "P1",
          owner: "DPO",
          evidence: "Screenshot",
          evidenceTypes: ["screenshot"],
          lawReference: "GDPR Art. 7",
          validationKind: "tracking-consent",
        },
      ],
      traceabilityMatrix: [
        {
          entryKind: "control_task",
          entryId: "rem-source",
          controlFamily: { key: "privacy-tracking", label: "Consent", description: "Consent" },
          lawReferences: ["GDPR Art. 7"],
        },
      ],
    })

    const response = await POST(
      new Request("http://localhost/api/traceability/family-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyKey: "privacy-tracking" }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(400)
    expect(payload.error).toContain("marcată ca slabă")
  })

  it("blocheaza targeturile care au drift deschis chiar daca familia permite reuse", async () => {
    const currentState = {
      taskState: {
        "rem-source": {
          status: "done",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
          validationStatus: "passed",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.png",
            mimeType: "image/png",
            sizeBytes: 42_000,
            uploadedAtISO: "2026-03-13T09:00:00.000Z",
            kind: "screenshot",
            quality: {
              status: "sufficient",
              summary: "Dovada pare suficientă.",
              reasonCodes: [],
              checkedAtISO: "2026-03-13T09:00:00.000Z",
            },
          },
        },
        "rem-target": {
          status: "todo",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
      events: [],
      traceabilityReviews: {},
      driftRecords: [
        {
          id: "drift-1",
          type: "compliance_drift",
          change: "tracking_detected",
          severity: "high",
          summary: "Tracking detectat",
          detectedAtISO: "2026-03-13T09:30:00.000Z",
          open: true,
          before: {},
          after: {},
        },
      ],
    }

    const remediationPlan = [
      {
        id: "source",
        title: "Control sursa",
        severity: "high",
        priority: "P1",
        owner: "DPO",
        evidence: "Screenshot",
        evidenceTypes: ["screenshot"],
        lawReference: "GDPR Art. 7",
        validationKind: "tracking-consent",
      },
      {
        id: "target",
        title: "Control tinta",
        severity: "high",
        priority: "P1",
        owner: "DPO",
        evidence: "Screenshot",
        evidenceTypes: ["screenshot"],
        lawReference: "GDPR Art. 7",
        validationKind: "tracking-consent",
        relatedDriftIds: ["drift-1"],
      },
    ]

    const traceabilityMatrix = [
      {
        entryKind: "control_task",
        entryId: "rem-source",
        controlFamily: { key: "privacy-tracking", label: "Consent", description: "Consent" },
        lawReferences: ["GDPR Art. 7"],
      },
      {
        entryKind: "control_task",
        entryId: "rem-target",
        controlFamily: { key: "privacy-tracking", label: "Consent", description: "Consent" },
        lawReferences: ["GDPR Art. 7"],
      },
    ]

    mocks.readStateForOrgMock.mockResolvedValue(currentState)
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: currentState,
      remediationPlan,
      traceabilityMatrix,
    })

    const response = await POST(
      new Request("http://localhost/api/traceability/family-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyKey: "privacy-tracking" }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(400)
    expect(payload.error).toContain("drift-uri deschise")
  })
})
