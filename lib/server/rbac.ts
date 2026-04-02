// Sprint 6 — RBAC Minim
// Constante și helpers pentru control acces bazat pe rol.
// Roluri: owner > partner_manager > compliance > reviewer > viewer

import type { UserRole } from "@/lib/server/auth"

/** Roluri care pot citi starea operațională a organizației */
export const READ_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer", "viewer"]

/** Roluri care pot efectua operații de scriere (creare, modificare) */
export const WRITE_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer"]

/** Roluri care pot efectua operații de ștergere */
export const DELETE_ROLES: UserRole[] = ["owner", "partner_manager", "compliance"]

/** Roluri care pot exporta audit pack / documente sensibile */
export const EXPORT_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer"]

/** Roluri care pot reseta starea workspace-ului */
export const RESET_ROLES: UserRole[] = ["owner"]

/** Roluri care pot gestiona membrii organizației */
export const MEMBERS_ADMIN_ROLES: UserRole[] = ["owner"]

export function canWrite(role: UserRole | undefined): boolean {
  return !!role && WRITE_ROLES.includes(role)
}

export function canDelete(role: UserRole | undefined): boolean {
  return !!role && DELETE_ROLES.includes(role)
}

export function canExport(role: UserRole | undefined): boolean {
  return !!role && EXPORT_ROLES.includes(role)
}

export function isViewer(role: UserRole | undefined): boolean {
  return role === "viewer"
}
