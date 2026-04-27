// S2B.1 — AI provider abstraction (Gemini + Mistral EU sovereignty option).
// Suport interschimbabil între:
//   - Google Gemini (gemini-2.5-flash-lite, default — non-EU)
//   - Mistral Large 2 (mistral-large-latest, EU sovereignty — sediu Paris)
//
// Selecție:
//   - Per-request override prin parametrul `provider`.
//   - Default: env var COMPLISCAN_AI_PROVIDER ("gemini" | "mistral").
//   - Fallback: "gemini".
//
// Tier-uri (Doc 06): Mistral disponibil doar pentru Pro+ (cabinet-pro/studio,
// solo-pro, imm-internal-pro, fiscal-pro). Solo/cabinet-solo rămân pe Gemini.

import { fetchWithOperationalGuard } from "@/lib/server/http-client"

export type AIProviderId = "gemini" | "mistral"

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

export function getDefaultAIProvider(): AIProviderId {
  const value = process.env.COMPLISCAN_AI_PROVIDER?.trim().toLowerCase()
  if (value === "mistral") return "mistral"
  return "gemini"
}

export function isMistralAvailable(): boolean {
  return Boolean(MISTRAL_API_KEY)
}

export function isGeminiAvailable(): boolean {
  return Boolean(GEMINI_API_KEY)
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

  // Mistral primary path (EU sovereignty)
  if (requested === "mistral" && MISTRAL_API_KEY) {
    return callMistral({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }

  // Gemini primary path (default)
  if (requested === "gemini" && GEMINI_API_KEY) {
    return callGemini({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }

  // Fallback ordering: Gemini → Mistral (whichever is available)
  if (GEMINI_API_KEY) {
    return callGemini({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }
  if (MISTRAL_API_KEY) {
    return callMistral({ prompt: input.prompt, temperature, maxOutputTokens, label })
  }

  throw new Error(
    "Niciun AI provider configurat (lipsă GEMINI_API_KEY și MISTRAL_API_KEY)."
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
