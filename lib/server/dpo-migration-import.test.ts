import { describe, expect, it } from "vitest"

import { readDsarState } from "@/lib/server/dsar-store"
import {
  applyDpoMigrationImport,
  parseDpoMigrationFile,
} from "@/lib/server/dpo-migration-import"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"

function csv(lines: string[]) {
  return Buffer.from(lines.join("\n"), "utf8")
}

function testActor() {
  return {
    userId: "diana-test",
    email: "diana@dpocomplet.ro",
    role: "partner_manager" as const,
  }
}

function orgId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

describe("DPO migration import", () => {
  it("parsează un registru DSAR cu header românesc", () => {
    const parsed = parseDpoMigrationFile(
      csv([
        "Solicitant,Email,Tip cerere,Data primire,Status,Dovada",
        "Maria Ionescu,maria@example.ro,Acces Art 15,01.04.2026,raspuns trimis,Drive:/DSAR/maria.pdf",
      ]),
      "registru-dsar.csv",
      "dsar-log"
    )

    expect(parsed.rowCount).toBe(1)
    expect(parsed.rows[0].errors).toEqual([])
  })

  it("importă DSAR istoric idempotent, fără duplicate la retry", async () => {
    const id = orgId("dpo-dsar")
    const input = csv([
      "Solicitant,Email,Tip cerere,Data primire,Status,Dovada",
      "Maria Ionescu,maria@example.ro,Acces Art 15,01.04.2026,in lucru,Drive:/DSAR/maria.pdf",
    ])

    const first = await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test DSAR SRL",
      actor: testActor(),
      kind: "dsar-log",
      fileName: "registru-dsar.csv",
      buffer: input,
    })
    const second = await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test DSAR SRL",
      actor: testActor(),
      kind: "dsar-log",
      fileName: "registru-dsar.csv",
      buffer: input,
    })
    const state = await readDsarState(id)

    expect(first.importedCount).toBe(1)
    expect(second.skippedCount).toBeGreaterThanOrEqual(1)
    expect(state.requests).toHaveLength(1)
    expect(state.requests[0].requestType).toBe("access")
  })

  it("importă RoPA istoric ca document draft pentru revizie DPO", async () => {
    const id = orgId("dpo-ropa")
    await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test RoPA SRL",
      actor: testActor(),
      kind: "ropa-register",
      fileName: "ropa-istoric.csv",
      buffer: csv([
        "Activitate,Scop,Temei,Categorii date,Persoane vizate,Destinatari,Retentie",
        "Programări pacienți,Gestionare consultații,Art. 6(1)(b),date contact; date sănătate,pacienți,medici,5 ani",
      ]),
    })

    const state = await readFreshStateForOrg(id, "Clinica Test RoPA SRL")
    const doc = state?.generatedDocuments.find((item) => item.documentType === "ropa")

    expect(doc?.title).toContain("RoPA istoric")
    expect(doc?.approvalStatus).toBe("draft")
    expect(doc?.content).toContain("Programări pacienți")
  })

  it("importă vendor/DPA register în workbench-ul de review furnizori", async () => {
    const id = orgId("dpo-vendor")
    await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test Vendor SRL",
      actor: testActor(),
      kind: "vendor-dpa-register",
      fileName: "vendori.csv",
      buffer: csv([
        "Furnizor,Serviciu,DPA,Date personale,Transfer,Review",
        "Stripe Payments Europe,Plăți online,da,da,SCC,30.09.2026",
        "MailTool,Newsletter,nu,da,,",
      ]),
    })

    const reviews = await safeListReviews(id)
    expect(reviews.map((review) => review.vendorName)).toContain("Stripe Payments Europe")
    expect(reviews.find((review) => review.vendorName === "MailTool")?.status).toBe("awaiting-evidence")
  })

  it("importă training GDPR istoric în tracker", async () => {
    const id = orgId("dpo-training")
    await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test Training SRL",
      actor: testActor(),
      kind: "training-tracker",
      fileName: "training.csv",
      buffer: csv([
        "Training,Audienta,Participanti,Data,Dovada",
        "Training GDPR recepție,angajați,12,12.03.2026,Drive:/Training/receptie.pdf",
      ]),
    })

    const state = await readFreshStateForOrg(id, "Clinica Test Training SRL")
    expect(state?.gdprTrainingRecords?.[0]?.status).toBe("completed")
    expect(state?.gdprTrainingRecords?.[0]?.participantCount).toBe(12)
  })

  it("importă breach log și creează finding ANSPDCP 72h când sunt date personale", async () => {
    const id = orgId("dpo-breach")
    await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test Breach SRL",
      actor: testActor(),
      kind: "breach-log",
      fileName: "breach.csv",
      buffer: csv([
        "Incident,Data,Severitate,Date personale,Categorii date,Masuri",
        "Email pacient trimis greșit,20.04.2026,high,da,date sănătate,contactat pacientul",
      ]),
    })

    const nis2 = await readNis2State(id)
    const state = await readFreshStateForOrg(id, "Clinica Test Breach SRL")

    expect(nis2.incidents).toHaveLength(1)
    expect(nis2.incidents[0].anspdcpNotification?.required).toBe(true)
    expect(state?.findings.some((finding) => finding.id.startsWith("anspdcp-breach-"))).toBe(true)
  })

  it("importă aprobări istorice fără să le marcheze fals ca magic-link native", async () => {
    const id = orgId("dpo-approval")
    await applyDpoMigrationImport({
      orgId: id,
      orgName: "Clinica Test Approval SRL",
      actor: testActor(),
      kind: "approval-history",
      fileName: "aprobari.csv",
      buffer: csv([
        "Document,Aprobat de,Data aprobare,Sursa",
        "DPA Stripe,Mihai Popescu,15.04.2026,email: thread DPA Stripe",
      ]),
    })

    const state = await readFreshStateForOrg(id, "Clinica Test Approval SRL")
    const doc = state?.generatedDocuments.find((item) => item.title.includes("DPA Stripe"))

    expect(doc?.approvalStatus).toBe("approved_as_evidence")
    expect(doc?.content).toContain("Nu este echivalentă cu o aprobare nativă prin magic link")
  })
})
