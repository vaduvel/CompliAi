"use client"

// S1.5 — Issue 5 DPO: Cookie consent banner for public /shared/[token] pages.
// Discreet, GDPR-compliant, localStorage-persisted. No external tracking.

import { useEffect, useState } from "react"

const STORAGE_KEY = "compliscan_shared_cookie_consent"

export function SharedCookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage not available (e.g. private mode strict) — skip silently
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted")
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consimțământ cookie-uri"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-500">
          Această pagină folosește cookie-uri funcționale esențiale pentru a memora preferințele
          sesiunii. Nu colectăm date cu caracter personal prin această pagină și nu utilizăm
          cookie-uri de urmărire terță parte.{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-slate-700"
          >
            Politică confidențialitate
          </a>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-eos-md border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Am înțeles
        </button>
      </div>
    </div>
  )
}
