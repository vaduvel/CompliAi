// Fiscal Assistant chat endpoint — streaming SSE.
//
// Body: { messages: ChatMessage[], provider?: "local-gemma" | "gemini" | "mistral" }
// Response: text/event-stream cu evenimente:
//   data: {"type":"delta","text":"..."}
//   data: {"type":"done","provider":"local-gemma","model":"gemma4:e2b"}
//   data: {"type":"error","reason":"..."}
//
// Auth: requireFreshAuthenticatedSession.
// Context: încărcăm state-ul org-ului + snapshot fiscal automat.
// Privacy: dacă user-ul are setarea "privacy mode" sau LOCAL_GEMMA disponibil,
//   preferăm local-gemma. Altfel fallback Gemini.

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  streamChat,
  type AIProviderId,
  type ChatMessage,
  isLocalGemmaAvailable,
  isGeminiAvailable,
} from "@/lib/server/ai-provider"
import {
  buildAssistantContext,
  contextToPromptText,
  FISCAL_ASSISTANT_SYSTEM_PROMPT,
} from "@/lib/server/fiscal-assistant"
import type { ComplianceState } from "@/lib/compliance/types"

type StateWithFiscal = ComplianceState & {
  filingRecords?: import("@/lib/compliance/filing-discipline").FilingRecord[]
  // Privacy mode preference (per org, set in settings)
  aiPrivacyMode?: "local-only" | "cloud-allowed"
}

const VALID_PROVIDERS: AIProviderId[] = ["gemini", "mistral", "local-gemma"]

export async function POST(request: Request) {
  let session
  try {
    session = await requireFreshAuthenticatedSession(request, "fiscal assistant chat")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "ASSISTANT_AUTH_FAILED")
  }

  let body: {
    messages?: ChatMessage[]
    provider?: AIProviderId
    forceLocal?: boolean
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid (JSON).", 400, "ASSISTANT_INVALID_BODY")
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("Lipsesc mesajele.", 400, "ASSISTANT_NO_MESSAGES")
  }
  if (body.provider && !VALID_PROVIDERS.includes(body.provider)) {
    return jsonError("Provider invalid.", 400, "ASSISTANT_INVALID_PROVIDER")
  }

  const userMessages = body.messages.filter((m) => m.role !== "system")
  if (userMessages.length === 0) {
    return jsonError("Cel puțin un mesaj user/assistant necesar.", 400, "ASSISTANT_EMPTY")
  }

  // Load state și construiește context
  const state = (await readStateForOrg(session.orgId)) as StateWithFiscal | null
  if (!state) {
    return jsonError("State indisponibil.", 500, "ASSISTANT_STATE_UNAVAILABLE")
  }

  const ctx = buildAssistantContext(state, session.orgName)
  const contextText = contextToPromptText(ctx)

  const systemPrompt = `${FISCAL_ASSISTANT_SYSTEM_PROMPT}\n\n${contextText}`

  // Decide provider:
  // 1. body.forceLocal sau aiPrivacyMode === "local-only" → local-gemma
  // 2. body.provider explicit → respectă
  // 3. local-gemma disponibil → folosește (privacy default)
  // 4. fallback Gemini
  let chosenProvider: AIProviderId = "gemini"
  const wantPrivacy = body.forceLocal || state.aiPrivacyMode === "local-only"
  const hasLocal = await isLocalGemmaAvailable()

  if (wantPrivacy) {
    if (!hasLocal) {
      return jsonError(
        "Privacy mode activat dar Ollama / Gemma 4 nu rulează local. Pornește Ollama și încearcă din nou.",
        503,
        "ASSISTANT_LOCAL_UNAVAILABLE",
      )
    }
    chosenProvider = "local-gemma"
  } else if (body.provider) {
    chosenProvider = body.provider
  } else if (hasLocal) {
    chosenProvider = "local-gemma"  // privacy by default if available
  } else if (isGeminiAvailable()) {
    chosenProvider = "gemini"
  }

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...userMessages,
  ]

  // Stream SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamChat(fullMessages, {
          provider: chosenProvider,
          temperature: 0.3,
          maxOutputTokens: 1024,
          label: `assistant-chat:${session.orgId}`,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          if (event.type === "done" || event.type === "error") break
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              reason: err instanceof Error ? err.message : "Eroare în streaming.",
            })}\n\n`,
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
