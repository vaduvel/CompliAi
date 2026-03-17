// Sprint 5 — Mock Demo Mode e-Factura
// 15 furnizori realiști pentru demo când lipsesc credențialele ANAF.

export type EfacturaMockVendor = {
  name: string
  service: string
  isTech: boolean  // tech vendors (cloud/SaaS/AI) → finding "verifică DPA"
}

export const EFACTURA_MOCK_VENDORS: EfacturaMockVendor[] = [
  // ── Tech / Cloud / AI — risc NIS2 ridicat ──────────────────────────────────
  {
    name: "Amazon Web Services EMEA SARL",
    service: "Infrastructură cloud (AWS)",
    isTech: true,
  },
  {
    name: "Microsoft Ireland Operations Limited",
    service: "Microsoft 365 / Azure Cloud",
    isTech: true,
  },
  {
    name: "OpenAI OpCo LLC",
    service: "Servicii AI / LLM (ChatGPT, API)",
    isTech: true,
  },
  {
    name: "Google Cloud Romania SRL",
    service: "Google Cloud Platform / Workspace",
    isTech: true,
  },

  // ── Utilități și servicii esențiale ───────────────────────────────────────
  {
    name: "Enel Energie Muntenia SA",
    service: "Furnizare energie electrică",
    isTech: false,
  },
  {
    name: "Telekom Romania Communications SA",
    service: "Servicii telecomunicații / internet",
    isTech: false,
  },
  {
    name: "RCS & RDS SA",
    service: "Internet și cablu TV",
    isTech: false,
  },
  {
    name: "Orange Romania SA",
    service: "Telecomunicații mobile",
    isTech: false,
  },

  // ── Logistică și retail ───────────────────────────────────────────────────
  {
    name: "Fan Courier Express SRL",
    service: "Curierat și livrare",
    isTech: false,
  },
  {
    name: "Dedeman SRL",
    service: "Materiale construcții / echipamente",
    isTech: false,
  },
  {
    name: "Kaufland Romania SCS",
    service: "Produse alimentare și nealimentare",
    isTech: false,
  },

  // ── Servicii profesionale ─────────────────────────────────────────────────
  {
    name: "PwC Romania SRL",
    service: "Audit, consultanță fiscală și juridică",
    isTech: false,
  },
  {
    name: "Contabil Expert SRL",
    service: "Contabilitate și salarizare",
    isTech: false,
  },
  {
    name: "Noerr Finance & Tax SRL",
    service: "Consultanță fiscală și juridică",
    isTech: false,
  },

  // ── SaaS / Software ───────────────────────────────────────────────────────
  {
    name: "Atlassian Network Services Inc",
    service: "Jira, Confluence (SaaS)",
    isTech: true,
  },
]

// ── Sprint 5.1: Detecție vendor 3 niveluri ────────────────────────────────────

export type VendorTechConfidence = "high" | "medium" | "low" | null

/**
 * Nivel 1 — Vendor name matching (HIGH confidence)
 * Nume exacte din lista predefinită. Sursa cea mai fiabilă.
 */
const TECH_VENDOR_NAMES_HIGH: string[] = [
  "microsoft", "amazon web services", "aws", "google cloud", "google workspace",
  "openai", "anthropic", "azure", "cloudflare", "digitalocean", "hetzner",
  "ovh", "salesforce", "hubspot", "slack", "zoom", "github", "gitlab",
  "atlassian", "jetbrains", "adobe", "dropbox", "notion", "intercom",
  "twilio", "sendgrid", "stripe", "datadog", "sentry", "pagerduty",
  "vercel", "netlify", "heroku", "linode", "vultr", "fastly", "akamai",
]

/**
 * Nivel 3 — Keyword matching din descriere/serviciu (LOW confidence)
 * Descrierile facturii sunt adesea generice — necesită verificare manuală.
 */
export const TECH_VENDOR_KEYWORDS_LOW: string[] = [
  "cloud", "hosting", "saas", "ai", "machine learning", "api",
  "licență software", "abonament digital", "software", "server",
  "gpt", "jira", "confluence", "gitlab", "bitbucket",
]

/** @deprecated Folosește detectTechVendor() pentru confidence-aware detection */
export function isTechVendorName(name: string): boolean {
  return detectTechVendor(name, "").isTech
}

/**
 * Sprint 5.1: Detecție vendor pe 3 niveluri de confidence.
 * Nivel 1 (HIGH): vendor name din lista predefinită
 * Nivel 2 (MEDIUM): NACE/CAEN lookup — nu e disponibil fără API extern; omis în MVP
 * Nivel 3 (LOW): keyword matching din descriere/serviciu
 *
 * Returnează { isTech, confidence, reason }
 */
export function detectTechVendor(
  vendorName: string,
  serviceDescription: string
): { isTech: boolean; confidence: VendorTechConfidence; reason: string } {
  const nameLower = vendorName.toLowerCase()
  const descLower = serviceDescription.toLowerCase()

  // Nivel 1 — name matching HIGH
  const highMatch = TECH_VENDOR_NAMES_HIGH.find((kw) => nameLower.includes(kw))
  if (highMatch) {
    return {
      isTech: true,
      confidence: "high",
      reason: `Furnizor tech cunoscut: "${highMatch}" identificat în numele furnizorului.`,
    }
  }

  // Nivel 3 — keyword matching LOW (descriere)
  const lowMatch = TECH_VENDOR_KEYWORDS_LOW.find(
    (kw) => nameLower.includes(kw) || descLower.includes(kw)
  )
  if (lowMatch) {
    return {
      isTech: true,
      confidence: "low",
      reason: `Keyword "${lowMatch}" detectat — posibil furnizor tech. Verifică manual.`,
    }
  }

  return { isTech: false, confidence: null, reason: "" }
}
