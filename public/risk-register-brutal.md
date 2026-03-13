# CompliScan - Risk Register Brutal

Data: 2026-03-13

## Scop

Acest document nu este marketing.

Este o lectură dură, de tip:

- Lead Engineer
- Product Owner sceptic
- Founder care vrea să evite moartea proiectului

Scopul lui este să documenteze scenariile cele mai sumbre, dar plauzibile, pentru CompliScan, pe baza:

- stării reale a codului
- maturității reale din `public/raport-maturitate-compliscan.md`
- surselor oficiale pentru AI Act și e-Factura, acolo unde riscul depinde de reglementare

Nu toate scenariile sunt predicții. Sunt riscuri care trebuie tratate ca fiind reale până când sunt reduse explicit.

## Surse externe confirmate

- AI Act - timeline și Digital Omnibus:
  - [Navigating the AI Act - European Commission FAQ](https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act)
  - [AI Act - European Commission policy page](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- e-Factura 2026:
  - [OUG 89/2025 - Portal Legislativ](https://legislatie.just.ro/Public/DetaliiDocument/305817)
  - [OUG 120/2021 forma actualizata - Portal Legislativ](https://legislatie.just.ro/Public/FormaPrintabila/00000G2HNMKSMLXR5CK1AULK21E1P6OY)
  - [ANAF - comunicat modificari RO e-Factura 2026](https://static.anaf.ro/static/3/Ploiesti/20260115111226_comunicat%20ajfp%20arges%20-%20modificari%20ro%20e-factura%20site.pdf)

## Observatie de baza

CompliScan are un risc mai mare de a muri din:

- securitate
- verdicturi insuficient de defensibile
- cost / operare
- mismatch cu viteza reglementării

și nu din lipsa de features.

## Legendă

- Probabilitate:
  - `foarte mare`
  - `mare`
  - `medie`
  - `mică`
- Impact:
  - `critic`
  - `mare`
  - `mediu`
  - `redus`

## 1. Reglementarea ne lasă în aer

- Probabilitate: `mare`
- Impact: `critic`

### Ce este confirmat

- regulile generale AI Act rămân pe calendarul oficial
- Comisia Europeană spune însă explicit că a propus, prin Digital Omnibus, ajustarea datei de aplicare pentru high-risk în funcție de:
  - standarde armonizate
  - specificații comune
  - ghiduri ale Comisiei
- Comisia spune clar că întârzierea acestor măsuri de suport pune în risc intrarea lină în aplicare la `2 august 2026`

### Ce înseamnă pentru noi

Nu este sigur că scenariul `high-risk urgent acum` mai are aceeași forță comercială în 2026.

Consecințe:

- dacă vindem prea agresiv `pregătire AI Act urgentă`, iar piața citește amânarea ca „nu e nevoie acum”, riscăm:
  - churn
  - downgrade
  - amânare de decizie
- roadmap-ul prea încărcat pe `Annex IV / high-risk urgency` poate pierde relevanță comercială mai repede decât poate fi livrat

### Unde ne lovește în produs

- [public/roadmap-compliscan.md](/Users/vaduvageorge/Desktop/CompliAI/public/roadmap-compliscan.md)
- [public/backlog-din-feedback.md](/Users/vaduvageorge/Desktop/CompliAI/public/backlog-din-feedback.md)

### Realitatea brută

Dacă piața nu mai simte urgența AI Act în 2026, produsul nu moare legal, ci comercial.

Adică:

- multă muncă livrată
- puțină dispoziție de plată
- risc mare de `PMF fals`

## 2. e-Factura se mișcă și ne obligă la rescrieri repetitive

- Probabilitate: `mare`
- Impact: `mare`

### Ce este confirmat

În legislația actualizată:

- termenul este de `5 zile lucrătoare`
- există modificări pe B2C și pe categorii de contribuabili
- cadrul s-a schimbat deja oficial în 2025-2026

### Ce înseamnă pentru noi

Orice modul `e-Factura` prea ambițios, prea devreme, riscă să devină:

- scump de întreținut
- rescris des
- greu de monetizat

### Realitatea brută

Dacă ne bazăm pe `e-Factura` ca motor principal de vânzare înainte să avem:

- parser stabil
- suport operațional
- ownership clar pe actualizări legislative

atunci nu construim diferențiere. Construim o sursă de mentenanță.

## 3. Breach de date prin dovezi publice

- Probabilitate: `mare`
- Impact: `critic`

### Ce este real acum în cod

Upload-ul de dovezi scrie încă în:

- [app/api/tasks/[id]/evidence/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/tasks/%5Bid%5D/evidence/route.ts)

cu rădăcină:

- `public/evidence-uploads`

și expune `publicPath`.

### Ce înseamnă

Chiar dacă avem validări mai bune de fișiere, modelul de acces este încă slab:

- dovezile sunt artefacte sensibile
- nu ar trebui să fie public-served în mod implicit
- nu avem încă:
  - signed URLs
  - bucket privat
  - jurnal de acces serios la fișier

### Realitatea brută

O singură scurgere de:

- facturi
- contracte
- capturi de ecran
- dovezi tehnice

poate distruge complet încrederea în produs.

Pentru un tool care vinde `dovadă`, asta este risc existențial.

## 4. Verdict greșit -> capcană de răspundere

- Probabilitate: `mare`
- Impact: `critic`

### Ce este real acum în cod

Motorul se bazează încă central pe:

- [lib/compliance/engine.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/engine.ts)
- `simulateFindings(...)`

și deși Sprint 3 a ridicat mult explicabilitatea:

- `signal detection`
- `verdictConfidence`
- `validationBasis`

verdictul final este încă puternic euristic.

### Ce înseamnă

Pericolul nu este doar `false negative`.

Pericolul este și:

- `false confidence`
- UI care pare mai sigur decât merităm
- client care tratează rezultatul ca verdict final

### Realitatea brută

Dacă un client folosește rezultatul nostru ca bază pentru:

- audit
- decizie de go-live
- decizie legală

și noi ratăm un risc major, produsul devine sursă de răspundere, nu protecție.

### Regula de supraviețuire

Până la maturizarea Sprint 3 + Sprint 6:

- CompliScan trebuie prezentat ca:
  - suport decizional
  - structurare de dovezi
  - asistență de remediere
- nu ca verdict legal definitiv

## 5. Auth local + sesiune custom = țintă ușoară

- Probabilitate: `mare`
- Impact: `critic`

### Ce este real acum în cod

Identitatea încă stă local în:

- [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- `.data/users.json`
- `.data/orgs.json`
- `.data/memberships.json`

Avem deja:

- roluri
- membership
- multi-org minim

dar identitatea nu este încă într-un IdP matur.

### Ce lipsește

- Supabase Auth sau alt IdP real
- reset de parolă matur
- management de sesiune matur
- audit de autentificare
- revocare / recovery / lockout serioase

### Realitatea brută

În produs de compliance, auth-ul local este bun pentru dev și demo, nu pentru clienți reali.

## 6. Multi-tenancy incompletă = risc de cross-org leak

- Probabilitate: `medie`
- Impact: `critic`

### Ce este real acum

Am făcut progres mare:

- membership real
- org switch
- actor identity

dar state-ul și storage-ul încă nu sunt izolate end-to-end pe un model cloud matur cu RLS.

### Ce lipsește

- RLS real pe datele persistate
- source of truth cloud unificat
- politici explicite de acces pe:
  - evidence
  - state
  - tasks
  - drifts
  - exports

### Realitatea brută

Un singur bug de izolare între organizații valorează mai mult decât 20 de features noi.

## 7. Supabase free tier / fallback mix = fragilitate operațională

- Probabilitate: `mare`
- Impact: `mare`

### Ce este real acum

- proiectul Supabase a fost deja pus pe pauză pentru inactivitate
- am rezolvat temporar prin keepalive pe Storage:
  - [app/api/integrations/supabase/keepalive/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/integrations/supabase/keepalive/route.ts)
- dar `app_state` cloud nu este încă fundație matură
- schema `compliscan` nu este expusă pentru PostgREST, deci există în continuare cădere pe fallback local

### Realitatea brută

Pentru un produs care promite `continuous governance`, infrastructura nu are voie să adoarmă.

Free tier + fallback confuz = demo acceptabil, pilot fragil.

## 8. Costurile operaționale ne pot mânca înainte de PMF

- Probabilitate: `medie`
- Impact: `mare`

### Zone cu risc de cost

- Supabase compute / storage / bandwidth
- Google Vision pe volume mari
- stocare de dovezi
- exporturi repetate și bundle-uri

### Realitatea brută

La început produsul nu moare din lipsă de trafic.

Moare din combinația:

- prea puțini clienți
- prea mult storage
- prea multă mentenanță
- prea puțină automatizare operațională

## 9. UX dens -> adopție mică -> churn mare

- Probabilitate: `mare`
- Impact: `mare`

### Ce este real acum

UX-ul a crescut mult, dar produsul încă cere înțelegere relativ bună:

- `Scanare`
- `Control`
- `Dovadă`
- `drift`
- `Audit Pack`
- `Annex IV lite`
- `compliscan.yaml`

### Realitatea brută

Dacă userul SMB nu înțelege în 5 minute:

- ce vede
- ce face acum
- ce iese la final

nu moare doar onboarding-ul. Moare retenția.

## 10. Single-founder / single-core-engineer risk

- Probabilitate: `mare`
- Impact: `mare`

### Ce este real acum

Produsul are deja:

- logică de auth
- logică de scan
- drift lifecycle
- audit pack
- OCR
- repo sync
- exports
- UX
- policy-ish logic

### Realitatea brută

Dacă o singură persoană ține:

- produs
- roadmap
- cod
- suport
- legislație

atunci principalul risc devine `burnout + context loss`.

## 11. Concurența nu trebuie să fie mai bună. Trebuie doar să fie mai sigură

- Probabilitate: `medie`
- Impact: `mare`

### Realitatea brută

Nu trebuie să apară cineva cu produs mai profund.

Este suficient să apară cineva cu:

- auth matur
- storage privat
- legal wrapper mai bun
- marketing care promite mai puțin și pare mai credibil

și ne poate scoate din joc.

## 12. Promisiunea comercială poate depăși realitatea produsului

- Probabilitate: `mare`
- Impact: `critic`

### Semnal de pericol

Când produsul spune sau sugerează:

- `audit-ready`
- `defensibil`
- `high confidence`

fără clarificare suficientă despre:

- limitările verdictului
- nevoia de review uman
- limitele responsabilității

atunci intrăm în zonă de risc comercial și juridic.

### Realitatea brută

Cel mai periculos produs nu este unul slab.

Este unul care pare mai sigur decât este.

## Întrebările grele la care proiectul trebuie să răspundă

### Reglementare / piață

- Dacă AI Act high-risk alunecă practic spre 2027, ce vindem convingător în 2026?
- Ce parte din `e-Factura` merită produsizată și ce parte trebuie tratată ca sursă de evidence, nu ca modul fiscal complet?

### Security / tenancy

- Când mutăm userii în `Supabase Auth`?
- Când mutăm dovezile în bucket privat cu signed URLs?
- Când avem RLS real pe datele multi-org?

### Verdict / liability

- Cine semnează pentru `high confidence`?
- Unde este linia clară dintre:
  - `finding probabil`
  - `control confirmat`
  - `audit defensibil`
- Cum împiedicăm UI-ul să sugereze certitudine falsă?

### Operare / cost

- La ce volum devine Supabase scump pentru modelul nostru?
- Care este planul B dacă storage-ul și exporturile cresc mai repede decât veniturile?

### Echipă / execuție

- Care este limita clară de roadmap pe următoarele 90 de zile?
- Ce nu construim, chiar dacă pare atractiv?
- Ce automatizăm ca să nu depindă totul de aceeași persoană?

## Ordinea brutal de sănătoasă

Dacă vrem să supraviețuiască produsul, ordinea bună nu este:

- mai multe features
- mai mult AI language
- mai mult marketing

Ordinea bună este:

1. Auth și tenancy reale
2. Storage privat pentru dovezi
3. RLS și izolare între organizații
4. Motor de verdict mai defensibil
5. Evidence quality și audit defensibility
6. Abia apoi ambalaj comercial agresiv

## Ce trebuie tratat ca risc existențial

Primele 4 riscuri care pot omorî produsul:

1. dovezi publice / leak
2. verdict greșit tratat ca verdict final
3. auth și tenancy insuficient de mature
4. mismatch între urgența vândută și urgența reală a pieței

## Concluzie

CompliScan nu este în pericol pentru că îi lipsesc ideile.

Este în pericol dacă:

- promite prea repede
- securizează prea târziu
- confundă `explicabil` cu `defensibil`
- confundă `MVP avansat` cu `platformă matură`

Produsul poate deveni serios.

Dar numai dacă acceptăm realitatea asta:

**următoarea victorie nu este încă un feature. Următoarea victorie este să reducem riscurile existențiale înainte să ne lovească ele pe noi.**
