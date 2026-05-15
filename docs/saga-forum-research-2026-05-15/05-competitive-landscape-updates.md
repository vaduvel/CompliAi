# 05. Competitive Landscape — Updates 2025-2026

Sinteza mențiunilor de competitori din corpus (2,443 posturi). Frecvența nu este =cu market share, ci cu **noise share**: cât de des e numit într-o discuție de durere fiscală.

| Brand | Mențiuni corpus | Sentiment dominant | Poziționare strategică pentru FiscCopilot |
|---|---:|---|---|
| **SAGA** | 300 | Mixed: produsul "etalon RO contabilitate" + frustrare lentă pe SaaS migration / D112 errors | **NU concura. Augmentează.** Tool care explică erorile SAGA. |
| **Solo** | 32 | Negativ: "interfață mișto cu care nu fac nimic", chatbot greșit | **Atacă pe vertical fiscal precis (D212, D406)** unde Solo se mulțumește cu generalități. |
| **Keez** | 23 | Foarte negativ: "mizerie", "contabili prost pregătiți", "fiecare operațiune extra taxată" | **Diferențiator clar: predictibilitate prețului.** FiscCopilot fix la 49-99 RON. |
| **StartCo** | 8 | Pozitiv-neutru: "preț mai bun decât Keez", "350 lei schimbare cod CAEN vs 204€" | Co-existență: utilizatorii StartCo cer tool independent pentru SPV/D212. |
| **Oblio** | 8 | Pozitiv: "are robot e-Factura", "import facturi auto" | Învățare: Oblio face ce SAGA refuză (auto-trimit). FiscCopilot poate face pe tipuri de declarații. |
| **FGO** | 3 | Pozitiv-funcțional: "are robot e-factura"; "Saga importă facturi din FGO" | Idem Oblio — referință pentru ce ar trebui să avem. |
| **SmartBill** | 3 | Neutru: "tehnologii vechi", "Manager Conta gratuit acoperă 50%" | **ATENȚIE: SmartBill ManagerConta gratuit deține parte din market.** (Memory CompliAI). |
| **Nexus** | 2 | Neutru: software niche fără export DBF | Irelevant ca threat. |
| **WinMentor** | 1 | Neutru: amintit pe lângă SAGA/Ciel | Irelevant ca threat. |
| **ANA (ANAF chatbot)** | Multiple, special | Negativ: "ANALFABET", răspunsuri greșite | **Diferențiator: FiscCopilot răspunde cu fundamentare normativă citată** — ce ANA nu face. |

---

## Pattern de criticare (citate verbatim)

### Keez (cel mai criticat brand din corpus)
> "**Keez e o mizerie.** Contabilii lor raspund greu, sunt prost pregatiti si **orice operatiune suplimentara, oricat de mica, este taxata cu zeci sau sute de euro**. Mie pentru o simpla declaratie de inregistrare a unui punct de lucru la ANAF mi-au cerut 100 [euro]"
> r/RoFiscalitate2, 2025-03-04 — https://reddit.com/r/RoFiscalitate2/comments/1j35jb7/

> "Update: ma gândesc... cer 204 euro pentru schimbare cod caen v3. La startco e 350 lei. **Wtf, 4x pret...**"
> r/RoFiscalitate2, 2025-03-04 — același thread

> "Am primit recent instintare din partea keez ca pretul pentru abonamentul lunar va creste cu inca 15 EUR + TVA. Pentru pachetul cel mai mic + platitor de TVA se ajunge la **aproape 500 de ron/luna cand acum 2 ani era 262 ron** (fara a fi platitor de tva)"
> r/RoFiscalitate2, 2025-03-04 — același thread

### Solo (atacat pe suport)
> "**Experienta Solo - cum am pierdut bani si timp din cauza suportului**" (titlu thread, 94 upvotes)
> r/RoFiscalitate2, 2026-01-19 — https://reddit.com/r/RoFiscalitate2/comments/1qh0ae0/

> "M-am uitat la solutia ta si am intrebat fix speta lui OP, **mi-a raspuns ca ar trebui sa se duca la Bucuresti** (obviously not true). Arunca un ochi si tu."
> idem.

> "Vreau să văd un XXX între Ana de la ANAF și Ana de la Solo." (referință la chatbotul Solo)
> r/RoFiscalitate2, 2026-01-26

### SmartBill / ManagerConta (cel mai mic noise share dar atenție strategică)
> "Lucrez la o app de facturare, precum Facturis, Oblio, **Smartbill** etc de prin martie. [...] preturile pe care le voi avea pentru abonamentele mai complexe cu mai multe functii sunt mult mai mici decat cele de la Smartbill/Saga."
> r/programare, 2024-11-16

**Important strategic (din Memory CompliAI):** SmartBill ManagerConta GRATUIT deține ~50% din ce vindeam ca facturare. **Nu putem ignora pe SmartBill chiar dacă nu apare des în corpus** — este major-domus în categoria "free tier".

### Oblio + FGO (referință funcțională pozitivă)
> "robot care sa trimita fc de vinzare validate automat dupa x zile maxim 5 (setat de utilizator) in e-factura. **Are oblio si fgo**."
> SAGA Forum, 2024-06-26 — https://www.sagasoft.ro/forum/viewtopic.php?t=56299

> "stau in SPV, le văd cum vin în oblio (asta folosesc), dar **tot trebuie să intru zilnic să stau la pândă** dacă mi-au trimis sau nu factura... e BS!"
> r/RoFiscalitate2, 2024-07-03 — https://reddit.com/r/RoFiscalitate2/comments/1dtsmup/

→ **Chiar utilizatorii Oblio (care e considerat "best in class" pentru e-Factura) au pain pe verificare în SPV.** FiscCopilot poate ataca acest pain direct.

### ANA chatbot ANAF
> Threadul "ANA de la ANAF este ANALFABET" (63 upvotes, 2026-01) și "Ați interacționat cu Ana?" (61 upvotes, 2026-01) sunt principalele semnale.
> https://reddit.com/r/RoFiscalitate2/comments/1qndzvw/

→ Sentiment public foarte negativ. FiscCopilot trebuie să fie pozitionat ca **"AI fiscal RO care chiar funcționează — nu Ana"**.

---

## Hartă de poziționare FiscCopilot

```
              SCUMP
                |
        Keez ●  |  ● StartCo (consultant)
                |
                |  ● Solo (chatbot slab)
   --------- 100 RON ---------
                |
                |  ● [FiscCopilot Pro] target
                |
                |  ● Oblio / FGO (facturare)
   --------- 50 RON  ---------
                |
                |  ● [FiscCopilot Starter] target
                |
        Saga ● (un singur preț, dar AI lipsă)
                |
        ● ManagerConta (gratis, dar limited)
                |
              GRATIS
   FACTURARE ←------+------→ DECLARAȚII FISCALE / AUDIT
```

**Insight strategic:** zona dreapta-jos a hărții (declarații fiscale + audit la preț 50-100 RON) este **goală**. Acolo intră FiscCopilot.

---

## Gap-uri identificate pe competitori (oportunități FiscCopilot)

| Funcție | SAGA | Solo | Keez | StartCo | Oblio | SmartBill MC | FiscCopilot |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Facturare + e-Factura submit | ✓ | ✓ | ✓ | ✓ | ✓ (best) | ✓ free | — (NU intrăm aici) |
| Reconciliere broker (D212) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ DIFERENȚIATOR** |
| Watchdog SPV proactiv | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓ DIFERENȚIATOR** |
| Traducător erori D112/D406 | ✗ | ✗ | ? | ✗ | ✗ | ✗ | **✓ DIFERENȚIATOR** |
| AI consultant fiscal cu fundamentare | ✗ | parțial (chatbot slab) | ✗ | ✗ | ✗ | ✗ | **✓ CORE** |
| Calendar termene + push | ✗ | parțial | ✗ | ✗ | ✗ | ✗ | **✓** |
| Calculator penalități ANAF | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Multi-firmă pentru contabil | ✓ | ✓ | ✓ | ✓ | ✓ | parțial | ✓ (Studio tier) |
| Suport telefonic uman | ✗ (forum) | slab | slab | mediu | ? | ✗ | mediu (premium) |

---

## Concluzie competitivă

1. **Nimeni dintre competitori nu acoperă "fiscalitate complexă" — IBKR, D212 broker, D406 mapping, SPV watchdog, traducere erori ANAF.** Acolo e moat-ul nostru.
2. **Pretul prag pentru a evita sarcasmul comunității e 100 RON/lună.** Solo la 119 a fost ridiculizat. Tier-uri 49 / 99 / 299 sunt prețuri "safe".
3. **Brandingul trebuie să spună clar "NU SUNT ANA".** Cu fundamentare normativă citată în orice răspuns AI.
4. **Atenție strategică pe SmartBill ManagerConta gratuit** — putem fi ne-disrupted dacă rămânem strict pe fiscal complex (nu pe facturare).
5. **Co-existența cu SAGA / Solo / StartCo** = mai bună decât competiția. Utilizatorul plătește 100 RON Solo + 49 RON FiscCopilot pentru a-i acoperi gap-urile.
