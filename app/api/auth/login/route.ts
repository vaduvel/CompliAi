import { NextResponse } from "next/server"

import {
  createSessionToken,
  createWorkspacePreferenceToken,
  findUserById,
  findUserByEmail,
  getSessionCookieOptions,
  getUserMode,
  readLastRouteFromRequest,
  getWorkspacePreferenceCookieOptions,
  linkUserToExternalIdentity,
  listUserMemberships,
  hashPassword,
  readWorkspacePreferenceFromRequest,
  resolveUserForMembership,
  SESSION_COOKIE,
  WORKSPACE_PREF_COOKIE,
} from "@/lib/server/auth"
import { sanitizeInternalRoute } from "@/lib/compliscan/internal-route"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"
import { shouldUseSupabaseAuth, signInSupabaseIdentity } from "@/lib/server/supabase-auth"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/login")

  try {
    const body = requirePlainObject(await request.json())
    const email = asTrimmedString(body.email, 180)
    const password = asTrimmedString(body.password, 200)
    const requestedNext = typeof body.next === "string" ? body.next.trim() : ""

    if (!email || !password) {
      return jsonError("Email si parola sunt obligatorii.", 400, "AUTH_REQUIRED_FIELDS", undefined, context)
    }

    const localUser = await findUserByEmail(email)
    let user = localUser

    if (shouldUseSupabaseAuth(localUser?.authProvider)) {
      try {
        const identity = await signInSupabaseIdentity(email, password)
        user =
          (await findUserById(identity.id)) ||
          (await linkUserToExternalIdentity(identity.email, identity.id, "supabase"))
      } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
          return jsonError(
            "Identitatea exista, dar nu este mapata inca la o organizatie CompliScan.",
            403,
            "AUTH_IDENTITY_NOT_MAPPED",
            undefined,
            context
          )
        }
        if (!localUser || localUser.authProvider === "supabase") {
          if (error instanceof Error && error.message === "AUTH_INVALID_CREDENTIALS") {
            return jsonError("Email sau parola incorecta.", 401, "AUTH_INVALID_CREDENTIALS", undefined, context)
          }
          throw error
        }
      }
    }

    if (!user || (user.authProvider !== "supabase" && hashPassword(password, user.salt) !== user.passwordHash)) {
      return jsonError("Email sau parola incorecta.", 401, "AUTH_INVALID_CREDENTIALS", undefined, context)
    }

    const preferredWorkspace = readWorkspacePreferenceFromRequest(request)
    const userMode = await getUserMode(user.id)
    const memberships = await listUserMemberships(user.id)

    let sessionUser = user
    if (preferredWorkspace?.orgId && preferredWorkspace.orgId !== user.orgId) {
      const preferredMembership = memberships.find(
        (membership) =>
          membership.orgId === preferredWorkspace.orgId && membership.status === "active"
      )
      if (preferredMembership) {
        try {
          sessionUser = await resolveUserForMembership(user.id, preferredMembership.membershipId)
        } catch {
          sessionUser = user
        }
      }
    }

    // DESTINATION §2.1 — Partner aterizează default pe /portfolio.
    // Dacă user avea ultima sesiune în workspace "org" (drill-in mid-flow), păstrăm.
    const workspaceMode =
      userMode === "partner"
        ? preferredWorkspace?.workspaceMode === "org"
          ? "org"
          : "portfolio"
        : "org"
    const defaultDestination = workspaceMode === "portfolio" ? "/portfolio" : "/dashboard"
    const destination = sanitizeInternalRoute(
      requestedNext || readLastRouteFromRequest(request),
      defaultDestination
    )

    const token = createSessionToken({
      userId: sessionUser.id,
      orgId: sessionUser.orgId,
      email: sessionUser.email,
      orgName: sessionUser.orgName,
      role: sessionUser.role,
      userMode: userMode ?? undefined,
      membershipId: sessionUser.membershipId,
      workspaceMode,
    })

    const response = NextResponse.json(
      {
        ok: true,
        orgId: sessionUser.orgId,
        orgName: sessionUser.orgName,
        role: sessionUser.role,
        workspaceMode,
        destination,
      },
      withRequestIdHeaders(undefined, context)
    )
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
    response.cookies.set(
      WORKSPACE_PREF_COOKIE,
      createWorkspacePreferenceToken({
        orgId: sessionUser.orgId,
        workspaceMode,
      }),
      getWorkspacePreferenceCookieOptions()
    )
    return response
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    const message =
      error instanceof Error ? error.message : "Autentificarea nu a putut fi pornita."
    await logRouteError(context, error, {
      code: "AUTH_LOGIN_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(message, 500, "AUTH_LOGIN_FAILED", undefined, context)
  }
}
