"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react"

import { AssistantMessageBubble } from "@/components/evidence-os/AssistantMessageBubble"
import { AssistantSuggestionChip } from "@/components/evidence-os/AssistantSuggestionChip"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { ChatMessage } from "@/lib/compliance/types"
import { dashboardRouteGroups, matchesDashboardRoute } from "@/lib/compliscan/dashboard-routes"

const DEFAULT_SUGGESTIONS = [
  "Care e prioritatea acum?",
  "Ce trebuie sa fac pentru GDPR?",
  "Explica-mi scorul de risc",
  "Care e statusul e-Factura?",
]

const SUGGESTION_GROUPS: Array<{ matchers: string[]; suggestions: string[] }> = [
  {
    matchers: [...dashboardRouteGroups.home],
    suggestions: ["Care e prioritatea acum?", "Explica-mi scorul de risc"],
  },
  {
    matchers: [...dashboardRouteGroups.scan],
    suggestions: ["Cum scanez un document?", "Ce formate sunt acceptate?"],
  },
  {
    matchers: [...dashboardRouteGroups.resolve],
    suggestions: ["Cum prioritizez ce am de rezolvat?", "Cum inchid un task cu dovada buna?"],
  },
  {
    matchers: [...dashboardRouteGroups.dosar],
    suggestions: ["Cum export dovada?", "Ce contine raportul PDF?"],
  },
  {
    matchers: [...dashboardRouteGroups.settings],
    suggestions: ["Ce inseamna motor OCR?", "Cum schimb workspace-ul?"],
  },
]

function getSuggestions(pathname: string) {
  const group = SUGGESTION_GROUPS.find((entry) =>
    entry.matchers.some((matcher) => matchesDashboardRoute(pathname, matcher))
  )
  return group?.suggestions ?? DEFAULT_SUGGESTIONS
}

export function FloatingAssistant({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [lastSentText, setLastSentText] = useState("")
  const [hasConnectionError, setHasConnectionError] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const panelId = useId()

  const suggestions = getSuggestions(pathname)

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
    setLastSentText(msg)
    setHasConnectionError(false)

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
      setHasConnectionError(true)
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Eroare de conexiune.",
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
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Asistent AI"
        aria-expanded={open}
        aria-controls={panelId}
        className={`fixed bottom-20 right-5 z-[80] grid h-13 w-13 place-items-center rounded-eos-md shadow-[var(--eos-shadow-md)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-eos-bg md:bottom-6 md:right-6 ${
          open
            ? "border border-eos-border bg-eos-surface text-eos-text-muted"
            : "border border-transparent bg-eos-primary text-eos-primary-text hover:bg-eos-primary-hover"
        }`}
      >
        {open ? (
          <X className="size-5" strokeWidth={2} />
        ) : (
          <MessageSquare className="size-5" strokeWidth={2} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          id={panelId}
          className="fixed bottom-36 left-4 right-4 z-[79] flex min-w-0 max-h-[min(36rem,calc(100vh-7.5rem))] flex-col overflow-hidden rounded-eos-lg border border-eos-border-subtle bg-eos-bg shadow-[var(--eos-shadow-lg)] sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))] md:bottom-20 md:right-6 xl:w-[26rem]"
        >
          <div className="border-b border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-eos-md border border-eos-border-subtle bg-eos-bg-panel text-eos-primary">
                <Sparkles className="size-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Asistent Evidence OS</Badge>
                </div>
                <p className="mt-2 break-words text-sm font-medium text-eos-text">
                  Asistent de context
                </p>
                <p className="text-[11px] text-eos-text-muted [overflow-wrap:anywhere]">
                  Orientare rapida, fara verdict final.
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
                    label="Porneste cu o intrebare scurta despre risc sau pasul urmator."
                    className="border-eos-border-subtle bg-eos-bg-panel px-4 py-8"
                  />
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-eos-text-muted">
                      Intrebari rapide
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
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

          {hasConnectionError && lastSentText && (
            <div className="flex items-center justify-between border-t border-eos-border-subtle bg-eos-bg-panel px-3 py-2">
              <span className="text-xs text-eos-text-muted">Mesajul nu a ajuns.</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { void handleSend(lastSentText) }}
              >
                Reincearca
              </Button>
            </div>
          )}

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
                <Send className="size-4" strokeWidth={2} />
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-eos-text-muted">
              Raspuns orientativ. Confirmi uman inainte de decizie.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
