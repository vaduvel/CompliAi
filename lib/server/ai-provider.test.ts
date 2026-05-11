// S2B.1 — Tests pentru AI provider abstraction.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// vi.hoisted rulează ÎNAINTE de imports — asigură că GEMINI_API_KEY e setat
// la momentul evaluării modulului ai-provider.ts (care îl captează ca const).
vi.hoisted(() => {
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "fake-key-for-tests"
  process.env.LOCAL_GEMMA_URL = process.env.LOCAL_GEMMA_URL ?? "http://127.0.0.1:1"
})

import {
  getDefaultAIProvider,
  isGeminiAvailable,
  isMistralAvailable,
  streamChat,
  __test__,
  type ChatMessage,
  type ChatStreamEvent,
} from "./ai-provider"

describe("ai-provider", () => {
  const originalProvider = process.env.COMPLISCAN_AI_PROVIDER

  beforeEach(() => {
    delete process.env.COMPLISCAN_AI_PROVIDER
  })

  afterEach(() => {
    if (originalProvider !== undefined) {
      process.env.COMPLISCAN_AI_PROVIDER = originalProvider
    } else {
      delete process.env.COMPLISCAN_AI_PROVIDER
    }
    vi.restoreAllMocks()
  })

  it("getDefaultAIProvider returnează 'gemini' când env lipsește", () => {
    expect(getDefaultAIProvider()).toBe("gemini")
  })

  it("getDefaultAIProvider returnează 'mistral' cand env e setat la mistral", () => {
    process.env.COMPLISCAN_AI_PROVIDER = "mistral"
    expect(getDefaultAIProvider()).toBe("mistral")
  })

  it("getDefaultAIProvider acceptă 'gemini' explicit", () => {
    process.env.COMPLISCAN_AI_PROVIDER = "gemini"
    expect(getDefaultAIProvider()).toBe("gemini")
  })

  it("getDefaultAIProvider e case-insensitive", () => {
    process.env.COMPLISCAN_AI_PROVIDER = "MISTRAL"
    expect(getDefaultAIProvider()).toBe("mistral")
  })

  it("getDefaultAIProvider fallback la gemini pentru valori necunoscute", () => {
    process.env.COMPLISCAN_AI_PROVIDER = "openai"
    expect(getDefaultAIProvider()).toBe("gemini")
  })

  it("isGeminiAvailable / isMistralAvailable sunt boolean", () => {
    // Nu putem ști exact valoarea fără să mockăm process.env, dar verificăm tipul
    expect(typeof isGeminiAvailable()).toBe("boolean")
    expect(typeof isMistralAvailable()).toBe("boolean")
  })
})

// ── streamGemini SSE parser tests ─────────────────────────────────────────────

function makeSseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let i = 0
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]))
      } else {
        controller.close()
      }
    },
  })
}

async function collect(
  iter: AsyncIterableIterator<ChatStreamEvent>,
): Promise<ChatStreamEvent[]> {
  const out: ChatStreamEvent[] = []
  for await (const ev of iter) out.push(ev)
  return out
}

describe("streamChat (Gemini SSE path)", () => {
  beforeEach(() => {
    // Reset cache-ul probe-ului local Gemma pentru a forța re-check (care va
    // eșua datorită LOCAL_GEMMA_URL setat la port nereal în vi.hoisted).
    __test__.resetLocalGemmaCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("parsează chunk-uri SSE și emite evenimente delta + done", async () => {
    const sseChunks = [
      `data: {"candidates":[{"content":{"parts":[{"text":"Salut"}]}}]}\n\n`,
      `data: {"candidates":[{"content":{"parts":[{"text":" lume"}]}}]}\n\n`,
      `data: {"candidates":[{"content":{"parts":[{"text":"!"}]},"finishReason":"STOP"}],"usageMetadata":{"totalTokenCount":7}}\n\n`,
    ]
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(makeSseStream(sseChunks), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const messages: ChatMessage[] = [
      { role: "system", content: "you are helpful" },
      { role: "user", content: "salut" },
    ]
    const events = await collect(streamChat(messages, { provider: "gemini" }))

    const deltas = events.filter((e) => e.type === "delta") as Array<{ text: string }>
    expect(deltas.map((d) => d.text).join("")).toBe("Salut lume!")

    const done = events.find((e) => e.type === "done") as
      | { type: "done"; provider: string; model: string; tokensTotal?: number }
      | undefined
    expect(done?.provider).toBe("gemini")
    expect(done?.tokensTotal).toBe(7)

    // verificăm că am POST-uit la streamGenerateContent cu systemInstruction
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("streamGenerateContent")
    expect(url).toContain("alt=sse")
    const requestBody = JSON.parse(init.body as string)
    expect(requestBody.systemInstruction.parts[0].text).toContain("you are helpful")
    expect(requestBody.contents).toHaveLength(1)
    expect(requestBody.contents[0].role).toBe("user")
  })

  it("mapează role-ul 'assistant' la 'model' în payload-ul Gemini", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        makeSseStream([
          `data: {"candidates":[{"content":{"parts":[{"text":"ok"}]},"finishReason":"STOP"}]}\n\n`,
        ]),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const messages: ChatMessage[] = [
      { role: "user", content: "primul" },
      { role: "assistant", content: "răspuns" },
      { role: "user", content: "follow-up" },
    ]
    await collect(streamChat(messages, { provider: "gemini" }))

    const requestBody = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    )
    expect(requestBody.contents.map((c: { role: string }) => c.role)).toEqual([
      "user",
      "model",
      "user",
    ])
  })

  it("emite event 'error' când Gemini răspunde cu non-200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("rate limited", { status: 429 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const events = await collect(
      streamChat([{ role: "user", content: "hi" }], { provider: "gemini" }),
    )
    const err = events.find((e) => e.type === "error")
    expect(err).toBeDefined()
    expect((err as { reason: string }).reason).toMatch(/429/)
  })

  it("provider='local-gemma' cu Ollama unreachable face fallback la Gemini", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/tags")) {
        // Probe Ollama → simulează 'connection refused'
        return Promise.reject(new Error("ECONNREFUSED"))
      }
      // Toate celelalte (Gemini stream)
      return Promise.resolve(
        new Response(
          makeSseStream([
            `data: {"candidates":[{"content":{"parts":[{"text":"fallback"}]},"finishReason":"STOP"}]}\n\n`,
          ]),
          { status: 200 },
        ),
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const events = await collect(
      streamChat([{ role: "user", content: "hi" }], { provider: "local-gemma" }),
    )
    const done = events.find((e) => e.type === "done") as
      | { type: "done"; provider: string }
      | undefined
    expect(done?.provider).toBe("gemini")  // fallback prin Gemini
  })

  it("ignoră chunk-uri SSE malformate fără să oprească stream-ul", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        makeSseStream([
          `data: not-json\n\n`,
          `data: {"candidates":[{"content":{"parts":[{"text":"hello"}]}}]}\n\n`,
          `data: {"candidates":[{"content":{"parts":[{"text":""}]},"finishReason":"STOP"}]}\n\n`,
        ]),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const events = await collect(
      streamChat([{ role: "user", content: "hi" }], { provider: "gemini" }),
    )
    const deltas = events.filter((e) => e.type === "delta") as Array<{ text: string }>
    expect(deltas.map((d) => d.text).join("")).toBe("hello")
    expect(events.some((e) => e.type === "done")).toBe(true)
  })
})
