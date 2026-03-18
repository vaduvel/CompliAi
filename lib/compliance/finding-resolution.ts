// V3 P0.0 — Finding Resolution Layer
// Builders pentru drumul complet: problemă → impact → acțiune → dovadă → revalidare.
// Orice finding nou trebuie să aibă cel puțin problem + impact + action.

import type { FindingResolution } from "@/lib/compliance/types"
import type { Nis2Category } from "@/lib/compliance/nis2-rules"

// ── NIS2 resolutions per categorie ───────────────────────────────────────────

const NIS2_RESOLUTIONS: Record<Nis2Category, FindingResolution> = {
  "risk-management": {
    problem: "Organizația nu are un proces documentat de gestiune a riscurilor cibernetice.",
    impact: "Fără evaluare de risc, vulnerabilitățile critice rămân neidentificate și neadresate. DNSC poate constata lipsă de conformitate la inspecție.",
    action: "Elaborează și documentează o politică de gestiune a riscurilor cibernetice conform NIS2 Art. 21(2)(a).",
    generatedAsset: "Plan de Răspuns la Incidente — generabil din Generator",
    humanStep: "Desemnează un responsabil cu gestiunea riscului și programează evaluarea anuală.",
    closureEvidence: "Politică de gestiune a riscului semnată + dovadă evaluare periodică (raport, PV)",
    revalidation: "Reverificare anuală sau după orice incident semnificativ",
  },
  "incident-response": {
    problem: "Lipsesc proceduri clare de răspuns la incidente de securitate cibernetică.",
    impact: "În cazul unui incident, organizația nu poate notifica DNSC în termenele legale (24h/72h) și nu poate limita pagubele. Risc de sancțiuni conform OUG 155/2024 Art. 33.",
    action: "Implementează un plan de răspuns la incidente cu timeline 24h/72h conform NIS2 Art. 23.",
    generatedAsset: "Plan IR NIS2 — generabil din secțiunea NIS2 → Generează Plan IR",
    humanStep: "Testează planul printr-un exercițiu de simulare (tabletop exercise) și desemnează echipa de răspuns.",
    closureEvidence: "Plan IR documentat + dovadă test/exercițiu (PV, raport de simulare)",
    revalidation: "Test anual al planului + actualizare după fiecare incident real",
  },
  "supply-chain": {
    problem: "Furnizorii de servicii IT nu sunt evaluați din perspectiva riscului de securitate cibernetică.",
    impact: "Un furnizor compromis poate deveni vector de atac spre organizația ta. NIS2 Art. 21(2)(d) obligă evaluarea securității lanțului de aprovizionare.",
    action: "Evaluează toți furnizorii tech, solicită DPA și clauze de securitate în contracte (SLA, drept de audit).",
    generatedAsset: "Registru furnizori cu risk score — disponibil în NIS2 → Furnizori",
    humanStep: "Contactează furnizorii high-risk și solicită dovezi de securitate (certificate, rapoarte de audit, politici).",
    closureEvidence: "DPA semnat + SLA cu clauze de securitate + dovadă revizuire furnizor",
    revalidation: "Revizuire anuală a furnizorilor sau la schimbarea contractului",
  },
  "access-control": {
    problem: "Controlul accesului la sistemele critice nu respectă principiul privilegiului minim.",
    impact: "Accesul necontrolat mărește suprafața de atac și riscul de insider threat. NIS2 Art. 21(2)(i) obligă autentificare și control acces robust.",
    action: "Implementează MFA, revizuiește drepturile de acces și aplică principiul need-to-know.",
    humanStep: "Revizuiește și documentează drepturile de acces pentru toți utilizatorii și serviciile.",
    closureEvidence: "Politică de control acces + dovadă MFA activat + raport revizuire drepturi",
    revalidation: "Audit acces semestrial + revizuire la schimbarea personalului",
  },
  cryptography: {
    problem: "Datele sensibile nu sunt protejate prin criptare corespunzătoare.",
    impact: "Date compromise în tranzit sau la stocare pot expune informații sensibile. NIS2 Art. 21(2)(h) obligă aplicarea criptografiei acolo unde e relevant.",
    action: "Activează criptarea pentru date în tranzit (TLS 1.2+) și la stocare pentru date sensibile.",
    humanStep: "Inventariază datele sensibile și documentează unde se aplică criptarea.",
    closureEvidence: "Politică de criptare + dovadă implementare (configurare TLS, documentație tehnică)",
    revalidation: "Revizuire anuală a algoritmilor și cheilor criptografice",
  },
  continuity: {
    problem: "Organizația nu are un plan de continuitate a activității și recuperare după dezastre.",
    impact: "Un incident major (ransomware, avarie hardware) poate duce la pierderi de date ireversibile și întrerupere prelungită. NIS2 Art. 21(2)(c) obligă backup și disaster recovery.",
    action: "Implementează politică de backup (3-2-1), testează recuperarea și documentează RTO/RPO.",
    generatedAsset: "Plan IR NIS2 cu secțiune Business Continuity — generabil din Generator",
    humanStep: "Testează efectiv restaurarea din backup și documentează rezultatele.",
    closureEvidence: "Politică backup + dovadă test recuperare (raport restore) + configurare BCP",
    revalidation: "Test recuperare semestrial + actualizare plan după schimbări de infrastructură",
  },
  training: {
    problem: "Personalul nu a primit training de conștientizare a securității cibernetice.",
    impact: "Phishing-ul și ingineria socială rămân principalele vectori de atac. Personalul neinstrumented este principala vulnerabilitate. OUG 155/2024 Art. 14 obligă formarea continuă.",
    action: "Organizează training de securitate cibernetică pentru tot personalul și pentru conducere.",
    generatedAsset: "Raport de training — înregistrează participanții în Board Training Tracker (NIS2 → Guvernanță)",
    humanStep: "Programează sesiunile de training și colectează confirmări de participare.",
    closureEvidence: "Liste de prezență la training + certificări de conștientizare + dovadă board training",
    revalidation: "Training anual obligatoriu + refresh după incidente sau schimbări reglementare",
  },
  vulnerability: {
    problem: "Nu există un proces de identificare și remediere a vulnerabilităților de securitate.",
    impact: "Vulnerabilitățile neadresate devin puncte de intrare pentru atacatori. NIS2 Art. 21(2)(e) obligă monitorizarea și remedierea vulnerabilităților.",
    action: "Implementează un program de vulnerability management: scanare periodică, patching, monitorizare CVE.",
    humanStep: "Efectuează primul scan de vulnerabilități și documentează un plan de remediere prioritizat.",
    closureEvidence: "Raport scan + plan remediere + dovadă patching (change log, patch notes)",
    revalidation: "Scanare lunară + raport trimestrial de stare vulnerabilități",
  },
}

// ── Vendor risk resolution ────────────────────────────────────────────────────

export function buildVendorRiskResolution(vendorName: string, missingDPA: boolean, missingSLA: boolean): FindingResolution {
  const missing: string[] = []
  if (missingDPA) missing.push("DPA (acord de procesare date)")
  if (missingSLA) missing.push("SLA cu clauze de securitate")

  return {
    problem: `Furnizorul "${vendorName}" are scor de risc ridicat conform evaluării NIS2 Art. 21(2)(d). Lipsesc: ${missing.join(", ") || "dovezi de revizuire recentă"}.`,
    impact: "Un furnizor high-risk nerevizuit poate deveni vector de atac sau sursă de breach de date. DNSC verifică la inspecții dacă ai evaluat securitatea furnizorilor.",
    action: `Revizuiește contractul cu ${vendorName}: solicită ${missing.join(", ")} și drept de audit.`,
    humanStep: `Contactează ${vendorName}, solicită documentele de securitate și actualizează registrul furnizorilor.`,
    closureEvidence: "DPA semnat + SLA cu clauze de securitate + data revizuirii marcată în registru",
    revalidation: "Revizuire anuală a furnizorului sau la schimbarea serviciilor/contractului",
  }
}

// ── NIS2 gap resolution getter ────────────────────────────────────────────────

export function getNis2GapResolution(category: Nis2Category): FindingResolution {
  return NIS2_RESOLUTIONS[category]
}

// ── Generic resolution builder ────────────────────────────────────────────────

export function makeResolution(
  problem: string,
  impact: string,
  action: string,
  opts?: Partial<Omit<FindingResolution, "problem" | "impact" | "action">>
): FindingResolution {
  return { problem, impact, action, ...opts }
}
