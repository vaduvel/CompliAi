"use client"

// Toggle pentru AI privacy mode: cloud-allowed (default) vs local-only.
// Local-only forțează Gemma 4 prin Ollama — refuză cloud-ul. Necesită Ollama
// running pe device. Util pentru cabinete CECCAR cu obligații secret profesional.

import { useEffect, useState } from "react"
import { Cloud, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type Mode = "local-only" | "cloud-allowed"

type StatusResponse = {
  ok: boolean
  mode: Mode
  localAvailable: boolean
}

export function AIPrivacyModeCard() {
  const [mode, setMode] = useState<Mode>("cloud-allowed")
  const [localAvailable, setLocalAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/assistant/privacy-mode", { cache: "no-store" })
      if (!res.ok) throw new Error(`Eroare ${res.status}`)
      const data = (await res.json()) as StatusResponse
      setMode(data.mode)
      setLocalAvailable(data.localAvailable)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut încărca modul de privacy.")
    } finally {
      setLoading(false)
    }
  }

  async function setMode_(next: Mode) {
    if (next === mode) return
    setSaving(true)
    try {
      const res = await fetch("/api/assistant/privacy-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      })
      const data = (await res.json()) as { ok?: boolean; mode?: Mode; error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? `Eroare ${res.status}`)
      }
      if (data.mode) setMode(data.mode)
      toast.success(
        next === "local-only"
          ? "Privacy mode activat. Asistentul folosește doar Gemma 4 pe device."
          : "Privacy mode dezactivat. Asistentul poate folosi cloud (Gemini) ca fallback.",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut schimba modul.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-eos-text-muted">AI privacy mode</p>
          <p className="text-sm leading-6 text-eos-text-tertiary">
            CECCAR / GDPR — alege cum procesează asistentul fiscal datele cabinetului. <strong>Local-only</strong>{" "}
            forțează Gemma 4 pe device (zero cloud). <strong>Cloud-allowed</strong> preferă local dar acceptă fallback
            Gemini când Ollama nu rulează.
          </p>
        </div>
        {mode === "local-only" ? (
          <Lock className="size-4 text-eos-success" strokeWidth={1.8} />
        ) : (
          <Cloud className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
        )}
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-[12.5px] text-eos-text-muted">
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> Se încarcă...
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mode === "cloud-allowed" ? "default" : "outline"}
              disabled={saving}
              onClick={() => void setMode_("cloud-allowed")}
            >
              {saving && mode !== "cloud-allowed" && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
              )}
              Cloud-allowed (default)
            </Button>
            <Button
              size="sm"
              variant={mode === "local-only" ? "default" : "outline"}
              disabled={saving || localAvailable === false}
              onClick={() => void setMode_("local-only")}
            >
              {saving && mode !== "local-only" && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
              )}
              Local-only (Gemma 4 on-device)
            </Button>
          </div>

          {localAvailable === false && (
            <p className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-2.5 text-[11.5px] text-eos-warning">
              Ollama / Gemma 4 nu rulează local. Pentru a activa privacy mode, instalează Ollama de la{" "}
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                ollama.com
              </a>{" "}
              și rulează <code className="font-mono text-[10.5px]">ollama pull gemma4:e2b</code>.
            </p>
          )}

          {localAvailable === true && (
            <p className="rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-2.5 text-[11.5px] text-eos-success">
              Gemma 4 detectat local. Privacy mode disponibil.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
