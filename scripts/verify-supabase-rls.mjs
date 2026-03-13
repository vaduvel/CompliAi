import path from "node:path"

import { loadEnvFile } from "./lib/supabase-live-check.mjs"

const ENV_PATH = path.join(process.cwd(), ".env.local")

async function main() {
  const env = await loadEnvFile(ENV_PATH)
  const config = getConfig(env)
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const ctx = {
    runId,
    orgA: `rls-org-a-${runId}`,
    orgB: `rls-org-b-${runId}`,
    userAEmail: `rls-a-${runId}@example.com`,
    userBEmail: `rls-b-${runId}@example.com`,
    password: `Rls-${runId}-Pass!1`,
    userAId: null,
    userBId: null,
  }

  const result = {
    ready: false,
    runId,
    checks: [],
    blockers: [],
  }

  try {
    const userA = await createAuthUser(config, ctx.userAEmail, ctx.password)
    const userB = await createAuthUser(config, ctx.userBEmail, ctx.password)
    ctx.userAId = userA.id
    ctx.userBId = userB.id

    await seedData(config, ctx)

    const sessionA = await signIn(config, ctx.userAEmail, ctx.password)
    const sessionB = await signIn(config, ctx.userBEmail, ctx.password)

    const orgsA = await authedSelect(config, sessionA.access_token, "organizations", "select=id,name")
    const orgsB = await authedSelect(config, sessionB.access_token, "organizations", "select=id,name")

    expectSingleOrg(result, "userA sees only orgA", orgsA, ctx.orgA)
    expectSingleOrg(result, "userB sees only orgB", orgsB, ctx.orgB)

    const membershipsA = await authedSelect(
      config,
      sessionA.access_token,
      "memberships",
      "select=org_id,role,status"
    )
    const membershipsB = await authedSelect(
      config,
      sessionB.access_token,
      "memberships",
      "select=org_id,role,status"
    )

    expectMemberships(result, "userA memberships isolated", membershipsA, ctx.orgA, "owner")
    expectMemberships(result, "userB memberships isolated", membershipsB, ctx.orgB, "viewer")

    const orgStateAOwn = await authedSelect(
      config,
      sessionA.access_token,
      "org_state",
      `select=org_id,state&org_id=eq.${encodeURIComponent(ctx.orgA)}`
    )
    const orgStateAOther = await authedSelect(
      config,
      sessionA.access_token,
      "org_state",
      `select=org_id,state&org_id=eq.${encodeURIComponent(ctx.orgB)}`
    )

    expectRowVisible(result, "userA can read own org_state", orgStateAOwn, ctx.orgA)
    expectNoRows(result, "userA cannot read foreign org_state", orgStateAOther)

    const evidenceAOwn = await authedSelect(
      config,
      sessionA.access_token,
      "evidence_objects",
      `select=attachment_id,org_id&org_id=eq.${encodeURIComponent(ctx.orgA)}`
    )
    const evidenceAOther = await authedSelect(
      config,
      sessionA.access_token,
      "evidence_objects",
      `select=attachment_id,org_id&org_id=eq.${encodeURIComponent(ctx.orgB)}`
    )

    expectRowVisible(result, "userA can read own evidence_objects", evidenceAOwn, ctx.orgA)
    expectNoRows(result, "userA cannot read foreign evidence_objects", evidenceAOther)

    const viewerWrite = await authedPatch(
      config,
      sessionB.access_token,
      "org_state",
      `org_id=eq.${encodeURIComponent(ctx.orgB)}`,
      { state: { updatedBy: "viewer-should-fail" } }
    )

    if (viewerWrite.status >= 200 && viewerWrite.status < 300 && viewerWrite.rows.length > 0) {
      result.blockers.push("Viewer-ul a putut modifica org_state, ceea ce indică o problemă RLS.")
      result.checks.push({
        name: "viewer cannot write org_state",
        ok: false,
        detail: `unexpected status ${viewerWrite.status} with rows ${JSON.stringify(viewerWrite.rows)}`,
      })
    } else {
      result.checks.push({
        name: "viewer cannot write org_state",
        ok: true,
        detail:
          viewerWrite.status >= 200 && viewerWrite.status < 300
            ? `blocked with empty result at status ${viewerWrite.status}`
            : `blocked with status ${viewerWrite.status}`,
      })
    }

    result.ready = result.blockers.length === 0
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.ready ? 0 : 1
  } catch (error) {
    result.blockers.push(error instanceof Error ? error.message : String(error))
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = 1
  } finally {
    await cleanup(config, ctx)
  }
}

function getConfig(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Configul Supabase este incomplet pentru verificarea RLS.")
  }

  return {
    url: url.replace(/\/$/, ""),
    anonKey,
    serviceRoleKey,
  }
}

async function createAuthUser(config, email, password) {
  const response = await fetch(`${config.url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Nu am putut crea utilizatorul de test ${email}: ${response.status} ${await response.text()}`)
  }

  return await response.json()
}

async function signIn(config, email, password) {
  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(`Nu am putut autentifica utilizatorul de test ${email}: ${response.status}`)
  }

  return await response.json()
}

async function seedData(config, ctx) {
  await serviceUpsert(config, "organizations", [
    { id: ctx.orgA, slug: ctx.orgA, name: "RLS Org A" },
    { id: ctx.orgB, slug: ctx.orgB, name: "RLS Org B" },
  ])

  await serviceUpsert(config, "profiles", [
    { id: ctx.userAId, email: ctx.userAEmail, display_name: "RLS User A" },
    { id: ctx.userBId, email: ctx.userBEmail, display_name: "RLS User B" },
  ])

  await serviceUpsert(config, "memberships", [
    {
      id: `membership-a-${ctx.runId}`,
      user_id: ctx.userAId,
      org_id: ctx.orgA,
      role: "owner",
      status: "active",
    },
    {
      id: `membership-b-${ctx.runId}`,
      user_id: ctx.userBId,
      org_id: ctx.orgB,
      role: "viewer",
      status: "active",
    },
  ])

  await serviceUpsert(config, "org_state", [
    { org_id: ctx.orgA, state: { source: "rls-check-a" } },
    { org_id: ctx.orgB, state: { source: "rls-check-b" } },
  ])

  await serviceUpsert(config, "evidence_objects", [
    {
      attachment_id: `evidence-a-${ctx.runId}`,
      org_id: ctx.orgA,
      task_id: "rem-rls-a",
      file_name: "proof-a.pdf",
      mime_type: "application/pdf",
      size_bytes: 3,
      kind: "document_bundle",
      storage_provider: "supabase_private",
      storage_key: `${ctx.orgA}/rem-rls-a/proof-a.pdf`,
      uploaded_by: ctx.userAId,
      metadata: { source: "rls-check-a" },
    },
    {
      attachment_id: `evidence-b-${ctx.runId}`,
      org_id: ctx.orgB,
      task_id: "rem-rls-b",
      file_name: "proof-b.pdf",
      mime_type: "application/pdf",
      size_bytes: 3,
      kind: "document_bundle",
      storage_provider: "supabase_private",
      storage_key: `${ctx.orgB}/rem-rls-b/proof-b.pdf`,
      uploaded_by: ctx.userBId,
      metadata: { source: "rls-check-b" },
    },
  ])
}

async function serviceUpsert(config, table, rows) {
  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
      "Accept-Profile": "public",
      "Content-Profile": "public",
    },
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    throw new Error(`Nu am putut face upsert în ${table}: ${response.status} ${await response.text()}`)
  }

  return await response.json()
}

async function authedSelect(config, token, table, query) {
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
      "Accept-Profile": "public",
    },
  })

  if (!response.ok) {
    throw new Error(`Select eșuat pe ${table}: ${response.status} ${await response.text()}`)
  }

  return await response.json()
}

async function authedPatch(config, token, table, query, row) {
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "Accept-Profile": "public",
      "Content-Profile": "public",
    },
    body: JSON.stringify(row),
  })

  let rows = []

  try {
    const payload = await response.json()
    rows = Array.isArray(payload) ? payload : payload ? [payload] : []
  } catch {
    rows = []
  }

  return {
    status: response.status,
    rows,
  }
}

function expectSingleOrg(result, name, rows, expectedOrgId) {
  if (rows.length === 1 && rows[0].id === expectedOrgId) {
    result.checks.push({ name, ok: true, detail: expectedOrgId })
    return
  }
  result.blockers.push(`${name}: expected only ${expectedOrgId}, got ${JSON.stringify(rows)}`)
  result.checks.push({ name, ok: false, detail: JSON.stringify(rows) })
}

function expectMemberships(result, name, rows, expectedOrgId, expectedRole) {
  if (
    rows.length === 1 &&
    rows[0].org_id === expectedOrgId &&
    rows[0].role === expectedRole &&
    rows[0].status === "active"
  ) {
    result.checks.push({ name, ok: true, detail: `${expectedOrgId}/${expectedRole}` })
    return
  }
  result.blockers.push(`${name}: expected ${expectedOrgId}/${expectedRole}, got ${JSON.stringify(rows)}`)
  result.checks.push({ name, ok: false, detail: JSON.stringify(rows) })
}

function expectRowVisible(result, name, rows, expectedOrgId) {
  if (rows.length === 1 && rows[0].org_id === expectedOrgId) {
    result.checks.push({ name, ok: true, detail: expectedOrgId })
    return
  }
  result.blockers.push(`${name}: expected visible row for ${expectedOrgId}, got ${JSON.stringify(rows)}`)
  result.checks.push({ name, ok: false, detail: JSON.stringify(rows) })
}

function expectNoRows(result, name, rows) {
  if (Array.isArray(rows) && rows.length === 0) {
    result.checks.push({ name, ok: true, detail: "[]" })
    return
  }
  result.blockers.push(`${name}: expected no rows, got ${JSON.stringify(rows)}`)
  result.checks.push({ name, ok: false, detail: JSON.stringify(rows) })
}

async function cleanup(config, ctx) {
  try {
    if (ctx.orgA) {
      await serviceDelete(config, "organizations", `id=in.(${encodeURIComponent(ctx.orgA)},${encodeURIComponent(ctx.orgB)})`)
    }
  } catch {}

  try {
    if (ctx.userAId) {
      await deleteAuthUser(config, ctx.userAId)
    }
  } catch {}

  try {
    if (ctx.userBId) {
      await deleteAuthUser(config, ctx.userBId)
    }
  } catch {}
}

async function serviceDelete(config, table, query) {
  await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Accept-Profile": "public",
      "Content-Profile": "public",
    },
  })
}

async function deleteAuthUser(config, userId) {
  await fetch(`${config.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
