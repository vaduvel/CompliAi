# Demo script DPO Complet — Joi 7 mai 2026, 15:00 Zoom

**Durată**: 60 minute (15:00 → 16:00)
**Participanți**: Diana Popescu (DPO Complet) + Daniel (founder CompliScan)
**Format**: live demo + Q&A + pilot plan walkthrough
**Pre-rec**: pre-pilot email răspuns Diana (vezi `dpo-complet-pre-pilot-email-2026-05-02.md`) → adjust pitch
**Setup tehnic**: Zoom share screen + browser cu CompliScan localhost:3010 + slide deck deschis în alt browser tab

---

## Pre-meeting checklist (luni 4 → miercuri 6 mai)

- [ ] Diana a răspuns la pre-pilot email → știu pitch type (Replacement / Challenger / Complementar / Layer)
- [ ] Sprint 0 cele 7 bug-uri done + ZIP package nou trimis (joi 1 mai)
- [ ] Setup demo data: 3 clienți (Apex Logistic, Lumen Energy, Cobalt Fintech) cu findings injected
- [ ] Brand DPO Complet activ în cabinet config (logo, signature Diana, color cobalt)
- [ ] Templates DPO Complet importate manual (Sprint 1.1 workaround) — minim Privacy Policy + DPA
- [ ] Slide deck final review (5 min intro + 15 min demo + 10 min cele 6 condiții + 15 min plan + 10 Q&A + 5 next steps)
- [ ] Dry-run demo o dată complet miercuri 6 mai
- [ ] Internet backup (mobile hotspot) pentru Zoom
- [ ] Slack channel `#compliscan-dpo-complet-pilot` setup pre-call

---

## Timeline minute-by-minute (60 min total)

### Min 0-5 — Intro + agenda (5 min)

**14:55**: connect Zoom 5 min înainte. Camera ON, share screen ready.

**15:00**: kickoff start.

**Speaker notes**:
> "Bună Diana, mulțumesc că ești aici. 60 minute structurate astfel:
> - 5 min intro + agenda (acum)
> - 15 min demo flow live cu cei 3 clienți pilot
> - 10 min cum am răspuns la cele 6 condiții
> - 15 min walkthrough plan 30 zile pilot
> - 10 min Q&A
> - 5 min next steps + Slack setup
>
> Dacă ai întrebări pe parcurs, întrerupe-mă. Demo-ul e tailored pe răspunsul tău din email."

**Slide 1**: agenda + timing.
**Slide 2**: ce e nou față de demo run-ul anterior (Sprint 0 fix-uri):
- ✅ Workspace label corect (cabinet name)
- ✅ Disclaimer reframe (NU "verifică cu specialist")
- ✅ Diana branding card pe magic link
- ✅ Aprob button funcțional
- ✅ SHA-256 hash chain în Audit Pack
- ✅ PDF export funcțional
- ✅ Fiscal routes hidden (focus DPO)

### Min 5-20 — Demo flow live (15 min)

**Pas 1 — Portfolio cabinet (1.5 min)**

**Action**: navigate `localhost:3010/dashboard` → portfolio cu 3 clienți.

**Speaker**:
> "Aici e cabinetul tău, DPO Complet. 3 clienți pilot. Apex Logistic — critic, 3 findings. Lumen Energy — DSAR activ. Cobalt Fintech — client sensibil cu AI OFF (vom intra în detalii în demo)."

**Highlight**:
- Score color-coded
- Urgent findings cross-client
- Filter by sector / risk / DSAR status

**Pas 2 — Workspace switch + banner (1 min)**

**Action**: click Apex Logistic → workspace context.

**Speaker**:
> "Click pe Apex Logistic. Vezi banner persistent: 'Lucrezi pentru Apex Logistic SRL — ca DPO Complet'. Asta previne să trimiți document greșit la client greșit."

**Highlight**: banner ALWAYS-ON, escape hatch la portfolio.

**Pas 3 — Queue de rezolvat (1 min)**

**Action**: navigate `/dashboard/[apex]/de-rezolvat` → queue 3 findings.

**Speaker**:
> "Queue-ul de rezolvat. Sortat după severity + SLA. Apex are:
> - GDPR-001 Privacy Policy lipsă (high, 47h SLA)
> - GDPR-006 RoPA neactualizat (medium, 14z)
> - GDPR-010 DPA Stripe expirat (high, 5z)
>
> Toate 3 sunt 'documentary' class — AI poate genera draft, tu validezi."

**Pas 4 — Cockpit GDPR-001 Privacy Policy (5 min)** ⭐ CORE DEMO

**Action**: click GDPR-001 → cockpit page.

**Speaker minute-by-minute**:

*Min 0-1*:
> "Cockpit-ul finding-first. Singurul loc unde se închide un caz. NU mai ai 5 tabs fragmentate (RoPA / DPIA / DSAR / Vendor / Document). Tot pe 1 pagină.
> Sus: titlu + framework + severity badge.
> Stânga: detail problemă, baza legală GDPR Art. 13, impact, acțiune recomandată."

*Min 1-3*:
> "Click 'Generează draft Privacy Policy'. AI-ul (Gemini 2.5 Flash Lite, EU sovereignty) generează draftul în ~30 sec. **Status: DRAFT — necesită validare consultant DPO**. Footer cu numele tău, certificarea CIPP/E, contact. NICIODATĂ disclaimer toxic 'verifică cu specialist'."

*Min 3-4*:
> "Tu validezi. Editezi inline dacă vrei. Click 'Marchează revizuit'. Status update reviewed_internally."

*Min 4-5*:
> "Acum trimit magic link patronului Mihai pentru aprobare. Asta vom vedea în pasul 6, GDPR-010 DPA Stripe."

**Highlight**: cockpit = 1 pagină per caz vs concurența 5 tabs.

**Pas 5 — Cockpit GDPR-006 RoPA (1.5 min)**

**Action**: navigate cockpit GDPR-006.

**Speaker**:
> "RoPA neactualizat de 3 luni. Diff: vendor nou Stripe + activitate nouă Newsletter. Click 'Update RoPA' → editor structurat. Adaugi Stripe ca processor + Newsletter cu temei 'consimțământ'. Click 'Versiune nouă'. RoPA v2 salvat în dosar cu timestamp + cine a editat."

**Pas 6 — Cockpit GDPR-010 DPA Stripe + magic link (5 min)** ⭐ CORE DEMO

**Action**: navigate cockpit GDPR-010.

**Speaker minute-by-minute**:

*Min 0-1*:
> "DPA Stripe expirat. Vendor critic (transferă date UE→SUA cu SCC). Lipsa DPA = breach Art. 28."

*Min 1-2*:
> "Click 'Generează DPA v4.1'. AI generează draft Apex Logistic × Stripe Payments Europe. Footer cabinet, status DRAFT."

*Min 2-3*:
> "Tu validezi. Click 'Trimite spre validare patron'. CompliScan generează **magic link signed HMAC, 72h expiry**. Copy URL în clipboard sau pre-fill email cu template."

*Min 3-4*:
> "Hai să vedem ce primește Mihai patronul."
> *Open new tab → /shared/[token]*
> "Pagina patron e brand-uită complet DPO Complet — logo cabinet, NU CompliScan. Vede DPA-ul. Card 'Pregătit de': Diana Popescu, DPO / CIPP/E #12345, contact email + phone."

*Min 4-5*:
> "Mihai click 'Aprob și semnez'. Status update → signed. Tu primești alert in-app dashboard (email Sprint 1.8). Document intră în dosar Apex."

**Highlight**: white-label complet + signature card + Aprob button funcțional + audit trail.

### Min 20-30 — Cele 6 condiții + transparency "review_required" (10 min)

⚠️ **Nou post Sprint 0.5 (Issue 3 fix)**: în Audit Pack, `auditReadiness: review_required` apare în output. **NU e bug — e comportament corect**. Comunică explicit:

**Speaker (1 min adăugat în secțiune)**:
> "Diana, observă în Audit Pack că `auditReadiness: review_required`, NU `audit_ready`. Asta e CORECT — sistemul nu raportează fals 'audit_ready' când mai sunt dovezi pendinte.
>
> Avem 1 dovadă validată (DPA Stripe approved via magic link) și 3 controale rămase fără evidență. Audit Pack-ul e **dosar de lucru**, NU certificat — tu decizi când trimiți extern.
>
> Asta e diferentiator vs concurenți care raportează fals '100% compliant' prematur. Privacy Manager / MyDPO scor mereu pozitiv. CompliScan onest: 'work in progress, X validate, Y pendinte'."

**Slide 3**: tabel cu cele 6 condiții DPO Complet + cum le-am rezolvat.

| # | Condiție | Status |
|---|---|---|
| 1 | Date reale vs pseudonimizate clarificate per client | ✅ Săpt 1 internal-only cu pseudonimizate, săpt 2+ tu decizi per client |
| 2 | Documente AI marcate DRAFT până la validarea ta | ✅ Status DRAFT explicit, footer cabinet, NU "verifică cu specialist" |
| 3 | Cel puțin 1 flux complet cu template-ul cabinetului | ⚠️ Sprint 1.1 livrabil custom templates UI; pre-import manual founder între timp |
| 4 | Audit Pack descărcat local + verifică structura | ✅ ZIP cu README + MANIFEST.md (SHA-256) + reports/ + data/ + nis2/ + evidence/ |
| 5 | AI OFF pentru clientul sensibil (Cobalt Fintech) | ⚠️ Sprint 1.3 livrabil toggle; pre-pilot manual setup founder |
| 6 | Magic link cu workaround email pentru reject/comment | ✅ Aprob funcțional Sprint 0; reject/comment Sprint 1.2 livrabil în pilot week |

**Speaker**:
> "3 condiții ✅ deja Sprint 0. 3 condiții ⚠️ livrate în Sprint 1 paralel cu pilot week (8-16 mai). Pentru cele 3 ⚠️, ai workaround manual founder între timp."

### Min 30-45 — Plan 30 zile pilot walkthrough (15 min)

**Slide 4**: timeline pilot 4 săptămâni.

**Săptămâna 1 (7-13 mai) — Internal-only**

**Speaker**:
> "Săpt 1: setup brand + add 2-3 clienți pilot (real sau pseudonimizate, tu decizi).
> Generat primul draft document, validat, marcat semnat (fără magic link încă).
> Slack daily check-in 5 min. Vineri 13 mai retro 30 min — feedback brand setup."

**Slide 5 highlight**: ce decide Diana să folosească per client (real / pseudonimizat).

**Săptămâna 2 (14-20 mai) — Primul client real cooperant**

**Speaker**:
> "Săpt 2: alegi 1 client real cooperant (prietenos cu testare nouă).
> Test magic link cu email intern al cabinetului ('patron simulat').
> Vineri 20 mai retro 30 min — Audit Pack download + verify structure SHA-256."

**Săptămâna 3 (21-27 mai) — Magic link patron real**

**Speaker**:
> "Săpt 3: trimit primul magic link la patron real.
> Patron interacționează (Aprob — Sprint 0; Respinge cu comentariu — Sprint 1.2 livrabil în acest interval).
> Test al doilea client (mai puțin cooperant).
> Vineri 27 mai retro 30 min — patron experience feedback."

**Săptămâna 4 (28 mai → 4 iunie) — Drill complet**

**Speaker**:
> "Săpt 4: face Audit Pack ZIP pentru toți 2-3 clienți pilot + verifică structurile.
> Test drift detection (vendor nou simulat — Sprint 2 dacă cron deja livrabil).
> Pregătire retro final."

**Slide 6**: ⭐ **Joi 5 iunie 2026, 15:00 Retro pilot 90 min — DECISION GATE #1**

**Speaker**:
> "5 iunie e momentul-cheie. 90 min retro:
> - 15 min tu prezenti învățăminte
> - 30 min review cele 6 condiții bifate vs neîndeplinite
> - 15 min usage data review (ce module folosit, ce ignored)
> - 15 min feedback NPS-style
> - 15 min decision subscription
>
> Outcome posibil:
> - ✅ Semnezi Cabinet Pro €999/lună → continui ca primul client paying
> - ⚠️ 'Mai vorbim, lăsăm Q3' → outreach paralel 5 cabinete pentru data
> - ❌ Refuzi → eu pivotez urgent (NIS2 sector public sau exit)
>
> Indiferent de outcome, pilotul e learning pentru ambii."

### Min 45-55 — Q&A (10 min)

**Speaker**:
> "Diana, întrebări? Aștept critică, NU complezență. Dacă ceva nu funcționează, spune-mi acum, nu Joi 5 iunie."

**Anticipări obiecții + răspunsuri pregătite**:

**Obiecție 1**: "AI generează prea generic, nu reflectă specificul clienților mei."
**Răspuns**: "Exact. Templates cabinetului tău (Sprint 1.1) overrides AI default. Pre-import manual între timp. Demo cu template-ul tău Privacy Policy săpt 1."

**Obiecție 2**: "Patronul meu nu va folosi magic link, va răspunde la email cum face mereu."
**Răspuns**: "Ok. Magic link e opțional. Dacă patronul răspunde prin email, tu marchezi manual document signed cu evidence email atașat. Magic link e pentru cei cooperanți. Vom măsura adoption rate în pilot."

**Obiecție 3**: "Pricing €999/lună e mare pentru cabinetul meu cu 30 clienți."
**Răspuns**: "Math: 30 clienți × €130 retainer = €3.900/lună revenue. €999 = 25% — la limita superioară 'tool budget'. Dacă portofoliul e 50+ clienți, ratio scade la 8% (sweet spot). Pentru 15-30 clienți, tier Cabinet Solo €499 e mai potrivit. Pilot la €999 gratis, decision subscription post-retro."

**Obiecție 4**: "Cum verific eu că Audit Pack ZIP e valid pentru ANSPDCP?"
**Răspuns**: "Audit Pack ZIP are README + MANIFEST.md cu SHA-256 hash chain. Tu pot verifica integrity cu `sha256sum [file]` local. Pentru ANSPDCP nu certificăm — ANSPDCP decide. Dar structura ZIP e standard auditabilă."

**Obiecție 5**: "Custom templates sunt cruciale, când vin?"
**Răspuns**: "Sprint 1.1 — săpt 14-16 mai. Între timp, founder face pre-import manual al template-urilor cabinetului tău în 48h. Tu vezi template în dropdown la cockpit document generation."

**Obiecție 6**: "Ce se întâmplă cu datele mele dacă renunț?"
**Răspuns**: "Data ownership: cabinetul deține datele. Export ZIP final cu tot ce ai introdus. Ștergere completă <30 zile post-renunțare. Audit trail păstrat 90 zile pentru reclamații. Detalii în pilot kickoff doc trimis pre-call."

### Min 55-60 — Next steps + Slack setup (5 min)

**Slide 7**: next steps 11 zile.

**Speaker**:
> "Mâine vineri 8 mai: Slack channel `#compliscan-dpo-complet-pilot` activ. Te invit pe email.
> Săpt 1 (7-13 mai): tu lucrezi internal-only. Eu daily check-in 5 min Slack.
> Vineri 13 mai 16:00: prim retro 30 min Zoom.
> Eu sunt pe Slack permanent în pilot. Răspuns < 4h ore lucrătoare, < 24h weekend.
> Email backup: daniel@compliscan.ro pentru orice."

**Slide 8** (final): "Mulțumesc Diana. La drum."

---

## Coverage matrix — ce demonstrăm vs ce NU (transparency)

### ✅ CE DEMONSTRĂM (funcțional Sprint 0 done)

- Portfolio cabinet multi-client (3 clienți colorați)
- Workspace switch cu banner persistent
- Queue findings cross-client cu severity + SLA
- Cockpit finding-first (1 pagină per caz)
- AI document generator (Gemini EU)
- Document lifecycle 4 stages (draft → reviewed → sent → signed)
- Magic link share-token HMAC + 72h expiry
- Patron page brand-uit cabinet cu Diana signature
- Aprob button funcțional → document signed
- Audit Pack ZIP cu MANIFEST + SHA-256 + reports + nis2
- Feature flag fiscal hide (DPO mode clean)
- White-label complet (NU CompliScan brand vizibil patronului)

### ⚠️ CE LIPSEȘTE (transparency — Sprint 1+ livrabil în pilot)

- **Custom templates UI** — Sprint 1.1, livrare 14-16 mai. Workaround: pre-import manual founder.
- **Reject + comment flow magic link** — Sprint 1.2, livrare săpt 21-27 mai. Workaround: email out-of-band.
- **AI ON/OFF toggle per client** — Sprint 1.3, livrare săpt 14-16 mai. Workaround: founder manual config Cobalt.
- **Email notifications cabinet** — Sprint 1.8, dependency Resend setup. Workaround: alert in-app dashboard.
- **Stripe billing live** — Sprint 2A, livrare 18-30 mai. Workaround: founder activează manual plan Pro.
- **Mistral EU sovereignty** — Sprint 2B, livrare 1-15 iun. Workaround: Gemini EU primary.
- **Drift detection auto** — Sprint 3, livrare 15-19 iun. Workaround: scan manual.

### ❌ CE NU FACEM (out of scope — clearly communicated)

- **NU certificăm ISO 27001 / SOC 2** — auditor TÜV/BSI rămâne obligatoriu
- **NU emitem atestări juridice** — DPO uman validează, AI asistă
- **NU semnăm digital eIDAS calificat** — CertSign / DigiSign rămân
- **NU înlocuim portal ANSPDCP / DNSC / BNR** — integrăm doar
- **NU automated SOC2 evidence** (vs Drata/Vanta) — NU avem connect AWS/GitHub
- **NU legal research depth** (vs Lege5) — NU înlocuim
- **NU enterprise GRC** (vs ServiceNow GRC, Archer) — out of segment 2026

---

## Ce să NU spui în demo (anti-patterns)

❌ "Suntem primul OS DPO din România" (Privacy Manager 12 ani avans)
❌ "AI înlocuiește DPO uman" (DPO validează, AI asistă)
❌ "Înlocuim toate consultanții" (fals, va eșua la primul demo sofisticat)
❌ "Greu de copiat" (claim nevalidat, Decalex are distribution power)
❌ "Acoperim toate frameworks la maturity 100%" (DORA 15%, CER 10%)
❌ "Titan modular" (intern doar, NU în public-facing demo)
❌ "Multi-framework all-in-one" (cumpărător aud "nu am nevoie de 80%")

---

## Backup plan dacă ceva merge prost în demo

### Scenarii failure + recovery

| Failure | Recovery |
|---|---|
| Internet pică | Mobile hotspot backup (test pre-call) |
| Localhost:3010 cade | Restart `npm run dev` în alt terminal — 30 sec recovery |
| Audit Pack ZIP nu se generează | Fallback: arăt ZIP pre-generat din demo run anterior |
| Magic link nu funcționează | Fallback: arăt patron page screenshot din demo run anterior |
| AI generation slow (>1 min) | Pre-generated draft cached, arăt direct |
| Diana întrebă ceva la care nu știu răspuns | "Întrebare bună. Notez și revin cu răspunsul în 24h pe Slack." NU face up |

---

**Maintainer**: Daniel Vaduva
**Folosit la**: Joi 7 mai 2026, 15:00 Zoom
**Pre-rec**: pre-pilot email Diana răspuns vineri 2 mai
**Dry-run**: miercuri 6 mai (1× complet)
**Backup**: scenarios failure + recovery
