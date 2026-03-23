import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

import { writeFileSafe } from "@/lib/server/fs-safe"
import { isLocalFallbackAllowedForCloudPrimary } from "@/lib/server/cloud-fallback-policy"
import {
  shouldUseSupabaseTenancyAsPrimary,
  syncOrganizationTenancyToSupabase,
  syncTenancyGraphToSupabase,
  syncUserTenancyToSupabase,
} from "@/lib/server/supabase-tenancy"
import {
  loadTenancyGraphFromSupabase,
  shouldReadTenancyFromSupabase,
} from "@/lib/server/supabase-tenancy-read"

export type UserRole = "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"
export type UserMode = "solo" | "partner" | "compliance" | "viewer"
export type AuthBackend = "local" | "supabase" | "hybrid"
export type AuthProvider = "local" | "supabase"

export type PersistedUserRecord = {
  id: string
  email: string
  passwordHash: string
  salt: string
  createdAtISO: string
  authProvider?: AuthProvider
  orgId?: string
  orgName?: string
  userMode?: UserMode
}

export type OrganizationRecord = {
  id: string
  name: string
  createdAtISO: string
}

export type OrganizationMembershipRecord = {
  id: string
  userId: string
  orgId: string
  role: UserRole
  createdAtISO: string
  status?: "active" | "inactive"
}

export type User = {
  id: string
  email: string
  passwordHash: string
  salt: string
  createdAtISO: string
  authProvider: AuthProvider
  membershipId: string
  orgId: string
  orgName: string
  role: UserRole
}

export type OrganizationMember = {
  membershipId: string
  userId: string
  email: string
  role: UserRole
  createdAtISO: string
  orgId: string
  orgName: string
}

export type OrganizationOwnershipSummary =
  | {
      orgId: string
      orgName: string
      ownerState: "system"
      owner: {
        type: "system"
        label: "system"
      }
    }
  | {
      orgId: string
      orgName: string
      ownerState: "claimed"
      owner: {
        type: "user"
        membershipId: string
        userId: string
        email: string
        createdAtISO: string
      }
    }

export type UserMembershipSummary = {
  membershipId: string
  orgId: string
  orgName: string
  role: UserRole
  createdAtISO: string
  status: "active" | "inactive"
}

export type WorkspaceMode = "org" | "portfolio"

export type SessionPayload = {
  userId: string
  orgId: string
  email: string
  orgName: string
  role: UserRole
  membershipId?: string
  workspaceMode?: WorkspaceMode
  exp: number
}

export class AuthzError extends Error {
  status: number
  code: string

  constructor(message: string, status = 403, code = "AUTH_ROLE_FORBIDDEN") {
    super(message)
    this.name = "AuthzError"
    this.status = status
    this.code = code
  }
}

export const SESSION_COOKIE = "compliscan_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function resolveDataFilePath(envKey: string, fallbackFileName: string) {
  const explicit = process.env[envKey]?.trim()
  if (explicit) return explicit
  return path.join(process.cwd(), ".data", fallbackFileName)
}

function getUsersFile() {
  return resolveDataFilePath("COMPLISCAN_USERS_FILE", "users.json")
}

function getOrganizationsFile() {
  return resolveDataFilePath("COMPLISCAN_ORGS_FILE", "orgs.json")
}

function getMembershipsFile() {
  return resolveDataFilePath("COMPLISCAN_MEMBERSHIPS_FILE", "memberships.json")
}

function getSecret(): string {
  const explicit = process.env.COMPLISCAN_SESSION_SECRET?.trim()
  if (explicit) return explicit

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "COMPLISCAN_SESSION_SECRET lipseste. Configureaza secretul de sesiune in productie."
    )
  }

  return "dev-secret-change-me-in-production"
}

export function getConfiguredAuthBackend(): AuthBackend {
  const value = process.env.COMPLISCAN_AUTH_BACKEND?.trim().toLowerCase()
  if (value === "supabase") return "supabase"
  if (value === "hybrid") return "hybrid"
  return "local"
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function isLikelyUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function displayNameToEmail(displayName: string | undefined, id: string) {
  const normalized =
    displayName
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 40) || `user.${id.slice(0, 8)}`
  return `${normalized}@placeholder.local`
}

function rolePriority(role: UserRole) {
  switch (role) {
    case "owner":
      return 0
    case "partner_manager":
      return 1
    case "compliance":
      return 2
    case "reviewer":
      return 3
    case "viewer":
      return 4
    default:
      return 99
  }
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "owner" ||
    value === "partner_manager" ||
    value === "compliance" ||
    value === "reviewer" ||
    value === "viewer"
  )
}

function isUserMode(value: unknown): value is UserMode {
  return (
    value === "solo" ||
    value === "partner" ||
    value === "compliance" ||
    value === "viewer"
  )
}

function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return value === "org" || value === "portfolio"
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await writeFileSafe(filePath, JSON.stringify(value, null, 2))
}

function buildLegacyOrganization(user: PersistedUserRecord): OrganizationRecord {
  return {
    id: user.orgId?.trim() || `org-${user.id}`,
    name: user.orgName?.trim() || normalizeEmail(user.email).split("@")[0] || `Org ${user.id}`,
    createdAtISO: user.createdAtISO,
  }
}

function hasLegacyOrganizationContext(user: PersistedUserRecord) {
  return Boolean(user.orgId?.trim() || user.orgName?.trim())
}

function buildLegacyMembership(
  user: PersistedUserRecord,
  orgId: string
): OrganizationMembershipRecord {
  return {
    id: `membership-${user.id}-${orgId}`,
    userId: user.id,
    orgId,
    role: "owner",
    createdAtISO: user.createdAtISO,
    status: "active",
  }
}

function dedupeOrganizations(
  organizations: OrganizationRecord[],
  legacyUsers: PersistedUserRecord[]
): OrganizationRecord[] {
  const map = new Map<string, OrganizationRecord>()

  for (const org of organizations) {
    if (!org?.id) continue
    map.set(org.id, {
      id: org.id,
      name: org.name?.trim() || org.id,
      createdAtISO: org.createdAtISO || new Date().toISOString(),
    })
  }

  for (const user of legacyUsers) {
    if (!hasLegacyOrganizationContext(user)) continue
    const org = buildLegacyOrganization(user)
    if (!map.has(org.id)) {
      map.set(org.id, org)
    }
  }

  return [...map.values()]
}

function dedupeMemberships(
  memberships: OrganizationMembershipRecord[],
  legacyUsers: PersistedUserRecord[],
  organizations: OrganizationRecord[]
): OrganizationMembershipRecord[] {
  const organizationIds = new Set(organizations.map((entry) => entry.id))
  const byKey = new Map<string, OrganizationMembershipRecord>()
  const usersWithMembership = new Set<string>()

  for (const membership of memberships) {
    if (!membership?.userId || !membership?.orgId) continue

    const normalized: OrganizationMembershipRecord = {
      id: membership.id || `membership-${membership.userId}-${membership.orgId}`,
      userId: membership.userId,
      orgId: membership.orgId,
      role: isUserRole(membership.role) ? membership.role : "owner",
      createdAtISO: membership.createdAtISO || new Date().toISOString(),
      status: membership.status === "inactive" ? "inactive" : "active",
    }

    organizationIds.add(normalized.orgId)
    byKey.set(`${normalized.userId}:${normalized.orgId}`, normalized)
    usersWithMembership.add(normalized.userId)
  }

  for (const user of legacyUsers) {
    if (!hasLegacyOrganizationContext(user) || usersWithMembership.has(user.id)) continue
    const org = buildLegacyOrganization(user)
    const key = `${user.id}:${org.id}`
    if (!byKey.has(key)) {
      byKey.set(key, buildLegacyMembership(user, org.id))
      organizationIds.add(org.id)
    }
  }

  return [...byKey.values()].filter((membership) => organizationIds.has(membership.orgId))
}

async function loadAuthGraph() {
  const users = await readJsonFile<PersistedUserRecord[]>(getUsersFile(), [])
  const storedOrganizations = await readJsonFile<OrganizationRecord[]>(getOrganizationsFile(), [])
  const storedMemberships = await readJsonFile<OrganizationMembershipRecord[]>(
    getMembershipsFile(),
    []
  )

  if (shouldReadTenancyFromSupabase()) {
    try {
      const cloud = await loadTenancyGraphFromSupabase()
      const hasCloudGraph = cloudGraphExists(cloud)

      if (hasCloudGraph) {
        const cloudOrganizations: OrganizationRecord[] = cloud.organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
          createdAtISO: organization.createdAtISO,
        }))
        const cloudMemberships: OrganizationMembershipRecord[] = cloud.memberships.map(
          (membership): OrganizationMembershipRecord => ({
            id: membership.id,
            userId: membership.userId,
            orgId: membership.orgId,
            role: isUserRole(membership.role) ? membership.role : "viewer",
            status: membership.status === "inactive" ? "inactive" : "active",
            createdAtISO: membership.createdAtISO,
          })
        )

        return {
          users: mergeUsersWithCloudProfiles(users, cloud.profiles),
          organizations: cloudOrganizations,
          memberships: cloudMemberships,
        }
      }
    } catch (error) {
      if (shouldUseSupabaseTenancyAsPrimary() && !isLocalFallbackAllowedForCloudPrimary()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_TENANCY_REQUIRED: ${error.message}`
            : "SUPABASE_TENANCY_REQUIRED"
        )
      }
    }
  }

  const organizations = dedupeOrganizations(storedOrganizations, users)
  const memberships = dedupeMemberships(storedMemberships, users, organizations)

  const organizationsChanged = JSON.stringify(organizations) !== JSON.stringify(storedOrganizations)
  const membershipsChanged = JSON.stringify(memberships) !== JSON.stringify(storedMemberships)

  if (organizationsChanged) {
    await writeJsonFile(getOrganizationsFile(), organizations)
  }
  if (membershipsChanged) {
    await writeJsonFile(getMembershipsFile(), memberships)
  }

  if (shouldUseSupabaseTenancyAsPrimary()) {
    try {
      const syncResult = await syncTenancyGraphToSupabase({
        users,
        organizations,
        memberships,
      })

      if (syncResult.synced) {
        const cloud = await loadTenancyGraphFromSupabase()
        if (cloudGraphExists(cloud)) {
          return {
            users: mergeUsersWithCloudProfiles(users, cloud.profiles),
            organizations: cloud.organizations.map((organization) => ({
              id: organization.id,
              name: organization.name,
              createdAtISO: organization.createdAtISO,
            })),
            memberships: cloud.memberships.map(
              (membership): OrganizationMembershipRecord => ({
                id: membership.id,
                userId: membership.userId,
                orgId: membership.orgId,
                role: isUserRole(membership.role) ? membership.role : "viewer",
                status: membership.status === "inactive" ? "inactive" : "active",
                createdAtISO: membership.createdAtISO,
              })
            ),
          }
        }
      }
    } catch (error) {
      if (!isLocalFallbackAllowedForCloudPrimary()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_TENANCY_REQUIRED: ${error.message}`
            : "SUPABASE_TENANCY_REQUIRED"
        )
      }
    }
  }

  return { users, organizations, memberships }
}

function cloudGraphExists(cloud: Awaited<ReturnType<typeof loadTenancyGraphFromSupabase>>) {
  return (
    cloud.organizations.length > 0 ||
    cloud.memberships.length > 0 ||
    cloud.profiles.length > 0
  )
}

async function saveUsers(records: PersistedUserRecord[]) {
  await writeJsonFile(getUsersFile(), records)
}

async function saveOrganizations(records: OrganizationRecord[]) {
  await writeJsonFile(getOrganizationsFile(), records)
}

async function saveMemberships(records: OrganizationMembershipRecord[]) {
  await writeJsonFile(getMembershipsFile(), records)
}

function buildOrganizationMember(
  user: PersistedUserRecord,
  membership: OrganizationMembershipRecord,
  organization: OrganizationRecord
): OrganizationMember {
  return {
    membershipId: membership.id,
    userId: user.id,
    email: normalizeEmail(user.email),
    role: membership.role,
    createdAtISO: membership.createdAtISO,
    orgId: organization.id,
    orgName: organization.name,
  }
}

function resolveMembershipUser(
  user: PersistedUserRecord,
  organizations: OrganizationRecord[],
  memberships: OrganizationMembershipRecord[]
): User {
  const activeMemberships = memberships
    .filter((membership) => membership.userId === user.id && membership.status !== "inactive")
    .sort((left, right) => {
      const byRole = rolePriority(left.role) - rolePriority(right.role)
      if (byRole !== 0) return byRole
      return left.createdAtISO.localeCompare(right.createdAtISO)
    })

  const primaryMembership =
    activeMemberships[0] ??
    buildLegacyMembership(user, buildLegacyOrganization(user).id)

  const organization =
    organizations.find((entry) => entry.id === primaryMembership.orgId) ?? buildLegacyOrganization(user)

  return buildResolvedUser(user, primaryMembership, organization)
}

function buildResolvedUser(
  user: PersistedUserRecord,
  membership: OrganizationMembershipRecord,
  organization: OrganizationRecord
): User {
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    passwordHash: user.passwordHash,
    salt: user.salt,
    createdAtISO: user.createdAtISO,
    authProvider: user.authProvider === "supabase" ? "supabase" : "local",
    membershipId: membership.id,
    orgId: organization.id,
    orgName: organization.name,
    role: membership.role,
  }
}

function mergeUsersWithCloudProfiles(
  localUsers: PersistedUserRecord[],
  cloudProfiles: Array<{
    id: string
    email: string
    displayName?: string
    createdAtISO: string
  }>
) {
  const byId = new Map<string, PersistedUserRecord>()
  const byEmail = new Map<string, PersistedUserRecord>()

  for (const user of localUsers) {
    const normalized: PersistedUserRecord = {
      ...user,
      email: normalizeEmail(user.email),
      authProvider: user.authProvider === "supabase" ? "supabase" : "local",
    }
    byId.set(normalized.id, normalized)
    byEmail.set(normalized.email, normalized)
  }

  for (const profile of cloudProfiles) {
    const normalizedEmail = normalizeEmail(profile.email || displayNameToEmail(profile.displayName, profile.id))
    const existing =
      byId.get(profile.id) ||
      byEmail.get(normalizedEmail)

    const merged: PersistedUserRecord = {
      id: profile.id,
      email: normalizedEmail,
      passwordHash: existing?.passwordHash ?? "",
      salt: existing?.salt ?? "",
      createdAtISO: existing?.createdAtISO ?? profile.createdAtISO,
      authProvider: "supabase",
      orgId: existing?.orgId,
      orgName: existing?.orgName,
    }

    byId.set(profile.id, merged)
    byEmail.set(normalizedEmail, merged)
  }

  return [...byId.values()]
}

export async function loadUsers(): Promise<User[]> {
  const graph = await loadAuthGraph()
  return graph.users.map((user) => resolveMembershipUser(user, graph.organizations, graph.memberships))
}

export async function loadOrganizations(): Promise<OrganizationRecord[]> {
  return (await loadAuthGraph()).organizations
}

export async function loadMemberships(): Promise<OrganizationMembershipRecord[]> {
  return (await loadAuthGraph()).memberships
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const graph = await loadAuthGraph()
  const user = graph.users.find((entry) => normalizeEmail(entry.email) === normalizeEmail(email))
  if (!user) return null
  return resolveMembershipUser(user, graph.organizations, graph.memberships)
}

export async function findUserById(userId: string): Promise<User | null> {
  const graph = await loadAuthGraph()
  const user = graph.users.find((entry) => entry.id === userId)
  if (!user) return null
  return resolveMembershipUser(user, graph.organizations, graph.memberships)
}

export async function listOrganizationMembers(orgId: string) {
  const graph = await loadAuthGraph()
  const organization = graph.organizations.find((entry) => entry.id === orgId)
  if (!organization) return [] as OrganizationMember[]

  return graph.memberships
    .filter((membership) => membership.orgId === orgId && membership.status !== "inactive")
    .map((membership) => {
      const user = graph.users.find((entry) => entry.id === membership.userId)
      if (!user) return null
      return buildOrganizationMember(user, membership, organization)
    })
    .filter(Boolean) as OrganizationMember[]
}

export async function getOrganizationOwnership(orgId: string): Promise<OrganizationOwnershipSummary> {
  const graph = await loadAuthGraph()
  const organization = graph.organizations.find((entry) => entry.id === orgId)
  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND")
  }

  const ownerMembership = graph.memberships
    .filter(
      (membership) =>
        membership.orgId === orgId &&
        membership.status !== "inactive" &&
        membership.role === "owner"
    )
    .sort((left, right) => left.createdAtISO.localeCompare(right.createdAtISO))[0]

  if (!ownerMembership) {
    return {
      orgId: organization.id,
      orgName: organization.name,
      ownerState: "system",
      owner: {
        type: "system",
        label: "system",
      },
    }
  }

  const ownerUser = graph.users.find((entry) => entry.id === ownerMembership.userId)
  if (!ownerUser) {
    throw new Error("MEMBERSHIP_USER_NOT_FOUND")
  }

  return {
    orgId: organization.id,
    orgName: organization.name,
    ownerState: "claimed",
    owner: {
      type: "user",
      membershipId: ownerMembership.id,
      userId: ownerUser.id,
      email: normalizeEmail(ownerUser.email),
      createdAtISO: ownerMembership.createdAtISO,
    },
  }
}

export async function listUserMemberships(userId: string): Promise<UserMembershipSummary[]> {
  const graph = await loadAuthGraph()
  return graph.memberships
    .filter((membership) => membership.userId === userId)
    .map((membership) => {
      const organization = graph.organizations.find((entry) => entry.id === membership.orgId)
      if (!organization) return null
      return {
        membershipId: membership.id,
        orgId: organization.id,
        orgName: organization.name,
        role: membership.role,
        createdAtISO: membership.createdAtISO,
        status: membership.status === "inactive" ? "inactive" : "active",
      }
    })
    .filter(Boolean)
    .sort((left, right) => {
      const membershipLeft = left as UserMembershipSummary
      const membershipRight = right as UserMembershipSummary
      const byStatus =
        (membershipLeft.status === "active" ? 0 : 1) - (membershipRight.status === "active" ? 0 : 1)
      if (byStatus !== 0) return byStatus

      const byRole = rolePriority(membershipLeft.role) - rolePriority(membershipRight.role)
      if (byRole !== 0) return byRole

      return membershipLeft.orgName.localeCompare(membershipRight.orgName, "ro")
    }) as UserMembershipSummary[]
}

export async function updateOrganizationMemberRole(
  orgId: string,
  membershipId: string,
  nextRole: UserRole
): Promise<OrganizationMember> {
  const graph = await loadAuthGraph()
  const organization = graph.organizations.find((entry) => entry.id === orgId)
  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND")
  }

  const membershipIndex = graph.memberships.findIndex(
    (membership) => membership.id === membershipId && membership.orgId === orgId
  )
  if (membershipIndex === -1) {
    throw new Error("MEMBERSHIP_NOT_FOUND")
  }

  const currentMembership = graph.memberships[membershipIndex]
  if (
    currentMembership.role === "owner" &&
    nextRole !== "owner" &&
    countActiveOwners(graph.memberships, orgId) <= 1
  ) {
    throw new Error("LAST_OWNER_REQUIRED")
  }

  const resolvedMembership: OrganizationMembershipRecord = {
    ...currentMembership,
    role: nextRole,
  }
  const nextMemberships = [...graph.memberships]
  nextMemberships[membershipIndex] = resolvedMembership

  const syncResult = await syncOrganizationTenancyToSupabase({
    orgId,
    users: graph.users,
    organizations: graph.organizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }
  await saveMemberships(nextMemberships)

  const user = graph.users.find((entry) => entry.id === resolvedMembership.userId)
  if (!user) {
    throw new Error("MEMBERSHIP_USER_NOT_FOUND")
  }

  return {
    membershipId: resolvedMembership.id,
    userId: user.id,
    email: normalizeEmail(user.email),
    role: resolvedMembership.role,
    createdAtISO: resolvedMembership.createdAtISO,
    orgId: organization.id,
    orgName: organization.name,
  }
}

export async function addOrganizationMemberByEmail(
  orgId: string,
  email: string,
  role: UserRole
): Promise<OrganizationMember> {
  const graph = await loadAuthGraph()
  const organization = graph.organizations.find((entry) => entry.id === orgId)
  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND")
  }

  const emailNorm = normalizeEmail(email)
  const user = graph.users.find((entry) => normalizeEmail(entry.email) === emailNorm)
  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }

  if (
    shouldUseSupabaseTenancyAsPrimary() &&
    !(user.authProvider === "supabase" && isLikelyUuid(user.id))
  ) {
    throw new Error("USER_NOT_SYNCABLE")
  }

  const membershipIndex = graph.memberships.findIndex(
    (membership) => membership.userId === user.id && membership.orgId === orgId
  )

  let resolvedMembership: OrganizationMembershipRecord
  const nextMemberships = [...graph.memberships]

  if (membershipIndex !== -1) {
    const existingMembership = graph.memberships[membershipIndex]
    if (existingMembership.status !== "inactive") {
      throw new Error("MEMBER_ALREADY_EXISTS")
    }

    resolvedMembership = {
      ...existingMembership,
      role,
      status: "active",
    }
    nextMemberships[membershipIndex] = resolvedMembership
  } else {
    resolvedMembership = {
      id: `membership-${user.id}-${orgId}`,
      userId: user.id,
      orgId,
      role,
      createdAtISO: new Date().toISOString(),
      status: "active",
    }
    nextMemberships.push(resolvedMembership)
  }

  const syncResult = await syncOrganizationTenancyToSupabase({
    orgId,
    users: graph.users,
    organizations: graph.organizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }
  await saveMemberships(nextMemberships)

  return {
    membershipId: resolvedMembership.id,
    userId: user.id,
    email: normalizeEmail(user.email),
    role: resolvedMembership.role,
    createdAtISO: resolvedMembership.createdAtISO,
    orgId: organization.id,
    orgName: organization.name,
  }
}

export async function deactivateOrganizationMember(
  orgId: string,
  membershipId: string
): Promise<OrganizationMember> {
  const graph = await loadAuthGraph()
  const organization = graph.organizations.find((entry) => entry.id === orgId)
  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND")
  }

  const membershipIndex = graph.memberships.findIndex(
    (membership) => membership.id === membershipId && membership.orgId === orgId
  )
  if (membershipIndex === -1) {
    throw new Error("MEMBERSHIP_NOT_FOUND")
  }

  const currentMembership = graph.memberships[membershipIndex]
  if (currentMembership.status === "inactive") {
    throw new Error("MEMBERSHIP_ALREADY_INACTIVE")
  }
  if (currentMembership.role === "owner" && countActiveOwners(graph.memberships, orgId) <= 1) {
    throw new Error("LAST_OWNER_REQUIRED")
  }

  const resolvedMembership: OrganizationMembershipRecord = {
    ...currentMembership,
    status: "inactive",
  }
  const nextMemberships = [...graph.memberships]
  nextMemberships[membershipIndex] = resolvedMembership

  const syncResult = await syncOrganizationTenancyToSupabase({
    orgId,
    users: graph.users,
    organizations: graph.organizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }
  await saveMemberships(nextMemberships)

  const user = graph.users.find((entry) => entry.id === resolvedMembership.userId)
  if (!user) {
    throw new Error("MEMBERSHIP_USER_NOT_FOUND")
  }

  return buildOrganizationMember(user, resolvedMembership, organization)
}

export async function createOrganizationForExistingUser(
  userId: string,
  orgName: string,
  role: UserRole
): Promise<OrganizationMember> {
  const graph = await loadAuthGraph()
  const user = graph.users.find((entry) => entry.id === userId)
  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }
  if (
    shouldUseSupabaseTenancyAsPrimary() &&
    !(user.authProvider === "supabase" && isLikelyUuid(user.id))
  ) {
    throw new Error("USER_NOT_SYNCABLE")
  }

  const createdAtISO = new Date().toISOString()
  const organizationId = `org-${crypto.randomBytes(8).toString("hex")}`
  const organizationRecord: OrganizationRecord = {
    id: organizationId,
    name: orgName.trim() || normalizeEmail(user.email).split("@")[0] || "Organizatie noua",
    createdAtISO,
  }
  const membershipRecord: OrganizationMembershipRecord = {
    id: `membership-${user.id}-${organizationId}`,
    userId: user.id,
    orgId: organizationId,
    role,
    createdAtISO,
    status: "active",
  }

  const nextOrganizations = [...graph.organizations, organizationRecord]
  const nextMemberships = [...graph.memberships, membershipRecord]

  const syncResult = await syncUserTenancyToSupabase({
    userId: user.id,
    users: graph.users,
    organizations: nextOrganizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }
  await saveOrganizations(nextOrganizations)
  await saveMemberships(nextMemberships)

  return buildOrganizationMember(user, membershipRecord, organizationRecord)
}

export async function claimOrganizationOwnership(
  orgId: string,
  email: string,
  options?: {
    password?: string
    currentUserId?: string
  }
): Promise<User> {
  const graph = await loadAuthGraph()
  const organization = graph.organizations.find((entry) => entry.id === orgId)
  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND")
  }

  const emailNorm = normalizeEmail(email)
  const owners = graph.memberships.filter(
    (membership) =>
      membership.orgId === orgId &&
      membership.status !== "inactive" &&
      membership.role === "owner"
  )

  let user = graph.users.find((entry) => normalizeEmail(entry.email) === emailNorm)
  const nextUsers = [...graph.users]

  if (owners.length > 0) {
    const currentOwner = owners[0]
    if (!user || currentOwner.userId !== user.id) {
      throw new Error("OWNER_ALREADY_CLAIMED")
    }
  }

  if (options?.currentUserId) {
    if (!user || user.id !== options.currentUserId) {
      throw new Error("CLAIM_EMAIL_MISMATCH")
    }
  } else if (user) {
    throw new Error("CLAIM_LOGIN_REQUIRED")
  }

  if (!user) {
    const password = options?.password?.trim()
    if (!password || password.length < 8) {
      throw new Error("CLAIM_PASSWORD_REQUIRED")
    }

    const salt = crypto.randomBytes(16).toString("hex")
    user = {
      id: crypto.randomBytes(8).toString("hex"),
      email: emailNorm,
      passwordHash: hashPassword(password, salt),
      salt,
      createdAtISO: new Date().toISOString(),
      authProvider: "local",
    }
    nextUsers.push(user)
  }

  if (
    shouldUseSupabaseTenancyAsPrimary() &&
    !(user.authProvider === "supabase" && isLikelyUuid(user.id))
  ) {
    throw new Error("USER_NOT_SYNCABLE")
  }

  const membershipIndex = graph.memberships.findIndex(
    (membership) => membership.userId === user!.id && membership.orgId === orgId
  )

  const nextMemberships = [...graph.memberships]
  let resolvedMembership: OrganizationMembershipRecord

  if (membershipIndex !== -1) {
    const existingMembership = graph.memberships[membershipIndex]
    resolvedMembership = {
      ...existingMembership,
      role: "owner",
      status: "active",
    }
    nextMemberships[membershipIndex] = resolvedMembership
  } else {
    resolvedMembership = {
      id: `membership-${user.id}-${orgId}`,
      userId: user.id,
      orgId,
      role: "owner",
      createdAtISO: new Date().toISOString(),
      status: "active",
    }
    nextMemberships.push(resolvedMembership)
  }

  const syncResult = await syncUserTenancyToSupabase({
    userId: user.id,
    users: nextUsers,
    organizations: graph.organizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }

  if (nextUsers !== graph.users) {
    await saveUsers(nextUsers)
  }
  await saveMemberships(nextMemberships)

  return buildResolvedUser(user, resolvedMembership, organization)
}

export async function resolveUserForMembership(
  userId: string,
  membershipId: string
): Promise<User> {
  const graph = await loadAuthGraph()
  const user = graph.users.find((entry) => entry.id === userId)
  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }

  const membership = graph.memberships.find(
    (entry) => entry.id === membershipId && entry.userId === userId && entry.status !== "inactive"
  )
  if (!membership) {
    throw new Error("MEMBERSHIP_NOT_FOUND")
  }

  const organization = graph.organizations.find((entry) => entry.id === membership.orgId)
  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND")
  }

  return buildResolvedUser(user, membership, organization)
}

export async function linkUserToExternalIdentity(
  email: string,
  externalUserId: string,
  provider: AuthProvider
): Promise<User> {
  const graph = await loadAuthGraph()
  const normalizedEmail = normalizeEmail(email)
  const userIndex = graph.users.findIndex((entry) => normalizeEmail(entry.email) === normalizedEmail)
  if (userIndex === -1) {
    throw new Error("USER_NOT_FOUND")
  }

  const existingExternal = graph.users.find((entry) => entry.id === externalUserId)
  if (existingExternal && normalizeEmail(existingExternal.email) !== normalizedEmail) {
    throw new Error("AUTH_IDENTITY_ALREADY_LINKED")
  }

  const currentUser = graph.users[userIndex]
  const previousUserId = currentUser.id
  const nextUser: PersistedUserRecord = {
    ...currentUser,
    id: externalUserId,
    authProvider: provider,
  }

  const nextUsers = [...graph.users]
  nextUsers[userIndex] = nextUser

  const nextMemberships = graph.memberships.map((membership) =>
    membership.userId === previousUserId
      ? {
          ...membership,
          userId: externalUserId,
        }
      : membership
  )

  const syncResult = await syncUserTenancyToSupabase({
    userId: externalUserId,
    users: nextUsers,
    organizations: graph.organizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }
  await saveUsers(nextUsers)
  await saveMemberships(nextMemberships)

  return resolveMembershipUser(nextUser, graph.organizations, nextMemberships)
}

function countActiveOwners(
  memberships: OrganizationMembershipRecord[],
  orgId: string
) {
  return memberships.filter(
    (membership) =>
      membership.orgId === orgId &&
      membership.status !== "inactive" &&
      membership.role === "owner"
  ).length
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString("hex")
}

export async function registerUser(
  email: string,
  password: string,
  orgName: string,
  options?: {
    externalUserId?: string
    authProvider?: AuthProvider
  }
): Promise<User> {
  const graph = await loadAuthGraph()
  const emailNorm = normalizeEmail(email)

  if (graph.users.some((entry) => normalizeEmail(entry.email) === emailNorm)) {
    throw new Error("Adresa de email este deja inregistrata.")
  }

  const useExternalIdentity = Boolean(options?.externalUserId)
  const salt = useExternalIdentity ? "" : crypto.randomBytes(16).toString("hex")
  const userId = options?.externalUserId?.trim() || crypto.randomBytes(8).toString("hex")
  const organizationId = `org-${userId}`
  const createdAtISO = new Date().toISOString()

  const userRecord: PersistedUserRecord = {
    id: userId,
    email: emailNorm,
    passwordHash: useExternalIdentity ? "" : hashPassword(password, salt),
    salt,
    createdAtISO,
    authProvider: options?.authProvider === "supabase" ? "supabase" : "local",
  }

  const organizationRecord: OrganizationRecord = {
    id: organizationId,
    name: orgName.trim() || emailNorm.split("@")[0] || "Organizatie noua",
    createdAtISO,
  }

  const membershipRecord: OrganizationMembershipRecord = {
    id: `membership-${userId}-${organizationId}`,
    userId,
    orgId: organizationId,
    role: "owner",
    createdAtISO,
    status: "active",
  }

  const nextUsers = [...graph.users, userRecord]
  const nextOrganizations = [...graph.organizations, organizationRecord]
  const nextMemberships = [...graph.memberships, membershipRecord]

  const syncResult = await syncUserTenancyToSupabase({
    userId: userRecord.id,
    users: nextUsers,
    organizations: nextOrganizations,
    memberships: nextMemberships,
  })
  if (shouldUseSupabaseTenancyAsPrimary() && !syncResult.synced) {
    throw new Error(syncResult.reason)
  }
  await saveUsers(nextUsers)
  await saveOrganizations(nextOrganizations)
  await saveMemberships(nextMemberships)

  return {
    id: userRecord.id,
    email: userRecord.email,
    passwordHash: userRecord.passwordHash,
    salt: userRecord.salt,
    createdAtISO: userRecord.createdAtISO,
    authProvider: userRecord.authProvider === "supabase" ? "supabase" : "local",
    membershipId: membershipRecord.id,
    orgId: organizationRecord.id,
    orgName: organizationRecord.name,
    role: membershipRecord.role,
  }
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS }
  const encoded = Buffer.from(JSON.stringify(full)).toString("base64url")
  const signature = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url")
  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const dotIndex = token.lastIndexOf(".")
    if (dotIndex === -1) return null

    const encoded = token.slice(0, dotIndex)
    const signature = token.slice(dotIndex + 1)
    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(encoded)
      .digest("base64url")

    if (signature !== expectedSignature) return null

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Partial<SessionPayload>
    if (!payload || typeof payload !== "object") return null
    if (!payload.exp || payload.exp < Date.now()) return null
    if (!payload.userId || !payload.orgId || !payload.email || !payload.orgName) return null

    return {
      userId: payload.userId,
      orgId: payload.orgId,
      email: payload.email,
      orgName: payload.orgName,
      role: isUserRole(payload.role) ? payload.role : "owner",
      membershipId: payload.membershipId,
      workspaceMode: isWorkspaceMode(payload.workspaceMode) ? payload.workspaceMode : "org",
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

function parseCookieHeader(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return new Map<string, string>()

  return new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=")
        if (separatorIndex === -1) return [part, ""]
        return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))]
      })
  )
}

export function readSessionFromRequest(request: Request): SessionPayload | null {
  const cookieStore = parseCookieHeader(request)
  const token = cookieStore.get(SESSION_COOKIE)
  if (!token) return null
  return verifySessionToken(token)
}

function isDemoSession(session: SessionPayload): boolean {
  return session.userId.startsWith("demo-user-") || session.orgId.startsWith("org-demo-")
}

export async function refreshSessionPayload(
  session: SessionPayload
): Promise<SessionPayload | null> {
  const demoSession = isDemoSession(session)

  try {
    const resolvedUser = session.membershipId
      ? await resolveUserForMembership(session.userId, session.membershipId)
      : await findUserById(session.userId)

    if (!resolvedUser) {
      return demoSession ? session : null
    }

    return {
      userId: resolvedUser.id,
      orgId: resolvedUser.orgId,
      email: resolvedUser.email,
      orgName: resolvedUser.orgName,
      role: resolvedUser.role,
      membershipId: resolvedUser.membershipId,
      workspaceMode: session.workspaceMode ?? "org",
      exp: session.exp,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "MEMBERSHIP_NOT_FOUND" ||
        error.message === "USER_NOT_FOUND" ||
        error.message === "ORGANIZATION_NOT_FOUND"
      ) {
        return demoSession ? session : null
      }
    }

    throw error
  }
}

export async function readFreshSessionFromRequest(
  request: Request
): Promise<SessionPayload | null> {
  const session = readSessionFromRequest(request)
  if (!session) return null
  return refreshSessionPayload(session)
}

export function requireAuthenticatedSession(request: Request, action?: string): SessionPayload {
  const session = readSessionFromRequest(request)
  if (!session) {
    throw new AuthzError(
      action
        ? `Ai nevoie de sesiune activa pentru ${action}.`
        : "Ai nevoie de sesiune activa pentru aceasta actiune.",
      401,
      "AUTH_SESSION_REQUIRED"
    )
  }
  return session
}

export async function requireFreshAuthenticatedSession(
  request: Request,
  action?: string
): Promise<SessionPayload> {
  const session = await readFreshSessionFromRequest(request)
  if (!session) {
    throw new AuthzError(
      action
        ? `Ai nevoie de sesiune activa pentru ${action}.`
        : "Ai nevoie de sesiune activa pentru aceasta actiune.",
      401,
      "AUTH_SESSION_REQUIRED"
    )
  }
  return session
}

export function requireRole(
  request: Request,
  allowedRoles: UserRole[],
  action?: string
): SessionPayload {
  const session = requireAuthenticatedSession(request, action)
  if (!allowedRoles.includes(session.role)) {
    throw new AuthzError(
      action
        ? `Rolul ${session.role} nu poate efectua ${action}.`
        : "Rolul curent nu are acces la aceasta actiune.",
      403,
      "AUTH_ROLE_FORBIDDEN"
    )
  }
  return session
}

export async function requireFreshRole(
  request: Request,
  allowedRoles: UserRole[],
  action?: string
): Promise<SessionPayload> {
  const session = await requireFreshAuthenticatedSession(request, action)
  if (!allowedRoles.includes(session.role)) {
    throw new AuthzError(
      action
        ? `Rolul ${session.role} nu poate efectua ${action}.`
        : "Rolul curent nu are acces la aceasta actiune.",
      403,
      "AUTH_ROLE_FORBIDDEN"
    )
  }
  return session
}

export async function getUserMode(userId: string): Promise<UserMode | null> {
  const users = await readJsonFile<PersistedUserRecord[]>(getUsersFile(), [])
  const user = users.find((entry) => entry.id === userId)
  if (!user) return null
  return isUserMode(user.userMode) ? user.userMode : null
}

export async function setUserMode(userId: string, mode: UserMode): Promise<void> {
  const users = await readJsonFile<PersistedUserRecord[]>(getUsersFile(), [])
  const userIndex = users.findIndex((entry) => entry.id === userId)
  if (userIndex === -1) throw new Error("USER_NOT_FOUND")

  users[userIndex] = { ...users[userIndex], userMode: mode }
  await writeJsonFile(getUsersFile(), users)
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  }
}
