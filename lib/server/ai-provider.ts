// S2B.1 — AI provider abstraction (Gemini + Mistral EU + Local Gemma 4).
// Suport interschimbabil între:
//   - Google Gemini (gemini-2.5-flash-lite, default — non-EU cloud)
//   - Mistral Large 2 (mistral-large-latest, EU sovereignty — Paris cloud)
//   - Local Gemma 4 (E2B/E4B, on-device prin Ollama — ZERO cloud,
//     cabinet/datafiscal NU părăsesc dispozitivul)
//
// Selecție:
//   - Per-request override prin parametrul `provider`.
//   - Default: env var COMPLISCAN_AI_PROVIDER ("gemini" | "mistral" | "local-gemma").
//   - Fallback: "gemini".
//
// Local Gemma:
//   - Necesită Ollama instalat local: https://ollama.com
//   - Pull model: `ollama pull gemma4:e2b` (1.5 GB) sau `ollama pull gemma4:e4b` (5 GB)
//   - Default URL: http://localhost:11434 (override LOCAL_GEMMA_URL)
//   - Default model: gemma4:e2b (override LOCAL_GEMMA_MODEL)
//
// Tier-uri:
//   - Mistral: Pro+ tiers (EU sovereignty)
//   - Local Gemma: Studio+ tiers (privacy mode pentru cabinete fiscale CECCAR
//     cu obligații secret profesional)

import { fetchWithOperationalGuard } from "@/lib/server/http-client"

export type AIProviderId = "gemini" | "mistral" | "local-gemma"

export type AIGenerateInput = {
  /** Prompt complet (system + user concatenate). */
  prompt: string
  /** Provider override; lipsă = folosim default-ul env. */
  provider?: AIProviderId
  /** Temperatura (0-1). */
  temperature?: number
  /** Maxim output tokens. */
  maxOutputTokens?: number
  /** Label pentru logging operational. */
  label?: string
}

export type AIGenerateResult = {
  content: string
  provider: AIProviderId
  /** Modelul efectiv folosit (poate diferi de provider name). */
  model: string
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? "mistral-large-latest"

const LOCAL_GEMMA_URL = process.env.LOCAL_GEMMA_URL ?? "http://localhost:11434"
const LOCAL_GEMMA_MODEL = process.env.LOCAL_GEMMA_MODEL ?? "gemma4:e2b"

// Cache rezultatul probe-ului Ollama pentru 30s ca să nu blocheze UI-ul
let localGemmaAvailableCache: { value: boolean; checkedAtMs: number } | null = null
const LOCAL_GEMMA_PROBE_TTL_MS = 30_000

export function getDefaultAIProvider(): AIProviderId {
  const value = process.env.COMPLISCAN_AI_PROVIDER?.trim().toLowerCase()
  if (value === "mistral") return "mistral"
  if (value === "local-gemma" || value === "local") return "local-gemma"
  return "gemini"
}

export function isMistralAvailable(): boolean {
  return Boolean(MISTRAL_API_KEY)
}

export function isGeminiAvailable(): boolean {
  return Boolean(GEMINI_API_KEY)
}

/**
 * Probe Ollama running locally — checks /api/tags endpoint cu timeout 2s.
 * Cache rezultat 30s ca să nu blocăm UI-ul cu round-trip la fiecare apel.
 */
export async function isLocalGemmaAvailable(): Promise<boolean> {
  if (
    localGemmaAvailableCache &&
    Date.now() - localGemmaAvailableCache.checkedAtMs < LOCAL_GEMMA_PROBE_TTL_MS
  ) {
    return localGemmaAvailableCache.value
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2_000)
    const res = await fetch(`${LOCAL_GEMMA_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)
    const ok = res.ok
    if (ok) {
      // Verifică dacă modelul Gemma 4 e disponibil
      try {
        const data = (await res.json()) as { models?: Array<{ name: string }> }
        const hasGemma = (data.models ?? []).some(
          (m) => m.name.startsWith("gemma4") || m.name === LOCAL_GEMMA_MODEL,
        )
        localGemmaAvailableCache = { value: hasGemma, checkedAtMs: Date.now() }
        return hasGemma
      } catch {
        localGemmaAvailableCache = { value: ok, checkedAtMs: Date.now() }
        return ok
      }
    }
    localGemmaAvailableCache = { value: false, checkedAtMs: Date.now() }
    return false
  } catch {
    localGemmaAvailableCache = { value: false, checkedAtMs: Date.now() }
    return false
  }
}

/**
 * Generează conținut text printr-un provider AI cu graceful fallback.
 * Aruncă dacă niciunul dintre providere nu e configurat.
 */
export async function generateContent(input: AIGenerateInput): Promise<AIGenerateResult> {
  const requested = input.provider ?? getDefaultAIProvider()
  const temperature = input.temperature ?? 0.2
  const maxOutputTokens = input.maxOutputTokens ?? 4096
  const label = input.label ?? "ai-provider:generate"

  // Local Gemma 4 — privacy mode: nu părăsește dispozitivul
  if (requested === "local-gemma") {
    if (await isLocalGemmaAvailable()) {
      return callLocalGemma({ prompt: input.prompt, temperature, maxOutputTokens, label })
    }
    // Fallback: dacă local Gemma e cerut dar Ollama nu rulează, încearcă cloud
    // (cu warning în log) — rezolvă cazul „user a cerut privacy dar n-a configurat"
    console.warn(
      `[ai-provider] local-gemma requested but Ollama unreachable at ${LOCAL_GEMMA_URL}. ` +
        `Falling back to cloud provider.`,
    )
  }

  // Mistral primary path (EU sovereignty)
  if (requested === "mistral" && MISTRAL_API_KEY) {
    return callMistral({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }

  // Gemini primary path (default)
  if (requested === "gemini" && GEMINI_API_KEY) {
    return callGemini({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }

  // Fallback ordering: local-gemma → Gemini → Mistral (whichever is available)
  if (await isLocalGemmaAvailable()) {
    return callLocalGemma({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }
  if (GEMINI_API_KEY) {
    return callGemini({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }
  if (MISTRAL_API_KEY) {
    return callMistral({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }

  throw new Error(
    "Niciun AI provider configurat (lipsă GEMINI_API_KEY/MISTRAL_API_KEY și Ollama nu rulează).",
  )
}

// ── Gemini implementation ─────────────────────────────────────────────────────

async function callGemini(args: {
  prompt: string
  temperature: number
  maxOutputTokens: number
  label: string
}): Promise<AIGenerateResult> {
  const response = await fetchWithOperationalGuard(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: args.prompt }] }],
        generationConfig: {
          temperature: args.temperature,
          topP: 0.95,
          maxOutputTokens: args.maxOutputTokens,
        },
      }),
      cache: "no-store",
      timeoutMs: 55_000,
      retries: 2,
      retryDelayMs: 800,
      label: `${args.label}:gemini`,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const content =
    json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? ""

  if (!content) {
    throw new Error("Gemini a returnat conținut gol.")
  }

  return { content, provider: "gemini", model: GEMINI_MODEL }
}

// ── Mistral EU implementation (OpenAI-compatible Chat API) ───────────────────

async function callMistral(args: {
  prompt: string
  temperature: number
  maxOutputTokens: number
  label: string
}): Promise<AIGenerateResult> {
  const response = await fetchWithOperationalGuard(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [{ role: "user", content: args.prompt }],
        temperature: args.temperature,
        max_tokens: args.maxOutputTokens,
        top_p: 0.95,
      }),
      cache: "no-store",
      timeoutMs: 55_000,
      retries: 2,
      retryDelayMs: 800,
      label: `${args.label}:mistral`,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Mistral API error ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = json.choices?.[0]?.message?.content?.trim() ?? ""
  if (!content) {
    throw new Error("Mistral a returnat conținut gol.")
  }

  return { content, provider: "mistral", model: MISTRAL_MODEL }
}

// ── Local Gemma 4 implementation (Ollama) ────────────────────────────────────

async function callLocalGemma(args: {
  prompt: string
  temperature: number
  maxOutputTokens: number
  label: string
}): Promise<AIGenerateResult> {
  const response = await fetchWithOperationalGuard(
    `${LOCAL_GEMMA_URL}/api/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_GEMMA_MODEL,
        prompt: args.prompt,
        stream: false,
        options: {
          temperature: args.temperature,
          top_p: 0.95,
          num_predict: args.maxOutputTokens,
        },
      }),
      cache: "no-store",
      timeoutMs: 120_000,  // local inference poate fi lentă pe CPU
      retries: 1,
      retryDelayMs: 500,
      label: `${args.label}:local-gemma`,
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Local Gemma error ${response.status}: ${text.slice(0, 200)}`)
  }

  const json = (await response.json()) as { response?: string; done?: boolean }
  const content = json.response?.trim() ?? ""
  if (!content) {
    throw new Error("Local Gemma a returnat conținut gol — verifică modelul gemma4:e2b instalat.")
  }

  return { content, provider: "local-gemma", model: LOCAL_GEMMA_MODEL }
}

// ── Streaming chat (pentru asistentul fiscal cu mesaje multi-turn) ───────────

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; provider: AIProviderId; model: string; tokensTotal?: number }
  | { type: "error"; reason: string }

/**
 * Streaming chat — preferă local-gemma dacă disponibil (privacy), altfel
 * Gemini. Ollama / Gemini ambele suportă SSE streaming.
 *
 * Returnează AsyncIterable de evenimente — caller-ul pipe-uiește spre client
 * via SSE sau fetch ReadableStream.
 */
export async function* streamChat(
  messages: ChatMessage[],
  opts: { provider?: AIProviderId; temperature?: number; maxOutputTokens?: number; label?: string } = {},
): AsyncIterableIterator<ChatStreamEvent> {
  const provider = opts.provider ?? getDefaultAIProvider()
  const temperature = opts.temperature ?? 0.3
  const maxOutputTokens = opts.maxOutputTokens ?? 2048
  const label = opts.label ?? "ai-provider:chat"

  // Pentru local-gemma folosim Ollama streaming
  if (provider === "local-gemma" && (await isLocalGemmaAvailable())) {
    yield* streamLocalGemma({ messages, temperature, maxOutputTokens, label })
    return
  }

  // Cloud fallback — Gemini real SSE streaming via streamGenerateContent
  if (GEMINI_API_KEY) {
    yield* streamGemini({ messages, temperature, maxOutputTokens, label })
    return
  }

  yield {
    type: "error",
    reason: "Niciun provider AI disponibil (Ollama nu rulează, nici GEMINI_API_KEY setat).",
  }
}

async function* streamLocalGemma(args: {
  messages: ChatMessage[]
  temperature: number
  maxOutputTokens: number
  label: string
}): AsyncIterableIterator<ChatStreamEvent> {
  // Ollama /api/chat acceptă mesaje OpenAI-style
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 180_000)

  try {
    const res = await fetch(`${LOCAL_GEMMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_GEMMA_MODEL,
        messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        options: {
          temperature: args.temperature,
          top_p: 0.95,
          num_predict: args.maxOutputTokens,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok || !res.body) {
      yield { type: "error", reason: `Local Gemma stream error: HTTP ${res.status}` }
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Ollama emit JSON-line per chunk
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line) as {
            message?: { content?: string }
            done?: boolean
            done_reason?: string
            eval_count?: number
          }
          const text = obj.message?.content ?? ""
          if (text) yield { type: "delta", text }
          if (obj.done) {
            yield {
              type: "done",
              provider: "local-gemma",
              model: LOCAL_GEMMA_MODEL,
              tokensTotal: obj.eval_count,
            }
            return
          }
        } catch {
          // Ignore malformed JSON line — Ollama poate trimite trailing whitespace
        }
      }
    }
  } catch (err) {
    yield {
      type: "error",
      reason: err instanceof Error ? err.message : "Eroare la streaming local Gemma.",
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Gemini SSE streaming (streamGenerateContent endpoint) ────────────────────

async function* streamGemini(args: {
  messages: ChatMessage[]
  temperature: number
  maxOutputTokens: number
  label: string
}): AsyncIterableIterator<ChatStreamEvent> {
  // Gemini API: separate systemInstruction din mesaje + map "assistant" → "model"
  const systemMessages = args.messages.filter((m) => m.role === "system")
  const turnMessages = args.messages.filter((m) => m.role !== "system")

  const systemInstruction =
    systemMessages.length > 0
      ? { parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }] }
      : undefined

  const contents = turnMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(systemInstruction ? { systemInstruction } : {}),
          contents,
          generationConfig: {
            temperature: args.temperature,
            topP: 0.95,
            maxOutputTokens: args.maxOutputTokens,
          },
        }),
        signal: controller.signal,
      },
    )

    if (!res.ok || !res.body) {
      const errText = res.body ? await res.text().catch(() => "") : ""
      yield {
        type: "error",
        reason: `Gemini stream error: HTTP ${res.status}${errText ? ` — ${errText.slice(0, 200)}` : ""}`,
      }
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let totalChars = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE format: linii `data: {json}` separate de "\n\n"
      const events = buffer.split("\n\n")
      buffer = events.pop() ?? ""

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((l) => l.startsWith("data: "))
        if (!dataLine) continue

        const payload = dataLine.slice(6).trim()
        if (!payload || payload === "[DONE]") continue

        try {
          const obj = JSON.parse(payload) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> }
              finishReason?: string
            }>
            usageMetadata?: { totalTokenCount?: number }
          }
          const text =
            obj.candidates?.[0]?.content?.parts
              ?.map((p) => p.text ?? "")
              .join("") ?? ""
          if (text) {
            totalChars += text.length
            yield { type: "delta", text }
          }
          const finishReason = obj.candidates?.[0]?.finishReason
          if (finishReason && finishReason !== "FINISH_REASON_UNSPECIFIED") {
            yield {
              type: "done",
              provider: "gemini",
              model: GEMINI_MODEL,
              tokensTotal: obj.usageMetadata?.totalTokenCount,
            }
            return
          }
        } catch {
          // Ignoră chunk JSON malformat
        }
      }
    }

    // Stream end fără finishReason explicit — emit done dacă am primit conținut
    if (totalChars > 0) {
      yield { type: "done", provider: "gemini", model: GEMINI_MODEL }
    } else {
      yield { type: "error", reason: "Gemini a închis stream-ul fără conținut." }
    }
  } catch (err) {
    yield {
      type: "error",
      reason: err instanceof Error ? err.message : "Eroare la streaming Gemini.",
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Test helpers ─────────────────────────────────────────────────────────────

export const __test__ = {
  LOCAL_GEMMA_URL,
  LOCAL_GEMMA_MODEL,
  resetLocalGemmaCache: () => {
    localGemmaAvailableCache = null
  },
}
