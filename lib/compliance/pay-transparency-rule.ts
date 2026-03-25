// RULE PACK — Pay Transparency 2026
// Directiva UE 2023/970 privind transparența salarială
// Transpunere obligatorie: 7 iunie 2026
// Aplicabilitate: angajatori cu 50+ angajați (raportare la 3 ani) sau 100+ (raportare anuală)

import type { ScanFinding } from "@/lib/compliance/types"
import type { OrgEmployeeCount } from "@/lib/compliance/applicability"

export const PAY_TRANSPARENCY_FINDING_ID = "pay-transparency-2026"

/** Returnează true dacă organizația intră sub incidența Directivei 2023/970 */
export function isPayTransparencyCandidate(employeeCount: OrgEmployeeCount): boolean {
  return employeeCount === "50-249" || employeeCount === "250+"
}

/** Construiește finding-ul de pregătire Pay Transparency */
export function buildPayTransparencyFinding(
  employeeCount: OrgEmployeeCount,
  nowISO: string
): ScanFinding | null {
  if (!isPayTransparencyCandidate(employeeCount)) return null

  const isLarge = employeeCount === "250+"
  const reportingFrequency = isLarge ? "anual (din 2027)" : "la 3 ani (din 2031)"
  const urgency = isLarge ? "high" : "medium"

  return {
    id: PAY_TRANSPARENCY_FINDING_ID,
    title: "Pregătire Pay Transparency — Directiva UE 2023/970",
    detail: [
      `Organizația ta (${employeeCount} angajați) intră sub incidența Directivei UE 2023/970 privind transparența salarială.`,
      "",
      `**Obligații aplicabile:**`,
      `• Raportare ecart salarial de gen: ${reportingFrequency}`,
      `• Dreptul angajaților de a solicita informații despre nivelurile salariale (din jun 2026)`,
      `• Interzicerea clauzelor de confidențialitate salarială`,
      `• Criterii de remunerare neutre din perspectivă de gen`,
      "",
      "România trebuie să transpună directiva până la **7 iunie 2026**. Pregătește-te acum.",
    ].join("\n"),
    category: "GDPR", // Cel mai aproape de drepturile angajaților / HR compliance
    severity: urgency,
    risk: "high",
    principles: ["accountability", "transparency"],
    createdAtISO: nowISO,
    sourceDocument: "Directiva UE 2023/970",
    legalReference: "Directiva (UE) 2023/970 — transpunere până la 7 iun 2026",
    impactSummary: `Companiile cu ${employeeCount} angajați trebuie să raporteze ecartul salarial de gen ${reportingFrequency}. Nerespectarea poate atrage amenzi și litigii individuale.`,
    remediationHint: [
      "1. **Inventar structură salarială**: Clasifică toate rolurile pe benzi/grade salariale.",
      "2. **Calcul ecart salarial**: Calculează ecartul salarial de gen pe categorii (OUG de transpunere va preciza metodologia).",
      "3. **Revizuire criterii de promovare**: Asigură-te că criteriile sunt documentate și neutre din perspectivă de gen.",
      "4. **Politică de transparență salarială**: Redactează politica internă de remunerare transparentă.",
      "5. **Informare angajați**: Pregătește răspuns la solicitările individuale (valabile din iun 2026).",
    ].join("\n"),
    readyTextLabel: "Am completat pregătirea",
    readyText: "Am finalizat inventarul structurii salariale și am redactat politica de transparență salarială conform Directivei (UE) 2023/970.",
  }
}
