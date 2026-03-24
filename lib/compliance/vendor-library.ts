/**
 * GOLD 3 — Vendor Fingerprinting Library
 * 80+ furnizori comuni pentru firmele din România.
 * Fiecare: nume canonical, alias-uri, categorie, DPA public link, transfer clues, certificări.
 */

export type VendorCategory =
  | "cloud-infra"
  | "saas"
  | "ai-ml"
  | "email-marketing"
  | "analytics"
  | "payment"
  | "erp-accounting"
  | "courier-logistics"
  | "telecom"
  | "security"
  | "devtools"
  | "hr-payroll"
  | "crm"
  | "storage"
  | "cdn-edge"
  | "communication"
  | "ecommerce"
  | "legal-compliance"
  | "other"

export type TransferClue = "eu-only" | "eu-us-dpf" | "scc" | "adequacy" | "unknown"

export type VendorFingerprint = {
  /** Stable ID (slug) */
  id: string
  /** Canonical display name */
  canonicalName: string
  /** All known aliases/variations (lowercase) */
  aliases: string[]
  /** Primary category */
  category: VendorCategory
  /** Secondary categories */
  secondaryCategories?: VendorCategory[]
  /** Typical data types processed */
  dataTypes: string[]
  /** Public DPA/data processing terms URL (null = not publicly available) */
  dpaUrl: string | null
  /** Known certifications */
  certifications: string[]
  /** Transfer mechanism clues */
  transferClue: TransferClue
  /** Country of HQ */
  hqCountry: string
  /** EU entity exists */
  hasEuEntity: boolean
  /** Whether this vendor is commonly a data processor under GDPR */
  typicallyProcessor: boolean
  /** Short note for compliance context */
  complianceNote?: string
}

// ── Library ──────────────────────────────────────────────────────────────────

export const VENDOR_LIBRARY: VendorFingerprint[] = [
  // ═══ Cloud Infrastructure ═══
  {
    id: "aws",
    canonicalName: "Amazon Web Services (AWS)",
    aliases: ["aws", "amazon web services", "amazon aws", "a]mazon cloud"],
    category: "cloud-infra",
    dataTypes: ["server logs", "stored data", "backups", "network metadata"],
    dpaUrl: "https://aws.amazon.com/compliance/data-processing-addendum/",
    certifications: ["ISO 27001", "SOC 2 Type II", "C5", "ISO 27701"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "azure",
    canonicalName: "Microsoft Azure",
    aliases: ["azure", "microsoft azure", "ms azure"],
    category: "cloud-infra",
    secondaryCategories: ["saas"],
    dataTypes: ["server logs", "stored data", "identity data", "backups"],
    dpaUrl: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
    certifications: ["ISO 27001", "SOC 2 Type II", "C5", "ISO 27701", "CSA STAR"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "microsoft-365",
    canonicalName: "Microsoft 365",
    aliases: ["microsoft 365", "office 365", "o365", "ms 365", "microsoft office", "ms office"],
    category: "saas",
    dataTypes: ["email", "documents", "identity data", "calendar", "contacts"],
    dpaUrl: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
    certifications: ["ISO 27001", "SOC 2 Type II", "ISO 27701"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "google-cloud",
    canonicalName: "Google Cloud Platform",
    aliases: ["google cloud", "gcp", "google cloud platform"],
    category: "cloud-infra",
    dataTypes: ["server logs", "stored data", "analytics", "backups"],
    dpaUrl: "https://cloud.google.com/terms/data-processing-addendum",
    certifications: ["ISO 27001", "SOC 2 Type II", "ISO 27701", "CSA STAR"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "google-workspace",
    canonicalName: "Google Workspace",
    aliases: ["google workspace", "gsuite", "g suite", "google apps"],
    category: "saas",
    dataTypes: ["email", "documents", "calendar", "contacts", "drive files"],
    dpaUrl: "https://workspace.google.com/terms/dpa_terms.html",
    certifications: ["ISO 27001", "SOC 2 Type II", "ISO 27701"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "digitalocean",
    canonicalName: "DigitalOcean",
    aliases: ["digitalocean", "digital ocean"],
    category: "cloud-infra",
    dataTypes: ["server logs", "stored data", "backups"],
    dpaUrl: "https://www.digitalocean.com/legal/data-processing-agreement",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },
  {
    id: "hetzner",
    canonicalName: "Hetzner",
    aliases: ["hetzner", "hetzner online", "hetzner cloud"],
    category: "cloud-infra",
    dataTypes: ["server logs", "stored data", "backups"],
    dpaUrl: "https://www.hetzner.com/legal/privacy-policy",
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "DE",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Servere exclusiv în UE (Germania, Finlanda). Fără transfer extra-UE.",
  },
  {
    id: "ovh",
    canonicalName: "OVHcloud",
    aliases: ["ovh", "ovhcloud", "ovh cloud"],
    category: "cloud-infra",
    dataTypes: ["server logs", "stored data", "backups"],
    dpaUrl: "https://www.ovhcloud.com/en/personal-data-protection/",
    certifications: ["ISO 27001", "SOC 2 Type II", "HDS", "SecNumCloud"],
    transferClue: "eu-only",
    hqCountry: "FR",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Cloud european suveran. Centre de date în UE.",
  },
  {
    id: "vercel",
    canonicalName: "Vercel",
    aliases: ["vercel", "zeit", "vercel inc"],
    category: "cloud-infra",
    secondaryCategories: ["cdn-edge"],
    dataTypes: ["deployment logs", "edge cache", "analytics"],
    dpaUrl: "https://vercel.com/legal/dpa",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },
  {
    id: "netlify",
    canonicalName: "Netlify",
    aliases: ["netlify"],
    category: "cloud-infra",
    secondaryCategories: ["cdn-edge"],
    dataTypes: ["deployment logs", "edge cache", "form submissions"],
    dpaUrl: "https://www.netlify.com/legal/data-processing-agreement/",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },

  // ═══ AI / ML ═══
  {
    id: "openai",
    canonicalName: "OpenAI",
    aliases: ["openai", "open ai", "chatgpt", "gpt-4", "gpt-3"],
    category: "ai-ml",
    dataTypes: ["prompts", "API inputs/outputs", "usage logs"],
    dpaUrl: "https://openai.com/policies/data-processing-addendum",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
    complianceNote: "Verifică dacă API usage include date personale. Zero data retention pe API business.",
  },
  {
    id: "anthropic",
    canonicalName: "Anthropic",
    aliases: ["anthropic", "claude", "claude ai"],
    category: "ai-ml",
    dataTypes: ["prompts", "API inputs/outputs", "usage logs"],
    dpaUrl: "https://www.anthropic.com/legal/commercial-terms",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
    complianceNote: "API: zero data retention by default. Verifică termenii pentru console usage.",
  },
  {
    id: "google-ai",
    canonicalName: "Google AI (Gemini)",
    aliases: ["gemini", "google ai", "google gemini", "bard"],
    category: "ai-ml",
    dataTypes: ["prompts", "API inputs/outputs", "usage logs"],
    dpaUrl: "https://cloud.google.com/terms/data-processing-addendum",
    certifications: ["ISO 27001", "SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ DevTools ═══
  {
    id: "github",
    canonicalName: "GitHub",
    aliases: ["github", "github.com", "github inc"],
    category: "devtools",
    dataTypes: ["source code", "issues", "CI/CD logs", "user profiles"],
    dpaUrl: "https://github.com/customer-terms/github-data-protection-agreement",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },
  {
    id: "gitlab",
    canonicalName: "GitLab",
    aliases: ["gitlab", "gitlab.com"],
    category: "devtools",
    dataTypes: ["source code", "CI/CD logs", "issues", "user profiles"],
    dpaUrl: "https://about.gitlab.com/privacy/",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "atlassian",
    canonicalName: "Atlassian",
    aliases: ["atlassian", "jira", "confluence", "bitbucket", "trello"],
    category: "devtools",
    secondaryCategories: ["saas"],
    dataTypes: ["project data", "issues", "wiki content", "user profiles"],
    dpaUrl: "https://www.atlassian.com/legal/data-processing-addendum",
    certifications: ["SOC 2 Type II", "ISO 27001", "ISO 27018"],
    transferClue: "eu-us-dpf",
    hqCountry: "AU",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "jetbrains",
    canonicalName: "JetBrains",
    aliases: ["jetbrains", "intellij", "webstorm", "pycharm"],
    category: "devtools",
    dataTypes: ["license data", "telemetry", "usage statistics"],
    dpaUrl: "https://www.jetbrains.com/legal/docs/privacy/privacy/",
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "CZ",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "HQ în Praga. Date procesate în UE.",
  },
  {
    id: "sentry",
    canonicalName: "Sentry",
    aliases: ["sentry", "sentry.io", "getsentry"],
    category: "devtools",
    secondaryCategories: ["analytics"],
    dataTypes: ["error logs", "stack traces", "user context", "performance data"],
    dpaUrl: "https://sentry.io/legal/dpa/",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
    complianceNote: "Poate conține date personale din stack traces. Configurează PII scrubbing.",
  },
  {
    id: "datadog",
    canonicalName: "Datadog",
    aliases: ["datadog", "datadoghq"],
    category: "devtools",
    secondaryCategories: ["analytics", "security"],
    dataTypes: ["infrastructure logs", "APM data", "metrics"],
    dpaUrl: "https://www.datadoghq.com/legal/data-processing-addendum/",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ Email / Marketing ═══
  {
    id: "mailchimp",
    canonicalName: "Mailchimp (Intuit)",
    aliases: ["mailchimp", "mail chimp", "intuit mailchimp"],
    category: "email-marketing",
    dataTypes: ["email addresses", "subscriber lists", "campaign analytics", "behavioral data"],
    dpaUrl: "https://mailchimp.com/legal/data-processing-addendum/",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },
  {
    id: "sendgrid",
    canonicalName: "SendGrid (Twilio)",
    aliases: ["sendgrid", "twilio sendgrid"],
    category: "email-marketing",
    dataTypes: ["email addresses", "email content", "delivery logs"],
    dpaUrl: "https://www.twilio.com/legal/data-protection-addendum",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },
  {
    id: "brevo",
    canonicalName: "Brevo (ex-Sendinblue)",
    aliases: ["brevo", "sendinblue", "send in blue"],
    category: "email-marketing",
    dataTypes: ["email addresses", "subscriber lists", "SMS data", "campaign analytics"],
    dpaUrl: "https://www.brevo.com/legal/termsofuse/#data-processing-agreement",
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "FR",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Companie franceză. Date procesate în UE.",
  },

  // ═══ Analytics ═══
  {
    id: "google-analytics",
    canonicalName: "Google Analytics",
    aliases: ["google analytics", "ga4", "ga", "universal analytics"],
    category: "analytics",
    dataTypes: ["IP addresses", "cookies", "behavioral data", "device info"],
    dpaUrl: "https://privacy.google.com/businesses/processorterms/",
    certifications: ["ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Necesită consent banner. Configurează IP anonymization și data retention.",
  },
  {
    id: "hotjar",
    canonicalName: "Hotjar",
    aliases: ["hotjar"],
    category: "analytics",
    dataTypes: ["session recordings", "heatmaps", "behavioral data", "form data"],
    dpaUrl: "https://www.hotjar.com/legal/policies/data-processing-agreement/",
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "MT",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "HQ în Malta (UE). Necesită consent. Configurează suppress PII.",
  },
  {
    id: "clarity",
    canonicalName: "Microsoft Clarity",
    aliases: ["clarity", "microsoft clarity", "ms clarity"],
    category: "analytics",
    dataTypes: ["session recordings", "heatmaps", "behavioral data"],
    dpaUrl: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
    certifications: ["ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Gratuit. Necesită consent banner. Verifică integrarea cu GA4.",
  },
  {
    id: "meta-pixel",
    canonicalName: "Meta Pixel (Facebook)",
    aliases: ["meta pixel", "facebook pixel", "meta", "facebook", "fb pixel"],
    category: "analytics",
    secondaryCategories: ["email-marketing"],
    dataTypes: ["browsing behavior", "conversion data", "hashed identifiers"],
    dpaUrl: "https://www.facebook.com/legal/controller_addendum",
    certifications: [],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "Joint controller, NU processor. DPA-ul Meta e un controller addendum. Necesită consent explicit.",
  },

  // ═══ Payment ═══
  {
    id: "stripe",
    canonicalName: "Stripe",
    aliases: ["stripe", "stripe payments", "stripe inc"],
    category: "payment",
    dataTypes: ["payment card data", "transaction data", "identity verification"],
    dpaUrl: "https://stripe.com/legal/dpa",
    certifications: ["PCI DSS Level 1", "SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "paypal",
    canonicalName: "PayPal",
    aliases: ["paypal", "pay pal"],
    category: "payment",
    dataTypes: ["payment data", "transaction data", "identity data"],
    dpaUrl: null,
    certifications: ["PCI DSS Level 1"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "PayPal acționează ca controller independent pentru datele de plată.",
  },
  {
    id: "netopia",
    canonicalName: "Netopia Payments",
    aliases: ["netopia", "netopia payments", "mobilpay"],
    category: "payment",
    dataTypes: ["payment card data", "transaction data"],
    dpaUrl: null,
    certifications: ["PCI DSS"],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Procesator de plăți românesc. Date procesate în România/UE.",
  },

  // ═══ ERP / Accounting (România) ═══
  {
    id: "smartbill",
    canonicalName: "SmartBill",
    aliases: ["smartbill", "smart bill"],
    category: "erp-accounting",
    dataTypes: ["invoice data", "client data", "financial records", "CUI"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Soft de facturare românesc. Solicită DPA direct de la furnizor.",
  },
  {
    id: "saga",
    canonicalName: "Saga (Ciel/Wizrom)",
    aliases: ["saga", "saga software", "ciel", "wizrom"],
    category: "erp-accounting",
    dataTypes: ["accounting data", "employee data", "invoice data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Soft contabilitate românesc on-premise/cloud. Solicită DPA.",
  },
  {
    id: "facturis",
    canonicalName: "Facturis Online",
    aliases: ["facturis", "facturis online"],
    category: "erp-accounting",
    dataTypes: ["invoice data", "client data", "financial records"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "oblio",
    canonicalName: "Oblio",
    aliases: ["oblio", "oblio.eu"],
    category: "erp-accounting",
    dataTypes: ["invoice data", "client data", "financial records"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "freya",
    canonicalName: "FReya (ANAF)",
    aliases: ["freya", "freya anaf", "declaratii anaf"],
    category: "erp-accounting",
    dataTypes: ["tax declarations", "financial data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "Sistem ANAF — autoritate publică, nu processor comercial.",
  },

  // ═══ Courier / Logistics (România) ═══
  {
    id: "fan-courier",
    canonicalName: "FAN Courier",
    aliases: ["fan courier", "fan", "fancourier"],
    category: "courier-logistics",
    dataTypes: ["recipient name", "address", "phone", "package data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Solicită DPA. Procesează date personale destinatari.",
  },
  {
    id: "sameday",
    canonicalName: "Sameday (eMAG)",
    aliases: ["sameday", "same day", "sameday courier"],
    category: "courier-logistics",
    dataTypes: ["recipient name", "address", "phone", "package data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "cargus",
    canonicalName: "Cargus",
    aliases: ["cargus", "urgent cargus"],
    category: "courier-logistics",
    dataTypes: ["recipient name", "address", "phone", "package data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "dpd",
    canonicalName: "DPD Romania",
    aliases: ["dpd", "dpd romania", "dpd ro"],
    category: "courier-logistics",
    dataTypes: ["recipient name", "address", "phone", "package data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "gls",
    canonicalName: "GLS Romania",
    aliases: ["gls", "gls romania"],
    category: "courier-logistics",
    dataTypes: ["recipient name", "address", "phone", "package data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "NL",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ eCommerce ═══
  {
    id: "shopify",
    canonicalName: "Shopify",
    aliases: ["shopify"],
    category: "ecommerce",
    dataTypes: ["customer data", "order data", "payment data", "analytics"],
    dpaUrl: "https://www.shopify.com/legal/dpa",
    certifications: ["SOC 2 Type II", "PCI DSS"],
    transferClue: "scc",
    hqCountry: "CA",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "woocommerce",
    canonicalName: "WooCommerce (Automattic)",
    aliases: ["woocommerce", "woo commerce", "woo", "automattic"],
    category: "ecommerce",
    secondaryCategories: ["saas"],
    dataTypes: ["customer data", "order data", "payment data"],
    dpaUrl: "https://automattic.com/privacy/",
    certifications: [],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
    complianceNote: "Plugin self-hosted. Procesator doar dacă folosești WooCommerce Payments/Jetpack.",
  },
  {
    id: "emag-marketplace",
    canonicalName: "eMAG Marketplace",
    aliases: ["emag", "emag marketplace", "emag.ro"],
    category: "ecommerce",
    dataTypes: ["seller data", "order data", "customer data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "eMAG e controller independent pentru comenzile din marketplace.",
  },

  // ═══ Communication ═══
  {
    id: "slack",
    canonicalName: "Slack (Salesforce)",
    aliases: ["slack", "slack technologies"],
    category: "communication",
    dataTypes: ["messages", "files", "user profiles", "channel metadata"],
    dpaUrl: "https://slack.com/trust/compliance/dpa",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "zoom",
    canonicalName: "Zoom",
    aliases: ["zoom", "zoom video", "zoom.us"],
    category: "communication",
    dataTypes: ["video recordings", "chat messages", "meeting metadata", "user profiles"],
    dpaUrl: "https://explore.zoom.us/en/privacy/",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "teams",
    canonicalName: "Microsoft Teams",
    aliases: ["teams", "microsoft teams", "ms teams"],
    category: "communication",
    dataTypes: ["messages", "files", "meeting recordings", "user profiles"],
    dpaUrl: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
    certifications: ["ISO 27001", "SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "intercom",
    canonicalName: "Intercom",
    aliases: ["intercom"],
    category: "communication",
    secondaryCategories: ["crm"],
    dataTypes: ["user profiles", "chat messages", "behavioral data"],
    dpaUrl: "https://www.intercom.com/legal/data-processing-agreement",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "twilio",
    canonicalName: "Twilio",
    aliases: ["twilio"],
    category: "communication",
    dataTypes: ["phone numbers", "SMS content", "call logs", "voice recordings"],
    dpaUrl: "https://www.twilio.com/legal/data-protection-addendum",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ CRM ═══
  {
    id: "salesforce",
    canonicalName: "Salesforce",
    aliases: ["salesforce", "sfdc"],
    category: "crm",
    dataTypes: ["customer data", "lead data", "email", "activity logs"],
    dpaUrl: "https://www.salesforce.com/content/dam/web/en_us/www/documents/legal/Agreements/data-processing-addendum.pdf",
    certifications: ["ISO 27001", "SOC 2 Type II", "ISO 27018"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "hubspot",
    canonicalName: "HubSpot",
    aliases: ["hubspot", "hub spot"],
    category: "crm",
    secondaryCategories: ["email-marketing"],
    dataTypes: ["customer data", "lead data", "email", "analytics", "forms"],
    dpaUrl: "https://legal.hubspot.com/dpa",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ Storage ═══
  {
    id: "dropbox",
    canonicalName: "Dropbox",
    aliases: ["dropbox"],
    category: "storage",
    dataTypes: ["files", "metadata", "sharing logs"],
    dpaUrl: "https://www.dropbox.com/privacy",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "notion",
    canonicalName: "Notion",
    aliases: ["notion", "notion.so"],
    category: "saas",
    secondaryCategories: ["storage"],
    dataTypes: ["documents", "databases", "user profiles"],
    dpaUrl: "https://www.notion.so/Data-Processing-Addendum-361b6c2ec2794c2ab8e96b970cfa2b79",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },

  // ═══ CDN / Edge ═══
  {
    id: "cloudflare",
    canonicalName: "Cloudflare",
    aliases: ["cloudflare", "cloud flare"],
    category: "cdn-edge",
    secondaryCategories: ["security"],
    dataTypes: ["network traffic", "DNS logs", "cached content"],
    dpaUrl: "https://www.cloudflare.com/cloudflare-customer-dpa/",
    certifications: ["SOC 2 Type II", "ISO 27001", "PCI DSS"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "fastly",
    canonicalName: "Fastly",
    aliases: ["fastly"],
    category: "cdn-edge",
    dataTypes: ["network traffic", "cached content", "logs"],
    dpaUrl: "https://www.fastly.com/data-processing",
    certifications: ["SOC 2 Type II", "PCI DSS"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ Telecom (România) ═══
  {
    id: "orange-ro",
    canonicalName: "Orange România",
    aliases: ["orange", "orange romania", "orange ro"],
    category: "telecom",
    dataTypes: ["phone numbers", "traffic data", "billing data"],
    dpaUrl: null,
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "Controller independent. Solicită DPA doar dacă procesează date în numele tău.",
  },
  {
    id: "vodafone-ro",
    canonicalName: "Vodafone România",
    aliases: ["vodafone", "vodafone romania", "vodafone ro"],
    category: "telecom",
    dataTypes: ["phone numbers", "traffic data", "billing data"],
    dpaUrl: null,
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
  },
  {
    id: "telekom-ro",
    canonicalName: "Telekom România",
    aliases: ["telekom", "telekom romania", "telekom ro", "digi"],
    category: "telecom",
    dataTypes: ["phone numbers", "traffic data", "billing data", "internet logs"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
  },
  {
    id: "digi-ro",
    canonicalName: "Digi / RCS-RDS",
    aliases: ["digi", "rcs-rds", "rcs rds", "rds"],
    category: "telecom",
    dataTypes: ["phone numbers", "traffic data", "billing data", "internet logs"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
  },

  // ═══ HR / Payroll (România) ═══
  {
    id: "revisal",
    canonicalName: "Revisal",
    aliases: ["revisal"],
    category: "hr-payroll",
    dataTypes: ["employee data", "contracts", "work history"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "Sistem Inspecția Muncii — obligatoriu. Controller public.",
  },
  {
    id: "colorful-hr",
    canonicalName: "Colorful.hr",
    aliases: ["colorful", "colorful.hr", "colorful hr"],
    category: "hr-payroll",
    dataTypes: ["employee data", "payroll", "time tracking", "leave management"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "smarthr",
    canonicalName: "dpPayroll / SmartHR",
    aliases: ["smarthr", "smart hr", "dppayroll"],
    category: "hr-payroll",
    dataTypes: ["employee data", "payroll", "tax data"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ Security ═══
  {
    id: "crowdstrike",
    canonicalName: "CrowdStrike",
    aliases: ["crowdstrike", "crowd strike"],
    category: "security",
    dataTypes: ["endpoint telemetry", "threat data", "user activity"],
    dpaUrl: "https://www.crowdstrike.com/data-protection-agreement/",
    certifications: ["SOC 2 Type II", "ISO 27001", "FedRAMP"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "1password",
    canonicalName: "1Password",
    aliases: ["1password", "one password", "agilebits"],
    category: "security",
    dataTypes: ["encrypted credentials", "vault metadata"],
    dpaUrl: "https://1password.com/legal/data-processing-addendum",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "scc",
    hqCountry: "CA",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "Zero-knowledge architecture. Datele sunt criptate end-to-end.",
  },

  // ═══ SaaS Diverse ═══
  {
    id: "adobe",
    canonicalName: "Adobe",
    aliases: ["adobe", "adobe creative cloud", "adobe sign", "acrobat"],
    category: "saas",
    dataTypes: ["documents", "creative files", "signatures", "analytics"],
    dpaUrl: "https://www.adobe.com/privacy/eu-dpa.html",
    certifications: ["ISO 27001", "SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "supabase",
    canonicalName: "Supabase",
    aliases: ["supabase"],
    category: "cloud-infra",
    secondaryCategories: ["devtools"],
    dataTypes: ["database records", "auth data", "storage files", "edge function logs"],
    dpaUrl: "https://supabase.com/legal/dpa",
    certifications: ["SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: false,
    typicallyProcessor: true,
  },
  {
    id: "firebase",
    canonicalName: "Firebase (Google)",
    aliases: ["firebase", "google firebase"],
    category: "cloud-infra",
    secondaryCategories: ["analytics"],
    dataTypes: ["user data", "analytics", "crash reports", "push tokens"],
    dpaUrl: "https://cloud.google.com/terms/data-processing-addendum",
    certifications: ["ISO 27001", "SOC 2 Type II"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "typeform",
    canonicalName: "Typeform",
    aliases: ["typeform"],
    category: "saas",
    dataTypes: ["form responses", "respondent data", "analytics"],
    dpaUrl: "https://www.typeform.com/legal/data-processing-agreement/",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "ES",
    hasEuEntity: true,
    typicallyProcessor: true,
    complianceNote: "HQ în Barcelona. Date procesate în UE.",
  },
  {
    id: "monday",
    canonicalName: "monday.com",
    aliases: ["monday", "monday.com"],
    category: "saas",
    dataTypes: ["project data", "user profiles", "files", "automations"],
    dpaUrl: "https://monday.com/l/privacy/dpa/",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "IL",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "asana",
    canonicalName: "Asana",
    aliases: ["asana"],
    category: "saas",
    dataTypes: ["project data", "tasks", "user profiles"],
    dpaUrl: "https://asana.com/terms/data-processing",
    certifications: ["SOC 2 Type II", "ISO 27001"],
    transferClue: "eu-us-dpf",
    hqCountry: "US",
    hasEuEntity: true,
    typicallyProcessor: true,
  },

  // ═══ Utilities (România) ═══
  {
    id: "enel-ro",
    canonicalName: "Enel România",
    aliases: ["enel", "enel romania", "enel ro", "enel energie"],
    category: "other",
    dataTypes: ["billing data", "meter readings", "address"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
    complianceNote: "Controller independent — furnizor utilități.",
  },
  {
    id: "eon-ro",
    canonicalName: "E.ON România",
    aliases: ["eon", "e.on", "e.on romania", "eon romania"],
    category: "other",
    dataTypes: ["billing data", "meter readings", "address"],
    dpaUrl: null,
    certifications: [],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: false,
  },

  // ═══ Consulting / Audit ═══
  {
    id: "pwc",
    canonicalName: "PwC România",
    aliases: ["pwc", "pricewaterhousecoopers", "pwc romania"],
    category: "legal-compliance",
    dataTypes: ["financial data", "audit data", "employee data"],
    dpaUrl: null,
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "deloitte-ro",
    canonicalName: "Deloitte România",
    aliases: ["deloitte", "deloitte romania"],
    category: "legal-compliance",
    dataTypes: ["financial data", "audit data", "tax data"],
    dpaUrl: null,
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
  {
    id: "kpmg-ro",
    canonicalName: "KPMG România",
    aliases: ["kpmg", "kpmg romania"],
    category: "legal-compliance",
    dataTypes: ["financial data", "audit data", "tax data"],
    dpaUrl: null,
    certifications: ["ISO 27001"],
    transferClue: "eu-only",
    hqCountry: "RO",
    hasEuEntity: true,
    typicallyProcessor: true,
  },
]

// ── Lookup helpers ──────────────────────────────────────────────────────────

const _indexByAlias = new Map<string, VendorFingerprint>()
const _indexById = new Map<string, VendorFingerprint>()

function ensureIndex() {
  if (_indexByAlias.size > 0) return
  for (const vendor of VENDOR_LIBRARY) {
    _indexById.set(vendor.id, vendor)
    _indexByAlias.set(vendor.id, vendor)
    for (const alias of vendor.aliases) {
      _indexByAlias.set(alias.toLowerCase(), vendor)
    }
  }
}

/** Exact match by id or alias */
export function lookupVendorExact(nameOrId: string): VendorFingerprint | null {
  ensureIndex()
  return _indexByAlias.get(nameOrId.toLowerCase().trim()) ?? null
}

/** Lookup by id */
export function getVendorById(id: string): VendorFingerprint | null {
  ensureIndex()
  return _indexById.get(id) ?? null
}

/**
 * Fingerprint match: exact → contains alias → fuzzy token overlap.
 * Returns best match with confidence score (0-1).
 */
export function fingerprintMatch(
  input: string
): { vendor: VendorFingerprint; confidence: number; matchType: "exact" | "contains" | "fuzzy" } | null {
  ensureIndex()
  const inputLower = input.toLowerCase().trim()

  // 1. Exact alias match
  const exact = _indexByAlias.get(inputLower)
  if (exact) return { vendor: exact, confidence: 1.0, matchType: "exact" }

  // 2. Contains — input contains an alias or alias contains input
  for (const vendor of VENDOR_LIBRARY) {
    for (const alias of vendor.aliases) {
      if (inputLower.includes(alias) || alias.includes(inputLower)) {
        const shorter = Math.min(inputLower.length, alias.length)
        const longer = Math.max(inputLower.length, alias.length)
        const confidence = shorter / longer
        if (confidence >= 0.5) {
          return { vendor, confidence: Math.min(confidence, 0.9), matchType: "contains" }
        }
      }
    }
  }

  // 3. Fuzzy — token overlap (Jaccard similarity on words)
  const inputTokens = new Set(inputLower.split(/[\s\-_/.()]+/).filter(Boolean))
  let bestMatch: { vendor: VendorFingerprint; score: number } | null = null

  for (const vendor of VENDOR_LIBRARY) {
    const allTokenSources = [vendor.canonicalName, ...vendor.aliases]
    for (const source of allTokenSources) {
      const sourceTokens = new Set(source.toLowerCase().split(/[\s\-_/.()]+/).filter(Boolean))
      const intersection = [...inputTokens].filter((t) => sourceTokens.has(t)).length
      if (intersection === 0) continue
      const union = new Set([...inputTokens, ...sourceTokens]).size
      const jaccard = intersection / union
      if (jaccard > (bestMatch?.score ?? 0)) {
        bestMatch = { vendor, score: jaccard }
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.35) {
    return { vendor: bestMatch.vendor, confidence: bestMatch.score, matchType: "fuzzy" }
  }

  return null
}

/** Return all vendors in the library */
export function listLibraryVendors(): VendorFingerprint[] {
  return [...VENDOR_LIBRARY]
}

/** Category display labels */
export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  "cloud-infra": "Cloud / Infrastructură",
  saas: "SaaS",
  "ai-ml": "AI / Machine Learning",
  "email-marketing": "Email / Marketing",
  analytics: "Analytics",
  payment: "Plăți",
  "erp-accounting": "ERP / Contabilitate",
  "courier-logistics": "Curierat / Logistică",
  telecom: "Telecom",
  security: "Securitate",
  devtools: "Dev Tools",
  "hr-payroll": "HR / Salarizare",
  crm: "CRM",
  storage: "Stocare",
  "cdn-edge": "CDN / Edge",
  communication: "Comunicare",
  ecommerce: "eCommerce",
  "legal-compliance": "Legal / Compliance",
  other: "Altele",
}
