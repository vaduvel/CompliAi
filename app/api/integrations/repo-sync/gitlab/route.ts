import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { executeRepoSync } from "@/lib/server/repo-sync-executor"
import {
  canUseRepoSync,
  normalizeProviderRepoSyncPayload,
  normalizeRepoSyncFiles,
  type ProviderRepoSyncPayload,
} from "@/lib/server/repo-sync"

export async function POST(request: Request) {
  if (!canUseRepoSync(request)) {
    return NextResponse.json(
      {
        error:
          "Repo sync GitLab este blocat pentru acest mediu. Configureaza COMPLISCAN_SYNC_KEY si trimite cheia in header-ul x-compliscan-sync-key.",
      },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as ProviderRepoSyncPayload
  const normalized = normalizeProviderRepoSyncPayload("gitlab", body)
  const files = normalizeRepoSyncFiles(normalized)

  if (files.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nu am primit fisiere relevante pentru GitLab repo sync. Trimite compliscan.yaml sau manifests suportate.",
      },
      { status: 400 }
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
}
