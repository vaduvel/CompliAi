"use client"

import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Layers, ShieldCheck } from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { LoadingScreen, DriftCommandCenter } from "@/components/compliscan/route-sections"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { useCockpitData } from "@/components/compliscan/use-cockpit"

export default function DashboardPage() {
  const router = useRouter()
  const cockpit = useCockpitData()

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const { data, activeDrifts, tasks, nextBestAction, openAlerts } = cockpit
  const state = data.state
  
  // Calculam Datele de Readiness
  const aiHighRisk = state.highRisk
  const aiLowRisk = state.lowRisk
  const totalAiSystems = aiHighRisk + aiLowRisk
  const aiActScore = totalAiSystems === 0 ? 0 : Math.max(0, 100 - (aiHighRisk * 20))
  const aiActStatus = aiHighRisk > 0 ? "review" : (totalAiSystems > 0 ? "strong" : "good")
  
  const gdprScore = state.gdprProgress
  const gdprStatus = gdprScore >= 90 ? "strong" : (gdprScore >= 50 ? "good" : "review")
  
  const efacturaScore = state.efacturaConnected ? 100 : (state.efacturaSignalsCount > 0 ? 40 : 10)
  const efacturaStatus = state.efacturaConnected ? "strong" : (state.efacturaSignalsCount > 0 ? "review" : "blocked")

  const overdueTasks = tasks.filter(t => t.status !== "done").length
  const hasEvidence = state.scannedDocuments > 0 || state.scans.length > 0
  const activeRiskCount = openAlerts.length

  return (
    <div className="space-y-8" role="main" aria-labelledby="dashboard-title">
      <PageIntro
        eyebrow="Dashboard"
        title="Starea actuala a conformitatii tale"
        description="Situatia globala: ce s-a schimbat, ce deviaza si ce cere interventie."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Readiness global: {data.summary.score}%
            </Badge>
            <Badge variant={activeDrifts.length > 0 ? "destructive" : "success"} className="normal-case tracking-normal">
              {activeDrifts.length > 0 ? `${activeDrifts.length} drift-uri active` : "Control stabil"}
            </Badge>
          </>
        }
      />

      <section aria-label="Urmatorul pas recomandat" className="space-y-4">
        <NextBestAction
          task={nextBestAction}
          onResolve={() => router.push("/dashboard/checklists")}
          hasEvidence={hasEvidence}
          activeRiskCount={activeRiskCount}
        />
      </section>

      <section aria-label="Conformitate pe cadru" className="space-y-4">
        <h2 className="text-lg font-semibold text-eos-text">Conformitate pe cadru</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReadinessFrameworkCard
            framework="AI Act"
            percent={aiActScore}
            missing={aiHighRisk}
            status={aiActStatus}
            description={totalAiSystems > 0 ? "Sisteme AI in inventar" : "Nu s-au detectat sisteme AI"}
            icon={Layers}
            onViewDetails={() => router.push("/dashboard/sisteme")}
            ariaLabel={`AI Act: ${aiActScore}% pregatit`}
          />
          <ReadinessFrameworkCard
            framework="GDPR"
            percent={gdprScore}
            missing={tasks.filter(t => t.principles.includes("privacy_data_governance") && t.status !== "done").length}
            status={gdprStatus}
            description="Conformitatea prelucrarii datelor"
            icon={CheckCircle2}
            onViewDetails={() => router.push("/dashboard/checklists")}
            ariaLabel={`GDPR: ${gdprScore}% pregatit`}
          />
          <ReadinessFrameworkCard
            framework="e-Factura"
            percent={efacturaScore}
            missing={state.efacturaConnected ? 0 : 1}
            status={efacturaStatus}
            description={state.efacturaConnected ? "Sincronizare ANAF activa" : "Integrare ANAF lipsa"}
            icon={FileText}
            onViewDetails={() => router.push("/dashboard/setari")}
            ariaLabel={`e-Factura: ${efacturaScore}% pregatit`}
          />
          <ReadinessFrameworkCard
            framework="Scor Global"
            percent={data.summary.score}
            missing={overdueTasks}
            status={data.summary.score >= 80 ? "strong" : "review"}
            description="Media controalelor validate"
            icon={ShieldCheck}
            onViewDetails={() => router.push("/dashboard/rapoarte/auditor-vault")}
            ariaLabel={`Scor Global: ${data.summary.score}% pregatit`}
          />
        </div>
      </section>

      <section aria-label="Schimbari si drift activ" className="space-y-4" aria-live="polite">
        <DriftCommandCenter
          activeDrifts={activeDrifts}
          hasValidatedBaseline={Boolean(state.validatedBaselineSnapshotId)}
          latestDocumentScan={state.scans.find((s) => s.sourceKind === "document") ?? null}
          latestManifestScan={state.scans.find((s) => s.sourceKind === "manifest") ?? null}
        />
      </section>
    </div>
  )
}

function ReadinessFrameworkCard({
  framework,
  percent,
  missing,
  status,
  description,
  icon: Icon,
  onViewDetails,
  ariaLabel
}: {
  framework: string
  percent: number
  missing: number
  status: "strong" | "good" | "review" | "blocked"
  description?: string
  icon?: React.ElementType
  onViewDetails?: () => void
  ariaLabel?: string
}) {
  const statusConfig = {
    strong: { label: "CONFIRMARE PUTERNICĂ", color: "success" as const },
    good: { label: "CONFIRMARE OPERAȚIONALĂ", color: "default" as const },
    review: { label: "REVIEW NECESAR", color: "warning" as const },
    blocked: { label: "BLOCAT", color: "destructive" as const },
  }
  const config = statusConfig[status]

  return (
    <Card className="flex flex-col justify-between border-eos-border bg-eos-surface p-5 transition-all hover:border-eos-border-strong" aria-label={ariaLabel}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-5 text-eos-text-muted" strokeWidth={2} />}
            <h3 className="font-semibold text-eos-text">{framework}</h3>
          </div>
          <Badge variant={config.color} className="text-[10px]">
            {config.label}
          </Badge>
        </div>
        {description && (
          <p className="mt-2 text-xs leading-tight text-eos-text-muted">
            {description}
          </p>
        )}
        <div className="mt-5 flex items-end gap-2">
          <span className="text-3xl font-semibold text-eos-text">{percent}%</span>
          <span className="mb-1 text-xs text-eos-text-muted">pregatit</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-eos-surface-variant">
          <div className="h-full bg-eos-primary transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        {missing > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-eos-warning">
            <AlertTriangle className="size-3.5" strokeWidth={2} />
            <span>{missing} actiuni deschise</span>
          </div>
        )}
      </div>
      {onViewDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
          className="group mt-5 w-full justify-between"
        >
          Vezi detalii
          <ArrowRight className="size-4 text-eos-text-muted transition-transform group-hover:translate-x-1" strokeWidth={2} />
        </Button>
      )}
    </Card>
  )
}
