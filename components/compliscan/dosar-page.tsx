"use client"

import Link from "next/link"
import { CheckCircle2, FolderOpen, ShieldCheck } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ReportsPageSurface } from "@/components/compliscan/reports-page"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { getFindingAgeLabel } from "@/lib/compliscan/finding-cockpit"

export function DosarPageSurface() {
  const cockpit = useCockpitData()
  const runtime = useDashboardRuntime()
  const isSolo = runtime?.userMode === "solo"
  const generatedDocuments = cockpit.data?.state.generatedDocuments ?? []

  const docByFindingId = new Map<string, (typeof generatedDocuments)[number]>()
  for (const document of [...generatedDocuments].sort((a, b) => b.generatedAtISO.localeCompare(a.generatedAtISO))) {
    if (!document.sourceFindingId || document.approvalStatus !== "approved_as_evidence") continue
    if (!docByFindingId.has(document.sourceFindingId)) {
      docByFindingId.set(document.sourceFindingId, document)
    }
  }

  const resolvedFindings = cockpit.data?.state.findings.filter(
    (f) =>
      f.findingStatus === "under_monitoring" ||
      (f.findingStatus === "resolved" && !f.suggestedDocumentType) ||
      (f.findingStatus === "resolved" && Boolean(f.suggestedDocumentType) && docByFindingId.has(f.id))
  ) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Dosar</p>
        <h1 className="mt-1.5 text-2xl font-bold text-white">
          {isSolo ? "Dosarul tău" : "Dovezi și livrabile"}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Cazurile rezolvate cu dovada atașată, documentele generate și exporturile pentru audit sau control.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/45">
            {resolvedFindings.length} {resolvedFindings.length === 1 ? "caz rezolvat" : "cazuri rezolvate"}
          </span>
        </div>
      </div>

      {/* Cazuri rezolvate + dovezi */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="border-b border-white/[0.05] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/75">Cazuri rezolvate și dovezi</p>
              <p className="mt-0.5 text-xs text-white/35">
                Fiecare caz închis cu urma dovezii atașate. Disponibile pentru audit, control sau handoff.
              </p>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/40">
              {resolvedFindings.length} {resolvedFindings.length === 1 ? "caz" : "cazuri"}
            </span>
          </div>
        </div>

        {resolvedFindings.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-white/15" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-white/35">Niciun caz rezolvat încă</p>
            <p className="mt-1 text-xs leading-relaxed text-white/20">
              Cazurile trimise efectiv la Dosar apar aici după ce le marchezi ca rezolvate în De rezolvat.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {resolvedFindings.map((finding) => {
              const linkedDoc = docByFindingId.get(finding.id) ?? null
              const isMonitored = finding.findingStatus === "under_monitoring"

              return (
                <div key={finding.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="mt-0.5 shrink-0">
                    {isMonitored ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-500/70" strokeWidth={2} />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500/70" strokeWidth={2} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/resolve/${encodeURIComponent(finding.id)}`}
                        className="text-sm font-medium text-white/80 transition-colors hover:text-white hover:underline underline-offset-2"
                      >
                        {finding.title}
                      </Link>
                      <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isMonitored
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/[0.06] text-white/40"
                      }`}>
                        {isMonitored ? "Monitorizat" : "Rezolvat"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/30">
                      <span>{getFindingAgeLabel(finding.createdAtISO)}</span>
                      {finding.findingStatusUpdatedAtISO && (
                        <span>Închis {new Date(finding.findingStatusUpdatedAtISO).toLocaleDateString("ro-RO")}</span>
                      )}
                      {finding.nextMonitoringDateISO && (
                        <span>Următor review: {new Date(finding.nextMonitoringDateISO).toLocaleDateString("ro-RO")}</span>
                      )}
                    </div>
                    {linkedDoc && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-white/40">
                        <FolderOpen className="h-3 w-3 shrink-0" strokeWidth={2} />
                        <span>Dovadă: {linkedDoc.title}</span>
                        {linkedDoc.approvalStatus === "approved_as_evidence" && (
                          <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            aprobat
                          </span>
                        )}
                      </div>
                    )}
                    {finding.operationalEvidenceNote && !linkedDoc && (
                      <p className="mt-1.5 text-xs text-white/25 line-clamp-1">
                        Notă: {finding.operationalEvidenceNote}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Documente generate + export + snapshot */}
      <ReportsPageSurface hideHeader />
    </div>
  )
}
