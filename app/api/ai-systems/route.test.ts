import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { AuthzErrorMock } = vi.hoisted(() => ({
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
  AuthzError: AuthzErrorMock,
  requireFreshRole: vi.fn(),
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: vi.fn((msg: string, status: number) =>
    NextResponse.json({ error: msg }, { status })
  ),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: vi.fn(async (_orgId: string, fn: (s: unknown) => unknown) => fn(makeBaseState())),
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: vi.fn(async (state: unknown) => ({ state })),
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: vi.fn(async () => null),
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: vi.fn(async () => ({ orgId: "org-1", userEmail: "test@test.com", orgName: "Test Org" })),
}))

import { mutateStateForOrg } from "@/lib/server/mvp-store"
import type { ComplianceState } from "@/lib/compliance/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBaseState(): ComplianceState {
  return {
    aiSystems: [],
    alerts: [],
    events: [],
    scans: [],
    tasks: [],
    drifts: [],
    workspace: { id: "org-1", orgId: "org-1", name: "Test Org", orgName: "Test Org", workspaceLabel: "Test", workspaceOwner: "owner" },
  } as unknown as ComplianceState
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai-systems", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  name: "ChatGPT Intern",
  purpose: "support-chatbot",
  vendor: "OpenAI",
  usesPersonalData: false,
  makesAutomatedDecisions: false,
  impactsRights: false,
  hasHumanReview: true,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

import { POST } from "./route"
import { requireFreshRole, AuthzError } from "@/lib/server/auth"

describe("POST /api/ai-systems", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Implicit: WRITE_ROLES — owner/compliance/reviewer trec prin RBAC
    vi.mocked(requireFreshRole).mockResolvedValue({
      userId: "user-1",
      email: "demo@test.com",
      orgId: "org-1",
      orgName: "Test Org",
      role: "owner",
      exp: Date.now() + 60_000,
    } as never)
  })

  describe("RBAC — rol insuficient", () => {
    it("returnează 403 dacă rolul nu are drept de scriere", async () => {
      vi.mocked(requireFreshRole).mockImplementation(() => {
        throw new AuthzError("Rolul viewer nu permite adăugarea sistemului AI.", 403)
      })

      const res = await POST(makeRequest(validPayload))
      expect(res.status).toBe(403)
    })
  })

  describe("R-4 — DPA alert trigger", () => {
    it("creează alertă DPA când vendor-ul este extern (non-Necunoscut)", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateStateForOrg).mockImplementation(async (_orgId, fn) => {
        capturedState = fn(makeBaseState()) as ComplianceState
        return capturedState
      })

      const res = await POST(makeRequest(validPayload))
      expect(res.status).toBe(200)

      expect(capturedState).not.toBeNull()
      expect(capturedState!.alerts).toHaveLength(1)

      const alert = capturedState!.alerts[0]
      expect(alert.severity).toBe("medium")
      expect(alert.open).toBe(true)
      expect(alert.message).toContain("OpenAI")
      expect(alert.message).toContain("DPA")
      expect(alert.id).toMatch(/^alert-dpa-/)
    })

    it("NU creează alertă DPA când vendor-ul lipsește (Necunoscut implicit)", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateStateForOrg).mockImplementation(async (_orgId, fn) => {
        capturedState = fn(makeBaseState()) as ComplianceState
        return capturedState
      })

      const res = await POST(makeRequest({ ...validPayload, vendor: undefined }))
      expect(res.status).toBe(200)

      expect(capturedState!.alerts).toHaveLength(0)
    })

    it("NU creează alertă DPA când vendor-ul este 'Necunoscut' explicit", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateStateForOrg).mockImplementation(async (_orgId, fn) => {
        capturedState = fn(makeBaseState()) as ComplianceState
        return capturedState
      })

      const res = await POST(makeRequest({ ...validPayload, vendor: "Necunoscut" }))
      expect(res.status).toBe(200)

      expect(capturedState!.alerts).toHaveLength(0)
    })

    it("NU creează alertă DPA când vendor-ul este string gol", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateStateForOrg).mockImplementation(async (_orgId, fn) => {
        capturedState = fn(makeBaseState()) as ComplianceState
        return capturedState
      })

      const res = await POST(makeRequest({ ...validPayload, vendor: "   " }))
      expect(res.status).toBe(200)

      expect(capturedState!.alerts).toHaveLength(0)
    })

    it("returnează 400 dacă lipsește numele sistemului", async () => {
      const res = await POST(makeRequest({ ...validPayload, name: "" }))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBeTruthy()
    })
  })
})
