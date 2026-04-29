import { describe, expect, it } from "vitest"

import {
  canSwitchToPortfolio,
  getMobileNavItems,
  getSidebarNavSections,
} from "@/lib/compliscan/nav-config"

describe("lib/compliscan/nav-config", () => {
  it("arata sectiunea Portofoliu pentru partner in org mode", () => {
    const sections = getSidebarNavSections({
      userMode: "partner",
      workspaceMode: "org",
      role: "partner_manager",
    })

    expect(sections.map((section) => section.label)).toEqual([
      "Portofoliu",
      "Firma activa",
      "Instrumente DPO",
    ])
    expect(sections[0]?.items[0]).toEqual(
      expect.objectContaining({
        label: "Portofoliu",
        href: "/portfolio",
        workspaceModeTarget: "portfolio",
      })
    )
    expect(sections[0]?.items.map((item) => item.href)).toEqual([
      "/portfolio",
      "/portfolio/alerts",
      "/portfolio/tasks",
      "/portfolio/vendors",
      "/portfolio/reports",
    ])
    expect(sections[2]?.items.map((item) => item.href)).toEqual([
      "/dashboard/dsar",
      "/dashboard/ropa",
      "/dashboard/vendor-review",
      "/dashboard/breach",
      "/dashboard/calendar",
      "/dashboard/magic-links",
      "/dashboard/cabinet/templates",
      "/dashboard/training",
    ])
  })

  it("arata doar shell-ul portfolio pentru partner in portfolio mode", () => {
    const sections = getSidebarNavSections({
      userMode: "partner",
      workspaceMode: "portfolio",
      role: "partner_manager",
    })

    expect(sections).toHaveLength(1)
    expect(sections[0]?.label).toBe("Portofoliu")
    expect(sections[0]?.items).toHaveLength(5)
    expect(sections[0]?.items[0]?.workspaceModeTarget).toBeUndefined()
  })

  it("nu expune Portofoliu pentru solo", () => {
    const sections = getSidebarNavSections({
      userMode: "solo",
      workspaceMode: "org",
      role: "owner",
    })

    expect(sections).toHaveLength(2)
    expect(sections[0]?.label).toBe("Flux principal")
    expect(sections[0]?.items.some((item) => item.href === "/portfolio")).toBe(false)
    expect(sections[0]?.items.map((item) => item.href)).toEqual([
      "/dashboard",
      "/dashboard/scan",
      "/dashboard/resolve",
      "/dashboard/dosar",
      "/dashboard/settings",
    ])
    expect(sections[1]?.label).toBe("Module conformitate")
  })

  it("restrange nav-ul viewer in org mode", () => {
    const items = getMobileNavItems({
      userMode: "viewer",
      workspaceMode: "org",
      role: "viewer",
    })

    expect(items.map((item) => item.id)).toEqual(["home", "resolve", "documente", "settings"])
  })

  it("pastreaza nav-ul org pentru compliance", () => {
    const items = getMobileNavItems({
      userMode: "compliance",
      workspaceMode: "org",
      role: "compliance",
    })

    expect(items.map((item) => item.id)).toEqual(["home", "scan", "resolve", "dosar", "settings"])
  })

  it("permite switch la portfolio doar pentru userMode partner", () => {
    expect(canSwitchToPortfolio("partner")).toBe(true)
    expect(canSwitchToPortfolio("solo")).toBe(false)
    expect(canSwitchToPortfolio("compliance")).toBe(false)
    expect(canSwitchToPortfolio("viewer")).toBe(false)
    expect(canSwitchToPortfolio(null)).toBe(false)
  })

  it("expune toate suprafetele portfolio pe mobile in portfolio mode", () => {
    const items = getMobileNavItems({
      userMode: "partner",
      workspaceMode: "portfolio",
      role: "partner_manager",
    })

    expect(items.map((item) => item.href)).toEqual([
      "/portfolio",
      "/portfolio/alerts",
      "/portfolio/tasks",
      "/portfolio/vendors",
      "/portfolio/reports",
    ])
  })
})
