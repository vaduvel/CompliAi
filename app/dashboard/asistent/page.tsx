"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { ArrowRight, Loader2, Send, Sparkles } from "lucide-react"

import { LoadingScreen } from "@/components/compliscan/route-sections"
import { AssistantMessageBubble } from "@/components/evidence-os/AssistantMessageBubble"
import { AssistantSuggestionChip } from "@/components/evidence-os/AssistantSuggestionChip"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { GuideCard } from "@/components/evidence-os/GuideCard"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ScrollArea } from "@/components/evidence-os/ScrollArea"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ChatMessage } from "@/lib/compliance/types"

const assistantSuggestions = [
  "Ce riscuri am acum?",
  "Ce trebuie sa fac pentru GDPR?",
  "Explica-mi scorul de risc",
  "Care e statusul e-Factura?",
]

export default function AsistentPage() {
  const cockpit = useCockpitData()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const composerNoteId = useId()
  const suggestionsId = useId()
  const hasMessages = messages.length > 0

  useEffect(() => {
    if (cockpit.data?.state.chat) {
      setMessages(cockpit.data.state.chat)
    }
  }, [cockpit.data])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const summaryItems: SummaryStripItem[] = [
    {
      label: "Mesaje in istoric",
      value: `${messages.length}`,
      hint: messages.length > 0 ? "conversatia curenta ramane locala acestui workspace" : "inca nu ai pornit conversatia",
      tone: messages.length > 0 ? "accent" : "neutral",
    },
    {
      label: "Intrebari rapide",
      value: `${assistantSuggestions.length}`,
      hint: "scurtaturi pentru orientare, nu verdict automat",
      tone: "neutral",
    },
    {
      label: "Context activ",
      value: cockpit.data.workspace.orgName,
      hint: "asistentul lucreaza in contextul workspace-ului curent",
      tone: "success",
    },
    {
      label: "Regula",
      value: "validare umana",
      hint: "asistentul sprijina analiza, dar omul valideaza concluzia finala",
      tone: "warning",
    },
  ]

  function handleSuggestionSelect(suggestion: string) {
    setInput(suggestion)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

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
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-6 lg:h-[calc(100vh-120px)]">
      <PageIntro
        eyebrow="Utilitar global / Asistent"
        title="Intrebari rapide despre risc, obligatii si pasul urmator"
        description="Asistentul ramane utilitar global pentru clarificare si orientare. Nu este sursa de adevar finala si nu inlocuieste validarea umana sau fluxurile reale de lucru. Executia ramane in Scanare, Control si Dovada."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              utilitar global
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              omul valideaza
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot asistent
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.home}>
                Dashboard
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild>
              <Link href={dashboardRoutes.resolve}>
                De rezolvat
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Asistent"
            title="Orientare rapida, nu verdict final"
            description="Asistentul te ajuta sa formulezi intrebarea buna si sa intelegi contextul, dar decizia finala si validarea raman la om si in workspaces-urile reale."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionBoundary
          eyebrow="Flux canonic"
          title="Asistentul explica si te redirectioneaza, nu executa in locul produsului"
          description="Poti clarifica riscul, obligatia sau urmatorul pas, apoi revii in Dashboard, Scaneaza sau De rezolvat pentru actiunea reala."
          support={
            <div className="grid gap-4 md:grid-cols-3">
              <GuideCard
                title="1. Formulezi intrebarea"
                detail="Pornesti cu o intrebare scurta despre risc, obligatii sau status."
              />
              <GuideCard
                title="2. Clarifici contextul"
                detail="Asistentul te ajuta sa intelegi problema si sa vezi urmatorul pas plauzibil."
              />
              <GuideCard
                title="3. Revii in produs"
                detail="Pentru executie, review sau dovada mergi inapoi in paginile principale."
              />
            </div>
          }
        />
        <HandoffCard
          title="Dupa clarificare revii in flow-ul real"
          description="Asistentul nu inchide task-uri, nu valideaza controlul si nu livreaza audit pack-ul in locul tau. Il folosesti pentru orientare, apoi continui in pagina potrivita."
          destinationLabel="dashboard / scaneaza / de rezolvat"
          checklist={[
            "nu tratezi raspunsul ca verdict definitiv",
            "nu sari peste validarea umana",
            "duci actiunea reala inapoi in produs",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={dashboardRoutes.scan}>Deschide Scaneaza</Link>
              </Button>
              <Button asChild>
                <Link href={dashboardRoutes.resolve}>Deschide De rezolvat</Link>
              </Button>
            </>
          }
        />
      </div>

      <section className="flex min-h-[32rem] min-w-0 flex-1 flex-col overflow-hidden rounded-eos-xl border border-eos-border-subtle bg-eos-bg shadow-sm">
        <div className="border-b border-eos-border-subtle bg-eos-bg-inset px-5 py-4">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">Asistent Evidence OS</Badge>
                <Badge variant="warning">Validare umana</Badge>
              </div>
              <h2 className="text-lg font-semibold text-eos-text">Asistent de conformitate</h2>
              <p className="mt-1 max-w-2xl text-sm text-eos-text-muted [overflow-wrap:anywhere]">
                Intreaba despre GDPR, EU AI Act si e-Factura, apoi valideaza uman concluziile oficiale.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Gemini</Badge>
              <Badge variant="outline">Context de lucru</Badge>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-5" aria-label="Conversatie cu asistentul de conformitate">
          <div className="mx-auto w-full max-w-4xl space-y-4" role="log" aria-live="polite" aria-relevant="additions text">
            {!hasMessages && (
              <div className="space-y-6 py-12">
                <EmptyState
                  icon={Sparkles}
                  title="Asistentul este pregatit"
                  label="Incepe cu o intrebare despre starea actuala, riscurile curente sau pasii urmatori de conformitate."
                  className="border-eos-border-subtle bg-eos-bg-panel"
                />
                <div className="space-y-3" aria-labelledby={suggestionsId}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={suggestionsId} className="text-sm font-medium text-eos-text">
                      Intrebari rapide
                    </h3>
                    <p className="text-xs text-eos-text-muted">Alege una sau scrie direct.</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {assistantSuggestions.map((suggestion) => (
                      <AssistantSuggestionChip
                        key={suggestion}
                        suggestion={suggestion}
                        onSelect={handleSuggestionSelect}
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
              <div className="flex gap-3 justify-start" role="status" aria-live="polite">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset text-eos-primary">
                  <Sparkles className="size-4" strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-eos-text-muted" aria-hidden="true" />
                  <span className="text-sm text-eos-text-muted">Se genereaza raspuns...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-eos-border-subtle bg-eos-bg-panel p-4">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium text-eos-text">Mesaj nou</h3>
                <p className="text-xs text-eos-text-muted">
                  Foloseste intrebari scurte si context clar.
                </p>
              </div>
              {hasMessages ? (
                <Badge variant="outline" className="shrink-0">
                  Conversatie activa
                </Badge>
              ) : null}
            </div>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSend()
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Intreaba despre risc, GDPR sau e-Factura"
                className="min-w-0 flex-1 rounded-eos-md border border-eos-border bg-eos-surface px-4 py-2.5 text-sm text-eos-text outline-none transition-[border-color,box-shadow] placeholder:text-eos-text-muted focus:border-eos-primary focus:ring-2 focus:ring-eos-primary-focus"
                disabled={sending}
                aria-label="Mesaj pentru asistentul de conformitate"
                aria-describedby={composerNoteId}
                autoComplete="off"
                enterKeyHint="send"
              />
              <Button
                type="submit"
                disabled={!input.trim() || sending}
                className="h-10 gap-2 rounded-eos-md px-4 sm:self-auto"
                aria-label="Trimite mesajul"
              >
                <Send className="size-4 shrink-0" strokeWidth={2} />
                <span className="sm:hidden">Trimite</span>
              </Button>
            </form>
            <p id={composerNoteId} className="mt-2 text-[11px] text-eos-text-muted">
              Raspuns orientativ; validarea umana ramane obligatorie.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
