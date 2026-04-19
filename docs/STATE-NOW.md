# STATE-NOW.md — CompliAI inventar complet (2026-04-19)

> **Documentul ăsta e harta rece a ceea ce EXISTĂ în cod, acum.**
> Nu e wish-list, nu e canon, nu e docs vechi. Este adevărul — generat din citire sistematică pe 4 agenți paraleli.
>
> Folosește-l ca referință când deciziăm ce păstrăm / tăiem / consolidăm. Când apare DESTINATION.md, se consultă împreună cu acesta.

---

## 0. EXECUTIVE SUMMARY (la rece)

**Dimensiune totală**:
- **192 endpoint-uri API** (83% funcționale)
- **76 pagini** (57% accesibile din sidebar)
- **86 componente** (15 primitive + 24 page-surfaces + 46 widgets + 1 neutilizat)
- **16 cron-uri** (100% active)
- **278 fișiere lib** (126 compliance + 152 server — ~86% în producție)
- **376 fișiere `.data/*.json`** (~130 orfane — seed/demo/test leftovers)
- **8 integrări externe active** (Supabase, ANAF, EUR-Lex, DNSC, Resend, Sentry, Google Vision, Gemini)

**Adevărul brutal**:
- **Backend-ul e ~85-90% matur**. Motor, cron-uri, integrări — toate merg.
- **UI-ul e ~57% integrat în nav**. Restul sunt pagini orfane funcționale.
- **Nu sunt "rupturi masive"**. Sunt **fragmentare vizuală** + **lipsa agregării pentru partner**.
- **Stripe e menționat în API routes dar NU implementat în lib** — single major inconsistency.

---

## 1. STORAGE & DATE

### 1.1 Backend primar
- **Supabase** configurat și activ în `.env.local`
  - URL: `https://kvdcphbgogyckbltpjxc.supabase.co`
  - `COMPLISCAN_DATA_BACKEND=supabase` (default)
  - `COMPLISCAN_AUTH_BACKEND=supabase` (default)
  - `COMPLISCAN_ALLOW_LOCAL_FALLBACK=false` (prod)

### 1.2 File fallback
- Path: `.data/*.json` (376 fișiere acum pe disc)
- Pattern: `state-org-{orgId}.json`, `notifications-org-{orgId}.json`, `agent-runs-org-{orgId}.json`, `orgs.json`, `users.json`, `memberships.json`, `claim-invites.json`
- Trigger: `lib/server/supabase-tenancy.ts:10-30` → `lib/server/storage-adapter.ts:84-120`
- Cache: `Map<orgId, ComplianceState>` în memorie per request

### 1.3 Supabase tables

| Table | Scop | RLS | Access Layer |
|---|---|---|---|
| `public.organizations` | Firme (inclusiv portofoliu partener) | Member select | `supabase-tenancy.ts` |
| `public.profiles` | Utilizatori (extins auth.users) | Self CRUD | `supabase-tenancy.ts` |
| `public.memberships` | User→Org cu rol (owner, partner_manager, compliance, reviewer, viewer) | Member select, admin update | `supabase-tenancy.ts` |
| `public.org_state` | State compliance (findings, tasks, controls) | Member select, operator write | `supabase-org-state.ts` |
| `public.evidence_objects` | Fișiere evidence | Member select, operator CRUD | `supabase-evidence.ts` |
| `public.policy_acknowledgments` | Politici semnate | Implicit RLS | `policy-store.ts` |
| `compliscan.app_state` | Legacy cloud fallback | Service role only | `mvp-store.ts:315-330` |

### 1.4 Session & Auth
- Cookie: `compliscan_session` (httpOnly, HMAC-SHA256, base64url)
- TTL: 7 zile
- Payload: `{userId, orgId, email, orgName, role, membershipId?, userMode?, workspaceMode?, exp}`
- Rol-uri: `owner | partner_manager | compliance | reviewer | viewer`
- Partner/Compliance au RLS operator write pe `org_state`

### 1.5 Date orfane (cleanup candidate)
- ~130 fișiere `.data/*.json` cu prefix `smoke-*`, `demo-*`, `flow-kit-*`
- ~40-50 `state-org-*.json` ale căror org ID nu există în `orgs.json`

### 1.6 Riscuri tehnice
1. **Cache in-memory fără invalidare cross-request** — agenți concurenți pot race pe același org
2. **Silent write failures** la cloud-primary — scriere pe disc fără alertă dacă Supabase e down
3. **Fără transaction boundary** pe mutații multi-record (register = 3 writes secvențiale, no rollback)

---

## 2. API ENDPOINTS (192 total)

### 2.1 Scor global
- ✅ **160 funcționale** (83%)
- 🟡 **18 backend-only** (9%, fără UI wire)
- 🟠 **8 stub/minimal** (4%)
- ❌ **2 moarte** (1%)
- ⚠️ **4 suspecte** (2%)

### 2.2 Domenii principale (tabel condensat)

| Domeniu | Endpoint-uri | Status |
|---|---|---|
| **Auth** (login, register, session, claim) | 17 | ✅ complete |
| **Dashboard + Portfolio** | 11 | ✅ complete |
| **Org + Settings** | 6 | ✅ complete |
| **Findings + Remediation** | 4 | ✅ complete |
| **Tasks + Evidence** | 6 | ✅ complete |
| **Documents** | 5 | ✅ complete |
| **Reports + Exports** | 17 | ✅ 16 / 🟡 1 |
| **Approvals** | 4 | ✅ complete |
| **Notifications + Alerts** | 8 | ✅ 7 / 🟡 1 |
| **Scanning + Site-scan** | 6 | ✅ complete |
| **Policies** | 3 | ✅ complete |
| **NIS2** (assessment, governance, vendors, incidents, DNSC) | 16 | ✅ 15 / 🟡 1 |
| **AI Act + Shadow AI** | 11 | ✅ 10 / 🟡 1 |
| **Fiscal + ANAF** | 12 | ✅ complete |
| **e-Factura** | 6 | ✅ complete |
| **Partner + Multi-Client** | 12 | ✅ 11 / 🟡 1 (duplicate) |
| **DSAR** | 5 | ✅ complete |
| **DORA** | 6 | ✅ complete |
| **Vendor Review** | 5 | ✅ complete |
| **Whistleblowing** | 5 | ✅ complete |
| **HR + Pay Transparency** | 7 | ✅ complete |
| **Review Cycles** | 4 | ✅ complete |
| **Account** (GDPR rights) | 3 | ✅ complete |
| **Cron-uri** | 16 | ✅ complete |
| **Agents** | 5 | ✅ 3 / 🟡 2 / 🟠 1 (legacy `/agent/run`) |
| **Plan + Stripe** | 4 | ⚠️ Stripe endpoints există, lib nu |
| **Chat** | 1 | ✅ functional |
| **Misc/Utilities** | 14 | ✅ mostly |

### 2.3 Duplicate API identificate (3)
1. `POST /api/partner/import-csv` vs `POST /api/partner/import-csv/preview` — neclar care e canonic
2. `GET /api/dashboard/core` vs `GET /api/dashboard/route` — probabil dupe
3. `GET /api/partner/import/preview` vs `POST /api/partner/import-csv/preview` — preview pe ambele

### 2.4 Flagged pentru review manual (5)
1. `POST /api/agent/run` — legacy wrapper?
2. `POST /api/portfolio/batch` — backend-only, zero UI
3. `POST /api/exports/audit-pack/bundle` — minimal implementation
4. `POST /api/account/delete-data` — ireversibil, verifică GDPR flow
5. `GET /api/benchmark` — neclar dacă datele sunt fresh

---

## 3. PAGINI & UI (76 pagini)

### 3.1 Coverage navigare
- **21 pagini** în sidebar primar (dashboardPrimaryNavItems)
- **22 pagini** în secondary nav (dashboardSecondaryNavSections, portfolioNavItems)
- **14 pagini** orfane (funcționale, dar nu linkate nicăieri)
- **7 pagini** RO duplicate (redirect la EN)
- **12 pagini** parțiale/stub

### 3.2 Pagini orfane confirmate (14)
Aici **există cod funcțional dar NU există link** din sidebar → user trebuie să tasteze URL:

| Rută | Scop | Linii |
|---|---|---|
| `/dashboard/alerte` | Drift-uri active | 482 |
| `/dashboard/calendar` | Scheduler compliance | medium |
| `/dashboard/checklists` | Incident response | 221 |
| `/dashboard/conformitate` | AI Act conformity | 444 |
| `/dashboard/sisteme` | AI inventory + eFactura validator | **1.509** |
| `/dashboard/sisteme/eu-db-wizard` | EU DB wizard | - |
| `/dashboard/nis2/maturitate` | NIS2 maturity | - |
| `/dashboard/nis2/governance` | NIS2 governance | - |
| `/dashboard/nis2/eligibility` | NIS2 eligibility | - |
| `/dashboard/nis2/inregistrare-dnsc` | DNSC registration | - |
| `/dashboard/dsar` | DSAR handling | - |
| `/dashboard/fiscal` | Fiscal monitoring | **1.806** |
| `/dashboard/asistent` | AI assistant | 352 |
| `/dashboard/vendor-review` | Vendor reviews | - |

### 3.3 Duplicate RO/EN (7 — ștergere sigură cu redirect 301)
1. `/dashboard/setari` → `/dashboard/settings`
2. `/dashboard/setari/abonament` → `/dashboard/settings/abonament`
3. `/dashboard/scanari` → `/dashboard/scan`
4. `/dashboard/politici` → `/dashboard/reports/policies`
5. `/dashboard/rapoarte` → `/dashboard/reports`
6. `/dashboard/rapoarte/auditor-vault` → `/dashboard/reports/vault`
7. `/dashboard/rapoarte/trust-profile` → `/dashboard/reports/trust-center`

### 3.4 Pagini-monstru (linii per fișier, candidate la refactor)
- `/dashboard/nis2/page.tsx` — **2.800 linii**
- `/dashboard/fiscal/page.tsx` — **1.806 linii**
- `/dashboard/sisteme/page.tsx` — **1.509 linii**
- `components/compliscan/settings-page.tsx` — **1.985 linii**
- `components/compliscan/portfolio-overview-client.tsx` — **977 linii**
- `/dashboard/page.tsx` (home) — **706 linii**
- `components/compliscan/resolve-page.tsx` — **641 linii**

### 3.5 Pagini publice fără auth
- `/`, `/login`, `/register`, `/reset-password`
- `/pricing`, `/privacy`, `/terms`, `/dpa`
- `/claim`, `/demo/[scenario]`, `/shared/[token]`, `/whistleblowing/[token]`
- `/trust/[orgId]`, `/trust`
- `/genereaza-dpa`, `/genereaza-politica-gdpr` (landing SEO — unused in UI flow)

### 3.6 Componente (86 total)

| Tip | Număr | Exemple |
|---|---|---|
| **Primitive** | 15 | `ce-badge`, `dashboard-breadcrumb`, `legal-disclaimer`, `logo`, `mobile-bottom-nav`, `notification-bell` |
| **Page-surfaces** | 24 | `resolve-page`, `scan-page`, `settings-page`, `portfolio-overview-client`, `dosar-page`, etc. |
| **Widgets** | 46 | `nis2-cockpit-card`, `drift-active-card`, `ai-inventory-panel`, `import-wizard`, `next-best-action`, etc. |
| **Neutilizate** | 1 | `inspector-mode-panel` (dev/debug only) |
| **Legacy/bridging** | 1 | `legacy-workspace-bridge` (backward compat) |

---

## 4. CRON-URI (16, toate active)

### 4.1 Cadență
| Cron | Cadență | Scop | Status |
|---|---|---|---|
| `agent-orchestrator` | Zilnic 06:00 | Rulează 5 agenți (compliance_monitor, fiscal_sensor, document, vendor_risk, regulatory_radar) | ✅ |
| `drift-sweep` | Zilnic 06:00 | Scan drift-uri, reopen findings | ✅ |
| `vendor-review-revalidation` | Zilnic 07:00 | Overdue vendor reviews | ✅ |
| `legislation-monitor` | Zilnic 07:00 | EUR-Lex + DNSC → notificări + drift triggers | ✅ |
| `score-snapshot` | Zilnic 07:50 | Salvează score + email dacă scade ≥3 | ✅ |
| `daily-digest` | Zilnic 08:00 | Email conditional (doar dacă se schimbă ceva) | ✅ |
| `renewal-reminder` | Zilnic 09:00 | Email 7 zile înainte de renewal | ✅ |
| `agent-regulatory-radar` | Săptămânal Mi 07:00 | Radar EUR-Lex + DNSC per org | ✅ |
| `inspector-weekly` | Săptămânal Lu 08:00 | Simulează auditor, email dacă verdict ≠ ready | ✅ |
| `weekly-digest` | Săptămânal Lu 08:30 | Digest săptămânal + NIS2 SLA warnings | ✅ |
| `audit-pack-monthly` | Lunar ziua 1, 09:00 | Auto-generare audit pack + email | ✅ |
| `partner-monthly-report` | Lunar ziua 2, 09:00 | Raport agregat pentru partener | ✅ |
| `monthly-digest` | Lunar ziua 3, 09:00 | Email lunar + eveniment extern | ✅ |
| `efactura-spv-monthly` | Lunar ziua 15, 06:00 | SPV status + findings facturi respinse | ✅ |
| `vendor-sync-monthly` | Lunar ziua 15, 09:00 | Detectează vendori noi, creează DPA findings | ✅ |
| `scheduled-reports` | Orar | Rulează rapoartele programate | ✅ |

### 4.2 Ce lipsește UI-wise
Output-urile cron-urilor se agregează în:
- `notifications-org-{orgId}.json` (per-org)
- Emails via Resend
- `state-org-{orgId}.json` (findings reopened, drift-uri)

**PROBLEMA**: nu există **UI agregat cross-portfolio** pentru partner. Un consultant cu 20 clienți **nu poate vedea într-un singur loc** ce au produs cron-urile astea. Asta e **gap-ul #1** vs Diana JTBD.

---

## 5. ENGINE & LIBRARIES

### 5.1 `lib/compliance/` — 126 fișiere
- ✅ **~100 în producție** (applicability, engine, findings, types, finding-confidence/resolution, task-ids/validation/resolution/auto-apply, agents — 5 active, NIS2, SAFT, e-Factura, AI Act, vendor)
- 🟡 **~20 doar în teste** (drift-policy, evidence-quality test fixtures, smoke-test-e2e)
- ❌ **6 candidate dead** (`Separator.tsx` gol; unele re-exporturi)

### 5.2 `lib/server/` — 152 fișiere
- ✅ **~140 în producție**
- 🟡 **~10 stub/demo** (efactura-mock-data, demo-seed, ocr-fallback)
- ❌ **0 moarte** (toate importate undeva)

### 5.3 Module centrale ("heavy")
| Modul | Scop | Risc |
|---|---|---|
| `lib/server/agent-orchestrator.ts` (~800 linii) | Rulează 5 agenți + auto-actions | Central — bug aici afectează toate cron-urile |
| `lib/compliance/engine.ts` (~1000 linii) | State normalization + dashboard summary | Folosit în 10+ cron-uri |
| `lib/server/auth.ts` (~1200 linii) | Backend abstraction (local/Supabase hybrid) | Complex tenancy |
| `lib/compliance/agentic-engine.ts` (~600 linii) | Agent type system + trigger framework | 5 agenți depind de aici |
| `lib/server/drift-trigger-engine.ts` (~700 linii) | Drift state machine | Folosit în 2+ cron-uri |

### 5.4 Agenți AI (5)
| Agent | Rol | Trigger |
|---|---|---|
| `compliance_monitor` | Detectează expiry, degradări, gap-uri | Daily (06:00) |
| `fiscal_sensor` | Monitor e-Factura, detect rejections | Daily (06:00) |
| `document` | Generare documente proactive, versioning | Daily (06:00) |
| `vendor_risk` | Re-scor vendori, DPA tracking | Daily (06:00) |
| `regulatory_radar` | EUR-Lex + DNSC weekly scan | Weekly (Mi 07:00) |

---

## 6. INTEGRĂRI EXTERNE (9)

| Integrare | Status | Env Vars | Folosit pentru |
|---|---|---|---|
| **Supabase** | ✅ Activ | `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY` | Auth, state, evidence, tenancy |
| **ANAF (TVA Lookup)** | ✅ Activ | Niciuna (endpoint public) | Verificare firme, prefill profil |
| **e-Factura SPV** | ✅ Conditional | `ANAF_CLIENT_ID`, `ANAF_CLIENT_SECRET`, `ANAF_ENV`, `ANAF_ALLOW_REAL_SUBMIT` | Vendor signals, invoice status — stubbed în dev |
| **EUR-Lex** | ✅ Activ | Niciuna (SPARQL public) | Legislation monitor |
| **DNSC** | ✅ Activ | Niciuna (HTML scrape) | NIS2 announcements |
| **Resend** | ✅ Activ | `ALERT_EMAIL_FROM` | Email delivery |
| **Sentry** | ✅ Activ | `NEXT_PUBLIC_SENTRY_DSN` | Errors, cron telemetry |
| **Google Vision** | ✅ Activ | Credențiale GCP | OCR documente |
| **Gemini LLM** | ✅ Activ | `GEMINI_API_KEY` (implicit) | Clasificare sector, analiză AI |
| **Stripe** | ⚠️ **MIXED** | - | API routes există (`/api/stripe/checkout`, `/portal`, `/webhook`), **lib/server/ NU conține Stripe client** — flag manual |
| **PostHog/Amplitude** | 🟡 Stub | - | Analytics opțional |

---

## 7. ORFANI, DUPLICATE, DEAD CODE

### 7.1 Fișiere moarte confirmate (candidate ștergere rapidă)
- `lib/compliance/Separator.tsx` — fișier gol (0 bytes)
- `components/compliscan/inspector-mode-panel.tsx` — dev-only
- `components/compliscan/legacy-workspace-bridge.tsx` — backward compat, usage declining

### 7.2 Candidate la merge/consolidare
- **NIS2 fragmentat pe 5 pagini** (`/nis2`, `/maturitate`, `/governance`, `/eligibility`, `/inregistrare-dnsc`) → 1 pagină cu tab-uri
- **AI fragmentat pe 3 pagini** (`/sisteme`, `/conformitate`, `/sisteme/eu-db-wizard`) → 1 pagină cu tab-uri
- **Reports fragmentat pe 5 pagini** (`/reports`, `/vault`, `/audit-log`, `/policies`, `/trust-center`) → fuziune în `/dosar`
- **API duplicate** (3 identificate — vezi §2.3)

### 7.3 Pagini fără trafic clar (review manual)
- `/dashboard/asistent` (352 linii)
- `/dashboard/checklists` (221 linii)
- `/dashboard/partner` + `/dashboard/partner/[orgId]` (vs `/portfolio`)
- `/dashboard/findings/[id]` (vs `/dashboard/resolve/[findingId]`)

---

## 8. ALINIERE CU DIANA JTBD (din scenariile precedente)

| Job | Coverage |
|---|---|
| J1: Inbox agregat cross-client | 🟡 backend există, UI nu |
| J2: Triage urgențe cross-client | ✅ `/api/partner/urgency-queue` + UI |
| J3: Răspuns rapid client (messaging) | ❌ |
| J4: Log intervenții audit | ✅ Dosar + audit log |
| J5: Alertă legislativă auto | ✅ cron `legislation-monitor` + `regulatory-radar` |
| J6: Auto-map clienți afectați | 🟠 backend da, UI view nu |
| J7: Broadcast către afectați | 🟠 notificări per-org, UI broadcast nu |
| J8: Reopen automat pe lege nouă | ✅ `drift-trigger-engine` |
| J9: Onboarding rapid client | 🟠 merge dar e batch-structured |
| J10: Intake structurat 10-15 întrebări | 🟠 există solo, skip-uit partner |
| J11: Raport diagnostic 1 pagină | ❌ |
| J12: Batch raport lunar | ✅ `scheduled-reports` + manager |
| J13: Conținut pre-populat | 🟡 auto-fill da, selecție auto nu |
| J14: White-label | ✅ `/api/partner/white-label` |
| J15: Portal client delivery | 🟡 email da, portal vizual nu |
| J16: Register DSAR | ✅ |
| J17: Generate răspuns DSAR | ✅ `/api/dsar/[id]/draft` |
| J18: Validare checklist Art. 15 | 🟡 2 flags, nu checklist complet |
| J19: Închidere DSAR cu evidence | ✅ |

**Aliniere totală: ~58%** (9 ✅, 4 🟡, 4 🟠, 2 ❌)

Cel mai bine acoperit: **DSAR (87%)**, **Rapoarte lunare (75%)**.
Cel mai slab: **Client nou onboarding (33%)**, **Inbox dimineață (50%)**.

---

## 9. CE FACE COMPLIAI **ÎN PLUS** față de Diana JTBD

Funcționalități care EXISTĂ dar nu apar în JTBD Diana explicit:
- **DORA framework complet** (dashboard/dora, incidents, TPRM) — pentru fintech reglementate
- **AI Act Annex IV submission** (`/api/ai-act/prepare-submission`)
- **Shadow AI detection** (`/api/shadow-ai`)
- **Pay transparency D1256** (EU directive)
- **HR/REGES reconciliation**
- **Whistleblowing channel public** (endpoint anonim)
- **Trust Center public profile** (`/trust/[orgId]`)
- **Audit pack PDF export**
- **Vendor library prebuilt** (`lib/compliance/vendor-library.ts`)
- **GitHub/GitLab repo sync** (`/api/integrations/repo-sync`)
- **Scheduled reports UI manager**
- **Approvals queue** (semi-auto dispatching)
- **Compliance Q&A chat** (`/api/chat` — Claude-backed)
- **AI Compliance Pack generator**
- **Counsel brief generator** (`/api/reports/counsel-brief`)
- **Inspector tool** (code analysis)
- **Benchmark compliance** (peer comparison)

Multe dintre astea **sunt valoroase pentru compliance officer intern (Radu)** — nu pentru Diana direct, dar nu sunt dead. Decizia "păstrăm / ascundem / ștergem" depinde de care persone vor fi suportate în DESTINATION.

---

## 10. VERDICT FINAL ȘI RECOMANDĂRI PRIMARE

### 10.1 Ce e solid (NU atingem)
- Backend auth, multi-tenancy, Supabase integration
- Toate 16 cron-uri
- Agentic engine (5 agenți)
- Applicability engine + intake-engine + finding-kernel
- ANAF company lookup + company data enrichment
- e-Factura validator XML
- Drift-trigger engine
- Document generator
- Evidence storage
- DSAR lifecycle

### 10.2 Ce e fragmentat (UI consolidate, NU rewrite)
- 14 pagini orfane → în majoritate categorii de findings sau view-uri în drill-in client
- NIS2 / AI / Reports → fuzionează pe tab-uri
- 5 pagini-monstru (>700 linii) → split în componente

### 10.3 Ce lipsește real (construim nou, ~1 săpt)
- **Inbox agregat cross-client** (`/inbox`) — feature "omg yes"
- **Broadcast UI** când apare lege nouă ("afectează 7 din 23, trimite notificare")
- **Quick-add client** (1 CUI → 3 secunde → dashboard)
- **Raport diagnostic 1-pagină** pentru client nou (auto-generat din ANAF + website scrape)

### 10.4 Ce tăiem fără frecare
- 7 pagini RO duplicate (redirect 301)
- `Separator.tsx` empty
- ~130 `.data/*.json` fișiere seed/demo orfane (curățenie dev env)
- 3 API duplicate (după verificare manuală)

### 10.5 Ce cerem decizie de produs pentru (NU codăm încă)
- Păstrăm `/dashboard/asistent` (AI chat)? Prin `/api/chat` funcționează, dar nu e în JTBD Diana.
- Păstrăm `/dashboard/partner` vs fuzionare cu `/portfolio`?
- Păstrăm toate features "în plus" (§9) sau ascundem după persona?
- Stripe — implementăm billing live sau pliem pe `/api/stripe/*` mock?

---

## APENDICE A: Fișiere sursă scanate (agenți paraleli)

- Agent 1 (API routes): `/app/api/**/route.ts` — 192 fișiere
- Agent 2 (Pages + Components): `/app/**/page.tsx` (76) + `/components/compliscan/*.tsx` (86)
- Agent 3 (Crons + Engine): `/app/api/cron/*/route.ts` (16) + `/lib/compliance/*` (126) + `/lib/server/*` (152)
- Agent 4 (Data stores): `.env.local` + `supabase/*.sql` + `.data/*.json` + `/lib/server/*-store.ts`, `/lib/server/mvp-store.ts`, `/lib/server/supabase-*.ts`, `/lib/server/auth.ts`

## APENDICE B: Surse de adevăr secundare
- `docs/adevar inghetat/` — 9 fișiere (persona + user matrix) — **context, NU mandat**
- `docs/canon-final/` — 15+ fișiere — **referință arhivată**
- 199 fișiere `.md` total în proiect — **99% duplicat / stale**

> **END STATE-NOW.md** — ultima generare 2026-04-19.
