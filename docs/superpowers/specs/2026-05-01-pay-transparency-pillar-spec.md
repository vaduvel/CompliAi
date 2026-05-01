# Pay Transparency Pillar — Definiție Cap-Coadă

**Data:** 2026-05-01
**Stadiu:** Spec produs înainte de implementare
**Scope:** ce este, cine cumpără, workflow real, ce există deja, cum se integrează fără să strice restul

---

## ⚡ TL;DR

- **Ce e:** modul de raportare ecart salarial gen + transparență salarială + employee data request portal pentru firme 50+ angajați
- **Cine cumpără:** **HR Director / CHRO** la firme 50-500 ang (5.000 firme RO)
- **Trigger mecanic:** **7 iunie 2026** = deadline transpunere Directiva 2023/970 + sancțiuni ITM 10.000-30.000 RON
- **Ce avem deja:** **~890 linii cod funcțional** — calculator gap, CSV upload, report draft/approved/published, deadline countdown UI, applicability detection
- **Ce mai lipsește:** ~700-1.000 linii (salary range generator, job architecture, employee request portal, ITM PDF export, multi-tenant cabinet integration)
- **Cum integrăm:** sub-pillar separat în Compliance section, **NU pillar primary** în navigation. Reuse: cabinet templates, white-label, audit pack, finding-kernel.

---

## 1. CE ESTE PAY TRANSPARENCY (definiție legală + business)

### 1.1 Cadrul legal

**Directiva (UE) 2023/970** — *privind transparența salarială și mecanismele de aplicare*.

| Element | Detaliu |
|---------|---------|
| Adoptată EU | 10 mai 2023 |
| **Termen transpunere RO** | **7 iunie 2026** (deja publicat draft de Min Muncii pe 13 mar 2026) |
| Aplicabilitate | Toți angajatorii UE, cu obligații graduate pe mărime |
| Sancțiuni RO (per draft) | **10.000-30.000 RON** aplicate de **ITM** |
| Autoritate de control | Inspecția Teritorială a Muncii (ITM) |
| Status special | ITM CONTROLEAZĂ activ (spre deosebire de ANI pentru Whistleblowing care face doar 99 raportări/an) |

### 1.2 Obligații concrete pe categorii (per draft RO publicat)

**Pentru TOATE firmele (din iunie 2026):**
1. **Salariul/range salarial obligatoriu în anunțul de job** sau înainte de primul interviu
2. **Interzis** să întrebi candidați despre istoric salarial
3. **Anularea clauzelor de confidențialitate salarială** existente în contracte
4. Drept salariat de a cere informații despre salariu propriu + salariu mediu (gender-split) pentru muncă de aceeași valoare → răspuns în **30 zile** (proiect RO) / 2 luni (UE)
5. Criterii de remunerare neutre din perspectivă de gen, documentate

**Pentru firme 250+ angajați (raportare ANUALĂ din 2027):**
6. Raport ecart salarial de gen anual către ITM
7. Diferență >5% nejustificată → **evaluare comună cu reprezentanții angajaților** + măsuri corective + despăgubiri

**Pentru firme 150-249 angajați (raportare TRIENNIALĂ din 2027):**
8. Raport ecart salarial de gen la 3 ani

**Pentru firme 100-149 angajați (raportare TRIENNIALĂ din 2031):**
9. Raport ecart salarial de gen la 3 ani

### 1.3 De ce HR managers sunt panicați (vs DPO calmi)

Citate reale colectate din research:
- *"Va aduce tensiuni între colegi"* — Jurnalul, IMM RO
- *"Reprezentanții salariaților vor avea acces la grile"*
- *"Trebuie să refac job architecture de la zero"*
- *"Anunțurile de job le sunt în public și ITM/jurnaliștii pot verifica"*
- *"Trebuie să justific 5%+ diferențe sau plătesc despăgubiri"*

**Comparativ cu Whistleblowing** (unde HR a făcut "tick the box" cu email + procedură Word și a uitat), **Pay Transparency e burning pain real**:
- Visibility publică (anunțuri job)
- ITM controlează (nu doar pe hârtie)
- Sancțiuni mai mari (10-30k RON vs 0.6-6k whistleblowing)
- Overlap CSRD/ESG (firmele cu raportare durabilitate au nevoie integrată)
- Reprezentanții salariaților vor cere date proactiv

---

## 2. CINE E USER-UL TARGETAT — Persona "Andreea"

### 2.1 Profil persona principal

**Andreea — HR Director / CHRO la firme 100-500 angajați**

| Atribut | Detaliu |
|---------|---------|
| **Funcție** | HR Director, CHRO, People Director, Head of HR |
| **Mărime firmă** | 100-500 angajați (sweet spot 150-300) |
| **Industrie** | Toate, dar cu accent pe BPO, retail, manufacturing, banking, telecom |
| **Vârstă** | 35-50 ani |
| **Background** | 10+ ani HR, posibil ASE/SNSPA, certificări CIPD sau echivalent |
| **Buget** | Discrețional până la **€500/lună** fără comitet IT, peste cere CFO approval |
| **Buying behavior** | Consumă HR Club content, LinkedIn publicists (Andreea Voinea, Doina Iliescu) |
| **Tools current** | Excel + ATS (BestJobs/eJobs/LinkedIn) + payroll soft (Charisma/SmartPro) + DocuSign/Adobe |

### 2.2 Personas secundare

**Diana 2.0 — Cabinetul fiscal/HR consultant** care vinde la 20+ firme:
- 30-100 cabinete RO
- Vinde rebill 200-400 lei/lună/client
- Buget cabinet: **€299-999/lună** la tine, rebill profit

**Mihai 2.0 — Patron SRL 50-100 ang** auto-administrat:
- "Am 80 angajați, primesc deja întrebări de la angajați"
- DIY mentality, vrea SaaS self-service
- Buget: **€99-149/lună**

**Radu 2.0 — Compliance officer intern** la firme 250+ ang:
- Buget enterprise: **€249-499/lună** Studio tier
- Vrea audit pack pentru raportarea ITM

### 2.3 TAM concret (INS + Eurostat)

| Segment | Număr firme RO | TAM realist SaaS-able |
|---------|----------------|----------------------|
| 50-249 angajați | **~7.632** | 1.500-2.500 (cele care nu ignoră) |
| 250+ angajați | **~1.666** | 800-1.200 (raportare anuală obligatorie) |
| Cabinete HR/legal | ~50-100 | 20-40 cabinete |
| **TOTAL** | **~9.300 firme directe + 50 cabinete** | **2.300-3.700 plătitori realiști** |

Pricing target × penetrare = **TAM revenue Y2 €2.7-7.4M ARR** (2.300-3.700 × €100-200/lună × 12 × penetrare 20-30%).

### 2.4 Decision makers concreți (10 firme target)

Identificați public LinkedIn:
1. **Andreea Voinea** — Președinte HR Club Romania + CHRO BCR
2. **Doina Iliescu** — CHRO la Endava
3. CHRO la **ING Bank Romania**
4. CHRO la **Telekom Romania**
5. CHRO la **OMV Petrom**
6. CHRO la **Renault Dacia**
7. CHRO la **eMag**
8. CHRO la **Continental Automotive**
9. CHRO la **Profi/Carrefour/Lidl**
10. CHRO la **Bosch Romania**

---

## 3. WORKFLOW-UL USER-ULUI ACUM (înainte de CompliAI)

### 3.1 Workflow current al Andreei (martie-mai 2026)

```
LUNI 9:00 - Primește email de la Director General:
   "Andreea, în iunie e nouă lege transparență salarială. Ce facem?"

LUNI 9:30 - Caută Google: "transparență salarială 2026 obligații firmă 200 angajați"
   → Citește 3 articole pe avocatnet, lefo.ro, hr-club.ro
   → Tries to download "Pay Transparency Self-Assessment" PDF dacă există

LUNI 11:00 - Întreabă în grup HR Club:
   "Ce faceți voi cu transparența salarială? Ne pregătim?"
   → Răspunsuri vagi: "vedem și noi", "PwC ne face audit"

LUNI 14:00 - Deschide Excel cu grila salarială
   → Realizează că nu are job architecture documentată
   → Realizează că nu are categorisire pe "muncă de aceeași valoare"

MARȚI - Cere ofertă PwC pentru "Pay Transparency assessment"
   → 5.000-15.000 EUR one-shot
   → Face nota CFO: "Avem nevoie de 10K EUR în Q2"

MIERCURI - Rugat de un coleg să-i spună salariul mediu pe role-ul lui
   → Răspuns: "Trebuie să verific cu Legal"
   → Trimite email la Legal: "din iunie putem refuza?"

JOI - Email de la angajat:
   "Vreau să știu salariul mediu pentru postul meu. Plătiți la fel M și F?"
   → Andreea NU ȘTIE răspunsul. Calculează manual din Excel 2 ore.

VINERI - Anunț job nou. HR Coordinator scrie:
   "Salariu negociabil în funcție de experiență"
   → Andreea: "Stai, nu e ok. Va trebui să punem range. Dar care range?"
   → Discuție de 1 oră. Anunță publicat fără salariu.

CONSECINȚA: 6-8 ore/săptămână pe Pay Transparency mental load,
            zero infrastructure, dependent de Excel + email + grupuri FB.
```

### 3.2 Pain points în workflow current

1. **Job architecture lipsă/fragmentată** — Excel cu grade salariale fără mapare pe job description
2. **Calcul gap manual** — formule copy-paste, nu reproductibilitate
3. **Anunțuri job fără range** — copy-paste din anul trecut, nu compliance
4. **Cereri angajați** — răspuns ad-hoc, fără termen 30 zile tracking
5. **Raport ITM** — nu există template, fiecare reinventează roata
6. **Politica de transparență salarială** — copy-paste din internet, neactualizată
7. **Contract nou cu clauză confidențialitate** — nu știe că trebuie scoasă
8. **Reprezentanții salariaților** — fără mecanism de informare structurat

### 3.3 Workflow-ul cu CompliAI (target)

```
LUNI 9:00 - Login CompliAI → Pay Transparency Dashboard
   Vezi: 
   • 247 angajați
   • Gap actual: 4.2% (sub prag 5%)
   • Următoarea raportare ITM: 25 ianuarie 2027
   • 3 cereri angajați în așteptare (din 30 zile, 22 rămase)

LUNI 9:05 - Răspunzi la cererile angajaților din portal
   • Form pre-completat
   • Calcul automat salariu mediu pe role + gender split
   • Răspuns format ITM-shaped, descărcabil PDF

LUNI 9:15 - Anunț job nou
   • Click "Generează salary range pentru anunț"
   • Auto-pull din job architecture: "Marketing Specialist Mid → 5.500-7.500 RON"
   • Copy-paste în BestJobs/LinkedIn

CONSECINȚA: 30 minute/săptămână, infrastructure persistentă, audit-ready.
ROI: 6-8 ore salvate săptămânal × 100 RON/oră HR = 600-800 RON/săpt = 2.400-3.200 RON/lună.
Cost CompliAI: 149-329 EUR/lună = 700-1.500 RON/lună.
NET PROFIT cabinet/firmă: 700-2.000 RON/lună.
```

---

## 4. CE AVEM DEJA ÎN COD — inventory exact

### 4.1 Files existente (~890 linii)

| Fișier | LOC | Ce face |
|--------|-----|---------|
| `lib/compliance/pay-transparency-rule.ts` | 59 | Applicability detection (50-249 / 250+) + finding builder cu 5-step remediation + legal reference |
| `lib/compliance/pay-gap-calculator.ts` | 104 | Calculator gap real: byRole, byDepartment, riskLevel, recommendations, obligationMet |
| `lib/server/pay-transparency-store.ts` | 202 | CRUD salary records + CRUD reports + status workflow (draft/approved/published) + markdown export |
| `lib/server/pay-transparency-csv.ts` | 113 | CSV parser pentru upload (jobRole, gender, salaryBrut, salaryBonuses, contractType, department) |
| `app/api/pay-transparency/route.ts` | 39 | GET records + latestReport + findingStatus |
| `app/api/pay-transparency/upload/route.ts` | 44 | POST CSV upload |
| `app/api/pay-transparency/report/route.ts` | 78 | POST generate report + GET list reports |
| `app/api/pay-transparency/report/[id]/route.ts` | ? | GET single report + transition status |
| `components/compliscan/pay-transparency-page.tsx` | 340 | UI complet: CSV upload, deadline countdown 7 iunie 2026, role gap, gender mix, risk tone |
| `app/dashboard/pay-transparency/page.tsx` | 15 | Page wrapper |
| `lib/compliscan/dashboard-routes.ts` | 1 line | Route `/dashboard/pay-transparency` |
| `components/compliscan/navigation.ts` | 1 entry | Sidebar "Pay Transparency" |
| `lib/compliscan/finding-kernel.ts` | included | Auto-finding generation `pay-transparency-2026` |
| **Tests** | 5 fișiere | Coverage pe toate API routes |

### 4.2 Funcționalități GATA

✅ **Applicability detection automată** — firme 50-249 sau 250+ angajați primesc auto-finding
✅ **Auto-finding "pay-transparency-2026"** cu severity + remediation 5-step
✅ **CSV upload pentru salary records** (jobRole, gender, salary brut, bonuses, contract type, department)
✅ **Calculator gap pe role + department** cu risk level (low/medium/high)
✅ **Report generator** cu status workflow (draft → approved → published)
✅ **Markdown export raport**
✅ **UI deadline countdown** până la 7 iunie 2026 (banner ultimele 60 zile)
✅ **Role gap top finder** — afișează rolul cu cel mai mare gap
✅ **Gender mix calculator** (M/F/hidden)
✅ **Recomandări auto-generate** bazate pe analiza datelor
✅ **Persistence multi-tenant** (per orgId)
✅ **Tests pentru toate API routes**

### 4.3 Ce LIPSEȘTE pentru "hero product 2026"

| Lipsa | Effort estimat | Severity |
|-------|---------------|----------|
| **Salary range generator pentru anunțuri job** (output text format pentru BestJobs/LinkedIn/eJobs) | ~150 linii | 🔴 Critical |
| **Job architecture builder UI** (level + role + range matrix) | ~250 linii | 🔴 Critical |
| **Employee request portal** (form + 30 zile timer + tracking + auto-reply) | ~200 linii | 🔴 Critical |
| **Anti-confidentiality clause checker** (text scan pe contracte upload) | ~100 linii | 🟡 High |
| **ITM-shaped PDF export** (există markdown, lipsește PDF formatat ITM template) | ~80 linii | 🟡 High |
| **Multi-tenant cabinet integration** (cabinetul vede toate firmele clienți pe Pay Transparency) | ~120 linii | 🟡 High |
| **White-label brandare report** (logo cabinet + brand color în PDF) | ~50 linii | 🟢 Medium |
| **Gender split fără reveal** (afișare statistici fără identifying individuals < 5 angajați) | ~50 linii | 🟢 Medium |
| **Email notification deadline + cereri angajați** | ~80 linii | 🟢 Medium |

**Total lipsă: ~1.080 linii** (revizuit în sus de la estimate inițial ~800).

**Effort calendar:** **3-4 săptămâni** focused work (1 dev), sau **2 săptămâni cu 2 devs paralel**.

---

## 5. CUM FACEM PILLAR ÎN COMPLIAI FĂRĂ SĂ STRICĂM RESTUL

### 5.1 Strategie de integrare — ZERO regression

**Principiul cheie:** Pay Transparency NU e nou pillar, e **EXTINDERE** la pillar-ul existent. Module deja conectat la architecture, doar **promovăm vizibilitate + adăugăm features**.

### 5.2 Architecture decision — sub-pillar, NOT primary

**În navigation actual, Pay Transparency este sub Compliance section.** Nu schimbi structura. Doar:

#### A) În sidebar (NICIO breaking change)

```
└── Monitorizare /
    ├── Conformitate /conformitate
    ├── Furnizori /furnizori
    ├── Sisteme AI * /sisteme-ai
    ├── NIS2 * /nis2
    ├── Alerte /alerte
    ├── Pay Transparency * /pay-transparency  ← DEJA EXISTĂ
    └── ...

* = applicability-gated
```

**Modificare propusă:** flag `pay-transparency` să apară DOAR pentru firme cu 50+ angajați (applicability check existent). NU apare pentru solo IMM Mihai. Asta e deja codificat în `pay-transparency-rule.ts:isPayTransparencyCandidate()`.

#### B) Pe `/dashboard` cockpit — ADĂUGAM badge dedicat

Card nou pe dashboard:
```
┌──────────────────────────────────────┐
│ 🔥 Pay Transparency                  │
│ Deadline: 7 iunie 2026 (37 zile)     │
│ Status: 0% pregătire                 │
│ [Importă date salariale →]           │
└──────────────────────────────────────┘
```

Apare DOAR dacă applicability = true. Pentru solo Mihai = nu există.

#### C) În pricing — ADĂUGAM Pay Transparency în pachete

Reuse pricing existent, adaugi feature flag:

```diff
 Pro €149/lună
 - GDPR + e-Factura + 5 clienți
 - NIS2 dacă applicability
 - AI Inventory
+- Pay Transparency dacă 50+ angajați
+- Salary range generator
+- Employee request portal

 Studio €349/lună
 + tot din Pro
 + multi-branding
+ + Pay Transparency UNLIMITED for clients (cabinet)
+ + ITM PDF export white-labeled
```

**ZERO breaking change**. Tier-uri existente, doar features adăugate.

### 5.3 Reuse maxim — leverage existing infrastructure

Modulul Pay Transparency **deja folosește**:

| Reuse | Sursă | Beneficiu |
|-------|-------|-----------|
| **finding-kernel** | `lib/compliscan/finding-kernel.ts` | Auto-finding apare în `/dashboard/resolve` cu workflow standard |
| **storage-adapter** | `lib/server/storage-adapter.ts` | Persistență multi-tenant standard |
| **applicability** | `lib/compliance/applicability.ts` | Detection automată firmă 50+ ang |
| **navigation** | `components/compliscan/navigation.ts` | Entry deja prezent |
| **dashboard-routes** | `lib/compliscan/dashboard-routes.ts` | Route gata |

Module **noi** vor folosi:

| Reuse | Sursă | Pentru ce |
|-------|-------|-----------|
| **cabinet-templates-store** | `lib/server/cabinet-templates-store.ts` | Template "pay-gap-report" + "salary-range-policy" deja în lista 18 tipuri |
| **white-label** | `lib/server/white-label.ts` (exists in v3-unified) | Brand cabinet pe PDF export |
| **PDF infra existent** | `lib/exports/pdf-renderer.ts` | ITM-shaped PDF reuse pdfkit + brand |
| **document-generator** | `lib/server/document-generator.ts` | Generator pentru "salary-range-policy" și "pay-gap-report" |
| **partner/portfolio** | `app/portfolio/*` (în v3-unified) | Cross-client view pentru cabinet |

**Zero modul nou de la zero. Doar feature-uri suplimentare la modulul existent.**

### 5.4 Plan de implementare — 4 sprint-uri de 1 săptămână

#### Sprint 1 (săpt 1) — Salary range generator + Job architecture

**Obiectiv:** core feature pentru anunțuri job (cea mai mare cerere de la Andreea)

**Files de creat/modificat:**
- `lib/compliance/job-architecture.ts` (NEW, 200 linii)
  - Types: JobLevel, JobRole, JobBand, SalaryRange
  - `buildJobArchitecture(orgId, levels[], roles[])`
  - `computeSalaryRange(role, level): { min, mid, max }`
- `app/api/job-architecture/route.ts` (NEW, 100 linii)
  - GET/POST/PATCH endpoints
- `components/compliscan/job-architecture-builder.tsx` (NEW, 200 linii)
  - UI matrix level × role + range editor
- `lib/compliance/salary-range-generator.ts` (NEW, 80 linii)
  - `generateRangeForJobAd(role, level): string`
  - Output formatat pentru BestJobs/LinkedIn/eJobs
- `components/compliscan/pay-transparency-page.tsx` (MODIFY, +100 linii)
  - Tab nou "Salary Ranges"

**LOC total:** ~680 noi + 100 modificate

#### Sprint 2 (săpt 2) — Employee request portal

**Obiectiv:** rezolvă cerințele angajaților în 30 zile cu form + tracking

**Files de creat:**
- `lib/server/pay-transparency-requests-store.ts` (NEW, 150 linii)
  - Types: EmployeeSalaryRequest, status (received/processing/answered/escalated)
  - 30 days timer
  - Auto-reply generator
- `app/api/pay-transparency/requests/route.ts` (NEW, 80 linii)
- `app/api/pay-transparency/requests/[id]/route.ts` (NEW, 60 linii)
- `app/employee-portal/[token]/page.tsx` (NEW, 150 linii)
  - Public form (token-based, ca whistleblowing)
  - Submit cerere cu nume + role + question
- `components/compliscan/pay-transparency-requests-tab.tsx` (NEW, 120 linii)

**LOC total:** ~560

#### Sprint 3 (săpt 3) — ITM PDF export + white-label cabinet

**Obiectiv:** raport finit gata de submitted la ITM

**Files de creat/modificat:**
- `lib/exports/itm-pay-gap-pdf.ts` (NEW, 120 linii)
  - Reuse `pdf-renderer` existent
  - Template ITM-shaped
- `app/api/pay-transparency/report/[id]/pdf/route.ts` (NEW, 50 linii)
- `lib/server/white-label.ts` integrare (MODIFY, +30 linii)
  - Pull brand cabinet pentru PDF
- `components/compliscan/pay-transparency-page.tsx` (MODIFY, +50 linii)
  - Buton "Export ITM PDF"

**LOC total:** ~250 noi + 80 modificate

#### Sprint 4 (săpt 4) — Cabinet portfolio integration + Anti-confidentiality checker

**Obiectiv:** cabinet vede toate firmele clienți + verificare contracte

**Files de creat/modificat:**
- `components/compliscan/portfolio-pay-transparency-page.tsx` (NEW, 200 linii)
  - Cross-client dashboard pentru cabinet
- `lib/compliance/contract-confidentiality-checker.ts` (NEW, 100 linii)
  - Text scan pentru "confidențialitate salarială" în contract upload
- `app/portfolio/pay-transparency/page.tsx` (NEW, 50 linii)
- `lib/compliscan/portfolio-routes.ts` (MODIFY, +1 line)

**LOC total:** ~350 noi

#### Total cumulativ

**~1.840 linii noi + ~250 linii modificate** (revizuit în sus de la estimat 1.080).

**Calendar:** **4 săptămâni 1 dev** sau **2-3 săptămâni 2 devs paralel**.

### 5.5 Riscuri de regresie + mitigare

| Risc | Severity | Mitigare |
|------|----------|----------|
| **Schimbare schema state** afectează modulele existente | 🔴 High | Pay Transparency are state ISOLATED în `pay_transparency_state` storage key. NU atinge `compliance_state` general. ✅ Deja izolat. |
| **Navigation entry rupe layout** mobile/tablet | 🟡 Medium | Entry deja există în navigation. Adăugăm DOAR features. ✅ Zero impact. |
| **Auto-finding clutter resolve page** | 🟡 Medium | Finding generat doar pentru applicability=true. Solo IMM nu vede. ✅ Existent. |
| **Cabinet templates store conflict** | 🟢 Low | Template-uri "pay-gap-report" și "salary-range-policy" deja în lista 18. ✅ Existent. |
| **PDF rendering performance** la export ITM | 🟢 Low | Reuse pdfkit existent (același cu audit pack, NIS2 export). ✅ Pattern dovedit. |
| **Storage backend (Supabase vs local)** | 🟢 Low | `createAdaptiveStorage` deja folosit, exact ca alte module. ✅ Pattern dovedit. |
| **Multi-tenant izolare** | 🟢 Low | Pattern `await readStateForOrg(orgId)` standard, deja în store. ✅ Existent. |
| **Tests existente sparte** | 🟢 Low | 5 teste deja există pentru API routes. Adăugăm teste noi pentru sprint-uri. ✅ Doar adăugăm. |

**Concluzie:** **risc regresie scăzut**. Modulul e **izolat structural** — doar adaugi feature-uri în el, nu modifici alte module.

### 5.6 Onboarding flow per persona — go-to-market

#### Pentru Andreea (HR Director firmă 100-500 ang)

```
1. Landing /pay-transparency-2026
   • CTA "Self-assessment 2 minute"
   • Lead magnet: "Pay Transparency Compliance Checklist PDF"
   
2. Sign up → onboarding
   • icpSegment: "imm-internal"
   • Collect: nr angajați, sector, deja ai grila salarială?
   
3. Quick win — primul day:
   • Upload CSV grila salarială
   • Vezi gap calculation imediat
   • Generează primul raport draft
   
4. Week 1 — set up workflow:
   • Salary range pentru următorul anunț
   • Activează employee request portal
   • Trimite trial 30 zile la 1 angajat ca test
```

#### Pentru Diana 2.0 (cabinet HR consultant)

```
1. Landing /pentru-consultanti-hr
   • CTA "Cabinet pilot — 5 firme client gratis 30 zile"
   
2. Sign up → onboarding
   • icpSegment: "cabinet-fiscal" (modificare: adăugăm "cabinet-hr")
   • White-label setup: logo, brand color, semnătură
   
3. Day 1 — bulk import:
   • Importă 5-20 firme client
   • Pentru fiecare, upload CSV salary records
   • Cross-client dashboard arată gap heat-map
   
4. Week 1 — first delivery:
   • Generează 5 rapoarte ITM-PDF cu brand cabinet
   • Trimite la 5 clienți
   • Rebill 200-400 lei/client/lună
```

### 5.7 Pricing tier propuse

| Tier | Preț | Limite | Target |
|------|------|--------|--------|
| **Solo PT** | €99/lună | 1 firmă, 100 angajați max, 5 cereri angajați/lună | Mihai 2.0 SRL micro |
| **Business PT** | €149/lună | 1 firmă, nelimitat angajați, 30 cereri/lună, ITM PDF | Andreea direct |
| **Cabinet PT** | €299/lună | 5 firme client + cross-portfolio | Diana 2.0 cabinet HR mic |
| **Cabinet+ PT** | €699/lună | 25 firme client + white-label complet | Cabinet HR mediu |
| **Bundle Pro** | €149/lună (existing tier extins) | Tot din Pro + Pay Transparency dacă applicability | Diana fiscal/DPO existent — cross-sell intern |
| **Studio Bundle** | €349/lună | Pay Transparency unlimited + cross-sell | Existing Studio tier |

**Sweet spot pentru new acquisition:** **Business PT €149/lună** direct la HR Director firme 100-500 ang.

---

## 6. NEXT STEPS

### Pre-concediu (4-6 ore)

1. **Confirmă spec-ul** — citești doc-ul, agreezi sau ajustezi
2. **Lansezi 1 post LinkedIn** despre Pay Transparency Directiva 2023/970 cu lead magnet
3. **Trimiți 10 mesaje LinkedIn** la 10 CHRO din lista decision makers
4. **Adaugi pe pricing page** menționarea "Pay Transparency module — disponibil iunie 2026"

### În concediu

- Inbox 1×/zi
- Note: cine întreabă, ce întreabă

### La întoarcere — Sprint 1 (săpt 1)

- Build salary range generator + job architecture (~680 linii)
- Soft launch la 5 firme pilot direct
- Trial gratis 30 zile

### Q3 2026 — Hero launch

- Sprint 2-4 finalizate
- Lansare formală cu HR Club Romania
- Conferința Everything HR Brașov mai 2026

---

## 📚 Surse legale + research

- [Directiva (UE) 2023/970 text integral](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023L0970)
- [Proiect lege RO Min Muncii 13 mar 2026](https://mmuncii.gov.ro/wp-content/uploads/2026/03/Proiect-de-lege-transparenta-salariala-13-martie-2026.pdf)
- [Lewis Silkin — RO revised draft pay transparency](https://www.lewissilkin.com/insights/2026/04/10/romania-revises-transposing-legislation-for-eu-pay-transparency-directive-key-changes-for-employers)
- [Forvis Mazars RO](https://www.forvismazars.com/ro/ro/insights/blog/business-insights/transparenta-salariala-in-europa)
- [StartupCafe — sancțiuni 10-30k RON](https://startupcafe.ro/transparenta-salariala-principalele-obligatii-si-sanctiuni-pentru-firme-prevazute-de-directiva-ue-970-2023-96637)
- [HR Club Romania](https://hr-club.ro/ro/comunitatea)
- [Andreea Voinea LinkedIn](https://www.linkedin.com/in/andreea-voinea-987b77b/)
- [Everything HR 2026 Brașov](https://everythinghr.live/2026/)
- [PwC RO Pay Transparency](https://www.pwc.ro/en/Store/pay-transparency.html)

## 📁 Files referite în cod

- [lib/compliance/pay-transparency-rule.ts](../../lib/compliance/pay-transparency-rule.ts)
- [lib/compliance/pay-gap-calculator.ts](../../lib/compliance/pay-gap-calculator.ts)
- [lib/server/pay-transparency-store.ts](../../lib/server/pay-transparency-store.ts)
- [lib/server/pay-transparency-csv.ts](../../lib/server/pay-transparency-csv.ts)
- [components/compliscan/pay-transparency-page.tsx](../../components/compliscan/pay-transparency-page.tsx)
- [app/dashboard/pay-transparency/page.tsx](../../app/dashboard/pay-transparency/page.tsx)
- [app/api/pay-transparency/route.ts](../../app/api/pay-transparency/route.ts)
- [app/api/pay-transparency/upload/route.ts](../../app/api/pay-transparency/upload/route.ts)
- [app/api/pay-transparency/report/route.ts](../../app/api/pay-transparency/report/route.ts)
