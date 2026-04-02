// POST /api/site-scan — Fix #7: async job pattern
// POST returnează jobId imediat; scanul rulează cu timeout 55s.
// GET /api/site-scan/[jobId] citește statusul din state.

import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { scanSite } from "@/lib/compliance/site-scanner"
import { knowledgeFromSiteScan, mergeKnowledgeItems } from "@/lib/compliance/org-knowledge"
import type { SiteScanJob } from "@/lib/compliance/types"

export const maxDuration = 60 // Vercel Pro: până la 60s pentru Puppeteer

const SCAN_TIMEOUT_MS = 55_000

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const body = await request.json() as { url?: string; saveToProfile?: boolean }
    if (!body.url?.trim()) return jsonError("URL lipsă.", 400, "MISSING_URL")

    const jobId = randomBytes(8).toString("hex")
    const createdAtISO = new Date().toISOString()

    // Store queued job immediately
    await mutateStateForOrg(session.orgId, (s) => ({
      ...s,
      siteScanJobs: {
        ...(s.siteScanJobs ?? {}),
        [jobId]: { jobId, url: body.url!, status: "processing", createdAtISO } satisfies SiteScanJob,
      },
    }), session.orgName)

    // Run scan with 55s timeout
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), SCAN_TIMEOUT_MS))

    const scanResult = await Promise.race([scanSite(body.url!), timeoutPromise])

    if (!scanResult) {
      // Timeout
      await mutateStateForOrg(session.orgId, (s) => ({
        ...s,
        siteScanJobs: {
          ...(s.siteScanJobs ?? {}),
          [jobId]: {
            ...(s.siteScanJobs?.[jobId] ?? { jobId, url: body.url!, createdAtISO }),
            status: "timeout",
            completedAtISO: new Date().toISOString(),
          } satisfies SiteScanJob,
        },
      }), session.orgName)
      return NextResponse.json({ jobId, status: "timeout", message: "Scanarea a depășit limita de timp. Reîncercați cu un site mai mic." })
    }

    const completedAtISO = new Date().toISOString()

    // Save profile + orgKnowledge if requested
    if (body.saveToProfile && scanResult.reachable) {
      await mutateStateForOrg(session.orgId, (state) => {
        state.siteScan = {
          scannedAtISO: scanResult.scannedAtISO,
          websiteUrl: scanResult.url,
          trackerCount: scanResult.trackers.length,
          vendorCandidateCount: scanResult.vendorCandidates.length,
          formCount: scanResult.forms.length,
          hasCookieBanner: scanResult.hasCookieBanner,
          hasPrivacyPolicy: scanResult.hasPrivacyPolicy,
          findingCount: scanResult.findingSuggestions.length,
        }
        if (state.orgProfile && !state.orgProfile.website) {
          state.orgProfile.website = scanResult.url
        }
        const newItems = knowledgeFromSiteScan(scanResult)
        if (newItems.length > 0) {
          const existing = state.orgKnowledge?.items ?? []
          state.orgKnowledge = {
            items: mergeKnowledgeItems(existing, newItems),
            lastUpdatedAtISO: new Date().toISOString(),
          }
        }
        return state
      }, session.orgName)
    }

    // Store completed job with result
    await mutateStateForOrg(session.orgId, (s) => ({
      ...s,
      siteScanJobs: {
        ...(s.siteScanJobs ?? {}),
        [jobId]: {
          jobId,
          url: body.url!,
          status: "done",
          createdAtISO,
          completedAtISO,
          result: scanResult,
        } satisfies SiteScanJob,
      },
    }), session.orgName)

    return NextResponse.json({ jobId, status: "done", result: scanResult })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la scanarea site-ului.", 500, "SITE_SCAN_FAILED")
  }
}
