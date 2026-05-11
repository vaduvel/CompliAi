"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react"

import { IncidentsTab } from "@/components/compliscan/nis2/IncidentsTab"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"

export default function BreachPage() {
  const [orgName, setOrgName] = useState<string | undefined>()

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { orgName?: string } | null) => {
        if (d?.orgName) setOrgName(d.orgName)
      })
      .catch(() => null)
  }, [])

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: "Breach ANSPDCP", current: true }]}
        eyebrowBadges={
          <span className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
            GDPR Art. 33 · 72h
          </span>
        }
        title="Incident date personale — notificare ANSPDCP"
        description="Workspace DPO pentru incidente care implică date personale: înregistrezi incidentul, activezi notificarea ANSPDCP în 72h și păstrezi dovada separat de raportările tehnice."
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/dashboard/resolve">
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Înapoi la De rezolvat
            </Link>
          </Button>
        }
      />

      <Card className="border-eos-warning/25 bg-eos-warning-soft/20">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <div className="space-y-1">
            <p className="font-semibold text-eos-text">Pentru DPO: acesta este fluxul privacy, nu NIS2 complet.</p>
            <p className="text-xs leading-relaxed text-eos-text-muted">
              Dacă incidentul implică date personale, bifează explicit “Implică date cu caracter personal”.
              CompliScan creează automat finding-ul ANSPDCP, calculează termenul de 72h și păstrează traseul în dosar.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-eos-error/20 bg-eos-error-soft/10">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-eos-text-muted">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-error" strokeWidth={2} />
          <p>
            Notificarea ANSPDCP este separată de orice raportare DNSC/NIS2. Consultantul validează profesional
            conținutul înainte de transmiterea oficială către autoritate.
          </p>
        </CardContent>
      </Card>

      <IncidentsTab orgName={orgName} focusMode="anspdcp" />
    </div>
  )
}
