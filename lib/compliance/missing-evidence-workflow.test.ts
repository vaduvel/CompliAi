// Unit tests pentru Missing Evidence Workflow (FC-9).

import { describe, expect, it } from "vitest"

import {
  createEvidenceRequest,
  generateEmailTemplate,
  markOverdueRequests,
  summarizeEvidenceQueue,
  updateEvidenceStatus,
  type CreateEvidenceRequestInput,
} from "./missing-evidence-workflow"

function baseInput(over: Partial<CreateEvidenceRequestInput> = {}): CreateEvidenceRequestInput {
  return {
    clientOrgId: "org-c1",
    clientOrgName: "Firma Test SRL",
    clientEmail: "test@firma.ro",
    type: "contract-servicii",
    title: "Contract servicii furnizor X",
    reasonDetail: "Cross-corr R1 cere contractul aprilie 2026",
    period: "2026-04",
    dueDaysFromNow: 5,
    urgency: "normal",
    createdByEmail: "cabinet@compliai.ro",
    ...over,
  }
}

describe("createEvidenceRequest", () => {
  it("creează cerere cu status requested și timeline inițial", () => {
    const req = createEvidenceRequest(baseInput())
    expect(req.status).toBe("requested")
    expect(req.timeline).toHaveLength(1)
    expect(req.timeline[0]?.toStatus).toBe("requested")
    expect(req.timeline[0]?.fromStatus).toBeNull()
  })

  it("calculează dueISO corect din dueDaysFromNow", () => {
    const now = new Date()
    const req = createEvidenceRequest(baseInput({ dueDaysFromNow: 7 }))
    const due = new Date(req.dueISO)
    const diffDays = (due.getTime() - now.getTime()) / 86400000
    expect(diffDays).toBeGreaterThan(6.9)
    expect(diffDays).toBeLessThan(7.1)
  })

  it("propagă linkedFindingId și linkedExceptionId", () => {
    const req = createEvidenceRequest(
      baseInput({ linkedFindingId: "f-r1-abc", linkedExceptionId: "exc-123" }),
    )
    expect(req.linkedFindingId).toBe("f-r1-abc")
    expect(req.linkedExceptionId).toBe("exc-123")
  })

  it("setează urgency default normal", () => {
    const req = createEvidenceRequest(baseInput())
    expect(req.urgency).toBe("normal")
  })

  it("acceptă urgency critical", () => {
    const req = createEvidenceRequest(baseInput({ urgency: "critical" }))
    expect(req.urgency).toBe("critical")
  })
})

describe("generateEmailTemplate", () => {
  it("returnează template specific pentru AGA dividende", () => {
    const req = createEvidenceRequest(baseInput({ type: "aga-dividende" }))
    const t = generateEmailTemplate(req)
    expect(t.subject).toContain("AGA")
    expect(t.body).toContain("D205")
  })

  it("returnează template pentru contract servicii", () => {
    const req = createEvidenceRequest(baseInput({ type: "contract-servicii" }))
    const t = generateEmailTemplate(req)
    expect(t.subject).toContain("contract")
    expect(t.body).toContain("Firma Test SRL")
  })

  it("returnează fallback pentru alt-document", () => {
    const req = createEvidenceRequest(
      baseInput({ type: "alt-document", title: "Document special" }),
    )
    const t = generateEmailTemplate(req)
    expect(t.body).toContain("Document special")
  })

  it("setează reminderDaysBefore", () => {
    const req = createEvidenceRequest(baseInput({ type: "imputernicire-spv" }))
    const t = generateEmailTemplate(req)
    expect(t.reminderDaysBefore).toBeGreaterThan(0)
  })
})

describe("updateEvidenceStatus", () => {
  it("schimbă statusul și adaugă entry în timeline", () => {
    const req = createEvidenceRequest(baseInput())
    const updated = updateEvidenceStatus(req, "sent", "cabinet", "Trimis email")
    expect(updated.status).toBe("sent")
    expect(updated.timeline).toHaveLength(2)
    expect(updated.timeline[1]?.fromStatus).toBe("requested")
    expect(updated.timeline[1]?.toStatus).toBe("sent")
    expect(updated.timeline[1]?.note).toBe("Trimis email")
  })

  it("tracking actor corect", () => {
    const req = createEvidenceRequest(baseInput())
    const sent = updateEvidenceStatus(req, "sent", "cabinet")
    const ack = updateEvidenceStatus(sent, "client-acknowledged", "client")
    expect(ack.timeline[2]?.actor).toBe("client")
  })

  it("updatedAtISO se schimbă", () => {
    const req = createEvidenceRequest(baseInput({ nowISO: "2026-05-01T10:00:00Z" }))
    const updated = updateEvidenceStatus(req, "sent", "cabinet", undefined, "2026-05-02T11:00:00Z")
    expect(updated.updatedAtISO).toBe("2026-05-02T11:00:00Z")
  })
})

describe("markOverdueRequests", () => {
  it("marchează requested/sent cu dueISO trecut ca overdue", () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString()
    const futureCreated = new Date(Date.now() - 10 * 86400000).toISOString()
    const r1 = createEvidenceRequest(baseInput({ nowISO: futureCreated, dueDaysFromNow: 5 }))
    expect(r1.dueISO < new Date().toISOString()).toBe(true)
    const updated = markOverdueRequests([r1])
    expect(updated[0]?.status).toBe("overdue")
  })

  it("nu schimbă cele verified/cancelled", () => {
    const req = createEvidenceRequest(
      baseInput({ nowISO: new Date(Date.now() - 10 * 86400000).toISOString(), dueDaysFromNow: 1 }),
    )
    const verified = updateEvidenceStatus(req, "verified", "cabinet")
    const updated = markOverdueRequests([verified])
    expect(updated[0]?.status).toBe("verified")
  })
})

describe("summarizeEvidenceQueue", () => {
  it("summary gol pentru listă vidă", () => {
    const s = summarizeEvidenceQueue([])
    expect(s.total).toBe(0)
    expect(s.overdueCount).toBe(0)
  })

  it("agregă byStatus + byClient", () => {
    const r1 = createEvidenceRequest(baseInput({ clientOrgName: "A SRL" }))
    const r2 = createEvidenceRequest(baseInput({ clientOrgName: "A SRL", type: "balanta-cont" }))
    const r3 = createEvidenceRequest(baseInput({ clientOrgName: "B SRL" }))
    const sent = updateEvidenceStatus(r2, "sent", "cabinet")
    const s = summarizeEvidenceQueue([r1, sent, r3])
    expect(s.total).toBe(3)
    expect(s.byStatus.requested).toBe(2)
    expect(s.byStatus.sent).toBe(1)
    expect(s.byClient.get("A SRL")).toBe(2)
    expect(s.pendingClientResponse).toBe(1)
  })

  it("calculează overdueCount + dueIn3DaysCount", () => {
    const past = new Date(Date.now() - 10 * 86400000).toISOString()
    const overdueReq = createEvidenceRequest(baseInput({ nowISO: past, dueDaysFromNow: 5 }))
    const futureReq = createEvidenceRequest(baseInput({ dueDaysFromNow: 2 }))
    const s = summarizeEvidenceQueue([overdueReq, futureReq])
    expect(s.overdueCount).toBe(1)
    expect(s.dueIn3DaysCount).toBe(1)
  })

  it("verifiedThisMonth conține verified-uri din luna curentă", () => {
    const r1 = createEvidenceRequest(baseInput())
    const verified = updateEvidenceStatus(r1, "verified", "cabinet")
    const s = summarizeEvidenceQueue([verified])
    expect(s.verifiedThisMonth).toBe(1)
  })
})
