"use client"

import { useEffect, useState } from "react"
import { FileSearch, FolderOpen } from "lucide-react"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioReportRow } from "@/lib/server/portfolio"

export function PortfolioReportsPage() {
  const [reports, setReports] = useState<PortfolioReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/portfolio/reports", { cache: "no-store" })
        if (!response.ok) throw new Error("Nu am putut încărca metadata de raportare.")
        const data = (await response.json()) as { reports: PortfolioReportRow[] }
        setReports(data.reports)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Portofoliu"
        title="Rapoarte și livrabile"
        description="Metadata agregată pentru rapoarte, documente generate și ultima activitate pe fiecare firmă."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            {reports.length} firme în raportare
          </Badge>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="Nu există metadate de raportare"
              label="Generează documente sau rapoarte în firmele din portofoliu pentru a vedea aici activitatea."
              icon={FolderOpen}
              className="px-5 py-10"
            />
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.orgId} className="border-eos-border bg-eos-surface px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-eos-text">{report.orgName}</p>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Scor: {report.score !== null ? `${report.score}%` : "fără date"} · {report.openAlerts} alerte
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                  {report.generatedDocumentsCount} livrabile
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs text-eos-text-muted">
                <p>Ultimul document: {report.latestGeneratedTitle ?? "niciun document generat"}</p>
                <p>Ultima generare: {report.latestGeneratedAtISO ? new Date(report.latestGeneratedAtISO).toLocaleDateString("ro-RO") : "—"}</p>
                <p>Ultima scanare: {report.lastScanAtISO ? new Date(report.lastScanAtISO).toLocaleDateString("ro-RO") : "—"}</p>
                <p>Documente scanate: {report.scannedDocuments}</p>
              </div>

              <div className="mt-4">
                <PortfolioOrgActionButton
                  orgId={report.orgId}
                  destination="/dashboard/reports"
                  label="Deschide rapoartele"
                  variant="outline"
                />
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <FileSearch className="size-4" strokeWidth={1.8} />
          <span className="font-medium">Metadata cross-client, nu exporturi brute</span>
        </div>
        <p className="mt-1">
          În Wave 2 arătăm ce există și ce lipsește pe fiecare firmă. Exporturile și livrabilele concrete rămân în contextul per-firmă.
        </p>
      </div>
    </div>
  )
}

