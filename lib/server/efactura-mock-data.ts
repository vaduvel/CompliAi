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

/** Keywords pentru detecție automată tech vendor din orice sursă */
export const TECH_VENDOR_KEYWORDS = [
  "amazon", "aws", "microsoft", "azure", "google", "cloud", "hosting",
  "saas", "openai", "gpt", "atlassian", "jira", "github", "gitlab",
  "heroku", "digitalocean", "cloudflare", "vercel", "netlify",
]

export function isTechVendorName(name: string): boolean {
  const lower = name.toLowerCase()
  return TECH_VENDOR_KEYWORDS.some((kw) => lower.includes(kw))
}
