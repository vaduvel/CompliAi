// P4 — EUR-Lex Client (Regulatory Radar Phase 2)
// Fetches recent legislative acts from EUR-Lex SPARQL endpoint.
// EUR-Lex SPARQL is a public API — no auth required.
// Endpoint: https://publications.europa.eu/webapi/rdf/sparql

const SPARQL_ENDPOINT = "https://publications.europa.eu/webapi/rdf/sparql"

export type EurLexDocument = {
  uri: string
  title: string
  publicationDateISO: string
  officialJournalRef: string
  type: "regulation" | "directive" | "decision" | "recommendation" | "other"
  frameworks: ("nis2" | "ai-act" | "gdpr" | "e-factura")[]
}

type SparqlBinding = {
  value: string
  type: string
  "xml:lang"?: string
}

type SparqlResult = {
  results: {
    bindings: Array<Record<string, SparqlBinding>>
  }
}

// Keywords that map to known compliance frameworks
const FRAMEWORK_KEYWORDS: Record<string, EurLexDocument["frameworks"][number]> = {
  "nis2": "nis2",
  "network and information": "nis2",
  "ai act": "ai-act",
  "artificial intelligence": "ai-act",
  "gdpr": "gdpr",
  "general data protection": "gdpr",
  "e-invoicing": "e-factura",
  "electronic invoicing": "e-factura",
}

function detectFrameworks(title: string): EurLexDocument["frameworks"] {
  const lower = title.toLowerCase()
  const found = new Set<EurLexDocument["frameworks"][number]>()
  for (const [keyword, framework] of Object.entries(FRAMEWORK_KEYWORDS)) {
    if (lower.includes(keyword)) found.add(framework)
  }
  return Array.from(found)
}

function detectDocumentType(uri: string, title: string): EurLexDocument["type"] {
  const combined = (uri + " " + title).toLowerCase()
  if (combined.includes("regulation")) return "regulation"
  if (combined.includes("directive")) return "directive"
  if (combined.includes("decision")) return "decision"
  if (combined.includes("recommendation")) return "recommendation"
  return "other"
}

/**
 * Fetch recent EUR-Lex legislative acts related to NIS2, AI Act, GDPR, e-Invoicing.
 * Returns max 15 documents published since sinceISO.
 * Falls back to [] on any error (network, parsing, timeout).
 */
export async function fetchRecentEurLexActs(
  sinceISO: string,
): Promise<EurLexDocument[]> {
  try {
    const sinceDate = sinceISO.slice(0, 10) // YYYY-MM-DD

    // SPARQL query: recent acts mentioning our keywords
    const query = `
      PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      SELECT DISTINCT ?work ?title ?date ?journal
      WHERE {
        ?work a cdm:legislation_secondary ;
          cdm:work_has_expression ?expr .
        ?expr cdm:expression_title ?title ;
          cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
        OPTIONAL { ?work cdm:work_date_document ?date }
        OPTIONAL { ?work cdm:published_in_official-journal ?journal }
        FILTER (?date >= "${sinceDate}"^^xsd:date)
        FILTER (
          CONTAINS(LCASE(STR(?title)), "nis2") ||
          CONTAINS(LCASE(STR(?title)), "network and information") ||
          CONTAINS(LCASE(STR(?title)), "artificial intelligence") ||
          CONTAINS(LCASE(STR(?title)), "ai act") ||
          CONTAINS(LCASE(STR(?title)), "general data protection") ||
          CONTAINS(LCASE(STR(?title)), "e-invoicing") ||
          CONTAINS(LCASE(STR(?title)), "electronic invoice")
        )
      }
      ORDER BY DESC(?date)
      LIMIT 15
    `

    const url = new URL(SPARQL_ENDPOINT)
    url.searchParams.set("query", query)
    url.searchParams.set("format", "application/sparql-results+json")

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/sparql-results+json" },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const data = (await res.json()) as SparqlResult
    const bindings = data?.results?.bindings ?? []

    return bindings.map((b): EurLexDocument => {
      const uri = b.work?.value ?? ""
      const title = b.title?.value ?? "Act fără titlu"
      const dateISO = b.date?.value ? `${b.date.value}T00:00:00.000Z` : new Date().toISOString()
      const journal = b.journal?.value ?? ""

      return {
        uri,
        title,
        publicationDateISO: dateISO,
        officialJournalRef: journal,
        type: detectDocumentType(uri, title),
        frameworks: detectFrameworks(title),
      }
    })
  } catch {
    // Network failure, timeout, parse error — return empty array, cron continues
    return []
  }
}
