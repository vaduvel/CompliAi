import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { generateCookieBannerSnippet } from "@/lib/server/cookie-banner-generator"
import type { BannerTrackerInput } from "@/lib/server/cookie-banner-generator"

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "cookie banner generate"
    )

    const state =
      (await readStateForOrg(session.orgId)) ??
      normalizeComplianceState(initialComplianceState)

    const orgName =
      state.orgProfilePrefill?.companyName ??
      session.orgName ??
      "Organizația dvs."

    const orgWebsite =
      state.orgProfile?.website ??
      state.orgProfilePrefill?.normalizedWebsite ??
      null

    // Find the most recent completed scan that has trackers
    const scanJobs = state.siteScanJobs ? Object.values(state.siteScanJobs) : []
    const lastScan = scanJobs
      .filter((j) => j.status === "done" && j.result?.reachable && (j.result.trackers?.length ?? 0) > 0)
      .sort((a, b) => (b.completedAtISO ?? "").localeCompare(a.completedAtISO ?? ""))[0]

    const trackers: BannerTrackerInput[] = (lastScan?.result?.trackers ?? []).map((t) => ({
      name: t.name,
      category: t.category,
      requiresConsent: t.requiresConsent,
    }))

    const privacyPolicyUrl = orgWebsite
      ? `${orgWebsite.replace(/\/$/, "")}/politica-de-confidentialitate`
      : null

    const result = generateCookieBannerSnippet({
      orgName,
      orgWebsite,
      privacyPolicyUrl,
      trackers,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut genera banner-ul.", 500, "COOKIE_BANNER_FAILED")
  }
}
