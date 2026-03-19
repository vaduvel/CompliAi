/**
 * Safe filesystem write utilities for serverless environments (Vercel, AWS Lambda).
 *
 * On read-only filesystems (EROFS), writes are silently skipped with a console warning.
 * This allows Supabase-backed persistence to work without crashing on local file fallbacks.
 */

import { promises as fs } from "node:fs"
import path from "node:path"

function isNonWritableEnvironmentError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const code = (err as NodeJS.ErrnoException).code
  return code === "EROFS" || code === "EACCES" || code === "EPERM" || code === "ENOENT"
}

/**
 * Write a file, silently skipping on non-writable serverless filesystems.
 * Returns `true` if the write succeeded, `false` if skipped due to EROFS/EACCES/EPERM/ENOENT.
 * Re-throws any other error.
 */
export async function writeFileSafe(filePath: string, content: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, "utf8")
    return true
  } catch (err) {
    if (isNonWritableEnvironmentError(err)) {
      console.warn(`[fs-safe] Skipping write (non-writable FS): ${filePath}`)
      return false
    }
    throw err
  }
}

/**
 * Append to a file, silently skipping on non-writable serverless filesystems.
 */
export async function appendFileSafe(filePath: string, content: string): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.appendFile(filePath, content, "utf8")
    return true
  } catch (err) {
    if (isNonWritableEnvironmentError(err)) {
      console.warn(`[fs-safe] Skipping append (non-writable FS): ${filePath}`)
      return false
    }
    throw err
  }
}
