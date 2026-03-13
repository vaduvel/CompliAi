"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

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
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const suggestions = SUGGESTIONS[pathname] ?? DEFAULT_SUGGESTIONS

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || sending) return
    setInput("")
    setSending(true)

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: msg },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      })
      const data = (await res.json()) as { answer?: string }
      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: data.answer! },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Eroare de conexiune. Incearca din nou." },
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
        className={`fixed bottom-20 right-5 z-[80] grid h-13 w-13 place-items-center rounded-2xl [box-shadow:var(--shadow-lg)] transition-all md:bottom-6 md:right-6 ${
          open
            ? "bg-[var(--color-surface-variant)] text-[var(--color-muted)]"
            : "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
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
        <div className="fixed bottom-36 right-5 z-[79] flex w-[340px] flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-xl)] md:bottom-20 md:right-6 md:w-[380px]" style={{ maxHeight: "480px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--bg-active)]">
              <Sparkles className="size-4 text-[var(--icon-secondary)]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">Asistent CompliScan</p>
              <p className="text-[11px] text-[var(--color-muted)]">Gemini · cunoaste contextul tau</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-muted)]">Intrebari frecvente pe aceasta pagina:</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void handleSend(s)}
                    className="block w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 py-2 text-left text-sm text-[var(--color-on-surface-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-on-surface)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--bg-active)]">
                    <Sparkles className="size-3 text-[var(--icon-secondary)]" strokeWidth={2} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                    msg.role === "user"
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "border border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--bg-active)]">
                  <Sparkles className="size-3 text-[var(--icon-secondary)]" strokeWidth={2} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 py-2">
                  <Loader2 className="size-3 animate-spin text-[var(--color-muted)]" />
                  <span className="text-xs text-[var(--color-muted)]">Genereaza raspuns...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="Intreaba ceva..."
                disabled={sending}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || sending}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-hover)] disabled:opacity-40"
              >
                <Send className="size-4" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
