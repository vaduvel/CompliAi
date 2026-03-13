import type {
  FindingCategory,
  RemediationMode,
  RemediationAction,
  ScanFinding,
  TaskEvidenceKind,
  TaskValidationKind,
} from "@/lib/compliance/types"

export type RemediationRecipeId =
  | "high-risk-flow"
  | "tracking-consent"
  | "retention-policy"
  | "efactura-freshness"
  | "baseline-maintenance"

type RemediationRecipeDefinition = {
  id: RemediationRecipeId
  title: string
  priority: RemediationAction["priority"]
  remediationMode: RemediationMode
  defaultOwner: string
  defaultWhy: string
  defaultActions: string[]
  defaultEvidence: string
  defaultLawReference: string
  defaultFixPreview: string
  readyTextLabel: string
  readyText: string
  validationKind: TaskValidationKind
  evidenceTypes: TaskEvidenceKind[]
}

type FindingRecipeDefinition = {
  ruleId: string
  remediationMode: RemediationMode
  ownerFallback: string
  dueDate: string
  effortLabel: string
  steps: string[]
  fixPreview?: string
  readyTextLabel?: string
  readyText?: string
}

export const REMEDIATION_RECIPES: Record<RemediationRecipeId, RemediationRecipeDefinition> = {
  "high-risk-flow": {
    id: "high-risk-flow",
    title: "Control pentru fluxurile AI high-risk",
    priority: "P1",
    remediationMode: "structural",
    defaultOwner: "DPO + Tech Lead",
    defaultWhy:
      "Există indicii de flux AI cu impact ridicat asupra drepturilor utilizatorilor.",
    defaultActions: [
      "Blochează lansarea funcțiilor de decizie automată până la validare umană.",
      "Documentează scopul, datele folosite și logica decizională.",
      "Adaugă punct de supraveghere umană înainte de decizia finală.",
    ],
    defaultEvidence:
      "Proces verbal de evaluare + workflow aprobat + log de override uman.",
    defaultLawReference: "AI Act Art. 9 / Art. 14",
    defaultFixPreview:
      "Pune control uman obligatoriu înainte de orice decizie cu impact asupra utilizatorului.",
    readyTextLabel: "Text gata de copiat in procedura interna",
    readyText: [
      "Procedură internă pentru flux AI cu impact ridicat",
      "",
      "Nicio decizie cu efect asupra persoanei vizate nu este executată exclusiv automat.",
      "Înainte de rezultat final, cazul este revizuit de un operator desemnat care poate confirma, modifica sau respinge recomandarea sistemului.",
      "Pentru fiecare decizie sunt păstrate: scopul procesării, datele folosite, versiunea modelului sau regulii și logul intervenției umane.",
    ].join("\n"),
    validationKind: "human-oversight",
    evidenceTypes: ["policy_text", "log_export", "screenshot"],
  },
  "tracking-consent": {
    id: "tracking-consent",
    title: "Remediere consimțământ tracking (GDPR)",
    priority: "P1",
    remediationMode: "rapid",
    defaultOwner: "Marketing Ops + Frontend",
    defaultWhy:
      "Au fost detectate semnale de tracking fără claritate completă de consimțământ.",
    defaultActions: [
      "Asigură blocarea scripturilor de tracking până la accept explicit.",
      "Egalizează vizibilitatea butoanelor Accept/Refuz în CMP.",
      "Păstrează dovada consimțământului (timestamp, preferințe, versiune text legal).",
    ],
    defaultEvidence:
      "Capturi CMP + log consimțământ + test tehnic în browser devtools.",
    defaultLawReference: "GDPR Art. 6 / Art. 7",
    defaultFixPreview:
      "Blochează scripturile non-esențiale până la accept explicit și salvează dovada preferințelor.",
    readyTextLabel: "Text gata de copiat in banner / CMP",
    readyText: [
      "Folosim cookie-uri și tehnologii similare pentru analiză și îmbunătățirea experienței.",
      "Cookie-urile non-esențiale sunt activate doar după acordul tău explicit.",
      "Poți accepta, refuza sau modifica preferințele în orice moment din centrul de preferințe.",
    ].join("\n"),
    validationKind: "tracking-consent",
    evidenceTypes: ["screenshot", "log_export", "policy_text"],
  },
  "retention-policy": {
    id: "retention-policy",
    title: "Actualizare politică de retenție date",
    priority: "P2",
    remediationMode: "structural",
    defaultOwner: "Legal + Data Owner",
    defaultWhy:
      "Există alerte privind perioada de retenție și ștergerea datelor.",
    defaultActions: [
      "Definește termene de retenție pe categorie de date (clienți, lead-uri, chat logs).",
      "Configurează ștergere/anonymizare automată la expirarea termenelor.",
      "Actualizează documentația internă și politica publică.",
    ],
    defaultEvidence:
      "Tabel retenție aprobat + joburi de curățare + policy publicat.",
    defaultLawReference: "GDPR Art. 5(1)(e)",
    defaultFixPreview:
      "Definește termene clare de retenție pe categorie de date și documentează ștergerea sau anonimizarea la expirare.",
    readyTextLabel: "Text gata de copiat in politica de retenție",
    readyText: [
      "Datele personale sunt păstrate doar pe perioada necesară scopului pentru care au fost colectate.",
      "La expirarea termenului aplicabil, datele sunt șterse sau anonimizate prin procese automate sau controale operaționale documentate.",
      "Termenele de retenție se revizuiesc periodic și sunt aprobate de owner-ul de date și de funcția de conformitate.",
    ].join("\n"),
    validationKind: "retention-policy",
    evidenceTypes: ["policy_text", "log_export"],
  },
  "efactura-freshness": {
    id: "efactura-freshness",
    title: "Stabilizare sincronizare e-Factura",
    priority: "P2",
    remediationMode: "rapid",
    defaultOwner: "FinOps + Backend",
    defaultWhy:
      "Datele e-Factura par neactualizate față de fluxul operațional.",
    defaultActions: [
      "Rulează sync manual și verifică răspunsurile de la integrare.",
      "Adaugă monitorizare zilnică pentru eșecuri de sincronizare.",
      "Configurează retry automat pentru intervale de eroare.",
    ],
    defaultEvidence:
      "Log sync zilnic + alerte de monitorizare + runbook incident.",
    defaultLawReference: "RO e-Factura / flux ANAF",
    defaultFixPreview:
      "Rulează o validare XML și confirmă răspunsul de transmitere înainte de închidere.",
    readyTextLabel: "Text gata de copiat in runbook operațional",
    readyText: [
      "Pentru fiecare factură transmisă prin e-Factura se păstrează XML-ul validat, confirmarea de transmitere și dovada de arhivare.",
      "În caz de eroare, operatorul reia validarea, documentează incidentul și confirmă remedierea înainte de retrimitere.",
      "Verificarea zilnică a răspunsurilor și a erorilor de sincronizare face parte din controlul operațional standard.",
    ].join("\n"),
    validationKind: "efactura-sync",
    evidenceTypes: ["document_bundle", "log_export"],
  },
  "baseline-maintenance": {
    id: "baseline-maintenance",
    title: "Menținere conformitate curentă",
    priority: "P3",
    remediationMode: "rapid",
    defaultOwner: "Compliance Officer",
    defaultWhy: "Nu sunt detectate riscuri critice noi în acest moment.",
    defaultActions: [
      "Rulare scan săptămânală pe documentele actualizate.",
      "Revalidare trimestrială a furnizorilor și fluxurilor AI.",
      "Păstrare evidențe pentru audit intern.",
    ],
    defaultEvidence: "Calendar de revizie + checklist periodic + jurnal audit.",
    defaultLawReference: "Control intern / verificare umană",
    defaultFixPreview:
      "Rulează scanarea periodic și păstrează evidențele de audit la zi.",
    readyTextLabel: "Text gata de copiat in calendarul de control",
    readyText: [
      "Organizația rulează o verificare periodică a documentelor și fluxurilor cu impact de conformitate.",
      "Rezultatele sunt revizuite uman, iar dovezile de control se arhivează pentru audit intern.",
    ].join("\n"),
    validationKind: "evidence-only",
    evidenceTypes: ["policy_text", "other"],
  },
}

export function getRemediationRecipe(id: RemediationRecipeId) {
  return REMEDIATION_RECIPES[id]
}

export function inferValidationKindFromFinding(finding?: ScanFinding): TaskValidationKind {
  const ruleId = finding?.provenance?.ruleId
  if (ruleId === "EUAI-001") return "human-oversight"
  if (ruleId === "GDPR-003") return "tracking-consent"
  if (ruleId === "GDPR-RET-001") return "retention-policy"
  if (ruleId === "EF-001") return "efactura-sync"
  if (ruleId === "EUAI-TR-001") return "ai-transparency"
  if (ruleId === "GDPR-INT-001") return "data-residency"

  if (finding?.category === "GDPR") return "tracking-consent"
  if (finding?.category === "E_FACTURA") return "efactura-sync"
  if (finding?.category === "EU_AI_ACT") return "human-oversight"
  return "evidence-only"
}

export function buildDefaultReadyTextForCategory(category: FindingCategory) {
  if (category === "EU_AI_ACT") {
    return [
      "Procedură de control uman pentru decizii asistate de AI",
      "",
      "Nicio decizie finală cu efect asupra persoanei vizate nu este executată exclusiv automat.",
      "Operatorul desemnat verifică datele de intrare, recomandarea sistemului și poate confirma, modifica sau respinge rezultatul.",
      "Pentru fiecare caz se păstrează log cu motivul deciziei, intervenția umană și versiunea regulii sau modelului utilizat.",
    ].join("\n")
  }

  if (category === "GDPR") {
    return [
      "Text recomandat pentru banner / centru de preferințe",
      "",
      "Folosim cookie-uri și tehnologii similare pentru analiză și măsurarea performanței doar după acordul tău explicit.",
      "Poți accepta sau refuza cookie-urile non-esențiale, iar alegerea ta este salvată și poate fi schimbată oricând din centrul de preferințe.",
      "Detalii despre scopuri, furnizori și perioada de păstrare sunt disponibile în politica de confidențialitate.",
    ].join("\n")
  }

  return [
    "Notă operațională pentru flux e-Factura",
    "",
    "Validarea și transmiterea se consideră închise doar după păstrarea XML-ului validat, a răspunsului de transmitere și a dovezii de arhivare.",
    "În caz de eroare, incidentul se documentează, se corectează și se confirmă manual înainte de retrimitere.",
  ].join("\n")
}

export const FINDING_REMEDIATION_RECIPES: Record<string, FindingRecipeDefinition> = {
  "EUAI-001": {
    ruleId: "EUAI-001",
    remediationMode: "structural",
    ownerFallback: "DPO + Product + Tech Lead",
    dueDate: "azi",
    effortLabel: "15 min",
    steps: [
      "Identifică exact unde apare decizia automată sau scorarea cu impact asupra persoanei vizate.",
      "Introdu un pas obligatoriu de aprobare, respingere sau override uman înainte de comunicarea deciziei.",
      "Actualizează procedura internă și păstrează dovada fluxului de aprobare.",
    ],
  },
  "GDPR-003": {
    ruleId: "GDPR-003",
    remediationMode: "rapid",
    ownerFallback: "Frontend + Marketing Ops",
    dueDate: "azi",
    effortLabel: "10 min",
    steps: [
      "Blochează scripturile non-esențiale până la accept explicit.",
      "Fă bannerul sau centrul de preferințe suficient de clar pentru Accept și Refuz.",
      "Păstrează dovada consimțământului cu timestamp și versiunea textului legal.",
    ],
  },
  "GDPR-RET-001": {
    ruleId: "GDPR-RET-001",
    remediationMode: "structural",
    ownerFallback: "Legal + Data Owner",
    dueDate: "in 3 zile",
    effortLabel: "20 min",
    steps: [
      "Definește termenul de retenție pentru fiecare categorie de date atinsă de flux.",
      "Leagă termenul de un proces de ștergere sau anonimizare verificabil.",
      "Publică textul actualizat și păstrează dovada aprobării interne.",
    ],
  },
  "EUAI-TR-001": {
    ruleId: "EUAI-TR-001",
    remediationMode: "rapid",
    ownerFallback: "Product + Frontend",
    dueDate: "maine",
    effortLabel: "10 min",
    steps: [
      "Adaugă un notice clar că utilizatorul interacționează cu un sistem AI.",
      "Explică pe scurt scopul asistentului și când trebuie validat uman.",
      "Atașează screenshot din interfață după publicare și rescanează sursa.",
    ],
  },
  "GDPR-INT-001": {
    ruleId: "GDPR-INT-001",
    remediationMode: "structural",
    ownerFallback: "DPO + Security / Ops",
    dueDate: "in 3 zile",
    effortLabel: "20 min",
    steps: [
      "Confirmă regiunea reală de procesare și furnizorii implicați.",
      "Documentează baza de transfer dacă datele ies din UE sau SEE.",
      "Actualizează documentația furnizorului și dovada contractuală sau tehnică.",
    ],
  },
  "EF-001": {
    ruleId: "EF-001",
    remediationMode: "rapid",
    ownerFallback: "FinOps + Backend",
    dueDate: "maine",
    effortLabel: "15 min",
    steps: [
      "Validează XML-ul și răspunsul de transmitere pentru ultimul flux relevant.",
      "Confirmă că dovada de arhivare este salvată pentru audit și contabil.",
      "Rulează un sync nou dacă ultima confirmare operațională nu este suficient de recentă.",
    ],
  },
}

export function getFindingRemediationRecipe(ruleId?: string) {
  if (!ruleId) return undefined
  return FINDING_REMEDIATION_RECIPES[ruleId]
}

export function inferRemediationModeFromFinding(finding?: ScanFinding): RemediationMode {
  const recipe = getFindingRemediationRecipe(finding?.provenance?.ruleId)
  if (recipe?.remediationMode) return recipe.remediationMode

  if (finding?.category === "EU_AI_ACT") return "structural"
  if (finding?.category === "GDPR") {
    const lower = `${finding.title} ${finding.detail}`.toLowerCase()
    return lower.includes("reten") || lower.includes("reziden") ? "structural" : "rapid"
  }
  return "rapid"
}
