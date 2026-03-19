# CompliScan - Risk Register Operațional

Data: 2026-03-13

## Scop

Acest document ia riscurile brute din:

- [risk-register-brutal.md](/Users/vaduvageorge/Desktop/CompliAI/public/risk-register-brutal.md)

și le transformă în:

- risc clar
- owner clar
- sprint clar
- mitigare clară

Nu înlocuiește documentele de sprint. Le completează.

## Reguli

- Nu mutăm limbajul comercial deja corectat:
  - aplicația nu validează singură definitiv
  - omul validează
- Riscurile existențiale se tratează înaintea feature-urilor noi
- Orice risc `critic` fără owner și sprint este considerat deschis

## Prioritate curentă

Ordinea sănătoasă rămâne:

1. Sprint 4 - Auth, roles, org model
2. Sprint 5 - Persistence și storage maturity
3. Sprint 6 - Audit defensibility

## Registru

### R1. Dovezi publice / leak de artefacte

- Probabilitate: `mare`
- Impact: `critic`
- Owner: `Lead engineer / platform`
- Stare actuală:
  - upload-urile noi nu mai sunt scrise în `public/evidence-uploads`
  - dovezile noi merg prin storage privat local sau `supabase_private`, în funcție de backend
  - există deja route controlat pentru citire și redirect securizat pentru evidence cloud
  - fișierele vechi cu `publicPath` rămân risc rezidual până la migrarea completă
- Trigger de risc:
  - orice client pilot cu documente reale
  - orice link public ghicit sau distribuit accidental
- Mitigare:
  - bucket privat în Supabase Storage
  - signed URLs sau stream server-side
  - jurnal de acces pe dovezi
  - tăiere `publicPath` ca model implicit
- Sprint:
  - `Sprint 5`
- Definition of reduced risk:
  - niciun fișier de dovadă nou nu mai este servit direct din `public`
  - accesul la dovadă trece doar prin route controlat sau URL semnat cu TTL scurt

### R2. Auth local și sesiune custom prea fragile

- Probabilitate: `mare`
- Impact: `critic`
- Owner: `Lead engineer / auth`
- Stare actuală:
  - `users / orgs / memberships` sunt încă locale
  - sesiunea este semnată de noi
- Trigger de risc:
  - client real
  - reset / recovery / user lifecycle
- Mitigare:
  - Supabase Auth pentru identitate
  - `organizations` + `memberships` în DB
  - migrare controlată din `.data/*.json`
  - dual-path temporar doar pentru dev
- Sprint:
  - `Sprint 5`
- Definition of reduced risk:
  - userii reali nu mai stau în `.data/users.json`

### R3. Cross-org leak prin tenancy incompletă

- Probabilitate: `medie`
- Impact: `critic`
- Owner: `Lead engineer / data`
- Stare actuală:
  - membership și switch org există
  - fundația SQL pentru RLS există acum și acoperă tenancy + evidence
  - helper-ele de membership lookup sunt hardenizate pentru a evita recursia RLS
  - dar verificarea end-to-end în proiectul Supabase real încă nu este închisă
- Trigger de risc:
  - mai mult de o organizație reală în aceeași instanță
- Mitigare:
  - RLS pe tabelele operaționale
  - politici explicite pe:
    - state
    - tasks
    - drifts
    - evidence
    - exports
  - audit pe acces cross-org
- Sprint:
  - `Sprint 5`
- Definition of reduced risk:
  - un utilizator nu poate citi datele altei organizații nici prin bug de UI simplu

### R4. Verdict greșit tratat ca verdict final

- Probabilitate: `mare`
- Impact: `critic`
- Owner: `Product + compliance engine`
- Stare actuală:
  - Sprint 3 a ridicat explicabilitatea
  - verdictul final este încă centrat pe euristici și `simulateFindings(...)`
- Trigger de risc:
  - client care folosește output-ul ca decizie finală
  - audit extern pe documente reale
- Mitigare:
  - corp de fixtures reale
  - expected findings mai bogate
  - confidence mai defensibil
  - separare și mai clară între:
    - semnal
    - inferență
    - verdict
  - evidence quality în `Sprint 6`
- Sprint:
  - `Sprint 3` + `Sprint 6`
- Definition of reduced risk:
  - verdictul este mai greu de interpretat ca „consultant legal automat”

### R5. Audit Pack pare mai sigur decât este

- Probabilitate: `medie`
- Impact: `mare`
- Owner: `Product owner + audit UX`
- Stare actuală:
  - produsul spune deja clar că omul validează
  - dar trebuie să păstrăm această regulă în toate suprafețele noi
- Trigger de risc:
  - PDF/ZIP extern folosit fără review
- Mitigare:
  - păstrarea framing-ului actual
  - gap-uri explicite de dovadă
  - quality checks pe evidence
  - marcarea clară a secțiunilor:
    - sugerat
    - confirmat
    - lipsă
- Sprint:
  - `Sprint 6`
- Definition of reduced risk:
  - niciun export nu poate fi citit onest ca verdict legal final automat

### R6. Supabase fragil / free tier / schema cloud incompletă

- Probabilitate: `mare`
- Impact: `mare`
- Owner: `Platform / infra`
- Stare actuală:
  - keepalive există
  - `app_state` cloud nu este încă fundație matură
  - schema `compliscan` nu e încă baza unică de adevăr
- Trigger de risc:
  - inactivitate
  - scale mică, dar reală
- Mitigare:
  - Pro plan sau infrastructură mereu activă
  - source of truth cloud clar
  - reducerea fallback-urilor confuze
- Sprint:
  - `Sprint 5`
- Definition of reduced risk:
  - starea operațională nu mai depinde de fallback local pentru pilot serios

### R7. e-Factura devine gaură de mentenanță

- Probabilitate: `mare`
- Impact: `mare`
- Owner: `Product owner`
- Stare actuală:
  - e-Factura este diferențiator local bun
  - nu este încă justificat ca modul fiscal complet
- Trigger de risc:
  - schimbări ANAF dese
  - roadmap tras prea mult spre fiscal
- Mitigare:
  - poziționăm e-Factura ca:
    - sursă
    - evidence layer
    - wedge local
  - nu ca ERP fiscal
- Sprint:
  - după `Sprint 6`
- Definition of reduced risk:
  - e-Factura nu dictează întreg roadmap-ul

### R8. Mismatch între urgența vândută și urgența reală a pieței

- Probabilitate: `mare`
- Impact: `mare`
- Owner: `Founder / product`
- Stare actuală:
  - produsul are capabilități AI Act valoroase
  - piața poate să nu simtă aceeași urgență în 2026 pentru high-risk
- Trigger de risc:
  - churn
  - amânare de buget
- Mitigare:
  - valoarea 2026 trebuie ancorată în:
    - evidență
    - drift
    - control operațional
    - documente + sisteme AI
  - nu doar în „AI Act urgent”
- Sprint:
  - `roadmap / GTM`, nu sprint tehnic imediat
- Definition of reduced risk:
  - produsul poate fi cumpărat și fără panică legislativă de termen scurt

### R9. Burnout / context loss

- Probabilitate: `mare`
- Impact: `mare`
- Owner: `Founder / delivery`
- Stare actuală:
  - proiectul a crescut mult
  - disciplina pe loguri și checkpoint-uri există, ceea ce ajută
- Trigger de risc:
  - prea multe fire paralele
  - prea multe schimbări fără documentare
- Mitigare:
  - sprinturi scurte
  - log obligatoriu
  - checkpoint-uri obligatorii
  - risk-driven prioritization
- Sprint:
  - continuu
- Definition of reduced risk:
  - fiecare sprint are închidere clară și nu redeschidem haotic 5 fronturi simultan

## Top 4 riscuri existențiale

Acestea trebuie tratate ca priorități peste feature-uri:

1. `R1` - dovezi publice / leak
2. `R2` - auth local și sesiune custom
3. `R3` - tenancy incompletă / lipsă RLS
4. `R4` - verdict greșit tratat ca verdict final

## Mapping direct pe sprinturi

### Sprint 4

- închidere auth/org model la nivel operațional
- nu mai deschidem features noi aici

### Sprint 5

Trebuie să închidă direct:

- `R1`
- `R2`
- `R3`
- `R6`

Adică:

- Supabase Auth
- organizations / memberships în DB
- Storage privat pentru dovezi
- signed URLs
- RLS
- cloud state clarificat

### Sprint 6

Trebuie să reducă direct:

- `R4`
- `R5`

Adică:

- evidence quality
- audit defensibility
- verdict mai greu de interpretat greșit

## Decizie

Până la închiderea Sprint 6:

- nu alergăm după breadth
- nu deschidem module noi mari
- nu diluăm focusul cu infrastructură „frumoasă” care nu reduce risc existențial

Ordinea bună este:

1. securitate și tenancy
2. verdict și audit defensibil
3. abia apoi diferențiere și ambalaj comercial
