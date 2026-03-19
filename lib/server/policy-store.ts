import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

export type PolicyAcknowledgment = {
  userEmail: string
  acknowledgedAtISO: string
}

export type OrgPolicyAcknowledgments = Record<string, PolicyAcknowledgment>

const policyStorage = createAdaptiveStorage<OrgPolicyAcknowledgments>("policies", "policy_acknowledgments")

export async function readPolicyAcknowledgments(orgId: string): Promise<OrgPolicyAcknowledgments> {
  return (await policyStorage.read(orgId)) ?? {}
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
  await policyStorage.write(orgId, updated)
  return updated
}
