# CompliAI — Implementation Specs (Companion to Build Control Canon)

**Versiune:** 1.0
**Data:** 1 aprilie 2026
**Rol:** Specificații concrete de implementare pentru secțiunile 12.1–12.7 din Build Control Canon.
**Regulă:** Acest document nu contrazice Canon-ul. Dacă există conflict, Canon-ul câștigă.

---

## Notă de arhitectură

### Ce avem azi
- `ComplianceState` — un obiect JSONB mare (~50 câmpuri) persistat în `public.org_state` (Supabase) + `.data/state-{orgId}.json` (disk fallback)
- `mvp-store.ts` — `readState()` / `writeState()` / `mutateState()` cu cache in-memory
- Supabase schema existentă: `organizations`, `profiles`, `memberships`, `org_state`, `evidence_objects`, `plans`, `notifications_state`, `nis2_state`, `agent_runs`, `vendor_reviews`
- Finding-kernel cu `CockpitRecipe`, `CloseGatingRequirements`, `ResolutionMode`
- Generator drawer cu `sourceFindingId` linking
- 10 cron-uri în `vercel.json`

### Decizia strategică
**Nu migrăm ComplianceState la tabele normalizate.** Ar fi o rescriere de luni.

În schimb:
1. **Asigurăm** că Supabase funcționează fiabil ca primary backend
2. **Creăm tabele noi** doar pentru concepte noi: `pending_actions`, `review_cycles`, `user_autonomy_settings`
3. **Extindem** ComplianceState cu câmpuri noi acolo unde e natural (ex: `findingStatus` deja există)

---

# 12.1 Persistență reală

## Starea curentă
- `COMPLISCAN_DATA_BACKEND=supabase` funcționează dar nu e setat pe Vercel production
- Disk writes fail silently pe Vercel (EROFS)
- In-memory cache funcționează per-instance dar se pierde la cold start

## Ce construim

### 12.1.1 Activare Supabase ca primary pe producție

**Env vars necesare pe Vercel:**
```
COMPLISCAN_DATA_BACKEND=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 12.1.2 Schema SQL nouă

```sql
-- Approval Queue (concept nou — nu există azi)
CREATE TABLE public.pending_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizations(id),
  user_id uuid REFERENCES public.profiles(id),
  action_type text NOT NULL,
  -- action_type enum: 'repair_efactura', 'generate_document', 'resolve_finding',
  --   'batch_action', 'submit_anaf', 'vendor_merge', 'auto_remediation',
  --   'classify_ai_system', 'publish_trust_center'
  risk_level text NOT NULL DEFAULT 'medium',
  -- risk_level: 'low', 'medium', 'high', 'critical'
  status text NOT NULL DEFAULT 'pending',
  -- status: 'pending', 'approved', 'rejected', 'expired', 'auto_executed'
  original_data jsonb,
  proposed_data jsonb,
  diff_summary text,
  explanation text,
  source_finding_id text,
  source_document_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id),
  decided_by_email text,
  decision_note text,
  executed_at timestamptz,
  execution_result jsonb,
  audit_trail jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX idx_pending_actions_org ON public.pending_actions(org_id);
CREATE INDEX idx_pending_actions_status ON public.pending_actions(status) WHERE status = 'pending';
CREATE INDEX idx_pending_actions_expires ON public.pending_actions(expires_at) WHERE status = 'pending';

-- Review Cycles (concept nou — nu există azi)
CREATE TABLE public.review_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizations(id),
  finding_id text NOT NULL,
  finding_type_id text,
  review_type text NOT NULL DEFAULT 'scheduled',
  -- review_type: 'scheduled', 'drift_triggered', 'expiry_triggered', 'manual'
  status text NOT NULL DEFAULT 'upcoming',
  -- status: 'upcoming', 'due', 'overdue', 'completed', 'skipped'
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id),
  outcome text,
  -- outcome: 'confirmed_ok', 'needs_update', 'reopened'
  reopened_finding_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_cycles_org ON public.review_cycles(org_id);
CREATE INDEX idx_review_cycles_due ON public.review_cycles(status, scheduled_at)
  WHERE status IN ('upcoming', 'due', 'overdue');

-- User Autonomy Settings (concept nou)
CREATE TABLE public.user_autonomy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  org_id text NOT NULL REFERENCES public.organizations(id),
  low_risk_policy text NOT NULL DEFAULT 'auto',
  -- 'auto': execute fără aprobare, notificare informativă
  -- 'semi': creează pending_action, auto-approve după 24h dacă nu e rejectat
  -- 'manual': creează pending_action, așteaptă aprobare explicită
  medium_risk_policy text NOT NULL DEFAULT 'semi',
  high_risk_policy text NOT NULL DEFAULT 'manual',
  critical_risk_policy text NOT NULL DEFAULT 'manual',
  -- Category overrides (JSON, opțional)
  category_overrides jsonb DEFAULT '{}'::jsonb,
  -- ex: { "efactura_repair": "auto", "vendor_merge": "manual" }
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- Scheduled Reports (concept nou)
CREATE TABLE public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizations(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  report_type text NOT NULL,
  -- 'compliance_summary', 'audit_pack', 'partner_portfolio', 'fiscal_status'
  frequency text NOT NULL,
  -- 'weekly', 'monthly', 'quarterly'
  client_org_ids text[] DEFAULT '{}',
  -- pentru partner: lista de org_id-uri incluse
  recipient_emails text[] DEFAULT '{}',
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  last_run_status text,
  -- 'success', 'failed', 'pending_approval'
  requires_approval boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_reports_next ON public.scheduled_reports(next_run_at)
  WHERE enabled = true;
```

### 12.1.3 RLS Policies

```sql
-- pending_actions: user sees own org's actions
ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_access" ON public.pending_actions
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Same pattern for review_cycles, scheduled_reports
-- user_autonomy_settings: user sees own settings
ALTER TABLE public.user_autonomy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_settings" ON public.user_autonomy_settings
  FOR ALL USING (user_id = auth.uid());
```

## Dependențe
- Necesită credențiale Supabase configurate pe Vercel
- Nu blochează restul P0 (Approval Queue folosește tabelele noi)

## DONE means
- [ ] `COMPLISCAN_DATA_BACKEND=supabase` activ pe Vercel prod
- [ ] Tabelele `pending_actions`, `review_cycles`, `user_autonomy_settings`, `scheduled_reports` create
- [ ] RLS policies active
- [ ] `readState()` / `writeState()` funcționează reliable pe prod (0 data loss)
- [ ] Cold start pe Vercel încarcă state corect din Supabase

---

# 12.2 Approval Queue reală

## Starea curentă
- AI systems au `approvalStatus: "pending" | "approved" | "rejected"` — inline
- Documents au `approvalStatus: "draft" | "approved_as_evidence"` — inline
- NU există o coadă centralizată, UI unificată, sau politici de aprobare

## Ce construim

### 12.2.1 Lib — approval engine

**Fișier nou:** `lib/server/approval-queue.ts`

```typescript
// Core types
export type PendingActionType =
  | "repair_efactura"
  | "generate_document"
  | "resolve_finding"
  | "batch_action"
  | "submit_anaf"
  | "vendor_merge"
  | "auto_remediation"
  | "classify_ai_system"
  | "publish_trust_center"

export type PendingActionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "auto_executed"

export type RiskLevel = "low" | "medium" | "high" | "critical"

export type PendingAction = {
  id: string
  orgId: string
  userId: string | null
  actionType: PendingActionType
  riskLevel: RiskLevel
  status: PendingActionStatus
  originalData: Record<string, unknown> | null
  proposedData: Record<string, unknown> | null
  diffSummary: string | null
  explanation: string | null
  sourceFindingId: string | null
  sourceDocumentId: string | null
  createdAt: string
  expiresAt: string | null
  decidedAt: string | null
  decidedBy: string | null
  decidedByEmail: string | null
  decisionNote: string | null
  executedAt: string | null
  executionResult: Record<string, unknown> | null
}

// Core functions
export async function createPendingAction(params: {
  orgId: string
  actionType: PendingActionType
  riskLevel: RiskLevel
  originalData?: Record<string, unknown>
  proposedData?: Record<string, unknown>
  explanation?: string
  sourceFindingId?: string
  expiresInHours?: number
}): Promise<PendingAction>

export async function listPendingActions(orgId: string, filters?: {
  status?: PendingActionStatus[]
  actionType?: PendingActionType[]
  riskLevel?: RiskLevel[]
}): Promise<PendingAction[]>

export async function decidePendingAction(params: {
  actionId: string
  decision: "approved" | "rejected"
  decidedByEmail: string
  note?: string
}): Promise<PendingAction>

export async function executePendingAction(actionId: string): Promise<void>
// Dispatch based on actionType → calls the actual engine
// e.g. "repair_efactura" → calls efacturaRepairExecute()

export async function expireOldActions(): Promise<number>
// Called by cron — expires actions past expiresAt

export async function resolveAutonomyPolicy(params: {
  userId: string
  orgId: string
  actionType: PendingActionType
  riskLevel: RiskLevel
}): Promise<"auto" | "semi" | "manual">
// Reads user_autonomy_settings, returns policy
// "auto" → execute immediately, log informatively
// "semi" → create pending_action, auto-approve after 24h
// "manual" → create pending_action, wait for explicit decision
```

### 12.2.2 API endpoints

**`GET /api/approvals`** — list pending actions for current org
```
Response: { actions: PendingAction[], counts: { pending, approved, rejected, expired } }
Query params: ?status=pending&type=repair_efactura&risk=high
```

**`PATCH /api/approvals/[id]`** — approve / reject
```
Body: { decision: "approved" | "rejected", note?: string }
Response: { action: PendingAction, executed?: boolean }
Side effect: if approved, calls executePendingAction()
```

**`GET /api/approvals/[id]`** — detail with diff preview
```
Response: { action: PendingAction, diff: { before, after, summary } }
```

### 12.2.3 UI

**Pagină:** `/dashboard/approvals` (tab nou în nav sau embedded în resolve)

**Componente:**
- `ApprovalQueuePage` — listă cu filtre (status, tip, risc)
- `ApprovalCard` — card per acțiune: titlu, risc badge, diff preview, approve/reject buttons
- `ApprovalDiffView` — before/after comparison (pentru e-Factura: XML diff; pentru documente: text diff)
- Badge count în sidebar navigation

**UX flow:**
1. Badge "3 de aprobat" apare în sidebar
2. User intră în Approval Queue
3. Vede lista prioritizată (critical > high > medium > low)
4. Click pe acțiune → vede diff + explicație
5. Aprobă / Respinge cu notă opțională
6. Acțiunea se execută automat la aprobare
7. Audit trail vizibil

### 12.2.4 Integrare cu cockpit (Smart Resolve Flow protejat)

**Unde se creează pending_actions din cockpit:**
- Când finding e confirmat și rezolvarea cere document → dacă autonomy policy = "manual" pentru medium risk, se creează pending_action de tip `generate_document`
- Când e-Factura e reparată → pending_action de tip `repair_efactura`
- Când AI system e clasificat → pending_action de tip `classify_ai_system`

**Regula:** cockpitul NU se oprește. Userul vede "Acțiunea este în curs de aprobare" și poate continua cu alte findings. Când acțiunea e aprobată, cockpitul se actualizează.

## Dependențe
- 12.1 (tabelul `pending_actions` trebuie creat)
- 12.6 (autonomy settings determină dacă se creează pending_action sau se execută direct)

## DONE means
- [ ] `pending_actions` tabel creat și funcțional
- [ ] API `GET/PATCH /api/approvals` funcționale
- [ ] UI `/dashboard/approvals` cu liste, filtre, diff, approve/reject
- [ ] Badge count în navigare
- [ ] e-Factura repair trece prin approval queue (dacă policy != auto)
- [ ] Audit trail scris la fiecare decizie
- [ ] Acțiunile expirate sunt marcate automat (cron)
- [ ] Cockpitul nu se blochează — arată status "awaiting approval"

---

# 12.3 Auto-link evidence

## Starea curentă
- `GeneratedDocumentRecord.sourceFindingId` există — leagă documentul de finding
- `dosar-page.tsx` filtrează documente cu `sourceFindingId` + `approvalStatus === "approved_as_evidence"`
- Dar legătura e inconsistentă: unele findings nu au document linkat deși documentul există
- Nu există auto-link la momentul generării — linkul se face manual

## Ce construim

### 12.3.1 Evidence matcher service

**Fișier nou:** `lib/compliance/evidence-matcher.ts`

```typescript
export type EvidenceLink = {
  findingId: string
  documentId: string
  linkType: "generated_for" | "uploaded_for" | "matched_by_content"
  confidence: "high" | "medium"
  createdAtISO: string
}

// Auto-link la momentul generării documentului
export function autoLinkDocumentToFinding(
  document: GeneratedDocumentRecord,
  findings: ScanFinding[]
): EvidenceLink | null
// Logica:
// 1. Dacă document.sourceFindingId există → link direct (high confidence)
// 2. Dacă document.documentType match finding.suggestedDocumentType → match (medium)
// 3. Return null dacă nu se potrivește nimic

// Auto-link la momentul uploadului de evidență
export function autoLinkEvidenceToFinding(
  evidence: TaskEvidenceAttachment,
  findings: ScanFinding[]
): EvidenceLink | null

// Verificare completitudine Dosar
export function checkDossierCompleteness(
  findings: ScanFinding[],
  documents: GeneratedDocumentRecord[]
): {
  complete: EvidenceLink[]
  missing: { findingId: string; requiredEvidence: string }[]
  unlinked: string[] // document IDs fără finding
}
```

### 12.3.2 Integrare automată

**În `POST /api/documents/generate`:**
Când documentul e generat cu `sourceFindingId`:
1. Setează `sourceFindingId` pe `GeneratedDocumentRecord`
2. Auto-update finding → `suggestedDocumentType` matches
3. Scrie eveniment în `ComplianceState.events`

**În cockpit (resolve page):**
Când finding are document generat linkat:
1. Arată documentul direct în cockpit (nu mai cere userul să caute)
2. Butonul "Verifică și aprobă" apare automat
3. După aprobare → finding status = "resolved", document status = "approved_as_evidence"
4. Auto-create dossier entry

### 12.3.3 Dossier entry creation automată

**În `PATCH /api/findings/[id]` la tranziția `resolved` → `under_monitoring`:**
1. Verifică dacă documentul linkat are `approvalStatus === "approved_as_evidence"`
2. Creează event de tip `evidence_linked` cu `findingId` + `documentId`
3. Dosarul afișează automat — nu mai cere acțiune manuală

## Dependențe
- Nu depinde de 12.1 (poate funcționa cu state JSONB existent)
- Îmbunătățește 12.4 (validate evidence)

## DONE means
- [ ] Documentul generat cu `sourceFindingId` apare automat în cockpit
- [ ] Butonul de aprobare apare fără click suplimentar
- [ ] După aprobare + rezolvare, evidența apare automat în Dosar
- [ ] `checkDossierCompleteness()` returnează lista de findings fără evidență
- [ ] 0 pași manuali de linking pentru flows documentare standard

---

# 12.4 Validate evidence

## Starea curentă
- `validateGeneratedDocumentEvidence()` în `lib/compliscan/generated-document-validation.ts` — verifică completitudine GDPR Art. 13/14 pentru privacy-policy
- `validationStatus: "pending" | "passed"` există pe `GeneratedDocumentRecord`
- `confirmationChecklist` și `validationChecklist` există dar nu sunt populate consistent
- Cockpitul nu forțează validare înainte de aprobare pe toate tipurile

## Ce construim

### 12.4.1 Validation service extins

**Fișier existent modificat:** `lib/compliscan/generated-document-validation.ts`

```typescript
// Extindere: validation rules per document type
export type ValidationRule = {
  id: string
  label: string
  check: (content: string, context: ValidationContext) => boolean
  severity: "blocking" | "warning"
}

export type ValidationContext = {
  orgProfile?: OrgProfile
  finding?: ScanFinding
  documentType: GeneratedDocumentKind
}

export type ValidationResult = {
  status: "passed" | "failed" | "warnings_only"
  rules: { rule: ValidationRule; passed: boolean; message?: string }[]
  blockers: string[]
  warnings: string[]
}

// Per-type validation
export function validateDocument(
  content: string,
  documentType: GeneratedDocumentKind,
  context: ValidationContext
): ValidationResult

// Privacy policy: 10 cerințe GDPR Art. 13/14 (EXISTĂ DEJA)
// DPA: verifică clauze obligatorii Art. 28
// Retention policy: verifică că are categorii + perioade + temei
// NIS2 incident response: verifică structura minimă
// ROPA: verifică câmpuri obligatorii Art. 30
// Job description: verifică menționare GDPR/date personale
// Cookie policy: verifică categorii trackere
// AI governance: verifică principiile EU AI Act
```

### 12.4.2 Integrare în cockpit

**În resolve page, între "document generat" și "aprobă ca dovadă":**

```
[Generează document] → [Validare automată] → [Rezultat]
                                                 ↓
                                    Passed → [Aprobă ca dovadă]
                                    Failed → [Arată blockers] → [Regenerează]
                                    Warnings → [Arată warnings] → [Aprobă oricum]
```

**UI:**
- Card de validare cu checklist vizibil (✅/❌ per regulă)
- Blockers: butonul de aprobare e disabled cu mesaj clar
- Warnings: butonul e activ dar arată "Atenție: 2 warnings"
- Passed: butonul e verde "Aprobă ca dovadă ✓"

### 12.4.3 Rescan integration

**După aprobare cu warnings**, setează `nextReviewDateISO` la +90 zile.
**După aprobare clean (passed)**, setează `nextReviewDateISO` la +180 zile.

## Dependențe
- Nu depinde de 12.1
- Beneficiază de 12.3 (auto-link face validarea să apară automat)

## DONE means
- [ ] Validare rulează automat pentru TOATE tipurile de documente generate
- [ ] Blockers opresc aprobarea (buton disabled)
- [ ] Warnings permit aprobare cu flag
- [ ] Checklist vizibil în cockpit cu ✅/❌
- [ ] `validationStatus` și `validatedAtISO` populate pe document record
- [ ] Cockpitul nu permite "Trimite la Dosar" fără validare trecută

---

# 12.5 Submit ANAF real

## Starea curentă
- Validator e-Factura: existent și bun (`lib/compliance/efactura-validator.ts`)
- Repair engine: existent (`lib/compliance/efactura-xml-repair.ts`)
- ANAF OAuth2: partial (`lib/server/anaf-oauth.ts` — cercetare, nu producție)
- SPV check: `POST /api/fiscal/spv-check` — verifică status, nu trimite
- Submit real: NU EXISTĂ

## Ce construim

### 12.5.1 ANAF SPV Submit Service

**Fișier nou:** `lib/server/anaf-spv-submit.ts`

```typescript
export type SPVSubmitResult = {
  success: boolean
  indexDescarcare?: string // ID-ul returnat de ANAF
  statusMessage: string
  submittedAtISO: string
  rawResponse?: Record<string, unknown>
}

export type SPVSubmitStatus = {
  indexDescarcare: string
  stare: "in_prelucrare" | "ok" | "nok" | "eroare"
  details?: string
  checkedAtISO: string
}

// Submit XML to ANAF SPV
export async function submitToSPV(params: {
  orgId: string
  xmlContent: string
  invoiceId: string
  tokenData: { accessToken: string; refreshToken: string; expiresAt: string }
}): Promise<SPVSubmitResult>

// Check submission status
export async function checkSPVStatus(params: {
  indexDescarcare: string
  tokenData: { accessToken: string; refreshToken: string; expiresAt: string }
}): Promise<SPVSubmitStatus>
```

### 12.5.2 Token management securizat

**Stocare:** token-ul SPV se stochează criptat în `ComplianceState` sau într-un câmp dedicat Supabase.

```typescript
// În settings page: formular OAuth2 flow
// 1. User click "Conectează SPV"
// 2. Redirect la ANAF OAuth2 authorize
// 3. Callback salvează token criptat
// 4. Token refresh automat la expirare
```

### 12.5.3 Flow complet gated prin Approval Queue

```
1. User uploadează XML cu erori
2. Validator detectează probleme
3. Repair engine generează propunere
4. Se creează pending_action type="repair_efactura"
   - originalData: XML original
   - proposedData: XML reparat
   - diffSummary: lista de modificări
   - riskLevel: "medium"
5. User vede diff-ul în Approval Queue (sau inline în cockpit)
6. User aprobă
7. Se creează pending_action type="submit_anaf"
   - proposedData: XML reparat aprobat
   - riskLevel: "high" (trimite la ANAF!)
8. User aprobă submit-ul
9. Sistemul trimite la SPV
10. Rezultatul se salvează: indexDescarcare
11. Cron verifică status la 15 min
12. Când stare="ok": finding fiscal se rezolvă, dovada intră în Dosar
```

### 12.5.4 API endpoints

**`POST /api/fiscal/submit-spv`**
```
Body: { invoiceId: string, xmlContent: string }
Requires: approval_id (pending_action must be approved)
Response: { submitted: boolean, indexDescarcare?: string, status: string }
```

**`GET /api/fiscal/submit-status/[indexDescarcare]`**
```
Response: { stare, details, lastCheckedAt }
```

### 12.5.5 Evidență post-submit

Când SPV răspunde "ok":
1. Creează `ComplianceEvent` cu tip `efactura_submitted`
2. Creează `GeneratedDocumentRecord` de tip `efactura-submission-receipt` cu detaliile
3. Finding-ul fiscal se rezolvă automat
4. Dovada (receipt) intră în Dosar

## Dependențe
- 12.2 (Approval Queue — submit-ul e gated)
- 12.1 (token storage securizat)
- ANAF OAuth2 credentials reale (blocker extern)

## DONE means
- [ ] User poate conecta SPV din Settings (OAuth2 flow)
- [ ] After repair → pending_action se creează
- [ ] After approve → pending_action submit se creează
- [ ] After approve submit → XML se trimite la SPV real
- [ ] Status check funcționează (cron sau polling)
- [ ] La "ok" → finding se rezolvă automat + dovadă în Dosar
- [ ] La "nok" → finding revine cu eroare detaliată
- [ ] Nicio trimitere fără dublu approve

---

# 12.6 Autonomy settings

## Starea curentă
- `requiresHumanReview` pe `ScanFinding` — flag boolean, nu configurabil
- Confidence thresholds hardcoded în semantic engine
- CloseGatingRequirements per finding type — nu per user preference
- Zero UI de configurare

## Ce construim

### 12.6.1 Model de date

Folosește tabelul `user_autonomy_settings` din 12.1.

**Valori per nivel de risc:**
- `auto`: sistemul execută fără aprobare; userul primește notificare informativă
- `semi`: se creează `pending_action`; dacă userul nu răspunde în 24h, se auto-aprobă
- `manual`: se creează `pending_action`; așteaptă aprobare explicită; nu expiră

**Category overrides** (JSON):
```json
{
  "efactura_repair": "auto",
  "generate_document": "semi",
  "submit_anaf": "manual",
  "vendor_merge": "manual",
  "batch_action": "semi"
}
```

### 12.6.2 Runtime resolver

**Fișier nou:** `lib/server/autonomy-resolver.ts`

```typescript
export async function resolvePolicy(params: {
  userId: string
  orgId: string
  actionType: PendingActionType
  riskLevel: RiskLevel
}): Promise<"auto" | "semi" | "manual"> {
  // 1. Check category_overrides first
  // 2. Fall back to risk_level policy
  // 3. Fall back to defaults: low=auto, medium=semi, high/critical=manual
}
```

**Integrare:** Oriunde se creează un `pending_action`, se apelează mai întâi `resolvePolicy()`.
- Dacă "auto" → execută direct + logează
- Dacă "semi" → creează pending_action cu expires_at = now + 24h
- Dacă "manual" → creează pending_action fără expirare

### 12.6.3 UI

**Locație:** Tab nou "Autonomie" în `/dashboard/settings` (lângă Workspace / Integrări / Acces / Operațional)

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  Niveluri de autonomie                           │
│                                                  │
│  Risc scăzut      [Auto ▼]                       │
│  Risc mediu       [Semi-auto ▼]                  │
│  Risc ridicat     [Manual ▼]                     │
│  Risc critic      [Manual ▼] (locked)            │
│                                                  │
│  ── Override-uri per categorie ──                │
│                                                  │
│  Reparare e-Factura    [Auto ▼]                  │
│  Generare documente    [Semi-auto ▼]             │
│  Submit ANAF           [Manual ▼] (locked)       │
│  Unificare vendori     [Manual ▼]                │
│  Acțiuni batch         [Semi-auto ▼]             │
│                                                  │
│  [Salvează]                                      │
└──────────────────────────────────────────────────┘
```

**Reguli hard:**
- `submit_anaf` nu poate fi setat pe "auto" (hardcoded manual minimum)
- `critical` risk nu poate fi setat pe "auto"

### 12.6.4 API

**`GET /api/settings/autonomy`**
```
Response: { lowRiskPolicy, mediumRiskPolicy, highRiskPolicy, criticalRiskPolicy, categoryOverrides }
```

**`PATCH /api/settings/autonomy`**
```
Body: { lowRiskPolicy?, mediumRiskPolicy?, categoryOverrides? }
Validation: nu permite "auto" pe submit_anaf sau critical
```

## Dependențe
- 12.1 (tabelul `user_autonomy_settings`)
- 12.2 (Approval Queue folosește policy-ul)

## DONE means
- [ ] Tabel `user_autonomy_settings` creat
- [ ] UI în Settings cu dropdown-uri per nivel de risc
- [ ] Category overrides funcționale
- [ ] `resolvePolicy()` apelat înainte de orice pending_action creation
- [ ] "auto" execută + logează fără pending_action
- [ ] "semi" creează pending_action cu auto-approve la 24h
- [ ] "manual" creează pending_action fără expirare
- [ ] submit_anaf hardcoded manual (nu poate fi auto)

---

# 12.7 Batch actions și scheduled reports

## Starea curentă
- `/api/portfolio/batch` — endpoint existent, dar slab
- Portfolio UI există dar fără multi-select real
- Cron-uri de rapoarte (monthly-digest, partner-monthly-report) rulează dar nu sunt configurabile
- Zero UI pentru scheduling

## Ce construim

### 12.7.1 Batch actions engine

**Fișier existent îmbunătățit:** `app/api/portfolio/batch/route.ts`

```typescript
export type BatchActionType =
  | "generate_ropa"
  | "generate_privacy_policy"
  | "run_baseline_scan"
  | "export_audit_pack"
  | "send_compliance_summary"

export type BatchActionRequest = {
  orgIds: string[]
  actionType: BatchActionType
  config?: Record<string, unknown>
}

export type BatchActionResult = {
  orgId: string
  orgName: string
  status: "success" | "pending_approval" | "failed"
  pendingActionId?: string
  error?: string
}
```

**Logica:**
1. Pentru fiecare `orgId`, apelează `resolvePolicy()` cu risk level al acțiunii
2. Dacă "auto" → execută direct
3. Dacă "semi"/"manual" → creează `pending_action` per org
4. Returnează lista de rezultate

### 12.7.2 Batch UI

**Locație:** În pagina de portfolio (existentă la `/portfolio`)

**Componente noi:**
- Checkbox per client row
- Toolbar "X selectați" cu dropdown de acțiuni
- Dialog de confirmare: "Vei genera RoPA pentru 5 clienți. Continui?"
- Progress indicator cu rezultate per org
- Link către Approval Queue dacă unele acțiuni sunt pending

**UX flow:**
```
1. Diana selectează 5 clienți (checkbox)
2. Click "Acțiuni" → dropdown
3. Alege "Generează RoPA"
4. Dialog: "Generează RoPA pentru 5 clienți?"
5. Confirmă
6. Progress: ✓ Client A, ✓ Client B, ⏳ Client C (pending approval), ...
7. Link: "2 acțiuni necesită aprobare →"
```

### 12.7.3 Scheduled reports configurabile

**Locație:** Tab nou "Rapoarte programate" în portfolio sau settings partner

**UI:**
```
┌──────────────────────────────────────────────────┐
│  Rapoarte programate                             │
│                                                  │
│  [+ Raport nou]                                  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Sumar conformitate          Lunar          │  │
│  │ Clienți: Toți (12)         Următorul: 1 mai│  │
│  │ Destinatari: diana@...     [Editează]      │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Audit pack                 Trimestrial     │  │
│  │ Clienți: 5 selectați      Următorul: 1 iul│  │
│  │ Necesită aprobare: Da     [Editează]       │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Formular "Raport nou":**
- Tip: dropdown (Sumar conformitate / Audit pack / Status fiscal / Portofoliu complet)
- Frecvență: dropdown (Săptămânal / Lunar / Trimestrial)
- Clienți: multi-select din portofoliu
- Destinatari email: input
- Necesită aprobare înainte de trimitere: checkbox

### 12.7.4 API endpoints

**`POST /api/portfolio/batch`** (existent, îmbunătățit)
```
Body: { orgIds: string[], actionType: BatchActionType, config?: {} }
Response: { results: BatchActionResult[], pendingCount: number }
```

**`GET /api/reports/scheduled`**
```
Response: { reports: ScheduledReport[] }
```

**`POST /api/reports/scheduled`**
```
Body: { reportType, frequency, clientOrgIds, recipientEmails, requiresApproval }
Response: { report: ScheduledReport }
```

**`PATCH /api/reports/scheduled/[id]`**
```
Body: partial update
```

**`DELETE /api/reports/scheduled/[id]`**

### 12.7.5 Cron pentru scheduled reports

**Fișier nou:** `app/api/cron/scheduled-reports/route.ts`

Rulează la fiecare oră. Logica:
1. Citește `scheduled_reports` WHERE `enabled = true` AND `next_run_at <= now()`
2. Pentru fiecare: generează raportul
3. Dacă `requires_approval` → creează `pending_action`
4. Dacă nu → trimite direct pe email
5. Update `last_run_at`, calculează `next_run_at`

**Adaugă în vercel.json:**
```json
{ "path": "/api/cron/scheduled-reports", "schedule": "0 * * * *" }
```

## Dependențe
- 12.2 (batch actions pot crea pending_actions)
- 12.6 (autonomy policy determină auto vs approval)
- 12.1 (tabelul `scheduled_reports`)

## DONE means
- [ ] Multi-select funcțional pe portfolio UI
- [ ] Toolbar cu acțiuni batch
- [ ] Dialog confirmare + progress per org
- [ ] Acțiuni care necesită approval → creează pending_actions
- [ ] UI "Rapoarte programate" cu CRUD complet
- [ ] Cron generează rapoarte la frecvența configurată
- [ ] Rapoarte trimise pe email (sau pending approval)
- [ ] Diana poate programa raport lunar pentru 12 clienți în <2 minute

---

# Rezumat dependențe

```
12.1 Persistență ──────────┐
                           ├──→ 12.2 Approval Queue ──→ 12.5 Submit ANAF
12.6 Autonomy Settings ────┘          │
                                      ├──→ 12.7 Batch + Reports
                                      │
12.3 Auto-link Evidence ──────────────┤
                                      │
12.4 Validate Evidence ───────────────┘
```

**Ordinea de execuție recomandată:**
1. **Sprint P0-A:** 12.1 (Supabase schema) + 12.6 (autonomy settings) — fundament
2. **Sprint P0-B:** 12.2 (Approval Queue) + 12.3 (auto-link evidence) — core loop
3. **Sprint P0-C:** 12.4 (validate evidence) + 12.5 (submit ANAF) — depth
4. **Sprint P1:** 12.7 (batch + reports) — partner machine

**Estimare totală:** 4 sprinturi a câte ~1 săptămână fiecare cu AI assist.

---

# P3 — Depth Wedges

---

# 12.8 NIS2 Packaging (P3 item 15)

## Starea curentă
- NIS2 complet implementat: assessment, incidents (Art. 23), vendors, DNSC, governance, maturity
- `readNis2State()` există în `lib/server/nis2-store.ts`
- Audit pack include `nis2State` brut (`lib/server/audit-pack.ts`)
- **Problema:** NIS2 este modul izolat — gaps din assessment nu generează findings în cockpit, nu apar în Dosar, nu sunt vizibile pe dashboard-ul principal

## Ce construim

### 12.8.1 NIS2 gaps → findings automate

**Fișier modificat:** `lib/server/nis2-store.ts` — funcție nouă `buildNis2Findings()`

```typescript
export function buildNis2Findings(
  nis2State: Nis2OrgState,
  nowISO: string
): ScanFinding[]
// Generează findings din:
// - dnscRegistrationStatus !== "registered" → finding GDPR-NIS2-001 severity="high"
// - assessment != null && score < 50 → finding GDPR-NIS2-002 severity="high"
// - incidents cu status="open" mai vechi de 72h → finding GDPR-NIS2-003 severity="critical"
// - vendors cu nextReviewDueISO < now → finding GDPR-NIS2-004 severity="medium"
// - maturityAssessment != null && score < 40 → finding GDPR-NIS2-005 severity="medium"
```

**Fișier modificat:** `lib/compliance/intake-engine.ts` — integrare `buildNis2Findings()` în scanul de onboarding și în re-scan.

**Finding IDs rezervate:**
- `nis2-dnsc-registration` — DNSC neînregistrat
- `nis2-assessment-gap` — Assessment incomplet sau scor < 50
- `nis2-open-incident` — Incident deschis > 72h
- `nis2-vendor-review-overdue` — Vendor nereviewed
- `nis2-maturity-low` — Maturitate scăzută

### 12.8.2 NIS2 section în audit pack

**Fișier modificat:** `lib/server/audit-pack.ts` — secțiune `nis2Package` structurată

```typescript
type Nis2PackageSection = {
  applicable: boolean
  dnscStatus: string
  assessmentScore: number | null
  openIncidents: number
  criticalVendors: number
  maturityScore: number | null
  gaps: { area: string; finding: string; priority: "critical" | "high" | "medium" }[]
  handoffNote: string // text gata de trimis la consultant/auditor
}
```

Adăugat în `AuditPackV2` ca câmp `nis2Package`.

### 12.8.3 NIS2 rollout card pe dashboard

**Fișier modificat:** `app/dashboard/page.tsx` — card nou vizibil doar dacă NIS2 se aplică

**Card arată:**
- Scor maturity (ring/progress)
- Status DNSC (✓ Înregistrat / ⚠ Neînregistrat)
- Incidents deschise
- CTA principal: "Finalizează assessment" sau "Înregistrează DNSC" sau "Închide incident"

**Fișier nou:** `components/compliscan/nis2-cockpit-card.tsx`

### 12.8.4 Handoff explicit → extern

**Fișier modificat:** `app/api/exports/audit-pack/route.ts` — include `nis2Package` în export JSON

**Fișier nou:** `app/api/nis2/package/route.ts`
```
GET /api/nis2/package
Response: { applicable, nis2Package, findings[], exportReady: boolean }
```

## Dependențe
- `nis2-store.ts` — existent, extins
- `intake-engine.ts` — existent, extins
- `audit-pack.ts` — existent, extins

## DONE means
- [ ] `buildNis2Findings()` generează findings reale din starea NIS2
- [ ] Findings NIS2 apar în cockpit (`/dashboard/resolve`) și pot fi rezolvate
- [ ] Findings rezolvate intră în Dosar cu dovadă NIS2
- [ ] Audit pack include `nis2Package` cu gaps + handoff note
- [ ] Card NIS2 vizibil pe dashboard dacă se aplică
- [ ] `GET /api/nis2/package` returnează starea pachetată

---

# 12.9 Vendor Readiness Pack (P3 item 16)

## Starea curentă
- Vendor reviews implementate (`lib/server/vendor-review-store.ts`)
- Trust Center existent (`/trust/[orgId]`)
- Response Pack existent (`/api/exports/annex-lite/client`)
- **Lipsește:** un livrabil bundled "Vendor Trust Pack" pentru IT/BPO/MSP care vor să demonstreze furnizorilor/clienților că sunt complianți (Wedge B)

## Ce construim

### 12.9.1 Vendor Trust Pack — tipuri și generator

**Fișier nou:** `lib/server/vendor-trust-pack.ts`

```typescript
export type VendorTrustPack = {
  generatedAtISO: string
  orgId: string
  orgName: string
  // GDPR evidence
  gdpr: {
    hasRopa: boolean
    hasPrivacyPolicy: boolean
    hasDpa: boolean            // Data Processing Agreement disponibil
    gdprProgress: number       // 0-100
    openFindings: number
    evidenceItems: { title: string; type: string; approvedAtISO: string }[]
  }
  // NIS2 readiness
  nis2: {
    applicable: boolean
    dnscRegistered: boolean
    assessmentScore: number | null
    maturityScore: number | null
    openIncidents: number
    vendorsCount: number
  }
  // Security posture
  security: {
    aiSystemsCount: number
    highRiskAiCount: number
    vendorReviewsTotal: number
    vendorReviewsOpen: number
    vendorReviewsCritical: number
  }
  // Overall readiness score (0-100, calculat din gdpr + nis2 + security)
  readinessScore: number
  readinessLabel: "Gata de audit" | "Parțial pregătit" | "În progres"
  // Exportabil ca PDF/JSON pentru procurement due diligence
  shareToken?: string
}

export async function buildVendorTrustPack(orgId: string): Promise<VendorTrustPack>
```

### 12.9.2 API endpoint

**Fișier nou:** `app/api/exports/vendor-trust-pack/route.ts`

```
GET /api/exports/vendor-trust-pack
Response: VendorTrustPack JSON
Headers: Content-Disposition: attachment; filename="vendor-trust-pack-{orgName}.json"

GET /api/exports/vendor-trust-pack?format=pdf
Response: PDF cu header branded (folosește white-label config dacă există)
```

### 12.9.3 UI — card în Reports / Dosar

**Fișier modificat:** `components/compliscan/reports-page.tsx` — card nou "Vendor Trust Pack"

**Card arată:**
- Readiness score (ring)
- Status per categorie: GDPR / NIS2 / Security (✓/⚠/✗)
- Buton "Descarcă pack" (JSON)
- Buton "Distribuie link" (share token — Trust Center existent)

**Fișier nou:** `components/compliscan/vendor-trust-pack-card.tsx`

### 12.9.4 Procurement trust pack (simplificat)

Un subset al VendorTrustPack exportabil ca răspuns la chestionare due diligence:
- 10 întrebări standard (GDPR processor? DPA disponibil? NIS2 în scope? Incident în ultimele 12 luni?)
- Auto-completate din starea org
- Export ca PDF cu semnătură digitală placeholder

**Fișier nou:** `lib/server/procurement-questionnaire.ts`
```typescript
export type ProcurementQuestion = {
  id: string
  question: string
  answer: "yes" | "no" | "partial" | "n/a"
  evidence?: string   // link sau titlu document
  source: "auto" | "manual"
}
export function buildProcurementQuestionnaire(orgState, nis2State): ProcurementQuestion[]
```

## Dependențe
- `vendor-review-store.ts` — existent
- `nis2-store.ts` — existent
- `audit-pack.ts` — pattern existent, replicat
- white-label config (12 din P2) — opțional, pentru PDF branded

## DONE means
- [ ] `buildVendorTrustPack()` calculează readiness score corect
- [ ] `GET /api/exports/vendor-trust-pack` returnează JSON valid
- [ ] Card "Vendor Trust Pack" vizibil în Reports cu score + status
- [ ] Export JSON descărcabil
- [ ] Procurement questionnaire auto-completat (10 întrebări)
- [ ] Firme IT/BPO pot demonstra furnizorilor că sunt pregătiți în < 2 minute

---

# 12.10 AI Act Evidence Pack (P3 item 17)

## Starea curentă
- `classifyAISystem()` — Annex III + Art. 5 + Art. 50 (`lib/compliance/ai-act-classifier.ts`)
- `AICompliancePackEntries` — pack de conformitate per sistem
- `POST /api/ai-act/annex-iv` — generează documentație Annex IV
- `POST /api/ai-act/prepare-submission` — pregătire EU Database
- **Lipsește:** AI Act nu trece prin Approval Queue la clasificare high-risk, evidence nu intră în Dosar, flow `inventory → confirm → obligations → resolve → evidence → Dosar` incomplet

## Ce construim

### 12.10.1 Approval Queue binding pentru clasificare AI

**Fișier modificat:** `app/api/ai-systems/route.ts` — la PATCH status = "confirmed" + riskClass ∈ ["high_risk", "prohibited"]

```typescript
// Dacă sistem confirmat ca high_risk sau prohibited:
// → creează pending_action type="classify_ai_system"
//   riskLevel: "high"
//   proposedData: { systemId, riskClass, requiredActions[], deadline }
//   explanation: "Sistemul ${name} clasificat ${riskClass} per Annex III Art. ${article}"
// → UI arată "Clasificare în curs de validare" până la aprobare
```

### 12.10.2 Obligations → Tasks automate

**Fișier modificat:** `lib/compliance/ai-act-classifier.ts` — `buildAIActObligationFindings()`

```typescript
export function buildAIActObligationFindings(
  system: AISystem,
  classification: AIActClassification,
  nowISO: string
): ScanFinding[]
// Generează findings per obligation din requiredActions[]:
// - "register-eu-database" → finding ai-act-{id}-eu-db severity="high"
// - "technical-documentation" → finding ai-act-{id}-annex-iv severity="high"
// - "human-oversight" → finding ai-act-{id}-oversight severity="medium"
// - "conformity-assessment" → finding ai-act-{id}-conformity severity="high"
// Finding-ul are sourceFindingId = systemId pentru linkare în Dosar
```

### 12.10.3 Evidence → Dosar

**Fișier modificat:** `app/api/ai-act/annex-iv/route.ts` — după generare Annex IV:
- Creează `GeneratedDocumentRecord` cu `sourceFindingId = "ai-act-{systemId}-annex-iv"`
- `approvalStatus = "pending_review"` (ca orice document generat)
- La aprobare → finding se rezolvă → dovada intră în Dosar

### 12.10.4 AI Act Evidence Pack export

**Fișier nou:** `lib/server/ai-act-evidence-pack.ts`

```typescript
export type AIActEvidencePack = {
  generatedAtISO: string
  systems: {
    systemId: string
    systemName: string
    riskClass: AIActRiskLevel
    classification: AIActClassification
    obligations: { id: string; label: string; status: "done" | "pending" | "overdue"; evidenceTitle?: string }[]
    annexIvGenerated: boolean
    annexIvApproved: boolean
    euDbSubmitted: boolean
    findingsResolved: number
    findingsOpen: number
  }[]
  overallCompliance: number  // 0-100
  deadline: string            // next upcoming deadline
}
export async function buildAIActEvidencePack(orgId: string): Promise<AIActEvidencePack>
```

**Fișier nou:** `app/api/exports/ai-act-evidence-pack/route.ts`
```
GET /api/exports/ai-act-evidence-pack
Response: AIActEvidencePack JSON
```

### 12.10.5 UI — summary card în sisteme

**Fișier modificat:** `app/dashboard/sisteme/page.tsx` — tab nou sau secțiune "Evidence Pack"

**Arată per sistem:**
- Progress bar obligations completate
- Status Annex IV (generat / aprobat / lipsă)
- Status EU Database submission
- Buton "Descarcă Evidence Pack"

## Dependențe
- `ai-act-classifier.ts` — existent, extins
- `approval-queue.ts` (12.2) — pentru pending_action classify
- `document-generator.ts` — existent, Annex IV deja generat
- `mvp-store.ts` — pentru persisted findings

## DONE means
- [ ] Clasificare high-risk/prohibited creează pending_action
- [ ] `buildAIActObligationFindings()` generează findings per obligation
- [ ] Findings AI Act apar în cockpit și pot fi rezolvate
- [ ] Annex IV generat → GeneratedDocumentRecord creat → aprobat → în Dosar
- [ ] `buildAIActEvidencePack()` calculează compliance per sistem
- [ ] Export JSON descărcabil
- [ ] UI arată progress per sistem AI în `/dashboard/sisteme`

---

# 12.11 Pay Transparency Full (P3 item 18)

## Starea curentă
- `buildPayTransparencyFinding()` în `lib/compliance/pay-transparency-rule.ts`
- Finding auto-generat pentru org cu 50+ angajați
- **Deadline: 7 iunie 2026** (Directiva UE 2023/970)
- **Lipsește:** tot workflow-ul — upload date salariale, calcul gap, draft raport, aprobare

## Ce construim

### 12.11.1 Model de date

**Fișier nou:** `lib/server/pay-transparency-store.ts`

```typescript
export type SalaryRecord = {
  id: string
  orgId: string
  jobRole: string           // "Software Engineer", "Manager", etc.
  gender: "M" | "F" | "other" | "undisclosed"
  salaryBrut: number        // RON/lună
  salaryBonuses: number
  contractType: "full-time" | "part-time"
  department?: string
  createdAtISO: string
}

export type PayGapReport = {
  id: string
  orgId: string
  generatedAtISO: string
  periodYear: number
  totalEmployees: number
  avgSalaryM: number
  avgSalaryF: number
  gapPercent: number        // (avgM - avgF) / avgM * 100
  gapByRole: { role: string; gapPercent: number }[]
  status: "draft" | "approved" | "published"
  approvedAtISO?: string
  publishedAtISO?: string
}

// Storage: Map fallback + Supabase (tabele: pay_salary_records, pay_gap_reports)
export async function saveSalaryRecords(orgId: string, records: Omit<SalaryRecord, "id" | "orgId" | "createdAtISO">[]): Promise<void>
export async function listSalaryRecords(orgId: string): Promise<SalaryRecord[]>
export async function buildPayGapReport(orgId: string, year: number): Promise<PayGapReport>
export async function approvePayGapReport(orgId: string, reportId: string): Promise<PayGapReport>
```

### 12.11.2 API endpoints

**Fișier nou:** `app/api/pay-transparency/route.ts`
```
GET  /api/pay-transparency          → { records, latestReport, findingStatus }
POST /api/pay-transparency/upload   → Body: SalaryRecord[] (CSV import sau JSON)
POST /api/pay-transparency/report   → Calculează gap, returnează PayGapReport draft
PATCH /api/pay-transparency/report/[id] → { status: "approved" | "published" }
```

### 12.11.3 CSV import salarii

**Fișier nou:** `lib/server/pay-transparency-csv.ts`
```typescript
export function parseSalaryCSV(csvContent: string): Omit<SalaryRecord, "id" | "orgId" | "createdAtISO">[]
// Detectează coloane: Rol/Funcție, Gen/Sex, Salariu brut, Bonusuri, Tip contract
// Fallback headers: role/job/position + gender/sex + salary/brut + bonus + contract
```

### 12.11.4 Gap calculator

**Fișier nou:** `lib/compliance/pay-gap-calculator.ts`
```typescript
export type PayGapAnalysis = {
  overallGapPercent: number
  byRole: { role: string; avgM: number; avgF: number; gap: number; gapPercent: number }[]
  byDepartment?: { dept: string; gapPercent: number }[]
  riskLevel: "low" | "medium" | "high"   // <5% low, 5-15% medium, >15% high
  obligationMet: boolean                  // true dacă gap < 5% sau raport publicat
  recommendations: string[]
}
export function calculatePayGap(records: SalaryRecord[]): PayGapAnalysis
```

### 12.11.5 UI — pagină dedicată

**Fișier nou:** `app/dashboard/pay-transparency/page.tsx`
**Fișier nou:** `components/compliscan/pay-transparency-page.tsx`

**Flux UI:**
```
1. Banner "Deadline 7 iunie 2026" (dacă aplicabil și nerezolvat)
2. Step 1: Upload date salariale (CSV drag&drop sau formular manual)
3. Step 2: Preview date + validare (corectează erori)
4. Step 3: Calcul gap automat + vizualizare (bar chart M vs F per rol)
5. Step 4: Draft raport → Aprobare → Publicat
6. La aprobare: finding pay-transparency-2026 se rezolvă + dovada în Dosar
```

**Navigare:** adăugat în sidebar sub "Conformitate" sau ca finding CTA în cockpit

### 12.11.6 Rezolvare finding

**Fișier modificat:** `lib/compliscan/finding-kernel.ts` — CockpitRecipe pentru `pay-transparency-2026`:
```typescript
{
  findingId: "pay-transparency-2026",
  actionLabel: "Calculează gap salarial",
  destination: "/dashboard/pay-transparency",
  closeGating: {
    requiresDocument: true,
    documentType: "pay-gap-report",
    requiresApproval: true,
  }
}
```

## Dependențe
- `pay-transparency-rule.ts` — existent, finding auto-generat
- `finding-kernel.ts` — extins cu recipe nou
- `document-generator.ts` — tip document nou `pay-gap-report`

## DONE means
- [ ] Upload CSV salarii funcțional (detectare coloane flexibilă)
- [ ] `calculatePayGap()` returnează gap % corect per rol
- [ ] Vizualizare gap (bar chart sau tabel M vs F)
- [ ] Draft raport generat automat cu recomandări
- [ ] Aprobare raport → finding rezolvat → dovadă în Dosar
- [ ] Banner deadline vizibil dacă < 60 zile
- [ ] Pagină `/dashboard/pay-transparency` accesibilă din cockpit finding CTA

---

# 12.12 Drift Maturation (P3 item 19)

## Starea curentă
- `review_cycles` create la rezolvare finding (12.8 monitoring din Canon)
- Cron `vendor-review-revalidation` rulează zilnic
- `ScanFinding.driftStatus` există (`active | resolved | reopened`)
- **Lipsește:** cycling mai dens, auto-reopen pe finding rezolvat când apar semnale noi, revalidation triggers mai precisi

## Ce construim

### 12.12.1 Drift triggers îmbunătățiți

**Fișier modificat:** `lib/server/review-cycle-store.ts` (sau echivalent) — `DriftTrigger` extins:

```typescript
export type DriftTrigger =
  | "time_elapsed"          // deja existent
  | "legislation_change"    // finding re-evaluat când legea se schimbă
  | "new_vendor_added"      // vendor nou → re-check DPA/GDPR
  | "ai_system_modified"    // sistem AI modificat → re-check clasificare
  | "org_profile_change"    // angajați/CAEN/VAT change → re-check applicability
  | "incident_closed"       // incident NIS2 închis → re-check postura generală
  | "efactura_status_change" // status SPV schimbat → re-check finding fiscal

export type ReviewCycle = {
  // câmpuri existente +
  triggerType: DriftTrigger
  triggerDetail?: string    // ex: "Angajați: 45 → 52 (NIS2 threshold)"
}
```

### 12.12.2 Trigger engine

**Fișier nou:** `lib/server/drift-trigger-engine.ts`

```typescript
// Apelat din: AI system PATCH, vendor add, org profile update, incident close, efactura status change
export async function fireDriftTrigger(params: {
  orgId: string
  trigger: DriftTrigger
  detail?: string
  affectedFindingIds?: string[]  // dacă știm exact ce findings sunt afectate
}): Promise<void>
// Logica:
// 1. Găsește findings rezolvate cu under_monitoring care sunt afectate de trigger
// 2. Creează review_cycle cu triggerType + triggerDetail
// 3. Dacă finding are clauze stricte (high severity + trigger relevant) → marchează "needs_review"
// 4. Notificare in-app: "Findingul X necesită reverificare — ${triggerDetail}"
```

### 12.12.3 Auto-reopen condiționat

**Fișier modificat:** `lib/compliscan/finding-kernel.ts` — `reopenPolicy` per finding type:

```typescript
type ReopenPolicy = {
  triggers: DriftTrigger[]          // ce triggere pot redeschide finding-ul
  gracePeriodDays: number           // zile după care dacă nu e reverificat, se redeschide
  severity: "auto_reopen" | "flag_only"
  // auto_reopen: finding trece la status "reopened" automat
  // flag_only: finding rămâne under_monitoring dar primește badge "Necesită reverificare"
}

// Exemple:
// pay-transparency-2026: triggers=["org_profile_change"], gracePeriod=30, severity="flag_only"
// nis2-dnsc-registration: triggers=["legislation_change"], gracePeriod=7, severity="auto_reopen"
// ai-act-*-annex-iv: triggers=["ai_system_modified"], gracePeriod=14, severity="flag_only"
```

### 12.12.4 Drift dashboard widget

**Fișier modificat:** `app/dashboard/page.tsx` — widget "Drift activ" dacă există findings cu `needs_review` sau recent reopened

**Widget arată:**
- Număr findings reopened / flagged
- Top 3 cu trigger reason
- CTA: "Reverifică acum" → link direct la finding în cockpit

### 12.12.5 Cron drift sweep

**Fișier modificat:** `app/api/cron/agent-orchestrator/route.ts` sau **fișier nou:** `app/api/cron/drift-sweep/route.ts`

```
Schedule: 0 6 * * * (zilnic, dimineața)
Logica:
1. Toate findings cu status=under_monitoring + reviewDueAtISO < now → marchează needs_review
2. Findings cu needs_review + grace period expirat → auto_reopen (dacă policy=auto_reopen)
3. Notificări in-app pentru userul org-ului afectat
```

**Adaugă în vercel.json** dacă e fișier separat:
```json
{ "path": "/api/cron/drift-sweep", "schedule": "0 6 * * *" }
```

## Dependențe
- `finding-kernel.ts` — extins cu `reopenPolicy`
- `review-cycle-store.ts` — extins cu `DriftTrigger`
- notification system — existent, `createNotification()`

## DONE means
- [ ] `DriftTrigger` extins cu 6 tipuri noi
- [ ] `fireDriftTrigger()` apelat din AI PATCH, vendor add, org profile update
- [ ] `reopenPolicy` definit per finding type (cel puțin 5 finding-uri cheie)
- [ ] Widget "Drift activ" vizibil pe dashboard când există findings flagged
- [ ] Cron drift-sweep rulează zilnic + marchează needs_review
- [ ] Auto-reopen funcțional pentru finding-uri cu policy `auto_reopen`

---

# Rezumat P3 — dependențe și ordine

```
12.8 NIS2 Packaging ──────────────────→ findings → cockpit → Dosar
12.9 Vendor Readiness Pack ───────────→ export bundled (folosește 12.8 + vendor reviews)
12.10 AI Act Evidence Pack ───────────→ Approval Queue (12.2) + findings → Dosar
12.11 Pay Transparency Full ──────────→ finding existent + pagina nouă + Dosar
12.12 Drift Maturation ───────────────→ toate findings existente + notification system
```

**Ordine recomandată P3:**
1. **Sprint P3-A:** 12.8 (NIS2 packaging) — cel mai complet cod existent, impact imediat
2. **Sprint P3-B:** 12.9 (Vendor readiness pack) — nou livrabil comercial (Wedge B)
3. **Sprint P3-C:** 12.10 (AI Act evidence pack) — obligation findings + Dosar
4. **Sprint P3-D:** 12.11 (Pay Transparency) — deadline fix 7 iunie 2026 ⚠️
5. **Sprint P3-E:** 12.12 (Drift maturation) — maturizare — poate rula în paralel cu P3-D

**Atenție deadline:** 12.11 Pay Transparency are deadline fix **7 iunie 2026**. Dacă suntem în aprilie, avem ~2 luni. Prioritizați dacă există clienți cu 50+ angajați.

---

# Checklist final per Release Gate

## Gate A — Applicability truth
- [ ] Onboarding → CUI → enrichment → applicability → first finding

## Gate B — First resolved finding
- [ ] Finding → cockpit → generate → validate → approve → Dosar
- [ ] Auto-link funcționează (12.3)
- [ ] Validate evidence funcționează (12.4)

## Gate C — Approval truth
- [ ] Approval Queue UI funcțională (12.2)
- [ ] Autonomy settings configurabile (12.6)
- [ ] Nicio acțiune medium+ execută fără approval (dacă policy = manual)

## Gate D — Fiscal truth
- [ ] Repair → approve → submit SPV → status → Dosar (12.5)
- [ ] Token OAuth2 funcțional

## Gate E — Monitoring truth
- [ ] review_cycles create la fiecare rezolvare
- [ ] Cron verifică due/overdue
- [ ] Finding se redeschide în același cockpit

## Gate F — Partner truth
- [ ] Batch actions funcționale (12.7)
- [ ] Scheduled reports configurabile (12.7)
- [ ] Diana poate opera 12 clienți fără a deschide fiecare individual
