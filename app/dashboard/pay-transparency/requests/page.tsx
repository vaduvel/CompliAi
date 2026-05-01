// Pay Transparency — Employee Requests dashboard page
// HR-side view pentru cererile primite prin portal public

import type { Metadata } from "next"

import { PayTransparencyRequestsTab } from "@/components/compliscan/pay-transparency-requests-tab"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/auth"

export const metadata: Metadata = {
  title: "Cereri angajați — Pay Transparency",
  description:
    "Dashboard HR pentru cererile primite prin portalul public. Countdown 30 zile + acțiuni Process / Answer / Escalate.",
}

export const dynamic = "force-dynamic"

export default async function PayTransparencyRequestsPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  const session = sessionToken ? verifySessionToken(sessionToken) : null
  if (!session) {
    redirect("/login")
  }

  // Token-ul portalului public folosește orgId direct (vezi MVP impl).
  const portalUrl = `/employee-portal/${session.orgId}`

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Pay Transparency"
        title="Cereri angajați"
        description="Cererile primite prin portalul public, cu countdown 30 zile (Directiva 2023/970). Procesează, răspunde sau escaladează."
      />

      <Card className="border-eos-primary/30 bg-eos-primary/5">
        <CardContent className="space-y-2 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-muted">
            Link portal angajați (împărtășește intern)
          </p>
          <p className="break-all font-mono text-xs text-eos-text">
            {process.env.NEXT_PUBLIC_APP_URL ?? "https://compliscan.ro"}
            {portalUrl}
          </p>
          <p className="text-xs text-eos-text-muted">
            Trimite link-ul angajaților prin intranet sau email. Pe pagina respectivă pot completa cereri
            anonim sau cu nume. Cererile apar mai jos cu countdown 30 zile.
          </p>
        </CardContent>
      </Card>

      <PayTransparencyRequestsTab />
    </div>
  )
}
