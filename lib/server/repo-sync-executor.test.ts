import fs from "node:fs"
import path from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  mutateStateMock: vi.fn(),
}))

vi.mock("@/lib/server/mvp-store", () => ({
  mutateState: mocks.mutateStateMock,
}))

import { executeRepoSync } from "@/lib/server/repo-sync-executor"

function readFixture(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", ...segments), "utf8")
}

type MinimalState = {
  scans: unknown[]
  findings: Array<{ sourceDocument?: string }>
  alerts: Array<{ sourceDocument?: string }>
  detectedAISystems: Array<{ confirmedSystemId?: string; sourceDocument?: string }>
  events: unknown[]
}

describe("repo-sync-executor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, "random").mockReturnValue(0.123456789)
  })

  it("genereaza scan, sistem detectat si evenimente pentru manifest", async () => {
    const manifest = readFixture("manifests", "package-openai.json")

    mocks.mutateStateMock.mockImplementationOnce(async (updater: (state: MinimalState) => unknown) =>
      updater({
        scans: [],
        findings: [],
        alerts: [],
        detectedAISystems: [],
        events: [],
      })
    )

    const result = await executeRepoSync({
      provider: "manual",
      repository: "demo/repo",
      branch: "main",
      commitSha: "abc123",
      files: [{ path: "package.json", content: manifest }],
    })

    expect(result.fileCount).toBe(1)
    expect(result.nextState.scans[0].documentName).toBe("package.json")
    expect(result.nextState.scans[0].sourceKind).toBe("manifest")
    expect(result.nextState.detectedAISystems.length).toBeGreaterThan(0)
    expect(result.nextState.detectedAISystems[0].vendor).toBe("OpenAI")
    expect(
      result.nextState.events.some(
        (event: { type?: string }) => event.type === "integration.repo-sync.completed"
      )
    ).toBe(true)
  })

  it("trateaza compliscan.yaml ca sursa declarativa si pastreaza risk class", async () => {
    const yaml = readFixture("yaml", "compliscan-customer-support.yaml")

    mocks.mutateStateMock.mockImplementationOnce(async (updater: (state: MinimalState) => unknown) =>
      updater({
        scans: [],
        findings: [],
        alerts: [],
        detectedAISystems: [],
        events: [],
      })
    )

    const result = await executeRepoSync({
      provider: "github",
      repository: "demo/repo",
      branch: "main",
      commitSha: "def456",
      files: [{ path: "compliscan.yaml", content: yaml }],
    })

    expect(result.fileCount).toBe(1)
    expect(result.nextState.scans[0].sourceKind).toBe("yaml")
    expect(result.nextState.detectedAISystems).toHaveLength(1)
    expect(result.nextState.detectedAISystems[0].riskLevel).toBe("limited")
    expect(result.nextState.detectedAISystems[0].frameworks).toContain("compliscan-yaml")
  })
})
