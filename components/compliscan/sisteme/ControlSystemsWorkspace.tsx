"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { AIActEvidencePackCard } from "@/components/compliscan/ai-act-evidence-pack-card"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { AISystemPurpose } from "@/lib/compliance/types"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { classifyAISystem, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from "@/lib/compliance/ai-act-classifier"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import { cn } from "@/lib/utils"
import type {
  ControlPrimaryViewMode,
  SystemsSubViewMode,
  UpdateCompliancePackFieldInput,
} from "./sisteme-shared"
import { ControlPackageHighlightsCard, buildControlPackageHighlights } from "./sisteme-shared"
import { SystemsLinearStepper } from "./control-nav"

const AICompliancePackEntriesCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackEntriesCard
    ),
  { loading: () => <LoadingScreen variant="section" /> }
)

export function ControlSystemsWorkspace({
  active,
  onChange,
  detectedActiveCount,
  reviewedCount,
  confirmedCount,
  aiHighRisk,
  aiLowRisk,
  validatedBaseline,
  recentDriftsCount,
  recentInventory,
  discoveryPanel,
  inventoryPanel,
  compliancePack,
  onUpdateCompliancePackField,
  busy,
  onOpenReview,
  onOpenDrift,
}: {
  active: SystemsSubViewMode
  onChange: (next: SystemsSubViewMode) => void
  detectedActiveCount: number
  reviewedCount: number
  confirmedCount: number
  aiHighRisk: number
  aiLowRisk: number
  validatedBaseline: { generatedAt: string } | undefined
  recentDriftsCount: number
  recentInventory: Array<{
    id: string
    name: string
    vendor: string
    purpose: AISystemPurpose
    riskLevel: string
    modelType: string
    hasHumanReview: boolean
  }>
  discoveryPanel: React.ReactNode
  inventoryPanel: React.ReactNode
  compliancePack: AICompliancePack | null
  onUpdateCompliancePackField: (input: UpdateCompliancePackFieldInput) => Promise<unknown>
  busy: boolean
  onOpenReview: () => void
  onOpenDrift: () => void
}) {
  return (
    <div className="space-y-6">
      <SectionBoundary
        eyebrow="Sisteme"
        title="Candidatele, inventarul, compliance pack și baseline-ul stau pe același fir de confirmare"
        description="Parcurgi pașii în ordine: mai întâi descoperi, confirmi, fixezi reperul și revizuiești pack-ul."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {confirmedCount} confirmate
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {detectedActiveCount} detecții active
            </Badge>
          </>
        }
        support={
          <SystemsLinearStepper
            active={active}
            onChange={onChange}
            detectedActiveCount={detectedActiveCount}
            confirmedCount={confirmedCount}
            validatedBaseline={Boolean(validatedBaseline)}
            compliancePack={compliancePack}
          />
        }
      />

      {active === "discovery" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Discovery"
                title="Candidate detectate automat"
                description="Aici lucrezi pe work queue-ul de detecție. Corectezi și validezi doar ce merită să devină sistem oficial."
                items={[
                  {
                    label: "Detecții active",
                    value: `${detectedActiveCount}`,
                    hint: "candidate care încă nu au fost confirmate sau respinse",
                    tone: detectedActiveCount > 0 ? "warning" : "neutral",
                  },
                  {
                    label: "Revizuite",
                    value: `${reviewedCount}`,
                    hint: "candidate deja ajustate de operator",
                  },
                  {
                    label: "Drift asociat",
                    value: `${recentDriftsCount}`,
                    hint: "semnale noi care cer verificare dupa confirmare",
                    tone: recentDriftsCount > 0 ? "danger" : "success",
                  },
                ]}
              />
            </CardContent>
          </Card>

          {discoveryPanel}

          <HandoffCard
            title="După Discovery continui în Inventar"
            description="Ce a fost confirmat uman trebuie să intre în inventarul oficial, nu să rămână blocat în candidate."
            destinationLabel="inventar oficial"
            checklist={[
              "confirmi scopul și modelul",
              "verifici nivelul de risc și review uman",
              "muți doar sistemele curate în inventar",
            ]}
            actions={
              <>
                <Button onClick={() => onChange("inventory")}>Mergi la Inventar</Button>
                <Button variant="outline" onClick={onOpenReview}>
                  Vezi Queue de Review
                </Button>
              </>
            }
          />
        </div>
      )}

      {active === "inventory" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Inventar oficial"
                title="Sisteme asumate operațional"
                description="De aici încolo nu mai lucrezi cu candidate, ci cu inventarul confirmat care susține baseline-ul și drift-ul."
                items={[
                  {
                    label: "Confirmate",
                    value: `${confirmedCount}`,
                    hint: "sisteme deja intrate în inventarul oficial",
                    tone: confirmedCount > 0 ? "success" : "neutral",
                  },
                  {
                    label: "High-risk",
                    value: `${aiHighRisk}`,
                    hint: "cer control și urmărire prioritară",
                    tone: aiHighRisk > 0 ? "danger" : "success",
                  },
                  {
                    label: "Limited / minimal",
                    value: `${aiLowRisk}`,
                    hint: "rămân în inventar, dar cu presiune de control mai mică",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border pb-5">
              <CardTitle className="text-xl">Inventar confirmat recent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {recentInventory.length === 0 && (
                <EmptyState
                  title="Niciun sistem confirmat încă"
                  label="Confirmă mai întâi o detecție din Discovery sau adaugă manual un sistem nou dacă sursa tehnică lipsește."
                  className="border-eos-border bg-eos-surface-variant py-8"
                />
              )}
              {recentInventory.map((system) => {
                const aiActClass = classifyAISystem(system.purpose)
                return (
                  <DenseListItem key={system.id} className="bg-eos-surface-variant">
                    <div className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="break-words text-sm font-semibold text-eos-text">
                            {system.name}
                          </p>
                          <p className="mt-1 text-sm text-eos-text-muted [overflow-wrap:anywhere]">
                            {system.vendor} · {formatPurposeLabel(system.purpose)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            system.riskLevel === "high"
                              ? "destructive"
                              : system.riskLevel === "limited"
                                ? "warning"
                                : "success"
                          }
                        >
                          {system.riskLevel}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-eos-text-muted [overflow-wrap:anywhere]">
                        {system.modelType} · {system.hasHumanReview ? "cu review uman" : "fără review uman"}
                      </p>
                      {/* GOLD 8 — AI Act classification (propusa, nu verdict final) */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${RISK_LEVEL_COLORS[aiActClass.riskLevel]}`}
                        >
                          {RISK_LEVEL_LABELS[aiActClass.riskLevel]}
                        </span>
                        <span className="text-[11px] text-eos-text-muted">
                          {aiActClass.article} · propus automat — confirmă
                        </span>
                        {aiActClass.riskLevel === "high_risk" && (
                          <Link
                            href={`/dashboard/sisteme/eu-db-wizard?system=${system.id}`}
                            className="text-[11px] font-medium text-eos-primary underline-offset-2 hover:underline"
                          >
                            Pregătire EU DB → deadline 2 aug 2026
                          </Link>
                        )}
                        {aiActClass.riskLevel === "prohibited" && (
                          <span className="text-[11px] font-semibold text-eos-error">
                            Verifică imediat — posibil interzis
                          </span>
                        )}
                      </div>
                    </div>
                  </DenseListItem>
                )
              })}
            </CardContent>
          </Card>

          {inventoryPanel}
        </div>
      )}

      {active === "baseline" && (
        <div className="space-y-6">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="px-5 py-5">
              <SummaryStrip
                eyebrow="Baseline"
                title="Reperul față de care comparăm schimbarea reală"
                description="Baseline-ul validat separă drift-ul real de zgomotul operațional și dă încredere inventarului."
                items={[
                  {
                    label: "Status",
                    value: validatedBaseline
                      ? `validat ${new Date(validatedBaseline.generatedAt).toLocaleString("ro-RO")}`
                      : "nu există baseline validat",
                    hint: validatedBaseline
                      ? "comparațiile actuale folosesc snapshot-ul validat uman"
                      : "fără baseline validat, drift-ul rămâne mai greu de interpretat",
                    tone: validatedBaseline ? "success" : "warning",
                  },
                  {
                    label: "Inventar confirmat",
                    value: `${confirmedCount}`,
                    hint: "numărul de sisteme care intră în snapshot",
                  },
                  {
                    label: "Drift deschis",
                    value: `${recentDriftsCount}`,
                    hint: "semnale deschise față de snapshot-ul curent",
                    tone: recentDriftsCount > 0 ? "danger" : "success",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <HandoffCard
            title={validatedBaseline ? "Baseline-ul este gata pentru Drift" : "Mai întâi validezi baseline-ul"}
            description={
              validatedBaseline
                ? "După ce ai reperul validat, schimbările merg în Drift și nu mai poluează Discovery sau inventarul."
                : "Momentan baseline-ul se gestionează din Setări. După validare, revii aici doar pentru comparații curate și explicabile."
            }
            destinationLabel={validatedBaseline ? "drift" : "setari / operational"}
            checklist={
              validatedBaseline
                ? [
                    "urmărești schimbările față de snapshot",
                    "nu refaci inventarul de la zero",
                    "trimiți doar abaterile reale spre remediere",
                  ]
                : [
                    "validezi snapshot-ul cu review uman",
                    "fixezi baseline-ul operațional",
                    "revii apoi în Control pentru comparații curate",
                  ]
            }
            actions={
              <>
                {validatedBaseline ? (
                  <Button variant="outline" onClick={onOpenDrift}>
                    Vezi Drift
                  </Button>
                ) : null}
                <Button asChild>
                  <Link href={dashboardRoutes.settings}>
                    Gestionează Baseline
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
              </>
            }
          />
        </div>
      )}

      {active === "pack" && (
        <div className="space-y-6">
          <SectionBoundary
            eyebrow="Compliance Pack"
            title="Review pe câmpuri și pachete de control"
            description="Confirmi câmpurile și controalele per sistem. Starea de audit și exportul rămân în Audit și export."
          />

          {compliancePack ? (
            <>
              <ControlPackageHighlightsCard
                highlights={buildControlPackageHighlights(compliancePack.entries)}
              />
              <AICompliancePackEntriesCard
                pack={compliancePack}
                title="Pack pre-completat pentru review"
                editable
                busy={busy}
                onUpdateField={onUpdateCompliancePackField}
              />
              <AIActEvidencePackCard />
              <HandoffCard
                title="După review continui în Dovadă"
                description="Compliance Pack rămâne review de control. Livrabilul final și exporturile rămân în Dovadă, nu în aceeași suprafață."
                destinationLabel="dovadă / audit pack"
                checklist={[
                  "confirmi câmpurile importante",
                  "separi review-ul de exportul final",
                  "împingi mai departe doar un pack curat și inteligibil",
                ]}
                actions={
                  <Button asChild>
                    <Link href={dashboardRoutes.dosar}>
                      Mergi la Dosar
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </Link>
                  </Button>
                }
              />
            </>
          ) : (
            <EmptyState
              title="Compliance Pack indisponibil"
              label="Solicită payload-ul complet sau confirmă mai întâi suficiente sisteme pentru review de control."
              className="border-eos-border bg-eos-surface py-10"
            />
          )}
        </div>
      )}
    </div>
  )
}
