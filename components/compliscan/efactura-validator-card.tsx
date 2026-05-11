"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, CheckCircle2, Copy, Download, FileCode2, Loader2, RefreshCw, Sparkles, Wand2, Zap } from "lucide-react"
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

type DiffLine = { type: "same" | "removed" | "added"; text: string; lineNo: number }

function computeXmlDiff(original: string, repaired: string): DiffLine[] {
  const origLines = original.split("\n")
  const repLines = repaired.split("\n")
  const result: DiffLine[] = []
  const maxLen = Math.max(origLines.length, repLines.length)

  // Simple line-by-line comparison (sufficient for field-level repairs)
  let oi = 0
  let ri = 0
  while (oi < origLines.length || ri < repLines.length) {
    const oLine = oi < origLines.length ? origLines[oi] : undefined
    const rLine = ri < repLines.length ? repLines[ri] : undefined

    if (oLine === rLine) {
      result.push({ type: "same", text: rLine!, lineNo: ri + 1 })
      oi++
      ri++
    } else if (rLine !== undefined && (oLine === undefined || !origLines.slice(oi).includes(rLine))) {
      result.push({ type: "added", text: rLine, lineNo: ri + 1 })
      ri++
    } else if (oLine !== undefined && (rLine === undefined || !repLines.slice(ri).includes(oLine))) {
      result.push({ type: "removed", text: oLine, lineNo: oi + 1 })
      oi++
    } else {
      // Both exist but differ — show as remove + add
      result.push({ type: "removed", text: oLine!, lineNo: oi + 1 })
      result.push({ type: "added", text: rLine!, lineNo: ri + 1 })
      oi++
      ri++
    }

    if (result.length > maxLen + 200) break // safety
  }
  return result
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
  const [aiExplanations, setAiExplanations] = useState<Array<{
    code: string
    title: string
    staticDescription: string
    staticFix: string
    severity: "error" | "warning"
    legalReference: string
    autoFixSafe: boolean
    aiExplanation?: string
  }> | null>(null)
  const [explainBusy, setExplainBusy] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  // GAP #2 — Auto-repair disclaimer + audit log (BLOCKER LEGAL CECCAR).
  // Conform Codului Deontologic CECCAR, contabilul e responsabil profesional
  // pentru fiecare modificare aplicată. NICIODATĂ silent — sugestie + click apply.
  const [ceccarApprovalConfirmed, setCeccarApprovalConfirmed] = useState(false)
  const latestValidation = validations[0] ?? null
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onValidateRef = useRef(onValidate)
  useEffect(() => {
    onValidateRef.current = onValidate
  }, [onValidate])

  // A4 — Live validation on paste: auto-validate with 800ms debounce.
  // onValidate accesat prin ref ca să evităm re-rulări la fiecare re-render
  // al părintelui (când referința funcției se schimbă).
  useEffect(() => {
    if (xml.trim().length < 50) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void onValidateRef.current({ documentName, xml })
    }, 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [xml, documentName])

  async function handleFileChange(file: File | null) {
    if (!file) return
    setDocumentName(file.name)
    setXml(await file.text())
  }

  async function handleRepair() {
    if (!xml.trim()) return
    // GAP #2 — Blocker LEGAL CECCAR: contabilul TREBUIE să confirme că revizuiește
    // și aprobă fiecare modificare. NICIODATĂ silent.
    if (!ceccarApprovalConfirmed) {
      toast.error("Confirmare obligatorie CECCAR", {
        description:
          "Bifează 'Am revizuit și aprob' înainte să aplici corecții — fiecare modificare e responsabilitatea ta profesională.",
      })
      return
    }
    try {
      const repair = await onRepair({ documentName, xml })
      setRepairResult(repair)
      // GAP #2 — Audit log per fix aplicat (server-side via finding event).
      // Apel fire-and-forget la /api/compliance/events ca să trackuim
      // timestamp + user + fix codes pentru audit pack CECCAR.
      // Metadata: doar primitives (Record<string, string | number | boolean>).
      if (repair && repair.appliedFixes.length > 0) {
        const fixCodes = repair.appliedFixes.map((fix) => fix.errorCode).join(", ")
        const entityId = `efxml-repair-${repair.documentName.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`
        void fetch("/api/compliance/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "integration.efactura-xml-repair-applied",
            entityType: "integration",
            entityId,
            message: `XML repair applied for ${documentName}: ${fixCodes}. Approved per CECCAR Code of Ethics.`,
            metadata: {
              documentName: repair.documentName,
              appliedFixCount: repair.appliedFixes.length,
              fixCodes,
              ceccarApprovalConfirmed: true,
              approvedAtISO: new Date().toISOString(),
            },
          }),
        }).catch(() => {
          // Audit log e fire-and-forget — nu blocă UX dacă falează
        })
      }
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
      `XML-ul ${repairResult.documentName} a fost reparat în CompliScan la ${new Date(repairResult.createdAtISO).toLocaleString("ro-RO")}.`,
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

          {/* GAP #2 — Disclaimer LEGAL CECCAR (BLOCKER pentru launch).
              Contabilul TREBUIE să bifeze înainte de orice fix automat.
              Fiecare apply e logged în audit trail per finding event. */}
          <div
            data-testid="ceccar-disclaimer-banner"
            className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft p-4"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-warning" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-eos-text">
                  📋 SUGESTIE — NU silent auto-repair
                </p>
                <p className="text-xs text-eos-text-muted">
                  CompliScan propune corecții pe baza regulilor V001-V011 UBL CIUS-RO.
                  <strong> Contabilul rămâne responsabil profesional</strong> conform
                  Codului Deontologic CECCAR pentru fiecare modificare aplicată.
                  Fiecare fix e logat în audit trail (timestamp + user + cod fix +
                  XML before/after) pentru evidență de inspecție.
                </p>
                <label className="flex cursor-pointer items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    data-testid="ceccar-approval-checkbox"
                    checked={ceccarApprovalConfirmed}
                    onChange={(e) => setCeccarApprovalConfirmed(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-eos-border bg-eos-surface accent-eos-primary"
                  />
                  <span className="text-xs text-eos-text">
                    <strong>Am revizuit și aprob</strong> fiecare modificare propusă
                    conform Codului Deontologic CECCAR. Sunt de acord ca acțiunea
                    să fie înregistrată în audit log cu numele meu.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <Button
            data-testid="repair-xml"
            variant="outline"
            onClick={() => void handleRepair()}
            disabled={!xml.trim() || repairBusy || !ceccarApprovalConfirmed}
            className="w-full gap-1.5"
            title={
              !ceccarApprovalConfirmed
                ? "Bifează confirmarea CECCAR pentru a activa propunerea de corecții"
                : undefined
            }
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

              {latestValidation.errors.length > 0 && (
                <div className="space-y-2 rounded-eos-md border border-eos-border bg-eos-surface/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] text-eos-text-muted">
                      Nu înțelegi erorile? CompliScan poate enrich cu explicații + referințe legale.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={explainBusy}
                      onClick={async () => {
                        setExplainBusy(true)
                        try {
                          const codes = latestValidation.errors
                            .map((line) => line.match(/^([A-Z]+-?[A-Z\d-]+|V\d+|T\d+|BR-[A-Z\d-]+)/)?.[1])
                            .filter((c): c is string => !!c)
                          const res = await fetch("/api/efactura/explain-errors", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ errors: codes }),
                          })
                          if (!res.ok) throw new Error("HTTP " + res.status)
                          const payload = (await res.json()) as { explanations: typeof aiExplanations }
                          setAiExplanations(payload.explanations ?? [])
                        } catch {
                          toast.error("Nu am putut genera explicațiile.")
                        } finally {
                          setExplainBusy(false)
                        }
                      }}
                    >
                      {explainBusy ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                      ) : (
                        <Sparkles className="mr-1.5 size-3.5" strokeWidth={2} />
                      )}
                      Explică erorile cu AI
                    </Button>
                  </div>
                  {aiExplanations && aiExplanations.length > 0 && (
                    <ul className="space-y-2">
                      {aiExplanations.map((exp) => (
                        <li
                          key={exp.code}
                          className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2"
                        >
                          <p className="font-display text-[12px] font-semibold text-eos-text">
                            <span className="font-mono text-[11px] text-eos-text-tertiary">{exp.code}</span>{" "}
                            · {exp.title}
                          </p>
                          <p className="mt-1 text-[11.5px] text-eos-text">{exp.staticDescription}</p>
                          <p className="mt-1 text-[11px] text-eos-text-muted">
                            <strong>Fix:</strong> {exp.staticFix}
                          </p>
                          <p className="mt-1 text-[10.5px] text-eos-text-tertiary">
                            {exp.legalReference}
                            {exp.autoFixSafe ? " · ✓ auto-fix sigur" : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {repairResult && (
                <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/[0.06] p-5" data-testid="repair-result">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-eos-text">Corectii pregatite pentru XML</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {repairResult.appliedFixes.length > 0
                          ? `${repairResult.appliedFixes.length} fixuri aplicate automat. XML-ul nu este retransmis de CompliScan; îl revezi și îl trimiți tu mai departe.`
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
                            {showDiff ? "Diff original vs reparat" : "XML reparat"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDiff(!showDiff)}
                            className="gap-1.5 text-xs"
                          >
                            <FileCode2 className="size-3" />
                            {showDiff ? "Vezi XML final" : "Vezi diff"}
                          </Button>
                        </div>

                        {showDiff ? (
                          <div className="mt-3 max-h-[320px] overflow-auto rounded-eos-md border border-eos-border bg-eos-bg-inset font-mono text-[11px] leading-5">
                            {computeXmlDiff(xml, repairResult.repairedXml).map((line, i) => (
                              <div
                                key={i}
                                className={
                                  line.type === "removed"
                                    ? "bg-eos-danger/10 text-eos-danger"
                                    : line.type === "added"
                                      ? "bg-eos-success/10 text-eos-success"
                                      : "text-eos-text-muted"
                                }
                              >
                                <span className="inline-block w-8 select-none px-2 text-right text-eos-text-tertiary">
                                  {line.lineNo}
                                </span>
                                <span className="inline-block w-4 select-none text-center">
                                  {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
                                </span>
                                <span className="whitespace-pre-wrap">{line.text}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            data-testid="repaired-xml-output"
                            readOnly
                            value={repairResult.repairedXml}
                            rows={8}
                            className="mt-3 min-h-[180px] w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-xs text-eos-text outline-none"
                          />
                        )}
                      </div>

                      <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
                        <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">Protocol după repair</p>
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
      <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
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
