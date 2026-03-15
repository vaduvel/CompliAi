import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { getApplicationHealthStatus } from "@/lib/server/app-health"
import {
  AuthzError,
  listOrganizationMembers,
  requireFreshAuthenticatedSession,
  requireFreshRole,
  readFreshSessionFromRequest,
} from "@/lib/server/auth"
import { logRouteError } from "@/lib/server/operational-logger"
import { buildRepoSyncStatus } from "@/lib/server/repo-sync"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { getReleaseReadinessStatus } from "@/lib/server/release-readiness"
import { getSupabaseOperationalStatus } from "@/lib/server/supabase-status"

type SectionResult<T> = {
  data: T | null
  error: string | null
}

async function resolveSection<T>(
  context: ReturnType<typeof createRequestContext>,
  handler: () => Promise<T>,
  fallback: { code: string; message: string }
): Promise<SectionResult<T>> {
  try {
    return { data: await handler(), error: null }
  } catch (error) {
    if (error instanceof AuthzError) {
      logRouteError(context, error, {
        code: error.code,
        durationMs: getRequestDurationMs(context),
        status: error.status,
      })
      return { data: null, error: error.message }
    }

    logRouteError(context, error, {
      code: fallback.code,
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return {
      data: null,
      error: error instanceof Error ? error.message : fallback.message,
    }
  }
}

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/settings/summary")

  try {
    const session = await readFreshSessionFromRequest(request)
    const currentUser = session
      ? {
          email: session.email,
          orgId: session.orgId,
          orgName: session.orgName,
          role: session.role,
          membershipId: session.membershipId ?? null,
        }
      : null

    const canViewReleaseReadiness =
      session?.role === "owner" || session?.role === "compliance"

    const repoSyncStatus = buildRepoSyncStatus(request)

    const [membersResult, supabaseResult, appHealthResult, releaseReadinessResult] =
      await Promise.all([
        resolveSection(
          context,
          async () => {
            const freshActor = await requireFreshRole(
              request,
              ["owner", "compliance"],
              "vizualizarea membrilor organizatiei"
            )
            const members = await listOrganizationMembers(freshActor.orgId)

            return {
              members,
              orgId: freshActor.orgId,
              orgName: freshActor.orgName,
              actorRole: freshActor.role,
            }
          },
          {
            code: "AUTH_MEMBERS_FETCH_FAILED",
            message: "Nu am putut incarca membrii organizatiei.",
          }
        ),
        resolveSection(
          context,
          async () => {
            await requireFreshRole(
              request,
              ["owner", "compliance"],
              "verificarea statusului operational Supabase"
            )
            return getSupabaseOperationalStatus()
          },
          {
            code: "SUPABASE_STATUS_FAILED",
            message: "Statusul Supabase nu a putut fi verificat.",
          }
        ),
        resolveSection(
          context,
          async () => {
            await requireFreshAuthenticatedSession(request, "verificarea health check-ului")
            return getApplicationHealthStatus()
          },
          {
            code: "APP_HEALTH_FAILED",
            message: "Health check-ul aplicației a eșuat.",
          }
        ),
        canViewReleaseReadiness
          ? resolveSection(
              context,
              async () => {
                await requireFreshRole(
                  request,
                  ["owner", "compliance"],
                  "verificarea release readiness"
                )
                return getReleaseReadinessStatus()
              },
              {
                code: "RELEASE_READINESS_FAILED",
                message: "Release readiness nu a putut fi verificat.",
              }
            )
          : Promise.resolve<SectionResult<Awaited<ReturnType<typeof getReleaseReadinessStatus>>>>({
              data: null,
              error: null,
            }),
      ])

    return jsonWithRequestContext(
      {
        repoSyncStatus,
        currentUser,
        members: membersResult.data,
        membersError: membersResult.error,
        supabaseStatus: supabaseResult.data,
        supabaseStatusError: supabaseResult.error,
        appHealth: appHealthResult.data,
        appHealthError: appHealthResult.error,
        releaseReadiness: releaseReadinessResult.data,
        releaseReadinessError: releaseReadinessResult.error,
      },
      context
    )
  } catch (error) {
    logRouteError(context, error, {
      code: "SETTINGS_SUMMARY_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca sumarul de setari.",
      500,
      "SETTINGS_SUMMARY_FAILED",
      undefined,
      context
    )
  }
}
