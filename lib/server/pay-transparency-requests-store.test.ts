// Pay Transparency — Employee Request Portal store tests

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  computeDaysRemaining,
  createRequest,
  getRequest,
  getRequestByToken,
  listRequestsForOrg,
  listRequestsNearingDeadline,
  transitionRequest,
  type EmployeeSalaryRequest,
} from "./pay-transparency-requests-store"

const TEST_ORG = "test-org-pt-requests"
const NOW_ISO = "2026-05-01T10:00:00.000Z"

// Reset storage between tests by writing empty state
import { createAdaptiveStorage } from "./storage-adapter"
const cleanupStorage = createAdaptiveStorage<{ requests: EmployeeSalaryRequest[] }>(
  "pay-transparency-requests",
  "pay_transparency_requests_state",
)

beforeEach(async () => {
  await cleanupStorage.write(TEST_ORG, { requests: [] })
})

afterEach(async () => {
  await cleanupStorage.write(TEST_ORG, { requests: [] })
})

describe("pay-transparency-requests-store", () => {
  describe("createRequest", () => {
    it("creates request with token + deadline 30 days from now", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Marketing Specialist",
        question: "average_salary_role",
        nowISO: NOW_ISO,
      })
      expect(req.id).toMatch(/^req_/)
      expect(req.token).toMatch(/^er_/)
      expect(req.status).toBe("received")
      expect(req.jobRole).toBe("Marketing Specialist")
      expect(req.question).toBe("average_salary_role")
      // Deadline should be ~30 days from receivedAtISO
      const receivedMs = new Date(req.receivedAtISO).getTime()
      const deadlineMs = new Date(req.deadlineISO).getTime()
      const days = (deadlineMs - receivedMs) / 86_400_000
      expect(days).toBeCloseTo(30, 0)
    })

    it("trims whitespace and handles anonymous (no name/email)", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "  Sales Rep  ",
        question: "own_salary",
        employeeName: "  ",
        contactEmail: "",
        nowISO: NOW_ISO,
      })
      expect(req.jobRole).toBe("Sales Rep")
      expect(req.employeeName).toBeNull()
      expect(req.contactEmail).toBeNull()
    })

    it("preserves provided contact info", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Dev",
        question: "gender_pay_gap",
        employeeName: "Andreea Popescu",
        contactEmail: "andreea@firma.ro",
        nowISO: NOW_ISO,
      })
      expect(req.employeeName).toBe("Andreea Popescu")
      expect(req.contactEmail).toBe("andreea@firma.ro")
    })
  })

  describe("listRequestsForOrg", () => {
    it("returns empty array if no requests", async () => {
      const list = await listRequestsForOrg(TEST_ORG)
      expect(list).toEqual([])
    })

    it("sorts requests by deadline ascending (closest first)", async () => {
      await createRequest({
        orgId: TEST_ORG,
        jobRole: "A",
        question: "own_salary",
        nowISO: "2026-05-01T10:00:00.000Z",
      })
      await createRequest({
        orgId: TEST_ORG,
        jobRole: "B",
        question: "own_salary",
        nowISO: "2026-04-15T10:00:00.000Z",
      })
      const list = await listRequestsForOrg(TEST_ORG)
      expect(list).toHaveLength(2)
      expect(list[0].jobRole).toBe("B") // earlier received → earlier deadline
    })
  })

  describe("getRequestByToken", () => {
    it("returns request matching token", async () => {
      const created = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Dev",
        question: "promotion_criteria",
        nowISO: NOW_ISO,
      })
      const found = await getRequestByToken(TEST_ORG, created.token)
      expect(found?.id).toBe(created.id)
    })

    it("returns null for unknown token", async () => {
      const found = await getRequestByToken(TEST_ORG, "er_nonexistent")
      expect(found).toBeNull()
    })
  })

  describe("transitionRequest", () => {
    it("transitions received → processing", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Dev",
        question: "own_salary",
        nowISO: NOW_ISO,
      })
      const updated = await transitionRequest(TEST_ORG, req.id, {
        action: "process",
        nowISO: "2026-05-02T10:00:00.000Z",
        internalNotes: "Reviewing payroll data",
      })
      expect(updated.status).toBe("processing")
      expect(updated.processedAtISO).toBe("2026-05-02T10:00:00.000Z")
      expect(updated.internalNotes).toBe("Reviewing payroll data")
    })

    it("transitions to answered with response text", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Marketing",
        question: "gender_pay_gap",
        nowISO: NOW_ISO,
      })
      const updated = await transitionRequest(TEST_ORG, req.id, {
        action: "answer",
        nowISO: "2026-05-15T10:00:00.000Z",
        answer: "Gap salarial pe rol Marketing: 4.2% în favoarea M.",
      })
      expect(updated.status).toBe("answered")
      expect(updated.answer).toContain("4.2%")
      expect(updated.answeredAtISO).toBe("2026-05-15T10:00:00.000Z")
    })

    it("transitions to escalated cu reason appended la internalNotes", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Dev",
        question: "other",
        detail: "Cerere complexă",
        nowISO: NOW_ISO,
      })
      const updated = await transitionRequest(TEST_ORG, req.id, {
        action: "escalate",
        nowISO: "2026-05-10T10:00:00.000Z",
        reason: "Trimis la legal",
      })
      expect(updated.status).toBe("escalated")
      expect(updated.internalNotes).toContain("Trimis la legal")
      expect(updated.internalNotes).toContain("ESCALATED")
    })

    it("throws REQUEST_NOT_FOUND for missing id", async () => {
      await expect(
        transitionRequest(TEST_ORG, "missing", {
          action: "process",
          nowISO: NOW_ISO,
        }),
      ).rejects.toThrow("REQUEST_NOT_FOUND")
    })
  })

  describe("computeDaysRemaining", () => {
    const fakeReq = (deadlineISO: string): EmployeeSalaryRequest => ({
      id: "req_test",
      orgId: TEST_ORG,
      token: "er_test",
      jobRole: "Test",
      question: "own_salary",
      status: "received",
      receivedAtISO: NOW_ISO,
      deadlineISO,
    })

    it("returns positive days when deadline is in future", () => {
      const req = fakeReq("2026-05-31T10:00:00.000Z") // 30 days after NOW_ISO
      expect(computeDaysRemaining(req, NOW_ISO)).toBe(30)
    })

    it("returns 0 when deadline is today", () => {
      const req = fakeReq(NOW_ISO)
      expect(computeDaysRemaining(req, NOW_ISO)).toBe(0)
    })

    it("returns negative days when overdue", () => {
      const req = fakeReq("2026-04-01T10:00:00.000Z")
      expect(computeDaysRemaining(req, NOW_ISO)).toBeLessThan(0)
    })
  })

  describe("listRequestsNearingDeadline", () => {
    it("returns requests under threshold (excluding answered)", async () => {
      // Create request with 30 days deadline
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Dev",
        question: "own_salary",
        nowISO: NOW_ISO,
      })
      // Move clock 25 days forward — 5 days remaining
      const future = "2026-05-26T10:00:00.000Z"
      const list = await listRequestsNearingDeadline(TEST_ORG, 7, future)
      expect(list.find((r) => r.id === req.id)).toBeTruthy()
    })

    it("excludes answered requests", async () => {
      const req = await createRequest({
        orgId: TEST_ORG,
        jobRole: "Dev",
        question: "own_salary",
        nowISO: NOW_ISO,
      })
      await transitionRequest(TEST_ORG, req.id, {
        action: "answer",
        nowISO: "2026-05-02T10:00:00.000Z",
        answer: "Rezolvat",
      })
      const list = await listRequestsNearingDeadline(TEST_ORG, 30, "2026-05-26T10:00:00.000Z")
      expect(list.find((r) => r.id === req.id)).toBeFalsy()
    })
  })
})
