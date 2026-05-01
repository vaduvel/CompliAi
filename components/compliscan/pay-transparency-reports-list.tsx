"use client"

// Pay Transparency — Reports list cu Export ITM PDF action

import { useEffect, useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"

type Status = "draft" | "approved" | "published"

type ReportSummary = {
  id: string
  periodYear: number
  totalEmployees: number
  gapPercent: number
  riskLevel: "low" | "medium" | "high"
  obligationMet: boolean
  status: Status
  generatedAtISO: string
  approvedAtISO?: string
  publishedAtISO?: string
}

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "outline"> = {
  draft: "outline",
  approved: "secondary",
  published: "default",
}

const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  approved: "Aprobat",
  published: "Publicat",
}

const RISK_VARIANT: Record<ReportSummary["riskLevel"], "default" | "destructive" | "secondary"> = {
  low: "default",
  medium: "secondary",
  high: "destructive",
}

export function PayTransparencyReportsList() {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/pay-transparency/report", { cache: "no-store" })
      const d = await r.json()
      if (r.ok && Array.isArray(d.reports)) setReports(d.reports)
    } finally {
      setLoading(false)
    }
  }

  async function generateNew() {
    setGenerating(true)
    try {
      const year = new Date().getFullYear()
      const r = await fetch("/api/pay-transparency/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Eroare la generare")
      toast.success("Raport draft creat")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setGenerating(false)
    }
  }

  function downloadPdf(reportId: string) {
    const url = `/api/pay-transparency/report/${reportId}/pdf`
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" /> Se încarcă...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="normal-case tracking-normal">
          {reports.length} rapoarte
        </Badge>
        <Button onClick={() => void generateNew()} disabled={generating} size="sm" className="gap-1.5">
          {generating ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
          Generează raport nou
        </Button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Niciun raport încă"
          label="Adaugă date salariale (Pay Transparency main) și generează primul raport draft."
        />
      ) : (
        <div className="space-y-2">
          {reports.map((rep) => (
            <Card key={rep.id} className="border border-eos-border bg-eos-surface">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3 px-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">Raport {rep.periodYear}</p>
                    <Badge variant={STATUS_VARIANT[rep.status]} className="text-[10px] normal-case tracking-normal">
                      {STATUS_LABELS[rep.status]}
                    </Badge>
                    <Badge variant={RISK_VARIANT[rep.riskLevel]} className="text-[10px] normal-case tracking-normal">
                      Risk: {rep.riskLevel}
                    </Badge>
                    {rep.obligationMet ? (
                      <Badge variant="default" className="text-[10px] normal-case tracking-normal">
                        Sub 5%
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                        Peste 5% — evaluare
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-eos-text-muted">
                    {rep.totalEmployees} angajați · gap {rep.gapPercent.toFixed(2)}% · generat{" "}
                    {new Date(rep.generatedAtISO).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => downloadPdf(rep.id)}
                >
                  <Download className="size-3.5" />
                  Export ITM PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
