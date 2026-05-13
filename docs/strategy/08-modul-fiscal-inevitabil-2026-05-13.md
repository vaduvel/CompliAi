# CompliAI Fiscal — Document de direcție pentru a deveni inevitabil în piață

Data: 2026-05-13  
Status: strategic draft  
Scop: să transforme modulul fiscal din „foarte capabil” în „foarte greu de ignorat, foarte greu de înlocuit și foarte ușor de cumpărat”

---

## 0. Concluzie executivă

Modulul fiscal CompliAI nu mai are problema clasică de produs slab sau prea puțin funcțional. Din contră, are deja suficientă adâncime ca să rezolve probleme reale pentru cabinete contabile și IMM-uri din România. Problema strategică nu mai este „ce alte funcții mai adăugăm”, ci „ce 3-5 capabilități fac produsul inevitabil”.

Un produs devine inevitabil când îndeplinește simultan 5 condiții:

1. rezolvă o durere recurentă și costisitoare;
2. prinde probleme pe care softurile existente nu le văd;
3. reduce risc real, nu doar afișează dashboard-uri;
4. intră în fluxul zilnic al contabilului și devine greu de scos;
5. produce dovezi, istoric și logică defensibilă în fața clientului, CECCAR și ANAF.

CompliAI este deja aproape de acest prag. Pentru a-l trece, produsul trebuie împins decisiv spre:

- **Cross-Document Correlation Engine**;
- **Master Exception Queue**;
- **Economic Impact Layer**;
- **Client Burden Intelligence**;
- **Missing Evidence Assistant**.

Astea sunt capabilitățile care mută produsul din „foarte bun modul fiscal” în „sistem operațional de control fiscal pe care cabinetul nu vrea să îl mai piardă”.

---

## 1. Ce înseamnă „inevitabil” pentru modulul fiscal

În contextul pieței românești, „inevitabil” nu înseamnă doar să ai multe funcții. Înseamnă ca un cabinet contabil sau o firmă cu volum să simtă că fără produs:

- pierde timp în mod repetat;
- scapă excepții care costă bani;
- nu vede la timp inconsistențele dintre documente și declarații;
- nu poate prioritiza ce să repare azi;
- nu poate demonstra ușor ce s-a întâmplat la control.

Deci modulul fiscal trebuie să fie perceput astfel:

> **SmartBill și Saga emit și calculează. CompliAI verifică dacă documentele, declarațiile și realitatea fiscală se pupă între ele, înainte să te lovească ANAF.**

Asta este propoziția centrală.

Nu:
- „avem 28 de funcții”;
- „avem 9 layere RegOps”;
- „avem 23 de cron jobs”.

Ci:

> **Prindem inconsistențele fiscale pe care ERP-ul nu le vede și îți spunem ce repari, în ce ordine și de ce.**

---

## 2. Ce are deja modulul fiscal și trebuie păstrat

### 2.1 Fundația existentă este puternică

Conform documentului curent, produsul are deja:

- validator e-Factura UBL CIUS-RO;
- auto-repair controlat și auditabil;
- SPV submit + monitorizare + request log;
- calendar fiscal auto-populat;
- preventive scan unificat;
- Smart Pattern Engine;
- ERP integrations cu SmartBill, Oblio, Saga;
- ERP ↔ SPV reconciliation;
- bank ↔ invoice reconciliation;
- e-TVA discrepancy workflow;
- SAF-T hygiene + parser + draft logic;
- filing discipline și cross-filing;
- sequence gap și duplicate detector;
- certificate SPV manager;
- CPV suggester;
- cross-border VAT advisor;
- Fiscal Resolve Cockpit;
- Fiscal Status Interpreter;
- retry queue;
- predictive audit risk;
- fiscal assistant;
- audit pack + hash chain;
- portofoliu cabinet și agregare cross-client.

Asta înseamnă că produsul nu mai este doar un validator. Este deja un **layer de control fiscal-operațional**.

### 2.2 Ce trebuie protejat

Aceste elemente nu trebuie diluate, ascunse sau tratate ca secundare:

- doctrina **copilot, nu autopilot**;
- disclaimer CECCAR + aprobare umană;
- audit trail complet;
- explainability;
- resolve flow pattern-based;
- portofoliu cross-client;
- calendar și remindere automate;
- monitoring continuu.

Ele sunt baza de încredere a produsului.

---

## 3. Problema reală: produsul este deja puternic, dar încă nu este maxim de inevitabil

În forma actuală, modulul fiscal este foarte capabil, dar riscă 3 lucruri:

### 3.1 Să pară prea lat

Există multe capabilități, dar dacă nu sunt ierarhizate corect, utilizatorul poate vedea „foarte multe carduri și feature-uri”, nu „un sistem care îmi reduce haosul”.

### 3.2 Să fie perceput ca foarte bun la validare, dar nu unic la consistență

Validatorii și integratorii există. Ceea ce este mult mai greu de copiat este controlul de coerență între documente, declarații, asociați, plăți, recipise și obligații.

### 3.3 Să măsoare mult, dar să cuantifice prea puțin impactul economic

Scorurile sunt bune. Dar cabinetele și firmele reacționează mai puternic la:

- bani salvați;
- penalități evitate;
- ore economisite;
- clienți care consumă disproporționat timp;
- diferențe fiscale cu impact estimat.

---

## 4. Formula pentru a face produsul inevitabil

Modulul fiscal trebuie reorganizat conceptual în jurul a 4 întrebări zilnice:

1. **Ce risc real am azi?**
2. **Ce trebuie rezolvat acum?**
3. **Ce se repetă și de ce?**
4. **Ce pot dovedi dacă sunt întrebat?**

Orice feature nou trebuie să întărească una dintre aceste întrebări. Dacă nu o face, nu este prioritar.

---

## 5. Cele 5 capabilități care fac produsul inevitabil

## 5.1 Cross-Document Correlation Engine

### De ce este cea mai importantă extensie

Aceasta este piesa cu cel mai mare potențial de diferențiere. Nu pentru că este „complexă”, ci pentru că rezolvă problema care doare cel mai tare:

> documentele individuale pot fi valide tehnic, dar împreună pot descrie o situație fiscală greșită.

Exemple:

- facturile de vânzare pe lună nu corespund cu baza din D300;
- AGA spune una, statul de plată spune alta, D205 spune altceva;
- procentul de distribuție nu bate cu structura asociaților;
- filing-ul așteptat diferă de filing-ul real;
- recipisa SPV și calendarul real sunt nealiniate;
- frecvența efectivă a depunerilor nu bate cu profilul firmei.

### De ce este market killer

Pentru că explică produsul într-o singură frază:

> **Noi nu validăm doar documente. Validăm dacă documentele tale sunt coerente între ele.**

### Reguli prioritare

Ordinea bună este:

1. **R1** — Σ facturi vânzări lună X ↔ baza TVA D300 lună X  
2. **R5** — total impozit D205 anual ↔ Σ D100 lunare componenta dividende  
3. **R2** — sumă dividende AGA ↔ stat plată ↔ bază reținere D205  
4. **R6** — termen calendar ↔ data recipisă SPV  
5. **R7** — frecvență reală ↔ frecvență așteptată  
6. **R3** — procent distribuție AGA ↔ procent deținere ONRC  
7. **R4** — beneficiari plătiți ↔ asociați declarați

### Ce schimbă în piață

Până aici produsul este „foarte bun la control fiscal operațional”. După acest layer, produsul devine:

> **motor de consistență fiscală și documentară**.

Asta este mult mai rar și mult mai greu de copiat.

---

## 5.2 Master Exception Queue

### Problema actuală

Produsul are multe module bune, dar utilizatorul nu cumpără module. Cumpără reducerea haosului.

### Soluția

Un ecran principal unic care agregă toate excepțiile și le ordonează după:

- severitate;
- deadline;
- impact estimat în lei;
- probabilitate de penalitate;
- repetitivitate;
- client afectat;
- document lipsă;
- complexitate de remediere.

### Ce trebuie să vadă utilizatorul

Pentru fiecare excepție:

- ce este;
- de ce contează;
- ce documente sunt afectate;
- care este riscul;
- care este următorul pas;
- cine trebuie să acționeze;
- dacă poate fi rezolvată acum sau depinde de client.

### Ecranul ideal

Un mesaj central de tip:

> **Rezolvă aceste 5 excepții azi și reduci 78% din riscul operațional fiscal al portofoliului.**

Asta mută produsul din instrument în sistem de operare.

---

## 5.3 Economic Impact Layer

### Problema actuală

Ai deja multe scoruri și semnale. Dar piața reacționează mai puternic la impact economic decât la rating abstract.

### Soluția

Fiecare finding important trebuie să aibă și un layer de impact estimat:

- TVA potențial afectat;
- impozit potențial afectat;
- penalitate probabilă;
- cost de întârziere;
- timp estimat de remediere;
- număr de retransmiteri evitate;
- ore economisite lunar.

### Exemple de output

- „Acest mismatch poate afecta TVA declarat cu aproximativ 18.400 lei.”
- „Acest client generează 31% din toate excepțiile cabinetului.”
- „Ai evitat 6 retransmiteri și 2 întârzieri de depunere în ultimele 30 zile.”
- „Top 3 erori recurente te costă aproximativ 9,5 ore/lună.”

### De ce contează

Când produsul începe să spună nu doar că ceva e greșit, ci cât costă, devine mult mai ușor de vândut și mai greu de scos.

---

## 5.4 Client Burden Intelligence

### De ce lipsește asta din multe produse

Cele mai multe tool-uri arată probleme per document sau per modul. Foarte puține arată:

- care client consumă disproporționat timp;
- care client produce cele mai multe excepții;
- care client are comportament fiscal repetitiv riscant;
- care client este nerentabil operațional pentru cabinet.

### Ce trebuie introdus

Un scor per client bazat pe:

- număr total de findings;
- findings critice;
- probleme repetitive;
- întârzieri;
- rectificări;
- mismatch-uri cross-document;
- lipsă de documente suport;
- frecvență de rezolvare grea.

### De ce este killer

Cabinetul va începe să folosească produsul nu doar pentru conformare, ci și pentru management de portofoliu.

Aici produsul încetează să fie doar fiscal și devine operațional.

### Exemple de insight

- „Clientul X produce 4,2× mai multe excepții decât media portofoliului.”
- „Clientul Y are risc fiscal mediu, dar cost operațional foarte mare.”
- „Top 5 clienți consumă 63% din efortul de remediere al cabinetului.”

Asta este aur comercial.

---

## 5.5 Missing Evidence Assistant

### Problema

Multe excepții nu se rezolvă fiindcă userul nu știe ce document trebuie cerut, de la cine și în ce format.

### Soluția

Pentru fiecare finding relevant, sistemul trebuie să spună explicit:

- ce document lipsește;
- cine trebuie contactat;
- dacă documentul este obligatoriu sau doar util;
- model de mesaj/email;
- deadline recomandat;
- dovada minimă acceptabilă.

### Exemple

- „Pentru acest mismatch dividende ↔ D205 lipsește AGA de repartizare.”
- „Pentru această situație cross-border lipsește CMR și dovada VIES verify.”
- „Pentru expirarea certificatului SPV trebuie cerută reînnoirea și împuternicirea actualizată.”

### De ce contează

Scurtează mult drumul dintre detectare și rezolvare. Asta înseamnă adopție reală, nu doar admirație.

---

## 6. Cum se reorganizează produsul în mintea pieței

Produsul trebuie prezentat în 4 verbe, nu în 28 de features:

### 6.1 Previi

- validator e-Factura;
- calendar fiscal;
- preventive scan;
- filing discipline;
- frequency mismatch;
- certificate expiry;
- cross-border checks.

### 6.2 Detectezi

- SPV monitoring;
- ERP ↔ SPV reconciliation;
- sequence gaps;
- duplicate detection;
- SAF-T hygiene;
- cross-document correlation;
- recurring patterns.

### 6.3 Repari

- resolve cockpit;
- auto-repair safe;
- templates;
- missing evidence assistant;
- assistant chat contextual;
- retry queue.

### 6.4 Dovedești

- audit pack;
- CECCAR disclaimer trail;
- hash chain;
- ANAF request log;
- events;
- recipise;
- resolution history.

Dacă produsul este gândit și prezentat așa, devine mult mai clar și mult mai cumpărabil.

---

## 7. Ce nu trebuie făcut acum

Ca să devină inevitabil, produsul trebuie și să evite distragerea.

### 7.1 Nu împinge în față feature-uri care nu sunt wedge

Acestea pot rămâne utile, dar nu trebuie să definească produsul:

- CPV suggester;
- PFA Form 082 tracker;
- lead magnets publice secundare;
- funcții exotice de nișă fără frecvență mare;
- tool-uri care nu schimbă comportamentul zilnic al cabinetului.

### 7.2 Nu vinde „număr mare de funcții”

Piața nu cumpără:

- 28 funcții;
- 9 layere;
- 23 cron jobs;
- 75+ coduri de eroare.

Piața cumpără:

- rectificative mai puține;
- risc redus;
- portofoliu mai controlabil;
- mai puține erori ratate;
- demonstrație ușoară în control.

### 7.3 Nu face produsul să pară ERP replacement

Poziționarea corectă rămâne:

> **Nu înlocuim SmartBill, Saga sau Oblio. Le supraveghem și prindem ce scapă.**

---

## 8. Roadmap de inevitabilitate

## Faza 1 — Make it unmissable

Obiectiv: produsul să devină extrem de clar și de valoros imediat.

### Livrabile

1. Master Exception Queue  
2. Economic Impact Layer  
3. Client Burden Intelligence  
4. Polish pe Audit Risk Panel și Preventive Scan  
5. Claritate de UX: Previi / Detectezi / Repari / Dovedești

### Rezultat

Cabinetul înțelege imediat:
- ce risc are;
- ce rezolvă azi;
- ce client îl costă;
- cât îl costă haosul.

## Faza 2 — Make it hard to copy

Obiectiv: diferențiere structurală.

### Livrabile

1. Cross-Document Correlation Engine R1 + R5 + R6 + R7  
2. Missing Evidence Assistant  
3. Root Cause Clustering  
4. Cross-document diff views  
5. Buton de „marchez legitim” pentru excepții false pozitive

### Rezultat

Produsul nu mai este doar un validator bun. Devine sistem de consistență fiscală.

## Faza 3 — Make it sticky

Obiectiv: produsul să devină greu de eliminat din flux.

### Livrabile

1. Pattern memory extinsă per client și tip de eroare  
2. Workflow-uri de cerere documente către client  
3. Raport lunar cabinet-ready cu impact și burden  
4. KPI savings dashboard  
5. Sugestii proactive de rutină fiscală

### Rezultat

Produsul devine parte din operarea lunară a cabinetului.

---

## 9. Top 5 features care mută produsul de la „foarte bun” la „aproape inevitabil”

1. **Cross-Document Correlation Engine**  
2. **Master Exception Queue**  
3. **Economic Impact Layer**  
4. **Client Burden Intelligence**  
5. **Missing Evidence Assistant**

Asta este ordinea.

Dacă faci doar una, fă prima.
Dacă faci trei, fă primele trei.
Dacă vrei să schimbi jocul, fă toate cinci.

---

## 10. Mesajul comercial central

### Varianta principală

**CompliAI este layer-ul de control fiscal care stă peste ERP-urile existente și prinde inconsistențele pe care ele nu le văd.**

### Varianta mai agresivă

**SmartBill și Saga validează documente. CompliAI verifică dacă documentele, declarațiile și realitatea fiscală se pupă între ele înainte să te lovească ANAF.**

### Varianta pentru cabinet

**Mai puține rectificative, mai puține excepții ratate, mai mult control pe portofoliu și dovadă clară la control.**

### Varianta internă de produs

**Previi. Detectezi. Repari. Dovedești.**

---

## 11. Decizia recomandată

Recomandarea strategică este:

### 11.1 Nu extinde produsul aleator

Nu mai adăuga funcții dispersate care nu împing inevitabilitatea.

### 11.2 Adoptă FC-3 în formă prioritară

Dar nu toate regulile deodată. Începe cu:

- R1;
- R5;
- R6;
- R7.

Acestea au cel mai bun raport între:

- frecvență;
- claritate comercială;
- risc redus;
- efort de implementare;
- valoare pentru cabinet.

### 11.3 Construiește deasupra lor o vedere unificată de excepții și impact

Acolo se câștigă percepția de inevitabil.

---

## 12. Verdict final

Modulul fiscal CompliAI este deja peste nivelul unui simplu validator sau al unui tab fiscal decorativ. Are suficientă substanță ca să devină o categorie serioasă în România.

Ca să devină însă **inevitabil**, trebuie să facă un pas clar:

> de la „avem multe capabilități fiscale”  
> la  
> **„suntem sistemul care îți arată ce nu bate între documente, declarații și realitatea fiscală, îți spune ce repari azi și îți lasă dovada pentru mâine.”**

Acolo este pragul.

Și acolo trebuie împins produsul.

