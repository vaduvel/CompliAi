"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, CheckCircle2, FileCode2, Zap } from "lucide-react"

import type { EFacturaValidationRecord } from "@/lib/compliance/types"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type EFacturaValidatorCardProps = {
  validations: EFacturaValidationRecord[]
  busy: boolean
  onValidate: (input: { documentName: string; xml: string }) => Promise<EFacturaValidationRecord | null>
}

export function EFacturaValidatorCard({
  validations,
  busy,
  onValidate,
}: EFacturaValidatorCardProps) {
  const [documentName, setDocumentName] = useState("factura-anaf.xml")
  const [xml, setXml] = useState("")
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

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Validator e-Factura XML</CardTitle>
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
            value={documentName}
            onChange={(event) => setDocumentName(event.target.value)}
            placeholder="Nume fisier XML"
            className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />

          <textarea
            value={xml}
            onChange={(event) => setXml(event.target.value)}
            rows={14}
            placeholder="<Invoice>...</Invoice>"
            className="ring-focus min-h-[280px] w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />

          <div className="flex items-center gap-2">
            <Button
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
        </div>

        <div className="space-y-4">
          {!latestValidation && (
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5 text-sm text-eos-text-muted [overflow-wrap:anywhere]">
              Inca nu exista validari rulate. Primul pas util este sa verifici daca XML-ul are blocurile minime pentru un flux e-Factura coerent.
            </div>
          )}

          {latestValidation && (
            <>
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      latestValidation.valid
                        ? "border-eos-border bg-eos-success-soft text-eos-success"
                        : "border-eos-error-border bg-eos-error-soft text-eos-error"
                    }
                  >
                    {latestValidation.valid ? "Structura valida" : "Structura invalida"}
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
                  emptyText="Nu exista erori structurale detectate."
                  tone="error"
                />
                <IssueList
                  title="Avertismente"
                  items={latestValidation.warnings}
                  emptyText="Nu exista avertismente."
                  tone="warning"
                />
              </div>
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
