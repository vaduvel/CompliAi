"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ExternalLink, Globe, Lock, ShieldCheck } from "lucide-react"

import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ReportsTabs } from "@/components/compliscan/reports-tabs"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

export function ReportsTrustCenterPageSurface() {
  const cockpit = useCockpitData()

  const [visibility, setVisibility] = useState({
    score: true,
    gdpr: true,
    euAiAct: true,
    efactura: true,
    updatedAt: true,
  })

  if (cockpit.error) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const { data } = cockpit
  const orgName = data.workspace.orgName
  const orgId = data.workspace.orgId
  const score = data.summary.score
  const { gdprProgress, highRisk, efacturaConnected } = data.state

  const isGdprGood = gdprProgress >= 70
  const isAiActGood = highRisk === 0
  const updatedAt = new Date().toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const trustUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trust/${orgId}`
      : `/trust/${orgId}`

  function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(trustUrl)
    }
  }

  function toggleVisibility(key: keyof typeof visibility) {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const visibilityItems: { key: keyof typeof visibility; label: string }[] = [
    { key: "score", label: "Scor global de conformitate" },
    { key: "gdpr", label: "Status framework GDPR" },
    { key: "euAiAct", label: "Status EU AI Act" },
    { key: "efactura", label: "Status e-Factura" },
    { key: "updatedAt", label: "Data ultimei actualizari" },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Trust Center"
        title="Profil public de conformitate"
        description="Configurezi ce văd clienții și auditorii externi când primesc linkul Trust Center. Preview-ul de mai jos reflectă exact ce apare public."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            vizualizare externa
          </Badge>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Scor global
            </p>
            <p className="text-2xl font-semibold text-eos-text">{score}%</p>
            <p className="text-sm text-eos-text-muted">{data.summary.riskLabel}</p>
          </div>
        }
      />

      <ReportsTabs />

      {/* Section 1: Public profile preview */}
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-eos-text-muted" strokeWidth={2} />
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
                  Preview profil public
                </p>
              </div>
              <CardTitle className="mt-2 text-xl">
                Cum arată pentru un auditor extern
              </CardTitle>
              <p className="mt-1 text-sm text-eos-text-muted">
                Linkul Trust Center este public. Auditorii și clienții văd exact ce este activat în panoul de configurare.
              </p>
            </div>
            <Button variant="outline" onClick={copyLink} className="gap-2 shrink-0">
              <ExternalLink className="size-4" strokeWidth={2} />
              Copiază link
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Simulated public profile card */}
          <div className="rounded-eos-lg border border-eos-border-strong bg-eos-bg-inset p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-eos-md bg-eos-primary-soft">
                  <ShieldCheck className="size-5 text-eos-primary" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-eos-text">
                    Trust Center &mdash; {orgName}
                  </p>
                  <p className="text-sm text-eos-text-muted">
                    Profil public de conformitate
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                <Lock className="size-3 mr-1" strokeWidth={2} />
                doar vizualizare
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Score */}
              {visibility.score && (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    Scor global
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-eos-text">{score}%</p>
                  <p className="mt-1 text-sm text-eos-text-muted">{data.summary.riskLabel}</p>
                </div>
              )}

              {/* GDPR */}
              {visibility.gdpr && (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    GDPR
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={isGdprGood ? "success" : "warning"}>
                      {isGdprGood ? "Conform" : "In progres"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-eos-text-muted">
                    Progres: {gdprProgress}%
                  </p>
                </div>
              )}

              {/* EU AI Act */}
              {visibility.euAiAct && (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    EU AI Act
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={isAiActGood ? "success" : "warning"}>
                      {isAiActGood ? "Fara risc ridicat" : "Sisteme de risc ridicat"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-eos-text-muted">
                    {highRisk === 0
                      ? "Niciun sistem AI cu risc ridicat detectat"
                      : `${highRisk} sistem${highRisk !== 1 ? "e" : ""} cu risc ridicat`}
                  </p>
                </div>
              )}

              {/* e-Factura */}
              {visibility.efactura && (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    e-Factura
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={efacturaConnected ? "success" : "warning"}>
                      {efacturaConnected ? "Conectat" : "Neconectat"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-eos-text-muted">
                    {efacturaConnected
                      ? "Integrare e-Factura activa"
                      : "Integrarea e-Factura nu este configurata"}
                  </p>
                </div>
              )}

              {/* Updated at */}
              {visibility.updatedAt && (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                    Ultima actualizare
                  </p>
                  <p className="mt-2 text-sm font-semibold text-eos-text">{updatedAt}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-eos-success" strokeWidth={2} />
                    <p className="text-xs text-eos-text-muted">Status verificat</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trust URL preview */}
            <div className="mt-5 rounded-eos-md border border-eos-border-subtle bg-eos-surface p-3">
              <p className="text-xs text-eos-text-muted break-all">
                <span className="font-medium text-eos-text">Link public: </span>
                {trustUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Visibility configuration */}
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="border-b border-eos-border pb-5">
          <div>
            <CardTitle className="text-base">Ce se arată public</CardTitle>
            <p className="mt-1 text-sm text-eos-text-muted">
              Activează sau dezactivează ce văd auditorii externi în profilul tău public.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-6">
          {visibilityItems.map((item) => (
            <DenseListItem key={item.key} active={visibility[item.key]}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={
                      visibility[item.key]
                        ? "size-4 text-eos-success"
                        : "size-4 text-eos-text-muted opacity-40"
                    }
                    strokeWidth={2}
                  />
                  <p className="text-sm font-medium text-eos-text">{item.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisibility(item.key)}
                  className="shrink-0"
                >
                  {visibility[item.key] ? "Ascunde" : "Arată"}
                </Button>
              </div>
            </DenseListItem>
          ))}
        </CardContent>
      </Card>

      {/* Section 3: CTA */}
      <ActionCluster
        eyebrow="Distribuie"
        title="Trimite linkul Trust Center"
        description="Clienții și auditorii externi pot vizualiza statusul conformității tale fără să aibă acces la dashboard."
        actions={
          <>
            <Button onClick={copyLink} className="gap-2">
              <ExternalLink className="size-4" strokeWidth={2} />
              Copiază linkul
            </Button>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.dosar}>
                Mergi la Dosar
              </Link>
            </Button>
          </>
        }
      />
    </div>
  )
}
