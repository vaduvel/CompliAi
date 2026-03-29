"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, CheckCircle2, Copy, Download, FileCode2, RefreshCw, Wand2, Zap } from "lucide-react"
import { toast } from "sonner"

import type { EFacturaValidationRecord, EFacturaXmlRepairRecord } from "@/lib/compliance/types"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type EFacturaValidatorCardProps = {
  validations: EFacturaValidationRecord[]
  busy: boolean
  repairBusy: boolean
  onValidate: (input: { documentName: string; xml: string }) => Promise<EFacturaValidationRecord | null>
  onRepair: (input: {
    documentName: string
    xml: string
    errorCodes?: string[]
  }) => Promise<EFacturaXmlRepairRecord | null>
}

export function EFacturaValidatorCard({
  validations,
  busy,
  repairBusy,
  onValidate,
  onRepair,
}: EFacturaValidatorCardProps) {
  const [documentName, setDocumentName] = useState("factura-anaf.xml")
  const [xml, setXml] = useState("")
  const [repairResult, setRepairResult] = useState<EFacturaXmlRepairRecord | null>(null)
  const latestValidation = validations[0] ?? null
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A4 — Live validation on paste: auto-validate with 800ms debounce
  useEffect(() => {
    if (xml.trim().length < 50) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void onValidate({ documentName, xml })
    }, 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [xml, documentName, onValidate])

  async function handleFileChange(file: File | null) {
    if (!file) return
    setDocumentName(file.name)
    setXml(await file.text())
  }

  async function handleRepair() {
    if (!xml.trim()) return
    try {
      const repair = await onRepair({ documentName, xml })
      setRepairResult(repair)
    } catch {
      // Toast-ul este emis de handlerul din suprafața Fiscal.
    }
  }

  async function handleCopyRepairedXml() {
    if (!repairResult?.repairedXml) return
    try {
      await navigator.clipboard.writeText(repairResult.repairedXml)
      toast.success("XML reparat copiat", {
        description: "Îl poți lipi direct în ERP, validator sau în canalul de retransmitere.",
      })
    } catch {
      toast.error("Nu am putut copia XML-ul reparat.")
    }
  }

  async function handleCopyRepairSummary() {
    if (!repairResult) return
    const summaryLines = [
      `XML-ul ${repairResult.documentName} a fost reparat în CompliAI la ${new Date(repairResult.createdAtISO).toLocaleString("ro-RO")}.`,
      repairResult.appliedFixes.length > 0
        ? `Corecții aplicate: ${repairResult.appliedFixes.map((fix) => `${fix.errorCode} (${fix.field})`).join(", ")}.`
        : "Nu au fost aplicate corecții automate sigure; corecția a rămas manuală.",
      "După revizuire, XML-ul trebuie revalidat și retransmis manual în ERP/SPV ANAF.",
      "Dovada de închidere pentru finding rămâne confirmarea retransmiterii și statusul final din SPV.",
    ]

    try {
      await navigator.clipboard.writeText(summaryLines.join(" "))
      toast.success("Rezumatul pentru cockpit a fost copiat", {
        description: "Îl poți lipi direct în dovada operațională a findingului fiscal.",
      })
    } catch {
      toast.error("Nu am putut copia rezumatul pentru cockpit.")
    }
  }

  function handleDownloadRepairedXml() {
    if (!repairResult?.repairedXml) return
    const blob = new Blob([repairResult.repairedXml], { type: "application/xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const safeName =
      repairResult.documentName.replace(/\.xml$/i, "").replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-") || "factura-anaf"
    const link = document.createElement("a")
    link.href = url
    link.download = `${safeName}-repaired.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("XML-ul reparat a fost descărcat", {
      description: "Poți încărca fișierul direct în ERP sau în fluxul de retransmitere.",
    })
  }

  function handleReplaceWithRepairedXml() {
    if (!repairResult?.repairedXml) return
    setXml(repairResult.repairedXml)
    toast.success("Editorul a fost înlocuit cu XML-ul reparat", {
      description: "Validarea live pornește din nou pe varianta corectată.",
    })
  }

  return (
    <Card className="border-eos-border bg-eos-surface" data-testid="efactura-validator-card">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-base">Validator e-Factura XML</CardTitle>
        <p className="text-sm text-eos-text-muted [overflow-wrap:anywhere]">
          Valideaza rapid structura UBL de baza inainte sa trimiti XML-ul spre fluxul ANAF.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <label className="ring-focus flex min-h-[108px] cursor-pointer items-center justify-center rounded-eos-md border border-dashed border-eos-border-strong bg-eos-surface-variant px-5 text-center text-sm text-eos-text-muted hover:bg-eos-secondary-hover">
            <span>
              <FileCode2 className="mx-auto mb-3 size-5 text-eos-primary" strokeWidth={2} />
              Incarca un fisier XML sau lipeste continutul mai jos
            </span>
            <input
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={(event) => {
                void handleFileChange(event.target.files?.[0] ?? null)
              }}
            />
          </label>

          <input
            data-testid="efactura-document-name"
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder="Nume fisier XML"
            className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />

          <textarea
            data-testid="efactura-xml-input"
            value={xml}
            onChange={(event) => setXml(event.target.value)}
            rows={14}
            placeholder="<Invoice>...</Invoice>"
            className="ring-focus min-h-[280px] w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />

          <div className="flex items-center gap-2">
            <Button
              data-testid="validate-xml"
              onClick={() => void onValidate({ documentName, xml })}
              disabled={!xml.trim() || busy}
              size="lg"
              className="flex-1 bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
            >
              Valideaza XML-ul
            </Button>
            {xml.trim().length >= 50 && (
              <span className="flex items-center gap-1 text-[10px] text-eos-text-muted whitespace-nowrap">
                <Zap className="size-3 text-eos-primary" />
                Live
              </span>
            )}
          </div>

          <Button
            data-testid="repair-xml"
            variant="outline"
            onClick={() => void handleRepair()}
            disabled={!xml.trim() || repairBusy}
            className="w-full gap-1.5"
          >
            {repairBusy ? <RefreshCw className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            Propune corectii sigure
          </Button>
        </div>

        <div className="space-y-4">
          {!latestValidation && (
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5 text-sm text-eos-text-muted [overflow-wrap:anywhere]">
              Nicio validare rulată încă. Primul pas util este să verifici dacă XML-ul are blocurile minime pentru un flux e-Factura coerent.
            </div>
          )}

          {latestValidation && (
            <>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    data-testid="efactura-validation-status"
                    className={
                      latestValidation.valid
                        ? "border-eos-border bg-eos-success-soft text-eos-success"
                        : "border-eos-error-border bg-eos-error-soft text-eos-error"
                    }
                  >
                    {latestValidation.valid ? "Structură validă" : "Structură invalidă"}
                  </Badge>
                  <Badge className="border-eos-border bg-transparent text-eos-text-muted [overflow-wrap:anywhere]">
                    {latestValidation.documentName}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Meta label="Factura" value={latestValidation.invoiceNumber || "Nespecificat"} />
                  <Meta label="Data emiterii" value={latestValidation.issueDate || "Nespecificata"} />
                  <Meta label="Furnizor" value={latestValidation.supplierName || "Nedetectat"} />
                  <Meta label="Client" value={latestValidation.customerName || "Nedetectat"} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <IssueList
                  title="Erori"
                  items={latestValidation.errors}
                  emptyText="Nu există erori structurale detectate."
                  tone="error"
                />
                <IssueList
                  title="Avertismente"
                  items={latestValidation.warnings}
                  emptyText="Nu există avertismente."
                  tone="warning"
                />
              </div>

              {repairResult && (
                <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/[0.06] p-5" data-testid="repair-result">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-eos-text">Corectii pregatite pentru XML</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {repairResult.appliedFixes.length > 0
                          ? `${repairResult.appliedFixes.length} fixuri aplicate automat. XML-ul nu este retransmis de CompliAI; îl revezi și îl trimiți tu mai departe.`
                          : "Nu am găsit fixuri automate sigure pentru XML-ul curent. Corecția rămâne manuală în ERP sau în exportul XML."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        data-testid="download-repaired-xml"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadRepairedXml}
                        disabled={!repairResult.repairedXml}
                        className="gap-1.5"
                      >
                        <Download className="size-3.5" />
                        Descarcă XML-ul reparat
                      </Button>
                      <Button
                        data-testid="copy-repaired-xml"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyRepairedXml()}
                        disabled={!repairResult.repairedXml}
                        className="gap-1.5"
                      >
                        <Copy className="size-3.5" />
                        Copiaza XML-ul reparat
                      </Button>
                      <Button
                        data-testid="replace-with-repaired-xml"
                        type="button"
                        size="sm"
                        onClick={handleReplaceWithRepairedXml}
                        disabled={!repairResult.repairedXml}
                        className="gap-1.5"
                      >
                        <RefreshCw className="size-3.5" />
                        Inlocuieste in editor
                      </Button>
                      <Button
                        data-testid="copy-repair-summary"
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyRepairSummary()}
                        className="gap-1.5"
                      >
                        <Copy className="size-3.5" />
                        Copiază nota pentru cockpit
                      </Button>
                    </div>
                  </div>

                  {repairResult.appliedFixes.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {repairResult.appliedFixes.map((fix, index) => (
                        <div
                          key={`${fix.errorCode}-${fix.field}-${index}`}
                          className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="normal-case tracking-normal">
                              {fix.errorCode}
                            </Badge>
                            <p className="text-sm font-medium text-eos-text">{fix.field}</p>
                          </div>
                          <p className="mt-2 text-xs text-eos-text-muted">{fix.explanation}</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <Meta label="Înainte" value={fix.oldValue || "Lipsă"} />
                            <Meta label="După" value={fix.newValue} />
                          </div>
                        </div>
                      ))}

                      <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">XML reparat</p>
                        <textarea
                          data-testid="repaired-xml-output"
                          readOnly
                          value={repairResult.repairedXml}
                          rows={8}
                          className="mt-3 min-h-[180px] w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-xs text-eos-text outline-none"
                        />
                      </div>

                      <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">Protocol după repair</p>
                        <div className="mt-3 space-y-3">
                          {[
                            "Înlocuiește editorul sau descarcă XML-ul reparat ca fișier separat.",
                            "Rulează încă o validare pe varianta reparată înainte de retransmitere.",
                            "Retransmite manual XML-ul în ERP sau în fluxul SPV ANAF și păstrează confirmarea primită.",
                            "Revino în cockpit și atașează nota de remediere + referința de confirmare din SPV.",
                          ].map((step, index) => (
                            <div key={step} className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3">
                              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-eos-primary/10 text-[11px] font-semibold text-eos-primary">
                                {index + 1}
                              </div>
                              <p className="text-sm text-eos-text-muted">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">{label}</p>
      <p className="mt-2 text-sm text-eos-text [overflow-wrap:anywhere]">{value}</p>
    </div>
  )
}

function IssueList({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string
  items: string[]
  emptyText: string
  tone: "error" | "warning"
}) {
  const iconClass =
    tone === "error" ? "text-eos-error" : "text-eos-warning"
  const Icon = tone === "error" ? AlertTriangle : CheckCircle2

  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${iconClass}`} strokeWidth={2} />
        <p className="text-sm font-medium text-eos-text">{title}</p>
      </div>
      <div className="mt-4 space-y-3 text-sm text-eos-text-muted">
        {items.length === 0 && (
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4 [overflow-wrap:anywhere]">
            {emptyText}
          </div>
        )}
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4 [overflow-wrap:anywhere]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
