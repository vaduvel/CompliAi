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
  requireFreshRoleMock: vi.fn(),
  resolveOptionalEventActorMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

import { POST } from "./route"

function createRecord(input: {
  id: string
  title: string
  traceStatus: "validated" | "evidence_required" | "action_required"
  auditDecision?: "pass" | "review" | "blocked"
  familyKey?: string
  lawReference?: string
}) {
  return {
    id: input.id,
    title: input.title,
    traceStatus: input.traceStatus,
    auditDecision:
      input.auditDecision ??
      (input.traceStatus === "validated"
        ? "pass"
        : input.traceStatus === "evidence_required"
          ? "blocked"
          : "review"),
    auditGateCodes: [],
    lawReferences: [input.lawReference ?? "GDPR Art. 7"],
    controlFamily: {
      key: input.familyKey ?? "privacy-tracking",
      label: "Consent",
      description: "Consent controls",
    },
  }
}

describe("POST /api/traceability/review", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
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

  it("blocheaza confirmarea pe control individual cand dovada e slabă", async () => {
    const currentState = {
      traceabilityReviews: {},
      events: [],
    }

    const traceabilityMatrix = [
      createRecord({
        id: "trace-rem-task-1",
        title: "Banner consimțământ",
        traceStatus: "action_required",
      }),
    ]

    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({
      state,
      traceabilityMatrix,
      remediationPlan: [],
      summary: {},
      workspace: { orgId: "org-1" },
      compliancePack: {},
    }))
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: typeof currentState) => unknown) =>
      updater(currentState)
    )

    const response = await POST(
      new Request("http://localhost/api/traceability/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "record",
          traceId: "trace-rem-task-1",
          action: "confirm",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error).toContain("dovadă slabă sau validare nefinalizată")
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledOnce()
  })

  it("blocheaza confirmarea pe articol daca un control este încă needs review", async () => {
    const currentState = {
      traceabilityReviews: {},
      events: [],
    }

    const traceabilityMatrix = [
      createRecord({
        id: "trace-rem-task-1",
        title: "Banner consimțământ",
        traceStatus: "validated",
        lawReference: "GDPR Art. 7",
      }),
      createRecord({
        id: "trace-rem-task-2",
        title: "Consent log",
        traceStatus: "action_required",
        lawReference: "GDPR Art. 7",
      }),
    ]

    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({
      state,
      traceabilityMatrix,
      remediationPlan: [],
      summary: {},
      workspace: { orgId: "org-1" },
      compliancePack: {},
    }))
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: typeof currentState) => unknown) =>
      updater(currentState)
    )

    const response = await POST(
      new Request("http://localhost/api/traceability/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "law_reference",
          lawReference: "GDPR Art. 7",
          action: "confirm",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error).toContain("Consent log")
  })

  it("blocheaza confirmarea pe familie daca există controale nevalidate", async () => {
    const currentState = {
      traceabilityReviews: {},
      events: [],
    }

    const traceabilityMatrix = [
      createRecord({
        id: "trace-rem-task-1",
        title: "Workflow review uman",
        traceStatus: "validated",
        familyKey: "human-oversight",
      }),
      createRecord({
        id: "trace-rem-task-2",
        title: "Override log",
        traceStatus: "evidence_required",
        familyKey: "human-oversight",
      }),
    ]

    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({
      state,
      traceabilityMatrix,
      remediationPlan: [],
      summary: {},
      workspace: { orgId: "org-1" },
      compliancePack: {},
    }))
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: typeof currentState) => unknown) =>
      updater(currentState)
    )

    const response = await POST(
      new Request("http://localhost/api/traceability/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "family",
          familyKey: "human-oversight",
          action: "confirm",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error).toContain("Override log")
  })

  it("permite confirmarea când toate controalele selectate sunt validate", async () => {
    const currentState = {
      traceabilityReviews: {},
      events: [],
    }

    const traceabilityMatrix = [
      createRecord({
        id: "trace-rem-task-1",
        title: "Banner consimțământ",
        traceStatus: "validated",
      }),
    ]

    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({
      state,
      traceabilityMatrix,
      remediationPlan: [],
      summary: {},
      workspace: { orgId: "org-1" },
      compliancePack: {},
    }))
    mocks.mutateStateForOrgMock.mockImplementation(async (_orgId: string, updater: (state: typeof currentState) => Promise<unknown>) =>
      updater(currentState)
    )

    const response = await POST(
      new Request("http://localhost/api/traceability/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "record",
          traceId: "trace-rem-task-1",
          action: "confirm",
          note: "Revizuit manual.",
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toContain("Controlul a fost confirmat")
    expect(payload.state.traceabilityReviews["trace-rem-task-1"]).toMatchObject({
      confirmedByUser: true,
      note: "Revizuit manual.",
    })
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith("org-1", expect.any(Function), "Org Demo")
  })
})
