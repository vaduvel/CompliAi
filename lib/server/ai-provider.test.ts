// S2B.1 — Tests pentru AI provider abstraction.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getDefaultAIProvider,
  isGeminiAvailable,
  isMistralAvailable,
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
