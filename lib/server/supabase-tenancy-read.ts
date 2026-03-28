import { hasSupabaseConfig, supabaseSelect } from "@/lib/server/supabase-rest"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

export type CloudOrganizationRecord = {
  id: string
  name: string
  createdAtISO: string
}

export type CloudMembershipRole = "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"

export type CloudMembershipRecord = {
  id: string
  userId: string
  orgId: string
  role: CloudMembershipRole
  createdAtISO: string
  status: "active" | "inactive"
}

export type CloudProfileRecord = {
  id: string
  email: string
  displayName?: string
  createdAtISO: string
}

type OrganizationRow = {
  id: string
  name: string
  created_at?: string
}

type MembershipRow = {
  id: string
  user_id: string
  org_id: string
  role: string
  status?: string
  created_at?: string
}

type ProfileRow = {
  id: string
  email?: string | null
  display_name?: string | null
  created_at?: string
}

export function shouldReadTenancyFromSupabase() {
  return hasSupabaseConfig() && getConfiguredDataBackend() === "supabase"
}

export async function loadTenancyGraphFromSupabase() {
  if (!shouldReadTenancyFromSupabase()) {
    return {
      organizations: [] as CloudOrganizationRecord[],
      memberships: [] as CloudMembershipRecord[],
      profiles: [] as CloudProfileRecord[],
    }
  }

  const [organizations, memberships, profiles] = await Promise.all([
    supabaseSelect<OrganizationRow>("organizations", "select=id,name,created_at", "public"),
    supabaseSelect<MembershipRow>(
      "memberships",
      "select=id,user_id,org_id,role,status,created_at",
      "public"
    ),
    supabaseSelect<ProfileRow>("profiles", "select=id,email,display_name,created_at", "public"),
  ])

  return {
    organizations: organizations
      .filter((row) => typeof row.id === "string" && typeof row.name === "string")
      .map((row) => ({
        id: row.id,
        name: row.name.trim() || row.id,
        createdAtISO: row.created_at || new Date().toISOString(),
      })),
    memberships: memberships
      .filter(
        (row) =>
          typeof row.id === "string" &&
          typeof row.user_id === "string" &&
          typeof row.org_id === "string" &&
          isCloudMembershipRole(row.role)
      )
      .map((row) => ({
        id: row.id,
        userId: row.user_id,
        orgId: row.org_id,
        role: row.role,
        status: row.status === "inactive" ? "inactive" : "active",
        createdAtISO: row.created_at || new Date().toISOString(),
      })),
    profiles: profiles
      .filter((row) => typeof row.id === "string" && typeof row.email === "string")
      .map((row) => ({
        id: row.id,
        email: row.email!.toLowerCase().trim(),
        displayName: row.display_name?.trim() || undefined,
        createdAtISO: row.created_at || new Date().toISOString(),
      })),
  }
}

function isCloudMembershipRole(value: string): value is CloudMembershipRole {
  return (
    value === "owner" ||
    value === "partner_manager" ||
    value === "compliance" ||
    value === "reviewer" ||
    value === "viewer"
  )
}
