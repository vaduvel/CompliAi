// Governance findings — Board/CISO training gaps → ScanFindings
// Baza legala: OUG 155/2024 Art. 14 ✅
// Sprint 2.7

import type { ScanFinding } from "@/lib/compliance/types"
import type { BoardMember } from "@/lib/server/nis2-store"

/**
 * Generates NIS2 findings for board members missing training or with expired certifications.
 * Uses stable IDs (prefixed nis2-gov-) so re-runs replace instead of accumulate.
 */
export function buildGovernanceFindings(members: BoardMember[], nowISO: string): ScanFinding[] {
  const findings: ScanFinding[] = []
  const now = new Date(nowISO).getTime()

  for (const member of members) {
    // Missing NIS2 training
    if (!member.nis2TrainingCompleted) {
      findings.push({
        id: `nis2-gov-training-${member.id}`,
        title: `${member.name} nu a completat training-ul de securitate cibernetică`,
        detail: `Membrul conducerii "${member.name}" (${member.role}) nu are documentat training-ul de securitate cibernetică. Bază: OUG 155/2024 Art. 14 ✅`,
        category: "NIS2" as const,
        severity: "medium",
        risk: "low",
        principles: ["accountability", "oversight"] as ScanFinding["principles"],
        createdAtISO: nowISO,
        sourceDocument: "Registru Guvernanță — Board Training Tracker",
        legalReference: "OUG 155/2024 Art. 14",
        remediationHint: `Organizați training de securitate cibernetică pentru ${member.name} și documentați data completării.`,
      })
    } else if (member.nis2TrainingExpiry && new Date(member.nis2TrainingExpiry).getTime() < now) {
      // Expired NIS2 training
      findings.push({
        id: `nis2-gov-training-expired-${member.id}`,
        title: `Training-ul NIS2 al lui ${member.name} a expirat`,
        detail: `Training-ul de securitate cibernetică al "${member.name}" (${member.role}) a expirat la ${member.nis2TrainingExpiry.slice(0, 10)}. Bază: OUG 155/2024 Art. 14 ✅`,
        category: "NIS2" as const,
        severity: "medium",
        risk: "low",
        principles: ["accountability", "oversight"] as ScanFinding["principles"],
        createdAtISO: nowISO,
        sourceDocument: "Registru Guvernanță — Board Training Tracker",
        legalReference: "OUG 155/2024 Art. 14",
        remediationHint: `Reînnoiți training-ul de securitate cibernetică pentru ${member.name} și actualizați data în registru.`,
      })
    }

    // Expired CISO certification
    if (member.cisoCertification && member.cisoCertExpiry) {
      if (new Date(member.cisoCertExpiry).getTime() < now) {
        findings.push({
          id: `nis2-gov-cert-expired-${member.id}`,
          title: `Certificarea ${member.cisoCertification} a lui ${member.name} a expirat`,
          detail: `Certificarea ${member.cisoCertification} a responsabilului de securitate "${member.name}" a expirat la ${member.cisoCertExpiry.slice(0, 10)}. Bază: OUG 155/2024 Art. 14(4)(e) ✅\nNotă: Cerințe suplimentare de certificare sunt în consultare publică la DNSC (ian. 2026). Neobligatorii încă. 📝`,
          category: "NIS2" as const,
          severity: "medium",
          risk: "low",
          principles: ["accountability", "oversight"] as ScanFinding["principles"],
          createdAtISO: nowISO,
          sourceDocument: "Registru Guvernanță — Board Training Tracker",
          legalReference: "OUG 155/2024 Art. 14(4)(e)",
          remediationHint: `Reînnoiți certificarea ${member.cisoCertification} pentru ${member.name} și actualizați data de expirare în registru.`,
        })
      }
    }
  }

  return findings
}
