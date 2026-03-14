"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Radar,
  Sparkles,
} from "lucide-react"

import { AIDiscoveryPanel } from "@/components/compliscan/ai-discovery-panel"
import {
  AICompliancePackEntriesCard,
  AICompliancePackSummaryCard,
} from "@/components/compliscan/ai-compliance-pack-card"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import type { AICompliancePackEntry } from "@/lib/compliance/ai-compliance-pack"
import { AIInventoryPanel } from "@/components/compliscan/ai-inventory-panel"
import { EFacturaValidatorCard } from "@/components/compliscan/efactura-validator-card"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import { formatRelativeRomanian } from "@/lib/compliance/engine"

type ControlViewMode = "discovery" | "inventory" | "baseline" | "drift" | "pack" | "integrari"

export default function SistemePage() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const heavyPayloadRequested = useRef(false)
  const [viewMode, setViewMode] = useState<ControlViewMode>("discovery")

  const needsCompliancePack =
    viewMode === "pack" && Boolean(cockpit.data && !cockpit.data.compliancePack)

  useEffect(() => {
    if (needsCompliancePack && !heavyPayloadRequested.current) {
      heavyPayloadRequested.current = true
      void cockpitActions.ensureHeavyPayload()
    }
  }, [needsCompliancePack, cockpitActions])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />
  if (needsCompliancePack) return <LoadingScreen variant="section" />

  const aiHighRisk = cockpit.data.state.aiSystems.filter((s) => s.riskLevel === "high").length
  const aiLowRisk = cockpit.data.state.aiSystems.filter(
    (s) => s.riskLevel === "minimal" || s.riskLevel === "limited"
  ).length
  const detectedActiveCount = cockpit.data.state.detectedAISystems.filter(
    (system) => system.detectionStatus !== "confirmed" && system.detectionStatus !== "rejected"
  ).length
  const reviewedCount = cockpit.data.state.detectedAISystems.filter(
    (system) => system.detectionStatus === "reviewed"
  ).length
  const confirmedCount = cockpit.data.state.aiSystems.length
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )
  const recentInventory = cockpit.data.state.aiSystems.slice(0, 4)
  const recentDrifts = cockpit.activeDrifts.slice(0, 4)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Control sisteme AI"
        description="Detectie automata, confirmare umana, inventar AI si drift fata de baseline"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="control" />

      <ControlViewTabs active={viewMode} onChange={setViewMode} />

      {viewMode === "discovery" && (
        <>
          <SystemsGuideCard />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="border-b border-[var(--color-border)] pb-5">
              <CardTitle className="text-xl">Ce faci acum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <ActionRow
                icon={Sparkles}
                title="Rulezi autodiscovery pe manifestele sursă"
                detail="Foloseste package.json, requirements.txt sau pyproject.toml ca sa propui sisteme AI reale, nu inventar scris manual dupa memorie."
              />
              <ActionRow
                icon={CheckCircle2}
                title="Corectezi detectiile inainte de confirmare"
                detail="Scopul, modelul si nivelul de incredere trebuie sa fie validate uman inainte sa intre in inventarul oficial."
              />
              <ActionRow
                icon={Radar}
                title="Fixezi un baseline validat"
                detail="Cand snapshot-ul este bun, il salvezi ca baseline si drift-ul va compara viitoarele schimbari fata de acel punct."
              />
            </CardContent>
          </Card>

          <SectionDivider
            eyebrow="Flux activ"
            title="Detectii in lucru si prefill pentru validare"
            description="Aici lucram pe ce a detectat sistemul automat. Corectam candidatii, confirmam campurile importante si mutam doar sistemele curate in inventarul oficial."
            stats={[
              { label: "Detectii active", value: detectedActiveCount },
              { label: "Revizuite", value: reviewedCount },
              { label: "Drift activ", value: recentDrifts.length },
            ]}
          />

          <AIDiscoveryPanel
            systems={cockpit.data.state.detectedAISystems}
            drifts={cockpit.activeDrifts}
            busy={cockpit.busy}
            onDiscover={cockpitActions.discoverAISystemsFromManifest}
            onUpdateStatus={cockpitActions.updateDetectedAISystem}
            onEdit={cockpitActions.editDetectedAISystem}
          />
        </>
      )}

      {viewMode === "inventory" && (
        <>
          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="border-b border-[var(--color-border)] pb-5">
              <CardTitle className="text-xl">Stare inventar AI</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <MetricTile
                label="High-risk confirmate"
                value={aiHighRisk}
                tone="text-[var(--color-error)]"
                hint="Necesita control si scopul sau impactul intra in zona high-risk."
              />
              <MetricTile
                label="Minimal / limited confirmate"
                value={aiLowRisk}
                tone="text-[var(--status-success-text)]"
                hint="Sisteme deja intrate in inventarul oficial."
              />
              <MetricTile
                label="Detectii ce cer review"
                value={detectedActiveCount}
                tone="text-[var(--color-warning)]"
                hint="Autodiscovery a gasit candidate care trebuie validate uman."
              />
              <MetricTile
                label="Revizuite, neconfirmate"
                value={reviewedCount}
                tone="text-[var(--color-info)]"
                hint="Candidate deja ajustate, dar inca neintroduse in inventar."
              />
            </CardContent>
          </Card>

          <SectionDivider
            eyebrow="Inventar oficial"
            title="Sisteme confirmate, administrare si monitorizare"
            description="De aici incolo lucram doar cu inventarul oficial. Detectiile confirmate nu mai sunt candidate, ci sisteme asumate operational si urmarite fata de baseline."
            stats={[
              { label: "Confirmate", value: confirmedCount },
              { label: "High-risk", value: aiHighRisk },
              { label: "Limited / minimal", value: aiLowRisk },
            ]}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
              <CardHeader className="border-b border-[var(--color-border)] pb-5">
                <CardTitle className="text-xl">Inventar confirmat recent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {recentInventory.length === 0 && (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
                    Încă nu există sisteme confirmate în inventar. Confirmă mai întâi o detectie din fluxul activ sau adaugă manual un sistem nou dacă nu ai încă manifestul sursă.
                  </div>
                )}
                {recentInventory.map((system) => (
                  <div
                    key={system.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {system.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                          {system.vendor} · {formatPurposeLabel(system.purpose)}
                        </p>
                      </div>
                      <Badge
                        className={
                          system.riskLevel === "high"
                            ? "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                            : system.riskLevel === "limited"
                              ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                              : "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
                        }
                      >
                        {system.riskLevel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {system.modelType} · {system.hasHumanReview ? "cu review uman" : "fara review uman"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <AIInventoryPanel
            systems={cockpit.data.state.aiSystems}
            busy={cockpit.busy}
            onSubmit={cockpitActions.addAISystem}
            onRemove={cockpitActions.removeAISystem}
          />
        </>
      )}

      {viewMode === "baseline" && (
        <>
          <SectionDivider
            eyebrow="Baseline"
            title="Snapshot validat pentru comparatii curate"
            description="Stabilesti punctul de referinta pentru drift si inventar. Baseline-ul validat separa schimbarea reala de zgomotul operational."
            stats={[
              { label: "Baseline activ", value: validatedBaseline ? 1 : 0 },
              { label: "Sisteme confirmate", value: confirmedCount },
              { label: "Drift activ", value: recentDrifts.length },
            ]}
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="border-b border-[var(--color-border)] pb-5">
              <CardTitle className="text-xl">Baseline activ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                  {validatedBaseline
                    ? `Validat ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
                    : "Nu exista baseline validat"}
                </p>
                <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                  {validatedBaseline
                    ? "Drift-ul activ este comparat cu snapshot-ul validat uman."
                    : "Momentan drift-ul compara cu ultimul snapshot disponibil. Pentru comparatii curate, valideaza un baseline in Setari."}
                </p>
              </div>
              <Button asChild variant="outline" className="h-10 rounded-xl">
                <Link href="/dashboard/setari">
                  Gestioneaza baseline
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === "drift" && (
        <>
          <SectionDivider
            eyebrow="Drift"
            title="Schimbari fata de baseline"
            description="Drift-ul arata diferentele fata de snapshot-ul validat si prioritizeaza ce trebuie investigat imediat."
            stats={[
              { label: "Drift activ", value: recentDrifts.length },
              { label: "High-risk", value: aiHighRisk },
              { label: "Sisteme confirmate", value: confirmedCount },
            ]}
          />

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="border-b border-[var(--color-border)] pb-5">
              <CardTitle className="text-xl">Drift activ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    Semnale deschise
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-on-surface)]">
                    {recentDrifts.length} semnale deschise
                  </p>
                </div>
                <Button asChild variant="outline" className="h-10 rounded-xl">
                  <Link href="/dashboard/alerte">
                    Vezi drift-ul complet
                    <ArrowRight className="size-4" strokeWidth={2.25} />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
            <CardHeader className="border-b border-[var(--color-border)] pb-5">
              <CardTitle className="text-xl">Drift recent pe inventar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {recentDrifts.length === 0 && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--status-success-text)]">
                  Nu exista drift deschis pe inventarul AI in acest moment. Inventarul confirmat este stabil fata de baseline-ul curent.
                </div>
              )}
              {recentDrifts.map((drift) => (
                <div
                  key={drift.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">
                        {drift.summary}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {drift.systemLabel || drift.sourceDocument || "Inventar AI"} ·{" "}
                        {formatRelativeRomanian(drift.detectedAtISO)}
                      </p>
                    </div>
                    <Badge
                      className={
                        drift.severity === "critical" || drift.severity === "high"
                          ? "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                          : drift.severity === "medium"
                            ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                            : "border-[var(--color-border)] bg-transparent text-[var(--color-muted)]"
                      }
                    >
                      {drift.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === "pack" && cockpit.data.compliancePack && (
        <>
          <AICompliancePackSummaryCard pack={cockpit.data.compliancePack} compact />
          <ControlPackageHighlightsCard
            highlights={buildControlPackageHighlights(cockpit.data.compliancePack.entries)}
          />
          <AICompliancePackEntriesCard
            pack={cockpit.data.compliancePack}
            title="Pack pre-completat pentru review"
            editable
            busy={cockpit.busy}
            onUpdateField={cockpitActions.updateCompliancePackField}
          />
        </>
      )}

      {viewMode === "integrari" && (
        <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
          <CardHeader className="border-b border-[var(--color-border)] pb-5">
            <CardTitle className="text-xl">Integrari operationale</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <EFacturaValidatorCard
              validations={cockpit.data.state.efacturaValidations}
              busy={cockpit.busy}
              onValidate={cockpitActions.validateEFacturaXml}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ControlViewTabs({
  active,
  onChange,
}: {
  active: ControlViewMode
  onChange: (next: ControlViewMode) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={active === "discovery" ? "default" : "outline"}
        className="h-9 rounded-xl"
        onClick={() => onChange("discovery")}
      >
        Discovery
      </Button>
      <Button
        variant={active === "inventory" ? "default" : "outline"}
        className="h-9 rounded-xl"
        onClick={() => onChange("inventory")}
      >
        Sisteme AI
      </Button>
      <Button
        variant={active === "baseline" ? "default" : "outline"}
        className="h-9 rounded-xl"
        onClick={() => onChange("baseline")}
      >
        Baseline
      </Button>
      <Button
        variant={active === "drift" ? "default" : "outline"}
        className="h-9 rounded-xl"
        onClick={() => onChange("drift")}
      >
        Drift
      </Button>
      <Button
        variant={active === "pack" ? "default" : "outline"}
        className="h-9 rounded-xl"
        onClick={() => onChange("pack")}
      >
        Compliance Pack
      </Button>
      <Button
        variant={active === "integrari" ? "default" : "outline"}
        className="h-9 rounded-xl"
        onClick={() => onChange("integrari")}
      >
        Integrari
      </Button>
    </div>
  )
}

function SystemsGuideCard() {
  const steps = [
    {
      title: "1. Detectezi sursele reale",
      detail:
        "Pornesti din manifest sau lockfile, nu din memorie. Asa obtii provideri, framework-uri si candidate reale.",
    },
    {
      title: "2. Revizuiesti uman detectiile",
      detail:
        "Corectezi scopul, modelul, datele personale si nivelul de incredere inainte sa confirmi ceva in inventar.",
    },
    {
      title: "3. Confirmi si monitorizezi drift-ul",
      detail:
        "Dupa confirmare, sistemul intra in inventar si poate fi comparat curat fata de un baseline validat.",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Flux recomandat
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-on-surface)]">
            Detectie automata, confirmare umana, inventar stabil
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-muted)]">
            Pagina asta nu mai e doar o lista de carduri. E locul in care trecem de la manifestul sursa la un inventar AI credibil, cu baseline si drift usor de urmarit.
          </p>
        </div>
        <div className="grid gap-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
            >
              <p className="text-sm font-medium text-[var(--color-on-surface)]">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string
  value: number
  tone: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>
    </div>
  )
}

function SectionDivider({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow: string
  title: string
  description: string
  stats: Array<{ label: string; value: number }>
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--color-surface))]">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-on-surface)]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-muted)]">
            {description}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-on-surface)]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Sparkles
  title: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)]">
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--color-on-surface)]">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
            {detail}
          </p>
        </div>
      </div>
    </div>
  )
}

function ControlPackageHighlightsCard({
  highlights,
}: {
  highlights: Array<{
    groupKey: string
    groupLabel: string
    systemsCount: number
    highestPriority: "P1" | "P2" | "P3"
    ownerRoute: string
    bundleHint: string
    businessImpact: string
    familyLabels: string[]
  }>
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Pachete de control dominante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {highlights.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
            Încă nu există suficiente semnale pentru pachete de control pe grupuri. Confirmă un sistem sau completează câmpurile lipsă din pack, apoi aici vei vedea ce bundle domină pe fiecare categorie de sistem.
          </div>
        )}
        <div className="grid gap-4 xl:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.groupKey}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                  {highlight.groupLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={highlight.highestPriority === "P1"
                    ? "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                    : highlight.highestPriority === "P2"
                      ? "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]"
                      : "border-[var(--color-border)] bg-transparent text-[var(--color-muted)]"}>
                    {highlight.highestPriority}
                  </Badge>
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-muted)]">
                    {highlight.systemsCount} sisteme
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                {highlight.businessImpact}
              </p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                <span className="font-medium text-[var(--color-on-surface)]">Owner route:</span>{" "}
                {highlight.ownerRoute}
              </p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                <span className="font-medium text-[var(--color-on-surface)]">Bundle util:</span>{" "}
                {highlight.bundleHint}
              </p>
              {highlight.familyLabels.length > 0 && (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-on-surface)]">Familii:</span>{" "}
                  {highlight.familyLabels.join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function buildControlPackageHighlights(entries: AICompliancePackEntry[]) {
  const groups = new Map<
    string,
    {
      groupKey: string
      groupLabel: string
      systems: Set<string>
      highestPriority: "P1" | "P2" | "P3"
      ownerRoute: string
      bundleHint: string
      businessImpact: string
      familyLabels: Set<string>
    }
  >()

  for (const entry of entries) {
    for (const control of entry.compliance.suggestedControls) {
      const groupKey = control.systemGroup ?? "general-operations"
      const current = groups.get(groupKey) ?? {
        groupKey,
        groupLabel: formatSystemGroupLabel(groupKey),
        systems: new Set<string>(),
        highestPriority: control.priority,
        ownerRoute: control.ownerRoute ?? "Owner sistem + responsabil compliance",
        bundleHint:
          control.bundleHint ?? "Bundle recomandat: owner, dovadă operațională și confirmare a controlului.",
        businessImpact:
          control.businessImpact ??
          "Acest grup concentrează controalele care fac sistemele din aceeași zonă mai ușor de apărat în audit.",
        familyLabels: new Set<string>(),
      }

      current.systems.add(entry.systemName)
      if (priorityRank(control.priority) < priorityRank(current.highestPriority)) {
        current.highestPriority = control.priority
      }
      if (control.controlFamily?.label) current.familyLabels.add(control.controlFamily.label)
      if (control.ownerRoute) current.ownerRoute = control.ownerRoute
      if (control.bundleHint) current.bundleHint = control.bundleHint
      if (control.businessImpact) current.businessImpact = control.businessImpact

      groups.set(groupKey, current)
    }
  }

  return [...groups.values()]
    .map((group) => ({
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      systemsCount: group.systems.size,
      highestPriority: group.highestPriority,
      ownerRoute: group.ownerRoute,
      bundleHint: group.bundleHint,
      businessImpact: group.businessImpact,
      familyLabels: [...group.familyLabels],
    }))
    .sort((left, right) => {
      if (priorityRank(left.highestPriority) !== priorityRank(right.highestPriority)) {
        return priorityRank(left.highestPriority) - priorityRank(right.highestPriority)
      }
      if (right.systemsCount !== left.systemsCount) {
        return right.systemsCount - left.systemsCount
      }
      return left.groupLabel.localeCompare(right.groupLabel, "ro")
    })
    .slice(0, 3)
}

function formatSystemGroupLabel(value: string) {
  if (value === "customer-support") return "suport clienți"
  if (value === "hr-recruitment") return "HR / recrutare"
  if (value === "finance-operations") return "operațiuni financiare"
  if (value === "marketing-analytics") return "marketing / analytics"
  return "operațiuni generale"
}

function priorityRank(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") return 0
  if (priority === "P2") return 1
  return 2
}
