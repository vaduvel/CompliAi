// Multi-seat cabinet — team management endpoints.
//
// GET    /api/cabinet/team    — list active members
// POST   /api/cabinet/team    — add member by email (must already exist)
// PATCH  /api/cabinet/team    — update member role
// DELETE /api/cabinet/team    — deactivate member (soft delete)
//
// Auth: doar role „owner" poate gestiona team-ul. „partner_manager" poate
// view-only.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import {
  addOrganizationMemberByEmail,
  AuthzError,
  deactivateOrganizationMember,
  listOrganizationMembers,
  requireFreshRole,
  updateOrganizationMemberRole,
  type UserRole,
} from "@/lib/server/auth"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"

const READ_ROLES = ["owner", "partner_manager", "compliance"] as const
const WRITE_ROLES = ["owner"] as const

const VALID_ROLES: UserRole[] = ["owner", "partner_manager", "compliance", "reviewer", "viewer"]

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value)
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  return `${local.slice(0, 2)}***@${domain}`
}

// ── GET — list members ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, [...READ_ROLES], "vizualizare team cabinet")
    const members = await listOrganizationMembers(session.orgId)

    return NextResponse.json({
      orgId: session.orgId,
      orgName: session.orgName,
      members: members.map((m) => ({
        membershipId: m.membershipId,
        userId: m.userId,
        email: m.email,
        role: m.role,
        createdAtISO: m.createdAtISO,
        isCurrentUser: m.userId === session.userId,
      })),
    })
  } catch (err) {
    if (err instanceof AuthzError) return jsonError(err.message, err.status, err.code)
    return jsonError("Eroare la încărcarea team-ului.", 500, "TEAM_LOAD_FAILED")
  }
}

// ── POST — add member by email ───────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "adăugare membru")
    let body: { email?: string; role?: UserRole }
    try {
      body = (await request.json()) as { email?: string; role?: UserRole }
    } catch {
      return jsonError("Body invalid (JSON).", 400, "TEAM_INVALID_BODY")
    }

    const email = body.email?.trim()
    const role: UserRole = isValidRole(body.role) ? body.role : "viewer"

    if (!email || !email.includes("@")) {
      return jsonError("Email invalid.", 400, "TEAM_INVALID_EMAIL")
    }

    let member
    try {
      member = await addOrganizationMemberByEmail(session.orgId, email, role)
    } catch (err) {
      const code = err instanceof Error ? err.message : "ADD_FAILED"
      if (code === "USER_NOT_FOUND") {
        return jsonError(
          "Utilizatorul nu există. Roagă-l să-și creeze cont gratuit pe /register, apoi adaugă-l aici.",
          404,
          "TEAM_USER_NOT_FOUND",
        )
      }
      if (code === "MEMBER_ALREADY_EXISTS") {
        return jsonError(
          "Acest membru este deja activ în cabinet.",
          409,
          "TEAM_MEMBER_EXISTS",
        )
      }
      if (code === "USER_NOT_SYNCABLE") {
        return jsonError(
          "Membri pot fi adăugați doar dacă au cont Supabase configurat.",
          400,
          "TEAM_NOT_SYNCABLE",
        )
      }
      return jsonError(`Adăugare membru eșuată: ${code}`, 500, "TEAM_ADD_FAILED")
    }

    const actor = await resolveOptionalEventActor(request)
    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "cabinet.team.member_added",
            entityType: "system",
            entityId: member.membershipId,
            message: `Membru adăugat în cabinet: ${maskEmail(member.email)} (rol ${member.role}).`,
            createdAtISO: new Date().toISOString(),
            metadata: {
              membershipId: member.membershipId,
              role: member.role,
              emailMasked: maskEmail(member.email),
            },
          },
          actor,
        ),
      ]),
    }))

    return NextResponse.json({ ok: true, member })
  } catch (err) {
    if (err instanceof AuthzError) return jsonError(err.message, err.status, err.code)
    return jsonError("Eroare la adăugare.", 500, "TEAM_ADD_FAILED")
  }
}

// ── PATCH — change role ──────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "actualizare rol membru")
    let body: { membershipId?: string; role?: UserRole }
    try {
      body = (await request.json()) as { membershipId?: string; role?: UserRole }
    } catch {
      return jsonError("Body invalid (JSON).", 400, "TEAM_INVALID_BODY")
    }

    if (!body.membershipId) {
      return jsonError("membershipId obligatoriu.", 400, "TEAM_MISSING_ID")
    }
    if (!isValidRole(body.role)) {
      return jsonError("Rol invalid.", 400, "TEAM_INVALID_ROLE")
    }

    let member
    try {
      member = await updateOrganizationMemberRole(session.orgId, body.membershipId, body.role)
    } catch (err) {
      const code = err instanceof Error ? err.message : "UPDATE_FAILED"
      if (code === "MEMBERSHIP_NOT_FOUND") {
        return jsonError("Membrul nu există.", 404, "TEAM_MEMBER_NOT_FOUND")
      }
      if (code === "LAST_OWNER_REQUIRED") {
        return jsonError(
          "Trebuie să rămână cel puțin un owner în cabinet.",
          409,
          "TEAM_LAST_OWNER",
        )
      }
      return jsonError(`Update rol eșuat: ${code}`, 500, "TEAM_UPDATE_FAILED")
    }

    const actor = await resolveOptionalEventActor(request)
    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "cabinet.team.role_changed",
            entityType: "system",
            entityId: member.membershipId,
            message: `Rol actualizat pentru ${maskEmail(member.email)}: ${member.role}.`,
            createdAtISO: new Date().toISOString(),
            metadata: {
              membershipId: member.membershipId,
              newRole: member.role,
              emailMasked: maskEmail(member.email),
            },
          },
          actor,
        ),
      ]),
    }))

    return NextResponse.json({ ok: true, member })
  } catch (err) {
    if (err instanceof AuthzError) return jsonError(err.message, err.status, err.code)
    return jsonError("Eroare la actualizare rol.", 500, "TEAM_PATCH_FAILED")
  }
}

// ── DELETE — deactivate member ───────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const session = await requireFreshRole(request, [...WRITE_ROLES], "dezactivare membru")
    const url = new URL(request.url)
    const membershipId = url.searchParams.get("membershipId")?.trim()
    if (!membershipId) {
      return jsonError("membershipId obligatoriu.", 400, "TEAM_MISSING_ID")
    }

    let member
    try {
      member = await deactivateOrganizationMember(session.orgId, membershipId)
    } catch (err) {
      const code = err instanceof Error ? err.message : "DEACTIVATE_FAILED"
      if (code === "MEMBERSHIP_NOT_FOUND") {
        return jsonError("Membrul nu există.", 404, "TEAM_MEMBER_NOT_FOUND")
      }
      if (code === "MEMBERSHIP_ALREADY_INACTIVE") {
        return jsonError("Membrul este deja inactiv.", 409, "TEAM_ALREADY_INACTIVE")
      }
      if (code === "LAST_OWNER_REQUIRED") {
        return jsonError(
          "Nu poți dezactiva ultimul owner. Promovează alt membru la owner mai întâi.",
          409,
          "TEAM_LAST_OWNER",
        )
      }
      return jsonError(`Dezactivare eșuată: ${code}`, 500, "TEAM_DELETE_FAILED")
    }

    const actor = await resolveOptionalEventActor(request)
    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "cabinet.team.member_deactivated",
            entityType: "system",
            entityId: member.membershipId,
            message: `Membru dezactivat: ${maskEmail(member.email)}.`,
            createdAtISO: new Date().toISOString(),
            metadata: {
              membershipId: member.membershipId,
              emailMasked: maskEmail(member.email),
            },
          },
          actor,
        ),
      ]),
    }))

    return NextResponse.json({ ok: true, member })
  } catch (err) {
    if (err instanceof AuthzError) return jsonError(err.message, err.status, err.code)
    return jsonError("Eroare la dezactivare.", 500, "TEAM_DELETE_FAILED")
  }
}
