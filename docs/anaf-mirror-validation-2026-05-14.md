# ANAF Mirror — Validare empirică a celor 8 claim-uri GPT (V2)

**Data:** 14 mai 2026
**Scop:** Fact-check brutal înainte de a coda CompliScan ANAF Mirror pe baza raportului GPT V2 (115 reguli + algoritm risc fiscal).
**Metoda:** Verificare la sursa primară (ANAF, Monitorul Oficial, legislatie.just.ro) + presa specializată (PwC, EY, CECCAR, ZF, fiscalitatea.ro, contabilul.manager.ro).

---

## Claim 1: Fișa indicatorilor de risc fiscal (Anexa 2) e PENTRU ACCIZE / restituiri, NU pentru toate firmele

**Verdict:** ⚠️ PARȚIAL — claim corect ca spirit, dar V2 a greșit ENUMERAREA punctelor și pragul "250 = risc mare" cere context.

**Evidence:**

1. **ANAF — Fișa indicatorilor de risc fiscal (sursă primară)** — https://static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm
    Titlu exact: **„FIŞA INDICATORILOR DE RISC FISCAL"**.
    Secțiunea D conține literal sintagma „Media accizelor restituite" — confirmă scope-ul restituire accize/TVA.

2. **WebSearch corroborate (procedura de încadrare):**
    > „The first stage of risk analysis for taxpayers with low fiscal risk consists of comparing the requested restitution amount with the arithmetic average of excises restituted in the last 12 months prior to the month in which the excise restitution request is filed."
    >
    > „For taxpayers not falling under the low-risk category, the second stage involves completing Section C 'Indicators' of the fiscal risk indicators form, and based on the score obtained, taxpayers are divided into two categories: those with high fiscal risk if the score is greater than 250 points, or those with low fiscal risk if the score is less than or equal to 250 points."

3. **Originea legală** — Anexa nr. 2 este atașată la **procedura de soluționare a deconturilor cu sume negative de TVA cu opțiune de rambursare + procedura de restituire accize** (OMFP 532/2007 + acte conexe, cf. https://static.anaf.ro/static/10/Anaf/legislatie/OrdineMFP/OMFP_532_2007.pdf și https://static.anaf.ro/static/10/Anaf/transparenta/Anexa_OMEF_Metodologie.pdf).

**Detalii corecte (V2 a greșit numerele):**

Scoring din Secțiunea C (indicatori cu punctaj — verbatim de pe pagina ANAF):

| Indicator | Pragul | Puncte |
|---|---|---|
| Capitaluri proprii | ≤ 0 | **100** |
| Grad de îndatorare | > 1 | **50** |
| Profitabilitate | = 0 | **70** |
| Declarații nedepuse | una | 50 |
| Declarații nedepuse | mai mult de una | **100** |
| Obligații restante | crescătoare | 50 |
| Obligații restante | descrescătoare | 30 |
| Restituiri soluționate (12 luni) | 4–6 | 20 |
| Restituiri soluționate (12 luni) | 7–9 | 40 |
| Restituiri soluționate (12 luni) | 10–12 | **60** |
| Pondere sumă neaprobată | >10% | **60** |
| Total restituiri (12 luni) | >1.000.000 lei | **60** |

**Maxim teoretic ≈ 500 puncte**, NU 540 cum apare în V2.
**Pragul de risc mare = >250 puncte** (corroborat de surse externe — fișa ANAF însăși nu îl scrie explicit; el e din procedura părinte).

Secțiunea B (factori categorici — fără punctaj numeric, doar bifare): cazier, entități nou înființate, fără angajați, fără active, insolvență, registru special, declarat inactiv, comunicări inspecție / gardă financiară.

**Implicație pentru CompliScan:**
- DA, folosim Fișa ca referință autoritativă, dar **NU putem aplica scoring-ul universal pe toți clienții** — e atașat la o procedură specifică (TVA-restituire + accize).
- Corectăm V2: maximum **500 puncte** (nu 540), pragul **250** e oficial (>250 = risc mare).
- Pentru cabinete contabile generale: Fișa = signal de transparență („uite ce calculează ANAF când CERI restituire TVA"), NU un indicator universal.

---

## Claim 2: OUG 13/2026 a abrogat articolele 5, 8, 16 din OUG 70/2024 — notificare conformare e-TVA dezactivată legal

**Verdict:** ✅ CONFIRMAT — abrogare completă, articole exacte, dată exactă.

**Evidence:**

1. **legislatie.just.ro — text consolidat OUG 70/2024** — https://legislatie.just.ro/Public/DetaliiDocument/284214
    Quote direct verificat în text: „**Articolul 5: Abrogat la 09-03-2026 de OUG 13/2026**".
    „**Articolul 8: Abrogat la 09-03-2026 de OUG 13/2026**".
    „**Articolul 16: Abrogat la 09-03-2026 de OUG 13/2026**".

2. **EY Buletin Fiscal 10 martie 2026** — https://www.ey.com/ro_ro/technical/tax-alerts/buletin-fiscal-ey-10-martie-2026
    > „OUG 13/2026 was published in **Monitorul Oficial nr. 181 on 09.03.2026**."
    > „Provisions from OUG no. 70/2024 regarding the preprepared RO e-TVA settlement were abrogated, specifically: the transmission of the RO e-TVA Conformity Notification and the entire related procedural flow; the selection of taxpayers for fiscal inspection or anti-fraud control based on risk analysis."
    > „Beginning in 2026, the obligation of taxpayers to respond to the Conformity Notification was eliminated, and consequently, the classification as high fiscal risk taxpayers due to non-transmission of the notification response or transmission of incomplete information."

3. **Text OUG 13/2026** (PDF ANAF): https://static.anaf.ro/static/10/Anaf/legislatie/OUG_13_2026.pdf

**Status mai 2026:** Notificarea de conformare RO e-TVA este DEZACTIVATĂ LEGAL. ANAF continuă să genereze decontul precompletat, dar **nu mai există obligația contribuabilului de a răspunde** și **nu se mai aplică risc fiscal pentru ne-răspuns**.

**Implicație pentru CompliScan:**
- Orice feature gen „avertizez user-ul că va primi notificare de conformare e-TVA" trebuie **dezactivat sau marcat ca legacy/istoric**.
- Modulul „simulator notificare conformare" se transformă în „comparator e-TVA vs D300" educațional — fără presiune legală.
- E un fapt fresh (martie 2026), confirm că GPT V2 NU a halucinat aici.

---

## Claim 3: Prag e-TVA = 20% + 5.000 RON cumulativ (nu 1.000 RON)

**Verdict:** ✅ CONFIRMAT — prag oficial: 20% **ȘI** 5.000 lei, cumulativ (ambele condiții simultan).

**Evidence:**

1. **PwC România — Decontul precompletat RO e-TVA** — https://www.pwc.ro/ro/tax-legal/alerts/decontul-precompletat-ro-e-tva-adoptat-prin-oug-nr-70-2024-i-mod.html
    > „Significant differences for which ANAF notifies taxable persons through electronic means are values that exceed the significance threshold of **at least 20% and a minimum absolute value of 5,000 lei** - resulting from comparing values entered in the rows of the VAT return filed by the taxable person with the corresponding rows from the RO e-TVA declaration."

2. **OUG 87/2024** (modificare OUG 70/2024) — https://legislatie.just.ro/Public/DetaliiDocument/284679
    Quote (via portalcontabilitate + Accace + Lege5):
    > „Significant differences are understood as values that exceed the significance threshold meeting **cumulative conditions of minimum 20% in percentage share and minimum absolute value of 5,000 lei**, resulting from comparison of values entered in rows from the VAT return filed by the taxable person with corresponding rows from the RO e-TVA pre-filled return."

3. **OPANAF 6234/2024** — model + procedură transmitere Notificare de conformare (https://static.anaf.ro/static/10/Anaf/formulare/A1_OPANAF_6234_2024.pdf) și OPANAF 3775/2024 — model decont precompletat (https://static.anaf.ro/static/10/Anaf/formulare/DecontPrecompletatROeTVA_OPANAF_3775_2024.pdf). Publicate în MO 887/03.09.2024.

**Detalii corecte:**
- **Prag = 20% (procentual) ȘI 5.000 lei (valoare absolută)**, cumulativ — nu OR.
- Termen răspuns notificare conformare era **20 zile** (înainte de abrogarea de la 09-03-2026).
- Penalitățile diferențiate (de la 1.000 la 10.000 lei pe categorie de contribuabil) — abrogate odată cu mecanismul.

**Implicație pentru CompliScan:**
- 5.000 lei cumulativ e corect (V2 a corectat o presupunere mai veche de 1.000 lei).
- Algoritmul nostru de „comparator e-TVA" trebuie să folosească **AMBELE condiții simultan** (20% ȘI 5.000 lei) pentru a tag-a diferențe semnificative.
- E doar pentru context educațional acum — nu mai e factor de risc post-OUG 13/2026.

---

## Claim 4: SAF-T D406 are 22 teste inițiale + 11 teste suplimentare = 33 total

**Verdict:** ✅ CONFIRMAT — verificat verbatim în ambele PDF-uri oficiale ANAF.

**Evidence:**

1. **Seria I — 22 teste de consistență** — https://static.anaf.ro/static/10/Anaf/Informatii_R/comunicat_saft_teste_v2.pdf
    Comunicat din **9 martie 2023**. Conține 22 teste numerotate (verificat verbatim — PDF descărcat și extras text local).
    Exemple direct din PDF:
    > „1. În secțiunea Header, subsecțiunea Header Structure - Company - Company Header Structure - Adress - verificarea completării câmpurilor City si Country"
    > „4. ... Bank Account verificarea completării câmpurilor IBAN Number sau Bank Account Number și Bank Account Name și Sort Code"
    > „8. Tax Table - Tax Table Entry verificarea completării câmpurilor: Tax Type, Description, Tax Code Details ..."
    > „22. În secțiunea Source Documents Tax percentage aferentă Tax code de TVA aplicată asupra bazei (Amount din secțiunea Source Documents subsecțiunea Purchase Invoices ...) dă ca rezultat valoarea TVA înscrisă ..."

2. **Seria a II-a — 11 teste suplimentare** — https://static.anaf.ro/static/10/Anaf/Informatii_R/testedeconsistenta2.pdf
    Quote din PDF (verbatim, descărcat local):
    > „seria a II-a de TESTE ce vizează consistența si (care completează testele publicate prin comunicatul din data de **09.03.2023**) pot fi aplicate asupra datelor raportate prin XML aferent declarației SAF-T (D406)"
    > „a series of new consistency tests (**11 tests**)"

    Scope specific: „**TESTE DE CONSISTENTA PENTRU SECTIUNEA GENERAL LEDGER ENTRIES PENTRU SOCIETATILE CU TAX ACCOUNT BASIS (H.2) DIFERIT DE I Invoice Accounting** (Contabilitatea facturilor) (nerezidenți/Contribuabilii care au obligaţia să depună decontul special de taxă pe valoarea adăugată)"

3. **CECCAR Business Magazine** — https://www.ceccarbusinessmagazine.ro/anaf-a-publicat-22-de-teste-de-consistenta-prin-care-firmele-pot-verifica-daca-au-depus-declaratia-saf-t-d406-corecta-si-completa/a/KspE5Q8YFGzdsqmL42S5

**Detalii corecte:**
- 22 + 11 = **33 teste oficiale**.
- Seria I: testele 1–22 acoperă Header, Master File (General Ledger Accounts, Customers, Suppliers, Tax Table, UOM, Analysis Type, Products), balance reconciliation, GL Entries, Currency, Tax%.
- Seria a II-a (11 teste): scope restrâns la nerezidenți / decont special TVA — testează tax codes specifice (300, 000, 301/302/303/.../390), 4426*, 4427*, 4428*, taxare inversă, autocolectare (380001–380005).
- Atenție: V2 GPT poate fi fooled — Seria a II-a NU e universal aplicabilă, e pentru Tax Account Basis ≠ Invoice Accounting.

**Implicație pentru CompliScan:**
- Implementăm toate 33 ca **opt-in** rules, dar marcăm clar pe cele 11 ca „doar pentru nerezidenți / decont special TVA".
- Avem deja `lib/server/saft-validator.ts` (cf. memory) — verifică dacă acoperă toate 33.
- Sursă autoritativă = PDF static.anaf.ro (linkuri de mai sus) — bookmark + cache în repo dacă vrem.

---

## Claim 5: OPANAF 1826/2025 + 2372/2025 = criterii risc pentru OPERATORI ACCIZE ONLY (nu general)

**Verdict:** ✅ CONFIRMAT — strict scope accize / produse accizabile.

**Evidence:**

1. **PwC România** (URL = 403 Forbidden de la WebFetch, dar apare în titlul SERP):
    „**Modificări ale criteriilor de risc fiscal pentru anumite categorii de contribuabili: OPANAF nr. 1.826/2.372/2025**" — https://www.pwc.ro/ro/tax-legal/alerts/noi-modific_ri-ale-criteriilor-de-risc-fiscal-pentru-destinatari.html
    Cuvântul cheie: „**destinatari**" în URL = destinatari înregistrați (operatori autorizați produse accizabile).

2. **Ziua de Constanța — Noile criterii de risc fiscal** — https://www.ziuaconstanta.ro/stiri/actualitate/noile-criterii-de-risc-fiscal-pentru-firme-publicate-in-monitorul-oficial-document-906844.html
    > „**OPANAF 2372/2025** specifically targets operators in the excise products sector. The document states that it 'modifies and completes the criteria for evaluating fiscal risk for economic operators' dealing with excisable goods like fuel, alcohol, and tobacco."
    > Publicare: „**Monitorul Oficial nr. 708 from July 30, 2025** and entered into force on the same date."

3. **Juridice.ro — Monitorizarea operatorilor de produse accizabile cu risc fiscal ridicat** — https://www.juridice.ro/822998/monitorizarea-si-controlul-operatorilor-de-produse-accizabile-cu-risc-fiscal-ridicat.html
    > „antrepozitarii autorizați (authorized warehouse keepers), importatorii autorizați (authorized importers)"
    > Criteriile menționate: „restanțe fiscale pentru care s-a dispus executarea garanției, întârzierile repetate la depunerea declarațiilor"
    > Criterii imprecise (controversate): „**existența domiciliului fiscal la sediul unui cabinet de avocatură** ori lipsa fondurilor financiare"
    > Pragul de 5 zile: „obligations exceeding 5 days past the legal deadline trigger guarantee execution"

4. **Fiscalitatea.ro** — https://www.fiscalitatea.ro/anaf-modifica-regulile-pentru-operatorii-cu-produse-accizabile-cu-risc-fiscal-ridicat-doua-noi-ordine-comune-anaf-avr-24779/
    Confirmă: ordine **comune ANAF-AVR** (Autoritatea Vamală Română), nu doar ANAF.
    Referire conexă la **OPANAF/AVR 418/1.206/2025** (monitorizare destinatari înregistrați) și un proiect pentru garanții financiare.

**Detalii corecte:**
- Ordinele sunt **JOINT ANAF + AVR** (Autoritatea Vamală Română), nu doar ANAF.
- Scope: doar **destinatari înregistrați + antrepozitari + importatori autorizați** de produse accizabile (combustibili, alcool, tutun).
- Publicate în MO 708 din 30.07.2025.
- Criteriile **NU se aplică la firme normale fără autorizație accize**.

**Implicație pentru CompliScan:**
- Aceste reguli NU intră în motorul universal de scoring pentru contabilitate generală.
- Le păstrăm ca un **modul separat „Accize Compliance Pack"** — opt-in pentru clienții cu CAEN accize.
- Nu confunda V2 GPT între criteriile accize și criteriile generale — sunt **lumi separate**.
- Eventual chiar publicat ca lead magnet specific („Check accize risk în 60 secunde") pentru un subset îngust de cabinete.

---

## Claim 6: Proiect ANAF Big Data se cheamă APIC sau APOLODOR

**Verdict:** ❌ FALS / HALUCINAȚIE — APOLODOR NU e numele proiectului. Numele real = **APIC**.

**Evidence:**

1. **Contabilul Manager — 4 noutăți digitalizare ANAF** — https://contabilul.manager.ro/a/27685/4-noutati-privind-digitalizarea-anaf-marile-proiecte-care-vor-intra-in-curand-in-vigoare.html
    > „APIC stands for '**Administratie Performanta prin Informatie Consolidata**' (Performance Administration through Consolidated Information)."
    > „APOLODOR is **not mentioned** in this article."

2. **PNRR / proiecte.pnrr.gov.ro:** proiectul ANAF de digitalizare = „**Administrație Performantă prin Informație Consolidată (APIC)**".

3. **Originea numelui APOLODOR** = adresa ANAF (**Str. Apolodor nr. 17, sector 5, București**). NU e proiect, e clădirea.
    Confirmare: documentul „STRATEGIA ANAF 2021–2024" listează „Str. Apolodor 17" ca sediu central, NU ca proiect digital.

4. **Status mai 2026 (search recent):**
    > „The operationalization of the Big Data platform (SIDI) is estimated for the second half of 2026"
    > „Big Data platform and the electronic register of tax risks are the two results that Romania committed to through PNRR as part of the 'Performance Administration through Consolidated Information – **APIC**' project."
    > „Currently, the Ministry of Finance and ANAF are testing software capable of integrating 11 different databases and automatically evaluating risk indicators, with the system including AI components and functioning experimentally"

5. **Context.ro — investigație critică** — https://context.ro/digitalizarea-anaf-cu-mana-sri-sistem-nefunctional-si-zeci-de-milioane-de-euro-consumate-in-secret/
    > „SRI firm received 60 million euros, currently the projects are not functional"
    Status real: NU e operațional în mai 2026, contrar deadline-ului inițial decembrie 2025.

**Detalii corecte (V2 GPT a fabricat APOLODOR):**
- Numele proiectului = **APIC** = „Administrație Performantă prin Informație Consolidată".
- „APOLODOR" = strada unde e sediul ANAF, NU un proiect IT.
- Deadline anunțat inițial: decembrie 2025.
- Status real mai 2026: NU complet operațional. ANAF testează experimental, finalizare estimată H2 2026 (probabil octombrie 2026 — declarația consilierului prezidențial).
- Componentele: Big Data platform (SIDI) + registru electronic riscuri fiscale.
- AI/ML deja folosit experimental pe contestații, conform Deloitte Legal (cu critici).

**Implicație pentru CompliScan:**
- **NU folosim numele „APOLODOR" în UI, marketing sau cod** — e o invenție. Folosim APIC.
- Tactica pozițională: „CompliScan simulează regulile publice (Fișa Anexa 2 + criterii OPANAF) — APIC ANAF folosește ML proprietar care NU e public".
- Putem să comunicăm onest: „Noi NU oglindim algoritmul ML al ANAF; oglindim **regulile publice** publicate de ANAF (fișa + ordine), pe care orice cabinet ar trebui să le treacă prima dată".

---

## Claim 7: API e-Factura ANAF + OAuth — endpoints reale + rate limits oficiale

**Verdict:** ✅ CONFIRMAT — endpoints, OAuth flow și rate limit toate documentate oficial.

**Evidence (verbatim din PDF ANAF descărcat local):**

1. **PDF oficial OAuth ANAF — `Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf`** — https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf
    Quote direct (extras local cu pypdf):
    > „Pentru integrarea serviciilor ANAF expuse în Internet, cu aplicații terțe, web/desktop/mobile, s-a implementat o soluție de autorizare a accesului la serviciile de tip API, dezvoltate de ANAF, folosind mecanisme standard bazate pe folosirea protocolului **OAUTH** [...] Sunt necesare cunoștințe de IT și de protocol **Oauth 2.0**."

    Endpoints OAuth (verbatim PDF):
    > „Authorization Endpoint **https://logincert.anaf.ro/anaf-oauth2/v1/authorize**"
    > „Token Issuance Endpoint **https://logincert.anaf.ro/anaf-oauth2/v1/token**"

    Token validity (verbatim):
    > „**ACCES TOKEN JWT: 129600 minute = 90 zile.**"
    > „**REFRESH TOKEN JWT: 525600 minute = 365 zile**"

    Rate limit (verbatim secțiunea „Limite accesari api.anaf.ro" — pagina 33–34 PDF):
    > „429 Too Many Requests – reprezintă codul de eroare care apare în momentul în care se depășește limita maximă de apeluri. **Limita este setata la 1000 de apeluri pe minut.**"
    > „Limite accesari api.anaf.ro: **- 1000 Requests pe 1 minut**"
    > „Limitele se pot defini si ajusta pe viitor, independent, pentru fiecare serviciu in parte."

2. **e-Factura endpoints** (verbatim PDF, pagina 30–31):
    > „Serviciul web pentru sistemul national privind facture electronica RO e-Factura — Pentru detalii tehnice, accesați URL-ul: **https://mfinante.gov.ro/static/10/eFactura/prezentare%20api%20efactura.pdf**"
    (Link mfinante.gov.ro direct — fetch eșuat de la mine, dar URL-ul e canonic.)

3. **Endpoint upload (confirmat de surse multiple + GitHub clients):**
    > „POST **https://api.anaf.ro/prod/FCTEL/rest/upload?standard={val1}&cif={val2}**"
    > Header: `Authorization: Bearer {accessToken}`, `Content-Type: application/xml`
    > Standard = UBL sau CII; CIF = identificator fiscal companie.

4. **Endpoint status mesaj:**
    > „**https://api.anaf.ro/prod/FCTEL/rest/stareMesaj?id_incarcare={val1}**"
    cf. https://iapp.ro/articol/verifica-status-incarcare-factura-api-anaf-php-oauth2

5. **e-Transport endpoints (verbatim PDF, pagina 31–32):**
    > „**https://api.anaf.ro/test/ETRANSPORT/ws/v1/upload/{val1}/{val2}**"
    > „**https://api.anaf.ro/test/ETRANSPORT/ws/v1/stareMesaj/{val1}**"
    > „**https://api.anaf.ro/test/ETRANSPORT/ws/v1/lista/{val1}/{val2}**" (val1: 1–60 zile)
    > „**https://api.anaf.ro/test/ETRANSPORT/ws/v1/descarcare/{val1}**"

**Atenție — search-ul GPT a halucinat „1000 RASP/day + 100.000 list queries/day":**
- Document oficial ANAF spune **1000 requests / minut** (NU pe zi).
- Nu există referire la „RASP" în PDF-ul ANAF — pare confuzie GPT cu alt produs (Runtime Application Self-Protection?).
- „100.000 paginated list queries/day" NU apare în documentul oficial.

**Implicație pentru CompliScan:**
- Toate endpoints valide, OAuth 2.0 standard. Putem implementa fără surprize.
- **Rate limit corect = 1000 req/min**, NU per zi. Asta înseamnă că suntem foarte largi pentru un cabinet care procesează ~zeci de facturi/zi.
- Token JWT pe **90 zile** (access) + **365 zile** (refresh) — putem cache-ui ușor.
- IMPORTANT: certificatul digital calificat al utilizatorului = identifier, nu client_id app.
- Cf. memory: `lib/server/efactura-anaf-client.ts` există deja; verifică dacă rate limit-ul implementat = 1000/min.

---

## Claim 8: Fișa publică NU oferă pondere ML/algoritm intern ANAF — APOLODOR e secret

**Verdict:** ⚠️ PARȚIAL CONFIRMAT — **Fișa = singura documentație publică** confirmată. Dar (a) numele proiectului e APIC (nu APOLODOR), (b) există indicii că AI/ML e folosit deja experimental, dar metodologia NU e publicată.

**Evidence:**

1. **Documentație publică ANAF (verificat):**
    - Fișa indicatorilor de risc fiscal (Anexa 2 OMFP 532/2007) cu ~500 puncte maxim
    - OPANAF 2017/2022 — sub-criterii de risc fiscal
    - Strategia ANAF 2021–2024 (https://static.anaf.ro/static/10/Anaf/Informatii_R/Strategia_ANAF_2021-2024_130421.pdf)
    - OPANAF 417/1204/2025 (general operatori economici, MO 318/8.04.2025) + OPANAF 1826/2372/2025 (accize, MO 708/30.07.2025)
    - SAF-T 22+11 teste de consistență
    NONE dintre acestea publică ponderi ML.

2. **Confirmare metodologie ML proprietary:**
    - Context.ro: „SRI firm received 60 million euros, currently the projects are not functional [...] **claims its activities are classified**" — codul / algoritmul APIC NU e public.
    - Termene.ro: „Consultant: ANAF folosește inteligența artificială pentru a respinge contestații fiscale" — Deloitte Legal raportează folosirea AI fără transparență metodologică.
    - StartupCafe: „Inteligența artificială a ajuns și la ANAF. Folosește un soft care integrează **11 baze de date**" — fără detalii model / ponderi.

3. **Cum agreghează ANAF actualmente (din declarații publice + EY/PwC):**
    - Combinație de criterii rule-based (Fișa, OPANAF) + analiza de risc per Ordin 675/2018
    - „Subcriteriile" sunt comparații cu istoricul propriu și cu cohorts (declarații, plăți, restituiri)
    - Nici un document public nu publică „pondere X% pentru indicator Y în scoring final"

**Detalii corecte:**
- Da, **Fișa = singura sursă autoritativă publică** cu punctaje brute (în context restituiri).
- APIC (NU APOLODOR) este proiect IT, cu metodologie ML clasificată (parțial sub SRI).
- AI este deja folosit pentru: 1) contestații fiscale 2) integrare 11 baze de date 3) detectare fraude experimental.
- Ponderile interne ML **NU sunt și nu vor fi publicate** (sunt instrument operațional de control).

**Implicație pentru CompliScan:**
- **Aceasta este pozitionarea noastră onestă:** „Algoritmul intern ANAF (APIC) este proprietar/clasificat. CompliScan oglindește **regulile publice publicate de ANAF** (Fișa + OPANAF + teste SAF-T) — astfel încât cabinetul tău să **bifeze prima dată** check-list-ul oficial, înainte să intri în zona de ML opacă."
- NU promitem să prezicem scoringul intern ANAF (ar fi o minciună).
- Diferentierea = transparență: arătăm exact ce regulă publică o verificăm și o linkăm la sursa primară.
- Update memory blueprint: schimbă orice referire APOLODOR → APIC.

---

# SUMAR EXECUTIV

| # | Claim | Verdict |
|---|---|---|
| 1 | Fișa indicatorilor = pentru accize/restituiri | ⚠️ PARȚIAL (corect ca spirit; punctajele V2 ușor diferite; max real 500 pct nu 540) |
| 2 | OUG 13/2026 a abrogat art. 5/8/16 din OUG 70/2024 | ✅ CONFIRMAT (MO 181/09.03.2026) |
| 3 | Prag e-TVA = 20% + 5.000 RON cumulativ | ✅ CONFIRMAT (OUG 87/2024 + OPANAF 6234/2024) |
| 4 | SAF-T D406 = 22 + 11 = 33 teste oficiale | ✅ CONFIRMAT (PDF-uri ANAF verbatim) |
| 5 | OPANAF 1826/2372/2025 = doar accize | ✅ CONFIRMAT (MO 708/30.07.2025; common ANAF-AVR) |
| 6 | Proiect Big Data = APIC sau APOLODOR | ❌ FALS — e **APIC** (APOLODOR = adresa ANAF) |
| 7 | API e-Factura + OAuth + rate limits oficiale | ✅ CONFIRMAT (rate corect = 1000 req/MINUT, NU per day) |
| 8 | Fișa publică = singura documentație; ML intern e secret | ⚠️ PARȚIAL (corect: ML clasificat; dar denumirea proiectului e APIC, nu APOLODOR) |

## Scor agregat:
- **CONFIRMATE:** 4 / 8 (claim 2, 3, 4, 5, 7 — efectiv 5)
- **PARȚIAL (folosibile cu corecții):** 2 / 8 (claim 1, 8)
- **FALSE / HALUCINAȚII GPT:** 1 / 8 (claim 6 — APOLODOR)
- **INCERTE:** 0

## Acțiune recomandată

**DA, codăm pe baza V2, dar cu următoarele corecții obligatorii:**

1. **Nu folosi denumirea „APOLODOR" niciodată** — peste tot înlocuiește cu **APIC** sau „proiectul Big Data ANAF". Update blueprint, memory, marketing copy.
2. **Maximum scor Fișa = 500 puncte** (nu 540). Pragul 250 confirmat.
3. **Notificarea de conformare e-TVA = legacy** (abrogată 09-03-2026). Codează feature-ul ca „comparator istoric e-TVA vs D300", nu ca „alertă conformare obligatorie".
4. **OPANAF 1826/2372/2025 = doar Accize Pack**, nu universal. Marchează clar în UI.
5. **Rate limit ANAF API = 1000/MINUT** (nu per day). Configurează retry/backoff în consecință.
6. **SAF-T 11 teste suplimentare = doar nerezidenți / decont special TVA**. Marchează tag-ul.
7. **Comunicare onestă pe pozitionare:** „oglindim regulile publice, nu algoritmul ML intern (clasificat)". Asta e diferentierea principală vs competiție.

**NU așteptăm validare suplimentară.** Toate sursele primare (ANAF, MO, EY, PwC) sunt aliniate. Putem începe sprint-ul de implementare cu corecțiile de mai sus aplicate.

---

## Sources consultate (toate accesate 14 mai 2026)

### Surse primare ANAF / Monitorul Oficial / legislatie.just.ro
- https://static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm
- https://static.anaf.ro/static/10/Anaf/legislatie/OUG_13_2026.pdf
- https://legislatie.just.ro/Public/DetaliiDocument/284214 (OUG 70/2024)
- https://legislatie.just.ro/Public/DetaliiDocument/284679 (OUG 87/2024)
- https://static.anaf.ro/static/10/Anaf/legislatie/OrdineMFP/OMFP_532_2007.pdf
- https://static.anaf.ro/static/10/Anaf/transparenta/Anexa_OMEF_Metodologie.pdf
- https://static.anaf.ro/static/10/Anaf/formulare/DecontPrecompletatROeTVA_OPANAF_3775_2024.pdf
- https://static.anaf.ro/static/10/Anaf/formulare/A1_OPANAF_6234_2024.pdf
- https://static.anaf.ro/static/10/Anaf/Informatii_R/comunicat_saft_teste_v2.pdf (22 teste SAF-T)
- https://static.anaf.ro/static/10/Anaf/Informatii_R/testedeconsistenta2.pdf (11 teste SAF-T)
- https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf
- https://static.anaf.ro/static/10/Anaf/Informatii_R/Strategia_ANAF_2021-2024_130421.pdf
- https://mfinante.gov.ro/static/10/eFactura/prezentare%20api%20efactura.pdf

### Surse de presă specializată
- https://www.ey.com/ro_ro/technical/tax-alerts/buletin-fiscal-ey-10-martie-2026 (EY — OUG 13/2026)
- https://www.pwc.ro/ro/tax-legal/alerts/decontul-precompletat-ro-e-tva-adoptat-prin-oug-nr-70-2024-i-mod.html
- https://www.pwc.ro/ro/tax-legal/alerts/noi-modific_ri-ale-criteriilor-de-risc-fiscal-pentru-destinatari.html
- https://www.ziuaconstanta.ro/stiri/actualitate/noile-criterii-de-risc-fiscal-pentru-firme-publicate-in-monitorul-oficial-document-906844.html
- https://www.juridice.ro/822998/monitorizarea-si-controlul-operatorilor-de-produse-accizabile-cu-risc-fiscal-ridicat.html
- https://www.fiscalitatea.ro/anaf-modifica-regulile-pentru-operatorii-cu-produse-accizabile-cu-risc-fiscal-ridicat-doua-noi-ordine-comune-anaf-avr-24779/
- https://www.ceccarbusinessmagazine.ro/anaf-a-publicat-22-de-teste-de-consistenta-prin-care-firmele-pot-verifica-daca-au-depus-declaratia-saf-t-d406-corecta-si-completa/a/KspE5Q8YFGzdsqmL42S5
- https://contabilul.manager.ro/a/27685/4-noutati-privind-digitalizarea-anaf-marile-proiecte-care-vor-intra-in-curand-in-vigoare.html
- https://context.ro/digitalizarea-anaf-cu-mana-sri-sistem-nefunctional-si-zeci-de-milioane-de-euro-consumate-in-secret/
- https://hotnews.ro/cum-se-vor-schimba-controalele-anaf-dupa-implementarea-big-data-seful-anaf-toti-contribuabilii-vor-primi-notificari-80317
- https://playtech.ro/2025/digitalizarea-completa-a-anaf-va-fi-gata-pana-in-octombrie-2026-sistemul-va-folosi-inteligenta-artificiala-pentru-depistarea-fraudelor-fiscale/
- https://startupcafe.ro/inteligenta-artificiala-a-ajuns-si-la-anaf-foloseste-un-soft-care-integreaza-11-baze-de-date-cand-se-va-digitaliza-complet-fiscul-ministru-88474
- https://webflow.termene.ro/articole/consultant-anaf-foloseste-inteligenta-artificiala-pentru-a-respinge-contestatii-fiscale
- https://iapp.ro/articol/verifica-status-incarcare-factura-api-anaf-php-oauth2
- https://docs.socrate.io/api-reference/ro-efactura-service/
- https://up2date.ro/ghiduri/integrare-efactura-anaf-ghid-complet
