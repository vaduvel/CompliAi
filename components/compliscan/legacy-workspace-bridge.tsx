"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/evidence-os/Button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"

type LegacyWorkspaceBridgeProps = {
  title: string
  description: string
  destinationHref: string
  fallbackHref: string
  fallbackLabel: string
  preserveCurrentPath?: boolean
  requestBody:
    | { workspaceMode: "portfolio" }
    | { workspaceMode: "org"; orgId: string }
}

export function LegacyWorkspaceBridge({
  title,
  description,
  destinationHref,
  fallbackHref,
  fallbackLabel,
  preserveCurrentPath = false,
  requestBody,
}: LegacyWorkspaceBridgeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const requestBodyKey = useMemo(() => JSON.stringify(requestBody), [requestBody])
  const targetHref = preserveCurrentPath ? pathname : destinationHref

  useEffect(() => {
    let cancelled = false

    async function bridgeWorkspace() {
      setError(null)

      try {
        const response = await fetch("/api/auth/select-workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBodyKey,
        })
        const payload = (await response.json().catch(() => ({}))) as { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut muta sesiunea pe noul traseu.")
        }

        if (cancelled) return

        router.replace(targetHref)
        router.refresh()
      } catch (nextError) {
        if (cancelled) return
        setError(nextError instanceof Error ? nextError.message : "Nu am putut muta sesiunea.")
      }
    }

    void bridgeWorkspace()

    return () => {
      cancelled = true
    }
  }, [attempt, requestBodyKey, router, targetHref])

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorScreen message={error} onRetry={() => setAttempt((current) => current + 1)} variant="section" />
        <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-5 py-4">
          <p className="text-sm font-semibold text-eos-text">{title}</p>
          <p className="mt-1 text-sm leading-6 text-eos-text-muted">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={fallbackHref}>{fallbackLabel}</Link>
            </Button>
            <Button size="sm" variant="default" onClick={() => setAttempt((current) => current + 1)}>
              Reîncearcă mutarea
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LoadingScreen variant="section" />
      <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-5 py-4">
        <p className="text-sm font-semibold text-eos-text">{title}</p>
        <p className="mt-1 text-sm leading-6 text-eos-text-muted">{description}</p>
      </div>
    </div>
  )
}
