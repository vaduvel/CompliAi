"use client"

// components/compliscan/cookie-consent.tsx
// V4.2.3 — Cookie consent banner. Minimal, GDPR Art. 7 compliant.
// Stores consent in localStorage. No cookies set until user accepts.

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"

const CONSENT_KEY = "compliscan_cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-eos-xl border border-eos-border bg-eos-surface p-4 shadow-lg">
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
