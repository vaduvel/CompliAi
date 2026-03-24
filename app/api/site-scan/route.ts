// POST /api/site-scan — Multiplicator A: Site Intelligence Layer
// Puppeteer + chromium-min: JS executat, trackere async, consent banners reale.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { mutateState } from "@/lib/server/mvp-store"
import { scanSite } from "@/lib/compliance/site-scanner"
import { knowledgeFromSiteScan, mergeKnowledgeItems } from "@/lib/compliance/org-knowledge"

export const maxDuration = 60 // Vercel Pro: până la 60s pentru Puppeteer

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = await request.json() as { url?: string; saveToProfile?: boolean }
    if (!body.url?.trim()) return jsonError("URL lipsă.", 400, "MISSING_URL")

    const result = await scanSite(body.url)

    // Dacă saveToProfile=true și scanul a reușit, salvăm summary în ComplianceState
    if (body.saveToProfile && result.reachable) {
      await mutateState((state) => {
        state.siteScan = {
          scannedAtISO: result.scannedAtISO,
          websiteUrl: result.url,
          trackerCount: result.trackers.length,
          vendorCandidateCount: result.vendorCandidates.length,
          formCount: result.forms.length,
          hasCookieBanner: result.hasCookieBanner,
          hasPrivacyPolicy: result.hasPrivacyPolicy,
          findingCount: result.findingSuggestions.length,
        }
        // Salvăm și URL-ul în orgProfile dacă nu e setat
        if (state.orgProfile && !state.orgProfile.website) {
          state.orgProfile.website = result.url
        }
        // Multiplicator B: populăm orgKnowledge din rezultatele scan-ului
        const newItems = knowledgeFromSiteScan(result)
        if (newItems.length > 0) {
          const existing = state.orgKnowledge?.items ?? []
          state.orgKnowledge = {
            items: mergeKnowledgeItems(existing, newItems),
            lastUpdatedAtISO: new Date().toISOString(),
          }
        }
        return state
      })
    }

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la scanarea site-ului.", 500, "SITE_SCAN_FAILED")
  }
}
