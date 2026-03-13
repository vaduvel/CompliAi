import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError } from "@/lib/server/api-response"
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
        "Repo sync GitLab este blocat pentru acest mediu. Configureaza COMPLISCAN_SYNC_KEY si trimite cheia in header-ul x-compliscan-sync-key.",
        403,
        "REPO_SYNC_GITLAB_FORBIDDEN"
      )
    }

    const body = validateProviderRepoSyncPayload(
      "gitlab",
      (await request.json().catch(() => ({}))) as ProviderRepoSyncPayload
    )
    const normalized = normalizeProviderRepoSyncPayload("gitlab", body)
    const files = normalizeRepoSyncFiles(normalized)

    if (files.length === 0) {
      return jsonError(
        "Nu am primit fisiere relevante pentru GitLab repo sync. Trimite compliscan.yaml sau manifests suportate.",
        400,
        "REPO_SYNC_GITLAB_NO_RELEVANT_FILES"
      )
    }

    const { nextState, fileCount } = await executeRepoSync({
      ...normalized,
      files,
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: `GitLab repo sync finalizat pentru ${fileCount} fisier${fileCount === 1 ? "" : "e"} relevante.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repo sync GitLab esuat."
    return jsonError(message, 400, "REPO_SYNC_GITLAB_FAILED")
  }
}
