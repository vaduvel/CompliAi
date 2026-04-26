# 02 — CompliScan: arhitectura IA/UX (unde cere piața)

**Data**: 26 aprilie 2026
**Status**: canonical — singura sursă pentru "cum se navighează aplicația, ce primitive există, cum arată"
**Înlocuiește**: `IA-UX-PROPUNERE (1).md` (deprecated cu persona contabil) + `IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md` + `IA-UX-IMPLEMENTATION-MATRIX.md` + `IA-UX-ROUTE-PARITY-ADDENDUM.md` + secțiunile 4-13 din vechi `compliscan-product-manifest`
**Validări incluse**: demo run pe cod real + răspuns DPO firm sofisticat

---

## TL;DR

Aplicația operează pe **un singur spine canonical** comun pentru toate 5 produse:

```
Cabinet/Org → Client/Sub-org → Cockpit Finding → Dosar → Audit Pack ZIP
```

Tot restul (43+1 rute, 5 moduri navigare, 5 ICP-uri, 10 primitive) e atașat la acest spine.

**Diferențiator arhitectural cheie vs concurenți**: **cockpit finding-first**. Privacy Manager, MyDPO, Wolters Kluwer, Sectio Aurea (NIS2), SmartBill (fiscal) au workflows fragmentate cross-tabs. CompliScan are **o pagină per caz** care strânge tot — bază legală + draft + dovezi + history + CTA. Asta e UX-ul care face diferența zilnic, nu AI-ul.

**Codul conține 5 produse comerciale coexistente** într-o platformă tehnică unică:
- **DPO OS** — GDPR + Legea 190/2018 + ANSPDCP (primary lansare Q3 2026)
- **NIS2 OS** — NIS2 + DNSC + ICT risk (Q1 2027)
- **Fiscal OS** — e-Factura + ANAF SPV + SAF-T (Q3 2027)
- **AI Act OS** — AI Act + Annex IV (2028)
- **DORA OS** — DORA + BNR + ICT third-party (2028)

Soluția arhitecturală: **feature flag `module.{name}.enabled` per cabinet/org**. Default `dpoOs: true`, restul `false` până la upgrade tier sau lansare publică.

**Design system**: V3 — Space Grotesk (display) + IBM Plex Mono (eyebrows) + Inter (body) + cobalt accent. Aplicat 100% peste tot deja.

---

## 1. Spine canonical — singurul flow

```
┌─────────────────────────────────────────────────────────────┐
│  CABINET (Diana — DPO Complet SRL)                          │
│  ↓                                                          │
│  PORTOFOLIU (3 clienți colorați după risc)                  │
│  ↓                                                          │
│  WORKSPACE CLIENT (Apex Logistic — banner persistent)       │
│  ↓                                                          │
│  COCKPIT FINDING (GDPR-010 DPA Stripe)                      │
│  ↓ AI generează draft → DPO validează                       │
│  MAGIC LINK PATRON (HMAC-signed, 72h, brand-uit)            │
│  ↓ patron aprobă                                            │
│  DOSAR CLIENT (document active, evidence atașat)            │
│  ↓                                                          │
│  AUDIT PACK ZIP (semnat criptografic, ANSPDCP-ready)        │
└─────────────────────────────────────────────────────────────┘
```

Acest flow e **non-negociabil**. Orice feature nou care nu se ancorează în spine NU e produs CompliScan — e produs colateral care trebuie sau eliminat sau ascuns.

---

## 2. Cele 4 personas

### Persona 1 — Diana (DPO consultant)

**ICP primar**. Decide subscription.

- 25-50 clienți
- Lucrează pe Word/Excel/Drive azi
- Plătește €49-999/lună
- Vrea: portofoliu clar, AI-assist documente, white-label perfect, Audit Pack 1-click
- NU vrea: AI care semnează, disclaimere care îi subminează autoritatea, brand CompliScan vizibil patronului

### Persona 2 — Mihai (patron / administrator firmă client)

**Destinatar de output**. Nu folosește aplicația direct.

- Primește magic link în email cu document de aprobat
- Click → vede pagină brand-uită cabinet (NU CompliScan)
- Vede draftul Privacy Policy / DPA
- Aprobă (1 click) sau respinge cu comentariu
- NU vrea să creeze cont, să se logheze sau să plătească

### Persona 3 — Andrei (responsabil intern compliance, NIS2)

**ICP secundar**. Pentru firme mari obligate NIS2 cu DPO intern.

- 1 firmă (a lui), nu portofoliu
- Modul "Internal Compliance" cu workspace single-tenant
- Pricing tier diferit (€149-349/lună)

### Persona 4 — Auditorul ANSPDCP / DNSC

**Read-only consumer al Audit Pack**.

- Primește ZIP de la Diana sau Andrei
- Verifică structura local (MANIFEST + reports + data + nis2 + evidence)
- NU folosește aplicația

→ Diana (P1) e prioritate 80%. Mihai (P2) e prioritate 15%. Andrei (P3) și auditorul (P4) sunt 5% din toată UX-ul.

---

## 3. Cele 5 moduri de navigare

### Mod 1 — Portofoliu cabinet

**Path**: `/dashboard` (default după login partner mode)

**Conținut**:
- Header cu cabinet name + logo + signature + plan tier
- Card-uri client (3 sau 50) sortate după severity
- Per card: nume client, scor compliance, alert count, last activity
- Filtre: sector, risc, status DSAR, plan client
- Acțiuni: "Add client", "Import CSV", "Bulk monthly report"

**Banner critic**: "Cabinet: DPO Complet SRL — operăm portofoliu pentru 3 clienți operatori"

### Mod 2 — Workspace client

**Path**: `/dashboard/[clientName]/...`

**Conținut**:
- Banner persistent: "Lucrezi pentru {client} — ca {cabinet}"
- Sub-rute: Acasă, De rezolvat, Cockpit, Documente, Dosar, Setări
- Toate datele filtrate la org-ul activ
- Workspace switch: dropdown în header → schimbă orgId în session cookie

### Mod 3 — Cockpit finding

**Path**: `/dashboard/finding/[findingId]` SAU `/dashboard/[client]/cockpit/[findingId]`

**Conținut**:
- Eyebrow: framework + severity badge (high/medium/low)
- Title: titlul finding-ului (ex: "DPA Stripe expirat")
- Detail: descriere problemă + impact + acțiune recomandată
- Buttons: "Generează draft", "Atașează dovadă", "Marchează rezolvat"
- Resolution box: problem / impact / action / closure evidence
- AI suggested document area (preview + edit + send for review)

**O pagină = un caz**. Niciodată multi-finding pe aceeași pagină.

### Mod 4 — Dosar client

**Path**: `/dashboard/dosar` (în context client activ)

**Conținut**:
- Tab-uri: Documente, Evidence, Rapoarte, Snapshots, NIS2
- Filtre: framework, document type, adoption stage
- Per document: title, status (draft/sent/signed/active), version, last update
- Acțiuni bulk: "Export Audit Pack ZIP", "Generate monthly report"

### Mod 5 — Patron view (`/shared/[token]`)

**Path**: `/shared/[token]` (public, no auth)

**Conținut**:
- Brand cabinet (logo, color, footer)
- Title: nume client (ex: "Apex Logistic SRL")
- Document de revizuit (Privacy Policy / DPA / etc.)
- Acțiuni: **Aprob** / **Respinge** / **Trimite comentariu** *(reject/comment în Sprint 1)*
- Footer: "Pregătit de {cabinet} — {consultant}, {certification} · {email}"
- Token expiry indicator: "Acces valabil până {date}"

**Niciodată CompliScan brand vizibil patronului**. White-label complet.

---

## 4. Rutele canonice (43+1)

| # | Path | Mod | Status în cod | Audiență |
|---|---|---|---|---|
| 1 | `/login` | auth | ✅ | toate persona |
| 2 | `/register` | auth | ✅ | nou cabinet |
| 3 | `/dashboard` | M1 portofoliu (partner) | ✅ | Diana |
| 4 | `/dashboard/onboarding` | M1 setup | ⚠️ 60% | Diana new |
| 5 | `/dashboard/portfolio` | M1 portofoliu (alias) | ✅ | Diana |
| 6 | `/dashboard/clients/add` | M1 add client | ✅ | Diana |
| 7 | `/dashboard/clients/import` | M1 CSV import | ✅ | Diana |
| 8 | `/dashboard/clients/[id]` | M2 workspace | ✅ | Diana |
| 9 | `/dashboard/[client]/acasa` | M2 home | ✅ | Diana |
| 10 | `/dashboard/[client]/de-rezolvat` | M2 queue | ✅ | Diana |
| 11 | `/dashboard/[client]/cockpit/[findingId]` | M3 cockpit | ✅ | Diana |
| 12 | `/dashboard/[client]/documente` | M4 dosar docs | ✅ | Diana |
| 13 | `/dashboard/[client]/dosar` | M4 dosar | ✅ | Diana |
| 14 | `/dashboard/[client]/sisteme` | AI inventory | ✅ | Diana |
| 15 | `/dashboard/[client]/setari` | client settings | ⚠️ 70% | Diana |
| 16 | `/dashboard/[client]/audit-pack` | M4 audit pack | ✅ | Diana |
| 17 | `/dashboard/[client]/rapoarte` | M4 raport | ✅ | Diana |
| 18 | `/dashboard/[client]/calendar` | calendar | ✅ | Diana |
| 19 | `/dashboard/[client]/alerts` | alerts | ✅ | Diana |
| 20 | `/dashboard/[client]/chat` | AI chat | ⚠️ basic | Diana |
| 21 | `/dashboard/[client]/dsar` | DSAR queue | ✅ | Diana |
| 22 | `/dashboard/[client]/breach` | incident reporting | ⚠️ 50% | Diana |
| 23 | `/dashboard/[client]/vendors` | vendor register | ✅ | Diana |
| 24 | `/dashboard/[client]/employees` | HR registru | ⚠️ 60% | Diana |
| 25 | `/dashboard/[client]/efactura` | e-Factura | ✅ **(hidden DPO mode)** | NU Diana |
| 26 | `/dashboard/[client]/spv` | SPV ANAF | ✅ **(hidden DPO mode)** | NU Diana |
| 27 | `/dashboard/[client]/etva` | e-TVA | ✅ **(hidden DPO mode)** | NU Diana |
| 28 | `/dashboard/[client]/saft` | SAF-T D406 | ✅ **(hidden DPO mode)** | NU Diana |
| 29 | `/dashboard/[client]/snapshots` | snapshot history | ✅ | Diana |
| 30 | `/dashboard/[client]/drift` | drift detection | ⚠️ 30% | Diana |
| 31 | `/dashboard/[client]/nis2` | NIS2 module | ⚠️ 50% | Diana selectiv |
| 32 | `/dashboard/[client]/training` | training modules | ❌ 0% | Diana future |
| 33 | `/dashboard/cabinet/setari` | cabinet settings | ⚠️ 60% | Diana |
| 34 | `/dashboard/cabinet/branding` | brand setup | ❌ 30% | Diana |
| 35 | `/dashboard/cabinet/templates` | custom templates | ❌ 10% | Diana |
| 36 | `/dashboard/cabinet/billing` | Stripe billing | ❌ 0% Sprint 2 | Diana |
| 37 | `/dashboard/cabinet/team` | multi-DPO seats | ⚠️ 50% | Diana |
| 38 | `/dashboard/cabinet/api-keys` | API access (Pro+) | ❌ 0% | Diana Pro |
| 39 | `/dashboard/admin` | super-admin (founder) | ✅ | Daniel |
| 40 | `/shared/[token]` | M5 patron view | ⚠️ 70% | Mihai patron |
| 41 | `/api/auth/*` | auth endpoints | ✅ | system |
| 42 | `/api/exports/*` | export endpoints | ✅ | Diana |
| 43 | `/api/reports/share-token` | magic link create | ✅ | Diana |
| 43+1 | `/welcome` | post-pilot onboarding | ❌ 0% | new clients |

**Total funcționale 100%**: 23 rute
**Parțiale**: 11 rute
**Lipsesc/0%**: 5 rute
**Hibernate (Fiscal OS)**: 4 rute (25, 26, 27, 28)

→ Maturity rute: ~70% complet pentru DPO ICP.

---

## 5. White-label arhitectural

### Cum se aplică white-label

**În cabinet brand-config.json** (per partner_account):

```json
{
  "cabinet_name": "DPO Complet SRL",
  "brand_color": "#0F3D5E",
  "accent_color": "#38BDF8",
  "logo_url": "/uploads/dpo-complet-logo.svg",
  "consultant": {
    "name": "Diana Popescu",
    "title": "DPO / Privacy Consultant",
    "certification": "CIPP/E #12345",
    "email": "diana@dpocomplet.ro",
    "phone": "+40 700 000 000"
  },
  "footer": "Document pregătit de DPO Complet SRL pentru clientul indicat. Drafturile se validează de consultantul DPO înainte de trimitere."
}
```

### Unde se propagă

| Zona | White-label aplicat azi | Status |
|---|---|---|
| Patron magic link page (`/shared/[token]`) | Logo + cabinet name în header | ⚠️ 70% — Diana branding lipsă |
| Document footer (Privacy Policy, DPA) | Cabinet + consultant + cert | ⚠️ 60% — disclaimer toxic încă |
| Audit Pack reports HTML (`audit-pack-client-*.html`) | Cabinet name în hero | ❌ 30% — "Workspace local" bug |
| Audit Pack MANIFEST.md | Organizație: cabinet | ❌ 30% — același bug |
| Email magic link (notification) | Sender = cabinet, NU CompliScan | ⚠️ 50% — pe email funcționează, pe page parțial |
| Monthly report PDF | Cabinet brand peste tot | ❌ Sprint 2 |

→ White-label e **arhitectural prezent** în cod (state schema accepts brand-config), dar **propagarea în output e incompletă**. Vezi gap doc 03.

### Fără CompliScan brand vizibil patronului

**Regula de aur**: la `/shared/[token]`, patron NU vede niciodată numele "CompliScan". Footer = doar cabinet. Logo = doar cabinet. URL = `compliscan.ro/shared/...` momentan, dar pe roadmap = cabinet custom domain (Sprint 4).

---

## 6. Multi-AI provider strategy

### Stack AI propus (validat)

```
LAYER ABSTRACTION (lib/server/ai-provider.ts)
├── Default: Gemini 2.5 Flash Lite (EU region)
├── Optional: Mistral Large 2 (EU sovereignty)
├── Fallback: template-based (NO AI dependency)
└── Future: Claude Sonnet 4.6 (multi-tenant decision)
```

### Per tier pricing

| Tier | AI default | AI override |
|---|---|---|
| Starter (€49) | Gemini Flash Lite | nu |
| Solo (€149) | Gemini Flash Lite | nu |
| Growth (€349) | Gemini Flash Lite | Mistral EU disponibil |
| Pro (€699) | Gemini Flash Lite | Mistral EU + multi-model |
| Studio (€999) | Multi-model | Custom configurabil per cabinet |

### AI OFF per client

**Critic pentru ICP**: cabinetele cu clienți fintech / healthcare cer NICI un byte de date la furnizor AI.

**Soluție**:
- Per `client.aiEnabled: boolean` în config
- Default `true` la add client
- Toggle UI: "Setări client → AI generation: ON / OFF"
- Când OFF: document generator returnează **doar template-based** output (cu placeholders + cabinet branding), zero call la AI provider

→ Status azi: ❌ NU implementat. Sprint 0 fix.

### EU sovereignty

Gemini 2.5 Flash Lite via Vertex AI EU region (DE, NL, FR) — datele nu părăsesc UE.

Mistral Large 2 = EU pure (FR), opțiune premium.

Niciun call la US-only providers (OpenAI, Anthropic) **fără consimțământ explicit cabinet**.

---

## 7. Magic link share-tokens

### Implementare

```typescript
// lib/server/share-token-store.ts
generateSignedShareToken({
  orgId: "org-9dbd16da99cdd9c1",
  recipientType: "patron" | "auditor" | "client_employee",
  expiresInHours: 72  // default
}) → token HMAC-SHA256 base64url
```

### Flow

1. Diana în cockpit: click "Trimite spre validare patron" pe document
2. Backend: `POST /api/reports/share-token` returnează token + URL
3. UI: copy URL în clipboard sau pre-fill email cu template
4. Diana trimite URL patronului prin email/WhatsApp
5. Patron click → `/shared/[token]` → resolve token → load org state read-only
6. Patron vede document brand-uit cabinet, click "Aprob" → POST status update
7. Diana primește notificare (email + dashboard)

### Securitate

- **HMAC-SHA256 signed** (nu encryptat) — orice modificare = invalid token
- **Expires 72h default** (configurabil 24h-7zile)
- **Single-use opțional** (param `singleUse: true`)
- **Revocable** prin `POST /api/reports/share-token/revoke`
- **Audit trail** — log cu IP + user-agent + timestamp în `events`

### Status azi

- ✅ Token generation funcțional (verificat în demo run)
- ✅ Patron page rendering funcțional (92KB HTML)
- ⚠️ Aprob/Respinge buttons LIPSESC pe `/shared/[token]` — Sprint 0 obligatoriu
- ⚠️ Diana branding (consultant card) parțial pe patron page

---

## 8. Audit Pack ZIP — structura formală

### Structura (verificată în demo run azi)

```
audit-pack-{client}-{date}.zip
├── README.txt                    (ghid de citire pentru auditor)
├── MANIFEST.md                   (rezumat formal — organizație, scor, conținut)
├── data/
│   ├── audit-pack-v2-1.json      (schema v2.1 — workspace + executiveSummary + controlsMatrix + traceabilityMatrix + nis2Report + appendix)
│   ├── ai-compliance-pack.json
│   ├── traceability-matrix.json  (alerts ↔ controls ↔ findings)
│   ├── evidence-ledger.json      (per-evidence: hash + timestamp + type)
│   └── bundle-manifest.json      (file index + SHA-256 per fișier)
├── reports/
│   ├── audit-pack-client-{client}-{date}.html  (HTML A4 printabil — 26KB)
│   ├── annex-iv-lite-{client}-{date}.html      (Annex IV scurt pentru AI Act)
│   └── executive-summary.txt
├── nis2/
│   ├── assessment.json
│   ├── governance-training.json
│   ├── incidents.json
│   ├── maturity-assessment.json
│   ├── vendor-risk-report.json
│   └── vendors.json
└── evidence/                     (folder cu PDF-uri / screenshot-uri / log-uri atașate)
```

### Coerență format

- Toate documentele HTML brand-uite cabinet
- Toate JSON-urile au `workspace.id` + `workspace.name` + `workspace.label` corect
- MANIFEST.md cu SHA-256 per fișier (***Sprint 0 — momentan lipsește***)

### Cum îl deschide auditorul

1. Unzip
2. Citește `README.txt` (ghid)
3. Citește `MANIFEST.md` (rezumat formal)
4. Deschide `reports/executive-summary.txt` (sumar text)
5. Deschide `reports/audit-pack-client-*.html` în browser (vizual A4)
6. Verifică `data/audit-pack-v2-1.json` pentru detaliu tehnic
7. Validează evidence-ledger.json ↔ evidence/ folder
8. **Verifică SHA-256 hash chain** (Sprint 0)

---

## 9. Document lifecycle (4 stages)

```
   1. reviewed_internally
   ↓ (DPO validează manual draftul AI-generat)
   2. sent_for_signature
   ↓ (magic link trimis patronului)
   3. signed
   ↓ (patron a aprobat, timestamps salvate)
   4. active
```

### Tranziții și gating

- `reviewed_internally → sent_for_signature`: DPO click "Trimite spre validare", magic link generat
- `sent_for_signature → signed`: patron click "Aprob" pe `/shared/[token]`
- `signed → active`: timer 24h sau click manual DPO "Marchează active"
- Reverse: `active → reopen` la drift detection (Sprint 3)

### Adoption tracker

UI: în Dosar, fiecare document are progress bar 4 steps. Hint sub progress: "Așteptăm aprobarea patronului — link trimis la mihai@apex... pe 26 apr 14:30, expiră 29 apr 14:30".

---

## 10. 5 produse coexistente în cod — soluție arhitecturală

### Realitate (descoperit empiric în demo run + market validation)

Codebase-ul curent are **5 produse comerciale** coexistente într-o platformă tehnică unică:

| Modul | Frameworks | Routes | API | State fields | Status maturity |
|---|---|---|---|---|---|
| **DPO OS** | GDPR, Legea 190/2018, ANSPDCP | 1-24, 29-44 | `/api/findings`, `/api/documents/generate`, `/api/exports/audit-pack`, `/api/reports/share-token` | `findings`, `alerts`, `generatedDocuments`, `traceabilityReviews` | 87% |
| **NIS2 OS** | NIS2, OUG 155/2024, Lege 124/2025, DNSC | 31, 30 (drift) | `/api/nis2/*`, `dnsc-monitor.ts` | `nis2Eligibility`, `incidents`, `vendorRiskMatrix`, `maturityAssessment`, `governanceTraining` | 85% |
| **Fiscal OS** | e-Factura, OUG 120/2021, SPV, SAF-T, e-TVA | 25-28 | `/api/fiscal/*`, `/api/efactura/*`, `/api/anaf/*` | `efacturaConnected`, `efacturaValidations`, `vatRegistered`, `fiscalProtocols`, `etvaDiscrepancies` | 80% |
| **AI Act OS** | AI Act Reg. 2024/1689 | 14 (sisteme) | `/api/exports/ai-act-evidence-pack` | `aiSystems`, `detectedAISystems`, `aiComplianceFieldOverrides` | 60% |
| **DORA OS** | DORA Reg. 2022/2554, BNR | 0% UI | (planned) | (planned) | 10% |

### Soluție arhitecturală: feature flags per produs

```typescript
// lib/shared/product-modules.ts (nou)
export interface ProductModules {
  dpoOs: boolean              // GDPR + DSAR + ROPA + DPA + Privacy Policy
  nis2Os: boolean             // NIS2 + DNSC + ICT risk + incident reporting
  fiscalOs: boolean           // e-Factura + SPV + SAF-T + e-TVA
  aiActOs: boolean            // AI Act + Annex IV + AI inventar
  doraOs: boolean             // DORA + BNR + ICT third-party
  internalComplianceMode: boolean  // single-org variant pentru NIS2 OS
}

// lib/server/product-config.ts (nou)
export async function getEnabledProducts(orgId: string): Promise<ProductModules>
export async function setProductsEnabled(orgId: string, products: ProductModules)

// .data/product-modules-{orgId}.json (per-org storage)
// Default pentru cabinet DPO nou:
{
  "dpoOs": true,
  "nis2Os": false,
  "fiscalOs": false,
  "aiActOs": false,
  "doraOs": false,
  "internalComplianceMode": false
}
```

### Plan tier → produse activate (mapping)

```typescript
// lib/server/plan-products-map.ts (nou)
export const PLAN_PRODUCTS_MAP: Record<PlanTier, ProductModules> = {
  // DPO OS tiers
  "solo-dpo":     { dpoOs: true, ... rest false },
  "cabinet-dpo":  { dpoOs: true, ... rest false },
  "pro-dpo":      { dpoOs: true, ... rest false },
  "studio-dpo":   { dpoOs: true, ... rest false },
  
  // NIS2 OS tiers (post-Q1 2027)
  "single-nis2":  { nis2Os: true, ... rest false },
  "cabinet-nis2": { nis2Os: true, ... rest false },
  "pro-nis2":     { nis2Os: true, ... rest false },
  
  // Fiscal OS tiers (post-Q3 2027)
  "solo-fiscal":   { fiscalOs: true, ... rest false },
  "cabinet-fiscal":{ fiscalOs: true, ... rest false },
  "pro-fiscal":    { fiscalOs: true, ... rest false },
  
  // AI Act OS tiers (post-2028)
  "starter-ai":   { aiActOs: true, ... rest false },
  "pro-ai":       { aiActOs: true, ... rest false },
  
  // DORA OS tiers (post-2028)
  "single-dora":  { doraOs: true, ... rest false },
  "multi-dora":   { doraOs: true, ... rest false },
  
  // Combo (rar, avocatură enterprise)
  "combo-dpo-nis2":   { dpoOs: true, nis2Os: true, ... rest false },
  "combo-dpo-aiact":  { dpoOs: true, aiActOs: true, ... rest false },
  "studio-allin":     { dpoOs: true, nis2Os: true, fiscalOs: true, aiActOs: true, doraOs: true },
}
```

### Aplicare în Sidebar

```tsx
// components/compliscan/dashboard-shell.tsx
const products = await getEnabledProducts(session.orgId)

<Sidebar>
  {products.dpoOs && (
    <NavGroup label="Privacy & GDPR">
      {/* findings GDPR + DSAR + RoPA + DPA + Privacy Policy + ANSPDCP */}
    </NavGroup>
  )}
  
  {products.nis2Os && (
    <NavGroup label="Cybersecurity & NIS2">
      {/* incidents + vendor risk + maturity + DNSC reporting */}
    </NavGroup>
  )}
  
  {products.fiscalOs && (
    <NavGroup label="Fiscal & e-Factura">
      {/* validator UBL + SPV + e-TVA discrepancies + SAF-T */}
    </NavGroup>
  )}
  
  {products.aiActOs && (
    <NavGroup label="AI Governance">
      {/* AI inventar + Annex III/IV + risk classification */}
    </NavGroup>
  )}
  
  {products.doraOs && (
    <NavGroup label="Financial Compliance">
      {/* DORA + ICT third-party + BNR reporting */}
    </NavGroup>
  )}
</Sidebar>
```

### Aplicare în findings detection

```typescript
// lib/server/findings-detector.ts
const detectedFindings = []
if (products.dpoOs) detectedFindings.push(...detectGDPR(state), ...detectAIAct(state, "privacy"))
if (products.nis2Os) detectedFindings.push(...detectNIS2(state))
if (products.fiscalOs) detectedFindings.push(...detectEFactura(state))
if (products.aiActOs) detectedFindings.push(...detectAIAct(state, "governance"))
if (products.doraOs) detectedFindings.push(...detectDORA(state))
return detectedFindings
```

### Onboarding choice — primul ecran (Sprint 1)

```tsx
// app/onboarding/product-choice/page.tsx (nou)
<OnboardingStep title="Bine ai venit la CompliScan. Ce te aduce aici azi?">
  <ProductCard
    productId="dpo-os"
    title="DPO Operating System"
    description="Cabinet GDPR cu portofoliu multi-client. Privacy Policy, DPA, RoPA, DSAR, ANSPDCP."
    price="de la €49/lună"
    icp="Diana — DPO consultant"
    available={true}
  />
  <ProductCard
    productId="nis2-os"
    title="NIS2 Operating System"
    description="Implementare NIS2 + DNSC reporting + ICT risk + cyber incident management."
    price="de la €99/lună"
    icp="Mihai — CISO/cybersec consultant"
    available={false}
    waitlistAvailable={true}  // Q1 2027
  />
  <ProductCard
    productId="fiscal-os"
    title="Fiscal Operating System"
    description="e-Factura validator UBL CIUS-RO + ANAF SPV + SAF-T + e-TVA discrepancies."
    price="de la €29/lună"
    icp="Marius — contabil CECCAR"
    available={false}
    waitlistAvailable={true}  // Q3 2027
  />
  <ProductCard
    productId="ai-act-os"
    title="AI Act Operating System"
    description="AI inventar + Annex III/IV + risk classification + Annex IV documentation."
    price="de la €149/lună"
    icp="Andrei — AI Governance specialist"
    available={false}
    comingSoon={true}  // 2028
  />
  <ProductCard
    productId="dora-os"
    title="DORA Operating System"
    description="DORA + ICT third-party + BNR reporting + financial compliance."
    price="de la €499/lună"
    icp="Cristina — Financial Compliance specialist"
    available={false}
    comingSoon={true}  // 2028
  />
  <ProductCard
    productId="combo"
    title="Multi-framework Combo"
    description="Pentru avocatură enterprise care face cross-framework. Studio All-in cu toate 5 module."
    price="de la €399/lună (combo) sau €1.999 (Studio All-in)"
    icp="Avocatură enterprise (Wolf Theiss, DLA Piper stil)"
    available={false}
    contactSales={true}
  />
</OnboardingStep>
```

→ Pentru cabinet DPO nou care alege "DPO OS", restul 4 produse rămân ascunse. Cod intact, UI invizibil. Cabinet nu vede sidebar groups pentru NIS2/Fiscal/AI Act/DORA.

→ Activare ulterioară: cabinet upgrade la combo "DPO + NIS2" → `nis2Os: true` → toate rute NIS2 reapar instant.

---

## 11. Romanian-native integrations

### Existente în cod (verificat post code audit 26 apr)

| Integrare | Endpoint/utility | Status | Ce face |
|---|---|---|---|
| **ANAF SPV** | `/api/anaf/oauth-state`, `lib/server/anaf-prefill.ts` | ⚠️ 60% | Prefill firma după CUI |
| **ANSPDCP** | forms locale + ghiduri | ⚠️ 50% | Format declarații DPO |
| **DNSC NIS2** | `lib/server/nis2-store.ts` (300+ linii), `lib/server/dnsc-monitor.ts`, `lib/compliscan/nis2-eligibility.ts` | ✅ 85% | Incident reporting 3 stages (early warning 24h + full report 72h + final), vendor risk matrix, maturity assessment, governance training tracking, OUG 155/2024 + Lege 124/2025 + Ordin 1/2025 |
| **e-Factura UBL** | `lib/compliance/efactura-validator.ts` | ✅ 80% | Validator CIUS-RO complet (hibernated DPO mode) |
| **ONRC** | căutare CUI | ⚠️ 40% | Statut firmă |
| **Monitorul Oficial** | feed legislativ | ❌ 0% | Sprint 4 — alerts noi acte normative |

**Deadline-uri NIS2 corectate (26 apr 2026)**:
- Înregistrare DNSC = **22 septembrie 2025** (TRECUT, mulți încă neînregistrați)
- Implementare măsuri raportare = **octombrie 2026** (viitor — window 6 luni rămase)
- 12.000-20.000 entități obligate (LegalUp + Wolf Theiss + NNDKP estimări)

### De ce contează

**Diferența "made in Romania"**: cabinet RO nu poate folosi DataGuard fără să refacă manual mappingul ANAF / ANSPDCP. CompliScan oferă din prima zi.

---

## 12. Design system V3 — aplicat

### Tokens

```css
/* Tipografie */
--font-display: "Space Grotesk", sans-serif
--font-body: "Inter", sans-serif
--font-mono: "IBM Plex Mono", monospace

/* Color */
--cobalt-primary: #0F3D5E
--cobalt-accent: #38BDF8
--eos-text-primary: #14181f
--eos-text-secondary: #5b6573
--eos-border-default: #dfe5ec
--eos-surface-base: #ffffff
--eos-surface-secondary: #f5f7fb

/* Severity */
--eos-status-success: #0f8f5a
--eos-status-warning: #9a6a00
--eos-status-danger: #b42318
--eos-accent-secondary: #445066
```

### Aplicare

- ✅ 100% în UI principale (login, dashboard, cockpit, dosar)
- ✅ 100% în Audit Pack HTML reports (verified azi)
- ✅ 100% în patron magic link page
- ⚠️ 90% în email templates (mai sunt 2-3 emailuri cu Inter peste tot, lipsește Space Grotesk pe headings)

### Severity badges (eyebrows)

```
[GDPR · HIGH]    cobalt + danger tone
[AI ACT · MEDIUM] cobalt + warning tone
[NIS2 · LOW]     cobalt + neutral
```

Toate cu `font-family: var(--font-mono)`, uppercase, letter-spacing 0.18em.

### Cards & elevation

- Border-radius: 16px (cards), 999px (chips), 20px (heroes)
- Shadow: subtle (0 1px 2px rgba(0,0,0,0.04))
- Hover: translateY(-1px) + shadow elevation +1

### Motion

- Ease-out 200ms pentru entering elements
- Ease-in-out 300ms pentru repositioning
- NEVER linear except progress bars

---

## 13. State persistence model

### Per-org state isolation

```
.data/
├── users.json                       (auth + sessions seeds)
├── orgs.json                        (org list)
├── memberships.json                 (user ↔ org)
├── plans-global.json                (per-org plan tier)
├── state-org-{orgId}.json           (per-org cockpit state)
└── analytics.jsonl                  (events log)
```

Per-org state schema (verificat în demo run):

```typescript
interface OrgState {
  // Compliance
  highRisk: number
  lowRisk: number
  gdprProgress: number
  findings: Finding[]
  alerts: Alert[]
  generatedDocuments: GeneratedDocument[]
  aiSystems: AISystem[]
  traceabilityReviews: Record<string, Review>
  
  // Profile
  orgProfile: { companyName, cui, sector, employeeCount, website, ... }
  applicability: { tags: string[], entries: ApplicabilityEntry[] }
  
  // Hibernated (Fiscal OS — feature flag controlled)
  efacturaConnected: boolean
  efacturaValidations: EFacturaValidation[]
  vatRegistered: boolean
  fiscalProtocols: Record<string, any>
  
  // Versioning
  snapshotHistory: Snapshot[]
  driftRecords: DriftRecord[]
  driftSettings: { severityOverrides: ... }
  
  // Events
  events: ComplianceEvent[]
}
```

### Backends

| Backend | Pentru | Status |
|---|---|---|
| File system local (`.data/`) | Dev + sandbox | ✅ default |
| **Supabase Postgres + Storage** | Production | ⚠️ Sprint 2 — partial implemented, needs RLS audit |
| Vercel KV / Redis | Cache layer | ❌ TBD |

**Setting**: `COMPLISCAN_DATA_BACKEND=supabase | files`. Default `files`. La production = `supabase`.

---

## 14. Drift detection & reopen — kernel

### Conceptual

Aplicația trebuie să detecteze automat când contextul unui client se schimbă în moduri care invalidează compliance:

- **Vendor nou detectat** (ex: Apex Logistic instalează Mailchimp) → triggerez GDPR-006 RoPA neactualizat finding
- **Domeniu nou pe website** (ex: subdomain plată adăugat) → trigger GDPR-001 review needed
- **Politica veche** (>12 luni de la ultima actualizare) → trigger refresh
- **DSAR întârziat** (>30 zile fără răspuns) → trigger urgent
- **DPA expirat** (data semnării + retention period) → reopen GDPR-010

### Implementare

```typescript
// lib/server/drift-detector.ts
detectDrift(state: OrgState, config: DriftSettings): DriftRecord[]
```

Generează `DriftRecord[]` cu:
- `id`, `type` (vendor_added | doc_outdated | dsar_overdue | dpa_expired)
- `severity` (high | medium | low)
- `findingIdToReopen` — ID finding care trebuie restaurat la `detected`
- `detectedAtISO`
- `description`

### Reopen flow

1. Cron job rulează `detectDrift(state)` zilnic
2. Pentru fiecare drift critic → automat reopen finding (status `active` → `detected`)
3. Notificare push cabinet (email + dashboard alert)
4. UI cockpit re-deschide cazul cu badge "REDESCHIS din cauza: vendor nou Stripe"

### Status azi

- ✅ Schema `driftRecords` în state — există
- ✅ `driftSettings` per-org — există
- ❌ `detectDrift()` algoritm — NU implementat (Sprint 3)
- ❌ Cron job zilnic — NU configurat
- ❌ UI badge "REDESCHIS" pe cockpit — NU exist

→ Drift detection = **gap critic** pentru DPO-OS mature. Vezi doc 03 + 04.

---

## 15. Anexă — output diagrams

### Cum arată portofoliul (ascii)

```
┌────────────────────────────────────────────────────────────┐
│ DPO Complet SRL · Diana Popescu · CIPP/E #12345            │
│ Plan: Growth · 3/50 clienți · 4 alerte critice              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────┐  ┌─────────────────────┐     │
│  │ Apex Logistic SRL    ⚠️  │  │ Lumen Energy SRL    │     │
│  │ Logistică · 42 ang.      │  │ Energie · 28 ang.   │     │
│  │ Scor: 58% (HIGH)         │  │ Scor: 80% (MEDIUM)  │     │
│  │ • DPA Stripe expirat     │  │ • DSAR — 14z rămase │     │
│  │ • Privacy Policy lipsă   │  │                     │     │
│  │ • RoPA outdated          │  │                     │     │
│  └──────────────────────────┘  └─────────────────────┘     │
│                                                            │
│  ┌──────────────────────────┐                              │
│  │ Cobalt Fintech SRL  🔒   │                              │
│  │ Fintech · 65 ang.        │                              │
│  │ Scor: 80% (MEDIUM)       │                              │
│  │ • DPA payroll review     │                              │
│  │ AI: OFF (review manual)  │                              │
│  └──────────────────────────┘                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Cum arată cockpit-ul (ascii)

```
┌────────────────────────────────────────────────────────────┐
│ Apex Logistic SRL · DPO Complet                            │
│ ───                                                        │
│ [GDPR · HIGH]                                              │
│                                                            │
│ DPA Stripe expirat / nesemnat                              │
│ ───                                                        │
│ Apex folosește Stripe pentru procesare plăți. Nu există    │
│ DPA semnat. Vendor critic, transferă date UE→SUA cu SCC.   │
│                                                            │
│ ⚠️  Impact: Breach Art. 28 GDPR + transfer Art. 46         │
│                                                            │
│ ✅ Acțiune recomandată                                      │
│   1. Generează DPA v4.1 (Apex × Stripe)                    │
│   2. Trimite magic link patron Mihai pentru validare       │
│   3. Urmărește semnare                                     │
│                                                            │
│ ─── AI Suggested Document ───                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ DPA v4.1 — Apex Logistic SRL × Stripe Payments      │  │
│ │ Status: DRAFT — necesită validare consultant DPO    │  │
│ │ [📝 Edit]  [👁  Preview]  [📧 Send to patron]       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ─── Closure Evidence Required ───                          │
│ DPA semnat (PDF) + dată semnare + status active            │
│                                                            │
│ [Atașează dovadă]  [Marchează rezolvat]  [Reopen]          │
└────────────────────────────────────────────────────────────┘
```

### Cum arată patron page (ascii)

```
┌────────────────────────────────────────────────────────────┐
│ [LOGO DPO Complet]                  diana@dpocomplet.ro    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Apex Logistic SRL                                          │
│                                                            │
│ Diana Popescu (DPO Complet) ți-a pregătit un document     │
│ pentru validare:                                          │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ DPA — Apex Logistic SRL × Stripe Payments Europe Ltd │  │
│ │ ─                                                    │  │
│ │ [Document content - 5 pages embedded]                │  │
│ │                                                      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ [✅ Aprob și semnez]   [💬 Trimite comentariu]            │
│ [❌ Respinge cu motivare]                                  │
│                                                            │
│ ─── Pregătit de ───                                        │
│ Diana Popescu                                              │
│ DPO / Privacy Consultant · CIPP/E #12345                   │
│ DPO Complet SRL · diana@dpocomplet.ro · +40 700 000 000    │
│                                                            │
│ Acces valabil până: 29 aprilie 2026, 14:30                 │
└────────────────────────────────────────────────────────────┘
```

---

## 16. Dependențe vizuale între moduri

```
M1 Portofoliu ───click client──→ M2 Workspace
                                   ↓
M2 Workspace ─────click finding──→ M3 Cockpit
                                   ↓ generate doc
M3 Cockpit ──────send to patron──→ M5 Patron view
                                   ↓ approve
M3 Cockpit ←────doc adopted ─────── M5 Patron view
   ↓
M4 Dosar ←──────doc lifecycle update
   ↓
[Audit Pack ZIP] ←──export from Dosar
```

→ M3 (Cockpit) e **inima aplicației**. Toate flow-urile critice converg aici.

---

## 17. Direcții ferme pentru Sprint 0+

Bazat pe demo run + 6 condiții DPO Complet + audit cod (26 apr 2026), cele 5 priorități arhitecturale sunt:

1. **Fix `workspace.label`** să propage `orgName` din session în toate output-urile (5+ locuri)
2. **Reframe disclaimer documente generate** la "Pregătit de {cabinet} — {consultant}, status DRAFT"
3. **Diana branding pe `/shared/[token]`** — card "Pregătit de" cu nume + cert + email + phone
4. **Aprob/Respinge buttons pe magic link** (workaround email pentru reject text în pilot)
5. **Feature flag `module.fiscal.enabled`** — ascunde rute 25-28 + state fields fiscal pentru DPO ICP

Detaliu execuție în `04-compliscan-directie-implementare-2026-04-26.md`.

## 18.5. 5 landing pages — strategy

Fiecare produs are propria landing page la `compliscan.ro/{product}`. Mesaj specific per cumpărător, NU mesaj all-in-one.

### Structură per landing

```
compliscan.ro/                  → Hub principal cu 5 cards (DPO/NIS2/Fiscal/AI/DORA)
compliscan.ro/dpo               → DPO OS (ACTIV Q3 2026)
compliscan.ro/nis2              → NIS2 OS ("Coming soon Q1 2027 + waitlist")
compliscan.ro/fiscal            → Fiscal OS ("Coming soon Q3 2027 + waitlist")
compliscan.ro/ai-act            → AI Act OS ("Coming soon 2028 + waitlist")
compliscan.ro/dora              → DORA OS ("Coming soon 2028 + waitlist")
compliscan.ro/pricing           → Pricing matrix per produs (5 columns)
compliscan.ro/about             → Founder + roadmap + portfolio strategy
```

### Per landing page conținut

Fiecare landing are:
- **Hero specific produsului** (NU "platforma all-in-one")
- **Concurența directă listată** (Privacy Manager pentru /dpo, Sectio Aurea pentru /nis2, etc.)
- **Pricing tier specific produs** (NU pricing combinat)
- **Demo specific use case** (Diana cu 30 clienți pentru /dpo, Mihai cu firmă obligată NIS2 pentru /nis2)
- **Testimonial specific industrie** (DPO Complet pentru /dpo, primărie pentru /nis2 dacă valid)
- **CTA specific**: "Start trial 14 zile" pentru produsul activ, "Join waitlist + early access pricing" pentru cele coming soon

### Hub principal (`compliscan.ro/`)

```
HERO: "5 produse compliance pentru piața RO. 1 cod. 1 brand."

5 CARDS:
[DPO OS]      [NIS2 OS]     [AI Act OS]   [DORA OS]    [Fiscal OS]
ACTIV         Q1 2027       2028          2028         Q3 2027
€49-599       €99-599       €149-499      €499-1.499   €29-199

CARD-uri pentru cele inactive: "Join waitlist + early access pricing".

EXPLAINER: "De ce 5 produse, nu 1 platformă: piața RO are ICP-uri 
specializate. Diana DPO ≠ Mihai CISO ≠ Marius CECCAR. Vindem produsul 
pe care îl folosești, nu un bundle generic."
```

---

## 18. Differentiation arhitecturală vs concurenți (validat empiric)

Concurenții identificați: Privacy Manager (privacymanager.ro), MyDPO (Decalex), Wolters Kluwer GDPR Soft, kitgdpr.ro. Toate au workflows fragmentate cross-tabs.

**Cele 5 alegeri arhitecturale care diferențiază CompliScan**:

1. **Cockpit finding-first** — un finding = o pagină. Concurenții despart documente / DSAR / vendori în tabs diferite. CompliScan strânge tot în cockpit.

2. **Spine canonical strict** — `cabinet → client → cockpit → dosar → audit pack`. Concurenții oferă multe rute paralele care diluează workflow-ul. CompliScan forțează spinul; nu există feature care nu se ancorează.

3. **White-label arhitectural complet** — brand cabinet în patron page, documents, reports, audit pack ZIP, monthly digest, emails. Concurenții au white-label limitat (logo + footer). Pentru cabinet, brand-ul e produs.

4. **Multi-AI provider abstraction cu EU sovereignty default** — Gemini EU primary + Mistral EU optional + fallback template. Concurenții (cei cu AI) sunt mostly single-provider non-EU. CompliScan permite cabinet să aleagă provider per client.

5. **Feature flag modulare per cabinet** (DPO OS / Fiscal OS / Internal Compliance) — concurenții vând module separate. CompliScan are toate în cod, activabile prin flag — onboarding instant la upsell, fără migrație.

**Cele 5 lucruri în care NU suntem unici** (transparență):
- AI document generation (MyDPO are din 2023)
- Portofoliu multi-client (Privacy Manager are)
- GDPR coverage (toate concurenții au)
- Audit Pack export (variante peste tot)
- Magic link patron (Privacy Manager are similar)

**Implicație**: nu vindem AI sau "GDPR software". Vindem **cockpit finding-first cu spine strict + white-label complet + multi-framework RO native + pricing transparent self-serve**.

---

**Document maintainer**: Daniel Vaduva, founder
**Update obligatoriu la**: orice nouă persona / mod / rută adăugată / schimbare design system
**Versiune**: v1.0 (consolidare după demo run + 2 aplicații discovered)
