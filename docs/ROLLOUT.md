# ROLLOUT.md — Implementation Protocol (2026-04-19)

> **Documentul ăsta e contractul nostru de execuție.**
> Definește **CRITERII** pentru fiecare schimbare, **PROTOCOL** de verificare, **CADENȚĂ** de comunicare.
> Nimic nu se taie/refactorizează/înlocuiește fără să treacă prin filtrul de aici.
>
> Combinat cu [DESTINATION.md](./DESTINATION.md) (unde mergem) + [STATE-NOW.md](./STATE-NOW.md) (de unde plecăm) = mandate complet de implementare.

---

# 0. MANDATE & BOUNDARIES

## 0.1 Ce pot face unilateral (fără aprobare per acțiune)

- Edit fișiere existente pe branch separat
- Adaugare componente noi
- Refactor componente <500 linii
- Run dev server, tests, Playwright local
- Commit pe branch separat (NU pe main)
- Audit + raport
- Reorganizare/grupare cod fără modificare logic

## 0.2 Ce cer aprobare explicită per acțiune

- 🛑 **Ștergere fișiere** (chiar și după verificare)
- 🛑 **Refactor componente >500 linii** (NIS2 2800, Settings 1985, Fiscal 1806, Sisteme 1509)
- 🛑 **Schimbare data model** (tabele Supabase, columns adăugate/șterse)
- 🛑 **Modificare API contracts existente** (endpoints renumite, response shape changed)
- 🛑 **Push pe main**
- 🛑 **Deploy pe Vercel**
- 🛑 **Modificare `vercel.json`** (cron-uri, redirects production)

## 0.3 Trigger automat pentru "STOP, întreabă user"

Dacă oricare e adevărat → mă opresc, raportez, aștept:
- Build TypeScript pică
- Tests pică
- Playwright audit găsește regresie (rută care era 200 e acum 4xx/5xx)
- Găsesc un fișier suspect ce nu pot clasifica clar
- Găsesc cod ce ar putea fi feature ascuns dar nu am dovadă
- Trebuie să modific 2+ fișiere cu logică legată ce nu am autorizat

## 0.4 Cadență comunicare

| Cadență | Format | Conținut |
|---|---|---|
| **Per batch (3-5 fișiere)** | Mesaj 5-10 linii | Ce am făcut + verdict tests + next batch |
| **Per fază** (la sfârșit) | Mesaj 15-30 linii + raport | Ce s-a livrat, ce s-a tăiat, ce a fost surpriză, ce urmează |
| **Per blocker** | Imediat | Ce m-a blocat, opțiuni, recomandare, cer decizie |
| **Per zi de lucru** | Sumar 1 linie | Ce am avansat azi |

---

# 1. DECISION FRAMEWORK — 5 ÎNTREBĂRI PER MODUL

Pentru FIECARE pagină / componentă / API endpoint / cron / lib file, aplic în ordine:

## 🔍 Întrebarea 1: Este **MORT**?
**Test**: 0 referințe în nav config + 0 imports + 0 redirects + 0 mention în alt code

| Răspuns | Acțiune |
|---|---|
| ✅ DA, mort confirmat | → propun **DELETE** + cer aprobare |
| ❌ NU, are referințe | → trec la întrebarea 2 |

## 🔍 Întrebarea 2: Este **NEUTILIZAT**?
**Test**: are referințe (cod) DAR niciun trafic real / niciun JTBD activ în USERS.md

| Răspuns | Acțiune |
|---|---|
| ✅ DA, dead-end UI | → propun **DELETE + REDIRECT** la următoarea pagină utilă |
| ❌ NU, are scop | → trec la întrebarea 3 |

## 🔍 Întrebarea 3: Este **FĂRĂ SCOP** în DESTINATION?
**Test**: serveste vreun JTBD prioritar (top 10 din USERS.md) sau vreo cerință din canon UX/IA?

| Răspuns | Acțiune |
|---|---|
| ✅ NU servește nimic | → propun **DELETE** + justificare |
| ⚠️ Servește indirect (via redirect) | → propun **REDIRECT 301** la pagina canonică |
| ✅ Servește direct | → trec la întrebarea 4 |

## 🔍 Întrebarea 4: Flow-ul actual e **MAI BUN** decât cel din DESTINATION?
**Test**: comparăm UX actual vs canon (Smart Resolve Cockpit, sidebar, IA)

| Răspuns | Acțiune |
|---|---|
| ✅ DA, actual e mai bun | → **KEEP** + documentez de ce, update DESTINATION dacă justificat |
| ❌ NU, canon e mai bun | → propun **REPLACE / REFACTOR** cu plan concret |
| 🟰 La paritate | → **KEEP** (nu introduc risc inutil) |

## 🔍 Întrebarea 5: Există **DUPLICAT** care face exact același lucru?
**Test**: alt fișier/endpoint cu aceeași funcție

| Răspuns | Acțiune |
|---|---|
| ✅ DA, duplicat confirmat | → propun **MERGE** (păstrez canonical, redirect celălalt) |
| ❌ NU | → KEEP cum e |

## Decision Matrix sintetic

| Întrebare 1 | Întrebare 2 | Întrebare 3 | Întrebare 4 | Întrebare 5 | DECIZIE |
|---|---|---|---|---|---|
| Mort | - | - | - | - | **DELETE** |
| Viu | Neutilizat | - | - | - | **DELETE+REDIRECT** |
| Viu | Folosit | Fără scop | - | - | **DELETE** (cu evidence) |
| Viu | Folosit | Servește indirect | - | - | **REDIRECT 301** |
| Viu | Folosit | Servește direct | Actual mai bun | - | **KEEP** |
| Viu | Folosit | Servește direct | Canon mai bun | - | **REPLACE/REFACTOR** |
| Viu | Folosit | Servește direct | - | Are duplicat | **MERGE** |

---

# 2. VERIFICATION PROTOCOL — pentru fiecare DECIZIE

## 2.1 Pre-flight (înainte de orice acțiune)

```
□ Grep numele fișierului/funcției în tot codul
□ Verific imports în alte fișiere
□ Verific referințe în nav config (navigation.ts, dashboard-routes.ts)
□ Verific redirects în middleware.ts
□ Verific Test files (.test.ts, .spec.ts)
□ Verific config files (next.config, vercel.json, package.json scripts)
□ Verific docs care mention numele
```

**Output pre-flight**: tabel cu unde apare numele + clasificare (real reference vs noise)

## 2.2 Verificare per acțiune

### DELETE
```
1. Pre-flight pass (zero referințe valide)
2. Cer aprobare TA explicit cu lista
3. Execut delete în batch (3-5 fișiere)
4. Commit per batch cu mesaj clar:
   "chore(rollout): remove orphan {file} (verified zero refs in nav/imports/redirects)"
5. Run: npm run build → trebuie OK
6. Run: npm test → trebuie OK
7. Run: Playwright audit → toate rute care erau 200 trebuie să rămână 200 (sau redirect 301)
8. Raportez TIE: "{N} fișiere șterse, build OK, tests OK, audit OK"
```

### REDIRECT
```
1. Identific ruta veche + ruta canonică
2. Adaug redirect 301 în middleware.ts (NU șterg pagina veche încă)
3. Test manual: http://localhost:3001/{ruta-veche} → ajunge la {ruta-canonică}?
4. Test Playwright: redirectele funcționează?
5. Aștept 1 ciclu (tu îl folosești o zi)
6. Confirmare TA că nu lipsește nimic → ATUNCI șterg pagina veche (vezi DELETE)
```

### REPLACE / REFACTOR
```
1. Citesc fișierul vechi complet
2. Identific dependențe + ce funcții sunt apelate extern
3. Propun structura nouă (componente <300-500 linii)
4. Cer aprobare TA cu schiță (nu plan complet)
5. Execut pe branch separat
6. Test extensiv (unit + integration + Playwright)
7. Side-by-side comparison: feature parity demonstrat
8. Cer aprobare merge după ce vezi tu
```

### MERGE (consolidare duplicat)
```
1. Identific cele 2+ fișiere
2. Stabilesc canonical (de regulă cel mai bine implementat)
3. Cei care merg pe celălalt → migrez la canonical
4. Adaug redirect dacă e ruta web
5. Șterg duplicatul (DELETE protocol)
6. Verificare extensivă
```

## 2.3 Quality gates per batch

**Roșu = STOP** (nu continui până nu rezolv):
- TypeScript build pică
- Tests pică
- Playwright găsește regresie (rută 200 → 4xx fără redirect)
- Pagină visibility 0 (e accesabilă dar afișează nimic)

**Galben = WARNING** (continui dar raportez):
- Console errors în browser
- Slow performance (>3s pe pagina principală)
- Linting warnings noi

**Verde = OK** (continui următorul batch).

## 2.4 Rollback plan

**Fiecare batch = un commit separat**. Dacă batch-ul N introduce probleme:
```
git revert HEAD          # un commit, simplu
sau
git revert HEAD~3..HEAD  # ultimele 3 commits, dacă batch-ul e mare
```

**Backup global înainte de Faza 1**: tag git `pre-rollout-2026-04-XX`. Dacă tot rollout-ul e dezastru:
```
git reset --hard pre-rollout-2026-04-XX
```

---

# 3. IMPLEMENTATION PHASES — cu criterii per fază

## Faza 1: CURĂȚENIE SIGURĂ (Săpt 1, 5 zile)

### Pre-conditions
- [ ] DESTINATION.md aprobat (✅ done)
- [ ] STATE-NOW.md aprobat (✅ done)
- [ ] Git tag backup creat: `pre-rollout-2026-04-XX`
- [ ] Branch nou: `rollout/faza-1-cleanup`

### Subfaza 1.1: Audit + Decision matrix (Zi 1)
**Output**: tabel complet cu fiecare din cele 76 pagini + 86 componente:
| Item | Întrebare 1-5 răspunsuri | Decizie | Approval needed |

**Aprobare TA**: tabelul în întregime, batch by batch.

### Subfaza 1.2: Redirects 301 (Zi 2)
**Acțiune**: 22 redirect-uri legacy → canonic în `middleware.ts`

**Criteriu de succes**:
- Toate cele 22 rute vechi → ajung la rute canonice cu 301
- Playwright test: navigare prin toate redirect-urile fără eroare
- Browser test: tu deschizi vechea rută → ești redirectat fluent

**Risc**: zero (redirects sunt aditive, nu șterg nimic încă)

### Subfaza 1.3: Ștergere RO duplicate (Zi 3)
**Targets** (după redirect activ + 1 zi soak):
- `/dashboard/scanari/page.tsx`
- `/dashboard/setari/page.tsx`
- `/dashboard/setari/abonament/page.tsx`
- `/dashboard/rapoarte/page.tsx`
- `/dashboard/rapoarte/auditor-vault/page.tsx`
- `/dashboard/rapoarte/trust-profile/page.tsx`
- `/dashboard/politici/page.tsx`
- `/dashboard/audit-log/page.tsx`

**Pre-flight per fiecare**: cerificat zero referințe în cod (`grep`)
**Aprobare TA**: lista în bloc înainte de delete
**Verificare post**: Playwright audit + build + tests

### Subfaza 1.4: Ștergere pagini orfane confirmate (Zi 4)
**Candidate** (din STATE-NOW §3.2):
- `/dashboard/asistent` — confirmă cu tine: îl folosești? Dacă NU → DELETE
- `/dashboard/checklists` — confirmă cu tine
- `/dashboard/findings/[id]` — confirmat duplicat cu `/dashboard/resolve/[findingId]` → REDIRECT
- `/dashboard/partner` + `/dashboard/partner/[orgId]` — confirmat duplicat cu `/portfolio` → REDIRECT
- `/dashboard/sisteme/eu-db-wizard` — confirmă

**Per fiecare**: aprobare ta explicită ÎNAINTE de delete (cer mesaj separat).

### Subfaza 1.5: Sidebar nav update (Zi 5)
**Acțiune**: `components/compliscan/navigation.ts` reflectă DESTINATION §2 (sidebar per mod)

**Criteriu de succes**:
- Mod Partner: 5 itemi Portofoliu + Firmă dropdown + per-firmă itemi + Setări cont
- Mod Compliance: identice cu Partner per-firmă, fără Portofoliu
- Mod Solo: 6 itemi simplificați
- Mod Viewer: 4 itemi read-only

**Risc**: mediu (UI vizibil, dar non-destructive)

### Output Faza 1
- [ ] 22 redirects 301 active
- [ ] 8+ pagini RO duplicate șterse
- [ ] 4-6 pagini orfane confirmate șterse
- [ ] Sidebar canon-aligned
- [ ] Build clean, tests pass, audit clean
- [ ] Tu poți folosi aplicația fără să găsești ceva rupt

**Săptămână terminat doar când TU spui "OK".**

---

## Faza 2: ENGINE FIX + INBOX (Săpt 2, 5 zile)

### Subfaza 2.1: Wire website scraper în baseline-scan (Zi 1-2)
**Acțiune**: integrare `lib/server/website-prefill-signals` cu `app/api/partner/import/baseline-scan/route.ts`

**Criteriu de succes**:
- Re-test cu 3 firme reale (Bitdefender, Altex, Dedeman)
- Findings differentiate: Bitdefender ar trebui să primească LESS findings (privacy policy detected) decât SRL gol fără site
- Score per firmă DIFERIT, nu identic

**Aprobare TA**: după re-test, vezi rezultatele și aprobi

### Subfaza 2.2: ANAF data integration (Zi 2)
**Acțiune**: folosește `efacturaRegistered` din ANAF lookup să sari peste finding "e-Factura missing" dacă firma e deja înregistrată

**Criteriu**: număr findings se micșorează pentru firme cu e-Factura activă

### Subfaza 2.3: Inbox cross-client (Zi 3-5)
**Acțiune NEW**: 
- API: `GET /api/portfolio/inbox-aggregate`
- UI: `/portfolio/alerte` cu feed cronologic, filter, bulk actions
- Deep-link la finding/firmă

**Criteriu**: tu ca Diana → deschizi `/portfolio/alerte` → vezi alerte din TOATE firmele tale, sortate pe urgență

### Output Faza 2
- [ ] Engine produce findings credibile, diferențiate per firmă
- [ ] Inbox cross-client funcțional
- [ ] Aha moment #1 (din DESTINATION §1.3) atins

---

## Faza 3: REFACTOR PAGINI MONSTRI (Săpt 3, 5 zile)

### Pre-condiție OBLIGATORIE
**Aprobare TA per fiecare refactor major** — astea sunt fișiere mari, risc real.

### Subfaza 3.1: NIS2 (2800 linii → <500) (Zi 1-2)
**Plan**:
- Split pe 4 sub-componente (Assessment / Incidente / Maturitate / DNSC)
- `<MonitorizareNIS2 />` master cu tabs
- Hook-uri shared pentru state

**Aprobare**: îți arăt schița înainte de scris cod.

**Test**: feature parity cu vechi (nimic ce era acolo nu se pierde).

### Subfaza 3.2: Settings (1985 linii → <400) (Zi 3)
**Plan**: split pe tabs (Organizație, Membri, Integrări, Automatizare, White-label, Billing, Notificări)
**Aprobare**: schița înainte
**Test**: toate setările existente funcționează

### Subfaza 3.3: Fiscal (1806 linii) (Zi 4)
**Acțiune**: redirect la `/dashboard/monitorizare/conformitate?tab=efactura`
**NU rescriu** — mut conținutul în tab-ul existent.

### Subfaza 3.4: Sisteme AI (1509 linii) (Zi 5)
**Plan**: split AI Inventory + Conformity + EU DB Wizard pe tabs

### Output Faza 3
- [ ] 0 fișiere >500 linii
- [ ] Toate features păstrate
- [ ] Build + tests + audit OK

---

## Faza 4: SMART RESOLVE COCKPIT + BULK (Săpt 4, 5 zile)

### Subfaza 4.1: Cockpit unic per finding (Zi 1-3)
**Conform**: `docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md`
**Locație**: `/dashboard/actiuni/remediere/[findingId]`
**Stack**: Context → Impact → Pași → Evidence → Decide
**Goal**: 3-click max pentru finding evident

### Subfaza 4.2: Bulk actions (Zi 4-5)
**Acțiune**:
- Checkbox per finding row
- BulkActionsBar floating
- API: `POST /api/findings/bulk`
- Test: confirmă 23 finding-uri intake-gdpr-* într-un click

### Output Faza 4
- [ ] Friction Claude #1 (5+ click-uri) eliminată
- [ ] Bulk actions funcționale

---

## Faza 5: QUICK-ADD + DIAGNOSTIC (Săpt 5, 5 zile)

### Subfaza 5.1: Quick-add 1 client (Zi 1-2)
**Goal**: <30 secunde de la click la "client în portofoliu"
**Flow**: 1 câmp (CUI) → ANAF → website scrape → findings → vizibil

### Subfaza 5.2: Diagnostic 1-pagină (Zi 3-5)
**NEW component**: `<ClientDiagnosticReport />`
**Folosit ca**: lead magnet în GTM, ofertă pre-populată
**Format**: PDF descărcabil cu brandul Diana

### Output Faza 5
- [ ] Aha moment #2 (din DESTINATION) atins
- [ ] Onboarding client nou <45 min

---

## Faza 6: ANSPDCP + POLISH + LAUNCH SOFT (Săpt 6, 5 zile)

### Subfaza 6.1: ANSPDCP-shaped audit pack (Zi 1-2)
**Endpoint NEW**: `/api/exports/anspdcp-pack/[orgId]`
**Format**: PDF semnat cryptographic, structură format ANSPDCP-shaped
**Critical**: insight Radu — *"reports don't match RO authority format"*

### Subfaza 6.2: Polish UX rămas (Zi 3-4)
- Portfolio auto-refresh after mutations (React Query invalidate)
- Header/stepper single source of truth
- Label clarification (*"Numele cabinetului tău"*)
- Empty / loading / error states consistente

### Subfaza 6.3: Launch soft (Zi 5)
- Verificare end-to-end cu profile Diana real
- 5 design partners invited (free 6 luni — anunț preparat)
- USER-VALIDATION-KIT activ
- Telemetrie + Sentry monitoring
- Anunț LinkedIn founder voice

### Output Faza 6
- [ ] Aha moment #3 (audit ANSPDCP în 1 click) atins
- [ ] Aplicație **launch-ready** pentru Diana primary
- [ ] Tu ești pe podea cu beta-cabinete reale

---

# 4. PER-MODULE DECISION MATRIX (sample — full în Faza 1.1)

Aici e structura. Tabelul complet îl produc în Faza 1.1 ca prim deliverable.

## Sample: 5 pagini decision matrix

| Pagină | Mort? | Neutilizat? | Fără scop? | Actual mai bun? | Duplicat? | DECIZIE | Dovadă | Aprobare |
|---|---|---|---|---|---|---|---|---|
| `/dashboard/scanari` | NO | YES | YES | NO | YES (`/scan`) | **DELETE+REDIRECT** | grep: 0 imports, 0 refs valid | ✅ Aprobată |
| `/dashboard/asistent` | NO | UNCERTAIN | UNCERTAIN | NO | NO | **ASK USER** | Pagină 352 linii, nu e linkată | ⚠️ NEEDS APPROVAL |
| `/dashboard/sisteme` (1509 linii) | NO | NO | NO | NO | NO | **REFACTOR + MERGE în Monitorizare** | Folosită activ, dar prea mare | ⚠️ NEEDS APPROVAL refactor |
| `/dashboard/resolve` (canonical) | NO | NO | NO | YES | NO | **KEEP + REFACTOR cockpit** | Inima produsului | ✅ KEEP |
| `/dashboard/partner` | NO | UNCERTAIN | YES (dupe `/portfolio`) | NO | YES | **DELETE+REDIRECT** | Funcție duplicată | ⚠️ ASK USER if anyone bookmarks |

---

# 5. QUALITY GATES — la fiecare batch

```
After every batch of 3-5 file changes:

[ ] npm run build              → 0 errors, 0 new warnings
[ ] npm test                    → all pass
[ ] npx playwright test         → consultant-workspace-audit passes
[ ] curl -I http://localhost:3001/portfolio  → 200 (or 301 if redirect)
[ ] curl -I http://localhost:3001/dashboard  → 200 (or 307 if persona-based redirect)
[ ] git status                  → clean working tree before next batch
[ ] git log --oneline -5        → last 5 commits make sense

If ANY of these fails: STOP, report, ask.
```

---

# 6. RISK MITIGATION

## 6.1 Top 5 risks + mitigare

| Risc | Mitigare |
|---|---|
| **Ștergere greșită** (fișier important fără să-mi dau seama) | Pre-flight 5-step + aprobare ta + git revert facil |
| **Refactor introduce bug-uri** | Tests + Playwright + side-by-side comparison + feature parity demo |
| **Sidebar update rupe navigation** | Test în browser înainte commit + tu confirmi vizual |
| **Build pică pe production deploy** | Build local OBLIGATORIU înainte de orice merge la main |
| **Pierd context între faze** | Doc updates după fiecare fază + commit messages clare + TodoWrite real-time |

## 6.2 "When to ask user" triggers

Mă opresc imediat și te întreb dacă:
- 🛑 Găsesc cod ce nu pot clasifica (ar putea fi feature secret pe care l-ai folosit)
- 🛑 O ștergere ar afecta vreun JTBD din USERS.md
- 🛑 Refactor depășește 800 linii într-un fișier
- 🛑 Trebuie să modific Supabase schema
- 🛑 O acțiune ar afecta deploy-ul Vercel
- 🛑 Build-ul pică în mod inexplicabil
- 🛑 Test-ul Playwright eșuează nou
- 🛑 Găsesc un bug critic care nu era în scope (dar trebuie reparat)

---

# 7. APPROVAL CHECKPOINTS

## 7.1 Soft (fără aprobare per acțiune, doar informare)

- Edits pe fișiere mici <300 linii
- Adăugare componente noi
- Adăugare API endpoints noi
- Refactor structuri folder
- Update documentație internă

## 7.2 Hard (cer da/nu explicit)

- 🛑 Delete files (chiar și verificate)
- 🛑 Refactor fișiere >500 linii
- 🛑 Modify data model (Supabase tables)
- 🛑 Modify API contracts existente
- 🛑 Modify cron-uri
- 🛑 Modify middleware production
- 🛑 Push pe main
- 🛑 Deploy pe Vercel

## 7.3 Format aprobare cerută

```
## Cer aprobare pentru: {acțiune}

**Ce vreau să fac**: {descriere clară 1-2 linii}

**Pe ce fișiere**:
- file1.ts (motiv)
- file2.tsx (motiv)
- ...

**Verificare făcută**:
- ✅ Pre-flight: {detalii}
- ✅ Build OK
- ✅ Tests OK
- ✅ {orice altceva relevant}

**Risc**: {scăzut / mediu / înalt + de ce}

**Rollback**: {cum revertem dacă e greșit}

**Răspuns așteptat**: DA / NU / MODIFY (cu detalii)
```

---

# 8. PROGRESS TRACKING

## 8.1 Per zi
- TodoWrite update real-time
- Commit messages clare ("rollout/faza-X subfaza-Y: {action}")
- 1-line update la sfârșit de zi: *"Azi: {fazei subfaza}, {N} commits, build {OK/issue}, mâine {next}."*

## 8.2 Per fază
- Mesaj de fază închisă cu:
  - Ce s-a livrat (lista concretă)
  - Ce s-a tăiat (lista concretă, cu motive)
  - Surprize / abateri de la plan
  - Ce urmează în faza următoare
  - Cer aprobare să continui

## 8.3 Per săptămână (vineri)
- Demo ce poți rula tu local
- Screenshots before/after pentru părți vizuale
- Lista de bug-uri descoperite + fix-uri aplicate
- Decizii de produs care au necesitat update DESTINATION

---

# 9. PRINCIPII DE EXECUȚIE

## 9.1 Zero acțiuni "în jungla"
**Nu tai nimic** fără să trec prin Decision Framework §1.

## 9.2 Tot ce schimb e reversible
**Fiecare batch = un commit separat.** Git revert disponibil oricând.

## 9.3 Comunicare clară > viteză
**Mai bine întreb 2 ori** decât să fac o greșeală tăcută.

## 9.4 Refactorul respectă feature parity
**Nu pierd functionality** în refactor. Demonstrez side-by-side înainte de merge.

## 9.5 User testing > teorie
**Tu rulezi aplicația** la fiecare etapă. Dacă tu zici *"ceva nu e în regulă"*, eu mă opresc și investighez.

## 9.6 DESTINATION e canon, dar live document
**Dacă găsesc realitate care contrazice DESTINATION**, ridic flag-ul și update-uim DESTINATION înainte de a continua.

---

# 10. SUCCES SOFT-LAUNCH (Săpt 6, ziua 5)

## Definiție success Săpt 6

- ✅ 5 cabinete design-partner invitate (gratis 6 luni)
- ✅ Tu poți demo end-to-end fără să te încurci în flow
- ✅ Aplicația merge fără bug-uri în flow primary Diana
- ✅ Inbox cross-client funcțional și valoros
- ✅ Smart Resolve Cockpit funcțional cu max 3-click
- ✅ Bulk actions funcționale
- ✅ ANSPDCP-shaped export funcțional
- ✅ Build + tests + audit clean
- ✅ Documentație internă up-to-date
- ✅ TU spui "asta e produsul, îl pot vinde"

## Definiție eșec (trigger pentru rethink)

- ❌ Săpt 6, sfârșit, ai bug-uri majore în demo
- ❌ Am refactorizat dar features lipsesc
- ❌ Am tăiat ceva care era important și nu am observat
- ❌ Tu te-ai pierdut în ce s-a schimbat (semnal că am comunicat slab)

---

# APENDICE: COMENZI UTILE

## Pre-flight check rapid pentru un fișier
```bash
# Verifică references
grep -r "filename-without-ext" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# Verifică nav config
grep -r "filename" components/compliscan/navigation.ts lib/compliscan/dashboard-routes.ts

# Verifică redirect existing
grep -r "filename" middleware.ts

# Verifică tests
find tests/ -name "*.test.*" -exec grep -l "filename" {} \;
```

## Check redirect 301
```bash
curl -I http://localhost:3001/dashboard/scanari
# Should show: HTTP/1.1 301 Moved Permanently
# Location: /dashboard/scaneaza
```

## Run all checks before commit
```bash
npm run build && npm test && npx playwright test tests/e2e/consultant-workspace-audit.spec.ts
```

## Backup before destructive batch
```bash
git tag pre-rollout-faza-1-batch-3-2026-04-XX
git push origin pre-rollout-faza-1-batch-3-2026-04-XX
```

---

> **END ROLLOUT.md v1.0** — ultima generare 2026-04-19.
> Combină cu DESTINATION.md (unde mergem) + STATE-NOW.md (de unde) + USERS.md (pentru cine).
> Following these protocols = maximum safety + clear communication + brutal discipline.
