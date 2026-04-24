import { redirect } from "next/navigation"

import { ResolvePageSurface } from "@/components/compliscan/resolve-page"
import { dashboardFindingRoute } from "@/lib/compliscan/dashboard-routes"

type ResolveSearchParams = Record<string, string | string[] | undefined>

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function buildForwardedResolveParams(searchParams: ResolveSearchParams) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "finding" || value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
      continue
    }
    params.set(key, value)
  }
  return params
}

export default async function ResolvePage({
  searchParams,
}: {
  searchParams: Promise<ResolveSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const focusedFindingId = firstSearchParam(resolvedSearchParams.finding)

  if (focusedFindingId) {
    redirect(dashboardFindingRoute(focusedFindingId, buildForwardedResolveParams(resolvedSearchParams)))
  }

  return <ResolvePageSurface />
}
