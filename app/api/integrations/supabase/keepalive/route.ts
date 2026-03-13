import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"
import { runSupabaseKeepalive } from "@/lib/server/supabase-storage"

const KEEPALIVE_HEADER = "x-compliscan-keepalive-key"

type KeepalivePayload = {
  source?: string
  note?: string
}

export async function GET(request: Request) {
  return handleKeepalive(request, {})
}

export async function POST(request: Request) {
  try {
    const body = requirePlainObject(await request.json())
    return handleKeepalive(request, body as KeepalivePayload)
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Payload invalid pentru keepalive.",
      400,
      "SUPABASE_KEEPALIVE_INVALID_PAYLOAD"
    )
  }
}

async function handleKeepalive(request: Request, body: KeepalivePayload) {
  try {
    authorizeKeepalive(request)

    const source =
      asTrimmedString(new URL(request.url).searchParams.get("source"), 80) ||
      asTrimmedString(body.source, 80) ||
      "manual"
    const note = asTrimmedString(body.note, 240) || "Supabase keepalive ping"

    const result = await runSupabaseKeepalive({ source, note })

    return NextResponse.json({
      ok: true,
      ...result,
      message: "Heartbeat-ul a fost scris in Supabase Storage.",
    })
  } catch (error) {
    if (error instanceof KeepaliveAuthError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Heartbeat-ul catre Supabase a esuat.",
      500,
      "SUPABASE_KEEPALIVE_FAILED"
    )
  }
}

function authorizeKeepalive(request: Request) {
  const expectedKey =
    process.env.COMPLISCAN_KEEPALIVE_KEY?.trim() || process.env.COMPLISCAN_RESET_KEY?.trim()
  const providedKey = request.headers.get(KEEPALIVE_HEADER)?.trim()

  if (!expectedKey) {
    throw new KeepaliveAuthError(
      "Keepalive-ul este blocat. Configureaza COMPLISCAN_KEEPALIVE_KEY sau foloseste COMPLISCAN_RESET_KEY.",
      503,
      "SUPABASE_KEEPALIVE_KEY_MISSING"
    )
  }

  if (!providedKey || providedKey !== expectedKey) {
    throw new KeepaliveAuthError(
      `Keepalive-ul necesita header-ul ${KEEPALIVE_HEADER}.`,
      403,
      "SUPABASE_KEEPALIVE_FORBIDDEN"
    )
  }
}

class KeepaliveAuthError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = "KeepaliveAuthError"
    this.status = status
    this.code = code
  }
}
