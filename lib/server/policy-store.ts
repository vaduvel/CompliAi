import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), ".data")

export type PolicyAcknowledgment = {
  userEmail: string
  acknowledgedAtISO: string
}

export type OrgPolicyAcknowledgments = Record<string, PolicyAcknowledgment>

function getPolicyFile(orgId: string): string {
  return path.join(DATA_DIR, `policies-${orgId}.json`)
}

export async function readPolicyAcknowledgments(orgId: string): Promise<OrgPolicyAcknowledgments> {
  try {
    const raw = await fs.readFile(getPolicyFile(orgId), "utf8")
    return JSON.parse(raw) as OrgPolicyAcknowledgments
  } catch {
    return {}
  }
}

export async function writePolicyAcknowledgment(
  orgId: string,
  policyId: string,
  userEmail: string
): Promise<OrgPolicyAcknowledgments> {
  const current = await readPolicyAcknowledgments(orgId)
  const updated: OrgPolicyAcknowledgments = {
    ...current,
    [policyId]: { userEmail, acknowledgedAtISO: new Date().toISOString() },
  }
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(getPolicyFile(orgId), JSON.stringify(updated, null, 2), "utf8")
  return updated
}
