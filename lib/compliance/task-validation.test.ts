import { describe, expect, it } from "vitest"

import { initialComplianceState } from "@/lib/compliance/engine"
import type { ComplianceState } from "@/lib/compliance/types"

import { validateTaskAgainstState } from "./task-validation"

function buildState(overrides: Partial<ComplianceState>): ComplianceState {
  return {
    ...initialComplianceState,
    ...overrides,
  }
}

describe("task-validation", () => {
  it("cere dovada inainte de inchidere pentru task-ul de tracking", () => {
    const state = buildState({
      alerts: [
        {
          id: "alert-tracking",
          message: "Lipsă claritate consimțământ tracking",
          severity: "medium",
          open: true,
          sourceDocument: "policy-tracking.txt",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingId: "finding-tracking",
          scanId: "scan-tracking",
        },
      ],
      findings: [
        {
          id: "finding-tracking",
          title: "Verificare tracking cookies",
          detail: "Documentul menționează analytics și tracking.",
          category: "GDPR",
          severity: "medium",
          risk: "low",
          principles: ["privacy_data_governance", "accountability"],
          createdAtISO: "2026-03-13T10:00:00.000Z",
          sourceDocument: "policy-tracking.txt",
          scanId: "scan-tracking",
          legalReference: "GDPR Art. 6 / Art. 7",
          provenance: {
            ruleId: "GDPR-003",
            matchedKeyword: "tracking",
          },
        },
      ],
      scans: [
        {
          id: "scan-tracking",
          documentName: "policy-tracking.txt",
          contentPreview: "tracking analytics cookies",
          contentExtracted: "tracking analytics cookies",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingsCount: 1,
          sourceKind: "document",
          extractionStatus: "completed",
          analysisStatus: "completed",
        },
      ],
    })

    const result = validateTaskAgainstState(state, "rem-tracking-consent")

    expect(result.status).toBe("needs_review")
    expect(result.nextStatus).toBe("todo")
    expect(result.confidence).toBe("low")
    expect(result.basis).toBe("operational_state")
    expect(result.checkedSource).toBe("policy-tracking.txt")
    expect(result.message).toContain("GDPR Art. 6 / Art. 7")
  })

  it("trece task-ul de tracking cand exista dovada si semnale clare de consimtamant", () => {
    const state = buildState({
      alerts: [
        {
          id: "alert-tracking",
          message: "Lipsă claritate consimțământ tracking",
          severity: "medium",
          open: true,
          sourceDocument: "policy-tracking.txt",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingId: "finding-tracking",
          scanId: "scan-tracking",
        },
      ],
      findings: [
        {
          id: "finding-tracking",
          title: "Verificare tracking cookies",
          detail: "Documentul menționează analytics și tracking.",
          category: "GDPR",
          severity: "medium",
          risk: "low",
          principles: ["privacy_data_governance", "accountability"],
          createdAtISO: "2026-03-13T10:00:00.000Z",
          sourceDocument: "policy-tracking.txt",
          scanId: "scan-tracking",
          legalReference: "GDPR Art. 6 / Art. 7",
          provenance: {
            ruleId: "GDPR-003",
            matchedKeyword: "tracking",
          },
        },
      ],
      scans: [
        {
          id: "scan-tracking",
          documentName: "policy-tracking.txt",
          contentPreview: "tracking analytics cookies",
          contentExtracted:
            "Banner CMP: Accept / Refuz / Preferinte. Scripturile de tracking raman blocate pana la accept explicit si ruleaza doar dupa acord.",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingsCount: 1,
          sourceKind: "document",
          extractionStatus: "completed",
          analysisStatus: "completed",
        },
      ],
    })

    const result = validateTaskAgainstState(
      state,
      "rem-tracking-consent",
      "cmp-screenshot.png"
    )

    expect(result.status).toBe("passed")
    expect(result.nextStatus).toBe("done")
    expect(result.confidence).toBe("low")
    expect(result.basis).toBe("operational_state")
    expect(result.checkedSource).toBe("policy-tracking.txt")
    expect(result.message).toContain("consimțământ explicit")
    expect(result.message).toContain("starea operațională")
  })

  it("esueaza task-ul de supraveghere umana daca rescan-ul nu arata override sau review", () => {
    const state = buildState({
      alerts: [
        {
          id: "alert-high-risk",
          message: "Flux AI cu impact ridicat detectat",
          severity: "high",
          open: true,
          sourceDocument: "decisioning-policy.txt",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingId: "finding-high-risk",
          scanId: "scan-high-risk",
        },
      ],
      findings: [
        {
          id: "finding-high-risk",
          title: "Posibil caz high-risk (EU AI Act)",
          detail: "Sistemul folosește scoring și decizie automată pentru eligibilitate.",
          category: "EU_AI_ACT",
          severity: "high",
          risk: "high",
          principles: ["oversight", "transparency", "accountability"],
          createdAtISO: "2026-03-13T10:00:00.000Z",
          sourceDocument: "decisioning-policy.txt",
          scanId: "scan-high-risk",
          legalReference: "AI Act Art. 9 / Art. 14",
          provenance: {
            ruleId: "EUAI-001",
            matchedKeyword: "scoring",
          },
        },
      ],
      scans: [
        {
          id: "scan-high-risk",
          documentName: "decisioning-policy.txt",
          contentPreview: "scoring si decizie automata",
          contentExtracted:
            "Fluxul folosește scoring și decizie automată pentru eligibilitate, fără mențiune despre validare umană.",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingsCount: 1,
          sourceKind: "document",
          extractionStatus: "completed",
          analysisStatus: "completed",
        },
      ],
    })

    const result = validateTaskAgainstState(
      state,
      "rem-high-risk-flow",
      "workflow-approval.pdf"
    )

    expect(result.status).toBe("failed")
    expect(result.nextStatus).toBe("todo")
    expect(result.confidence).toBe("low")
    expect(result.basis).toBe("operational_state")
    expect(result.checkedSource).toBe("decisioning-policy.txt")
    expect(result.message).toContain("decizie automată")
    expect(result.message).toContain("starea operațională")
  })

  it("marcheaza validarea directa cu mesaj de confirmare puternica", () => {
    const state = buildState({
      alerts: [
        {
          id: "alert-ai-transparency",
          message: "Lipsa informare utilizator sistem AI",
          severity: "medium",
          open: true,
          sourceDocument: "chat-widget-policy.txt",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingId: "finding-ai-transparency",
          scanId: "scan-ai-transparency",
        },
      ],
      findings: [
        {
          id: "finding-ai-transparency",
          title: "Lipsa notice de transparenta AI",
          detail: "Widget-ul descrie un chatbot, dar fara disclosure clar.",
          category: "EU_AI_ACT",
          severity: "medium",
          verdictConfidence: "high",
          verdictConfidenceReason:
            "Verdictul are încredere mare deoarece regula a fost susținută de un semnal direct în sursă.",
          risk: "low",
          principles: ["transparency", "accountability"],
          createdAtISO: "2026-03-13T10:00:00.000Z",
          sourceDocument: "chat-widget-policy.txt",
          scanId: "scan-ai-transparency",
          legalReference: "AI Act Art. 52",
          provenance: {
            ruleId: "EUAI-TR-001",
            matchedKeyword: "chatbot",
            verdictBasis: "direct_signal",
            signalSource: "keyword",
            signalConfidence: "high",
          },
        },
      ],
      scans: [
        {
          id: "scan-ai-transparency",
          documentName: "chat-widget-policy.txt",
          contentPreview: "chatbot",
          contentExtracted:
            "Interacționați cu un asistent virtual. Acest sistem AI oferă răspunsuri generate automat. Pentru decizii critice, consultați un operator uman.",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingsCount: 1,
          sourceKind: "document",
          extractionStatus: "completed",
          analysisStatus: "completed",
        },
      ],
    })

    const result = validateTaskAgainstState(
      state,
      "finding-ai-transparency",
      "chat-disclosure.png"
    )

    expect(result.status).toBe("passed")
    expect(result.basis).toBe("direct_signal")
    expect(result.confidence).toBe("high")
    expect(result.message).toContain("Confirmare puternică")
    expect(result.message).toContain("semnal direct")
  })

  it("marcheaza validarea inferata cu mesaj de confirmare partiala", () => {
    const state = buildState({
      alerts: [
        {
          id: "alert-residency",
          message: "Rezidenta datelor trebuie clarificata",
          severity: "medium",
          open: true,
          sourceDocument: "compliscan.yaml",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingId: "finding-residency",
          scanId: "scan-yaml",
        },
      ],
      findings: [
        {
          id: "finding-residency",
          title: "Rezidenta datelor necesita clarificare",
          detail: "Configul sugereaza procesare in UE/SEE, dar cere confirmare contextuala.",
          category: "GDPR",
          severity: "medium",
          verdictConfidence: "medium",
          verdictConfidenceReason:
            "Verdictul are încredere medie deoarece regula a fost dedusă dintr-un semnal tehnic.",
          risk: "low",
          principles: ["privacy_data_governance", "accountability"],
          createdAtISO: "2026-03-13T10:00:00.000Z",
          sourceDocument: "compliscan.yaml",
          scanId: "scan-yaml",
          legalReference: "GDPR Art. 44",
          provenance: {
            ruleId: "GDPR-INT-001",
            verdictBasis: "inferred_signal",
            signalSource: "manifest",
            signalConfidence: "medium",
          },
        },
      ],
      scans: [
        {
          id: "scan-yaml",
          documentName: "compliscan.yaml",
          contentPreview: "data_residency: eu-central-1",
          contentExtracted:
            "provider: openai\ndata_residency: eu-central-1\nprocessing_region: eu-west-1",
          createdAtISO: "2026-03-13T10:00:00.000Z",
          findingsCount: 1,
          sourceKind: "yaml",
          extractionStatus: "completed",
          analysisStatus: "completed",
        },
      ],
    })

    const result = validateTaskAgainstState(
      state,
      "finding-residency",
      "yaml-proof.txt"
    )

    expect(result.status).toBe("passed")
    expect(result.basis).toBe("inferred_signal")
    expect(result.confidence).toBe("medium")
    expect(result.message).toContain("Confirmare parțială")
    expect(result.message).toContain("confirmare umană suplimentară")
  })
})
