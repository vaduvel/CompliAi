import { NextResponse } from "next/server"

import {
  createSessionToken,
  getSessionCookieOptions,
  registerUser,
  SESSION_COOKIE,
} from "@/lib/server/auth"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string
    password?: string
    orgName?: string
  }

  if (!body.email?.trim() || !body.password) {
    return NextResponse.json({ error: "Email si parola sunt obligatorii." }, { status: 400 })
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      { error: "Parola trebuie sa aiba cel putin 8 caractere." },
      { status: 400 }
    )
  }

  try {
    const user = await registerUser(body.email, body.password, body.orgName || "")
    const token = createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      orgName: user.orgName,
    })

    const response = NextResponse.json({ ok: true, orgId: user.orgId, orgName: user.orgName })
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : "Eroare la inregistrare."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
