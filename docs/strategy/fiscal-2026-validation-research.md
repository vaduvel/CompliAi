# Validare 2026 — Modulul fiscal CompliScan vs realitatea pieței

**Data:** 2026-05-10
**Surse:** ANAF, MF, Universul Fiscal, CECCAR, Avocatnet, Cabinet Expert, StartupCafe, contabilul.manager.ro, sagasoftware.ro, pfassist.ro, dreptclar.ro

## TL;DR

Modulul fiscal CompliScan acoperă pain-uri reale validate de piață, dar **3 elemente legale au evoluat în 2026** și au necesitat corecții imediate:

1. **Termen e-Factura unificat la 5 zile lucrătoare** (B2B + B2C + B2G) — OUG 89/2025, în vigoare 1 ian 2026
2. **Notificarea de conformare RO e-TVA ELIMINATĂ** — OUG 13/2026, M.Of. 181 / 9 mar 2026
3. **PFA / CNP individuali** — obligație e-Factura postpusă la 1 iun 2026, registrare via Form 082 până la 26 mai 2026 (Ordin ANAF 378/2026)

Toate trei sunt acum reflectate corect în `efactura-validator.ts` + `efactura-fines-calculator.ts`. **83/83 fiscal tests pass** cu noile reguli.

---

## 1. Calendar legislativ 2026 (validat)

| Act | Data | Efect |
|---|---|---|
| **OUG 52/2025** | 2025 → 1 iun 2026 | Fermierii regim agricol special — exempt e-Factura până la 1 iun 2026 |
| **OUG 89/2025 ("trenuleț")** | 1 ian 2026 | (a) Termen e-Factura **5 zile lucrătoare** unificat B2B+B2C+B2G. (b) Elimină obligația de răspuns la notificare conformare e-TVA + sancțiunile aferente |
| **OG 6/2026** | feb 2026 | Postpune obligația e-Factura pentru CNP individuali la 1 iun 2026 |
| **OUG 13/2026** | M.Of. 181 / 9 mar 2026 | **ELIMINĂ oficial** notificarea de conformare RO e-TVA (modifică Art. 5, 8, 16 OUG 70/2024). Decontul precompletat P300 RĂMÂNE ca data feed |
| **Ordin ANAF 378/2026** | M.Of. 250 / 31 mar 2026 | Actualizează Form 082 + procedură registrare CNP. Deadline 26 mai 2026 |
| **e-Transport sancțiuni full** | 1 ian 2026 | Perioada de grație 2025 încheiată; amenzi complete |
| **SAF-T D406 toate categoriile** | încă din 2025 | Lunar/trimestrial conform perioadei TVA |

## 2. Pain points validați (top 15)

Validați cu surse multiple (forumuri contabili, Saga, PFAssist, manager.ro, republica.ro):

1. **"Element necunoscut (Invoice) in namespace"** — false positive notoriu; aceeași factură retransmisă merge
2. **CUI desync ANAF/registru comerțului 24-48h** — companii noi încă necunoscute în e-Factura
3. **Duplicate transmissions** — aceeași factură apare 96+ ori în SPV cu ID-uri diferite (bug din 2022)
4. **Cert digital recognition lag >24h** după renew blochează transmiterea
5. **OAuth token regen failures** intermitente, fără transparență
6. **Rate limit mismatch** — docs spun 100 inv/min, real ~60/min; download 500/zi fără paginare documentată
7. **Termen 5 zile lucrătoare conflict cu cycle-uri plată** — forțează transmiterea înainte de confirmare client
8. **15% penalitate bilaterală B2B** când nu se folosește e-Factura — risc bidirecțional
9. **Zero alerte status sistem** la downtime ANAF — contabilii descoperă prin încercări
10. **Confuzie SPV PDF vs XML** — multe firme tratează PDF-ul ca document legal (e XML-ul semnat MF)
11. **B2C TVA dedus** — facturi simplificate, bonuri, reguli neclare
12. **Server time GMT vs EET** cauzează aparent late filings
13. **Cross-border PFA/SRL → non-resident** — incertitudine aplicare e-Factura
14. **Burnout contabili** — quote 27 ani vechime: *"am ajuns la capătul puterilor. Nu mai pot psihic să suport stresul acestor modificări"*
15. **70 dificultăți practice** identificate în articol manager.ro (paywalled, top 12 confirmă lista de mai sus)

## 3. Cross-check: cod CompliScan vs realitate 2026

### ✅ CONFIRMATE corecte

- **Validator UBL CIUS-RO** V001-V011 — match cu erorile validate de Saga/PFAssist
- **Auto-repair V002, T003** — pain-uri reale rezolvate (CustomizationID lipsă, encoding XML)
- **Calculator amenzi 5K-10K mari / 2.5K-5K mijlocii / 1K-2.5K mici** — match research independent
- **SAF-T hygiene + D300/D394 draft** — funcționalitate lipsă la SmartBill/Saga/Oblio
- **Cron retry queue ANAF** — rezolvă pain-ul "OAuth token regen intermitent"
- **AnafTemplatesDrawer** 8 templates — aplicabil pentru notificări istorice (pre-9 mar 2026)
- **False conformance detector** — relevant pentru notificări istorice

### ✅ CORECTAT în acest commit

- **B2B termen**: era 5 zile calendaristice, acum **5 zile lucrătoare** post-2026-01-01 (OUG 89/2025)
- **B2C termen**: confirmat 5 zile lucrătoare (regulă unificată)
- **e-TVA `etva_neresponded`**: marcat ca **[LEGACY]** cu disclaimer că obligația e ELIMINATĂ post-9 mar 2026; comparator D300 vs P300 încă valoros pentru audit prep
- **Violation types noi**: `efactura_b2b_15pct` (penalitate bilaterală 15%), `pfa_cnp_neinregistrat` (Form 082)

### ⚠️ GAP-uri identificate (nu critice, candidați pentru sprint următor)

1. **e-Transport** — Pain real (sancțiuni LIVE din 1 ian 2026, GPS streaming, UIT 5/15 zile). NU avem features dedicate.
2. **Form 082 PFA/CNP registration tracking** — Avem doar violation type; lipsește un tab/cron care alertează pe cabinete cu PFA-clienți să verifice registrarea.
3. **SPV 60-day archive** — Companiile pierd accesul după 60 zile dacă nu salvează. NU avem feature de auto-archive XML local/Supabase.
4. **15% bilateral penalty calculator** — Avem violation type; lipsește calcul automat la introducerea unei facturi netransmise (% x valoare).
5. **Status system ANAF** — Pain "zero alerte downtime"; am putea adăuga un health-check dashboard.

## 4. Concurență 2026 — wedge confirmat

| Tool | Preț | Ce face | Ce NU face |
|---|---|---|---|
| **SmartBill** | 5.84-16.32 €/lună | Emisii + 99.99% pre-validation, e-Factura | ❌ FĂRĂ auto-repair, FĂRĂ e-TVA workflow, FĂRĂ SAF-T hygiene, FĂRĂ cross-check ANAF |
| **Saga** | 4-12 €/lună amortizat | Emisii + forum erori | ❌ NU validare proactivă, NU workflow notificări |
| **Oblio** | 29 €/an = 2.49 €/lună | Emisii unlimited (free 12 luni) | ❌ Doar emisii, fără cross-check |
| **eConta** | 49 €/lună | Contabilitate clienți finali | ❌ Nu cabinete, fără cross-check ANAF |
| **Pagero/Tungsten** | 1k-10k €/lună | Enterprise | ❌ Nu IMM/cabinete |

**Wedge CompliScan confirmat**: auto-repair erori + e-TVA D300vsP300 + SAF-T scoring + cron monitor + bibliotecă răspunsuri ANAF — niciun concurent nu acoperă acest stack pentru cabinete CECCAR cu 30-300 clienți.

## 5. Recomandări post-validare

### Acțiuni cod (sprint următor, ~3-5 zile):
- [ ] Adaugă `e-Transport` module (UIT lifecycle + GPS streaming awareness)
- [ ] Adaugă `pfa-cnp-tracker` — cron care verifică clienții PFA înainte de 26 mai 2026
- [ ] Adaugă `spv-archiver` — auto-download XML din SPV în Supabase storage
- [ ] Calculator: 15% bilateral B2B penalty automat la introducerea unei facturi netransmise

### Acțiuni marketing:
- Mesaj cheie: "**Avem actualizat 2026** — codul nostru reflectă OUG 89/2025 + OUG 13/2026 + OG 6/2026 corect, spre deosebire de soluții care încă spun 'răspunde la notificarea e-TVA în 20 zile' (eliminată)"
- Hook de outreach: cita din contabil 27 ani — *"am ajuns la capătul puterilor"* — pozitionare CompliScan ca tool care reduce stresul, nu adaugă încă unul
- Lead magnet adițional: "Termen e-Factura 2026 — calculator zile lucrătoare cu sărbători RO" (extracție din `efactura-validator.ts`)

## 6. Surse cheie (verificate 2026-05-10)

1. [OUG 89/2025 — Lege5](https://lege5.ro/Gratuit/ge3tomzqgmytc/ordonanta-de-urgenta-nr-89-2025-pentru-modificarea-si-completarea-legii-nr-227-2015-privind-codul-fiscal)
2. [OUG 89/2025 PDF — ANAF](https://static.anaf.ro/static/10/Anaf/legislatie/OUG_89_2025.pdf)
3. [OUG 13/2026 elimină notificare e-TVA — Cabinet Expert](https://www.cabinetexpert.ro/2026-03-12/oug-nr-13-2026-modificari-la-cesiunile-de-parti-sociale-la-accize-la-codul-de-procedura-fiscala-precum-si-anularea-notificarii-de-conformare-ro-e-tva.html)
4. [Avocatnet — Notificarea e-TVA dispare oficial](https://www.avocatnet.ro/articol_71491/Notificarea-de-conformare-pentru-e-TVA-dispare-oficial-dar-decontul-precompletat-de-TVA-se-pune-la-dispozi%C8%9Bie-in-continuare.html)
5. [Form 082 + Ordin ANAF 378/2026 — StartupCafe](https://startupcafe.ro/oficial-e-factura-pentru-persoane-fizice-formularul-de-inregistrare-082-cu-instructiunile-de-completare-in-ordinul-anaf-378-2026-97263)
6. [70 dificultăți practice — manager.ro](https://contabilul.manager.ro/a/29352/e-factura-70-de-dificultati-intalnite-in-practica-de-contabili-iata-ce-solutii-ofera-expertii.html)
7. [SAGA — e-Factura erori](https://www.sagasoftware.ro/e-factura-erori-si-probleme/)
8. [PFAssist — Erori frecvente XML](https://www.pfassist.ro/blog/erori-frecvente-xml-efactura-anaf-rezolvare.php)
9. [Republica — calvarul antreprenorilor](https://republica.ro/e-factura-calvarul-antreprenorilor-zsistem-nefunctional-zspv-plin-de-erori-zmii-de-facturi-pe-care-nu)
10. [Universul Fiscal — OG 6/2026](https://universulfiscal.ro/og-6-2026-modificari-recente-in-domeniul-fiscalitatii-si-in-cel-al-ro-factura/)
11. [Contabilul.manager — termen 5 zile lucrătoare](https://contabilul.manager.ro/a/29770/e-factura-2026-de-la-1-ianuarie-termenul-de-transmitere-a-facturilor-este-de-5-zile-lucratoare.html)
12. [DreptClar — e-Factura și e-Transport](https://dreptclar.ro/e-factura-si-e-transport/)
13. [Fiscalitatea.ro — termene SAF-T 2026](https://www.fiscalitatea.ro/termene-saf-t-2026-24629/)

---

**Concluzie:** Modulul fiscal CompliScan e **validat de piață și aliniat cu realitatea legală 2026**. Wedge-ul vs concurență e clar (SmartBill/Saga/Oblio NU au auto-repair + e-TVA flow + SAF-T scoring). 5 gap-uri minore identificate (e-Transport, PFA tracker, SPV archive, 15% calculator auto, status ANAF dashboard) — candidate pentru sprint-ul următor, dar NU blockers de launch.
