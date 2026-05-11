"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileCode2,
  FileText,
  Loader2,
  PlugZap,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { AuditRiskPanel } from "@/components/compliscan/fiscal/AuditRiskPanel"
import { FiscalExecutionLogCard } from "@/components/compliscan/fiscal-execution-log-card"
import { FiscalStatusInterpreterCard } from "@/components/compliscan/fiscal-status-interpreter-card"
import { EFacturaValidatorCard } from "@/components/compliscan/efactura-validator-card"
import { DiscrepanciesTab } from "@/components/compliscan/fiscal/DiscrepanciesTab"
import { FilingRecordsTab } from "@/components/compliscan/fiscal/FilingRecordsTab"
import { SpvCheckTab } from "@/components/compliscan/fiscal/SpvCheckTab"
import { EFacturaSignalsTab } from "@/components/compliscan/fiscal/EFacturaSignalsTab"
import { BulkZipUploadCard } from "@/components/compliscan/fiscal/BulkZipUploadCard"
import { CrossFilingCheckCard } from "@/components/compliscan/fiscal/CrossFilingCheckCard"
import { ErpSpvReconcileCard } from "@/components/compliscan/fiscal/ErpSpvReconcileCard"
import { FrequencyCheckCard } from "@/components/compliscan/fiscal/FrequencyCheckCard"
import { FiscalAssistantTrigger } from "@/components/compliscan/fiscal/FiscalAssistantPanel"
import { OblioConnectCard } from "@/components/compliscan/fiscal/OblioConnectCard"
import { PfaForm082Panel } from "@/components/compliscan/fiscal/PfaForm082Panel"
import { SaftHygieneTab } from "@/components/compliscan/fiscal/SaftHygieneTab"
import { SagaImportCard } from "@/components/compliscan/fiscal/SagaImportCard"
import { SmartBillConnectCard } from "@/components/compliscan/fiscal/SmartBillConnectCard"
import { SubmitSpvTab } from "@/components/compliscan/fiscal/SubmitSpvTab"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { buildFiscalStatusInterpreterGuide } from "@/lib/compliance/efactura-status-interpreter"
import type {
  EFacturaValidationRecord,
  EFacturaXmlRepairRecord,
  ScanFinding,
} from "@/lib/compliance/types"

export default function FiscalPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const findingIdParam = searchParams.get("findingId")
  const anafStatusParam = searchParams.get("anaf")
  const anafModeParam = searchParams.get("mode")
  const [validatorBusy, setValidatorBusy] = useState(false)
  const [repairBusy, setRepairBusy] = useState(false)
  const [validations, setValidations] = useState<EFacturaValidationRecord[]>([])
  const [statusFinding, setStatusFinding] = useState<ScanFinding | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const fromCockpit =
    (tabParam === "spv" || tabParam === "validator" || tabParam === "status" || tabParam === "transmitere") &&
    Boolean(findingIdParam)
  const defaultTab =
    tabParam === "spv" ||
    tabParam === "validator" ||
    tabParam === "status" ||
    tabParam === "transmitere" ||
    tabParam === "semnale" ||
    tabParam === "saft" ||
    tabParam === "integrari" ||
    tabParam === "discrepante" ||
    tabParam === "depuneri" ||
    tabParam === "pfa"
      ? tabParam
      : "discrepante"

  useEffect(() => {
    if (!anafStatusParam) return
    if (anafStatusParam === "connected") {
      toast.success("ANAF conectat", {
        description:
          anafModeParam === "real"
            ? "Conexiunea a fost autorizată pentru producție."
            : "Conexiunea a fost autorizată pentru sandbox-ul oficial ANAF.",
      })
      return
    }

    const descriptions: Record<string, string> = {
      "missing-config": "Lipsesc variabilele ANAF pentru a porni conectarea.",
      "missing-code": "ANAF nu a returnat codul de autorizare.",
      "missing-org": "Nu am putut lega autorizarea de organizația curentă.",
      "token-failed": "Schimbul de token ANAF a eșuat.",
      "oauth-error": "Autorizarea a fost anulată sau respinsă în portalul ANAF.",
    }
    toast.error("Conectare ANAF eșuată", {
      description: descriptions[anafStatusParam] ?? "Autorizarea ANAF nu a putut fi finalizată.",
    })
  }, [anafModeParam, anafStatusParam])

  useEffect(() => {
    if (tabParam !== "status" || !findingIdParam) {
      setStatusFinding(null)
      return
    }

    setStatusLoading(true)
    fetch(`/api/findings/${encodeURIComponent(findingIdParam)}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Nu am putut încărca finding-ul fiscal.")
        return response.json() as Promise<{ finding: ScanFinding }>
      })
      .then((payload) => {
        setStatusFinding(payload.finding)
      })
      .catch(() => {
        setStatusFinding(null)
        toast.error("Nu am putut încărca protocolul fiscal.")
      })
      .finally(() => setStatusLoading(false))
  }, [findingIdParam, tabParam])

  async function handleValidateXml(input: { documentName: string; xml: string }) {
    setValidatorBusy(true)
    try {
      const response = await fetch("/api/efactura/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as {
        error?: string
        message?: string
        validation?: EFacturaValidationRecord
      }
      if (!response.ok) throw new Error(payload.error || "Validarea XML a eșuat.")
      if (payload.validation) {
        setValidations((current) => [payload.validation!, ...current.filter((item) => item.id !== payload.validation!.id)].slice(0, 10))
      }
      const isValid = payload.validation?.valid ?? false
      const description =
        payload.message ||
        (isValid
          ? "Factura trece validarea structurală de bază."
          : "Corectează XML-ul și validează din nou înainte de transmitere.")
      // id deduplică toast-urile — re-validarea înlocuiește toast-ul curent
      // în loc să-l stivuiască peste cele existente.
      if (isValid) {
        toast.success("XML validat", { id: "efactura-validation", description })
      } else {
        toast.error("XML cu probleme", { id: "efactura-validation", description })
      }
      return payload.validation ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la validarea XML."
      toast.error("Validare eșuată", { description: message })
      throw error
    } finally {
      setValidatorBusy(false)
    }
  }

  async function handleRepairXml(input: {
    documentName: string
    xml: string
    errorCodes?: string[]
  }) {
    setRepairBusy(true)
    try {
      const response = await fetch("/api/efactura/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as {
        error?: string
        message?: string
        repair?: EFacturaXmlRepairRecord
      }
      if (!response.ok) throw new Error(payload.error || "Nu am putut genera corecțiile XML.")
      toast.success(
        payload.repair && payload.repair.appliedFixes.length > 0 ? "Corecții XML pregătite" : "Nu există fixuri automate sigure",
        {
          description:
            payload.message ||
            (payload.repair && payload.repair.appliedFixes.length > 0
              ? "Revizuiește XML-ul reparat și retransmite-l manual."
              : "Corecția rămâne manuală în ERP sau în exportul XML."),
        }
      )
      return payload.repair ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la generarea corecțiilor XML."
      toast.error("Reparare eșuată", { description: message })
      throw error
    } finally {
      setRepairBusy(false)
    }
  }

  const statusRecipe = statusFinding ? buildCockpitRecipe(statusFinding) : null
  const statusGuide =
    statusFinding && statusRecipe
      ? buildFiscalStatusInterpreterGuide(statusRecipe.findingTypeId, statusFinding)
      : null

  const fromCockpitHintText =
    tabParam === "validator"
      ? "Validează sau repară XML-ul de mai jos, apoi folosește nota pregătită de CompliScan când revii în finding cu confirmarea retransmiterii și statusul SPV."
      : tabParam === "status"
        ? "Urmează protocolul fiscal de mai jos, apoi revino în cockpit cu nota pregătită și dovada finală din SPV."
        : tabParam === "transmitere"
          ? "Creezi și execuți draftul de transmitere pentru cazul fiscal curent. Draftul rămâne legat de finding și poți reveni aici după aprobare sau verdict."
          : "Rulează verificarea SPV de mai jos pentru a confirma statusul. Dovada obținută o poți adăuga direct în finding."

  return (
    <div className="space-y-6">
      <FiscalAssistantTrigger />
      <V3PageHero
        breadcrumbs={[{ label: "Firma mea" }, { label: "Fiscal", current: true }]}
        title="Monitorizezi conformitatea fiscala"
        description="Discrepante e-TVA, depuneri fiscale si scor de disciplina. Urmaresti termenele ANAF si documentezi raspunsurile."
        eyebrowBadges={
          <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
            ANAF · e-TVA · SAF-T
          </span>
        }
      />

      {fromCockpit && (
        <section className="flex items-start gap-3 overflow-hidden rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft px-4 py-3.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p
              data-display-text="true"
              className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Vii din cockpit pentru un finding fiscal
            </p>
            <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
              {fromCockpitHintText}
            </p>
          </div>
          <a
            href={`/dashboard/resolve/${findingIdParam}`}
            className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
          >
            <ArrowLeft className="size-3" strokeWidth={2} />
            Inapoi la finding
          </a>
        </section>
      )}

      {/* Audit Risk Score — F#1 Sprint 8-9 (2026-05-11).
          Hero card cu scor 0-100 + breakdown explicabil (CECCAR Art. 14).
          Vizibil doar pe overview (fără tabParam) ca să nu dubleze contextul. */}
      {!tabParam && (
        <section>
          <AuditRiskPanel />
        </section>
      )}

      {/* Cockpit Quick Actions — Sprint 0 IA restructure (2026-05-11).
          Vizibil DOAR în mod overview (fără tabParam din URL). Pe sub-rute
          (?tab=X) acest card ascuns ca să nu dubleze contextul. */}
      {!tabParam && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CockpitQuickActionCard
            href="/dashboard/fiscal/validare"
            title="Validare & emitere"
            description="Validator UBL CIUS-RO + Bulk ZIP + Semnale e-Factura."
          />
          <CockpitQuickActionCard
            href="/dashboard/fiscal/transmitere"
            title="Transmitere & SPV"
            description="Submit ANAF cu dublă aprobare + status SPV real-time."
          />
          <CockpitQuickActionCard
            href="/dashboard/fiscal/tva-declaratii"
            title="TVA & declarații"
            description="Discrepanțe e-TVA + depuneri D300/D406 + SAF-T hygiene."
          />
          <CockpitQuickActionCard
            href="/dashboard/fiscal/integrari"
            title="Integrări ERP"
            description="SmartBill / Oblio / Saga + reconciliere SPV."
          />
          <CockpitQuickActionCard
            href="/dashboard/fiscal/deadline-urgent"
            title="Deadline urgent"
            description="PFA Form 082 (26 mai 2026) + calendar termene."
            urgent
          />
        </section>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        {/* Sprint 0 IA restructure (2026-05-11): TabsList ascuns vizual cu sr-only.
            Navigarea se face din sidebar (7 sub-link-uri grupate). Radix Tabs
            păstrează TabsList pentru accesibilitate (keyboard nav, screen readers)
            dar nu mai e render-uit vizual ca să elimine cognitive overload-ul
            celor 10 tab-uri orizontale. */}
        <TabsList className="sr-only !min-h-0 !border-b-0 !bg-transparent">
          <TabsTrigger
            value="discrepante"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <AlertTriangle className="size-3.5" strokeWidth={2} />
            Discrepante e-TVA
          </TabsTrigger>
          <TabsTrigger
            value="depuneri"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <FileText className="size-3.5" strokeWidth={2} />
            Depuneri fiscale
          </TabsTrigger>
          <TabsTrigger
            value="spv"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <ShieldCheck className="size-3.5" strokeWidth={2} />
            SPV Check
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <Clock className="size-3.5" strokeWidth={2} />
            Protocol fiscal
          </TabsTrigger>
          <TabsTrigger
            value="validator"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <FileCode2 className="size-3.5" strokeWidth={2} />
            Validator XML
          </TabsTrigger>
          <TabsTrigger
            value="semnale"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <Radio className="size-3.5" strokeWidth={2} />
            Semnale e-Factura
          </TabsTrigger>
          <TabsTrigger
            value="transmitere"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <Send className="size-3.5" strokeWidth={2} />
            Transmitere ANAF
          </TabsTrigger>
          <TabsTrigger
            value="saft"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <Sparkles className="size-3.5" strokeWidth={2} />
            SAF-T Hygiene
          </TabsTrigger>
          <TabsTrigger
            value="integrari"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <PlugZap className="size-3.5" strokeWidth={2} />
            Integrări
          </TabsTrigger>
          <TabsTrigger
            value="pfa"
            className="h-[30px] gap-1.5 rounded-eos-sm border-b-0 px-2.5 py-0 text-[12px] font-medium data-[state=active]:border-b-0 data-[state=active]:bg-white/[0.06] data-[state=active]:font-semibold data-[state=active]:text-eos-text"
          >
            <FileText className="size-3.5" strokeWidth={2} />
            PFA / Form 082
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discrepante">
          <DiscrepanciesTab />
        </TabsContent>

        <TabsContent value="depuneri">
          <div className="space-y-4">
            <FrequencyCheckCard />
            <CrossFilingCheckCard />
            <FilingRecordsTab />
          </div>
        </TabsContent>

        <TabsContent value="spv">
          <SpvCheckTab />
        </TabsContent>

        <TabsContent value="status">
          {statusLoading ? (
            <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Se incarca protocolul fiscal...
            </div>
          ) : !findingIdParam ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
                <Clock className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
              </div>
              <div className="max-w-md space-y-1">
                <p
                  data-display-text="true"
                  className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Deschide protocolul fiscal dintr-un finding
                </p>
                <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
                  Tab-ul acesta se foloseste cand vii din cockpit pentru EF-004 sau EF-005.
                </p>
              </div>
            </div>
          ) : !statusGuide ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border border-eos-warning/30 bg-eos-warning-soft">
                <AlertTriangle className="size-4 text-eos-warning" strokeWidth={1.8} />
              </div>
              <div className="max-w-md space-y-1">
                <p
                  data-display-text="true"
                  className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Protocol indisponibil pentru finding-ul curent
                </p>
                <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
                  Protocolul fiscal din aceasta suprafata este disponibil momentan pentru cazurile EF-004 si EF-005.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FiscalStatusInterpreterCard guide={statusGuide} findingId={findingIdParam} />
              <FiscalExecutionLogCard
                findingId={findingIdParam}
                findingTypeId={statusGuide.findingTypeId}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="validator">
          <div className="space-y-4">
            <BulkZipUploadCard />
            <EFacturaValidatorCard
              validations={validations}
              busy={validatorBusy}
              repairBusy={repairBusy}
              onValidate={handleValidateXml}
              onRepair={handleRepairXml}
            />
          </div>
        </TabsContent>

        <TabsContent value="semnale">
          <EFacturaSignalsTab />
        </TabsContent>

        <TabsContent value="transmitere">
          <SubmitSpvTab
            sourceFindingId={findingIdParam}
            fromCockpit={tabParam === "transmitere" && Boolean(findingIdParam)}
            returnToFindingHref={findingIdParam ? `/dashboard/resolve/${findingIdParam}` : null}
          />
        </TabsContent>

        <TabsContent value="saft">
          <SaftHygieneTab />
        </TabsContent>

        <TabsContent value="integrari">
          <div className="space-y-4">
            <SmartBillConnectCard />
            <OblioConnectCard />
            <ErpSpvReconcileCard />
            <SagaImportCard />
          </div>
        </TabsContent>

        <TabsContent value="pfa">
          <PfaForm082Panel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sprint 0 IA — card simplu folosit în cockpit overview pentru sub-pagini fiscal.
function CockpitQuickActionCard({
  href,
  title,
  description,
  urgent = false,
}: {
  href: string
  title: string
  description: string
  urgent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-eos-lg border bg-eos-surface p-4 transition-all duration-150 hover:bg-eos-surface-elevated ${
        urgent
          ? "border-eos-warning/30 hover:border-eos-warning"
          : "border-eos-border hover:border-eos-border-strong"
      }`}
    >
      <p
        data-display-text="true"
        className={`font-display text-[14px] font-semibold tracking-[-0.015em] ${
          urgent ? "text-eos-warning" : "text-eos-text"
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">{description}</p>
      <p
        className={`mt-3 inline-flex items-center gap-1 font-mono text-[10.5px] font-medium ${
          urgent ? "text-eos-warning" : "text-eos-primary"
        }`}
      >
        Deschide →
      </p>
    </Link>
  )
}
