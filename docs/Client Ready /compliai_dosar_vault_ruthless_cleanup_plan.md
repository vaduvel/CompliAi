# CompliAi — Dosar / Vault Ruthless Cleanup Plan

## Rolul acestui document

Acest document există ca să taie fără nostalgie.

Nu pornește de la ideea:
- „hai să păstrăm și asta pentru că deja există”
- „hai să vedem cum înghesuim tot în aceeași pagină”
- „hai să nu stricăm nimic și doar să mutăm puțin”

Pornește de la o singură întrebare:

## Ce trebuie să existe 100% în Dosar ca produsul să fie credibil, auditabil și client-ready?

Tot ce nu trece testul ăsta:
- se taie
- se mută
- se ascunde
- sau iese din overview

---

# 1. Ce ESTE Dosarul

Dosarul este:
- locul unde vezi ce ai salvat
- locul unde vezi ce lipsește
- locul unde vezi dacă pachetul stă în picioare
- locul de unde exporți ce este gata
- locul unde rămâne urma

Dosarul NU este:
- al doilea cockpit
- centrul principal de rezolvare
- laborator de audit profund pe prima față
- locul unde userul stă să citească toată matricea legală
- locul unde se întâmplă prima dată validarea grea

---

# 2. Regula de fier

## Pe overview-ul Dosarului trebuie să existe doar ce ajută userul să răspundă imediat la 4 întrebări:

1. Este pachetul gata sau nu?
2. Ce îl blochează acum?
3. Ce am deja salvat?
4. Ce fac acum?

Dacă o zonă nu răspunde direct la una dintre întrebările astea, nu are voie pe overview.

---

# 3. Ce rămâne 100% pe overview

## KEEP 100%

### A. Status pachet
Trebuie să existe sus, clar:
- Nepregătit
- Parțial
- Gata de export

Optional:
- ultimul review
- următorul review

### B. 3 KPI mari
Doar 3. Nu 5, nu 7.

Propunere:
- **Dovezi valide**
- **Gap-uri active**
- **Drift deschis**

Atât.

### C. Blocajele de acum
O listă foarte scurtă:
- 6 gap-uri blochează auditul
- 0 drift activ
- 0 validări lipsă
sau ce este real

### D. CTA principal
Un singur buton mare:
- **Rezolvă gap-urile**

### E. CTA secundar
Un singur buton secundar:
- **Deschide Audit Pack**

### F. Rezumat de ce există Dosarul
O singură propoziție, nu 3 carduri:
- „Aici vezi ce ai salvat, ce lipsește și ce poți exporta.”

Asta este tot ce trebuie pe prima față.

---

# 4. Ce moare 100% de pe overview

## CUT 100%

### 1. Cardurile „Ce verifici acum / Ce poți confirma aici / Când folosești exportul extern”
Nu. Sunt copy explicativ, nu conținut de produs.

Se taie complet de pe overview.

### 2. Secțiunile mari:
- AI Compliance Pack
- Snapshot Pack
- Intrări din pack folosite la audit
- Registru dovezi
- Snapshot și baseline
- Monitor drift
- Registru validări
- Cronologie audit
- Matrice de mapare legală
- Matrice de trasabilitate
- Confirmare pe articol / control
- Confirmare pe familie

Niciuna dintre ele nu are voie pe overview-ul principal.

### 3. CTA-uri multiple de tip:
- De rezolvat
- Rapoarte
- Deschide De rezolvat
- Deschide Rapoarte
- Vezi Auditor Vault
- Completează sursele
- Export tehnic
- Annex IV lite
- Mergi la De rezolvat
- Înapoi la rapoarte

Pe overview rămân doar 2:
- principal
- secundar

Restul se mută în secțiunile lor.

### 4. Explicațiile lungi despre:
- nu închizi task-uri direct din vault
- validezi uman înainte de orice pachet extern
- reuse pe familii
- articol / drift / baseline / control mapping
- logică de audit profund

Astea sunt bune, dar NU pe prima față.

---

# 5. Ce se mută, dar rămâne în Dosar

## MOVE, nu delete

Tot ce este valoros, dar prea greu pentru overview, trebuie mutat în 4 subsecțiuni locale.

## Structura corectă a Dosarului

### Tab 1 — Overview
Doar:
- status pachet
- 3 KPI
- blockers
- next action
- export CTA

### Tab 2 — Dovezi & Gap-uri
Aici intră:
- registru dovezi
- gap-uri de dovadă
- dovezi lipsă
- blockers
- unde te întorci să rezolvi
- ce finding cere ce dovadă

### Tab 3 — Pachete & Export
Aici intră:
- Audit Pack
- AI Compliance Pack
- Snapshot Pack
- Annex / exports
- stakeholder pack
- export tehnic

### Tab 4 — Trasabilitate & Audit
Aici intră:
- snapshot / baseline
- drift history
- registru validări
- cronologie audit
- matrice trasabilitate
- familii de control
- confirmare pe articol / control / familie

---

# 6. Ce tăiem complet, nu doar mutăm

Aici e partea dură.

## DELETE / REMOVE complet dacă nu are consum real și clar

### A. Textele explicative multiplicate
Dacă un lucru poate fi înțeles din:
- status
- badge
- CTA
- tab label
nu mai are nevoie și de paragraf.

Se șterg.

### B. Carduri de „prezentare” fără utilitate operațională
Dacă un card doar spune:
- ce e dosarul
- când folosești x
- cum ar trebui să gândești
fără să schimbe decizia sau acțiunea, se șterge.

### C. Repetițiile dintre secțiuni
Dacă aceeași idee apare în:
- hero
- KPI
- callout
- secțiune
una singură rămâne.

### D. Orice element care obligă userul să „studieze” overview-ul
Overview-ul nu este loc de studiu.
Este loc de stare și direcție.

---

# 7. Ce trebuie să existe 100% în „Dovezi & Gap-uri”

Asta este una dintre cele mai importante subsecțiuni.

## KEEP 100%
- listă clară de gap-uri
- pentru fiecare gap:
  - titlu finding / control
  - dovada cerută
  - de ce lipsește
  - ce blochează
  - link clar spre rezolvare
- registru dovezi
- status:
  - validă
  - lipsă
  - expirată
  - în validare
- posibil filtru minim:
  - Toate
  - Blocate
  - Nevalidate

## CUT
- explicații lungi despre articole
- matrice legală completă în acest tab
- copy de consultanță lungă

## RULE
Aici userul trebuie să poată răspunde imediat:
- Ce dovezi am?
- Ce îmi lipsește?
- Unde mă duc să repar?

---

# 8. Ce trebuie să existe 100% în „Pachete & Export”

## KEEP 100%
- Audit Pack client
- AI Compliance Pack
- Snapshot Pack
- Annex / exporturi relevante
- status clar pentru fiecare:
  - gata
  - blocat
  - incomplet
- motivul dacă e blocat
- CTA de export / open

## CUT
- exporturi obscure dacă nu sunt folosite
- butoane fără claritate
- prea multe variante tehnice pe aceeași linie

## RULE
Aici userul trebuie să răspundă imediat:
- Ce pot exporta acum?
- Ce este blocat?
- Ce mai trebuie înainte de export?

---

# 9. Ce trebuie să existe 100% în „Trasabilitate & Audit”

## KEEP 100%
- cronologie audit
- registru validări
- drift history
- snapshot / baseline
- matrice de trasabilitate
- familii de control / reuse logic
- confirmări de grup / familie / control, doar dacă sunt necesare auditului real

## CUT
- supra-explicarea aceleiași logici de 3 ori
- texte de onboarding în zona asta
- noise vizual

## RULE
Asta este zona grea.
Este normal să fie densă.
Dar nu are voie să infecteze overview-ul.

---

# 10. Ce nu trebuie să se întâmple niciodată în Dosar

## NU
1. nu rezolvi finding-ul principal din Dosar
2. nu generezi pentru prima dată documentul principal din Dosar
3. nu faci din Dosar primul centru de validare operațională
4. nu pui userul să aleagă între 8 CTA-uri pe aceeași pagină
5. nu folosești overview-ul ca pagină de documentație
6. nu expui toată infrastructura de audit pe prima față

---

# 11. CTA policy pentru Dosar

## Overview
Doar:
- **Rezolvă gap-urile**
- **Deschide Audit Pack**

## Dovezi & Gap-uri
CTA-uri locale:
- **Deschide cazul**
- **Vezi dovada**
- **Validează**

## Pachete & Export
CTA-uri locale:
- **Exportă**
- **Deschide pack-ul**
- **Vezi ce blochează**

## Trasabilitate & Audit
CTA-uri locale:
- **Vezi detalii**
- **Deschide timeline**
- **Confirmă grupul**
- **Vezi snapshot-ul**

---

# 12. Ce trebuie simplificat vizual

## Probleme vizuale actuale
- prea multe carduri cu borduri tari
- prea multe secțiuni egale
- prea mult text în blocuri grele
- prea multe CTAs
- senzație de cutie în cutie în cutie

## Decizii

### A. Overview
- 1 hero strip
- 1 KPI strip
- 1 blockers strip
- 2 CTA-uri
- gata

### B. Restul
- tabs locale
- mai puține borduri
- mai multe liste curate
- mai puține explainers
- mai puține carduri de tip „teorie”

### C. Indicatori
- badge-urile doar unde schimbă acțiunea
- nu badge pe orice

---

# 13. Structură finală propusă

## DOSAR

### [Overview]
- Status pachet
- KPI: Dovezi valide / Gap-uri active / Drift deschis
- Blockers
- Rezolvă gap-urile
- Deschide Audit Pack

### [Dovezi & Gap-uri]
- Registru dovezi
- Gap-uri de dovadă
- Finding → dovadă cerută → link spre rezolvare

### [Pachete & Export]
- Audit Pack
- AI Pack
- Snapshot Pack
- Annex / stakeholder export

### [Trasabilitate & Audit]
- Cronologie
- Validări
- Snapshot / baseline
- Drift history
- Matrice
- Familii / grupe / confirmări

---

# 14. Ce păstrăm 100% și ce tăiem 100%

## Păstrăm 100%
- status pachet
- dovezi valide
- gap-uri active
- drift deschis
- registru dovezi
- blockers
- exporturile importante
- cronologie audit
- validări
- baseline / snapshot
- matrice trasabilitate

## Tăiem 100% de pe overview
- carduri explicative
- toate secțiunile lungi de audit profund
- confirmări pe control / familie
- matricea completă
- registrul validărilor
- drift history complet
- pachetele mari
- listele lungi de intrări
- CTA-urile multiple și haotice

---

# 15. Testul final

Dosarul este bun doar dacă pe Overview userul poate spune în 5 secunde:

1. E gata pachetul sau nu?
2. Ce îl blochează?
3. Ce am deja?
4. Ce fac acum?

Dacă trebuie să citească jumătate de pagină ca să înțeleagă asta, Dosarul e încă greșit.

---

# 16. Rezumat brutal

Ce avem acum:
- multă inteligență
- multă trasabilitate
- prea multă suprafață
- prea multe nivele afișate simultan

Ce trebuie:
- overview mic
- secțiuni locale clare
- doar 2 CTA-uri pe prima față
- auditul greu mutat în adâncime
- fără milă față de tot ce e „drăguț, dar inutil pe overview”

Dosarul nu trebuie să fie mare.
Trebuie să fie:
- clar
- auditabil
- exportabil
- și neconfuz.
