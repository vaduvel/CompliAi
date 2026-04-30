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
import { getWhiteLabelConfig, saveWhiteLabelConfig } from "@/lib/server/white-label"

type ConfirmedRow = {
  orgName: string
  cui: string | null
  sector: OrgSector | null
  employeeCount: OrgEmployeeCount | null
  email: string | null
  website: string | null
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

    // Plan capacity check — only count client orgs (partner_manager), not the
    // partner's own org (owner), which shouldn't consume the client portfolio limit.
    const activeMemberships = (await listUserMemberships(session.userId)).filter(
      (m) => m.status === "active" && m.role === "partner_manager"
    )
    const existingStates = await Promise.all(
      activeMemberships.map((membership) => readStateForOrg(membership.orgId).catch(() => null))
    )
    const existingOrgNames = new Set(activeMemberships.map((m) => normalizeDuplicateKey(m.orgName)))
    const existingCUIs = new Set(
      existingStates
        .map((state) => normalizeCui(state?.orgProfile?.cui))
        .filter((cui): cui is string => Boolean(cui))
    )
    const seenOrgNames = new Set<string>()
    const seenCUIs = new Set<string>()
    const preflightFailures: ImportRowResult[] = []
    const rowsToImport: ConfirmedRow[] = []

    for (const row of activeRows) {
      const orgNameKey = normalizeDuplicateKey(row.orgName)
      const cuiKey = normalizeCui(row.cui)

      if (!orgNameKey) {
        preflightFailures.push({ ok: false, orgName: row.orgName || "?", error: "Nume firmă lipsă" })
        continue
      }

      if (existingOrgNames.has(orgNameKey)) {
        preflightFailures.push({
          ok: false,
          orgName: row.orgName,
          error: "Firmă cu același nume există deja în portofoliu.",
        })
        continue
      }

      if (cuiKey && existingCUIs.has(cuiKey)) {
        preflightFailures.push({
          ok: false,
          orgName: row.orgName,
          error: "CUI deja existent în portofoliu.",
        })
        continue
      }

      if (seenOrgNames.has(orgNameKey)) {
        preflightFailures.push({
          ok: false,
          orgName: row.orgName,
          error: "Rând duplicat în fișier: nume firmă identic.",
        })
        continue
      }

      if (cuiKey && seenCUIs.has(cuiKey)) {
        preflightFailures.push({
          ok: false,
          orgName: row.orgName,
          error: "Rând duplicat în fișier: CUI identic.",
        })
        continue
      }

      seenOrgNames.add(orgNameKey)
      if (cuiKey) seenCUIs.add(cuiKey)
      rowsToImport.push(row)
    }

    if (rowsToImport.length === 0) {
      return NextResponse.json({
        imported: 0,
        failed: preflightFailures.length,
        total: activeRows.length,
        results: preflightFailures,
        message: "Nicio firmă importată. Toate rândurile sunt duplicate sau invalide.",
      })
    }

    const activeOrgIds = Array.from(new Set(activeMemberships.map((m) => m.orgId)))
    const planStatus = await getPartnerAccountPlanStatus({
      userId: session.userId,
      currentOrgs: activeOrgIds.length,
      legacyPartnerEnabled: await hasLegacyPartnerOrgPlan(activeOrgIds),
    })

    const remaining = Math.max((planStatus.maxOrgs ?? 0) - planStatus.currentOrgs, 0)

    if (planStatus.source === "trial") {
      if (remaining <= 0) {
        throw new AuthzError(
          `Ai atins limita trial (${planStatus.maxOrgs} firme). Activează un plan Partner din Setări cont pentru a adăuga mai multe.`,
          403,
          "PARTNER_TRIAL_LIMIT_REACHED"
        )
      }

      if (rowsToImport.length > remaining) {
        throw new AuthzError(
          `În modul trial poți adăuga cel mult ${remaining} firm${remaining === 1 ? "ă" : "e"} acum. Activează un plan Partner pentru mai multe.`,
          403,
          "PARTNER_TRIAL_LIMIT_REACHED"
        )
      }
    } else if (rowsToImport.length > remaining) {
      throw new AuthzError(
        `Poți importa maxim ${remaining} firme. Ai selectat ${rowsToImport.length}.`,
        403,
        "PARTNER_PLAN_LIMIT_REACHED"
      )
    }

    const results: ImportRowResult[] = [...preflightFailures]
    const partnerWhiteLabel = await getWhiteLabelConfig(session.orgId).catch(() => null)

    for (const row of rowsToImport) {
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

        if (partnerWhiteLabel?.partnerName?.trim()) {
          await saveWhiteLabelConfig(newOrg.orgId, {
            partnerName: partnerWhiteLabel.partnerName,
            tagline: partnerWhiteLabel.tagline,
            logoUrl: partnerWhiteLabel.logoUrl,
            brandColor: partnerWhiteLabel.brandColor,
            aiEnabled: partnerWhiteLabel.aiEnabled,
            signatureUrl: partnerWhiteLabel.signatureUrl,
            signerName: partnerWhiteLabel.signerName,
            icpSegment: partnerWhiteLabel.icpSegment,
            aiProvider: partnerWhiteLabel.aiProvider,
          })
        }

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
          ...(row.website ? { website: row.website } : {}),
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

function normalizeDuplicateKey(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeCui(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/\s+/g, "").toUpperCase()
}
