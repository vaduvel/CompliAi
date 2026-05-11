// Asistent fiscal — status providers (pentru badge UI: local vs cloud).

import { NextResponse } from "next/server"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import {
  isGeminiAvailable,
  isLocalGemmaAvailable,
  isMistralAvailable,
  getDefaultAIProvider,
} from "@/lib/server/ai-provider"

export async function GET(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "fiscal assistant status")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "ASSISTANT_AUTH_FAILED")
  }

  const localGemmaAvailable = await isLocalGemmaAvailable()

  return NextResponse.json({
    providers: {
      "local-gemma": {
        available: localGemmaAvailable,
        privacy: "100% on-device",
        model: process.env.LOCAL_GEMMA_MODEL ?? "gemma4:e2b",
        url: process.env.LOCAL_GEMMA_URL ?? "http://localhost:11434",
        installHint: localGemmaAvailable
          ? null
          : "Pentru privacy 100% on-device: instalează Ollama de la https://ollama.com și rulează `ollama pull gemma4:e2b`.",
      },
      gemini: {
        available: isGeminiAvailable(),
        privacy: "cloud (Google)",
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
      },
      mistral: {
        available: isMistralAvailable(),
        privacy: "cloud EU (France)",
        model: process.env.MISTRAL_MODEL ?? "mistral-large-latest",
      },
    },
    defaultProvider: getDefaultAIProvider(),
    recommendation: localGemmaAvailable
      ? "local-gemma"
      : isGeminiAvailable()
        ? "gemini"
        : "none",
  })
}
