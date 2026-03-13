import { NextResponse } from "next/server"

import { buildRepoSyncStatus } from "@/lib/server/repo-sync"

export async function GET(request: Request) {
  return NextResponse.json(buildRepoSyncStatus(request))
}
