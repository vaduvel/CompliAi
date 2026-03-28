"use client"

// V3 P0.3 — e-Factura Risk Dashboard Card
// Afișează semnalele de risc e-Factura: respingeri, erori XML, întârzieri, furnizori tech.
// Strict compliance signal layer — nu emite, nu editează, nu gestionează facturi.

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, FileWarning, RefreshCw, Zap } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { EFacturaInvoiceSignal, EFacturaRiskSummary } from "@/lib/compliance/efactura-risk"
import { summarizeEFacturaSignals } from "@/lib/compliance/efactura-risk"

type SignalsPayload = {
  signals: EFacturaInvoiceSignal[]
  mode: "mock" | "real"
  connected: boolean
  syncedAtISO: string | null
  demo: boolean
}

const STATUS_LABELS: Record<EFacturaInvoiceSignal["status"], string> = {
  rejected: "Respinsă ANAF",
  "xml-error": "Eroare XML",
  "processing-delayed": "Prelucrare blocată",
  unsubmitted: "Netransmisă SPV",
}

const STATUS_BADGE: Record<
  EFacturaInvoiceSignal["status"],
  "destructive" | "warning" | "outline"
> = {
  rejected: "destructive",
  "xml-error": "destructive",
  "processing-delayed": "warning",
  unsubmitted: "outline",
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "danger" | "warning" | "muted"
}) {
  const color =
    tone === "danger"
      ? "text-eos-error"
      : tone === "warning"
        ? "text-eos-warning"
        : "text-eos-text-muted"
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3 text-center">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-eos-text-muted">
        {label}
      </p>
    </div>
  )
}

export function EFacturaRiskCard() {
  const [payload, setPayload] = useState<SignalsPayload | null>(null)
  const [summary, setSummary] = useState<EFacturaRiskSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  async function loadSignals() {
    setLoading(true)
    try {
      const res = await fetch("/api/efactura/signals", { cache: "no-store" })
      const data = (await res.json()) as SignalsPayload
      setPayload(data)
      setSummary(summarizeEFacturaSignals(data.signals))
    } catch {
      toast.error("Nu am putut incarca semnalele e-Factura.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateFindings() {
    setGenerating(true)
    try {
      const res = await fetch("/api/efactura/signals", { method: "POST" })
      const data = (await res.json()) as { generated: number }
      toast.success(`${data.generated} finding-uri generate în board`, {
        description: "Verifică tab-ul Remediation pentru acțiuni.",
      })
    } catch {
      toast.error("Nu am putut genera finding-urile e-Factura.")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    void loadSignals()
  }, [])

  const hasRisk = summary && (summary.rejected + summary.xmlErrors) > 0

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Semnale risc e-Factura</CardTitle>
              {payload?.demo && (
                <Badge variant="outline" className="text-[10px]">
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-sm text-eos-text-muted">
              Facturi respinse, erori XML și blocaje SPV detectate automat.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadSignals()}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Actualizează
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {loading && (
          <div className="py-8 text-center text-sm text-eos-text-muted">
            Se încarcă semnalele...
          </div>
        )}

        {!loading && summary && (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label="Respinse" value={summary.rejected} tone="danger" />
              <SummaryTile label="Erori XML" value={summary.xmlErrors} tone="danger" />
              <SummaryTile label="Blocate" value={summary.delayed} tone="warning" />
              <SummaryTile label="Netransmise" value={summary.unsubmitted} tone="muted" />
            </div>

            {/* Tech vendor notice */}
            {summary.techVendors > 0 && (
              <div className="flex items-start gap-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/6 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
                <p className="text-sm text-eos-text">
                  <span className="font-medium">{summary.techVendors} furnizori tech/cloud</span>{" "}
                  detectați — verifică existența DPA (GDPR Art. 28) și SLA securitate NIS2.
                </p>
              </div>
            )}

            {/* Signal list */}
            {payload && payload.signals.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-eos-text-muted">
                  Semnale active ({payload.signals.length})
                </p>
                <div className="divide-y divide-eos-border rounded-eos-md border border-eos-border">
                  {payload.signals.map((signal) => (
                    <div key={signal.id} className="flex items-start gap-3 px-4 py-3">
                      <FileWarning
                        className={`mt-0.5 size-4 shrink-0 ${
                          signal.status === "rejected" || signal.status === "xml-error"
                            ? "text-eos-error"
                            : "text-eos-warning"
                        }`}
                        strokeWidth={2}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-eos-text">
                            {signal.vendorName}
                          </span>
                          <Badge variant={STATUS_BADGE[signal.status]} className="text-[10px]">
                            {STATUS_LABELS[signal.status]}
                          </Badge>
                          {signal.isTechVendor && (
                            <Badge variant="outline" className="text-[10px]">
                              Tech
                            </Badge>
                          )}
                        </div>
                        {signal.invoiceNumber && (
                          <p className="mt-0.5 text-xs text-eos-text-muted">
                            #{signal.invoiceNumber} · {signal.date}
                            {signal.amount
                              ? ` · ${signal.amount.toLocaleString("ro-RO")} ${signal.currency ?? "RON"}`
                              : ""}
                          </p>
                        )}
                        {signal.reason && (
                          <p className="mt-1 text-xs text-eos-text-muted">{signal.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
                <p className="text-sm text-eos-text">Nu există semnale de risc e-Factura active.</p>
              </div>
            )}

            {/* Generate findings CTA */}
            {hasRisk && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                <div>
                  <p className="text-sm font-medium text-eos-text">Transferă în board-ul de remediation</p>
                  <p className="text-xs text-eos-text-muted">
                    Generează finding-uri cu drum complet de la risc la inchidere.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleGenerateFindings()}
                  disabled={generating}
                >
                  <Zap className="mr-1.5 size-3.5" strokeWidth={2} />
                  {generating ? "Se generează..." : "Generează finding-uri"}
                </Button>
              </div>
            )}

            {payload?.demo && (
              <p className="text-center text-xs text-eos-text-muted">
                Date demo — setează ANAF_CLIENT_ID și ANAF_CLIENT_SECRET pentru date reale.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
