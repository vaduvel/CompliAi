import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { GET as getAuthMe } from "@/app/api/auth/me/route"
import { POST as registerUser } from "@/app/api/auth/register/route"
import { GET as getDashboard } from "@/app/api/dashboard/route"
import { GET as getDashboardCore } from "@/app/api/dashboard/core/route"
import { POST as buildReports } from "@/app/api/reports/route"
import { POST as postScan } from "@/app/api/scan/route"
import { GET as getSettingsSummary } from "@/app/api/settings/summary/route"

const ORIGINAL_ENV = {
  authBackend: process.env.COMPLISCAN_AUTH_BACKEND,
  dataBackend: process.env.COMPLISCAN_DATA_BACKEND,
  usersFile: process.env.COMPLISCAN_USERS_FILE,
  orgsFile: process.env.COMPLISCAN_ORGS_FILE,
  membershipsFile: process.env.COMPLISCAN_MEMBERSHIPS_FILE,
  sessionSecret: process.env.COMPLISCAN_SESSION_SECRET,
  orgId: process.env.COMPLISCAN_ORG_ID,
  orgName: process.env.COMPLISCAN_ORG_NAME,
  workspaceLabel: process.env.COMPLISCAN_WORKSPACE_LABEL,
  workspaceOwner: process.env.COMPLISCAN_WORKSPACE_OWNER,
  workspaceInitials: process.env.COMPLISCAN_WORKSPACE_INITIALS,
  rlsFile: process.env.COMPLISCAN_RLS_VERIFICATION_FILE,
}

describe("canonical runtime audit", () => {
  let tempDir = ""
  let orgId = ""

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "compliscan-runtime-audit-"))
    process.env.COMPLISCAN_AUTH_BACKEND = "local"
    process.env.COMPLISCAN_DATA_BACKEND = "local"
    process.env.COMPLISCAN_USERS_FILE = path.join(tempDir, "users.json")
    process.env.COMPLISCAN_ORGS_FILE = path.join(tempDir, "orgs.json")
    process.env.COMPLISCAN_MEMBERSHIPS_FILE = path.join(tempDir, "memberships.json")
    process.env.COMPLISCAN_SESSION_SECRET = "runtime-audit-secret"
    process.env.COMPLISCAN_RLS_VERIFICATION_FILE = path.join(tempDir, "last-rls.json")
    await writeFile(
      process.env.COMPLISCAN_RLS_VERIFICATION_FILE,
      JSON.stringify({
        checkedAtISO: new Date().toISOString(),
        ready: true,
        blockers: [],
      }),
      "utf8"
    )
  })

  afterEach(async () => {
    if (ORIGINAL_ENV.authBackend === undefined) delete process.env.COMPLISCAN_AUTH_BACKEND
    else process.env.COMPLISCAN_AUTH_BACKEND = ORIGINAL_ENV.authBackend

    if (ORIGINAL_ENV.dataBackend === undefined) delete process.env.COMPLISCAN_DATA_BACKEND
    else process.env.COMPLISCAN_DATA_BACKEND = ORIGINAL_ENV.dataBackend

    if (ORIGINAL_ENV.usersFile === undefined) delete process.env.COMPLISCAN_USERS_FILE
    else process.env.COMPLISCAN_USERS_FILE = ORIGINAL_ENV.usersFile

    if (ORIGINAL_ENV.orgsFile === undefined) delete process.env.COMPLISCAN_ORGS_FILE
    else process.env.COMPLISCAN_ORGS_FILE = ORIGINAL_ENV.orgsFile

    if (ORIGINAL_ENV.membershipsFile === undefined) delete process.env.COMPLISCAN_MEMBERSHIPS_FILE
    else process.env.COMPLISCAN_MEMBERSHIPS_FILE = ORIGINAL_ENV.membershipsFile

    if (ORIGINAL_ENV.sessionSecret === undefined) delete process.env.COMPLISCAN_SESSION_SECRET
    else process.env.COMPLISCAN_SESSION_SECRET = ORIGINAL_ENV.sessionSecret

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

    if (ORIGINAL_ENV.rlsFile === undefined) delete process.env.COMPLISCAN_RLS_VERIFICATION_FILE
    else process.env.COMPLISCAN_RLS_VERIFICATION_FILE = ORIGINAL_ENV.rlsFile

    if (orgId) {
      await rm(path.join(process.cwd(), ".data", `state-${orgId}.json`), { force: true })
    }
    await rm(tempDir, { recursive: true, force: true })
  })

  it("confirma firul canonic prin route shell-uri si payload real", async () => {
    const registerResponse = await registerUser(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `audit-${Date.now()}@site.ro`,
          password: "secret123",
          orgName: "Canonical Audit Org",
        }),
      })
    )

    expect(registerResponse.status).toBe(200)
    const registerPayload = await registerResponse.json()
    const cookie = registerResponse.headers.get("set-cookie")?.split(";")[0]
    expect(cookie).toContain("compliscan_session=")

    orgId = registerPayload.orgId
    process.env.COMPLISCAN_ORG_ID = orgId
    process.env.COMPLISCAN_ORG_NAME = registerPayload.orgName
    process.env.COMPLISCAN_WORKSPACE_LABEL = registerPayload.orgName
    process.env.COMPLISCAN_WORKSPACE_OWNER = "Runtime Audit"
    process.env.COMPLISCAN_WORKSPACE_INITIALS = "RA"

    const source = await readFile(
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
          content: source,
        }),
      })
    )
    const scanPayload = await scanResponse.json()

    expect(scanResponse.status).toBe(200)
    expect(scanPayload.summary.score).toBeLessThan(100)
    expect(scanPayload.state.findings.length).toBeGreaterThan(0)

    const meResponse = await getAuthMe(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: cookie ?? "" },
      })
    )
    const mePayload = await meResponse.json()
    expect(meResponse.status).toBe(200)
    expect(mePayload.user.role).toBe("owner")

    const dashboardCoreResponse = await getDashboardCore(
      new Request("http://localhost/api/dashboard/core", {
        headers: { cookie: cookie ?? "" },
      })
    )
    const dashboardCorePayload = await dashboardCoreResponse.json()
    expect(dashboardCoreResponse.status).toBe(200)
    expect(dashboardCorePayload.workspace.orgId).toBe(orgId)
    expect(dashboardCorePayload.remediationPlan.length).toBeGreaterThan(0)
    expect(dashboardCorePayload.snapshot).toBeTruthy()
    expect(dashboardCorePayload.compliancePack).toBeUndefined()
    expect(dashboardCorePayload.traceabilityMatrix).toBeUndefined()

    const dashboardResponse = await getDashboard(
      new Request("http://localhost/api/dashboard", {
        headers: { cookie: cookie ?? "" },
      })
    )
    const dashboardPayload = await dashboardResponse.json()
    expect(dashboardResponse.status).toBe(200)
    expect(dashboardPayload.compliancePack).toBeTruthy()
    expect(dashboardPayload.traceabilityMatrix.length).toBeGreaterThan(0)
    expect(dashboardPayload.remediationPlan.length).toBe(dashboardCorePayload.remediationPlan.length)

    const reportsResponse = await buildReports(
      new Request("http://localhost/api/reports", {
        method: "POST",
        headers: { cookie: cookie ?? "" },
      })
    )
    const reportsPayload = await reportsResponse.json()
    expect(reportsResponse.status).toBe(200)
    expect(Array.isArray(reportsPayload.report.topActions)).toBe(true)
    expect(reportsPayload.report.disclaimer).toMatch(/CompliAI/i)
    expect(reportsPayload.html).toContain("Raport Executiv de Conformitate")

    const settingsSummaryResponse = await getSettingsSummary(
      new Request("http://localhost/api/settings/summary", {
        headers: { cookie: cookie ?? "" },
      })
    )
    const settingsSummaryPayload = await settingsSummaryResponse.json()
    expect(settingsSummaryResponse.status).toBe(200)
    expect(settingsSummaryPayload.currentUser.email).toContain("audit-")
    expect(settingsSummaryPayload.members.members).toHaveLength(1)
    expect(settingsSummaryPayload.appHealth.state).toBeTruthy()
    expect(settingsSummaryPayload.releaseReadiness).toBeTruthy()
  })
})
