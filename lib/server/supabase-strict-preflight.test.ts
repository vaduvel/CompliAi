import { describe, expect, it } from "vitest"

import { evaluateStrictSupabasePreflight } from "@/lib/server/supabase-strict-preflight"

describe("lib/server/supabase-strict-preflight", () => {
  it("marcheaza mediul ca pregatit cand backend-ul este supabase strict si resursele live sunt sanatoase", () => {
    const result = evaluateStrictSupabasePreflight(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        COMPLISCAN_AUTH_BACKEND: "supabase",
        COMPLISCAN_DATA_BACKEND: "supabase",
        COMPLISCAN_ALLOW_LOCAL_FALLBACK: "false",
      },
      [
        { kind: "table", name: "organizations", status: 200 },
        { kind: "table", name: "memberships", status: 200 },
        { kind: "table", name: "profiles", status: 200 },
        { kind: "table", name: "org_state", status: 200 },
        { kind: "table", name: "evidence_objects", status: 200 },
        { kind: "bucket", name: "compliscan-evidence-private", status: 200 },
      ]
    )

    expect(result.ready).toBe(true)
    expect(result.blockers).toEqual([])
    expect(result.config.authBackend).toBe("supabase")
    expect(result.config.dataBackend).toBe("supabase")
    expect(result.config.localFallbackAllowed).toBe(false)
  })

  it("semnaleaza clar fallback-ul local si backend-urile gresite", () => {
    const result = evaluateStrictSupabasePreflight(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      },
      [
        { kind: "table", name: "organizations", status: 200 },
        { kind: "table", name: "memberships", status: 200 },
        { kind: "table", name: "profiles", status: 200 },
        { kind: "table", name: "org_state", status: 200 },
        { kind: "table", name: "evidence_objects", status: 200 },
        { kind: "bucket", name: "compliscan-evidence-private", status: 200 },
      ]
    )

    expect(result.ready).toBe(false)
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("COMPLISCAN_AUTH_BACKEND"),
        expect.stringContaining("COMPLISCAN_DATA_BACKEND"),
        expect.stringContaining("COMPLISCAN_ALLOW_LOCAL_FALLBACK"),
      ])
    )
  })

  it("semnaleaza tabelele si bucket-ul lipsa", () => {
    const result = evaluateStrictSupabasePreflight(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        COMPLISCAN_AUTH_BACKEND: "supabase",
        COMPLISCAN_DATA_BACKEND: "supabase",
        COMPLISCAN_ALLOW_LOCAL_FALLBACK: "false",
      },
      [
        { kind: "table", name: "organizations", status: 200 },
        { kind: "table", name: "memberships", status: 500 },
        { kind: "table", name: "profiles", status: 200 },
        { kind: "table", name: "org_state", status: 404 },
        { kind: "table", name: "evidence_objects", status: 200 },
        { kind: "bucket", name: "compliscan-evidence-private", status: 404 },
      ]
    )

    expect(result.ready).toBe(false)
    expect(result.live.tablesHealthy).toBe(false)
    expect(result.live.bucketHealthy).toBe(false)
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("memberships"),
        expect.stringContaining("org_state"),
        expect.stringContaining("Bucket-ul privat"),
      ])
    )
  })
})
