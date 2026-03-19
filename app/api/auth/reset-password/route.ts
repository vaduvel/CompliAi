import { NextResponse } from "next/server"

import {
  findUserByEmail,
  findUserById,
  hashPassword,
  createSessionToken,
  getSessionCookieOptions,
  linkUserToExternalIdentity,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import { consumeResetToken } from "@/lib/server/reset-tokens"
import { jsonError } from "@/lib/server/api-response"
import { asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"
import { writeFileSafe } from "@/lib/server/fs-safe"
import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { updateSupabasePasswordWithAccessToken } from "@/lib/server/supabase-auth"

function getUsersFile() {
  const explicit = process.env.COMPLISCAN_USERS_FILE?.trim()
  if (explicit) return explicit
  return path.join(process.cwd(), ".data", "users.json")
}

export async function POST(request: Request) {
  try {
    const body = requirePlainObject(await request.json())
    const token = asTrimmedString(body.token, 200)
    const accessToken = asTrimmedString(body.accessToken, 8_000)
    const password = asTrimmedString(body.password, 200)

    if ((!token && !accessToken) || !password) {
      return jsonError(
        "Tokenul de resetare și parola nouă sunt obligatorii.",
        400,
        "AUTH_REQUIRED_FIELDS"
      )
    }

    if (password.length < 8) {
      return jsonError(
        "Parola trebuie să aibă cel puțin 8 caractere.",
        400,
        "AUTH_PASSWORD_TOO_SHORT"
      )
    }

    let user = null

    if (accessToken) {
      try {
        const identity = await updateSupabasePasswordWithAccessToken(accessToken, password)
        user =
          (await findUserById(identity.id)) ||
          (await linkUserToExternalIdentity(identity.email, identity.id, "supabase"))
      } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
          return jsonError(
            "Identitatea exista, dar nu este mapata inca la o organizatie CompliScan.",
            403,
            "AUTH_IDENTITY_NOT_MAPPED"
          )
        }
        if (
          error instanceof Error &&
          error.message === "AUTH_INVALID_RECOVERY_SESSION"
        ) {
          return jsonError(
            "Link-ul de resetare este invalid sau a expirat. Solicită un link nou.",
            400,
            "AUTH_RESET_TOKEN_INVALID"
          )
        }
        throw error
      }
    } else {
      const result = await consumeResetToken(token!)
      if (!result) {
        return jsonError(
          "Link-ul de resetare este invalid sau a expirat. Solicită un link nou.",
          400,
          "AUTH_RESET_TOKEN_INVALID"
        )
      }

      user = await findUserByEmail(result.email)
      if (!user) {
        return jsonError(
          "Contul nu a fost găsit.",
          404,
          "AUTH_USER_NOT_FOUND"
        )
      }

      // Local/dev fallback: update password in users.json
      const usersFile = getUsersFile()
      const raw = await fs.readFile(usersFile, "utf8")
      const users = JSON.parse(raw) as Array<{
        id: string
        email: string
        passwordHash: string
        salt: string
        [key: string]: unknown
      }>

      const userIndex = users.findIndex(
        (u) => u.email.toLowerCase().trim() === result.email
      )
      if (userIndex === -1) {
        return jsonError("Contul nu a fost găsit.", 404, "AUTH_USER_NOT_FOUND")
      }

      const newSalt = crypto.randomBytes(16).toString("hex")
      users[userIndex].salt = newSalt
      users[userIndex].passwordHash = hashPassword(password, newSalt)

      await writeFileSafe(usersFile, JSON.stringify(users, null, 2))
    }

    if (!user) {
      return jsonError("Contul nu a fost găsit.", 404, "AUTH_USER_NOT_FOUND")
    }

    // Auto-login after password reset
    const sessionToken = createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      orgName: user.orgName,
      role: user.role,
      membershipId: user.membershipId,
    })

    const response = NextResponse.json({
      ok: true,
      message: "Parola a fost schimbată cu succes.",
    })
    response.cookies.set(SESSION_COOKIE, sessionToken, getSessionCookieOptions())
    return response
  } catch {
    return jsonError(
      "Eroare la resetarea parolei.",
      500,
      "AUTH_RESET_PASSWORD_FAILED"
    )
  }
}
