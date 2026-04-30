import type { UserRole } from "@/lib/server/auth"

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Proprietar",
  partner_manager: "Consultant",
  compliance: "Responsabil conformitate",
  reviewer: "Reviewer",
  viewer: "Vizitator",
}

export function membershipRoleLabel(role: string): string {
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as UserRole]
  }
  return role.replace(/_/g, " ")
}
