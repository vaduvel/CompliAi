import { describe, expect, it } from "vitest"

import {
  buildSiteScanContextForDocument,
  getLatestSuccessfulSiteScanResult,
} from "@/lib/compliance/site-scan-context"
import type { SiteScanJob } from "@/lib/compliance/types"
import type { SiteScanResult } from "@/lib/compliance/site-scanner"

function makeScanResult(overrides: Partial<SiteScanResult> = {}): SiteScanResult {
  return {
    url: "https://demo.ro",
    scannedAtISO: "2026-03-26T12:00:00.000Z",
    reachable: true,
    trackers: [
      {
        id: "ga4",
        name: "Google Analytics 4",
        category: "analytics",
        requiresConsent: true,
        gdprRisk: "high",
        dpaVendorId: "google",
      },
    ],
    vendorCandidates: ["Google Analytics 4"],
    forms: [
      {
        type: "contact",
        hint: "Formular contact",
        collectsPersonalData: true,
      },
    ],
    hasCookieBanner: false,
    hasPrivacyPolicy: false,
    hasGoogleAnalytics: true,
    dataCategories: ["date contact (email, nume)", "date comportamentale (navigare, sesiune)"],
    findingSuggestions: [
      {
        type: "missing-consent",
        title: "Tracker fără consimțământ",
        detail: "Banner lipsă.",
        severity: "high",
      },
    ],
    ...overrides,
  }
}

describe("site-scan-context", () => {
  it("construiește context util pentru cookie policy din scan", () => {
    const context = buildSiteScanContextForDocument("cookie-policy", makeScanResult())

    expect(context).toContain("Nu există un banner cookie detectat")
    expect(context).toContain("Google Analytics 4")
    expect(context).toContain("Tracker fără consimțământ")
  })

  it("construiește context util pentru privacy policy din scan", () => {
    const context = buildSiteScanContextForDocument("privacy-policy", makeScanResult())

    expect(context).toContain("Nu există o pagină clară de politică de confidențialitate detectată")
    expect(context).toContain("Formular contact")
    expect(context).toContain("date contact (email, nume)")
  })

  it("alege ultimul job site scan reușit", () => {
    const olderResult = makeScanResult({ url: "https://older.ro", scannedAtISO: "2026-03-24T10:00:00.000Z" })
    const newerResult = makeScanResult({ url: "https://newer.ro", scannedAtISO: "2026-03-26T10:00:00.000Z" })
    const jobs: Record<string, SiteScanJob> = {
      older: {
        jobId: "older",
        url: olderResult.url,
        status: "done",
        createdAtISO: "2026-03-24T09:59:00.000Z",
        completedAtISO: "2026-03-24T10:00:00.000Z",
        result: olderResult,
      },
      newer: {
        jobId: "newer",
        url: newerResult.url,
        status: "done",
        createdAtISO: "2026-03-26T09:59:00.000Z",
        completedAtISO: "2026-03-26T10:00:00.000Z",
        result: newerResult,
      },
    }

    const latest = getLatestSuccessfulSiteScanResult(jobs)

    expect(latest?.url).toBe("https://newer.ro")
  })
})
