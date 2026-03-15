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
  readStateMock: vi.fn(),
  readStoredEvidenceFileMock: vi.fn(),
  getStoredEvidenceSignedUrlMock: vi.fn(),
  requireRoleMock: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  AuthzError: mocks.AuthzErrorMock,
  requireRole: mocks.requireRoleMock,
}))

vi.mock("@/lib/compliance/task-ids", () => ({
  getPersistableTaskIds: mocks.getPersistableTaskIdsMock,
}))

vi.mock("@/lib/server/mvp-store", () => ({
  readState: mocks.readStateMock,
}))

vi.mock("@/lib/server/evidence-storage", () => ({
  readStoredEvidenceFile: mocks.readStoredEvidenceFileMock,
  getStoredEvidenceSignedUrl: mocks.getStoredEvidenceSignedUrlMock,
}))

vi.mock("@/lib/server/supabase-evidence-read", () => ({
  loadTaskEvidenceObjectFromSupabase: mocks.loadTaskEvidenceObjectFromSupabaseMock,
}))

import { GET } from "./route"

describe("GET /api/tasks/[id]/evidence/[evidenceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRoleMock.mockReturnValue({
      userId: "user-1",
      orgId: "org-demo",
      email: "demo@site.ro",
      orgName: "Org Demo",
      role: "viewer",
      exp: Date.now() + 1000,
    })
    mocks.getPersistableTaskIdsMock.mockReturnValue(new Set(["task-1"]))
    mocks.readStateMock.mockResolvedValue({
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
    mocks.requireRoleMock.mockImplementationOnce(() => {
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
    mocks.readStateMock.mockResolvedValueOnce({
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
    mocks.readStateMock.mockResolvedValueOnce({
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
})
