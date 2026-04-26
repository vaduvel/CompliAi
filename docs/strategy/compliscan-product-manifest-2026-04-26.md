# CompliScan — THE PRODUCT

> ⭐ **START AICI** — Sursa supremă pentru CE ESTE CompliScan ca produs complet.
>
> **Hierarchy canonical (clarificat 26 apr 2026)**:
> 1. **THIS** = produs complet, full functional state (canonical supreme)
> 2. `compliscan-v1-final-spec-2026-04-26.md` = launch slice v1 (12 săpt)
> 3. `IA-UX-PROPUNERE (1).md` + `IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md` = arhitectură IA/UX (citite OBLIGATORIU împreună)
> 4. `IA-UX-IMPLEMENTATION-MATRIX.md` = sprint plan execuție
> 5. `IA-UX-ROUTE-PARITY-ADDENDUM.md` = adevăr cod-vs-IA pe rute
> 6. `market-research-2026-04-26.md` = suport piață (research, NU instrucțiuni build)
> 7. `compliscan-readiness-gap-memo-2026-04-26.md` = readiness memo (DEPRECATED canonical, util doar gap-uri)

**Document type**: Canonical product manifest
**Status**: Sursa SUPREMĂ pentru CE ESTE CompliScan ca produs complet
**Data**: 26 aprilie 2026
**NU este**: roadmap, sprint plan, MVP spec
**ESTE**: descrierea integrală a produsului în starea sa funcțională completă (codul actual + decizii strategice consolidate)
**Subordinat acestuia**: `compliscan-v1-final-spec-2026-04-26.md` (launch slice care implementează acest produs faza 1)

---

> **CompliScan = Privacy Operations Platform pentru cabinete de externalizare DPO din Europa, Romania-native, multi-tenant cu white-label arhitectural, multi-framework (8 reglementări UE), AI-assisted cu validare umană obligatorie.**

---

## Cuprins

1. [Identitate](#1-identitate)
2. [Misiunea](#2-misiunea)
3. [Cele 4 personas](#3-cele-4-personas)
4. [Arhitectura — 2 produse în 1 codebase](#4-arhitectura--2-produse-în-1-codebase)
5. [Cele 8 frameworks acoperite](#5-cele-8-frameworks-acoperite)
6. [Cele 10 obiecte primitive](#6-cele-10-obiecte-primitive)
7. [Kernel-ul — finding lifecycle](#7-kernel-ul--finding-lifecycle)
8. [Cele 5 moduri de navigație](#8-cele-5-moduri-de-navigație)
9. [Cele 43 rute canonice](#9-cele-43-rute-canonice)
10. [White-label arhitectural](#10-white-label-arhitectural)
11. [Romanian-native integrations](#11-romanian-native-integrations)
12. [AI engine multi-model](#12-ai-engine-multi-model)
13. [Audit & traceability](#13-audit--traceability)
14. [Monitoring & drift](#14-monitoring--drift)
15. [Pricing tiers & capabilities](#15-pricing-tiers--capabilities)
16. [Distribuție & GTM model](#16-distribuție--gtm-model)
17. [Differentiators competitivi](#17-differentiators-competitivi)
18. [Ce CompliScan NU este](#18-ce-compliscan-nu-este)
19. [Outcomes strategice](#19-outcomes-strategice)
20. [Glosar canonical](#20-glosar-canonical)

---

## 1. Identitate

```
═══════════════════════════════════════════════════════════════
                       CompliScan
   Privacy Operations Platform pentru cabinete DPO
═══════════════════════════════════════════════════════════════
```

| Atribut | Valoare canonică |
|---|---|
| **Nume** | CompliScan |
| **Tagline** | "Gestionezi 50 de clienți DPO ca pe 1. Brand-ul tău. Munca ta. Tool-ul nostru." |
| **Categoria** | Privacy Operations Platform (PrivacyOps) |
| **Limbă primară** | Română nativă |
| **Limbă secundară** | Engleză (post-CEE expansion) |
| **Domain** | compliscan.ro |
| **Email-uri** | hello@compliscan.ro / dpo@compliscan.ro / legal@compliscan.ro |
| **Localizare** | Romania-native, EU-aligned, CEE-ready |
| **Tip livrare** | Multi-tenant SaaS, web-based |
| **Hosting** | EU region (Vercel + Supabase Frankfurt) |
| **Disclaimer canonic** | "Drafturi pregătite pentru validarea expertului tău CIPP/E" |

### Ce face produsul concret

CompliScan e **operating system-ul** pe care un cabinet de externalizare DPO îl folosește zilnic pentru a:

1. Gestiona portofoliul de clienți compliance (20-200+ clienți IMM)
2. Detecta automat findings de conformitate (GDPR + 7 alte frameworks)
3. Genera drafturi de documente cu AI (privacy policy, DPA, ROPA, DSAR, DPIA)
4. Valida și aproba drafturile (consultant CIPP/E uman validează)
5. Trimite livrabile brand-uite cabinet către patron (magic links, exporturi PDF)
6. Monitoriza continuu drift-uri (legislative, site, vendor)
7. Demonstra conformitate la audit (audit pack, manifest SHA-256, hash chain)

### Cu cine concurează

| Categoria | Concurenți | Pozitionarea CompliScan |
|---|---|---|
| **EU enterprise** (audatis, Dastra, OneTrust) | €500-30K/lună, US/UE-focused | 5-10x mai accesibil, RO-native |
| **EU mid-market** (DPOrganizer→DataGuard, Keepabl) | €600-2K/lună | Multi-framework, local context |
| **RO local** (Privacy Manager) | Single-tenant, GDPR-only | Multi-tenant, multi-framework |
| **Servicii manuale** (GDPR Complet, LegalUp, Decalex) | Excel + Word, €100-350/lună per client | Infrastructure pentru ei, nu replacement |

---

## 2. Misiunea

CompliScan **multiplică** capacitatea operațională a unui cabinet DPO, **nu** o înlocuiește.

### Promisiunea explicită către Diana (DPO consultant)

> "Singură cu Excel + Word, poți deservi 30 clienți. Cu CompliScan, deservești 200 clienți cu aceeași echipă. Cabinetul tău crește. Brand-ul tău rămâne pe livrabile. Patronul tău nu știe că existăm."

### Promisiunea către Mihai (patron client al cabinetului)

CompliScan **nu îi promite nimic direct**. Mihai vede doar brand-ul cabinetului. CompliScan e infrastructura invizibilă.

### Anti-promisiunile

CompliScan **NU promite**:
- ❌ "100% conformitate garantată"
- ❌ "Înlocuim avocatul / DPO-ul"
- ❌ "Documentele AI sunt legal valide automat"
- ❌ "Eviți amenzile ANSPDCP"
- ❌ "Compliance-ul e ușor"

Acestea sunt promisiuni de marketing toxice care creează liability + churn.

---

## 3. Cele 4 personas

### 3.1 Diana — DPO Consultant (PRIMARY USER & BUYER)

```
┌──────────────────────────────────────────────────────────────┐
│ DIANA — DPO Consultant                                       │
│                                                              │
│ Cine: Senior consultant la firmă boutique GDPR/cybersec      │
│ Demograf: 30-50 ani, CIPP/E certificat, 5+ ani experiență    │
│ Echipă: 2-10 specialiști (jurist + IT + auditor)             │
│ Portofoliu: 20-80 clienți IMM (sweet spot Growth tier)       │
│                                                              │
│ Tarifare client: €100-250/lună abonament DPO                 │
│ Revenue cabinet: €3.000-15.000/lună                          │
│ Cost CompliScan: €249-499/lună (4-7% din revenue)            │
│                                                              │
│ Dureri actuale:                                              │
│   • Excel + Word + Google Drive + email = haos               │
│   • Imposibil să demonstrezi rapid status conformitate       │
│   • DSAR-uri se pierd în inbox                               │
│   • Drift-uri legislative invizibile                         │
│   • Brand-ul "amateur" (PDF-uri Word generic)                │
│                                                              │
│ Ce vrea:                                                     │
│   • Portofoliu cross-client cu severitate                    │
│   • Drafturi AI gata de validare în 5 min (nu 30 min)        │
│   • Brand cabinet pe TOT ce iese către patron                │
│   • Audit trail pentru când vine ANSPDCP                     │
│   • Monitorizare automată drift                              │
│                                                              │
│ Exemple firme reale RO:                                      │
│   • DPO Data Protection                                      │
│   • WestGDPR                                                 │
│   • DPO Consulting                                           │
│   • Decalex (combo GDPR + NIS2)                              │
│   • Sectio Aurea (cybersec leaning)                          │
│   • Privacy Manager (concurent local)                        │
│                                                              │
│ Decision-maker: managing partner / fondator                  │
│ Cycle de cumpărare: 2-4 săptămâni (vs 3-6 luni la cabinet)   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Mihai — Patron SRL (DESTINATAR, NU USER)

```
┌──────────────────────────────────────────────────────────────┐
│ MIHAI — Patron SRL                                           │
│                                                              │
│ Cine: Patron firmă mică/medie cu DPO outsourced la Diana     │
│ Status: NU folosește CompliScan ca aplicație                 │
│ Brand vizibil: doar logo-ul cabinetului Diana                │
│                                                              │
│ Ce primește:                                                 │
│   • Trust profile public (compliance score firmă)            │
│   • Magic link aprobare drafturi (privacy policy, DPA)       │
│   • Email lunar cu raport conformitate                       │
│   • Magic link pentru DSAR submit (când persoana vizată cere)│
│   • Notificări breach (urgent, brand cabinet)                │
│                                                              │
│ Ce face concret:                                             │
│   • Click magic link → vede document în page brand cabinet   │
│   • Aprobă/respinge cu motivare                              │
│   • Semnează digital (DigiSign integration optional)         │
│   • Descarcă PDF brand cabinet                               │
│                                                              │
│ NU are:                                                      │
│   • Cont CompliScan                                          │
│   • Dashboard                                                │
│   • Acces la setări                                          │
│   • Vreo conexiune directă cu CompliScan                     │
│                                                              │
│ Plătește: nimic. Diana plătește, include în serviciu DPO.    │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Radu — Compliance Officer Intern (TERTIARY)

```
┌──────────────────────────────────────────────────────────────┐
│ RADU — Compliance Officer Intern                             │
│                                                              │
│ Cine: Compliance officer angajat full-time într-o companie   │
│ Sector: fintech / banking / healthcare / mari corporații     │
│ Salariu: €50-120K/an (intern, nu outsourced)                 │
│                                                              │
│ Workspace mode: SINGLE org (NU portfolio)                    │
│                                                              │
│ Discipline surfaces specifice (peste DPO OS standard):       │
│   • Approvals queue (workflow agreement intern)              │
│   • Review cycles (revalidări periodice automate)            │
│   • Audit log append-only                                    │
│   • Agent orchestrator (Regulatory Radar)                    │
│   • Console index pentru Pro+                                │
│                                                              │
│ Plan: Studio €999/lună (companie plătește direct)            │
│                                                              │
│ Segment estimat RO:                                          │
│   • Bănci: <10                                               │
│   • Fintech: ~50                                             │
│   • Healthcare privat: ~100                                  │
│   • Mari corporații: ~50-100 firme cu DPO intern             │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Viewer — Read-only role (PERMANENT INTERN)

```
┌──────────────────────────────────────────────────────────────┐
│ VIEWER — Read-only role                                      │
│                                                              │
│ Cine: Manager senior care supervizează fără să execute       │
│ Tip: subset read-only din Radu (NU user primar)              │
│                                                              │
│ Workspace: 4 items nav                                       │
│   • Acasă (snapshot read-only)                               │
│   • Taskurile mele (findings asignate, read-only)            │
│   • Dosar (read-only)                                        │
│   • Setări profil (doar read)                                │
│                                                              │
│ Restricții: butoanele de acțiune disabled cu tooltip         │
│   "Rol read-only — cere acces la owner"                      │
│                                                              │
│ Notă: distinct de GuestAuditor (sesiune temporară expirable) │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Arhitectura — 2 produse în 1 codebase

```
                  ┌─────────────────────────────┐
                  │   compliscan.ro (landing)   │
                  └──────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │   ONBOARDING — pas 1        │
                  │   "Cine ești?"              │
                  └──────────────┬──────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│   DPO OS       │      │   Fiscal OS    │      │   Internal     │
│   (PRIMARY)    │      │   (SECONDARY)  │      │   Compliance   │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ DPO firm       │      │ Cabinet        │      │ Compliance     │
│ 20-80 clienți  │      │ contabil       │      │ officer        │
│                │      │ CECCAR         │      │ intern         │
│                │      │                │      │                │
│ Workspace:     │      │ Workspace:     │      │ Workspace:     │
│ Portfolio mode │      │ Portfolio mode │      │ Single org     │
└────────┬───────┘      └────────┬───────┘      └────────┬───────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │  KERNEL COMUN (intact)      │
                  │  • Multi-tenant per-org     │
                  │  • Finding lifecycle        │
                  │  • Evidence engine          │
                  │  • White-label arhitectural │
                  │  • Audit trail (hash chain) │
                  │  • V3 design system         │
                  │  • Multi-AI provider        │
                  │  • Stripe billing           │
                  │  • Workspace switching      │
                  │  • Capability tokens (plan) │
                  └─────────────────────────────┘
```

### Strategia de lansare

| Produs | Status | Notes |
|---|---|---|
| **DPO OS** | ✅ Primary launch (Q3 2026) | Marketing focus, pricing pe site, sales motion |
| **Fiscal OS** | ⏸️ Hibernate, decizie Q4 2026 | Cod păstrat, ascuns marketing, post-DPO OS |
| **Internal Compliance** | ✅ Sub-mode DPO OS (single workspace) | Acelasi cod, plan Studio dedicat |

### De ce arhitectura asta funcționează

- **Kernel comun** = build once, ship to 3 buyer types
- **Onboarding pas 1** = single decision point, restul se configurează automat
- **Plan gating topologic** = capability tokens decid ce module sunt active
- **Workspace switching** = un consultant cu DPO firm + companie internă poate avea ambele

---

## 5. Cele 8 frameworks acoperite

### 5.1 GDPR (Regulament UE 2016/679)

```
✓ Privacy Policy generator (Art. 13-14)
✓ DPA generator (Art. 28)
✓ ROPA (Records of Processing Activities, Art. 30)
✓ DPIA (Data Protection Impact Assessment, Art. 35)
✓ DSAR automation (Articolul 15-22)
✓ Breach notification ANSPDCP (Art. 33)
✓ Cookie consent management
✓ Data subject portal (public, magic link)
✓ Templates jurat-validate RO (Legea 190/2018 specific)
```

### 5.2 NIS2 (Directiva UE 2022/2555 + OUG 155/2024)

```
✓ Eligibility wizard (entitate esențială vs importantă)
✓ Maturity assessment (registru DNSC)
✓ Incident management (raportare 24h/72h)
✓ Governance setup (politici, training, audit)
✓ DNSC registration flow
✓ Vendor cybersec assessment
```

### 5.3 EU AI Act (Regulament UE 2024/1689)

```
✓ AI Systems inventar
✓ Risk classification (limited / high-risk / prohibited)
✓ Art. 50 transparency obligations
✓ EU Database wizard (high-risk AI registration)
✓ Annex IV technical documentation
✓ Human oversight requirements
✓ AI Act timeline tracker (milestone 02.08.2026)
```

### 5.4 DORA (Regulament UE 2022/2554)

```
✓ Financial entity scope check (BNR/ASF supervised)
✓ Incident log + classification
✓ TPRM (Third Party Risk Management)
✓ ICT register
✓ DORA testing program (post v1)

Aplicabil la: ~250-300 entități financiare RO (bănci, IFN, SSIF, asigurări)
```

### 5.5 Pay Transparency (Directiva UE 2023/970)

```
✓ Hiring transparency (toți angajatorii — mass)
✓ Reporting nișă (firme >50 angajați — ~10.500 firme RO)
✓ Pay gap analyzer (post v1)
✓ Salary band publish flow

Deadline: 7 iunie 2026 transpunere RO
```

### 5.6 Whistleblowing (Directiva UE 2019/1937)

```
✓ Public intake channel (per organization, magic link)
✓ Internal triage (Radu/compliance creează findings)
✓ 3-month response tracking
✓ Retaliation protection workflow
✓ Anonymous reporting support
✓ Audit trail per report
```

### 5.7 Vendor Management

```
✓ Vendor onboarding workflow
✓ DPA signing tracker
✓ Sub-processor list (per Art. 28 GDPR)
✓ Vendor risk assessment
✓ Revalidation cycles
✓ Cross-client vendor sharing (Diana view)
```

### 5.8 e-Factura / Fiscal (FISCAL OS — secondary product)

```
✓ UBL CIUS-RO validator (FULLY BUILT, validator real)
✓ ANAF SPV OAuth integration
✓ e-Factura B2B (mandatory iulie 2024)
✓ e-Factura B2C (mandatory ianuarie 2025)
✓ Discrepanțe e-TVA detector
✓ Filing record log
✓ Signal log ANAF (notificări automate)
✓ Read-only API: SmartBill / Saga / Oblio
⏸ SAF-T (post v1, complex)
```

**Notă fiscal**: NU înlocuiește SmartBill. E layer compliance peste programul de facturare existent al contabilului.

---

## 6. Cele 10 obiecte primitive

```
| # | Obiect          | Rol                                    | Relații                          |
|---|-----------------|----------------------------------------|----------------------------------|
| 1 | Firmă           | Entitatea protejată (CUI, sector)      | are Profil, Dosar, Findings      |
| 2 | Profil firmă    | Răspunsuri onboarding + applicability  | aparține Firmei; produce Findings|
| 3 | Portofoliu      | Colecția Firmelor (doar Diana)         | conține Firme; agregă Alerte     |
| 4 | Scanare         | Sursa findings (doc, site, intake)     | aparține Firmei; produce Findings|
| 5 | Finding         | Cazul de rezolvat (unitatea muncii)    | are clasă; se închide cu Dovadă  |
| 6 | Dovadă          | Ce închide un Finding                  | aparține Finding; trăiește Dosar │
| 7 | Dosar           | Containerul Firmei (closed findings)   | agregă Findings + Dovezi         |
| 8 | Livrabil        | Output extern (audit pack, raport)     | brand-uit cabinet; merge la Mihai│
| 9 | Alertă          | Semnal că s-a schimbat ceva            │ poate genera/redeschide Finding  |
|10 | Monitorizare    | Starea post-închidere (review, drift)  │ produce Alerte la trigger        │
```

### Sub-concepte care NU sunt primitive

User/Membership (auth infra), Workspace mode (atribut sesiune), Cockpit (vedere, nu obiect), Vendor (entitate internă firmei), AI system (entitate internă), DSAR request (entitate internă), Incident (entitate internă), Plan (atribut Portofoliu), GuestAuditor (sesiune temporară).

---

## 7. Kernel-ul — finding lifecycle

### 3 clase de execuție

Kernel-ul (`lib/compliscan/finding-kernel.ts`, 3.800+ linii) clasifică orice finding în:

| Clasa | Comportament | CTA principal | Exemplu |
|---|---|---|---|
| **documentary** | Generator inline + validate + approve + resolve | "Confirmă și generează" | GDPR-001 Privacy Policy lipsă |
| **operational** | Evidence card + upload/notă + gating close | "Atașează dovadă" | GDPR-005 Cookies necentralizate |
| **specialist_handoff** | Hero "Pasul greu se face în modulul X" + auto-return | "Deschide flow-ul X" | NIS2-015 Raportare incident DNSC |

### CockpitRecipe

Fiecare clasă are un `CockpitRecipe` care dictează:
- CTA-ul principal
- Dacă se deschide generator inline
- Dacă se cere evidence note
- Dacă se face handoff cu `workflowLink` + `returnTo`
- Pașii stepper (4-6 pași per clasă)

### Lifecycle stări

```
detected → confirmed → in_progress → resolved → under_monitoring
                                          ↓
                                       reopened (drift/review)
                                          ↓
                                       in_progress (ciclu reîncepe)
```

### Reopen rules

```
Triggers care redeschid un finding rezolvat:
  • drift_dovada (dovada nu mai e validă)
  • drift_legislativ (legea s-a schimbat)
  • drift_site (site-ul firmei s-a schimbat)
  • drift_vendor (vendor-ul a schimbat DPA)
  • review_scadent (review cycle iminent)
  • baseline_invalidat (baseline scan a expirat)
```

---

## 8. Cele 5 moduri de navigație

### 8.1 Mihai (solo) — 5 items

```
1. Acasă          /dashboard
2. Scanează       /dashboard/scan
3. De rezolvat    /dashboard/resolve
4. Dosar          /dashboard/dosar
5. Setări         /dashboard/settings
```

Monitorizare integrată în Acasă ca secțiune (P8 degradat elegant pentru 1 firmă).

### 8.2 Diana în portfolio mode — 5 items

```
1. Portofoliu     /portfolio
2. Monitorizare   /portfolio/alerts
3. Remediere      /portfolio/tasks (TRIAJ, fără batch execute)
4. Rapoarte client /portfolio/reports
5. Setări         /dashboard/settings
```

`/portfolio/vendors` accesibil doar din card în `/portfolio` overview.

### 8.3 Diana în context client activ — 6 sau 7 items

Shell afișează banner persistent: **"Lucrezi pentru Apex SRL — ca DPO Complet"**.

```
1. ↩ Portofoliu        /portfolio                  (escape hatch)
2. Acasă               /dashboard
3. Scanează            /dashboard/scan
4. De rezolvat         /dashboard/resolve
5. Monitorizare ★      /dashboard/monitoring       (Pro/Studio only)
6. Dosar               /dashboard/dosar
7. Setări              /dashboard/settings
```

### 8.4 Radu (compliance intern) — 6 items + Console

```
1. Acasă               /dashboard
2. Scanează            /dashboard/scan
3. De rezolvat         /dashboard/resolve
4. Monitorizare        /dashboard/monitoring (suite 4 rute)
5. Dosar               /dashboard/dosar
6. Setări              /dashboard/settings
7. Console (cond.)     /dashboard/console (Pro+ sau compliance role)
```

### 8.5 Viewer — 4 items read-only

```
1. Acasă               /dashboard
2. Taskurile mele      /dashboard/resolve?owner=me
3. Dosar               /dashboard/dosar (read-only)
4. Setări profil       /dashboard/settings?tab=profile
```

Toate butoanele de acțiune disabled cu tooltip "Rol read-only".

---

## 9. Cele 43 rute canonice

### Public / Awareness (13 rute)

```
1.  /                   landing register-first
2.  /pricing            3 planuri (Solo/Growth/Pro/Studio)
3.  /login              auth minim
4.  /register           creare cont
5.  /reset-password     auth recovery
6.  /demo               demo guided
7.  /privacy            legal
8.  /terms              legal
9.  /trust/[orgId]      profil public conformitate (brand cabinet)
10. /r/renewal/[orgId]  patron magic link renewal
11. /whistleblowing/[token]  canal public sesizare
12. /claim              owner ownership flow
13. /shared/[token]     livrabil token-gated patron
```

### Onboarding (1 rută)

```
14. /onboarding         wizard 3 pași (cine ești → brand → trial)
```

### Portofoliu — Diana (5 rute)

```
15. /portfolio              overview cross-client
16. /portfolio/alerts       monitorizare cross-client
17. /portfolio/tasks        triage findings (fără batch execute)
18. /portfolio/vendors      furnizori cross-client (card-only)
19. /portfolio/reports      livrabile per client
```

### Dashboard core (8 rute)

```
20. /dashboard                         Acasă (snapshot)
21. /dashboard/scan                    intake unificat
22. /dashboard/scan/results/[scanId]   rezultat scan
23. /dashboard/resolve                 queue findings
24. /dashboard/resolve/[findingId]     COCKPIT (clasa-aware)
25. /dashboard/dosar                   Dosar 4 tab-uri
26. /dashboard/scan/history            istoricul scanărilor
27. /dashboard/settings                setări workspace
```

### Monitoring suite (4 rute)

```
28. /dashboard/monitoring              overview
29. /dashboard/monitoring/alerte       drift + legislative
30. /dashboard/monitoring/approvals    queue approvals
31. /dashboard/monitoring/agents       agent runs
```

### NIS2 suite cu shell comun (5 rute)

```
32. /dashboard/nis2                    overview/redirect
33. /dashboard/nis2/eligibility        wizard eligibility
34. /dashboard/nis2/maturitate         maturity assessment
35. /dashboard/nis2/inregistrare-dnsc  flow înregistrare DNSC
36. /dashboard/nis2/governance         setup guvernanță
```

### Specialist tools — 7 rute dual-mode

```
37. /dashboard/dsar              DPO console / cockpit tool
38. /dashboard/fiscal            Fiscal console / cockpit SPV
39. /dashboard/vendor-review     Vendor console / cockpit tool
40. /dashboard/sisteme           AI inventory / cockpit AI
41. /dashboard/pay-transparency  Cockpit tool (no console)
42. /dashboard/dora              Financial console / cockpit DORA
43. /dashboard/whistleblowing    Internal triage console
```

### Console index — Radu only (1 rută)

```
44. /dashboard/console           index 8 console specialist
```

**Total: 43+1 = 44 rute canonice unice.** Fiecare are rol unic și e justificată printr-un principiu IA-UX.

---

## 10. White-label arhitectural

### Principiul P9

> "Brand-ul cabinetului e default la orice output client-facing. CompliScan e invizibil pe orice suprafață pe care o vede patronul."

### Ce se brand-uiește automat

```
✓ Trust profile public /trust/[orgId]
✓ Magic links email (renewal, approval, breach notification)
✓ PDF exports (audit pack, annex lite, response pack)
✓ Email templates (raport lunar, alertă critică, drift)
✓ Shared token pages /shared/[token]
✓ Whistleblowing public channel
✓ DPA signing flow (DigiSign integration optional)
✓ DSAR submit portal
```

### Ce primește cabinetul în setări

```
Setări → Brand & livrabile
  • Logo (upload PNG/SVG)
  • Denumire cabinet
  • Culoare accent (token primary)
  • Font opțional (override Space Grotesk)
  • Antet email (template HTML)
  • Semnătură (consultant CIPP/E + numere)
  • Footer legal (custom)
  • Domain custom (Studio tier+)
  • Cookie banner (per cabinet config)
```

### Capture flow

Brand-ul se captează la **onboarding pas 2** (după "Cine ești → Cabinet GDPR"). Diana poate să sară pasul ăsta și să adauge brand-ul la primul export.

### Boundary explicit

```
PATRON (Mihai) vede:
  ✓ Logo cabinet (DPO Complet)
  ✓ Denumire cabinet
  ✓ Email cabinet
  ✓ Semnătură consultant CIPP/E
  ✗ NIMIC despre CompliScan
  ✗ Logo CompliScan
  ✗ Domain compliscan.ro (păstrăm shared/[token] ca minimal mention)

CONSULTANT DIANA vede:
  ✓ Logo CompliScan în nav primary
  ✓ Branding CompliScan în Setări
  ✓ Footer "Powered by CompliScan" (minimal)
```

---

## 11. Romanian-native integrations

### 11.1 ANAF SPV (Sistem Persoană Vizată)

```
✓ OAuth flow real (autorizare cabinet)
✓ e-Factura B2B (citește facturi emise/primite)
✓ e-Factura B2C (mandatory ianuarie 2025)
✓ UBL CIUS-RO validator (real, NOT stub)
✓ Discrepanțe e-TVA detector
✓ Signals ANAF (notificări fiscale)
✓ Filing records tracker
✓ Submit SPV (cu approval queue)

Status: cod existent, mature
```

### 11.2 ANSPDCP (Autoritatea Națională de Supraveghere)

```
✓ Forms native română (breach notification, GDPR-019)
✓ Tracking amenzi publicate
✓ Plângeri trimise (referință)
✓ Decizii ANSPDCP în library

Status: forms scrise, decision import semi-automat
```

### 11.3 DNSC (Directoratul Național de Securitate Cibernetică)

```
✓ NIS2 entity registration flow (OUG 155/2024)
✓ Incident reporting 24h early warning
✓ Incident reporting 72h notification
✓ DNSC portal integration (când disponibil)

Status: pregătit pentru DNSC API când publică
```

### 11.4 ONRC (Oficiul Național al Registrului Comerțului)

```
✓ CUI lookup → date firmă auto-populate
✓ Sector + CAEN code
✓ Number of employees
✓ Legal status + history

Status: integrat (lib/onrc-prefill)
```

### 11.5 Monitorul Oficial RO

```
✓ Daily monitor pentru OUG-uri / Legi noi
✓ Detect impact pe portofoliu (ce frame e afectat)
✓ Trigger alerte cross-client

Status: cron job + parser, în production
```

### 11.6 SmartBill / Saga / Oblio (read-only API)

```
✓ Read facturi emise (per client) → validate UBL
✓ Read RoPA implicit din procesarea facturilor
✓ Detect vendor-uri din facturi → vendor management

Status: planned Sprint 2 (Fiscal OS prerequisite)
```

### 11.7 EUR-Lex + Comisia Europeană

```
✓ AI Act timeline tracker (milestones obligatorii)
✓ NIS2 transposition status pe state membre
✓ DORA RTS-uri secundare watch
✓ Pay Transparency transposition tracking

Status: cron job lunar, manual review
```

---

## 12. AI engine multi-model

### Provider abstraction

```typescript
// lib/ai/provider.ts
interface AIProvider {
  generate(prompt: string, opts: GenOpts): Promise<string>
  ocr(file: File): Promise<string>
  extract(text: string, schema: Schema): Promise<JSON>
  embed(text: string): Promise<number[]>
}

const providers = {
  claude: new ClaudeProvider({ model: "claude-sonnet-4-6" }),
  claudeOpus: new ClaudeProvider({ model: "claude-opus-4" }),
  gemini: new GeminiProvider({ model: "gemini-2.5-pro" }),
  mistral: new MistralProvider({ model: "mistral-large-2" }),
}
```

### Per-task routing

| Task | Model implicit | Fallback |
|---|---|---|
| Document drafting (DPA, PP) | **Claude Sonnet 4.6** | Mistral L2 (EU sov.) |
| Complex compliance (NIS2 maturity) | **Claude Opus 4** | Sonnet 4.6 |
| Quick review/summarize | Sonnet 4.6 | Gemini 2.5 |
| OCR / PDF extraction | **Gemini 2.5 Pro** | Claude (vision) |
| Structured forms (JSON) | Sonnet 4.6 | GPT-5 |
| Embeddings (search) | OpenAI ada-3 | Cohere embed-v3 |
| EU sovereignty option | **Mistral Large 2** | (locked) |

### De ce Claude Sonnet 4.6 ca primary

- Native Romanian fluency (nu translate-style ca Gemini)
- Citare exactă articole GDPR (nu hallucinate)
- Mimic perfect template juridic RO
- Refuz inteligent contextual + alternative sugerate
- Cost $15/M output dar 10x mai bun pe compliance

### Mistral Large 2 ca opțiune EU sovereignty

Pentru DPO firms din banking/healthcare RO care cer:
> "Datele clienților noștri nu pleacă din UE prin AI calls."

Mistral (France, GDPR by design) ca toggle în Setări → Plan → "EU AI Sovereignty" (`+€100/lună`).

---

## 13. Audit & traceability

### Hash chain

Fiecare mutație pe un finding produce un hash (SHA-256 al stării anterioare + diff). Lanțul e verificabil end-to-end.

```typescript
type FindingMutation = {
  findingId: string
  timestamp: ISO8601
  user: { id, email, role }
  action: "created" | "confirmed" | "resolved" | "reopened" | ...
  diff: { before, after }
  prevHash: string
  hash: SHA256(prevHash + serialize(this))
}
```

### Manifest SHA-256 per export

Fiecare audit pack / annex lite / response pack generat are o pagină **manifest** la sfârșit:

```
─────────────────────────────────────────────────────────────
DOSAR DE CONFORMITATE — APEX LOGISTIC SRL
Generat: 2026-04-26 14:32:18 EEST
Generator: DPO Complet (Diana Popescu, CIPP/E #12345)
Manifest verificare:

  privacy-policy-v3.pdf       sha256: 8f4a2b...d3e9c1
  dpa-stripe-v4.1.pdf         sha256: 2c91f8...a4b7e2
  ropa-2026-04.xlsx           sha256: e8d3c2...f1b9a4
  audit-trail-2026-04.json    sha256: 4a7e2c...b8f3d1

Token verificare: ABCD-1234-EFGH-5678
Acces acordat de: Diana Popescu, DPO Complet
─────────────────────────────────────────────────────────────
```

Verificare: `https://compliscan.ro/verify/[token]` confirmă manifest hash neschimbat.

### Audit log append-only

```
✓ Toate mutațiile pe state-ul org
✓ Login/logout per user
✓ Workspace switch per user
✓ Export-uri generate
✓ Magic link access (cine, când, ce)
✓ AI generation calls (model, prompt hash, output hash)
✓ Approval decisions (cu motivare)
✓ Reject reasons

Retention: 7 ani (obligație legală RO)
Storage: Supabase append-only table
```

### Guest Auditor session

Cabinet poate genera **sesiune temporară** pentru auditor extern (ex: ANSPDCP, audit ISO):

```
Setări → Team → "Acces audit extern (temporar)"
  • Email auditor
  • Durată: 7 / 14 / 30 zile
  • Scope: 1 client / portofoliu complet
  • Permisiuni: read-only + download

Auditor primește magic link → sesiune dedicated cu:
  ✓ Banner persistent "Sesiune audit extern — expiră 2026-05-23"
  ✓ Toate butoanele mutație DISABLED
  ✓ Download enabled
  ✓ Footer pe fiecare PDF descărcat:
    "Copie pentru audit extern — [auditor_name]
     Sesiune: [start] - [expires]
     Token verificare: [token_first_8]"
  ✓ Manifest SHA-256 attached to every export
```

---

## 14. Monitoring & drift

### Drift detection

| Tip drift | Sursă | Trigger reopen |
|---|---|---|
| **Site drift** | Watchdog watchdog cron 24h | Privacy policy ștearsă, formular nou |
| **Vendor drift** | Vendor DPA registry | DPA expirat, schimbare sub-procesatori |
| **Legislative drift** | Monitorul Oficial + EUR-Lex monitor | OUG nou, modificare directivă UE |
| **Baseline drift** | Hash comparison snapshot | Document înlocuit, retention schimbată |
| **Review scadent** | Calendar engine | Review cycle iminent (7 zile) |
| **ANAF signal** | SPV poll | Notificare fiscală nouă |

### Reopen rules

Findings rezolvate intră în `under_monitoring`. Triggerele de mai sus pot redeschide:

```typescript
function shouldReopen(finding: Finding, drift: DriftEvent): boolean {
  if (drift.type === "site_drift" && finding.dependsOnSite) return true
  if (drift.type === "vendor_drift" && finding.vendorId === drift.vendorId) return true
  if (drift.type === "legislative" && finding.relatedRegulations.includes(drift.regulation)) return true
  if (drift.type === "baseline" && finding.baselineSnapshotId === drift.snapshotId) return true
  if (drift.type === "review_due" && finding.nextReviewDate < now()) return true
  return false
}
```

Cascade reopen: 1 drift legislativ poate redeschide N findings cross-client. Diana primește dialog cu lista completă înainte să confirme.

### Approval queue

Pentru acțiuni cu impact mare (trimitere oficială ANAF, semnare DPA, publicare politică):

```
Queue:
  • Pending (cere aprobare)
  • Approved (procesat)
  • Rejected (cu motivare → creează finding nou)
  • Auto-executed (low risk, Studio tier)
  • Expired (timeout 7 zile)
```

### Agent orchestrator (Regulatory Radar)

Agent automat monitorizează:
- Schimbări legislative UE / RO
- Decizii ANSPDCP
- Ghiduri DNSC noi
- Updates AI Act
- ANAF technical updates

Output: **propuneri** pentru Diana/Radu. **NU executează** nimic singur. Diana acceptă/respinge cu motivare.

### Scheduled reports

```
✓ Daily digest (per cabinet, summary clients overnight)
✓ Weekly digest (cross-client trends)
✓ Monthly partner report (per Mihai client)
✓ Quarterly audit pack (auto-generated)
✓ Annual compliance report (Pro+ tier)
```

---

## 15. Pricing tiers & capabilities

```
┌────────────────────────────────────────────────────────────────┐
│ DPO OS pricing                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Starter (rampă funnel)  €49/lună     < 5 clienți              │
│    • 1 user                                                    │
│    • Brand cabinet basic                                       │
│    • GDPR + DSAR module only                                   │
│    • Magic links Mihai: 50 views/lună                          │
│                                                                │
│  Solo DPO              €99/lună    5-19 clienți                │
│    • 1 user                                                    │
│    • Lifecycle GDPR + DSAR + ROPA                              │
│    • Magic links Mihai: 200 views/lună                         │
│                                                                │
│  Growth boutique       €249/lună   20-49 clienți    ⭐         │
│    • 3 users + 1 GuestAuditor                                  │
│    • Full white-label                                          │
│    • + NIS2 + Pay Transparency                                 │
│    • Magic links Mihai: 1.000 views/lună                       │
│    • Audit Pack lunar                                          │
│                                                                │
│  Pro firm              €499/lună   50-149 clienți              │
│    • 10 users                                                  │
│    • + AI Act + DORA + Whistleblowing                          │
│    • Monitoring suite full                                     │
│    • Console access                                            │
│    • API access                                                │
│    • Priority support (4h SLA)                                 │
│    • Magic links Mihai: 5.000 views/lună                       │
│                                                                │
│  Studio                €999/lună   150+ clienți                │
│    • Unlimited users                                           │
│    • Custom integrations (SmartBill, Saga, custom CRM)         │
│    • SLA 99.9%                                                 │
│    • Dedicated CSM                                             │
│    • Domain custom (white-label complet)                       │
│    • Magic links Mihai: unlimited                              │
│                                                                │
│  Enterprise            quote       custom                      │
│    • Multi-region (CEE expansion)                              │
│    • SSO/SAML                                                  │
│    • Audit Q&A direct (call cu echipa)                         │
│    • Custom AI sovereignty (Mistral / OnPrem)                  │
└────────────────────────────────────────────────────────────────┘

Add-ons disponibile pe orice tier:
  + €100/lună  Mistral EU AI sovereignty
  + €50/lună   Per 25 clienți peste limită
  + €200/lună  Insurance partner (Cyber + GDPR Breach via Generali RO)
  + €150/lună  Custom training modules (5+ cursuri RO)
  + €300/lună  Dedicated content ops (legal-ops contractor pentru reguli)
```

### Capability tokens (logică plan)

```typescript
const capabilities = {
  canAddClient: (plan, currentCount) => currentCount < plan.maxClients,
  canExportWhiteLabel: (plan) => plan.tier !== "starter",
  canRunReview: (plan) => plan.tier !== "starter",
  canAccessComplianceDepth: (plan) => ["pro", "studio", "enterprise"].includes(plan.tier),
  canAccessMonitoring: (plan) => ["pro", "studio", "enterprise"].includes(plan.tier),
  canAccessConsole: (plan) => ["studio", "enterprise"].includes(plan.tier),
  canCreateGuestAuditor: (plan) => plan.tier !== "starter",
  canUseMistralEU: (plan, addons) => addons.includes("eu_sovereignty"),
}
```

### Funnel logic

```
Diana începătoare (3-4 clienți)         → Starter €49
   ↓ 6 luni cu 5+ clienți
Diana Solo (15 clienți)                 → Solo €99
   ↓ 12 luni cu 20+ clienți
Diana Growth (30 clienți)               → Growth €249
   ↓ 18-24 luni cu 50+ clienți
Diana Pro (80 clienți)                  → Pro €499
```

Starter NU e pierdere — e **acquisition funnel**. Conversie naturală de pe Starter la Solo în 6-9 luni.

---

## 16. Distribuție & GTM model

### GTM Path: Cabinet plătește, nu revinde white-label

Validat prin research: DPO firms preferă să **plătească** CompliScan și **să-l includă în serviciu** (sau ca add-on premium), NU să **revândă licențe** clienților lor.

```
┌─ Cabinet DPO Diana ─────────────────────────────────┐
│  Plătește CompliScan: €249/lună                     │
│  Tarifare client GDPR: €100-250/lună × 30 clienți  │
│  Revenue cabinet: €3.000-7.500/lună                 │
│  Cost CompliScan: 7% revenue                        │
│  Marjă: BRUTAL                                      │
└─────────────────────────────────────────────────────┘
            │
            │ White-label
            ▼
┌─ Patron Mihai ──────────────────────────────────────┐
│  Vede doar brand DPO Complet                         │
│  Plătește abonament DPO la cabinet                   │
│  NU plătește separat pentru CompliScan               │
│  NU știe că CompliScan există                        │
└─────────────────────────────────────────────────────┘
```

### Channels de distribuție

| Canal | Prioritate | Effort | Volum estimat |
|---|---|---|---|
| **LinkedIn outreach DPO firms** | P0 | High | 30-50 leads/lună |
| **juridice.ro articole expert** | P0 | Medium | 50-100 leads/lună (după 3 articole) |
| **avocatnet.ro feature** | P1 | Low | 20-50 leads/lună |
| **dpo-net.ro (NeoPrivacy)** | P1 | Low | 10-30 leads/lună |
| **ANSPDCP webinars (sponsor)** | P1 | Medium | 20-30 leads/eveniment |
| **IAPP RO Chapter** | P2 | High (verifică să existe) | TBD |
| **Conferință anuală DPO RO** | P3 (post-launch) | Very high | 100+ leads/an |
| **Referral program (cabinet aduce cabinet)** | P0 | Low | Compounding |
| **CECCAR Business Review (pentru Fiscal OS)** | P3 (Fiscal OS launch) | Medium | TBD |

### Vertical specialization (Q3 2027+)

Post-launch, alege 1 vertical pentru dominare:

| Vertical | Univers RO | De ce |
|---|---|---|
| **Healthcare** ★ | 4.000+ clinici + 500+ cabinete medicale | Date sensibile + ANSPDCP enforcement crescut |
| **Fintech** | 10+ bănci + ~50 fintech | Combo BNR + DORA + GDPR + AML |
| **Public sector** | 3.180 primării + ANAF + ministere | Toate trebuie DPO conform Art. 37 GDPR |

### Community building (luna 4+)

```
✓ Newsletter săptămânal "Privacy RO Weekly" (schimbări legislative)
✓ Slack/Discord DPO RO privat (clienți + non-clienți)
✓ Webinar lunar cu jurist invitat / decizie ANSPDCP
✓ Library template-uri jurat-validate (free pentru clienți)
✓ Anual: Conferință DPO Romania (model IAPP)
```

---

## 17. Differentiators competitivi

```
                    audatis    Dastra   Privacy    Excel +   CompliScan
                    (DE)       (FR)     Manager    Word RO   ⭐
                                        (RO)
─────────────────────────────────────────────────────────────────────
RO native           ❌         ❌       ⚠️         N/A       ✅
ANSPDCP forms       ❌         ❌       ✅         ❌         ✅
DNSC OUG 155        ❌         ❌       ❌         ❌         ✅
ANAF SPV            ❌         ❌       ❌         ❌         ✅
e-Factura UBL       ❌         ❌       ❌         ❌         ✅
Multi-framework     ✅         ✅       ❌         ❌         ✅
Multi-tenant DPO    ✅         ✅       ❌         ❌         ✅
White-label arhitect ✅        ⚠️       ❌         N/A        ✅
RoPA generator      ✅         ✅       ✅         ❌         ✅
DSAR automation     ✅         ✅       ⚠️         ❌         ✅
AI Act ready        ⚠️         ⚠️       ❌         ❌         ✅
NIS2 ready          ⚠️         ❌       ❌         ❌         ✅
Pricing entry       €500+      €600+    n/a        €0         €49
Pricing enterprise  €1500+     €2000+   n/a        n/a        €999
EU sovereignty AI   ❌         ⚠️       N/A        N/A        ✅ (opt)
RO language native  ❌         ❌       ✅         ✅         ✅
Magic links Mihai   ✅         ✅       ⚠️         N/A        ✅
Hash chain audit    ✅         ⚠️       ❌         ❌         ✅
Manifest SHA-256    ✅         ⚠️       ❌         ❌         ✅
```

### Strategia vs jucători EU

**Nu îi bați frontal. Bați prin:**

1. **Romania-native pe integrări locale** — au de unde nu pot intra (3-5 ani fereastră)
2. **Pricing 5-10x mai accesibil** — blochezi adopția lor în segmentul SME mid-market RO
3. **White-label arhitectural** — DPO devine canal de distribuție pentru tine
4. **Vertical specializat** — domini healthcare/fintech RO unde au zero prezență
5. **Comunitate locală** — IAPP RO, conferințe, network effects nereplicabile

### Strategia vs jucători locali

- **Privacy Manager** (singurul concurent serios local) = doar GDPR + single-tenant. Tu ai multi-framework + multi-tenant. Diferentiator clar.
- **Servicii manuale** (GDPR Complet, LegalUp, Decalex) = ei sunt **clienții tăi potențiali**, nu concurenți direcți.

### Outcomes posibile în 3-5 ani

| Outcome | Probabilitate | Action |
|---|---|---|
| **Achiziție de jucător EU** (€5-20M) | Mediu | Exit natural când DataGuard/audatis vor să intre în RO |
| **Expansion CEE** (lider regional) | Mediu | Funding round + hire AE pentru Polonia/Cehia/Ungaria |
| **Profitable RO standalone** | Mare | Bootstrap continuu, €15-30M ARR plafon |

---

## 18. Ce CompliScan NU este

```
❌ NU este consultanță juridică sau de compliance.
   → DPO consultantul ESTE consultanța. CompliScan ESTE infrastructura.

❌ NU este replacement pentru avocat sau DPO.
   → AI generează drafturi. Expert CIPP/E validează. Răspunderea e a expertului.

❌ NU este software de facturare.
   → SmartBill / Saga / Oblio fac asta. CompliScan citește read-only.

❌ NU este enterprise GRC platform.
   → Vanta / OneTrust / Drata domină acel segment ($30K-100K+/an).
   → CompliScan e SME mid-market accessibility tier.

❌ NU este aplicație pentru patron solo (Mihai).
   → Mihai e destinatar de livrabile, NU user.

❌ NU este produs multi-language în v1.
   → Romania-native. EN vine post CEE expansion.

❌ NU promite "100% compliant" sau "zero amenzi".
   → Disclaimer-ul e clar: validare expert obligatorie.

❌ NU vinde direct la patron via FB ads / mass marketing.
   → Vânzare prin DPO consulting firms (B2B SaaS).

❌ NU exportă date din UE.
   → Hosting EU region (Vercel + Supabase Frankfurt).
   → Mistral Large 2 ca opțiune EU sovereignty pe AI.

❌ NU stochează date în clear pe server.
   → Encryption at rest (Supabase managed encryption).
   → Encryption in transit (TLS 1.3).
   → Per-org isolation (row-level security).
```

---

## 19. Outcomes strategice

### Year 1 (Q3 2026 - Q2 2027)

| Milestone | Target |
|---|---|
| Săpt 12 (launch) | 3 cabinete plătitoare, €1.5K MRR |
| Luna 6 | 15 cabinete, €5K MRR |
| Luna 9 | 30 cabinete, €10-15K MRR |
| Luna 12 | 50 cabinete, €20-30K MRR |
| **Year 1 ARR** | **€240-360K** |

### Year 2 (Q3 2027 - Q2 2028)

| Milestone | Target |
|---|---|
| Luna 18 | 100 cabinete, €50-70K MRR |
| Luna 24 | 200 cabinete, €100-150K MRR |
| Vertical lock-in | Healthcare RO sau Fintech RO dominat |
| **Year 2 ARR** | **€1.2-1.8M** |

### Year 3+ (2028+)

| Decision gate | Action |
|---|---|
| Continue RO standalone | Bootstrap, target €3-5M ARR |
| Expand CEE (PL/CZ/HU) | Funding round (€2-5M seed extension) |
| Acquisition signal | DataGuard/audatis approach → exit €5-20M |

---

## 20. Glosar canonical

| Termen | Definiție |
|---|---|
| **CompliScan** | Acest produs. Brand canonical. Niciodată "CompliAI". |
| **DPO firm** | Cabinet boutique de externalizare DPO (20-200 clienți). Buyer primary. |
| **Diana** | Persona DPO consultant (NU contabilă). Primary user. |
| **Mihai** | Patron SRL care primește servicii DPO. Destinatar, NU user. |
| **Radu** | Compliance officer intern. Tertiary user. Single workspace mode. |
| **Cabinet** | Sinonim "DPO firm" în context Diana. |
| **Patron** | Sinonim "Mihai" — owner-ul firmei client. |
| **Finding** | Cazul de rezolvat. Unitatea de muncă. |
| **Cockpit** | Singurul ecran unde un finding se închide. |
| **Dosar** | Containerul outputs-urilor unei firme client. |
| **Livrabil** | Output extern (audit pack, raport). Brand-uit cabinet. |
| **CIPP/E** | Certified Information Privacy Professional / Europe (IAPP credential standard). |
| **White-label arhitectural** | Brand cabinet primitive peste tot output client-facing. |
| **Magic link** | URL token-gated pentru patron (single-purpose action). |
| **Trust profile** | Pagina publică de conformitate per firmă (brand cabinet). |
| **Drift** | Schimbare detectată (site, vendor, legislativ, baseline). |
| **Reopen** | Redeschidere finding rezolvat datorită drift / review. |
| **Capability token** | Atribut plan care decide ce module/butoane sunt active. |
| **Workspace mode** | "org" / "portfolio" — atribut sesiune partner. |

---

## Single line — DEFINIȚIA produsului

> **CompliScan = Privacy Operations Platform pentru cabinete DPO din România. Multi-tenant, multi-framework (8 reglementări UE), white-label arhitectural, AI-assisted cu validare expert CIPP/E obligatorie. Buyer = DPO firm boutique (20-80 clienți). Pricing €49-999/lună. Concurenții EU (audatis, Dastra) nu pot intra pe RO-native moat. Target Year 1: €240-360K ARR. Plafon RO: €15-30M ARR. Expansion CEE optional. Acquisition exit posibil €5-20M.**

---

## Documente conexe (citire obligatorie pentru orice agent care execută)

| Document | Scop |
|---|---|
| `docs/strategy/compliscan-product-manifest-2026-04-26.md` | **THIS** — sursa unică de adevăr produs |
| `docs/strategy/compliscan-v1-final-spec-2026-04-26.md` | Spec v1 launch (12 săpt) |
| `docs/strategy/market-research-2026-04-26.md` | Research piață cu surse |
| `docs/IA-UX-PROPUNERE (1).md` | IA-UX canonic (cu addendum) |
| `docs/IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md` | Addendum oficial pentru persona+pricing |
| `docs/IA-UX-IMPLEMENTATION-MATRIX.md` | Sprint plan S0-S4 (12 săpt) |
| `docs/IA-UX-ROUTE-PARITY-ADDENDUM.md` | Hartă rute cod-vs-IA |

**Order de citire pentru orice agent nou:**
1. `compliscan-product-manifest-2026-04-26.md` (acest document — full picture)
2. `compliscan-v1-final-spec-2026-04-26.md` (v1 launch focus)
3. `IA-UX-PROPUNERE (1).md` + `IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md` (împreună, niciodată separat)
4. `IA-UX-IMPLEMENTATION-MATRIX.md` (sprint plan)
5. Restul ad-hoc

---

**Document creat**: 26 aprilie 2026
**Tip**: Canonical product manifest
**Status**: sursă unică de adevăr pentru CE ESTE CompliScan
**Bazat pe**: 25 puncte critică + 4 agenți research piață + analiza GPT-5.5 + 3 docs IA-UX + research DPO competiție + research liability + research AI engine + 8 corecții Opus secundar + critique tehnic
**Următoarea revizuire**: după validation cu 5 firme DPO + decizie geo expansion (Q1 2027)
**Versiune**: 1.0 (canonical)
