# CompliAI — Funcționalități Ready for Market

**Data:** 1 aprilie 2026  
**Sursă:** Audit complet al codebase-ului (nu din documentație, ci din cod real)  
**Total API routes:** 168 | **Total pagini dashboard:** 51 | **Cron jobs:** 16

---

## A. Autentificare & Onboarding

### A1. Autentificare completă
- **Register** — email + parolă, creare org automată
- **Login** — sesiune cookie HMAC-SHA256, httpOnly
- **Logout** — invalidare sesiune
- **Forgot/Reset password** — flow complet cu token
- **Session refresh** — `refreshSessionPayload()` la fiecare request
- **API:** `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/me`
- **Storage:** `.data/users.json` + Supabase `users`/`organizations`/`memberships`

### A2. Multi-tenant & Workspace
- **Workspace switching** — switch între organizații
- **Select workspace** — alegere workspace activ
- **Member management** — invite, update role, remove
- **Roles:** owner, partner_manager, compliance, reviewer, viewer
- **Claim invite** — accept invitație în org
- **API:** `/api/auth/select-workspace`, `/api/auth/switch-org`, `/api/auth/members`, `/api/auth/memberships`, `/api/auth/claim-invite`, `/api/auth/claim-accept`

### A3. Onboarding
- **Wizard multi-step:** selectare mod (solo/partner/compliance) → profil org → applicability
- **CUI lookup ANAF** — enrichment automat (nume firmă, adresă, CAEN, statut fiscal, TVA, e-Factura)
- **Website prefill** — normalizare URL, AI compliance pack
- **Applicability engine** — evaluare automată ce reglementări se aplică (GDPR, NIS2, AI Act, e-Factura, Pay Transparency)
- **API:** `/api/org/profile` (GET/POST), `/api/org/profile/prefill`, `/api/anaf/lookup`
- **UI:** `/onboarding`

---

## B. Dashboard Principal

### B1. Home
- **Compliance score** cu trend (delta 30 zile)
- **Risk label** (low/medium/high/critical)
- **Open alerts** counter
- **Risk trajectory widget** — grafic predictiv
- **Next best action** — CTA inteligent per stare
- **Recent activity feed**
- **Quick actions** — scanare, rezolvare, dosar
- **API:** `/api/dashboard` (payload complet), `/api/dashboard/core`, `/api/dashboard/urgency`, `/api/dashboard/accumulation`
- **UI:** `/dashboard`

### B2. Compliance Calendar
- **Deadlines** — per finding, per reglementare
- **Review cycles** — date programate
- **Monitoring dates** — next check per finding
- **API:** `/api/dashboard/calendar`
- **UI:** `/dashboard/calendar`

---

## C. Scanare & Detecție

### C1. Document Scan
- **Upload document** (PDF, DOC, TXT)
- **AI extraction** — Gemini engine
- **Analiză compliance** — detectare gaps per framework
- **Rezultate scan** — findings generate automat
- **Istoric scanări** — toate scanările anterioare
- **API:** `/api/scan` (POST), `/api/scan/[id]/analyze`, `/api/scan/extract`
- **UI:** `/dashboard/scan`, `/dashboard/scan/results/[scanId]`, `/dashboard/scan/history`

### C2. Site Scan (Website Privacy)
- **Scanare website** — cookies, privacy policy, tracking
- **Detectare automată** — lipsa cookie banner, politici lipsă
- **Generare findings** — GDPR website compliance
- **API:** `/api/site-scan` (POST), `/api/site-scan/[jobId]`

### C3. AI System Discovery
- **Shadow AI detection** — detectare instrumente AI folosite
- **Repo sync** — GitHub/GitLab integration pentru detectare AI dependencies
- **API:** `/api/ai-systems/discover`, `/api/shadow-ai`, `/api/integrations/repo-sync`

### C4. Baseline Scan
- **Scanare completă** org — toate frameworks aplicabile
- **Snapshot validat** — baseline pentru drift detection
- **API:** `/api/state/baseline`

---

## D. Findings & Smart Resolve Cockpit

### D1. Finding Engine
- **Finding types** — 30+ tipuri canonice: GDPR-001→023, EF-001→006, NIS2-001→015, AI-005, PAY-001, HR-001→003, CROSS-GENERIC
- **Finding kernel** — `classifyFinding()`, `getFindingTypeDefinition()`, `getResolveFlowRecipe()`, `deriveCockpitUIState()`
- **Resolution modes:** `in_app_guided`, `external_action`, `needs_revalidation`, `auto_closeable`
- **Resolution locus:** `in_app`, `hybrid`, `external_controlled`
- **Close conditions** per tip — nu se închide finding fără dovadă
- **Evidence kinds:** `generated_document`, `confirmation`, `external_link`, `upload`, `note`
- **Source confidence** — nivelul de certitudine al detecției
- **API:** `/api/findings/[id]` (GET/PATCH)

### D2. Resolve Cockpit
- **Detail panel** — titlu, severitate, categorie, legalReference, impactSummary
- **Mini-stepper** — Confirmi → Pregătești → Verifici → Dosar → Monitorizat
- **Hero CTA** — acțiunea principală per tip (generează document / încarcă dovadă / handoff extern)
- **Evidence block** — upload, note, link extern, document generat
- **Document generator inline** — generează politica/documentul direct în cockpit
- **Resolution approval** — user confirmă dovada
- **Success moment** — finding → resolved → Dosar
- **Monitoring handoff** — nextMonitoringDateISO, revalidation trigger
- **Reopen path** — reintră în același cockpit la drift/expirare
- **UI:** `/dashboard/resolve`, `/dashboard/resolve/[findingId]`
- **API:** `/api/findings/[id]` (PATCH status transitions)

### D3. Task & Evidence Management
- **Task per finding** — acțiuni concrete de rezolvare
- **Evidence upload** — fișiere, note, linkuri
- **Evidence validation** — checklist structură/conținut
- **API:** `/api/tasks/[id]`, `/api/tasks/[id]/evidence`

---

## E. Generare Documente

### E1. Generator Asistat AI
- **Tipuri document:** privacy-policy, dpa, ropa, cookie-policy, data-breach-notification, dsar-response, ai-system-card, pay-gap-report, job-description, whistleblowing-policy, NIS2 policies, DORA policies
- **Generare Markdown** — conținut specific per framework
- **Rescanare** — documentul generat este reverificat
- **API:** `/api/documents/generate` (POST)
- **UI:** `/dashboard/generator`

### E2. Document Adoption Flow
- **Draft → Approved → Active** — lifecycle complet
- **Approval as evidence** — documentul devine dovadă pentru finding
- **Signed/Active tracking** — status adopție
- **PDF export** — orice document
- **API:** `/api/documents/[id]`, `/api/documents/[id]/adoption`, `/api/documents/export-pdf`
- **UI:** `/dashboard/documente`

### E3. Politici Interne
- **Listă politici** — toate documentele de tip policy
- **Acknowledge** — angajații pot confirma lectură
- **API:** `/api/policies`, `/api/policies/acknowledge`
- **UI:** `/dashboard/reports/policies`

---

## F. Fiscal / e-Factura / SPV

### F1. Validator e-Factura
- **Upload XML** — validare structurală completă UBL CIUS-RO
- **17 verificări:** root element, CustomizationID, InvoiceTypeCode, ID, IssueDate, DocumentCurrencyCode, parties, TaxTotal, LegalMonetaryTotal, InvoiceLines, PaymentMeans, CompanyID
- **Raport erori** cu explicații clare
- **API:** `/api/efactura/validate`
- **UI:** `/dashboard/sisteme` (EFacturaValidatorCard)

### F2. Repair e-Factura
- **Propunere repair** — corecții automate
- **Approval-gated** — nu se aplică fără aprobare
- **API:** `/api/efactura/repair`

### F3. Submit SPV (ANAF)
- **ANAF OAuth2** — connect + callback
- **Token secure handling** — refresh automat
- **Approval-gated submit** — LOCKED_OVERRIDES (manual always)
- **Status polling** — verificare stare transmitere
- **Finding auto-update** — pe "ok" → finding under_monitoring; pe "nok" → finding reopen cu detalii ANAF
- **API:** `/api/anaf/connect`, `/api/anaf/callback`, `/api/fiscal/submit-spv` (POST), `/api/fiscal/submit-spv/execute`, `/api/fiscal/submit-spv/[id]/status`
- **UI:** `/dashboard/fiscal`

### F4. Fiscal Dashboard
- **Filing records** — istoric transmitere
- **eTVA discrepancies** — verificare
- **SPV check** — status conexiune
- **D406 evidence** — dovadă transmitere
- **Protocol fiscal** — raport fiscal
- **API:** `/api/fiscal/filing-records`, `/api/fiscal/etva-discrepancies`, `/api/fiscal/spv-check`, `/api/fiscal/d406-evidence`, `/api/fiscal/protocol`
- **UI:** `/dashboard/fiscal`

### F5. e-Factura Signals & Sync
- **Semnale invoice** — risc pe facturi
- **Sync monthly** — cron lunar
- **API:** `/api/efactura/signals`, `/api/integrations/efactura/sync`, `/api/integrations/efactura/status`
- **Cron:** `/api/cron/efactura-spv-monthly` (15 ale lunii)

---

## G. NIS2

### G1. Eligibilitate & Assessment
- **Wizard eligibilitate** — sector, dimensiune, criterii
- **Assessment** — evaluare completă per control NIS2
- **Maturity scoring** — scor maturitate
- **API:** `/api/nis2/eligibility`, `/api/nis2/assessment`, `/api/nis2/maturity`
- **UI:** `/dashboard/nis2`, `/dashboard/nis2/eligibility`, `/dashboard/nis2/maturitate`

### G2. Incident Management
- **Create incident** — wizard incident NIS2
- **Timeline** — 24h (critical) / 72h (high/medium/low) SLA
- **Checklists** — 7 checklists per tip incident
- **SLA alerts** — notificări la 50% și 80% din SLA
- **Status tracking** — open → investigating → contained → resolved → closed
- **API:** `/api/nis2/incidents` (GET/POST), `/api/nis2/incidents/[id]` (PATCH), `/api/nis2/incidents/checklist`
- **UI:** `/dashboard/nis2` (IncidentRow cu checklists)

### G3. DNSC Registration
- **Path de înregistrare** — pași clari
- **Correspondence tracker** — istoric comunicare DNSC
- **Status tracking** — stadiu înregistrare
- **API:** `/api/nis2/dnsc-status`, `/api/nis2/dnsc-correspondence`
- **UI:** `/dashboard/nis2/inregistrare-dnsc`

### G4. NIS2 Governance & Vendors
- **Governance roles** — CRUD
- **Vendor management NIS2** — supply chain
- **Import from e-Factura** — vendori din facturi
- **NIS2 package** — export pachet complet
- **API:** `/api/nis2/governance`, `/api/nis2/vendors`, `/api/nis2/vendors/import-efactura`, `/api/nis2/package`
- **UI:** `/dashboard/nis2/governance`

---

## H. AI Act / Inventar Sisteme AI

### H1. Inventar AI
- **Wizard 4 pași:** informații de bază → scop (radio cards) → factori risc (checkboxes) → preview live
- **CRUD complet** — adaugă, editează, șterge sistem AI
- **Clasificare risc** — minimal/limited/high/unacceptable
- **Obligații generate** — per clasă de risc
- **API:** `/api/ai-systems` (GET/POST/DELETE), `/api/ai-systems/detected/[id]`
- **UI:** `/dashboard/sisteme`

### H2. AI Conformity & Annex IV
- **Assessment conformitate** — per sistem
- **Annex IV documentation** — generare pachet documentar
- **EU DB readiness** — wizard pregătire
- **Prepare submission** — pregătire pentru EU Database
- **API:** `/api/ai-conformity`, `/api/ai-act/annex-iv`, `/api/ai-act/prepare-submission`
- **UI:** `/dashboard/conformitate`, `/dashboard/sisteme/eu-db-wizard`

### H3. AI Act Evidence Pack
- **Export complet** — toate dovezile AI Act
- **API:** `/api/exports/ai-act-evidence-pack`

---

## I. GDPR

### I1. Documente GDPR
- **Privacy Policy** — generare + adoptare
- **DPA (Data Processing Agreement)** — draft + semnare
- **RoPA (Registrul de prelucrări)** — registru complet
- **Cookie Policy** — generare + banner
- **AI:** `/api/cookie-banner/generate`
- **UI:** `/dashboard/ropa`

### I2. DSAR (Data Subject Access Requests)
- **Creare cerere** — tip, date subiect
- **Draft răspuns** — generare automată
- **Tracking status** — open → in_progress → completed
- **API:** `/api/dsar` (GET/POST), `/api/dsar/[id]`, `/api/dsar/[id]/draft`
- **UI:** `/dashboard/dsar`

### I3. GDPR Rights (Art. 17 & 20)
- **Export date personale** — Art. 20, JSON export complet
- **Request deletion** — Art. 17, cerere ștergere
- **Delete data** — Art. 17, ștergere efectivă + confirmare
- **API:** `/api/account/export-data`, `/api/account/request-deletion`, `/api/account/delete-data`
- **UI:** Settings → secțiune GDPR Avansat

### I4. Compliance Pack AI
- **Câmpuri pre-completate** — din profil org, scanări, inventar AI
- **Confirmare câmpuri** — user validează fiecare câmp
- **API:** `/api/compliance-pack/fields`

---

## J. Pay Transparency

### J1. Full Loop
- **Upload CSV salarii** — parser flexibil RO/EN (rol, gen, salariu brut, bonus, contract, departament)
- **Calcul gap** — overall, per rol, per departament
- **Risk assessment** — low (<5%), medium (5-15%), high (>15%)
- **Generare raport** — markdown structurat cu recomandări
- **Aprobare/Publicare** — draft → approved → published
- **Finding auto-close** — pe aprobare raport → finding under_monitoring
- **Monitoring 180 zile** — revalidare periodică
- **API:** `/api/pay-transparency` (GET), `/api/pay-transparency/upload` (POST), `/api/pay-transparency/report` (POST), `/api/pay-transparency/report/[id]` (PATCH)
- **UI:** `/dashboard/pay-transparency`
- **Finding type:** PAY-001, resolution mode: `in_app_guided`

---

## K. Vendor Management

### K1. Vendor Review
- **Listă vendori** — cu scor risc
- **Review individual** — evaluare per vendor
- **Brief generare** — raport vendor
- **Revalidation** — cron periodic
- **API:** `/api/vendor-review` (GET/POST), `/api/vendor-review/[id]`, `/api/vendor-review/[id]/brief`
- **UI:** `/dashboard/vendor-review`
- **Cron:** `/api/cron/vendor-review-revalidation` (zilnic 07:00)

### K2. Vendor Trust Pack
- **Export trust pack** — GDPR evidence, NIS2 readiness, vendor score
- **White-label** — branding partener în trust pack
- **API:** `/api/exports/vendor-trust-pack`

### K3. Vendor Sync Monthly
- **Sincronizare automată** — refresh date vendori
- **Cron:** `/api/cron/vendor-sync-monthly` (1 ale lunii)

---

## L. Dosar & Exporturi

### L1. Dosar Unificat
- **Overview** — toate dovezile, documentele, artefactele
- **Grupare per finding** → dovadă → artefact
- **Blocker map** — ce lipsește pentru audit readiness
- **Export pack** — audit pack, trust center
- **Audit trail** — istoric complet acțiuni
- **UI:** `/dashboard/dosar`

### L2. Audit Pack
- **JSON export** — structură completă v2.1 cu quality gates
- **PDF export** — raport formatat
- **Bundle export** — pachet cu toate dovezile
- **Client export** — versiune client-facing
- **White-label branding** — partnerName, brandColor, logoUrl, tagline
- **API:** `/api/exports/audit-pack` (JSON), `/api/exports/audit-pack/pdf`, `/api/exports/audit-pack/bundle`, `/api/exports/audit-pack/client`
- **Cron:** `/api/cron/audit-pack-monthly` (1 ale lunii)

### L3. Alte Exporturi
- **CompliScan export** — snapshot complet
- **Annex lite** — versiune simplificată pentru clienți
- **API:** `/api/exports/compliscan`, `/api/exports/annex-lite/client`

### L4. Trust Center
- **Pagină publică** — status compliance vizibil extern
- **Publish approval** — approval-gated
- **UI:** `/dashboard/reports/trust-center`

### L5. Auditor Vault
- **Depozit dovezi** — artefacte validate
- **UI:** `/dashboard/reports/vault`

### L6. Audit Log
- **Log complet** — toate acțiunile cu timestamps
- **Filtrare** — per categorie, per user, per perioadă
- **API:** `/api/audit-log`
- **UI:** `/dashboard/reports/audit-log`

---

## M. Partner / Portfolio Mode

### M1. Portfolio Dashboard
- **Overview agregat** — scor mediu, alerte, trenduri
- **Alerts cross-client** — schimbări detectate
- **Tasks cross-client** — finding-uri deschise
- **Vendors cross-client** — vendori comuni
- **Reports** — livrabile pe portofoliu
- **API:** `/api/portfolio/overview`, `/api/portfolio/alerts`, `/api/portfolio/tasks`, `/api/portfolio/vendors`, `/api/portfolio/reports`
- **UI:** `/portfolio`, `/portfolio/alerts`, `/portfolio/tasks`, `/portfolio/vendors`, `/portfolio/reports`
- **Nav dedicat:** 5 secțiuni portfolio

### M2. Client Management
- **CSV import** — upload CSV cu firme
- **Preview** — validare înainte de import
- **ANAF prefill** — enrichment automat per CUI
- **Baseline scan** — scanare automată post-import
- **Client workspace** — intră pe client, context persistent
- **Urgency queue** — clienți prioritari
- **API:** `/api/partner/import-csv` (POST), `/api/partner/import-csv/preview`, `/api/partner/import/anaf-prefill`, `/api/partner/import/baseline-scan`, `/api/partner/import/execute`, `/api/partner/import/preview`, `/api/partner/clients` (GET), `/api/partner/clients/[orgId]`, `/api/partner/urgency-queue`
- **UI:** `/dashboard/partner`, `/dashboard/partner/[orgId]`

### M3. Batch Actions
- **Selectare clienți multipli** — acțiuni în masă
- **Policy-gated** — auto/semi/manual per acțiune
- **Execuție reală** — run_baseline_scan, generate_ropa, export_audit_pack, send_compliance_summary
- **submit_anaf guardat** — nu se poate executa batch
- **API:** `/api/portfolio/batch`

### M4. White-Label
- **Configurare branding** — partnerName, tagline, brandColor, logoUrl
- **Live preview** — vizualizare instant
- **Aplicat în:** audit pack export, monthly report email, vendor trust pack
- **API:** `/api/partner/white-label` (GET/PATCH)
- **UI:** Settings → tab Branding (doar partner mode)

### M5. Monthly Report Partner
- **Email automat** — raport lunar per consultant
- **Agregare clienți** — scor, delta, alerte, risc
- **Branding** — header cu brandColor și partnerName
- **Triage vizual** — clienți urgenti vs stabili
- **Cron:** `/api/cron/partner-monthly-report` (2 ale lunii)

---

## N. Approval Queue / Human-in-the-Loop

### N1. Pending Actions
- **Tabel real** — `pending_actions` în Supabase
- **Action types:** repair_efactura, generate_document, resolve_finding, batch_action, submit_anaf, vendor_merge, auto_remediation, classify_ai_system, publish_trust_center
- **Risk levels:** low, medium, high, critical
- **Diff preview** — ce se schimbă
- **Explanation** — de ce se propune acțiunea
- **API:** `/api/approvals` (GET), `/api/approvals/[id]` (PATCH approve/reject)
- **UI:** `/dashboard/approvals`

### N2. Semi-Auto Sweeper
- **Fereastra 24h** — acțiuni semi-auto expiră dacă nu sunt respinse
- **Re-verify policy** — verifică dacă userul nu a schimbat settings
- **Dispatch real** — execuție efectivă (resolve finding, etc.)
- **Audit trail** — log complet per acțiune
- **submit_anaf exclus** — LOCKED_OVERRIDES, manual always
- **Integrat în:** daily cron agent-orchestrator

### N3. Autonomy Settings
- **Per-category policy** — auto / semi / manual
- **Per-risk-level** — override pe risk level
- **LOCKED_OVERRIDES** — submit_anaf = manual (non-overridable)
- **Runtime resolver** — `resolvePolicy()` verificat la fiecare acțiune
- **API:** `/api/settings/autonomy` (GET/PATCH)
- **UI:** Settings → Autonomie

---

## O. Agenți AI / Automatizare

### O1. Agenți (5 tipuri)
| Agent | Ce face | Frecvență |
|-------|---------|-----------|
| **compliance_monitor** | Verifică starea conformitate, detectează schimbări | Zilnic |
| **fiscal_sensor** | Verifică facturi, semnale e-Factura | Zilnic |
| **document** | Verifică documente lipsă/expirate | Zilnic |
| **vendor_risk** | Evaluează risc vendori | Zilnic |
| **regulatory_radar** | Monitorizare legislativă (EUR-Lex + DNSC) | Săptămânal |

### O2. Agent Orchestrator
- **Daily cron** — rulează toți agenții zilnici per org
- **Semi-auto sweep** — procesează acțiuni expirate
- **Incident SLA check** — alerte la 50%/80% SLA
- **External sources** — EUR-Lex docs, DNSC announcements
- **API:** `/api/agents` (GET/PATCH feedback), `/api/agent/run`, `/api/agent/commit`
- **UI:** `/dashboard/agents`
- **Cron:** `/api/cron/agent-orchestrator` (zilnic 06:00), `/api/cron/agent-regulatory-radar` (miercuri 07:00)

### O3. Agent Feedback
- **Feedback per run** — helpful/not_helpful + note
- **Self-learning store** — persistat pentru îmbunătățire
- **API:** `/api/agents` (PATCH)

---

## P. Notificări & Digesturi

### P1. Notificări In-App
- **Create/read/dismiss** — per org
- **Tipuri:** info, finding_new, alert, escalation
- **Link to action** — fiecare notificare duce la pagina relevantă
- **API:** `/api/notifications` (GET), `/api/notifications/[id]` (PATCH)

### P2. Email Digesturi
| Digest | Frecvență | Cron |
|--------|-----------|------|
| **Daily** | Zilnic 08:00 | `/api/cron/daily-digest` |
| **Weekly** | Luni 08:30 | `/api/cron/weekly-digest` |
| **Monthly** | 3 ale lunii 09:00 | `/api/cron/monthly-digest` |

### P3. Alert Preferences
- **Configurare** — ce tipuri de alerte primește userul
- **API:** `/api/alerts/preferences` (GET/PATCH), `/api/alerts/notify`

### P4. Scheduled Reports
- **Configurare** — tip raport, frecvență, destinatari
- **CRUD** — create, edit, delete
- **Execuție cron** — `/api/cron/scheduled-reports` (zilnic 10:00)
- **API:** `/api/reports/scheduled` (GET/POST), `/api/reports/scheduled/[id]` (PATCH/DELETE)
- **UI:** `/dashboard/settings/scheduled-reports`

### P5. Renewal Reminder
- **Reminder** — documente care expiră
- **Cron:** `/api/cron/renewal-reminder` (zilnic 09:00)

---

## Q. Monitoring, Drift & Review Cycles

### Q1. Drift Detection
- **Snapshot comparison** — curent vs baseline
- **Drift records** — per categorie, per finding
- **SLA-based alerts** — breach dacă nu se acționează
- **Lifecycle:** active → acknowledged → resolved
- **API:** `/api/drifts/[id]` (PATCH)
- **UI:** `/dashboard/alerte`

### Q2. Drift Sweep
- **Cron zilnic** — verificare drifturi noi
- **Cron:** `/api/cron/drift-sweep` (zilnic 06:00)

### Q3. Score Snapshot
- **Snapshot zilnic** — scor + risk + alerts
- **Trend history** — delta pe 30 zile
- **Cron:** `/api/cron/score-snapshot` (zilnic 07:50)

### Q4. Review Cycles
- **Per finding** — data review programată
- **Revalidation triggers** — per finding type
- **CRUD** — create, update, complete
- **API:** `/api/review-cycles` (GET/POST), `/api/review-cycles/[id]` (PATCH)
- **UI:** `/dashboard/review`

### Q5. Legislation Monitor
- **Monitorizare schimbări legislative** — EUR-Lex, DNSC
- **Cron:** `/api/cron/legislation-monitor` (zilnic 07:00)

### Q6. Inspector Weekly
- **Inspecție săptămânală** — verificare completă
- **Cron:** `/api/cron/inspector-weekly` (luni 08:00)

---

## R. Whistleblowing

### R1. Canal Sesizări
- **Formular submit** — anonim sau identificat
- **Dashboard admin** — vizualizare, status, investigare
- **Status tracking** — received → investigating → resolved → closed
- **Audit trail** — istoric complet
- **API:** `/api/whistleblowing` (GET/POST), `/api/whistleblowing/[id]` (PATCH), `/api/whistleblowing/submit`
- **UI:** `/dashboard/whistleblowing`

---

## S. DORA

### S1. Assessment & Incidents
- **Assessment DORA** — evaluare per control
- **Incident management** — creare, tracking
- **TPRM (Third Party Risk Management)** — vendori ICT
- **API:** `/api/dora` (GET/POST), `/api/dora/incidents/[id]`, `/api/dora/tprm` (GET/POST), `/api/dora/tprm/[id]`
- **UI:** `/dashboard/dora`

---

## T. HR & Contracte

### T1. HR Pack
- **Reconciliation** — verificare conformitate HR
- **Pack** — documente HR generate
- **API:** `/api/hr/pack`, `/api/hr/reconciliation`

### T2. Contracts Pack
- **Generare** — pachet contracte
- **API:** `/api/contracts/pack`

---

## U. Rapoarte & Analiză

### U1. Reports
- **Counsel brief** — raport pentru consilier juridic
- **Response pack** — pachet răspuns
- **PDF export** — orice raport
- **Share token** — link partajabil
- **API:** `/api/reports` (GET), `/api/reports/counsel-brief`, `/api/reports/response-pack`, `/api/reports/pdf`, `/api/reports/share-token`
- **UI:** `/dashboard/reports`

### U2. Benchmark
- **Comparare** — scor vs industrie
- **API:** `/api/benchmark`

### U3. Risk Trajectory
- **Predicție risc** — trend pe 90 zile
- **Widget** — grafic pe dashboard
- **API:** `/api/risk/trajectory`

### U4. Traceability
- **Family evidence** — evidență per familie de control
- **Review** — verificare completitudine
- **API:** `/api/traceability/family-evidence`, `/api/traceability/review`

---

## V. Settings

### V1. Workspace Settings
- **Profil org** — editare
- **Members** — management echipă
- **Autonomy** — nivel automatizare
- **Scheduled reports** — configurare
- **Billing** — abonament Stripe
- **Branding** — white-label (partner only)
- **GDPR Avansat** — export/delete date personale
- **API:** `/api/settings/summary`, `/api/settings/autonomy`
- **UI:** `/dashboard/settings`, `/dashboard/settings/scheduled-reports`, `/dashboard/settings/abonament`

### V2. Billing (Stripe)
- **Checkout** — creare sesiune Stripe
- **Portal** — management abonament
- **Webhook** — procesare evenimente
- **Plan gating** — `requirePlan()` pe features premium
- **API:** `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`

---

## W. Infrastructură & Cron Jobs

### W1. Persistență
| Strat | Unde | Când |
|-------|------|------|
| **In-memory** | `memoryStates` Map | Per serverless instance |
| **Supabase org_state** | `public.org_state` | Primary pe Vercel (auto-detect) |
| **Disk** | `.data/state-{orgId}.json` | Fallback local |

### W2. Supabase Tables (schema public)
- `organizations`, `memberships`, `users`
- `org_state` — compliance state complet
- `pending_actions` — approval queue
- `partner_white_label` — branding
- `notifications` — notificări
- `agent_runs` — istoric agenți
- `score_snapshots` — snapshots scor
- `vendor_reviews` — review-uri vendori
- `nis2_state` — stare NIS2 per org
- `scheduled_reports` — rapoarte programate
- `agent_feedback` — feedback agenți
- `app_state` — legacy (migrat)

### W3. Toate Cron Jobs (16)
| Cron | Schedule | Ce face |
|------|----------|---------|
| agent-orchestrator | Zilnic 06:00 | Rulează 4 agenți + semi-auto sweep |
| drift-sweep | Zilnic 06:00 | Detectare drift-uri |
| vendor-review-revalidation | Zilnic 07:00 | Revalidare vendori |
| legislation-monitor | Zilnic 07:00 | Monitorizare legislație |
| score-snapshot | Zilnic 07:50 | Snapshot scor |
| daily-digest | Zilnic 08:00 | Email digest zilnic |
| inspector-weekly | Luni 08:00 | Inspecție săptămânală |
| weekly-digest | Luni 08:30 | Email digest săptămânal |
| agent-regulatory-radar | Miercuri 07:00 | Radar legislativ (EUR-Lex + DNSC) |
| renewal-reminder | Zilnic 09:00 | Reminder reînnoire |
| audit-pack-monthly | 1 ale lunii 09:00 | Audit pack automat |
| monthly-digest | 3 ale lunii 09:00 | Email digest lunar |
| partner-monthly-report | 2 ale lunii 09:00 | Raport lunar partner |
| vendor-sync-monthly | 1 ale lunii 10:00 | Sync vendori |
| scheduled-reports | Zilnic 10:00 | Execuție rapoarte programate |
| efactura-spv-monthly | 15 ale lunii 06:00 | Sync SPV |

### W4. Integrări Externe
- **ANAF** — OAuth2, SPV submit, CUI lookup
- **Resend** — email sending (digest, reports)
- **Stripe** — billing
- **Sentry** — error tracking + cron monitoring
- **Gemini** — AI document generation
- **EUR-Lex** — legislative monitoring
- **DNSC** — security announcements
- **GitHub/GitLab** — repo sync (AI discovery)

---

## X. Sumar Cantitativ

| Categorie | Număr |
|-----------|-------|
| API Routes | 168 |
| Dashboard Pages | 51 |
| Cron Jobs | 16 |
| Finding Types | 30+ |
| Agent Types | 5 |
| Document Types | 12+ |
| Export Formats | 7 |
| User Roles | 5 |
| Approval Action Types | 9 |
| Supabase Tables | 12+ |
| Nav Items (solo) | 5 primary + 14 secondary |
| Nav Items (portfolio) | 5 |
| Frameworks acoperite | GDPR, NIS2, AI Act, e-Factura, DORA, Codul Muncii, Whistleblowing |
