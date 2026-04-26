# 04 — CompliScan: direcție și implementare

**Data**: 26 aprilie 2026
**Status**: canonical — singura sursă pentru "ce facem când și cum măsurăm reușita"
**Înlocuiește**: `compliscan-v1-final-spec-2026-04-26.md` + `IA-UX-IMPLEMENTATION-MATRIX.md` + secțiunea "Sprint plan" din `pilot-kickoff-dpo-30days-2026-04-26.md` + `demo-flow-ipo-real-2026-04-26.md`
**Validări incluse**: demo run pe cod real + DPO Complet pilot acceptance + 6 bug-uri concrete

---

## TL;DR — Roadmap v4.0 (lansare per ICP segment, NU per produs)

**Compliance Loop OS lansare faseată: 3 segmente paralele Q3 2026 (Solo + IMM Internal + Cabinet) → Fiscal Q1 2027 → Enterprise + EU expansion 2028.**

### Etapa 1 — Production launch 3 segmente (Q3 2026)

Lansare paralelă **Solo + IMM Internal + Cabinet** pentru că folosesc aceeași infrastructure + aceleași framework rules (GDPR + NIS2 + Whistleblowing).

| Sprint | Durată | Ce livrăm | Validare |
|---|---|---|---|
| **S0** | 5 zile (27 apr → 1 mai) | Fix 6 bug-uri infrastructure (workspace.label, disclaimer, Diana branding, Aprob button, SHA-256, PDF font) | Demo refăcut fără bug-uri vizibile |
| **S1** | 2 săpt (4 → 16 mai) | ICP segment choice onboarding + nav config per segment (Solo simplified / IMM full / Cabinet white-label) + custom templates UI + reject/comment flow + AI on/off | Pilot kickoff DPO Complet (Cabinet segment) 7 mai |
| **S2** | 2 săpt (18 → 30 mai) | Stripe billing 16 SKU pe 5 grupuri segment + Mistral EU optional + Supabase cutover + monthly digest | Primii clienți reali în pilot |
| **S3** | 1 săpt (1 → 7 iun) | Drift cron + 4 landing pages live (`/solo`, `/imm`, `/cabinet`, `/fiscal` waitlist) + framework rules polish (Whistleblowing, Pay Transp partial) | Pilot retro + outreach Solo + IMM Internal start |
| **PROD** | 1 săpt (15 iun) | Production launch 3 segmente + hub principal compliscan.ro + pricing page | First paying customers across 3 segmente |

**Pilot DPO Complet kickoff** (Cabinet segment): **Joi 7 mai 2026, 15:00**.

### Etapa 2 — Fiscal segment launch (Q1 2027)

Sprint dedicat 4-6 săpt înainte de Q1 2027 (start ~1 dec 2026):
- Activează landing `/fiscal`
- Cabinet contabil specific UI (NU cabinet DPO format)
- Bulk e-Factura import + SAF-T D406 export complet
- Integrări SmartBill / Saga / Oblio
- Distribuție Facebook groups "Contabili pe Facebook" 50K + Nicoleta Banciu 34K

### Etapa 3 — Enterprise segment + framework rules expansion (Q3 2027 → 2028)

- Q3 2027: Enterprise tier custom deals (banking, healthcare 500+ ang) + Pay Transparency rules launch (compliance officer intern Internal Pro)
- Q1 2028: AI Act rules polish — Annex III/IV deployer workflow + AI Governance specific UI pentru Cabinet Studio
- Q3 2028: DORA rules full — BNR reporting + ICT third-party + Big 4 partnerships
- 2028+: EU expansion adjacent (BG, HU, PL) pe Solo + IMM + Cabinet (Cabinet Solo €499 traduceabil)

---

## 1. Sprint 0 — Fix bug-uri vizibile (5 zile lucru, 27 apr → 1 mai)

**Obiectiv**: la sfârșitul săptămânii, demo-ul rerulat NU mai are bug-urile descoperite în run-ul de azi.

### Livrabile concrete

| Task | Fix | ETA | Done când |
|---|---|---|---|
| **0.1** | Bug 1: workspace.label propagare cabinet/client name în 5+ locuri | 4h | Audit Pack ZIP refăcut nu mai conține "Workspace local" |
| **0.2** | Bug 2: disclaimer toxic reframe în document generator (Privacy Policy + DPA + Retention + AI Governance) | 2h | Document footer = "Pregătit de {cabinet} — {consultant}, status DRAFT" |
| **0.3** | Bug 3: Diana branding card pe `/shared/[token]` cu nume + cert + email + phone + logo cabinet | 6h | Patron page conține consultant card complet |
| **0.4** | Bug 4 partial: Aprob button + endpoint POST + email cabinet on approve | 6h | Patron click "Aprob" → document `signed` + email cabinet |
| **0.5** | Bug 5: SHA-256 hash chain în bundle-manifest.json + tabelă în MANIFEST.md | 4h | unzip + verify SHA-256 manual = match per fișier |
| **0.6** | Bug 6: PDF font Helvetica fix (next.config.js + serverExternalPackages SAU swap la @react-pdf/renderer) | 4h | `GET /api/exports/audit-pack/pdf` returnează 200 cu PDF valid |
| **0.7** | Re-run demo cu setup DPO Complet + 3 clienți + 5 findings, capture output, generate noul ZIP package | 4h | Pachet curat pentru DPO Complet pre-kickoff |
| **0.8** | Email DPO Complet cu reschedule la Joi 7 mai + transparență despre fix-uri Sprint 0 | 1h | Email trimis, primit confirm slot |

**Total**: ~31 ore = 4 zile lucru solid + 1 zi tampon. Realizabil în 5 zile.

### Exit criteria S0

- ✅ Toate 6 bug-uri fixed și verificate empiric (re-run demo)
- ✅ Audit Pack ZIP la maturitate 95%+ (era 70% azi)
- ✅ Pachet demo refăcut trimis la DPO Complet
- ✅ Slot kickoff confirmat Joi 7 mai

### Risc S0

- **Risk**: PDF font fix poate dura mai mult dacă pdfkit replacement
- **Mitigare**: dacă >2 zile pe Bug 6, swap pe `@react-pdf/renderer` complet (1 zi rewrite)

### Comit & branch strategy S0

- Branch: `v3-unified` (continuăm pe el)
- Commits: per task (S0.1, S0.2, ..., S0.8)
- Push intermediate la final task → Vercel deploy preview pentru testing

---

## 2. Sprint 1 — Pilot prerequisites (2 săpt, 4 mai → 16 mai)

**Obiectiv**: cabinet DPO Complet poate face TOT pilot-ul de 30 zile fără workaround-uri founder, exclusiv prin UI.

### Livrabile concrete

| Task | Fix | ETA | Done când |
|---|---|---|---|
| **1.1** | Custom template upload UI (`/dashboard/cabinet/templates`) | 3 zile | Cabinet upload Word/markdown → activate per finding type → folosit în cockpit |
| **1.2** | Reject/comment flow complet pe `/shared/[token]` | 1.5 zile | Patron Respinge cu mandatory comment + Trimite comentariu separat |
| **1.3** | UI cabinet pentru pending approvals + comments primite | 1 zi | Cabinet vede toate magic links pending + cu badge "Comentariu nou" |
| **1.4** | AI ON/OFF toggle per client + check în document-generator | 4h | Toggle în client settings → document-generator returnează `aiSkipped: true` dacă off |
| **1.5** | Feature flag `module.fiscal.enabled` per cabinet (sidebar conditional + state filtering + findings detector check) | 1.5 zile | Cabinet DPO mode → 0 fiscal routes vizibile + 0 fiscal findings detected |
| **1.6** | UI brand setup wizard (logo upload + color picker + signature editor) | 2 zile | Cabinet new face onboarding singur cu brand-config pe 3 steps |
| **1.7** | ANAF prefill pentru cabinet la register (CUI → ONRC info) | 4h | Cabinet new auto-prefilled cu sediu + sector |
| **1.8** | Demo data seed pentru cabinet new (1 client demo + 3 findings sample) | 4h | First-time cabinet vede portofoliu populat să exploreze |
| **1.9** | Onboarding flow guided (step 1 brand, step 2 first client, step 3 first finding) | 2 zile | Cabinet new cu progress bar 3 steps în UI |
| **1.10** | Email notifications cabinet on patron action (approve/reject/comment) | 4h | Diana primește email + dashboard alert |

**Total**: ~14 zile lucru. Sprint 2 săpt = 10 zile lucru → 1.4× planning. **Tăiem onboarding wizard 1.9 dacă nu încape, livrăm Sprint 2.**

### Exit criteria S1

- ✅ Custom templates funcționează (cabinet upload → folosit în cockpit)
- ✅ Reject/comment flow complet pe magic link
- ✅ AI ON/OFF toggle per client
- ✅ Feature flag fiscal ascunde rute pentru DPO ICP
- ✅ Brand setup wizard funcțional
- ✅ DPO Complet pilot kickoff Joi 7 mai pornit cu produs curat

### Risc S1

- **Risk**: Custom templates UI poate dura mai mult dacă design complex
- **Mitigare**: Sprint 1.1 livrează minimum viable (upload + activate), polish în S2
- **Risk**: Onboarding wizard necesită UX iteration
- **Mitigare**: tăiem dacă timeline tight, livrăm S2

---

## 3. Sprint 2 — Maturity (2 săpt, 18 mai → 30 mai)

**Obiectiv**: produs care suportă primii clienți plătitori reali (Stripe live + persistence production).

### Livrabile concrete

| Task | Fix | ETA | Done când |
|---|---|---|---|
| **2.1** | Stripe Checkout integration + webhook handler | 2 zile | Cabinet click "Upgrade Pro" → Stripe Checkout → webhook updates plan tier |
| **2.2** | Plan tier auto-update + invoice generation | 1 zi | Plan flips de la free → pro automat după plată reușită |
| **2.3** | Trial countdown UI (X zile rămase din 14) | 4h | Banner "5 zile rămase din trial" cu CTA upgrade |
| **2.4** | Plan upgrade UI (prompt când feature blocked) | 6h | Click pe Audit Pack la free → modal "Upgrade pentru Pro" |
| **2.5** | Mistral EU sovereignty option (provider abstraction) | 1 zi | Tier Growth+ poate switch Mistral în settings |
| **2.6** | Hash chain end-to-end pe events ledger | 1 zi | Events linked cu prev_hash, verification endpoint |
| **2.7** | Supabase migration cutover (RLS + dual-write verify + final flip) | 2-3 zile | `COMPLISCAN_DATA_BACKEND=supabase` în production |
| **2.8** | Drift detection schema + algoritm initial (vendor changes detection) | 1.5 zile | `detectDrift(state)` returnează DriftRecord[] pentru vendor noi |
| **2.9** | Versioning automat al documentelor (v1, v2, v3 cu changelog) | 1 zi | Document update creează nou version, păstrează istoric |
| **2.10** | Demo data seed extended (5 clienți + 15 findings) pentru cabinet new | 4h | Cabinet new vede portofoliu mai bogat în demo mode |

**Total**: ~12 zile lucru. Sprint 2 săpt = 10 zile. **Tăiem 2.10 sau 2.4 dacă timeline tight.**

### Exit criteria S2

- ✅ Stripe billing live (cabinet poate plăti real)
- ✅ Mistral EU disponibil pentru Growth+
- ✅ Supabase pe production (file-system local doar pentru dev)
- ✅ Hash chain pe events ledger
- ✅ Drift detection schema funcțional (vendor changes minimum)

### Risc S2

- **Risk**: Supabase migration poate dezvălui issue-uri RLS sau perf
- **Mitigare**: dual-write 1 săpt înainte de cutover, rollback plan documented
- **Risk**: Stripe integration are edge-cases (failed payments, refunds, plan downgrades)
- **Mitigare**: pilot DPO Complet în această perioadă = test real, fix bugs imediat

---

## 4. Sprint 3 — Drift & reopen (2 săpt, 1 iun → 13 iun)

**Obiectiv**: aplicația detectează automat schimbări în context client și redeschide cazuri fără intervenție manuală cabinet.

### Livrabile concrete

| Task | Fix | ETA | Done când |
|---|---|---|---|
| **3.1** | Algoritm `detectDrift(state)` complet (vendor changes + doc outdated + dsar overdue + dpa expired) | 3 zile | Pentru fiecare drift type, returnează DriftRecord cu severity + findingIdToReopen |
| **3.2** | Cron job zilnic via Vercel Cron pentru toate cabinetele active | 1 zi | Daily run, log la `events`, alert pe slow runs |
| **3.3** | UI badge "REDESCHIS" pe cockpit cu motivare | 4h | Finding redeschis arată badge + reason text |
| **3.4** | Email + dashboard alert pe drift critic | 6h | Cabinet primește email "3 cazuri redeschise pentru clientul Apex Logistic" |
| **3.5** | Reopen finding automation (status active → detected) | 4h | Lifecycle update auto + history snapshot |
| **3.6** | History snapshot la fiecare reopen (cu reason + timestamp) | 4h | UI cockpit → "Istoric redeschideri" cu ce a triggered |
| **3.7** | NIS2 integration full (DNSC incident reporting endpoint) | 2 zile | Cabinet poate trimite incident DNSC din UI cu OUG 155/2024 format |
| **3.8** | Onboarding flow video tutorial in-app (3 min explainer) | 1 zi | First login → modal video play optional |
| **3.9** | Diff view între versiuni document | 2 zile | `/dashboard/[client]/documente/[id]/diff?from=v1&to=v2` |
| **3.10** | Drift settings UI (severity overrides + thresholds per cabinet) | 1 zi | Cabinet poate ajusta când să primească alert (ex: "DPA expirat = 30 zile înainte") |

**Total**: ~14 zile lucru. **Tăiem 3.8 sau 3.9 dacă timeline tight.**

### Exit criteria S3

- ✅ Drift detection auto + reopen funcționale (verified pe pilot DPO Complet)
- ✅ NIS2 integration full pentru cabinetele cu clienți reglementați
- ✅ Cabinet primește alert automat la drift critic
- ✅ Pilot DPO Complet retro finalizat → decizie subscription

### Risc S3

- **Risk**: Drift detection poate genera false positives (alert spam)
- **Mitigare**: severity thresholds + dedupe logic + cabinet feedback retro
- **Risk**: NIS2 DNSC integration poate fi blocked de API DNSC instabil
- **Mitigare**: fallback la export ZIP semnat manual + email DNSC

---

## 5. Sprint 4 — Production launch (2 săpt, 15 iun → 27 iun)

**Obiectiv**: produsul livrabil pentru orice cabinet DPO RO care vine self-serve fără intervenție founder.

### Livrabile concrete

| Task | Fix | ETA | Done când |
|---|---|---|---|
| **4.1** | Multi-cabinet support (Studio tier — partner-of-partners) | 2 zile | Cabinet mare poate manage sub-cabinete |
| **4.2** | Custom domain support pentru patron page (cabinet.compliscan.ro sau cabinet-domain.ro) | 3 zile | DNS setup wizard + SSL auto via Vercel |
| **4.3** | Multi-language patron page (RO + EN minimum) | 1 zi | Toggle language detect + fallback EN |
| **4.4** | Embed signature canvas pe `/shared/[token]` | 3 zile | Patron poate semna digital pe canvas, image embedded în PDF |
| **4.5** | Security hardening (CSP, HSTS, rate limiting all endpoints, Sentry alerts) | 2 zile | Penetration test pass, OWASP top 10 covered |
| **4.6** | Audit Pack hash chain între versiuni (audit trail criptografic) | 1 zi | New audit pack version include `prev_audit_pack_hash` |
| **4.7** | API key management (Pro+) | 1 zi | Cabinet poate genera API keys + rate limit + scope |
| **4.8** | Annual billing discount (20%) | 4h | Stripe annual plan + UI toggle |
| **4.9** | Multi-currency support (EUR + RON) | 1 zi | Cabinet poate alege currency, Stripe handle |
| **4.10** | Marketing landing page production-ready (compliscan.ro) | 1.5 zile | Hero + pricing + features + testimonial DPO Complet + CTA |

**Total**: ~16 zile lucru. **Tăiem 4.4 sau 4.7 dacă timeline tight, livrăm S5.**

### Exit criteria S4

- ✅ Production launch (Vercel + Supabase + Stripe live)
- ✅ Marketing landing page live
- ✅ Onboarding self-serve funcțional
- ✅ Security hardening complet
- ✅ First 3-5 paying customers (post DPO Complet)

### Risc S4

- **Risk**: Landing page UX/copy iterations
- **Mitigare**: Beta launch cu 5 cabinete invited, feedback before public launch
- **Risk**: Custom domain SSL setup poate dura mai mult
- **Mitigare**: Vercel auto-SSL standard, doar setup DNS pe partea cabinet

---

## 6. Pilot DPO Complet — plan detailed (30 zile)

### Pre-kickoff (30 apr → 6 mai)

**S0 livrat la cabinet**:
- 30 apr: email reschedule cu transparency despre Sprint 0 fix-uri
- 1 mai: pachet demo refăcut trimis (sau via screen-share session opțional)
- 4-6 mai: cabinet trimite logo, signature, 2-3 templateuri, listă clienți pilot
- 6 mai: founder face import manual templateuri (workaround Sprint 1.1)

### Săpt 1 — Internal-only (7-13 mai)

| Zi | Activitate |
|---|---|
| Joi 7 mai | Kickoff call 60min — revedere demo + setup brand + add 2-3 clienți pilot pseudonimizați |
| 8-10 mai | Cabinet exploră singur — Slack support founder zilnic |
| 13 mai | Săpt 1 retro 30min — feedback brand setup, ce funcționează, ce nu |

**Milestone**: cabinet a făcut singur:
- Setup brand (logo, signature)
- Add 2-3 clienți (cu CSV import sau manual)
- Generat primul draft document pe un finding
- Validat și marcat document `signed` (fără magic link încă)

### Săpt 2 — Primul client real cu cooperant (14-20 mai)

| Zi | Activitate |
|---|---|
| 14 mai | Cabinet selecționează 1 client real "cooperant" (ex: prietenos cu testare nouă) |
| 15-17 mai | Cabinet seed client real cu date adevărate (CUI, sector, etc.) — DAR nu trimitem la patron încă |
| 18 mai | Test magic link cu un email intern al cabinetului ("patron simulat") |
| 20 mai | Săpt 2 retro 30min — Audit Pack download local + verify |

**Milestone**: Audit Pack ZIP descărcat și verificat manual de cabinet — structura, MANIFEST, SHA-256 (post-S0 fix), reports.

### Săpt 3 — Magic link la patron real (21-27 mai)

| Zi | Activitate |
|---|---|
| 21 mai | Cabinet trimite primul magic link la patron real (clientul cooperant) |
| 22-25 mai | Patron interacționează — Aprob (sau Respinge cu comment dacă S1 livrat) |
| 26 mai | Test al doilea client real (mai puțin cooperant) |
| 27 mai | Săpt 3 retro 30min — patron experience feedback |

**Milestone**: minim 1 document `signed` prin magic link în pilot.

### Săpt 4 — Drill complet + retro (28 mai → 5 iun)

| Zi | Activitate |
|---|---|
| 28-30 mai | Cabinet face Audit Pack ZIP pentru toți 2-3 clienți pilot + verifică structurile |
| 31 mai | Test drift detection (dacă S2 livrat) — adaugă vendor nou la 1 client, vezi alert |
| 1-3 iun | Pregătire retro — cabinet documentează ce funcționează / ce nu |
| 4 iun | Pilot retro 90min — 6 condiții bifate, decizie subscription |
| 5 iun | Email finalizare cu plan tier propus + Stripe link (S2 livrat) |

**Milestone pilot end**:
- Cabinet a folosit aplicația minim 4 săpt
- Minim 3 clienți pilot, minim 5 findings rezolvate, minim 3 documente generate
- Audit Pack ZIP pentru fiecare client verificat
- Decizie: continuă subscription? (target: yes pe Growth €349/lună)

---

## 7. Sales motion — outreach DPO firms post-DPO Complet

### Etapa 1 — Pilot DPO Complet success (iunie 2026)

Dacă DPO Complet semnează subscription Growth după pilot → testimonial pentru landing page + LinkedIn case study.

### Etapa 1 outreach — DPO OS post-pilot (iulie-august 2026)

**Strategie diferențiată per concurent actual + per ICP** (post market validation 26 apr 2026):

**Target A — DPO OS** — Cabinete care folosesc Privacy Manager azi (frustrate de UX legacy + sales-led pricing):
1. iGDPR (CIPP/E + CIPM)
2. DPO Consulting
3. WestGDPR
4. EuroMarket (Iași)
5. NeoPrivacy

**Pitch**: "Privacy Manager funcționează, dar a îmbătrânit pe UX. CompliScan DPO OS e next-gen cu cockpit finding-first + pricing transparent self-serve €149-299. Pilot 30 zile gratis."

**Target B — DPO OS** — Cabinete care folosesc Excel/Word (5-30 clienți, sub 5 oameni):
6. DPO Expert (€79-360/lună servicii)
7. iTProtection (€100/lună DPO entry)
8. PrivacyON
9. DPO Safety
10. dpo-timisoara
11. gdpr-bucuresti.ro

**Pitch**: "Ai 15 clienți pe Drive + Excel. La 20 clienți devine haos. CompliScan DPO OS Solo €49 sau Cabinet €149, prim SaaS profesional cu cabinet operations real + Audit Pack ZIP în 2 minute."

**Target C — DPO OS Combo** — Cabinete top tier care cer cross-framework:
12. LegalUp (650-3500 RON, are NIS2 ca service)
13. Accace (multi-country)
14. Setrio MyBiz GDPR

**Pitch**: "GDPR + NIS2 light + ANAF integrations native într-un singur cabinet view. Combo DPO + NIS2 €399 sau Studio All-in €1.999."

**Format outreach Etapa 1**:
- LinkedIn DM personalizat (consultant DPO senior, NU general info@)
- Subject: "DPO Complet folosește acum CompliScan DPO OS după pilot — îți pot arăta în 15 min?"
- Body: 1 paragraph diferențiator concret per target type + link landing page `/dpo` + propunere call

Target Etapa 1: **3-5 piloturi noi în iulie-august pe DPO OS**.

**NU outreach Etapa 1 la**:
- Decalex/MyDPO (concurent direct cu propriu produs)
- Wolters Kluwer Romania (enterprise channel diferit, NU mass-market)
- Privacy Manager (vendor — nu vinzi la el)
- CISO/cybersec firms (Sectio Aurea, HIFENCE) → așteaptă Etapa 2 NIS2 OS lansare Q1 2027

### Etapa 2 outreach — NIS2 OS launch (decembrie 2026 → februarie 2027)

**Target NIS2 OS — CISO consultanți**:
- Sectio Aurea
- HIFENCE
- Prodefence
- SecureShield
- iSoft Consulting

**Pitch NIS2 OS**: "12.000 entități obligate NIS2 în RO, deadline înregistrare DNSC trecut 22 sept 2025. Multe încă neînregistrate. CompliScan NIS2 OS oferă SaaS multi-client pentru CISO consultanți: incident reporting 3-stage + DNSC integration + vendor risk + maturity assessment. Cabinet €299/lună."

**Target Compliance Officer intern (firme obligate NIS2)**:
- Outreach via LinkedIn la firme din sectoare reglementate (energie, sănătate, transport, fintech)
- Single Entity tier €99/lună
- Pitch: "Tu ești în firmă esențială/importantă obligată NIS2. CompliScan NIS2 OS te conduce de la DNSC registration la incident reporting Art. 23 cu 3 stages. €99/lună."

### Etapa 3 outreach — Fiscal OS launch (mai → iulie 2027)

**Target Fiscal OS — Contabili CECCAR**:
- Distribuție via Facebook groups: "Contabili pe Facebook" 50K + grupul Nicoleta Banciu 34K e-Factura
- Outreach la cabinete contabile cu 30-100 clienți SRL

**Pitch Fiscal OS**: "Toate cabinetele contabile RO sunt obligate să gestioneze e-Factura clienților. SmartBill emite, dar nu validează. CompliScan Fiscal OS = primul SaaS validator UBL CIUS-RO + ANAF SPV signals + e-TVA discrepancies + SAF-T export. Solo €29 / Cabinet €99 / Pro €199."

### Etapa 4 outreach — AI Act OS launch (2028)

**Target AI Act OS — AI Governance specialists**:
- Avocatură cu practice AI (Wolf Theiss, DLA Piper, Bird & Bird, PrivacyON)
- AI startup community (UiPath alumni, AI Romania community)
- Firme cu produse AI (deployer/provider Annex III)

**Pitch AI Act OS**: "AI Act intră în vigoare august 2026 (high-risk systems). CompliScan AI Act OS = AI inventar + Annex III risk classification + Annex IV documentation generator. Starter €149 / Pro €499."

### Etapa 5 outreach — DORA OS launch (2028)

**Target DORA OS — Financial Compliance**:
- Big 4 partnerships (PwC, Deloitte, EY, KPMG)
- Boutique financial compliance firms RO
- Fintech mid-market (~250-300 entități obligate DORA)

**Pitch DORA OS**: "DORA în vigoare 17 ian 2025. Big 4 €100K+/an. CompliScan DORA OS = primul SaaS la pricing accesibil €499-1.499/lună pentru fintech mid-market."

### Etapa 3 — Channel via comunități (sept 2026)

- Facebook groups: "DPO România", "Compliance Romania", "GDPR Romania"
- Forum CECCAR (pentru contabili curioși) — NU vinde, doar citește pentru insight
- Reddit r/romania business — cu prudență
- Linkedin newsletter founder (1× pe lună)

### Etapa 4 — Outreach EU (Q4 2026 → 2027)

DPO firms din BG, HU, PL, GR — piețele EE/SE cu legislație similară RO. Pricing identic, multi-language Sprint 4.

---

## 8. Pricing rollout — sequence (post market validation cu Mini €99 introdus)

### Pricing tiers final (5 tiers, +Mini)

| Tier | Preț/lună | Clienți | Target |
|---|---|---|---|
| **Mini** | €99 | 10 | Cabinete sub 15 clienți, exit Excel |
| **Solo** | €149 | 15 | DPO solo cu portofoliu activ |
| **Growth** | €349 | 50 | Cabinet în creștere — TARGET PRINCIPAL |
| **Pro** | €699 | 100 | Cabinet stabilit |
| **Studio** | €999 | Multi-cabinet | Firmă mare cu sub-cabinete |

### Fază 1 — Pilot prețuri (4-6 mai → final pilot DPO Complet)

- Cabinet primește **Growth €349/lună** gratis pe perioada pilot 30 zile
- Founder activează manual plan în `.data/plans-global.json`
- La end-of-pilot, factură fizică din contul founder (S2 Stripe pending)

### Fază 2 — Stripe live (S2, 18 mai)

- Cabinet pe pilot face self-serve upgrade la Growth (sau Solo dacă portofoliu mai mic)
- Stripe Checkout + webhook funcțional
- Trial countdown UI activ
- **Mini tier** disponibil pentru outreach Target B (cabinete 5-30 clienți)

### Fază 3 — Public pricing page (S3 final, ~15 iun)

- compliscan.ro/pricing live cu 5 tiers
- "Start free trial 14 days" CTA self-serve
- **Comparison table cu Privacy Manager + MyDPO + Wolters Kluwer** (NU cu DataGuard/OneTrust care nu sunt în RO):
  - "Pricing transparent vs sales-led" (diferențiator)
  - "Cockpit finding-first vs workflows fragmentate"
  - "Multi-framework RO native vs GDPR-only"
  - "Self-serve onboarding 5 min vs 2 săpt sales cycle"

### Fază 4 — Annual discount (post-S3, ~22 iun)

- Annual billing 20% off vizibil în pricing page
- Per cabinet: opțiune monthly sau annual
- Marketing email "annual = -20%" către pilot cabinete

### Fază 5 — Migration offer pentru cabinete pe Privacy Manager (Q3 2026)

- Outreach diferențiat la cabinete care folosesc Privacy Manager azi
- Offer: "Migrare cu CSV import gratuit + 3 luni discount 50% dacă semnezi annual"
- Target: 3-5 cabinete switch în primele 3 luni post-launch

---

## 9. Tehnologie stack & decisions

### Stack canonical (locked)

| Layer | Tehnologie | De ce |
|---|---|---|
| **Frontend** | Next.js 15 App Router | SSR, server components, edge runtime |
| **Styling** | Tailwind CSS + V3 design system | Tokens-driven, dark mode, fast dev |
| **State** | React Server Components + per-route data | Minimal client state, server-first |
| **Auth** | Custom HMAC-SHA256 sessions | No external auth dependency, full control |
| **DB** | Supabase Postgres + Storage | RLS, RT, EU region available |
| **AI primary** | Gemini 2.5 Flash Lite via Vertex AI EU | Cost effective, EU sovereign |
| **AI optional** | Mistral Large 2 EU (Growth+) | Pure EU sovereignty for fintech/healthcare |
| **Billing** | Stripe Checkout + webhooks | Standard SaaS billing |
| **Hosting** | Vercel | Next.js optimized, edge functions, EU regions |
| **Monitoring** | Sentry | Error tracking, performance |
| **Analytics** | Custom events + jsonl log | Privacy-friendly, no external tracker |
| **Email** | Resend | Transactional emails EU-friendly |
| **PDF** | @react-pdf/renderer (post-S0 swap) | Modern, Next.js compatible |

### Decisions made (locked)

✅ Next.js App Router NU Pages Router
✅ Server-first NU client-heavy SPA
✅ Supabase NU Firebase / DynamoDB
✅ HMAC sessions NU NextAuth / Auth0 / Clerk
✅ Gemini EU NU OpenAI / Anthropic primary
✅ Vercel NU AWS / Self-host
✅ Stripe NU Paddle / LemonSqueezy
✅ Resend NU SendGrid / Postmark

### Decisions NOT made (open)

❓ Mobile app (PWA suficient sau native iOS/Android?)
❓ Slack integration (canal alerts pentru cabinet?)
❓ Zapier integration (când demand justifică?)
❓ Audit log retention (1 an / 5 ani / 10 ani per plan?)

---

## 10. Resources & budget

### Personal (founder solo 2026)

- **Founder**: Daniel Vaduva — full-time pe CompliScan
- **Advisori**: 2-3 DPO seniori RO (gratis pentru testimonial + early access)
- **Designer**: nu (Tailwind + V3 system + iconography open-source suficient)

### Cheltuieli operaționale lunare (estimate post-launch)

| Item | Cost/lună | Note |
|---|---|---|
| Vercel Pro | $20 | Hobby plan suficient inițial, upgrade Pro la 5+ cabinete |
| Supabase Pro | $25 | Free tier până la 500MB + 50GB storage |
| Gemini Vertex AI EU | $50-200 | Variable cu usage |
| Stripe fees | 1.5% + €0.25 | Standard EU rate |
| Resend | $20 | 50K emails/lună plan |
| Sentry | $26 | Team plan |
| Domain + DNS | $20/an | compliscan.ro + custom domains |
| **Total** | **~$140-300/lună** | Scalează cu usage |

### Punct de profitabilitate

Cu pricing media €350/lună (mix Solo + Growth):
- Break-even: 1 cabinet plătitor = €350 acoperă toate cheltuielile lunare
- Marja per cabinet: ~80% (după costuri AI + Stripe fees)

→ **Pilot DPO Complet la Growth €349/lună = break-even instant** dacă semnează.

### Budget pentru ad-uri (Q3-Q4 2026)

- LinkedIn ads pentru DPO target: €500/lună (test 3 luni)
- Google Ads keyword "DPO software Romania": €300/lună (test 3 luni)
- Total: €2.400 budget marketing primii 3 luni post-launch

---

## 11. Long-term vision v4.0 — Compliance Loop OS portfolio (2026 → 2030)

### 2026 (year 1) — 3 segmente lansate paralel + 50-100 plătitori distribuiți

**Q1-Q2**: pilot DPO Complet (Cabinet segment) → S0-S3 → production launch 15 iun (3 segmente: Solo + IMM Internal + Cabinet)
**Q3**: outreach paralel pe 3 ICP-uri:
- Solo: marketing content + Facebook groups "SRL Romania", "Antreprenori RO" → 20-30 plătitori (€600-1.500 MRR)
- IMM Internal: outreach LinkedIn la CFO/COO + content "ROI 2-5× vs 4 consultanți" → 10-20 plătitori (€3-15K MRR)
- Cabinet: outreach DPO/CISO consultanți (post-pilot DPO Complet success) → 5-10 plătitori (€2-15K MRR)
**Q4**: portfolio mix:
- 30-50 SOLO (€1-2K MRR)
- 15-30 IMM INTERNAL (€5-25K MRR)
- 10-20 CABINET (€5-30K MRR)
- **Total: €11-57K MRR (€135-680K ARR)**

**Revenue 2026 estimate**: €100-300K ARR (3 segmente paralele, NU doar 1 produs cum era v3.0)

### 2027 (year 2) — Fiscal Q1 lansat + portfolio scaling

**Q1**: Fiscal launch — distribution Facebook groups "Contabili pe Facebook" 50K + Nicoleta Banciu 34K → 30-50 contabili plătitori (€2-8K MRR adițional)
**Q2**: portfolio mix scaling:
- 80-150 SOLO (€3-7K MRR)
- 50-100 IMM INTERNAL (€18-50K MRR)
- 30-60 CABINET (€20-80K MRR)
- 30-60 FISCAL (€2-10K MRR)
- **Total: €43-147K MRR (€500K-1.7M ARR)**
**Q3**: AI Act rules polish + Pay Transparency activated în IMM Internal Pro → IMM Pro upgrades €299→€599
**Q4**: Enterprise tier custom deals (3-5 deals × €5-15K/lună = €15-75K MRR adițional)

**Portfolio end of 2027**:
- **Total: €70-200K MRR (€800K-2.4M ARR)**

### 2028 (year 3) — DORA + EU expansion adjacent

**Q1-Q2**: continuă creștere pe 4 segmente RO + DORA rules launch (Cabinet Studio + Enterprise)
**Q3**: EU expansion adjacent — Polonia (Solo + IMM + Cabinet, GDPR + NIS2 dominante)
**Q4**: BG + HU launch pe Solo + IMM (translated landing pages)

**Portfolio end of 2028**:
- 200-400 SOLO RO + 50-100 EU (€6-15K MRR)
- 100-200 IMM INTERNAL (€30-100K MRR)
- 60-120 CABINET (€40-160K MRR)
- 100-200 FISCAL (€8-20K MRR)
- 10-20 ENTERPRISE (€50-200K MRR)
- **Total: €134-495K MRR (€1.6M-5.9M ARR)**

### 2029-2030 — Portfolio maturity + category leadership

- 500+ SOLO + 300+ IMM + 200+ CABINET + 300+ FISCAL + 30-50 ENTERPRISE
- EU adjacent (BG, HU, PL, CZ, GR) pe Solo + IMM + Cabinet
- **Total: €200-500K MRR (€2.5-6M ARR)**
- Brand de referință "Compliance Loop OS" — categoria nouă recunoscută
- Posibilă expansion vertical: training modules, certificare cabinete, marketplace consultanți

### Strategic exit options (2029+)

**Pattern Stripe/Atlassian/HubSpot**:
- Portfolio play cu 5 produse vertical specializate = multiplu evaluare 5-10× ARR
- Exit value 2029-2030: €7.5M-25M (vs €100-300K dacă rămâneam single product)
- 3-7× value lift doar prin reposition de la "single SaaS GDPR" la "5-product portfolio compliance RO"

**Cumpărători potențiali**:
- **Decalex** (au 800+ clienți, complementar pe distribuție)
- **Privacy Manager** (potențial buyout dacă ei stagnează, noi creștem)
- **DataGuard EU expansion** (parteneriat partener regional pentru EE)
- **Wolters Kluwer** (acquihire pentru localizare RO)
- **Big 4** (PwC/Deloitte) pentru DORA OS spinoff

### Risc strategic post-discovery 5 produse

**Risc 1 — Solo founder peste 5 produse**:
- **Mitigare**: NU lansăm toate 5 simultan. Lansare faseată 1 produs / 6-9 luni. Founder se concentrează pe 1 ICP la timp.
- **Hire necesar 2027**: 1 product manager (după DPO OS profitable) + 1 dev senior

**Risc 2 — Decalex/MyDPO investește în multi-client + cabinet operations**:
- **Mitigare**: viteză execuție Q3 2026 launch. Win cabinete primii înainte ca Decalex să mute.

**Risc 3 — Privacy Manager modernizează UX + scade pricing**:
- **Mitigare**: cockpit finding-first e structural unic, greu de copiat fără rewrite complet.

**Risc 4 — Niciun produs din 5 nu prinde**:
- **Mitigare**: pilot DPO Complet e validare. Dacă DPO Complet semnează la sfarsit pilot Q3 2026 → DPO OS validat. Dacă nu → pivot la alt ICP (NIS2 OS first sau pivot 3A NIS2 sector public RO).

**Risc 5 — DORA OS prea complex pentru solo founder**:
- **Mitigare**: DORA OS lansare 2028, NU 2026. Întâi cash flow din DPO + NIS2 + Fiscal. Hire dedicated team pentru DORA când ARR > €500K.

---

## 12. Decizia momentului — Joi 7 mai SAU mai târziu?

### Opțiunea A — Joi 30 apr (slot original DPO Complet)

**Pro**: cabinet excited, momentum păstrat
**Con**: livrăm cu 6 bug-uri vizibile + workaround-uri founder pentru S0 features
**Risc**: cabinet vede bug-urile în primele 5 minute → pierde încredere

→ **NU recomandat**.

### Opțiunea B — Joi 7 mai (slot ajustat post-S0)

**Pro**: produs curat, fix-urile vizibile aplicate, cabinet vede produs profesional
**Con**: 1 săpt delay
**Mitigare**: email transparență la cabinet "amân 1 săpt ca să livrez fix-urile pe care le-am identificat în demo run, transparență completă"

→ **RECOMANDAT** pentru maximizare conversie pilot → subscription.

### Opțiunea C — amânare la S1 finalizat (Joi 14 mai sau 21 mai)

**Pro**: cabinet vede produs cu custom templates + reject/comment + AI on/off
**Con**: 2-3 săpt delay → cabinet pierde momentum, riscă să zică "lăsăm pe altă dată"
**Risc**: cabinet ne uită, conversie scade

→ **NU recomandat decât dacă S0 livrabil > 1 săpt.**

### Decizie finală

**Joi 7 mai 2026, 15:00 — kickoff DPO Complet cu produs S0-curat.**

Email de transparență trimis astăzi:

> "Bună,
> Mulțumesc pentru asseturi. Am rulat demo-ul și am identificat câteva fix-uri cosmetice pe care le livrez în 5 zile (label cabinet în reports, branding consultant pe magic link, hash chain pe Audit Pack, încadrare disclaimer documente).
> Dacă ești OK, mutăm kickoff-ul la **Joi 7 mai 15:00** ca să intri direct într-un demo curat, fără workaround-uri.
> Între timp îmi poți trimite cele 2-3 templateuri reprezentative pentru pre-import.
> Mulțumesc pentru răbdare."

---

## 13. Master timeline visual (revizuit post code audit + market validation)

```
APRILIE 2026
├── 27 apr (Luni)    [S0.1] workspace.label fix
├── 28 apr (Marți)   [S0.2] disclaimer reframe + [S0.3] Diana branding card
├── 29 apr (Miercuri) [S0.4] Aprob button + [S0.5] SHA-256
├── 30 apr (Joi)     [S0.6] PDF font fix + [S0.7] re-run demo
└── 1 mai (Vineri)   [S0.8] email DPO Complet — kickoff scheduled 7 mai

MAI 2026
├── 4-6 mai          Pre-kickoff prep (template import founder, asseturi finali)
├── 7 mai (Joi)      ⭐ KICKOFF DPO COMPLET 15:00
├── 7-13 mai         Săpt 1 pilot (internal-only)
├── 14-16 mai        S1 finalizate parallel (custom templates UI, reject/comment, AI on/off, feature flag fiscal, signature upload)
├── 14-20 mai        Săpt 2 pilot (primul client real)
├── 18 mai           ⭐ S1 LIVRAT
├── 21-27 mai        Săpt 3 pilot (magic link patron real)
├── 18-30 mai        S2 dev (Stripe + Mistral + Supabase + monthly digest)
└── 28 mai - 5 iun   Săpt 4 pilot (drill complet)

IUNIE 2026
├── 4 iun            ⭐ PILOT RETRO 90min
├── 5 iun            ⭐ DECIZIE SUBSCRIPTION DPO COMPLET
├── 1-7 iun          S3 dev (drift cron + legislation alerts + NIS2 polish + onboarding wizard final) — REDUS la 1 săpt
├── 7 iun            ⭐ S3 LIVRAT — 100% client-ready (in 6 săpt total)
├── 8-15 iun         Production deploy + Vercel/Supabase final + monitoring setup
├── 15 iun           ⭐ PRODUCTION LAUNCH
├── 15-30 iun        Outreach Target B (cabinete Excel/Word) — Mini €99 tier
└── 30 iun           Marketing landing page + pricing page live

IULIE 2026
├── 1-15 iul         Outreach Target A (cabinete care folosesc Privacy Manager) — switch offer
├── 15-31 iul        Outreach Target C (cabinete top tier — multi-framework)
└── Target: 3-5 piloturi noi paralele

AUGUST 2026
├── Maturity per pilot retro
├── 5-10 cabinete plătitoare
└── Case study DPO Complet + LinkedIn thought leadership

SEPT-DEC 2026 (Q4)
├── 15-30 cabinete plătitoare
├── Migration offer pentru cabinete pe Privacy Manager
├── S4 features (custom domain, signature canvas, multi-cabinet Studio)
└── ARR €5K-10K/lună
```

**Diferență critică vs versiunea inițială**:
- Production launch mutată de la 27 iun → **15 iun** (cu 2 săpt mai devreme)
- S4 originally "production launch features" → mutat post-launch ca "enhancement"
- Outreach Target B Mini tier mutat la iunie (paralel cu pilot final), NU iulie

**De ce e fezabilă scurtarea**: code audit revelează 87% maturity globală (era 66% în DEMO-RUN-REPORT). Drift detection 90% (era 20%). NIS2 85% (era 50%). Stripe 70%, Onboarding 80%, White-label 75% — toate mai mature decât crezut. Sprint 3 + 4 originale combinate într-o săptămână plus production deploy.

---

## 14. Comunicare cabinet în pilot — Slack channel cadence

**Slack channel dedicat**: `#compliscan-dpo-complet-pilot` (sau Slack Connect dacă cabinet preferă propria workspace).

| Frecvență | Activitate |
|---|---|
| Săpt 1 zilnic | Founder check-in 5min "ce funcționează / ce nu" |
| Săpt 2-3 zilnic | Founder Slack message proactiv pe orice issue / question |
| Săpt 1-4 săptămânal | Friday recap 30min cu cabinet (zoom) |
| Sf săpt 4 | Retro 90min cu cabinet + decizie subscription |

**Escalation path**:
- Slack thread = primary
- Email = pentru confirmări formale (kickoff, retro decizii)
- Phone = doar emergency (data loss, security incident)

---

## 15. Definition of Done — pilot DPO Complet success

Pilot e considerat **SUCCES** dacă la sf săpt 4:

- ✅ Cabinet semnează subscription Growth €349/lună (sau alt tier)
- ✅ Cabinet a folosit app minim 4 săpt continuu
- ✅ Minim 3 clienți reali în pilot
- ✅ Minim 5 findings rezolvate end-to-end
- ✅ Minim 3 documente generate, validate, semnate prin magic link
- ✅ Audit Pack ZIP exportat pentru fiecare client + structura verificată manual
- ✅ Cabinet acceptă să fie testimonial public pentru landing page

Pilot e considerat **EȘEC** dacă:

- ❌ Cabinet renunță la pilot înainte de săpt 4 (ne-show 2 retro consecutive)
- ❌ Cabinet refuzează semnare subscription la sf pilot
- ❌ Audit Pack ZIP cabinet refuză să accepte structura

În caz de eșec → retro structural (interviu 60min cu cabinet) → identificare cauze → ajustare strategie pentru cabinet următor.

---

## Anexa: Roadmap-uri alternative considerate

### Roadmap v3.0 (5 produse vertical) — păstrat ca alternative

| Sprint v3.0 | Durată | Ce livram (v3.0 invalidat) |
|---|---|---|
| **S0** | 5 zile | Fix 6 bug-uri DPO OS demo run |
| **S1** | 2 săpt | Custom templates UI + reject/comment + AI on/off + feature flags 5 produse hide non-DPO |
| **S2** | 2 săpt | Stripe billing DPO OS tiers |
| **S3** | 1 săpt | Drift cron + landing pages "Coming soon" pentru NIS2/Fiscal/AI/DORA |
| **PROD** | 1 săpt | DPO OS production launch only |

**Etapa 2 v3.0 (Q1 2027)**: NIS2 OS launch separat
**Etapa 3 v3.0 (Q3 2027)**: Fiscal OS launch separat
**Etapa 4-5 v3.0 (2028)**: AI Act OS + DORA OS lansate separat

**De ce schimbat la v4.0**: lansare 1 produs primar (DPO OS) era prea îngustă pentru un cod care servește deja 5 segmente. v4.0 schimbă la 3 segmente paralel Q3 2026 (Solo + IMM + Cabinet) pentru a maximiza cod existing usage.

### Roadmap NIS2 sector public RO (Iteration 5.C.3A) — backup option

Dacă v4.0 multi-segment privat eșuează în pilot:
- Q3 2026: pivot la NIS2 OS pentru sector public
- ICP: 3.180 UAT-uri RO + autorități locale
- Sales cycle public 6-9 luni
- Distribuție ACoR (Asociația Comunelor) + procurement SEAP
- Tarif: €2K-10K/an per UAT
- TAM: €15.9M

### Roadmap "vinzi cod ca asset" (Iteration 5.B) — exit option

Dacă niciun pivot nu prinde în 12-18 luni:
- Listezi MicroAcquire
- Cumpărători potențiali: Decalex, Privacy Manager, Big 4 RO offices
- Cer €40-80K + earnout pe revenue
- Cash certain + 6-12 luni libertate

Pentru context complet, vezi **Doc 05 — Evoluția ideilor**, Iteration 5 + 6.

---

**Document maintainer**: Daniel Vaduva, founder
**Update obligatoriu la**: orice sprint început/încheiat / orice pilot închis / orice schimbare timeline
**Versiune**: v4.0 (3 segmente paralel Q3 2026 + Fiscal Q1 2027 + Enterprise 2028)
**Vezi și**: Doc 05 (Evoluția ideilor) pentru roadmap-uri alternative
