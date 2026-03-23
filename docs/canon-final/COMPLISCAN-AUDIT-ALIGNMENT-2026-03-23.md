# CompliScan — Audit de aliniere repo vs documentatie

Status: `alignment audit`
Date: `2026-03-23`
Scope: repo curent, build/test/lint, comparatie cu documentele canon pentru handoff extern.

## Verdict

Documentatia canonica este in mare parte aliniata cu aplicatia reala si este aproape sigura pentru handoff catre Claude Web, dar nu trebuie data in forma actuala fara cateva corectii punctuale.

Concluzia scurta:

- produsul descris in spec exista in cod si se construieste cu succes
- shell-ul, IA-ul, modurile de lucru, plan-gating-ul, Agent OS, NIS2, portfolio si exporturile sunt reale
- exista totusi cateva afirmatii stale sau insuficient calibrate care trebuie fixate
- "live production truth" nu a putut fi confirmat complet din acest mediu, deci domeniile trebuie descrise prudent

## Ce am verificat

### Inventar runtime

- `123` fisiere `app/api/**/route.ts`
- `38` pagini `app/dashboard/**/page.tsx`
- `73` fisiere in `components/compliscan`
- `65` fisiere in `components/evidence-os`
- `139` fisiere `*.test.ts(x)` detectate prin `rg --files`

### Validare executabila

- `npm run build` -> `PASS`
- `npm run lint` -> `PASS` cu warnings de unused vars
- `npm test` -> `FAIL` in acest mediu
- `vitest run --exclude 'tests/live/**' --exclude '.claude/**'` -> `PASS`

### Suprafete analizate

- shell si navigatie
- moduri user / workspace / roluri
- scoring si snapshot
- Agent OS si commit flow
- NIS2 assessment, DNSC wizard si store-ul dedicat
- portfolio aggregated surfaces
- cron-uri si route comments
- plan-gating si billing scopes
- exporturi, trust, demo, share tokens
- integrari externe declarate

## Findings

### 1. Domeniul live nu este confirmat univoc din acest mediu

Nivel: `ridicat`

In repo apar doua familii de URL-uri implicite:

- `NEXT_PUBLIC_URL` / fallback-uri spre `https://compliai.ro`
- `NEXT_PUBLIC_APP_URL` / comentarii sau fallback-uri spre `https://app.compliscan.ro`

Observatie:

- rezolvarea DNS pentru `compliai.ro` nu a putut fi confirmata din mediul curent
- web search nu a oferit un rezultat public util pentru produsul nostru
- deci nu e sigur sa dam lui Claude un singur domeniu ca "adevar live confirmat"

Regula buna pentru handoff:

- descriem domeniile ca `defaults/fallbacks istorice sau configurabile in cod`
- nu descriem niciunul drept productie verificata din acest audit

### 2. Statistica repo din spec-ul mare era partial stale

Nivel: `mediu`

Spec-ul mare avea:

- `72` fisiere in `components/compliscan`
- `57` fisiere in `components/evidence-os`
- `138` teste

Repo-ul curent are:

- `73` fisiere in `components/compliscan`
- `65` fisiere in `components/evidence-os`
- `139` teste

Impact:

- nu schimba produsul
- dar reduce increderea daca dam documentul ca snapshot factual

### 3. Comentariile unor cron route-uri sunt in contradictie cu `vercel.json`

Nivel: `mediu`

`vercel.json` trebuie tratat ca sursa de adevar.

Exemple concrete de comentarii stale:

- `app/api/cron/score-snapshot/route.ts`
  - comentariu: `07:30 UTC`
  - `vercel.json`: `50 7 * * *`
- `app/api/cron/inspector-weekly/route.ts`
  - comentariu: `Wednesdays 09:00 UTC`
  - `vercel.json`: `0 8 * * 1`
- `app/api/cron/vendor-sync-monthly/route.ts`
  - comentariu: `15th of month, 09:00 UTC`
  - `vercel.json`: `0 10 1 * *`
- `app/api/cron/weekly-digest/route.ts`
  - comentariu: `luni 08:00 UTC`
  - `vercel.json`: `30 8 * * 1`

Impact:

- documentul corect trebuie sa spuna explicit ca route comments pot fi invechite
- nu trebuie sa derivam comportamentul operational din comentarii

### 4. Repo-ul este buildable, iar nucleul local este verde, dar `npm test` brut nu este complet verde

Nivel: `mediu`

Rezultate:

- build-ul trece complet
- lint-ul trece cu warnings, nu cu erori
- suite-ul local, fara live tests si fara `.claude`, trece integral:
  - `138` fisiere
  - `735` teste
- `npm test` brut pica in acest mediu din doua motive distincte

Failure-urile din `npm test` brut:

1. `tests/live/google-vision.live.test.ts`
   - teste live care cer acces la `eu-vision.googleapis.com`
   - in acest mediu pica pe `ENOTFOUND`

2. fisiere duplicate din `.claude/worktrees/...`
   - includ inca o copie a testelor live Vision
   - includ si un failure separat in:
     - `.claude/worktrees/intelligent-shaw/lib/server/scan-workflow.test.ts`
   - simptom:
     - `toThrow(RequestValidationError)` nu recunoaste instanta aruncata drept clasa asteptata

Observatie importanta:

- repo-ul principal, fara testele live dependente de retea si fara worktree-ul auxiliar, este verde
- asta creste increderea in handoff-ul de produs
- dar ramane important sa nu prezentam `npm test` brut ca "verde" in forma actuala a mediului

### 5. Agent OS este corect descris doar daca il numim functional, nu placeholder

Nivel: `mediu`

Realitate confirmata in cod:

- `runIntakeAgent`
- `runFindingsAgent`
- `runDriftAgent`
- `runEvidenceAgent`

Gap real:

- `drift` este inca mult euristic
- `evidence` nu este persistat in commit flow
- `lib/compliance/route.ts` are comentarii stale cu `Placeholder`

Deci:

- a spune "placeholder pur" este fals
- a spune "complet matur end-to-end" este de asemenea fals

### 6. NIS2 si DNSC sunt mai mature decat ar sugera unele note vechi

Nivel: `mediu`

Realitate confirmata:

- assessment NIS2 are `20` intrebari in `lib/compliance/nis2-rules.ts`
- exista store separat `lib/server/nis2-store.ts`
- DNSC Wizard are deja:
  - eligibilitate bazata pe applicability
  - prefill pentru nume, CUI, sector, dimensiune
  - generare de draft prin `buildDNSCNotificationDraft`

Deci:

- backlog-ul bun trebuie sa vorbeasca despre enrichment si prefill cu confidence
- nu despre rebuild complet al acestor module

## Ce este confirmat bine si poate merge in handoff

- IA canonica:
  - `Acasa`
  - `Scaneaza`
  - `De rezolvat`
  - `Rapoarte`
  - `Setari`
- distinctia `org` vs `portfolio`
- rolurile:
  - `owner`
  - `partner_manager`
  - `compliance`
  - `reviewer`
  - `viewer`
- modurile:
  - `solo`
  - `partner`
  - `compliance`
  - `viewer`
- cron-urile reale din `vercel.json`
- planurile:
  - `free`
  - `pro`
  - `partner`
  - plus `partner_10/25/50`
- exporturi si share surfaces
- Google Vision, Supabase, Stripe, Resend, Sentry, ANAF/e-Factura ca integrari reale in cod
- build-ul aplicatiei

## Ce trebuie spus prudent lui Claude

- nu afirma un singur domeniu de productie ca verificat live
- nu trata comment-urile de cron ca sursa de adevar
- nu descrie Agent OS ca placeholder pur
- nu descrie Agent OS ca autonomie completa
- nu prezenta procentul `58% -> 80%` drept metrica exacta calculata runtime
- mentioneaza ca repo-ul curent construieste, dar test suite-ul nu e 100% verde

## Recomandarea finala

Dupa corectiile punctuale din spec:

- `COMPLISCAN-CLAUDE-WEB-FULL-SPEC.md` poate fi dat lui Claude Web
- `COMPLISCAN-58-LA-80-AUTOMATIZARE-CANON.md` poate fi dat ca backlog executabil
- acest audit trebuie tinut alaturi de ele daca vrem transparenta maxima despre ce este confirmat static, ce este confirmat build-time si ce ramane neverificat live
