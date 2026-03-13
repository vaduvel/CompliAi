import type { FindingProvenance, ScanFinding } from "@/lib/compliance/types"

export type FindingConfidence = "high" | "medium" | "low"

export function inferFindingConfidence(provenance?: FindingProvenance): FindingConfidence {
  if (!provenance) return "low"
  if (provenance.verdictBasis === "direct_signal" || provenance.signalConfidence === "high") {
    return "high"
  }
  if (provenance.verdictBasis === "inferred_signal" || provenance.signalConfidence === "medium") {
    return "medium"
  }
  return "low"
}

export function buildFindingConfidenceReason(
  finding: Pick<ScanFinding, "title" | "sourceDocument" | "provenance">
) {
  if (finding.provenance?.verdictBasis === "direct_signal") {
    return `Verdictul are încredere mare deoarece regula a fost susținută de un semnal direct în sursa ${finding.sourceDocument}.`
  }

  if (finding.provenance?.verdictBasis === "inferred_signal") {
    return `Verdictul are încredere medie deoarece regula a fost dedusă dintr-un semnal tehnic sau manifest și cere încă validare contextuală.`
  }

  return `Verdictul pentru ${finding.title} rămâne cu încredere redusă până la semnale mai clare sau confirmare explicită.`
}
