// lib/server/reset-tokens.ts
// Password reset token store — time-limited, single-use tokens.
// Tokens stored in .data/reset-tokens.json (consistent with auth pattern).

import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

import { writeFileSafe } from "@/lib/server/fs-safe"

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const MAX_TOKENS = 200 // FIFO cleanup

type ResetToken = {
  token: string
  email: string
  createdAt: number
  used: boolean
}

function getTokensFile() {
  const explicit = process.env.COMPLISCAN_RESET_TOKENS_FILE?.trim()
  if (explicit) return explicit
  return path.join(process.cwd(), ".data", "reset-tokens.json")
}

async function loadTokens(): Promise<ResetToken[]> {
  try {
    const raw = await fs.readFile(getTokensFile(), "utf8")
    return JSON.parse(raw) as ResetToken[]
  } catch {
    return []
  }
}

async function saveTokens(tokens: ResetToken[]) {
  await writeFileSafe(getTokensFile(), JSON.stringify(tokens, null, 2))
}

function pruneExpiredTokens(tokens: ResetToken[]): ResetToken[] {
  const now = Date.now()
  const valid = tokens.filter((t) => !t.used && now - t.createdAt < TOKEN_TTL_MS)
  // FIFO: keep only the most recent MAX_TOKENS
  return valid.slice(-MAX_TOKENS)
}

export async function createResetToken(email: string): Promise<string> {
  const tokens = pruneExpiredTokens(await loadTokens())
  const token = crypto.randomBytes(32).toString("hex")

  tokens.push({
    token,
    email: email.toLowerCase().trim(),
    createdAt: Date.now(),
    used: false,
  })

  await saveTokens(tokens)
  return token
}

export async function consumeResetToken(
  token: string
): Promise<{ email: string } | null> {
  const tokens = await loadTokens()
  const now = Date.now()

  const entry = tokens.find(
    (t) => t.token === token && !t.used && now - t.createdAt < TOKEN_TTL_MS
  )
  if (!entry) return null

  entry.used = true
  await saveTokens(pruneExpiredTokens(tokens))

  return { email: entry.email }
}
