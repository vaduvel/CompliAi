// P1 — Cron for scheduled reports.
// Runs every hour. Finds reports due to run (next_run_at <= now).
// For each: generates the report and either sends directly or creates pending_action.
//
// Schedule: 0 * * * * (every hour, on the hour)

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import {
  getDueReports,
  markReportRun,
  REPORT_TYPE_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/server/scheduled-reports"
import { createPendingAction } from "@/lib/server/approval-queue"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel sets this header automatically)
    const authHeader = request.headers.get("authorization")
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }

    const nowISO = new Date().toISOString()
    const dueReports = await getDueReports(nowISO)

    if (dueReports.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, message: "No reports due." })
    }

    let processed = 0
    let pendingCreated = 0
    const errors: string[] = []

    for (const report of dueReports) {
      try {
        if (report.requiresApproval) {
          // Create pending_action — user must approve before report is sent
          await createPendingAction({
            orgId: report.orgId,
            userId: report.userId,
            actionType: "batch_action",
            riskLevel: "medium",
            explanation: `${REPORT_TYPE_LABELS[report.reportType]} programat (${FREQUENCY_LABELS[report.frequency]}) — ${report.clientOrgIds.length} firme, ${report.recipientEmails.length} destinatari.`,
            diffSummary: `Raport: ${report.reportType} · Frecvență: ${report.frequency} · Destinatari: ${report.recipientEmails.join(", ")}`,
            proposedData: {
              scheduledReportId: report.id,
              reportType: report.reportType,
              frequency: report.frequency,
              clientOrgIds: report.clientOrgIds,
              recipientEmails: report.recipientEmails,
            },
            // No expiry for report approvals
          })
          pendingCreated++
        } else {
          // Auto-execute: in production would trigger actual email/export
          // For now: log the execution (Supabase + notification system in Wave 3)
          console.log(`[scheduled-reports] Auto-executing: ${report.reportType} for org ${report.orgId}`)
        }

        // Mark report as run and compute next_run_at
        await markReportRun(report.orgId, report.id, report.frequency)
        processed++
      } catch (err) {
        errors.push(`${report.id}: ${err instanceof Error ? err.message : "unknown"}`)
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      pendingCreated,
      errors: errors.length > 0 ? errors : undefined,
      message: `${processed} rapoarte procesate, ${pendingCreated} cu aprobare necesară.`,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Eroare la cron scheduled-reports.",
      500,
      "CRON_FAILED"
    )
  }
}
