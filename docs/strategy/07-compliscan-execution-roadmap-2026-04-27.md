# 07 — CompliScan: Execution Roadmap tehnic (v6.6 — 29 apr 2026, DPO browser acceptance fixes)

**Status**: 🛠️ EXECUTION — traseul tehnic concret de la Sprint 0 până la production launch.
**Complementar Doc 06** (Decision Lock strategic). **Doc 06** = ce facem strategic. **Doc 07** = cum facem tehnic, pas cu pas, cu file paths.

**Audiență**: founder coding zilnic + AI agent care implementează + hire #1 dev.

**Versiune v6.6 — DPO browser acceptance fixes (29 apr 2026, 15:00 EEST)**:

✅ **DPO Consultant browser scenario a fost reparat după raportul Sonnet.** Nu am pivotat produsul; am închis golurile de runtime care apăreau când Diana naviga efectiv aplicația: DSAR gol, raport lunar lipsă, task/vendor pages goale, brand vechi pe pagini legale și Evidence Ledger inconsistent.

Validare cod:
- Build: `npm run build` ✅
- Tests: `npm test` → **244 files passed**, **1265 tests passed**, 1 skipped ✅
- Lint: `npm run lint` ✅ (doar warning-uri vechi)
- Live browser/API acceptance smoke: `node /private/tmp/dpo-browser-acceptance-smoke.mjs` pe `localhost:3002` → PASS ✅

Acoperire nouă verificată end-to-end:
- Lumen DSAR alert are corespondent acționabil în `/api/dsar`.
- `/portfolio/tasks` returnează queue DPO cross-client cu DSAR prioritar.
- `/portfolio/vendors` returnează furnizori derivați din documente/findings/sisteme când nu există review NIS2 formal.
- `/portfolio/reports` poate genera raport lunar on-demand prin `/api/partner/reports/monthly`.
- Template-uri cabinet DPO: DPA, răspuns DSAR și RoPA prepopulate în demo.
- Evidence Ledger dashboard: array-ul și summary-ul au același total.
- `/privacy`, `/terms`, `/dpa` și process pack DSAR nu mai expun `CompliAI`.

Verdict: **DPO demo este browser-acceptance ready pentru self-test Daniel ca Diana.** Pilotul real rămâne controlat, cu Supabase production și date pseudonimizate/low-risk.

---

**Versiune v6.5 — DPO Production Trust Hardening (28 apr 2026, 21:10 EEST)**:

✅ **DPO Cabinet are acum pachet de încredere production-grade pentru pilot real controlat.** Sprintul răspunde explicit ultimelor blocaje de migrare: DPA semnabil ca template contractual, subprocessori fără wording vag, storage production clar, template import real din documente murdare, evidence delete controlat și compatibilitate cu task-uri istorice/legacy.

Validare cod:
- Build: `npm run build` ✅
- Tests: `npm test` → **244 files passed**, **1263 tests passed**, 1 skipped ✅
- Lint: `npm run lint` ✅ (doar warning-uri vechi)
- Targeted hardening tests: `npx vitest run 'app/api/tasks/[id]/route.test.ts' 'app/api/tasks/[id]/evidence/[evidenceId]/route.test.ts' lib/compliance/task-validation.test.ts lib/server/template-upload-parser.test.ts lib/server/dpo-security-contractual-pack.test.ts lib/server/rbac.test.ts` → **6 files / 34 tests PASS** ✅
- Runtime smoke DPO Production Trust Hardening: `scripts/smoke-dpo-consultant-runtime-demo.mjs` → **118/118 checks passed** ✅

Pachet nou pentru validare DPO:
- Folder: `/private/tmp/compliscan-dpo-production-trust-hardening-2026-04-28`
- ZIP: `/Users/vaduvageorge/Downloads/compliscan-dpo-production-trust-hardening-2026-04-28.zip`
- SHA-256: `54fbf2003a5f405b0ea10d78e6b0d810b22b920592fa279891653ade3e71c743`

Acoperire nouă verificată end-to-end:
- Contractual pack: DPA `signature_ready_template`, termeni retention/deletion, incident response și AI processing.
- Subprocessor table exact: provider, regiune, date procesate, AI ON/OFF, training use, EU-only mode și condiții de activare.
- Production storage clarity: Supabase production, Frankfurt, bucket evidence, backup, retention, export și deletion policy.
- Template import real: `.docx` murdar din cabinet, `.md` RoPA și `.txt` retenție, cu source file + migration history.
- Evidence delete hardening: soft delete cu motiv, audit event, download blocat `410`, restore window 30 zile, restore + revalidate, hard delete owner-only.
- Compatibilitate legacy: task-uri `finding-*` și state keys istorice fără prefix se validează/restaurează corect.

Verdict: **DPO Cabinet este pregătit pentru pilot controlat cu pachet de trust mult mai aproape de producție.** Migrarea completă rămâne etapizată după 30-60 zile pilot real și semnarea/finalizarea documentelor juridice de către consultant/founder.

---

**Versiune v6.4 — DPO Migration Confidence Pack (28 apr 2026, 19:35 EEST)**:

✅ **DPO Cabinet are acum pachet de migrare graduală, nu doar demo flow.** Sprintul răspunde explicit motivelor pentru care un consultant DPO nu ar migra tot cabinetul din prima: securitate/contractual, roluri, cazuri reale murdare, template-uri proprii, export complet și raport lunar client-facing.

Validare cod:
- Build: `npm run build` ✅
- Tests: `npm test` → **243 files passed**, **1257 tests passed**, 1 skipped ✅
- Lint: `npm run lint` ✅ (doar warning-uri vechi)
- Runtime smoke DPO Migration Confidence Pack: `scripts/smoke-dpo-consultant-runtime-demo.mjs` → **103/103 checks passed** ✅

Pachet nou pentru validare DPO:
- Folder: `/Users/vaduvageorge/Downloads/compliscan-dpo-migration-confidence-pack-2026-04-28`
- ZIP: `/Users/vaduvageorge/Downloads/compliscan-dpo-migration-confidence-pack-2026-04-28.zip`
- SHA-256: `cb110b1705acfd6272a366bf5ac7cac93894734d371b6ba9b3f1096189079130`

Acoperire nouă verificată end-to-end:
- Security + contractual pack: DPA draft, subprocessori, hosting, retenție, AI ON/OFF/no-training, offboarding/export.
- RBAC permission matrix: acțiuni sensibile mapate pe roluri, cu teste.
- Messy cases: document respins nu poate fi supra-aprobat cu același magic link; token alterat afișează blocked state.
- Template library matură: versiune, sursă migrare, descriere, revision/status.
- Export complet cabinet/client: `/api/partner/export` + UI în `Portfolio → Reports`.
- Rapoarte lunare client-facing: `reports/client-monthly-*.html` separate per client.

Verdict: **DPO Cabinet este pregătit pentru pilot controlat + discuție serioasă de migrare graduală.** Migrarea completă rămâne etapizată după 30-60 zile pilot real, nu promisiune de demo.

---

**Versiune v6.3 — DPO state sync runtime verification (28 apr 2026, 18:45 EEST)**:

✅ **DPO Cabinet after-state este acum sincronizat global.** Apex Logistic nu mai apare `audit_ready` în Audit Pack și `review_required` în raport lunar/portfolio. Aceeași regulă canonică decide dacă un finding este închis operațional: task asociat `done + passed`, dovezi suficiente și alerte aferente rezolvate.

Validare cod:
- Build: `npm run build` ✅
- Tests: `npm test` → **241 files passed**, **1248 tests passed**, 1 skipped ✅
- Runtime smoke consultant DPO: `scripts/smoke-dpo-consultant-runtime-demo.mjs` → **88/88 checks passed** ✅

Pachet nou pentru validare DPO:
- Folder: `/private/tmp/compliscan-dpo-consultant-runtime-demo-2026-04-28`
- ZIP: `/Users/vaduvageorge/Downloads/compliscan-dpo-consultant-runtime-demo-v5-2026-04-28.zip`
- SHA-256: `415b85ffc4c88f242e53a32629f42f720d7e6f8ccc98a4908179050786ca25ba`

Acoperire nouă verificată end-to-end:
- `Audit Pack` Apex after-state: `baselineStatus=validated`, `auditReadiness=audit_ready`, `openFindings=0`, `missingEvidenceItems=0`.
- `Portfolio final` Apex: `criticalFindings=0`, `alertCount=0`.
- `Raport lunar` Apex: `auditReadiness=audit_ready`, `openFindings=0`, `pendingEvidence=0`.
- `Dashboard after-remediation` Apex: RoPA + cookie au `taskStatus=done`, `validationStatus=passed`, `evidenceQuality=sufficient`.

Verdict: **DPO demo v5 poate fi trimis pentru validare fără contradicția “baseline lipsă” în suprafețele finale.**

---

**Versiune v6.2 — DPO before/after audit-ready runtime verification (28 apr 2026, 18:05 EEST)**:

✅ **DPO Cabinet flow are acum scenariu runtime matur before/after.** Apex Logistic pornește cu RoPA + cookie încă deschise, apoi consultantul atașează dovezi, validează taskurile, îngheață baseline-ul și exportă Audit Pack final `audit_ready`.

Validare cod:
- Build: `npm run build` ✅
- Tests: `npm test` → **241 files passed**, **1248 tests passed**, 1 skipped ✅
- Runtime smoke consultant DPO: `scripts/smoke-dpo-consultant-runtime-demo.mjs` → **83/83 checks passed** ✅

Pachet nou pentru validare DPO:
- Folder: `/private/tmp/compliscan-dpo-consultant-runtime-demo-2026-04-28`
- ZIP: `/Users/vaduvageorge/Downloads/compliscan-dpo-consultant-runtime-demo-v4-2026-04-28.zip`
- SHA-256: `8fef6a7715065b8bfbebc24dc28c704b186b6726adeabb3aef1c2ccc98c17fed`

Acoperire nouă verificată end-to-end:
- Template cabinet upload + inherited template în workspace client Apex.
- Apex before-state: RoPA + cookie rămân vizibile ca findings deschise și `review_required`.
- Apex remediation: dovezi pentru RoPA + cookie atașate, taskuri `done + passed`, alerte închise.
- Baseline validation: `POST /api/state/baseline` creează snapshot curent și îl marchează ca baseline validat.
- Apex after-state: `openFindings=0`, `missingEvidenceItems=0`, `auditReadiness=audit_ready`, `bundleEvidenceSummary.status=bundle_ready`.

Verdict: **DPO flow este pregătit pentru demo serios + pilot controlat cu before/after complet.** Production deploy rămâne blocat strategic până după verificarea founder-side și pilot kickoff.

---

**Versiune v6.1 — DPO client-ready runtime verification (28 apr 2026, 13:20 EEST)**:

✅ **DPO Cabinet flow este client-ready pentru pilot controlat.** Nu este deploy-uit production; este validat local pe `v3-unified` cu runtime real și pachet ZIP nou.

Validare cod:
- Build: `npm run build` ✅
- Tests: `npm test` → **241 files passed**, **1240 tests passed**, 1 skipped ✅
- Runtime smoke hardening: `/private/tmp/dpo-client-ready-smoke.mjs` → **44/44 checks passed** ✅
- Runtime package generation: `/private/tmp/dpo-client-ready-package.mjs` → **32/32 checks passed** ✅

Pachet nou pentru DPO Complet:
- Folder: `/Users/vaduvageorge/Downloads/compliscan-dpo-complet-client-ready-2026-04-28`
- ZIP: `/Users/vaduvageorge/Downloads/compliscan-dpo-complet-client-ready-2026-04-28.zip`
- Conține: DPA Apex × Stripe, shared page before/after approval, dashboard state summary, Audit Pack client HTML, Audit Pack dossier ZIP, runtime report.

Acoperire verificată end-to-end:
- DPO Complet SRL este cabinetul; Apex Logistic SRL este clientul/operatorul.
- White-label cabinet se moștenește corect pe workspace-ul clientului importat.
- DPA-ul separă corect `Client / Operator`, `Furnizor / Procesator`, `Pregătit de`, `Consultant`.
- Magic link public are approve + reject + comment, fără login client și fără brand CompliAI în HTML vizibil.
- Aprobarea devine `adoptionStatus=signed`, evidence task `sufficient`, event ledger și traceability.
- Audit Pack HTML și ZIP folosesc Apex Logistic ca workspace client și DPO Complet / Diana Popescu ca prepared by.
- Monthly digest rulează peste state real; trimiterea email depinde de Resend/domain production.

Verdict: **DPO flow poate intra în pilot controlat pe 1-2 clienți reali/pseudonimizați.** Următorul pas nu este încă deploy production general, ci verificare manuală founder-side + pilot kickoff.

---

**Versiune v6.0 — code-side launch ready (28 apr 2026)**:

🚀 **Toate sprint-urile programate (0/0.5/1/2A/2B/3) sunt DONE pe `v3-unified`.**

Status final cod:
- Build clean. **1235 tests pass**, 0 fails, 6 skipped.
- Sprint 1: 9 features livrate + S3.4 ICP-aware login (bonus).
- Sprint 2A: Stripe ICP 14 SKU + Supabase dual-write + migration script.
- Sprint 2B: Mistral EU + hash chain events ledger (S2B.3 cu 10 unit tests).
- Sprint 3: 4 landing pages publice + waitlist + drift cron (already existed).
- Documentație nouă pentru launch:
  * `docs/strategy/RELEASE-READY-CHECKLIST.md` — singurul loc de care ai nevoie ca founder
  * `scripts/verify-release-ready.mjs` — preflight automat (`npm run verify:release-ready`)
  * `scripts/migrate-fs-to-supabase.mjs` — cutover playbook
  * `.env.example` actualizat cu toate vars (14 Stripe SKU + Mistral + cabinet brand)

Ce rămâne **founder-side** (NU mai e cod):
1. Stripe Dashboard: configurare 14 SKU price IDs
2. Mistral La Plateforme: generare API key
3. Resend: DNS + SPF/DKIM
4. Supabase: rulează playbook din `RELEASE-READY-CHECKLIST.md` secțiunea 2
5. Pre-pilot prep (4-6 mai): slide deck + dry-run Diana
6. Pilot kickoff joi 7 mai 15:00
7. Decision Gate #1: 5 iunie retro

---

**Versiune v5.6 — audit cod real Stripe + Supabase pe v3-unified (27 apr 2026, 18:30 EEST)**:

Audit-ul fișierelor v3-unified a arătat că **Sprint 2A scope era supraestimat în doc 07 v5.3-v5.5**:

- **Stripe**: există `app/api/stripe/checkout/route.ts` + `webhook/route.ts` + `portal/route.ts` cu teste, webhook actualizează `setOrgPlan/setPartnerAccountPlan` end-to-end. Lipsesc doar **16 ICP SKU mapping** (vs 5 partner-centric curent) + **cabinet billing UI ICP-aware**. **~6h vs 2 zile estimate**.
- **Supabase**: există 17 fișiere `lib/server/supabase-*.ts` + `storage-adapter.ts` cu toggle `COMPLISCAN_DATA_BACKEND=local|supabase` + RLS verification + strict preflight. Lipsește doar **dual-write pattern** (write paralel safety net) + **migration script .data → Supabase**. **~1.5 zile vs 3 zile estimate**.

**Sprint 2A revizuit**: 2 zile lucru real, nu 10 zile. Se poate topi în Sprint 1 hardening sau în prima săpt Sprint 2B.

**Versiune v5.4 — runtime cleanup v3-unified — cele 7 cerințe DPO mutate din roadmap în execuție funcțională**:

Update 27 apr 2026, după integrarea pe `v3-unified`: nu mai tratăm cele 7 cerințe ca patch-uri izolate. Flow-ul matur este:

- `Trust Profile`, `Vault` și `Audit Pack` folosesc aceeași sursă canonică pentru readiness: `buildAuditPack`.
- Baseline-ul are backend + UI în `Settings`, iar payload-ul returnat după set/clear actualizează dashboard-ul.
- Magic link are approve + reject + comment, cu dovadă/traceability.
- Monthly digest folosește activitate reală din state prin cron.
- Cookie-ul de pe `/shared` rămâne discret prin componenta globală existentă; nu se mai dublează banner local.
- Test suite verde: `236 passed`, `1188 tests passed`, `6 skipped` pe `v3-unified`.

**Status runtime real al celor 7 cerințe DPO**:

DPO Complet (post pachet Sprint 0.5 trimis 27 apr) a confirmat: "produs suficient de matur pentru demo + pilot. Pentru folosire operațională completă, aș mai vrea să văd 7 lucruri." → mapat:

| # | Cerința DPO | Sprint | Task ID |
|---|---|---|---|
| 1 | Scoruri consistente Trust Profile vs Audit Pack | Sprint 1 | ✅ **DONE S1.9** — `auditReadinessSummary` derivat din Audit Pack canonic |
| 2 | Baseline validat post-remediere | Sprint 2A | ✅ **DONE S2A.5** — `POST /api/state/baseline` + UI Settings set/clear |
| 3 | Comentariu/respingere magic link | Sprint 1 | ✅ **DONE S1.2** — approve/reject/comment + evidence/event/alert |
| 4 | Documente fără "AI indisponibil" | Sprint 0.5 | ✅ DONE (commit `cac754e` — patch include în doc generator) |
| 5 | Cookie banner discret pe `/shared` | Sprint 1 | ✅ **DONE S1.5+** — banner compact existent, fără dublură locală |
| 6 | Raport lunar din activitate reală | Sprint 2A | ✅ **DONE S2A.4** — cron monthly digest + agregare state real |
| 7 | Export "audit_ready" după dovezi 100% | Sprint 2A | ✅ **DONE S2A.6** — `audit_ready` derivat canonic și surfacat în Vault |

Total task-uri DPO: **7/7 funcționale pe v3-unified**. Validarea runtime cu pachet ZIP nou pentru DPO Complet este completă în v6.1: smoke **44/44**, package **32/32**.

**Update v5.5 — runtime demo rerun final (27 apr 2026, 18:03 EEST)**:

- Runtime script: `/tmp/dpo-runtime-demo-rerun.mjs`
- Base URL testat: `http://localhost:3025`
- Rezultat: **46/46 checks passed, 0 failed**
- ZIP client pilot: `/Users/vaduvageorge/Downloads/compliscan-dpo-complet-sprint0-package-2026-04-27.zip`
- Demo pack complet: `/Users/vaduvageorge/Downloads/compliscan-demo-result-v2/CompliScan-Demo-Pack-DPO-Complet-2026-04-27.zip`
- Raport runtime: `/Users/vaduvageorge/Downloads/compliscan-demo-result-v2/runtime-demo-report.json`

Fixuri maturizate în rerun:

- `/api/shared/[token]/approve|reject|comment` este public allowlisted strict în middleware pentru magic link fără sesiune.
- White-label fallback persistă pe disc, nu doar în Map per route bundle.
- DPA fallback nu mai menționează AI indisponibil / CompliAI și separă corect Client / Operator, Furnizor / Procesator, Pregătit de.
- Partner scan ascunde finding-uri fiscale/e-Factura în DPO flow.
- Approval evidence păstrează quality sufficient + GDPR Art. 28 în Evidence Ledger.
- Audit Pack bundle folosește Apex Logistic SRL ca workspace client și DPO Complet ca prepared by.
- PDFKit AFM fallback acoperă și `.next/server/vendor-chunks/data`.
- Shared page afișează emailul consultantului lowercase, lizibil pentru client.

**Sprint 1 ETA extension**: 2 săpt → **3 săpt** (8 mai → 30 mai). Pilot week paralel.
**Sprint 2A ETA**: 2 săpt (1-15 iun). 

**Pilot strategy revizuit**: Diana folosește Sprint 0.5 product la kickoff Joi 7 mai pentru **internal-first săpt 1**. Săpt 2-4: primește features Sprint 1 incremental. Final retro **5 iunie 2026**: produs cap-coadă cu 7/7 cerințe livrate.

---

**Versiune v5.2 — corectat post-review GPT (7 erori, mențin)**:
1. ✅ Calendar fix: 27 apr 2026 = LUNI (azi), 28 apr = MARȚI
2. ✅ Sprint 1 split: pre-kickoff (must-have) vs pilot-week hardening
3. ✅ Feature flag fiscal hide mutat în Sprint 0 (Bug 7) — critic pentru DPO demo
4. ✅ Bug 4 path corectat: `app/api/shared/[token]/approve/route.ts`
5. ✅ Sprint 2 split (S2A: Stripe + digest / S2B: Mistral + Supabase)
6. ✅ Bug 4 fallback fără email Resend (event + dashboard alert)
7. ✅ Commit rule nuanțat: doar după test/lint pass

---

## TL;DR

Acest doc răspunde la întrebarea: **"Pornesc mâine dimineață (marți 28 apr). Ce fac concret?"**

| Sprint | Durată | Output | Status azi |
|---|---|---|---|
| **S0 — Fix 7 bug-uri vizibile + feature flag fiscal** | **4 zile** (marți 28 apr → vineri 1 mai) | 7 fix-uri + demo refăcut + ZIP package nou | 0/7 done |
| **Pre-kickoff prep** | **3 zile** (luni 4 → miercuri 6 mai) | Răspuns DPO + import templates + slide deck + dry-run | 0/3 done |
| **Joi 7 mai 15:00** | ⭐ **PILOT KICKOFF** | DPO Complet 60min | — |
| **S1 — Pilot-week hardening (paralel cu pilot)** | 7 zile (joi 8 → vineri 16 mai) | Custom templates + reject/comment + AI on/off + signature + ICP onboarding | 0/5 done |
| **S2A — Stripe ICP tiers + Supabase dual-write** | **~2 zile real** (era 2 săpt, audit v5.6) | 16 ICP SKU mapping + cabinet billing UI + dual-write pattern + migration script | Stripe 85% + Supabase 80% |
| **S2B — Mistral + Supabase cutover** | 2 săpt (1 → 15 iun) | Mistral EU + Supabase production cutover + monitoring | 0/2 done |
| **S3 — Drift + landing pages** | 1 săpt (8 → 14 iun) | Drift cron + 4 landing pages + waitlist | 0/3 done |
| **PROD launch** | 1 săpt (22 iun) | compliscan.ro live + first paying customer | 0/1 done |

**Critical path** (calendar revizuit v5.6 după audit Stripe + Supabase real):
```
marți 28 apr → S0 fix-uri DONE pe v3-unified (Sprint 0 + 0.5 + 7 cerinte DPO complete)
luni 4 → mier 6 mai → pre-kickoff prep (3 zile)
joi 7 mai 15:00 → ⭐ KICKOFF DPO COMPLET
joi 8 mai → ven 30 mai → S1 pilot-week hardening (3 săpt, paralel cu pilot)
                       + S2A.1 Stripe ICP tiers (~6h) + S2A.7 Supabase dual-write (~1.5z) topite în Sprint 1
luni 1 iun → ven 12 iun → S2B Mistral EU + Supabase prod cutover
joi 5 iun → ⭐ PILOT RETRO 90min — DECISION GATE #1
luni 15 iun → ven 19 iun → S3 drift + landing pages
luni 22 iun → ⭐ PRODUCTION LAUNCH (slipped din 15 iun cu 1 săpt — Supabase cutover complexity)
```

**Total**: ~8 săpt de la azi (luni 27 apr) la production launch (luni 22 iun). Sprint 2A original (10 zile) **comprimat la ~2 zile** după audit v5.6 — buffer recâștigat pentru Sprint 1 features cabinet (S1.1 templates, S1.6 ICP onboarding).

---

## SPRINT 0 — Fix 7 bug-uri vizibile + feature flag fiscal (marți 28 apr → vineri 1 mai 2026)

**Obiectiv**: la Joi 1 mai, demo-ul rerulat NU mai are bug-urile descoperite în run-ul de azi + DPO Complet NU vede fiscal routes (e-Factura/SPV/e-TVA/SAF-T) în sidebar. Pachet curat trimis pre-kickoff.

**Calendar corectat**: 4 zile lucrătoare (marți-vineri), NU 5. **Bug 7 (feature flag fiscal)** mutat din Sprint 1 în Sprint 0 pentru că DPO demo trebuie să fie focusat GDPR + NIS2, fără fiscal noise.

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

**File nou**: `app/api/shared/[token]/approve/route.ts` ⚠️ **path corect post-review (era greșit `app/shared/[token]/approve/route.ts` fără `/api/`)**
**Issue**: patron page e read-only momentan. 0 ocurențe "Aprob" în 92KB HTML.

**Fix Sprint 0** (minimum viable — doar Aprob, NU Respinge/Comentariu, NU email cabinet):

⚠️ **Email cabinet îndepărtat din Sprint 0** (Resend NU e setup încă). Sprint 0 fallback: **event în compliance log + dashboard alert in-app** (NU email). Email infrastructure = Sprint 1.8 task dedicat.

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
    // Adaugă alert in-app pentru cabinet (replace email dependency)
    state.alerts = [...(state.alerts ?? []), {
      id: `alert-doc-signed-${resolved.documentId}`,
      message: `Document ${resolved.documentId} aprobat de patron prin magic link`,
      severity: "low",
      open: true,
      createdAtISO: new Date().toISOString(),
    }]
  })
  
  // Log event în compliance log
  await appendComplianceEvents(resolved.orgId, [
    createComplianceEvent("document_signed_via_magic_link", { 
      documentId: resolved.documentId, 
      signedAt: new Date().toISOString() 
    })
  ])
  
  // Email cabinet — POSTPONED la Sprint 1.8 (Resend setup)
  // TODO Sprint 1.8: trimite email diana@dpocomplet.ro cu notificare
  
  return jsonOk({ approved: true, signedAtISO: new Date().toISOString() })
}
```

**Rollback/fallback**: dacă endpoint cade → patron primește 500 → cabinet vede în logs Sentry. NU e silent failure.

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

### Bug 7 — Feature flag fiscal hide (NEW Sprint 0, mutat din Sprint 1)

**File-uri**:
- `lib/shared/cabinet-modules.ts` (nou) — types `ProductModules`
- `lib/server/cabinet-config.ts` (nou) — `getEnabledProducts/setEnabledProducts`
- `.data/cabinet-modules-{orgId}.json` (nou) — storage adapter
- `components/compliscan/dashboard-shell.tsx` (update) — sidebar conditional
- `lib/server/findings-detector.ts` (update) — filter findings per module

**De ce Sprint 0 (NU Sprint 1)**: dacă DPO Complet vede `/dashboard/[client]/efactura`, `/spv`, `/etva`, `/saft` în sidebar la kickoff → se rupe focusul GDPR + NIS2. Critical pentru DPO demo cleanliness.

**Fix minimum viable Sprint 0**:
```typescript
// lib/shared/cabinet-modules.ts
export interface ProductModules {
  dpoOs: boolean       // true default for DPO Complet
  fiscalOs: boolean    // false default for cabinet
  // restul în Sprint 1+
}

// lib/server/cabinet-config.ts
export async function getEnabledProducts(orgId: string): Promise<ProductModules> {
  const data = await readFromAdapter(`cabinet-modules-${orgId}`)
  return data ?? { dpoOs: true, fiscalOs: false }  // default cabinet DPO mode
}
```

**Sidebar update**:
```tsx
// components/compliscan/dashboard-shell.tsx
const products = await getEnabledProducts(session.orgId)

<Sidebar>
  {products.dpoOs && <DPONavGroup />}
  {products.fiscalOs && <FiscalNavGroup />}
</Sidebar>
```

**Pre-pilot setup pentru DPO Complet**:
```bash
echo '{"dpoOs":true,"fiscalOs":false}' > .data/cabinet-modules-org-06ab1c67c756cb61.json
```

**Verifică**:
```bash
# Cabinet DPO Complet → 0 fiscal routes vizibile
curl -s http://localhost:3010/dashboard -b cookies.txt | grep -c "e-Factura\|SPV\|e-TVA\|SAF-T"
# Expected: 0
```

**Rollback/fallback**: dacă feature flag rupe sidebar → revert la default `{ dpoOs: true, fiscalOs: true }` (vechiul comportament).

**ETA**: 4 ore
**Dependencies**: niciuna
**Done când**: cabinet DPO Complet → 0 fiscal links vizibile în sidebar.

---

### Sprint 0 Critical Path (calendar corectat: marți 28 → vineri 1 mai = 4 zile)

```
Bug 1 (workspace.label)      ──┐
                                ├──→ Bug 5 (SHA-256 manifest)
                                │
Bug 2 (disclaimer)             ─┤
Bug 7 (feature flag fiscal)    ─┤
                                │
Bug 3 (Diana branding) ──→ Bug 4 (Aprob button minimum, fără email)
                                │
Bug 6 (PDF font) (independent) ─┘
```

**Order optim revizuit (4 zile lucrătoare, 32h total)**:

| Zi | Task | ETA | Cumulativ |
|---|---|---|---|
| **Marți 28 apr** | Bug 1 workspace.label (4h) + Bug 2 disclaimer (2h) + Bug 7 feature flag fiscal (2h) | 8h | 8h |
| **Miercuri 29 apr** | Bug 3 Diana branding card (6h) + finish Bug 7 polish (2h) | 8h | 16h |
| **Joi 30 apr** | Bug 4 Aprob button minimum (4h) + Bug 5 SHA-256 (4h) | 8h | 24h |
| **Vineri 1 mai** | Bug 6 PDF font (4h) + re-run demo + ZIP package (4h) | 8h | 32h |

**Sâmbătă 2 mai**: email DPO Complet pre-pilot question (1h, non-coding).

### Sprint 0 Done When (7 fix-uri + 2 imperfections discovered post-runtime)

- [x] Bug 1: re-run demo, Audit Pack ZIP fără "Workspace local" — `workspace.label: "Apex Logistic SRL"` ✅ verificat 27 apr
- [x] Bug 2: 4 documente generate cu cabinet footer, NU disclaimer toxic ✅
- [x] Bug 3: patron page cu consultant card complet (Diana + cert + email + phone) ✅ screenshots `shared-page-before/after-approval.png`
- [x] Bug 4: Aprob button funcțional, document → signed status (fără email — alert in-app) ✅ Evidence Ledger DPA approved
- [x] Bug 5: bundle-manifest.json cu SHA-256 + MANIFEST.md hash table ✅
- [x] Bug 6: PDF endpoint returnează 200 + valid PDF ✅ `audit-pack.pdf` 10KB
- [x] Bug 7: feature flag fiscal hide pentru DPO mode (0 fiscal routes vizibile) ✅
- [x] 46/46 runtime checks passed ✅ verificat în `runtime-demo-report.json`
- [x] 24/24 vitest passed ✅
- [x] npm run build passed ✅
- [x] Pachet ZIP `compliscan-dpo-complet-sprint0-package-2026-04-27.zip` (31KB) ✅

### Sprint 0.5 — Imperfections discovered post-runtime (ETA marți 28 apr, +1 zi)

- [x] **Issue 2 (CRITICAL)**: DPA aprobat magic link nu populează traceability matrix
  - ✅ Fix livrat în commit `4d3d559` (`buildTraceRecordFromApprovedDocument`)
  - Test: post-approval → traceability matrix actualizată cu `entryKind: "document_approval"`
  - ETA real: 4h în Sprint 0.5

- [x] **Issue 1 (Important)**: label clarity "Open findings: 0" vs "Remediation: 3"
  - ✅ Fix livrat în commit `4d3d559` (label-uri clarificate în `audit-pack-bundle.ts`)
  - Label-uri: "Findings de business deschise" / "Sarcini de remediere active" / "Dovezi pendinte de atașat"

- [x] **Issue 3 (Comunicare, NU cod)**: Audit Pack "work in progress" presentation
  - ✅ Fix livrat în `audit-pack-bundle.ts:519` cu nota explicit:
    "review_required înseamnă 'dosar de lucru, NU certificat' — sistemul nu raportează fals audit_ready"

**Done when**: post-fix re-run runtime demo → 46/46 + 1 traceability validated + label clarity → re-export package final.

---

## PRE-KICKOFF PREP (luni 4 → miercuri 6 mai, 3 zile, 24h)

**Obiectiv**: pregătire finală pentru kickoff DPO Complet Joi 7 mai 15:00. **NU coding nou** — doar prep + dry-run.

| Zi | Task | ETA |
|---|---|---|
| **Luni 4 mai** | Răspuns DPO Complet la întrebarea pre-pilot (2h) + ajustare pitch (2h) + import templates manual (4h) | 8h |
| **Marți 5 mai** | Slide deck demo final (4h) + Q&A prep (2h) + Slack channel setup (2h) | 8h |
| **Miercuri 6 mai** | Final dry-run demo (2h) + ajustări last-minute (3h) + final ZIP package (3h) | 8h |

**Joi 7 mai 15:00**: ⭐ **PILOT KICKOFF DPO COMPLET 60min**.

---

## SPRINT 1 — Pilot-week hardening (joi 8 → vineri 16 mai 2026, paralel cu pilot)

**Obiectiv**: features livrate **DURING pilot**, NU before. Cabinet DPO Complet folosește produsul în Sprint 1, simultan cu development.

⚠️ **Schimbare critică post-review**: Sprint 1 NU mai e "ready înainte de kickoff". Sprint 1 rulează **8-16 mai (7 zile lucrătoare)** = în timpul pilotului. Cabinet folosește Sprint 0 product la kickoff, primește features Sprint 1 incremental.

**Must-have features pre-kickoff** (în Sprint 0): feature flag fiscal hide. **Nimic altceva.**

**Sprint 1 features livrate during pilot week**:

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

### ~~S1.4 — Feature flag fiscal hide~~ → **MUTAT în Sprint 0 ca Bug 7** (post-review)

Feature flag fiscal hide e acum în Sprint 0 (Bug 7). NU mai e în Sprint 1.

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

### Sprint 1 Total: ~10 zile lucru disponibile (8-16 mai = 7 zile + extension dacă needed)

S1.4 (feature flag fiscal) mutat în Sprint 0. Total Sprint 1 features: 7 (NU 8).

Estimare ETA Sprint 1: ~10 zile lucru pentru toate 7 features. Disponibile = 7 zile lucrătoare. **Strâns**. Cut-list dacă timeline tight:
- **Tăiem S1.5 (signature upload)** — workaround: founder upload manual prin DB direct
- **Tăiem S1.7 (UI pending approvals separat)** — workaround: cabinet vede notificare în dashboard general
- **Tăiem S1.8 (email notifications Resend)** — workaround: alert in-app + manual Slack notification

**Email infrastructure (S1.8) e prerequisite pentru email notifications cabinet.** Resend setup + DNS + SPF/DKIM = 1 zi work. Dacă nu se face în Sprint 1 → fallback alert in-app permanent în Sprint 0.

### Sprint 1 Done When (revizuit post DPO Complet feedback — 7 cerințe mapate)

Pre-kickoff (Sprint 0 + 0.5):
- [x] Bug 1-7 + Issue 1-3 done (vezi Sprint 0 + Sprint 0.5)
- [x] **Issue 4 DPO** done (mesaj "AI indisponibil" eliminat din `document-generator.ts`)

Sprint 1 extended (8-30 mai, 3 săpt — paralel cu pilot week):

- [x] **S1.1** Custom templates UI funcțional (cabinet upload → folosit în cockpit) — ✅ commit `41854bb`
- [x] **S1.2** ⭐ **Issue 3 DPO** — Reject + comment flow complet pe magic link — livrat pe `v3-unified`
  - POST `/api/shared/[token]/reject` (mandatory comment field)
  - POST `/api/shared/[token]/comment` (optional comment, no reject)
  - UI cabinet `/dashboard/cabinet/pending-approvals` cu badges
- [x] **S1.3** AI ON/OFF toggle per client — ✅ commit `8decfd7`
- [x] **S1.5** Signature upload în brand setup — ✅ commit `41854bb`
- [x] **S1.5+** ⭐ **Issue 5 DPO** — Cookie banner discret pe `/shared/[token]` — livrat fără banner duplicat
  - Variant compact (NU full-width modal)
  - Localstorage simple, NU layered consent UI
  - Dismiss button vizibil
- [x] **S1.6** ICP segment choice onboarding pentru cabinete noi — ✅ commit `41854bb`
- [x] **S1.7** UI cabinet pentru pending approvals + comments — ✅ commit `33fe925`
- [x] **S1.8** Email notifications via Resend — ✅ commit `33fe925`
- [x] **S3.4 BONUS** ICP-aware login page (5 variante per `?icp=`) — ✅ commit `9213c4b`
- [x] **S1.9** ⭐ **Issue 1 DPO** — Trust Profile ↔ Audit Pack score consistency — livrat pe `v3-unified`
  - Source of truth unic pentru readiness: `lib/server/audit-pack.ts → buildAuditPack`
  - Dashboard full payload expune `auditReadinessSummary`
  - Vault consumă același summary canonic, nu mai recalculează local starea finală
  - Test: `lib/server/dashboard-response.test.ts` + `lib/server/audit-pack.test.ts`

**Sprint 1 total**: ~13 zile lucru. ETA: 3 săpt (8-30 mai) — overlap cu pilot week (Diana folosește incremental).

---

## SPRINT 2A — Stripe ICP tiers + Digest + Supabase dual-write (luni 18 → vineri 30 mai 2026)

**Obiectiv**: Stripe ICP tier mapping (cabinet-solo / cabinet-pro / cabinet-studio etc.) + Supabase dual-write pattern pentru cutover safe în S2B.

⚠️ **v5.6 — Audit real al codului v3-unified (27 apr 2026)**: secțiunea originală S2A era scrisă presupunând că Stripe și Supabase nu există. **Audit-ul cod a confirmat că ambele sunt deja integrate la 80-85%**. Update mai jos.

⚠️ **Sprint 2 split post-review**: original "Stripe + Mistral + Supabase + digest în 2 săpt" era **nerealist**. Supabase production cutover NU e "2-3 zile" — e 1-2 săpt cu dual-write + verify + monitoring. Split:
- **S2A** (18-30 mai): Stripe ICP tiers + digest + Supabase dual-write enable
- **S2B** (1-15 iun): Mistral + Supabase cutover

### S2A.1 — Stripe ICP tier mapping + cabinet billing UI (~6h, era 2 zile)

**Audit real v3-unified — ce EXISTĂ deja (~85%):**
- ✅ `app/api/stripe/checkout/route.ts` — POST create checkout (NB: path `checkout`, nu `checkout-session`)
- ✅ `app/api/stripe/webhook/route.ts` — handler `checkout.session.completed`, `customer.subscription.deleted/updated`, `invoice.payment_failed`
- ✅ `app/api/stripe/portal/route.ts` — Stripe Customer Portal pentru self-service
- ✅ Teste pentru toate 3 endpoint-uri (`route.test.ts`)
- ✅ Webhook actualizează `setOrgPlan` / `setPartnerAccountPlan` în `lib/server/plan.ts` — flow end-to-end funcțional
- ✅ Plan mapping curent în env vars: `pro`, `partner`, `partner_10`, `partner_25`, `partner_50` (5 SKU)

**Ce LIPSEȘTE real (~15%, ~6h work):**
1. **ICP tier mapping** — în cod sunt 5 SKU partner-centric. Doc 06 cere **16 SKU pentru cele 5 ICP segments**:
   - cabinet-solo €499 / cabinet-pro €999 / cabinet-studio €1999
   - imm-internal-solo €99 / imm-internal-pro €299
   - solo-starter €49 / solo-pro €99
   - fiscal-solo €299 / fiscal-pro €699
   - enterprise-custom (sales-led)
   - Adaugă în `STRIPE_PRICES` map din `app/api/stripe/checkout/route.ts` + env vars Stripe Dashboard — **~2h**
2. **UI billing dedicat per ICP segment** — există billing global (`/pricing`, settings tab), lipsește view ICP-aware care arată "you're on cabinet-pro €999, upgrade to cabinet-studio for X" — **~4h**

**Done când**: cabinet pe plan free → click "Upgrade Cabinet Pro" în settings → Stripe Checkout `cabinet-pro` SKU → webhook → `plans-global.json` updated cu `tier: "cabinet-pro"` → features unlock per ICP config.

⚠️ **Notă**: nu mai facem `lib/server/stripe-client.ts` ca wrapper — folosim Stripe REST API direct prin `fetch` (cum e deja în route.ts), e mai puțin overhead.

### ~~S2A.2 — Mistral EU sovereignty option~~ → **MUTAT în Sprint 2B (post-review)**

Mistral EU mutat în Sprint 2B (1-15 iun) pentru a libera Sprint 2A pentru Stripe + Supabase prep critical path.

### S2A.2 (vechiul S2.2) — Mistral EU PĂSTRAT pentru referință în Sprint 2B

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

### S2A.3 — Supabase dual-write pattern + migration script (~1.5 zile, era 3 zile)

⚠️ **Cutover mutat în Sprint 2B (post-review)**. S2A face DOAR dual-write enable + migration prod data, NU cutover production.

**Audit real v3-unified — ce EXISTĂ deja (~80%):**
- ✅ `lib/server/storage-adapter.ts` — abstracție `IStateStorage<T>` cu `LocalFileStorage` + Supabase implementation
- ✅ 17 fișiere `lib/server/supabase-*.ts`: `org-state`, `tenancy`, `evidence`, `storage`, `auth`, `rest`, `strict-preflight`, `status` + read variants + tests
- ✅ Toggle: `COMPLISCAN_DATA_BACKEND=local|supabase` (1 flag flip = cutover)
- ✅ RLS verification: `npm run verify:supabase:rls` + `verify:supabase:strict` + `verify:supabase:sprint5`
- ✅ Strict preflight: `supabase-strict-preflight.ts` (blochează start dacă RLS lipsește în production)
- ✅ Auth integration: `supabase-auth.ts`
- ✅ Schema completă pentru `users`, `orgs`, `memberships`, `plans-global`, `state-org-*`, `evidence`, `tenancy`

**Ce LIPSEȘTE real (~20%, ~1.5 zile work):**
1. **Dual-write pattern** — `storage-adapter.ts` curent e **fie/fie** (toggle `local|supabase`), nu **și/și** (write paralel, read primary, log discrepancies). Pattern-ul de safety pentru cutover production fără data loss:
   ```typescript
   // În storage-adapter.ts — adaugă DualWriteStorage<T>
   export class DualWriteStorage<T> implements IStateStorage<T> {
     constructor(
       private primary: IStateStorage<T>,    // local file
       private secondary: IStateStorage<T>,  // Supabase
       private onDiscrepancy: (orgId: string, p: T | null, s: T | null) => void,
     ) {}
     async write(orgId: string, state: T) {
       await Promise.all([this.primary.write(orgId, state), this.secondary.write(orgId, state)])
     }
     async read(orgId: string): Promise<T | null> {
       const [p, s] = await Promise.all([this.primary.read(orgId), this.secondary.read(orgId)])
       if (JSON.stringify(p) !== JSON.stringify(s)) this.onDiscrepancy(orgId, p, s)
       return p  // primary still authoritative
     }
   }
   ```
   Toggle nou: `COMPLISCAN_DATA_BACKEND=dual-write` — **~1 zi**
2. **Migration script production data** — schema există dar nu există un `scripts/migrate-fs-to-supabase.mjs` care să copieze `.data/state-{orgId}.json` → Supabase tables o singură dată înainte de dual-write enable — **~4h**

**S2A done când**: `COMPLISCAN_DATA_BACKEND=dual-write` activ pe staging, ambele backends scriu identic, log monitoring 1 săpt fără discrepancies.

**Cutover (S2B)**: setează `COMPLISCAN_DATA_BACKEND=supabase` DOAR după 1 săpt dual-write verify clean.

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

### Sprint 2A Done When (1-15 iun, extins post DPO feedback)

⚠️ **Sprint 2A reschedule**: 18-30 mai → 1-15 iun (Sprint 1 extended la 3 săpt cu cele 4 cerințe DPO noi).

- [x] **S2A.1** Stripe ICP tier mapping (14 SKU) + cabinet billing UI — ✅ commit `b43e395`
- [x] **S2A.4** ⭐ **Issue 6 DPO** — Monthly digest cron funcțional cu activitate reală — livrat pe `v3-unified`
  - Cron Vercel schedule "0 9 1 * *" (prima zi a lunii 09:00)
  - Per cabinet activ: aggregate findings closed + documents sent + magic links signed + evidence count
  - Email cabinet cu raport HTML brand-uit
  - Cabinet poate forward către clienți individual ca raport lunar per client
- [x] **S2A.5** ⭐ **Issue 2 DPO** — Baseline validate workflow — livrat pe `v3-unified`
  - UI cabinet: "Validează snapshot ca baseline" button după toate remedierile closed
  - Backend: set `state.validatedBaselineSnapshotId` la snapshot curent
  - Trigger conditions: 0 findings open + 0 remediations active + 100% evidence validated
  - UI badge "BASELINE VALIDAT" pe cockpit + Audit Pack
- [x] **S2A.6** ⭐ **Issue 7 DPO** — Audit_ready transition workflow — livrat pe `v3-unified`
  - Logic: `auditReadiness = "audit_ready"` doar când:
    - `validatedBaselineSnapshotId !== null`
    - `executiveSummary.openFindings === 0`
    - `executiveSummary.remediationOpen === 0`
    - `executiveSummary.missingEvidenceItems === 0`
    - `bundleEvidenceSummary.pendingControls === 0`
  - UI pe cockpit + dashboard: badge tranziție automată review_required → audit_ready
  - Audit Pack PDF cu watermark "AUDIT_READY" la export final
- [x] **S2A.7** Supabase dual-write pattern + migration script — ✅ commit `96e0f47`

**Sprint 2A total revizuit (v5.6)**: ~2 zile lucru real, NU 10 zile. Stripe + Supabase sunt 80-85% gata pe v3-unified — Sprint 2A devine task secundar care se poate topi în Sprint 1 sau în week 1 din Sprint 2B.

**Sprint 2A original (v5.3)**: ~10 zile lucru = 2 săpt (1-15 iun) — **invalidat de audit v5.6**.

---

## SPRINT 2B — Mistral EU + Supabase cutover (luni 1 → vineri 12 iun 2026)

**Obiectiv**: Mistral EU sovereignty option live + Supabase production cutover (după 1 săpt dual-write verify clean).

### S2B.1 — Mistral EU sovereignty option (1 zi)

(Detalii la fel ca S2.2 originalul, mutat aici post-review)

### S2B.2 — Supabase production cutover (1 săpt)

**Pași**:
1. Verify dual-write 1 săpt clean (no discrepancies între file-system și Supabase)
2. Cutover: setează `COMPLISCAN_DATA_BACKEND=supabase` în production env
3. Monitor Sentry + Supabase logs 48h
4. Rollback plan: dacă issues critice → revert env var, file-system rămâne authoritative

**Rollback/fallback**: dual-write rămâne enable post-cutover pentru 1 săpt extra. Revert posibil prin env var change, NU code change.

### S2B.3 — Hash chain end-to-end events ledger (1 zi)

(Bonus task pentru audit trail criptografic — dacă timeline ok)

### Sprint 2B Done When (1-12 iun)

- [x] Mistral EU live pentru Pro+ tier — ✅ commit `2a4f75e` (S2B.1 ai-provider abstraction)
- [ ] Supabase production cutover complet, 48h post-cutover stabil — ⏳ founder side: rulează `RELEASE-READY-CHECKLIST.md` secțiunea 2
- [x] Hash chain events ledger — ✅ commit `6deea54` (S2B.3 cu 10 unit tests)

---

## SPRINT 3 — Drift + Landing pages (luni 15 → vineri 19 iun 2026)

⚠️ **Calendar corectat post-review**: Sprint 3 mutat la 15-19 iun (după Sprint 2B cutover Supabase 12 iun) pentru a evita supervolume work paralel.



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

- [x] Drift cron daily + alerts cabinet — ✅ already exists `/api/cron/drift-sweep` schedule `0 6 * * *`
- [x] 4 landing pages public live — ✅ commit `8a8be85` (`/dpo`, `/fiscal`, `/imm`, `/nis2`)
- [x] Waitlist signup pentru 3 segmente coming soon — ✅ commit `8a8be85` (`/waitlist` + API + storage + tests)
- [ ] DPO Complet pilot retro 5 iunie completed — ⏳ founder side: pilot kickoff joi 7 mai

---

## PRODUCTION LAUNCH — luni 22 iunie 2026 (slipped din 15 iun)

⚠️ **Slip 1 săpt post-review**: production launch mutat 15 iun → 22 iun pentru a permite Sprint 2B Supabase cutover + Sprint 3 polish proper. Nu fac launch pe Supabase fresh-cutover.



**Obiectiv**: compliscan.ro live cu first paying customer + marketing landing complet.

### Pre-launch checklist

- [x] Toate Sprint 0-3 done (cod-side) — ✅ vezi `RELEASE-READY-CHECKLIST.md` secțiunea 0
- [ ] DPO Complet semnează subscription (5 iunie retro) — ⏳ founder side
- [ ] Testimonial video DPO Complet 2-min înregistrat — ⏳ founder side post-pilot
- [ ] LinkedIn case study post pregătit — ⏳ founder side post-pilot
- [ ] DNS compliscan.ro setup + SSL via Vercel — ⏳ founder side: `RELEASE-READY-CHECKLIST.md` secțiunea 5
- [ ] Email infrastructure (Resend) live — ⏳ founder side: `RELEASE-READY-CHECKLIST.md` secțiunea 4
- [ ] Stripe production keys validate — ⏳ founder side: `RELEASE-READY-CHECKLIST.md` secțiunea 3
- [ ] Sentry monitoring + alerts setup — ⏳ founder side
- [ ] Analytics tracking (privacy-friendly) — ⏳ founder side
- [ ] Backup + restore tested pe Supabase — ⏳ founder side: `npm run migrate:fs-to-supabase` dry-run

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

## REGULI EXECUTION (corectat post-review)

1. **NU începe Sprint 1 înainte de Sprint 0 done**. Critical path strict.
2. **NU sari peste teste** chiar dacă "merge mâna". Vitest run obligatoriu pre-commit.
3. **NU schimba arhitectura** fără citire Doc 02 + Doc 06. Lock-ul e real.
4. **NU rescrie cod working** ca să fie "mai elegant". Polish doar la production launch.
5. **NU adăuga features noi** care nu sunt în Doc 07 fără update Doc 06 + decision gate.
6. **DA commit zilnic — DAR doar după test/lint pass** ⚠️ (corectat post-review):
   - `npm run lint` pass
   - `vitest run` (sau test-uri relevante) pass
   - Dacă e WIP, push pe branch local separat, NU `v3-unified`
   - Niciodată push cu test fail "doar ca să bifez rutina"
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

🛠️ **EXECUTION ROADMAP LOCK 27 APR 2026 (v5.2 post-review)**

**Document maintainer**: Daniel Vaduva, founder
**Status**: 🛠️ EXECUTION — citește zilnic înainte de coding
**Versiune**: v5.2 — Execution Roadmap (27 apr 2026, corectat post-GPT review)
**Corecturi post-review v5.2 (7 erori GPT identificate)**:
1. Calendar fix: 27 apr = LUNI, 28 apr = MARȚI (era greșit "luni")
2. Sprint 0 = 4 zile (mar-vin), NU 5 zile
3. Sprint 1 split: pre-kickoff 3 zile + pilot-week hardening 7 zile
4. Bug 7 (feature flag fiscal hide) mutat din S1.4 în Sprint 0 (critic DPO demo)
5. Bug 4 path corectat: `app/api/shared/[token]/approve/route.ts`
6. Bug 4 fallback fără email Resend (event + alert in-app)
7. Sprint 2 split: S2A (Stripe + digest + Supabase prep) / S2B (Mistral + cutover)
8. Production launch slip: 15 iun → 22 iun (1 săpt pentru Supabase stabilization)
9. Commit rule: doar după test/lint pass

**Update obligatoriu**: la fiecare task done `[x]` + la fiecare decision gate
**Vezi și**: Doc 06 (Decision Lock) pentru contextul strategic
