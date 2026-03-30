"use client"

import { useState } from "react"
import { Check, Copy, Cookie, Loader2, RefreshCw, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type BannerCategory = {
  id: "necessary" | "analytics" | "advertising" | "functional"
  label: string
  description: string
  required: boolean
  trackers: string[]
}

type GenerateResult = {
  html: string
  categories: BannerCategory[]
  trackerCount: number
  hasConsentRequired: boolean
}

const CATEGORY_ICONS: Record<BannerCategory["id"], string> = {
  necessary: "🔒",
  analytics: "📊",
  advertising: "📣",
  functional: "⚙️",
}

export function CookieBannerCard() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setState("loading")
    setResult(null)
    setErrorMsg(null)

    try {
      const response = await fetch("/api/cookie-banner/generate", {
        method: "POST",
        cache: "no-store",
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error ?? `Eroare server (${response.status})`
        )
      }

      setResult(data as GenerateResult)
      setState("done")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Nu am putut genera banner-ul.")
      setState("error")
    }
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select textarea
    }
  }

  function handleReset() {
    setState("idle")
    setResult(null)
    setErrorMsg(null)
    setCopied(false)
  }

  const optionalCategories = result?.categories.filter((c) => !c.required) ?? []

  return (
    <Card className="col-span-full border-eos-border bg-eos-surface sm:col-span-2 lg:col-span-2">
      <CardHeader className="border-b border-eos-border-subtle pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">🍪</span>
            <div>
              <CardTitle className="text-sm font-semibold text-eos-text">Banner Cookie Consent</CardTitle>
              <p className="mt-0.5 text-xs text-eos-text-muted">
                Snippet HTML/CSS/JS gata de copiat — bazat pe trackerele detectate pe site
              </p>
            </div>
          </div>

          {state === "done" && (
            <Badge variant="secondary" className="shrink-0 normal-case tracking-normal">
              <ShieldCheck className="mr-1 size-3" />
              {result?.trackerCount ?? 0} trackere
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {state === "idle" && (
          <div className="space-y-3">
            <p className="text-xs text-eos-text-muted">
              Generăm un banner GDPR/ePrivacy complet, fără dependențe externe, cu consimțământ
              pe categorii detectate automat. Copiezi snippet-ul direct în site.
            </p>
            <Button size="sm" onClick={handleGenerate}>
              <Cookie className="mr-1.5 size-3.5" />
              Generează banner
            </Button>
          </div>
        )}

        {state === "loading" && (
          <div className="flex items-center gap-2 text-sm text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" />
            Se generează banner-ul…
          </div>
        )}

        {state === "error" && (
          <div className="space-y-3">
            <p className="rounded-eos-lg border border-eos-danger/30 bg-eos-danger/[0.08] px-3 py-2 text-xs text-eos-text">
              {errorMsg}
            </p>
            <Button size="sm" variant="outline" onClick={handleGenerate}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Reîncearcă
            </Button>
          </div>
        )}

        {state === "done" && result && (
          <div className="space-y-4">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {result.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 rounded-full border border-eos-border bg-eos-canvas px-2.5 py-0.5 text-xs text-eos-text-muted"
                >
                  <span>{CATEGORY_ICONS[cat.id]}</span>
                  <span className="font-medium text-eos-text">{cat.label}</span>
                  {cat.trackers.length > 0 && (
                    <span className="text-eos-text-tertiary">({cat.trackers.length})</span>
                  )}
                  {cat.required && (
                    <span className="text-eos-text-tertiary">· întotdeauna activ</span>
                  )}
                </span>
              ))}
            </div>

            {/* Optional category descriptions */}
            {optionalCategories.length > 0 && (
              <div className="space-y-1">
                {optionalCategories.map((cat) => (
                  <p key={cat.id} className="text-xs text-eos-text-muted">
                    <span className="font-medium text-eos-text">{cat.label}:</span>{" "}
                    {cat.description}
                  </p>
                ))}
              </div>
            )}

            {!result.hasConsentRequired && (
              <p className="text-xs text-eos-text-muted">
                Nu au fost detectate trackere care necesită consimțământ pe ultimul scan.
                Banner-ul include doar categoria &ldquo;Strict necesare&rdquo;.
              </p>
            )}

            {/* HTML snippet preview */}
            <div className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-canvas">
              <div className="flex items-center justify-between border-b border-eos-border-subtle px-3 py-2">
                <span className="text-[11px] font-medium text-eos-text-muted">snippet.html</span>
                <span className="text-[11px] text-eos-text-tertiary">
                  {result.html.length.toLocaleString("ro-RO")} caractere
                </span>
              </div>
              <pre className="max-h-48 overflow-auto p-3 text-[11px] leading-5 text-eos-text-muted">
                {result.html.slice(0, 800)}
                {result.html.length > 800 && "\n…"}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-1.5 size-3.5" />
                    Copiat!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-3.5" />
                    Copiază HTML
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Regenerează
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
