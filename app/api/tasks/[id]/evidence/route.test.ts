import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  AuthzErrorMock: class AuthzError extends Error {
    status: number
    code: string

    constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
      super(message)
      this.status = status
      this.code = code
    }
  },
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  getPersistableTaskIdsMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  requireRoleMock: vi.fn(),
  randomUUIDMock: vi.fn(),
  storePrivateEvidenceFileMock: vi.fn(),
  shouldUseSupabaseEvidenceAsRequiredMock: vi.fn(),
  syncEvidenceObjectToSupabaseMock: vi.fn(),
}))

vi.mock("node:crypto", () => ({
  randomUUID: mocks.randomUUIDMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/compliance/task-ids", () => ({
  getPersistableTaskIds: mocks.getPersistableTaskIdsMock,
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/server/evidence-storage", () => ({
  storePrivateEvidenceFile: mocks.storePrivateEvidenceFileMock,
}))

vi.mock("@/lib/server/supabase-evidence", () => ({
  shouldUseSupabaseEvidenceAsRequired: mocks.shouldUseSupabaseEvidenceAsRequiredMock,
  syncEvidenceObjectToSupabase: mocks.syncEvidenceObjectToSupabaseMock,
}))

import { POST } from "./route"

describe("POST /api/tasks/[id]/evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date, "now").mockReturnValue(1_741_859_200_000)
    mocks.randomUUIDMock.mockReturnValue("uuid-1234")
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-demo",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "reviewer",
      exp: Date.now() + 1000,
    })
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-demo", orgName: "Org Demo" })
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.getPersistableTaskIdsMock.mockReturnValue(new Set(["task-1"]))
    mocks.shouldUseSupabaseEvidenceAsRequiredMock.mockReturnValue(false)
    mocks.syncEvidenceObjectToSupabaseMock.mockResolvedValue({ synced: false, reason: "DATA_BACKEND_LOCAL" })
    mocks.storePrivateEvidenceFileMock.mockImplementation(async (input: { evidenceId: string; originalFileName: string; mimeType: string; sizeBytes: number; uploadedAtISO: string; kind: string; taskId: string }) => ({
      id: input.evidenceId,
      fileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAtISO: input.uploadedAtISO,
      kind: input.kind,
      storageProvider: "local_private",
      storageKey: "org-demo/task-1/stored-proof.png",
      accessPath: `/api/tasks/${input.taskId}/evidence/${input.evidenceId}`,
    }))
  })

  it("cere fisier inainte de upload", async () => {
    const form = new FormData()
    form.set("kind", "screenshot")

    const response = await POST(
      new Request("http://localhost/api/tasks/task-1/evidence", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("EVIDENCE_FILE_REQUIRED")
  })

  it("respinge extensiile periculoase", async () => {
    const form = new FormData()
    form.set("kind", "other")
    form.set("file", new File(["alert(1)"], "proof.html", { type: "text/plain" }))

    const response = await POST(
      new Request("http://localhost/api/tasks/task-1/evidence", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("EVIDENCE_FILE_INVALID")
    expect(payload.error).toContain("nu este permis")
    expect(mocks.storePrivateEvidenceFileMock).not.toHaveBeenCalled()
  })

  it("mapeaza task inexistent", async () => {
    const form = new FormData()
    form.set("kind", "screenshot")
    form.set("file", new File(["png-bytes"], "proof.png", { type: "image/png" }))

    mocks.getPersistableTaskIdsMock.mockReturnValueOnce(new Set())
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: unknown) => unknown) =>
      updater({
        taskState: {},
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/tasks/task-1/evidence", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("TASK_NOT_FOUND")
  })

  it("salveaza dovada si actualizeaza starea task-ului", async () => {
    const form = new FormData()
    form.set("kind", "screenshot")
    form.set("file", new File(["png-bytes"], "proof final.PNG", { type: "image/png" }))

    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: unknown) => unknown) =>
      updater({
        taskState: {},
        events: [],
      })
    )

    const response = await POST(
      new Request("http://localhost/api/tasks/task-1/evidence", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.message).toBe("Dovada a fost încărcată.")
    expect(payload.evidence.fileName).toBe("proof final.PNG")
    expect(payload.evidence.kind).toBe("screenshot")
    expect(payload.evidence.storageProvider).toBe("local_private")
    expect(payload.evidence.accessPath).toContain("/api/tasks/task-1/evidence/evidence-uuid-1234")
    expect(payload.evidence.quality).toEqual(
      expect.objectContaining({
        status: "weak",
        reasonCodes: expect.arrayContaining(["very_small_file"]),
      })
    )
    expect(mocks.mutateStateForOrgMock).toHaveBeenCalledWith(
      "org-demo",
      expect.any(Function),
      "Org Demo"
    )
    expect(mocks.storePrivateEvidenceFileMock).toHaveBeenCalledTimes(1)
    expect(mocks.syncEvidenceObjectToSupabaseMock).toHaveBeenCalledTimes(1)
  })

  it("respinge upload-ul pentru rol nepermis", async () => {
    const form = new FormData()
    form.set("kind", "screenshot")
    form.set("file", new File(["png-bytes"], "proof.png", { type: "image/png" }))
    mocks.requireRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await POST(
      new Request("http://localhost/api/tasks/task-1/evidence", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
    expect(mocks.storePrivateEvidenceFileMock).not.toHaveBeenCalled()
  })

  it("blocheaza upload-ul cand sync-ul in Supabase este obligatoriu si esueaza", async () => {
    const form = new FormData()
    form.set("kind", "screenshot")
    form.set("file", new File(["png-bytes"], "proof.png", { type: "image/png" }))

    mocks.shouldUseSupabaseEvidenceAsRequiredMock.mockReturnValueOnce(true)
    mocks.syncEvidenceObjectToSupabaseMock.mockRejectedValueOnce(
      new Error("Supabase evidence sync failed.")
    )

    const response = await POST(
      new Request("http://localhost/api/tasks/task-1/evidence", {
        method: "POST",
        body: form,
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    )

    const payload = await response.json()
    expect(response.status).toBe(500)
    expect(response.headers.get("x-request-id")).toBe(payload.requestId)
    expect(payload.code).toBe("EVIDENCE_UPLOAD_FAILED")
    expect(payload.error).toContain("Supabase evidence sync failed")
  })
})
