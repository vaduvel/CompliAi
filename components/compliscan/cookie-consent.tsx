"use client"

// components/compliscan/cookie-consent.tsx
// V4.2.3 — Cookie consent banner. Minimal, GDPR Art. 7 compliant.
// Stores consent in localStorage. No cookies set until user accepts.

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cookie, X } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"

const CONSENT_KEY = "compliscan_cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const isClientFacingPage = pathname?.startsWith("/shared/") || pathname?.startsWith("/trust/")

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
    } catch {
      // SSR or storage blocked
    }
  }, [])

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, "accepted") } catch {}
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem(CONSENT_KEY, "declined") } catch {}
    setVisible(false)
  }

  if (!visible) return null

  if (isClientFacingPage) {
    return (
      <div className="fixed bottom-3 right-3 z-50 max-w-[280px] rounded-eos-lg border border-slate-200 bg-white/95 p-3 text-slate-600 shadow-sm backdrop-blur">
        <div className="flex items-start gap-2">
          <Cookie className="mt-0.5 size-4 shrink-0 text-slate-400" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-4">
              Folosim doar cookie-uri esențiale pentru funcționarea paginii.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={accept}
                className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={decline}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
              >
                Închide
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={decline}
            className="shrink-0 rounded p-0.5 text-slate-300 hover:text-slate-500"
            aria-label="Închide"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-eos-lg border border-eos-border bg-eos-surface p-4 shadow-lg">
        <Cookie className="mt-0.5 size-5 shrink-0 text-eos-primary" strokeWidth={2} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-eos-text">
            Folosim cookie-uri esențiale pentru autentificare și funcționarea aplicației.
            Nu folosim cookie-uri de tracking sau publicitate.
          </p>
          <p className="text-xs text-eos-text-muted">
            Detalii în{" "}
            <Link href="/privacy" className="underline hover:text-eos-text">
              Politica de Confidențialitate
            </Link>
            .
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={accept}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={decline}>Refuz</Button>
          </div>
        </div>
        <button
          type="button"
          onClick={decline}
          className="shrink-0 rounded p-1 text-eos-text-muted hover:text-eos-text"
          aria-label="Închide"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
