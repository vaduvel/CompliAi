/**
 * GOLD 1 — Import execute: create orgs from confirmed import rows.
 * Accepts JSON with confirmed rows (post-preview, post-user-edit).
 * Creates orgs, runs applicability, sends claim invites.
 */
import { NextResponse } from "next/server"

import { evaluateApplicability } from "@/lib/compliance/applicability"
import type { OrgEmployeeCount, OrgProfile, OrgSector } from "@/lib/compliance/applicability"
import { jsonError } from "@/lib/server/api-response"
import {
  AuthzError,
  createOrganizationForExistingUser,
  listUserMemberships,
  requireFreshRole,
  resolveUserMode,
} from "@/lib/server/auth"
import { createClaimInvite } from "@/lib/server/claim-ownership"
import { getPartnerAccountPlanStatus, hasLegacyPartnerOrgPlan } from "@/lib/server/plan"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"

type ConfirmedRow = {
  orgName: string
  cui: string | null
  sector: OrgSector | null
  employeeCount: OrgEmployeeCount | null
  email: string | null
  skip?: boolean
}

type ImportRowResult =
  | { ok: true; orgId: string; orgName: string; tags: string[] }
  | { ok: false; orgName: string; error: string }

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "import execute")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Import disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = (await request.json()) as { rows: ConfirmedRow[] }
    if (!body.rows?.length) {
      return jsonError("Niciun rând de importat.", 400, "NO_ROWS")
    }

    const activeRows = body.rows.filter((r) => !r.skip)
    if (activeRows.length === 0) {
      return jsonError("Toate rândurile au fost excluse.", 400, "ALL_SKIPPED")
    }
    if (activeRows.length > 50) {
      return jsonError("Maximum 50 de firme per import.", 400, "TOO_MANY_ROWS")
    }

    // Plan capacity check
    const activeMemberships = (await listUserMemberships(session.userId)).filter(
      (m) => m.status === "active"
    )
    const activeOrgIds = Array.from(new Set(activeMemberships.map((m) => m.orgId)))
    const planStatus = await getPartnerAccountPlanStatus({
      userId: session.userId,
      currentOrgs: activeOrgIds.length,
      legacyPartnerEnabled: await hasLegacyPartnerOrgPlan(activeOrgIds),
    })

    if (!planStatus.planType || planStatus.maxOrgs === null) {
      return jsonError(
        "Import multiplu clienți necesită planul Partner. Upgradează-ți contul pentru a importa firme.",
        403,
        "PARTNER_PLAN_REQUIRED",
        { upgradeUrl: "/pricing", hint: "Planul Partner permite import nelimitat de clienți." }
      )
    }

    const remaining = Math.max(planStatus.maxOrgs - planStatus.currentOrgs, 0)
    if (activeRows.length > remaining) {
      throw new AuthzError(
        `Poți importa maxim ${remaining} firme. Ai selectat ${activeRows.length}.`,
        403,
        "PARTNER_PLAN_LIMIT_REACHED"
      )
    }

    const results: ImportRowResult[] = []

    for (const row of activeRows) {
      if (!row.orgName?.trim()) {
        results.push({ ok: false, orgName: row.orgName || "?", error: "Nume firmă lipsă" })
        continue
      }

      try {
        const newOrg = await createOrganizationForExistingUser(
          session.userId,
          row.orgName.trim(),
          "partner_manager"
        )

        // Create claim invite if email present
        if (row.email?.includes("@")) {
          await createClaimInvite({
            orgId: newOrg.orgId,
            orgName: newOrg.orgName,
            invitedEmail: row.email.trim().toLowerCase(),
            invitedByUserId: session.userId,
          })
        }

        // Build org profile and run applicability
        const profile: OrgProfile = {
          sector: row.sector ?? "other",
          employeeCount: row.employeeCount ?? "10-49",
          usesAITools: false,
          requiresEfactura: false,
          completedAtISO: new Date().toISOString(),
          ...(row.cui ? { cui: row.cui } : {}),
        }

        const applicability = evaluateApplicability(profile)

        // Persist org profile into state
        const existingState = await readStateForOrg(newOrg.orgId)
        if (existingState) {
          existingState.orgProfile = profile
          existingState.applicability = applicability
          await writeStateForOrg(newOrg.orgId, existingState)
        }

        results.push({
          ok: true,
          orgId: newOrg.orgId,
          orgName: newOrg.orgName,
          tags: applicability.tags,
        })
      } catch (err) {
        results.push({
          ok: false,
          orgName: row.orgName,
          error: err instanceof Error ? err.message : "Eroare necunoscută",
        })
      }
    }

    const imported = results.filter((r) => r.ok).length
    const failed = results.filter((r) => !r.ok)

    return NextResponse.json({
      imported,
      failed: failed.length,
      total: activeRows.length,
      results,
      message:
        failed.length === 0
          ? `${imported} firme importate cu succes.`
          : `${imported} din ${activeRows.length} importate. ${failed.length} erori.`,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la import.", 500, "IMPORT_FAILED")
  }
}
