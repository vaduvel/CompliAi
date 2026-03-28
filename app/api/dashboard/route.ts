import { NextResponse } from "next/server"

import { readFreshState } from "@/lib/server/mvp-store"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"

export async function GET() {
  return NextResponse.json(await buildDashboardPayload(await readFreshState()))
}
