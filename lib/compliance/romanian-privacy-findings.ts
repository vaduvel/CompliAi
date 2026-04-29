import type { OrgProfile } from "@/lib/compliance/applicability"
import type { ScanFinding } from "@/lib/compliance/types"

function isSensitiveRomanianPrivacyProfile(profile: OrgProfile) {
  return (
    profile.sector === "health" ||
    profile.sector === "banking" ||
    profile.sector === "professional-services"
  )
}

function hasEmployees(profile: OrgProfile) {
  return profile.employeeCount !== "1-9"
}

function finding(
  id: string,
  title: string,
  detail: string,
  severity: ScanFinding["severity"],
  nowISO: string,
  extra: Partial<ScanFinding>
): ScanFinding {
  return {
    id,
    title,
    detail,
    category: "GDPR",
    severity,
    risk: severity === "critical" || severity === "high" ? "high" : "low",
    principles: [],
    createdAtISO: nowISO,
    sourceDocument: "baseline-import-romania",
    ...extra,
  }
}

export function buildRomanianPrivacyFindings(profile: OrgProfile, nowISO: string): ScanFinding[] {
  const findings: ScanFinding[] = []

  if (isSensitiveRomanianPrivacyProfile(profile) || hasEmployees(profile)) {
    findings.push(
      finding(
        "intake-lege190-cnp-sensitive-data",
        "Legea 190/2018 — CNP/date sensibile fără anexă operațională",
        "Profilul organizației indică prelucrare probabilă de CNP, date de sănătate, date financiare sau date HR. Pentru România, dosarul GDPR trebuie să explice temeiul, minimizarea, accesul, retenția și evidența acestor date.",
        isSensitiveRomanianPrivacyProfile(profile) ? "high" : "medium",
        nowISO,
        {
          legalReference: "Legea 190/2018 + GDPR Art. 5, Art. 9, Art. 30",
          remediationHint:
            "Actualizează RoPA cu activitățile care includ CNP/date sensibile și atașează anexa internă de acces, retenție și justificare.",
          suggestedDocumentType: "ropa",
          evidenceRequired:
            "RoPA actualizat + anexă CNP/date sensibile + regulă de acces/retenție confirmată de consultantul DPO.",
          resolution: {
            problem: "Dosarul nu explică distinct prelucrarea CNP/date sensibile conform specificului românesc.",
            impact: "Risc ridicat la control ANSPDCP, mai ales pentru clinici, contabilitate/HR sau servicii financiare.",
            action: "Completează anexa Legea 190/2018 în RoPA și leag-o de dovezile de acces, retenție și minimizare.",
            humanStep: "DPO-ul confirmă categoriile reale de date și temeiurile folosite de client.",
            closureEvidence: "Anexă CNP/date sensibile salvată în Dosar și RoPA actualizat.",
          },
        }
      )
    )
  }

  if (hasEmployees(profile)) {
    findings.push(
      finding(
        "intake-gdpr-training-tracker",
        "Training GDPR angajați fără evidență",
        "Organizația are angajați, dar nu există încă o evidență a trainingului GDPR/privacy comunicat personalului.",
        "medium",
        nowISO,
        {
          legalReference: "GDPR Art. 5(2), Art. 24, Art. 39(1)(b)",
          remediationHint:
            "Adaugă trainingul GDPR în tracker, marchează participanții și salvează dovada comunicării în Dosar.",
          evidenceRequired:
            "Registru training GDPR cu participanți, dată, audiență și dovadă de comunicare.",
          resolution: {
            problem: "Nu există urmă clară că angajații au fost instruiți pe regulile privacy relevante.",
            impact: "DPO-ul nu poate demonstra accountability sau prevenirea incidentelor de confidențialitate.",
            action: "Planifică sau marchează trainingul GDPR în trackerul dedicat.",
            humanStep: "Atașează lista participanților, emailul de comunicare sau certificatul intern.",
            closureEvidence: "Training GDPR completat și dovada salvată în Dosar.",
          },
        }
      )
    )
  }

  return findings
}
