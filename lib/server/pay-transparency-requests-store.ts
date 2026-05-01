// Pay Transparency — Employee Request Portal store
// Token public, 30-zile timer (Directiva 2023/970, draft RO Min Muncii: 30 zile răspuns).
// Pattern reuse din whistleblowing-store (token public + status workflow).

import { randomBytes } from "node:crypto"

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

export type EmployeeRequestStatus =
  | "received"
  | "processing"
  | "answered"
  | "escalated"

export type EmployeeRequestQuestion =
  | "own_salary"
  | "average_salary_role"
  | "gender_pay_gap"
  | "promotion_criteria"
  | "other"

export type EmployeeSalaryRequest = {
  id: string
  orgId: string
  /** Token public folosit pentru a reveni la starea cererii (când angajatul vrea update). */
  token: string
  /** Optional — anonim ok. Doar dacă angajatul a trimis numele. */
  employeeName?: string | null
  /** Email pentru răspuns final. Optional anonim. */
  contactEmail?: string | null
  /** Rolul angajatului (ex: "Marketing Specialist"). */
  jobRole: string
  question: EmployeeRequestQuestion
  /** Free-text dacă question === "other" sau detalii suplimentare. */
  detail?: string | null
  status: EmployeeRequestStatus
  /** Conform Directivei (UE) 2023/970, draft RO: 30 zile de la primire. */
  receivedAtISO: string
  deadlineISO: string
  /** Timestamp când HR a marcat ca processing. */
  processedAtISO?: string | null
  /** Timestamp când HR a trimis răspunsul. */
  answeredAtISO?: string | null
  /** Răspunsul trimis (Markdown sau plain text). */
  answer?: string | null
  /** HR notes interne — NU vizibile publicului. */
  internalNotes?: string | null
}

type RequestState = {
  requests: EmployeeSalaryRequest[]
}

const storage = createAdaptiveStorage<RequestState>(
  "pay-transparency-requests",
  "pay_transparency_requests_state",
)

const DAY_MS = 86_400_000
const DEADLINE_DAYS = 30

function generateToken(): string {
  return `er_${randomBytes(16).toString("base64url")}`
}

function generateId(): string {
  return `req_${randomBytes(8).toString("base64url")}`
}

function emptyState(): RequestState {
  return { requests: [] }
}

/**
 * List requests pentru un org (HR-side dashboard view).
 * Sortat după deadline ascending (cele mai aproape primele).
 */
export async function listRequestsForOrg(orgId: string): Promise<EmployeeSalaryRequest[]> {
  const state = (await storage.read(orgId)) ?? emptyState()
  return [...state.requests].sort((a, b) => a.deadlineISO.localeCompare(b.deadlineISO))
}

/**
 * Get single request by id (HR-side).
 */
export async function getRequest(
  orgId: string,
  requestId: string,
): Promise<EmployeeSalaryRequest | null> {
  const state = (await storage.read(orgId)) ?? emptyState()
  return state.requests.find((r) => r.id === requestId) ?? null
}

/**
 * Get request by token — folosit pentru portal public (angajatul vede statusul).
 */
export async function getRequestByToken(
  orgId: string,
  token: string,
): Promise<EmployeeSalaryRequest | null> {
  const state = (await storage.read(orgId)) ?? emptyState()
  return state.requests.find((r) => r.token === token) ?? null
}

export type CreateRequestInput = {
  orgId: string
  jobRole: string
  question: EmployeeRequestQuestion
  detail?: string | null
  employeeName?: string | null
  contactEmail?: string | null
  nowISO: string
}

/**
 * Create request din portal public — auto-genereaza token + deadline 30 zile.
 */
export async function createRequest(input: CreateRequestInput): Promise<EmployeeSalaryRequest> {
  const state = (await storage.read(input.orgId)) ?? emptyState()
  const now = new Date(input.nowISO)
  const deadline = new Date(now.getTime() + DEADLINE_DAYS * DAY_MS)
  const request: EmployeeSalaryRequest = {
    id: generateId(),
    orgId: input.orgId,
    token: generateToken(),
    employeeName: input.employeeName?.trim() || null,
    contactEmail: input.contactEmail?.trim() || null,
    jobRole: input.jobRole.trim(),
    question: input.question,
    detail: input.detail?.trim() || null,
    status: "received",
    receivedAtISO: input.nowISO,
    deadlineISO: deadline.toISOString(),
    processedAtISO: null,
    answeredAtISO: null,
    answer: null,
    internalNotes: null,
  }
  await storage.write(input.orgId, {
    requests: [request, ...state.requests],
  })
  return request
}

export type RequestTransition =
  | { action: "process"; nowISO: string; internalNotes?: string }
  | { action: "answer"; nowISO: string; answer: string; internalNotes?: string }
  | { action: "escalate"; nowISO: string; reason: string }

/**
 * Apply transition pentru status workflow.
 */
export async function transitionRequest(
  orgId: string,
  requestId: string,
  transition: RequestTransition,
): Promise<EmployeeSalaryRequest> {
  const state = (await storage.read(orgId)) ?? emptyState()
  const idx = state.requests.findIndex((r) => r.id === requestId)
  if (idx === -1) {
    throw new Error("REQUEST_NOT_FOUND")
  }
  const current = state.requests[idx]
  let updated: EmployeeSalaryRequest

  switch (transition.action) {
    case "process":
      updated = {
        ...current,
        status: "processing",
        processedAtISO: transition.nowISO,
        internalNotes: transition.internalNotes ?? current.internalNotes,
      }
      break
    case "answer":
      updated = {
        ...current,
        status: "answered",
        answeredAtISO: transition.nowISO,
        answer: transition.answer,
        internalNotes: transition.internalNotes ?? current.internalNotes,
      }
      break
    case "escalate":
      updated = {
        ...current,
        status: "escalated",
        internalNotes: [current.internalNotes, `[ESCALATED ${transition.nowISO}] ${transition.reason}`]
          .filter(Boolean)
          .join("\n"),
      }
      break
  }

  const next = [...state.requests]
  next[idx] = updated
  await storage.write(orgId, { requests: next })
  return updated
}

/**
 * Compute days remaining până la deadline (pozitiv = în termen, negativ = depășit).
 */
export function computeDaysRemaining(request: EmployeeSalaryRequest, nowISO: string): number {
  const deadlineMs = new Date(request.deadlineISO).getTime()
  const nowMs = new Date(nowISO).getTime()
  return Math.ceil((deadlineMs - nowMs) / DAY_MS)
}

/**
 * Returns requests apropiate de deadline (sub thresholdDays) sau depășite.
 * Folosit pentru email notifications (Sprint 3+).
 */
export async function listRequestsNearingDeadline(
  orgId: string,
  thresholdDays: number,
  nowISO: string,
): Promise<EmployeeSalaryRequest[]> {
  const all = await listRequestsForOrg(orgId)
  return all.filter((r) => {
    if (r.status === "answered") return false
    const remaining = computeDaysRemaining(r, nowISO)
    return remaining <= thresholdDays
  })
}
