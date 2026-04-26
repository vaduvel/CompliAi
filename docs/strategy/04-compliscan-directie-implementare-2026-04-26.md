# 04 — CompliScan: direcție și implementare

**Data**: 26 aprilie 2026
**Status**: canonical — singura sursă pentru "ce facem când și cum măsurăm reușita"
**Înlocuiește**: `compliscan-v1-final-spec-2026-04-26.md` + `IA-UX-IMPLEMENTATION-MATRIX.md` + secțiunea "Sprint plan" din `pilot-kickoff-dpo-30days-2026-04-26.md` + `demo-flow-ipo-real-2026-04-26.md`
**Validări incluse**: demo run pe cod real + DPO Complet pilot acceptance + 6 bug-uri concrete

---

## TL;DR

**Sprint roadmap S0-S4 = 9 săptămâni la 100% client-ready.**

| Sprint | Durată | Ce livrăm | Validare |
|---|---|---|---|
| **S0** | 5 zile (saptămâna asta) | Fix 6 bug-uri demo run + Audit Pack 100% mature | Demo refăcut fără bug-uri vizibile |
| **S1** | 2 săpt | Custom templates UI + reject/comment flow + AI on/off + feature flag fiscal hide | Pilot kickoff DPO Complet |
| **S2** | 2 săpt | Stripe billing live + Mistral EU optional + Supabase cutover + drift detection schema | Primii clienți reali în pilot DPO Complet |
| **S3** | 2 săpt | Drift detection auto + reopen lifecycle + NIS2 integration full + onboarding flow | Pilot DPO Complet retro + extension la 5 cabinete |
| **S4** | 2 săpt | Production launch (multi-cabinet, custom domain, signature canvas, security hardening) | First paying customers |

**Pilot DPO Complet kickoff target**: **Joi 7 mai 2026, 15:00** (slot original Joi 30 apr amânat 1 săptămână ca să livrăm S0).

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

### Etapa 2 — Outreach 5 cabinete RO target (iulie 2026)

Lista țintă (din `01-compliscan-produs-validat-piata`, Anexa A):
1. GDPR Complet
2. LegalUp Privacy
3. Decalex Privacy
4. WestGDPR
5. Privacy Romania

Outreach format:
- LinkedIn DM personalizat (consultant DPO senior)
- Subject: "Diana de la DPO Complet folosește acum CompliScan — îți pot arăta în 15 min?"
- Body: 1 paragraph value prop + link demo video (3 min) + propunere call

Target: 2-3 piloturi noi în iulie-august.

### Etapa 3 — Channel via comunități (sept 2026)

- Facebook groups: "DPO România", "Compliance Romania", "GDPR Romania"
- Forum CECCAR (pentru contabili curioși) — NU vinde, doar citește pentru insight
- Reddit r/romania business — cu prudență
- Linkedin newsletter founder (1× pe lună)

### Etapa 4 — Outreach EU (Q4 2026 → 2027)

DPO firms din BG, HU, PL, GR — piețele EE/SE cu legislație similară RO. Pricing identic, multi-language Sprint 4.

---

## 8. Pricing rollout — sequence

### Fază 1 — Pilot prețuri (4-6 mai → final pilot DPO Complet)

- Cabinet primește **Growth €349/lună** gratis pe perioada pilot 30 zile
- Founder activează manual plan în `.data/plans-global.json`
- La end-of-pilot, factură fizică din contul founder (S2 Stripe pending)

### Fază 2 — Stripe live (S2, 18 mai)

- Cabinet pe pilot face self-serve upgrade la Growth
- Stripe Checkout + webhook funcțional
- Trial countdown UI activ

### Fază 3 — Public pricing page (S4, 15 iun)

- compliscan.ro/pricing live cu 5 tiers
- "Start free trial 14 days" CTA
- Comparison table cu DataGuard / OneTrust

### Fază 4 — Annual discount (S4, 27 iun)

- Annual billing 20% off vizibil în pricing page
- Per cabinet: opțiune monthly sau annual

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

## 11. Long-term vision — 2026 → 2030

### 2026 (year 1) — DPO OS validat + 30 cabinete plătitoare

**Q1**: pilot DPO Complet → S0-S2 → primii clienți
**Q2**: S3-S4 production launch + 5 cabinete plătitoare (€2K MRR)
**Q3**: outreach EU adjacent (BG, HU, PL) → 15 cabinete (€6K MRR)
**Q4**: 30 cabinete plătitoare (€10K MRR), case study + thought leadership

### 2027 (year 2) — Expansiune RO + Fiscal OS unhibernate

**Q1-Q2**: 60 cabinete RO (€20K MRR), începe planning Fiscal OS
**Q3**: Fiscal OS unhibernate ca produs separat pentru contabili (€149-499 tier)
**Q4**: 100 cabinete DPO + 20 contabili Fiscal OS = €35K MRR

### 2028 (year 3) — Multi-product + EU expansion

**Q1-Q2**: 150 cabinete DPO RO + 50 contabili + 30 cabinete EU = €50K+ MRR
**Q3**: Adaugă AI Act Annex IV automation (high-risk system documentation)
**Q4**: NIS2 integration full cu DNSC end-to-end

### 2029-2030 — Maturitate market position

- 300+ cabinete DPO + 100+ contabili = €100K+ MRR
- Brand de referință în compliance RO + adjacent EU
- Posibilă achiziție / parteneriat strategic (DataGuard / Aircall RO / RO unicorn)
- Sau continuă bootstrapped pentru maximizare profitability

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

## 13. Master timeline visual

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
├── 14-16 mai        S1 finalizate parallel (custom templates UI, reject/comment, AI on/off, feature flag)
├── 14-20 mai        Săpt 2 pilot (primul client real)
├── 18 mai           ⭐ S1 LIVRAT
├── 21-27 mai        Săpt 3 pilot (magic link patron real)
├── 18-30 mai        S2 dev (Stripe + Mistral + Supabase + drift schema)
└── 28 mai - 5 iun   Săpt 4 pilot (drill complet)

IUNIE 2026
├── 4 iun            ⭐ PILOT RETRO 90min
├── 5 iun            ⭐ DECIZIE SUBSCRIPTION DPO COMPLET
├── 1-13 iun         S3 dev (drift detection auto, NIS2 integration, reopen lifecycle)
├── 13 iun           ⭐ S3 LIVRAT
├── 15-27 iun        S4 dev (production launch)
└── 27 iun           ⭐ S4 LIVRAT — PRODUCTION LAUNCH

IULIE 2026
├── 1-15 iul         Outreach 5 cabinete RO target (LinkedIn + email)
└── 15-31 iul        Onboarding 2-3 piloturi noi paralele

AUGUST 2026
└── Maturity per pilot retro + extension la 5 cabinete plătitoare

SEPT-DEC 2026 (Q4)
├── Public landing page + pricing page live
├── 15-30 cabinete plătitoare
└── Case study DPO Complet + thought leadership
```

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

**Document maintainer**: Daniel Vaduva, founder
**Update obligatoriu la**: orice sprint început/încheiat / orice pilot închis / orice schimbare timeline
**Versiune**: v1.0 (consolidare după demo run + DPO Complet pilot acceptance)
