"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type PortfolioOrgActionButtonProps = {
  orgId: string
  destination: string
  label: string
  size?: "sm" | "default"
  variant?: "outline" | "default" | "ghost"
}

export function PortfolioOrgActionButton({
  orgId,
  destination,
  label,
  size = "sm",
  variant = "outline",
}: PortfolioOrgActionButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleOpenOrg() {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceMode: "org", orgId }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Nu am putut deschide firma selectată.")
      }

      window.location.assign(destination)
    } catch (error) {
      toast.error("Schimbarea pe firmă a eșuat", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={loading}
      className="gap-2"
      onClick={() => void handleOpenOrg()}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
      {label}
    </Button>
  )
}
