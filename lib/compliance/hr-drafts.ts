import {
  ORG_EMPLOYEE_COUNT_LABELS,
  ORG_SECTOR_LABELS,
  type OrgEmployeeCount,
  type OrgSector,
} from "@/lib/compliance/applicability"
import type { GeneratedDocumentKind } from "@/lib/compliance/types"

export type HrPackAsset = {
  id: string
  title: string
  summary: string
  content: string
}

export type HrPackKind = "job-descriptions" | "hr-procedures" | "reges-correction"

export type HrPreparedPack = {
  kind: HrPackKind
  title: string
  summary: string
  assets: HrPackAsset[]
  completionChecklist: string[]
  generatorDocumentType: GeneratedDocumentKind
  generatorLabel: string
  returnEvidenceNote: string
}

export type JobDescriptionPack = HrPreparedPack

type GenerateJobDescriptionPackParams = {
  orgName: string
  sector?: OrgSector | null
  employeeCount?: OrgEmployeeCount | null
  hasAiTools?: boolean
}

export function generateJobDescriptionPack(
  params: GenerateJobDescriptionPackParams
): HrPreparedPack {
  const orgName = params.orgName.trim() || "Organizația"
  const sectorLabel = params.sector ? ORG_SECTOR_LABELS[params.sector] : "sector neconfirmat"
  const employeeCountLabel = params.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[params.employeeCount]
    : "număr de angajați neconfirmat"

  return {
    kind: "job-descriptions",
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
    generatorDocumentType: "job-description",
    generatorLabel: "Generează prima fișă",
    returnEvidenceNote:
      "CompliAI a pregătit pachetul HR pentru fișe de post: modelul de fișă, inventarul de roluri și checklistul de rollout au fost revizuite. Următorul pas este adaptarea pe rolurile reale și semnarea internă.",
  }
}

export function generateHrProcedurePack(
  params: GenerateJobDescriptionPackParams
): HrPreparedPack {
  const orgName = params.orgName.trim() || "Organizația"
  const sectorLabel = params.sector ? ORG_SECTOR_LABELS[params.sector] : "sector neconfirmat"
  const employeeCountLabel = params.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[params.employeeCount]
    : "număr de angajați neconfirmat"

  return {
    kind: "hr-procedures",
    title: "Pachet minim proceduri interne HR",
    summary:
      "CompliAI pregătește regulamentul intern, planul de comunicare și checklistul de rollout. Firma trebuie să adapteze politicile la programul real, la relațiile de muncă și la modul în care documentul ajunge la angajați.",
    assets: [
      {
        id: "internal-regulation-outline",
        title: "Regulament intern — structură de bază",
        summary: "Scheletul minim pe care îl personalizezi înainte să-l comunici sau să-l semnezi intern.",
        content: `# Regulament intern — ${orgName}

## Context firmă

- Sector: ${sectorLabel}
- Dimensiune: ${employeeCountLabel}
- Acest draft trebuie adaptat la programul real, disciplina muncii și procedurile aplicabile în firmă.

## 1. Scop și domeniu

- Regulamentul stabilește regulile interne de organizare, disciplină și lucru pentru ${orgName}.
- Se aplică tuturor angajaților, colaboratorilor interni și persoanelor cu acces la procesele de muncă.

## 2. Drepturi și obligații

- Drepturile și obligațiile angajaților și ale angajatorului se aliniază cu Codul Muncii.
- Se confirmă cine aprobă abaterile, cercetarea disciplinară și comunicările interne.

## 3. Programul de lucru

- Program standard: [completează]
- Pauze și ore suplimentare: [completează]
- Teleworking / lucru hibrid: [completează]

## 4. Disciplină și raportarea incidentelor

- Abaterile disciplinare și pașii minimi ai cercetării interne: [completează]
- Canal de raportare nereguli / whistleblowing: [completează]
- Cine aprobă măsurile disciplinare: [completează]

## 5. SSM, confidențialitate și protecția datelor

- Reguli SSM: [completează]
- Reguli de confidențialitate: [completează]
- Datele angajaților se prelucrează conform procedurilor GDPR.
${params.hasAiTools ? "- Utilizarea uneltelor AI se face doar conform politicii interne aprobate și fără date interzise." : ""}

## 6. Confirmare internă

- Revizuit de administrator / HR: [nume]
- Comunicat angajaților la data de: [completează]
- Dovada luării la cunoștință: [semnătură / confirmare digitală / e-mail intern]`,
      },
      {
        id: "communication-plan",
        title: "Plan minim de comunicare internă",
        summary: "Ce trebuie să se întâmple ca regulamentul să nu rămână doar un draft frumos în folder.",
        content: `# Plan de comunicare — ${orgName}

## Ce confirmi înainte de rollout

1. Cine aprobă versiunea finală?
2. Unde se salvează versiunea oficială?
3. Cum ajunge documentul la fiecare angajat?
4. Ce dovadă păstrezi pentru luarea la cunoștință?

## Varianta minimă de rollout

1. Finalizezi draftul și verifici adaptările obligatorii pentru ${sectorLabel}.
2. Confirmi lista angajaților / echipelor cărora li se aplică.
3. Comunici documentul pe canalul oficial: e-mail intern / intranet / mapă HR.
4. Ceri dovadă de luare la cunoștință: semnătură, confirmare digitală sau proces-verbal intern.
5. Arhivezi versiunea finală și dovada într-un loc auditabil.

## Dovadă bună pentru cockpit

- PDF final al regulamentului
- link / folder intern unde este salvat
- listă cu angajații / echipele către care a fost comunicat
- notă despre tipul de confirmare colectat`,
      },
      {
        id: "hr-procedures-rollout",
        title: "Checklist rollout regulament intern",
        summary: "Pașii minimi înainte să închizi cazul în cockpit.",
        content: `# Checklist rollout regulament intern — ${orgName}

## Pași minimi

1. Confirmi ce proceduri trebuie adaptate pentru ${employeeCountLabel}.
2. Completezi programul real, disciplina muncii și regulile interne specifice.
3. Verifici cine aprobă documentul final.
4. Stabilești canalul de comunicare către angajați.
5. Colectezi dovada de luare la cunoștință.
6. Arhivezi versiunea finală și notele de rollout.

## Întrebări de control

- Regulamentul reflectă programul și realitatea din firmă?
- Ai clar cine răspunde de actualizările viitoare?
- Știi unde intră dovada în Dosar pentru audit ITM / HR?`,
      },
    ],
    completionChecklist: [
      "Ai revizuit structura regulamentului intern și știi ce capitole trebuie personalizate pentru firmă.",
      "Ai stabilit cum comunici documentul către angajați și ce dovadă păstrezi pentru luarea la cunoștință.",
      "Ai clar unde se salvează versiunea finală și cine răspunde de actualizările ulterioare.",
    ],
    generatorDocumentType: "hr-internal-procedures",
    generatorLabel: "Generează regulamentul",
    returnEvidenceNote:
      "CompliAI a pregătit pachetul HR pentru regulament intern: structura documentului, planul de comunicare și checklistul de rollout au fost revizuite. Următorul pas este adaptarea la programul real și comunicarea către angajați.",
  }
}

export function generateRegesCorrectionPack(
  params: GenerateJobDescriptionPackParams
): HrPreparedPack {
  const orgName = params.orgName.trim() || "Organizația"
  const sectorLabel = params.sector ? ORG_SECTOR_LABELS[params.sector] : "sector neconfirmat"
  const employeeCountLabel = params.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[params.employeeCount]
    : "număr de angajați neconfirmat"

  return {
    kind: "reges-correction",
    title: "Pachet minim corecție REGES",
    summary:
      "CompliAI pregătește brief-ul de corecție, checklistul pentru HR / contabil și mesajul de handoff. Firma tot trebuie să opereze remedierea reală în REGES și să păstreze exportul sau confirmarea rezultată.",
    assets: [
      {
        id: "reges-correction-brief",
        title: "Brief corecție REGES / Revisal",
        summary: "Documentul scurt pe care îl trimiți către contabil sau HR ca să nu înceapă remedierea de la zero.",
        content: `# Brief corecție REGES / Revisal — ${orgName}

## Context

- Firmă: ${orgName}
- Sector: ${sectorLabel}
- Dimensiune: ${employeeCountLabel}
- Motiv: evidența contractelor de muncă nu este confirmată ca fiind la zi în REGES / Revisal.

## Ce trebuie verificat imediat

1. Dacă toate contractele active sunt prezente și au statusul corect.
2. Dacă modificările de salariu, funcție, normă sau suspendare au fost operate la timp.
3. Dacă încetările și reluările de activitate sunt reflectate corect.
4. Dacă există documente suport pentru fiecare schimbare operată.

## Ce așteptăm ca rezultat

- o confirmare clară că registrul este adus la zi
- un export / printscreen / raport din sistemul real
- o notă despre ce neconcordanțe au fost corectate

## Urma bună pentru dosar

- export REGES / Revisal actualizat
- confirmare scrisă de la contabil sau HR
- listă scurtă cu pozițiile / modificările corectate`,
      },
      {
        id: "reges-verification-checklist",
        title: "Checklist verificare HR / contabil",
        summary: "Pașii minimi pe care îi urmărești înainte să marchezi cazul rezolvat în cockpit.",
        content: `# Checklist verificare REGES — ${orgName}

1. Confirmi care este registrul sau sursa principală folosită de firmă.
2. Verifici toate contractele active și modificările recente.
3. Notezi ce lipsuri sau întârzieri au fost identificate.
4. Corectezi în sistemul real și verifici că remedierea este salvată.
5. Păstrezi exportul / captura / confirmarea finală.

## Întrebări de control

- Știm exact cine a operat corecția?
- Există dovadă clară că registrul este acum la zi?
- Dovada poate fi verificată într-un control ITM fără explicații suplimentare?`,
      },
      {
        id: "reges-handoff-message",
        title: "Mesaj minim către contabil / HR",
        summary: "Textul de pornire pe care îl poți trimite imediat, fără să-l scrii de la zero.",
        content: `Subiect: Verificare și corecție REGES / Revisal — ${orgName}

Bună,

CompliAI a detectat că evidența contractelor de muncă trebuie verificată și posibil corectată în REGES / Revisal pentru ${orgName}.

Te rog să verifici:
- contractele active
- modificările recente (salariu, funcție, normă, suspendări)
- încetările și orice actualizare restantă

După verificare, avem nevoie de:
- confirmarea că registrul este la zi
- exportul / captura / dovada de control
- o scurtă notă cu ce a fost corectat

Mulțumesc.`,
      },
    ],
    completionChecklist: [
      "Ai trimis brief-ul sau ai pornit clar handoff-ul către contabil / HR.",
      "Ai stabilit ce dovadă finală trebuie să se întoarcă în cockpit: export, captură sau confirmare scrisă.",
      "Știi unde va fi salvată urma finală pentru audit ITM / HR.",
    ],
    generatorDocumentType: "reges-correction-brief",
    generatorLabel: "Generează brief-ul",
    returnEvidenceNote:
      "CompliAI a pregătit brief-ul de corecție REGES: checklistul pentru contabil / HR și mesajul de handoff au fost revizuite. Următorul pas este verificarea registrului real și întoarcerea cu exportul sau confirmarea de corecție.",
  }
}
