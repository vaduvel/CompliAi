"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, FileCode2 } from "lucide-react"

import type { EFacturaValidationRecord } from "@/lib/compliance/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  async function handleFileChange(file: File | null) {
    if (!file) return
    setDocumentName(file.name)
    setXml(await file.text())
  }

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Validator e-Factura XML</CardTitle>
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Valideaza rapid structura UBL de baza inainte sa trimiti XML-ul spre fluxul ANAF.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <label className="ring-focus flex min-h-[108px] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-variant)] px-5 text-center text-sm text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-hover)]">
            <span>
              <FileCode2 className="mx-auto mb-3 size-5 text-[var(--color-primary)]" strokeWidth={2.25} />
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
            className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
          />

          <textarea
            value={xml}
            onChange={(event) => setXml(event.target.value)}
            rows={14}
            placeholder="<Invoice>...</Invoice>"
            className="ring-focus min-h-[280px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
          />

          <Button
            onClick={() => void onValidate({ documentName, xml })}
            disabled={!xml.trim() || busy}
            className="h-11 w-full rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Valideaza XML-ul
          </Button>
        </div>

        <div className="space-y-4">
          {!latestValidation && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5 text-sm text-[var(--color-on-surface-muted)]">
              Inca nu exista validari rulate. Primul pas util este sa verifici daca XML-ul are blocurile minime pentru un flux e-Factura coerent.
            </div>
          )}

          {latestValidation && (
            <>
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      latestValidation.valid
                        ? "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]"
                        : "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]"
                    }
                  >
                    {latestValidation.valid ? "Structura valida" : "Structura invalida"}
                  </Badge>
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--color-on-surface)]">{value}</p>
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
    tone === "error" ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"
  const Icon = tone === "error" ? AlertTriangle : CheckCircle2

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-5">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${iconClass}`} strokeWidth={2.25} />
        <p className="text-sm font-medium text-[var(--color-on-surface)]">{title}</p>
      </div>
      <div className="mt-4 space-y-3 text-sm text-[var(--color-on-surface-muted)]">
        {items.length === 0 && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
            {emptyText}
          </div>
        )}
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
