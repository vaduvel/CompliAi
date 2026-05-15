# 03. Pain points fiscale GENERICE (dincolo de SAGA)

Aceste pain-uri afectează **toți contribuabilii RO**, nu doar utilizatorii SAGA. Sunt principalul vector de creștere pentru FiscCopilot, pentru că populația de risc este de 10x-100x mai mare decât baza Saga.

---

## 1. Notificări ANAF automate eronate / somații pentru obligații inexistente

**Volum semnal:** thread "ANAF vrea să-mi ia casa" — **653 upvotes** r/RoFiscalitate2 (cel mai mare semnal din corpus); thread "Somatie ANAF 9500 lei" — 125 upvotes.

**Caracteristici comune:**
- PFA închise în 2019 → somație pentru 2020-2021 în 2025-2026
- Decizii din oficiu emise automat fără verificare
- Termen de **15 zile pentru contestație** (50 RON taxă timbru fără avocat)
- "Avem 30 de zile să răspundem la sesizare SPV" — ANAF NU răspunde, dar termenul tău curge

**Citate:**
> "Azi am primit somatie cu termen de 15 zile pentru plata a aproximativ 9500 de lei pentru ca nu am platit taxele pentru 2020-2021 un PFA care **nu mai exista din 2019**."
> r/RoFiscalitate2, 2026-03-17 — https://reddit.com/r/RoFiscalitate2/comments/1rw348v/

> "Avand in vedere ca **somatiile ANAF se trimit automat, fara verificarea veridicitatii datelor invocate in somatie** in mod cert se poate mult, mult mai rau."
> r/RoFiscalitate2, 2026-01-26 — https://reddit.com/r/RoFiscalitate2/comments/1qndzvw/

**FiscCopilot value-prop:**
- Watchdog SPV cu polling zilnic + alertă push
- "Decizie ANAF — ce trebuie să faci în următoarele 15 zile" wizard cu pași concreți (templating contestație incluse)
- Bază de spețe rezolvate similare ("am avut și eu aceeași somație și am rezolvat la ANAF arătând X")

---

## 2. Reconciliere venituri brokeri (IBKR, eToro, Tradeville, Revolut, Trading 212)

**Volum semnal:**
- "ANAF vrea sa ma omoare!" 324 upvotes r/robursa
- "Declaratia 212 IBKR cu venituri pe Irlanda" thread cu zeci de comentarii detaliate
- "Raportari eronate IBKR > Anaf" 57 upvotes
- "IBKR și ANAF, combinatie fatala" 84 upvotes
- "Problema ANAF investitii la bursa" 46 upvotes

**Caracteristici:**
- Brokerii raportează CRS (Common Reporting Standard) — sume **valori absolute** fără context (intrări vs ieșiri)
- ANAF interpretează raportul brokerului = profit 100%
- Tara raportării: brokerul raportează ca **Irlanda** (sediul brokerului), nu țara emitentului (US/Indonezia etc.)
- W8-BEN și impozit reținut la sursă — angajații ANAF nu cunosc
- Declarația Unică 212 are **8 articole** (91-98 Cod Fiscal) care nimeni nu le-a citit

**Citate:**
> "ca eu sunt cetăţeanul de rand care cu onestitate, incearca sa depuna corect declaratia unica si Anaf vine la limita prescrierii si il santajeaza cu impunere, amenda, poprire conturi bancare sau invitatii la sediu pentru discutii explicative despre veniturile lui pe brokeri straini"
> r/robursa, 2026-01-31 — https://reddit.com/r/robursa/comments/1qs2yrh/

> "tanti de la ANAF îmi zice ca figurez cu venituri de vreo 30 de ori mai mari decât în realitate (ah și cireașa de pe tort, **ea vedea suma respectiva în HUF și aparent nu știe cum e cu cursul**)"
> r/robursa, 2024-05-09 — https://reddit.com/r/robursa/comments/1co1ytl/

> "primele declaratii au fost total varza. abia de prin 2023 ( deci pt 2022) le am facut intr-un fel mai corect"
> r/robursa, 2026-02-02 — https://reddit.com/r/robursa/comments/1qs2yrh/

**FiscCopilot value-prop:**
- **Conector dedicat IBKR Flex Query / eToro CSV / Trading 212 export → D212** cu mapping țară emitent vs țară broker
- Reconciliere extras bancar (cât ai trimis broker) vs raport broker vs CRS ANAF
- Calculator castig/pierdere multi-an cu reportare pierdere 5 ani (art. 119 Cod Fiscal)

---

## 3. SPV nu trimite notificări reale → utilizatorul ratează termene

**Volum:** "ANAF vrea să-mi ia casa" 653 upvotes; ecou pe toate thread-urile de somații.

> "Au trimis doar un mesaj în sistemul lor online și eu **ar trebui să verific obsesiv în fiecare zi** dacă nu cumva ANAF-ului i s-a sculat să-mi inventeze ceva taxe. Și chiar li s-a sculat, în cuamtum de să-mi ia casa, dar asta nu necesită informare prin poștă din partea lor."
> r/RoFiscalitate2, 2025-12-01 — https://reddit.com/r/RoFiscalitate2/comments/1pafexb/

> "Trimit un mesaj, după care trimit alt mesaj că-mi dau amendă că n-am citit mesajul. Dacă ăsta nu-i abuz, nu știu ce e."
> idem.

**FiscCopilot value-prop:** Watchdog SPV automatizat. Verificare zilnică, alert push (email + sms), checklist de termene calendaristice.

---

## 4. D406 / SAF-T extins la micro (1 ian 2025) — fricționare uriașă

**Volum în corpus:** 104 menționări term-match — cel mai mare cluster intern.

**Pain specific:**
- Validatorul ANAF e instabil
- DUKIntegrator nu pornește pe Win11 / cu token cloud
- Maparea conturilor 4xx/5xx contabilitate analitică e neclară
- Micro-cu-ulei (rapoarte gestiune complexe) nu au mapping clar

> "Dukintegratorul lipsesc fișiere din biblioteca programului sau versiunea de validator instalată este incompletă/coruptă"
> SAGA, 2026-04-15 — https://www.sagasoft.ro/forum/viewtopic.php?t=61656

**FiscCopilot value-prop:** D406 mapper + validator + "ce zice eroarea X concret".

---

## 5. Declarația Unică precompletată — funcția nouă creează duplicări

> "psa. declaratia unica precompletata si pre depusa" — r/RoFiscalitate2, 2026-03 (49 upvotes)
> https://reddit.com/r/RoFiscalitate2/comments/1s2rcv9/

> "**nu inteleg de ce trebuie sa ti bati tu capu cu completat datele din fereastra pop-up de care ziceai cand ar trebui sa fie completat de ei** plus ca ei ar trebui sa stie ce impozite ai si cat de platit...sistem ordinar"

> "ar trebui sa-ti apara un popup cu cpn-ul si-o interfata de import date"

**FiscCopilot value-prop:** wizard "Verifică ce a precompletat ANAF" + checklist diferențe ce trebuie corectate manual.

---

## 6. ANA (chatbot ANAF) — răspunsuri eronate, dă vina pe tine

**Volum:** "Ați interacționat cu Ana?" 61 upvotes; "ANA de la ANAF este ANALFABET" 63 upvotes.

> "Dacă ar și funcționa o chestie de genul \"am făcut asa pentru ca asa m-a sfătuit AI-ul vostru\" ar fi bine, dar parcă vad ca o sa pună o mențiune cum ca nu-i valabil ce vorbește"
> r/RoFiscalitate2, 2026-01-26 — https://reddit.com/r/RoFiscalitate2/comments/1qndzvw/

> "a de la ghișeu, nu e autentică, cum mă mai plimb acum la 3 ghișee diferite că să mă întorc la primul, ar trebui să facă 3 Ana să ne plimbe între ele"

**FiscCopilot value-prop:** răspunsuri cu fundamentare normativă citată + "atribuie speța" (utilizatorul poate dovedi că a urmat sfatul AI dacă apare problema). **Acest e principalul moat vs ANA.**

---

## 7. Notificări ramburs OLX, SkinPort, Vinted — small fish hunting

**Volum:** "Notificare ANAF venituri ramburs olx" + "Am primit raspuns ramburs" + "Notificare SPV ramburs" — 3 thread-uri majore 2025-07.

> "**1) deși sume mici, sunt mulți 2) nu au spate, se sperie, plătesc 3) își justifică munca cei de la ANAF.** Adică, un fel de degeaba a furat cineva 100x mai mult, dacă e de 1000x mai greu sa recuperezi banii ăia."
> r/RoFiscalitate2, 2025-07-18 — https://reddit.com/r/RoFiscalitate2/comments/1m2wdjr/

> "ANAF declara acum 2 ani ca nu investigheaza pe cei care si-au vandut bicicleta copilului, schiurile sau claparii care au ramas mici **iar ei fix asta fac acum**"
> r/RoFiscalitate2, 2025-07-22

**FiscCopilot value-prop:** ghid contestație notificare ramburs (template) + calculator "asta e venit impozabil sau personal use?"

---

## 8. Calcul Concediu Medical 2026 — OUG schimbată în mijlocul anului

**Volum:** thread `t61222` 71 replies + `t61166` 61 replies.

> "Se resetează regula celor 5 zile: Angajatorul va fi obligat să plătească din nou primele 5 zile din buzunarul propriu. Se aplică din nou ziua de carență"
> SAGA Forum, 2026-03-05 — https://www.sagasoft.ro/forum/viewtopic.php?t=61222

**Schimbări 2026:** NZLCM-1 (numărul zilelor lucrătoare minus 1), regula carenței, 5 zile angajator restabilite. Toate au fost introduse cu efecte retroactive.

**FiscCopilot value-prop:** Calculator CM cu reguli versionate pe data deci (validitate temporală).

---

## 9. Penalități automate dobândă + nedeclarare = dublarea datoriei

> "**Penalitatea de nedeclarare este de 0,08%/zi, iar dobanda este de 0,02%/zi.** Daca se achita toata suma datorata, penalitatea de nedeclarare se reduce cu 75%. **Daca se depaseste pragul de 6 salarii minime, se datoreaza si CASS (10% din suma).** Daca se depasesc 12 salarii [minime] [...]"
> r/RoFiscalitate2, 2025-07-23 — https://reddit.com/r/RoFiscalitate2/comments/1m6oe2a/

**Implicație:** o întârziere de 1 an pe 5000 RON neplătiți → ~1825 RON penalități (= 36% suprapunere). Nu există calculator standard care să arate asta înainte.

**FiscCopilot value-prop:** Calculator penalități + simulare "dacă plătesc azi vs peste 30 zile vs peste 6 luni". Reducerea de 75% trebuie explicată în UI.

---

## 10. e-Factura — facturi primite dar care nu apar în SPV

> "**de ce trebuie eu sa verific sa vad daca el a trimis factura in SPV sau nu** si sa imi mai pierd timpul sa sun la furnizor si apoi sa fac plangeri. Pe mine cine ma plateste pentru timpul ala? Responsabilitatea mea directa e sa trimit facturile pe care le emit in SPV nu sa stau sa verific fiecare furnizor."
> r/RoFiscalitate2, 2024-07-02 — https://reddit.com/r/RoFiscalitate2/comments/1dtsmup/ (113 upvotes)

**FiscCopilot value-prop:** Watchdog facturi primite/emise vs SPV (zilnic poll, alerte pe gap).

---

## 11. Suport contabilitate online (Solo, Keez, StartCo) — chatbot greșit pe întrebări simple

**Volum:** "Experienta Solo" 94 upvotes r/RoFiscalitate2.

> "**\"ce trebuie sa fac după soluționarea formularului 070\" este una banală pentru care chat botul ar trebui sa fie antrenat**"
> r/RoFiscalitate2, 2026-01-19 — https://reddit.com/r/RoFiscalitate2/comments/1qh0ae0/

> "M-am uitat la solutia ta si am intrebat fix speta lui OP, **mi-a raspuns ca ar trebui sa se duca la Bucuresti** (obviously not true)"

**FiscCopilot value-prop:** demonstreaza superioritate vs Solo chatbot pe spețe declarative concrete (070, 700, M, S etc.).

---

## 12. Cod fiscal punct de lucru — confuzie totală

Thread `t60715` 106 replies (legislatie).

> "Se fac la Trezoreria unde este arondata mama, dar se pune codul fiscal al Puiului (al punctului de lucru). Am confirmarea ca asa este: Am achitat de 2 ori in Trezoreria..."
> SAGA, 2026-02-27 — https://www.sagasoft.ro/forum/viewtopic.php?t=61163

**FiscCopilot value-prop:** Wizard "plată pentru punct de lucru" cu cod fiscal corect, trezorerie corectă.

---

## 13. Codul Fiscal recent OUG-uri (2025-2026)

**Schimbări identificate în corpus:**
- Cota 10% sănătate (clarificat 2023, neimplementat în SAGA până 2024)
- Salariul minim brut crescut la 3750 RON
- D406 micro extindere 1 ian 2025
- CM 2026 — ziua carență + 5 zile angajator (restabilire)
- e-TVA OUG 13/2026 (abrogare)
- D205 distrugere dividend interimar — risc dublare la rectificativă
- Decl. Unică precompletată introdusă 2026

**FiscCopilot value-prop:** **Knowledge base versionată pe dată legislativă** — utilizatorul cere "regulile CM la 2026-02-15" și primește răspuns valid pentru acea zi.

---

## Sinteză: cele 5 momente de adevăr fiscale (peak emotional)

1. **Notificare/Somație ANAF primită** (decembrie - martie cluster)
2. **Termen depunere D112 / D300 / D406** (25 al lunii)
3. **Termen Declarația Unică** (maiul / iulie)
4. **Reglare pierderi broker fiscale** (martie-mai pentru anul precedent)
5. **Schimbare OUG retroactivă** (oricând — peak emoțional)

FiscCopilot trebuie să fie *prezent* (push, email, calendar integration) **EXACT** la aceste momente, nu să aștepte ca utilizatorul să-l deschidă.
