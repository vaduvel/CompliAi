/**
 * Safe filesystem write utilities for serverless environments (Vercel, AWS Lambda).
 *
 * On read-only filesystems (EROFS), writes are silently skipped with a console warning.
 * This allows Supabase-backed persistence to work without crashing on local file fallbacks.
 */

import { promises as fs } from "node:fs"
import path from "node:path"

function isReadOnlyError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const code = (err as NodeJS.ErrnoException).code
  return code === "EROFS" || code === "EACCES"
}

/**
 * Write a file, silently skipping on read-only filesystems.
 * Returns `true` if the write succeeded, `false` if skipped due to EROFS/EACCES.
 * Re-throws any other error.
 */
export async function writeFileSafe(filePath: string, content: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, "utf8")
    return true
  } catch (err) {
    if (isReadOnlyError(err)) {
      console.warn(`[fs-safe] Skipping write (read-only FS): ${filePath}`)
      return false
    }
    throw err
  }
}

/**
 * Append to a file, silently skipping on read-only filesystems.
 */
export async function appendFileSafe(filePath: string, content: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.appendFile(filePath, content, "utf8")
    return true
  } catch (err) {
    if (isReadOnlyError(err)) {
      console.warn(`[fs-safe] Skipping append (read-only FS): ${filePath}`)
      return false
    }
    throw err
  }
}
