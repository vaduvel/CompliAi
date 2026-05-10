"use client"

// Fiscal Assistant — chat sidebar pentru contabili CECCAR.
// UX:
//   - Header cu provider badge (🔒 Local AI / ☁️ Cloud)
//   - Suggested questions chips (4 categorii)
//   - Mesaje stream cu SSE
//   - Input cu Send button (Shift+Enter newline, Enter trimite)
//   - Footer cu disclaimer CECCAR

import { useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  Cloud,
  Loader2,
  Lock,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type ChatRole = "user" | "assistant"

type ChatMessage = {
  role: ChatRole
  content: string
}

type ProviderId = "gemini" | "mistral" | "local-gemma"

type ProvidersStatus = {
  providers: Record<
    ProviderId,
    {
      available: boolean
      privacy: string
      model: string
      url?: string
      installHint?: string | null
    }
  >
  defaultProvider: ProviderId
  recommendation: ProviderId | "none"
}

const SUGGESTED = [
  {
    label: "Termen fiscal",
    text: "Care e următorul meu termen fiscal critic?",
  },
  {
    label: "P300 vs D300",
    text: "Cum răspund la o notificare e-TVA cu diferențe sub prag?",
  },
  {
    label: "SAF-T",
    text: "Care e scorul meu actual SAF-T și cum îl îmbunătățesc?",
  },
  {
    label: "Amenzi",
    text: "Cât e amenda pentru factură netransmisă peste 5 zile?",
  },
]

export function FiscalAssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<ProvidersStatus | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [provider, setProvider] = useState<ProviderId>("local-gemma")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    void fetch("/api/assistant/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProvidersStatus | null) => {
        if (!data) return
        setStatus(data)
        // Default provider: local-gemma dacă e disponibil
        if (data.providers["local-gemma"].available) setProvider("local-gemma")
        else if (data.providers.gemini.available) setProvider("gemini")
        else if (data.providers.mistral.available) setProvider("mistral")
      })
      .catch(() => null)
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return
    setStreaming(true)

    const userMsg: ChatMessage = { role: "user", content: trimmed }
    const initialAssistant: ChatMessage = { role: "assistant", content: "" }
    const newMessages = [...messages, userMsg, initialAssistant]
    setMessages(newMessages)
    setInput("")

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          provider,
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Eroare assistant." }))
        toast.error(err.error ?? "Asistentul nu poate răspunde.", {
          description:
            err.code === "ASSISTANT_LOCAL_UNAVAILABLE"
              ? "Pornește Ollama: `ollama serve` și `ollama pull gemma4:e2b`."
              : undefined,
        })
        setMessages((curr) => curr.slice(0, -2))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data:")) continue
          const payload = line.slice(5).trim()
          if (!payload) continue
          try {
            const ev = JSON.parse(payload) as
              | { type: "delta"; text: string }
              | { type: "done"; provider: ProviderId; model: string }
              | { type: "error"; reason: string }
            if (ev.type === "delta") {
              assistantContent += ev.text
              setMessages((curr) => {
                const cp = [...curr]
                cp[cp.length - 1] = { role: "assistant", content: assistantContent }
                return cp
              })
            } else if (ev.type === "error") {
              toast.error("Asistent: " + ev.reason)
              setMessages((curr) => curr.slice(0, -1))
              return
            }
          } catch {
            // ignore parse error
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la chat.")
      setMessages((curr) => curr.slice(0, -1))
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  if (!open) return null

  const currentProviderStatus = status?.providers[provider]
  const isLocal = provider === "local-gemma"

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-eos-border bg-eos-surface shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-eos-border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-eos-primary" strokeWidth={2} />
            <h3
              data-display-text="true"
              className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Asistent fiscal AI
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-surface-variant hover:text-eos-text"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </header>

        {/* Provider badge */}
        <div className="border-b border-eos-border-subtle bg-eos-surface-elevated px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                isLocal
                  ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                  : "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
              }`}
            >
              {isLocal ? (
                <>
                  <Lock className="size-3" strokeWidth={2.5} /> 100% on-device
                </>
              ) : (
                <>
                  <Cloud className="size-3" strokeWidth={2.5} /> Cloud{" "}
                  {provider === "mistral" ? "EU" : "(Google)"}
                </>
              )}
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as ProviderId)}
              className="h-6 rounded-eos-sm border border-eos-border bg-eos-surface px-2 font-mono text-[10.5px] text-eos-text"
            >
              {(["local-gemma", "gemini", "mistral"] as ProviderId[]).map((p) => {
                const ps = status?.providers[p]
                return (
                  <option key={p} value={p} disabled={!ps?.available}>
                    {p === "local-gemma"
                      ? `Local (${ps?.model ?? "Gemma 4"})`
                      : p === "gemini"
                        ? `Gemini ${ps?.model ?? ""}`
                        : `Mistral ${ps?.model ?? "EU"}`}
                    {!ps?.available ? " — indisp." : ""}
                  </option>
                )
              })}
            </select>
          </div>
          {isLocal && currentProviderStatus?.installHint && (
            <p className="mt-1 text-[10.5px] leading-[1.4] text-eos-warning">
              <AlertCircle className="mr-1 inline size-3 align-text-bottom" strokeWidth={2} />
              {currentProviderStatus.installHint}
            </p>
          )}
          {!isLocal && (
            <p className="mt-1 text-[10.5px] leading-[1.4] text-eos-text-muted">
              Datele organizației tale pleacă la {provider === "mistral" ? "Mistral (Paris)" : "Google"}. Pentru
              privacy 100% on-device, instalează Ollama + Gemma 4.
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3">
                <p className="text-[12px] leading-[1.55] text-eos-text-muted">
                  Sunt asistentul tău fiscal AI. Pot răspunde la întrebări despre e-Factura, e-TVA,
                  SAF-T, D300/D394/D390 și amenzi ANAF. Folosesc datele organizației tale + biblioteca
                  oficială de template-uri răspunsuri ANAF.
                </p>
              </div>
              <div>
                <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Întrebări frecvente
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => void send(s.text)}
                      disabled={streaming}
                      className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 text-left text-[12px] text-eos-text transition-colors hover:border-eos-border-strong hover:bg-eos-secondary-hover disabled:opacity-50"
                    >
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-eos-primary">
                        {s.label}
                      </span>
                      <p className="mt-0.5">{s.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 ${m.role === "user" ? "flex justify-end" : "flex justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-eos-md px-3 py-2 text-[12.5px] leading-[1.55] ${
                  m.role === "user"
                    ? "bg-eos-primary text-white"
                    : "border border-eos-border bg-eos-surface-elevated text-eos-text"
                }`}
              >
                {m.role === "assistant" && !m.content && streaming ? (
                  <span className="inline-flex items-center gap-1 text-eos-text-muted">
                    <Loader2 className="size-3 animate-spin" strokeWidth={2} /> Gândește...
                  </span>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-eos-border-subtle bg-eos-surface-elevated p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Întreabă-mă orice despre fiscal..."
              rows={2}
              className="ring-focus min-h-[40px] flex-1 resize-none rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
            />
            <Button
              onClick={() => void send(input)}
              disabled={!input.trim() || streaming}
              size="sm"
            >
              {streaming ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Send className="size-3.5" strokeWidth={2} />
              )}
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-eos-text-tertiary">
            Validare umană obligatorie — decizia rămâne la responsabilitatea profesională CECCAR.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Trigger button (fixed bottom-right) ──────────────────────────────────────

export function FiscalAssistantTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-12 items-center gap-2 rounded-full bg-eos-primary px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-lg transition-transform hover:scale-105"
        data-testid="fiscal-assistant-trigger"
      >
        <Sparkles className="size-4" strokeWidth={2} />
        Asistent AI
      </button>
      <FiscalAssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
