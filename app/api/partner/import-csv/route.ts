// POST /api/partner/import-csv
// Sprint 12 — Partner Portal: import clienți bulk din CSV.
// Format: orgName,cui,sector,employeeCount,email
// Parse → creează org + membership → rulează applicability engine automat.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest, registerUser, addOrganizationMemberByEmail } from "@/lib/server/auth"
import { evaluateApplicability } from "@/lib/compliance/applicability"
import type { OrgProfile, OrgSector, OrgEmployeeCount } from "@/lib/compliance/applicability"

const VALID_SECTORS: OrgSector[] = [
  "energy", "transport", "banking", "health", "digital-infrastructure",
  "public-admin", "finance", "retail", "manufacturing", "professional-services", "other",
]
const VALID_EMPLOYEE_COUNTS: OrgEmployeeCount[] = ["1-9", "10-49", "50-249", "250+"]

function validateCUI(raw: string): string | null {
  const clean = raw.trim().toUpperCase()
  return /^(RO)?\d{2,10}$/.test(clean) ? clean : null
}

type ImportRowResult =
  | { ok: true; orgId: string; orgName: string; applicabilityTags: string[] }
  | { ok: false; error: string }

// ── Parse CSV (simplu, fără librărie externă) ─────────────────────────────────

function parseCsvRow(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim()); cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")
    }

    const body = await request.json() as { csvContent?: string }
    if (!body.csvContent || typeof body.csvContent !== "string") {
      return jsonError("csvContent lipsă.", 400, "MISSING_CSV")
    }

    const lines = body.csvContent
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      return jsonError("Fișier CSV gol.", 400, "EMPTY_CSV")
    }

    // Detectează header (dacă prima linie conține "orgName" sau "email")
    const firstLine = lines[0].toLowerCase()
    const hasHeader = firstLine.includes("orgname") || firstLine.includes("email") || firstLine.includes("sector")
    const dataLines = hasHeader ? lines.slice(1) : lines

    if (dataLines.length === 0) {
      return jsonError("CSV conține doar header, niciun rând de date.", 400, "NO_DATA_ROWS")
    }

    if (dataLines.length > 50) {
      return jsonError("Maxim 50 de rânduri per import.", 400, "TOO_MANY_ROWS")
    }

    const results: ImportRowResult[] = []

    for (let rowIdx = 0; rowIdx < dataLines.length; rowIdx++) {
      const lineNum = hasHeader ? rowIdx + 2 : rowIdx + 1
      const cols = parseCsvRow(dataLines[rowIdx])

      // Aşteptăm: orgName, cui, sector, employeeCount, email
      const [orgNameRaw = "", cuiRaw = "", sectorRaw = "", employeeCountRaw = "", emailRaw = ""] = cols

      const orgName = orgNameRaw.trim()
      if (!orgName) {
        results.push({ ok: false, error: `Linia ${lineNum}: orgName lipsă` })
        continue
      }

      const email = emailRaw.trim().toLowerCase()
      if (!email || !email.includes("@")) {
        results.push({ ok: false, error: `Linia ${lineNum}: email invalid pentru "${orgName}"` })
        continue
      }

      const cui = cuiRaw.trim() ? validateCUI(cuiRaw) : undefined
      if (cuiRaw.trim() && !cui) {
        results.push({ ok: false, error: `Linia ${lineNum}: CUI invalid pentru "${orgName}"` })
        continue
      }

      const sector = sectorRaw.trim().toLowerCase() as OrgSector
      if (sectorRaw.trim() && !VALID_SECTORS.includes(sector)) {
        results.push({ ok: false, error: `Linia ${lineNum}: sector invalid "${sectorRaw}" pentru "${orgName}"` })
        continue
      }

      const employeeCount = employeeCountRaw.trim() as OrgEmployeeCount
      if (employeeCountRaw.trim() && !VALID_EMPLOYEE_COUNTS.includes(employeeCount)) {
        results.push({ ok: false, error: `Linia ${lineNum}: employeeCount invalid "${employeeCountRaw}" pentru "${orgName}"` })
        continue
      }

      try {
        // Creează org cu userul client ca owner
        const tempPassword = `tmp-${Math.random().toString(36).slice(2, 14)}`
        const newUser = await registerUser(email, tempPassword, orgName)
        const newOrgId = newUser.orgId

        // Adaugă partenerul curent ca membro compliance
        try {
          await addOrganizationMemberByEmail(newOrgId, session.email, "compliance")
        } catch (memberErr) {
          // Dacă adăugarea ca membro eșuează, org-ul tot a fost creat
          const errMsg = memberErr instanceof Error ? memberErr.message : "UNKNOWN"
          if (errMsg !== "MEMBER_ALREADY_EXISTS") {
            // Continuăm — parteneru nu a putut fi adăugat, dar org-ul e creat
          }
        }

        // Rulează applicability engine cu profilul CSV
        const profile: OrgProfile = {
          sector: VALID_SECTORS.includes(sector) ? sector : "other",
          employeeCount: VALID_EMPLOYEE_COUNTS.includes(employeeCount) ? employeeCount : "10-49",
          usesAITools: false,
          requiresEfactura: false,
          completedAtISO: new Date().toISOString(),
          ...(cui ? { cui } : {}),
        }
        const applicability = evaluateApplicability(profile)

        results.push({
          ok: true,
          orgId: newOrgId,
          orgName,
          applicabilityTags: applicability.tags,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "UNKNOWN"
        if (msg.includes("deja inregistrata") || msg.includes("already")) {
          results.push({ ok: false, error: `Linia ${lineNum}: email "${email}" deja înregistrat` })
        } else {
          results.push({ ok: false, error: `Linia ${lineNum}: eroare la crearea org "${orgName}" — ${msg}` })
        }
      }
    }

    const imported = results.filter((r) => r.ok).length
    const errors = results.filter((r) => !r.ok)

    return NextResponse.json({
      imported,
      errors: errors.map((e) => (!e.ok ? e.error : "")),
      total: results.length,
      message:
        errors.length === 0
          ? `${imported} clienți importați cu succes.`
          : `${imported} din ${results.length} clienți importați. ${errors.length} erori.`,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la importul CSV.", 500, "CSV_IMPORT_FAILED")
  }
}
