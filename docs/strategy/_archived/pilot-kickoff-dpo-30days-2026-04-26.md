# Pilot CompliScan 30 zile — Kickoff Document

**Pentru**: cabinet DPO care a acceptat pilot după demo
**Trigger**: răspuns post-demo cu 5 întrebări tehnice + propunere pilot 2-3 clienți reali
**Bazat pe**: audit cod 1:1 (`lib/server/audit-pack-bundle.ts`, `lib/server/document-generator.ts`, `app/api/reports/share-token/route.ts`, `lib/server/share-token-store.ts`)
**Tone**: brutal onest — ce face acum vs ce vine în 4-6 săpt

---

## I. Acceptance email — răspuns la cabinetul DPO

```
Subiect: Pilot 30 zile CompliScan — Yes, plus răspunsuri tehnice

Bună [Nume],

Mulțumesc pentru feedback. Apreciez că ai pus exact întrebările
care contează: ce e real vs planificat, audit pack structură,
template-urile tale, reject flow, AI sovereignty.

Răspuns scurt: Da pe pilot. Onest pe ce e real azi.

ATAȘEZ document detaliat cu:

1. Răspuns punctual la cele 5 întrebări (cu cod reference)
2. Matrice REAL vs PLANNED pe 4-6 săptămâni
3. Plan pilot 30 zile — internal-first, 2-3 clienți, 5 scenarii
4. Workaround-uri pentru ce nu e gata încă
5. Criterii decision la 30 zile (continui sau te oprești)

Propunere concretă pentru kickoff:
• 1h call de onboarding personal (eu ghidez setup)
• Tu alegi 2-3 clienți reali (cu acord lor pentru pilot)
• Importăm date prin CSV sau direct pe formular
• Setăm brand cabinet (logo, signatura ta CIPP/E)
• Pornim pe internal-only (portal patron îl activăm doar
  după ce verifici output-uri 1-2 săptămâni)

Două intervale disponibile săptămâna viitoare:
• Marți 10:00-11:00
• Joi 15:00-16:00

Care îți merge?

Cu stimă,
Daniel
CompliScan

──────────────────────────────────────────────────────────
Atașat: pilot-kickoff-dpo-30days-2026-04-26.md
```

---

## II. Răspunsuri punctuale la cele 5 întrebări

### Întrebarea 1: "Ce e real vs planificat?"

**Răspuns onest cu matrix detaliat**:

#### ✅ FUNCȚIONAL în pilot azi (verificat în cod)

| Capability | Status | Code reference |
|---|---|---|
| Portfolio multi-client cu severity scores | ✅ funcțional | `components/compliscan/portfolio-overview-client.tsx` |
| Workspace banner persistent context client | ✅ funcțional | `components/compliscan/v3/workspace-banner.tsx` |
| Cockpit class-aware (3 clase: documentary/operational/specialist) | ✅ funcțional | `lib/compliscan/finding-kernel.ts:104-110` |
| GDPR-001 Privacy Policy generator inline | ✅ funcțional | `lib/compliscan/finding-kernel.ts:988-1004` |
| GDPR-006 RoPA editor cu diff vs versiunea curentă | ✅ funcțional | `app/dashboard/ropa/page.tsx` |
| GDPR-010 DPA + vendor context + adoption tracker | ✅ funcțional | `lib/compliscan/finding-kernel.ts:1066-1078` + `components/compliscan/document-adoption-card.tsx` |
| Magic link share-token spre patron (HMAC-signed, 72h) | ✅ funcțional | `app/api/reports/share-token/route.ts` + `lib/server/share-token-store.ts` |
| Pagina patron `/shared/[token]` brand-uit cabinet | ✅ funcțional | `app/shared/[token]/page.tsx` |
| Document adoption flow (4 stări: reviewed → sent → signed → active) | ✅ funcțional | `lib/compliance/document-adoption.ts` |
| Dosar unified per client | ✅ funcțional | `components/compliscan/dosar-page.tsx` |
| Trust profile public `/trust/[orgId]` | ✅ funcțional | `app/trust/[orgId]/page.tsx` |
| Audit Pack ZIP cu structură (vezi întrebarea 2) | ✅ funcțional | `lib/server/audit-pack-bundle.ts` |

#### ⚠️ PARȚIAL în pilot azi (workaround disponibil)

| Capability | Stat actual | Workaround pentru pilot |
|---|---|---|
| **White-label complet** | Logo + denumire propagat. Email subjects + signaturi parțial. PDF footer 80%. | Manual: îți completez eu config inițial pentru pilot. Branding 100% pe livrabilele primii 2-3 clienți pe care le revizuiezi. |
| **Hash chain audit trail** | Audit log există append-only. Hash chain SHA-256 implementat în `MANIFEST.md` per export. End-to-end verifiable hash chain pe TOATE mutările = post-pilot Sprint 2. | Pentru pilot: MANIFEST.md cu SHA-256 per fișier exportat e suficient pentru ANSPDCP demo. |
| **AI engine** | Gemini 2.5 Flash Lite pe document generation (`lib/server/document-generator.ts:10`). | Suficient pentru drafturi GDPR de bază. Validezi tu CIPP/E. Upgrade Claude Sonnet 4.6 = Sprint 1 (săpt 4-5). |

#### ⏸ NU funcțional încă (planificat pe roadmap)

| Capability | Status | Timeline |
|---|---|---|
| **Stripe billing live** | Tier UI construit, Stripe checkout neactiv | Sprint 2 — săpt 8-10. Pentru pilot 30 zile: gratuit, fără card. |
| **Custom template upload** (folosirea template-urilor cabinetului) | Nu există feature | Sprint 1 — săpt 4-6. Workaround pilot: trimiți template-urile, le importez manual ca starter library. |
| **Reject/comment flow pe magic link** | Există doar "Aprob" pe `/shared/[token]`. Nu există "Am întrebări"/"Nu sunt de acord" cu comment thread. | Sprint 1 — săpt 4-6. Workaround pilot: feedback patron prin email direct cu Diana, comentariu intern în finding. |
| **AI EU-only toggle (Mistral)** | Doar Gemini disponibil. Mistral provider abstraction nu implementat. | Sprint 2 — săpt 7-9. Workaround pilot: dacă ai client banking/healthcare cu sovereignty strict, **disable AI** pe acel client (toggle "AI off" la setări — manual, pe care ți-l implementez prima săptămână). |
| **Hash chain end-to-end pe toate mutările** | Audit log există, dar hash chain peste toate mutațiile nu e bulletproof. | Sprint 2 — săpt 7-9. Pentru pilot: MANIFEST.md per export cu SHA-256 per fișier = suficient. |

**Sumarizare onestă**: în pilot azi ai 80% din funcționalitatea promisă. Restul de 20% (template upload, reject flow, AI EU-only, Stripe live) vine în săpt 4-9 — adică *înainte de finalul pilotului tău de 30 zile*.

---

### Întrebarea 2: "Audit Pack-ul trebuie să fie foarte solid. Nu doar ZIP cu fișiere."

**Răspuns**: structura existentă e ZIP cu directorii separați + manifest semnat SHA-256.

#### Structura Audit Pack ZIP (din `lib/server/audit-pack-bundle.ts`)

```
audit-pack-apex-logistic-2026-04-26.zip
├── README.txt                             — descriere bundle, instrucțiuni audit
├── MANIFEST.md                            — manifest semnat (lista fișiere + SHA-256)
├── MANIFEST.pdf                           — același manifest, PDF brand cabinet
│
├── reports/
│   └── executive-summary.txt              — sumar 1-page pentru auditor
│
├── data/                                  — date structurate, JSON
│   ├── audit-pack-v2-1.json               — full state firmă (snapshot complet)
│   ├── ai-compliance-pack.json            — pack AI Act dedicat
│   ├── traceability-matrix.json           — mapare finding → dovadă → document
│   ├── evidence-ledger.json               — registru complet dovezi cu metadata
│   └── bundle-manifest.json               — manifest tehnic JSON (programatic verifiable)
│
├── evidence/                              — fișierele dovezi efective
│   ├── privacy-policy-v3.pdf
│   ├── dpa-stripe-v4.1.pdf
│   ├── ropa-2026-04.xlsx
│   ├── screenshot-apex-footer-2026-04-24.png
│   └── [toate fișierele atașate la findings rezolvate]
│
└── nis2/                                  — secțiune NIS2 dedicată (când aplicabil)
    ├── nis2-state.json
    ├── incidents.json
    ├── vendors.json
    ├── maturity-assessment.json           — ultima evaluare
    └── board-members.json                 — training board members
```

#### Conținut MANIFEST.md (semnat hash chain)

```markdown
# AUDIT PACK MANIFEST — APEX LOGISTIC SRL
Generat: 2026-04-26 14:32:18 EEST
Generator: DPO Complet (Diana Popescu, CIPP/E #12345)
Period acoperit: 2025-04-01 → 2026-04-26

## Documente incluse + checksums

| File | Type | SHA-256 |
|---|---|---|
| evidence/privacy-policy-v3.pdf       | document | 8f4a2b...d3e9c1 |
| evidence/dpa-stripe-v4.1.pdf         | document | 2c91f8...a4b7e2 |
| evidence/ropa-2026-04.xlsx           | document | e8d3c2...f1b9a4 |
| evidence/screenshot-apex-footer.png  | screenshot | 7b4f1e...a9c2d6 |
| data/audit-pack-v2-1.json            | state | 4a7e2c...b8f3d1 |
| data/traceability-matrix.json        | mapping | 9c2e8b...d5f7a3 |

## Audit trail — ultimele 30 zile

[lista mutațiilor pe findings cu user, timestamp, action, hash]

## Verificare

Token unic: ABCD-1234-EFGH-5678
URL verificare: https://compliscan.ro/verify/ABCD-1234-EFGH-5678
Hash MANIFEST: a1b2c3...d8e9f0
```

#### Pentru pilot — ce testezi

În săpt 3 a pilotului:
1. Pornesti generare Audit Pack pe 1 client real
2. Descarci ZIP, deschizi local
3. Verifici structura
4. Deschizi MANIFEST.md, verifici că SHA-256 corespunde fișierelor
5. Verifici JSON-urile structured (audit-pack-v2-1.json e citibil)
6. Pe 1 fișier: `sha256sum evidence/privacy-policy-v3.pdf` în terminal → trebuie să match-uie hash-ul din MANIFEST.md

**Ce verifici concret**:
- Toate dovezile prezente
- Trasabilitate per finding (din traceability-matrix.json)
- NIS2 state separat (dacă clientul are NIS2 applicability)
- README clar pentru cineva extern

---

### Întrebarea 3: "Aș vrea să testez cu template-urile noastre."

**Răspuns onest**: feature de upload template **NU există încă**. Workaround real pentru pilot:

#### Workaround pentru pilot (operațional, nu tehnic)

**Săpt 1 — Onboarding cu Diana**:
1. Tu trimiti 3-5 din template-urile voastre (Privacy Policy, DPA, ROPA template, DSAR procedure, Cookie policy)
2. Eu (Daniel) le import manual ca **starter library cabinet pe contul tău**
3. Le marchez "Custom DPO Complet template — used as base for AI generation"
4. AI-ul generează drafturi **pe baza template-urilor tale**, nu pe template generic CompliScan
5. Versionate (v1.0 = template tău intact, v1.1 = AI personalize cu date client)

**De ce funcționează ăsta în pilot**:
- 1-time setup, 30 minute la onboarding
- Pentru 2-3 clienți × 5 documente = 15 documente generate
- Toate au baza ta vizibilă în output

**Ce vine post-pilot (Sprint 1, săpt 4-6)**:
- UI upload template în Setări → Templates
- Versioning automat
- Auto-detect placeholders (`{{COMPANY_NAME}}`, `{{CUI}}`, etc.)
- Library shared peste toți clienții cabinetului

**Întrebare către tine**: pentru pilot, poți să-mi trimiți 3-5 template-uri reprezentative la onboarding? Le am importate înainte să intri tu în primul cockpit.

---

### Întrebarea 4: "Cum se comportă produsul când clientul respinge sau comentează?"

**Răspuns onest**: implementarea curentă suportă doar "Aprob" pe magic link. Reject/comment cu thread **NU există încă**.

#### Stat actual pe `/shared/[token]` (din cod)

```
Patron primește email cu link → deschide pagină brand-uit cabinet:

┌──────────────────────────────────────────┐
│ DPO Complet      [logo cabinet Diana]    │
│                                          │
│ APEX LOGISTIC SRL                        │
│ DPA Stripe v4.1                          │
│                                          │
│ [Preview PDF — 8 pagini]                 │
│                                          │
│ [✓ Aprob și semnez]   [Am întrebări]    │
└──────────────────────────────────────────┘
```

**"Aprob"** funcțional: schimbă `documentApprovalStatus` → semnal Diana primește în feed.

**"Am întrebări"** azi: deschide `mailto:` cu emailul Diana pre-completat. NU e thread integrat.

#### Workaround pentru pilot (procesual, nu tehnic)

**Săpt 1-4 pilot**:
1. Patron click "Am întrebări" → email plecat la Diana
2. Diana primește email, intră în cockpit-ul finding-ului
3. Diana adaugă **notă în istoricul finding** ("Patron întreabă X — răspuns Y trimis 2026-04-26 14:32")
4. Diana ajustează draftul, generează nouă versiune (v0.4)
5. Reset adoption status → "trimis spre semnare" → magic link nou la patron

**De ce funcționează ăsta în pilot**:
- Pentru 2-3 clienți, comunicarea email e gestionabilă
- Audit trail există (în istoricul finding-ului)
- Nu rupe flow-ul

**Ce vine post-pilot (Sprint 1, săpt 4-6)**:
- Comment thread direct pe `/shared/[token]`
- 3 acțiuni patron: **Aprob** / **Cer modificări** (cu textarea + tag categorii) / **Resping cu motiv**
- Notificare automată Diana în cockpit cu comentariul
- Versioning automat la patron feedback
- Audit trail integrat (cine ce a zis când)

---

### Întrebarea 5: "Cum gestionezi datele trimise către AI? AI off sau EU-only?"

**Răspuns onest**: opțiuni curente limitate. Pentru pilot, propunere concretă.

#### Stat actual AI

| Capability | Status |
|---|---|
| AI provider activ | **Gemini 2.5 Flash Lite** (Google Cloud) |
| Region | EU (Frankfurt) — Google EU region opt-in |
| Date pleacă din UE? | **NU** — Gemini call rulează în EU region |
| AI off mode (disable per client) | NU implementat ca toggle UI |
| Mistral EU-only alternative | Planificat Sprint 2 (săpt 7-9) |
| Encryption at rest | Da, Supabase managed (Frankfurt) |
| Encryption in transit | Da, TLS 1.3 |

#### Workaround pentru pilot — 2 moduri

**Modul A — AI ON (default pentru pilot)**:
- Gemini EU region
- Drafturi generate pe baza datelor client
- Tu validezi totul ca CIPP/E

**Modul B — AI OFF per client (pentru sensibili)**:
- Eu îți activez manual flag `ai_disabled: true` pe orgId-ul clientului tău în Setări
- Cockpit-ul afișează editor inline manual, FĂRĂ generator AI
- Tu lucrezi din scratch sau pe template-urile tale (vezi întrebarea 3)
- Toate celelalte features funcționează (audit trail, magic links, dosar, etc.)
- Doar **document generation** e disabled

**Implementare workaround**: 1 zi de muncă în săpt 1 a pilotului (eu adaug flag + UI condition). Nu blocant.

#### Ce vine post-pilot (Sprint 2, săpt 7-9)

```
Setări → Plan & AI Sovereignty:

  ◯ Standard (Gemini EU region)               — gratuit
  ◯ EU sovereignty Mistral Large 2 (France)   — +€100/lună
  ◯ AI complet off (manual editor only)       — gratuit, plan compatible

Toggle per client în Workspace settings:
  Client X: ✓ AI on (Gemini)
  Client Y: ✓ AI off (banking sovereignty)
  Client Z: ✓ AI on (Mistral EU sovereignty mode)
```

#### Întrebare critică către tine pentru pilot

> Care din cei 2-3 clienți ai pilotului are sensibility ridicată (banking/healthcare/public)?
>
> Pentru ei activăm Modul B (AI off). Pentru restul Modul A (Gemini EU).
>
> Dacă toți 3 au sensibility ridicată → toți merg pe Modul B și pilot-ul tău validează doar layer-ul cabinet OS, NU AI generation. E un test mai pur, dar pierzi acea capability.

---

## III. Plan pilot 30 zile — concret

### Setup (săpt 0 — kickoff call 1h)

| Pas | Cine | Durată |
|---|---|---|
| Onboarding cabinet (logo, denumire, signatura ta CIPP/E, antet email) | Daniel (eu) | 15 min |
| Import 3-5 template-uri ale tale ca starter library | Daniel | 15 min |
| Creare 2-3 workspace-uri client (CSV import sau manual) | Tu + Daniel | 20 min |
| Configurare AI mode per client (A standard / B off) | Daniel | 5 min |
| Setup intervale de comunicare săptămânale | Tu + Daniel | 5 min |

**La sfârșitul kickoff**: ai contul activ, 2-3 clienți creați, template-urile tale importate, gata să intri în primul cockpit.

### Săpt 1 — INTERNAL ONLY (NU expui portal patron)

**Obiectiv**: validezi output-uri și white-label pe documente generate.

**Activități**:
- Tu intri în primul client → primul finding (Privacy Policy lipsă)
- Generator AI cu template-ul tău
- Editezi, validezi
- **NU trimiți încă magic link** spre patron — descarci PDF
- Verifici: branding corect (logo cabinet, signatura ta, footer), conținut OK
- Repeți pentru 2-3 documente per client

**Decision point săpt 1 sfârșit**:
- ✅ Output-uri OK → activăm magic link patron-facing săpt 2
- ❌ Output-uri NU OK → ajustăm înainte să expunem patronilor

### Săpt 2 — INTERNAL + 1 PATRON real

**Obiectiv**: testezi flow magic link cu 1 patron real (cel mai relaxat din cei 3 clienți).

**Activități**:
- Cel mai cooperant patron primește primul magic link cu DPA Stripe
- Tu monitorizezi: cum se primește email-ul, cum arată brand, cum patron răspunde
- Eventual reject/comment → procesat manual prin email + notă în finding
- 2-3 documente trimise per acest patron

**Decision point săpt 2 sfârșit**:
- ✅ Patron a aprobat fără probleme → extindem la 2-3 patroni săpt 3
- ⚠️ Patron a avut feedback → ajustăm template-uri sau flow

### Săpt 3 — FULL PILOT cu toate cei 2-3 patroni

**Obiectiv**: rulează pilot real cap-coadă pe toate cele 5 scenarii cerute.

**5 Scenarii test** (cele propuse de tine):

```
1. Client cu Privacy Policy lipsă (GDPR-001)
   → Cockpit → generator inline → review → magic link → patron approve → Dosar

2. Client cu RoPA neactualizat (GDPR-006)
   → Cockpit → diff vs versiunea curentă → editor inline → versiune nouă în Dosar

3. DPA / vendor flow (GDPR-010 + Stripe sau alt vendor real)
   → Cockpit → DPA generator + adoption tracker → magic link patron → semnare → Dosar

4. Raport lunar către client
   → Generare automată raport lunar brand-uit cabinet
   → Trimitere email patron cu raport PDF + link trust profile public
   → Track open/read

5. Export Dosar / Audit Pack
   → Generare ZIP cu structura documentată
   → Verificare MANIFEST.md cu SHA-256
   → Verificare evidence/ folder
   → Verificare data/ JSON files
   → Test scenario "vine ANSPDCP la control" — descarc + arăt
```

### Săpt 4 — DECISION GATE

**La sfârșitul săpt 4**, evaluăm împreună:

| Criteriu | Threshold |
|---|---|
| Timp economisit per finding rezolvat | min 30% reducere vs Drive + Word |
| Calitate output documente generate | accepted by you ca CIPP/E în 80%+ cazuri (cu edits) |
| Patron experience pe magic link | min 1 patron a aprobat fără probleme |
| Audit Pack output validitate | structură + manifest verifiable |
| Issues critice descoperite | < 5 blockers majori |
| Willingness to pay €249/lună după pilot | DA / NU clear |

**Outcomes posibile**:

```
✅ Toate 6 criterii pass → Subscription €249/lună (Growth tier)
                          + Te onboardez la Sprint 1 features (template upload,
                          reject flow, Mistral EU) când ies live săpt 4-9.

⚠️ 4-5 criterii pass     → Discuție: ce ajustăm. Posibil pilot extins 30 zile
                          gratuit + Sprint 1 features incluse.

❌ < 4 criterii pass     → No-go. Feedback documented. Tu păstrezi datele tale
                          (export complet la închidere). Eu folosesc feedback
                          pentru roadmap.
```

---

## IV. Date — proprietate, export, închidere pilot

### În timpul pilotului

- **Datele clienților tăi rămân ale tale** — niciun share cu terți
- **Eu am acces tehnic** doar la nivel de admin pentru support (logged audit trail)
- **Backup zilnic** la Supabase EU Frankfurt
- **Tu poți exporta full state** oricând prin Settings → Export data (JSON + ZIP)

### La închiderea pilotului

#### Dacă continui (subscription)

- Continuă fără break, plan Growth €249/lună activ Stripe
- Sprint 1 features se activează gradual ca îmbunătățiri (template upload, reject flow)

#### Dacă te oprești

- Tu primești export complet: ZIP cu toate findings + dovezi + Audit Packs + JSON state
- Datele se șterg din producție în 30 zile (backup retention pentru recovery)
- Acces guest auditor temporar dacă vrei review final cu auditor extern (opțional)
- Niciun lock-in tehnic: poți migra la audatis/Privacy Manager fără probleme

---

## V. Comunicare în pilot — cadență

| Frecvență | Ce | Format |
|---|---|---|
| Daily | Updates async (Slack/email) — issues, întrebări | Text |
| Weekly | 30 min review call | Video |
| Săpt 1 | Daily check-in (primele 5 zile critice) | 15 min text |
| Săpt 4 | 1h decision call cu data review | Video + report |

**Promit response time**:
- Issues critice (blockere): < 4h în zile lucrătoare
- Întrebări non-critice: < 24h
- Feature requests: documentate, prioritizate în roadmap, comunicate în weekly review

---

## VI. Ce promit și ce nu promit

### Ce promit

```
✅ Onboarding personal de mine (Daniel) — 1h call kickoff
✅ Import template-urile tale ca starter library (în săpt 1)
✅ AI off mode pentru clienți sensibili (1 zi muncă în săpt 1)
✅ Daily support primele 5 zile, săptămânal după
✅ Sprint 1 features (template upload, reject flow) live săpt 4-6
   incluse fără cost suplimentar pentru tine
✅ Export complet date la închidere
✅ Audit Pack functional cu MANIFEST.md SHA-256 din săpt 1
✅ Brand-uirea completă a output-urilor pentru cei 2-3 clienți pilot
   (manual unde feature-ul e parțial, ne folosim de timpul tău cu grijă)
```

### Ce NU promit

```
❌ Stripe billing live în pilot (gratuit 30 zile, Stripe activ Sprint 2)
❌ Reject/comment flow integrat pe magic link (workaround email)
❌ Mistral EU-only AI provider (workaround AI off)
❌ Hash chain end-to-end pe TOATE mutările (MANIFEST SHA-256 e suficient pentru pilot)
❌ Custom template upload UI (workaround manual import)
❌ Rezolvare instantă pentru 100% issues — promit best-effort
❌ Migrare automată din alte tools (audatis, Privacy Manager) — manual în pilot
```

---

## VII. Întrebări de la mine pentru tine (înainte de kickoff call)

Ca să accelerez setup-ul:

1. **Cele 2-3 firme client pilot**: nume, sector, mărime aprox, framework primar (GDPR / +NIS2 / +AI Act)?

2. **Template-uri** — îmi trimiți pe email/Drive 3-5 documente reprezentative din ce folosești azi:
   - Privacy Policy (versiunea ta cabinet)
   - DPA template
   - RoPA structura
   - DSAR procedure
   - Optional: Cookie policy, Breach notification, Vendor questionnaire

3. **AI sensitivity per client**:
   - Client 1: AI ON (standard) sau AI OFF (sovereignty)?
   - Client 2: același
   - Client 3: același

4. **Brand cabinet asset-uri**:
   - Logo (PNG/SVG)
   - Culoare accent (hex)
   - Antet email (text + signature)
   - Footer legal (cabinet CUI, DPO certified, IAPP credentials)

5. **Acord clienți**: ai semnături/acord de la cei 2-3 patroni pilot că datele lor pot fi în CompliScan pentru testare 30 zile? Sau preferi să folosim **date pseudonimizate** (CUI fictiv, nume fictive, date reale procese)?

---

## VIII. Single line summary pilot

```
30 zile gratuit · 2-3 clienți reali · internal-first săpt 1 · magic links săpt 2-3 ·
decision gate săpt 4 · 80% feature coverage real, 20% workaround documented ·
AI EU region default, AI off optional, Mistral EU în Sprint 2 ·
Audit Pack ZIP cu MANIFEST.md SHA-256 verifiable ·
template-urile tale = starter library de la zi 1 ·
template upload UI + reject flow + Mistral EU live în săpt 4-9 ·
export complet la închidere · niciun lock-in tehnic
```

---

**Document creat**: 26 aprilie 2026
**Status**: gata de trimis la cabinet DPO post-demo
**Bazat pe**: audit cod 1:1 (audit-pack-bundle.ts, document-generator.ts, share-token-store.ts, finding-kernel.ts) + roadmap Sprint 1-2 din v1-final-spec
**Update**: după primul kickoff call, învățăturile se sintetizează în `pilot-learnings-2026-XX-XX.md`
