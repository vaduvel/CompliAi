"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { V3Pill } from "@/components/compliscan/v3/compat"
import { Button } from "@/components/evidence-os/Button"
import { V3Surface, V3SurfaceBody } from "@/components/compliscan/v3/compat"
import { V3Intro } from "@/components/compliscan/v3/compat"
import { SimpleTooltip } from "@/components/evidence-os"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { Nis2RescueBanner } from "@/components/compliscan/nis2-rescue-banner"
import { AssessmentTab } from "@/components/compliscan/nis2/AssessmentTab"
import { IncidentsTab } from "@/components/compliscan/nis2/IncidentsTab"
import { VendorsTab } from "@/components/compliscan/nis2/VendorsTab"
import {
  Nis2ProgressStepper,
  MaturityCard,
  GovernanceCard,
} from "@/components/compliscan/nis2/nis2-cards"
import {
  normalizeNis2TabValue,
  type Nis2TabValue,
} from "@/components/compliscan/nis2/nis2-shared"

export default function Nis2Page() {
  const searchParams = useSearchParams()
  const [orgName, setOrgName] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState<Nis2TabValue>("assessment")
  const requestedTab = normalizeNis2TabValue(searchParams.get("tab"))
  const highlightedIncidentId = searchParams.get("incidentId") ?? undefined
  const highlightedVendorId = searchParams.get("vendorId") ?? undefined
  const highlightedVendorName = searchParams.get("vendor") ?? undefined
  const rawFocusMode = searchParams.get("focus")
  const focusMode =
    rawFocusMode === "anspdcp" || rawFocusMode === "incident" || rawFocusMode === "vendor"
      ? rawFocusMode
      : undefined
  const assessmentFocus = searchParams.get("focus") === "assessment"
  const sourceFindingId = searchParams.get("findingId") ?? undefined
  const returnTo = searchParams.get("returnTo") ?? undefined

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { orgName?: string }) => {
        if (d.orgName) setOrgName(d.orgName)
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    setActiveTab(requestedTab)
  }, [requestedTab])

  return (
    <div className="space-y-6">
      <V3Intro
        eyebrow={
          <SimpleTooltip content="Network and Information Security Directive 2 — Directiva UE 2022/2555">
            <span className="cursor-help border-b border-dotted border-current">NIS2</span>
          </SimpleTooltip>
        }
        title="Directiva NIS2 — Securitate cibernetică"
        description="Instrument de evaluare și monitorizare pentru conformitatea cu Directiva NIS2 (2022/2555) și ghidul DNSC. Evaluare, incident log cu SLA tracking și registrul furnizorilor ICT."
        badges={
          <>
            <V3Pill variant="outline" className="normal-case tracking-normal">
              Directiva (UE) 2022/2555
            </V3Pill>
            <V3Pill variant="outline" className="normal-case tracking-normal">
              DNSC Romania
            </V3Pill>
          </>
        }
      />

      {sourceFindingId && activeTab === "assessment" && assessmentFocus ? (
        <V3Surface className="border-eos-warning/30 bg-eos-warning/5">
          <V3SurfaceBody className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-eos-text">Evaluarea NIS2 este deschisă din cockpit</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Completează assessment-ul NIS2. După salvare, revii automat în același finding pentru închidere.
              </p>
            </div>
            <Link
              href={returnTo ?? `/dashboard/resolve/${sourceFindingId}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-eos-primary hover:underline"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Înapoi la finding
            </Link>
          </V3SurfaceBody>
        </V3Surface>
      ) : null}

      {/* Eligibility CTA — link to wizard page */}
      <V3Surface className="border-eos-primary/30 bg-eos-primary/5">
        <V3SurfaceBody className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Verifică dacă firma ta intră sub NIS2</p>
            <p className="mt-0.5 text-xs text-eos-text-muted">Wizard rapid — 3 întrebări bazate pe OUG 155/2024</p>
          </div>
          <Link href="/dashboard/nis2/eligibility">
            <Button size="sm" className="shrink-0 gap-1.5 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover">
              <ShieldAlert className="size-4" strokeWidth={2} />
              Verifică eligibilitatea
            </Button>
          </Link>
        </V3SurfaceBody>
      </V3Surface>

      <Nis2ProgressStepper />
      <Nis2RescueBanner />
      <MaturityCard />
      <GovernanceCard />

      <Tabs
        value={activeTab}
        onValueChange={(next: string) => setActiveTab(normalizeNis2TabValue(next))}
        className="space-y-5"
      >
        <TabsList className="border-b border-eos-border">
          <TabsTrigger value="assessment" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Evaluare</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">Gap analysis NIS2</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Incidente</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">SLA 24h / 72h DNSC</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Furnizori ICT</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">Registru lanț aprovizionare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <AssessmentTab orgName={orgName} sourceFindingId={sourceFindingId} returnTo={returnTo} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsTab
            orgName={orgName}
            highlightedIncidentId={highlightedIncidentId}
            focusMode={focusMode === "anspdcp" || focusMode === "incident" ? focusMode : undefined}
            sourceFindingId={sourceFindingId}
            returnTo={returnTo}
          />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsTab
            highlightedVendorId={highlightedVendorId}
            highlightedVendorName={highlightedVendorName}
            focusMode={focusMode === "vendor" ? "vendor" : undefined}
            sourceFindingId={sourceFindingId}
            returnTo={returnTo}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
