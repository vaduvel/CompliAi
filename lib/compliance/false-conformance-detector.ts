// Detector notificări de conformare ANAF false (cazuri specifice raportate
// de contabili pe forumul SAGA și grupuri Facebook).
//
// Pain point: ANAF trimite notificări de conformare pentru:
//   1. Cheltuieli "nejustificate" — dar contabilul are toate documentele
//   2. Facturi presupus nedeclarate de furnizor în D394 — dar furnizorul
//      pur și simplu n-a depus la termen, nu lipsesc cu adevărat
//   3. Diferențe e-TVA cu facturi DUPLICATE în P300 (același doc apare de
//      mai multe ori)
//   4. Cheltuieli de energie "riscante" — dar facturile sunt în SPV
//
// Pure functions — input: notificare ANAF + facturile reale ale orgului,
// output: probability că notificarea e falsă + recomandare răspuns.

export type AnafNotification = {
  id: string
  type:
    | "conformance_supplier_undeclared"   // furnizor n-a declarat
    | "conformance_unjustified_expenses"   // cheltuieli nejustificate
    | "conformance_energy_risky"            // facturi energie riscante
    | "etva_diff_with_duplicates"           // P300 cu duplicate
    | "saft_validation_error"               // eroare validare SAF-T
    | "other"
  receivedAtISO: string
  period: string
  details: {
    invoiceNumbers?: string[]               // facturi menționate
    supplierCifs?: string[]                 // CIF-uri furnizori
    expenseCategories?: string[]            // categorii cheltuieli
    duplicateCount?: number                 // câte duplicate raportate
    rawText?: string                        // textul notificării
  }
}

export type OrgFiscalEvidence = {
  // Facturile reale ale orgului din SPV (descărcate)
  receivedInvoices: Array<{
    invoiceNumber: string
    supplierCif: string
    issueDate: string
    spvIndex?: string
    receivedAtISO: string
  }>
  // Documente justificative pe care contabilul le are pentru fiecare cheltuială
  expenseDocuments: Array<{
    invoiceNumber: string
    category: string
    hasInvoice: boolean
    hasContract: boolean
    hasPaymentProof: boolean
  }>
  // Lista P300 — pentru detectare duplicate
  p300Items?: Array<{
    invoiceNumber: string
    appearsCount: number  // de câte ori apare în P300
  }>
}

export type FalseConformanceAssessment = {
  notificationId: string
  isFalsePositive: boolean
  confidence: "high" | "medium" | "low"
  reason: string
  evidenceFound: string[]
  recommendedResponse:
    | "etva_duplicate_invoice"
    | "conformare_factura_furnizor_lipsa"
    | "conformare_cheltuieli_nejustificate"
    | "investigate_manual"
}

// ── Detector logic ───────────────────────────────────────────────────────────

export function detectFalseConformance(
  notification: AnafNotification,
  evidence: OrgFiscalEvidence,
): FalseConformanceAssessment {
  const evidenceFound: string[] = []

  switch (notification.type) {
    case "conformance_supplier_undeclared": {
      // ANAF zice că furnizorul nu a declarat — verificăm dacă noi avem
      // factura cu spvIndex (înseamnă că a venit prin e-Factura).
      const numbers = notification.details.invoiceNumbers ?? []
      const cifs = notification.details.supplierCifs ?? []
      const matched = evidence.receivedInvoices.filter(
        (inv) =>
          numbers.some((n) => inv.invoiceNumber.includes(n) || n.includes(inv.invoiceNumber)) &&
          (cifs.length === 0 || cifs.some((c) => inv.supplierCif.replace(/^RO/i, "") === c.replace(/^RO/i, ""))),
      )
      if (matched.length === numbers.length && matched.length > 0) {
        const withSpv = matched.filter((m) => m.spvIndex)
        evidenceFound.push(
          `${matched.length} facturi confirmate primite în SPV (${withSpv.length} cu spvIndex confirmat).`,
        )
        return {
          notificationId: notification.id,
          isFalsePositive: true,
          confidence: withSpv.length === matched.length ? "high" : "medium",
          reason:
            "Facturile menționate ca nedeclarate de furnizor există efectiv în SPV-ul nostru. Probabil furnizorul a întârziat depunerea D394, dar facturile sunt valide. CompliAI a confirmat receipția.",
          evidenceFound,
          recommendedResponse: "conformare_factura_furnizor_lipsa",
        }
      }
      if (matched.length > 0 && matched.length < numbers.length) {
        evidenceFound.push(
          `${matched.length}/${numbers.length} facturi confirmate. Restul de ${numbers.length - matched.length} chiar lipsesc.`,
        )
        return {
          notificationId: notification.id,
          isFalsePositive: false,
          confidence: "medium",
          reason:
            "Notificarea e parțial corectă — unele facturi lipsesc cu adevărat. Investigare manuală.",
          evidenceFound,
          recommendedResponse: "investigate_manual",
        }
      }
      break
    }

    case "etva_diff_with_duplicates": {
      // ANAF trimite e-TVA cu duplicate — verificăm P300
      const dupCount = notification.details.duplicateCount ?? 0
      if (dupCount > 0 && evidence.p300Items) {
        const realDuplicates = evidence.p300Items.filter((p) => p.appearsCount > 1)
        if (realDuplicates.length > 0) {
          evidenceFound.push(
            `Confirmat în P300: ${realDuplicates.length} facturi apar de mai multe ori (suma duplicate: ${realDuplicates.reduce((s, p) => s + p.appearsCount - 1, 0)}).`,
          )
          return {
            notificationId: notification.id,
            isFalsePositive: true,
            confidence: "high",
            reason:
              "P300 ANAF conține într-adevăr facturi duplicate. D300-ul nostru reflectă valorile corecte (fiecare factură o singură dată).",
            evidenceFound,
            recommendedResponse: "etva_duplicate_invoice",
          }
        }
      }
      break
    }

    case "conformance_unjustified_expenses":
    case "conformance_energy_risky": {
      // Verificăm dacă avem documente complete pentru cheltuieli
      const numbers = notification.details.invoiceNumbers ?? []
      const docsFound = evidence.expenseDocuments.filter((d) =>
        numbers.some((n) => d.invoiceNumber.includes(n) || n.includes(d.invoiceNumber)),
      )
      const fullyJustified = docsFound.filter(
        (d) => d.hasInvoice && d.hasContract && d.hasPaymentProof,
      )
      if (fullyJustified.length === numbers.length && numbers.length > 0) {
        evidenceFound.push(
          `${fullyJustified.length} cheltuieli au TOATE documentele justificative (factură + contract + dovadă plată).`,
        )
        return {
          notificationId: notification.id,
          isFalsePositive: true,
          confidence: "high",
          reason:
            "Cheltuielile menționate ca nejustificate au documente complete. Notificare ANAF eronată — răspuns cu attach toate documentele.",
          evidenceFound,
          recommendedResponse: "conformare_cheltuieli_nejustificate",
        }
      }
      if (fullyJustified.length > 0 && fullyJustified.length < numbers.length) {
        const missing = numbers.length - fullyJustified.length
        evidenceFound.push(
          `${fullyJustified.length} cheltuieli complet justificate, ${missing} lipsesc parțial documente.`,
        )
        return {
          notificationId: notification.id,
          isFalsePositive: false,
          confidence: "medium",
          reason: `${missing} cheltuieli au documente incomplete — verificare manuală.`,
          evidenceFound,
          recommendedResponse: "investigate_manual",
        }
      }
      break
    }
  }

  return {
    notificationId: notification.id,
    isFalsePositive: false,
    confidence: "low",
    reason: "Nu am putut determina automat dacă notificarea e falsă. Verificare manuală necesară.",
    evidenceFound,
    recommendedResponse: "investigate_manual",
  }
}

/**
 * Pre-screen multiple notificări — returnează listă cu doar cele false (high
 * confidence) ca să poată fi tratate cu auto-response.
 */
export function batchAssessNotifications(
  notifications: AnafNotification[],
  evidence: OrgFiscalEvidence,
): FalseConformanceAssessment[] {
  return notifications.map((n) => detectFalseConformance(n, evidence))
}
