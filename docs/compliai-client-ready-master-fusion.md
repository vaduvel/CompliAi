# CompliAI — Master Blueprint x Client-Ready x Runtime Fusion

Data: `2026-03-27`
Status: `runtime fusion / client-ready command file`
Runtime baseline: `c8c5536`

---

## 0. Rolul documentului

Acest document este fuziunea operațională dintre:
- [compliai-master-blueprint.md](/Users/vaduvageorge/Desktop/CompliAI/docs/compliai-master-blueprint.md)
- [compliai_client_ready_cleanup_sprint.md](/Users/vaduvageorge/Desktop/CompliAI/docs/Client%20Ready%20/compliai_client_ready_cleanup_sprint.md)
- starea reală a aplicației la commitul `c8c5536`

Scopul lui nu este doar să spună `în ce direcție mergem`.

Scopul lui este să spună, fără ambiguitate:
- ce promite blueprint-ul
- ce există acum în aplicație
- pe unde merge fiecare tip de user, click cu click
- ce user story este acoperită
- ce este doar parțial acoperit
- ce lipsește pentru un `client-ready 1000%`

Acesta este documentul de control pentru:
- IA
- UX
- flow-uri principale
- flow-uri specialist
- handoff-uri
- output / dossier / monitoring

---

## 1. Regulă de interpretare

### Statusuri folosite în acest document

- `IMPLEMENTAT`
  - există în runtime și respectă intenția documentului sursă
- `IMPLEMENTAT CU VARIANȚĂ`
  - există în runtime, dar nu este 1:1 cu blueprint-ul
- `PARȚIAL`
  - există o parte din flow, dar nu toată experiența promisă
- `LIPSĂ`
  - intenția din blueprint nu este încă servită de aplicație

### Regula de adevăr

Ordinea de interpretare este:
1. blueprint-ul spune ce ar trebui să fie produsul
2. sprintul client-ready spune ce am decis să tăiem / disciplinăm
3. runtime-ul real spune ce avem cu adevărat acum

Acest document nu cosmetizează diferențele.

---

## 2. Verdict rapid

### 2.1 Verdict global

Aplicația nu este încă `1:1` cu blueprint-ul master.

Dar:
- coloana principală a produsului este puternic aliniată
- cleanup-ul client-ready a pus ordine reală în paginile majore
- cele mai mari deviații rămase sunt pe:
  - flow-urile Partner / portfolio
  - suprafețele specialist tratate complet uniform
  - output surfaces extinse (`One-Page Report`, `Counsel Brief`, `Trust Center`)
  - unele nuanțe 1:1 din landing și buyer segmentation

### 2.2 Verdict pe spine-ul principal

Spine-ul principal este acum:

`Landing -> Login -> Onboarding -> Dashboard Snapshot -> De rezolvat -> Cockpit -> Dosar -> Monitoring`

Verdict: `IMPLEMENTAT CU VARIANȚĂ`

Motiv:
- flow-ul există
- este coerent
- este mult mai curat după cleanup
- dar nu reproduce încă 1:1 toate scenele și toate promisiunile din blueprint

---

## 3. Formula canonică a produsului vs runtime

### Blueprint

`firmă + semnale reale -> obligații aplicabile -> findings -> remediere într-un singur loc -> dovadă la dosar -> monitorizare continuă`

### Runtime actual

`landing -> onboarding cu prefill -> snapshot în dashboard -> queue în resolve -> cockpit per finding -> validare / dovadă -> dosar / vault -> feed + notificări + under_monitoring`

### Verdict

`IMPLEMENTAT CU VARIANȚĂ`

Ce este bine:
- regula `un finding = un cockpit = un singur loc de execuție` este respectată în mare parte
- rezolvarea nu mai stă în Scan sau în Dosar
- validate evidence a fost introdus explicit
- Dosarul primește rezultatul, nu procesul

Ce nu este încă perfect:
- nu toate suprafețele specialist au aceeași disciplină impecabilă
- monitorizarea nu are încă aceeași maturitate de produs pe toate familiile
- Partner / portfolio nu este la același nivel de claritate ca flow-ul principal

---

## 4. Information Architecture — target vs runtime

### 4.1 IA target din blueprint

Primar:
- `Acasă`
- `Scanează`
- `De rezolvat`
- `Dosar`
- `Setări`

Secundar / contextual:
- `Generator`
- `NIS2`
- `DSAR`
- `Fiscal`
- `Sisteme AI`
- `Vendor Review`
- `DORA`
- `Whistleblowing`
- `Portfolio`

### 4.2 Runtime actual

Surfața principală este implementată în:
- [navigation.ts](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/navigation.ts)
- [dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)

Primar efectiv:
- `Acasă`
- `Scanează`
- `De rezolvat`
- `Dosar`
- `Setări`

Secundar efectiv:
- `Documente asistate`
- `Partner`
- `Canale conformitate`
- specialist routes prin handoff

### 4.3 Verdict IA

| Zonă | Verdict | Observație |
|---|---|---|
| Nav principală | `IMPLEMENTAT` | Se potrivește foarte bine cu blueprint-ul |
| Resolve ca centru de execuție | `IMPLEMENTAT` | Rol clar, separat de Scan și Dosar |
| Scan ca intake | `IMPLEMENTAT CU VARIANȚĂ` | Corect conceptual, dar încă are infrastructură specialist vizibilă |
| Dosar ca output / audit depth | `IMPLEMENTAT` | Overview-ul e curățat și depth-ul e demotat |
| Specialist modules contextual | `IMPLEMENTAT CU VARIANȚĂ` | Există, dar nu toate par la fel de finisate |
| Portfolio ca IA matură cross-client | `PARȚIAL` | Există, dar nu este încă validat aici ca experiență 1:1 |

---

## 5. Master route map — ce avem acum

### 5.1 Public

| Route | Rol în blueprint | Runtime | Verdict |
|---|---|---|---|
| `/` | landing clar + promisiune + 3/4 pași | există în [app/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/page.tsx) | `IMPLEMENTAT CU VARIANȚĂ` |
| `/login` | login/register | există | `IMPLEMENTAT` |
| `/pricing` | pricing clar, neinflamat | există și a fost simplificat | `IMPLEMENTAT` |
| `/demo/imm` | demo live | există în arhitectură | `IMPLEMENTAT CU VARIANȚĂ` |

### 5.2 Auth / app core

| Route | Rol în blueprint | Runtime | Verdict |
|---|---|---|---|
| `/onboarding` | rol -> profil -> legi -> snapshot | există prin [onboarding-form.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/onboarding-form.tsx) | `IMPLEMENTAT CU VARIANȚĂ` |
| `/onboarding/finish` | nu trebuie să dubleze snapshot-ul | redirect direct la dashboard | `IMPLEMENTAT` |
| `/dashboard` | Home / snapshot / next action | există în [app/dashboard/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx) | `IMPLEMENTAT` |
| `/dashboard/scan` | intake only | există în [scan-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/scan-page.tsx) | `IMPLEMENTAT CU VARIANȚĂ` |
| `/dashboard/resolve` | finding queue | există în [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx) | `IMPLEMENTAT` |
| `/dashboard/resolve/[findingId]` | cockpit per finding | există în [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/%5BfindingId%5D/page.tsx) | `IMPLEMENTAT` |
| `/dashboard/dosar` | dossier / vault | există | `IMPLEMENTAT` |
| `/dashboard/setari` / `/dashboard/settings` | settings | există | `IMPLEMENTAT` |

### 5.3 Specialist

| Route family | Rol în blueprint | Verdict |
|---|---|---|
| `/dashboard/nis2*` | module specialist + handoff din cockpit | `IMPLEMENTAT CU VARIANȚĂ` |
| `/dashboard/dsar*` | DSAR workflows | `IMPLEMENTAT CU VARIANȚĂ` |
| `/dashboard/fiscal*` | SPV + e-Factura | `IMPLEMENTAT CU VARIANȚĂ` |
| `/dashboard/sisteme*` | AI systems | `PARȚIAL` |
| `/dashboard/vendor-review*` | vendor review | `IMPLEMENTAT CU VARIANȚĂ` |
| `/dashboard/dora*` | DORA | `PARȚIAL` |
| `/dashboard/whistleblowing*` | whistleblowing | `PARȚIAL` |
| `/portfolio*` | partner mode | `PARȚIAL` |

---

## 6. Personas — promisiune vs runtime

## 6.1 Persona A — Mihai / Proprietar IMM / Solo

### Ce promite blueprint-ul

Mihai trebuie să poată:
1. înțelege rapid dacă produsul e pentru el
2. face onboarding scurt
3. vedea snapshot clar
4. intra în primul finding
5. genera sau atașa dovada
6. închide cazul
7. vedea că a intrat la dosar
8. rămâne sub watch fără stres

### Runtime actual

Mihai are:
- landing simplificat și clar
- onboarding cu alegere de rol și wizard
- Home clarificat
- Resolve simplificat
- cockpit per finding
- success moment și dosar
- under_monitoring + feed + notificări

### Verdict

`IMPLEMENTAT CU VARIANȚĂ`

Este persoana cel mai bine servită acum de produs.

---

## 6.2 Persona B — Diana / Consultant / Partner

### Ce promite blueprint-ul

Diana trebuie să poată:
1. intra în mod partner
2. vedea portofoliu cross-client
3. tria pe urgență
4. intra în workspace de client
5. rezolva cazuri fără amestec între clienți
6. exporta livrabile curate pentru client

### Runtime actual

Există:
- mod partner
- workspace switcher
- portfolio routes
- context switch în shell

Dar în această comparație nu avem dovadă suficientă că tot flow-ul partner este la aceeași maturitate ca spine-ul principal.

### Verdict

`PARȚIAL`

Motiv:
- infrastructura există
- produsul nu pare rupt
- dar nu aș certifica încă experiența Diana ca `1:1 cu blueprint-ul` fără audit dedicat pe portfolio surfaces

---

## 6.3 Persona C — Radu / Compliance intern

### Ce promite blueprint-ul

Radu trebuie să poată:
1. lucra cu audit trail puternic
2. delega / controla
3. exporta pachete
4. urmări expirări / review dates
5. administra procese mai grele

### Runtime actual

Există:
- Dosar / Vault mult mai clar
- audit depth sub disclosures
- specialist modules
- drift / monitoring / evidence / traceability

### Verdict

`IMPLEMENTAT CU VARIANȚĂ`

Motiv:
- partea de dovadă / audit / traceability există și e serioasă
- dar blueprint-ul lui Radu e mai mare decât ce pot declara acum 1:1 doar din runtime-ul citit

---

## 7. Journey maps reale — click cu click

## 7.1 Mihai / Solo — flow real actual

### A. Intrare publică

1. user ajunge la `/`
2. vede hero, promise, pași, CTA `Începe gratuit`
3. click `Începe gratuit`
4. ajunge la `/login`

Verdict: `IMPLEMENTAT CU VARIANȚĂ`

Diferență față de blueprint:
- blueprint-ul cere foarte explicit 4 pași și problem section
- runtime-ul are variantă mai comprimată, cu 3 pași

### B. Înregistrare

1. click register / create account
2. cont creat
3. redirect la `/onboarding`

Verdict: `IMPLEMENTAT`

### C. Onboarding

1. alege `Proprietar / Manager`
2. click `Continuă cu profilul firmei`
3. intră în wizard
4. completează CUI
5. Compli verifică ANAF / profil / website
6. confirmă date
7. confirmă legile aplicabile
8. click final
9. redirect direct la `/dashboard/resolve`

Verdict: `IMPLEMENTAT CU VARIANȚĂ`

Diferență:
- blueprint-ul vorbește uneori de `primul snapshot` imediat după onboarding
- runtime-ul a ales mai coerent:
  - onboarding complet
  - dashboard snapshot
  - resolve separat

### D. Primul snapshot

1. user intră pe `/dashboard`
2. vede:
  - `Ce ți se aplică`
  - `Ce am găsit deja`
  - `Ce faci acum`
3. poate merge spre `De rezolvat`

Verdict: `IMPLEMENTAT`

### E. De rezolvat

1. user intră pe `/dashboard/resolve`
2. vede queue scanabilă
3. alege un finding
4. click pe rând
5. ajunge în cockpit

Verdict: `IMPLEMENTAT`

### F. Cockpit per finding

1. vede context scurt
2. vede `Acum faci asta`
3. confirmă finding-ul, dacă e deschis
4. dacă finding-ul cere document:
  - deschide drawerul contextual
  - completează
  - generează
  - validează
  - confirmă și salvează
5. dacă finding-ul cere dovadă operațională:
  - completează nota / dovada
  - confirmă și închide
6. finding-ul merge în dosar
7. apoi în monitorizare

Verdict: `IMPLEMENTAT`

### G. Dosar și monitoring

1. user vede success moment
2. intră în `/dashboard/dosar`
3. vede pachetul, gap-urile, exportul
4. primește feed / notificări pentru ce reverificăm

Verdict: `IMPLEMENTAT CU VARIANȚĂ`

Diferență:
- Blueprint-ul descrie și mai multă infrastructură de output decât avem certificată acum ca experiență completă

---

## 7.2 Diana / Partner — flow real actual

### Harta flow-ului

1. user alege rol `Consultant / Contabil / Auditor`
2. intră în mod partner
3. ar trebui să ajungă în `/portfolio`
4. adaugă client
5. deschide client workspace
6. intră în aceleași suprafețe principale:
  - `/dashboard`
  - `/dashboard/resolve`
  - `/dashboard/dosar`
7. revine la portfolio pentru triage cross-client

### Verdict

`PARȚIAL`

Ce avem:
- shell-ul susține partner mode
- există portfolio surfaces
- există context switcher în [dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)

Ce nu declar încă `1:1`:
- triage cross-client complet matur
- raportare client-ready perfectă per client
- audit complet al tuturor clickurilor din portfolio

---

## 7.3 Radu / Compliance intern — flow real actual

### Harta flow-ului

1. alege rol `Responsabil conformitate`
2. onboarding pe firmă internă
3. intră în dashboard / resolve
4. folosește specialist modules prin handoff din findings
5. validează, exportă, urmărește dosarul și auditul

### Verdict

`IMPLEMENTAT CU VARIANȚĂ`

Motiv:
- flow-ul principal și audit depth există
- dar documentul master descrie un univers mai complet pentru delegare, RBAC și board output decât pot certifica 1:1 doar din această citire

---

## 8. User Stories — coverage matrix

## 8.1 Core stories

| Story | Ce cere | Stare runtime | Verdict |
|---|---|---|---|
| `US-001` | user nou înțelege în 10 secunde produsul | landingul e clar și scurt | `IMPLEMENTAT CU VARIANȚĂ` |
| `US-002` | înregistrare rapidă | flow simplu login/register | `IMPLEMENTAT` |
| `US-003` | snapshot specific firmei | dashboard snapshot există | `IMPLEMENTAT` |
| `US-004` | finding rezolvat fără plimbare | cockpit contextual | `IMPLEMENTAT` |
| `US-005` | dovada merge la dosar automat | da, prin success/dossier linkage | `IMPLEMENTAT` |
| `US-006` | userul știe unde e în flow | progres + cards + state model | `IMPLEMENTAT CU VARIANȚĂ` |
| `US-007` | export pentru audit | există Dosar / Reports / Audit Pack | `IMPLEMENTAT CU VARIANȚĂ` |

## 8.2 Mihai

| Story | Verdict | Notă |
|---|---|---|
| `US-M01` | `IMPLEMENTAT` | Home + Resolve oferă claritate bună |
| `US-M02` | `IMPLEMENTAT` | generator contextual pentru documente relevante |
| `US-M03` | `IMPLEMENTAT CU VARIANȚĂ` | explicația există, dar nu toate familiile sunt la același nivel |
| `US-M04` | `IMPLEMENTAT` | readiness / score există |
| `US-M05` | `IMPLEMENTAT CU VARIANȚĂ` | notificările există, dar monitoring universal nu este încă perfect omogen |

## 8.3 Diana

| Story | Verdict | Notă |
|---|---|---|
| `US-D01` | `PARȚIAL` | portfolio există, dar nu este certificat aici 1:1 |
| `US-D02` | `PARȚIAL` | livrabile există parțial, nu complet verificate ca experiență partner |
| `US-D03` | `IMPLEMENTAT CU VARIANȚĂ` | workspace switching există |
| `US-D04` | `PARȚIAL` | cross-client criticity nu este validată aici cap-coadă |
| `US-D05` | `IMPLEMENTAT CU VARIANȚĂ` | dosar și dovadă există, dar partner delivery nu este complet auditată aici |

## 8.4 Radu

| Story | Verdict | Notă |
|---|---|---|
| `US-R01` | `IMPLEMENTAT CU VARIANȚĂ` | audit / timeline / traceability există |
| `US-R02` | `PARȚIAL` | delegarea nu este validată aici ca experiență completă |
| `US-R03` | `IMPLEMENTAT CU VARIANȚĂ` | export pack există |
| `US-R04` | `IMPLEMENTAT CU VARIANȚĂ` | review dates / monitoring există, dar nu certific 1:1 pe tot universul |
| `US-R05` | `IMPLEMENTAT CU VARIANȚĂ` | DSAR există, dar nu este auditat aici complet pe toate scenariile |

---

## 9. Surfețe principale — verdict 1:1

## 9.1 Landing

Fișier:
- [app/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/page.tsx)

Verdict: `IMPLEMENTAT CU VARIANȚĂ`

Bine:
- promisiune corectă
- CTA clar
- journey simplificat
- separare pentru audiențe

Nu este 1:1:
- blueprint-ul are structură ceva mai bogată
- runtime-ul este mai scurt și mai comercial curățat

## 9.2 Onboarding

Fișiere:
- [onboarding-form.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/onboarding-form.tsx)
- [applicability-wizard.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/applicability-wizard.tsx)
- [app/onboarding/finish/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/onboarding/finish/page.tsx)

Verdict: `IMPLEMENTAT`

Motiv:
- finish duplication a fost tăiată
- flow-ul e liniar
- role -> profile -> laws există clar

## 9.3 Home / Snapshot

Fișier:
- [app/dashboard/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx)

Verdict: `IMPLEMENTAT`

Motiv:
- răspunde la întrebările corecte
- `Ce faci acum` este dominant
- Home nu mai e tool mall

## 9.4 Scan

Fișier:
- [scan-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/scan-page.tsx)

Verdict: `IMPLEMENTAT CU VARIANȚĂ`

Motiv:
- conceptual, este intake only
- practic, încă are greutate specialist destul de mare

## 9.5 Resolve list

Fișier:
- [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)

Verdict: `IMPLEMENTAT`

Motiv:
- inbox clar
- row scanabil
- suportul este separat

## 9.6 Cockpit

Fișier:
- [app/dashboard/resolve/[findingId]/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/%5BfindingId%5D/page.tsx)

Verdict: `IMPLEMENTAT`

Motiv:
- execuția e în cockpit
- validate evidence există
- contextul greu e sub fold
- dosar / monitoring sunt aftercare

## 9.7 Dosar / Vault

Fișier:
- [reports-vault-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/reports-vault-page.tsx)

Verdict: `IMPLEMENTAT`

Motiv:
- overview mic
- blockers clari
- audit depth dedesubt

---

## 10. Finding-to-module mapping — verificare

| Mapping din blueprint | Runtime | Verdict |
|---|---|---|
| `GDPR-005 -> /dashboard/scan` | există ca handoff spre site re-scan | `IMPLEMENTAT` |
| `GDPR-013 -> /dashboard/dsar` | există | `IMPLEMENTAT CU VARIANȚĂ` |
| `GDPR-014 -> /dashboard/dsar?action=erasure` | există în logică | `IMPLEMENTAT CU VARIANȚĂ` |
| `GDPR-019 -> breach flow` | există | `IMPLEMENTAT CU VARIANȚĂ` |
| `NIS2-001 -> /dashboard/nis2/inregistrare-dnsc` | există | `IMPLEMENTAT` |
| `NIS2-015 -> incidents` | există | `IMPLEMENTAT` |
| `NIS2-GENERIC -> maturitate / governance / vendors` | există | `IMPLEMENTAT CU VARIANȚĂ` |
| `EF-001 -> portal ANAF extern` | runtime-ul folosește handoff intern fiscal/SPV | `IMPLEMENTAT CU VARIANȚĂ` |
| `EF-003-006 -> /dashboard/fiscal` | există | `IMPLEMENTAT` |
| `EU-AI-* -> /dashboard/sisteme / conformitate` | parțial prezent | `PARȚIAL` |

---

## 11. Ce oferim deja vs ce nu oferim încă

## 11.1 Oferim clar

- un spine principal coerent
- cockpit per finding
- validate evidence între draft și dovadă
- dosar / vault curățat
- monitorizare reală, nu doar badge
- handoff-uri serioase pentru GDPR / Fiscal / NIS2
- nav principal disciplinat

## 11.2 Oferim, dar încă nu perfect 1:1

- landing exact ca în blueprint
- partner / portfolio complet matur
- suprafețe specialist perfect omogene
- monitoring universal la aceeași finețe pe toate familiile
- output surfaces extinse pentru stakeholderi

## 11.3 Nu aș declara încă `complet oferit`

- experiența completă Diana, 1:1
- experiența completă Radu, 1:1, cu toate output-urile descrise în document
- toate suprafețele secundare la aceeași calitate de produs ca spine-ul principal

---

## 12. Gap list pentru `client-ready 1000%`

Pentru a spune că produsul este `1:1` cu blueprint-ul master, mai trebuie închise explicit:

1. `Partner / Portfolio full audit`
- triage cross-client
- livrabile per client
- workspace handoff impecabil

2. `Specialist parity`
- AI
- DORA
- whistleblowing
- orice suprafață secundară trebuie adusă la aceeași disciplină de cockpit / dossier / monitoring

3. `Output parity`
- `One-Page Report`
- `Counsel Brief`
- `Trust Center`
- aceste surfaces trebuie mapate și validate ca output real, nu doar menționate arhitectural

4. `Monitoring parity`
- feed, bell, reopening și review logic la același nivel pe toate familiile, nu doar pe cele deja maturizate

5. `Landing exactness`
- dacă vrem 1:1 textual cu blueprint-ul, landing-ul trebuie realiniat exact la structura și scenele promise acolo

---

## 13. Verdict final

### Întrebarea corectă

`Este aplicația 1:1 cu docs/compliai-master-blueprint.md?`

### Răspunsul corect

Nu.

### Răspunsul complet

Aplicația este:
- `foarte bine aliniată` pe coloana principală
- `client-ready` pe spine-ul esențial
- dar `nu încă 1:1` cu tot blueprint-ul master, pe toată întinderea lui

### Formula sinceră

- `spine principal`: aproape de target
- `toată aplicația`: încă are deviații și zone parțiale

Acesta este adevărul operațional la `c8c5536`.

---

## 14. Cum folosim documentul de acum înainte

Pentru orice nou val de lucru, verificăm:

1. ce capitol din blueprint atinge
2. ce verdict are acum în acest document:
   - `IMPLEMENTAT`
   - `IMPLEMENTAT CU VARIANȚĂ`
   - `PARȚIAL`
   - `LIPSĂ`
3. dacă patch-ul:
   - închide un gap real
   - sau doar mută lucruri fără să crească alinierea

Regula:
- nu mai lucrăm doar după senzație
- lucrăm după `blueprint promise -> runtime proof -> gap closure`

