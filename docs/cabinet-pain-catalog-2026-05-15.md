# Catalog dureri reale cabinete contabile RO — 2026

> **Sursa:** observație directă + comunități profesionale (Forum SAGA, grupuri FB, Reddit)
> **Data:** 2026-05-15
> **Scop:** maparea fiecărei dureri la Match Path / Feature FiscCopilot

---

## I. Iadul e-Factura — dincolo de download XML

### 1.1 Asimetria SPV vs POS/bon fiscal
**Durere:** Softurile descarcă XML, dar nu corelează factura cu bonul fiscal atașat sau plata POS.
**Workflow manual:** Contabil ia fiecare factură furnizor → caută bonul rătăcit prin dosar → corelare manuală.
**FiscCopilot opportunity:** Match Path `bon-efactura-correlation` — detectează bon fiscal + e-Factura cu același CUI furnizor + sumă în 7 zile → sugerează corelare.

### 1.2 "Facturi Fantomă" din SPV (CUI greșit)
**Durere:** Furnizor emite factură de 50K RON cu CUI greșit → factura intră în SPV-ul tău, nu o poți ignora (D394 va da neconcordanță).
**Constrângere legală:** Obiecție oficială SPV în **7 zile** sau forțezi emitentul să stornează.
**FiscCopilot opportunity:** Match Path `factura-fantoma-spv` — detectează factură SPV cu furnizor necunoscut în portfolio + countdown 7 zile pentru obiecție. **CRITIC severity.**

### 1.3 Facturi duplicat (emise de 3 ori)
**Durere:** Furnizor trimite din greșeală aceeași factură de 3x în SPV. Algoritmi simpli importă 3x → dublu/triplu TVA deductibil.
**FiscCopilot opportunity:** Match Path `factura-duplicate-spv` — detectează 2+ facturi cu same (CUI emitent + număr + sumă + dată) în 30 zile.

### 1.4 Tranzacții mixte Dedeman (bon + e-Factura)
**Durere:** Cumperi de la Dedeman cu cardul firmei → primești bon fiscal cu CUI. La 3 zile, Dedeman emite și e-Factura. Soft importă e-Factura ca neachitată (cont 401). Junior procesează bon → înregistrează DIRECT (cont 501/602). **Rezultat: cheltuiala dublu înregistrată.**
**FiscCopilot opportunity:** Match Path `dedeman-double-booking` — detectează bon fiscal procesat + e-Factura SPV cu same partener/sumă/dată ±3 zile → flag dublură + sugerează unificare.

### 1.5 XML cu cont greșit mapat (energii la "mărfuri")
**Durere:** Firme mari de utilități trimit XML cu mii de linii / coduri NC8 greșite. Soft mapează energia la cont 371 (mărfuri). Contabil corectează manual la 6051.
**FiscCopilot opportunity:** AI Expert — auto-suggest corecție cont per partener cunoscut (memorie longitudinală: "Enel = 6051, NU 371").

---

## II. Coșmar bancar — Open Banking esențial

### 2.1 Sindromul PayU/Stripe/Netopia
**Durere:** Extras bancar arată "Netopia Financial 14.320 RON" pentru 150 comenzi diferite cu comision oprit deja. Contabil se loghează în Stripe → descarcă CSV → identifică comision → înregistrare manuală decont → stinge 150 facturi.
**FiscCopilot opportunity:** Integrare API Stripe/PayU/Netopia → auto-decompune suma globală în comenzi individuale.

### 2.2 Plăți admin personal vs firma (Revolut card greșit)
**Durere:** Admin plătește "Taverna Nikos" Grecia cu cardul firmei. Fără factură, fără bon. Contabil sună → "Am încurcat cardurile". Reglare manuală prin cont 542/4551 + dispoziții manuale.
**FiscCopilot opportunity:** Match Path `bank-payment-no-justify` — tranzacție bancară fără document justificativ după 14 zile → alert + workflow "întreabă admin" structured (nu WhatsApp).

### 2.3 Etichete bancare generice
**Durere:** "Plată online", "POS", "ATM" fără context. Imposibil de clasificat fără confirmare admin.
**FiscCopilot opportunity:** Portal client cu push "Avem 5 tranzacții neclar — clasifică în 2 min" + buton de tagging rapid.

---

## III. Platforme externe globale — D390 intracomunitar

### 3.1 Google Ads, Meta, Adobe, AWS
**Durere:** Facturi externe NU trec prin SPV → reguli speciale taxare inversă → corelare manuală cu D390 intracomunitar.
**FiscCopilot opportunity:** Match Path `foreign-platform-d390` — detectează tranzacție bancară către Google Ads / Meta / Adobe / Stripe / AWS / Cloudflare → flag pentru D390 + sugerează încadrare taxare inversă automat.

---

## IV. HR/Revisal — amenzi 20.000 RON

### 4.1 Angajare retroactivă imposibilă
**Durere:** Vineri 21:00 client zice "luni dimineața 08:00 am om nou". Legal: contract trimis Revisal cu MIN 1 zi înainte → trebuie duminică seară. Dacă portal ITM e în mentenanță → amendă 20K RON.
**FiscCopilot opportunity:** Match Path `revisal-retroactive` — detectează cerere angajare cu data start < azi + 24h → blochează + alertă urgent + sugerează data legal acceptabilă.

### 4.2 Concediu medical "surpriză" pentru luna trecută
**Durere:** Pe 12 ale lunii, când statul e aproape gata, client trimite CM roz pentru luna anterioară. Coduri 01/08/14 schimbă radical calculul → ștergere stat → recalcul media 6 luni → refacere D112 → revalidare.
**FiscCopilot opportunity:** Match Path `medical-leave-retroactive` — detectează CM pentru perioadă cu D112 deja depus → flag urgent reopen D112 + calculator automat FNUASS.

---

## V. Iadul zilei de 25 — serverele ANAF

### 5.1 "Preluat în prelucrare" timp de 6-12 ore
**Durere:** Trimiți D112 la 14:00 → status blocat 12h → recipisă la 02:00 cu "CNP invalid sau suspendat" → 1.5h să corectezi.
**Workflow real:** Contabili lucrează 02:00-05:00 când serverele răspund.
**FiscCopilot opportunity 1:** Match Path `anaf-peak-hours-warning` — alertă pe 23-25 "Depune înainte 14:00 SAU după 23:00. Serverele crash între 09:00-22:00."
**FiscCopilot opportunity 2:** Auto-retry submit cu exponential backoff + push notification când recipisa e gata (24/7).
**FiscCopilot opportunity 3:** Pre-validation EXTRA strictă în 24-25 — verifică CNP-uri, structură XML, sume cross-referenced ÎNAINTE să tributezi la ANAF.

---

## VI. Probleme economice cabinet

### 6.1 "Tarif fix, muncă variabilă"
**Durere:** Abonament 500 RON/lună pentru "până la 50 documente" → client face dropshipping → 3.000 facturi/lună → abonament unchanged → cabinet în pierdere.
**FiscCopilot opportunity:** Dashboard "Profitability per Client" — calculează automat efortul real (documente procesate × timp mediu) vs tarif încasat. Sugerează renegociere când marja <30%.

### 6.2 Recuperarea banilor de la clienți
**Durere:** Pe 26 ale lunii, jumătate zi sună clienții să-i convingă să plătească onorariile.
**FiscCopilot opportunity:** Modul "Hold recipisă" — opțional, ține recipisele blocate până client achită factura cabinetului (legal: cabinetul are dreptul). Automatizat în client portal.

---

## ZONELE DE AUTOMATIZARE (din research direct)

3 sisteme pe care **NIMENI nu le-a integrat cap-coadă într-un singur produs**:

1. **OCR nativ RO bonuri cu auto-learning** → Petrom Timișoara = cont 6022 (combustibil) + CUI + TVA 19%/9% + check SPV pentru e-Factura unificare
2. **Robot reconciliere bancară multi-bancară prin Open Banking REAL** → extrase live + algoritm probabilistic (sumă + fragment nume client + scadență) → 1-click confirm
3. **Portal comunicare client structurat** → înlocuiește WhatsApp/email → client cere adeverință → check stat validat → generare PDF semnat automat → zero întreruperi cabinet

---

## MAPARE → Match Paths noi (priority order pentru FiscCopilot)

### P0 — Quick wins (1-3 zile fiecare, fără dependențe externe)

| Match Path nou | Detector logic | Severity | Effort |
|----------------|----------------|----------|--------|
| `factura-fantoma-spv` | e-Factura SPV cu furnizor NU în portfolio + < 7 zile de la primire | **URGENT** (deadline obiecție) | 1 zi |
| `factura-duplicate-spv` | 2+ e-Facturi cu same (CUI+număr+sumă) în 30 zile | HIGH | 1 zi |
| `dedeman-double-booking` | Bon fiscal procesat + e-Factura SPV (same partner/sumă/data ±3z) | HIGH | 2 zile |
| `bank-payment-no-justify` | Tranzacție bancară fără doc justificativ > 14 zile | MEDIUM → URGENT escalation | 2 zile |
| `foreign-platform-d390` | Bank txn către Google/Meta/Adobe/Stripe/AWS/Cloudflare | INFO + flag D390 | 1 zi |
| `anaf-peak-hours-warning` | E zilele 23-25 + ora 09:00-22:00 + decl. nedepusă | HIGH (operational) | 1 zi |
| `revisal-retroactive` | Cerere angajare cu data start < acum + 24h | **CRITICAL** (amendă 20K) | 1 zi |
| `medical-leave-retroactive` | CM pentru perioadă cu D112 deja depus | URGENT | 2 zile |

**TOTAL P0: ~11 zile = 2-3 săpt pentru toate 8.**

### P1 — Medium effort (1-3 săpt)

- Portal client structured (adeverințe + tagging tranzacții bancare)
- Profitability per Client dashboard
- Hold recipisă mecanism (cu legal disclaimers)
- AI Expert "învață contul preferat per partener" (Enel = 6051, NOT 371)

### P2 — Heavy lifting (1-3 luni)

- OCR bonuri nativ RO (Tesseract + RO patterns)
- PSD2 Open Banking integration completă
- Stripe/PayU/Netopia API integration

---

## INSIGHT-uri strategice noi din acest research

### 1. Există "obiecție SPV 7 zile" — feature absolutist absent în orice tool
Asta-i edge case cu RISC LEGAL DIRECT. Cabinetul care nu prinde fereastra = vid legislativ, factură fantomă acceptată.

### 2. Lucrul nocturn 02:00-05:00 = simptom de infrastructură proastă ANAF
**Marketing copy direct:** *"Nu mai dormi după ANAF. FiscCopilot retry-ește când serverele răspund. Tu dormi."*

### 3. WhatsApp = inamicul #1 al cabinetelor (HR + tranzacții fără doc)
Portal client structured = nu mai e nice-to-have, e CRITIC. **Vello acoperă document collection, dar NU HR + tagging tranzacții.** Acolo putem fi diferit.

### 4. Profitability per Client = insight financiar de cabinet
Cabinetele nu știu MARJA reală per client. Asta-i unghi DE BUSINESS, nu doar fiscal. **Putem extinde la category "Cabinet Operations" — pricing tier separat.**

### 5. Coreăm pricing-ul cu volume metrics
SAGA WEB are exact asta (per CIF). Noi putem fi mai inteligenți: **prețul include 500 documente/lună per cabinet; trace overage cu billing alert**. Asta protejează ECONOMIA cabinetului.

---

## ACȚIUNI IMEDIATE — Sprint 1.5

Construiesc cele 8 Match Paths P0 în acest sprint. Total ~2-3 săpt. Plus 1 corpus entry generic per problemă.

**Output target:**
- 6 Match Paths existente + 8 noi = **14 Match Paths total**
- Catalog acoperă 80% din durerile reale documentate
- Demo nou pentru Carmen/Cristina: **"Uite cele 14 alerte automate care îți acoperă luna"**

Vrei să încep cu **factura-fantoma-spv** (cel mai critic, deadline legal 7 zile) sau **revisal-retroactive** (cel mai catastrofic, amendă 20K)?
