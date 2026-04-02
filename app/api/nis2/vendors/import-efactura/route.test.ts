import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireFreshAuthenticatedSessionMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(async (_orgId: string, fn: (state: Record<string, unknown>) => unknown) =>
    fn({ alerts: [] })
  ),
  readNis2StateMock: vi.fn(),
  upsertVendorsFromEfacturaMock: vi.fn(),
  mergeNis2PackageFindingsMock: vi.fn(),
  jsonErrorMock: vi.fn((message: string, status: number, code: string) =>
    new Response(JSON.stringify({ error: message, code }), { status })
  ),
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string
    constructor(message: string, status = 401, code = "UNAUTHORIZED") {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshAuthenticatedSession: mocks.requireFreshAuthenticatedSessionMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/nis2-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/nis2-store")>("@/lib/server/nis2-store")
  return {
    ...actual,
    readNis2State: mocks.readNis2StateMock,
    upsertVendorsFromEfactura: mocks.upsertVendorsFromEfacturaMock,
  }
})

vi.mock("@/lib/server/nis2-package-sync", () => ({
  mergeNis2PackageFindings: mocks.mergeNis2PackageFindingsMock,
}))

vi.mock("@/lib/server/efactura-mock-data", () => ({
  EFACTURA_MOCK_VENDORS: [
    { name: "Amazon Web Services EMEA SARL" },
    { name: "Microsoft Ireland Operations Limited" },
  ],
}))

import { POST } from "./route"

describe("POST /api/nis2/vendors/import-efactura", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshAuthenticatedSessionMock.mockResolvedValue({ orgId: "org-1", orgName: "Org Demo", userId: "user-1" })
    mocks.readNis2StateMock.mockResolvedValue({ assessment: null, incidents: [], vendors: [] })
    mocks.upsertVendorsFromEfacturaMock.mockResolvedValue({
      added: 1,
      skipped: 0,
      techVendorsWithoutDpa: [],
    })
    mocks.mergeNis2PackageFindingsMock.mockImplementation((findings) => findings ?? [])
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.requireFreshAuthenticatedSessionMock.mockRejectedValue(
      new mocks.AuthzErrorMock("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const res = await POST(new Request("http://localhost/api/nis2/vendors/import-efactura", { method: "POST" }))

    expect(res.status).toBe(401)
  })

  it("dedupeaza furnizorii din validari dupa CUI si agregeaza invoiceCount", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      efacturaValidations: [
        {
          supplierName: "Amazon Web Services EMEA SARL",
          supplierCui: "RO12345678",
        },
        {
          supplierName: "AWS EMEA",
          supplierCui: "RO12345678",
        },
        {
          supplierName: "Microsoft Ireland Operations Limited",
        },
      ],
    })

    const res = await POST(new Request("http://localhost/api/nis2/vendors/import-efactura", { method: "POST" }))

    expect(res.status).toBe(200)
    expect(mocks.upsertVendorsFromEfacturaMock).toHaveBeenCalledWith("org-1", [
      {
        name: "Amazon Web Services EMEA SARL",
        cui: "RO12345678",
        invoiceCount: 2,
      },
      {
        name: "Microsoft Ireland Operations Limited",
        invoiceCount: 1,
      },
    ])
  })

  it("cade in demo mode cand nu exista validari e-Factura reale", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      efacturaValidations: [],
    })

    const res = await POST(new Request("http://localhost/api/nis2/vendors/import-efactura", { method: "POST" }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.demoMode).toBe(true)
    expect(mocks.upsertVendorsFromEfacturaMock).toHaveBeenCalledWith("org-1", [
      { name: "Amazon Web Services EMEA SARL", invoiceCount: 1 },
      { name: "Microsoft Ireland Operations Limited", invoiceCount: 1 },
    ])
  })

  it("genereaza alerte cand sunt detectati tech vendors fara DPA", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      efacturaValidations: [
        {
          supplierName: "OpenAI OpCo LLC",
          supplierCui: "RO12345678",
        },
      ],
    })
    mocks.upsertVendorsFromEfacturaMock.mockResolvedValue({
      added: 1,
      skipped: 0,
      techVendorsWithoutDpa: ["OpenAI OpCo LLC"],
    })

    const res = await POST(new Request("http://localhost/api/nis2/vendors/import-efactura", { method: "POST" }))

    expect(res.status).toBe(200)
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledTimes(2)
    expect(mocks.mutateStateForOrgMock).toHaveBeenNthCalledWith(
      1,
      "org-1",
      expect.any(Function),
      "Org Demo"
    )
  })
})
