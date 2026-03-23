import { describe, expect, it, vi, beforeEach } from "vitest"

import { AuthzError } from "@/lib/server/auth"
import { GET as getOverview } from "@/app/api/portfolio/overview/route"
import { GET as getAlerts } from "@/app/api/portfolio/alerts/route"
import { GET as getTasks } from "@/app/api/portfolio/tasks/route"
import { GET as getVendors } from "@/app/api/portfolio/vendors/route"
import { GET as getReports } from "@/app/api/portfolio/reports/route"

const mocks = vi.hoisted(() => ({
  requirePortfolioAccess: vi.fn(),
  loadPortfolioBundles: vi.fn(),
  buildPortfolioOverviewRows: vi.fn(),
  buildPortfolioAlertRows: vi.fn(),
  buildPortfolioTaskRows: vi.fn(),
  buildPortfolioVendorRows: vi.fn(),
  buildPortfolioReportRows: vi.fn(),
}))

vi.mock("@/lib/server/portfolio", () => ({
  requirePortfolioAccess: mocks.requirePortfolioAccess,
  loadPortfolioBundles: mocks.loadPortfolioBundles,
  buildPortfolioOverviewRows: mocks.buildPortfolioOverviewRows,
  buildPortfolioAlertRows: mocks.buildPortfolioAlertRows,
  buildPortfolioTaskRows: mocks.buildPortfolioTaskRows,
  buildPortfolioVendorRows: mocks.buildPortfolioVendorRows,
  buildPortfolioReportRows: mocks.buildPortfolioReportRows,
}))

describe("portfolio api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePortfolioAccess.mockResolvedValue({ memberships: [{ orgId: "org-1" }] })
    mocks.loadPortfolioBundles.mockResolvedValue([{ membership: { orgId: "org-1" } }])
  })

  it("overview răspunde 401 când accesul e respins", async () => {
    mocks.requirePortfolioAccess.mockRejectedValueOnce(
      new AuthzError("Autentificare necesară.", 401, "UNAUTHORIZED")
    )

    const response = await getOverview(new Request("http://localhost/api/portfolio/overview"))

    expect(response.status).toBe(401)
  })

  it("overview răspunde 200 cu clients", async () => {
    mocks.buildPortfolioOverviewRows.mockReturnValueOnce([{ orgId: "org-1", orgName: "Acme" }])

    const response = await getOverview(new Request("http://localhost/api/portfolio/overview"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.clients).toHaveLength(1)
  })

  it("alerts răspunde 403 pentru non-partner", async () => {
    mocks.requirePortfolioAccess.mockRejectedValueOnce(
      new AuthzError("Doar partner.", 403, "PORTFOLIO_FORBIDDEN")
    )

    const response = await getAlerts(new Request("http://localhost/api/portfolio/alerts"))

    expect(response.status).toBe(403)
  })

  it("tasks răspunde 200 cu taskurile agregate", async () => {
    mocks.buildPortfolioTaskRows.mockReturnValueOnce([{ taskId: "task-1", orgId: "org-1" }])

    const response = await getTasks(new Request("http://localhost/api/portfolio/tasks"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.tasks).toHaveLength(1)
  })

  it("vendors răspunde 200 cu vendorii dedupați", async () => {
    mocks.buildPortfolioVendorRows.mockReturnValueOnce([{ dedupeKey: "vendor-1" }])

    const response = await getVendors(new Request("http://localhost/api/portfolio/vendors"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.vendors).toHaveLength(1)
  })

  it("reports răspunde 200 cu metadatele agregate", async () => {
    mocks.buildPortfolioReportRows.mockReturnValueOnce([{ orgId: "org-1", orgName: "Acme" }])

    const response = await getReports(new Request("http://localhost/api/portfolio/reports"))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.reports).toHaveLength(1)
  })
})
