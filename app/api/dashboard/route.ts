import { NextResponse } from "next/server"

import { readState } from "@/lib/server/mvp-store"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"

export async function GET() {
  return NextResponse.json(await buildDashboardPayload(await readState()))
}
