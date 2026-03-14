"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react"

import { AssistantMessageBubble } from "@/components/evidence-os/AssistantMessageBubble"
import { AssistantSuggestionChip } from "@/components/evidence-os/AssistantSuggestionChip"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { ChatMessage } from "@/lib/compliance/types"

const SUGGESTIONS: Record<string, string[]> = {
  "/dashboard": ["Care e prioritatea acum?", "Explica-mi scorul de risc"],
  "/dashboard/scanari": ["Cum scanez un document?", "Ce formate sunt acceptate?"],
  "/dashboard/documente": ["Ce inseamna 'analiza in asteptare'?", "Cum citesc un raport de scan?"],
  "/dashboard/checklists": ["Ce e diferenta P1 vs P3?", "Cum rezolv un task?"],
  "/dashboard/alerte": ["De ce am alerte deschise?", "Cum inchid o alerta?"],
  "/dashboard/sisteme": ["Ce inseamna high-risk AI Act?", "Cum adaug un sistem AI?"],
  "/dashboard/rapoarte": ["Cum export dovada?", "Ce contine raportul PDF?"],
  "/dashboard/setari": ["Ce inseamna motor OCR?", "Cum schimb workspace-ul?"],
}

const DEFAULT_SUGGESTIONS = [
  "Care e prioritatea acum?",
  "Ce trebuie sa fac pentru GDPR?",
  "Explica-mi scorul de risc",
  "Care e statusul e-Factura?",
]

export function FloatingAssistant({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const suggestions = SUGGESTIONS[pathname] ?? DEFAULT_SUGGESTIONS

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 100)
      return () => window.clearTimeout(timer)
    }
  }, [open])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || sending) return
    setInput("")
    setSending(true)

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: msg,
        createdAtISO: new Date().toISOString(),
      },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      })
      const data = (await res.json()) as { answer?: string }
      const answer = data.answer?.trim()
      if (answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: answer,
            createdAtISO: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Eroare de conexiune. Incearca din nou.",
          createdAtISO: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Asistent AI"
        className={`fixed bottom-20 right-5 z-[80] grid h-13 w-13 place-items-center rounded-2xl transition-all [box-shadow:var(--shadow-lg)] md:bottom-6 md:right-6 ${
          open
            ? "border border-eos-border bg-eos-surface text-eos-text-muted"
            : "border border-transparent bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
        }`}
      >
        {open ? (
          <X className="size-5" strokeWidth={2.25} />
        ) : (
          <MessageSquare className="size-5" strokeWidth={2.25} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 left-4 right-4 z-[79] flex min-w-0 max-h-[min(36rem,calc(100vh-7.5rem))] flex-col overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg shadow-[var(--shadow-xl)] sm:left-auto sm:w-[min(23rem,calc(100vw-2rem))] md:bottom-20 md:right-6 lg:w-[24rem]">
          <div className="border-b border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-eos-md border border-eos-border-subtle bg-eos-bg-panel text-eos-primary">
                <Sparkles className="size-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Asistent Evidence OS</Badge>
                  <Badge variant="warning">Validare umana</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-eos-text">Asistent de context</p>
                <p className="text-[11px] text-eos-text-muted">
                  Contextul paginii te ajuta cu orientare rapida, nu cu verdict final.
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-3" role="log" aria-live="polite" aria-relevant="additions text">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <EmptyState
                    icon={Sparkles}
                    title="Intreaba direct din pagina"
                    label="Porneste cu o intrebare scurta despre risc, pasul urmator sau sensul unui status."
                    className="border-eos-border-subtle bg-eos-bg-panel px-4 py-8"
                  />
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-eos-text-muted">
                      Intrebari rapide
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {suggestions.map((suggestion) => (
                        <AssistantSuggestionChip
                          key={suggestion}
                          suggestion={suggestion}
                          onSelect={(value) => {
                            void handleSend(value)
                          }}
                          disabled={sending}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <AssistantMessageBubble key={msg.id} message={msg} />
              ))}

              {sending && (
                <div className="flex justify-start gap-3" role="status" aria-live="polite">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset text-eos-primary">
                    <Sparkles className="size-4" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-3">
                    <Loader2 className="size-4 animate-spin text-eos-text-muted" aria-hidden="true" />
                    <span className="text-sm text-eos-text-muted">Genereaza raspuns...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-eos-border-subtle bg-eos-bg-panel p-3">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSend()
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Intreaba ceva despre pagina curenta"
                disabled={sending}
                className="min-w-0 flex-1 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text outline-none transition-[border-color,box-shadow] placeholder:text-eos-text-muted focus:border-eos-primary focus:ring-2 focus:ring-eos-primary-focus"
                autoComplete="off"
                enterKeyHint="send"
                aria-label="Mesaj pentru asistentul contextual"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sending}
                className="h-10 w-full shrink-0 rounded-eos-md sm:w-10"
                aria-label="Trimite mesajul"
                title="Trimite mesajul"
              >
                <Send className="size-4" strokeWidth={2.25} />
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-eos-text-muted">
              Raspuns orientativ. Verifica uman inainte de orice decizie oficiala.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
