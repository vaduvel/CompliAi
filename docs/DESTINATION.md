# DESTINATION.md — CompliAI Architecture Mandate (2026-04-19)

> **Documentul de adevăr final.** Sinteză disciplinată din 4 surse:
> - Canon UX/IA: [`COMPLISCAN-UX-IA-DEFINITIV-CANON.md`](./canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md) + [`v1.1-ADDENDUM`](./canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md)
> - Realitate cod: [`STATE-NOW.md`](./STATE-NOW.md)
> - Useri reali: [`USERS.md`](./USERS.md)
> - Piață + pricing: [`MARKET-RESEARCH.md`](./MARKET-RESEARCH.md)
> - Frictiuni live testate: feedback Claude din testare end-to-end (vezi §1.4)
>
> **Regula**: nimic nu se construiește dacă nu apare aici. Nimic aici nu se schimbă fără update versiune (v2, v3...).

---

# 0. CONTRACTUL ÎN 5 PROPOZIȚII

1. **Cine e clientul plătitor**: Diana — consultant român cu 10-30 clienți SRL, plătește **€149/lună Pro** (sweet spot).
2. **Ce face produsul**: agregă 24/7 toate semnalele compliance ale clienților ei (SPV, e-Factura, GDPR, NIS2, AI Act), îi arată ce arde, generează dovezi audit-shaped, livrează rapoarte cu brand-ul ei.
3. **Cum diferă de Sypher/Huddle/SmartBill**: **multi-regime + multi-tenant + format ANSPDCP-shaped + canal CECCAR**, în fereastra de 12-18 luni înainte ca Huddle/SmartBill să adauge compliance.
4. **Cum câștigăm**: nu prin polish UI — prin **canal (CECCAR + FB groups 50k+) + integrare SAGA/SmartBill defensivă**.
5. **Ce NU facem**: chat, ERP, CRM, e-signature, training platform, backup, integrare OneTrust/ServiceNow.

---

# 1. VIZIUNEA OPERAȚIONALĂ

## 1.1 Promisiunea către Diana

> *"Set up once. CompliAI te paște 24/7 prin 16 cron-uri, 5 agenți AI și un motor de applicability. Tu intri 10 min dimineața să vezi ce-a apărut peste noapte cross-clienții tăi. Săptămânal 30 min să faci review. Lunar 1h să trimiți rapoarte. Când ANAF/ANSPDCP/DNSC bate la ușă, ai pachetul gata într-un click."*

## 1.2 Cele 3 surfețe pe care Diana le folosește

| Surfață | Cadență | Ce face Diana | Justifică abonamentul prin |
|---|---|---|---|
| **Inbox cross-portfolio** (`/portfolio/alerte`) | Daily 10 min | Triază alerte peste noapte | Watchdog vizibil zilnic |
| **Drill-in client** (`/dashboard/*`) | Multiple/zi când e cazul | Rezolvă findings, generează docs | Productivity |
| **Rapoarte batch** (`/portfolio/rapoarte`) | Lunar 1h | Trimite 8-20 rapoarte clienți | Revenue (rebill 100 RON/client) |

## 1.3 Cele 3 evenimente "aha"

1. **Dimineață**: vede 3 alerte peste noapte gata triate, fiecare cu 2 click-uri până la rezolvare. Nu mai deschide Excel + SAGA + 3 SPV-uri.
2. **Sfârșit de lună**: 8 rapoarte clienți generate batch în 30 min vs 4h azi.
3. **Audit ANSPDCP la un client**: export pachet ANSPDCP-shaped într-un click vs 2 săptămâni de muncă manuală.

## 1.4 Frictiunile pe care DESTINATION le rezolvă (din feedback Claude live test)

| Friction observat | Severity | Fix în arhitectura nouă |
|---|---|---|
| 5+ click-uri per finding × 6 findings × 20 clienți = **720 click-uri/lună** | 🔴 Killer | **Bulk actions** ("confirmă toate GDPR-urile") + **3-click max** single flow per finding evident |
| Portofoliu nu se reîmprospătează după import | 🔴 Bug | Auto-refresh on mutation (React Query `invalidateQueries`) |
| Header "Pasul 1 din 3" dar stepper arată 2 | 🟠 Trust loss | Single source of truth pentru wizard state (Zustand sau context unic) |
| *"DENUMIREA FIRMEI"* ambiguu (a mea sau a clientului?) | 🟠 Confusion | Label clar context-aware: *"Numele cabinetului tău de consultanță"* |
| 12 findings copleșitor first-contact | 🟠 Overwhelm | **Progressive disclosure**: top 3 critical first, *"Vezi toate (12)"* on demand |

---

# 2. INFORMATION ARCHITECTURE — SIDEBAR PER MOD

## 2.1 Mod **Partner** (Diana — P1)

**Aterizare default**: `/portfolio` (NU `/dashboard`).

```
┌──────────────────────────────────────┐
│ PORTOFOLIU                           │ (cross-org, operational)
│ ├── Prezentare generală  /portfolio  │
│ ├── Alerte               /portfolio/alerte
│ ├── Remediere            /portfolio/remediere
│ ├── Furnizori            /portfolio/furnizori
│ └── Rapoarte             /portfolio/rapoarte
│                                      │
│ ─── separator ───                    │
│                                      │
│ FIRMA: [LogiTrans SRL ▼]            │ (per-org dropdown selector)
│ ├── Acasă                /dashboard  │
│ ├── Scanează             /dashboard/scaneaza
│ ├── Monitorizare         /dashboard/monitorizare/*
│ │   ├── Conformitate     /conformitate
│ │   ├── Furnizori        /furnizori
│ │   ├── Sisteme AI *     /sisteme-ai (IF applicability.aiAct)
│ │   ├── NIS2 *           /nis2 (IF applicability.nis2)
│ │   └── Alerte           /alerte
│ ├── Acțiuni              /dashboard/actiuni/*
│ │   ├── Remediere        /remediere
│ │   ├── Politici         /politici
│ │   └── Vault            /vault
│ ├── Rapoarte             /dashboard/rapoarte
│ └── Setări               /dashboard/setari
│                                      │
│ ─── separator ───                    │
│                                      │
│ ⚙ Setări cont           /account/settings
│ 🔔 Notificări (3)                    │
└──────────────────────────────────────┘
```

**`*`** = sub-pagina apare doar dacă applicability-ul firmei selectate include framework-ul.

## 2.2 Mod **Compliance** (Radu — P2)

Identic cu secțiunea per-firmă din Partner, **fără secțiunea Portofoliu**.

```
├── Acasă                    /dashboard
├── Scanează                 /dashboard/scaneaza
├── Monitorizare/*           (Conformitate / Furnizori / Sisteme AI* / NIS2* / Alerte)
├── Acțiuni/*                (Remediere / Politici / Vault)
├── Rapoarte                 /dashboard/rapoarte
└── Setări                   /dashboard/setari

─── separator ───
🔔 Notificări (3)
👤 Cont                       /account/settings
```

## 2.3 Mod **Solo** (Mihai — P3, simplificat)

```
├── Acasă                    /dashboard
├── Scanează                 /dashboard/scaneaza
├── De rezolvat              /dashboard/de-rezolvat   (findings + tasks unificat)
├── Documente                /dashboard/documente     (politici + scan history unificat)
├── Rapoarte                 /dashboard/rapoarte      (export simplificat)
└── Setări                   /dashboard/setari

─── separator ───
🔔 Notificări
👤 Cont
```

**Solo NU vede**: Monitorizare ca grup expandabil, sub-pagini NIS2/AI/Furnizori separate, Vault separat, Log audit.

## 2.4 Mod **Viewer** (membru invitat)

```
├── Acasă                    /dashboard         (read-only)
├── Task-urile mele          /dashboard/de-rezolvat (doar atribuite)
├── Documente                /dashboard/documente (read-only)
└── Setări                   /account/settings (doar profil personal)

🔔 Notificări
```

## 2.5 Mod **Auditor extern** (link partajat 72h)

Fără sidebar. Pagini publice:
- `/trust/[orgId]` — Trust Center public
- `/shared/[token]` — dosar partajat 72h
- Read-only, fără cont necesar

---

# 3. ROUTES CANONICE + REDIRECT MAP

## 3.1 Rute publice (fără auth)

```
/                               Landing page
/login                          Login + Register
/pricing                        Prețuri
/privacy /terms /dpa            Legal
/reset-password                 Reset parolă
/trust/[orgId]                  Trust Center public
/demo/[scenario]                Demo loader
/shared/[token]                 Dosar partajat 72h
/whistleblowing/[token]         Whistleblowing portal public
```

## 3.2 Portofoliu (`userMode === 'partner'`)

```
/portfolio                      Prezentare generală (LANDING DEFAULT)
/portfolio/alerte               Alerte cross-firmă
/portfolio/remediere            Task-uri cross-firmă
/portfolio/furnizori            Furnizori agregat
/portfolio/rapoarte             Rapoarte batch
```

## 3.3 Per firmă (toate modurile)

```
/dashboard                                          Acasă
/dashboard/scaneaza                                 Scanare nouă + Documente
/dashboard/scaneaza/rezultate/[scanId]              Rezultate scan

/dashboard/monitorizare/conformitate                Findings per framework (tabs)
/dashboard/monitorizare/furnizori                   Vendor review + DPA pipeline
/dashboard/monitorizare/sisteme-ai                  AI inventory (IF applicability)
/dashboard/monitorizare/nis2                        NIS2 assessment (IF applicability)
/dashboard/monitorizare/alerte                      Drift + notificări

/dashboard/actiuni/remediere                        Task queue
/dashboard/actiuni/remediere/[findingId]            Smart Resolve Cockpit detail
/dashboard/actiuni/politici                         Generator documente
/dashboard/actiuni/vault                            Dosare sigilate

/dashboard/rapoarte                                 Rapoarte + Log audit (tabs)
/dashboard/setari                                   Setări org (multiple tabs)
```

## 3.4 Mod Solo (rute simplificate)

```
/dashboard                      Acasă simplificat
/dashboard/scaneaza             Scanare
/dashboard/de-rezolvat          Findings + Tasks unificat
/dashboard/documente            Politici + Documente scanate
/dashboard/rapoarte             Export simplificat
/dashboard/setari               Setări
```

## 3.5 Account (user-level, separat de org)

```
/account/settings               Profil + securitate + sesiuni + preferințe (toate modurile)
```

## 3.6 Redirect map STATE-NOW → DESTINATION (22 redirect-uri)

**Toate sunt `301 Moved Permanently` în `middleware.ts`** — nu spargi link-uri vechi.

```
/dashboard/scan                 → /dashboard/scaneaza
/dashboard/scanari              → /dashboard/scaneaza
/dashboard/resolve              → /dashboard/actiuni/remediere
/dashboard/resolve/[id]         → /dashboard/actiuni/remediere/[id]
/dashboard/findings/[id]        → /dashboard/actiuni/remediere/[id]
/dashboard/reports              → /dashboard/rapoarte
/dashboard/rapoarte             → /dashboard/rapoarte
/dashboard/reports/vault        → /dashboard/actiuni/vault
/dashboard/reports/policies     → /dashboard/actiuni/politici
/dashboard/reports/audit-log    → /dashboard/rapoarte?tab=log
/dashboard/reports/trust-center → /trust/[orgId]
/dashboard/audit-log            → /dashboard/rapoarte?tab=log
/dashboard/politici             → /dashboard/actiuni/politici
/dashboard/generator            → /dashboard/actiuni/politici
/dashboard/sisteme              → /dashboard/monitorizare/sisteme-ai
/dashboard/sisteme/eu-db-wizard → /dashboard/monitorizare/sisteme-ai?wizard=eu-db
/dashboard/conformitate         → /dashboard/monitorizare/conformitate
/dashboard/alerte               → /dashboard/monitorizare/alerte
/dashboard/nis2                 → /dashboard/monitorizare/nis2
/dashboard/nis2/maturitate      → /dashboard/monitorizare/nis2?tab=maturitate
/dashboard/nis2/governance      → /dashboard/monitorizare/nis2?tab=governance
/dashboard/nis2/eligibility     → /dashboard/monitorizare/nis2?tab=eligibility
/dashboard/nis2/inregistrare-dnsc → /dashboard/monitorizare/nis2?tab=dnsc
/dashboard/dsar                 → /dashboard/monitorizare/conformitate?tab=dsar
/dashboard/vendor-review        → /dashboard/monitorizare/furnizori
/dashboard/fiscal               → /dashboard/monitorizare/conformitate?tab=efactura
/dashboard/agents               → /dashboard/setari?tab=automatizare
/dashboard/asistent             → /dashboard/setari?tab=automatizare (sau șters)
/dashboard/checklists           → /dashboard/actiuni/remediere
/dashboard/calendar             → /dashboard/rapoarte?tab=calendar (sau șters dacă neutilizat)
/dashboard/partner              → /portfolio
/dashboard/partner/[orgId]      → /portfolio/client/[orgId]
/dashboard/settings             → /dashboard/setari
/dashboard/settings/abonament   → /dashboard/setari?tab=billing
/dashboard/settings/scheduled-reports → /dashboard/setari?tab=scheduled-reports
/dashboard/setari/abonament     → /dashboard/setari?tab=billing
/dashboard/documente            → /dashboard/documente (KEEP — Solo only)
/dashboard/dosar                → /dashboard/actiuni/vault
/dashboard/dora                 → /dashboard/monitorizare/conformitate?tab=dora
/dashboard/whistleblowing       → /dashboard/setari?tab=whistleblowing
/dashboard/pay-transparency     → /dashboard/monitorizare/conformitate?tab=pay-transparency
/dashboard/ropa                 → /dashboard/monitorizare/conformitate?tab=ropa
/dashboard/approvals            → /dashboard/actiuni/remediere?tab=aprobari
/dashboard/review               → /dashboard/setari?tab=review-cycles
```

**Ștergeri fără redirect** (orfan + funcție inutilă):
- `/dashboard/sisteme/eu-db-wizard` → poate șters dacă nu e folosit
- `/dashboard/asistent` → confirmă cu user, posibil șters

---

# 4. REGULI DE COMPOZIȚIE PAGINĂ (10 reguli — non-negociabile)

Aplicate pe FIECARE pagină, fără excepție:

1. **O pagină = o intenție dominantă.** Dacă o pagină face două lucruri, e greșită.
2. **Un CTA principal per pagină.** Vizibil deasupra fold. Restul = secundar.
3. **Informația suport stă lateral sau sub fold.** Nu concurează cu acțiunea principală.
4. **Master-detail unde aplică**: Furnizori, Findings, Alerte (listă stânga, detaliu dreapta).
5. **Tabele cu filtre, NU sub-meniuri.** Framework-urile = tabs/filtre, NU pagini separate de Conformitate.
6. **Badge-uri comunică urgența, nu textul.** 🔴 = acționează acum. 🟢 = ok.
7. **Componente standalone + agregate.** Un finding row funcționează identic în Conformitate per firmă ȘI în Alerte cross-firmă.
8. **Navigarea se adaptează**: `userMode × applicability × RBAC = nav vizibil`.
9. **Onboarding NU stă pe dashboard.** E flow separat.
10. **Zero text fără acțiune.** Dacă un bloc text nu duce la un buton, nu are loc.

---

# 5. SMART RESOLVE COCKPIT — pattern central

**Detalii complete**: vezi [`COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md`](./canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md) (1686 linii).

## 5.1 Principiu

> **1 finding = 1 cockpit = 1 rezultat = 1 dosar.**
> Userul rezolvă o problemă completă într-un singur workspace, fără să sară între pagini.

## 5.2 Locație în noul IA

`/dashboard/actiuni/remediere/[findingId]` — Smart Resolve Cockpit complet.

## 5.3 Stack vertical (de la canon)

```
1. Context        — ce e finding-ul, sursă, severity, framework
2. Impact         — ce se întâmplă dacă nu rezolvi
3. Pași           — secvențe concrete (auto-generate sau manual)
4. Evidence       — atașează dovadă (upload + auto-extract)
5. Decide         — Confirmă & închide / Generează doc / Marchează fals pozitiv
```

## 5.4 Anti-patterns (din canon + Claude feedback)

- ❌ **Fragmentare pe 4-5 pagini** pentru 1 finding → totul în 1 cockpit
- ❌ **5+ click-uri per finding** → max 3 click-uri pentru caz evident
- ❌ **Nu există bulk action** → adaug bulk pentru finding-uri similare ("confirmă toate intake-gdpr-*")
- ❌ **12 findings deodată** → progressive disclosure (3 critice + "Vezi toate")

## 5.5 Bulk actions (NEW — derivat din feedback Claude)

În `/dashboard/actiuni/remediere`:
- Checkbox per finding row
- Selectează multiple → bară floating cu acțiuni: *"Confirmă selectate"*, *"Marchează ca verificate"*, *"Generează docs pentru selectate"*
- Per category: *"Confirmă toate intake-gdpr-*"* într-un singur click

---

# 6. DATA MODEL

## 6.1 Roluri (din ADDENDUM Clarificare 1)

```typescript
type OrgRole = 'owner' | 'partner_manager' | 'compliance' | 'reviewer' | 'viewer'
```

Matrice permisiuni (vezi ADDENDUM §1):
- `owner`: tot
- `partner_manager`: vede tot, editează findings/docs/exports, **NU invită membri, NU schimbă billing, NU șterge org**
- `compliance`: ca partner_manager dar la firmă internă (nu portofoliu)
- `reviewer`: doar atribuite
- `viewer`: read-only atribuite

## 6.2 Two contexts (din ADDENDUM Clarificare 2)

```typescript
type WorkspaceMode = 'portfolio' | 'org'

// Session/cookie:
interface SessionPayload {
  userId: string
  orgId: string                  // ULTIMUL org valid (mereu păstrat)
  userMode: 'partner' | 'compliance' | 'solo' | 'viewer'
  workspaceMode: WorkspaceMode
  // ...
}
```

**Reguli**:
- `workspaceMode === 'portfolio'` → user folosește `/portfolio/*`, dar `orgId` păstrat în sesiune
- `workspaceMode === 'org'` → user folosește `/dashboard/*`, citește din `orgId`
- **Niciodată `activeOrgId === null`** — mereu păstrat ultimul valid

## 6.3 Cross-client matrix (din ADDENDUM Clarificare 3)

| Operație | Cross-client | Confirmare |
|---|---|---|
| READ scoruri/findings/alerte | ✅ | Fără |
| Sortare/filtrare | ✅ | Fără |
| Export raport portofoliu PDF | ✅ | 1 click |
| Trimite digest email la N clienți | ✅ | *"Trimiți la 35?"* |
| Generare audit pack selectiv | ✅ | Per firmă selectată |
| Bulk confirm findings (per categorie) | ✅ | *"Confirmi 23 finding-uri intake-gdpr?"* |
| **WRITE destructiv** (ștergere org, reset state) | ❌ NICIODATĂ | - |
| **WRITE legal binding** (raport DNSC, semnătură policy) | ❌ NICIODATĂ | - |

## 6.4 Settings 3 niveluri (din ADDENDUM Clarificare 4)

| Nivel | Acces | Rută | Conține |
|---|---|---|---|
| **Cont** (user personal) | Sidebar separator jos | `/account/settings` | Profil, parolă, 2FA, sesiuni, notificări |
| **Firmă** (org selectat) | Sidebar per-firmă | `/dashboard/setari` | Org info, membri, integrări, automatizare, billing per firmă, white-label |
| **Portofoliu** (operational) | Secțiunea PORTOFOLIU | `/portfolio/*` | NU conține setări — doar operational |

**Regulă**: niciodată conținut din 2 niveluri pe aceeași pagină.

## 6.5 Supabase tables (păstrăm STATE-NOW)

| Table | Scop | Schimbări vs STATE-NOW |
|---|---|---|
| `organizations` | Firme | - |
| `profiles` | Useri | - |
| `memberships` | User→Org cu rol | - |
| `org_state` | State compliance | - |
| `evidence_objects` | Fișiere evidence | + audit-trail hash imutabil per upload |
| `policy_acknowledgments` | Politici semnate | - |
| `claim_invites` | Invitații claim | - |

**Nou**: tabel `audit_log_immutable` cu append-only insert + cryptographic hash chain (per cerința Radu — "ANSPDCP-shaped audit trail").

---

# 7. API CONSOLIDATION PLAN (192 → ~110 endpoint-uri)

## 7.1 Reguli de consolidare

1. **Elimină duplicate** confirmate (3 din STATE-NOW §2.3)
2. **Merge** endpoint-uri overlap (ex: `/api/dashboard/core` + `/api/dashboard/route` → 1 endpoint)
3. **Deprecate** endpoint-uri orfane neapelate
4. **Standardize naming**: `/api/{domain}/{resource}/{action}` consistent

## 7.2 Tăieri sigure (din STATE-NOW analysis)

| Endpoint | Decizie | Motiv |
|---|---|---|
| `POST /api/agent/run` (legacy) | ❌ Delete | Înlocuit de `/api/agents` |
| `GET /api/dashboard/route` | ❌ Delete | Dupe cu `/api/dashboard/core` |
| `POST /api/partner/import-csv/preview` | ❌ Delete | Dupe cu `/api/partner/import/preview` |
| `POST /api/portfolio/batch` | 🟡 Keep dacă wire-uim, altfel delete | Backend-only fără UI |
| `POST /api/exports/audit-pack/bundle` | 🟡 Verifică implementare | Minimal/incomplete |

## 7.3 Endpoint-uri **NEW** necesare (din DESTINATION gap analysis)

| New endpoint | Scop | JTBD |
|---|---|---|
| `GET /api/portfolio/inbox-aggregate` | Inbox cross-client unificat | Diana J1 |
| `POST /api/portfolio/broadcast` | Trimite notificare la N clienți afectați | Diana J7 |
| `POST /api/findings/bulk` | Bulk confirm/dismiss/resolve | Claude friction #1 |
| `GET /api/exports/anspdcp-pack/[orgId]` | Audit pack format ANSPDCP-shaped | Radu insight critic |
| `POST /api/clients/quick-add` | Add 1 client cu doar CUI (vs CSV import) | Diana J9 simplified |

## 7.4 Stripe — decizia

`/api/stripe/checkout`, `/portal`, `/webhook` există în routes dar **NU există client în lib**. **Două opțiuni**:
- (A) Implementăm Stripe complet (1-2 săpt) → activ billing live
- (B) Plăți manuale facturate prin emag-payu/Mollie sau bonificare bancară (pentru primii 20 cabinete) → Stripe poate aștepta

**Recomand B pentru launch**, A pentru Săpt 5-6.

---

# 8. COMPONENT LIBRARY (86 → ~50 componente)

## 8.1 Strategie

- **Păstrează 15 primitives** (Button, Card, Skeleton, EmptyState, ErrorScreen, LoadingScreen, Badge, etc.)
- **Refactorizează 24 page-surfaces** — rescrie în componente <300 linii fiecare
- **Reduce 46 widgets la ~30** prin merge similari
- **Șterge 1 unused** (`inspector-mode-panel.tsx`)

## 8.2 Page-surfaces noi (canon-aligned)

| Componenta | Folosit de | Replace |
|---|---|---|
| `<PortfolioOverview />` | `/portfolio` | `portfolio-overview-client.tsx` (refactor 977→<400) |
| `<PortfolioInbox />` | `/portfolio/alerte` | NEW |
| `<PortfolioRemediere />` | `/portfolio/remediere` | `portfolio-tasks-page.tsx` |
| `<PortfolioFurnizori />` | `/portfolio/furnizori` | `portfolio-vendors-page.tsx` |
| `<PortfolioRapoarte />` | `/portfolio/rapoarte` | `portfolio-reports-page.tsx` |
| `<DashboardHome />` | `/dashboard` | refactor `app/dashboard/page.tsx` (706→<300) |
| `<MonitorizareConformitate />` | `/dashboard/monitorizare/conformitate` | NEW (consolidează GDPR/NIS2/AI tabs) |
| `<MonitorizareNIS2 />` | `/dashboard/monitorizare/nis2` | refactor `app/dashboard/nis2/page.tsx` (2800→<500) |
| `<MonitorizareSistemeAI />` | `/dashboard/monitorizare/sisteme-ai` | refactor `app/dashboard/sisteme/page.tsx` (1509→<400) |
| `<ActiuniRemediere />` | `/dashboard/actiuni/remediere` | refactor `resolve-page.tsx` (641→<400) |
| `<SmartResolveCockpit />` | `/dashboard/actiuni/remediere/[findingId]` | NEW conform canon Smart Resolve |
| `<DashboardSetari />` | `/dashboard/setari` | refactor `settings-page.tsx` (1985→<400 cu tabs) |

## 8.3 Widget-uri noi sau refactor

| Widget | Refactor / NEW | Notă |
|---|---|---|
| `<InboxRow />` | NEW | reutilizabil în `/portfolio/alerte` + `/dashboard/monitorizare/alerte` |
| `<FindingRow />` | refactor | standalone + agregate (canon §reguli compoziție #7) |
| `<BulkActionsBar />` | NEW | floating când checkboxes selectate |
| `<ImportWizard />` | KEEP | funcționează |
| `<ProgressiveDisclosure />` | NEW | top 3 + *"Vezi toate (N)"* |
| `<BrandedReportTemplate />` | refactor | white-label brand vizibil |

## 8.4 Componente șterse

- `inspector-mode-panel.tsx` (dev only)
- `legacy-workspace-bridge.tsx` (după redirect-uri 301 active)
- Componente specifice paginilor șterse (NIS2 sub-pagini, sisteme-eu-db-wizard etc.)

---

# 9. MIGRATION PLAN — STATE-NOW → DESTINATION

## 9.1 Faza 1: Curățenie sigură (Săpt 1, 5 zile)

**Zile 1-2: Audit & decizii**
- Run script audit fișiere orfane (vezi STATE-NOW §3)
- Tu aprobi lista: 18 pagini orfane + 7 RO duplicate
- Backup git tag `pre-cleanup-2026-04-XX`

**Zile 3-5: Tăieri**
- Aplicare 22 redirect-uri 301 în `middleware.ts`
- Șterge fișiere orfane (cu commit per batch de 3-5)
- Run TypeScript check + tests după fiecare batch
- Update sidebar nav să match DESTINATION

**Output Săpt 1**: 0 routes orfane, redirect-uri active, build curat.

## 9.2 Faza 2: Engine fix + Inbox (Săpt 2, 5 zile)

**Zile 1-2: Wire scraper website + ANAF data în baseline-scan**
- `lib/server/baseline-scan` integrare cu `lib/server/website-prefill-signals`
- Folosire `efacturaRegistered` din ANAF în finding generation (skip false positives)
- Test cu 3 firme reale (Bitdefender/Altex/Dedeman) → confirm differentiation

**Zile 3-5: Construiește `/portfolio/alerte` Inbox**
- API nou `/api/portfolio/inbox-aggregate`
- UI cu filter/sort/grouping
- Bulk actions bar
- Deep-link la finding/firmă

**Output Săpt 2**: Inbox cross-client funcțional, engine produce findings credibile.

## 9.3 Faza 3: Refactor monstri (Săpt 3, 5 zile)

**Zile 1-3: NIS2 (2800 linii)**
- Split în 4 sub-componente: Assessment / Incidente / Maturitate / DNSC (cu tabs internal)
- Componenta master `<MonitorizareNIS2 />` <500 linii
- Test: navigare fluentă, state preserved între tabs

**Zile 4-5: Settings (1985 linii) + Fiscal (1806 linii) + Sisteme (1509 linii)**
- Settings: split pe tabs (Organizație / Membri / Integrări / Automatizare / White-label / Billing / Notificări)
- Fiscal: redirect la `/dashboard/monitorizare/conformitate?tab=efactura`
- Sisteme: split AI Inventory + AI Conformity + EU DB Wizard pe tabs

**Output Săpt 3**: 0 fișiere >500 linii.

## 9.4 Faza 4: Smart Resolve Cockpit + bulk actions (Săpt 4, 5 zile)

**Zile 1-3: Cockpit unic per finding**
- `/dashboard/actiuni/remediere/[findingId]` cu stack vertical (Context → Impact → Pași → Evidence → Decide)
- 3-click max pentru caz evident
- Progressive disclosure (top 3 critical first)

**Zile 4-5: Bulk actions**
- BulkActionsBar floating
- API `POST /api/findings/bulk`
- Test: confirm 23 finding-uri intake-gdpr într-un click

**Output Săpt 4**: friction #1 (5+ click-uri) rezolvat.

## 9.5 Faza 5: Quick-add client + raport diagnostic (Săpt 5, 5 zile)

**Zile 1-2: Quick-add 1 client**
- `/portfolio/client/quick-add` cu 1 câmp (CUI)
- ANAF → website scrape → applicability → 6-8 findings credibile
- <30 secunde de la click la "vezi clientul în portofoliu"

**Zile 3-5: Diagnostic 1-pagină**
- `/portfolio/client/[orgId]/diagnostic` (nou)
- Generare auto la primul scan
- PDF descărcabil pentru ofertă
- Folosit ca lead magnet în GTM

**Output Săpt 5**: Diana adaugă client nou în <45 min vs 2-3 zile azi.

## 9.6 Faza 6: Polish + ANSPDCP-shaped export + launch soft (Săpt 6, 5 zile)

**Zile 1-2: ANSPDCP audit pack**
- Endpoint `/api/exports/anspdcp-pack/[orgId]`
- PDF semnat cryptographic
- Format ANSPDCP-shaped (nu generic)

**Zile 3-4: Polish UX (frictiunile rămase din Claude feedback)**
- Portfolio auto-refresh after mutations
- Header/stepper single source of truth
- Label clarification ("Numele cabinetului tău")
- Empty states + loading states + error states consistente

**Ziua 5: Launch soft**
- 5 design partners invited (free 6 luni)
- USER-VALIDATION-KIT activ
- Telemetrie + monitoring activ
- Anunț LinkedIn founder voice

**Output Săpt 6**: produs launch-able cu Diana primary.

---

# 10. DECISION LOG (de ce am ales așa)

| # | Decizie | Alternativă respinsă | Motiv |
|---|---|---|---|
| 1 | Persona primary = **Diana (consultant)** | Mihai (SME solo) | ARPU 10-50× + canal CECCAR + market gap real |
| 2 | Pricing **€149/lună Pro sweet spot** | €80/client (vechi roadmap) | Market research: rebill margin 170%, accountant pays max 100-150 RON/client/lună |
| 3 | **B2B2B** model | B2B direct la SME | Compliance e tăcut + canalul real e contabilul |
| 4 | Sidebar partner cu **Portofoliu sus + Firmă jos** | Tabs sau toggle | Canon UX/IA — preserves portfolio access mereu |
| 5 | Settings **3 niveluri** (Cont / Firmă / Portofoliu) | Settings unic | ADDENDUM Clarificare 4 — niveluri distincte de scope |
| 6 | **Páginile Acasă/Scanează păstrate** sub /dashboard | Mutare la /portfolio | Canon: per-firmă rămâne per-firmă |
| 7 | NIS2/AI/Fiscal devin **sub-pagini Monitorizare** | Pagini top-level | Canon §3.2 — applicability filter, NU pagini fixe |
| 8 | Smart Resolve Cockpit = **stack vertical 5 pași** | Modal sau drawer | Canon Smart Resolve + JTBD Diana (1 finding = 1 cockpit) |
| 9 | **Bulk actions** pentru findings | Doar single | Friction Claude #1 (720 click-uri/lună era killer) |
| 10 | **Progressive disclosure** (top 3 first) | Show all | Friction Claude #5 (12 findings = overwhelm) |
| 11 | Stripe **DEFER la Săpt 5-6** | Implement now | Launch faster cu plăți manuale primii 20 cabinete |
| 12 | **EOS v1 design system** păstrat | DS v2 / Wave 0 | Canon §10 — EOS v1 e neschimbat |
| 13 | Channel: **CECCAR + FB groups + integrare SAGA/SmartBill** | Ads + SEO | Compliance NU e viral, e word-of-mouth prin trusted advisor |
| 14 | **Watchdog vizibil** prin Inbox + cron-uri agregate | Background silent | Subscription justification (touchpoints recurrente) |
| 15 | Ștergere **18 pagini orfane**, 7 RO duplicate | Păstrare "ca să nu rupem nimic" | Redirect 301 = zero risc, beneficiul e claritate |

---

# 11. ANTI-PATTERNS — CE NU CONSTRUIM

Confirmat din canon §11 + decizii noastre:

1. ❌ **Chat / mesagerie** între consultant-client (CompliAI nu e Slack)
2. ❌ **Facturare / contabilitate** (nu suntem ERP)
3. ❌ **CRM** (portofoliul e operational, nu sales)
4. ❌ **Semnătură electronică** (docs se generează, semnează extern)
5. ❌ **Training / e-learning platform** (nu suntem Pluralsight)
6. ❌ **Backup / disaster recovery** (nu suntem AWS)
7. ❌ **Integrare OneTrust/ServiceNow** (nu acum, poate 2028)
8. ❌ **Daily-intensive workflow** (Diana intră 10 min/zi, nu 4h)
9. ❌ **Generic GDPR coverage** (Radu cere ANSPDCP-shaped exports)
10. ❌ **One-and-done usage** (lose subscription) — touchpoints recurrente OBLIGATORII

---

# 12. SUCCESS METRICS

## 12.1 Metric-uri produs (revealed în Inspector tool / Mixpanel)

| Metric | Target Y1 |
|---|---|
| Paying cabinets (€149+ Pro) | **20 până la luna 6** |
| Total client seats (cabinete × 12 avg) | **240** |
| Daily active cabinets | **15+ (75% of paying)** |
| Avg time to first finding resolved | **<10 min from import** |
| Avg findings rezolvate per cabinet/lună | **30+ (1.5/zi)** |
| Bulk actions usage | **>40% of resolutions** (validare friction fix) |
| Inbox aggregate daily opens | **>80% of cabinets** (validation watchdog value) |
| Net Revenue Retention | **>120%** (cabinete adaugă clienți) |

## 12.2 Metric-uri business

| Metric | Target Y1 |
|---|---|
| ARR | **€35.000-€60.000** (20 cabinete × €149 × 12 + upsells) |
| Churn rate | **<10% anual** (rebill margin = stickiness) |
| CAC payback | **<6 luni** (canal organic CECCAR + referral) |
| NPS | **>40** (mid-tier SaaS RO) |
| Design partners (Săpt 1) → Paying (luna 3) | **3+ din 5** |

## 12.3 Metric-uri growth (Săpt 1-12)

| Metric | Target |
|---|---|
| LinkedIn followers (founder voice) | **+500 organic Săpt 12** |
| FB groups: răspunsuri publicate | **30+ în 5 grupuri mari** |
| CECCAR partnership status | **conversation → MoU sau decline** |
| Referral conversions | **3+ cabinete → 1 referal nou** |

---

# 13. OPEN QUESTIONS — VALIDARE ÎN SĂPT 1-2

Întrebări pe care le validăm cu primii 5 design partners (vezi `USER-VALIDATION-KIT.md`):

1. **Pricing**: €149/lună Pro = sweet spot? Sau preferă €99/lună cu fewer features?
2. **Inbox cross-client**: chiar e the killer feature? Sau alt JTBD e mai sus?
3. **Bulk actions**: pe ce categorii? Per framework? Per severity? Per client?
4. **White-label**: cât de detaliat? Doar logo? Sau full theme?
5. **Client portal**: chiar e necesar pentru SME? Sau email + PDF e suficient?
6. **Quick-add client**: <30 secunde target, OK? Sau acceptă 2-3 min?
7. **ANSPDCP-shaped export**: chiar e formatul oficial pe care-l așteaptă auditorii? (validare cu Radu profesionist)
8. **Integrare SAGA/SmartBill**: read-only OK sau cer write?
9. **Mod compliance vs solo**: există suprapunere mare între Radu și Mihai?

---

# 14. APENDICE

## A. Documente referențiate
- [STATE-NOW.md](./STATE-NOW.md) — inventar code actual
- [USERS.md](./USERS.md) — personas operaționale
- [USER-VALIDATION-KIT.md](./USER-VALIDATION-KIT.md) — întrebări design partners
- [MARKET-RESEARCH.md](./MARKET-RESEARCH.md) — piață + concurență + pricing
- [canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md](./canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md) — canon UX/IA
- [canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md](./canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md) — addendum
- [canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](./canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md) — cockpit pattern detail

## B. Documente DEPRECATED de marcat oficial

Conform ADDENDUM Clarificare 5:
- `docs/final-guide-plan/02-ux-ia-blueprint.md` → înlocuit
- `docs/final-guide-plan/03-ux-wireframe-prototype.jsx` → înlocuit
- `public/gpt-ux-flow-brief.md` → archive
- `public/ux-ui-flow-arhitectura.md` → archive
- `public/page-recipes-*.md` → archive

## C. Documente CANONICE

- `docs/canon-final/*` — toate
- `docs/STATE-NOW.md`, `USERS.md`, `MARKET-RESEARCH.md`, `DESTINATION.md` (acest fișier)

---

> **END DESTINATION.md v1.0** — ultima generare 2026-04-19.
> Update versiune (v2, v3) la fiecare modificare structurală majoră.
> Build conform §9 — 6 săptămâni la launch soft.
