import { describe, expect, it, vi, beforeEach } from "vitest"

// ── Mocks (factory inline — fără referințe la variabile din scope) ────────────

vi.mock("@/lib/server/nis2-store", () => ({
  readNis2State: vi.fn(),
}))

vi.mock("@/lib/server/audit-pack-client", () => ({
  buildClientAuditPackDocument: vi.fn(() => ({
    fileName: "audit-pack-client.html",
    html: "<html>test</html>",
  })),
}))

vi.mock("@/lib/server/annex-lite-client", () => ({
  buildClientAnnexLiteDocument: vi.fn(() => ({
    fileName: "annex-iv-lite.html",
    html: "<html>annex</html>",
  })),
}))

vi.mock("@/lib/server/evidence-storage", () => ({
  copyStoredEvidenceFile: vi.fn(async () => {}),
}))

vi.mock("node:child_process", () => ({
  execFile: vi.fn(
    (_cmd: string, _args: string[], _opts: unknown, cb: (...a: unknown[]) => void) => {
      cb(null, "", "")
    }
  ),
}))

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs")
  const writtenFiles: Record<string, string> = {}

  return {
    ...actual,
    __writtenFiles: writtenFiles,
    promises: {
      ...actual.promises,
      mkdir: vi.fn(async () => undefined),
      writeFile: vi.fn(async (fp: unknown, content: unknown) => {
        if (typeof fp === "string") {
          const base = fp.split("/").pop()!
          writtenFiles[base] = typeof content === "string" ? content : JSON.stringify(content)
        }
      }),
      readFile: vi.fn(async () => Buffer.from("PK mock zip")),
      rm: vi.fn(async () => undefined),
      mkdtemp: vi.fn(async (_prefix: string) => "/tmp/mock-bundle"),
    },
  }
})

// ── Imports (după vi.mock) ─────────────────────────────────────────────────────

import { buildAuditPackBundle } from "./audit-pack-bundle"
import { readNis2State } from "@/lib/server/nis2-store"
import type { AuditPackV2 } from "@/lib/compliance/audit-pack"

// ── Helper ────────────────────────────────────────────────────────────────────

function makeAuditPack(workspaceId = "org-r10"): AuditPackV2 {
  return {
    version: "2.0",
    generatedAt: "2026-03-17T00:00:00.000Z",
    workspace: {
      id: workspaceId,
      orgId: workspaceId,
      name: "Test Org R10",
      label: "Test Org R10 Workspace",
      owner: "owner@test.com",
    },
    executiveSummary: {
      complianceScore: 80,
      riskLabel: "low",
      auditReadiness: "ready",
      baselineStatus: "validated",
      systemsInScope: 0,
      sourcesInScope: 0,
      openFindings: 0,
      activeDrifts: 0,
      remediationOpen: 0,
      validatedEvidenceItems: 0,
      missingEvidenceItems: 0,
      evidenceLedgerSummary: { sufficient: 0, weak: 0, unrated: 0 },
      topBlockers: [],
      nextActions: [],
    },
    appendix: {
      compliancePack: {
        version: "4.0",
        generatedAt: "2026-03-17T00:00:00.000Z",
        workspace: { orgId: workspaceId, orgName: "Test Org R10", workspaceLabel: "Test", workspaceOwner: "owner" },
        snapshotId: "snap-r10",
        comparedToSnapshotId: null,
        summary: {
          totalEntries: 0, auditReadyEntries: 0, reviewRequiredEntries: 0,
          openFindings: 0, openDrifts: 0, missingEvidenceItems: 0,
          averageCompletenessScore: 100, annexLiteReadyEntries: 0, bundleReadyEntries: 0,
          confidenceCoverage: { detected: 0, reviewed: 0, confirmed: 0, rejected: 0 },
        },
        entries: [],
      },
    },
    evidenceLedger: [],
    bundleEvidenceSummary: { totalItems: 0, includedItems: 0, skippedItems: 0, pendingControls: 0 },
    controls: [],
    driftRegister: [],
    driftSummary: { activeDrifts: 0, resolvedDrifts: 0, driftCategories: [] },
    auditTrail: [],
    traceabilityMatrix: [],
  } as unknown as AuditPackV2
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("R-10 — NIS2 data în audit-pack bundle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("apelează readNis2State cu orgId-ul corect din workspace", async () => {
    vi.mocked(readNis2State).mockResolvedValue({
      incidents: [],
      vendors: [],
      assessment: null,
    })

    await buildAuditPackBundle(makeAuditPack("org-specific-r10"))

    expect(readNis2State).toHaveBeenCalledWith("org-specific-r10")
  })

  it("include incidents, vendors și assessment în fișierele scrise", async () => {
    const fsModule = await import("node:fs")
    const writtenFiles: Record<string, string> = {}

    vi.mocked(fsModule.promises.writeFile).mockImplementation(async (fp: unknown, content: unknown) => {
      if (typeof fp === "string") {
        const base = (fp as string).split("/").pop()!
        writtenFiles[base] = typeof content === "string" ? content : (content as Buffer).toString()
      }
    })

    vi.mocked(readNis2State).mockResolvedValue({
      incidents: [{ id: "inc-1", title: "Atac ransomware" }] as never,
      vendors: [{ id: "v-1", name: "AWS" }] as never,
      assessment: { score: 65, completedAtISO: "2026-03-17T00:00:00.000Z" } as never,
    })

    await buildAuditPackBundle(makeAuditPack("org-r10"))

    expect(writtenFiles["incidents.json"]).toBeDefined()
    expect(writtenFiles["vendors.json"]).toBeDefined()
    expect(writtenFiles["assessment.json"]).toBeDefined()

    const incidents = JSON.parse(writtenFiles["incidents.json"])
    const vendors = JSON.parse(writtenFiles["vendors.json"])
    const assessment = JSON.parse(writtenFiles["assessment.json"])

    expect(incidents).toHaveLength(1)
    expect(incidents[0].id).toBe("inc-1")
    expect(vendors[0].name).toBe("AWS")
    expect(assessment.score).toBe(65)
  })

  it("scrie fișiere NIS2 goale (nu aruncă eroare) când readNis2State eșuează", async () => {
    const fsModule = await import("node:fs")
    const writtenFiles: Record<string, string> = {}

    vi.mocked(fsModule.promises.writeFile).mockImplementation(async (fp: unknown, content: unknown) => {
      if (typeof fp === "string") {
        const base = (fp as string).split("/").pop()!
        writtenFiles[base] = typeof content === "string" ? content : (content as Buffer).toString()
      }
    })

    vi.mocked(readNis2State).mockRejectedValue(new Error("fișier lipsă"))

    await expect(buildAuditPackBundle(makeAuditPack("org-empty"))).resolves.toBeDefined()

    expect(JSON.parse(writtenFiles["incidents.json"])).toEqual([])
    expect(JSON.parse(writtenFiles["vendors.json"])).toEqual([])
    expect(JSON.parse(writtenFiles["assessment.json"])).toEqual({})
  })
})
