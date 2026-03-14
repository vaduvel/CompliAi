"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen, PageHeader } from "@/components/compliscan/route-sections"
import { AssistantMessageBubble } from "@/components/evidence-os/AssistantMessageBubble"
import { AssistantSuggestionChip } from "@/components/evidence-os/AssistantSuggestionChip"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { useCockpit } from "@/components/compliscan/use-cockpit"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage } from "@/lib/compliance/types"

const assistantSuggestions = [
  "Ce riscuri am acum?",
  "Ce trebuie sa fac pentru GDPR?",
  "Explica-mi scorul de risc",
  "Care e statusul e-Factura?",
]

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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg shadow-sm">
        <div className="border-b border-eos-border-subtle bg-eos-bg-inset px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="outline" className="mb-2">
                Asistent Evidence OS
              </Badge>
              <h2 className="text-lg font-semibold text-eos-text">Conversație ghidată pentru conformitate</h2>
              <p className="mt-1 text-sm text-eos-text-muted">
                Pune întrebări despre GDPR, EU AI Act și e-Factura. Verificarea umană rămâne obligatorie pentru deciziile oficiale.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Motor conversațional: Gemini</Badge>
              <Badge variant="warning">Validare umană recomandată</Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-5" aria-label="Conversatie cu asistentul de conformitate">
          <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6 py-12">
              <EmptyState
                icon={Sparkles}
                label="Asistentul este pregătit. Începe cu o întrebare despre starea actuală, riscuri sau pașii următori de conformitate."
                className="border-eos-border-subtle bg-eos-bg-panel"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {assistantSuggestions.map((suggestion) => (
                  <AssistantSuggestionChip
                    key={suggestion}
                    suggestion={suggestion}
                    onSelect={setInput}
                    disabled={sending}
                  />
                ))}
              </div>
            </div>
          )}

            {messages.map((msg) => (
              <AssistantMessageBubble key={msg.id} message={msg} />
            ))}

            {sending && (
              <div className="flex gap-3 justify-start" role="status" aria-live="polite">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset text-eos-primary">
                  <Sparkles className="size-4" strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-eos-text-muted" aria-hidden="true" />
                  <span className="text-sm text-eos-text-muted">Gemini genereaza raspuns...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-eos-border-subtle bg-eos-bg-panel p-4">
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
              className="flex-1 rounded-eos-md border border-eos-border bg-eos-surface px-4 py-2.5 text-sm text-eos-text outline-none transition-[border-color,box-shadow] placeholder:text-eos-text-muted focus:border-eos-primary focus:ring-2 focus:ring-eos-primary-focus"
              disabled={sending}
              aria-label="Mesaj pentru asistentul de conformitate"
            />
            <Button
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              className="h-10 rounded-eos-md px-4"
            >
              <Send className="size-4" strokeWidth={2.25} />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-eos-text-muted">
            Recomandarile sunt AI — verifica uman inainte de decizii oficiale.
          </p>
        </div>
      </section>
    </div>
  )
}
