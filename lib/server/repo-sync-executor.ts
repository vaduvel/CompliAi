import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { mergeDetectedAISystems } from "@/lib/server/detected-ai-systems"
import { discoverAISystemsFromManifest } from "@/lib/server/manifest-autodiscovery"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import type { NormalizedRepoSyncPayload } from "@/lib/server/repo-sync"

type RepoSyncExecutionPayload = NormalizedRepoSyncPayload & {
  orgId: string
  orgName?: string
}

export async function executeRepoSync(body: RepoSyncExecutionPayload) {
  const files = body.files
  if (!files || files.length === 0) {
    throw new Error("REPO_SYNC_FILES_REQUIRED")
  }

  const nowISO = new Date().toISOString()
  const nextState = await mutateStateForOrg(body.orgId, (current) => {
    const syncedPaths = new Set(files.map((file) => file.path))
    const retainedFindings = current.findings.filter(
      (finding) => !finding.sourceDocument || !syncedPaths.has(finding.sourceDocument)
    )
    const retainedAlerts = current.alerts.filter(
      (alert) => !alert.sourceDocument || !syncedPaths.has(alert.sourceDocument)
    )
    const retainedDetectedSystems = current.detectedAISystems.filter(
      (system) =>
        system.confirmedSystemId ||
        !system.sourceDocument ||
        !syncedPaths.has(system.sourceDocument)
    )

    const generatedScans = []
    const generatedCandidates = []
    const generatedFindings = []
    const generatedAlerts = []
    const generatedEvents = []

    for (const file of files) {
      const scanId = `scan-${Math.random().toString(36).slice(2, 10)}`
      const discovery = discoverAISystemsFromManifest({
        documentName: file.path,
        content: file.content,
        sourceScanId: scanId,
        nowISO,
      })

      generatedScans.push({
        id: scanId,
        documentName: file.path,
        contentPreview: file.content.slice(0, 220),
        contentExtracted: file.content.slice(0, 4000),
        createdAtISO: nowISO,
        findingsCount: discovery.candidates.length + discovery.findings.length,
        sourceKind: discovery.sourceKind,
        extractionMethod: "manual" as const,
        extractionStatus: "completed" as const,
        analysisStatus: "completed" as const,
        reviewRequired: false,
        analyzedAtISO: nowISO,
      })

      generatedCandidates.push(...discovery.candidates)
      generatedFindings.push(...discovery.findings)
      generatedAlerts.push(...discovery.alerts)

      generatedEvents.push(
        createComplianceEvent({
          type: "integration.repo-sync.file_processed",
          entityType: "scan",
          entityId: scanId,
          message:
            discovery.sourceKind === "yaml"
              ? `compliscan.yaml sincronizat din repo: ${file.path}.`
              : `Manifest sincronizat din repo: ${file.path}.`,
          createdAtISO: nowISO,
          metadata: {
            sourceKind: discovery.sourceKind,
            candidates: discovery.candidates.length,
            findings: discovery.findings.length,
          },
        })
      )

      for (const candidate of discovery.candidates) {
        generatedEvents.push(
          createComplianceEvent({
            type: "system.detected",
            entityType: "system",
            entityId: candidate.id,
            message: `Sistem detectat prin repo sync: ${candidate.name}.`,
            createdAtISO: nowISO,
            metadata: {
              confidence: candidate.confidence,
              sourceDocument: candidate.sourceDocument || file.path,
            },
          })
        )
      }

      for (const finding of discovery.findings) {
        generatedEvents.push(
          createComplianceEvent({
            type: "finding.detected",
            entityType: "finding",
            entityId: finding.id,
            message: `Finding generat prin repo sync: ${finding.title}.`,
            createdAtISO: nowISO,
            metadata: {
              category: finding.category,
              ruleId: finding.provenance?.ruleId || "n/a",
              sourceDocument: finding.sourceDocument,
            },
          })
        )
      }
    }

    const repoLabel = body.repository?.trim() || "repo necunoscut"
    const providerLabel = body.provider?.trim() || "manual"

    return {
      ...current,
      scans: [...generatedScans, ...current.scans].slice(0, 120),
      findings: [...generatedFindings, ...retainedFindings].slice(0, 240),
      alerts: [...generatedAlerts, ...retainedAlerts].slice(0, 240),
      detectedAISystems: mergeDetectedAISystems(retainedDetectedSystems, generatedCandidates),
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "integration.repo-sync.completed",
          entityType: "integration",
          entityId: "repo-sync",
          message: `Repo sync finalizat pentru ${repoLabel} (${providerLabel}).`,
          createdAtISO: nowISO,
          metadata: {
            repository: repoLabel,
            provider: providerLabel,
            branch: body.branch?.trim() || "n/a",
            commitSha: body.commitSha?.trim() || "n/a",
            files: files.length,
          },
        }),
        ...generatedEvents,
      ]),
    }
  }, body.orgName)

  return {
    nextState,
    fileCount: files.length,
  }
}
