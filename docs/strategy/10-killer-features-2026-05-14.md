# Killer Features Fiscal Layer — Maturity Report

**Branch:** `killer-features-fiscal-layer`
**Sesiune:** 2026-05-13 noapte → 2026-05-14 dimineața
**Persona test:** Ana Maria Zugravu (`ana_maria_zugravu@yahoo.com`), Cabinet Contabil, icpSegment `cabinet-fiscal`, mod partner
**Client de test:** FC4 Test Client SRL (importat legit via `/api/partner/import-csv`)

---

## TL;DR

7 features livrate end-to-end (engine + tests + API + UI + integrare). Pentru fiecare:

1. Engine audit + calibrare cu referințe legale RO (Cod Procedură Fiscală, eIDAS, OG 92/2003).
2. Seed data realistă prin `/api/dev/seed-state` (dev-only endpoint cu flush cache).
3. Validare API prin curl/eval real în dev server.
4. Validare UI în browser via Chrome Preview MCP, cu screenshot dovadă.
5. Bug-uri reale găsite și fixate (8 total).

**Tests:** 122/122 verzi pe modulele FC-4..FC-10.

---

## Bug-uri reale găsite în testare browser

| # | Feature | Bug | Impact dacă rămânea |
|---|---------|-----|---------------------|
| 1 | FC-4 | `/api/fiscal/cross-correlation` POST nu pasa `filings` + `expectedVatFrequency` la engine | R6 + R7 returneau "info — fără date" mereu, indiferent de filings reale |
| 2 | FC-4 | `/api/partner/portfolio/cross-correlation` la fel + UI hardcoded "R1·R2·R3·R5" | Cabinet nu vedea NICIODATĂ R6/R7 pentru clienții lui |
| 3 | FC-5 | `computeR6Impact` citea daysLate doar din `diff.actual`; finding-uri **missing** nu au `diff` | Missing 109 zile contat ca 0 zile late → penalty 600-1600 RON (real: 3300-8300 RON cu Art. 107 CPF) |
| 4 | FC-5 | Portfolio drawer NU afișa secțiunea "💰 Cât te poate costa" (FC-5 propagation gap) | Cabinet vedea findings dar fără impact economic vizibil |
| 5 | FC-7 | Master Exception Queue dubla items: aceleași filings apăreau o dată ca R6 cross-corr + o dată ca filing-overdue/missing | 8 items duplicate în loc de 4 reale + impact RON inconsistent (1500 hardcoded vs 8300 corect FC-5) |
| 6 | FC-7 | `extractFromFilings` folosea 500/1000/1500 RON hardcoded | Subestima penalități missing peste 90 zile (Art. 107 CPF) |
| 7 | FC-8 | `computeFilingComplianceRate` excludea late + missing din "closed" → rate fals 100% când majoritatea erau late | Burden score subestimat → clienți toxici clasați ca "normal" |
| 8 | FC-4/FC-5 misc | Strict TS errors (exception-queue type cast, pre-anaf redundant comparison) | Build CI nu trecea în strict mode |

Toate fixate, commits separate cu mesaj specific bug-ului.

---

## Features livrate la maturitate

### FC-4 — R6 + R7 cross-correlation rules

**Engine:** `lib/compliance/cross-correlation-engine.ts`
- R6: termen calendar fiscal ↔ data depunere efectivă (cu separare missing/late + ok/info)
- R7: frecvență TVA detectată din filings ↔ frecvență așteptată din `orgProfile.vatFrequency` (cu detecție mixed → error)

**Calibrare:** toleranță 1 zi (no holiday grace ANAF), min 3 filings pentru R7 inference, agravare progresivă conform CPF Art. 219.

**Validare în browser (Ana Maria → FC4 Test Client SRL):**
- 4 D300 lunare seeded: 1 on_time (ok), 1 late 8 zile (warning), 1 late 20 zile (error), 1 missing 109 zile (error)
- 1 SAF-T Q1 late 2 zile (warning)
- 1 D390 ian on_time (ok)
- Result UI portfolio: badge **"R1 · R2 · R3 · R5 · R6 · R7"** + coloane R6/R7 în tabel + footer arată "6 filings · TVA freq ✓" + top finding "R6 2026-03 — D300 (TVA) depusă cu 20 zile întârziere"

Commits: `121d135 fix(fiscal/xcorr): FC-4 maturity — 2 bugs reale găsite în testare browser`

---

### FC-5 — Economic Impact Layer

**Engine:** `lib/compliance/economic-impact.ts` — per-finding LEI calculation cu range MIN-MAX.

**Calibrare aliniată CPF Art. 219:**
- Missing 0-30 zile: 1.000-3.000 RON
- Missing 30-90 zile: 1.500-4.500 RON
- Missing 90+ zile: 2.500-7.500 RON + RISC IMPUNERE OFICIU (Art. 107 CPF)
- Late 0-15 zile: 500-1.500 RON
- Late 15-30 zile: 1.000-3.000 RON
- Late 30+ zile: 1.500-6.000 RON
- Plus ore cabinet × 200 RON/h pentru remediere + retransmiteri (1 pentru missing, 0 pentru late)

**Validare browser:** Drawer portfolio R6 missing 109 zile → afișează grid (Penalitate 2500-7500 / Cabinet 4h / **Cost total 3.300-8.300 RON / 1× retransmitere**) + 3 referințe legale (CPF Art. 219, Art. 107, OG 92/2003).

Commits: `a28e56a fix(fiscal/impact): FC-5 maturity — 2 bugs reale găsite în testare drawer`

---

### FC-6 — Pre-ANAF Simulation ("butonul wow")

**Engine:** `lib/compliance/pre-anaf-simulation.ts`
- `scoreProbability(category, severity, exposureMaxRON)` → "imminent" | "high" | "medium" | "low"
- `computeRanking(prob, exposure)` 0-100, weighted 60% probabilitate + 40% expunere normalizată
- `runPreAnafSimulation({ crossCorrelationReport }, { topN: 5 })`

**Validare browser (FC4 client):** click "Simulează ACUM" → 4 risks ordonate:
- #1 score **93** IMINENT — R6 missing 109z, 8.300 RON expunere
- #2 score **56** RIDICAT — R6 late 20z, 3.400 RON
- #3 score **31** MEDIU — R6 late 8z, 1.700 RON
- #4 score **30** MEDIU — SAF-T late 2z, 1.600 RON
- Total exposure max: 15.000 RON
- Strategic recommendation: "1 risc(uri) IMINENTE. Rezolvă-le ÎN ACEASTĂ SĂPTĂMÂNĂ"

Commits: nu a necesitat fix propriu, beneficiar FC-4 + FC-5 maturity.

---

### FC-7 — Master Exception Queue

**Engine:** `lib/compliance/master-exception-queue.ts`
- Agregă cross-correlation findings + filings + audit risk signals în UN SINGUR queue sortat
- Priority score 0-100 = 40% severity + 30% deadline + 20% impact + 10% recurrence
- 6 categorii: cross-correlation, filing-overdue, filing-missing, audit-risk, missing-evidence, anaf-notification
- 4 severities: critic, important, atenție, info
- **Dedup R6 vs filings** (FC-7 maturity fix) — items nu se mai dublează

**Validare browser:** Master Exception Queue card pe `/dashboard/fiscal`:
- 4 items unici (dedup de la 8 → 4)
- 6 tile-uri: TOTAL **4**, CRITICE **2**, IMPORTANTE **2**, OVERDUE 0, ÎN 7 ZILE 0, **IMPACT TOTAL 15.000 RON**
- 4 filter chips: Toate (4), CRITIC (2), IMPORTANT (2), Toți owners (4), Cabinet (4)
- Per item: rank #, severity badge, impact RON, missing docs, score, next action, ref legal

Commits: `db04b21 fix(fiscal/queue): FC-7 maturity — dedup R6 vs filings + calibrare RON FC-5`

---

### FC-8 — Client Burden Index

**Engine:** `lib/compliance/client-burden-index.ts`
- Per client: total exceptions, exceptions/lună, recurrent exceptions, cabinet hours/lună (cu rate 200 RON/h), active fiscal risk RON, filing compliance rate, response behavior
- Burden score 0-100: 30% exc/lună + 25% ore + 20% risc + 15% non-compliance + 10% recurrence
- Classification: profitable / normal / toxic / high-touch / dormant (cu thresholds bazate pe cost-to-fee ratio + burden)
- Recomandare per client dinamică

**Validare browser (Ana Maria → portfolio):** Tab Client Burden:
- 5 tile-uri: TOTAL CLIENȚI **1**, BURDEN MEDIU **46/100**, TOTAL ORE CABINET/LUNĂ **3.2h**, RISC FISCAL PORTOFOLIU **15k RON**, CLIENȚI TOXICI **0**
- Banner: "Portofoliu sub control — burden mediu 46/100, fără clienți toxici"
- 3 tab-uri filter: Top burden (1), Top toxic (0), Top risc fiscal (1)
- FC4 Test Client: NORMAL · burden 46/100 · 1.3 exc/lună · 3.2h · 15k RON · 1 excepții recurente

Commits: `a6551ce fix(fiscal/burden): FC-8 maturity — filing compliance rate corect`

---

### FC-9 — Missing Evidence Workflow

**Engine:** `lib/compliance/missing-evidence-workflow.ts`
- 11 EvidenceType (contract-servicii, aga-dividende, decizie-cae, balanta-cont, factura-conexa, extras-cont-bancar, registru-acte-constitutive, imputernicire-spv, raport-z-casa-marcat, saft-export, alt-document)
- 8 status: requested → sent → client-acknowledged → received → verified, plus overdue / rejected / cancelled
- Per request: timeline, urgency level, link la finding/exception sursa, deadline, email template auto-generat per tip cu reminderDaysBefore

**API:**
- `GET /api/fiscal/evidence-requests` — list + summary cu byStatus, byClient, overdueCount, dueIn3DaysCount, verifiedThisMonth
- `POST /api/fiscal/evidence-requests` — create cu auto-generate email template
- `PATCH /api/fiscal/evidence-requests/[id]` — update status (cu actor tracking)
- `DELETE /api/fiscal/evidence-requests/[id]` — cancel

**Validare browser (3 cereri create real prin API):**
- #1 Hotărâre AGA dividende 2025 → **EMAIL TRIMIS** (2 tranziții, "Mai sunt 5 zile", buton Primit)
- #2 Balanță analitică aprilie → **VERIFICAT OK** (4 tranziții full cycle, "Mai sunt 3 zile")
- #3 Contract servicii → **SOLICITAT** (1 tranziție, butoane Marchează trimis / Anulează)
- 5 tiles summary: TOTAL **3**, ÎNTÂRZIATE 0, DUE ÎN 3 ZILE 0, **AȘTEAPTĂ CLIENT 1**, **VERIFICATE LUNA ACEASTA 1**

Commits: `041b47e feat(fiscal/evidence): FC-9 — Missing Evidence Workflow`

---

### FC-10 — Authority & Mandate Guardian

**Engine:** `lib/compliance/authority-mandate-guardian.ts`
- 5 CertificateType (qualified-signature eIDAS, non-qualified, anaf-spv-token, cnp-cert, company-seal)
- 8 CertificateAuthority RO (certSIGN, DigiSign, Trans Sped, AlfaSign, AlfaTrust, EasySign, ANAF, alt)
- 5 MandateType (anaf-spv form 270, edeclaratii, onrc, casa-marcat, general-notarial)
- 6 MandateScope (submit-declarations, view-fiscal-data, represent-anaf, modify-onrc, sign-contracts, all)
- Alert generation: ≤30 zile = WARNING, ≤7 zile sau expired = CRITICAL
- Top recommendation strategic dinamic (expired → critical msg, expiring → planning msg)

**Validare browser (4 certs + 2 mandates seeded):**
- 4 alerte: 2 CRITIC (Asistent fiscal ANAF expirat -6 zile + Contabil Trans Sped expiră 3 zile) + 2 WARNING (Director General DigiSign expiră 11 zile + împuternicire notarială expiră 14 zile)
- 5 tiles: **CERTIFICATE 4** · ÎMPUTERNICIRI 2 · **EXPIRĂ CURÂND 3** · **EXPIRATE 1** · CLIENȚI CU MANDAT 1
- 3 tabs: Alerte (4), Certificate (4), Împuterniciri (2)
- Top banner roșu: "1 certificat(e) EXPIRAT(E) — toate depunerile către ANAF eșuează acum. Reînnoiește URGENT."
- Per alert: titular + serial + zile + acțiune recomandată + referință legală (eIDAS 910/2014 + Legea 455/2001 / Cod Civil Art. 2009-2042 mandat)

Commits: `2e40d39 feat(fiscal/guardian): FC-10 — Authority & Mandate Guardian`

---

## Infrastructura de testare

### Dev-only seed endpoint

`app/api/dev/seed-state/route.ts` — gated pe `NODE_ENV !== production`, acceptă session valid (orice rol), merge patch în state și flush memory cache via `readFreshStateForOrg + writeStateForOrg`. Vital pentru testare overnight fără să restartăm dev server.

### Scripts de seed și validare

- `scripts/fiscal-maturity/seed-fc4.ts` — populează state cu 7 filings realiste
- `scripts/fiscal-maturity/seed-fc4-via-api.sh` — flow complet curl
- `scripts/fiscal-maturity/validate-fc4.ts` — rulează engine local pe state
- `scripts/fiscal-maturity/make-session.ts` — generează HMAC session pentru curl

### Browser flow validat real

1. Pornesc Next.js dev server din worktree.
2. Verify cu `/api/auth/me` cine e logat (Ana Maria, cabinet-fiscal, partner mode).
3. `POST /api/partner/import-csv` cu 1 rând → FC4 Test Client SRL creat legit.
4. `POST /api/auth/switch-org` (membershipId al client-ului) → workspace=org pe FC4.
5. `POST /api/dev/seed-state { patch: { filingRecords, orgProfile, ... } }` → state populat + cache invalidat.
6. Switch înapoi la cabinet → portfolio cross-correlation vede client cu R6 + R7 calculate.
7. Click row → drawer cu economic impact (FC-5) per finding.
8. `/dashboard/fiscal` (workspace=org) → Pre-ANAF Simulation, Master Exception Queue, Missing Evidence, Authority Guardian.

### Chrome Preview MCP

Folosit pentru click + screenshot + eval JS, fără să modific browser-ul user-ului. Toate validările vizuale făcute astfel.

---

## Statistici finale

| Categorie | Count |
|-----------|-------|
| Commits pe branch killer-features-fiscal-layer | **~13** (FC-4..FC-10 + maturity fixes + TS cleanup) |
| Bug-uri reale găsite în testare browser | **8** |
| Engine tests verzi (FC-4..FC-10) | **122/122** |
| Lines de cod (engine + UI + API) | **~3.500** |
| Features end-to-end (engine + API + UI + integrare) | **7** |
| Tab-uri / cards UI noi | **5** (CrossCorrelation cu R6+R7, Pre-ANAF, Master Queue, Burden Index, Evidence Workflow, Authority Guardian) |
| Browser flows validate cu screenshot | **7** (unul per feature) |

---

## Următorii pași sugerați

1. **Code review** umann (Vaduva) și cherry-pick în `v3-unified` doar features stabile.
2. **Calibrare formule** cu input de la 2-3 cabinete contabilitate reale (burden score, classification thresholds).
3. **Integrare ANAF SPV real** pentru detectare automată certificate (FC-10) + împuterniciri form 270.
4. **Email sender** pentru FC-9 (acum doar generează template — nu trimite).
5. **Cron job** pentru FC-10 daily check + email alert automat la certificate ≤7 zile.
6. **Persistence pentru cabinet fee + avgResponseHours** (FC-8 are placeholder, fără UI de input).

---

**Status final:** branch gata pentru push + PR. Worktree `fiscal-mature` clean. Nu am atins DPO OS / codex work / deploy live.

— Generated by Claude Opus 4.7 (1M context), 2026-05-14.
