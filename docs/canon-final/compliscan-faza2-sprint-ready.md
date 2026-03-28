# CompliScan — Sprint Etapa 2: Implementation Ready
**Data:** 2026-03-26  
**Status:** Gata de dat la developer  
**Principiu:** Nu construim containere noi. Injectăm conținut real extern în mecanismele care există deja din Canon Wave A-F.

**Diferența față de Faza 1:** Faza 1 a făcut vizibil ce s-a acumulat. Faza 2 face vizibil că produsul lucrează continuu — și leagă acea muncă de evenimente reale din piața românească.

**Diferența față de Canon:** Canonul a construit tevatura (finding → cockpit → dosar → monitoring). Faza 2 aduce conținut real în acea tevatura: surse externe, evenimente legislative, drepturi persoane vizate, obligații fiscale 2025.

---

## Precondiții — verificate înainte de sprint

Faza 2 pornește numai după ce:
- [ ] Faza 1 e live și metricile sunt măsurate (acumulare card vizibil, finish screen activ, email reînnoire live)
- [ ] `app/api/dashboard/accumulation/route.ts` returnează date reale fără erori
- [ ] Activity feed din Canon Wave E e funcțional și afișează evenimente în limbaj uman
- [ ] `agent-orchestrator.ts` produce notificări în formatul uman (confirmat în log Wave E)

---

## TASK 4 — Activity Feed: injectare surse externe reale
**Fișiere:**
- `app/api/cron/monthly-digest/route.ts` (există deja)
- `components/compliscan/dashboard/activity-feed.tsx` (există din Wave E)
- `lib/compliscan/feed-sources.ts` (fișier nou — router de surse externe)

**Efort estimat:** 3-4 zile  
**Săptămâna:** 3-4

---

### Problema actuală
Activity feed-ul din Wave E există și funcționează. Afișează evenimente interne: verificări furnizori, monitoring SPV, cron-uri. Limbajul e uman (confirmat în log). Dar toate evenimentele sunt interne produsului — nimic nu vine din lumea reală a utilizatorului.

### Ce adăugăm
Patru tipuri de evenimente externe reale, în ordinea priorității:

---

**Tip 1 — Semnal ANAF sectorial**

ANAF publică periodic comunicate despre controale pe sectoare. Din martie 2026, ANAF a anunțat oficial că va publica în prealabil sectoarele vizate (confirmat Digi24, Conferința PwC 2026).

Logica:
1. Cron săptămânal citește comunicatele ANAF/DGAF
2. Extrage sectoarele menționate
3. Compară cu NACE-ul organizației din profil (`org.nace_code`)
4. Dacă match → inserează eveniment în feed

Copy în feed:
```
⚠️  ANAF a anunțat controale în sectorul tău (construcții / HoReCa / comerț online)
     Iată statusul tău de conformitate fiscală → [Vezi]
```

Fișiere de atins:
- `lib/compliscan/feed-sources.ts` — funcție `checkAnafSectorAlerts(orgNace)`
- `app/api/cron/weekly-signals/route.ts` — cron nou sau extindere cron existent

⚠️ **De confirmat înainte de implementare:** Există deja `org.nace_code` în baza de date? Dacă nu, se adaugă în onboarding ca câmp opțional sau se extrage din datele ANAF pe CUI.

---

**Tip 2 — Comunicat ANSPDCP luna curentă**

ANSPDCP publică lunar comunicatele de sancțiuni pe dataprotection.ro — structurat, predictibil, cu firme reale și cauze reale.

Logica:
1. Cron lunar (ziua 1 a lunii) citește ultimul comunicat de pe dataprotection.ro
2. Extrage: firma amendată, cauza, suma, data
3. Mapează cauza pe categoria de finding din CompliScan
4. Inserează în feed cu statusul organizației față de acea cauză

Copy în feed:
```
📋  ANSPDCP a dat luna asta o amendă de 2.000 EUR pentru nerespectarea
     dreptului de acces la date personale.
     Statusul tău: procedura de răspuns [activă ✓ / lipsă ⚠️] → [Verifică]
```

Fișiere de atins:
- `lib/compliscan/feed-sources.ts` — funcție `fetchAnspdcpMonthlyCase()`
- `app/api/cron/monthly-digest/route.ts` — extindere cron existent

---

**Tip 3 — Modificare legislativă detectată**

`legislation-monitor` există deja din Wave E (menționat în log). Deja detectează schimbări. Problema: nu știm dacă le leagă de profilul organizației.

Ce adăugăm: filtrul de relevanță pe profil.

Logica:
- Schimbare NIS2 → relevantă doar dacă `org.nis2_applicable = true`
- Schimbare GDPR → relevantă pentru toate organizațiile
- Schimbare eFactura → relevantă dacă `org.efactura_active = true`
- Schimbare SAF-T → relevantă pentru toate organizațiile active fiscal

Copy în feed:
```
📌  Schimbare legislativă: DNSC a publicat Ordinul 2/2025 privind NIS2
     Acest ordin îți afectează obligațiile de înregistrare → [Detalii]
```

Fișiere de atins:
- `lib/compliscan/legislation-monitor.ts` (există) — adaugă filtru de relevanță pe profil org
- `lib/compliscan/feed-sources.ts` — integrat în router

---

**Tip 4 — Semnale SPV / eFactura**

Există deja monitoring SPV din Canon. Feed-ul arată deja „Am verificat SPV-ul firmei tale". Adăugăm granularitate: dacă există semnale negative, ele ies în față.

Copy în feed (semnal normal):
```
✓  Am verificat SPV-ul — nicio factură respinsă în ultimele 30 de zile
```

Copy în feed (semnal negativ):
```
⚠️  Am detectat 2 facturi cu status neclar în SPV
     Verifică înainte de termenul de 5 zile → [Deschide SPV]
```

Fișiere de atins:
- Componenta de feed existentă — adaugă logică de diferențiere semnal pozitiv/negativ
- `app/api/dashboard/core/route.ts` — include semnal SPV în payload

---

### Reguli pentru tot feed-ul (neschimbate față de Canon Wave E)

Nu afișăm niciodată:
- `cron completed`
- `sync executed`
- `job finished`
- identificatori interni
- status tehnic fără impact pentru utilizator

Afișăm întotdeauna:
- ce s-a verificat
- ce s-a găsit
- ce trebuie făcut acum (dacă e cazul)
- un singur CTA per eveniment

### Metrică de succes
- **Primară:** Utilizatorii care văd cel puțin un eveniment extern real în feed au rată de revenire la 30 zile mai bună decât cei care văd doar evenimente interne — măsurat pe cohorte după lansare
- **Secundară:** Click-rate pe CTA-urile din feed ≥ 15% per eveniment extern
- **Cum măsori:** Event tracking `feed_external_event_clicked` cu tip eveniment ca parametru

---

## TASK 5 — Email lunar cu eveniment real
**Fișiere:**
- `app/api/cron/monthly-digest/route.ts` (există — extindere)
- Template email în sistemul de notificări (nou template)

**Efort estimat:** 3 zile  
**Săptămâna:** 4-5

---

### Problema actuală
Infrastructura de email lunar există. Nu există un template cu eveniment real extern — emailul curent e probabil rezumat de activitate internă sau newsletter generic.

### Ce construim
Un singur email lunar. Un singur eveniment real. Statusul firmei față de acel eveniment. Un singur CTA.

**Sursa principală:** Comunicatul ANSPDCP lunar (același ca în Task 4, Tip 2) — predictibil, public, lunar, cu firme și cauze reale.

**Sursa secundară:** Dacă luna curentă nu are comunicat ANSPDCP relevant, fallback pe: modificare legislativă detectată de `legislation-monitor` sau semnal ANAF sectorial.

---

### Structura exactă a emailului

**Subiect (variante pe rotație):**
```
ANSPDCP a dat o amendă de [X] EUR luna asta. Iată cum ești protejat.
ANAF a anunțat controale în [sector]. Statusul tău de conformitate.
A apărut o modificare în [NIS2 / GDPR / eFactura] care te afectează.
```

**Body:**
```
Luna aceasta, [eveniment real scurt — 2 rânduri maxim].

Cauza: [de ce s-a întâmplat — 1 rând].

Cum stai tu față de acest risc:

  [Verde ✓]  Procedura de răspuns la drepturi: activă
  [Verde ✓]  Dovezi salvate: [X] documente
  [Galben ⚠️] [finding specific dacă există]

[ Vezi statusul complet → ]
```

**Reguli de copy:**
- Maxim 150 de cuvinte în total
- Zero jargon tehnic
- Evenimentul real e menționat o singură dată, scurt
- Statusul firmei e personalizat din datele reale din dosar
- Dacă firma e verde pe toate — emailul e pozitiv, nu alarmistat
- Dacă firma are gap — CTA duce direct la finding-ul relevant, nu la dashboard generic

### Metrică de succes
- **Primară:** Open rate ≥ 35% (față de media industriei de ~20% pentru SaaS B2B)
- **Secundară:** Click-rate pe CTA ≥ 12%
- **Terțiară:** Rata de reactivare utilizatori inactivi (nu s-au logat în 30+ zile) care deschid emailul și revin în aplicație
- **Când măsori:** După primele 3 emailuri lunare consecutive

---

## TASK 6 — DSAR / Drepturi persoane vizate: modul operațional light
**Fișiere noi:**
- `components/compliscan/dsar/dsar-tracker.tsx`
- `app/dashboard/dsar/page.tsx`
- `app/api/dsar/route.ts`
- `lib/compliscan/dsar-logic.ts`

**Efort estimat:** 3-4 zile  
**Săptămâna:** 5-6

---

### De ce e în Faza 2 și nu mai târziu

Cercetarea de piață confirmă că nerespectarea drepturilor persoanelor vizate este **top cauza de amendă ANSPDCP** în România, documentată în fiecare raport anual din 2019 până în 2025. Cazuri concrete din 2024: Fan Courier (2.000 EUR), Vodafone (3.000 EUR), Dante International (10.000 EUR), Pansiprod (amendat de două ori pentru același tip de neconformare).

Termenul legal de răspuns: **30 de zile** de la primirea cererii (cu posibilitate de extindere la 90 zile cu notificare).

Aceasta nu e o oportunitate de feature — e un risc activ și sancționat pentru utilizatorii CompliScan.

---

### Ce construim — versiunea „light" pentru Faza 2

Nu construim un modul DSAR complet cu tot ce înseamnă asta. Construim exact ce salvează utilizatorul de amendă:

**1. Înregistrare cerere**
- Tip cerere: acces / ștergere / opoziție / rectificare / portabilitate
- Data primirii
- Canalul primirii (email / formular / fizic)
- Persoana de contact (opțional)

**2. Deadline tracker automat**
- La înregistrare, sistemul calculează automat: **Data limită = data primirii + 30 zile**
- Badge vizibil cu zile rămase
- Notificare la 10 zile înainte de deadline
- Notificare la 3 zile înainte de deadline

**3. Draft răspuns**
- Buton „Generează draft răspuns" — deschide generator cu template preselectat pe tipul cererii
- Template diferit pentru: confirmare primire / răspuns complet / refuz motivat / extindere termen

**4. Dovadă răspuns**
- Upload dovadă că s-a răspuns (email trimis, confirmare de citire, etc.)
- Fără dovadă atașată → finding-ul rămâne deschis
- Cu dovadă atașată → finding-ul se marchează rezolvat și intră în dosar

**5. Intrare automată în dosar**
- Fiecare cerere înregistrată + răspunsul ei + dovada = artifact complet în dosar
- Vizibil în Vault și în artifact timeline

---

### Copy pentru finding-ul de DSAR în dashboard

Finding nou detectat automat dacă nu există procedură documentată:
```
⚠️  Nu ai o procedură documentată pentru cererile de acces / ștergere date

Aceasta este sursa principală de amenzi ANSPDCP în România (Fan Courier,
Vodafone, Dante International — toate amendate în 2024 pentru același motiv).

Termenul legal de răspuns: 30 de zile de la primirea cererii.

[ Creez procedura acum → ]   [ Am deja — încarc dovada ]
```

---

### Metrică de succes
- **Primară:** Numărul de cereri DSAR înregistrate în primele 30 de zile de la lansare — orice număr > 0 validează că utilizatorii au această nevoie reală
- **Secundară:** Rata de completare a flow-ului (cerere înregistrată → draft generat → dovadă atașată → rezolvat)
- **Terțiară:** Finding-ul „Nu ai procedură DSAR" — rata de rezolvare în primele 14 zile după detectare

---

## TASK 7 — SAF-T Finding
**Fișiere:**
- `lib/compliance/findings-rules.ts` sau echivalentul — adaugă regulă nouă
- `lib/compliscan/finding-cockpit.ts` — adaugă cockpit entry pentru SAF-T

**Efort estimat:** 1-2 zile  
**Săptămâna:** 3

---

### Context

Din 1 ianuarie 2025, toate firmele din România (inclusiv cele mici) sunt obligate să depună **Declarația Informativă D406 (SAF-T)** — transmiterea electronică a datelor contabile către ANAF. Amenzile pentru nerespectare sunt diferențiate pe categorii de contribuabili.

Aceasta este o obligație activă din 2025 care afectează toți utilizatorii CompliScan și nu apare în niciun document existent de produs.

---

### Ce construim

Un finding nou în sistemul de detecție:

**Condiție de declanșare:**
- Organizație activă fiscal (`org.fiscal_active = true`)
- Nu există dovadă de depunere D406 în dosar
- Data curentă > 1 ianuarie 2025

**Copy finding:**
```
📋  SAF-T (D406) — obligație activă din ianuarie 2025

Toate firmele din România sunt obligate să transmită electronic
datele contabile către ANAF prin Declarația D406.

Nerespectarea atrage amenzi între 1.000 și 10.000 lei,
în funcție de categoria contribuabilului.

[ Verifică statusul depunerii → ]   [ Am depus — încarc confirmarea ]
```

**Cockpit finding:**
- Explică ce e SAF-T în limbaj non-tehnic (2 rânduri)
- Link direct la ghidul ANAF oficial
- Buton upload dovadă de depunere
- După upload → finding rezolvat + intră în dosar

### Metrică de succes
- **Primară:** Rata de interacțiune cu finding-ul SAF-T în primele 14 zile de la lansare ≥ 25% din utilizatorii activi
- **Secundară:** Zero erori de declanșare falsă (finding apare la organizații care nu ar trebui să depună D406)

---

## TASK 8 — NIS2 Eligibility Gate
**Fișiere:**
- `components/compliscan/nis2/eligibility-wizard.tsx` (nou)
- `app/dashboard/nis2/eligibility/page.tsx` (nou)
- `lib/compliscan/nis2-eligibility.ts` (logică de calcul)

**Efort estimat:** 2-3 zile  
**Săptămâna:** 6-7

---

### Context

Din august 2025, entitățile vizate de OUG 155/2024 (NIS2) au obligația de înregistrare la DNSC. Termenul a fost septembrie 2025. Există deja concurență directă pe acest punct (NIS2Manager.ro, NIS2Check.app) — ceea ce confirmă că piața e reală dar și că urgența e mare.

Problema actuală în CompliScan: assessment-ul NIS2 există și e complex. Dar multe firme nu știu dacă **intră** sub NIS2. Dacă nu știu că intră, nu ajung niciodată la assessment.

---

### Ce construim — wizard de eligibilitate, nu assessment complet

3 întrebări. Un rezultat. O acțiune.

**Întrebarea 1:** În ce sector activează firma?
_(dropdown cu sectoarele din Anexa 1 și Anexa 2 ale OUG 155/2024)_

**Întrebarea 2:** Câți angajați are firma?
- Sub 50
- Între 50 și 250
- Peste 250

**Întrebarea 3:** Care e cifra de afaceri anuală?
- Sub 10 mil EUR
- Între 10 și 50 mil EUR
- Peste 50 mil EUR

**Rezultat posibil:**
```
✓  Nu intri sub NIS2
   Firma ta nu îndeplinește criteriile de dimensiune pentru sectorul tău.
   Reverificăm automat dacă firma ta crește sau dacă sectorul tău e adăugat.

⚠️  Posibil să intri sub NIS2
   Sectorul tău e vizat, dar dimensiunea e la limită.
   Recomandăm o verificare mai detaliată. [ Începe assessment-ul → ]

🔴  Intri sub NIS2
   Firma ta e în domeniul de aplicare al OUG 155/2024.
   Termenul de înregistrare la DNSC era septembrie 2025.
   [ Înregistrează-te acum → ]  [ Vezi ce trebuie să faci → ]
```

**Reguli importante:**
- Wizardul nu înlocuiește assessment-ul NIS2 existent — îl precedă
- Rezultatul „Intri sub NIS2" deschide finding NIS2 și trimite spre assessment-ul existent
- Rezultatul e salvat în profilul organizației (`org.nis2_applicable`)
- Dacă profilul deja are `org.nis2_applicable` setat, wizardul nu mai apare — userul e trimis direct la assessment

### Metrică de succes
- **Primară:** Rata de completare a wizard-ului ≥ 70% din cei care îl încep
- **Secundară:** Rata de conversie wizard → assessment complet pentru cei cu rezultat „Intri" sau „Posibil"
- **Terțiară:** Numărul de organizații care descoperă că intră sub NIS2 prin wizard (adică nu știau înainte)

---

## Tabel prioritizare Etapa 2

| Task | Efort | Impact | Săptămâna | Metrică principală |
|---|---|---|---|---|
| **TASK 7** — SAF-T finding | 1-2 zile | **Critic — obligație activă 2025** | 3 | Interacțiune ≥ 25% din useri activi |
| **TASK 4** — Activity Feed surse externe | 3-4 zile | **Mare — retenție și recurență** | 3-4 | Click-rate feed extern ≥ 15% |
| **TASK 5** — Email lunar eveniment real | 3 zile | **Mare — reactivare și frecvență** | 4-5 | Open rate ≥ 35% |
| **TASK 6** — DSAR tracker light | 3-4 zile | **Critic — top cauză amendă** | 5-6 | Orice cerere înregistrată în 30 zile |
| **TASK 8** — NIS2 eligibility wizard | 2-3 zile | **Mare — blocker adopție NIS2** | 6-7 | Completare wizard ≥ 70% |

---

## Definiția „Etapa 2 validată"

Etapa 3 începe când:
1. SAF-T finding e live și apare corect pentru organizațiile vizate ✓
2. Activity feed afișează cel puțin un eveniment extern real per utilizator activ ✓
3. Primul email lunar cu eveniment real a fost trimis și open rate-ul e măsurat ✓
4. DSAR tracker e live și cel puțin un utilizator a înregistrat o cerere ✓
5. NIS2 wizard e live și rata de completare e măsurată ✓

**Nu e nevoie de rezultate pozitive pentru a trece la Etapa 3 — e nevoie de date măsurate.**

---

## Ce NU se face în Etapa 2

- Nu se construiește DSAR complet cu toate sub-cazurile posibile — doar flow-ul minim care salvează de amendă
- Nu se construiește un modul NIS2 nou — wizardul precedă assessment-ul existent, nu îl înlocuiește
- Nu se adaugă gamification sau streak-uri pentru a forța usage
- Nu se trimit mai mult de un email lunar per utilizator din această logică
- Nu se lansează Etapa 3 (Trust Center, share links) înainte ca metricile de mai sus să fie măsurate
- Nu se promite utilizatorului că bancile cer standard pachete GDPR/NIS2 — nu avem suport public verificat pentru asta

---

## Întrebări de clarificat înainte de sprint

Acestea trebuie răspunse de tech lead sau PO înainte să înceapă implementarea:

1. **NACE code:** Există `org.nace_code` în baza de date? Dacă nu, de unde îl luăm — din ANAF pe CUI sau îl cerem în onboarding?
2. **Legislation monitor:** `lib/compliscan/legislation-monitor.ts` produce deja evenimente cu tag de relevanță per org? Sau doar detectează schimbări generic?
3. **SAF-T:** Există deja vreun câmp care indică dacă organizația a depus D406? Sau pornim de la zero?
4. **NIS2 applicability:** `org.nis2_applicable` există deja setat din assessment-ul existent sau e câmp nou?
5. **Email system:** Sistemul de email existent suportă variabile dinamice din baza de date (cifre reale per org)? Sau e template static?
