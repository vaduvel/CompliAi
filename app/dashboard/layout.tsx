import { CockpitProvider } from "@/components/compliscan/use-cockpit"
import { DashboardShell } from "@/components/compliscan/dashboard-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CockpitProvider>
      <DashboardShell>{children}</DashboardShell>
    </CockpitProvider>
  )
}
