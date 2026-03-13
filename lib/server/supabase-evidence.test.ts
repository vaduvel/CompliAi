import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  hasSupabaseConfigMock: vi.fn(),
  supabaseUpsertMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseUpsert: mocks.supabaseUpsertMock,
}))

describe("lib/server/supabase-evidence", () => {
  const originalBackend = process.env.COMPLISCAN_DATA_BACKEND

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.COMPLISCAN_DATA_BACKEND
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.supabaseUpsertMock.mockResolvedValue([])
  })

  afterEach(() => {
    if (originalBackend === undefined) delete process.env.COMPLISCAN_DATA_BACKEND
    else process.env.COMPLISCAN_DATA_BACKEND = originalBackend
  })

  it("nu sincronizeaza metadata de evidence cand backend-ul ramane local", async () => {
    const { syncEvidenceObjectToSupabase } = await import("@/lib/server/supabase-evidence")

    const result = await syncEvidenceObjectToSupabase({
      orgId: "org-local",
      taskId: "task-1",
      uploadedByUserId: "user-1",
      evidence: {
        id: "evidence-1",
        fileName: "proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 8,
        uploadedAtISO: "2026-03-13T16:00:00.000Z",
        kind: "document_bundle",
        storageProvider: "local_private",
        storageKey: "org-local/task-1/proof.pdf",
        accessPath: "/api/tasks/task-1/evidence/evidence-1",
        quality: {
          status: "weak",
          summary: "Dovada cere review.",
          reasonCodes: ["very_small_file"],
          checkedAtISO: "2026-03-13T16:00:00.000Z",
        },
      },
    })

    expect(result).toEqual({ synced: false, reason: "DATA_BACKEND_LOCAL" })
    expect(mocks.supabaseUpsertMock).not.toHaveBeenCalled()
  })

  it("sincronizeaza metadata de evidence in public.evidence_objects cand backend-ul este supabase", async () => {
    process.env.COMPLISCAN_DATA_BACKEND = "supabase"

    const { syncEvidenceObjectToSupabase } = await import("@/lib/server/supabase-evidence")

    const result = await syncEvidenceObjectToSupabase({
      orgId: "org-cloud",
      taskId: "task-1",
      uploadedByUserId: "11111111-1111-4111-8111-111111111123",
      evidence: {
        id: "evidence-1",
        fileName: "proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 8,
        uploadedAtISO: "2026-03-13T16:00:00.000Z",
        kind: "document_bundle",
        storageProvider: "supabase_private",
        storageKey: "org-cloud/task-1/proof.pdf",
        accessPath: "/api/tasks/task-1/evidence/evidence-1",
        quality: {
          status: "weak",
          summary: "Dovada cere review.",
          reasonCodes: ["very_small_file"],
          checkedAtISO: "2026-03-13T16:00:00.000Z",
        },
      },
    })

    expect(result).toEqual(
      expect.objectContaining({
        synced: true,
        attachmentId: "evidence-1",
        orgId: "org-cloud",
        taskId: "task-1",
      })
    )
    expect(mocks.supabaseUpsertMock).toHaveBeenCalledWith(
      "evidence_objects",
      [
        expect.objectContaining({
          attachment_id: "evidence-1",
          org_id: "org-cloud",
          task_id: "task-1",
          storage_provider: "supabase_private",
          storage_key: "org-cloud/task-1/proof.pdf",
          metadata: expect.objectContaining({
            quality: expect.objectContaining({
              status: "weak",
            }),
          }),
        }),
      ],
      "public",
      "on_conflict=attachment_id"
    )
  })
})
