# Test scenarios DPO Complet — pilot 30 zile (7 mai → 5 iunie 2026)

**Folosit de**: Diana Popescu (DPO Complet) în săpt 1-4 pilot
**Scop**: 5 scenarii concrete de testare end-to-end, cu acceptance criteria + expected outcomes
**Trimis Diana**: la kickoff Joi 7 mai (slide 5 din demo deck)
**Update zilnic**: founder marchează `[x]` la done items pe Slack

---

## TL;DR

5 scenarii distribuite în 4 săptămâni pilot. Fiecare scenariu = 1 milestone validabil empiric. La final pilot (5 iunie retro), Diana confirmă ce funcționează / ce nu / ce ar plăti.

| Săpt | Scenariu | Trigger | Expected outcome |
|---|---|---|---|
| 1 (7-13 mai) | **Setup brand + first document internal** | Diana setup cabinet + add 1 client + generat Privacy Policy | Document `signed` fără magic link, Audit trail complet |
| 2 (14-20 mai) | **Audit Pack ZIP download + verify SHA-256** | Diana export Audit Pack pentru 1 client + verifică structura local | ZIP unzip OK, SHA-256 hash chain match, MANIFEST.md corect |
| 3 (21-27 mai) | **Magic link patron real + Aprob flow** | Diana trimite magic link la patron real cooperant + obține aprobare | Document `signed via magic link`, alert in-app cabinet, audit trail |
| 4 (28 mai - 4 iun) | **Drift detection + reopen case** | Cabinet adaugă vendor nou la 1 client → trigger drift → finding redeschis | Finding `active` redeschis cu motivare + history snapshot |
| Continuous | **AI OFF per client sensibil (Cobalt)** | Diana setează AI OFF pentru Cobalt → generat document cu template only | Document generat fără call la AI provider, footer cabinet, status DRAFT |

---

## Scenariul 1 — Setup brand + first document internal (Săpt 1, 7-13 mai)

**Trigger**: Diana primul login post-kickoff (8 mai joi dimineața).

**Steps**:
1. Diana login `localhost:3010/login` cu credentials cabinet
2. Onboarding wizard:
   - Step 1: confirm brand cabinet (logo DPO Complet, color cobalt, signature Diana)
   - Step 2: add first client — alege "Apex Logistic SRL" (din 3 demo) sau add real client cu CUI prefill ANAF
   - Step 3: demo data seed activat → 3 findings create automat (GDPR-001, GDPR-006, GDPR-010)
3. Navigate `/dashboard/portfolio` — vede 1 client (Apex)
4. Click Apex → workspace cu banner cabinet
5. Click GDPR-001 Privacy Policy lipsă → cockpit
6. Click "Generează draft Privacy Policy" → AI Gemini EU generează draft (~30 sec)
7. Diana citește draft, editează inline 1-2 paragrafe
8. Click "Marchează revizuit intern" → status `reviewed_internally`
9. Click "Marchează semnat" (NU magic link încă, doar manual sign-off intern)
10. Document apare în Dosar Apex cu adoption status `signed`

**Expected outcome**:
- ✅ Brand cabinet propagat: logo + nume + color în UI peste tot
- ✅ Document footer cu Diana name + cert + email + phone (NU disclaimer toxic)
- ✅ Audit trail complet în events ledger
- ✅ Document apare în Dosar Apex
- ✅ Workspace context (banner) NU dispare la nicio acțiune

**Acceptance criteria** (verifică Diana):
- [ ] Logo DPO Complet vizibil top-left în toate UI-ul
- [ ] Footer document conține "Diana Popescu, DPO / Privacy Consultant · CIPP/E #12345"
- [ ] Status DRAFT explicit până la "Marchează semnat"
- [ ] Audit Pack ZIP download afișează cabinet + Apex Logistic în MANIFEST.md (NU "Workspace local")

**Dacă fails**:
- Brand NU propagat → Sprint 0 Bug 1 regression, founder fix urgent
- Disclaimer toxic apare → Sprint 0 Bug 2 regression
- Document NU intră în Dosar → bug data persistence

**Done When**: Diana confirmă pe Slack "primul document signed în Dosar Apex" + screenshot.

**ETA Diana effort**: 30 min explorare (brand + add client) + 15 min cockpit + 5 min Dosar verify = **50 min total**.

---

## Scenariul 2 — Audit Pack ZIP download + verify SHA-256 (Săpt 2, 14-20 mai)

**Trigger**: Diana vrea să verifice că Audit Pack e ANSPDCP-ready înainte de a-l trimite oricărui patron.

**Steps**:
1. Navigate `/dashboard/[apex]/audit-pack`
2. Click "Export Audit Pack ZIP" → download `audit-pack-apex-logistic-srl-{date}.zip`
3. Diana unzip local: `unzip audit-pack-apex-logistic-srl-{date}.zip -d /tmp/audit-pack/`
4. Check structure:
   ```
   audit-pack-apex-logistic-srl-{date}/
   ├── README.txt
   ├── MANIFEST.md
   ├── data/
   │   ├── audit-pack-v2-1.json
   │   ├── ai-compliance-pack.json
   │   ├── traceability-matrix.json
   │   ├── evidence-ledger.json
   │   └── bundle-manifest.json
   ├── reports/
   │   ├── audit-pack-client-*.html
   │   ├── annex-iv-lite-*.html
   │   └── executive-summary.txt
   ├── nis2/
   │   ├── assessment.json
   │   ├── governance-training.json
   │   ├── incidents.json
   │   ├── maturity-assessment.json
   │   ├── vendor-risk-report.json
   │   └── vendors.json
   └── evidence/  (folder cu PDF-uri / screenshot-uri atașate)
   ```
5. Open `README.txt` → ghid de citire
6. Open `MANIFEST.md` → rezumat formal + tabel SHA-256 hash chain
7. **Verifică SHA-256 hash chain manual**:
   ```bash
   cd /tmp/audit-pack/audit-pack-apex-logistic-srl-{date}/
   sha256sum data/audit-pack-v2-1.json
   # Compară cu hash-ul din MANIFEST.md tabel
   ```
8. Open `reports/audit-pack-client-*.html` în browser → vede raport HTML A4 brand-uit cabinet
9. Open `reports/executive-summary.txt` → sumar text scurt

**Expected outcome**:
- ✅ ZIP unzip OK fără erori
- ✅ Structura conformă (16 fișiere total în 4 folders + root)
- ✅ MANIFEST.md conține tabelă SHA-256 cu hash per fișier
- ✅ `sha256sum` local match exact cu hash-ul din MANIFEST.md
- ✅ HTML report client A4 deschide în browser, brand-uit DPO Complet
- ✅ Executive summary text clar (Workspace = "DPO Complet — Apex Logistic SRL", NU "Workspace local")

**Acceptance criteria**:
- [ ] ZIP <100KB pentru client cu 3 findings + 1 document
- [ ] Toate fișierele text sunt UTF-8 valid (open OK în text editor)
- [ ] SHA-256 hash chain verificabil cu unelte standard Unix (`sha256sum`)
- [ ] MANIFEST.md afișează: organizație, scor compliance, conținut, hash table
- [ ] HTML report deschide corect, NU CompliScan brand vizibil (doar DPO Complet)

**Dacă fails**:
- Structura ZIP greșită → bug audit-pack-bundle.ts
- SHA-256 NU match → Sprint 0 Bug 5 regression critic
- "Workspace local" în MANIFEST → Sprint 0 Bug 1 regression

**Done When**: Diana confirmă pe Slack "Audit Pack ZIP verified, SHA-256 match, structure OK" + face screenshot MANIFEST.md cu hash table.

**ETA Diana effort**: 20 min download + unzip + verify SHA-256 + browser open HTML.

---

## Scenariul 3 — Magic link patron real + Aprob flow (Săpt 3, 21-27 mai)

**Trigger**: Diana selectează 1 client pilot real "cooperant" (prietenos cu testare nouă) și vrea să trimită un DPA spre aprobare.

**Steps**:
1. Cabinet adaugă client real (CSV import sau manual cu CUI prefill ANAF) — ex: "ClientCooperant SRL"
2. Add finding GDPR-010 DPA Stripe expirat pentru ClientCooperant
3. Cockpit GDPR-010 → Generează DPA → review Diana
4. Click "Trimite spre validare patron" → CompliScan generează magic link signed HMAC + URL
5. Diana copy URL în clipboard sau pre-fill email cu template din `emails/magic-link-dpa-approval.txt`
6. Diana trimite URL la email-ul real al patronului ClientCooperant
7. Patron primește email, click URL → `localhost:3010/shared/[token]` (sau compliscan.ro/shared/... în production post-launch)
8. Patron vede pagina brand-uită DPO Complet:
   - Logo cabinet top
   - Titlu: "ClientCooperant SRL"
   - Document DPA preview
   - Card "Pregătit de": Diana name + cert + email + phone
   - Buton "Aprob și semnez"
   - Token expiry: "Acces valabil până {data}"
9. Patron click "Aprob și semnez" → POST `/api/shared/[token]/approve`
10. Document update: adoption status `signed`, signedByPatron: true, signedAtISO timestamp
11. Cabinet primește alert in-app dashboard (Sprint 0 — email vine în Sprint 1.8)
12. Document intră în Dosar ClientCooperant cu evidence: timestamp aprobare + IP patron

**Expected outcome**:
- ✅ Magic link expiry 72h verified
- ✅ Patron page brand-uit complet DPO Complet (NU CompliScan brand vizibil)
- ✅ Aprob click → document signed în CompliScan instant
- ✅ Audit trail: timestamp + IP patron + token signature
- ✅ Cabinet vede alert in-app pentru document semnat

**Acceptance criteria**:
- [ ] Patron NU trebuie să creeze cont (zero auth)
- [ ] Patron NU vede vreun reference la CompliScan în pagină (only DPO Complet brand)
- [ ] Diana primește notificare instant (in-app) când patron aprobă
- [ ] Document apare în Dosar cu `adoptionStatus: signed`
- [ ] Token >72h trimite "expired", patron NU poate aproba
- [ ] Token tampered (modified) trimite "invalid", patron NU poate aproba

**Reject/comment flow** (Sprint 1.2 livrabil în această săpt):
- Patron click "Respinge cu motivare" → mandatory comment field → POST `/api/shared/[token]/reject`
- Patron click "Trimite comentariu" → comment field optional → POST `/api/shared/[token]/comment`
- Cabinet vede comments primite în UI dedicat `/dashboard/cabinet/pending-approvals`

**Dacă fails**:
- Magic link page NU brand-uit → Sprint 0 Bug 3 regression
- Aprob button NU funcțional → Sprint 0 Bug 4 regression critic
- Token tampered acceptat → security bug critic, halt pilot

**Done When**: Diana confirmă pe Slack "primul magic link semnat de patron real" + screenshot patron page.

**ETA Diana effort**: 30 min add client + generat DPA + trimite link. Patron 5 min aprobare. Total 35 min.

---

## Scenariul 4 — Drift detection + reopen case (Săpt 4, 28 mai - 4 iun)

**Trigger**: cabinet adaugă vendor nou la 1 client → drift detector trigger → finding redeschis automat.

⚠️ **Notă**: drift cron daily se activează în Sprint 3 (15-19 iun). Pentru pilot săpt 4, **simulează manual** prin trigger pe demand: `POST /api/dashboard/drift-scan/trigger`.

**Steps**:
1. Diana navigate `/dashboard/[apex]/vendors` → add vendor nou: "Mailchimp"
2. CompliScan compute diff vs RoPA v2 anterior → identifică Mailchimp lipsește
3. Trigger drift scan manual (sau auto cron post-Sprint 3)
4. System detect drift `vendor_added` cu severity medium
5. Existing GDPR-006 finding (RoPA neactualizat) → reopen automat
6. Finding state update: `resolved` → `active`, history snapshot adăugat cu reason
7. Cabinet vede badge "REDESCHIS" pe cockpit GDPR-006 + alert in-app
8. Diana navigate cockpit GDPR-006 → vede:
   - Status: REDESCHIS
   - Reason: "Vendor nou Mailchimp adăugat în portofoliul Apex Logistic, RoPA-ul anterior nu îl include"
   - History: timeline cu rezolvare anterioară + reopen
   - CTA: "Update RoPA cu Mailchimp"
9. Diana update RoPA → versiune nouă v3 → adoption flow standard

**Expected outcome**:
- ✅ Drift detect funcțional (vendor_added trigger)
- ✅ Finding reopen automat (state machine: resolved → active)
- ✅ History snapshot păstrat (NU lost)
- ✅ Reason text clar pentru cabinet ("vendor nou X adăugat")
- ✅ Alert in-app dashboard pentru cabinet
- ✅ UI cockpit afișează badge "REDESCHIS"

**Acceptance criteria**:
- [ ] Vendor add → drift detect în <5 sec
- [ ] Finding reopen NU șterge istoria (audit trail păstrat)
- [ ] Cabinet poate închide din nou → state cycling funcțional
- [ ] History snapshot vizibil în cockpit cu timeline cronologic

**Dacă fails**:
- Drift NU detect → drift-trigger-engine.ts bug
- Reopen NU păstrează istoria → state machine bug critic

**Done When**: Diana confirmă pe Slack "drift detection + reopen funcțional, history păstrat" + screenshot timeline cockpit.

**ETA Diana effort**: 15 min add vendor + observație trigger + verify reopen.

---

## Scenariul 5 — AI OFF per client sensibil Cobalt Fintech (Continuous, săpt 1-4)

**Trigger**: Diana setează AI OFF pentru Cobalt Fintech (client fintech sensibil care NU permite trimiterea datelor la furnizor AI extern).

⚠️ **Notă**: AI ON/OFF toggle se activează în Sprint 1.3 (livrabil 14-16 mai, săpt 2 pilot). Pentru pilot săpt 1, **founder configurare manual prin DB**.

**Steps**:
1. Diana navigate `/dashboard/[cobalt]/setari` → toggle "AI document generation"
2. Toggle: OFF
3. Save → confirmation dialog "AI OFF activat. Documentele vor fi generate doar din template-uri cabinet, fără call la AI provider."
4. Diana navigate cockpit GDPR-010 Cobalt (DPA payroll review) → click "Generează DPA"
5. CompliScan check `client.aiEnabled === false` → skip AI call
6. Generator returnează document din template-only:
   - Footer cabinet (Diana name + cert)
   - Status: DRAFT
   - Conținut bazat strict pe template DPO Complet (pre-import în Sprint 1.1)
   - NU API call la Gemini / Mistral
7. Diana validează manual document (citește atent, editează, accept)
8. Marchează signed → adoption flow standard

**Expected outcome**:
- ✅ Toggle visible în client settings
- ✅ Toggle persistat (NU resetează la refresh)
- ✅ Document generator respect-ă config — zero API call la AI provider
- ✅ Document footer + status DRAFT identice cu AI ON output (cabinet brand consistency)
- ✅ Audit trail menționează `aiSkipped: true` pentru transparency

**Acceptance criteria**:
- [ ] Toggle OFF → 0 outbound HTTP requests către googleapis.com / mistral.ai
- [ ] Document content e generat din template, NU AI hallucinated
- [ ] Cabinet poate verifica `aiSkipped: true` în events ledger
- [ ] Performance: generation cu AI OFF e sub 1 sec (template substitution local)

**Dacă fails**:
- Toggle NU persist → bug client config storage
- AI call făcut chiar cu toggle OFF → security violation critic, halt feature
- Document generat e gol → template substitution bug

**Done When**: Diana confirmă pe Slack "AI OFF Cobalt funcțional, zero AI calls verified" + log `aiSkipped: true` în events.

**ETA Diana effort**: 5 min toggle + 10 min generat document = 15 min.

---

## Daily check-in pe Slack (founder responsibility)

Founder face zilnic la 09:00 EEST pe `#compliscan-dpo-complet-pilot`:

```
Bună Diana! 👋

Status pilot zi {N}:
- [ ] Scenariu {X} done? (link la scenariu)
- ❓ Întrebări blocking?
- 💡 Feature requests / improvements?
- 🐛 Bugs descoperite?

Eu am livrat ieri: {update Sprint 1 progress}
Eu lucrez azi: {next task}

Răspuns < 4h ore lucrătoare.
```

Diana răspunde scurt — 5 min/zi maxim.

---

## Săptămânal retro 30 min (vinerea, 16:00 Zoom)

| Vineri | Focus retro |
|---|---|
| **13 mai** | Săpt 1 — Brand setup + first document feedback |
| **20 mai** | Săpt 2 — Audit Pack ZIP structure + SHA-256 verify |
| **27 mai** | Săpt 3 — Magic link patron experience + adoption rate |
| **4 iunie** | Săpt 4 — Drift detection + AI OFF + final prep retro |

Format retro:
- 5 min update Diana (ce a încercat, ce funcționează, ce nu)
- 10 min review specific scenariu săpt
- 10 min identificare friction points + improvement ideas
- 5 min next steps săpt următoare

---

## Final retro pilot — Joi 5 iunie 2026, 15:00, 90 min ⭐

**Decision Gate #1** (din Doc 06).

**Format**:
1. **15 min Diana presents** — total învățăminte, ce a folosit cel mai mult, ce ignored, ce ar plăti
2. **30 min review cele 6 condiții** bifate vs neîndeplinite (din pre-pilot demo deck slide 3)
3. **15 min usage data review** — analytics events log: ce module folosit, ce documente generate, câte magic links trimise, câte semnate
4. **15 min feedback NPS-style** — "Pe scară 1-10, ai recomanda CompliScan unui alt cabinet DPO?"
5. **15 min DECISION SUBSCRIPTION** — Diana semnează Cabinet Pro €999/lună sau spune nu

**Outcome posibile + action plan**:

| Outcome | Action |
|---|---|
| ✅ **Diana semnează** Cabinet Pro €999 | First paying customer + testimonial video 2 min + LinkedIn case study + Faza 1 outreach iulie |
| ⚠️ **"Mai vorbim Q3"** mid signal | Outreach paralel 5 cabinete RO în 60 zile pentru data + decision Gate #2 30 august |
| ❌ **Diana refuză** | ALARM. Pivot urgent (NIS2 sector public RO sau exit asset sale €40-80K) |

---

## Anti-patterns pilot (Diana feedback)

NU face Diana în pilot:
- ❌ NU forța features care nu sunt implementate (workaround manual founder)
- ❌ NU pretinde că "tot e gata" — fii transparent despre Sprint 1+ în-pilot
- ❌ NU schimba scope la mid-pilot
- ❌ NU oferi discount înainte de retro decision

DA face Diana în pilot:
- ✅ Răspunde Slack < 4h ore lucrătoare
- ✅ Recunoaște bugs imediat când Diana le semnalează
- ✅ Update Doc 07 cu `[x]` la done items + Sprint 1 progress
- ✅ Slack channel transparency total (NU email back-channel)

---

**Maintainer**: Daniel Vaduva
**Folosit de**: Diana (DPO Complet) + Daniel (founder)
**Update**: zilnic Slack + săptămânal retro
**Final**: 5 iunie 2026 retro 90 min — DECISION GATE #1
