# CompliScan — Stack documente strategice (consolidat 26 apr 2026)

**Status**: 4 documente canonice. Restul arhivate.
**Trigger consolidare**: demo run pe cod real (26 apr) + răspuns DPO firm sofisticat → identificat că aveam prea multe documente cu overlap.

---

## ⭐ Cele 4 documente canonice

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│ 01-compliscan-produs-validat-piata-2026-04-26.md                 │
│    📍 CE este CompliScan + PENTRU CINE + validare piață          │
│    (consolidare manifest + market-research + decizii închise)    │
│                                                                  │
│ 02-compliscan-arhitectura-ia-ux-2026-04-26.md                    │
│    🏛️  CUM se navighează + rute + white-label + 2 apps în cod    │
│    (consolidare IA-UX-PROPUNERE + ICP-UPDATE + ROUTE-PARITY)     │
│                                                                  │
│ 03-compliscan-gap-100-client-ready-2026-04-26.md                 │
│    ⚠️  Maturity matrix 10 pași + 6 bug-uri + 8 limitări          │
│    (consolidare DEMO-RUN-REPORT + readiness-gap-memo)            │
│                                                                  │
│ 04-compliscan-directie-implementare-2026-04-26.md                │
│    🚀 Sprint S0-S4 + pilot DPO Complet plan + tech stack         │
│    (consolidare v1-final-spec + IMPLEMENTATION-MATRIX + pilot)   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Ordine de citire (orice agent / advisor / hire nou)

1. **01 — Produs validat de piață** (citește integral) — ce este, pentru cine, validat empiric
2. **02 — Arhitectura IA/UX** (citește integral) — cum se navighează, ce primitive, white-label
3. **03 — Gap 100% client-ready** (citește integral) — ce mai lipsește pentru pilot real
4. **04 — Direcție și implementare** (citește integral) — ce facem când, cum măsurăm

**Doc 1 + 2** = prezent (ce este produsul azi)
**Doc 3 + 4** = viitor (ce devine în 9 săpt)

---

## Use cases concrete

| Întrebare | Citește |
|---|---|
| Sunt advisor/investitor, ce e CompliScan? | Doc 01, secțiunile 1-3 + 8 (validare piață) |
| Sunt AI agent nou, ce înțeleg înainte să scriu cod? | Doc 02 integral + Doc 03 maturity matrix |
| Sunt founder, ce livrez săpt asta? | Doc 04 secțiunea 1 (Sprint 0) |
| Cabinet DPO întreabă "merge produsul vostru pentru noi?" | Doc 01 secțiunea 8 (validare empirică DPO Complet) |
| ANSPDCP cere descriere tehnică | Doc 02 secțiunea 8 (Audit Pack structure) + Doc 03 (maturity) |
| Investor due diligence | Doc 01 + Doc 04 (timeline + budget + market position) |
| Hire nou intră echipă | Toate 4, în ordine 01 → 02 → 03 → 04 |

---

## Reguli governance

### Decizii închise (din Doc 01)

Aceste 10 decizii **NU se redeschid** fără dovezi noi de la clienți reali:

```
✅ Brand final = CompliScan (NU CompliAI)
✅ ICP primar = cabinete DPO (NU contabili CECCAR) — validat empiric DPO Complet
✅ Contabilii sunt pentru Fiscal OS, NU DPO OS
✅ Patronul final NU este user principal
✅ DPO validează, AI nu semnează juridic
✅ Spine canonical: portofoliu → client → cockpit → dosar
✅ Fiscal OS = layer hibernated 2026, NU eliminat
✅ V3 design system = direcția vizuală
✅ AI primary = Gemini 2.5 Flash Lite EU + opțional Mistral EU
✅ White-label arhitectural — cabinet brand peste tot
```

### Ce trebuie validat cu clienți reali (NU din research/cod)

```
❓ Cabinetele plătesc €249-499/lună la Solo/Growth?
❓ Care feature închide vânzarea?
❓ Cabinetele migrează templateurile lor?
❓ Cabinetele cer semnătură digitală PDF înainte de subscription?
❓ Cabinetele preferă onboarding cu founder sau auto-serve?
❓ Fiscal OS merită lansat separat în 2027?
```

**Validare canonică**: 10 conversații DPO + 3 piloturi cu 3-5 clienți reali per pilot.

---

## Cum folosesc agenții AI acest stack

```
┌─ AI Agent intră în proiect ──────────────────────────────────┐
│                                                              │
│ 1. Citește docs/strategy/README.md (THIS)                    │
│ 2. Citește 01 → 02 → 03 → 04 în ordine                       │
│ 3. Decide ce face:                                           │
│                                                              │
│    ▶ Implementare cod nou                                    │
│      → Doc 04 (sprint în care suntem) + Doc 02 arhitectură   │
│                                                              │
│    ▶ Decizie strategică                                      │
│      → Doc 01 (validare piață) + Doc 04 (timeline impact)    │
│                                                              │
│    ▶ Validare gap-uri pentru pilot                           │
│      → Doc 03 (maturity + 6 bugs + 8 limitări)               │
│                                                              │
│    ▶ Pricing / sales discussion                              │
│      → Doc 01 sec 6 + Doc 04 sec 7-8                         │
│                                                              │
│    ▶ Routing / IA cleanup                                    │
│      → Doc 02 sec 4 (43+1 rute canonice)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Documente arhivate (`_archived/`)

Următoarele documente au fost consolidate în cele 4 canonice și sunt păstrate pentru istoric:

| Document arhivat | Consolidat în |
|---|---|
| `compliscan-product-manifest-2026-04-26.md` | Doc 01 + Doc 02 |
| `compliscan-v1-final-spec-2026-04-26.md` | Doc 04 |
| `compliscan-readiness-gap-memo-2026-04-26.md` | Doc 01 (decizii închise) + Doc 03 |
| `demo-flow-ipo-real-2026-04-26.md` | Doc 04 (pilot plan) |
| `pilot-kickoff-dpo-30days-2026-04-26.md` | Doc 03 (Real vs Planned) + Doc 04 (pilot timeline) |
| `market-research-2026-04-26.md` | Doc 01 (validare piață + Anexa B surse) |
| `IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md` | Doc 02 |

**NU folosi documente arhivate ca sursă canonică**. Sunt referință istorică pentru a urmări evoluția gândirii.

---

## Validări incluse în această consolidare

### A. Demo run empiric (26 apr 2026)

Aplicația rulată pe `localhost:3010` cu setup DPO Complet + 3 clienți + 5 findings. Output capturat:
- 43 fișiere, 400KB
- Audit Pack ZIP 20KB cu 16 files
- 4 documente generate (Privacy Policy, DPA, Retention, AI Governance)
- Magic link HMAC + patron page 92KB HTML
- 6 bug-uri vizibile identificate cu paths de cod

Locație: `/Users/vaduvageorge/Downloads/compliscan-demo-result/` (păstrat pentru evidence)

### B. DPO firm sofisticat acceptance (26 apr 2026)

Cabinet român fictiv "DPO Complet SRL" a acceptat pilot 30 zile cu 6 condiții concrete după demo controlat:
1. Date reale vs pseudonimizate clarificate
2. Documente AI marcate DRAFT până validare
3. Cel puțin 1 flux complet cu template cabinet
4. Audit Pack descărcat local + structură verificabilă
5. AI OFF pentru clientul sensibil
6. Magic link cu workaround email pentru reject/comment în pilot

→ Validare comportamentală că ICP DPO firms cu pricing €249-499 e plauzibil.

### C. Demo pack curat trimis la cabinet (26 apr 2026)

Construit `CompliScan-Demo-Pack-DPO-Complet.zip` (66KB) cu:
- Audit Pack ZIP refăcut (cu fix-uri manuale workspace.label + disclaimer)
- 4 documente generate cu cabinet branding
- HTML report client EOS V3 styled
- Email pre-completat pentru cabinet

Locație: `/Users/vaduvageorge/Downloads/CompliScan-Demo-Pack-DPO-Complet/` + ZIP

---

## Maintenance rules

### Update obligatoriu la

- ✅ Orice sprint început sau încheiat → Doc 04 timeline update
- ✅ Orice pilot încheiat → Doc 01 sec 8 (validare empirică) + Doc 03 retro learnings
- ✅ Orice bug critic descoperit → Doc 03 sec 3-4
- ✅ Orice schimbare ICP / pricing → Doc 01
- ✅ Orice schimbare arhitecturală → Doc 02
- ✅ Orice schimbare timeline / strategy → Doc 04

### NU adăuga documente noi fără regulă

Singurul motiv să creezi document nou:
- Pilot retro complet (cu numele clientului) — `pilots/<client>-retro-<date>.md`
- Architecture decision record critic — `adrs/<topic>-<date>.md`
- Postmortem incident production — `incidents/<incident>-<date>.md`

**NU dublica conținut cu cele 4 docs canonice.** Update în loc de adăugare.

---

## Versiuni

### v2.1 — 26 aprilie 2026 (CURENT)

**Trigger**: market validation cu surse reale (research agent + code audit Explore agent rulate paralel) → invalidare scenariu "DPO-uri folosesc doar Word/Excel/Drive"

**Descoperiri majore**:
1. **Concurenți direcți confirmați empiric**:
   - Privacy Manager (privacymanager.ro) — multi-client mature, 14 module, sales-led
   - MyDPO (Decalex) — primul AI GDPR RO, lansat 2023, 800+ clienți distribution power
   - Wolters Kluwer GDPR Soft — enterprise localized
   - kitgdpr.ro — document store + tools
2. **Pricing piață validat**: DPO Expert €79-360, LegalUp 650-3500 lei, iTProtection €100, EuroMarket €150-450
3. **NIS2 deadline corectat**: 22 septembrie 2025 (NU 17 oct 2024)
4. **Code audit revelează maturity reală 87%** (era estimat 66% în DEMO-RUN-REPORT) — drift detection 90%, NIS2 85%, Onboarding 80%, Stripe 70%, White-label 75%

**Acțiuni aplicate**:
1. **Doc 01**: rescriere completă secțiune Concurență (5 concurenți reali identificați), nou secțiune 7.1 Differentiation Strategy, mesaj vânzare reposition (NU mai "primul OS"), tier Mini €99 introdus, anexa A actualizată cu 22+ cabinete
2. **Doc 02**: NIS2 deadline corectat în secțiunea 11, nouă secțiune 18 "Differentiation arhitecturală vs concurenți"
3. **Doc 03**: maturity matrix recalibrată cu paths cod concret, comparație vs Privacy Manager + MyDPO + Wolters Kluwer (nu DataGuard/OneTrust care nu sunt în RO), nou secțiune 16 "Reposition strategic"
4. **Doc 04**: timeline scurtat de la 9 la 6-7 săpt (S3 redus la 1 săpt, S4 opțional), outreach Target A/B/C diferențiat per concurent actual, pricing rollout Fază 5 Migration offer Privacy Manager users, vision 2027+ cu risk mitigation Decalex/Privacy Manager

**Reposition strategic cheie**:
- ❌ NU mai vinde "primul OS pentru DPO" (Privacy Manager se autopozitionează similar)
- ❌ NU mai vinde "AI GDPR" (MyDPO are din 2023)
- ❌ NU mai vinde "înlocuim Excel" (există tools)
- ✅ Vinde: cockpit finding-first + multi-framework RO native + white-label complet + pricing transparent + AI EU sovereignty

### v2.0 — 26 aprilie 2026 (înlocuit de v2.1)

**Trigger**: demo run empiric + DPO firm acceptance + observație founder "avem prea multe documente"

**Acțiuni**:
1. Consolidare 9 docs → 4 canonice
2. Bug-uri concrete + maturity matrix incluse din demo run real
3. Validare empirică DPO Complet inclusă
4. Toate vechile mutate în `_archived/`
5. README cu ordine de citire clară

### v1.1 — 26 aprilie 2026 (înlocuit)

Hierarchy 7-tier cu manifest supreme + v1-spec launch slice. Înlocuit de v2.0.

### v1.0 — 26 aprilie 2026 (înlocuit)

Document inițial cu compliscan-produsul-final ca canonical. Renamed la readiness-gap-memo apoi DEPRECATED.

---

**Document maintainer**: Daniel Vaduva, founder
**Status**: canonical index al stack-ului strategic CompliScan
**Versiune**: v2.1
