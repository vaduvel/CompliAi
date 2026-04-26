# CompliScan — Stack documente strategice

**Status**: canonical hierarchy clarificat 26 apr 2026 (post review GPT-5.5)
**Update**: vezi secțiunea "Revisions" la final

---

## ⭐ Order de citire pentru orice agent / advisor / hire nou

```
┌──────────────────────────────────────────────────────────────┐
│ 1. compliscan-product-manifest-2026-04-26.md                 │
│    ⭐ START AICI — produs complet, sursa supremă             │
│                                                              │
│ 2. compliscan-v1-final-spec-2026-04-26.md                    │
│    🚀 Launch slice v1 (săpt 1-12) — ce facem prima dată      │
│                                                              │
│ 3. ../IA-UX-PROPUNERE (1).md                                 │
│       + ../IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md          │
│    🏛️  Arhitectură IA/UX — CITITE OBLIGATORIU ÎMPREUNĂ        │
│                                                              │
│ 4. ../IA-UX-IMPLEMENTATION-MATRIX.md                         │
│    📋 Sprint plan execuție S0-S4                             │
│                                                              │
│ 5. ../IA-UX-ROUTE-PARITY-ADDENDUM.md                         │
│    🗺️  Adevăr cod-vs-IA pe rute                              │
│                                                              │
│ 6. market-research-2026-04-26.md                             │
│    📊 Research piață cu surse — suport, NU instrucțiuni build│
│                                                              │
│ 7. compliscan-readiness-gap-memo-2026-04-26.md               │
│    ⚠️  DEPRECATED canonical — util doar gap-uri / sanity     │
└──────────────────────────────────────────────────────────────┘
```

---

## Ierarhia oficială

### Tier 1 — Sursa supremă (canonical produs complet)

**`compliscan-product-manifest-2026-04-26.md`** (1.295 linii / 55KB)

Descrie CompliScan în starea sa funcțională completă. Răspunde la:
- Ce este produsul (în totalitate)?
- Pentru cine (4 personas)?
- Care sunt cele 8 frameworks acoperite?
- Care sunt cele 10 primitive obiecte?
- Cum se navighează (5 moduri)?
- Care sunt cele 43+1 rute canonice?
- Cum se brand-uiește (white-label arhitectural)?
- Care sunt integrările RO (ANAF, ANSPDCP, DNSC, etc.)?
- Cum funcționează AI engine multi-model?
- Cum se face audit & traceability?
- Cum se face monitoring & drift?
- Care sunt pricing tiers?
- Cum se vinde?
- Cu cine concurează?
- Ce NU este?
- Care sunt outcomes 3-5 ani?

**Audiență**: founder zilnic, advisor, investitor, hire #1, AI agent care intră în proiect.

### Tier 2 — Launch slice (canonical pentru execuție v1)

**`compliscan-v1-final-spec-2026-04-26.md`** (824 linii / 56KB)

Subordinat manifestului. Descrie **fragmentul** care ajunge la primul Stripe customer plătitor în 12 săptămâni.

**Audiență**: AI agent care execută Sprint 0-4, founder pentru tracking săptămânal.

### Tier 3 — Arhitectură IA/UX (canonical pentru structură)

**`../IA-UX-PROPUNERE (1).md`** (2052 linii) + **`../IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md`** (200 linii)

**CRITICAL**: aceste 2 documente se citesc OBLIGATORIU împreună. Documentul original folosește persona "Diana = contabilă CECCAR" care e DEPRECATED. Addendum-ul ICP update suprascrie persona la "Diana = DPO consultant" + pricing nou.

**Niciun agent nu trebuie să citească IA-UX-PROPUNERE singur**.

### Tier 4 — Plan execuție

**`../IA-UX-IMPLEMENTATION-MATRIX.md`** (568 linii) — Sprint S0-S4 cu task-uri atomice
**`../IA-UX-ROUTE-PARITY-ADDENDUM.md`** (279 linii) — Hartă cod-vs-IA pe rute, redirecturi

### Tier 5 — Research suport

**`market-research-2026-04-26.md`** (587 linii) — Research piață cu surse oficiale (ONRC, ANSPDCP, DNSC, CECCAR, EUR-Lex). Suport, NU instrucțiuni de build.

### Tier 6 — DEPRECATED canonical (util doar pentru gap-uri)

**`compliscan-readiness-gap-memo-2026-04-26.md`** (717 linii)

A fost canonical "produsul final" până la 26 apr 2026 când GPT-5.5 a făcut review și a identificat că **competea pentru status canonical** cu manifestul. Retrogradat oficial.

**Util DOAR pentru**:
- Honest gap analysis ("Ce NU avem încă suficient pentru client-ready")
- "Decizii închise" pattern (8 decizii lock-in)
- Production-grade definition (4 axe)
- Strategic narrative ("Diana cu 42 clienți" story)

**NU executa pe baza acestui document.**

---

## Use cases concrete

### "Sunt advisor / investitor, am 30 min, ce citesc?"

→ `compliscan-product-manifest-2026-04-26.md` (secțiunile 1, 2, 3, 5, 17, 19)

### "Sunt AI agent nou în proiect, ce citesc înainte să scriu cod?"

1. `compliscan-product-manifest-2026-04-26.md` (full)
2. `compliscan-v1-final-spec-2026-04-26.md` (full)
3. `../IA-UX-PROPUNERE (1).md` + ICP-UPDATE addendum (împreună)
4. `../IA-UX-IMPLEMENTATION-MATRIX.md`

### "Am decizie de pricing — ce citesc?"

1. Manifest secțiunea 15 (Pricing tiers & capabilities)
2. v1-spec secțiunea 5 (Pricing FINAL cu math validation)
3. market-research secțiunea pe pricing benchmark

### "Vreau să verific ce gap-uri sunt pentru launch?"

→ `compliscan-readiness-gap-memo-2026-04-26.md` (secțiunea "Ce NU avem încă suficient")

### "De unde știm că ICP corect e DPO firm și nu cabinet contabil?"

→ `market-research-2026-04-26.md` + `../IA-UX-PROPUNERE-ICP-UPDATE-2026-04-26.md`

### "Vreau context istoric — cum am ajuns aici?"

→ Citește în ordine cronologică: market-research → readiness-gap-memo → manifest → v1-spec → ICP-UPDATE addendum

---

## Reguli de governance

### "Decizii închise" (din readiness-gap-memo, păstrate ca regulă)

Aceste decizii NU se redeschid fără dovezi noi de la clienți reali:

```
✅ Brand final = CompliScan (NU CompliAI)
✅ ICP primar = firme DPO/privacy compliance (NU contabili CECCAR)
✅ Contabilii sunt pentru Fiscal OS, NU DPO OS
✅ Patronul final NU este user principal (e destinatar)
✅ DPO validează, AI nu semnează juridic
✅ Portfolio → client context → cockpit → dosar = spine canonical
✅ Fiscal OS = layer peste SmartBill/Saga/Oblio (NU replacement)
✅ V3 design system = direcția vizuală
```

### Ce trebuie validat cu clienți reali înainte de execuție majoră

Aceste întrebări NU se decid din research/cod:

- DPO firms plătesc €249-499/lună?
- Care feature închide vânzarea (white-label / raport / ROPA / DSAR / NIS2)?
- Vor migra template-urile existente în CompliScan?
- Vor cere semnătură digitală înainte de plată?
- Vor training modules din prima?
- Fiscal OS merită lansat separat în 2026?

**Validare**: 10 conversații DPO + 3 piloturi cu 3-5 clienți reali per pilot.

---

## Cum folosesc agenții AI acest stack

```
┌─ AI Agent intră în proiect ──────────────────────────────────┐
│                                                              │
│ 1. Citește docs/strategy/README.md (THIS)                    │
│ 2. Citește docs/strategy/compliscan-product-manifest-*.md    │
│ 3. Decide ce face:                                           │
│                                                              │
│    ▶ Implementare cod nou                                    │
│      → docs/strategy/compliscan-v1-final-spec-*.md           │
│      → docs/IA-UX-PROPUNERE (1).md + ICP-UPDATE              │
│      → docs/IA-UX-IMPLEMENTATION-MATRIX.md                   │
│                                                              │
│    ▶ Decizie strategică                                      │
│      → manifest (secțiunile relevante)                       │
│      → market-research (date)                                │
│                                                              │
│    ▶ Validare gap-uri pentru launch                          │
│      → readiness-gap-memo (sanity check)                     │
│                                                              │
│    ▶ Routing / IA cleanup                                    │
│      → IA-UX-ROUTE-PARITY-ADDENDUM.md                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Revisions

### v1.1 — 26 aprilie 2026

**Trigger**: Review GPT-5.5 a identificat că `compliscan-produsul-final-2026-04-26.md` și `compliscan-product-manifest-2026-04-26.md` competau pentru status canonical.

**Acțiuni aplicate**:
1. Renamed `compliscan-produsul-final-*` → `compliscan-readiness-gap-memo-*`
2. Adăugat banner DEPRECATED pe readiness-gap-memo
3. Clarificat în manifest header: "Sursa SUPREMĂ"
4. Clarificat în v1-spec header: "Launch slice subordinat"
5. Creat THIS README ca index canonical

**Pattern-ul "Decizii închise"** preluat din readiness-gap-memo în acest README ca regulă de governance.

---

**Document creat**: 26 aprilie 2026
**Status**: canonical index al stack-ului strategic CompliScan
**Maintenance**: update obligatoriu la orice nou document strategic adăugat
