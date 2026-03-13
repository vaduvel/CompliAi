"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import { useCockpit } from "@/components/compliscan/use-cockpit"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/lib/compliance/types"

export default function AsistentPage() {
  const cockpit = useCockpit()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (cockpit.data?.state.chat) {
      setMessages(cockpit.data.state.chat)
    }
  }, [cockpit.data])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen />

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setSending(true)

    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAtISO: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = (await res.json()) as { answer?: string; error?: string }

      if (data.answer) {
        const assistantMsg: ChatMessage = {
          id: `tmp-${Date.now()}-a`,
          role: "assistant",
          content: data.answer,
          createdAtISO: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      }
    } catch {
      const errMsg: ChatMessage = {
        id: `tmp-${Date.now()}-err`,
        role: "assistant",
        content: "Eroare de conexiune. Incearca din nou.",
        createdAtISO: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6">
      <PageHeader
        title="Asistent AI"
        description="Intrebari despre conformitate GDPR, EU AI Act, e-Factura"
        score={cockpit.data.summary.score}
        riskLabel={cockpit.data.summary.riskLabel}
      />

      <PillarTabs sectionId="dovada" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-variant)]">
                <Sparkles className="size-7 text-[var(--color-primary)]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--color-on-surface)]">Asistent CompliScan</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Alimentat de Gemini. Pune o intrebare despre conformitate.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "Ce riscuri am acum?",
                  "Ce trebuie sa fac pentru GDPR?",
                  "Explica-mi scorul de risc",
                  "Care e statusul e-Factura?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-2.5 text-sm text-[var(--color-on-surface-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-on-surface)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--bg-active)] text-[var(--icon-secondary)]">
                  <Sparkles className="size-4" strokeWidth={2} />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "user"
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "border border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)]"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`mt-1 text-[11px] ${msg.role === "user" ? "text-[var(--color-on-primary)] opacity-70" : "text-[var(--color-muted)]"}`}>
                  {new Date(msg.createdAtISO).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--bg-active)] text-[var(--icon-secondary)]">
                <Sparkles className="size-4" strokeWidth={2} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-3">
                <Loader2 className="size-4 animate-spin text-[var(--color-muted)]" />
                <span className="text-sm text-[var(--color-muted)]">Gemini genereaza raspuns...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder="Pune o intrebare despre conformitate..."
              className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-2.5 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]"
              disabled={sending}
            />
            <Button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="h-10 rounded-xl bg-[var(--color-primary)] px-4 text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            >
              <Send className="size-4" strokeWidth={2.25} />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            Recomandarile sunt AI — verifica uman inainte de decizii oficiale.
          </p>
        </div>
      </div>
    </div>
  )
}
