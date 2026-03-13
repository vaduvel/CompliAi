import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export type User = {
  id: string
  email: string
  passwordHash: string
  salt: string
  orgId: string
  orgName: string
  createdAtISO: string
}

export type SessionPayload = {
  userId: string
  orgId: string
  email: string
  orgName: string
  exp: number
}

const USERS_FILE = path.join(process.cwd(), ".data", "users.json")
export const SESSION_COOKIE = "compliscan_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getSecret(): string {
  return process.env.COMPLISCAN_SESSION_SECRET || "dev-secret-change-me-in-production"
}

export async function loadUsers(): Promise<User[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8")
    return JSON.parse(raw) as User[]
  } catch {
    return []
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true })
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8")
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString("hex")
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await loadUsers()
  return users.find((u) => u.email === email.toLowerCase().trim()) ?? null
}

export async function registerUser(
  email: string,
  password: string,
  orgName: string
): Promise<User> {
  const users = await loadUsers()
  const emailNorm = email.toLowerCase().trim()
  if (users.some((u) => u.email === emailNorm)) {
    throw new Error("Adresa de email este deja inregistrata.")
  }
  const salt = crypto.randomBytes(16).toString("hex")
  const id = crypto.randomBytes(8).toString("hex")
  const user: User = {
    id,
    email: emailNorm,
    passwordHash: hashPassword(password, salt),
    salt,
    orgId: `org-${id}`,
    orgName: orgName.trim() || emailNorm.split("@")[0],
    createdAtISO: new Date().toISOString(),
  }
  await saveUsers([...users, user])
  return user
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS }
  const encoded = Buffer.from(JSON.stringify(full)).toString("base64url")
  const sig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url")
  return `${encoded}.${sig}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const dotIndex = token.lastIndexOf(".")
    if (dotIndex === -1) return null
    const encoded = token.slice(0, dotIndex)
    const sig = token.slice(dotIndex + 1)
    const expected = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url")
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  }
}
