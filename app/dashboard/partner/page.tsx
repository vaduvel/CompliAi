import { LegacyWorkspaceBridge } from "@/components/compliscan/legacy-workspace-bridge"

export default function PartnerPage() {
  return (
    <LegacyWorkspaceBridge
      title="Mutăm sesiunea în Portofoliu"
      description="Ruta veche de partner a devenit o punte către Portofoliu, adică suprafața de triage cross-client. Îți păstrăm sesiunea și te mutăm pe traseul canonic."
      requestBody={{ workspaceMode: "portfolio" }}
      destinationHref="/portfolio"
      fallbackHref="/dashboard"
      fallbackLabel="Înapoi la dashboard"
    />
  )
}
