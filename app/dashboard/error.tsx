"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[DashboardError]", error)
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

  const isGeneratorError =
    error.message.toLowerCase().includes("gemini") ||
    error.message.toLowerCase().includes("generation") ||
    error.message.toLowerCase().includes("api")

  const userMessage = isSessionError
    ? "Sesiunea a expirat. Conectează-te din nou pentru a continua."
    : isNetworkError
      ? "Verifică conexiunea la internet și încearcă din nou."
      : isGeneratorError
        ? "Serviciul de generare este temporar indisponibil. Încearcă din nou în câteva minute."
        : "Ceva nu a funcționat pe această pagină. Poți încerca să reîncarci sau să mergi acasă."

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="size-6" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-eos-text">Eroare neașteptată</h2>
        <p className="mt-2 text-sm leading-relaxed text-eos-text-muted">{userMessage}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isSessionError ? (
            <Button onClick={() => router.push("/login")} className="gap-2">
              Mergi la login
            </Button>
          ) : (
            <>
              <Button onClick={reset} variant="outline" className="gap-2">
                <RefreshCw className="size-4" strokeWidth={2} />
                Încearcă din nou
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="ghost" className="gap-2">
                <Home className="size-4" strokeWidth={2} />
                Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
