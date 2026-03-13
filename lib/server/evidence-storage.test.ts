import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getConfiguredDataBackendMock: vi.fn(),
  hasSupabaseStorageConfigMock: vi.fn(),
  ensureSupabaseBucketMock: vi.fn(),
  uploadSupabaseObjectMock: vi.fn(),
  downloadSupabaseObjectMock: vi.fn(),
  createSignedSupabaseObjectUrlMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

vi.mock("@/lib/server/supabase-storage", () => ({
  hasSupabaseStorageConfig: mocks.hasSupabaseStorageConfigMock,
  ensureSupabaseBucket: mocks.ensureSupabaseBucketMock,
  uploadSupabaseObject: mocks.uploadSupabaseObjectMock,
  downloadSupabaseObject: mocks.downloadSupabaseObjectMock,
  createSignedSupabaseObjectUrl: mocks.createSignedSupabaseObjectUrlMock,
}))

describe("lib/server/evidence-storage", () => {
  const originalCwd = process.cwd()
  let tempDir = ""

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "compliscan-evidence-storage-"))
    process.chdir(tempDir)
    vi.clearAllMocks()
    vi.resetModules()
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    mocks.hasSupabaseStorageConfigMock.mockReturnValue(false)
    mocks.ensureSupabaseBucketMock.mockResolvedValue({ bucketName: "compliscan-evidence-private" })
    mocks.uploadSupabaseObjectMock.mockResolvedValue({ Key: "org/task/file.txt" })
    mocks.downloadSupabaseObjectMock.mockResolvedValue(Buffer.from("cloud-proof"))
    mocks.createSignedSupabaseObjectUrlMock.mockResolvedValue(
      "https://supabase.local/storage/v1/object/sign/compliscan-evidence-private/org/task/file.txt?token=abc"
    )
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("salveaza local cand backend-ul de date ramane local", async () => {
    const { storePrivateEvidenceFile, readStoredEvidenceFile } = await import(
      "@/lib/server/evidence-storage"
    )

    const evidence = await storePrivateEvidenceFile({
      orgId: "org-local",
      taskId: "task-1",
      evidenceId: "evidence-1",
      originalFileName: "Proof.png",
      safeFileName: "proof.png",
      mimeType: "image/png",
      sizeBytes: 4,
      uploadedAtISO: "2026-03-13T15:00:00.000Z",
      kind: "screenshot",
      bytes: Buffer.from("test"),
    })

    expect(evidence.storageProvider).toBe("local_private")

    const stored = await readStoredEvidenceFile(evidence)
    expect(stored.buffer.toString()).toBe("test")
    expect(mocks.uploadSupabaseObjectMock).not.toHaveBeenCalled()
  })

  it("urca in Supabase Storage cand backend-ul este supabase", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.hasSupabaseStorageConfigMock.mockReturnValue(true)

    const { storePrivateEvidenceFile } = await import("@/lib/server/evidence-storage")

    const evidence = await storePrivateEvidenceFile({
      orgId: "org-cloud",
      taskId: "task-1",
      evidenceId: "evidence-1",
      originalFileName: "Proof.pdf",
      safeFileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
      uploadedAtISO: "2026-03-13T15:00:00.000Z",
      kind: "document_bundle",
      bytes: Buffer.from("pdf-data"),
    })

    expect(evidence.storageProvider).toBe("supabase_private")
    expect(mocks.ensureSupabaseBucketMock).toHaveBeenCalledWith("compliscan-evidence-private")
    expect(mocks.uploadSupabaseObjectMock).toHaveBeenCalledWith(
      "compliscan-evidence-private",
      expect.stringContaining("org-cloud/task-1"),
      Buffer.from("pdf-data"),
      "application/pdf"
    )
  })

  it("citeste dovezile din Supabase Storage cand provider-ul este supabase_private", async () => {
    const { readStoredEvidenceFile } = await import("@/lib/server/evidence-storage")

    const stored = await readStoredEvidenceFile({
      id: "evidence-1",
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
      uploadedAtISO: "2026-03-13T15:00:00.000Z",
      kind: "document_bundle",
      storageProvider: "supabase_private",
      storageKey: "org-cloud/task-1/proof.pdf",
      accessPath: "/api/tasks/task-1/evidence/evidence-1",
    })

    expect(stored.buffer.toString()).toBe("cloud-proof")
    expect(mocks.downloadSupabaseObjectMock).toHaveBeenCalledWith(
      "compliscan-evidence-private",
      "org-cloud/task-1/proof.pdf"
    )
  })

  it("genereaza URL semnat pentru dovezile din storage cloud", async () => {
    const { getStoredEvidenceSignedUrl } = await import("@/lib/server/evidence-storage")

    const signedUrl = await getStoredEvidenceSignedUrl({
      id: "evidence-1",
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
      uploadedAtISO: "2026-03-13T15:00:00.000Z",
      kind: "document_bundle",
      storageProvider: "supabase_private",
      storageKey: "org-cloud/task-1/proof.pdf",
      accessPath: "/api/tasks/task-1/evidence/evidence-1",
    })

    expect(signedUrl).toContain("token=abc")
    expect(mocks.createSignedSupabaseObjectUrlMock).toHaveBeenCalledWith(
      "compliscan-evidence-private",
      "org-cloud/task-1/proof.pdf",
      90
    )
  })

  it("nu genereaza URL semnat pentru dovezile locale", async () => {
    const { getStoredEvidenceSignedUrl } = await import("@/lib/server/evidence-storage")

    const signedUrl = await getStoredEvidenceSignedUrl({
      id: "evidence-1",
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 8,
      uploadedAtISO: "2026-03-13T15:00:00.000Z",
      kind: "document_bundle",
      storageProvider: "local_private",
      storageKey: "org-local/task-1/proof.pdf",
      accessPath: "/api/tasks/task-1/evidence/evidence-1",
    })

    expect(signedUrl).toBeNull()
    expect(mocks.createSignedSupabaseObjectUrlMock).not.toHaveBeenCalled()
  })
})
