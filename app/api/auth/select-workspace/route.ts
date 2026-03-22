import {
  createSessionToken,
  getSessionCookieOptions,
  getUserMode,
  listUserMemberships,
  readSessionFromRequest,
  resolveUserForMembership,
  SESSION_COOKIE,
  type WorkspaceMode,
} from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

const ALLOWED_MODES: WorkspaceMode[] = ["org", "portfolio"]

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/select-workspace")

  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Sesiune invalida.", 401, "AUTH_SESSION_REQUIRED", undefined, context)
    }

    const body = requirePlainObject(await request.json())
    const workspaceMode = asTrimmedString(body.workspaceMode, 20)

    if (!workspaceMode || !ALLOWED_MODES.includes(workspaceMode as WorkspaceMode)) {
      return jsonError(
        `Mod invalid. Valorile acceptate sunt: ${ALLOWED_MODES.join(", ")}.`,
        400,
        "INVALID_WORKSPACE_MODE",
        undefined,
        context
      )
    }

    if (workspaceMode === "portfolio") {
      const userMode = await getUserMode(session.userId)
      if (userMode !== "partner") {
        return jsonError(
          "Doar utilizatorii cu modul partner pot activa vizualizarea portfolio.",
          403,
          "WORKSPACE_PORTFOLIO_FORBIDDEN",
          undefined,
          context
        )
      }

      const token = createSessionToken({
        userId: session.userId,
        orgId: session.orgId,
        email: session.email,
        orgName: session.orgName,
        role: session.role,
        membershipId: session.membershipId,
        workspaceMode: "portfolio",
      })

      const response = jsonWithRequestContext({
        ok: true,
        workspaceMode: "portfolio",
        orgId: session.orgId,
        orgName: session.orgName,
        role: session.role,
      }, context)
      response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
      return response
    }

    // workspaceMode === "org" — requires orgId
    const orgId = asTrimmedString(body.orgId, 120)
    if (!orgId) {
      return jsonError(
        "orgId este obligatoriu cand selectezi modul org.",
        400,
        "WORKSPACE_ORG_ID_REQUIRED",
        undefined,
        context
      )
    }

    const memberships = await listUserMemberships(session.userId)
    const target = memberships.find((m) => m.orgId === orgId && m.status === "active")
    if (!target) {
      return jsonError(
        "Nu esti membru al organizatiei selectate.",
        403,
        "WORKSPACE_ORG_NOT_MEMBER",
        undefined,
        context
      )
    }

    const resolvedUser = await resolveUserForMembership(session.userId, target.membershipId)

    const token = createSessionToken({
      userId: resolvedUser.id,
      orgId: resolvedUser.orgId,
      email: resolvedUser.email,
      orgName: resolvedUser.orgName,
      role: resolvedUser.role,
      membershipId: resolvedUser.membershipId,
      workspaceMode: "org",
    })

    const response = jsonWithRequestContext({
      ok: true,
      workspaceMode: "org",
      orgId: resolvedUser.orgId,
      orgName: resolvedUser.orgName,
      role: resolvedUser.role,
      membershipId: resolvedUser.membershipId,
    }, context)
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
    return response
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof Error) {
      if (error.message === "MEMBERSHIP_NOT_FOUND") {
        return jsonError(
          "Nu esti membru al organizatiei selectate.",
          403,
          "WORKSPACE_ORG_NOT_MEMBER",
          undefined,
          context
        )
      }
      if (error.message === "USER_NOT_FOUND") {
        return jsonError("Utilizatorul curent nu exista.", 404, "AUTH_USER_NOT_FOUND", undefined, context)
      }
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia selectata nu exista.", 404, "AUTH_ORG_NOT_FOUND", undefined, context)
      }
    }

    await logRouteError(context, error, {
      code: "WORKSPACE_SELECT_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut schimba modul de lucru.",
      500,
      "WORKSPACE_SELECT_FAILED",
      undefined,
      context
    )
  }
}
