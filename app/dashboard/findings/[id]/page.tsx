import { redirect } from "next/navigation"

import { dashboardFindingRoute } from "@/lib/compliscan/dashboard-routes"

export default async function LegacyFindingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(dashboardFindingRoute(id))
}
