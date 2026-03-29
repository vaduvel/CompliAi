import {
  ORG_EMPLOYEE_COUNT_LABELS,
  ORG_SECTOR_LABELS,
  type OrgEmployeeCount,
  type OrgSector,
} from "@/lib/compliance/applicability"
import type { GeneratedDocumentKind } from "@/lib/compliance/types"

export type ContractsPackAsset = {
  id: string
  title: string
  summary: string
  content: string
}

export type ContractsPackKind = "contracts-baseline"

export type ContractsPreparedPack = {
  kind: ContractsPackKind
  title: string
  summary: string
  assets: ContractsPackAsset[]
  completionChecklist: string[]
  generatorDocumentType: GeneratedDocumentKind
  generatorLabel: string
  returnEvidenceNote: string
}

type GenerateContractsPackParams = {
  orgName: string
  sector?: OrgSector | null
  employeeCount?: OrgEmployeeCount | null
  hasAiTools?: boolean
}

export function generateContractsBaselinePack(
  params: GenerateContractsPackParams
): ContractsPreparedPack {
  const orgName = params.orgName.trim() || "Organizația"
  const sectorLabel = params.sector ? ORG_SECTOR_LABELS[params.sector] : "sector neconfirmat"
  const employeeCountLabel = params.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[params.employeeCount]
    : "număr de angajați neconfirmat"

  return {
    kind: "contracts-baseline",
    title: "Pachet minim baseline contractual",
    summary:
      "CompliAI pregătește matricea de template-uri, checklistul de clauze și planul minim de adoptare. Firma trebuie să adapteze documentele la relațiile reale și să confirme unde sunt salvate și folosite.",
    assets: [
      {
        id: "contracts-matrix",
        title: "Matrice minimă de template-uri",
        summary: "Lista pe care o confirmi înainte să pui în circulație contractele standard.",
        content: `# Matrice baseline contractual — ${orgName}

## Context firmă

- Sector: ${sectorLabel}
- Dimensiune: ${employeeCountLabel}
- Acest pachet nu înlocuiește revizuirea juridică finală. Servește ca baseline clar pentru relațiile repetitive.

## Ce categorii de relații acoperi

| Relație | Template necesar | Cine îl aprobă | Unde se salvează | Status |
| --- | --- | --- | --- | --- |
| Clienți B2B | Contract-cadru prestări servicii / furnizare | [completează] | [completează] | Draft |
| Furnizori / colaboratori | Contract furnizor / comandă fermă / termeni standard | [completează] | [completează] | Draft |
| Confidențialitate | NDA sau clauză de confidențialitate | [completează] | [completează] | Draft |
| Date personale | DPA separat sau anexă contractuală | [completează] | [completează] | Draft |

## Reguli practice

1. Confirmi ce tipuri de relații comerciale sunt recurente în ${orgName}.
2. Eviți un singur template generic pentru relații foarte diferite.
3. Marchezi clar care template intră în onboarding clienți și care rămâne pentru furnizori.
4. Dacă există date personale, legi acest baseline cu DPA-ul sau clauzele GDPR corespunzătoare.
${params.hasAiTools ? "5. Dacă folosești servicii AI furnizate de terți, verifici și clauzele despre confidențialitate, date și training." : "5. Verifici clauzele de confidențialitate și utilizarea datelor pentru toți furnizorii relevanți."}`,
      },
      {
        id: "contracts-clause-checklist",
        title: "Checklist minim de clauze",
        summary: "Ce verifici înainte să spui că baseline-ul contractual este suficient de bun pentru audit.",
        content: `# Checklist clauze contractuale — ${orgName}

## Clauze minime

- [ ] Părțile contractante și datele de identificare sunt corecte
- [ ] Obiectul contractului și livrabilele sunt clare
- [ ] Prețul, termenele de plată și penalitățile sunt clare
- [ ] Confidențialitatea este acoperită
- [ ] Proprietatea intelectuală sau dreptul de folosire este clar
- [ ] Rezilierea și încetarea sunt explicite
- [ ] Jurisdicția / legea aplicabilă este clară
- [ ] Dacă există date personale, există clauză GDPR sau DPA separat
- [ ] Dacă există furnizori externi critici, apar și obligații de notificare sau securitate

## Întrebări de control

1. Pentru ce relații vei folosi acest template?
2. Cine poate aproba derogările?
3. Unde se păstrează versiunea oficială?
4. Ce variantă este considerată "în uz" în firmă?
5. Ce clauze au fost verificate cu juristul sau cu responsabilul intern?`,
      },
      {
        id: "contracts-rollout",
        title: "Plan minim de adoptare",
        summary: "Pașii minimi ca template-urile să nu rămână doar documente frumoase într-un folder.",
        content: `# Plan adoptare baseline contractual — ${orgName}

## Pași minimi

1. Confirmi tipurile de relații comerciale care trebuie acoperite.
2. Revizuiești template-ul contractual de bază și checklistul de clauze.
3. Validezi cine aprobă versiunea finală și cine poate folosi template-ul.
4. Stabilești folderul / registry-ul în care versiunea oficială rămâne auditabilă.
5. Notezi explicit din ce moment intră în uz pentru cazurile noi.
6. Dacă este necesar, trimiți draftul la jurist pentru revizuire finală.

## Dovadă bună pentru cockpit

- PDF/MD final sau link intern către template-ul oficial
- notă clară despre tipurile de relații acoperite
- locul exact unde este salvat și cine îl aprobă
- data de la care baseline-ul contractual intră în uz`,
      },
    ],
    completionChecklist: [
      "Ai confirmat ce relații comerciale trebuie acoperite de template-urile standard.",
      "Ai revizuit checklistul de clauze și știi ce mai trebuie verificat cu juristul sau responsabilul intern.",
      "Ai stabilit unde se salvează versiunea oficială și cine o poate pune în uz.",
    ],
    generatorDocumentType: "contract-template",
    generatorLabel: "Generează template-ul",
    returnEvidenceNote:
      "CompliAI a pregătit pachetul contractual: matricea de template-uri, checklistul de clauze și planul de adoptare au fost revizuite. Următorul pas este validarea juridică și punerea în uz a template-urilor pentru relațiile comerciale reale.",
  }
}
