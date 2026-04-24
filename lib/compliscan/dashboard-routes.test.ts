import { describe, expect, it } from "vitest"

import { dashboardFindingRoute, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

describe("lib/compliscan/dashboard-routes", () => {
  it("construieste ruta canonica pentru cockpitul unui finding", () => {
    expect(dashboardFindingRoute("finding-123")).toBe(`${dashboardRoutes.resolve}/finding-123`)
  })

  it("encodeaza finding id-ul si pastreaza query-ul", () => {
    expect(dashboardFindingRoute("finding/cu spatii", { action: "generate", focus: true })).toBe(
      `${dashboardRoutes.resolve}/finding%2Fcu%20spatii?action=generate&focus=true`
    )
  })
})
