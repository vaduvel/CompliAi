"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, RefreshCw } from "lucide-react"

// Global error boundary — prinde erori din app/layout.tsx
// Trebuie să includă <html> și <body> conform Next.js docs.
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

  const isSessionError =
    error.message.toLowerCase().includes("session") ||
    error.message.toLowerCase().includes("unauthorized") ||
    error.message.toLowerCase().includes("401")

  const isNetworkError =
    error.message.toLowerCase().includes("fetch") ||
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("failed to fetch")

  const userMessage = isSessionError
    ? "Sesiunea a expirat. Conectează-te din nou."
    : isNetworkError
      ? "Verifică conexiunea la internet și încearcă din nou."
      : "Ceva nu a funcționat. Încearcă să reîncărci pagina."

  return (
    <html lang="ro">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8f9fa" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#fee2e2",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                marginBottom: "1rem",
              }}
            >
              <AlertTriangle size={28} strokeWidth={1.5} />
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", margin: "0 0 0.5rem" }}>
              A apărut o eroare
            </h1>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#6b7280", margin: "0 0 1.5rem" }}>
              {userMessage}
            </p>
            {isSessionError ? (
              <a
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Mergi la login
              </a>
            ) : (
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} strokeWidth={2} />
                Încearcă din nou
              </button>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
