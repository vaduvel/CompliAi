// Public lead-magnet endpoint — SAF-T D406 Hygiene Calculator.
//
// FĂRĂ AUTH. Calculează scor de igienă pe un singur fișier SAF-T uploadat
// (sau pe un set mic de fișiere până la 6). NU persist nimic în state — doar
// returnează rezultate efemere ca să-l convertim pe vizitator în lead.
//
// Limit basic: 6 MB per request, 6 fișiere max.
//
// Strategie comercială: după ce vede scorul, oferim CTA → register pentru
// monitoring lunar + cross-check D300/D394.

import { NextResponse } from "next/server"

import {
  parseSaftMetadata,
  saftMetadataToFilingRecord,
} from "@/lib/compliance/saft-xml-parser"
import {
  computeSAFTHygiene,
  buildSAFTHygieneFindings,
} from "@/lib/compliance/saft-hygiene"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

const MAX_FILES = 6
const MAX_TOTAL_BYTES = 6 * 1024 * 1024

type SingleXmlBody = { xml: string; fileName?: string }
type MultiXmlBody = { files: SingleXmlBody[] }

function isMultiBody(b: unknown): b is MultiXmlBody {
  return (
    !!b &&
    typeof b === "object" &&
    Array.isArray((b as MultiXmlBody).files)
  )
}

function isSingleBody(b: unknown): b is SingleXmlBody {
  return (
    !!b &&
    typeof b === "object" &&
    typeof (b as SingleXmlBody).xml === "string"
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body invalid (așteptăm JSON)." },
      { status: 400 },
    )
  }

  const inputs: SingleXmlBody[] = isMultiBody(body)
    ? body.files
    : isSingleBody(body)
      ? [body]
      : []

  if (inputs.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Trimite cel puțin un fișier XML." },
      { status: 400 },
    )
  }

  if (inputs.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: `Maximum ${MAX_FILES} fișiere per cerere.` },
      { status: 413 },
    )
  }

  const totalBytes = inputs.reduce((sum, i) => sum + (i.xml?.length ?? 0), 0)
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `Total prea mare (>${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB).`,
      },
      { status: 413 },
    )
  }

  const nowISO = new Date().toISOString()
  const filings: FilingRecord[] = []
  const perFile: Array<{
    fileName: string
    period: string
    cif: string | null
    isRectification: boolean
    rectificationCount: number
    errors: string[]
    warnings: string[]
  }> = []

  for (const item of inputs) {
    const fileName = item.fileName?.trim() || "upload.xml"
    if (!item.xml || typeof item.xml !== "string" || item.xml.trim().length === 0) {
      perFile.push({
        fileName,
        period: "",
        cif: null,
        isRectification: false,
        rectificationCount: 0,
        errors: ["Fișier gol sau lipsă conținut XML."],
        warnings: [],
      })
      continue
    }

    const meta = parseSaftMetadata(item.xml)
    perFile.push({
      fileName,
      period: meta.period,
      cif: meta.cif,
      isRectification: meta.isRectification,
      rectificationCount: meta.rectificationCount,
      errors: meta.errors,
      warnings: meta.warnings,
    })

    if (meta.errors.length === 0 && meta.period) {
      filings.push(saftMetadataToFilingRecord(meta, nowISO))
    }
  }

  const hygiene = computeSAFTHygiene(filings, nowISO)
  const findings = buildSAFTHygieneFindings(hygiene, nowISO)

  return NextResponse.json({
    ok: true,
    filesProcessed: inputs.length,
    filings: filings.length,
    perFile,
    hygiene,
    findings: findings.map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      detail: f.detail,
    })),
    cta: {
      message:
        filings.length > 1
          ? "Pentru analiză continuă pe TOATE perioadele și cross-check D300/D394, deschide cont gratuit pe CompliScan."
          : "Încarcă și raportările anterioare pentru a vedea consistența pe ultimele 12 luni.",
      registerUrl: "/register?utm_source=saft_calculator",
    },
  })
}
