import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getSupabaseOperationalStatus } from "@/lib/server/supabase-status"

export async function GET(request: Request) {
  try {
    requireRole(request, ["owner", "compliance"], "verificarea statusului operational Supabase")

    return NextResponse.json({
      ok: true,
      ...(await getSupabaseOperationalStatus()),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Statusul Supabase nu a putut fi verificat.",
      500,
      "SUPABASE_STATUS_FAILED"
    )
  }
}

