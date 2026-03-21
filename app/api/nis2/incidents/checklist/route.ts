// GET /api/nis2/incidents/checklist?type=ransomware
// Returns the incident response checklist for a specific attack type.

import { NextRequest, NextResponse } from "next/server"

import { getIncidentChecklist, getAllIncidentChecklists } from "@/lib/compliance/incident-checklists"
import type { Nis2AttackType } from "@/lib/server/nis2-store"

export function GET(req: NextRequest) {
  const attackType = req.nextUrl.searchParams.get("type") as Nis2AttackType | null

  if (!attackType) {
    // Return all checklists if no type specified
    return NextResponse.json({ checklists: getAllIncidentChecklists() })
  }

  const checklist = getIncidentChecklist(attackType)
  return NextResponse.json({ checklist })
}
