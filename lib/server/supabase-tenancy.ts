import type {
  OrganizationMembershipRecord,
  OrganizationRecord,
  PersistedUserRecord,
} from "@/lib/server/auth"
import { hasSupabaseConfig, supabaseUpsert } from "@/lib/server/supabase-rest"

// S2A.7 — adăugat "dual-write" pentru cutover safe (write paralel local + supabase,
// read din local, log discrepancies). Folosit 1 săpt înainte de switch la "supabase".
export type DataBackend = "local" | "supabase" | "hybrid" | "dual-write"

export function getConfiguredDataBackend(): DataBackend {
  const value = process.env.COMPLISCAN_DATA_BACKEND?.trim().toLowerCase()
  if (value === "supabase") return "supabase"
  if (value === "hybrid") return "hybrid"
  if (value === "dual-write" || value === "dual_write" || value === "dual") return "dual-write"
  if (value === "local") return "local"
  // On serverless platforms (Vercel), auto-use Supabase when credentials are present
  // so state persists across serverless instances without explicit env var
  if (process.env.VERCEL && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "supabase"
  }
  return "local"
}

export function shouldMirrorTenancyToSupabase() {
  const backend = getConfiguredDataBackend()
  return hasSupabaseConfig() && (backend === "supabase" || backend === "hybrid")
}

export function shouldUseSupabaseTenancyAsPrimary() {
  return hasSupabaseConfig() && getConfiguredDataBackend() === "supabase"
}

export async function syncUserTenancyToSupabase(input: {
  userId: string
  users: PersistedUserRecord[]
  organizations: OrganizationRecord[]
  memberships: OrganizationMembershipRecord[]
}) {
  if (!shouldMirrorTenancyToSupabase()) {
    return { synced: false, reason: "DATA_BACKEND_LOCAL" as const }
  }

  const user = input.users.find((entry) => entry.id === input.userId)
  if (!user || !isSupabaseAuthUser(user)) {
    return { synced: false, reason: "USER_NOT_SYNCABLE" as const }
  }

  const memberships = input.memberships.filter((entry) => entry.userId === input.userId)
  if (memberships.length === 0) {
    return { synced: false, reason: "NO_MEMBERSHIPS" as const }
  }

  const organizationIds = [...new Set(memberships.map((entry) => entry.orgId))]
  const organizations = input.organizations.filter((entry) => organizationIds.includes(entry.id))

  await upsertOrganizations(organizations)
  await upsertProfiles([user])
  await upsertMemberships(memberships)

  return {
    synced: true,
    organizations: organizations.length,
    memberships: memberships.length,
  }
}

export async function syncOrganizationTenancyToSupabase(input: {
  orgId: string
  users: PersistedUserRecord[]
  organizations: OrganizationRecord[]
  memberships: OrganizationMembershipRecord[]
}) {
  if (!shouldMirrorTenancyToSupabase()) {
    return { synced: false, reason: "DATA_BACKEND_LOCAL" as const }
  }

  const organization = input.organizations.find((entry) => entry.id === input.orgId)
  if (!organization) {
    return { synced: false, reason: "ORGANIZATION_NOT_FOUND" as const }
  }

  const memberships = input.memberships.filter((entry) => entry.orgId === input.orgId)
  const syncableUsers = input.users.filter((entry) =>
    memberships.some((membership) => membership.userId === entry.id) && isSupabaseAuthUser(entry)
  )
  const syncableUserIds = new Set(syncableUsers.map((entry) => entry.id))
  const syncableMemberships = memberships.filter((entry) => syncableUserIds.has(entry.userId))

  await upsertOrganizations([organization])
  if (syncableUsers.length > 0) {
    await upsertProfiles(syncableUsers)
  }
  if (syncableMemberships.length > 0) {
    await upsertMemberships(syncableMemberships)
  }

  return {
    synced: true,
    organizations: 1,
    memberships: syncableMemberships.length,
  }
}

export async function syncTenancyGraphToSupabase(input: {
  users: PersistedUserRecord[]
  organizations: OrganizationRecord[]
  memberships: OrganizationMembershipRecord[]
}) {
  if (!shouldMirrorTenancyToSupabase()) {
    return { synced: false, reason: "DATA_BACKEND_LOCAL" as const }
  }

  const syncableUsers = input.users.filter(isSupabaseAuthUser)
  if (syncableUsers.length === 0) {
    return { synced: false, reason: "USER_GRAPH_NOT_SYNCABLE" as const }
  }

  const syncableUserIds = new Set(syncableUsers.map((entry) => entry.id))
  const syncableMemberships = input.memberships.filter((entry) => syncableUserIds.has(entry.userId))
  const organizationIds = new Set(syncableMemberships.map((entry) => entry.orgId))
  const organizations = input.organizations.filter((entry) => organizationIds.has(entry.id))

  await upsertOrganizations(organizations)
  await upsertProfiles(syncableUsers)
  await upsertMemberships(syncableMemberships)

  return {
    synced: true,
    organizations: organizations.length,
    memberships: syncableMemberships.length,
    users: syncableUsers.length,
  }
}

async function upsertOrganizations(organizations: OrganizationRecord[]) {
  if (organizations.length === 0) return

  try {
    await supabaseUpsert(
      "organizations",
      organizations.map((organization) => ({
        id: organization.id,
        slug: slugify(organization.name),
        name: organization.name,
        created_at: organization.createdAtISO,
        updated_at: organization.createdAtISO,
      })),
      "public"
    )
  } catch (err) {
    // Slug conflict (23505 on organizations_slug_key) — retry with id-suffixed slug
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("23505") && msg.includes("slug")) {
      await supabaseUpsert(
        "organizations",
        organizations.map((organization) => ({
          id: organization.id,
          slug: `${slugify(organization.name)}-${organization.id.slice(-8)}`,
          name: organization.name,
          created_at: organization.createdAtISO,
          updated_at: organization.createdAtISO,
        })),
        "public"
      )
      return
    }
    throw err
  }
}

async function upsertProfiles(users: PersistedUserRecord[]) {
  const syncableUsers = users.filter(isSupabaseAuthUser)
  if (syncableUsers.length === 0) return

  await supabaseUpsert(
    "profiles",
    syncableUsers.map((user) => ({
      id: user.id,
      email: user.email,
      display_name: normalizeEmail(user.email).split("@")[0] || user.email,
      updated_at: user.createdAtISO,
    })),
    "public"
  )
}

async function upsertMemberships(memberships: OrganizationMembershipRecord[]) {
  if (memberships.length === 0) return

  await supabaseUpsert(
    "memberships",
    memberships.map((membership) => ({
      id: membership.id,
      user_id: membership.userId,
      org_id: membership.orgId,
      role: membership.role,
      status: membership.status === "inactive" ? "inactive" : "active",
      created_at: membership.createdAtISO,
      updated_at: membership.createdAtISO,
    })),
    "public"
  )
}

function isSupabaseAuthUser(user: PersistedUserRecord) {
  return user.authProvider === "supabase" && isLikelyUuid(user.id)
}

function isLikelyUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || null
  )
}
