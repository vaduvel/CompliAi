/**
 * GOLD 3 — Counsel-ready brief exporter.
 * GET /api/vendor-review/[id]/brief
 * Returns a structured markdown brief for a vendor review,
 * ready to forward to legal counsel or attach as evidence.
 */
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireFreshRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { getReview } from "@/lib/server/vendor-review-store"
import {
  REVIEW_STATUS_LABELS,
  URGENCY_LABELS,
  REVIEW_CASE_LABELS,
  EVIDENCE_TYPE_LABELS,
} from "@/lib/compliance/vendor-review-engine"
import {
  fingerprintMatch,
  VENDOR_CATEGORY_LABELS,
} from "@/lib/compliance/vendor-library"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireFreshRole(request, ["owner", "compliance", "partner_manager"], "vendor brief export")
    const { orgId, orgName } = await getOrgContext()
    const { id: reviewId } = await params

    const review = await getReview(orgId, reviewId)
    if (!review) {
      return jsonError("Review nu a fost găsit.", 404, "NOT_FOUND")
    }

    const libraryMatch = fingerprintMatch(review.vendorName)
    const vendor = libraryMatch?.vendor ?? null
    const now = new Date().toISOString().slice(0, 10)

    const lines: string[] = [
      `# Brief Vendor Review — ${review.vendorName}`,
      `**Organizație:** ${orgName || orgId}`,
      `**Data generării:** ${now}`,
      `**Review ID:** ${review.id}`,
      "",
      "---",
      "",
      "## 1. Informații generale",
      "",
      `| Câmp | Valoare |`,
      `|---|---|`,
      `| Vendor | ${review.vendorName} |`,
      `| Status review | ${REVIEW_STATUS_LABELS[review.status]} |`,
      `| Urgență | ${URGENCY_LABELS[review.urgency]} |`,
      `| Categorie | ${review.category} |`,
      `| Sursă detectare | ${review.detectionSource} |`,
      review.reviewCase ? `| Caz review | ${REVIEW_CASE_LABELS[review.reviewCase]} |` : null,
      `| Creat la | ${new Date(review.createdAtISO).toLocaleDateString("ro-RO")} |`,
      review.closedAtISO ? `| Închis la | ${new Date(review.closedAtISO).toLocaleDateString("ro-RO")} |` : null,
      review.nextReviewDueISO ? `| Următorul review | ${new Date(review.nextReviewDueISO).toLocaleDateString("ro-RO")} |` : null,
    ].filter(Boolean) as string[]

    // Library match section
    if (vendor) {
      lines.push(
        ...[
          "",
          "## 2. Identificare din Vendor Library",
          "",
          `| Câmp | Valoare |`,
          `|---|---|`,
          `| Nume canonical | ${vendor.canonicalName} |`,
          `| Categorie | ${VENDOR_CATEGORY_LABELS[vendor.category]} |`,
          `| HQ | ${vendor.hqCountry} ${vendor.hasEuEntity ? "(entitate UE)" : "(fără entitate UE)"} |`,
          `| Mecanism transfer | ${vendor.transferClue} |`,
          `| Processor GDPR | ${vendor.typicallyProcessor ? "Da (tipic)" : "Nu (controller independent)"} |`,
          vendor.certifications.length > 0
            ? `| Certificări | ${vendor.certifications.join(", ")} |`
            : null,
          vendor.dataTypes.length > 0
            ? `| Date procesate tipic | ${vendor.dataTypes.join(", ")} |`
            : null,
          vendor.dpaUrl
            ? `| DPA public | [Link](${vendor.dpaUrl}) |`
            : `| DPA public | Nu este disponibil public |`,
          vendor.complianceNote ? `| Notă | ${vendor.complianceNote} |` : null,
        ].filter(Boolean) as string[]
      )
    } else {
      lines.push(
        "",
        "## 2. Identificare din Vendor Library",
        "",
        "_Vendor nerecunoscut din library. Verificare manuală necesară._",
      )
    }

    // Context answers
    if (review.context) {
      lines.push(
        "",
        "## 3. Context furnizat",
        "",
      )
      const contextLabels: Record<string, string> = {
        sendsPersonalData: "Trimite date personale",
        sendsConfidentialData: "Trimite date confidențiale",
        vendorProcessesData: "Vendor procesează date",
        hasDpaOrTerms: "Are DPA/termeni",
        hasTransferMechanism: "Are mecanism de transfer",
        isActivelyUsed: "Este utilizat activ",
      }
      for (const [key, value] of Object.entries(review.context)) {
        const label = contextLabels[key] ?? key
        lines.push(`- **${label}:** ${value}`)
      }
    }

    // Generated assets
    if (review.generatedAssets?.length) {
      lines.push(
        "",
        "## 4. Assets generate",
        "",
      )
      for (const asset of review.generatedAssets) {
        lines.push(`### ${asset.title}`, "", asset.content, "")
      }
    }

    // Evidence
    if (review.evidenceItems?.length) {
      lines.push(
        "",
        "## 5. Dovezi atașate",
        "",
      )
      for (const item of review.evidenceItems) {
        lines.push(
          `- **${EVIDENCE_TYPE_LABELS[item.type]}** — ${item.description} _(adăugat de ${item.addedBy} la ${new Date(item.addedAtISO).toLocaleDateString("ro-RO")})_`
        )
      }
    }

    // Risk assessment summary
    lines.push(
      "",
      "## 6. Evaluare risc (sumar)",
      "",
    )

    const risks: string[] = []
    if (vendor && !vendor.hasEuEntity) {
      risks.push("Vendor fără entitate UE — verifică baza legală pentru transfer (SCC, DPF, adequacy)")
    }
    if (vendor && vendor.transferClue === "unknown") {
      risks.push("Mecanism de transfer necunoscut — necesită clarificare")
    }
    if (vendor && vendor.typicallyProcessor && !vendor.dpaUrl) {
      risks.push("DPA public indisponibil — solicită DPA direct de la furnizor")
    }
    if (review.urgency === "critical" || review.urgency === "high") {
      risks.push(`Urgență ${URGENCY_LABELS[review.urgency]} — se recomandă validare specialist`)
    }
    if (review.context?.sendsPersonalData === "yes" && review.context?.hasDpaOrTerms !== "yes") {
      risks.push("Trimite date personale dar nu are DPA/termeni activi")
    }

    if (risks.length === 0) {
      lines.push("_Nu au fost identificate riscuri suplimentare._")
    } else {
      for (const risk of risks) {
        lines.push(`- ⚠ ${risk}`)
      }
    }

    // Disclaimer
    lines.push(
      "",
      "---",
      "",
      "_Document generat automat de CompliScan pe baza datelor introduse._",
      "_Nu constituie consultanță juridică. Conformitatea reală depinde de corectitudinea datelor și implementarea efectivă a măsurilor._",
    )

    const markdown = lines.filter((l): l is string => l !== null).join("\n")

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="vendor-brief-${review.vendorName.replace(/[^a-zA-Z0-9]/g, "-")}-${now}.md"`,
      },
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const authError = error as { message: string; status: number; code: string }
      return jsonError(authError.message, authError.status, authError.code)
    }
    return jsonError("Eroare la generarea brief-ului.", 500, "BRIEF_FAILED")
  }
}
