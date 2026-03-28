# CompliAi — Home Ruthless Cleanup Plan

## Rolul documentului

Acest document există ca să curețe Home-ul fără milă.

Nu pornește de la ideea:
- „hai să mai păstrăm și asta că poate e util”
- „hai să lăsăm toate modulele că produsul e bogat”
- „hai să împăcăm toate use-case-urile într-o singură pagină”

Pornește de la o singură întrebare:

## Ce trebuie să existe 100% pe Home ca userul să înțeleagă imediat unde este, ce se aplică și ce face acum?

Tot ce nu răspunde clar la asta:
- se taie
- se mută
- se comprimă
- sau iese complet din Home

---

# 1. Ce ESTE Home

Home este:
- ecranul de orientare
- primul snapshot al firmei
- locul unde vezi ce se aplică
- locul unde vezi ce s-a găsit
- locul unde vezi care e următoarea acțiune reală

Home NU este:
- dashboard universal
- tool launcher complet
- scan center
- benchmark center
- feed complet
- export center
- observability layer
- rezumat executiv complet
- centru de framework-uri detaliate

---

# 2. Regula de fier

## Pe Home trebuie să existe doar ce răspunde imediat la 4 întrebări:

1. Ce se aplică firmei mele?
2. Ce am găsit deja?
3. Ce fac acum?
4. Sunt mai bine sau mai rău decât data trecută?

Dacă un bloc nu răspunde direct la una dintre întrebările astea, nu are voie pe Home-ul principal.

---

# 3. Ce rămâne 100% pe Home

## KEEP 100%

### A. Header de stare
Trebuie să existe sus:
- readiness global
- un micro-status
- o propoziție scurtă

Exemplu:
- `Readiness global: 64%`
- `Control stabil`
- `Asta ți se aplică, asta am găsit deja și asta faci acum.`

### B. Snapshot în 3 blocuri
Home-ul trebuie să aibă fix 3 blocuri primare:

#### 1. Ce se aplică
- max 4–5 intrări
- fără descrieri lungi
- doar ce contează

#### 2. Ce am găsit deja
- max 3–5 constatări
- clar și scurt
- fără listă lungă

#### 3. Ce faci acum
Acesta este blocul dominant și cel mai important de pe Home.
Trebuie să conțină:
- finding-ul principal
- motivul scurt
- un CTA clar:
  - `Deschide cazul`
  - `Rezolvă primul caz`
  - `Continuă remedierea`

### C. Metric strip
Un singur rând compact cu maxim 4 indicatori:
- conformitate globală
- acțiuni active
- drift detectat
- stare audit / dovezi

### D. Feed scurt
Doar ultimele 3 evenimente relevante:
- ce a verificat sistemul
- ce a salvat
- ce s-a redeschis

Și un singur link:
- `Vezi tot istoricul`

---

# 4. Ce moare 100% de pe Home

## CUT 100%

### 1. „Ce am construit pentru tine”
Se taie complet de pe Home principal.

### 2. Feed-ul lung „Compli lucrează pentru tine”
Se taie în forma actuală.
Rămâne doar un rezumat scurt.

### 3. „Semnale, benchmark și instrumente”
Nu are voie pe Home principal.

### 4. „Rezumat executiv”
Nu are voie pe Home principal.

### 5. Buton PDF / download direct
Nu are voie pe Home principal.

### 6. Scan website input inline
Nu are voie pe Home principal.
Există deja `Scanează` în nav.

### 7. NIS2 evaluator
Nu are voie pe Home principal.

### 8. „Agenții CompliAI monitorizează activ”
Nu are voie pe Home principal.

### 9. „Detalii conformitate pe cadru”
Nu are voie pe Home principal în forma actuală.

### 10. Cardurile mari de framework:
- GDPR
- NIS2
- AI Act
- e-Factura
- Scor Global

Nu au voie pe Home principal în forma actuală.

### 11. Explicatoare de tip CER / directive / legal context
Nu au voie pe Home principal.

---

# 5. Ce se mută, nu se șterge

## MOVE

### 1. Scan launcher
→ în `Scanează`

### 2. NIS2 evaluator
→ în `Scanează` sau într-un modul contextual NIS2

### 3. Agents
→ în `Setări` sau modul specialist secundar

### 4. Executive summary / PDF
→ în `Dosar` sau export center

### 5. Framework cards detaliate
→ într-un accordion secundar:
- `Detalii pe cadru`
sau într-o pagină separată dacă chiar trebuie

### 6. Feed complet / audit log
→ în audit log / monitoring

### 7. Benchmark / semnale / instrumente
→ într-o zonă secundară, colapsabilă
sau în pagină separată de insights

---

# 6. Ce trebuie să domine

## Blocul „Ce faci acum” trebuie să fie regele Home-ului

Aici produsul câștigă sau pierde.

Home trebuie să împingă userul spre:
- un singur next step clar
- un singur finding clar
- un singur CTA principal

Exemplu bun:
- `Politică de confidențialitate GDPR lipsește`
- `impact ridicat`
- `3 minute`
- `Deschide cazul`

Exemplu prost:
- scan site
- evaluează NIS2
- vezi executive summary
- descarcă PDF
- pornește agent
- uită-te la benchmark

toate pe același ecran.

---

# 7. Structura corectă pentru Home

## HOME

### 1. Header de stare
- readiness global
- micro-status
- propoziție scurtă

### 2. Snapshot
- `Ce se aplică`
- `Ce am găsit deja`
- `Ce faci acum`

### 3. Metric strip
- 4 KPI max

### 4. Feed scurt
- 3 evenimente maxime
- link spre istoric complet

### 5. Zonă secundară colapsabilă
Aici se mută tot ce nu este critic:
- detalii pe cadru
- benchmark
- semnale
- instrumente
- insights
- etc.

---

# 8. Ce tăiem complet, nu doar mutăm

## DELETE / REMOVE complet dacă nu schimbă comportamentul

### A. Texte de tip „uite câte face sistemul”
Dacă doar impresionează, dar nu schimbă decizia sau acțiunea, se șterg.

### B. Blocuri decorative de inteligență
Dacă doar „arată că produsul e smart”, dar nu ajută la orientare, se șterg.

### C. Repetiții între blocuri
Dacă aceeași idee apare în:
- hero
- feed
- KPI
- card explicativ
una singură rămâne.

### D. Tool launchers care concurează cu next action
Se mută sau se șterg de pe Home.

---

# 9. KPI policy pentru Home

## KEEP
Maxim 4 KPI.
Nu mai mult.

### Recomandare:
- `Conformitate globală`
- `Acțiuni active`
- `Drift detectat`
- `Stare audit`

## CUT
- prea mulți indicatori
- indicatori fără următor pas clar
- indicatori care dublează alte blocuri

## RULE
KPI-urile trebuie să confirme starea, nu să încarce pagina.

---

# 10. Feed policy pentru Home

## KEEP
Doar evenimentele care chiar contează:
- ce a verificat sistemul
- ce a salvat
- ce a redeschis
- ce a schimbat starea

## CUT
- listă lungă
- feed complet de audit
- evenimente tehnice prea multe
- istoric care domină Home-ul

## RULE
Home arată doar ultimele 3 evenimente relevante.
Restul merge în istoric / audit log.

---

# 11. Framework details policy

## Ce există acum
Carduri mari pentru:
- GDPR
- NIS2
- AI Act
- e-Factura
- Scor Global

## Decizie
Pe Home principal, acestea nu mai există ca mini-dashboard-uri grele.

## Ce poate rămâne
Un rezumat foarte scurt, eventual într-un accordion:
- `GDPR — ok`
- `NIS2 — 1 acțiune`
- `AI Act — 4 acțiuni`
- `e-Factura — blocată`
- `Scor global — 64%`

Atât.

Dacă userul vrea mai mult, apasă și vede detaliile.

---

# 12. CTA policy pentru Home

## Home trebuie să aibă:

### CTA principal
- `Deschide cazul`
sau
- `Rezolvă primul caz`

### CTA secundar
Cel mult unul:
- `Vezi tot istoricul`
sau
- `Vezi detalii`

## NU are voie să aibă pe ecranul principal:
- scan website
- evaluate NIS2
- pornește agent
- descarcă PDF
- executive summary
- export
- benchmark actions
toate în același timp

---

# 13. Ce trebuie simplificat vizual

## Probleme actuale
- prea multe blocuri mari
- prea multe secțiuni cu aceeași greutate
- prea multe warning-uri și chips
- prea multe panouri late
- prea mult text explicativ

## Decizii vizuale

### A. Fewer primary surfaces
- 1 header
- 1 snapshot row
- 1 metric strip
- 1 feed block

### B. Strong hierarchy
- „Ce faci acum” domină
- „Ce se aplică” și „Ce am găsit” susțin
- restul tace

### C. Fewer cards
- mai puține carduri grele
- mai puține borduri tari
- mai puține callout-uri

### D. Less copy
- mai puțin text
- mai puține badge-uri
- mai puține sub-explicații

---

# 14. Ce păstrăm 100% și ce tăiem 100%

## Păstrăm 100%
- readiness global
- snapshot-ul
- ce se aplică
- ce am găsit
- ce faci acum
- metric strip scurt
- feed scurt

## Tăiem 100% de pe Home principal
- benchmark
- semnale și instrumente
- executive summary complet
- PDF download
- scan website input
- NIS2 evaluator
- agent center
- framework mini-dashboards grele
- legal explainers
- feed lung
- orice suprafață care concurează cu next action

---

# 15. Testul final

Home-ul este bun doar dacă un user poate spune în 5 secunde:

1. Ce se aplică firmei mele?
2. Ce am găsit deja?
3. Care este următorul caz?
4. Sunt mai bine sau mai rău decât înainte?

Dacă trebuie să înțeleagă și:
- tools
- agents
- benchmark
- exporturi
- observability
- framework health
ca să se orienteze, Home-ul e încă greșit.

---

# 16. Rezumat brutal

Ce avem acum:
- multă inteligență
- prea multă suprafață
- prea multe lucruri odată
- prea puțină disciplină pe ierarhie

Ce trebuie:
- Home mic
- Home clar
- Home orientat pe snapshot și next action
- Home fără zgomot de instrumente și module

Home nu trebuie să fie „tot produsul”.
Home trebuie să fie:
- orientare
- stare
- primul pas

Asta este forma corectă.
