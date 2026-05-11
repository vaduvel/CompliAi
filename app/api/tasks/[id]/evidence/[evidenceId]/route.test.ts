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
  getPersistableTaskIdsMock: vi.fn(),
  loadTaskEvidenceObjectFromSupabaseMock: vi.fn(),
  mutateStateForOrgMock: vi.fn(),
  readFreshStateForOrgMock: vi.fn(),
  readStoredEvidenceFileMock: vi.fn(),
  getStoredEvidenceSignedUrlMock: vi.fn(),
  deleteStoredEvidenceFileMock: vi.fn(),
  deleteEvidenceObjectFromSupabaseMock: vi.fn(),
  buildDashboardPayloadMock: vi.fn(),
  getOrgContextMock: vi.fn(),
  requireFreshRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireFreshRole: mocks.requireFreshRoleMock,
}))

vi.mock("@/lib/compliance/task-ids", () => ({
  getPersistableTaskIds: mocks.getPersistableTaskIdsMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readFreshStateForOrg: mocks.readFreshStateForOrgMock,
  mutateStateForOrg: mocks.mutateStateForOrgMock,
}))

vi.mock("@/lib/server/evidence-storage", () => ({
  readStoredEvidenceFile: mocks.readStoredEvidenceFileMock,
  getStoredEvidenceSignedUrl: mocks.getStoredEvidenceSignedUrlMock,
  deleteStoredEvidenceFile: mocks.deleteStoredEvidenceFileMock,
}))

vi.mock("@/lib/server/supabase-evidence", () => ({
  deleteEvidenceObjectFromSupabase: mocks.deleteEvidenceObjectFromSupabaseMock,
}))

vi.mock("@/lib/server/supabase-evidence-read", () => ({
  loadTaskEvidenceObjectFromSupabase: mocks.loadTaskEvidenceObjectFromSupabaseMock,
}))

vi.mock("@/lib/server/dashboard-response", () => ({
  buildDashboardPayload: mocks.buildDashboardPayloadMock,
}))

vi.mock("@/lib/server/org-context", () => ({
  getOrgContext: mocks.getOrgContextMock,
}))

import { DELETE, GET, PATCH } from "./route"

describe("GET /api/tasks/[id]/evidence/[evidenceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireFreshRoleMock.mockResolvedValue({
      userId: "user-1",
      orgId: "org-demo",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "viewer",
      exp: Date.now() + 1000,
    })
    mocks.getPersistableTaskIdsMock.mockReturnValue(new Set(["task-1"]))
    mocks.readFreshStateForOrgMock.mockResolvedValue({
      taskState: {
        "task-1": {
          status: "todo",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.pdf",
            mimeType: "application/pdf",
            sizeBytes: 32,
            uploadedAtISO: "2026-03-13T10:00:00.000Z",
            kind: "policy_text",
            storageProvider: "local_private",
            storageKey: "org-demo/task-1/proof.pdf",
            accessPath: "/api/tasks/task-1/evidence/evidence-1",
          },
        },
      },
    })
    mocks.readStoredEvidenceFileMock.mockResolvedValue({
      buffer: Buffer.from("proof-bytes"),
      absolutePath: "/tmp/proof.pdf",
    })
    mocks.getStoredEvidenceSignedUrlMock.mockResolvedValue(null)
    mocks.loadTaskEvidenceObjectFromSupabaseMock.mockResolvedValue(null)
    mocks.getOrgContextMock.mockResolvedValue({ orgId: "org-demo", orgName: "Org Demo" })
    mocks.buildDashboardPayloadMock.mockImplementation(async (state) => ({ state }))
    mocks.deleteStoredEvidenceFileMock.mockResolvedValue({ deleted: true })
    mocks.deleteEvidenceObjectFromSupabaseMock.mockResolvedValue({ deleted: false })
  })

  it("servește dovada când task-ul și fișierul există", async () => {
    const response = await GET(new Request("http://localhost/api/tasks/task-1/evidence/evidence-1"), {
      params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(await response.text()).toBe("proof-bytes")
  })

  it("respinge dovada inexistentă", async () => {
    const response = await GET(new Request("http://localhost/api/tasks/task-1/evidence/evidence-x"), {
      params: Promise.resolve({ id: "task-1", evidenceId: "evidence-x" }),
    })

    const payload = await response.json()
    expect(response.status).toBe(404)
    expect(payload.code).toBe("EVIDENCE_NOT_FOUND")
  })

  it("respinge accesul fără rol permis", async () => {
    mocks.requireFreshRoleMock.mockImplementationOnce(() => {
      throw new mocks.AuthzErrorMock("Acces interzis.", 403, "AUTH_ROLE_FORBIDDEN")
    })

    const response = await GET(new Request("http://localhost/api/tasks/task-1/evidence/evidence-1"), {
      params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }),
    })

    const payload = await response.json()
    expect(response.status).toBe(403)
    expect(payload.code).toBe("AUTH_ROLE_FORBIDDEN")
  })

  it("redirijeaza controlat catre URL semnat pentru storage cloud", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValueOnce({
      taskState: {
        "task-1": {
          status: "todo",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
          attachedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.pdf",
            mimeType: "application/pdf",
            sizeBytes: 32,
            uploadedAtISO: "2026-03-13T10:00:00.000Z",
            kind: "policy_text",
            storageProvider: "supabase_private",
            storageKey: "org-demo/task-1/proof.pdf",
            accessPath: "/api/tasks/task-1/evidence/evidence-1",
          },
        },
      },
    })
    mocks.getStoredEvidenceSignedUrlMock.mockResolvedValueOnce(
      "https://supabase.local/storage/v1/object/sign/compliscan-evidence-private/proof.pdf?token=abc"
    )

    const response = await GET(
      new Request("http://localhost/api/tasks/task-1/evidence/evidence-1?delivery=redirect"),
      {
        params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }),
      }
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("Location")).toContain("token=abc")
    expect(mocks.readStoredEvidenceFileMock).not.toHaveBeenCalled()
  })

  it("foloseste registrul cloud cand metadata locala lipseste, dar asocierea task-dovada exista in DB", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValueOnce({
      taskState: {
        "task-1": {
          status: "todo",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
        },
      },
    })
    mocks.loadTaskEvidenceObjectFromSupabaseMock.mockResolvedValueOnce({
      id: "evidence-1",
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 32,
      uploadedAtISO: "2026-03-13T10:00:00.000Z",
      kind: "policy_text",
      storageProvider: "supabase_private",
      storageKey: "org-demo/task-1/proof.pdf",
      accessPath: "/api/tasks/task-1/evidence/evidence-1",
    })
    mocks.getStoredEvidenceSignedUrlMock.mockResolvedValueOnce(
      "https://supabase.local/storage/v1/object/sign/compliscan-evidence-private/proof.pdf?token=abc"
    )

    const response = await GET(
      new Request("http://localhost/api/tasks/task-1/evidence/evidence-1?delivery=redirect"),
      {
        params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }),
      }
    )

    expect(mocks.loadTaskEvidenceObjectFromSupabaseMock).toHaveBeenCalledWith({
      orgId: "org-demo",
      taskId: "task-1",
      attachmentId: "evidence-1",
    })
    expect(response.status).toBe(307)
    expect(response.headers.get("Location")).toContain("token=abc")
  })

  it("forteaza download attachment cand este cerut explicit", async () => {
    const response = await GET(
      new Request("http://localhost/api/tasks/task-1/evidence/evidence-1?download=1"),
      {
        params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }),
      }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Disposition")).toContain('attachment; filename="proof.pdf"')
  })

  it("blocheaza descarcarea unei dovezi sterse soft", async () => {
    mocks.readFreshStateForOrgMock.mockResolvedValueOnce({
      taskState: {
        "task-1": {
          status: "todo",
          updatedAtISO: "2026-03-13T10:00:00.000Z",
          deletedEvidenceMeta: {
            id: "evidence-1",
            fileName: "proof.pdf",
            mimeType: "application/pdf",
            sizeBytes: 32,
            uploadedAtISO: "2026-03-13T10:00:00.000Z",
            kind: "policy_text",
            deletionStatus: "soft_deleted",
            deletedAtISO: "2026-03-14T10:00:00.000Z",
            deleteReason: "versiune gresita",
            restoreUntilISO: "2026-04-13T10:00:00.000Z",
          },
        },
      },
    })

    const response = await GET(new Request("http://localhost/api/tasks/task-1/evidence/evidence-1"), {
      params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(410)
    expect(payload.code).toBe("EVIDENCE_SOFT_DELETED")
  })

  it("sterge soft dovada doar cu motiv si pastreaza restore window", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: unknown) => unknown) =>
      updater({
        taskState: {
          "task-1": {
            status: "done",
            updatedAtISO: "2026-03-13T10:00:00.000Z",
            attachedEvidence: "proof.pdf",
            attachedEvidenceMeta: {
              id: "evidence-1",
              fileName: "proof.pdf",
              mimeType: "application/pdf",
              sizeBytes: 32,
              uploadedAtISO: "2026-03-13T10:00:00.000Z",
              kind: "policy_text",
              storageProvider: "local_private",
              storageKey: "org-demo/task-1/proof.pdf",
            },
          },
        },
        events: [],
      })
    )

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task-1/evidence/evidence-1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "document incarcat gresit" }),
      }),
      { params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.evidenceDeletion.status).toBe("soft_deleted")
    expect(payload.state.taskState["task-1"].attachedEvidenceMeta).toBeUndefined()
    expect(payload.state.taskState["task-1"].deletedEvidenceMeta.deleteReason).toBe(
      "document incarcat gresit"
    )
    expect(payload.state.taskState["task-1"].validationStatus).toBe("needs_review")
  })

  it("restaureaza dovada soft-deleted in fereastra de recovery", async () => {
    mocks.mutateStateForOrgMock.mockImplementationOnce(async (_orgId: string, updater: (state: unknown) => unknown) =>
      updater({
        taskState: {
          "task-1": {
            status: "todo",
            updatedAtISO: "2026-03-14T10:00:00.000Z",
            deletedEvidence: "proof.pdf",
            deletedEvidenceMeta: {
              id: "evidence-1",
              fileName: "proof.pdf",
              mimeType: "application/pdf",
              sizeBytes: 32,
              uploadedAtISO: "2026-03-13T10:00:00.000Z",
              kind: "policy_text",
              storageProvider: "local_private",
              storageKey: "org-demo/task-1/proof.pdf",
              deletionStatus: "soft_deleted",
              deletedAtISO: "2026-03-14T10:00:00.000Z",
              deleteReason: "versiune gresita",
              restoreUntilISO: "2099-04-13T10:00:00.000Z",
            },
          },
        },
        events: [],
      })
    )

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1/evidence/evidence-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      }),
      { params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.evidenceDeletion.status).toBe("restored")
    expect(payload.state.taskState["task-1"].attachedEvidenceMeta.fileName).toBe("proof.pdf")
    expect(payload.state.taskState["task-1"].deletedEvidenceMeta).toBeUndefined()
  })

  it("permite stergerea definitiva doar owner-ului", async () => {
    mocks.requireFreshRoleMock.mockResolvedValueOnce({
      userId: "user-1",
      orgId: "org-demo",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "compliance",
      exp: Date.now() + 1000,
    })

    const response = await DELETE(
      new Request("http://localhost/api/tasks/task-1/evidence/evidence-1?permanent=1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "offboarding complet" }),
      }),
      { params: Promise.resolve({ id: "task-1", evidenceId: "evidence-1" }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe("EVIDENCE_PERMANENT_DELETE_OWNER_ONLY")
    expect(mocks.deleteStoredEvidenceFileMock).not.toHaveBeenCalled()
  })
})
