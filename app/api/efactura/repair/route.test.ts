import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  resolveOptionalEventActorMock: vi.fn(),
  repairEFacturaXmlMock: vi.fn(),
  mutateStateMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  appendComplianceEventsMock: vi.fn(),
  createComplianceEventMock: vi.fn(),
}))

vi.mock("@/lib/server/event-actor", () => ({
  resolveOptionalEventActor: mocks.resolveOptionalEventActorMock,
}))

vi.mock("@/lib/compliance/efactura-xml-repair", () => ({
  repairEFacturaXml: mocks.repairEFacturaXmlMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/compliance/events", () => ({
  appendComplianceEvents: mocks.appendComplianceEventsMock,
  createComplianceEvent: mocks.createComplianceEventMock,
}))

import { POST } from "./route"

describe("POST /api/efactura/repair", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveOptionalEventActorMock.mockResolvedValue(undefined)
    mocks.repairEFacturaXmlMock.mockReturnValue({
      originalXml: "<Invoice></Invoice>",
      repairedXml: "<?xml version=\"1.0\"?><Invoice></Invoice>",
      appliedFixes: [
        {
          errorCode: "T003",
          field: "XML Declaration",
          oldValue: "Lipsă",
          newValue: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
          explanation: "header",
        },
      ],
      canAutoFix: true,
    })
    mocks.createComplianceEventMock.mockImplementation((payload) => payload)
    mocks.appendComplianceEventsMock.mockImplementation((current, events) => [...(current.events ?? []), ...events])
    mocks.mutateStateMock.mockImplementation(async (updater) =>
      updater({
        events: [],
      })
    )
    mocks.buildDashboardPayloadMock.mockResolvedValue({
      state: { findings: [] },
      summary: {},
      remediationPlan: [],
      workspace: { orgId: "org-demo" },
      compliancePack: {},
      traceabilityMatrix: [],
      dsarSummary: { total: 0, urgent: 0, dueToday: 0 },
    })
  })

  it("respinge requestul fără XML", async () => {
    const response = await POST(
      new Request("http://localhost/api/efactura/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: "invoice.xml" }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Lipseste continutul XML.")
  })

  it("returnează corecțiile automate și normalizează codurile de eroare", async () => {
    const response = await POST(
      new Request("http://localhost/api/efactura/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: "factura.xml",
          xml: "<Invoice></Invoice>",
          errorCodes: ["t003", " V002 ", "bad-code", "T003"],
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.repairEFacturaXmlMock).toHaveBeenCalledWith("<Invoice></Invoice>", ["T003", "V002"])
    expect(payload.repair.documentName).toBe("factura.xml")
    expect(payload.repair.requestedErrorCodes).toEqual(["T003", "V002"])
    expect(payload.repair.appliedFixes).toHaveLength(1)
    expect(payload.message).toBe("Am pregatit corectiile sigure pentru XML-ul e-Factura.")
  })
})
