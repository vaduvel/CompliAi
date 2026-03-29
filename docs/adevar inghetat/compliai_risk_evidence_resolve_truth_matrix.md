# CompliAI — Risk → Evidence → Resolve Truth Matrix

Data: `2026-03-27`  
Status: `working truth matrix`  
Scop: `separă riscurile care se pot închide real în Smart Resolve de cele care cer dovadă operațională sau specialist_handoff`

---

## 0. De ce există documentul

Problema nu este doar UI.

Problema este că, astăzi, aplicația poate:
- să arate generator pe riscuri unde documentul nu închide cazul real
- să aibă document engine fără poartă completă de attach / Dosar / monitoring
- să ceară `doc request` în onboarding pentru artefacte care nu au flow real de Smart Resolve

Acest document îngheață adevărul pe modelul:

`risc -> tip de dovadă -> motor disponibil -> flow permis în cockpit`

Nu pornește de la:
- ce documente știm să generăm
- ce am vrea să vindem

Pornește de la:
- ce dovadă închide cazul
- dacă motorul real există
- dacă flow-ul este complet până la Dosar și monitorizare

---

## 1. Regula de clasificare

### 1.1 Clasa A — Documentar real în Smart Resolve

Un risc intră aici doar dacă sunt adevărate toate:
- are finding type canonic care cere `generated_document`
- cockpitul deschide flow documentar real
- documentul poate fi:
  - generat
  - validat
  - confirmat uman
  - folosit pentru rezolvarea riscului
  - trimis la Dosar
  - trecut în monitorizare

### 1.2 Clasa B — Operațional în cockpit

Un risc intră aici dacă:
- documentul nu este dovada principală care închide cazul
- userul trebuie să facă o acțiune reală în afara generatorului
- cockpitul cere dovadă operațională verificabilă:
  - notă clară
  - fișier
  - screenshot
  - link
  - export

### 1.3 Clasa C — Specialist handoff controlat

Un risc intră aici dacă:
- Compli poate ajuta
- dar nu poate închide cazul complet doar din cockpit cu document sau notă simplă
- este nevoie de modul specialist, autoritate externă, timeline sau proces asistat
- sistemul trebuie să ducă userul controlat în acel modul și să îl readucă automat în același cockpit

### 1.4 Clasa D — Fals / incomplet azi

Un risc sau artefact intră aici dacă:
- pare rezolvabil prin document, dar flow-ul nu este complet
- există în generator, dar nu este acceptat la attach / Dosar
- există în intake ca `document request`, dar nu are motor real de Smart Resolve

---

## 2. Matricea adevărului pentru riscurile descoperite în onboarding / intake

Acesta este grupul principal pentru flow-ul:

`landing -> onboarding -> wizard findings -> smart resolve`

### 2.1 Riscuri care se pot rezolva real, documentar, în Smart Resolve

| Finding ID emis în intake | Titlu user-facing | Tip canonic | Document / dovadă | Verdict current truth | Observație |
|---|---|---|---|---|---|
| `intake-b2c-privacy` | Obligații privacy pentru clienți persoane fizice | `GDPR-001` | `privacy-policy` | `DOCUMENTAR REAL` | flow documentar complet în cockpit |
| `intake-gdpr-privacy-policy` | Politică de confidențialitate GDPR lipsă | `GDPR-001` | `privacy-policy` | `DOCUMENTAR REAL` | flow documentar complet în cockpit |
| `intake-site-privacy-policy` | Privacy policy lipsă de pe site | `GDPR-001` | `privacy-policy` | `DOCUMENTAR REAL` | flow documentar complet în cockpit |
| `intake-vendor-no-dpa` | DPA lipsă pentru furnizori care procesează date personale | `GDPR-010` | `dpa` | `DOCUMENTAR REAL` | flow documentar complet în cockpit |
| `intake-ai-missing-policy` | Politică de utilizare AI lipsă | `AI-005` | `ai-governance` | `DOCUMENTAR REAL` | flow documentar complet în cockpit |

### 2.2 Riscuri care NU trebuie tratate ca documentare, ci operațional sau handoff asistat

| Finding ID emis în intake | Titlu user-facing | Tip canonic | Dovadă reală care închide cazul | Verdict current truth | Observație |
|---|---|---|---|---|---|
| `intake-hr-job-descriptions` | Fișe de post lipsă sau incomplete | `GDPR-021` | pachet HR revizuit + urmă clară pentru rollout-ul pe roluri + fișe finale / notă | `SPECIALIST_HANDOFF REAL` | handoff în `Documente`, cu pachet HR și revenire automată în cockpit |
| `intake-hr-registry` | REGES / evidență contracte angajați | `GDPR-OPS` | export / confirmare operațională / notă auditabilă | `OPERAȚIONAL` | nu trebuie să se închidă din confirmare simplă |
| `intake-hr-procedures` | Proceduri interne angajați lipsă | `GDPR-OPS` | regulament / procedură încărcată sau notă auditabilă | `OPERAȚIONAL` | nu există generator real de `hr-procedures` |
| `intake-gdpr-dsar` | Proces DSAR lipsă | `GDPR-012` | procedură reală + owner desemnat + urmă clară | `SPECIALIST_HANDOFF REAL` | pachet DSAR real cu revenire automată în cockpit |
| `intake-ai-confidential-data` | Date confidențiale introduse în AI fără protecție | `AI-OPS` | regulă aplicată + training / policy / notă clară | `OPERAȚIONAL` | documentul poate ajuta, dar dovada principală este operațională |
| `intake-vendor-missing-docs` | Furnizori externi fără documentație | `GDPR-011` | vendor review + documente reale + notă clară | `SPECIALIST_HANDOFF REAL` | Vendor Pack real cu revenire automată în cockpit |
| `intake-site-cookies` | Cookies consent / policy lipsă | `GDPR-005` | banner corectat + rescan / screenshot | `OPERAȚIONAL` | generatorul de `cookie-policy` nu închide singur cazul |
| `intake-contracts-baseline` | Contracte standard lipsă sau incomplete | `GDPR-020` | template-uri reale + locație + folosire + urmă clară | `OPERAȚIONAL` | nu trebuie tratat ca document auto-generat |

### 2.3 Artefacte cerute de intake, dar fără Smart Resolve real astăzi

| Document request / idee | Există în intake? | Motor real de generare? | Flow complet cockpit -> Dosar? | Verdict |
|---|---|---|---|---|
| `contracts-template` | `DA` | `NU` | `NU` | `FALS / SUPPORT ONLY` |
| `hr-procedures` | `DA` | `NU` | `NU` | `FALS / SUPPORT ONLY` |
| `job-descriptions` | `DA` | `NU` | `NU` | `FALS / SUPPORT ONLY` |
| `dsar-procedure` | `DA` | `NU` | `NU` | `FALS / SUPPORT ONLY` |
| `vendor-docs` | `DA` | `NU` | `NU` | `FALS / SUPPORT ONLY` |

Regula de produs:
- aceste artefacte nu trebuie afișate ca și cum ar avea `Generate and resolve`
- pot exista ca recomandări, checklist-uri sau suport contextual
- nu pot fi vândute ca Smart Resolve documentar până nu au motor real

---

## 3. Riscuri documentare din aplicație, în afara onboarding-ului, care contează pentru adevărul cockpitului

### 3.1 Documentar real azi

| Tip canonic | Document | Verdict current truth | Observație |
|---|---|---|---|
| `GDPR-001` | `privacy-policy` | `DOCUMENTAR REAL` | generator + validare + confirmare + resolve + Dosar |
| `GDPR-010` | `dpa` | `DOCUMENTAR REAL` | generator + validare + confirmare + resolve + Dosar |
| `AI-005` | `ai-governance` | `DOCUMENTAR REAL` | generator + validare + confirmare + resolve + Dosar |

### 3.2 Documentar parțial sau condiționat

| Tip canonic | Document | Verdict current truth | De ce nu este încă adevăr complet |
|---|---|---|---|
| `GDPR-016` | `retention-policy` | `PARȚIAL / BLOCAT` | resolve page îl poate cere, generatorul există, dar `app/api/findings/[id]/route.ts` nu include încă `retention-policy` în `VALID_DOC_TYPES`, deci poarta de attach nu este completă |
| `GDPR-003` | `cookie-policy` | `PARȚIAL / NENATIV ÎN INTAKE` | generatorul există și kernelul știe mappingul, dar finding-ul principal din intake pentru cookies este `GDPR-005` operațional, nu `GDPR-003` documentar |
| `NIS2-015` | `nis2-incident-response` | `SUPORT, NU REZOLVARE DIRECTĂ` | documentul poate ajuta ca artefact, dar cazul real cere trimitere / referință oficială și follow-up extern |

### 3.3 Matrice canonică pentru `specialist_handoff`

| Tip canonic | Suprafață specialist | Current runtime truth | Target truth | Dovadă care trebuie să revină în cockpit |
|---|---|---|---|---|
| `GDPR-013` | `DSAR access` | `automatic` | `automatic` | verificare identitate + răspuns DSAR trimis |
| `GDPR-014` | `DSAR erasure` | `automatic` | `automatic` | execuție ștergere + răspuns trimis |
| `GDPR-019` | `ANSPDCP breach flow` | `automatic` | `automatic` | număr înregistrare ANSPDCP sau raționament documentat |
| `NIS2-001` | `NIS2 eligibility` | `automatic` | `automatic` | rezultat eligibilitate salvat |
| `NIS2-005` | `NIS2 assessment` | `automatic` | `automatic` | assessment salvat |
| `NIS2-015` | `NIS2 incident timeline` | `automatic` | `automatic` | referință early warning + incident legat |
| `NIS2-GENERIC` guvernanță | `NIS2 governance` | `automatic` | `automatic` | training / certificare salvată în registru |
| `NIS2-GENERIC` maturitate | `NIS2 maturity` | `automatic` | `automatic` | evaluare domeniu + plan salvat |
| `NIS2-GENERIC` furnizori | `NIS2 vendor registry` | `automatic` | `automatic` | revizuire furnizor + dovadă contractuală |

Regula înghețată:
- `specialist_handoff` nu înseamnă că userul ghicește drumul înapoi
- `specialist_handoff` înseamnă:
  - cockpitul pornește cazul
  - modulul specialist face pasul greu
  - sistemul readuce userul automat în același cockpit
  - cockpitul face închiderea oficială

---

## 4. Ce trebuie să facă UI-ul de acum înainte

### 4.1 Dacă riscul este `DOCUMENTAR REAL`

Ordinea obligatorie:
1. confirmi riscul
2. deschizi zona inline de generare
3. generezi draftul
4. rulezi validarea rapidă
5. aprobi uman documentul
6. folosești documentul pentru rezolvarea riscului
7. trimiți documentul la Dosar
8. cazul intră în monitorizare

### 4.2 Dacă riscul este `OPERAȚIONAL`

Ordinea obligatorie:
1. confirmi riscul
2. vezi exact măsura reală
3. aplici măsura în procesul real
4. adaugi dovada operațională clară
5. cazul intră în Dosar și monitorizare

Nu:
- generator fals
- document generic care nu închide cazul
- rezolvare din 1-2 butoane

### 4.3 Dacă riscul este `SUPORT / HANDOFF`

Ordinea obligatorie:
1. confirmi riscul
2. cockpitul explică ce se face și unde
3. handoff-ul te duce controlat în modulul specialist
4. sistemul te readuce automat în același cockpit
5. cockpitul îți arată dovada / referința adusă înapoi
6. atașezi confirmarea finală și închizi cazul

---

## 5. Reguli de produs care devin non-negotiable

### 5.1 Nu mai arătăm `Generează documentul de rezolvare` decât pentru clasa A

Este permis doar pentru:
- `GDPR-001`
- `GDPR-010`
- `AI-005`
- ulterior `GDPR-016`, doar după ce poarta de attach este completă

### 5.2 Nu mai cerem documente inexistente ca și cum ar fi flow real

Document requests fără motor real:
- rămân recomandări
- pot intra în `Dosar / checklist / suport contextual`
- nu pot apărea ca flow documentar de rezolvare

### 5.3 Nu mai închidem riscuri operaționale prin confirmare goală

Clasa B trebuie să ceară:
- notă clară
- fișier
- screenshot
- export
- link

după natura riscului

---

## 6. Ce trebuie rezolvat în sprinturi

### Sprint 2 — Snapshot / Home / Resolve truth

Introduce:
- copy scurt per risk, fără roman
- badge sau marker vizibil pentru tipul de flow:
  - `document`
  - `operațional`
  - `specialist_handoff`

Scop:
- userul să înțeleagă din listă ce fel de rezolvare urmează

### Sprint 3 — Cockpit truth

Obligatoriu:
- aliniere completă a cockpitului la această matrice
- eliminare generator de pe riscurile din clasa B și C
- păstrare generator doar pe clasa A
- reparare `GDPR-016 / retention-policy` până la flow complet

### Sprint 4 — Dosar / Monitoring / Reopen truth

Obligatoriu:
- Dosarul să arate tipul real de dovadă per clasă
- monitoring să păstreze urmele diferit pentru:
  - documente
  - dovezi operaționale
  - handoff-uri

### Sprint 7 — Full live matrix QA

Trebuie testate live, cap-coadă:
- toate riscurile din clasa A
- toate riscurile din clasa B descoperite în intake
- toate handoff-urile controlate din clasa C

---

## 7. Verdict executiv

Adevărul înghețat de azi este:

- Smart Resolve documentar real există, dar pe un set mic și clar de riscuri
- multe riscuri din onboarding NU sunt documentare și nu trebuie forțate în generator
- câteva artefacte sunt promise prea devreme și trebuie retrogradate la suport contextual
- până nu respectăm această matrice, produsul va continua să mintă despre „rezolvare”

Formula corectă:

`nu pornim de la document -> pornim de la dovada care închide riscul`
