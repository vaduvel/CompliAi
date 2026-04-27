# 07 — CompliScan: Execution Roadmap tehnic (v5.0 — 27 apr 2026)

**Status**: 🛠️ EXECUTION — traseul tehnic concret de la Sprint 0 până la production launch.
**Complementar Doc 06** (Decision Lock strategic). **Doc 06** = ce facem strategic. **Doc 07** = cum facem tehnic, pas cu pas, cu file paths.

**Audiență**: founder coding zilnic + AI agent care implementează + hire #1 dev.

---

## TL;DR

Acest doc răspunde la întrebarea: **"Pornesc luni dimineață. Ce fac concret?"**

| Sprint | Durată | Output | Status azi |
|---|---|---|---|
| **S0 — Fix bug-uri vizibile** | 5 zile (28 apr → 1 mai) | 6 bug-uri rezolvate, demo refăcut | 0/6 done |
| **S1 — Pilot prerequisites** | 2 săpt (4-16 mai) | Custom templates + reject/comment + AI on/off + signature + onboarding ICP choice | 0/8 done |
| **S2 — Stripe + Mistral + Supabase** | 2 săpt (18-30 mai) | Production billing + EU sovereignty + persistence | 0/4 done |
| **S3 — Drift + landing pages** | 1 săpt (1-7 iun) | Drift cron + 4 landing pages publice + waitlist | 0/3 done |
| **PROD launch** | 1 săpt (15 iun) | compliscan.ro live + first paying customer | 0/1 done |

**Critical path**: S0 → pilot DPO Complet → S1 → Stripe live (S2) → first paying. Total 7 săpt de la azi la production.

---

## SPRINT 0 — Fix 6 bug-uri vizibile (28 apr → 1 mai 2026)

**Obiectiv**: la Joi 1 mai, demo-ul rerulat NU mai are bug-urile descoperite în run-ul de azi. Pachet curat trimis la DPO Complet pre-kickoff.

### Bug 1 — workspace.label propagare cabinet/client name

**File**: `lib/server/org-context.ts` linia 78
**Issue**:
```typescript
workspaceLabel:
  process.env.COMPLISCAN_WORKSPACE_LABEL?.trim() ||
  (process.env.NODE_ENV === "production" ? "Workspace neconfigurat" : "Workspace local"),
```
Fallback-ul "Workspace local" propagă în 5+ locuri (Audit Pack JSON, MANIFEST.md, executive-summary.txt, HTML reports H1).

**Fix**:
```typescript
// lib/server/org-context.ts
workspaceLabel:
  process.env.COMPLISCAN_WORKSPACE_LABEL?.trim() ||
  resolvedOrgName ||  // ← folosește orgName în loc de fallback hardcoded
  (process.env.NODE_ENV === "production" ? "Workspace neconfigurat" : "Workspace local"),
```

Plus la nivelul `lib/server/audit-pack-bundle.ts`:
```typescript
const workspaceLabel = workspaceMode === "client"
  ? clientOrg.name
  : `${cabinetOrg.name} — ${clientOrg.name}` // pentru cabinet view
```

**Verifică**:
```bash
# Re-run demo, check că Audit Pack ZIP nu mai conține "Workspace local"
unzip -p audit-pack-*.zip audit-pack-*/MANIFEST.md | grep -c "Workspace local"
# Expected: 0
```

**Test**: Update `lib/server/audit-pack-bundle.test.ts` să testeze că workspaceLabel = orgName când disponibil.

**ETA**: 4 ore
**Dependencies**: niciuna
**Done când**: re-run demo, ZIP refăcut cu cabinet name în 5+ locuri.

---

### Bug 2 — Disclaimer toxic pe documente generate

**File**: `lib/server/document-generator.ts` linii 291, 310, 332, 351, 373 (5+ ocurențe)
**Issue**: în prompt template injectează:
```
- La final: "⚠️ Acest document a fost generat cu ajutorul AI. Verifică cu un specialist înainte de utilizare oficială."
```

**Fix**: înlocuiește în toate 5 locurile cu reframe profesional:
```typescript
const PROFESSIONAL_FOOTER = `
- La final, secțiune "Document pregătit de:" cu:
  * Cabinet name + consultant name + certification (CIPP/E sau echivalent)
  * Email + phone consultant
  * Status: "DRAFT — necesită validare consultant DPO înainte de publicare"
`
```

Apoi în fiecare DOCUMENT_TYPE prompt, înlocuiește disclaimer-ul vechi cu `PROFESSIONAL_FOOTER`.

**Plus**: adaugă funcție helper:
```typescript
// lib/server/document-generator.ts
function injectCabinetFooter(content: string, cabinet: CabinetBrandConfig): string {
  return content + `\n\n---\n\n**Document pregătit de:** ${cabinet.name} — ${cabinet.consultant.name}, ${cabinet.consultant.title} · ${cabinet.consultant.certification}\n**Status:** DRAFT — necesită validare consultant DPO înainte de publicare\n**Contact:** ${cabinet.consultant.email} · ${cabinet.consultant.phone}`
}
```

**Verifică**: regenerează DPA + Privacy Policy → verifică footer e cabinet, nu disclaimer toxic.

**ETA**: 2 ore
**Dependencies**: niciuna
**Done când**: 4 documente regenerate (Privacy Policy, DPA, Retention, AI Governance) au footer cabinet, NU disclaimer "verifică cu specialist".

---

### Bug 3 — Diana branding card pe `/shared/[token]`

**File**: `app/shared/[token]/page.tsx` (390 linii — patron page existent dar fără signature card complet)
**Issue**: patron page conține "Apex Logistic SRL" (h1 ✅), "DPO Complet" 1× footer (✅), dar 0 mențiuni "Diana Popescu" + 0 cert + 0 phone.

**Fix**:
1. Citește `brand-config.json` din `lib/server/white-label.ts`:
```typescript
const brandConfig = await getCabinetBrandConfig(orgId)
```

2. Adăugă component `<ConsultantCard>` în page.tsx (după documentul principal, înainte de footer):
```tsx
// components/compliscan/consultant-card.tsx (nou)
export function ConsultantCard({ brand }: { brand: CabinetBrandConfig }) {
  return (
    <section className="rounded-2xl border bg-eos-surface-secondary p-6 mt-8">
      <div className="flex items-start gap-4">
        <img src={brand.logoUrl} alt={brand.cabinetName} className="h-16 w-16" />
        <div>
          <p className="text-xs uppercase tracking-wider text-eos-text-secondary">Pregătit de</p>
          <h3 className="font-display text-lg font-semibold mt-1">{brand.consultant.name}</h3>
          <p className="text-sm text-eos-text-secondary">{brand.consultant.title} · {brand.consultant.certification}</p>
          <p className="text-sm mt-2">{brand.cabinetName}</p>
          <p className="text-xs text-eos-text-secondary mt-1">
            {brand.consultant.email} · {brand.consultant.phone}
          </p>
        </div>
      </div>
    </section>
  )
}
```

3. Adăugă în `app/shared/[token]/page.tsx`:
```tsx
import { ConsultantCard } from "@/components/compliscan/consultant-card"
// ...
<ConsultantCard brand={brandConfig} />
```

**Verifică**:
```bash
curl -s http://localhost:3010/shared/$TOKEN | grep -c "Diana Popescu"
# Expected: ≥1
curl -s http://localhost:3010/shared/$TOKEN | grep -c "CIPP/E"
# Expected: ≥1
```

**ETA**: 6 ore (UI design + integrare + brand-config storage update)
**Dependencies**: Bug 1 (workspace context)
**Done când**: patron page conține Diana name + cert + email + phone + logo cabinet.

---

### Bug 4 — Aprob button pe `/shared/[token]` (Sprint 0 minimum, Sprint 1 complet)

**File nou**: `app/shared/[token]/approve/route.ts`
**Issue**: patron page e read-only momentan. 0 ocurențe "Aprob" în 92KB HTML.

**Fix Sprint 0** (minimum viable — doar Aprob, NU Respinge/Comentariu):

1. Endpoint nou:
```typescript
// app/api/shared/[token]/approve/route.ts (nou)
export async function POST(request: Request, { params }: { params: { token: string } }) {
  const resolved = resolveSignedShareToken(params.token)
  if (!resolved) return jsonError("Token invalid", 401)
  if (new Date(resolved.expiresAtISO) < new Date()) return jsonError("Token expirat", 410)
  
  // Update document adoption stage la "signed"
  await mutateStateForOrg(resolved.orgId, (state) => {
    const docId = resolved.documentId
    state.generatedDocuments = state.generatedDocuments.map(doc =>
      doc.id === docId
        ? { ...doc, adoptionStatus: "signed", signedAtISO: new Date().toISOString(), signedByPatron: true }
        : doc
    )
  })
  
  // Log event
  await appendComplianceEvents(resolved.orgId, [
    createComplianceEvent("document_signed_via_magic_link", { documentId: resolved.documentId, signedAt: new Date().toISOString() })
  ])
  
  // Email cabinet
  await sendEmail({
    to: brandConfig.consultant.email,
    subject: `Document semnat de patron — ${clientName}`,
    body: `Patronul a aprobat documentul. Vezi în CompliScan.`,
  })
  
  return jsonOk({ approved: true, signedAtISO: new Date().toISOString() })
}
```

2. UI button în `app/shared/[token]/page.tsx`:
```tsx
{!isSigned && (
  <form method="POST" action={`/api/shared/${token}/approve`}>
    <button type="submit" className="primary-button">
      ✅ Aprob și semnez
    </button>
  </form>
)}
{isSigned && (
  <div className="rounded-md bg-eos-status-success-bg p-4">
    Document aprobat la {formatDate(signedAtISO)}
  </div>
)}
```

**Verifică**:
```bash
curl -X POST http://localhost:3010/api/shared/$TOKEN/approve -i
# Expected: HTTP 200 + { approved: true, signedAtISO: "..." }
```

Apoi în UI cabinet, document apare cu adoption status "signed".

**ETA Sprint 0**: 6 ore (doar Aprob, fără Respinge/Comentariu)
**ETA Sprint 1 complet**: +12 ore (Respinge cu mandatory comment + Trimite comentariu separat + UI cabinet pentru pending approvals)
**Dependencies**: Bug 3 (consultant card)
**Done când**: Aprob button click → POST endpoint → document `signed` + email cabinet.

---

### Bug 5 — SHA-256 hash chain în `bundle-manifest.json`

**File**: `lib/server/audit-pack-bundle.ts`
**Issue**: `bundle-manifest.json` conține metadata bundle dar **NU conține SHA-256 per fișier**.

**Fix**:
1. La generation bundle:
```typescript
// lib/server/audit-pack-bundle.ts
import { createHash } from "node:crypto"

async function computeFileHashes(bundleDir: string): Promise<Record<string, FileHashEntry>> {
  const hashes: Record<string, FileHashEntry> = {}
  const files = await walkDir(bundleDir)
  
  for (const file of files) {
    const relativePath = path.relative(bundleDir, file)
    const content = await fs.readFile(file)
    const sha256 = createHash("sha256").update(content).digest("hex")
    hashes[relativePath] = {
      sha256,
      size: content.length,
      modifiedAt: (await fs.stat(file)).mtime.toISOString(),
    }
  }
  
  return hashes
}

// În build():
const fileHashes = await computeFileHashes(bundleDir)
const bundleManifest = {
  generatedAt,
  workspace: { id, name, label, owner },
  bundleEvidenceSummary,
  includedEvidence,
  files: fileHashes,  // ← NEW
  hashAlgorithm: "sha256",
  manifestVersion: "1.1",
}
```

2. În MANIFEST.md adaugă tabelă:
```typescript
const manifestMd = `
# Dosar de Control — ${cabinetName}

...

## Hash chain integrity (SHA-256)

| Fișier | SHA-256 | Size |
|---|---|---|
${Object.entries(fileHashes).map(([path, hash]) => 
  `| \`${path}\` | \`${hash.sha256.slice(0, 16)}...\` | ${hash.size}B |`
).join("\n")}

> Pentru verificare integritate: rulează \`sha256sum [file]\` pe fiecare fișier și compară cu acest tabel.
`
```

**Verifică**:
```bash
# Unzip + verify hash manual
unzip -d test/ audit-pack-*.zip
cd test/audit-pack-*/
sha256sum data/audit-pack-v2-1.json
# Compară cu hash-ul din MANIFEST.md
```

**ETA**: 4 ore
**Dependencies**: Bug 1 (workspace.label fix pentru să nu apară "Workspace local" în MANIFEST)
**Done când**: bundle-manifest.json conține SHA-256 per fișier + MANIFEST.md afișează tabel hash.

---

### Bug 6 — Audit Pack PDF Helvetica.afm crash

**File**: `lib/server/pdf-generator.ts` (există patch parțial, dar pare să crash încă)
**Issue**: `GET /api/exports/audit-pack/pdf` returnează 500 cu:
```
ENOENT: no such file or directory, open '.../.next/server/vendor-chunks/data/Helvetica.afm'
```

**Diagnoza**: `pdf-generator.ts` are `patchPdfkitDataLookup()` care redirect către `node_modules/pdfkit/js/data/`. Dar pare că în production build, fișierele afm NU sunt copiate.

**Fix opțiunea A** (quick — copiez fișierele afm la build):
```javascript
// next.config.js
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/exports/audit-pack/pdf': [
      './node_modules/pdfkit/js/data/**/*.afm',
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'pdfkit']
    return config
  }
}
```

**Fix opțiunea B** (clean — swap la @react-pdf/renderer):
```bash
npm uninstall pdfkit @types/pdfkit
npm install @react-pdf/renderer
```

Apoi rescriere `lib/server/pdf-generator.ts` cu @react-pdf API. ~1 zi work.

**Recomandare**: opțiunea A pentru Sprint 0 (4 ore), opțiunea B în Sprint 2 dacă A se dovedește instabil.

**Verifică**:
```bash
curl -o /tmp/test.pdf -w "HTTP=%{http_code} size=%{size_download}\n" \
  http://localhost:3010/api/exports/audit-pack/pdf -b cookies.txt
# Expected: HTTP=200 size>10000
file /tmp/test.pdf
# Expected: PDF document, version 1.x
```

**ETA**: 4 ore (opțiunea A) sau 1 zi (opțiunea B)
**Dependencies**: niciuna
**Done când**: PDF endpoint returnează valid PDF, deschide în Preview/Adobe Reader.

---

### Sprint 0 Critical Path

```
Bug 1 (workspace.label)      ──┐
                                ├──→ Bug 5 (SHA-256 manifest)
                                │
Bug 2 (disclaimer)             ─┤
                                │
Bug 3 (Diana branding) ──→ Bug 4 (Aprob button)
                                │
Bug 6 (PDF font) (independent) ─┘
```

**Order optim**:
- **Luni 28 apr**: Bug 1 + Bug 2 (paralel, ambele 4h)
- **Marți 29 apr**: Bug 3 (6h)
- **Miercuri 30 apr**: Bug 4 (6h, dependent Bug 3) + Bug 5 (4h, dependent Bug 1)
- **Joi 1 mai**: Bug 6 (4h) + re-run demo + ZIP package (4h)
- **Vineri 2 mai**: email DPO Complet pre-pilot question

### Sprint 0 Done When

- [ ] Bug 1: re-run demo, Audit Pack ZIP fără "Workspace local"
- [ ] Bug 2: 4 documente generate cu cabinet footer, NU disclaimer toxic
- [ ] Bug 3: patron page cu consultant card complet (Diana + cert + email + phone)
- [ ] Bug 4: Aprob button funcțional, document → signed status
- [ ] Bug 5: bundle-manifest.json cu SHA-256 + MANIFEST.md hash table
- [ ] Bug 6: PDF endpoint returnează 200 + valid PDF
- [ ] Demo refăcut, output capturat în `/Users/.../Downloads/compliscan-demo-result-v2/`
- [ ] Pachet ZIP nou trimis pre-kickoff la DPO Complet

---

## SPRINT 1 — Pilot prerequisites (4 → 16 mai 2026)

**Obiectiv**: cabinet DPO Complet poate face TOT pilot 30 zile **fără workaround-uri founder**, exclusiv prin UI și API standard.

### S1.1 — Custom templates upload UI (3 zile)

**File-uri noi**:
- `app/dashboard/cabinet/templates/page.tsx` — UI listă + upload
- `app/api/cabinet/templates/route.ts` — POST upload, GET list
- `app/api/cabinet/templates/[id]/route.ts` — DELETE + GET single
- `lib/server/cabinet-templates-store.ts` — storage adapter
- `components/compliscan/template-upload-dropzone.tsx` — drag-drop UI

**Schema**:
```typescript
type CabinetTemplate = {
  id: string
  cabinetOrgId: string
  documentType: DocumentType  // privacy-policy, dpa, ropa, dsar-procedure, etc.
  name: string
  uploadedAtISO: string
  fileBuffer: Buffer (Markdown content)
  active: boolean
  variables: string[]  // {{COMPANY_NAME}}, {{CUI}}, etc. extrase auto
}
```

**Workflow**:
1. Cabinet upload `.md` sau `.docx` (cu `mammoth` pentru .docx → .md)
2. System auto-extract variables `{{*}}`
3. Cabinet click "Activate" → marked active per documentType
4. La document generation, system check: cabinet are template active pentru tipul X? Da → folosește template cabinet. Nu → folosește template default CompliScan.

**Done când**: cabinet upload Privacy Policy template → folosește în cockpit GDPR-001 → output cu brand cabinet, NU template default.

### S1.2 — Reject/comment flow complet pe magic link (1.5 zile)

**Extensie Bug 4 din Sprint 0**:

Endpoint-uri noi:
- `POST /api/shared/[token]/reject` — cu mandatory `comment` field
- `POST /api/shared/[token]/comment` — feedback fără reject

UI patron page:
```tsx
{!isSigned && !isRejected && (
  <div className="space-y-3">
    <button onClick={approve}>✅ Aprob și semnez</button>
    <button onClick={openRejectModal}>❌ Respinge cu motivare</button>
    <button onClick={openCommentModal}>💬 Trimite comentariu</button>
  </div>
)}
```

UI cabinet — pending approvals dashboard:
- `/dashboard/cabinet/pending-approvals` — listă magic links + status (sent / approved / rejected / commented)

**Done când**: patron poate respinge cu comment → cabinet primește notificare + dashboard alert.

### S1.3 — AI ON/OFF toggle per client (4 ore)

**File-uri**:
- `app/dashboard/[client]/setari/page.tsx` — adaugă toggle
- `lib/server/document-generator.ts` — check `client.aiEnabled`

```typescript
// În document-generator.ts
async function generateDocument(input: DocumentGenerationInput): Promise<GeneratedDocument> {
  const clientConfig = await getClientConfig(input.orgId)
  
  if (clientConfig.aiEnabled === false) {
    // Skip AI call, return template-only
    return generateFromTemplateOnly(input, cabinetTemplates)
  }
  
  // Normal AI flow
  return generateWithGemini(input)
}
```

**Done când**: client cu `aiEnabled: false` → document generator returnează template-only (NU call la Gemini).

### S1.4 — Feature flag fiscal hide (1.5 zile)

**File-uri noi**:
- `lib/shared/cabinet-modules.ts` — types ProductModules
- `lib/server/cabinet-config.ts` — getEnabledProducts/setEnabledProducts
- `.data/cabinet-modules-{orgId}.json` — storage

**Update**:
- `components/compliscan/dashboard-shell.tsx` — sidebar conditional render per module
- `lib/server/findings-detector.ts` — check modules per finding type

**Done când**: cabinet DPO mode → 0 fiscal routes vizibile + 0 fiscal findings detected.

### S1.5 — Signature upload în brand setup (1 zi)

**File**:
- `lib/server/white-label.ts` — adaugă `signatureUrl` field
- `app/dashboard/cabinet/branding/page.tsx` — upload signature image
- `components/compliscan/consultant-card.tsx` — show signature image dacă există

### S1.6 — ICP segment choice onboarding (2 zile)

**File-uri noi**:
- `app/onboarding/segment-choice/page.tsx` — primul ecran post-register
- `app/api/onboarding/select-segment/route.ts` — POST selection
- `lib/server/icp-segment-config.ts` — apply config per segment

**Schema** (din Doc 02):
```typescript
type IcpSegment = "solo" | "imm-internal" | "cabinet" | "fiscal" | "enterprise"

// La selection:
async function applySegmentConfig(orgId: string, segment: IcpSegment) {
  const config = SEGMENT_DEFAULTS[segment]
  await setEnabledProducts(orgId, config.enabledFrameworks)
  await setNavConfig(orgId, config.navConfig)
  await setDefaultDashboard(orgId, config.defaultDashboard)
  await setMultiTenant(orgId, config.multiTenant)
  await setWhiteLabel(orgId, config.whiteLabel)
}
```

**Done când**: cabinet new face register → primul ecran "Care produs?" cu 5 cards → click "Cabinet" → activează modules GDPR + NIS2 + AI Act + multi-tenant + white-label.

### S1.7 — UI cabinet pentru pending approvals + comments primite (1 zi)

Vezi S1.2 — adăugat aici pentru tracking.

### S1.8 — Email notifications cabinet on patron action (4 ore)

**File**:
- `lib/server/email-notifications.ts` — abstraction (Resend wrapper)
- Integrare în S1.2 endpoints (approve/reject/comment)

**Done când**: patron approve → cabinet primește email + dashboard alert.

### Sprint 1 Total: ~14 zile lucru

Dacă încape în 10 zile lucru (2 săpt) → ok. Dacă nu:
- **Tăiem S1.5 (signature upload)** — workaround: founder upload manual prin DB
- **Tăiem S1.7 (UI pending approvals separat)** — workaround: cabinet vede în dashboard general

### Sprint 1 Done When

- [ ] Custom templates UI funcțional (cabinet upload → folosit în cockpit)
- [ ] Reject/comment flow complet pe magic link
- [ ] AI ON/OFF toggle per client
- [ ] Feature flag fiscal hide pentru DPO mode
- [ ] Signature upload în brand setup
- [ ] ICP segment choice onboarding pentru cabinete noi
- [ ] Email notifications cabinet on patron action
- [ ] Pilot DPO Complet started Joi 7 mai cu produs Sprint 1 ready

---

## SPRINT 2 — Stripe + Mistral + Supabase (18 → 30 mai 2026)

**Obiectiv**: produs care suportă primii clienți plătitori reali. Stripe live. Mistral EU optional. Supabase production.

### S2.1 — Stripe Checkout integration (2 zile)

**File-uri noi**:
- `app/api/stripe/checkout-session/route.ts` — POST create checkout
- `app/api/stripe/webhook/route.ts` — POST webhook handler
- `lib/server/stripe-client.ts` — Stripe SDK wrapper
- `app/dashboard/cabinet/billing/page.tsx` — UI billing

**Plan tier mapping** (din Doc 01 sec 6):
```typescript
const STRIPE_PRICE_IDS = {
  // DPO OS (cabinet segment)
  "cabinet-solo": "price_xxx_499eur_month",
  "cabinet-pro": "price_xxx_999eur_month",
  "cabinet-studio": "price_xxx_1999eur_month",
  // ... 16 SKU total
}
```

**Workflow**:
1. Cabinet click "Upgrade Pro" → POST `/api/stripe/checkout-session` cu tier
2. Stripe Checkout URL returnat → redirect
3. Plată → Stripe webhook `/api/stripe/webhook` → update `plans-global.json`
4. Cabinet refresh → vede tier nou activ + features unlocked

**Done când**: cabinet cu plan free → upgrade Pro €999 prin Stripe Checkout → plan auto-update.

### S2.2 — Mistral EU sovereignty option (1 zi)

**File-uri**:
- `lib/server/ai-provider.ts` — abstract provider
- `lib/server/ai-providers/gemini.ts` — Gemini implementation
- `lib/server/ai-providers/mistral.ts` — Mistral Large 2 EU implementation
- `lib/server/document-generator.ts` — use abstract provider

```typescript
// lib/server/ai-provider.ts
interface AIProvider {
  generateDocument(input: GenerationInput): Promise<GeneratedContent>
}

export async function getProviderForOrg(orgId: string): Promise<AIProvider> {
  const config = await getOrgConfig(orgId)
  if (config.aiProvider === "mistral" && hasFeature(config.tier, "mistral_eu")) {
    return new MistralProvider(process.env.MISTRAL_API_KEY)
  }
  return new GeminiProvider(process.env.GEMINI_API_KEY)
}
```

**Tier gating**:
- Solo + Cabinet: Gemini only
- Pro + Studio: Mistral toggle disponibil

**Done când**: cabinet Pro can switch Mistral în settings → next document generation folosește Mistral.

### S2.3 — Supabase migration cutover (2-3 zile)

**Pași**:
1. Setup Supabase Postgres + RLS policies (1 zi)
2. Migration scripts pentru `users`, `orgs`, `memberships`, `plans-global`, `state-org-*` → Supabase tables
3. Dual-write 1 săpt (file system + Supabase paralel)
4. Verify identical behavior pe staging
5. Cutover: setează `COMPLISCAN_DATA_BACKEND=supabase`
6. Monitoring 48h post-cutover

**Done când**: production folosește Supabase, file-system rămâne doar pentru dev local.

### S2.4 — Monthly digest email cron (4 ore)

**File-uri**:
- `app/api/cron/monthly-digest/route.ts` — cron handler
- Vercel Cron config: `vercel.json` cu `"crons": [{ "path": "/api/cron/monthly-digest", "schedule": "0 9 1 * *" }]`

**Workflow**: prima zi a lunii la 09:00, pentru fiecare cabinet activ, trimite email cu rezumat:
- Findings închise luna trecută
- Documente trimise
- Magic links semnate
- Riscuri rămase

**Done când**: 1 iunie 2026, DPO Complet primește digest email automat.

### Sprint 2 Done When

- [ ] Stripe Checkout live + webhook + plan auto-update
- [ ] Mistral EU optional pentru tier Pro+
- [ ] Supabase production cutover complet
- [ ] Monthly digest cron funcțional
- [ ] First paying customer (DPO Complet?) prin Stripe

---

## SPRINT 3 — Drift + Landing pages (1 → 7 iunie 2026)

**Obiectiv**: drift detection automat + 4 landing pages publice.

### S3.1 — Drift cron daily (1 zi)

**File-uri**:
- `app/api/cron/drift-detection/route.ts` — cron daily
- Vercel Cron: `"schedule": "0 6 * * *"` (zilnic 06:00)

**Workflow**: pentru fiecare cabinet activ, rulează `detectDrift(state)` (deja existent în `lib/server/compliance-drift.ts` — verificat 90% maturity). Pentru fiecare drift critic, reopen finding + trimite email + dashboard alert.

**Done când**: dimineața următoare, cabinet primește alert "3 cazuri redeschise pentru clientul Apex Logistic".

### S3.2 — 4 landing pages public (3 zile)

**File-uri noi**:
- `app/(marketing)/page.tsx` — hub principal `compliscan.ro/`
- `app/(marketing)/dpo/page.tsx` — DPO segment
- `app/(marketing)/imm/page.tsx` — IMM Internal segment (Coming soon Q2 2027)
- `app/(marketing)/cabinet/page.tsx` — Cabinet segment (active)
- `app/(marketing)/fiscal/page.tsx` — Fiscal segment (Coming soon Q1 2027)
- `app/(marketing)/pricing/page.tsx` — pricing matrix 16 SKU

**Conținut per landing** (din Doc 06 sec 3):
- Hero specific ICP (Photoshop analogy hub, mesaj specific per segment)
- Pricing tier-uri specifice
- Demo specific use case
- CTA "Start trial 14 zile" sau "Join waitlist"

**Done când**: compliscan.ro live cu 5 landing pages, primul (cabinet) activ.

### S3.3 — Waitlist signup pentru segmente coming soon (4 ore)

**File-uri**:
- `app/api/waitlist/route.ts` — POST email capture
- `lib/server/waitlist-store.ts` — storage

**Done când**: pe `/imm` `/fiscal` userul intră email → primește confirmare + adăugat în waitlist pentru launch announcement.

### Sprint 3 Done When

- [ ] Drift cron daily + alerts cabinet
- [ ] 4 landing pages public live
- [ ] Waitlist signup pentru 3 segmente coming soon
- [ ] DPO Complet pilot retro 5 iunie completed

---

## PRODUCTION LAUNCH — 15 iunie 2026

**Obiectiv**: compliscan.ro live cu first paying customer + marketing landing complet.

### Pre-launch checklist

- [ ] Toate Sprint 0-3 done
- [ ] DPO Complet semnează subscription (5 iunie retro)
- [ ] Testimonial video DPO Complet 2-min înregistrat
- [ ] LinkedIn case study post pregătit
- [ ] DNS compliscan.ro setup + SSL via Vercel
- [ ] Email infrastructure (Resend) live
- [ ] Stripe production keys validate
- [ ] Sentry monitoring + alerts setup
- [ ] Analytics tracking (privacy-friendly)
- [ ] Backup + restore tested pe Supabase

### Launch day (15 iunie)

- 09:00 — DNS final cutover compliscan.ro → Vercel production
- 10:00 — LinkedIn post founder + case study DPO Complet
- 11:00 — Email outreach #1 către 30-50 cabinete RO (DPO Word/Excel target)
- 14:00 — Monitor Sentry + analytics primul flux
- 18:00 — Recap + ajustări

### Post-launch monitoring (16-30 iunie)

- Daily: Sentry errors review + customer support response <24h
- Săptămânal: outreach progress + conversion funnel
- 30 iunie: 5+ piloturi noi în pipeline?

---

## CRITICAL PATH GLOBAL

```
S0 (5 zile) ──→ Pilot DPO Complet (4 săpt) ──→ Decision Gate #1 (5 iun)
                                                 ↓ semnează
                                              S1 (paralel cu pilot)
                                                 ↓
                                              S2 (paralel)
                                                 ↓
                                              S3 (1 săpt post-pilot)
                                                 ↓
                                              PROD LAUNCH 15 iunie
                                                 ↓
                                              Outreach Faza 1 #1 (iulie)
                                                 ↓
                                              Decision Gate #2 (30 aug)
```

**Risk mitigations**:
- S0 nu e gata Joi 1 mai → reschedule pilot DPO Complet la Marți 12 mai (extra 5 zile)
- Bug 6 PDF font intractable → swap la @react-pdf/renderer (1 zi extra)
- Pilot DPO Complet refuză 5 iun → pivot la Decision Gate #1 fallback (NIS2 sector public sau exit)
- Stripe integration eșuează → manual invoice from founder account (workaround Sprint 2)

---

## DAILY EXECUTION CHECKLIST (folosit ZILNIC)

Dimineața (09:00):
- [ ] Citește Doc 06 dacă ai impuls să schimbi ceva
- [ ] Verifică următorul task din Doc 07 critical path
- [ ] Slack DPO Complet check-in 5 min (în pilot)
- [ ] Email response <24h verificat

Implementare (09:30 — 17:00):
- [ ] Task atomic complet (NU jumătate)
- [ ] Test scris pentru task
- [ ] Commit cu mesaj descriptiv
- [ ] Push la origin/v3-unified

Seara (17:30):
- [ ] Status raport self (1 task done? 1 blocker? 1 next)
- [ ] Update Doc 07 cu `[x]` la done items
- [ ] Plan dimineața următoare (1 task next)

---

## REGULI EXECUTION

1. **NU începe Sprint 1 înainte de Sprint 0 done**. Critical path strict.
2. **NU sari peste teste** chiar dacă "merge mâna". Vitest run obligatoriu pre-commit.
3. **NU schimba arhitectura** fără citire Doc 02 + Doc 06. Lock-ul e real.
4. **NU rescrie cod working** ca să fie "mai elegant". Polish doar la production launch.
5. **NU adăuga features noi** care nu sunt în Doc 07 fără update Doc 06 + decision gate.
6. **DA commit zilnic** chiar dacă incremental. Push origin.
7. **DA test deploy preview** după fiecare bug fix major (Vercel preview URL).

---

## ANEXĂ — Stack tehnic locked

| Layer | Tehnologie | De ce |
|---|---|---|
| Frontend | Next.js 15 App Router | SSR, edge runtime, PMF cu Vercel |
| Styling | Tailwind CSS + V3 design system | Tokens-driven, dark mode, fast dev |
| Auth | Custom HMAC-SHA256 sessions | NU NextAuth/Auth0/Clerk |
| DB | Supabase Postgres + Storage | RLS, RT, EU region |
| AI primary | Gemini 2.5 Flash Lite Vertex AI EU | Cost effective, EU sovereign |
| AI optional | Mistral Large 2 EU (Growth+) | Pure EU sovereignty |
| Billing | Stripe Checkout + webhooks | Standard SaaS billing |
| Hosting | Vercel | Next.js optimized, EU regions |
| Monitoring | Sentry | Error tracking |
| Email | Resend | Transactional EU-friendly |
| PDF | pdfkit (patched) sau @react-pdf/renderer (Sprint 2 dacă needed) | TBD post Bug 6 fix |

---

## REGULĂ FINALĂ

**Doc 07 e roadmap-ul tehnic. Doc 06 e lock-ul strategic. Citește-le ÎMPREUNĂ înainte de orice decision execution.**

Dacă există conflict între Doc 06 (strategic) și Doc 07 (tehnic), **Doc 06 câștigă**. Doc 07 se updatează cu `[x]` la done items, NU cu schimbări de scope.

---

🛠️ **EXECUTION ROADMAP LOCK 27 APR 2026**

**Document maintainer**: Daniel Vaduva, founder
**Status**: 🛠️ EXECUTION — citește zilnic înainte de coding
**Versiune**: v5.0 — Execution Roadmap (27 apr 2026)
**Update obligatoriu**: la fiecare task done `[x]` + la fiecare decision gate
**Vezi și**: Doc 06 (Decision Lock) pentru contextul strategic
