import { readFile, rm } from "node:fs/promises"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { GET as getDashboard } from "@/app/api/dashboard/route"
import { POST as postScan } from "@/app/api/scan/route"

const ORIGINAL_ENV = {
  orgId: process.env.COMPLISCAN_ORG_ID,
  orgName: process.env.COMPLISCAN_ORG_NAME,
  workspaceLabel: process.env.COMPLISCAN_WORKSPACE_LABEL,
  workspaceOwner: process.env.COMPLISCAN_WORKSPACE_OWNER,
  workspaceInitials: process.env.COMPLISCAN_WORKSPACE_INITIALS,
  dataBackend: process.env.COMPLISCAN_DATA_BACKEND,
}

describe("flow test kit - user nou document flow", () => {
  let orgId = ""

  beforeEach(() => {
    orgId = `org-flow-kit-${Date.now()}`
    process.env.COMPLISCAN_ORG_ID = orgId
    process.env.COMPLISCAN_ORG_NAME = "Flow Test Org"
    process.env.COMPLISCAN_WORKSPACE_LABEL = "Flow Test Workspace"
    process.env.COMPLISCAN_WORKSPACE_OWNER = "Flow Audit"
    process.env.COMPLISCAN_WORKSPACE_INITIALS = "FA"
    process.env.COMPLISCAN_DATA_BACKEND = "local"
  })

  afterEach(async () => {
    if (ORIGINAL_ENV.orgId === undefined) delete process.env.COMPLISCAN_ORG_ID
    else process.env.COMPLISCAN_ORG_ID = ORIGINAL_ENV.orgId

    if (ORIGINAL_ENV.orgName === undefined) delete process.env.COMPLISCAN_ORG_NAME
    else process.env.COMPLISCAN_ORG_NAME = ORIGINAL_ENV.orgName

    if (ORIGINAL_ENV.workspaceLabel === undefined) delete process.env.COMPLISCAN_WORKSPACE_LABEL
    else process.env.COMPLISCAN_WORKSPACE_LABEL = ORIGINAL_ENV.workspaceLabel

    if (ORIGINAL_ENV.workspaceOwner === undefined) delete process.env.COMPLISCAN_WORKSPACE_OWNER
    else process.env.COMPLISCAN_WORKSPACE_OWNER = ORIGINAL_ENV.workspaceOwner

    if (ORIGINAL_ENV.workspaceInitials === undefined) delete process.env.COMPLISCAN_WORKSPACE_INITIALS
    else process.env.COMPLISCAN_WORKSPACE_INITIALS = ORIGINAL_ENV.workspaceInitials

    if (ORIGINAL_ENV.dataBackend === undefined) delete process.env.COMPLISCAN_DATA_BACKEND
    else process.env.COMPLISCAN_DATA_BACKEND = ORIGINAL_ENV.dataBackend

    await rm(path.join(process.cwd(), ".data", `state-${orgId}.json`), { force: true })
  })

  it("genereaza findings si task-uri pentru bundle-ul high-risk de recrutare", async () => {
    const content = await readFile(
      path.join(
        process.cwd(),
        "public",
        "flow-test-kit-user-nou-document-2026-03-15",
        "03-recruitment-high-risk-bundle-source.txt"
      ),
      "utf8"
    )

    const scanResponse = await postScan(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: "03-recruitment-high-risk-bundle-source.txt",
          content,
        }),
      })
    )

    expect(scanResponse.status).toBe(200)
    const scanPayload = await scanResponse.json()
    expect(scanPayload.summary.score).toBeLessThan(100)
    expect(scanPayload.summary.riskLabel).not.toMatch(/low/i)
    expect(scanPayload.state.scans).toHaveLength(1)
    expect(scanPayload.state.findings.length).toBeGreaterThan(0)
    expect(scanPayload.remediationPlan.length).toBeGreaterThan(0)

    const findingsText = JSON.stringify(scanPayload.state.findings).toLowerCase()
    expect(findingsText).toMatch(/high-risk|review uman|date personale|transfer|retent/)

    const dashboardResponse = await getDashboard()
    expect(dashboardResponse.status).toBe(200)
    const dashboardPayload = await dashboardResponse.json()

    expect(dashboardPayload.workspace.orgId).toBe(orgId)
    expect(dashboardPayload.state.scans.length).toBe(1)
    expect(dashboardPayload.state.findings.length).toBe(scanPayload.state.findings.length)
    expect(dashboardPayload.remediationPlan.length).toBe(scanPayload.remediationPlan.length)
    expect(dashboardPayload.summary.score).toBe(scanPayload.summary.score)
  })
})
