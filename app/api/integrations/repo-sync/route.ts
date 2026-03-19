import { NextResponse } from "next/server"

import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import {
  canUseRepoSync,
  normalizeRepoSyncFiles,
  type RepoSyncPayload,
  validateRepoSyncPayload,
} from "@/lib/server/repo-sync"
import { executeRepoSync } from "@/lib/server/repo-sync-executor"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/integrations/repo-sync")

  try {
    if (!canUseRepoSync(request)) {
      return jsonError(
        "Repo sync este blocat pentru acest mediu. Configureaza COMPLISCAN_SYNC_KEY si trimite cheia in header-ul x-compliscan-sync-key. Local pe localhost este permis fara cheie.",
        403,
        "REPO_SYNC_FORBIDDEN",
        undefined,
        context
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
        "REPO_SYNC_NO_RELEVANT_FILES",
        undefined,
        context
      )
    }

    const { nextState, fileCount } = await executeRepoSync({
      ...body,
      files,
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: `Repo sync finalizat pentru ${fileCount} fisier${fileCount === 1 ? "" : "e"} relevante.`,
    }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repo sync esuat."
    const status =
      message.includes("Payload-ul") || message.includes("fisiere") || message.includes("maxim")
        ? 400
        : 500
    await logRouteError(context, error, {
      code: "REPO_SYNC_FAILED",
      durationMs: getRequestDurationMs(context),
      status,
    })
    return jsonError(message, status, "REPO_SYNC_FAILED", undefined, context)
  }
}
