import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readSessionMock: vi.fn(),
  readStateMock: vi.fn(),
  mutateStateMock: vi.fn(async (fn: (state: Record<string, unknown>) => unknown) =>
    fn({ alerts: [] })
  ),
  upsertVendorsFromEfacturaMock: vi.fn(),
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
  readSessionFromRequest: mocks.readSessionMock,
}))

vi.mock("@/lib/server/api-response", () => ({
  jsonError: mocks.jsonErrorMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/nis2-store", () => ({
  upsertVendorsFromEfactura: mocks.upsertVendorsFromEfacturaMock,
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
    mocks.readSessionMock.mockReturnValue({ orgId: "org-1", userId: "user-1" })
    mocks.upsertVendorsFromEfacturaMock.mockResolvedValue({
      added: 1,
      skipped: 0,
      techVendorsWithoutDpa: [],
    })
  })

  it("respinge accesul fara sesiune", async () => {
    mocks.readSessionMock.mockReturnValue(null)

    const res = await POST(new Request("http://localhost/api/nis2/vendors/import-efactura", { method: "POST" }))

    expect(res.status).toBe(401)
  })

  it("dedupeaza furnizorii din validari dupa CUI si agregeaza invoiceCount", async () => {
    mocks.readStateMock.mockResolvedValue({
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
    mocks.readStateMock.mockResolvedValue({
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
    mocks.readStateMock.mockResolvedValue({
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
    expect(mocks.mutateStateMock).toHaveBeenCalledOnce()
  })
})
