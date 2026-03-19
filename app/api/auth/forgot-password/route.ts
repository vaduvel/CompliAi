import { NextResponse } from "next/server"

import { findUserByEmail } from "@/lib/server/auth"
import { createResetToken } from "@/lib/server/reset-tokens"
import { jsonError } from "@/lib/server/api-response"
import { asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliAI <onboarding@resend.dev>"
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"

function buildResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:#1e293b;padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px">CompliAI</h1>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 12px">Resetare parolă</h2>
    <p style="color:#475569">Ai solicitat resetarea parolei. Apasă butonul de mai jos pentru a seta o parolă nouă. Link-ul expiră în 1 oră.</p>
    <a href="${resetUrl}" style="display:inline-block;margin-top:16px;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Resetează parola →
    </a>
    <p style="color:#94a3b8;font-size:13px;margin-top:20px">
      Dacă nu ai solicitat resetarea, ignoră acest email. Parola ta rămâne neschimbată.
    </p>
    <p style="color:#94a3b8;font-size:12px;margin-top:16px">
      Sau copiază link-ul: <a href="${resetUrl}" style="color:#3b82f6">${resetUrl}</a>
    </p>
  </div>
</body></html>`
}

async function sendResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  if (!RESEND_API_KEY) {
    console.log(`[PASSWORD_RESET] Email to ${to}: ${resetUrl}`)
    return
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: "Resetare parolă — CompliAI",
      html: buildResetEmailHtml(resetUrl),
    }),
  })
}

export async function POST(request: Request) {
  try {
    const body = requirePlainObject(await request.json())
    const email = asTrimmedString(body.email, 180)

    if (!email) {
      return jsonError(
        "Adresa de email este obligatorie.",
        400,
        "AUTH_REQUIRED_FIELDS"
      )
    }

    // Always return success to prevent email enumeration
    const user = await findUserByEmail(email)
    if (user) {
      const token = await createResetToken(user.email)
      await sendResetEmail(user.email, token)
    }

    return NextResponse.json({
      ok: true,
      message:
        "Dacă adresa există în sistem, vei primi un email cu instrucțiuni de resetare.",
    })
  } catch {
    return jsonError(
      "Eroare la procesarea cererii.",
      500,
      "AUTH_FORGOT_PASSWORD_FAILED"
    )
  }
}
