import {
  ORG_EMPLOYEE_COUNT_LABELS,
  ORG_SECTOR_LABELS,
  type OrgEmployeeCount,
  type OrgSector,
} from "@/lib/compliance/applicability"

export type JobDescriptionPackAsset = {
  id: string
  title: string
  summary: string
  content: string
}

export type JobDescriptionPack = {
  title: string
  summary: string
  assets: JobDescriptionPackAsset[]
  completionChecklist: string[]
}

type GenerateJobDescriptionPackParams = {
  orgName: string
  sector?: OrgSector | null
  employeeCount?: OrgEmployeeCount | null
  hasAiTools?: boolean
}

export function generateJobDescriptionPack(
  params: GenerateJobDescriptionPackParams
): JobDescriptionPack {
  const orgName = params.orgName.trim() || "Organizația"
  const sectorLabel = params.sector ? ORG_SECTOR_LABELS[params.sector] : "sector neconfirmat"
  const employeeCountLabel = params.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[params.employeeCount]
    : "număr de angajați neconfirmat"

  return {
    title: "Pachet minim fișe de post",
    summary:
      "CompliAI pregătește modelul de fișă, inventarul de roluri și planul de rollout. Firma trebuie să adapteze pe rolurile reale, să confirme lanțul ierarhic și să obțină semnătura internă.",
    assets: [
      {
        id: "job-description-template",
        title: "Model de fișă de post",
        summary: "Structura minimă pe care o adaptezi pentru fiecare rol real din firmă.",
        content: `# Model fișă de post — ${orgName}

## Context firmă

- Sector: ${sectorLabel}
- Dimensiune: ${employeeCountLabel}
- Acest model este un draft asistat. Trebuie adaptat pentru fiecare rol real și confirmat intern înainte de folosire oficială.

## 1. Date de identificare

- Denumire rol: [completează]
- Departament: [completează]
- Cod COR (dacă îl folosești): [completează]
- Raportează către: [completează]
- Înlocuiește / este înlocuit de: [completează]

## 2. Scopul rolului

- Rolul există pentru a: [descrie pe scurt rezultatul principal urmărit]

## 3. Responsabilități principale

1. [responsabilitate principală]
2. [responsabilitate principală]
3. [responsabilitate principală]
4. [responsabilitate principală]
5. [responsabilitate principală]

## 4. Atribuții operaționale

- Activități zilnice / săptămânale: [completează]
- Activități lunare / ocazionale: [completează]
- Instrumente / sisteme folosite: [completează]

## 5. Cerințe minime

- Studii / calificări: [completează]
- Experiență: [completează]
- Competențe cheie: [completează]

## 6. Limite și aprobări

- Ce poate decide singur rolul: [completează]
- Ce necesită aprobare: [completează]
- Cine validează rezultatele: [completează]

## 7. Obligații de conformitate

- Respectă regulile interne de confidențialitate și protecția datelor.
- Respectă procedurile interne aplicabile rolului.
${params.hasAiTools ? "- Respectă politica de utilizare AI și nu introduce date interzise în unelte AI neaprobate." : ""}

## 8. Confirmare internă

- Revizuit de manager: [nume]
- Revizuit de HR / administrator: [nume]
- Semnat de angajat: [nume]
- Data intrării în vigoare: [completează]`,
      },
      {
        id: "role-inventory",
        title: "Inventar minim de roluri",
        summary: "Lista pe care o completezi înainte să generezi sau să semnezi fișele pe fiecare rol.",
        content: `# Inventar roluri — ${orgName}

## Ce confirmi înainte să pornești

1. Care sunt rolurile reale active în firmă?
2. Ce roluri au oameni diferiți, dar aceeași fișă?
3. Ce roluri cer responsabilități distincte și trebuie separate?

## Tabel de lucru

| Rol | Departament | Nr. persoane | Manager direct | Necesită fișă separată? | Status |
| --- | --- | --- | --- | --- | --- |
| [completează] | [completează] | [completează] | [completează] | Da / Nu | Draft |

## Regulă practică

- Dacă două persoane au aceleași responsabilități reale și aceeași linie de raportare, poți porni de la aceeași fișă de bază.
- Dacă rolul diferă pe responsabilități, aprobare sau expunere la date / operațiuni, creezi fișă separată.
- Pentru ${employeeCountLabel}, începe cu rolurile esențiale și apoi extinde către rolurile suport.`,
      },
      {
        id: "rollout-checklist",
        title: "Checklist rollout intern",
        summary: "Pașii minimi ca fișele de post să nu rămână doar drafturi.",
        content: `# Checklist rollout fișe de post — ${orgName}

## Pași minimi

1. Confirmi inventarul real de roluri active.
2. Adaptezi modelul pentru fiecare rol relevant.
3. Verifici raportarea, responsabilitățile și limitele de aprobare.
4. Confirmi obligațiile de confidențialitate și procedurile aplicabile.
5. Obții validarea de la manager / administrator.
6. Obții semnătura sau dovada de comunicare către angajat.
7. Arhivezi versiunea finală într-un loc clar și auditabil.

## Dovadă bună pentru cockpit

- fișe semnate sau PDF-uri finale
- link / folder intern unde sunt arhivate
- notă clară despre ce roluri sunt deja acoperite și ce roluri rămân în lucru`,
      },
    ],
    completionChecklist: [
      "Ai confirmat lista reală a rolurilor pentru care trebuie pregătite fișe de post.",
      "Ai revizuit modelul și știi ce câmpuri trebuie adaptate per rol.",
      "Ai stabilit unde se salvează și cum se semnează fișele finale în firmă.",
    ],
  }
}
