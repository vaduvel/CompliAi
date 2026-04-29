import { promises as fs } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  listCabinetTemplates,
  saveCabinetTemplate,
  updateCabinetTemplate,
} from "@/lib/server/cabinet-templates-store"

async function cleanup(orgId: string) {
  const filePath = path.join(process.cwd(), ".data", `cabinet-templates-${orgId}.json`)
  await fs.rm(filePath, { force: true })
}

describe("cabinet-templates-store", () => {
  it("salveaza metadata de maturitate pentru template-uri cabinet", async () => {
    const orgId = `test-template-org-a-${Date.now()}`
    await cleanup(orgId)
    const result = await saveCabinetTemplate(orgId, {
      documentType: "dpa",
      name: "DPA procesatori",
      description: "Template validat de cabinet pentru procesatori SaaS.",
      versionLabel: "v2026.1",
      sourceFileName: "Drive:/Templates/DPA-procesatori-v2026.docx",
      active: true,
      content: "# DPA {{ORG_NAME}}\n\nClauză cabinet custom pentru {{COUNTERPARTY_NAME}}.".repeat(4),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.template.status).toBe("active")
    expect(result.template.versionLabel).toBe("v2026.1")
    expect(result.template.revision).toBe(1)
    expect(result.template.detectedVariables).toEqual(["COUNTERPARTY_NAME", "ORG_NAME"])
    await cleanup(orgId)
  })

  it("actualizeaza continutul cu revision increment si poate arhiva template-ul", async () => {
    const orgId = `test-template-org-b-${Date.now()}`
    await cleanup(orgId)
    const created = await saveCabinetTemplate(orgId, {
      documentType: "privacy-policy",
      name: "Privacy Policy",
      active: true,
      content: "# Privacy {{ORG_NAME}}\n\nText valid suficient pentru test.".repeat(5),
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const updated = await updateCabinetTemplate(orgId, created.template.id, {
      status: "archived",
      versionLabel: "v2",
      content: "# Privacy arhivat {{ORG_NAME}}\n\nText actualizat suficient pentru test.".repeat(5),
    })

    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.template.active).toBe(false)
    expect(updated.template.status).toBe("archived")
    expect(updated.template.versionLabel).toBe("v2")
    expect(updated.template.revision).toBe(2)

    const all = await listCabinetTemplates(orgId)
    expect(all[0]?.status).toBe("archived")
    await cleanup(orgId)
  })

  it("detecteaza variabile cabinet cu litere mici si diacritice", async () => {
    const orgId = `test-template-org-c-${Date.now()}`
    await cleanup(orgId)
    const result = await saveCabinetTemplate(orgId, {
      documentType: "dsar-response",
      name: "Răspuns DSAR cabinet",
      active: true,
      content:
        "# Răspuns DSAR — {{orgName}}\n\n" +
        "Solicitant: {{nume_solicitant}}\n\n" +
        "DPO: {{responsabil_DPO}}\n\n" +
        "Acest template este importat din arhiva cabinetului.",
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.template.detectedVariables).toEqual([
      "nume_solicitant",
      "orgName",
      "responsabil_DPO",
    ])
    await cleanup(orgId)
  })
})
