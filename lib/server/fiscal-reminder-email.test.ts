import { describe, it, expect } from "vitest"

import {
  __test__,
  shouldSendFiscalReminder,
  sendFiscalReminderEmail,
} from "./fiscal-reminder-email"

const baseFinding = {
  id: "x",
  title: "Test",
  detail: "detail",
  category: "E_FACTURA" as const,
  createdAtISO: "2026-05-10T10:00:00Z",
  legalReference: "x",
  remediationHint: "x",
  principles: ["accountability" as const],
  resolution: {
    summary: "x",
    consequences: "x",
    repairAction: "x",
    humanStep: "x",
    closureEvidence: "x",
    revalidation: "x",
  },
  sourceDocument: "x",
}

describe("shouldSendFiscalReminder", () => {
  it("trimite când există reminder URGENT", () => {
    const r = shouldSendFiscalReminder({
      orgName: "Cabinet X",
      recipientEmail: "x@x.ro",
      reminders: [
        {
          filingId: "1",
          filingType: "saft",
          period: "2026-04",
          dueISO: "2026-05-12T00:00:00Z",
          daysUntilDue: 2,
          escalationLevel: "escalation",
          message: "URGENT",
        },
      ],
      newFindings: [],
    })
    expect(r.send).toBe(true)
    expect(r.reason).toBe("urgent_filing")
  })

  it("trimite când există finding critic", () => {
    const r = shouldSendFiscalReminder({
      orgName: "X",
      recipientEmail: "x@x.ro",
      reminders: [],
      newFindings: [
        { ...baseFinding, severity: "critical" as const, risk: "high" as const },
      ],
    })
    expect(r.send).toBe(true)
    expect(r.reason).toBe("critical_finding")
  })

  it("trimite când există probleme e-Factura > 0", () => {
    const r = shouldSendFiscalReminder({
      orgName: "X",
      recipientEmail: "x@x.ro",
      reminders: [],
      newFindings: [],
      efacturaProblems: 3,
    })
    expect(r.send).toBe(true)
    expect(r.reason).toBe("efactura_problems")
  })

  it("NU trimite când totul e calm", () => {
    const r = shouldSendFiscalReminder({
      orgName: "X",
      recipientEmail: "x@x.ro",
      reminders: [],
      newFindings: [
        { ...baseFinding, severity: "low" as const, risk: "low" as const },
      ],
      efacturaProblems: 0,
    })
    expect(r.send).toBe(false)
    expect(r.reason).toBe("no_actionable_items")
  })
})

describe("urgencyTone", () => {
  it("returnează tonuri diferite per escalationLevel", () => {
    expect(__test__.urgencyTone("escalation").label).toBe("URGENT")
    expect(__test__.urgencyTone("warning").label).toBe("Atenție")
    expect(__test__.urgencyTone("reminder").label).toBe("Reminder")
  })
})

describe("buildHtml", () => {
  it("include orgName, count URGENT și un link spre dashboard", () => {
    const html = __test__.buildHtml({
      orgName: "Cabinet Test",
      recipientEmail: "x@x.ro",
      reminders: [
        {
          filingId: "1",
          filingType: "saft",
          period: "2026-04",
          dueISO: "2026-05-12T00:00:00Z",
          daysUntilDue: 2,
          escalationLevel: "escalation",
          message: "msg",
        },
      ],
      newFindings: [],
      efacturaProblems: 5,
      saftHygieneScore: 65,
    })
    expect(html).toContain("Cabinet Test")
    expect(html).toContain("URGENT")
    expect(html).toContain("/dashboard/fiscal")
    expect(html).toContain("65/100")
    expect(html).toContain("SAF-T")
  })

  it("afișează empty state când nu sunt reminders", () => {
    const html = __test__.buildHtml({
      orgName: "X",
      recipientEmail: "x@x.ro",
      reminders: [],
      newFindings: [],
    })
    expect(html).toContain("Niciun termen de depunere")
  })
})

describe("sendFiscalReminderEmail (console fallback)", () => {
  it("returnează skipped când nu există actionable items", async () => {
    const r = await sendFiscalReminderEmail({
      orgName: "X",
      recipientEmail: "x@x.ro",
      reminders: [],
      newFindings: [],
    })
    expect(r.ok).toBe(true)
    expect(r.channel).toBe("console")
    expect(r.reason).toContain("skipped")
  })

  it("loghează la console când RESEND_API_KEY lipsește dar are reminders", async () => {
    const r = await sendFiscalReminderEmail({
      orgName: "X",
      recipientEmail: "x@x.ro",
      reminders: [
        {
          filingId: "1",
          filingType: "saft",
          period: "2026-04",
          dueISO: "2026-05-12T00:00:00Z",
          daysUntilDue: 2,
          escalationLevel: "escalation",
          message: "URGENT",
        },
      ],
      newFindings: [],
    })
    expect(r.ok).toBe(true)
    // Channel poate fi "resend" dacă RESEND_API_KEY e setat în CI; "console" altfel
    expect(["resend", "console"]).toContain(r.channel)
  })
})
