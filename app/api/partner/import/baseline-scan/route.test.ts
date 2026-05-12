/**
 * Regression test for Faza 3.5g fix (commit 11110b9):
 * Cabinet-fiscal must NOT receive DPO/GDPR/NIS2 findings during baseline scan.
 * Mircea (contabil CECCAR) doesn't want non-fiscal noise on his clients.
 */
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
  requireFreshRole: vi.fn(async () => ({
    userId: "u1",
    orgId: "org-1",
    orgName: "Cabinet Mircea",
    email: "mircea@test.test",
    role: "owner",
    workspaceMode: "partner",
    icpSegment: "cabinet-fiscal",
  })),
  resolveUserMode: vi.fn(async () => "partner"),
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: vi.fn((msg: string, status: number, code?: string) =>
    NextResponse.json({ error: msg, code }, { status })
  ),
}))

const stateStore: Record<string, unknown> = {}
function makeBaseState() {
  return {
    workspace: { id: "org-1", orgId: "org-1", name: "Client SRL", orgName: "Client SRL", workspaceLabel: "Client", workspaceOwner: "owner" },
    orgProfile: {
      orgName: "Client SRL",
      sector: "services",
      employeeCount: 5,
      website: null,
      cui: null,
    },
    findings: [],
    events: [],
    scans: [],
    intakeAnswers: null,
    gdprTrainingRecords: [],
  }
}

vi.mock("@/lib/server/mvp-store", () => ({
  readStateForOrg: vi.fn(async (orgId: string) => {
    if (!stateStore[orgId]) stateStore[orgId] = makeBaseState()
    return stateStore[orgId]
  }),
  writeStateForOrg: vi.fn(async (orgId: string, state: unknown) => {
    stateStore[orgId] = state
  }),
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: vi.fn(() => "local"),
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: vi.fn(() => false),
}))

vi.mock("@/lib/server/supabase-org-state", () => ({
  shouldUseSupabaseOrgStateAsPrimary: vi.fn(() => false),
}))

vi.mock("@/lib/server/cloud-fallback-policy", () => ({
  isLocalFallbackAllowedForCloudPrimary: vi.fn(() => false),
}))

vi.mock("@/lib/server/anaf-company-lookup", () => ({
  lookupOrgProfilePrefillByCui: vi.fn(async () => null),
}))

vi.mock("@/lib/server/website-prefill-signals", () => ({
  buildWebsitePrefillSignals: vi.fn(async () => ({ suggestions: {}, websiteSignals: null })),
}))

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: vi.fn(async () => null),
  buildNis2Findings: vi.fn(() => [
    { id: "nis2-test", findingTypeId: "NIS2-TEST", title: "NIS2 finding", detail: "x", severity: "medium", status: "open" },
  ]),
}))

vi.mock("@/lib/compliance/romanian-privacy-findings", () => ({
  buildRomanianPrivacyFindings: vi.fn(() => [
    { id: "gdpr-test", findingTypeId: "GDPR-TEST", title: "GDPR finding", detail: "x", severity: "high", status: "open" },
    { id: "intake-gdpr-training-tracker", findingTypeId: "GDPR-TRAIN", title: "Training", detail: "x", severity: "medium", status: "open" },
  ]),
}))

vi.mock("@/lib/compliance/intake-engine", () => ({
  buildInitialFindings: vi.fn((_a: unknown, opts: { supplementalFindings?: Array<{ id: string }> } = {}) => [
    { id: "dpo-finding-1", findingTypeId: "DPO-1", title: "DPO finding", detail: "x", severity: "high", status: "open" },
    ...(opts.supplementalFindings ?? []),
  ]),
  buildInitialIntakeAnswers: vi.fn(() => ({})),
}))

vi.mock("@/lib/compliance/import-baseline-profile", () => ({
  buildImportBaselineAnswers: vi.fn(() => ({})),
}))

vi.mock("@/lib/compliance/applicability", () => ({
  evaluateApplicability: vi.fn(() => ({ frameworks: [] })),
}))

vi.mock("@/lib/server/request-validation", () => ({
  normalizeWebsiteUrl: vi.fn((u: string | null | undefined) => u ?? null),
}))

import { POST } from "./route"

function makeRequest(body: unknown, icpSegment?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json" })
  if (icpSegment) headers.set("x-compliscan-icp-segment", icpSegment)
  return new Request("http://test/api/partner/import/baseline-scan", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

describe("baseline-scan — cabinet-fiscal ICP scoping (Faza 3.5g fix)", () => {
  beforeEach(() => {
    for (const k of Object.keys(stateStore)) delete stateStore[k]
  })

  it("SKIPS DPO/GDPR/NIS2 findings when x-compliscan-icp-segment=cabinet-fiscal", async () => {
    const req = makeRequest({ orgId: "client-mgh" }, "cabinet-fiscal")
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.findingsCount).toBe(0)
    const saved = stateStore["client-mgh"] as { findings: unknown[]; gdprTrainingRecords?: unknown[] }
    expect(saved.findings).toHaveLength(0)
    expect(saved.gdprTrainingRecords ?? []).toHaveLength(0)
  })

  it("INCLUDES DPO/GDPR/NIS2 findings when icp-segment is missing (cabinet-dpo default)", async () => {
    const req = makeRequest({ orgId: "client-dpo" })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.findingsCount).toBeGreaterThan(0)
    const saved = stateStore["client-dpo"] as { findings: Array<{ findingTypeId: string }>; gdprTrainingRecords?: unknown[] }
    const ids = saved.findings.map((f) => f.findingTypeId)
    expect(ids).toContain("DPO-1")
    expect(ids).toContain("NIS2-TEST")
    expect(ids).toContain("GDPR-TEST")
    expect((saved.gdprTrainingRecords ?? []).length).toBeGreaterThan(0)
  })

  it("INCLUDES findings when icp-segment is non-fiscal (cabinet-dpo)", async () => {
    const req = makeRequest({ orgId: "client-dpo-explicit" }, "cabinet-dpo")
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.findingsCount).toBeGreaterThan(0)
  })

  it("returns 400 when orgId is missing", async () => {
    const req = makeRequest({}, "cabinet-fiscal")
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
