import { describe, expect, it } from "vitest"

import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import {
  buildDemoNis2State,
  buildDemoState,
  DEMO_SCENARIOS,
} from "@/lib/server/demo-seed"

describe("demo revalidation scenario", () => {
  it("include scenariul revalidation în lista demo publică", () => {
    expect(DEMO_SCENARIOS).toContain("revalidation")
  })

  it("seed-uiește un finding SYS-002 cu flow needs_revalidation", () => {
    const state = buildDemoState("revalidation")
    const finding = state.findings.find((item) => item.id === "demo-review-1")

    expect(finding).toBeDefined()
    expect(finding?.title).toContain("necesită revalidare")
    expect(finding?.findingStatus).toBe("open")

    const recipe = buildCockpitRecipe(finding!)
    expect(recipe.findingTypeId).toBe("SYS-002")
    expect(recipe.resolveFlowState).toBe("needs_revalidation")
  })

  it("nu încearcă să seed-uiască state NIS2 separat pentru revalidation", () => {
    expect(buildDemoNis2State("revalidation")).toBeNull()
  })
})
