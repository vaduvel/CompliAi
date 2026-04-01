// P2 — Client context page.
// Accessible from portfolio overview; stays in partner/portfolio mode.
// Partner can inspect a client's compliance status without switching workspace.

import { ClientContextPanel } from "@/components/compliscan/client-context-panel"

export default async function PortfolioClientPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  return <ClientContextPanel orgId={orgId} />
}
