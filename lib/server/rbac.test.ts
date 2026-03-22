import { describe, expect, it } from "vitest"

import { canDelete, canExport, canWrite, isViewer, WRITE_ROLES, DELETE_ROLES, EXPORT_ROLES, RESET_ROLES, MEMBERS_ADMIN_ROLES } from "@/lib/server/rbac"

describe("lib/server/rbac", () => {
  it("partner_manager are acces de scriere", () => {
    expect(canWrite("partner_manager")).toBe(true)
    expect(WRITE_ROLES).toContain("partner_manager")
  })

  it("partner_manager are acces de stergere operationala", () => {
    expect(canDelete("partner_manager")).toBe(true)
    expect(DELETE_ROLES).toContain("partner_manager")
  })

  it("partner_manager are acces de export", () => {
    expect(canExport("partner_manager")).toBe(true)
    expect(EXPORT_ROLES).toContain("partner_manager")
  })

  it("partner_manager nu este viewer", () => {
    expect(isViewer("partner_manager")).toBe(false)
  })

  it("partner_manager nu poate reseta workspace-ul", () => {
    expect(RESET_ROLES).not.toContain("partner_manager")
  })

  it("partner_manager nu poate administra membrii", () => {
    expect(MEMBERS_ADMIN_ROLES).not.toContain("partner_manager")
  })

  it("owner are acces complet", () => {
    expect(canWrite("owner")).toBe(true)
    expect(canDelete("owner")).toBe(true)
    expect(canExport("owner")).toBe(true)
    expect(isViewer("owner")).toBe(false)
    expect(RESET_ROLES).toContain("owner")
    expect(MEMBERS_ADMIN_ROLES).toContain("owner")
  })

  it("viewer nu are acces de scriere, stergere sau export", () => {
    expect(canWrite("viewer")).toBe(false)
    expect(canDelete("viewer")).toBe(false)
    expect(canExport("viewer")).toBe(false)
    expect(isViewer("viewer")).toBe(true)
  })
})
