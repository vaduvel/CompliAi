# CompliScan Fiscal — Execution Bible V1.2 (2026-05-14)

> **Status:** APROBAT CU MODIFICĂRI — READY FOR SPRINT 1
> **Versiune:** V1.2 (consolidare V1.0 + V1.1 patch + Opus critique)
> **Validare:** 7 rapoarte cercetare + 130+ surse + 2 review-uri critice integrate
> **Predecesor:** `compliscan-fiscal-execution-bible-2026-05-14.md` (V1.0 — deprecated)

---

## 0. Ce s-a schimbat vs V1.0 (15 corecții critice)

### 🟥 Halucinații periculoase ELIMINATE

1. **Scoring "500 pct max universal"** → **500 pct e DOAR pentru TVA rambursări** (Fișa Anexa 2). Scoringul fiscal general ANAF NU e public.
2. **Rate limit "1000/min global"** → **doar global 1000/min confirmat**; rest = config DB, NU hardcodat.
3. **Cross-cabinet Network Detection ML la luna 6** → mutat la **Year 2** (necesită 20+ cabinete + GDPR data sharing agreement).
4. **Cross-ERP "bidirectional 4 ERP-uri"** → fazat: SmartBill+Oblio API read-only luna 6-9, SAGA+WinMentor upload manual luna 9-12, bidirectional doar dacă T&C permit luna 18+.
5. **"APIC NU APOLODOR"** → corect: "APOLODOR, componentă APIC/Big-data". NU pretindem replicare.

### 🟧 Promisiuni optimiste RECTIFICATE

6. **Timeline "9 luni la 200 cabinete"** → **12-15 luni solo + 1 helper part-time** la 50-100 cabinete plătitoare.
7. **ARR "1.245.000 RON luna 9"** → realist: **120-240K RON luna 9**, 400-800K luna 18, 1-2M luna 24.
8. **Cost legal "0 RON upfront"** → realist: **€2-5K** avocat tech RO + €500-1.500/an E&O insurance.
9. **"30 min time-to-value onboarding"** → realist: **5-15 zile** (integrări SAGA + ANAF SPV durează zile, nu minute).
10. **Feature flag e-TVA OUG 13/2026** → severity reduce din `automatic_notice_risk` în `analytical_risk`.

### 🟨 Naming + Legal HARDENED

11. **Nume produs:** rămâne **CompliScan Fiscal**. Modul public: **Risk Mirror** sau **Fiscal Risk Mirror** (NU "ANAF Mirror" oficial). Nume intern cod: `anaf_mirror`.
12. **Copy interzis:** "Scor ANAF", "scor oficial", "replică exactă", "garantăm că nu iei control".
13. **OPANAF 1826/2372/2025:** namespace separat `excise_high_risk_operators`, NU aplicat generic la SRL-uri normale.
14. **Threshold ">250 pct = risc mare"** → marcat `internal_interpretation`, NU `official_threshold`.

### 🟩 Adăugări STRUCTURALE (din V1.1 patch)

15. **Sprint 1 include obligatoriu:** Rules Registry YAML + Feedback module + Security baseline + CECCAR pilot pack (NU "mai târziu").

---

## I. IDENTITATE PRODUS (V1.2 corectată)

### Nume + naming policy
- **Produs:** **CompliScan Fiscal**
- **Modul public:** **Risk Mirror** (sau "Fiscal Risk Mirror")
- **Modul intern cod:** `anaf_mirror`
- **Slogan permis:** *"Cum te-ar vedea ANAF pe baza regulilor publice și a datelor tale."*
- **Slogan interzis:** ❌ "Vezi-te prin ochii ANAF" (prea agresiv), ❌ "Scor ANAF", ❌ "Replică APIC", ❌ "Garantăm fără control"

### Categoria
**Sistem intern de control fiscal preventiv, explicabil, bazat pe reguli publice + datele cabinetului.**

NU "oglindă ANAF". NU "scor oficial". Comercial vandabil + juridic defensibil.

### Persona (validată empiric)
- Maria Ionescu, 42 ani, CECCAR, Brașov, 30-150 clienți
- Validare: post Pirvu Nicoleta 14 mai 2026 (Regula DUK 98)
- Sursa: `docs/persona-contabil-roman-2026.md`

### Pricing (păstrat)
| Plan | Preț/lună | Cap clienți |
|---|---|---|
| Mirror Basic | 299 RON | <25 |
| Mirror Pro | 599 RON | 25-80 (sweet spot Maria 78) |
| Mirror Expert | 999 RON | 80-150 |
| Audit Pack Add-on | 199 RON/client | High-risk |

**ROI realist:** 1 control evitat (25-100K RON) = 42-167 luni abonament Pro. Vinde-se ca "asigurare", NU "garantăm evitare control".

---

## II. ARHITECTURĂ TEHNICĂ (V1.2 corectată)

### Stack păstrat
- Next.js 15 + Supabase EU (Frankfurt) + Vercel EU (Frankfurt)
- TypeScript + Tailwind + shadcn/ui

### Rate limits ANAF — config în DB, NU hardcodat

```sql
create table anaf_rate_limits (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  scope text not null, -- global | per_cif | per_message | per_token
  limit_count integer not null,
  window_seconds integer not null,
  source_url text,
  source_version text,
  effective_from date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

**Default inițial (singurul confirmat):**
```yaml
anaf_rate_limits:
  - endpoint: "api.anaf.ro/*"
    scope: "global"
    limit_count: 1000
    window_seconds: 60
    source: "ANAF OAuth procedure (verbal/empirical)"
    note: "Test empiric obligatoriu înainte de production deployment"
```

**Limite per endpoint** (1000/zi upload, 100/zi stareMesaj, 10/zi descarcare) — citite din `limiteApeluriAPI.txt` ANAF la deploy, NU hardcodate.

### Security baseline (V1.1 patch integrat)

```yaml
security_baseline:
  hosting_region: EU
  database: Supabase EU
  transport_encryption: TLS 1.3
  storage_encryption: AES-256
  token_storage: separate vault table (anaf_tokens, encrypted bytea)
  tenant_isolation: Row Level Security by cabinet_id
  audit_log: append_only (audit_events table)
  backups: encrypted
  secrets: env + KMS, never in DB plaintext
  retention:
    fiscal_documents: 5_years_default
    audit_logs: 7_years
    magic_link_uploads: same_as_related_client
    raw_spv_documents: configurable_per_cabinet
    deleted_account: hard_delete_after_30_days_unless_legal_hold
```

### Tabele Sprint 1 obligatorii

```sql
-- Rules registry
create table rules_registry (
  id text primary key,
  version text not null,
  category text not null,
  status text not null, -- draft | testing | active | needs_review | deprecated
  yaml text not null,
  hash text not null,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rule evaluations (results per finding)
create table rule_evaluations (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null,
  client_id uuid not null,
  rule_id text not null,
  rule_version text not null,
  source_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

-- Feedback per finding
create table rule_feedback (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null,
  client_id uuid not null,
  finding_id uuid not null,
  rule_id text not null,
  feedback_type text not null, -- confirmed_risk | false_positive | already_fixed | accepted_risk | insufficient_data | threshold_too_aggressive | threshold_too_relaxed | wrong_explanation | missing_action
  comment text,
  submitted_by uuid not null,
  created_at timestamptz not null default now()
);

-- Public fiscal cases (pentru extragere reguli noi)
create table public_fiscal_cases (
  id uuid primary key default gen_random_uuid(),
  source_type text not null, -- anaf_decision | court_case | tax_alert | forum | expert_article
  source_url text not null,
  source_title text,
  published_at date,
  taxpayer_type text,
  sector text,
  issue_summary text not null,
  anaf_flag text,
  finding text,
  sanction_amount numeric,
  tax_difference numeric,
  outcome text,
  extracted_rules jsonb not null default '[]'::jsonb,
  evidence_quality text not null default 'medium',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ANAF tokens criptați
create table anaf_tokens (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null,
  token_ciphertext bytea not null,
  refresh_token_ciphertext bytea not null,
  expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  certificate_serial text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table anaf_tokens enable row level security;

-- Audit log append-only
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null,
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id text,
  ip inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

---

## III. MOTOR REGULI YAML (V1.1 patch integrat)

### Structură fișier YAML

```yaml
id: C001
version: 2026.03.09
status: active
category: cross_correlation
name: D300 vs P300 difference (analytical post OUG 13/2026)
legal_basis:
  - title: RO e-TVA brochure 2025
    url: https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/BrosuraRoeTVA2025.pdf
    note: |
      Prag 20% + 5.000 lei. După OUG 13/2026 (MO 181/09.03.2026)
      tratat ca risc analitic, NU notificare automată legală.
required_inputs:
  - d300.xml
  - p300.xml
condition:
  type: all
  rules:
    - left: abs(d300.tva_total - p300.tva_total)
      operator: ">="
      right: 5000
    - left: abs(d300.tva_total - p300.tva_total) / max(abs(p300.tva_total), 1)
      operator: ">="
      right: 0.20
weight: 10
severity: high
messages:
  ro:
    title: Diferență semnificativă D300 ↔ P300
    explanation: |
      TVA din D300 diferă semnificativ de P300 precompletat.
      După OUG 13/2026, diferența NU mai declanșează notificare
      conformare automată, dar rămâne risc analitic intern ANAF.
    action: Reconciliază facturile din e-Factura/SPV cu jurnalul de TVA înainte de depunere.
feature_flags:
  after_oug_13_2026:
    legal_trigger: false
    analytical_trigger: true
```

### Evaluator TypeScript minimal

```typescript
export type RuleResult = {
  ruleId: string;
  ruleVersion: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  message: string;
  action: string;
};

export async function evaluateRule(
  rule: ParsedYamlRule,
  context: RuleContext
): Promise<RuleResult> {
  const passed = evaluateCondition(rule.condition, context);

  return {
    ruleId: rule.id,
    ruleVersion: rule.version,
    passed,
    severity: passed ? rule.severity : 'low',
    weight: passed ? rule.weight : 0,
    message: passed ? rule.messages.ro.explanation : '',
    action: passed ? rule.messages.ro.action : '',
  };
}
```

### Acceptanță motor reguli

- ✅ Orice prag se poate modifica fără redeploy (YAML hot-reload)
- ✅ Fiecare regulă are version + source_hash
- ✅ Fiecare finding știe ce versiune de regulă l-a generat
- ✅ Re-rulare istoric cu versiuni vechi sau noi posibilă
- ✅ Regulile draft testate înainte de active (false positive rate <30%)

---

## IV. MODUL FEEDBACK UTILIZATORI (V1.1 patch integrat)

### 9 tipuri feedback

```yaml
feedback_types:
  - confirmed_risk         # alerta a fost reală
  - false_positive         # alerta a fost greșită
  - already_fixed          # problema era deja rezolvată
  - accepted_risk          # știu, accept riscul
  - insufficient_data      # datele sunt incomplete
  - threshold_too_aggressive  # pragul triggerează prea des
  - threshold_too_relaxed     # pragul ratează cazuri reale
  - wrong_explanation      # explicația e neclară
  - missing_action         # nu e clar ce să fac
```

### UI în finding drawer

```
A fost utilă alerta?
[Da, risc real] [Nu, fals pozitiv] [Am rezolvat deja] [Date insuficiente]

Comentariu opțional:
[________________________________________]

[Trimite feedback]
```

### Regula de învățare automată

```
Dacă o regulă are >40% false_positive în ultimele 100 execuții:
  - status = needs_review
  - apare în Admin Rule Review Queue
  - NU se dezactivează automat
  - cere aprobare umană
```

### API routes Sprint 1

```typescript
POST /api/rules/feedback          // utilizator trimite feedback
GET  /api/rules/feedback?ruleId=  // istoricul feedback per regulă
GET  /api/admin/rules/fpr         // false positive rate per regulă
```

---

## V. CELE 13 FUNCȚIONALITĂȚI — V1.2 corectate

### Feature 1: Risk Mirror Score 0-100 (REFRAMED)

**CE FACE:**
Calculează scor de risc fiscal **dual transparent** per firmă:
- **Mirror Score** (0-100, CompliScan, explicabil, INTERN)
- **Public Indicators Points** (0-500 pct DOAR pentru TVA rambursări) — marker `internal_interpretation`, NU `official_threshold`

**DISCLAIMER OBLIGATORIU UI:**
> *"Punctaj calculat din Fișa indicatorilor de risc fiscal (Anexa 2 OMFP 532/2007) — aplicabil pentru contextul rambursărilor TVA. Pragurile de interpretare (>250 = risc mare) sunt interne CompliScan și NU reprezintă clasificarea oficială ANAF/APIC. Scoringul fiscal general ANAF nu este public."*

**Surse empirice rectificate:**
- ✅ Fișa indicatorilor risc fiscal — confirmat oficial, scope TVA rambursări
- ⚠️ **NU este algoritm general ANAF** (corecție Opus critique)
- ✅ Maxim ~500 pct **pe segment TVA rambursări** (NU universal)
- ❌ ANAF NU publică scoringul fiscal general — APOLODOR/APIC = clasificat

### Feature 2: Audit Pack ZIP CECCAR

**Schimbări vs V1.0:**
- Opinion CECCAR = **opțional**, semnat de cabinet propriu sau expert nostru contra cost 500 RON/opinion
- Manifest = SHA-256 hash per fișier (audit-grade cryptographic)
- ZIP timestamp RFC 3161

**Rămâne blue ocean confirmat.**

### Feature 3: Cross-cabinet Network Detection → ❌ MUTAT YEAR 2

**De ce mutat:**
- Necesită 20+ cabinete pilot (imposibil luna 6)
- GDPR data sharing agreement complex (legal cost extra)
- ML training pe <20 cabinete = insufficient
- "APIC SNA-style" replicare = speculație (ANAF nu publică algoritm)

**Înlocuit cu:** **Pattern Detection intra-cabinet** — același furnizor toxic la mai mulți clienți ai aceluiași cabinet. Network effect intra-tenant, NU cross-tenant.

### Feature 4: Certificate Vault — păstrat

Quick-win blue ocean confirmat. Niciun risc legal sau timeline.

### Feature 5: What-if Mode — păstrat

Disclaimer: *"Estimare. Rezultat real depinde de aprobare ANAF."*

### Feature 6: Cross-correlation 8 reguli — fazat

**Faza 1 (luna 1-3):** Reguli oficiale Latitude-equivalent (D300/D394/D390/D205/D100)
**Faza 2 (luna 4-6):** Reguli extinse (D205↔AGA, D406↔Bilanț, AGA↔ONRC)
**Faza 3 (luna 7+):** Calibrare pe pilot

### Feature 7: D300 ↔ P300 Reconciler — REFRAMED post-OUG 13/2026

```yaml
id: C001
legal_status: analytical_after_oug_13_2026
severity: high
disclaimer: "După OUG 13/2026, diferența NU declanșează notificare automată. Rămâne risc analitic intern ANAF."
```

**Vânzare:** *"Detectăm discrepanțe P300 înainte să devină risc de analiză/control"* — NU *"evităm notificarea automată"*.

### Feature 8: Workflow magic link audit-grade — păstrat

Diferențiere: timestamp criptografic + opinion CECCAR opțional + cross-ref declarații.

### Feature 9: Burden Index integrat — păstrat

Meta-feature cross-stack cu Risk Score + Workflow + Pattern Detection (NU cross-cabinet).

### Feature 10: Citire SPV — păstrat (foundation)

### Feature 11: Cross-ERP — FAZAT ONEST

**Faza 1 (luna 6-9):** **SmartBill + Oblio API read-only** (4-6 săpt)
**Faza 2 (luna 9-12):** **SAGA + WinMentor upload manual XML/CSV** (4-6 săpt)
**Faza 3 (luna 18+):** **Bidirectional doar dacă T&C ERP-uri permit** (necesită review legal SAGA/WinMentor)

**Renunțăm la "bidirectional 4 ERP-uri în 9 luni"** = imposibil solo.

### Feature 12: Calendar fiscal — păstrat foundation

### Feature 13: SAF-T 33 teste + DUKIntegrator rules — păstrat

Important: include **Regula DUK 98** (Sold TVA precedent eronat) validată post Pirvu Nicoleta 14 mai 2026.

---

## VI. PRICING & ARR (V1.2 realist)

### Pricing păstrat
- Basic 299 / Pro 599 / Expert 999 + Audit Pack 199/client

**Sau opțiune accelerare adoption:** 199/499/899 RON (consideră dacă conversia e prea lentă în pilot)

### ARR realist (RECTIFICAT)

| Luna | Cabinete plătitoare | MRR | ARR cumulativ |
|---|---|---|---|
| 3 | 0 (build mode) | 0 | 0 |
| 6 | 2-5 (early pilots) | 1.500-3.000 RON | 18-36K RON |
| 9 | 10-20 | 6.000-12.000 RON | **120-240K RON** |
| 12 | 25-40 | 15.000-24.000 RON | 280-450K RON |
| 18 | 50-100 | 30.000-60.000 RON | **400-800K RON** |
| 24 | 100-200 | 60.000-120.000 RON | **1-2M RON** |

**NU 1.245.000 RON luna 9.** Realitate piață RO cabinete CECCAR.

### Conversie funnel realist

- Pilot gratuit → plătitor: 20-30% (NU 100%)
- Decision cycle cabinet CECCAR: 6-18 luni
- Pricing 599 RON = aproape de pragul psihologic "prea scump"
- Necesită ROI dovedit (controale evitate documentate)

---

## VII. LEGAL & COMPLIANCE (V1.2 realist)

### Cost legal upfront RECTIFICAT

❌ V1.0: 0 RON
✅ V1.2: **€2-5K**

**Detaliu:**
- Avocat tech RO review T&C + Privacy Policy + DPA: €1.500-3.000
- Setup contract template B2B: €500-1.000
- E&O insurance basic pentru SaaS solo: **€500-1.500/an**

### E&O Insurance plan

Necesar pentru că:
- Promitem 75-90% accuracy
- Dacă un cabinet pierde €100K din scor greșit → posibilă proces
- Disclaimer nu protejează 100%
- E&O standard pentru SaaS B2B

### Crisis plan dacă ANAF cere clarificare

```yaml
crisis_plan:
  trigger: ANAF formal request clarification on marketing
  immediate_action:
    - scoate copy agresiv ("Vezi-te prin ochii ANAF")
    - păstrează doar disclaimer
    - răspuns formal: "Instrument de control intern, bazat exclusiv pe reguli publice"
  legal_response:
    - consultă avocat tech RO
    - documentează ce reguli publice sunt baza
    - oferă ANAF acces demo dacă cer
  worst_case:
    - rebrand "Risk Mirror" → "Fiscal Compliance Checker"
    - elimină orice referință "ANAF" din nume feature
```

### Naming policy hardened

- ✅ "CompliScan Fiscal" (produs)
- ✅ "Risk Mirror" / "Fiscal Risk Mirror" (modul public)
- ✅ "Cum te-ar vedea ANAF pe baza regulilor publice" (copy permis)
- ❌ "ANAF Mirror" (nume oficial — risc cease & desist)
- ❌ "Scor ANAF" / "scor oficial" (înșelăciune)
- ❌ "Replică APIC/APOLODOR" (speculație)
- ❌ "Garantăm că nu iei control" (promisiune juridică)

### OPANAF 1826/2372/2025 — namespace separat

```yaml
namespace: excise_high_risk_operators
applies_to:
  - caen_or_activity: accize
  - authorizations: alcohol_tobacco_energy_products
  - special_cases_only: true
default_state: not_applied_to_general_srl
```

**NU se aplică generic la SRL-urile normale Maria.** Doar contextual modifier dacă clientul are CAEN accize.

---

## VIII. ROADMAP REALIST (V1.2 — 15-18 luni, NU 9)

### Sprint 1 (zilele 1-14) — Foundation + Security Baseline
**Epic-uri obligatorii (V1.1 patch):**

#### Epic 1 — Rules Registry
- [ ] Tabele DB: `rules_registry`, `rule_evaluations`, `rule_feedback`, `public_fiscal_cases`
- [ ] YAML loader din `/rules/*.yaml`
- [ ] Hot-reload reguli fără redeploy
- [ ] Versioning + source_hash per finding

#### Epic 2 — C001 D300/P300
- [ ] Rule C001 cu prag 20% + 5.000 lei
- [ ] Feature flag `after_oug_13_2026: analytical_only`
- [ ] UI disclaimer prominent
- [ ] Reconciler basic (upload manual XML)

#### Epic 3 — Feedback Module
- [ ] UI butoane feedback în finding drawer
- [ ] DB save feedback
- [ ] Admin endpoint FPR per rule
- [ ] Auto-flag `needs_review` la >40% FPR

#### Epic 4 — Security Baseline
- [ ] RLS activ pe toate tabelele fiscale
- [ ] Tokenuri ANAF criptați (bytea + KMS)
- [ ] Audit log append-only
- [ ] Test RLS: cabinet A NU vede cabinet B

#### Epic 5 — CECCAR Pilot Pack
- [ ] Landing page pentru pilot
- [ ] Email template CECCAR (din V1.1 patch)
- [ ] Form pilot application
- [ ] Feedback survey post-pilot

### Sprint 2-3 (luna 1-2) — UI + SAF-T
- Component `<RiskMirrorScore />` cu dual display + disclaimer
- Engine SAF-T 33 teste
- DUKIntegrator wrapper
- Regula DUK 98 explicit

### Sprint 4-5 (luna 3-4) — Audit Pack + Workflow
- Audit Pack generator MVP
- Workflow cereri magic link audit-grade
- Certificate Vault refactor

### Sprint 6-8 (luna 5-7) — Cross-correlation extins + Pilot recrutare
- Cross-correlation 8 reguli (faza 1+2)
- What-if Mode refactor
- Burden Index integrat
- Recrutare 5-10 cabinete pilot prin grupuri FB
- Onboarding flow realist 5-15 zile

### Sprint 9-11 (luna 8-10) — Cross-ERP API + Iterație pilot
- SmartBill API integration (read-only)
- Oblio API integration (read-only)
- Calibrare ponderi pe feedback pilot
- Fix bugs din pilot

### Sprint 12-13 (luna 11-12) — Cross-ERP manual + Scale
- SAGA XML upload manual
- WinMentor CSV upload manual
- Scale la 25-40 cabinete pilot
- Pattern Detection intra-cabinet v1

### Sprint 14-15 (luna 13-15) — Public Launch + Content Marketing
- Public landing
- Content marketing (blog + YouTube)
- Tax alerts integration
- Scale 50+ cabinete

### Roadmap Year 2 (luna 16-24)
- Cross-cabinet Network Detection (după 50+ cabinete + GDPR agreement)
- Cross-ERP bidirectional (după T&C review SAGA/WinMentor)
- ML calibrare avansată
- Expansion: 100-200 cabinete

---

## IX. SUPORT TEHNIC & UPTIME (V1.2 — adăugat din Opus)

### Plan uptime
- Target SLA: 99.5% (Supabase + Vercel standard) = ~4h downtime/lună
- **Risc critic:** zilele 24-25 ale lunii (peak depunere D300)
- **Plan B obligatoriu:**
  - Export local zilnic (pentru continuitate manuală)
  - Alertă proactivă "suntem down" via SMS + email
  - Status page public (compliscan.status.ro)
  - Comunicare cabinete pre-downtime planificat

### Customer success realist
- Onboarding 1 cabinet pilot: **5-15 zile efectiv** (NU 30 min)
  - Day 1-3: Setup cont + DPA + branding
  - Day 4-7: Connect ANAF SPV + verificare token
  - Day 8-12: Import clienți + connect ERP (mai ales SAGA — durează)
  - Day 13-15: Primul Risk Score + tutorial
- Customer Success Manager part-time obligatoriu de la luna 6+

---

## X. VALIDATION CHECKLIST V1.2

### Înainte de Sprint 1 — TODO obligatoriu

- [ ] **Test empiric rate limit ANAF** — sună suport ANAF SAU testează cu 1 cont real, document rezultat
- [ ] **Contact avocat tech RO** — review T&C + Privacy + DPA (cost €1.500-3.000)
- [ ] **Quote E&O insurance** — pentru SaaS solo (€500-1.500/an)
- [ ] **Review T&C SAGA + WinMentor** — verifică dacă acces API/reverse engineering e permis
- [ ] **Decide naming final** — "Risk Mirror" vs "Fiscal Risk Mirror" (focus grupul FB?)
- [ ] **Validate pricing cu 3 cabinete CECCAR** — sondaj informal: "599 RON e prea scump?"

### Reguli draft testate înainte de active

- False positive rate <30% pe dataset istoric (înainte de a marca `active`)
- Minimum 100 execuții per regulă pentru validare statistică

### CECCAR pilot acceptanță

- Minimum 5 cabinete pilot
- Minimum 100 firme analizate
- Minimum 300 feedback-uri pe reguli
- False positive rate <30% pentru top 20 reguli
- Minimum 3 experți CECCAR dispuși să ofere testimonial

---

## XI. VERDICT FINAL V1.2

**APROBAT PENTRU SPRINT 1** cu următoarele condiții obligatorii:

1. ✅ Naming: "CompliScan Fiscal" + modul "Risk Mirror" (NU "ANAF Mirror" oficial)
2. ✅ D300/P300 = risc analitic post-OUG 13/2026, NU trigger legal
3. ✅ Rate limits = config DB + test empiric obligatoriu
4. ✅ APIC = "APOLODOR componentă APIC/Big-data" (NU "APIC NU APOLODOR")
5. ✅ OPANAF 1826/2372/2025 = namespace separat excise, NU generic
6. ✅ Scoring = "Mirror" + "Public Indicators 0-500 pct" cu disclaimer "TVA rambursări specific, NU general"
7. ✅ Timeline 15-18 luni (NU 9)
8. ✅ ARR realist 120-240K luna 9, 1-2M luna 24 (NU 1.25M luna 9)
9. ✅ Cost legal €2-5K + €500-1.500/an E&O (NU 0 RON)
10. ✅ Cross-ERP fazat (API → manual → bidirectional 18+)
11. ✅ Network Detection → Year 2 (NU luna 6)
12. ✅ Sprint 1 obligatoriu: Rules Registry + Feedback + Security + CECCAR pilot pack
13. ✅ Crisis plan dacă ANAF cere clarificare
14. ✅ Plan B uptime pentru zilele 24-25
15. ✅ Customer success: onboarding 5-15 zile realist (NU 30 min)

---

## XII. ÎN UN PARAGRAF (V1.2)

CompliScan Fiscal este un **sistem intern de control fiscal preventiv** pentru cabinete CECCAR cu 30-150 clienți, care **rulează local regulile publice ANAF** (Cod Fiscal + OPANAF + Fișa indicatorilor + 33 teste SAF-T + reguli DUKIntegrator) pe datele cabinetului pentru a **identifica preventiv neconformitățile** înainte ca ANAF să le detecteze. **NU pretindem replicarea scoringului intern APIC/APOLODOR** (clasificat ANAF). **Vindem instrument explicabil + audit defense + workflow eficient.** **13 funcționalități organizate în 4 piloni + 4 engine signals + 4 foundation + 1 pattern detection intra-cabinet.** **Pricing 299/599/999 RON/lună + 199 add-on.** **Timeline realist 15-18 luni** la 50-100 cabinete plătitoare = **400-800K RON ARR luna 18**. **Cost upfront €2-5K legal + €500-1.500/an E&O insurance.** **Cross-ERP fazat:** SmartBill+Oblio API (luna 6-9), SAGA+WinMentor manual (9-12), bidirectional doar T&C-permitted (18+). **Network Detection cross-cabinet → Year 2** (necesită 20+ cabinete + GDPR agreement). **Slogan:** *"Cum te-ar vedea ANAF pe baza regulilor publice și a datelor tale."* **NU "Vezi-te prin ochii ANAF"** (prea agresiv juridic).

---

*Document V1.2 creat 2026-05-14 17:30 EET. Integrare V1.0 + V1.1 patch + Opus critique. Aprobat pentru Sprint 1 după bifare TODO obligatoriu validation checklist (XII).*
