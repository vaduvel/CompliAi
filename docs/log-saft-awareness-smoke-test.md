# Log: SAF-T Awareness + Smoke Test E2E

Data: 2026-03-18

## Task 1: SAF-T Awareness în Applicability Engine

### Ce s-a făcut

SAF-T (D406) adăugat ca al 6-lea tag în Applicability Engine, urmând pattern-ul CER.

**Fișiere modificate:**

1. **`lib/compliance/applicability.ts`**
   - `ApplicabilityTag` extins: `"saft"` adăugat la union type
   - Evaluare: `requiresEfactura === true` → `certainty: "probable"`, altfel `"unlikely"`
   - Reason include recomandare "verifică cu contabilul" + menționează D406
   - Label: `"SAF-T (D406)"`

2. **`lib/compliance/legal-sources.ts`**
   - `FRAMEWORK_LEGAL_STATUS.saft` — status `"active_ro"`, notă cu comunicare ANAF 2024-2025
   - `LEGAL_SOURCES.saft` — citare Ordinul MFP 1783/2021, Art. 5-7

3. **`lib/compliance/applicability.test.ts`**
   - 2 teste noi: SAF-T probable/unlikely
   - Actualizat: test max profile (acum 6 tags), entry count (5 intrări minime)

### Decizia de design

SAF-T e legat de `requiresEfactura` (nu de sector) pentru că:
- Orice firmă plătitoare de TVA e candidat SAF-T
- Nu adăugăm un câmp nou în wizard — reutilizăm informația existentă
- Certainty `"probable"` (nu `"certain"`) — contabilul confirmă

## Task 2: Smoke Test E2E

### Ce s-a făcut

Test integrat care verifică flow-ul complet: Profile → Applicability → State → Health Check → Finding → Evidence → Remediation → Dashboard Score.

**Fișier creat:**
- `lib/compliance/smoke-test-e2e.test.ts` — 13 teste, 6 secțiuni

### Secțiunile testului

| Secțiune | Ce verifică | Teste |
|---|---|---|
| Step 1: Applicability Wizard | Profilul unei firme retail + energy, tag-uri, surse legale | 2 |
| Step 2: Dashboard State | Normalizare stare, scor inițial, health check pe stare goală | 2 |
| Step 3: Finding & Remediation | Câmpuri finding, generare remediation plan | 2 |
| Step 4: Evidence Quality | Calitate suficientă (245KB PDF), calitate slabă (50B) | 2 |
| Step 5: Audit Pack Readiness | Health check cu/fără finding | 1 |
| Step 6: SAF-T Integration | SAF-T tag activ/inactiv, sursă legală completă | 3 |
| Full Chain | Tot flow-ul într-un singur test | 1 |

### Validare

- TypeScript: 0 erori (excl. .next cache)
- Applicability tests: 18/18 passed
- Smoke test: 13/13 passed
- Full suite: 506 passed, 1 skipped, 0 failed

## Branch

`feat/saft-awareness-smoke-test` — pornit din `main`, zero impact pe alte branch-uri.
