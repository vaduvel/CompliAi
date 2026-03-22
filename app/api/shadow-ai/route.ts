// V3 P2.1 — Shadow AI Questionnaire API
import { NextRequest, NextResponse } from "next/server"
import { readState, mutateState } from "@/lib/server/mvp-store"
import {
  SHADOW_AI_QUESTIONS,
  calculateShadowAiRisk,
  buildShadowAiFindings,
  buildShadowAiRecommendations,
  type ShadowAiAnswer,
} from "@/lib/compliance/shadow-ai"
import type { ShadowAiAssessmentResult } from "@/lib/compliance/shadow-ai"

// GET — returns current answers + questions
export async function GET() {
  try {
    const state = await readState()
    return NextResponse.json({
      questions: SHADOW_AI_QUESTIONS,
      answers: state.shadowAiAnswers ?? [],
      completedAtISO: state.shadowAiCompletedAtISO ?? null,
    })
  } catch (err) {
    console.error("[shadow-ai] GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — save answers, compute risk, inject findings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { answers: ShadowAiAnswer[] }
    const { answers } = body

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: "answers must be an array" }, { status: 400 })
    }

    if (answers.length > SHADOW_AI_QUESTIONS.length) {
      return NextResponse.json({ error: "Too many shadow AI answers submitted." }, { status: 400 })
    }

    const knownQuestionIds = new Set(SHADOW_AI_QUESTIONS.map((question) => question.id))
    const seenQuestionIds = new Set<string>()
    for (const answer of answers) {
      if (!answer || typeof answer !== "object" || typeof answer.questionId !== "string") {
        return NextResponse.json({ error: "Fiecare answer trebuie sa aiba questionId valid." }, { status: 400 })
      }

      if (!knownQuestionIds.has(answer.questionId)) {
        return NextResponse.json({ error: `Unknown questionId: ${answer.questionId}` }, { status: 400 })
      }

      if (seenQuestionIds.has(answer.questionId)) {
        return NextResponse.json({ error: `Duplicate answer for ${answer.questionId}` }, { status: 400 })
      }
      seenQuestionIds.add(answer.questionId)

      const value = answer.value
      if (Array.isArray(value)) {
        if (value.length > 20 || !value.every((item) => typeof item === "string" && item.length <= 120)) {
          return NextResponse.json({ error: "Valoare multi-select invalida." }, { status: 400 })
        }
      } else if (typeof value !== "string" || value.length > 120) {
        return NextResponse.json({ error: "Valoarea answer trebuie sa fie string sau string[] valid." }, { status: 400 })
      }
    }

    const nowISO = new Date().toISOString()
    const { riskScore, riskLevel, detectedCategories } = calculateShadowAiRisk(answers)
    const recommendations = buildShadowAiRecommendations(answers, riskLevel)
    const newFindings = buildShadowAiFindings({ riskLevel, detectedCategories }, nowISO)

    await mutateState((state) => {
      // Replace existing shadow AI findings
      const otherFindings = (state.findings ?? []).filter(
        (f) => !f.id.startsWith("shadow-ai-")
      )
      return {
        ...state,
        shadowAiAnswers: answers,
        shadowAiCompletedAtISO: nowISO,
        findings: [...otherFindings, ...newFindings],
      }
    })

    const result: ShadowAiAssessmentResult = {
      completedAtISO: nowISO,
      riskLevel,
      riskScore,
      detectedCategories,
      recommendations,
      findings: newFindings,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("[shadow-ai] POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
