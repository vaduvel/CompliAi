# CompliAI - Feature Mapping & Persona Flows

> Document generat: Martie 2026
> Versiune: 1.0

---

## 1. User Personas (User Modes)

Aplicația definește 4 moduri de utilizare:

| Mod | Denumire | Descriere | Persoană de test |
|-----|----------|-----------|------------------|
| `solo` | Proprietar / Manager | Gestioneză conformitatea firmei proprii. Tablou de bord simplificat, axat pe acțiuni concrete. | **Mihai** - PFA/IMM cu 1-9 angajați |
| `partner` | Consultant / Contabil / Auditor | Gestioneză mai multe firme simultan. Portofoliu agregat, vedere cross-client, livrabile pentru clienți. | **Diana** - Partener cu 20+ clienți |
| `compliance` | Responsabil conformitate | Lucrează intern pe o singură firmă, cu drepturi extinse de audit, raportare și control. | **Radu** - Compliance officer intern |
| `viewer` | Vizualizare (read-only) | Acces doar pentru citire la dosarul de audit. | Colaboratori externi |

---

## 2. Feature Inventory - Quick Reference

| # | Feature | Route | Solo | Partner | Compliance | Maturitate |
|---|---------|-------|------|---------|------------|------------|
| 1 | Dashboard (Cockpit) | `/dashboard` | ✅ | ✅ | ✅ | ✅✅✅ |
| 2 | Scanare documente | `/dashboard/scan` | ✅ | ✅ | ✅ | ✅✅✅ |
| 3 | Istoric documente | `/dashboard/documente` | ✅ | ✅ | ✅ | ✅✅✅ |
| 4 | De rezolvat (Findings) | `/dashboard/resolve` | ✅ | ✅ | ✅ | ✅✅✅ |
| 5 | Calendar compliance | `/dashboard/calendar` | ✅ | ✅ | ✅ | ✅✅ |
| 6 | Sisteme AI (Inventory) | `/dashboard/sisteme` | ✅ | ✅ | ✅ | ✅✅✅ |
| 7 | Conformitate AI Act | `/dashboard/conformitate` | ✅ | ✅ | ✅ | ✅✅ |
| 8 | Alerte (Drifts) | `/dashboard/alerte` | ✅ | ✅ | ✅ | ✅✅ |
| 9 | NIS2 Assessment | `/dashboard/nis2` | ✅ | ✅ | ✅ | ✅✅✅ |
| 10 | NIS2 Maturitate | `/dashboard/nis2/maturitate` | ✅ | ✅ | ✅ | ✅✅ |
| 11 | NIS2 Înregistrare DNSC | `/dashboard/nis2/inregistrare-dnsc` | ✅ | ✅ | ✅ | ✅✅ |
| 12 | DSAR (Cereri acces) | `/dashboard/dsar` | ✅ | ✅ | ✅ | ✅ |
| 13 | RoPA Generator | `/dashboard/ropa` | ✅ | ✅ | ✅ | ✅✅✅ |
| 14 | e-Factura / Fiscal | `/dashboard/fiscal` | ✅ | ✅ | ✅ | ✅✅✅ |
| 15 | Vendor Review | `/dashboard/vendor-review` | ✅ | ✅ | ✅ | ✅✅ |
| 16 | Dosar (Audit Dossier) | `/dashboard/dosar` | ✅ | ✅ | ✅ | ✅✅✅ |
| 17 | Rapoarte | `/dashboard/rapoarte` | Limitat | ✅ | ✅ | ✅✅ |
| 18 | Generator documente | `/dashboard/generator` | ✅ | ✅ | ✅ | ✅✅✅ |
| 19 | Setări cont | `/dashboard/settings` | ✅ | ✅ | ✅ | ✅✅ |
| 20 | Abonament / Billing | `/dashboard/settings/abonament` | ✅ | ✅ | ✅ | ✅✅ |
| 21 | Whistleblowing | `/dashboard/whistleblowing` | ✅ | ✅ | ✅ | ✅✅ |
| 22 | DORA | `/dashboard/dora` | ⚠️ | ⚠️ | ✅ | ✅✅ |
| 23 | Checklists | `/dashboard/checklists` | ✅ | ✅ | ✅ | ✅ |
| 24 | Agents (AI Agents) | `/dashboard/agents` | ✅ | ✅ | ✅ | ✅ |
| 25 | Asistent AI | `/dashboard/asistent` | ✅ | ✅ | ✅ | ✅ |
| 26 | Trust Center | `/dashboard/reports/trust-center` | ⚠️ | ✅ | ✅ | ✅ |
| 27 | Auditor Vault | `/dashboard/reports/vault` | ⚠️ | ✅ | ✅ | ✅ |
| 28 | Audit Log | `/dashboard/reports/audit-log` | ⚠️ | ✅ | ✅ | ✅ |
| 29 | Policies | `/dashboard/reports/policies` | ✅ | ✅ | ✅ | ✅ |
| 30 | Portofoliu (Partner) | `/portfolio` | ❌ | ✅ | ❌ | ✅✅ |
| 31 | Alertele partenerului | `/portfolio/alerts` | ❌ | ✅ | ❌ | ✅✅ |
| 32 | Vendorii partenerului | `/portfolio/vendors` | ❌ | ✅ | ❌ | ✅ |
| 33 | Task-uri partener | `/portfolio/tasks` | ❌ | ✅ | ❌ | ✅ |
| 34 | Rapoarte partener | `/portfolio/reports` | ❌ | ✅ | ❌ | ✅ |
| 35 | Onboarding | `/onboarding` | ✅ | ✅ | ✅ | ✅✅✅ |
| 36 | Pay Transparency | Auto-generated finding | ✅ | ✅ | ✅ | ✅✅ |

**Legendă maturitate:**  
- ✅✅✅ = Production ready (full flow, tested)  
- ✅✅ = Functional cu locuri de îmbunătățit  
- ✅ = Basic implementation  
- ⚠️ = Parțial vizibil pentru persona  

---

## 2.1 Framework-uri Suplimentare (Roadmap)

| Framework | Status | Deadline | Target Persona | Prioritate |
|-----------|--------|----------|----------------|------------|
| **Pay Transparency (UE 2023/970)** | ✅ Implementat | Jun 2026 | Mihai (50+), Diana, Radu | 🔴 Immediată |
| **Whistleblowing (UE 2019/1937)** | ✅ Implementat | - | Diana, Radu | 🔴 Immediată |
| **DORA** | ✅ Implementat | Jan 2025 | Radu (banci/fintech) | 🔴 Immediată |
| **CSRD / ESG** | ❌ Nelansat | 2026-2028 | Radu | 🟡 Medie |
| **Cyber Resilience Act (CRA)** | ❌ Nelansat | 2027 | Radu | 🟡 Medie |
| **CSDDD** | ❌ Nelansat | 2026+ | - | ⚪ Nu recomandat |
| **Data Act** | ❌ Nelansat | 2024-2025 | - | ⚪ Nu recomandat |

### Framework-uri deja implementate:

#### Pay Transparency (Directiva UE 2023/970)
- **Status**: ✅ Implementat ca finding automat
- **Cum funcționează**: Pe baza `employeeCount` din profil, dacă >50 angajați, se generează automat finding cu:
  - Obligații de raportare ecart salarial
  - Dreptul angajaților de a solicita info despre salarii
  - Interzicerea clauzelor de confidențialitate
  - Remediation hints (inventar structură salarială, calcul ecart, politică)
- **Fișier**: `lib/compliance/pay-transparency-rule.ts`

#### Whistleblowing (Directiva UE 2019/1937)
- **Status**: ✅ Implementat complet
- **Rute**: 
  - `/dashboard/whistleblowing` - Dashboard admin
  - `/whistleblowing/[token]` - Formular public de submit
- **Funcționalități**: Submit report, tracking status, categories, anonymity support
- **API**: `/api/whistleblowing`, `/api/whistleblowing/submit`

#### DORA (Regulamentul UE 2022/2554)
- **Status**: ✅ Implementat
- **Rute**: `/dashboard/dora`
- **Funcționalități**:
  - Incident reporting (4h/72h/1 lună deadline)
  - TPRM (Third Party Risk Management) pentru furnizori ICT critici
  - State management pentru tracking
- **Când e relevant**: Bănci, asigurări, fintech, entități supravegheate financiar

#### CSRD / ESG (în development)
- **Status**: ❌ Nu a început
- **Când**: 2026-2028 în funcție de dimensiune
- **Recomandare**: Prioritate medie, după ce piațaIMM România adoptă primele companii

#### Cyber Resilience Act (CRA)
- **Status**: ❌ Nu a început
- **Deadline**: 2027
- **Când e relevant**: Producători și importatori de software/hardware cu componente ICT
- **Recomandare**: Prioritate medie

---

## 3. Detailed Feature Flows by Persona

### 3.1 Mihai - Solo (Proprietar PFA/IMM)

```
┌─────────────────────────────────────────────────────────────────────┐
│  MIHAI - SOLO FLOW (1-9 angajați, PFA/SRL mic)                      │
└─────────────────────────────────────────────────────────────────────┘

Onboarding
├── 1. Login / Register
├── 2. Selectează modul "Solo" (Proprietar/Manager)
├── 3. Completează profilul firmei:
│   ├── Sector de activitate
│   ├── Număr angajați
│   ├── Utilizare AI tools?
│   ├── Obligat e-Factura?
│   └── Website (opțional)
├── 4. Sistemul determină ce legi se aplică (Applicability Engine)
└── 5. Redirect → Dashboard

Dashboard (Cockpit)
├── Score compliance (readiness %)
├── Framework-uri aplicabile (GDPR, e-Factura, NIS2, AI Act, SAF-T)
├── Cazuri active (findings da rezolvat)
├── Drift activ (alerte)
├── Audit dosar status
├── Ce faci acum (next best action)
├── Activitate recentă
└── Instrumente secundare (scanare site, valoare acumulată)

Acțiuni principale:
├── Scanare document → /dashboard/scan
├── De rezolvat → /dashboard/resolve
├── Dosar → /dashboard/dosar
├── Generator documente → /dashboard/generator
└── Setări → /dashboard/settings

Instrumente disponibile:
├── GDPR:
│   ├── RoPA Generator (/dashboard/ropa) ✅
│   ├── Cookie Banner Generator (integrat în generator)
│   └── DSAR (/dashboard/dsar) ✅
├── Fiscal:
│   ├── e-Factura Validator (/dashboard/fiscal) ✅
│   └── Status Interpreter ✅
├── NIS2:
│   ├── Eligibility Wizard ✅
│   ├── Assessment ✅
│   └── Maturitate (dacă aplicabil) ✅
├── AI Act:
│   ├── AI Inventory (/dashboard/sisteme) ✅
│   └── Conformity Assessment (/dashboard/conformitate) ✅
└── Altele:
    ├── Vendor Review ✅
    ├── Whistleblowing Channel ✅
    └── Calendar ✅

Diferențiere solo:
├── Simplified UI - un singur organization context
├── Focus pe acțiune - next best action prominent
├── Fără portofoliu multi-client
├── Fără rapoarte cross-client
├── Task-uri personalizate pentru IMM
└── Warning-uri specifice pentru deadline-uri scurte
```

### 3.2 Diana - Partner (Consultant/Contabil)

```
┌─────────────────────────────────────────────────────────────────────┐
│  DIANA - PARTNER FLOW (20+ clienți, consultant)                      │
└─────────────────────────────────────────────────────────────────────┘

Onboarding
├── 1. Login / Register
├── 2. Selectează modul "Partner" (Consultant/Contabil/Auditor)
├── 3. Workspace setup:
│   ├── Workspace mode: "portfolio"
│   └── Poate adăuga organizații(clienți)
└── 4. Redirect → Portfolio Overview

Portfolio Overview (/portfolio)
├── Agregat de performanță across all clients
├── Scor mediu de compliance
├── Total clienți / cu probleme / OK
├── Alerte aggregate (drifts across clients)
├── Quick actions: Add client, Import CSV, Export report
└── Navigație: Tasks | Alerts | Vendors | Reports | Clients

Portfolio - Tasks (/portfolio/tasks)
├── Task-uri pentru toți clienții
├── Filter by client, priority, deadline
├── Batch actions (assign, complete)
└── Export pentru raportare client

Portfolio - Alerts (/portfolio/alerts)
├── Drift-uri across all clients
├── Sorted by severity
├── Grouped by client
└── Notification settings

Portfolio - Vendors (/portfolio/vendors)
├── Vendor registry across all clients
├── Risk assessment per vendor
└── Shared vendor database

Portfolio - Reports (/portfolio/reports)
├── Monthly digest per client
├── Aggregated compliance report
├── Export PDF/CSV
└── Share with clients

Portfolio - Client Detail (/dashboard/partner/[orgId])
├── Scor individual per client
├── Active findings
├── Documente generate
├── Task-uri pending
└── Setări specifice client

Acțiuni în context org (din dashboard)
├── Toate funcționalitățile standard (ca la solo)
├── Plus: raportare dedicată client
├── Plus: batch operations
└── Plus: assign tasks to self/client

Diferențiere partner:
├── Multi-tenant view
├── CSV import pentru bulk client onboarding
├── Cross-client analytics
├── Shareable reports (link temporar pentru client)
├── White-label options (în roadmap)
├── Task assignment (self sau client)
└── Vendor management shared across clients
```

### 3.3 Radu - Compliance Officer

```
┌─────────────────────────────────────────────────────────────────────┐
│  RADU - COMPLIANCE FLOW (departament intern, audit rights)         │
└─────────────────────────────────────────────────────────────────────┘

Onboarding
├── 1. Login / Register
├── 2. Selectează modul "Compliance" (Responsabil conformitate)
├── 3. Completează profil organizație
├── 4. Audit readiness setup (optional):
│   ├── Current audit framework?
│   ├── Prior findings?
│   └── Evidence baseline?
└── 5. Redirect → Dashboard (extended)

Dashboard - Extended View
├── Toate metricile standard
├── PLUS:
│   ├── Board-ready summaries
│   ├── Audit readiness score detailed
│   ├── Risk heatmap
│   ├── Compliance trend (last 12 months)
│   └── Benchmarking indicators (în development)
└── Acces la toate tool-urile avansate

Instrumente disponibile (full access):
├── All standard features (GDPR, fiscal, NIS2, AI Act)
├── PLUS advanced:
│   ├── DORA Assessment (/dashboard/dora) ✅
│   ├── Trust Center (/dashboard/reports/trust-center) ✅
│   ├── Auditor Vault (/dashboard/reports/vault) ✅
│   ├── Full Audit Log (/dashboard/reports/audit-log) ✅
│   ├── Evidence traceability matrix
│   ├── Policy acknowledgment tracking
│   └── Extended reporting

Governance & Reporting
├── NIS2 Governance (/dashboard/nis2/governance)
│   ├── Board reporting
│   ├── Incident response workflow
│   └── DNSC correspondence tracking
├── Policy Management
│   ├── Full policy lifecycle
│   ├── Acknowledgment tracking
│   └── Version control
├── Audit Trail
│   ├── Complete history
│   ├── Export for auditors
│   └── Retention policies

Diferențiere compliance:
├── Full audit capabilities
├── Board-level reporting
├── Advanced governance tools
├── DORA (Digital Operational Resilience Act)
├── Policy lifecycle management
├── Evidence chain of custody
├── Extended audit log
└── No workspace switch needed (single org context)
```

---

## 4. Feature Maturity Analysis

### 4.1 Production Ready (✅✅✅)

| Feature | Descriere | Note |
|---------|-----------|------|
| **Dashboard/Cockpit** | Tablou central cu KPI-uri, findings, next actions | Testat E2E pentru toate 3 persoane |
| **Scanare documente** | Upload + AI analysis + findings extraction | Funcționează cu PDF, Word, text |
| **RoPA Generator** | Generator complet ROPAflow cu export PDF | Testat, funcționează |
| **e-Factura Validator** | Validare XML, repair, status interpreter | Full implementation |
| **NIS2 Assessment** | Questionnaire + scoring + recommendations | Testat pe Vercel |
| **AI Inventory** | Inventar sisteme AI + discovery panel | Dynamic loading |
| **Generator documente** | Generare politici GDPR, DPA, proceduri | Full template set |
| **Onboarding** | 3 flow-uri diferite în funcție de user mode | Funcționează |

### 4.2 Functional with Gaps (✅✅)

| Feature | Gaps Identificate | Prioritate |
|---------|-------------------|------------|
| **Calendar** | Doar vizualizare, fără evenimente custom | Medium |
| **AI Conformity** | Questionnaire complet, lipsește export formal | Medium |
| **NIS2 Maturitate** | Assessment complet, dashboard de trend lipsește | Low |
| **Vendor Review** | Workflow OK, lipsește scoring automat | Medium |
| **Whistleblowing** | Platforma OK, fără notificări automate | Low |
| **Reports** | Export funcționează, lipsește scheduled reports | Medium |
| **Audit Log** | Complet, dar fără export PDF structurat | Low |

### 4.3 Basic Implementation (✅)

| Feature | Status | Note |
|---------|--------|------|
| **DORA** |刚刚 implementat | Doar assessment de bază |
| **DSAR** | Workflow de bază | Lipsește template automat |
| **Checklists** | View only | Lipsește editor |
| **Agents** | Interfață prezentă | AI agents în development |

---

## 5. Market Needs & Automation Opportunities

### 5.1 GDPR Compliance

| Nevoiă de piață | Soluție curentă | Gap / Oportunitate |
|-----------------|-----------------|-------------------|
| 105 amenzi în România 2025 (€511K) | RoPA Generator, Cookie Banner | **Automatizare**: Generare automată SOP-uri din findings |
| 488 investigații ANSPDCP | DSAR management | **AI**: Automated response drafting |
| Record keeping obligatoriu | Dosar cu evidence | **Oportunitate**: Auto-categorization cu AI |

### 5.2 e-Factura / Fiscal

| Nevoiă de piață | Soluție curentă | Gap / Oportunitate |
|-----------------|-----------------|-------------------|
| 60.5% antreprenori cu probleme e-Factura | Validator, Repair tool | **Critical**: Automated XML correction |
| Deadline 5 zile, 15% penalitate/invoice | Status interpreter | **Agent**: Proactive deadline monitoring |
| SAF-T D406 obligatoriu 2025 | Fiscal revalidation | **Auto**: SAF-T readiness checker |

### 5.3 NIS2

| Nevoiă de piață | Soluție curentă | Gap / Oportunitate |
|-----------------|-----------------|-------------------|
| 6000+ companii afectate, multe nu știu | Eligibility wizard | **Automatizare**: Auto-detection din CUI |
| DNSC registration obligatorie | Inregistrare DNSC page | **AI**: Auto-complete from public registries |
| Incident reporting 24h | Incidents tab | **Agent**: Automated incident classification |

### 5.4 AI Act

| Nevoiă de piață | Soluție curentă | Gap / Oportunitate |
|-----------------|-----------------|-------------------|
| Interdicții Art.5 active din Aug 2025 | AI Inventory | **Critical**: Real-time compliance scanner |
| High-risk systems Aug 2026 | Conformity assessment | **Oportunitate**: Pre-built templates |
| AI literacy obligatoriu | Shadow AI questionnaire | **Auto**: Employee training tracker |

---

## 6. Automation / AI / Agentic Opportunities

### 6.1 High Priority (Quick Wins)

| Automatizare | Impact | Complexitate |
|--------------|--------|--------------|
| **e-Factura auto-repair** | Scade riscul de penalități | Medium |
| **RoPA auto-populate din findings** | Salvează timp 30min/client | Low |
| **NIS2 eligibility auto-check din CUI** | Elimină confuzie | Medium |
| **Deadline alerts (calendar + email)** | Previne amenzi | Low |

### 6.2 Medium Priority (Value Add)

| Automatizare | Impact | Complexitate |
|--------------|--------|--------------|
| **AI Agent pentru DSAR response** | Reduce time 80% | High |
| **Vendor risk auto-scoring** | Scaled monitoring | Medium |
| **Policy acknowledgment auto-reminders** | Audit readiness | Low |
| **Monthly digest auto-generate** | Partner efficiency | Medium |

### 6.3 Long Term (Differentiation)

| Automatizare | Impact | Complexitate |
|--------------|--------|--------------|
| **Real-time compliance radar** | Proactive monitoring | High |
| **Predictive compliance (risk forecast)** | Previne probleme | Very High |
| **Autonomous audit agent** | Reduces audit cost | Very High |
| **Multi-jurisdiction support** | Scale to EU | Very High |

---

## 7. Integration & Trust Points

### 7.1 Current Integrations

- **ANAF / e-Factura** - XML validation, status checking (simulated)
- **DNSC** - NIS2 incident reporting (form generation)
- **Stripe** - Subscription management
- **Supabase** - User/org data persistence
- **Vercel** - Cron jobs for automation

### 7.2 Missing / Needed

| Integrare | Status | Prioritate |
|-----------|--------|------------|
| ANAF API real (SPV) | Nu există încă | Critical |
| Registrul Comerțului (ONRC) | Nu există | High |
| CUI verification (euID) | Partial (prefill) | Medium |
| Email notifications (SendGrid/Resend) | În development | High |
| Calendar sync (Google/Outlook) | Nu există | Medium |
| Webhook pentru external tools | Nu există | Low |

---

## 8. What's Missing (Gap Analysis)

### 8.1 Funcționalități Lipsă

| Feature | De ce contează | Workaround temporar |
|---------|----------------|---------------------|
| **Real e-Factura API** | Nu poate trimite/primi facturi real | Validator offline |
| **Automated periodic scans** | Monitoring continuous | Cron job există, dar basic |
| **Mobile app** | Access on-the-go | Responsive web OK |
| **Team collaboration** | Multiple users same org | Solo mode only for now |
| **White-label** | Partner branding | Nu există |
| **API public** | Third-party integrations | Nu există |
| **Custom workflows** | Flexible compliance | Fixed flow |
| **Compliance marketplace** | Templates/plugins | Manual upload |

### 8.2 UX Gaps

| Problem | Impact | Severitate |
|---------|--------|------------|
| Onboarding takes 3-5 min | Drop-off rate | Medium |
| Finding resolution flow complex | User confusion | High |
| No guided tour after onboarding | Adoption | Medium |
| Error messages not always clear | User frustration | Low |
| Too many tabs in NIS2 | Cognitive load | Medium |

---

## 9. Sales & Distribution Strategy

### 9.1 Key Insight

> **Compliance is a "shameful" problem** - No one openly admits they have it. They search discreetly or ask their accountant. You don't sell the tool - the accountant sells it.

### 9.2 Distribution Channels

| Canal | Eficacitate | Note |
|-------|-------------|------|
| **Contabili / Consultanți** | 🔴🔴🔴🔴🔴 | Canalul principal - vânzare indirectă |
| **Asociații profesionale** | 🔴🔴🔴 | CCA, CECCAR,experți |
| **Law firms** | 🔴🔴🔴 | Corporate law, M&A |
| **Direct marketing** | 🔴 | Nu funcționează - problema e "rușinoasă" |
| **SEO / Content** | 🔴🔴 | Advisory content, nu "buy now" |
| **Events / Conferences** | 🔴🔴 | Low, dar brand awareness |

### 9.3 Partner Program Elements

- **Lead sharing** - Accountant refers, gets commission
- **White-label** - Partner brands for their clients
- **Volume pricing** - 20+ clients discount
- **Training & certification** - CompliAI certified partner
- **Dedicated support** - Priority for partners

---

## 10. Summary & Recommendations

### 10.1 Current State

- **86% feature complete** (30/35 features working)
- **3 user personas** fully functional
- **E2E tests passing** on Vercel
- **Production-ready core**: Dashboard, Scan, Generator, RoPA, e-Factura, NIS2

### 10.2 Priorities for Next Sprint

1. **e-Factura auto-repair** - Critical market need
2. **Partner CSV import** - Diana's workflow
3. **Email notifications** - User engagement
4. **NIS2 eligibility auto-check** - Market confusion
5. **Mobile responsiveness polish** - Better UX

### 10.3 Recomandări pe baza analizei pieței (Martie 2026)

#### 🔴 Prioritate imediată (3-6 luni):

| Framework | De ce contează | Status | Acțiune |
|-----------|----------------|--------|---------|
| **Whistleblowing (UE 2019/1937)** | Obligatoriu pentru >50 angajați | ✅ Implementat | Full access pentru Diana & Radu |
| **DORA** | Obligatoriu pentru bănci/asigurări/fintech | ✅ Implementat | Doar pentru Radu (entități reglementate) |
| **Pay Transparency (UE 2023/970)** | Obligatoriu din Jun 2026 pentru >50 angajați | ✅ Implementat | Generat automat ca finding |

#### 🟡 Prioritate medie (6-12 luni):

| Framework | De ce contează | Status | Acțiune |
|-----------|----------------|--------|---------|
| **CSRD / ESG** | Reporting de sustenabilitate pentru companii listate sau >500 angajați | ❌ Nu e început | Start development Q3 2026 |
| **Cyber Resilience Act (CRA)** | Pentru producători software/hardware | ❌ Nu e început | Monitorizare, start 2027 |

#### ⚪ Nu recomandăm acum:

| Framework | De ce |
|-----------|-------|
| **CSDDD** | Prea îndepărtat (2027+), nu e relevant pentru IMM-urile țintă |
| **Data Act** | Prea nișat, nu e relevant pentru piața țintă |

#### Cum se mappează pe personas:

- **Mihai (Solo/IMM mic)**: Pay Transparency + Whistleblowing = cele mai dureroase (obligatorii la >50 angajați)
- **Diana (Consultant/Partner)**: Toate framework-urile noi = mai multe servicii de consultanță pentru vânzare
- **Radu (Compliance intern)**: DORA + Whistleblowing + Pay Transparency = raportare board + audit readiness

### 10.4 Long-term Differentiation

- **Autonomous compliance agent** - Future state
- **Predictive risk modeling** - Proactive, not reactive
- **Real e-Factura integration** - Connect to ANAF SPV
- **EU multi-jurisdiction** - Beyond Romania

---

## 11. Appendix: Feature Code Mapping

| Feature | Page Route | Component | Key Lib Files |
|---------|------------|-----------|---------------|
| Dashboard | `/dashboard` | `dashboard/page.tsx` | `use-cockpit.ts`, `dashboard-routes.ts` |
| Scan | `/dashboard/scan` | `scan-page.tsx` | `intake-engine.ts`, `llm-scan-analysis.ts` |
| Resolve | `/dashboard/resolve` | `resolve-page.tsx` | `finding-resolution.ts`, `remediation-recipes.ts` |
| RoPA | `/dashboard/ropa` | `ropa/page.tsx` | (inline, no separate lib) |
| Fiscal | `/dashboard/fiscal` | `fiscal/page.tsx` | `efactura-validator.ts`, `filing-discipline.ts` |
| NIS2 | `/dashboard/nis2` | `nis2/page.tsx` | `nis2-rules.ts`, `dnsc-report.ts` |
| AI Systems | `/dashboard/sisteme` | `sisteme/page.tsx` | `ai-inventory.ts`, `ai-act-classifier.ts` |
| Partner | `/portfolio` | `portfolio/page.tsx` | `portfolio-overview-client.tsx` |

---

*Document generat pe baza analizei codului sursă și testelor E2E existente.*
*Pentru actualizări, rulează: `npm run analyze-features` (de creat)*