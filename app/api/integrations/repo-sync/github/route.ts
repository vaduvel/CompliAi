import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { executeRepoSync } from "@/lib/server/repo-sync-executor"
import {
  canUseRepoSync,
  normalizeProviderRepoSyncPayload,
  normalizeRepoSyncFiles,
  type ProviderRepoSyncPayload,
  validateProviderRepoSyncPayload,
} from "@/lib/server/repo-sync"

export async function POST(request: Request) {
  try {
    if (!canUseRepoSync(request)) {
      return jsonError(
        "Repo sync GitHub este blocat pentru acest mediu. Configureaza COMPLISCAN_SYNC_KEY si trimite cheia in header-ul x-compliscan-sync-key.",
        403,
        "REPO_SYNC_GITHUB_FORBIDDEN"
      )
    }

    const body = validateProviderRepoSyncPayload(
      "github",
      (await request.json().catch(() => ({}))) as ProviderRepoSyncPayload
    )
    const normalized = normalizeProviderRepoSyncPayload("github", body)
    const files = normalizeRepoSyncFiles(normalized)

    if (files.length === 0) {
      return jsonError(
        "Nu am primit fisiere relevante pentru GitHub repo sync. Trimite compliscan.yaml sau manifests suportate.",
        400,
        "REPO_SYNC_GITHUB_NO_RELEVANT_FILES"
      )
    }

    const workspace = await getOrgContext()
    const { nextState, fileCount } = await executeRepoSync({
      ...normalized,
      files,
      orgId: workspace.orgId,
      orgName: workspace.orgName,
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      message: `GitHub repo sync finalizat pentru ${fileCount} fisier${fileCount === 1 ? "" : "e"} relevante.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repo sync GitHub esuat."
    return jsonError(message, 400, "REPO_SYNC_GITHUB_FAILED")
  }
}
