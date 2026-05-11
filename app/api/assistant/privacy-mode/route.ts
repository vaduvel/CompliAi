// Asistent fiscal — endpoint pentru setarea modului de privacy.
//
// GET → returnează modul curent (default "cloud-allowed").
// PUT → setează modul ("local-only" | "cloud-allowed").
//
// Locked behind authenticated session per-org.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { isLocalGemmaAvailable } from "@/lib/server/ai-provider"
import type { ComplianceState } from "@/lib/compliance/types"

type PrivacyMode = "local-only" | "cloud-allowed"

export async function GET(request: Request) {
  let session
  try {
    session = await requireFreshAuthenticatedSession(request, "AI privacy mode")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "PRIVACY_AUTH_FAILED")
  }

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  const mode: PrivacyMode = state?.aiPrivacyMode ?? "cloud-allowed"
  const localAvailable = await isLocalGemmaAvailable()

  return NextResponse.json({
    ok: true,
    mode,
    localAvailable,
  })
}

export async function PUT(request: Request) {
  let session
  try {
    session = await requireFreshAuthenticatedSession(request, "AI privacy mode set")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "PRIVACY_AUTH_FAILED")
  }

  let body: { mode?: PrivacyMode }
  try {
    body = (await request.json()) as { mode?: PrivacyMode }
  } catch {
    return jsonError("Body invalid.", 400, "PRIVACY_INVALID_BODY")
  }

  if (body.mode !== "local-only" && body.mode !== "cloud-allowed") {
    return jsonError(
      "Mode invalid — folosește 'local-only' sau 'cloud-allowed'.",
      400,
      "PRIVACY_INVALID_MODE",
    )
  }

  // Refuză activarea local-only dacă Ollama nu rulează — altfel blocăm chatul
  if (body.mode === "local-only") {
    const ok = await isLocalGemmaAvailable()
    if (!ok) {
      return jsonError(
        "Pentru privacy local-only, Ollama + Gemma 4 trebuie să ruleze. Instalează Ollama și rulează `ollama pull gemma4:e2b`.",
        409,
        "PRIVACY_LOCAL_UNAVAILABLE",
      )
    }
  }

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "PRIVACY_STATE_UNAVAILABLE")

  await writeStateForOrg(session.orgId, { ...state, aiPrivacyMode: body.mode })

  return NextResponse.json({ ok: true, mode: body.mode })
}
