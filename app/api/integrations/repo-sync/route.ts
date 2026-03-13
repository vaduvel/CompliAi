import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError } from "@/lib/server/api-response"
import {
  canUseRepoSync,
  normalizeRepoSyncFiles,
  type RepoSyncPayload,
  validateRepoSyncPayload,
} from "@/lib/server/repo-sync"
import { executeRepoSync } from "@/lib/server/repo-sync-executor"

export async function POST(request: Request) {
  try {
    if (!canUseRepoSync(request)) {
      return jsonError(
        "Repo sync este blocat pentru acest mediu. Configureaza COMPLISCAN_SYNC_KEY si trimite cheia in header-ul x-compliscan-sync-key. Local pe localhost este permis fara cheie.",
        403,
        "REPO_SYNC_FORBIDDEN"
      )
    }

    const body = validateRepoSyncPayload(
      (await request.json().catch(() => ({}))) as RepoSyncPayload
    )
    const files = normalizeRepoSyncFiles(body)

    if (files.length === 0) {
      return jsonError(
        "Nu am primit fisiere relevante pentru repo sync. Trimite compliscan.yaml sau manifests suportate.",
        400,
        "REPO_SYNC_NO_RELEVANT_FILES"
      )
    }

    const { nextState, fileCount } = await executeRepoSync({
      ...body,
      files,
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: `Repo sync finalizat pentru ${fileCount} fisier${fileCount === 1 ? "" : "e"} relevante.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repo sync esuat."
    return jsonError(message, 400, "REPO_SYNC_FAILED")
  }
}
