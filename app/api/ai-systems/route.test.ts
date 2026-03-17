import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: vi.fn(async (fn: (s: unknown) => unknown) => fn(makeBaseState())),
  readState: vi.fn(async () => makeBaseState()),
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

import { mutateState } from "@/lib/server/mvp-store"
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

describe("POST /api/ai-systems", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("R-4 — DPA alert trigger", () => {
    it("creează alertă DPA când vendor-ul este extern (non-Necunoscut)", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateState).mockImplementation(async (fn) => {
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

      vi.mocked(mutateState).mockImplementation(async (fn) => {
        capturedState = fn(makeBaseState()) as ComplianceState
        return capturedState
      })

      const res = await POST(makeRequest({ ...validPayload, vendor: undefined }))
      expect(res.status).toBe(200)

      expect(capturedState!.alerts).toHaveLength(0)
    })

    it("NU creează alertă DPA când vendor-ul este 'Necunoscut' explicit", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateState).mockImplementation(async (fn) => {
        capturedState = fn(makeBaseState()) as ComplianceState
        return capturedState
      })

      const res = await POST(makeRequest({ ...validPayload, vendor: "Necunoscut" }))
      expect(res.status).toBe(200)

      expect(capturedState!.alerts).toHaveLength(0)
    })

    it("NU creează alertă DPA când vendor-ul este string gol", async () => {
      let capturedState: ComplianceState | null = null

      vi.mocked(mutateState).mockImplementation(async (fn) => {
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
