import type {
  AlertSeverity,
  FindingCategory,
  LegalMapping,
  TaskEvidenceKind,
} from "@/lib/compliance/types"
import type {
  CompliancePrinciple,
  ComplianceSeverity,
} from "@/lib/compliance/constitution"

export type ComplianceRuleDefinition = {
  ruleId: string
  category: FindingCategory
  severity: ComplianceSeverity
  title: string
  detail: string
  impactSummary: string
  remediationHint: string
  legalReference: string
  legalMappings: LegalMapping[]
  principles: CompliancePrinciple[]
  keywords: string[]
  manifestKeys?: string[]
  alertMessage?: string
  alertSeverity?: AlertSeverity
  ownerSuggestion: string
  evidenceRequired: string
  evidenceTypes?: TaskEvidenceKind[]
  rescanHint: string
  readyTextLabel?: string
  readyText?: string
}

export const COMPLIANCE_RULE_LIBRARY: ComplianceRuleDefinition[] = [
  {
    ruleId: "EUAI-001",
    category: "EU_AI_ACT",
    severity: "high",
    title: "Posibil caz high-risk (EU AI Act)",
    detail:
      "Documentul indică un flux de decizie automată. E necesară evaluare umană și analiză de impact.",
    impactSummary:
      "Dacă acest flux produce decizii cu efect asupra utilizatorilor, lipsa supravegherii umane și a documentării de risc poate intra în zona high-risk.",
    remediationHint:
      "Pune un pas explicit de validare umană înainte de decizia finală și documentează scopul, datele folosite și logica operațională.",
    legalReference: "AI Act Art. 9 / Art. 14",
    legalMappings: [
      {
        regulation: "EU AI Act",
        article: "Art. 9",
        label: "Risk management system",
        reason: "Un flux cu impact ridicat are nevoie de control de risc și documentare explicită.",
      },
      {
        regulation: "EU AI Act",
        article: "Art. 14",
        label: "Human oversight",
        reason: "Decizia finală nu trebuie să rămână exclusiv automată când există impact asupra persoanei vizate.",
      },
    ],
    principles: ["oversight", "transparency", "accountability"],
    keywords: [
      "decizie automată",
      "decizie automata",
      "scoring",
      "profilare",
      "identificare biometrică",
      "identificare biometrica",
      "cv screening",
    ],
    manifestKeys: ["credit-score", "scoring", "automated-decision", "decisioning"],
    alertMessage: "Flux AI cu impact ridicat detectat",
    alertSeverity: "high",
    ownerSuggestion: "DPO + Tech Lead",
    evidenceRequired:
      "Procedură de override uman, owner aprobat, log de validare și descrierea scopului + datelor folosite.",
    evidenceTypes: ["policy_text", "log_export", "screenshot"],
    rescanHint: "Rescanează imediat după introducerea validării umane și actualizarea procedurii.",
    readyTextLabel: "Text gata de copiat in procedura interna",
    readyText: [
      "Procedură internă pentru flux AI cu impact ridicat",
      "",
      "Nicio decizie cu efect asupra persoanei vizate nu este executată exclusiv automat.",
      "Înainte de rezultat final, cazul este revizuit de un operator desemnat care poate confirma, modifica sau respinge recomandarea sistemului.",
      "Pentru fiecare decizie sunt păstrate: scopul procesării, datele folosite, versiunea modelului sau regulii și logul intervenției umane.",
    ].join("\n"),
  },
  {
    ruleId: "GDPR-003",
    category: "GDPR",
    severity: "medium",
    title: "Verificare consimțământ tracking",
    detail:
      "A fost detectat limbaj de tracking. Verifică dovada de consimțământ și baza legală GDPR.",
    impactSummary:
      "Menționarea tracking/cookies fără control clar al consimțământului poate însemna că scripturile pornesc înainte de accept sau că nu păstrezi dovada preferințelor.",
    remediationHint:
      "Blochează scripturile non-esențiale până la accept explicit și păstrează log cu timestamp, preferințe și versiunea textului legal.",
    legalReference: "GDPR Art. 6 / Art. 7",
    legalMappings: [
      {
        regulation: "GDPR",
        article: "Art. 6",
        label: "Lawfulness of processing",
        reason: "Tracking-ul are nevoie de bază legală clară și verificabilă.",
      },
      {
        regulation: "GDPR",
        article: "Art. 7",
        label: "Conditions for consent",
        reason: "Consimțământul trebuie obținut clar și dovedit, nu doar presupus din text.",
      },
    ],
    principles: ["privacy_data_governance", "accountability"],
    keywords: ["cookies", "tracking", "analytics"],
    manifestKeys: ["react-ga", "gtag.js", "google-analytics", "facebook-pixel", "hotjar"],
    alertMessage: "Lipsă claritate consimțământ tracking",
    alertSeverity: "medium",
    ownerSuggestion: "Marketing Ops + Frontend",
    evidenceRequired:
      "Capturi CMP, test că scripturile sunt blocate înainte de accept și log cu timestamp + preferințe.",
    evidenceTypes: ["screenshot", "log_export", "policy_text"],
    rescanHint: "Rescanează după publicarea bannerului nou și verificarea tehnică a scripturilor.",
    readyTextLabel: "Text gata de copiat in banner / CMP",
    readyText: [
      "Folosim cookie-uri și tehnologii similare pentru analiză și îmbunătățirea experienței.",
      "Cookie-urile non-esențiale sunt activate doar după acordul tău explicit.",
      "Poți accepta, refuza sau modifica preferințele în orice moment din centrul de preferințe.",
    ].join("\n"),
  },
  {
    ruleId: "EF-001",
    category: "E_FACTURA",
    severity: "low",
    title: "e-Factura: integrare menționată",
    detail:
      "Documentul conține indicii de flux e-Factura. Confirmă transmiterea și arhivarea conformă.",
    impactSummary:
      "Faptul că apare fluxul e-Factura în document nu dovedește singur că XML-ul a fost validat, transmis și arhivat corect în operațiunile curente.",
    remediationHint:
      "Validează XML-ul, confirmă răspunsul de transmitere și arhivează dovada de procesare pentru contabil și audit.",
    legalReference: "RO e-Factura / flux ANAF",
    legalMappings: [
      {
        regulation: "RO e-Factura",
        article: "Flux operational",
        label: "Transmitere si arhivare",
        reason: "Simpla menționare în document nu înlocuiește dovada de transmitere și arhivare corectă.",
      },
    ],
    principles: ["accountability", "robustness"],
    keywords: ["factură", "factura", "anaf", "e-factura", "xml"],
    manifestKeys: ["anaf", "e-factura", "xml"],
    ownerSuggestion: "FinOps + Backend",
    evidenceRequired:
      "XML validat, răspuns de transmitere și dovadă de arhivare pentru audit și contabil.",
    evidenceTypes: ["document_bundle", "log_export"],
    rescanHint: "Rescanează după sync manual sau după confirmarea unui flux operațional curat.",
    readyTextLabel: "Text gata de copiat in runbook operational",
    readyText: [
      "Pentru fiecare factură transmisă prin e-Factura se păstrează XML-ul validat, confirmarea de transmitere și dovada de arhivare.",
      "În caz de eroare, operatorul reia validarea, documentează incidentul și confirmă remedierea înainte de retrimitere.",
      "Verificarea zilnică a răspunsurilor și a erorilor de sincronizare face parte din controlul operațional standard.",
    ].join("\n"),
  },
  {
    ruleId: "GDPR-RET-001",
    category: "GDPR",
    severity: "medium",
    title: "Clarifică retenția datelor personale",
    detail:
      "Documentul menționează retenție sau păstrarea datelor. Verifică dacă termenul, regula de ștergere și dovada operațională sunt clare.",
    impactSummary:
      "Retenția neclară poate duce la păstrarea datelor peste termenul necesar sau fără reguli documentate de ștergere și revizie.",
    remediationHint:
      "Definește termene clare de retenție pe categorie de date și documentează ștergerea sau anonimizarea la expirare.",
    legalReference: "GDPR Art. 5(1)(e)",
    legalMappings: [
      {
        regulation: "GDPR",
        article: "Art. 5(1)(e)",
        label: "Storage limitation",
        reason: "Datele trebuie păstrate doar cât este necesar și trebuie să existe reguli clare de ștergere.",
      },
    ],
    principles: ["privacy_data_governance", "accountability"],
    keywords: ["retenție", "retentie", "retention", "păstrare", "pastrare", "ștergere", "stergere"],
    alertMessage: "Retenția datelor trebuie clarificată",
    alertSeverity: "medium",
    ownerSuggestion: "Legal + Data Owner",
    evidenceRequired:
      "Tabel de retenție aprobat, procedură de ștergere și dovadă de rulare sau control al procesului.",
    evidenceTypes: ["policy_text", "log_export"],
    rescanHint: "Rescanează după actualizarea politicii de retenție și după configurarea ștergerii sau anonimizării.",
    readyTextLabel: "Text gata de copiat in politica de retenție",
    readyText: [
      "Datele personale sunt păstrate doar pe perioada necesară scopului pentru care au fost colectate.",
      "La expirarea termenului aplicabil, datele sunt șterse sau anonimizate prin procese automate sau controale operaționale documentate.",
      "Termenele de retenție se revizuiesc periodic și sunt aprobate de owner-ul de date și de funcția de conformitate.",
    ].join("\n"),
  },
  {
    ruleId: "EUAI-TR-001",
    category: "EU_AI_ACT",
    severity: "medium",
    title: "Clarifică transparența pentru interacțiunea cu AI",
    detail:
      "Documentul sugerează interacțiune cu chatbot sau asistent AI. Verifică dacă utilizatorul este informat clar că interacționează cu un sistem AI.",
    impactSummary:
      "Lipsa transparenței la interacțiunea cu AI poate produce confuzie pentru utilizatori și poate lăsa produsul fără notice clar în punctele critice.",
    remediationHint:
      "Adaugă un text explicit care spune că utilizatorul interacționează cu un sistem AI și explică pe scurt scopul acestuia.",
    legalReference: "AI Act Art. 50",
    legalMappings: [
      {
        regulation: "EU AI Act",
        article: "Art. 50",
        label: "Transparency obligations",
        reason: "Utilizatorii trebuie informați când interacționează cu un sistem AI în contexte relevante.",
      },
    ],
    principles: ["transparency", "accountability"],
    keywords: ["chatbot", "asistent virtual", "assistant ai", "bot", "ai assistant"],
    manifestKeys: ["openai", "anthropic", "@google/generative-ai", "langchain", "text-generation"],
    alertMessage: "Transparență AI de confirmat",
    alertSeverity: "medium",
    ownerSuggestion: "Product + Legal",
    evidenceRequired:
      "Screenshot din interfață, textul de notice publicat și confirmarea locului în care apare mesajul pentru utilizator.",
    evidenceTypes: ["screenshot", "policy_text"],
    rescanHint: "Rescanează după publicarea notice-ului de transparență în interfață sau în documentația publică.",
    readyTextLabel: "Text gata de copiat in interfață / notice",
    readyText: [
      "Acest asistent folosește inteligență artificială pentru a genera răspunsuri și recomandări.",
      "Rezultatele trebuie validate uman atunci când există impact operațional sau juridic.",
      "Poți solicita oricând intervenția unui operator uman sau detalii despre modul general de funcționare.",
    ].join("\n"),
  },
  {
    ruleId: "GDPR-INT-001",
    category: "GDPR",
    severity: "high",
    title: "Verifică transferul sau rezidența datelor",
    detail:
      "Documentul sugerează transfer internațional sau procesare în afara UE. Confirmă rezidența datelor și baza de transfer.",
    impactSummary:
      "Dacă datele personale ajung în afara UE sau SEE fără documentare clară, riscul crește rapid și trebuie clarificată baza de transfer.",
    remediationHint:
      "Documentează unde sunt procesate datele, ce furnizori sunt implicați și ce mecanism de transfer folosești.",
    legalReference: "GDPR Chapter V",
    legalMappings: [
      {
        regulation: "GDPR",
        article: "Chapter V",
        label: "International transfers",
        reason: "Transferul datelor în afara UE trebuie documentat și justificat cu un mecanism valid.",
      },
    ],
    principles: ["privacy_data_governance", "accountability"],
    keywords: [
      "transfer internațional",
      "transfer international",
      "outside eu",
      "outside the eu",
      "us-east-1",
      "statele unite",
      "non-eea",
      "data residency",
    ],
    manifestKeys: ["us-east-1", "outside eu", "non-eea"],
    alertMessage: "Transfer sau rezidență date de verificat",
    alertSeverity: "high",
    ownerSuggestion: "DPO + Security / Ops",
    evidenceRequired:
      "Matrice furnizori, regiune de procesare, bază de transfer și dovadă contractuală sau tehnică pentru rezidență.",
    evidenceTypes: ["yaml_evidence", "policy_text", "document_bundle"],
    rescanHint: "Rescanează după clarificarea rezidenței datelor și după actualizarea documentației furnizorului.",
    readyTextLabel: "Text gata de copiat in documentația de transfer",
    readyText: [
      "Datele personale sunt procesate numai în regiunile și de furnizorii aprobați prin evaluarea internă de conformitate.",
      "Orice transfer în afara UE sau SEE este documentat și susținut de mecanisme valide de transfer și controale interne.",
    ].join("\n"),
  },
  {
    ruleId: "GDPR-PD-001",
    category: "GDPR",
    severity: "medium",
    title: "Confirmă temeiul pentru date personale procesate de AI",
    detail:
      "Sursa tehnică declară sau sugerează procesarea datelor personale. Verifică baza legală, scopul și retenția.",
    impactSummary:
      "Când AI-ul procesează date personale, lipsa documentării despre scop, temei și retenție crește rapid riscul operațional și GDPR.",
    remediationHint:
      "Documentează scopul procesării, baza legală, categoriile de date și perioada de retenție pentru fluxul AI.",
    legalReference: "GDPR Art. 5 / Art. 6 / Art. 13",
    legalMappings: [
      {
        regulation: "GDPR",
        article: "Art. 5",
        label: "Purpose limitation and minimisation",
        reason: "Trebuie clarificat ce date sunt folosite și de ce.",
      },
      {
        regulation: "GDPR",
        article: "Art. 13",
        label: "Information to data subjects",
        reason: "Persoana vizată trebuie informată despre prelucrarea datelor personale.",
      },
    ],
    principles: ["privacy_data_governance", "transparency"],
    keywords: ["date personale", "personal data", "profil utilizator", "istoric client"],
    manifestKeys: ["personal_data_processed=true"],
    alertMessage: "Procesare date personale de clarificat",
    alertSeverity: "medium",
    ownerSuggestion: "DPO + Product Owner",
    evidenceRequired:
      "Registru de prelucrare, scop documentat, categorie de date și notice public actualizat.",
    evidenceTypes: ["policy_text", "document_bundle"],
    rescanHint: "Rescanează după actualizarea notice-ului și a documentației interne despre datele procesate.",
    readyTextLabel: "Text gata de copiat in notice / registru",
    readyText: [
      "Sistemul AI prelucrează doar datele personale necesare scopului operațional definit și aprobat intern.",
      "Scopul, categoriile de date și perioada de retenție sunt documentate și revizuite periodic.",
    ].join("\n"),
  },
  {
    ruleId: "EUAI-HO-001",
    category: "EU_AI_ACT",
    severity: "high",
    title: "Confirmă supravegherea umană declarată în configurație",
    detail:
      "Sursa tehnică sugerează decizie asistată de AI fără garanții suficiente de supraveghere umană declarată.",
    impactSummary:
      "Când configurarea nu arată clar cum intervine omul, produsul rămâne expus pe zona de human oversight și accountability.",
    remediationHint:
      "Completează câmpurile de supraveghere umană și descrie rolul, metoda de review și reacția la eșec.",
    legalReference: "AI Act Art. 14",
    legalMappings: [
      {
        regulation: "EU AI Act",
        article: "Art. 14",
        label: "Human oversight",
        reason: "Supravegherea umană trebuie să fie reală, nu doar menționată generic.",
      },
    ],
    principles: ["oversight", "accountability"],
    keywords: ["fără review uman", "fara review uman", "fully automated", "100% automat"],
    manifestKeys: ["human_oversight.required=false"],
    alertMessage: "Supraveghere umană de confirmat",
    alertSeverity: "high",
    ownerSuggestion: "Product Owner + Ops",
    evidenceRequired:
      "Procedură de review uman, rol aprobat și dovadă că operatorul poate interveni sau opri fluxul.",
    evidenceTypes: ["policy_text", "log_export", "yaml_evidence"],
    rescanHint: "Rescanează după completarea și validarea secțiunii de human oversight.",
    readyTextLabel: "Text gata de copiat in procedura de oversight",
    readyText: [
      "Un operator desemnat verifică recomandarea sistemului AI înainte de executarea unei decizii cu impact.",
      "Operatorul poate confirma, modifica sau opri fluxul și păstrează justificarea intervenției în jurnalul de control.",
    ].join("\n"),
  },
]

export function getComplianceRule(ruleId: string) {
  return COMPLIANCE_RULE_LIBRARY.find((rule) => rule.ruleId === ruleId)
}
