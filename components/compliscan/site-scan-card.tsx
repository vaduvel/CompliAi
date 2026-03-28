"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, ArrowRight, CheckCircle2, Globe, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { SiteScanResult } from "@/lib/compliance/site-scanner"

const SITE_SCAN_TIME_ZONE = "Europe/Bucharest"

const SITE_SCAN_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: SITE_SCAN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const SITE_SCAN_DATE_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: SITE_SCAN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

function formatSiteScanDateTime(value: string) {
  return SITE_SCAN_DATE_TIME_FORMATTER.format(new Date(value))
}

function formatSiteScanDate(value: string) {
  return SITE_SCAN_DATE_FORMATTER.format(new Date(value))
}

type SiteScanCardProps = {
  existingScan?: {
    scannedAtISO: string
    websiteUrl: string
    trackerCount: number
    findingCount: number
    hasCookieBanner: boolean
    hasPrivacyPolicy: boolean
  } | null
  /** URL pre-completat din orgProfile.website dacă nu există un scan anterior */
  defaultUrl?: string
  findingId?: string
  findingTitle?: string
  onScanComplete?: (result: SiteScanResult) => void
}

function buildSiteScanEvidenceNote(result: SiteScanResult) {
  const consentFindings = result.findingSuggestions.filter(
    (suggestion) =>
      suggestion.type === "missing-consent" || suggestion.type === "cookie-banner-mismatch"
  )
  const trackerSummary =
    result.trackers.length > 0
      ? `${result.trackers.length} trackere detectate`
      : "nu au mai fost detectate trackere"
  const bannerSummary = result.hasCookieBanner
    ? "bannerul cookie este detectat"
    : "bannerul cookie nu este detectat"
  const privacySummary = result.hasPrivacyPolicy
    ? "politica de confidențialitate este detectată"
    : "politica de confidențialitate nu este detectată"
  const findingSummary =
    consentFindings.length === 0
      ? "Re-scanul nu a mai găsit probleme critice de consimțământ sau banner."
      : `Re-scanul încă vede ${consentFindings.length} semnale: ${consentFindings
          .map((suggestion) => suggestion.title)
          .join("; ")}.`

  return `Site scan rulat la ${formatSiteScanDateTime(result.scannedAtISO)} pentru ${result.url}. ${bannerSummary}; ${trackerSummary}; ${privacySummary}. ${findingSummary}`
}

export function SiteScanCard({
  existingScan,
  defaultUrl,
  findingId,
  findingTitle,
  onScanComplete,
}: SiteScanCardProps) {
  const [url, setUrl] = useState(existingScan?.websiteUrl ?? defaultUrl ?? "")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SiteScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScan() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/site-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), saveToProfile: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Scanare eșuată.")
      } else {
        setResult(data.result)
        onScanComplete?.(data.result)
      }
    } catch {
      setError("Eroare de rețea.")
    } finally {
      setLoading(false)
    }
  }

  const hasPreviousScan = !!existingScan && !result
  const evidenceNote = result && result.reachable ? buildSiteScanEvidenceNote(result) : null
  const returnHref =
    findingId && evidenceNote
      ? `/dashboard/resolve/${encodeURIComponent(findingId)}?siteScan=done&evidenceNote=${encodeURIComponent(evidenceNote)}`
      : null

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-eos-primary" strokeWidth={2} />
          <CardTitle className="text-base text-eos-text">Scanează site-ul tău</CardTitle>
        </div>
        <p className="text-sm text-eos-text-muted">
          Detectăm trackere, formulare și vendori în 20 de secunde — fără instalare.
        </p>
        {findingTitle ? (
          <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary-soft/20 px-3 py-2 text-xs text-eos-text-muted">
            Revii din cazul <span className="font-medium text-eos-text">{findingTitle}</span>. După scanare, te întorci în cockpit cu rezultatul precompletat ca dovadă operațională.
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {hasPreviousScan && (
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text-muted">
            Scan anterior: <span className="font-medium text-eos-text">{existingScan.websiteUrl}</span>
            {" "}· {existingScan.trackerCount} trackere · {existingScan.findingCount} finding-uri
            {" "}· {formatSiteScanDate(existingScan.scannedAtISO)}
          </div>
        )}

        {/* URL input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="https://firma-ta.ro"
            className="min-w-0 flex-1 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-muted focus:outline-none focus:ring-2 focus:ring-eos-primary/40"
            disabled={loading}
          />
          <Button
            onClick={handleScan}
            disabled={loading || !url.trim()}
            size="sm"
            className="shrink-0"
          >
            {loading ? (
              <><Loader2 className="size-4 animate-spin" strokeWidth={2} /> Scanez...</>
            ) : (
              "Scanează"
            )}
          </Button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-eos-error">
            <AlertTriangle className="size-4 shrink-0" strokeWidth={2} />
            {error}
          </p>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {!result.reachable ? (
              <p className="text-sm text-eos-error">Site-ul nu a putut fi accesat: {result.errorMessage}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Trackere", value: result.trackers.length, warn: result.trackers.length > 0 },
                    { label: "Formulare", value: result.forms.length, warn: false },
                    { label: "Banner cookie", value: result.hasCookieBanner ? "Da" : "Nu", warn: !result.hasCookieBanner },
                    { label: "Politică confidențialitate", value: result.hasPrivacyPolicy ? "Da" : "Nu", warn: !result.hasPrivacyPolicy },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-eos-sm border p-2 text-center ${stat.warn ? "border-eos-warning/20 bg-eos-warning-soft" : "border-eos-border bg-eos-bg-inset"}`}>
                      <p className={`text-base font-semibold ${stat.warn ? "text-eos-warning" : "text-eos-text"}`}>{stat.value}</p>
                      <p className="text-[11px] text-eos-text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Findings */}
                {result.findingSuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eos-text-muted">
                      Finding-uri detectate
                    </p>
                    {result.findingSuggestions.map((s, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-eos-sm border px-3 py-2 ${
                          s.severity === "high" ? "border-eos-error/20 bg-eos-error-soft" : "border-eos-warning/20 bg-eos-warning-soft"
                        }`}
                      >
                        <ShieldAlert className={`mt-0.5 size-4 shrink-0 ${s.severity === "high" ? "text-eos-error" : "text-eos-warning"}`} strokeWidth={2} />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${s.severity === "high" ? "text-eos-error" : "text-eos-warning"}`}>{s.title}</p>
                          <p className="text-xs text-eos-text-muted">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.findingSuggestions.length === 0 && (
                  <div className="flex items-center gap-2 rounded-eos-sm border border-eos-success/20 bg-eos-success-soft px-3 py-2">
                    <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
                    <p className="text-sm text-eos-success">Niciun finding critic detectat pe site.</p>
                  </div>
                )}

                {/* Detected trackers list */}
                {result.trackers.length > 0 && (
                  <details className="rounded-eos-sm border border-eos-border">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-eos-text-muted hover:text-eos-text">
                      {result.trackers.length} trackere detectate — detalii
                    </summary>
                    <div className="divide-y divide-eos-border border-t border-eos-border">
                      {result.trackers.map((t) => (
                        <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="font-medium text-eos-text">{t.name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            t.gdprRisk === "high" ? "bg-eos-error-soft text-eos-error"
                            : t.gdprRisk === "medium" ? "bg-eos-warning-soft text-eos-warning"
                            : "bg-eos-success-soft text-eos-success"
                          }`}>
                            {t.gdprRisk === "high" ? "Risc ridicat" : t.gdprRisk === "medium" ? "Risc mediu" : "Risc scăzut"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {returnHref ? (
                  <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary-soft/20 p-3">
                    <p className="text-sm text-eos-text">
                      Rezultatul scanării poate merge direct în cockpit ca dovadă de recheck. Revizuiești nota precompletată și decizi dacă poți închide cazul.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild className="gap-2">
                        <Link href={returnHref}>
                          Înapoi în cockpit
                          <ArrowRight className="size-4" strokeWidth={2} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
