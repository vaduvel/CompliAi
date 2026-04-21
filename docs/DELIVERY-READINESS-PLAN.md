# DELIVERY-READINESS-PLAN.md

> **Documentul care dă direcția de la "aplicația funcționează" la "se poate livra la client enterprise."**
>
> Bazat pe: audit real codbase (nu STATE-NOW auto-generat), cercetare web pe standarde SaaS B2B, sinteza tuturor docs-urilor strategice (DESTINATION, USERS, MARKET-RESEARCH, DESIGN-BRIEF, ROLLOUT, USER-VALIDATION-KIT).
>
> **Data**: 2026-04-20 · **Audiență**: founder (tu) + AI agent de implementare (Claude Code)

---

## 0. TL;DR — În 5 propoziții

1. **Backend-ul e matur** (~70% production-ready, 194 API endpoints, 121 fișiere compliance logic, 8 integrări externe wired, auth JWT HMAC + RBAC solid).
2. **UI-ul e dezordonat** (207 componente, 80% evidence-os legacy, 5% DS v2 început, accessibility sporadic, 75 pagini din care ~60 funcționale).
3. **10 blockere critice** blochează livrarea — cele mai grave: XSS în chat/Gemini, CSRF lipsă, session rotation absent, E2E tests neexecutate în CI, privacy policy + ToS lipsă, PII în loguri.
4. **Strategia de migrare**: **Strangler Fig + Feature Flag** page-by-page (NU big-bang), conform precedent Shopify/Atlassian/GitLab (multi-ani, nu sprints).
5. **Ținta realistă**: **8 săptămâni** pentru "livrabil la primii 5 design-partners CECCAR" — NU 6 săptămâni cum zicea ROLLOUT-ul inițial. Cercetarea confirmă: design system adoption e 12-36 luni continuu; **8 săptămâni** livrează CORE enterprise feel + blocker fixes, restul e iterare continuă.

---

## 1. CONTEXT & NORTH STAR

### 1.1 Ce construim
**Workbench pentru consultanți români de compliance** (Diana — contabil CECCAR, 10-30 clienți SRL, burnout cronic, plătește €149/lună) care agregă 24/7 semnale GDPR + e-Factura + NIS2 + AI Act + DORA peste tot portofoliul ei, într-un **Inbox cross-client** ce îi permite triaj în 10 min dimineața în loc de 45-60 min Excel + 3 SPV-uri.

Output livrabil: **dovezi audit-shaped** în formatul ANSPDCP/DNSC/ANAF, gata de trimis la click.

### 1.2 Decizii care NU se reiau
- **Persona P1 = Diana** (partner consultant), NU Mihai (SME owner direct)
- **Pricing sweet spot = €149/lună Pro**, rebill 100-300 RON/client = margin 170%
- **Stack canonic**: Next.js 15 App Router + Tailwind 4 + shadcn/Radix + Supabase + lucide-react
- **Canal GTM**: CECCAR + FB Contabili România (50k+) + SmartBill partnership — NU Google Ads direct
- **Moat temporal**: 12-18 luni fereastră înainte ca Huddle.ro / SmartBill să adauge compliance
- **Design direction**: "Linear meets Vanta" — dark-first, densitate Linear, calm autoritar, indigo primary (#3B5BDB), Inter + Manrope + JetBrains Mono

### 1.3 3 Golden Paths (JTBD-uri canonice)
1. **Diana dimineața** (`/portfolio/alerts`): 14 alerte peste noapte → triaj bulk → 8 min
2. **Radu audit ANSPDCP** (`/api/exports/anspdcp-pack/[orgId]`): pachet PDF semnat în 2h vs 2 săptămâni manual
3. **Diana lunar** (`/portfolio/reports`): 12 rapoarte clienți generate batch în 30 min vs 4h

---

## 2. STATE REAL — AUDIT COD

Citare: audit direct al codbase-ului `/Users/vaduvageorge/Desktop/CompliAI` (nu docs-uri auto-generate).

### 2.1 Ce e matur (păstrăm cum e)
| Domeniu | Status | Evidence |
|---|---|---|
| **Auth + Tenancy** | ✅ Production-grade local, ⚠️ Supabase hybrid instabil | `lib/server/auth.ts` (JWT HMAC-SHA256), `middleware.ts` (session verify + rate limit 10-120 req/min), RBAC 5 roluri |
| **Compliance engines** | ✅ Deep domain logic | 121 fișiere în `lib/compliance/`, ~28k LOC, NIS2/GDPR/AI Act/e-Factura/DORA |
| **Cron infrastructure** | ✅ Operational | 16 jobs în `vercel.json`, Sentry-monitored |
| **Integrări externe** | ✅ Wired | ANAF/SPV (OAuth + HMAC), EUR-Lex SPARQL, Supabase (hybrid + RLS), Resend (22 refs), Gemini (cu fallback rule-based), Google Vision (OCR cu fallback) |
| **Email delivery** | ✅ Funcțional | Resend + template structure pentru alerts/digests/onboarding |
| **Stripe webhook** | ✅ HMAC verified | `app/api/stripe/webhook` cu event handling |
| **Backend API** | ✅ 194 endpoints | 70% cu logic solid, auth/stripe/cron/portfolio mature |

### 2.2 Ce e half-baked (migrare / completare necesară)
| Domeniu | Status | Ce lipsește |
|---|---|---|
| **UI components** | ⚠️ 80% legacy | 207 componente: ~45 evidence-os vechi, ~60 compliscan-branded, ~5 DS v2 (în curs) |
| **Pagini** | ⚠️ 75 pagini, ~60 funcționale | ~10 stub/incomplete, ~5 orphan, redirects lipsă |
| **Test coverage** | ⚠️ ~15-20% | 11 test files dedicate, E2E Playwright neexecutat în CI |
| **Accessibility** | ⚠️ Sporadic | 10 aria-* scattered, 0 focus management, 0 screen reader tests |
| **Observabilitate** | ⚠️ Basic | Sentry wired, dar console.log scattered; analytics track endpoint nefurnishat cu User ID/Session context |
| **Performance** | ⚠️ Inconsistent | 9 loading.tsx, dar 0 next/dynamic în componente examinate, `<img>` vs `<Image>` mixed |

### 2.3 Ce LIPSEȘTE complet (blockere livrare)
| Domeniu | Status | Impact |
|---|---|---|
| **CSP headers** | ❌ Nu există | XSS risk crescut (mai ales Gemini response) |
| **CSRF tokens** | ❌ Nu există | Relies pe SameSite=Lax — fragil |
| **Session rotation** | ❌ Nu se rotesc pe activity | Security posture slabă |
| **Privacy Policy + ToS** | ❌ Lipsă pe web | Blocker legal pentru client B2B |
| **Runbook ops** | ❌ Lipsă | Incident response neclar |
| **API docs (OpenAPI)** | ❌ Lipsă | Integration friction |
| **SSO / SAML** | ❌ Lipsă | Enterprise requirement (mai puțin critic pentru €149 sweet spot, dar obligatoriu pentru mid-market €499+) |
| **SOC 2 Type II** | ❌ Lipsă | Enterprise expectation; cost $25-50k, durează 6-12 luni |
| **Audit log immutable** | ⚠️ Partial | Există activity tracking, dar nu format SIEM-compatible, retention neclar |
| **Database migrations** | ⚠️ Manual | SQL scripts în `supabase/`, nu automated la deploy |

### 2.4 Top 10 riscuri concrete
| # | Risc | Locație | Severitate | Effort |
|---|---|---|---|---|
| 1 | XSS via Gemini response | `app/api/chat/*` | 🔴 BLOCKER | 8h |
| 2 | CSRF relies pe SameSite-Lax | `middleware.ts` | 🟠 MAJOR | 6h |
| 3 | Session token expiry fără refresh | `middleware.ts` | 🔴 BLOCKER | 6h |
| 4 | PII în loguri (Sentry nescrubbed) | `lib/server/email-alerts.ts` | 🟠 MAJOR | 4h |
| 5 | E2E tests nerunate în CI | `tests/e2e/*` | 🟠 MAJOR | 16h |
| 6 | DB connection pooling + circuit breaker lipsă | `lib/server/scan-workflow.ts` | 🟠 MAJOR | 10h |
| 7 | Privacy Policy + ToS lipsă | `/public/legal/` | 🟠 MAJOR | 12h |
| 8 | Gemini rate limits neimpuse | `lib/server/gemini.ts` | 🟠 MAJOR | 5h |
| 9 | Password hashing PBKDF2 custom (nu Argon2) | `lib/server/auth.ts` | 🟡 MINOR | 4h |
| 10 | Cache headers lipsă pe rute statice | `app/dashboard/page.tsx` | 🟡 MINOR | 2h |

**Total effort blockere + major**: ~73 ore ≈ **2 săptămâni dedicate**.

---

## 3. AMBIGUITĂȚI DE REZOLVAT ÎNAINTE DE EXECUȚIE

Din cercetarea docs-urilor, 6 întrebări deschise nu au răspuns — **trebuie decise înainte să porneascăm**:

1. **ANSPDCP-shaped export format** — specificația oficială nu există public. Decizie necesară: validare cu DPO real sau deferim la v2?
2. **Stripe billing live** — API routes există dar lib incomplet. Decizie: activăm live sau factură bancară manuală primele 20 cabinete?
3. **`/dashboard/asistent` (AI chat)** — nu apare în JTBD Diana. Decizie: păstrăm sau ștergem conform ROLLOUT §1.4?
4. **Quick-add client <30 sec** — țintă agresivă. Decizie: validabilă cu 3 cabinete reale înainte să construim?
5. **Mihai direct pricing** — strategie "B2B2B light-touch" e vagă. Decizie: freemium direct sau NU-l vinde?
6. **Inbox cross-client** vs **triage firmă-per-firmă** — avem deja `/portfolio/alerts`, dar nu e validat empiric că Diana intră acolo FIRST. Decizie: A/B test sau deferim?

**Recomandare**: dedicăm **2 zile** la decizii (sesiune cu 2-3 cabinete beta reale). Fără asta, construim pe supoziții.

---

## 4. STRATEGIE DE MIGRARE — EVIDENCE-BASED

### 4.1 De ce NU big-bang rewrite
Martin Fowler și studii publicate (minware.com/guide/anti-patterns/big-bang-release) confirmă: **big-bang e anti-pattern** pentru UI migration în produs în growth:
- Blast radius catastrofal (1 bug = întreg produsul broken)
- Feedback loop cu 3-6 luni (nimic în producție până e gata tot)
- Blochează improvements incrementale
- Psychological toll pe echipă

### 4.2 Strategia canonică: **Strangler Fig + Feature Flag**
Bazat pe precedent Shopify Polaris (7 ani arc), Atlassian ADS (multi-an, 18-person DS team), GitLab Pajamas (component versioning parallel).

**Principii**:
1. **Page-by-page replacement**: o pagină migrează complet + validează + ship, apoi următoarea
2. **Feature flag guard**: fiecare pagină rescrisă e in spatele unui flag (`DS_V2_PORTFOLIO`, `DS_V2_INBOX`) — activă per-user / per-org
3. **Progressive rollout**: 5% → 25% → 50% → 100% peste zile, cu guard rails metric-based (pause auto dacă error rate crește)
4. **Zero feature-parity loss**: fiecare migrare include **inventar obligatoriu** de toate features din componenta veche + verificare 1:1 post-migrare
5. **Primary source of truth unică**: tokens, primitive, patterns în `components/ui/ds/` — restul codului nu mai folosește hex hardcoded

### 4.3 Tool-uri necesare
- **Feature flag system** (LaunchDarkly: $0.08/seat/mo; GrowthBook: OSS free self-hosted) — 1 zi wire-up
- **Visual regression testing** (Playwright screenshots cu Argos / Chromatic) — 2 zile setup
- **Bundle analyzer** (`@next/bundle-analyzer`) — 1 oră setup
- **axe-core** (a11y) integrat în Playwright — 0.5 zi

### 4.4 Inventariat feature checklist (OBLIGATORIU per pagină)
Înainte de orice migrare a unei pagini, se produce un **feature inventory** (markdown) cu TOATE features-urile din componenta veche:
- Liste de acțiuni disponibile (butoane, link-uri, mutații API)
- Edge cases handled (empty state, loading, error, permission denied)
- Keyboard shortcuts
- Integrări (mutations, subscriptions, invalidate-on-mutate)
- A11y features (aria-*, focus management)
- Responsive breakpoints

Post-migrare: fiecare item e verificat bifat manual. **Fără inventar = fără PR merged.**

---

## 5. ROADMAP — 4 VALURI ÎN 8 SĂPTĂMÂNI

### VAL 1 — FOUNDATION HARDENING (Săpt 1-2, 10 zile)

**Output**: infrastructura sigură + instrumentation pentru migrare.

**Tasks**:
1. Fix Top 3 blockers: XSS CSP (8h) + CSRF tokens (6h) + Session rotation (6h) = 20h
2. Setup feature flag system (GrowthBook self-hosted recomandat, zero cost) — 1 zi
3. Setup visual regression testing (Playwright + Argos sau Chromatic) — 2 zile
4. Wire E2E tests în CI (GitHub Actions + Playwright + Vercel preview) — 2 zile
5. Logging: PII scrubbing Sentry config + structured logger wrapper — 1 zi
6. axe-core în Playwright — 0.5 zi
7. Bundle analyzer + baseline metrics — 0.5 zi
8. Privacy Policy + ToS drafted + review juridic RO — 2 zile (în paralel cu dev)

**Decizii ambiguități** în paralel (1-2 zile cu 2-3 cabinete beta):
- Rezolvă 6 întrebări din §3

**Done criteria**:
- [ ] 3 blockere security închise
- [ ] CI rulează E2E + a11y + visual regression
- [ ] Feature flag live, controlabil via env var sau dashboard
- [ ] Privacy + ToS live pe `/privacy` + `/terms`

### VAL 2 — DESIGN SYSTEM LAYER + 3 PAGINI CORE (Săpt 3-5, 15 zile)

**Output**: DS v2 complet + 3 pagini Diana daily flow migrate cap-coadă cu feature parity 100%.

**Tasks**:
1. Tokens + fonts (DONE parțial, verificat final) — 0.5 zi
2. Primitive DS v2 complete: Button, Badge, Card, Input, Select, Checkbox, Radio, Tabs, Dialog, Sheet, Popover, Tooltip, DropdownMenu, Table, Toast, Progress, Skeleton, SeverityPill, StatusDot, FrameworkChip, SummaryStrip, ScoreBar, DenseTable + Row + Header, FindingRow (canonic partajat), CockpitLayout + Section, BulkActionBar, EmptyState, PageIntro, Breadcrumb, Pagination, Avatar, Kbd — **~20 componente noi sau refactorizate** — 5 zile
3. Shell canonic: sidebar (MOD DE LUCRU / PORTOFOLIU / FIRMĂ) + topbar (title + slot right + breadcrumb) + BulkActionBar sticky. Moștenit de TOATE rutele via layout.tsx wrappers — 2 zile
4. **Pagina 1 — `/portfolio` (Dashboard overview)**: feature inventory + migrare in-place + verificare + feature flag rollout — 2 zile
5. **Pagina 2 — `/portfolio/alerts` (Inbox JTBD #1)**: feature inventory + migrare in-place + bulk actions wire-up + keyboard J/K/X/E funcțional + verificare — 3 zile
6. **Pagina 3 — `/dashboard/resolve/[findingId]` (Smart Resolve Cockpit)**: feature inventory + migrare in-place păstrând GeneratorDrawer + DocumentAdoption + close gating + Evidence flow + verificare — 3 zile

**Done criteria per pagină**:
- [ ] Feature inventory completat pre-migrare (markdown fișier)
- [ ] Toate features din inventory verificate 1:1 post-migrare
- [ ] Visual regression test trecut (Argos/Chromatic)
- [ ] axe-core pass (0 violations)
- [ ] E2E happy path trecut
- [ ] Feature flag rollout: 5% → 25% → 50% → 100% peste 3 zile cu guard rails

### VAL 3 — REST MATRICE CORE + POLISH (Săpt 6-7, 10 zile)

**Output**: toate paginile Partner mode migrate + polish general.

**Tasks per pagină** (feature inventory + migrare + verificare + flag):
- `/dashboard` (Acasă firmă) — 1 zi
- `/dashboard/scaneaza` (Scan) — 1 zi
- `/dashboard/monitorizare/conformitate` (Findings per framework) — 1.5 zi
- `/dashboard/monitorizare/furnizori` — 1 zi
- `/dashboard/monitorizare/nis2` — 1 zi
- `/dashboard/monitorizare/sisteme-ai` — 1 zi
- `/dashboard/actiuni/remediere` (Task queue) — 1 zi
- `/dashboard/actiuni/politici` (Generator) — 1 zi
- `/dashboard/actiuni/vault` — 0.5 zi
- `/dashboard/rapoarte` — 1 zi
- `/portfolio/tasks` — 0.5 zi
- `/portfolio/vendors` — 0.5 zi
- `/portfolio/reports` — 0.5 zi
- `/portfolio/client/[orgId]` — 1 zi

**Total**: ~12 zile, 14 pagini migrate.

**Done criteria**:
- [ ] Toate paginile Partner mode la 100% rollout
- [ ] 0 regresii funcționale raportate
- [ ] Bundle size nu a crescut >10% față de baseline Val 1

### VAL 4 — ENTERPRISE READINESS + LAUNCH (Săpt 8, 5 zile)

**Output**: produs livrabil la primii 5 design-partners CECCAR.

**Tasks**:
1. Audit log immutable + retention configurable (1-3 ani) — 2 zile
2. RBAC fine-grained + API token scoping pentru integrări — 1 zi
3. Onboarding: 3 pași self-serve (CUI → ANAF lookup → scan baseline) — 1 zi (refactor existent)
4. Telemetrie: TTFV tracking + funnel conversion trial→paid — 0.5 zi
5. Runbook ops markdown + incident response playbook — 1 zi
6. Pagini stub restante: `/dashboard/setari` (9 tabs dense), onboarding, login/register — 1.5 zi (sharing cu Val 3 dacă timpul permite)
7. **Soft launch**: 5 cabinete design-partner invitate (gratis 6 luni), USER-VALIDATION-KIT activ, feedback loop 1h/săpt cu fiecare — Săpt 8 ziua 5

**Done criteria**:
- [ ] Audit log vizibil în UI pentru `owner` + `partner_manager`
- [ ] Primii 5 design-partners activi, 3+ logări/săpt per cabinet
- [ ] Zero bug blocker raportat în prima săptămână
- [ ] TTFV măsurat <10 min pentru 80% din users
- [ ] Trial-to-paid conversion benchmark setat (cu 5 partners este N/A, dar framework activ)

---

## 6. LAUNCH CRITERIA — CE DEFINEȘTE "READY"

Produsul e livrabil la primul client CECCAR plătitor (non-beta) dacă:

### 6.1 Security & Compliance ✓
- [ ] CSP + CSRF + Session rotation implementate
- [ ] PII scrubbing activ în loguri
- [ ] Privacy Policy + ToS + DPA publice
- [ ] Audit log funcțional + retention 1-3 ani
- [ ] Stripe webhook secret rotation policy documentată
- [ ] SOC 2 Type I started (Type II in 12-24 luni)

### 6.2 Product Quality ✓
- [ ] 0 bugs BLOCKER deschise
- [ ] <3 MAJOR bugs deschise
- [ ] E2E tests pass în CI (coverage golden paths)
- [ ] Visual regression stabil pe 5 rute critice
- [ ] axe-core 0 violations pe rute Partner mode
- [ ] Bundle size stabil (nu >10% growth vs baseline)

### 6.3 UX Quality ✓
- [ ] TTFV <10 min (CUI → primul finding acționabil)
- [ ] Top 3 friction-uri DESTINATION §1.4 rezolvate (720 click-uri → bulk; portofoliu refresh; stepper consistency)
- [ ] Keyboard shortcuts J/K/X/E live în Inbox + Remediere
- [ ] Mobile: Inbox + Notificări responsive; restul desktop-first 1440px+
- [ ] Inter + Manrope + JetBrains Mono loaded corect
- [ ] Dark mode default, light mode optional + testat

### 6.4 Operations ✓
- [ ] Runbook ops publicat intern
- [ ] Incident response playbook (who/how/when)
- [ ] Status page public (<https://status.compliai.ro> recomandat, free pe Instatus)
- [ ] Sentry activ + alerting configurat
- [ ] Backup DB automated (Supabase PITR, nu manual)

### 6.5 GTM ✓
- [ ] 5 design-partners CECCAR semnați (free 6 luni)
- [ ] Landing page `/` rescris conform DS v2 + copy convertor
- [ ] Pricing page `/pricing` cu cele 3 planuri (Solo, Pro, Agency)
- [ ] Email onboarding (3 emails: welcome, primul finding, weekly digest)
- [ ] Referral program CECCAR (1 lună gratis per client referit)

---

## 7. METRICI DE DELIVERY QUALITY (dashboard intern)

Tracked weekly after launch:

| Metric | Target | Benchmark industrial |
|---|---|---|
| TTFV (Time to First Value) | <10 min | <5 min = 25% trial-to-paid (userpilot.com) |
| Trial-to-paid (6 luni design-partner) | >50% retention → paid Q2 | B2B median 18.5% (1capture.io 2025) |
| Daily Active (Diana persona) | >60% deschid /portfolio/alerts zilnic | n/a pentru vertical compliance |
| Findings resolved/user/săpt | >15 | fix benchmark intern baseline cu design partners |
| Bulk actions usage rate | >40% din findings acționate via bulk | anti-friction target |
| NPS (săpt 4 beta) | >30 | 30+ = promoter majority |
| Crash-free sessions | >99.5% | standard Sentry benchmark |
| p95 API latency | <800ms | standard SaaS |
| Bundle size first-load | <200KB gzip | Next.js recommandat |

---

## 8. RISCURI STRATEGICE (business, not tech)

| Risc | Probabilitate | Impact | Mitigare |
|---|---|---|---|
| Huddle.ro lansează design enterprise înainte de noi | Medium | Catastrofal | 8 săptămâni realistic pentru Val 1-4. Monitoring competitive activ. |
| ANSPDCP-shaped format nu poate fi oficial validat | Medium | Major | Defer la v2, livrăm "ANSPDCP-ready" nu "ANSPDCP-certified" |
| 5 design-partners nu sunt recrutabili până săpt 8 | Low | Major | USER-VALIDATION-KIT are deja outreach template CECCAR; start recruit Săpt 1 |
| Stripe live billing întârzie > 2 săpt | Low | Minor | Factură bancară primii 20 — DESTINATION §7.4 oficializat |
| Supabase hybrid tenancy breaks la scale | Medium | Major | Load test cu 20 orgs × 100 findings în Val 3; migrare cloud-only dacă crashuri |
| Budget marketing CECCAR insuficient | Medium | Major | FB Contabili 50k = gratuit inbound; plan GTM confirm Val 4 |

---

## 9. PROTOCOL DE EXECUȚIE

### 9.1 Reguli absolute
1. **Inventar features înainte de migrare** — fără excepții
2. **Feature flag pentru fiecare pagină V2** — rollout controlat 5/25/50/100
3. **Visual regression obligatoriu** — nu merge fără snapshot verde
4. **axe-core obligatoriu** — nu merge cu violations
5. **E2E happy path obligatoriu** — nu merge fără test trecut
6. **User review la sfârșitul fiecărui val** — nu val următor fără confirmare
7. **1 PR = 1 pagină** — nu bulk merges
8. **Backup git tag pre-val** — rollback trivial

### 9.2 Cadență comunicare
- **Zilnic**: 1-line status în chat ("Azi: pagină X inventory done, migrare pornită")
- **Săptămânal (vineri)**: raport val cu demo rute migrate + screenshots + open risks
- **Per val**: checklist done criteria tickat + user review
- **Per blocker**: oprire imediată, raport, decide împreună

### 9.3 Rollback plan
- Feature flag OFF pentru pagină problematică — instant rollback (useri pe versiunea veche)
- Git tag pre-val — full rollback în 10 min dacă blocker nereparabil
- Supabase PITR (point-in-time-recovery) — data rollback 7 zile
- Sentry alerts cu auto-pagerduty pentru >5% error rate

---

## 10. APPENDIX — SURSE EXTERNE CITATE

1. **UX Debt Paydown**: [nngroup.com/articles/ux-debt](https://www.nngroup.com/articles/ux-debt/), [intercom.com — 3-step framework](https://www.intercom.com/blog/tackling-complex-design-debt-a-three-step-framework/)
2. **Design System Rollout**: [Shopify Polaris 7-year retrospective](https://medium.com/shopify-ux/uplifting-shopify-polaris-7c54fc6564d9), [Atlassian ADS](https://www.uxpin.com/studio/blog/atlassian-design-system-creating-design-harmony-scale/), [GitLab Pajamas](https://design.gitlab.com/get-started/lifecycle/)
3. **Strangler Fig Pattern**: [martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html), [nngroup incremental redesign](https://www.nngroup.com/articles/radical-incremental-redesign/)
4. **Feature Flag Progressive Rollout**: [LaunchDarkly docs](https://launchdarkly.com/docs/home/releases/progressive-rollouts/), [guarded rollouts](https://launchdarkly.com/docs/home/releases/guarded-rollouts)
5. **Enterprise SaaS Checklist**: [enterpriseready.io](https://www.enterpriseready.io/features/audit-log/), [workos.com enterprise checklist](https://workos.com/guide/enterprise-readiness-checklist)
6. **SOC 2**: [trycomp.ai SOC 2 checklist](https://trycomp.ai/soc-2-checklist-for-saas-startups)
7. **Metrici delivery**: [userpilot.com TTFV 2024](https://userpilot.com/blog/time-to-value-benchmark-report-2024/), [1capture.io trial-to-paid 2025](https://www.1capture.io/blog/free-trial-conversion-benchmarks-2025)
8. **Anti-patterns**: [minware.com big-bang release](https://www.minware.com/guide/anti-patterns/big-bang-release)
9. **Vanta/Drata comparison**: [complyjet.com 2025](https://www.complyjet.com/blog/vanta-vs-drata-2025)

---

## 11. NEXT ACTION

1. **Ești tu (founder)**: citești acest document, decizi pe cele 6 ambiguități din §3, confirmi roadmap-ul (8 săpt, 4 valuri).
2. **Eu (Claude Code)**: după confirmarea ta, pornesc **Val 1 Ziua 1** — security blockers + feature flag setup — sub protocolul §9.
3. **Săpt 1 vineri**: primul raport săptămânal cu Val 1 progres + demo security fixes.

---

> **END DELIVERY-READINESS-PLAN v1.0** — 2026-04-20.
> Acest document e **contractul de execuție**. Orice abatere necesită update versiune (v2, v3...) și aprobare explicită.
