"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Copy, Download, Loader2, Share2, Shield } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { VendorTrustPack } from "@/lib/server/vendor-trust-pack"

type ReadinessTone = "success" | "warning" | "danger"

function getCategoryStatus(
  score: number,
  blocker = false
): { label: string; tone: ReadinessTone } {
  if (!blocker && score >= 80) return { label: "pregătit", tone: "success" }
  if (score >= 55) return { label: "parțial", tone: "warning" }
  return { label: "gap-uri active", tone: "danger" }
}

function toneClasses(tone: ReadinessTone) {
  if (tone === "success") {
    return "border-eos-success/30 bg-eos-success-soft text-eos-success"
  }
  if (tone === "warning") {
    return "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-error/30 bg-eos-error-soft text-eos-error"
}

function ringClasses(score: number) {
  if (score >= 80) return "border-eos-success/35 text-eos-success"
  if (score >= 55) return "border-eos-warning/35 text-eos-warning"
  return "border-eos-error/35 text-eos-error"
}

function resolveDownloadName(
  header: string | null,
  fallback: string
) {
  const match = header?.match(/filename=\"([^\"]+)\"/)
  return match?.[1] ?? fallback
}

export function VendorTrustPackCard() {
  const [pack, setPack] = useState<VendorTrustPack | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<"json" | "pdf" | null>(null)
  const [shareLoading, setShareLoading] = useState(false)

  const loadPack = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/exports/vendor-trust-pack", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut încărca pack-ul.")
      const data = (await response.json()) as VendorTrustPack
      setPack(data)
    } catch {
      toast.error("Nu am putut încărca Vendor Trust Pack.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPack()
  }, [loadPack])

  const downloadPack = useCallback(async (format: "json" | "pdf") => {
    setDownloading(format)
    try {
      const response = await fetch(
        format === "pdf"
          ? "/api/exports/vendor-trust-pack?format=pdf"
          : "/api/exports/vendor-trust-pack",
        { cache: "no-store" }
      )
      if (!response.ok) throw new Error("Export indisponibil.")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = resolveDownloadName(
        response.headers.get("content-disposition"),
        format === "pdf" ? "vendor-trust-pack.pdf" : "vendor-trust-pack.json"
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Vendor Trust Pack ${format.toUpperCase()} descărcat.`)
    } catch {
      toast.error("Nu am putut descărca Vendor Trust Pack.")
    } finally {
      setDownloading(null)
    }
  }, [])

  const copyShareLink = useCallback(async () => {
    if (!pack?.shareToken) {
      toast.error("Share token indisponibil.")
      return
    }
    setShareLoading(true)
    try {
      const link = `${window.location.origin}/shared/${pack.shareToken}`
      await navigator.clipboard.writeText(link)
      toast.success("Linkul de distribuire a fost copiat.")
    } catch {
      toast.error("Nu am putut copia linkul.")
    } finally {
      setShareLoading(false)
    }
  }, [pack?.shareToken])

  if (loading) {
    return (
      <Card className="border-eos-border bg-eos-surface-variant">
        <CardHeader>
          <CardTitle className="text-base">Vendor Trust Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-eos-text-tertiary">
          <Loader2 className="size-4 animate-spin" />
          Se încarcă readiness-ul comercial și pack-ul de procurement.
        </CardContent>
      </Card>
    )
  }

  if (!pack) return null

  const gdprStatus = getCategoryStatus(pack.gdpr.gdprProgress, pack.gdpr.openFindings > 0)
  const nis2ReferenceScore = pack.nis2.applicable
    ? Math.max(pack.nis2.assessmentScore ?? 0, pack.nis2.maturityScore ?? 0)
    : 100
  const nis2Status = getCategoryStatus(
    nis2ReferenceScore,
    pack.nis2.applicable && (!pack.nis2.dnscRegistered || pack.nis2.openIncidents > 0)
  )
  const securityReference = Math.max(
    0,
    100 - pack.security.highRiskAiCount * 18 - pack.security.vendorReviewsCritical * 20
  )
  const securityStatus = getCategoryStatus(
    securityReference,
    pack.security.vendorReviewsCritical > 0
  )

  return (
    <Card className="border-eos-border bg-eos-surface-variant">
      <CardHeader className="gap-3 border-b border-eos-border-subtle">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              P3-B
            </p>
            <CardTitle className="mt-1 flex items-center gap-2 text-base">
              <Shield className="size-4 text-eos-primary/80" />
              Vendor Trust Pack
            </CardTitle>
            <p className="mt-1 text-sm text-eos-text-tertiary">
              Livrabil comercial pentru due diligence, procurement și handoff extern.
            </p>
          </div>
          <div className={`flex size-20 items-center justify-center rounded-full border-4 text-lg font-semibold ${ringClasses(pack.readinessScore)}`}>
            {pack.readinessScore}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-eos-text">GDPR</p>
              <Badge className={toneClasses(gdprStatus.tone)}>{gdprStatus.label}</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-eos-text">{pack.gdpr.gdprProgress}%</p>
            <p className="mt-2 text-xs text-eos-text-tertiary">
              {pack.gdpr.openFindings} finding-uri deschise · {pack.gdpr.evidenceItems.length} dovezi aprobate
            </p>
          </div>

          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-eos-text">NIS2</p>
              <Badge className={toneClasses(nis2Status.tone)}>{nis2Status.label}</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-eos-text">
              {pack.nis2.applicable ? `${nis2ReferenceScore}%` : "N/A"}
            </p>
            <p className="mt-2 text-xs text-eos-text-tertiary">
              DNSC {pack.nis2.dnscRegistered ? "confirmat" : "neconfirmat"} · {pack.nis2.openIncidents} incidente deschise
            </p>
          </div>

          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-eos-text">Security</p>
              <Badge className={toneClasses(securityStatus.tone)}>{securityStatus.label}</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-eos-text">{securityReference}%</p>
            <p className="mt-2 text-xs text-eos-text-tertiary">
              {pack.security.vendorReviewsOpen} review-uri deschise · {pack.security.highRiskAiCount} AI high-risk
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-eos-success" />
              <p className="text-sm font-medium text-eos-text">Evidence & procurement</p>
            </div>
            <p className="mt-2 text-xs text-eos-text-tertiary">
              {pack.procurementQuestionnaire.length} întrebări auto-completate pentru due diligence.
            </p>
            <div className="mt-3 space-y-2">
              {pack.procurementQuestionnaire.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-eos-text">{item.question}</p>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-eos-text-tertiary">
                      {item.answer}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-eos-text-tertiary">{item.evidence ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-eos-warning" />
              <p className="text-sm font-medium text-eos-text">Acțiuni rapide</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void downloadPack("json")}
                disabled={downloading !== null}
                title={downloading !== null ? "Descărcare în curs..." : undefined}
              >
                {downloading === "json" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Descarcă JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void downloadPack("pdf")}
                disabled={downloading !== null}
                title={downloading !== null ? "Descărcare în curs..." : undefined}
              >
                {downloading === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Descarcă PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyShareLink()}
                disabled={shareLoading}
              >
                {shareLoading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                Distribuie link
              </Button>
            </div>

            <div className="mt-4 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
              <p className="text-xs font-medium text-eos-text">Semnal comercial</p>
              <p className="mt-1 text-xs text-eos-text-tertiary">
                {pack.readinessLabel} · {pack.security.vendorReviewsTotal} review-uri vendor · {pack.gdpr.evidenceItems.length} dovezi GDPR reutilizabile.
              </p>
            </div>

            {pack.shareToken && (
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-eos-text-tertiary transition hover:text-eos-text"
                onClick={() => void copyShareLink()}
              >
                <Copy className="size-3.5" />
                Copiază linkul securizat de trust share
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
