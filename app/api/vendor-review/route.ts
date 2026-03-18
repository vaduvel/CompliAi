// V5 — Vendor Review Workbench API
// GET  /api/vendor-review         → list reviews
// POST /api/vendor-review         → create review from vendor

import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { safeListReviews, createReview } from "@/lib/server/vendor-review-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { appendAudit, type VendorReview, type VendorReviewUrgency } from "@/lib/compliance/vendor-review-engine"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const reviews = await safeListReviews(orgId)
    return NextResponse.json({ reviews })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca review-urile.", 500, "VENDOR_REVIEW_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as {
      vendorId?: string
      detectionSource?: VendorReview["detectionSource"]
    }

    if (!body.vendorId?.trim()) {
      return jsonError("vendorId este obligatoriu.", 400, "MISSING_VENDOR_ID")
    }

    const { orgId } = await getOrgContext()

    // Find vendor in NIS2 registry
    const nis2 = await readNis2State(orgId)
    const vendor = nis2.vendors.find((v) => v.id === body.vendorId)
    if (!vendor) {
      return jsonError("Vendorul nu a fost găsit.", 404, "VENDOR_NOT_FOUND")
    }

    // Determine category from tech detection
    let category: VendorReview["category"] = "unknown"
    if (vendor.techConfidence) {
      const nameLower = vendor.name.toLowerCase()
      if (["openai", "anthropic", "cohere", "hugging", "mistral", "gpt", "claude"].some((k) => nameLower.includes(k))) {
        category = "ai"
      } else if (["aws", "azure", "google cloud", "gcp", "digitalocean", "vercel", "cloudflare"].some((k) => nameLower.includes(k))) {
        category = "cloud"
      } else {
        category = "tech"
      }
    }

    // Initial urgency based on risk level + confidence
    let urgency: VendorReviewUrgency = "medium"
    if (vendor.riskLevel === "critical") urgency = "critical"
    else if (vendor.riskLevel === "high" || vendor.techConfidence === "high") urgency = "high"
    else if (vendor.techConfidence === "low") urgency = "info"

    const now = new Date().toISOString()
    const review: VendorReview = {
      id: `vr-${randomBytes(8).toString("hex")}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: "needs-context",
      urgency,
      category,
      confidence: vendor.techConfidence ?? "low",
      detectionSource: body.detectionSource ?? "vendor-registry",
      reviewCount: 0,
      auditTrail: appendAudit(undefined, "created", session.email),
      createdAtISO: now,
      updatedAtISO: now,
    }

    const created = await createReview(orgId, review)
    return NextResponse.json({ review: created }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea review-ul.", 500, "VENDOR_REVIEW_CREATE_FAILED")
  }
}
