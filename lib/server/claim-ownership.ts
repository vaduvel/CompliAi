import { promises as fs } from "node:fs"
import crypto from "node:crypto"
import path from "node:path"

import { writeFileSafe } from "@/lib/server/fs-safe"

const CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type ClaimInviteRecord = {
  id: string
  orgId: string
  orgName: string
  invitedEmail: string
  invitedByUserId: string
  createdAtISO: string
  expiresAtISO: string
  token: string
  status: "pending" | "accepted" | "revoked" | "expired"
  acceptedAtISO?: string
  acceptedByUserId?: string
}

export type ClaimInviteSummary = {
  id: string
  orgId: string
  orgName: string
  invitedEmail: string
  createdAtISO: string
  expiresAtISO: string
  token: string
  claimUrl: string
  status: ClaimInviteRecord["status"]
}

function getClaimInvitesFile() {
  const explicit = process.env.COMPLISCAN_CLAIM_INVITES_FILE?.trim()
  if (explicit) return explicit
  return path.join(process.cwd(), ".data", "claim-invites.json")
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"
}

async function loadInvites(): Promise<ClaimInviteRecord[]> {
  try {
    const raw = await fs.readFile(getClaimInvitesFile(), "utf8")
    return JSON.parse(raw) as ClaimInviteRecord[]
  } catch {
    return []
  }
}

async function saveInvites(invites: ClaimInviteRecord[]) {
  await writeFileSafe(getClaimInvitesFile(), JSON.stringify(invites, null, 2))
}

function pruneInvites(invites: ClaimInviteRecord[]) {
  const now = Date.now()
  return invites.map((invite) => {
    if (invite.status === "pending" && new Date(invite.expiresAtISO).getTime() < now) {
      return {
        ...invite,
        status: "expired" as const,
      }
    }
    return invite
  })
}

function toSummary(invite: ClaimInviteRecord): ClaimInviteSummary {
  const claimUrl = `${getAppUrl().replace(/\/$/, "")}/claim?token=${invite.token}`
  return {
    id: invite.id,
    orgId: invite.orgId,
    orgName: invite.orgName,
    invitedEmail: invite.invitedEmail,
    createdAtISO: invite.createdAtISO,
    expiresAtISO: invite.expiresAtISO,
    token: invite.token,
    claimUrl,
    status: invite.status,
  }
}

export async function createClaimInvite(input: {
  orgId: string
  orgName: string
  invitedEmail: string
  invitedByUserId: string
}) {
  const normalizedEmail = input.invitedEmail.trim().toLowerCase()
  const now = new Date()
  const invites = pruneInvites(await loadInvites()).map((invite) =>
    invite.orgId === input.orgId && invite.status === "pending"
      ? { ...invite, status: "revoked" as const }
      : invite
  )

  const invite: ClaimInviteRecord = {
    id: `claim-${crypto.randomBytes(8).toString("hex")}`,
    orgId: input.orgId,
    orgName: input.orgName,
    invitedEmail: normalizedEmail,
    invitedByUserId: input.invitedByUserId,
    createdAtISO: now.toISOString(),
    expiresAtISO: new Date(now.getTime() + CLAIM_TTL_MS).toISOString(),
    token: crypto.randomBytes(32).toString("hex"),
    status: "pending",
  }

  invites.push(invite)
  await saveInvites(invites)
  return toSummary(invite)
}

export async function getActiveClaimInviteForOrg(orgId: string) {
  const invites = pruneInvites(await loadInvites())
  await saveInvites(invites)

  const invite = invites
    .filter((entry) => entry.orgId === orgId && entry.status === "pending")
    .sort((left, right) => right.createdAtISO.localeCompare(left.createdAtISO))[0]

  return invite ? toSummary(invite) : null
}

export async function getClaimInviteByToken(token: string) {
  const invites = pruneInvites(await loadInvites())
  await saveInvites(invites)

  const invite = invites.find((entry) => entry.token === token)
  if (!invite) return null
  return toSummary(invite)
}

export async function acceptClaimInvite(token: string, acceptedByUserId: string) {
  const invites = pruneInvites(await loadInvites())
  const inviteIndex = invites.findIndex((entry) => entry.token === token)
  if (inviteIndex === -1) return null

  const invite = invites[inviteIndex]
  if (invite.status !== "pending") {
    await saveInvites(invites)
    return toSummary(invite)
  }

  invites[inviteIndex] = {
    ...invite,
    status: "accepted",
    acceptedAtISO: new Date().toISOString(),
    acceptedByUserId,
  }
  await saveInvites(invites)
  return toSummary(invites[inviteIndex])
}
