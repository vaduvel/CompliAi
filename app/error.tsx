"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)

    if (process.env.NODE_ENV === "development") {
      console.error("[GlobalError]", error)
    }
  }, [error])

  const isNetworkError =
    error.message.toLowerCase().includes("fetch") ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("failed to fetch")

  const isSessionError =
    error.message.toLowerCase().includes("session") ||
    error.message.toLowerCase().includes("unauthorized") ||
    error.message.toLowerCase().includes("401")

  const userMessage = isSessionError
    ? "Sesiunea a expirat. Conectează-te din nou."
    : isNetworkError
      ? "Verifică conexiunea la internet și încearcă din nou."
      : "Ceva nu a funcționat. Încearcă să reîncărci pagina."

  return (
    <html lang="ro">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-eos-bg px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="size-7" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-semibold text-eos-text">A apărut o eroare</h1>
            <p className="mt-2 text-sm leading-relaxed text-eos-text-muted">{userMessage}</p>
            <div className="mt-6 flex justify-center gap-3">
              {isSessionError ? (
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-sm font-medium text-eos-primary-text"
                >
                  Mergi la login
                </a>
              ) : (
                <Button onClick={reset} className="gap-2">
                  <RefreshCw className="size-4" strokeWidth={2} />
                  Încearcă din nou
                </Button>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
