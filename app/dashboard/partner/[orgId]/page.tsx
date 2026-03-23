import { LegacyWorkspaceBridge } from "@/components/compliscan/legacy-workspace-bridge"

export default async function PartnerClientDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  return (
    <LegacyWorkspaceBridge
      title="Mutăm sesiunea pe firma selectată"
      description="Deep-link-ul vechi de partner deschide acum direct contextul firmei active, fără să mai păstreze o suprafață paralelă de drilldown."
      requestBody={{ workspaceMode: "org", orgId }}
      destinationHref="/dashboard"
      fallbackHref="/portfolio"
      fallbackLabel="Înapoi la portofoliu"
    />
  )
}
