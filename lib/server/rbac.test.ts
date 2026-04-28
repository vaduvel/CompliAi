import { describe, expect, it } from "vitest"

import {
  canDelete,
  canExport,
  canPerform,
  canWrite,
  getPermissionMatrixForExport,
  isViewer,
  DELETE_ROLES,
  EXPORT_ROLES,
  MEMBERS_ADMIN_ROLES,
  PERMISSION_MATRIX,
  RESET_ROLES,
  USER_ROLES,
  WRITE_ROLES,
} from "@/lib/server/rbac"

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

  it("expune o matrice explicita pentru actiunile sensibile de cabinet", () => {
    expect(PERMISSION_MATRIX.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        "send_magic_link",
        "validate_baseline",
        "export_client_audit_pack",
        "export_cabinet_archive",
        "manage_templates",
        "delete_evidence",
      ])
    )
    expect(canPerform("partner_manager", "send_magic_link")).toBe(true)
    expect(canPerform("partner_manager", "validate_baseline")).toBe(true)
    expect(canPerform("partner_manager", "export_cabinet_archive")).toBe(true)
    expect(canPerform("reviewer", "export_client_audit_pack")).toBe(true)
    expect(canPerform("reviewer", "validate_baseline")).toBe(false)
    expect(canPerform("viewer", "send_magic_link")).toBe(false)
    expect(canPerform(undefined, "view_workspace")).toBe(false)
  })

  it("nu lasa actiuni fara roluri sau roluri necunoscute in matrice", () => {
    for (const row of PERMISSION_MATRIX) {
      expect(row.roles.length).toBeGreaterThan(0)
      for (const role of row.roles) {
        expect(USER_ROLES).toContain(role)
      }
    }
  })

  it("returneaza o copie safe pentru exportul de securitate", () => {
    const exported = getPermissionMatrixForExport()
    exported[0]?.roles.push("owner")
    expect(exported).not.toBe(PERMISSION_MATRIX)
    expect(exported[0]?.roles).not.toBe(PERMISSION_MATRIX[0]?.roles)
  })
})
