"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Globe, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { SiteScanResult } from "@/lib/compliance/site-scanner"

type SiteScanCardProps = {
  existingScan?: {
    scannedAtISO: string
    websiteUrl: string
    trackerCount: number
    findingCount: number
    hasCookieBanner: boolean
    hasPrivacyPolicy: boolean
  } | null
  onScanComplete?: (result: SiteScanResult) => void
}

export function SiteScanCard({ existingScan, onScanComplete }: SiteScanCardProps) {
  const [url, setUrl] = useState(existingScan?.websiteUrl ?? "")
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

  const displayScan = result ?? (existingScan ? null : null)
  const hasPreviousScan = !!existingScan && !result

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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Previous scan summary */}
        {hasPreviousScan && (
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text-muted">
            Scan anterior: <span className="font-medium text-eos-text">{existingScan.websiteUrl}</span>
            {" "}· {existingScan.trackerCount} trackere · {existingScan.findingCount} finding-uri
            {" "}· {new Date(existingScan.scannedAtISO).toLocaleDateString("ro-RO")}
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
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle className="size-4 shrink-0" strokeWidth={2} />
            {error}
          </p>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {!result.reachable ? (
              <p className="text-sm text-red-600">Site-ul nu a putut fi accesat: {result.errorMessage}</p>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Trackere", value: result.trackers.length, warn: result.trackers.length > 0 },
                    { label: "Formulare", value: result.forms.length, warn: false },
                    { label: "Banner cookie", value: result.hasCookieBanner ? "Da" : "Nu", warn: !result.hasCookieBanner },
                    { label: "Privacy Policy", value: result.hasPrivacyPolicy ? "Da" : "Nu", warn: !result.hasPrivacyPolicy },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-eos-sm border p-2 text-center ${stat.warn ? "border-amber-200 bg-amber-50" : "border-eos-border bg-eos-bg-inset"}`}>
                      <p className={`text-base font-semibold ${stat.warn ? "text-amber-700" : "text-eos-text"}`}>{stat.value}</p>
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
                          s.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <ShieldAlert className={`mt-0.5 size-4 shrink-0 ${s.severity === "high" ? "text-red-600" : "text-amber-600"}`} strokeWidth={2} />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${s.severity === "high" ? "text-red-700" : "text-amber-700"}`}>{s.title}</p>
                          <p className="text-xs text-eos-text-muted">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.findingSuggestions.length === 0 && (
                  <div className="flex items-center gap-2 rounded-eos-sm border border-green-200 bg-green-50 px-3 py-2">
                    <CheckCircle2 className="size-4 shrink-0 text-green-600" strokeWidth={2} />
                    <p className="text-sm text-green-700">Niciun finding critic detectat pe site.</p>
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
                            t.gdprRisk === "high" ? "bg-red-100 text-red-700"
                            : t.gdprRisk === "medium" ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                          }`}>
                            {t.gdprRisk === "high" ? "Risc ridicat" : t.gdprRisk === "medium" ? "Risc mediu" : "Risc scăzut"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
