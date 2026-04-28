// Sprint 6 — RBAC Minim
// Constante și helpers pentru control acces bazat pe rol.
// Roluri: owner > partner_manager > compliance > reviewer > viewer

import type { UserRole } from "@/lib/server/auth"

export const USER_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer", "viewer"]

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

export type RbacAction =
  | "view_workspace"
  | "view_portfolio"
  | "edit_findings"
  | "upload_evidence"
  | "validate_evidence"
  | "send_magic_link"
  | "approve_document"
  | "reject_document"
  | "validate_baseline"
  | "export_client_audit_pack"
  | "export_cabinet_archive"
  | "manage_templates"
  | "manage_branding"
  | "manage_members"
  | "delete_evidence"
  | "reset_workspace"

export type PermissionMatrixRow = {
  action: RbacAction
  label: string
  description: string
  roles: UserRole[]
}

export const PERMISSION_MATRIX: PermissionMatrixRow[] = [
  {
    action: "view_workspace",
    label: "Vezi workspace client",
    description: "Poate citi dashboard-ul, findings, documente și dovezi existente.",
    roles: READ_ROLES,
  },
  {
    action: "view_portfolio",
    label: "Vezi portofoliu cabinet",
    description: "Poate vedea lista de clienți și prioritățile cross-client.",
    roles: ["owner", "partner_manager", "compliance"],
  },
  {
    action: "edit_findings",
    label: "Editează/remediază findings",
    description: "Poate modifica statusuri operaționale, note și sarcini de remediere.",
    roles: WRITE_ROLES,
  },
  {
    action: "upload_evidence",
    label: "Atașează dovezi",
    description: "Poate încărca documente, screenshot-uri, note și artefacte de lucru.",
    roles: WRITE_ROLES,
  },
  {
    action: "validate_evidence",
    label: "Validează dovezi",
    description: "Poate marca o dovadă ca suficientă după review profesional.",
    roles: ["owner", "partner_manager", "compliance"],
  },
  {
    action: "send_magic_link",
    label: "Trimite magic link clientului",
    description: "Poate trimite documente pentru aprobare/comentariu/respingere.",
    roles: ["owner", "partner_manager", "compliance"],
  },
  {
    action: "approve_document",
    label: "Aprobă document intern",
    description: "Poate marca documentul ca aprobat intern înainte de trimitere externă.",
    roles: ["owner", "partner_manager", "compliance", "reviewer"],
  },
  {
    action: "reject_document",
    label: "Respinge document intern",
    description: "Poate cere revizie sau respinge un draft înainte de utilizare oficială.",
    roles: ["owner", "partner_manager", "compliance", "reviewer"],
  },
  {
    action: "validate_baseline",
    label: "Validează baseline",
    description: "Poate îngheța starea ca baseline după închiderea remedierilor.",
    roles: ["owner", "partner_manager", "compliance"],
  },
  {
    action: "export_client_audit_pack",
    label: "Exportă Audit Pack client",
    description: "Poate exporta dosarul clientului curent pentru review/control.",
    roles: EXPORT_ROLES,
  },
  {
    action: "export_cabinet_archive",
    label: "Exportă arhivă cabinet",
    description: "Poate exporta portofoliul complet cu clienți, template-uri și metadata.",
    roles: ["owner", "partner_manager"],
  },
  {
    action: "manage_templates",
    label: "Gestionează template-uri cabinet",
    description: "Poate încărca, activa, arhiva sau șterge template-uri cabinet.",
    roles: ["owner", "partner_manager"],
  },
  {
    action: "manage_branding",
    label: "Gestionează branding white-label",
    description: "Poate modifica numele, logo-ul, culorile și modul AI al cabinetului.",
    roles: ["owner", "partner_manager"],
  },
  {
    action: "manage_members",
    label: "Gestionează membrii",
    description: "Poate adăuga, elimina sau schimba roluri pentru membrii cabinetului.",
    roles: MEMBERS_ADMIN_ROLES,
  },
  {
    action: "delete_evidence",
    label: "Șterge dovezi",
    description: "Poate elimina dovezi operaționale. Acțiune sensibilă, logată în audit trail.",
    roles: DELETE_ROLES,
  },
  {
    action: "reset_workspace",
    label: "Resetează workspace",
    description: "Poate reseta complet workspace-ul curent.",
    roles: RESET_ROLES,
  },
]

export const PERMISSIONS_BY_ACTION: Record<RbacAction, UserRole[]> = PERMISSION_MATRIX.reduce(
  (acc, row) => {
    acc[row.action] = row.roles
    return acc
  },
  {} as Record<RbacAction, UserRole[]>
)

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

export function canPerform(role: UserRole | undefined, action: RbacAction): boolean {
  return !!role && (PERMISSIONS_BY_ACTION[action] ?? []).includes(role)
}

export function getPermissionMatrixForExport() {
  return PERMISSION_MATRIX.map((row) => ({
    ...row,
    roles: [...row.roles],
  }))
}
