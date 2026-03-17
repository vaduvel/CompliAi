# CompliAI — Architecture Audit
> Generat automat · 2026-03-17

---

## 1. Prezentare generală

| Atribut | Valoare |
|---|---|
| Framework | Next.js 15 (App Router) |
| Limbaj | TypeScript |
| Test framework | Vitest |
| Stocare primară | File-system local (`.data/`) + Supabase opțional |
| Auth | HMAC-SHA256 session cookie (`compliscan_session`) |
| LLM / OCR | Google Gemini + Google Cloud Vision |
| Alerte email | Resend HTTP API |
| Reglementări acoperite | GDPR · EU AI Act · e-Factura (RO) · NIS2 |

---

## 2. Structura directorului

```
CompliAI/
├── app/
│   ├── api/                    61 route handlers
│   │   ├── auth/               login · register · logout · me · switch-org · memberships · members
│   │   ├── ai-systems/         CRUD + discover + detected
│   │   ├── ai-conformity/      EU AI Act assessment
│   │   ├── scan/               extract · analyze
│   │   ├── tasks/[id]/         evidence CRUD + task update
│   │   ├── drifts/[id]/        drift lifecycle
│   │   ├── state/              baseline · drift-settings · reset
│   │   ├── exports/            compliscan · audit-pack · annex-lite
│   │   ├── integrations/       repo-sync · supabase · efactura
│   │   ├── nis2/               assessment · incidents · vendors
│   │   ├── alerts/             notify · preferences
│   │   ├── policies/           list · acknowledge
│   │   ├── health/             health check
│   │   ├── dashboard/          overview + core metrics
│   │   ├── audit-log/          event log
│   │   ├── chat/               AI assistant
│   │   ├── agent/              run · commit
│   │   ├── efactura/validate/  UBL CIUS-RO validation
│   │   ├── documents/generate/ DPA / policy generator
│   │   ├── compliance-pack/    AI pack fields
│   │   └── partner/clients/    partner view
│   │
│   ├── dashboard/              15 pagini protejate
│   │   ├── scanari/            istoric + verdicts
│   │   ├── rapoarte/           audit-vault · trust-profile
│   │   ├── alerte/             alert management
│   │   ├── conformitate/       compliance score
│   │   ├── sisteme/            AI inventory + e-Factura validator
│   │   ├── documente/          document management
│   │   ├── checklists/         compliance checklists
│   │   ├── audit-log/          event audit trail
│   │   ├── nis2/               NIS2 assessment
│   │   ├── partner/            partner management
│   │   ├── politici/           policy management
│   │   ├── generator/          DPA / GDPR generator
│   │   ├── asistent/           AI assistant chat
│   │   └── setari/             integrations · operational
│   │
│   ├── login/                  dark-mode, login + register toggle
│   ├── trust/[orgId]/          public trust profile
│   ├── genereaza-dpa/          DPA generation flow
│   └── genereaza-politica-gdpr/ GDPR policy generation flow
│
├── lib/
│   ├── server/                 51 fișiere — backend utilities
│   │   ├── auth.ts             scryptSync + HMAC session
│   │   ├── org-context.ts      getOrgContext() async (Next.js 15)
│   │   ├── mvp-store.ts        per-org state CRUD + in-memory cache
│   │   ├── nis2-store.ts       NIS2 incidents · vendors · assessment
│   │   ├── policy-store.ts     policy CRUD
│   │   ├── alert-preferences-store.ts  alert prefs per org
│   │   ├── email-alerts.ts     Resend HTTP API + console fallback
│   │   ├── gemini.ts           Gemini LLM client
│   │   ├── google-vision.ts    Vision OCR (images + PDF)
│   │   ├── efactura-anaf-client.ts  ANAF OAuth2 + upload/validate
│   │   ├── audit-pack.ts       audit pack generation
│   │   ├── scan-workflow.ts    document scan pipeline
│   │   ├── repo-sync.ts        GitHub / GitLab sync
│   │   └── ... (37 fișiere suplimentare)
│   │
│   ├── compliance/             45 fișiere — business logic
│   │   ├── engine.ts           computeDashboardSummary + normalizeState
│   │   ├── nis2-rules.ts       NIS2 scoring engine (weighted)
│   │   ├── drift-lifecycle.ts  drift state machine
│   │   ├── ai-inventory.ts     AI system records
│   │   ├── efactura-validator.ts  UBL CIUS-RO structural validation
│   │   ├── signal-detection.ts keyword + manifest analysis
│   │   └── ... (39 fișiere suplimentare)
│   │
│   ├── compliscan/             schema.ts · yaml-schema.ts
│   └── theme/                  compliscan-theme.ts
│
├── components/compliscan/      31 componente React
│   ├── dashboard-shell.tsx     sidebar + user card + logout
│   ├── ai-inventory-panel.tsx  wizard 4 pași (basic · purpose · risk · preview)
│   ├── efactura-validator-card.tsx
│   ├── scan-drawer.tsx         upload + scan
│   ├── remediation-board.tsx   task board
│   ├── export-center.tsx       exports (audit-pack · compliscan · annex-lite)
│   ├── floating-assistant.tsx  AI assistant widget
│   ├── use-cockpit.tsx         main client state hook
│   ├── scanari/                scan-history-tab · scan-verdicts-tab
│   ├── settings/               integrations-tab · operational-tab
│   └── rapoarte/               reports-support-panels
│
├── tests/
│   ├── canonical-runtime-audit.test.ts
│   ├── flow-test-kit-user-nou.test.ts
│   └── live/
│       └── google-vision.live.test.ts  (skipIf no API key)
│
├── tests/fixtures/
│   ├── images/gdpr-text-real.base64.txt   PNG 600×120, "GDPR Policy"
│   ├── pdf/sample-minimal.base64.txt      PDF stub (Vision → 400 expected)
│   └── pdf/ocr_test_compliscan.base64.txt SC Test Vision SRL, 527 chars, 10/10 câmpuri
│
└── .data/                      stocare locală per-org
    ├── users.json
    ├── orgs.json
    ├── memberships.json
    ├── compliance-state.json
    ├── state-org-{orgId}.json      (15+ fișiere)
    ├── alert-prefs-org-{orgId}.json
    └── policies-org-{orgId}.json
```

---

## 3. Arhitectură auth + multi-tenancy

```
Browser  →  Next.js Edge Middleware
              │  verifySessionToken() via crypto.subtle (Web Crypto)
              │  setea headers: x-compliscan-org-id
              │                 x-compliscan-user-email
              │                 x-compliscan-org-name
              ▼
         Route Handler / Server Component
              │  getOrgContext() — async, citește din headers()
              ▼
         readState(orgId) / writeState(orgId, state)
              │  in-memory Map cache + .data/state-org-{orgId}.json
              ▼
         [opțional] Supabase cloud sync
```

**Session token:** HMAC-SHA256, base64url, expirare 24h
**Registru local:** `.data/users.json`, `.data/orgs.json`
**Izolare org:** fișier per `orgId` — nici un org nu poate accesa starea altui org

---

## 4. Pipeline document scan (OCR)

```
POST /api/scan/extract
  │  payload: { file: base64, mimeType }
  │
  ├─ mimeType === image/* → google-vision.ts → images:annotate
  ├─ mimeType === application/pdf → google-vision.ts → files:annotate
  └─ fallback → gemini.ts (inlineData)
       │
       ▼
  createExtractedScan(state, body, actor)
       │  stochează text extras în stare
       ▼
POST /api/scan/{id}/analyze
  │  analyzeExtractedScan(state, scanId, text, actor)
  │  → signal-detection.ts (regex + keyword rules)
  │  → calculateFindingConfidence()
  └─ findings stocate în state.scans[id].findings
```

**Endpoint Google Vision:** `{eu|us}-vision.googleapis.com`
**API key:** `GOOGLE_CLOUD_VISION_API_KEY` (verificat fără leading space)
**Fixture real testat:** `ocr_test_compliscan.pdf` — 10/10 câmpuri detectate

---

## 5. Sistem alerte (email + webhook)

```
POST /api/alerts/notify
  body: { orgId, event, payload }
  │
  ├─ citește alert-prefs-org-{orgId}.json
  ├─ verifică prefs.events[event] === true
  │
  ├─ emailEnabled → sendEmailAlert(to, event, orgId, payload)
  │     │  RESEND_API_KEY prezent → POST api.resend.com/emails
  │     └─ absent → console.log (fallback silențios)
  │
  └─ webhookEnabled → fetch(webhookUrl, POST, custom payload)
```

**Evenimente suportate:** `drift.detected` · `task.overdue` · `alert.critical`
**Resend:** onboarding@resend.dev (sender) → vaduvadaniel10@yahoo.com (destinatar configurat)
**Org configurat:** `org-96d5827110b0fb7f` (Marketing HUB)

---

## 6. Modul NIS2

### Scoring engine (`lib/compliance/nis2-rules.ts`)
- **20 întrebări** grupate pe domenii (governance, risk, incident, supply-chain, continuity, crypto, access, monitoring, awareness, response)
- **Ponderi 1–3** — întrebările critice au greutate mai mare
- **Răspunsuri:** `yes` = 100% · `partial` = 40% · `no` = 0%
- **Praguri maturitate:**
  - `non-conform` < 25%
  - `initial` < 50%
  - `partial` < 75%
  - `robust` ≥ 75%

### Store (`lib/server/nis2-store.ts`)
- Fișier per org: `.data/nis2-{orgId}.json`
- **Incidente:** prepend order, SLA auto-calculat (+24h critical, +72h high)
- **Vendori:** risk levels (critical · high · medium · low), boolean flags (gdprDpa, slaReview)

### API routes
| Endpoint | Metode | Descriere |
|---|---|---|
| `/api/nis2/assessment` | GET · POST | scoring + salvare răspunsuri |
| `/api/nis2/incidents` | GET · POST | list + create |
| `/api/nis2/incidents/[id]` | PATCH · DELETE | update + delete |
| `/api/nis2/vendors` | GET · POST | list + create |
| `/api/nis2/vendors/[id]` | PATCH · DELETE | update + delete |

---

## 7. e-Factura (ANAF + UBL CIUS-RO)

### Validator local (`lib/compliance/efactura-validator.ts`)
Validare structurală completă UBL: root element, CustomizationID, InvoiceTypeCode, ID, IssueDate, DocumentCurrencyCode, AccountingSupplierParty, AccountingCustomerParty, TaxTotal, LegalMonetaryTotal, InvoiceLines, PaymentMeans, CompanyID.

### Client ANAF (`lib/server/efactura-anaf-client.ts`)
- **OAuth2 Authorization Code** cu CertSign (browser-based)
- **Endpoint validare (SAFE):** `POST /prod/FCTEL/rest/validare` — zero efect fiscal
- **Endpoint upload (REAL):** `POST /prod/FCTEL/rest/upload` — NU se apelează în teste
- **Mock mode:** returnează `{ uploadIndex: "mock-0000000001", mock: true }` dacă lipsesc credențialele
- **Credențiale necesare:** `ANAF_CLIENT_ID`, `ANAF_CLIENT_SECRET`, CUI (fără prefix RO)

---

## 8. Inventar teste

| Domeniu | Fișiere test | ~Teste |
|---|---|---|
| API routes (auth) | 4 | 45 |
| API routes (NIS2) | 5 | 67 |
| API routes (alerts) | 2 | 31 |
| API routes (altele) | 12 | 84 |
| lib/server | 14 | 89 |
| lib/compliance | 8 | 59 |
| tests/ (integrare) | 2 | 9 |
| tests/live (Google Vision) | 1 | 6 |
| **Total** | **~48** | **~356** |

**Live tests:** `tests/live/google-vision.live.test.ts`
- Skip automat dacă `GOOGLE_CLOUD_VISION_API_KEY` lipsește
- Rulare manuală: `DOTENV_CONFIG_PATH=.env.local npx vitest run tests/live/google-vision.live.test.ts`
- Confirmat funcțional: 10/10 câmpuri din `ocr_test_compliscan.pdf` detectate

---

## 9. Variabile de mediu (`.env.local`)

| Variabilă | Utilizare |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `GEMINI_API_KEY` | Google Gemini LLM |
| `GEMINI_MODEL` | Model ID (gemini-3.1-flash-lite-preview) |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project |
| `GOOGLE_CLOUD_VISION_LOCATION` | Region endpoint (eu) |
| `GOOGLE_CLOUD_VISION_API_KEY` | Vision OCR API key |
| `COMPLISCAN_AUTH_BACKEND` | `supabase` / `local` / `hybrid` |
| `COMPLISCAN_DATA_BACKEND` | `supabase` / `local` |
| `COMPLISCAN_ALLOW_LOCAL_FALLBACK` | boolean |
| `COMPLISCAN_SESSION_SECRET` | HMAC session secret |
| `RESEND_API_KEY` | Email alerts (Resend) |
| `ALERT_EMAIL_FROM` | Sender address |
| `ANAF_CLIENT_ID` | *(neconfigurat)* ANAF OAuth app |
| `ANAF_CLIENT_SECRET` | *(neconfigurat)* ANAF OAuth secret |

---

## 10. Decizii arhitecturale cheie

| Decizie | Rațional |
|---|---|
| Per-org state files (`.data/`) | Multi-tenancy simplu fără overhead DB |
| HMAC session tokens (stateless) | Funcționează pe Edge Runtime (no Node APIs) |
| `headers()` async (Next.js 15) | Breaking change — `await headers()` obligatoriu |
| In-memory Map cache + disk | Performanță + persistență fără Redis |
| Supabase opțional | Local fallback — app funcționează fără cloud |
| `sendEmailAlert()` cu fallback console | Nu blochează dacă Resend lipsește |
| `describe.skipIf(!HAS_KEY)` în live tests | CI nu eșuează fără API keys externe |
| Mock mode în efactura-anaf-client | Testare fără credențiale ANAF reale |

---

## 11. Gap-uri identificate

| Gap | Severitate | Notă |
|---|---|---|
| ANAF e-Factura live test neconfigurat | Medie | Lipsesc `ANAF_CLIENT_ID` / `SECRET` |
| OpenAPI / Swagger schema absent | Mică | Documentație API lipsă |
| Logging centralizat minimal | Mică | `operational-logger.ts` există dar basic |
| Agent/LLM features incomplete | Mică | `agent-run`, `agent-commit` parțiale |
| Email sender neautentificat (onboarding@resend.dev) | Mică | Domeniu propriu recomandat în producție |

---

*Audit generat de Claude Code · CompliAI v0 · 2026-03-17*
