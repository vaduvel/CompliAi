# AUDIT COMPLET CompliAI — 21 Martie 2026

Inventar exhaustiv: funcționalitate, UI, API, backend, git, Vercel, UX/IA, Design System, gap-uri.

---

## 1. STAREA GIT & DEPLOYMENT

### Branch-uri

| Branch | Stare | Relație cu main |
|--------|-------|-----------------|
| `main` | **DEPLOYED pe Vercel** | HEAD = `c30be91` |
| `wave0/ux-foundation-ds-v2` | Local, 6 commits noi | 26 commits BEHIND main — divergent |
| `codex/eos-v1-blueprint-main` | Remote + worktree /tmp | Arhivat |
| `codex/automation-layer-superprompt` | Remote | Sprint 2-8, merged în main |
| `feat/gdpr-rights-and-final-gaps` | Remote | Merged în main |
| 10+ alte branch-uri codex/* | Remote | Experimentale, arhivate |

### Ce e LIVE pe Vercel (main)
- Sprint 2-8: automatizare, cron-uri, Gemini engine
- GDPR rights, incident checklists, fiscal UI
- Demo enrichment (3 scenarii)
- EOS v1 design tokens (dark mode, blue-tinted grays)
- **NU** are DS v2.0 (warm graphite) — asta e pe `wave0` branch, nemerged

### Ce e pe `wave0/ux-foundation-ds-v2` (LOCAL, nemerged)
- DS v2.0 tokens (warm graphite palette)
- 5 pagini reconstruite vizual (Acasă, Scan, Resolve, Reports, Settings)
- Shell sidebar redesign
- **PROBLEMĂ**: branch-ul e 26 commits în urma lui main — nu se poate merge direct

### Worktrees active (7 — toate în /tmp)
- `/private/tmp/compliai-eos-v1-blueprint`
- `/private/tmp/compliai-nis2-org-bootstrap`
- `/private/tmp/compliai-policy-hotfix`
- `/private/tmp/compliai-prod-main-clean-20260321`
- `/private/tmp/compliai-release-slice-check`
- `/private/tmp/compliai-security-hotfix`
- `/private/tmp/compliai-smart-intake`

### Vercel Config
- Proiect: `compliscanag`
- Production branch: `main`
- 10 cron-uri configurate în `vercel.json`

---

## 2. API ROUTES (111 total)

### Auth (10 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/auth/login` | POST | Login email/password |
| `/api/auth/register` | POST | Înregistrare + trial |
| `/api/auth/logout` | POST | Logout (clear cookie) |
| `/api/auth/me` | GET | Sesiune curentă |
| `/api/auth/members` | GET, POST | Membri org (RBAC) |
| `/api/auth/members/[membershipId]` | PATCH | Update rol membru |
| `/api/auth/memberships` | GET | Orgs disponibile |
| `/api/auth/switch-org` | POST | Switch org activ |
| `/api/auth/summary` | GET | User + memberships |
| `/api/auth/forgot-password` | POST | Reset password |
| `/api/auth/reset-password` | POST | Consume token reset |

### Scanare & Analiză (3 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/scan` | POST | Scanare + analiză document |
| `/api/scan/extract` | POST | Extragere text (OCR) |
| `/api/scan/[id]/analyze` | POST | Analiză text revizuit |

### AI Systems (3 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/ai-systems` | POST, DELETE | CRUD sistem AI |
| `/api/ai-systems/discover` | POST | Auto-descoperire din manifest |
| `/api/ai-systems/detected/[id]` | PATCH | Review/confirm/reject sistem detectat |

### Findings & Remediation (5 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/findings/[id]` | GET, PATCH | Status finding + auto-task gen |
| `/api/tasks/[id]` | PATCH | Status task + dovadă + validare |
| `/api/tasks/[id]/evidence` | POST | Upload dovadă |
| `/api/tasks/[id]/evidence/[evidenceId]` | GET | Download dovadă |
| `/api/alerts/[id]/resolve` | PATCH | Rezolvă alertă |

### Alerte & Notificări (4 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/alerts/notify` | POST | Dispatch alertă (email/webhook) |
| `/api/alerts/preferences` | GET, POST | Preferințe notificări |
| `/api/notifications` | GET, POST | Lista + mark all read |
| `/api/notifications/[id]` | PATCH | Mark single read |

### Dashboard & Rapoarte (7 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/dashboard` | GET | Payload complet dashboard |
| `/api/dashboard/core` | GET | Payload lightweight |
| `/api/reports` | POST | Raport executiv JSON/HTML |
| `/api/reports/pdf` | POST | Raport PDF |
| `/api/reports/response-pack` | POST | Bundle răspuns GDPR/audit |
| `/api/reports/share-token` | POST | Link partajabil securizat |
| `/api/reports/counsel-brief` | POST | Brief juridic |

### NIS2 (11 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/nis2/assessment` | GET, POST | Assessment maturitate NIS2 |
| `/api/nis2/vendors` | GET, POST | Registru vendori |
| `/api/nis2/vendors/[id]` | PATCH, DELETE | CRUD vendor |
| `/api/nis2/vendors/import-efactura` | POST | Import vendori din e-Factura |
| `/api/nis2/incidents` | GET, POST | Incidente securitate |
| `/api/nis2/incidents/[id]` | PATCH, DELETE | CRUD incident |
| `/api/nis2/incidents/checklist` | GET | Checklist răspuns incident |
| `/api/nis2/governance` | GET, POST | Controale guvernanță |
| `/api/nis2/governance/[id]` | PATCH, DELETE | CRUD control |
| `/api/nis2/maturity` | GET | Scor maturitate |
| `/api/nis2/dnsc-status` | GET | Status înregistrare DNSC |

### e-Factura & Fiscal (6 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/efactura/validate` | POST | Validare XML UBL CIUS-RO |
| `/api/efactura/signals` | GET, POST | Semnale risc e-Factura |
| `/api/integrations/efactura/status` | GET | Status conexiune ANAF |
| `/api/integrations/efactura/sync` | POST | Sync date ANAF SPV |
| `/api/fiscal/etva-discrepancies` | GET, POST | Discrepanțe e-TVA |
| `/api/fiscal/filing-records` | GET, POST | Istoricul depunerilor |

### Cron Jobs (10 routes)
| URL | Schedule | Ce face |
|-----|----------|---------|
| `/api/cron/agent-orchestrator` | 6:00 zilnic | Rulează agenți (fiscal, compliance) |
| `/api/cron/vendor-review-revalidation` | 7:00 zilnic | Revalidare vendori |
| `/api/cron/legislation-monitor` | 7:00 zilnic | Monitorizare legislație |
| `/api/cron/score-snapshot` | 7:50 zilnic | Snapshot scor istoric |
| `/api/cron/daily-digest` | 8:00 zilnic | Email digest zilnic |
| `/api/cron/inspector-weekly` | 8:00 luni | Simulare control extern |
| `/api/cron/weekly-digest` | 8:30 luni | Email digest săptămânal |
| `/api/cron/audit-pack-monthly` | 9:00 zi 1 | Pack audit lunar |
| `/api/cron/vendor-sync-monthly` | 10:00 zi 1 | Sync vendori lunar |
| `/api/cron/partner-monthly-report` | 9:00 zi 2 | Raport partner lunar |

### Stripe Billing (3 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/stripe/checkout` | POST | Checkout session Stripe |
| `/api/stripe/portal` | POST | Portal Stripe (manage sub) |
| `/api/stripe/webhook` | POST | Webhook events Stripe |

### Organizație & Profil (4 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/org/profile` | GET, POST | Profil org + applicability |
| `/api/org/profile/prefill` | GET | Prefill din ANAF |
| `/api/settings/summary` | GET | Sumar setări |
| `/api/plan` | GET | Plan activ (free/pro/partner) |

### GDPR Account (3 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/account/export-data` | GET | Art. 20 — export date |
| `/api/account/request-deletion` | POST | Art. 17 — cerere ștergere |
| `/api/account/delete-data` | POST | Admin force-delete |

### Exports (6 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/exports/audit-pack` | POST | Audit pack complet |
| `/api/exports/audit-pack/bundle` | POST | Bundle audit |
| `/api/exports/audit-pack/client` | POST | Export pentru auditor extern |
| `/api/exports/compliscan` | POST | Export format nativ |
| `/api/exports/annex-lite` | POST | Anexă GDPR lightweight |
| `/api/exports/annex-lite/client` | POST | Anexă pentru partajare |

### Integrări (6 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/integrations/repo-sync` | GET, POST | Setup repo sync |
| `/api/integrations/repo-sync/github` | POST | Webhook GitHub |
| `/api/integrations/repo-sync/gitlab` | POST | Webhook GitLab |
| `/api/integrations/repo-sync/status` | GET | Status sync |
| `/api/integrations/supabase/status` | GET | Status Supabase |
| `/api/integrations/supabase/keepalive` | POST | Heartbeat Supabase |

### Vendor Review (2 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/vendor-review` | GET, POST | CRUD vendor reviews |
| `/api/vendor-review/[id]` | PATCH, DELETE | Manage vendor review |

### Drift & Baseline (3 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/drifts/[id]` | PATCH | Lifecycle drift |
| `/api/state/baseline` | POST | Validare/ștergere baseline |
| `/api/state/drift-settings` | GET, POST | Configurare drift |

### Health & Diagnostics (4 routes)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/health` | GET | Health status app |
| `/api/health-check` | GET | Simulare health check |
| `/api/release-readiness` | GET | Verificare release |
| `/api/inspector` | GET | Simulare control extern |

### Alte routes (10+)
| URL | Methods | Ce face |
|-----|---------|---------|
| `/api/chat` | POST | AI Q&A (Gemini) |
| `/api/shadow-ai` | GET, POST | Detectare Shadow IT |
| `/api/agent/run` | POST | Rulare agenți manual |
| `/api/agent/commit` | POST | Commit finding-uri agenți |
| `/api/agents` | GET, POST | Config agenți |
| `/api/demo/[scenario]` | GET | Seed demo (imm/nis2/partner) |
| `/api/analytics/track` | POST | Event tracking |
| `/api/feedback` | POST | Micro-feedback |
| `/api/benchmark` | GET | Benchmarking sector |
| `/api/partner/clients` | GET | Lista clienți partner |
| `/api/partner/clients/[orgId]` | GET, POST, DELETE | CRUD client partner |
| `/api/partner/import-csv` | POST | Import clienți CSV |
| `/api/policies` | GET | Lista politici |
| `/api/policies/acknowledge` | POST | Confirmare politică |
| `/api/documents/generate` | POST | Generare document (LLM) |
| `/api/state/reset` | POST | DESTRUCTIVE — reset state |
| `/api/audit-log` | GET | Log audit |
| `/api/traceability/family-evidence` | POST | Trasabilitate dovezi |
| `/api/traceability/review` | POST | Review audit |
| `/api/ai-conformity` | GET, POST | Assessment EU AI Act |

---

## 3. PAGINI UI (37 routes dashboard + 11 publice)

### Pagini publice (11)
| Route | Ce face |
|-------|---------|
| `/` | Landing page |
| `/login` | Login / Register |
| `/pricing` | Prețuri (Free/Pro/Partner) |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/dpa` | Data Processing Agreement |
| `/reset-password` | Resetare parolă |
| `/genereaza-dpa` | Landing DPA generator |
| `/genereaza-politica-gdpr` | Landing Privacy generator |
| `/demo/[scenario]` | Loader demo |
| `/trust/[orgId]` | Trust center public |

### Pagini dashboard — FLUX PRINCIPAL (10 — conform blueprint)
| Route | Ce face | Status conform blueprint |
|-------|---------|--------------------------|
| `/dashboard` | **Acasă** — stare + urgențe | ✓ Există, dar prea încărcat |
| `/dashboard/scan` | **Scanează** — input + analiză | ✓ Există |
| `/dashboard/scan/results/[scanId]` | **Rezultate scan** | ✓ Există |
| `/dashboard/scan/history` | **Istoric scanări** | ✓ Există |
| `/dashboard/resolve` | **De rezolvat** — findings + tasks | ✓ Există, dar prea încărcat |
| `/dashboard/resolve/[findingId]` | **Detaliu finding** | ✓ Există |
| `/dashboard/reports` | **Rapoarte** — dovezi + export | ✓ Există, dar prea încărcat |
| `/dashboard/reports/vault` | Auditor Vault (sub-pagină) | ✓ Există |
| `/dashboard/reports/audit-log` | Log audit (sub-pagină) | ✓ Există |
| `/dashboard/reports/policies` | Politici interne (sub-pagină) | ✓ Există |
| `/dashboard/reports/trust-center` | Trust Center (sub-pagină) | ✓ Există |
| `/dashboard/settings` | **Setări** | ✓ Există |
| `/dashboard/settings/abonament` | Billing (sub-pagină) | ✓ Există |

### Pagini dashboard — EXTRA (nu sunt în blueprint, dar există)
| Route | Ce face | Conform blueprint ar trebui |
|-------|---------|----------------------------|
| `/dashboard/sisteme` | AI Systems inventory (500+ linii) | → Tab/filter în De rezolvat |
| `/dashboard/conformitate` | AI Conformity | → Redirect → home (existent) |
| `/dashboard/alerte` | Drift & Alerte | → Filter în De rezolvat |
| `/dashboard/nis2` | NIS2 complet (800+ linii) | → Filter în De rezolvat |
| `/dashboard/nis2/governance` | NIS2 governance | → Inline |
| `/dashboard/nis2/inregistrare-dnsc` | Înregistrare DNSC | → Inline în finding |
| `/dashboard/nis2/maturitate` | Maturitate NIS2 | → Inline |
| `/dashboard/vendor-review` | Vendor Review (600+ linii) | → Filter "Furnizori" în De rezolvat |
| `/dashboard/fiscal` | Pagină fiscal | → Filter în De rezolvat |
| `/dashboard/agents` | Agenți | → Setări > Automatizare |
| `/dashboard/generator` | Generator documente | → Inline în Resolution Layer |
| `/dashboard/asistent` | Asistent AI | → Floating assistant (există deja) |
| `/dashboard/partner` | Partner hub | Acceptabil (rol separat) |
| `/dashboard/partner/[orgId]` | Client partner | Acceptabil |
| `/dashboard/findings/[id]` | Finding detail (duplicat) | → Duplicat cu resolve/[findingId] |

### Redirecturi (pagini vechi → pagini noi)
| Vechi | Nou |
|-------|-----|
| `/dashboard/scanari` | → `/dashboard/scan` |
| `/dashboard/documente` | → `/dashboard/reports/policies` |
| `/dashboard/politici` | → `/dashboard/reports/policies` |
| `/dashboard/audit-log` | → `/dashboard/reports/audit-log` |
| `/dashboard/checklists` | → `/dashboard/resolve` |
| `/dashboard/rapoarte/*` | → `/dashboard/reports/*` |
| `/dashboard/setari/*` | → `/dashboard/settings/*` |

---

## 4. COMPONENTE

### Componente UI de bază (shadcn — 12)
button, badge, card, alert, avatar, progress, dropdown-menu, scroll-area, separator, sheet, tabs, sonner

### Componente Evidence OS (65 în `components/evidence-os/`)
Badge-uri, carduri, paneluri, layout-uri — toate stilizate conform EOS v1.

### Componente CompliScan (57 în `components/compliscan/`)
Page surfaces, paneluri de feature, navigare, hooks de state.

### Componente ORFANE (8 — există dar nu sunt importate nicăieri)
1. `agent-workspace.tsx` — Agent dashboard
2. `ai-compliance-pack-card.tsx` — Annex IV compliance
3. `ai-discovery-panel.tsx` — AI discovery
4. `ai-inventory-panel.tsx` — AI system wizard
5. `efactura-risk-card.tsx` — Semnale e-Factura
6. `efactura-validator-card.tsx` — Validator e-Factura
7. `export-center.tsx` — Export orchestrator
8. `inspector-mode-panel.tsx` — Simulare control

---

## 5. LIBRĂRII & STATE MANAGEMENT

### Stores principale

**ComplianceState** (`lib/server/mvp-store.ts`)
- Fișier: `.data/state-{orgId}.json`
- Conține: findings, scans, alerts, tasks, AI systems, drifts, snapshots, events, orgProfile, applicability, streak
- Cache în memorie + persist pe disk + mirror Supabase

**Nis2OrgState** (`lib/server/nis2-store.ts`)
- Fișier: `.data/nis2-{orgId}.json`
- Conține: assessment, incidents, vendors, boardMembers, maturityAssessment, dnscRegistrationStatus
- Persist pe disk + mirror Supabase

### Module lib/server/ (108 fișiere)
- Auth: `auth.ts`, `org-context.ts`, `rbac.ts`, `reset-tokens.ts`
- Storage: `mvp-store.ts`, `nis2-store.ts`, `storage-adapter.ts`, `supabase-org-state.ts`
- Integrări: `gemini.ts`, `google-vision.ts`, `anaf-spv-client.ts`, `efactura-anaf-client.ts`
- Documents: `document-generator.ts`, `pdf-generator.ts`, `compliscan-export.ts`
- Scanare: `scan-workflow.ts`, `llm-scan-analysis.ts`, `manifest-autodiscovery.ts`
- Prefill: `ai-prefill-signals.ts`, `website-prefill-signals.ts`, `document-prefill-signals.ts`
- Orchestrare: `agent-orchestrator.ts`, `plan.ts`

### Module lib/compliance/ (97 fișiere)
- Core: `types.ts`, `constitution.ts`, `engine.ts`
- Reguli: `rule-library.ts`, `signal-detection.ts`, `legal-sources.ts`
- NIS2: `nis2-rules.ts`, `nis2-maturity.ts`, `nis2-rescue.ts`
- AI Act: `ai-inventory.ts`, `ai-act-timeline.ts`, `ai-conformity-assessment.ts`
- e-Factura: `efactura-validator.ts`, `efactura-risk.ts`, `etva-discrepancy.ts`, `filing-discipline.ts`
- Remediere: `remediation.ts`, `remediation-recipes.ts`, `task-validation.ts`
- Agenți: `agentic-engine.ts`, `agent-runner.ts`, `agent-compliance-monitor.ts`, `agent-fiscal-sensor.ts`
- Drift: `drift-policy.ts`, `drift-lifecycle.ts`
- Quality: `evidence-quality.ts`, `audit-quality-gates.ts`, `validation-levels.ts`

### Module lib/compliscan/ (3 fișiere)
- `schema.ts` — Snapshot schema
- `dashboard-routes.ts` — Rute + grouping
- `yaml-schema.ts` — YAML parser

---

## 6. DESIGN SYSTEM

### Ce e LIVE (main) — Evidence OS v1

**Culori:** HSL cu hue 220°, dark mode, blue-tinted grays
**Tokens:** Prefix `--eos-*` (surfaces, text, borders, accent, severity, status)
**Accent primar:** Blue-purple `hsl(230, 80%, 62%)` — NU emerald!
**Bug naming:** `--emerald-500` pointează de fapt la accent primar (blue), nu emerald
**Fonts:** Inter (UI), Manrope (display), JetBrains Mono (code)
**Fișier:** `app/evidence-os.css` + `app/globals.css`

### Ce e pe branch (wave0) — DS v2.0

**Culori:** Warm graphite (#111113 → #F1F1F5)
**Tokens:** Fără prefix, namespace curat
**Accent primar:** Emerald (#34D399) — corect!
**Semantic layers:** Status ≠ Severity ≠ Review states (separate explicit)
**Fonts:** Aceleași (Inter, Manrope, JetBrains Mono)
**Fișier:** `styles/tokens.css`

### Diferențe cheie EOS v1 → DS v2.0

| Aspect | EOS v1 (live) | DS v2.0 (branch) |
|--------|---------------|-------------------|
| Background | Cool blue-tinted | Warm graphite |
| Accent | Blue-purple | Emerald |
| Namespace | `--eos-*` verbose | Clean, fără prefix |
| Semantic layers | Flat (mixed) | Separated (3 layers) |
| Review states | Nu există explicit | Violet-dominant (6 stări) |
| Token naming | Inconsistent (emerald=blue) | Consistent |

### Fișiere Pencil (.pen)
**ZERO** — nu există fișiere de design. Totul e code-first.

---

## 7. UX/IA — BLUEPRINT vs REALITATE

### Documentul canonic
`docs/final-guide-plan/02-ux-ia-blueprint.md`

### Scor implementare: ~70-75%

### Ce e CORECT (urmează blueprint-ul)
- ✅ Navigare primară cu 5 itemi (Acasă, Scanează, De rezolvat, Rapoarte, Setări)
- ✅ Pagina Scan Rezultate există (blueprint nota că lipsea)
- ✅ Resolution Layer inline cu 7 pași
- ✅ Badge pe "De rezolvat" cu count real-time
- ✅ Filter tabs în De rezolvat (GDPR, NIS2, AI Act, Furnizori)

### Ce e GREȘIT (nu urmează blueprint-ul)

**PROBLEMA #1 — Navigare secundară veche neștearsă**
Blueprint spune: 10 pagini, filtre în De rezolvat.
Realitate: 37 routes, cu 7 pagini separate care ar trebui să fie filtre:
- `/dashboard/sisteme` → ar trebui filter AI Act
- `/dashboard/alerte` → ar trebui filter Drift
- `/dashboard/nis2` → ar trebui filter NIS2
- `/dashboard/vendor-review` → ar trebui filter Furnizori
- `/dashboard/fiscal` → ar trebui filter e-Factura
- `/dashboard/agents` → ar trebui în Setări
- `/dashboard/generator` → ar trebui inline în Resolution Layer

**PROBLEMA #2 — Pagini supraaglomerate**
Blueprint spune: 1 CTA primar per pagină.
Realitate: Acasă are ~12 secțiuni, Rapoarte are ~10 secțiuni.

**PROBLEMA #3 — DS v2.0 nu e pe main**
Wave 0 a construit paginile cu DS v2.0 dar pe branch separat.
Main rulează cu EOS v1 (blue-tinted).
Branch-ul e 26 commits în urma lui main — nu se merge direct.

### Reguli UX încălcate
1. ❌ "Un singur CTA primar per pagină" — Acasă are multiple CTAs
2. ❌ "Filtrele înlocuiesc sub-meniurile" — sub-meniuri încă active
3. ❌ "Post-scan = redirect automat" — parțial implementat
4. ❌ "Setările nu sunt în fluxul principal" — Agenții sunt în Control, nu Setări
5. ❌ "Badge pe De rezolvat" — funcționează, dar userii pot bypassa via nav secundar

---

## 8. INVENTAR FUNCȚIONALITATE PER FRAMEWORK

### GDPR
- Scanare documente cu detecție semnale GDPR ✅
- Generare Privacy Policy, Cookie Policy, DPA ✅
- Finding-uri cu Resolution Layer ✅
- Export date personale (Art. 20) ✅
- Cerere ștergere (Art. 17) ✅
- Trasabilitate dovezi ✅
- Conformitate AI (assessment) ✅

### EU AI Act
- Inventar sisteme AI (manual + auto-discover) ✅
- Clasificare risc (minimal/limited/high) ✅
- Detecție shadow AI ✅
- Conformitate Annex IV ✅
- Timeline obligații ✅

### NIS2
- Assessment maturitate (20 întrebări, 5 domenii) ✅
- Registru vendori cu risc ✅
- Incidente securitate cu SLA DNSC (24h/72h) ✅
- Înregistrare DNSC ✅
- Guvernanță (board members, CISO) ✅
- Import vendori din e-Factura ✅

### e-Factura
- Validare XML UBL CIUS-RO ✅
- Semnale risc (respinse, blocate, netransmise) ✅
- Conectare ANAF OAuth2 ✅
- Discrepanțe e-TVA ✅
- Disciplină depuneri ✅

### Cross-Framework
- Score global agregat ✅
- Drift detection (operational + compliance) ✅
- Agenți automatizați (5 tipuri) ✅
- Inspector mode (simulare control) ✅
- Benchmark sector ✅
- Streak conformitate ✅
- 10 cron-uri programate ✅
- Export: PDF, JSON, YAML, ZIP audit pack ✅
- Partajare contabil/consilier (link securizat 72h) ✅

---

## 9. DEPENDENȚE & TECH STACK

- **Framework:** Next.js 15.5.12 (App Router)
- **React:** 19.2.3
- **TypeScript:** 5.9.3
- **UI:** Tailwind CSS v4, Radix UI, shadcn, Lucide icons
- **PDF:** pdfkit, archiver
- **Monitoring:** Sentry 10.44.0
- **Toasts:** Sonner
- **Theming:** next-themes

---

## 10. PROBLEME IDENTIFICATE

### Critice
1. **DS v2.0 pe branch divergent** — nu se poate merge, ar trebui rebase
2. **Navigare dublă** — userii au 2 căi spre aceeași informație
3. **Pagini supraaglomerate** — încalcă principiul "1 CTA per pagină"
4. **8 componente orfane** — cod mort în repo

### Medii
5. **Token naming inconsistent** — emerald = blue pe main
6. **37 routes vs 10 planificate** — complexitate inutilă
7. **7 worktrees active** — clutter în /tmp

### Informative
8. **Cron-uri fără env vars** — CRON_SECRET, RESEND_API_KEY necesare pe Vercel
9. **Wave 0 branch stale** — 26 commits behind, risc de conflict

---

## 11. OPȚIUNI DE ACȚIUNE

### Opțiunea A: Refactor pe main (minim risc)
- Ascunde/consolidează navigarea secundară
- Simplifică paginile (scoate secțiunile extra)
- Rămâne pe EOS v1 vizual
- Efort: ~2 zile

### Opțiunea B: Rebase wave0 + merge (risc mediu)
- Aduce DS v2.0 (warm graphite) pe main
- Necesită rezolvare conflicte (26 commits diferență)
- Apoi aplică blueprint-ul pe paginile noi
- Efort: ~3-4 zile

### Opțiunea C: Rebuild paginile de la zero pe main (risc mare)
- Rescrie cele 5 pagini conform blueprint, direct pe main
- Cu DS v2.0 tokens copiate din wave0
- Efort: ~5-7 zile

---

*Generat automat — 21 Martie 2026*
