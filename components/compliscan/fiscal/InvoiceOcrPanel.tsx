"use client"

// F#8 — OCR + Voice-to-Invoice UI Panel.
// Upload imagine factură (JPG/PNG/PDF) sau dictează → extract structurat AI.

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  ScanLine,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type ExtractedLine = {
  description: string
  quantity?: number
  unitPriceRON?: number
  totalRON: number
  vatRate?: number
}

type ExtractedData = {
  supplierCif?: string
  supplierName?: string
  customerCif?: string
  customerName?: string
  invoiceNumber?: string
  issueDateISO?: string
  totalNetRON?: number
  totalVatRON?: number
  totalGrossRON?: number
  currency?: string
  vatRate?: number
  lines?: ExtractedLine[]
  confidence?: "high" | "medium" | "low"
  rawNotes?: string
}

type OcrResponse = {
  ok: boolean
  provider: "gemini-vision" | "gemma-local" | "tesseract" | "none"
  data?: ExtractedData
  error?: string
  inputMode?: "image" | "voice"
}

type Mode = "auto" | "cloud" | "local"

function fmtRON(n?: number): string {
  if (n === undefined || n === null) return "—"
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 2 })
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1] ?? ""
      resolve({ base64, mimeType: file.type || "image/jpeg" })
    }
    reader.onerror = () => reject(new Error("Eroare la citirea fișierului."))
    reader.readAsDataURL(file)
  })
}

type SpeechRecognitionEvent = {
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: { transcript: string }
    }
  }
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function InvoiceOcrPanel() {
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>("auto")
  const [preview, setPreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null)
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState<OcrResponse | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [speechAvailable, setSpeechAvailable] = useState(false)

  useEffect(() => {
    setSpeechAvailable(getSpeechRecognition() !== null)
    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {
        /* ignore */
      }
    }
  }, [])

  async function handleFile(file: File) {
    if (file.size > 9 * 1024 * 1024) {
      toast.error("Fișier prea mare (max 9 MB).")
      return
    }
    try {
      const { base64, mimeType } = await fileToBase64(file)
      setPendingFile({ base64, mimeType, name: file.name })
      setPreview(`data:${mimeType};base64,${base64.slice(0, 200_000)}`)
      setResult(null)
      toast.success(`Fișier încărcat: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la citirea fișierului.")
    }
  }

  function toggleListen() {
    const Recog = getSpeechRecognition()
    if (!Recog) {
      toast.error("Browserul nu suportă Web Speech API (folosește Chrome/Edge).")
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const r = new Recog()
    r.lang = "ro-RO"
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let txt = ""
      for (let i = 0; i < e.results.length; i++) {
        txt += e.results[i][0].transcript
      }
      setTranscript(txt)
    }
    r.onerror = (e) => {
      toast.error(`Eroare voce: ${e.error ?? "unknown"}`)
      setListening(false)
    }
    r.onend = () => setListening(false)
    recognitionRef.current = r
    r.start()
    setListening(true)
    toast.message("Dictează factura — ex: 'Am cumpărat hârtie 200 lei de la Carrefour'")
  }

  async function extractFromImage() {
    if (!pendingFile) {
      toast.error("Încarcă mai întâi o imagine.")
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch("/api/efactura/ocr-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: pendingFile.base64,
          mimeType: pendingFile.mimeType,
          mode,
        }),
      })
      const data = (await res.json()) as OcrResponse & { error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? `Extragere eșuată (HTTP ${res.status}).`)
        setResult(data)
        return
      }
      setResult(data)
      const conf = data.data?.confidence ?? "medium"
      toast.success(
        `Date extrase din imagine (${data.provider}, confidence ${conf}). Verifică câmpurile.`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare extragere.")
    } finally {
      setBusy(false)
    }
  }

  async function extractFromVoice() {
    if (!transcript.trim() || transcript.trim().length < 5) {
      toast.error("Dictează minim 5 caractere pentru extragere.")
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch("/api/efactura/ocr-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      })
      const data = (await res.json()) as OcrResponse & { error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? `Extragere voce eșuată (HTTP ${res.status}).`)
        setResult(data)
        return
      }
      setResult(data)
      toast.success(`Draft factură generat din voce (confidence ${data.data?.confidence ?? "low"}).`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare extragere voce.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.06] px-4 py-3 text-[12px] leading-[1.5] text-eos-text">
        <p>
          <strong>OCR + dictare voce → factură:</strong> uploadează poză cu bonul/factura sau
          dictează în română. AI extrage CIF, sume, articole în format structurat — gata pentru
          validare e-Factura (UBL CIUS-RO). Privacy by default: încercăm Gemma 4 local prima dată;
          dacă nu e disponibil, fallback Gemini Vision cloud.
        </p>
      </section>

      {/* Mode selector */}
      <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
          Provider
        </span>
        {(["auto", "local", "cloud"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-sm border px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] transition ${
              mode === m
                ? "border-eos-primary bg-eos-primary text-white"
                : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
            }`}
          >
            {m === "auto" ? "Auto (privacy)" : m === "local" ? "Gemma 4 local" : "Gemini cloud"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Image upload */}
        <section className="space-y-3 rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <header className="flex items-center gap-2">
            <Camera className="size-4 text-eos-primary" strokeWidth={2} />
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Foto factură / bon
            </p>
          </header>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
            }}
            className="block w-full text-[12px] text-eos-text-muted file:mr-3 file:rounded-eos-sm file:border-0 file:bg-eos-primary file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-white"
          />
          <p className="text-[10.5px] text-eos-text-tertiary">
            JPG / PNG / WebP / PDF · max 9 MB · mobil: deschide camera direct.
          </p>
          {preview && pendingFile?.mimeType.startsWith("image/") && (
            <div className="overflow-hidden rounded-eos-sm border border-eos-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${pendingFile.mimeType};base64,${pendingFile.base64}`}
                alt="Preview factură"
                className="block max-h-48 w-full object-contain bg-eos-surface-elevated"
              />
            </div>
          )}
          <Button
            size="sm"
            disabled={busy || !pendingFile}
            onClick={() => void extractFromImage()}
          >
            {busy ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <ScanLine className="mr-1.5 size-3.5" strokeWidth={2} />
            )}
            Extrage date din imagine
          </Button>
        </section>

        {/* Voice input */}
        <section className="space-y-3 rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <header className="flex items-center gap-2">
            <Mic className="size-4 text-eos-primary" strokeWidth={2} />
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Dictare voce (Web Speech)
            </p>
          </header>
          {!speechAvailable ? (
            <p className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11px] text-eos-text">
              Browserul curent nu suportă Web Speech API. Folosește Chrome / Edge / Safari mobil.
            </p>
          ) : (
            <Button
              size="sm"
              variant={listening ? "secondary" : "outline"}
              onClick={toggleListen}
              disabled={busy}
            >
              {listening ? (
                <MicOff className="mr-1.5 size-3.5 text-eos-error" strokeWidth={2} />
              ) : (
                <Mic className="mr-1.5 size-3.5" strokeWidth={2} />
              )}
              {listening ? "Oprește dictarea" : "Pornește dictarea (ro-RO)"}
            </Button>
          )}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder='Ex: "Am cumpărat consumabile 500 lei de la SC ABC SRL pe data de 10 mai"'
            className="h-24 w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[12px] text-eos-text outline-none focus:border-eos-border-strong"
          />
          <Button
            size="sm"
            disabled={busy || transcript.trim().length < 5}
            onClick={() => void extractFromVoice()}
          >
            {busy ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" strokeWidth={2} />
            )}
            Generează draft din voce
          </Button>
        </section>
      </div>

      {/* Result */}
      {result?.ok && result.data && <ExtractedDataView result={result} />}

      {result && !result.ok && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3 text-[11.5px] text-eos-text">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-error" strokeWidth={2} />
            <span>
              <strong>Extragere eșuată ({result.provider}):</strong> {result.error ?? "fără detalii"}.
              {result.provider === "gemma-local" &&
                " Tip: pornește Ollama local sau comută la 'Gemini cloud'."}
              {result.provider === "gemini-vision" &&
                " Tip: verifică GEMINI_API_KEY în env și conexiunea."}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

function ExtractedDataView({ result }: { result: OcrResponse }) {
  const d = result.data!
  const conf = d.confidence ?? "medium"
  const confColor =
    conf === "high"
      ? "text-eos-success border-eos-success/30 bg-eos-success-soft"
      : conf === "medium"
        ? "text-eos-warning border-eos-warning/30 bg-eos-warning-soft"
        : "text-eos-error border-eos-error/30 bg-eos-error-soft"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[11.5px] text-eos-text">
        <p className="flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-eos-success" strokeWidth={2} />
          <span>
            Date extrase via <strong>{result.provider}</strong>{" "}
            {result.inputMode === "voice" ? "(din voce)" : "(din imagine)"}
          </span>
        </p>
        <span
          className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${confColor}`}
        >
          confidence {conf}
        </span>
      </div>

      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
        <p
          data-display-text="true"
          className="mb-3 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Câmpuri factură (verifică înainte de transmitere)
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Furnizor CIF" value={d.supplierCif} mono />
          <Field label="Furnizor nume" value={d.supplierName} />
          <Field label="Client CIF" value={d.customerCif} mono />
          <Field label="Client nume" value={d.customerName} />
          <Field label="Nr. factură" value={d.invoiceNumber} mono />
          <Field label="Data emiterii" value={d.issueDateISO} mono />
          <Field label="Total net" value={`${fmtRON(d.totalNetRON)} ${d.currency ?? "RON"}`} />
          <Field label="Total TVA" value={`${fmtRON(d.totalVatRON)} ${d.currency ?? "RON"}`} />
          <Field
            label="Total brut"
            value={`${fmtRON(d.totalGrossRON)} ${d.currency ?? "RON"}`}
            highlight
          />
          <Field label="Cota TVA" value={d.vatRate ? `${d.vatRate}%` : "—"} />
        </div>
        {d.rawNotes && (
          <p className="mt-3 rounded-eos-sm border border-eos-border bg-eos-surface-elevated p-2 text-[10.5px] text-eos-text-muted">
            <strong>Note AI:</strong> {d.rawNotes}
          </p>
        )}
      </section>

      {d.lines && d.lines.length > 0 && (
        <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <p
            data-display-text="true"
            className="mb-2 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Articole extrase ({d.lines.length})
          </p>
          <div className="space-y-1">
            {d.lines.map((line, i) => (
              <div
                key={i}
                className="flex flex-wrap items-start justify-between gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[11.5px]"
              >
                <div>
                  <p className="text-eos-text">{line.description}</p>
                  <p className="text-[10.5px] text-eos-text-tertiary">
                    {line.quantity ?? 1} buc × {fmtRON(line.unitPriceRON)} RON
                    {line.vatRate !== undefined && ` · TVA ${line.vatRate}%`}
                  </p>
                </div>
                <span className="font-mono text-eos-text">{fmtRON(line.totalRON)} RON</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[11.5px] text-eos-text">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
          <span>
            <strong>CECCAR Art. 14:</strong> AI a generat un draft. Verifică manual CIF-urile,
            sumele și data înainte de a transmite factura la SPV sau de a o înregistra contabil.
            Sistemul e instrument informativ, nu automat.
          </span>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value?: string | number
  mono?: boolean
  highlight?: boolean
}) {
  const display = value === undefined || value === null || value === "" ? "—" : String(value)
  return (
    <div
      className={`rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2 ${
        highlight ? "ring-1 ring-eos-primary/30" : ""
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
        {label}
      </p>
      <p
        className={`mt-0.5 ${mono ? "font-mono" : "font-sans"} text-[12.5px] ${
          highlight ? "font-display font-semibold text-eos-primary" : "text-eos-text"
        }`}
      >
        {display}
      </p>
    </div>
  )
}

