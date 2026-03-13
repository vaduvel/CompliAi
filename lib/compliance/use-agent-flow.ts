"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { AgentProposalBundle, SourceEnvelope } from "@/lib/compliance/agent-os"

export function useAgentFlow() {
  const [agentModeActive, setAgentModeActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bundle, setBundle] = useState<AgentProposalBundle | null>(null)

  const runAgents = useCallback(async (envelope: SourceEnvelope) => {
    setLoading(true)
    setBundle(null)
    
    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(envelope),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to run agents")
      }

      const data = await response.json()
      setBundle(data)
      toast.success("Analiza agenților a fost finalizată.")
    } catch (error) {
      console.error("Agent run error:", error)
      toast.error("Eroare la rularea agenților. Verifică consola.")
    } finally {
      setLoading(false)
    }
  }, [])

  const commitBundle = useCallback(async (bundle: AgentProposalBundle) => {
    setLoading(true)
    
    try {
      const response = await fetch("/api/agent/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bundle),
      })

      if (!response.ok) {
        throw new Error("Failed to commit agent proposals")
      }

      toast.success("Propunerile agenților au fost aplicate.")
      setBundle(null)
      return true
    } catch (error) {
      console.error("Agent commit error:", error)
      toast.error("Eroare la salvare. Verifică consola.")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    agentModeActive,
    setAgentModeActive,
    loading,
    bundle,
    runAgents,
    setBundle,
    commitBundle
  }
}
