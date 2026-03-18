// lib/server/vendor-review-store.ts
// V5 — Vendor Review Workbench persistent store.
// Uses createAdaptiveStorage (local .data/ or Supabase).

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import type { VendorReview } from "@/lib/compliance/vendor-review-engine"

// ── Storage ───────────────────────────────────────────────────────────────────

type VendorReviewState = {
  reviews: VendorReview[]
  updatedAtISO: string
}

const reviewStorage = createAdaptiveStorage<VendorReviewState>(
  "vendor-reviews",
  "vendor_reviews",
)

async function readState(orgId: string): Promise<VendorReviewState> {
  return (await reviewStorage.read(orgId)) ?? { reviews: [], updatedAtISO: new Date().toISOString() }
}

async function writeState(orgId: string, state: VendorReviewState): Promise<void> {
  state.updatedAtISO = new Date().toISOString()
  await reviewStorage.write(orgId, state)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function listReviews(orgId: string): Promise<VendorReview[]> {
  const state = await readState(orgId)
  return state.reviews
}

export async function safeListReviews(orgId: string): Promise<VendorReview[]> {
  try {
    return await listReviews(orgId)
  } catch {
    // Vendor review data is additive and should not block read-only surfaces.
    return []
  }
}

export async function getReview(orgId: string, reviewId: string): Promise<VendorReview | null> {
  const state = await readState(orgId)
  return state.reviews.find((r) => r.id === reviewId) ?? null
}

export async function createReview(orgId: string, review: VendorReview): Promise<VendorReview> {
  const state = await readState(orgId)
  // Prevent duplicate for same vendor
  const existing = state.reviews.find(
    (r) => r.vendorId === review.vendorId && r.status !== "closed",
  )
  if (existing) return existing
  state.reviews.push(review)
  await writeState(orgId, state)
  return review
}

export async function updateReview(
  orgId: string,
  reviewId: string,
  patch: Partial<VendorReview>,
): Promise<VendorReview | null> {
  const state = await readState(orgId)
  const idx = state.reviews.findIndex((r) => r.id === reviewId)
  if (idx === -1) return null
  state.reviews[idx] = {
    ...state.reviews[idx],
    ...patch,
    updatedAtISO: new Date().toISOString(),
  }
  await writeState(orgId, state)
  return state.reviews[idx]
}

export async function deleteReview(orgId: string, reviewId: string): Promise<boolean> {
  const state = await readState(orgId)
  const before = state.reviews.length
  state.reviews = state.reviews.filter((r) => r.id !== reviewId)
  if (state.reviews.length === before) return false
  await writeState(orgId, state)
  return true
}
