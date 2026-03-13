import fs from "node:fs"
import path from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { analyzeExtractedScan, createExtractedScan } from "@/lib/server/scan-workflow"

function readFixture(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", ...segments), "utf8")
}

describe("document scan flow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Math, "random").mockReturnValue(0.123456789)
  })

  it("parcurge fluxul document -> extract -> analyze pe fixture-ul de politica", async () => {
    const documentText = readFixture("documents", "policy-tracking.txt")

    const extracted = await createExtractedScan(initialComplianceState, {
      documentName: "policy-tracking.txt",
      content: documentText,
      clientId: "fixture-policy-1",
    })

    expect(extracted.result.scan.documentName).toBe("policy-tracking.txt")
    expect(extracted.result.scan.analysisStatus).toBe("pending")
    expect(extracted.result.scan.sourceKind).toBe("document")
    expect(extracted.result.extractedTextPreview).toContain("Politica de confidentialitate")

    const analyzed = analyzeExtractedScan(
      extracted.nextState,
      extracted.result.scan.id,
      extracted.result.scan.contentExtracted
    )
    const normalized = normalizeComplianceState(analyzed)

    expect(normalized.scans).toHaveLength(1)
    expect(normalized.scans[0].analysisStatus).toBe("completed")
    expect(normalized.findings.length).toBeGreaterThan(0)
    expect(normalized.events.some((event) => event.type === "scan.created")).toBe(true)
    expect(normalized.events.some((event) => event.type === "scan.analyzed")).toBe(true)
  })
})
