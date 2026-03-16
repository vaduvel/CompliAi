import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ComplianceState } from "@/lib/compliance/types"

const mocks = vi.hoisted(() => ({
  getConfiguredDataBackendMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: mocks.supabaseSelectMock,
}))

import {
  hydrateEvidenceAttachmentsFromSupabase,
  loadEvidenceLedgerFromSupabase,
  loadEvidenceObjectFromSupabase,
  loadTaskEvidenceObjectFromSupabase,
  shouldReadEvidenceRegistryFromSupabase,
} from "@/lib/server/supabase-evidence-read"

function createState(): ComplianceState {
  return {
    highRisk: 0,
    lowRisk: 0,
    gdprProgress: 0,
    efacturaSyncedAtISO: "",
    efacturaConnected: false,
    efacturaSignalsCount: 0,
    scannedDocuments: 0,
    alerts: [],
    findings: [],
    scans: [],
    chat: [],
    taskState: {
      "rem-task-1": {
        status: "todo",
        updatedAtISO: "2026-03-13T10:00:00.000Z",
        attachedEvidenceMeta: {
          id: "evidence-1",
          fileName: "proof.pdf",
          mimeType: "application/pdf",
          sizeBytes: 100,
          uploadedAtISO: "2026-03-13T10:00:00.000Z",
          kind: "document_bundle",
          storageProvider: "local_private",
          storageKey: "legacy/path.pdf",
          accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
        },
      },
    },
    aiComplianceFieldOverrides: {},
    traceabilityReviews: {},
    aiSystems: [],
    detectedAISystems: [],
    efacturaValidations: [],
    driftRecords: [],
    driftSettings: {
      severityOverrides: {},
    },
    snapshotHistory: [],
    validatedBaselineSnapshotId: undefined,
    events: [],
  }
}

describe("lib/server/supabase-evidence-read", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    mocks.supabaseSelectMock.mockResolvedValue([])
  })

  it("ramane inactiv pe backend local", async () => {
    expect(shouldReadEvidenceRegistryFromSupabase()).toBe(false)
    await expect(loadEvidenceObjectFromSupabase({ orgId: "org-1", attachmentId: "evidence-1" })).resolves.toBeNull()
    await expect(loadEvidenceLedgerFromSupabase({ orgId: "org-1" })).resolves.toEqual([])
    await expect(hydrateEvidenceAttachmentsFromSupabase(createState(), "org-1")).resolves.toEqual(createState())
    expect(mocks.supabaseSelectMock).not.toHaveBeenCalled()
  })

  it("citeste un obiect de evidence din registrul cloud", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock.mockResolvedValueOnce([
      {
        attachment_id: "evidence-1",
        file_name: "proof.pdf",
        mime_type: "application/pdf",
        size_bytes: 111,
        kind: "document_bundle",
        storage_provider: "supabase_private",
        storage_key: "org-1/task-1/proof.pdf",
        uploaded_at: "2026-03-13T11:00:00.000Z",
        metadata: {
          accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
          quality: {
            status: "weak",
            summary: "Dovada cere review.",
            reasonCodes: ["very_small_file"],
            checkedAtISO: "2026-03-13T11:00:00.000Z",
          },
        },
      },
    ])

    const result = await loadEvidenceObjectFromSupabase({ orgId: "org-1", attachmentId: "evidence-1" })

    expect(result).toEqual(
      expect.objectContaining({
        id: "evidence-1",
        storageProvider: "supabase_private",
        storageKey: "org-1/task-1/proof.pdf",
        sizeBytes: 111,
        quality: expect.objectContaining({
          status: "weak",
        }),
      })
    )
  })

  it("citeste un obiect de evidence pentru task-ul corect din registrul cloud", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock.mockResolvedValueOnce([
      {
        attachment_id: "evidence-1",
        task_id: "rem-task-1",
        file_name: "proof.pdf",
        mime_type: "application/pdf",
        size_bytes: 111,
        kind: "document_bundle",
        storage_provider: "supabase_private",
        storage_key: "org-1/task-1/proof.pdf",
        uploaded_at: "2026-03-13T11:00:00.000Z",
        metadata: {
          accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
        },
      },
    ])

    const result = await loadTaskEvidenceObjectFromSupabase({
      orgId: "org-1",
      taskId: "rem-task-1",
      attachmentId: "evidence-1",
    })

    expect(result).toEqual(
      expect.objectContaining({
        id: "evidence-1",
        storageProvider: "supabase_private",
        accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
      })
    )
    expect(mocks.supabaseSelectMock).toHaveBeenCalledWith(
      "evidence_objects",
      "select=attachment_id,task_id,file_name,mime_type,size_bytes,kind,storage_provider,storage_key,uploaded_at,metadata&org_id=eq.org-1&task_id=eq.rem-task-1&attachment_id=eq.evidence-1&limit=1",
      "public"
    )
  })

  it("hidrateaza taskState cu metadata din public.evidence_objects", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock.mockResolvedValueOnce([
      {
        attachment_id: "evidence-1",
        file_name: "proof.pdf",
        mime_type: "application/pdf",
        size_bytes: 111,
        kind: "document_bundle",
        storage_provider: "supabase_private",
        storage_key: "org-1/task-1/proof.pdf",
        uploaded_at: "2026-03-13T11:00:00.000Z",
        metadata: {
          accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
          quality: {
            status: "weak",
            summary: "Dovada cere review.",
            reasonCodes: ["very_small_file"],
            checkedAtISO: "2026-03-13T11:00:00.000Z",
          },
        },
      },
    ])

    const result = await hydrateEvidenceAttachmentsFromSupabase(createState(), "org-1")

    expect(result.taskState["rem-task-1"]?.attachedEvidenceMeta).toEqual(
      expect.objectContaining({
        id: "evidence-1",
        storageProvider: "supabase_private",
        storageKey: "org-1/task-1/proof.pdf",
        sizeBytes: 111,
        quality: expect.objectContaining({
          status: "weak",
        }),
      })
    )
    expect(mocks.supabaseSelectMock).toHaveBeenCalledWith(
      "evidence_objects",
      "select=attachment_id,file_name,mime_type,size_bytes,kind,storage_provider,storage_key,uploaded_at,metadata&org_id=eq.org-1&attachment_id=in.(evidence-1)",
      "public"
    )
  })

  it("listeaza registrul de evidence din Supabase", async () => {
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock.mockResolvedValueOnce([
      {
        attachment_id: "evidence-1",
        task_id: "rem-task-1",
        file_name: "proof.pdf",
        mime_type: "application/pdf",
        size_bytes: 111,
        kind: "document_bundle",
        storage_provider: "supabase_private",
        storage_key: "org-1/task-1/proof.pdf",
        uploaded_at: "2026-03-13T11:00:00.000Z",
        metadata: {
          accessPath: "/api/tasks/rem-task-1/evidence/evidence-1",
        },
      },
    ])

    const result = await loadEvidenceLedgerFromSupabase({ orgId: "org-1", limit: 2 })

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "evidence-1",
          taskId: "rem-task-1",
          storageProvider: "supabase_private",
        }),
      ])
    )
    expect(mocks.supabaseSelectMock).toHaveBeenCalledWith(
      "evidence_objects",
      "select=attachment_id,task_id,file_name,mime_type,size_bytes,kind,storage_provider,storage_key,uploaded_at,metadata&org_id=eq.org-1&order=uploaded_at.desc&limit=2",
      "public"
    )
  })
})
