"use client"

// components/compliscan/feedback-prompt.tsx
// V4.4.6 — Micro-feedback prompt: NPS-like thumbs up/down after key actions.
// Fire-and-forget POST to /api/feedback — user sees confirmation, no redirect.

import { useState } from "react"
import { ThumbsUp, ThumbsDown, X } from "lucide-react"

type FeedbackContext = "after_document" | "after_task_close" | "after_applicability" | "general"

type FeedbackPromptProps = {
  context: FeedbackContext
  label?: string
  onDismiss?: () => void
}

const CONTEXT_LABELS: Record<FeedbackContext, string> = {
  after_document: "Documentul a fost util?",
  after_task_close: "Pașii de remediere au fost clari?",
  after_applicability: "Evaluarea legislativă reflectă realitatea?",
  general: "CompliScan ți-a fost util?",
}

export function FeedbackPrompt({ context, label, onDismiss }: FeedbackPromptProps) {
  const [sent, setSent] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const promptLabel = label ?? CONTEXT_LABELS[context]

  async function sendFeedback(value: "up" | "down") {
    setSent(true)
    // Fire-and-forget — ignore errors
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, value }),
      })
    } catch {
      // Silent
    }
  }

  function dismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 bg-muted/40 rounded-lg">
        <ThumbsUp className="h-4 w-4 text-eos-success" />
        <span>Mulțumim pentru feedback!</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-muted/40 rounded-lg text-sm">
      <span className="text-muted-foreground flex-1">{promptLabel}</span>
      <button
        onClick={() => sendFeedback("up")}
        className="p-1.5 rounded hover:bg-eos-success-soft dark:hover:bg-eos-success/30 text-muted-foreground hover:text-eos-success transition-colors"
        aria-label="Da, a fost util"
        title="Da"
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        onClick={() => sendFeedback("down")}
        className="p-1.5 rounded hover:bg-eos-error-soft dark:hover:bg-eos-error/30 text-muted-foreground hover:text-eos-error transition-colors"
        aria-label="Nu, nu a fost util"
        title="Nu"
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
      <button
        onClick={dismiss}
        className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="Închide"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
