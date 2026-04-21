"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileCode2,
  FileText,
  Loader2,
  Radio,
  Send,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { FiscalExecutionLogCard } from "@/components/compliscan/fiscal-execution-log-card"
import { FiscalStatusInterpreterCard } from "@/components/compliscan/fiscal-status-interpreter-card"
import { EFacturaValidatorCard } from "@/components/compliscan/efactura-validator-card"
import { DiscrepanciesTab } from "@/components/compliscan/fiscal/DiscrepanciesTab"
import { FilingRecordsTab } from "@/components/compliscan/fiscal/FilingRecordsTab"
import { SpvCheckTab } from "@/components/compliscan/fiscal/SpvCheckTab"
import { EFacturaSignalsTab } from "@/components/compliscan/fiscal/EFacturaSignalsTab"
import { SubmitSpvTab } from "@/components/compliscan/fiscal/SubmitSpvTab"
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
    tabParam === "semnale"
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
      toast.success(payload.validation?.valid ? "XML validat" : "XML cu probleme", {
        description:
          payload.message ||
          (payload.validation?.valid
            ? "Factura trece validarea structurală de bază."
            : "Corectează XML-ul și validează din nou înainte de transmitere."),
      })
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

  return (
    <div className="space-y-8">
      {fromCockpit && (
        <div className="flex items-start gap-3 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-eos-text">
              Vii din cockpit pentru un finding fiscal
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              {tabParam === "validator"
                ? "Validează sau repară XML-ul de mai jos, apoi folosește nota pregătită de CompliAI când revii în finding cu confirmarea retransmiterii și statusul SPV."
                : tabParam === "status"
                  ? "Urmează protocolul fiscal de mai jos, apoi revino în cockpit cu nota pregătită și dovada finală din SPV."
                  : tabParam === "transmitere"
                    ? "Creezi și execuți draftul de transmitere pentru cazul fiscal curent. Draftul rămâne legat de finding și poți reveni aici după aprobare sau verdict."
                    : "Rulează verificarea SPV de mai jos pentru a confirma statusul. Dovada obținută o poți adăuga direct în finding."}
            </p>
          </div>
          <a
            href={`/dashboard/actiuni/remediere/${findingIdParam}`}
            className="flex shrink-0 items-center gap-1 text-xs text-eos-primary hover:underline"
          >
            <ArrowLeft className="size-3" />
            Înapoi la finding
          </a>
        </div>
      )}

      <PageIntro
        eyebrow="Fiscal"
        title="Monitorizezi conformitatea fiscala"
        description="Discrepante e-TVA, depuneri fiscale si scor de disciplina. Urmaresti termenele ANAF si documentezi raspunsurile."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            ANAF · e-TVA · SAF-T
          </Badge>
        }
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="gap-0 border-b border-eos-border text-eos-text-muted">
          <TabsTrigger
            value="discrepante"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <AlertTriangle className="mr-1.5 size-3.5" />
            Discrepante e-TVA
          </TabsTrigger>
          <TabsTrigger
            value="depuneri"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <FileText className="mr-1.5 size-3.5" />
            Depuneri fiscale
          </TabsTrigger>
          <TabsTrigger
            value="spv"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <ShieldCheck className="mr-1.5 size-3.5" />
            SPV Check
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <Clock className="mr-1.5 size-3.5" />
            Protocol fiscal
          </TabsTrigger>
          <TabsTrigger
            value="validator"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <FileCode2 className="mr-1.5 size-3.5" />
            Validator XML
          </TabsTrigger>
          <TabsTrigger
            value="semnale"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <Radio className="mr-1.5 size-3.5" />
            Semnale e-Factura
          </TabsTrigger>
          <TabsTrigger
            value="transmitere"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <Send className="mr-1.5 size-3.5" />
            Transmitere ANAF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discrepante">
          <DiscrepanciesTab />
        </TabsContent>

        <TabsContent value="depuneri">
          <FilingRecordsTab />
        </TabsContent>

        <TabsContent value="spv">
          <SpvCheckTab />
        </TabsContent>

        <TabsContent value="status">
          {statusLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted">
              <Loader2 className="size-4 animate-spin" />
              Se încarcă protocolul fiscal...
            </div>
          ) : !findingIdParam ? (
            <EmptyState
              icon={Clock}
              title="Deschide protocolul fiscal dintr-un finding"
              label="Tab-ul acesta se folosește când vii din cockpit pentru EF-004 sau EF-005."
            />
          ) : !statusGuide ? (
            <EmptyState
              icon={AlertTriangle}
              title="Protocol indisponibil pentru finding-ul curent"
              label="Protocolul fiscal din această suprafață este disponibil momentan pentru cazurile EF-004 și EF-005."
            />
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
          <EFacturaValidatorCard
            validations={validations}
            busy={validatorBusy}
            repairBusy={repairBusy}
            onValidate={handleValidateXml}
            onRepair={handleRepairXml}
          />
        </TabsContent>

        <TabsContent value="semnale">
          <EFacturaSignalsTab />
        </TabsContent>

        <TabsContent value="transmitere">
          <SubmitSpvTab
            sourceFindingId={findingIdParam}
            fromCockpit={tabParam === "transmitere" && Boolean(findingIdParam)}
            returnToFindingHref={findingIdParam ? `/dashboard/actiuni/remediere/${findingIdParam}` : null}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
