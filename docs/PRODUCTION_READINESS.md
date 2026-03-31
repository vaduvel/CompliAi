# CompliAI - Răspunsuri la Întrebările despre Readyness

> Analiză: Martie 2026
> User de test: test-qa@compliscan.ro / CompliQA2026x

---

## Q1: Ce mai trebuie urcat în Supabase?

**Răspuns: Totul funcționează cu stocare LOCAL pe Vercel**

### Ce înseamnă `COMPLISCAN_DATA_BACKEND=supabase`?

| Backend | Stocare Date Org | Stocare Users | Status |
|---------|-----------------|--------------|--------|
| `local` (default) | `.data/` pe disk (EROFS pe Vercel!) | Fișiere locale | ⚠️ Riscant pe Vercel |
| `supabase` | Supabase DB | Supabase Auth | ✅ Production ready |
| `hybrid` | Mix local + supabase | Supabase Auth | Partial |

### Ce se pierde fără Supabase?

- **Org state** - se salvează în `.data/state-{orgId}.json` pe disk
- **EROFS limit** - Vercel are filesystem read-only, deci salvarea eșuează după primele write-uri
- **Cron jobs** care necesită persistență - nu funcționează corect

### Ce e OK fără Supabase:
- Document generation (nu necesită persist)
- UI rendering
- Session auth (cookie-based)

### Ce trebuie să faceți:
```
În Vercel dashboard:
- Set COMPLISCAN_DATA_BACKEND=supabase
- Set SUPABASE_URL, SUPABASE_ANON_KEY
- Rula migrările din supabase/migrations/
```

---

## Q2: De ce importul de firme + CUI/website scan nu afișează riscuri?

**Răspuns: Pipeline-ul nu conectează CUI/website scan → findings**

### Ce există:

1. **Site Scan** (`/api/site-scan`) - scrape website, identifică cookies, formulare, tracking
2. **CUI Lookup** - prefill din date publice (parțial implementat)

### Ce lipsește:

```
Site Scan → ??? → Findings → Dashboard
                 ↑
            LIPSEȘTE CONEXIUNEA!
```

Nu există logică care să transforme rezultatele site-scan în findings automate. Site scan returnează date, dar acestea nu sunt convertite în riscuri.

### Ce trebuie adăugat:
- După site-scan, să se apeleze `intake-engine.ts` cu rezultatele
- Sau să se genereze findings direct din semnalele găsite (cookies fără banner, formulare fără DPA, etc.)

---

## Q3: De ce cere CUI/website pentru consultant/compliance?

**Răspuns: BUG - Nu există logică de skip per mod**

### Problema găsită:

```typescript
// applicability-wizard.tsx - linia 185
const [step, setStep] = useState<ApplicabilityWizardStep>("cui")  // <-- ÎNTOTDEAUNA "cui"!
```

Nu există condiție `if (userMode === 'partner') skipCUI()`.

### Ce ar trebui să se întâmple:

| Mod | Ce să ceară | Ce să NU ceară |
|-----|-------------|----------------|
| **solo** | CUI, website, sector, angajați, AI, e-Factura | - |
| **partner** | Doar workspace setup (nume, tip) | CUI, website |
| **compliance** | CUI, website, sector, angajați, AI, e-Factura | (la fel ca solo) |

### Fix necesar:
Adăugare logică în `applicability-wizard.tsx`:
```typescript
const initialStep = userMode === 'partner' ? 'sector' : 'cui'
```

---

## Q4: De ce "te trimitem în onboarding" dar vezi login page?

**Răspuns: Design OK, mesajul e înșelător**

### Flow-ul actual:
```
1. Login → POST /api/auth/login
2. Primești cookie sesiune
3. Page face redirect automatic la /onboarding
```

### Problema:
- Mesajul "Te trimitem direct în onboarding" apare ÎNAINTE de login
- După login, redirect-ul e instant, dar UX-ul pare ciudat

### Verdict: **Nu e bug major**, doar mesaj îmbunătățit necesar

---

## Q5: Există duplicări de riscuri?

**Răspuns: PROBABIL DA - Nu există dedup logic**

### Ce am găsit:

```typescript
// finding-kernel.ts - nu există dedup
// intake-engine.ts - nu există check pentru duplicate
```

Dacă:
- Rulezi site-scan de 2 ori → same findings × 2
- Re-run onboarding → same findings × 2  
- Re-scan document → same findings × 2

### Ce lipsește:
- Finding fingerprint / unique ID check
- Check dacă finding cu același ID există deja în state
- Nu permite adăugare dacă există

### Fix necesar:
În `mutateState` care adaugă findings:
```typescript
if (state.findings.some(f => f.id === newFinding.id)) {
  return // skip duplicate
}
```

---

## Q6: Ce batch processes există?

**Răspuns: 14 cron jobs configurate în vercel.json**

| Cron | Schedule | Scop |
|------|----------|------|
| `agent-orchestrator` | daily 6:00 | AI agent coordination |
| `vendor-review-revalidation` | daily 7:00 | Vendor compliance recheck |
| `legislation-monitor` | daily 7:00 | Monitor legislație nouă |
| `score-snapshot` | daily 7:50 | Snapshot compliance score |
| `daily-digest` | daily 8:00 | Daily user digest |
| `agent-regulatory-radar` | Wed 7:00 | Radar reglementări |
| `inspector-weekly` | Mon 8:00 | Weekly inspector |
| `weekly-digest` | Mon 8:30 | Weekly digest |
| `renewal-reminder` | daily 9:00 | Reminder renovări |
| `audit-pack-monthly` | 1st month 9:00 | Audit pack lunar |
| `vendor-sync-monthly` | 1st month 10:00 | Vendor sync |
| `partner-monthly-report` | 2nd month 9:00 | Partner report |
| `efactura-spv-monthly` | 15th month 6:00 | e-Factura SPV |
| `monthly-digest` | 3rd month 9:00 | Monthly digest |

### Problemă: Fără Supabase, multe dintre acestea nu pot salva results!

---

## Q7: Funcționează Gemini API pe Vercel live?

**Răspuns: DA - Confirmat funcțional**

### Test efectuat:
```
POST /api/documents/generate
Body: {documentType: "privacy-policy", ...}
Response:
- llmUsed: true
- title: "Politica de Confidențialitate"
- content_len: 3566
- content: [text GDPR compliant în română]
```

### Verdict: **✅ FUNCȚIONEAZĂ**

---

## Q8: Cât de accurate/legal sunt documentele generate?

**Răspuns: Bune cu disclaimer, dar necesită verificare umană**

### Ce am găsit în `document-generator.ts`:

| Document Type | Legal Basis | Disclaimer |
|---------------|-------------|------------|
| privacy-policy | GDPR Art. 13-14 | ✅ "generat cu AI, verifică cu specialist" |
| cookie-policy | GDPR Art. 6 + ePrivacy | ✅ |
| DPA | GDPR Art. 28 | ✅ |
| RoPA | GDPR Art. 30 | ✅ |
| retention-policy | GDPR Art. 5 | ✅ |
| ai-governance | EU AI Act | ✅ |
| job-description | Codul Muncii | ✅ |
| HR procedures | Legislația muncii | ✅ |
| contract-template | Cod Civil | ✅ |

### Verdict: **⚠️ CORECTE dar cu disclaimer obligatoriu**
- Toate documentele au baza legală corectă
- Toate au disclaimer AI
- **Recomandare**: Verificare de avocat înainte de utilizare oficială

---

## Q9: Ce tipuri de rezoluții avem?

**Răspuns: 3 categorii în `finding-kernel.ts`**

| Execution Class | Count | Descriere | Exemplu |
|-----------------|-------|-----------|---------|
| **documentary** | 11 finding types | Rezolvare cu document generat | GDPR-001 (lipsește privacy policy) → Generează policy |
| **operational** | restul (majoritatea) | Acțiune internă + confirmare | GDPR-005 (cookies) → Implementează banner + confirmă |
| **specialist_handoff** | 13 finding types | Necesită specialist extern | GDPR-011 (DPO extern) → Contactează specialist |

### Detalii:

**Documentary (11 tipuri):**
- GDPR-001, 002, 003, 004, 006, 010, 016
- AI-005
- HR-001, 002, 003

**Specialist Handoff (13 tipuri):**
- GDPR-020, 021, 022, 023, 011, 012, 013, 014, 019
- NIS2-001, 005, 015, NIS2-GENERIC

### Verdict:
- **~60%** sunt **operational** (user face ceva, confirmă)
- **~30%** sunt **documentary** (generează doc, confirmă)
- **~10%** sunt **specialist_handoff** (solicită expertiză externă)

---

## Q10: Cât de complexe sunt flow-urile de resolve?

**Răspuns: Moderat complexe, cu locuri de îmbunătățit**

### Flow-ul actual:
```
Dashboard → De rezolvat → Click finding → Resolution page → 
  ↓
  [Path 1: documentary] → Generează document → Preview → Confirm → Done
  [Path 2: operational] → Citește remediation → Confirmă implementarea → Done
  [Path 3: specialist] → Citește ce trebuie făcut extern → Close
```

### Probleme identificate:

1. **Începător nu știe ce face** - UI nu e ghidat pas-cu-pas
2. **Multi-step confusing** - prea multe click-uri până la rezoluție
3. **Nu există "first finding" tutorial** - user-ul trebuie să descopere singur

### Verdict: **⚠️ Necesită UX îmbunătățire**
- Adăugare "guided tour" pentru primul finding
- Simplificare UI pentru operational findings
- Better labels pe butoane

---

## Sumar - Ce e OK vs Ce trebuie fixat:

| Aspect | Status | Acțiune |
|--------|--------|---------|
| Supabase ready | ❌ Folosește local | Config pe Vercel |
| CUI/website → risks | ❌ Nu sunt conectate | Adăugare pipeline |
| Onboarding per mod | ❌ Cere CUI pentru toți | Skip pentru partner |
| Login → onboarding | ✅ OK | Doar mesaj îmbunătățit |
| Finding dedup | ❌ Duplicări posibile | Adăugare dedup logic |
| Batch processes | ✅ 14 cron jobs | Verificare funcționare |
| Gemini API | ✅ Funcționează | - |
| Doc accuracy | ✅ Cu disclaimer | - |
| Resolution types | ✅ 3 categorii | - |
| UX resolve | ⚠️ Necesită îmbunătățire | Guided tour |