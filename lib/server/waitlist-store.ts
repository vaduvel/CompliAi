// S3.3 — Waitlist signup storage.
// Simple JSON store cu Map cache. Capturează email + ICP segment + timestamp
// + source landing page. Folosit pentru ICP segments care nu sunt încă deschise
// (Faza 2/3 conform Doc 06: enterprise / IMM bundle / Compliance Officer category).
//
// Idempotent: emailul e key — re-signup updates timestamp în loc să dubleze.

import { promises as fs } from "node:fs"
import path from "node:path"

import { writeFileSafe } from "@/lib/server/fs-safe"
import type { IcpSegment } from "@/lib/server/white-label"

export type WaitlistEntry = {
  email: string
  icpSegment: IcpSegment | null
  source: string // "/dpo", "/imm", "/nis2", etc.
  signedUpAtISO: string
  signedUpAgainCount: number
  /** Optional context: company name, role, expected use-case */
  context?: string
}

const DATA_DIR = path.join(process.cwd(), ".data")
const FILE_PATH = path.join(DATA_DIR, "waitlist.json")

let cache: WaitlistEntry[] | null = null

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

async function readDisk(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is WaitlistEntry => {
      return (
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as { email?: unknown }).email === "string"
      )
    })
  } catch {
    return []
  }
}

async function writeDisk(entries: WaitlistEntry[]): Promise<void> {
  await writeFileSafe(FILE_PATH, JSON.stringify(entries, null, 2))
}

export async function listWaitlistEntries(): Promise<WaitlistEntry[]> {
  if (cache) return cache
  cache = await readDisk()
  return cache
}

export type WaitlistSignupInput = {
  email: string
  icpSegment?: IcpSegment | null
  source?: string
  context?: string
}

export type WaitlistSignupResult =
  | { ok: true; entry: WaitlistEntry; alreadyOnList: boolean }
  | { ok: false; error: string }

export async function signupForWaitlist(
  input: WaitlistSignupInput
): Promise<WaitlistSignupResult> {
  const email = normalizeEmail(input.email)
  if (!email || !email.includes("@") || email.length > 254) {
    return { ok: false, error: "Adresă email invalidă." }
  }

  const all = await listWaitlistEntries()
  const existing = all.find((e) => e.email === email)
  const nowISO = new Date().toISOString()

  if (existing) {
    const updated: WaitlistEntry = {
      ...existing,
      signedUpAtISO: nowISO,
      signedUpAgainCount: existing.signedUpAgainCount + 1,
      // Update icpSegment / source / context dacă sunt furnizate (signal mai recent).
      icpSegment: input.icpSegment !== undefined ? input.icpSegment ?? null : existing.icpSegment,
      source: input.source ?? existing.source,
      context: input.context ?? existing.context,
    }
    cache = all.map((e) => (e.email === email ? updated : e))
    await writeDisk(cache)
    return { ok: true, entry: updated, alreadyOnList: true }
  }

  const newEntry: WaitlistEntry = {
    email,
    icpSegment: input.icpSegment ?? null,
    source: input.source ?? "/",
    signedUpAtISO: nowISO,
    signedUpAgainCount: 0,
    context: input.context,
  }
  cache = [...all, newEntry]
  await writeDisk(cache)
  return { ok: true, entry: newEntry, alreadyOnList: false }
}

export async function countByIcpSegment(): Promise<Record<string, number>> {
  const all = await listWaitlistEntries()
  const counts: Record<string, number> = {}
  for (const entry of all) {
    const key = entry.icpSegment ?? "unknown"
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}
