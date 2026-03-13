import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import {
  canUseRepoSync,
  normalizeRepoSyncFiles,
  type RepoSyncPayload,
} from "@/lib/server/repo-sync"
import { executeRepoSync } from "@/lib/server/repo-sync-executor"

export async function POST(request: Request) {
  if (!canUseRepoSync(request)) {
    return NextResponse.json(
      {
        error:
          "Repo sync este blocat pentru acest mediu. Configureaza COMPLISCAN_SYNC_KEY si trimite cheia in header-ul x-compliscan-sync-key. Local pe localhost este permis fara cheie.",
      },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as RepoSyncPayload
  const files = normalizeRepoSyncFiles(body)

  if (files.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nu am primit fisiere relevante pentru repo sync. Trimite compliscan.yaml sau manifests suportate.",
      },
      { status: 400 }
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
}
