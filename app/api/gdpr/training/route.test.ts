import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshRoleMock: vi.fn(),
  mutateFreshStateForOrgMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
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
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateFreshStateForOrg: mocks.mutateFreshStateForOrgMock,
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
}))

import { PATCH } from "./route"

const SESSION = {
  orgId: "org-training",
  orgName: "Clinica Test SRL",
  email: "dorel@cabinet.ro",
  role: "owner",
}

function patchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/gdpr/training", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/gdpr/training", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue(SESSION)
  })

  it("deduce participantii din nota de dovada cand trainingul este validat", async () => {
    const initialState = {
      gdprTrainingRecords: [
        {
          id: "training-1",
          title: "Training GDPR personal recepție",
          audience: "specific_roles",
          participantCount: 0,
          participantNames: [],
          status: "planned",
          createdAtISO: "2026-04-30T08:00:00.000Z",
          updatedAtISO: "2026-04-30T08:00:00.000Z",
        },
      ],
      events: [],
    }

    mocks.mutateFreshStateForOrgMock.mockImplementation(
      async (_orgId: string, fn: (state: typeof initialState) => typeof initialState) => fn(initialState)
    )

    const res = await PATCH(
      patchRequest({
        id: "training-1",
        status: "completed",
        evidenceNote: "Participanți: Ana Popescu, Mihai Ionescu, Elena Radu. Confirmare semnată în sală.",
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.record.participantCount).toBe(3)
    expect(body.record.participantNames).toEqual(["Ana Popescu", "Mihai Ionescu", "Elena Radu"])
    expect(body.summary.participantsCovered).toBe(3)
  })
})
