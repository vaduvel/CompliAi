/**
 * FiscCopilot — Corpus fiscal RO (seed v1)
 *
 * Knowledge base structurat pentru RAG: declarații, termene, amenzi, condiții.
 * Surse: Cod Fiscal RO (Legea 227/2015), OUG-uri active, ANAF normative.
 *
 * Aceasta e versiunea SEED — knowledge esențial pentru MVP.
 * În v2 vom indexa Cod Fiscal complet + OUG-uri în Qdrant.
 *
 * Fiecare KnowledgeEntry are:
 * - id: string unic
 * - tags: pentru search/filter
 * - title: titlul subiectului
 * - body: text faptic (citate verbatim când e cazul)
 * - sources: surse legale citabile
 * - last_verified: data ultimei verificări
 */

export interface KnowledgeEntry {
  id: string;
  tags: string[];
  title: string;
  body: string;
  sources: Array<{ label: string; ref: string }>;
  last_verified: string;
}

export const FISCAL_CORPUS: KnowledgeEntry[] = [
  // ===========================================================================
  // DECLARAȚII ANAF
  // ===========================================================================
  {
    id: "decl-d205",
    tags: ["D205", "dividende", "declarație informativă", "termen"],
    title: "Declarația D205 — Declarație informativă privind impozitul reținut la sursă",
    body: `D205 este declarația INFORMATIVĂ depusă de plătitorii de venituri (în special pentru dividende) pentru a raporta impozitul reținut la sursă pe beneficiari. Termenul standard este până la ultima zi din luna februarie a anului următor celui în care s-au făcut plățile. Pentru dividende distribuite în anul N, D205 se depune până la 28/29 februarie N+1. Conține: identificare plătitor, identificare beneficiar (CNP/CIF), tip venit (cod 401 dividende), valoare brută, impozit reținut (8% standard pe dividende din 2023). Lipsa depunerii sau depunerea tardivă atrage amendă pentru declarație informativă. NU se confundă cu D205 de Verificare anuală a stocurilor (declarație diferită).`,
    sources: [
      { label: "OPANAF 587/2016 (cu modificările ulterioare)", ref: "anaf.ro/legislatie" },
      { label: "Codul Fiscal art. 132 alin. (2)", ref: "legislatie.just.ro/codul-fiscal" },
    ],
    last_verified: "2026-05-14",
  },
  {
    id: "decl-d300",
    tags: ["D300", "TVA", "decont", "termen"],
    title: "Declarația D300 — Decont de TVA",
    body: `D300 este decontul TVA depus lunar sau trimestrial în funcție de regimul plătitorului. Termen: 25 ale lunii următoare perioadei fiscale (luna sau trimestrul). Conține: TVA colectată (vânzări), TVA deductibilă (cumpărări), TVA de plată sau de rambursat. Persoanele impozabile cu cifră de afaceri sub 100.000 EUR depun trimestrial; restul depun lunar. Sold TVA negativ peste 5.000 RON cumulativ poate genera cerere de rambursare. Regula 98 din DUKIntegrator verifică Sold TVA precedent — eroare frecventă când rândul 22 din decont nu se potrivește cu sold precedent înregistrat.`,
    sources: [
      { label: "OPANAF 1253/2021", ref: "anaf.ro" },
      { label: "Codul Fiscal Titlul VII art. 322-324", ref: "legislatie.just.ro" },
    ],
    last_verified: "2026-05-14",
  },
  {
    id: "decl-d394",
    tags: ["D394", "TVA", "operațiuni interne", "termen"],
    title: "Declarația D394 — Operațiuni interne plătitori TVA",
    body: `D394 este declarația INFORMATIVĂ a operațiunilor pe teritoriul național efectuate cu alți plătitori de TVA. Termen: 25 ale lunii următoare perioadei fiscale (aceeași periodicitate ca D300). Conține: livrări/prestări către alți plătitori TVA, achiziții de la alți plătitori TVA, defalcat pe CUI-uri și valori. Folosită de ANAF pentru cross-check între D394 ale partenerilor — discrepanțele declanșează verificări. Nedepunere/depunere tardivă: amendă pentru declarație informativă.`,
    sources: [{ label: "OPANAF 705/2020", ref: "anaf.ro" }],
    last_verified: "2026-05-14",
  },
  {
    id: "decl-d406-saft",
    tags: ["D406", "SAF-T", "fișier XML", "termen", "amendă"],
    title: "Declarația D406 — Fișierul Standard de Audit (SAF-T)",
    body: `D406 este fișierul XML SAF-T (Standard Audit File for Tax) cerut de ANAF. Începând cu 1 ianuarie 2025, toate firmele (inclusiv micro) au obligație SAF-T. Termen: aceeași periodicitate ca D300 (lunar sau trimestrial), depus 25 ale lunii următoare. Pentru contribuabili mari, se depune și anual. Conținut: master files (clienți, furnizori, articole), tranzacții (jurnal vânzări, jurnal cumpărări, stocuri, mijloace fixe, plăți). Validarea se face cu DUKIntegrator (33 teste structurale). AMENZI: 1.000 — 5.000 RON pentru nedepunere la termen; 500 — 1.500 RON pentru depunere incorectă sau incompletă (sursa: Cod Procedură Fiscală art. 336 alin. 1 lit. j).`,
    sources: [
      { label: "OPANAF 1783/2021", ref: "anaf.ro/saft" },
      { label: "Cod Procedură Fiscală art. 336", ref: "legislatie.just.ro" },
      { label: "Universul Fiscal — amenzi ANAF 2025", ref: "universulfiscal.ro" },
    ],
    last_verified: "2026-05-14",
  },
  {
    id: "decl-d112",
    tags: ["D112", "salarii", "contribuții", "diurna", "termen"],
    title: "Declarația D112 — Obligațiile de plată ale angajatorului",
    body: `D112 este declarația lunară a obligațiilor de plată a contribuțiilor sociale (CAS, CASS, impozit pe venit din salarii, CAM). Termen: 25 ale lunii următoare lunii pentru care se raportează. Conține: salariați (anexa 1), venituri brute, contribuții reținute, contribuții angajator, indemnizații. DIURNA pentru deplasări interne sub 23 RON/zi (în țară) și conform plafoanelor pentru externe = neimpozabilă; peste plafon = impozabilă și se include în D112. NEDEPUNERE / DEPUNERE TARDIVĂ atrage amenzi conform art. 336 din Cod Procedură Fiscală.`,
    sources: [
      { label: "OPANAF 1853/2024", ref: "anaf.ro" },
      { label: "Cod Fiscal art. 76 (diurne)", ref: "legislatie.just.ro" },
    ],
    last_verified: "2026-05-14",
  },
  {
    id: "decl-d100",
    tags: ["D100", "impozit profit", "impozit micro", "termen"],
    title: "Declarația D100 — Obligații de plată la bugetul de stat",
    body: `D100 este declarația obligațiilor de plată la bugetul de stat — impozit pe profit, impozit pe veniturile microîntreprinderilor, impozit nerezidenți, impozit dividende etc. Termen: 25 ale lunii următoare (impozit micro trimestrial), respectiv 25 al lunii a doua după trimestru (impozit profit trimestrial). Pentru microîntreprinderi: cotă 1% sau 3% pe veniturile totale. Pentru impozit profit: 16% pe profitul fiscal anual, plus regula plafoanelor. Plata se face în aceeași zi cu depunerea.`,
    sources: [{ label: "OPANAF 587/2016 (modif. ulterioare)", ref: "anaf.ro" }],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // E-FACTURA & E-TVA
  // ===========================================================================
  {
    id: "efactura-termene-amenzi",
    tags: ["e-Factura", "SPV", "termen", "amendă"],
    title: "e-Factura — Termen transmitere și amenzi",
    body: `Din 1 ianuarie 2026, termenul de transmitere a facturilor în Sistemul Național e-Factura (RO e-Factura) este de 5 zile lucrătoare de la emitere, dar nu mai târziu de termenul legal de emitere a facturii. Amenzi pentru netransmitere: 5.000 — 10.000 RON pentru contribuabili mari, 2.500 — 5.000 RON pentru contribuabili mijlocii, 1.000 — 2.500 RON pentru alți contribuabili. În anumite cazuri specifice se aplică o sancțiune echivalentă cu 15% din valoarea totală a facturii (Cod Procedură Fiscală art. 13^5). Validarea facturilor se face conform UBL 2.1 cu profilul CIUS-RO. Erori frecvente: V001-V011 (validări structurale), CompanyID lipsă, CustomizationID greșit.`,
    sources: [
      { label: "OUG 120/2021 cu modificările ulterioare", ref: "monitoruloficial.ro" },
      { label: "Cod Procedură Fiscală art. 13^5", ref: "legislatie.just.ro" },
      { label: "Universul Fiscal — sancțiuni e-Factura 2025", ref: "universulfiscal.ro" },
    ],
    last_verified: "2026-05-14",
  },
  {
    id: "etva-notificare",
    tags: ["e-TVA", "notificare", "termen răspuns"],
    title: "e-TVA — Notificare de conformare și termen răspuns",
    body: `Din 1 iulie 2025, ANAF generează automat decontul precompletat RO e-TVA pentru fiecare plătitor TVA. Dacă există diferențe între decontul precompletat și decontul depus efectiv (D300), ANAF emite o NOTIFICARE DE CONFORMARE. Contribuabilul are 20 ZILE de la primirea notificării pentru a răspunde — fie justificând diferențele, fie depunând decont rectificativ. Lipsa răspunsului în termen = risc fiscal major și criteriu de selecție pentru control. OUG 13/2026 a abrogat sancțiunea inițială pentru e-TVA, dar notificarea rămâne obligație de răspuns.`,
    sources: [
      { label: "OUG 70/2024", ref: "monitoruloficial.ro" },
      { label: "OUG 13/2026", ref: "monitoruloficial.ro" },
      { label: "ANAF — Ghid e-TVA", ref: "anaf.ro/etva" },
    ],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // DIVIDENDE & MICROÎNTREPRINDERI
  // ===========================================================================
  {
    id: "dividende-impozit-aga",
    tags: ["dividende", "AGA", "impozit", "distribuire"],
    title: "Dividende — Impozit, distribuire, AGA",
    body: `Dividendele sunt distribuite din profitul net contabil, după aprobarea AGA (Adunarea Generală a Asociaților). Cota impozit pe dividende: 8% (din 1 ianuarie 2023; anterior 5%). Plătitorul (firma) reține impozitul la sursă și-l declară prin D100 (pentru plată) și D205 (informativ, până la sfârșitul lui februarie anul următor). Procedura: 1) AGA decide distribuirea; 2) se întocmește stat dividende; 3) firma reține 8% la plată; 4) se virează la ANAF prin OP până 25 ale lunii următoare; 5) se declară în D100; 6) la sfârșitul anului fiscal se centralizează în D205. Distribuirea greșită sau lipsa AGA = risc fiscal și juridic.`,
    sources: [
      { label: "Cod Fiscal art. 91, art. 132", ref: "legislatie.just.ro" },
      { label: "Legea societăților 31/1990", ref: "legislatie.just.ro" },
    ],
    last_verified: "2026-05-14",
  },
  {
    id: "microintreprindere-conditii",
    tags: ["microîntreprindere", "prag", "cotă", "condiții"],
    title: "Microîntreprindere — Condiții, prag, cotă impozit",
    body: `O firmă este microîntreprindere dacă în anul fiscal anterior îndeplinește CUMULATIV: 1) veniturile NU au depășit 500.000 EUR (echivalent RON la cursul de la închiderea exercițiului); 2) NU realizează venituri din consultanță și management peste 20% din totalul veniturilor; 3) are cel puțin 1 salariat (full-time sau echivalent); 4) capitalul social nu este deținut de stat sau unități administrativ-teritoriale. Cota impozit: 1% pentru micro cu 1+ salariat și venituri sub 60.000 EUR; 3% pentru micro cu venituri 60.000 — 500.000 EUR. La depășirea pragului 500.000 EUR, firma trece automat la impozit pe profit (16%) începând cu trimestrul următor. Din 2024, regulile sunt mai stricte — verificare cu Cod Fiscal Titlul III actualizat.`,
    sources: [
      { label: "Cod Fiscal Titlul III art. 47-57", ref: "legislatie.just.ro" },
      { label: "OUG 115/2023 + OUG 31/2024", ref: "monitoruloficial.ro" },
    ],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // CASA DE MARCAT
  // ===========================================================================
  {
    id: "casa-marcat-prag",
    tags: ["casa de marcat", "AMEF", "prag", "PFA", "II"],
    title: "Casa de marcat (AMEF) — Obligație, prag, excepții",
    body: `Casele de marcat electronice fiscale (AMEF) sunt obligatorii pentru operatorii economici care încasează numerar de la persoane fizice pentru livrări de bunuri sau prestări servicii. PFA-uri, II și firme care nu au activitate cu publicul direct nu au obligație. Pragul de încasare cu numerar peste care AMEF devine OBLIGATORIE depinde de regimul fiscal și tipul activității — verificare individuală cu OG 28/1999 actualizat. Excepții: livrări de bunuri en-gros, prestări către firme (B2B), vânzări online cu plată exclusiv prin card/transfer bancar, anumite activități scutite expres. Achiziția AMEF + autorizare ANAF + raportare lunară Z. Amenzi nedeclarare: 8.000 — 10.000 RON pentru sume neînregistrate.`,
    sources: [
      { label: "OG 28/1999 cu modificările ulterioare", ref: "legislatie.just.ro" },
      { label: "OPANAF privind AMEF", ref: "anaf.ro/amef" },
    ],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // TVA LA ÎNCASARE
  // ===========================================================================
  {
    id: "tva-la-incasare",
    tags: ["TVA", "TVA la încasare", "regim special"],
    title: "TVA la încasare — Regim special",
    body: `TVA la încasare este un regim special prin care exigibilitatea TVA se mută de la momentul facturării la momentul încasării efective. Condiție de eligibilitate: cifra de afaceri în anul anterior sub 4.500.000 RON. Opțiunea se exercită prin notificare către ANAF (D096). Avantaj: amână plata TVA până încasezi. Dezavantaj: complexitate operațională, evidență dublă a facturilor (emise vs încasate). Excepții: livrările intracomunitare, exportul, anumite operațiuni B2G. Important: și partenerii își amână deducerea TVA până plătesc. NU se aplică la livrările făcute către persoane afiliate care nu aplică regimul.`,
    sources: [
      { label: "Cod Fiscal art. 282", ref: "legislatie.just.ro" },
      { label: "OPANAF 1782/2014 (D096)", ref: "anaf.ro" },
    ],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // DOBÂNZI ȘI PENALITĂȚI
  // ===========================================================================
  {
    id: "dobanzi-penalitati",
    tags: ["dobânzi", "penalități", "întârziere", "obligații fiscale"],
    title: "Dobânzi și penalități pentru obligații fiscale neplătite",
    body: `Pentru obligațiile fiscale neplătite la scadență se calculează: DOBÂNDĂ de 0,02% pe zi de întârziere (echivalent 7,3% pe an) și PENALITATE DE ÎNTÂRZIERE de 0,01% pe zi (echivalent 3,65% pe an). Totale: 0,03% pe zi (10,95% pe an). Acestea se aplică automat și se cumulează — nu se sting prin trecerea timpului decât prin plată. Pentru obligații accesorii (dobânzi/penalități) nu se mai calculează alte accesorii (NU se compun). Eșalonarea la plată este posibilă conform art. 184-209 Cod Procedură Fiscală — cerere către ANAF cu documente justificative.`,
    sources: [{ label: "Cod Procedură Fiscală art. 173-175", ref: "legislatie.just.ro" }],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // DUKINTEGRATOR & REGULI TEHNICE
  // ===========================================================================
  {
    id: "dukintegrator-regula-98",
    tags: ["DUKIntegrator", "Regula 98", "D300", "Sold TVA precedent"],
    title: "Regula 98 DUKIntegrator — Sold TVA precedent eronat",
    body: `Regula 98 din DUKIntegrator (validatorul oficial ANAF pentru declarații) verifică concordanța dintre soldul TVA de la rândul 22 al decontului D300 curent și soldul rezultat din decontul anterior (rd. 41 ori rd. 25 după caz, în funcție de versiunea formularului). Eroare frecventă: solduri introduse manual, fără preluare automată din decont precedent → eroare de tip "Sold TVA precedent eronat". Remediere: 1) verifică decont precedent și ia exact soldul de rambursare reportat; 2) introdu corect la rândul 22 în decont curent; 3) re-validează cu DUKIntegrator. Asta NU este eroare critică care blochează submitul, dar este FLAG pentru ANAF care poate declanșa verificare ulterioară.`,
    sources: [
      { label: "DUKIntegrator — Manual utilizare", ref: "anaf.ro/dukintegrator" },
      { label: "Comunitatea contabilă RO — discuții Regula 98", ref: "contabilul.ro" },
    ],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // ÎNCHIDEREA LUNII — workflow secvențial
  // ===========================================================================
  {
    id: "inchidere-luna-workflow",
    tags: ["închidere lună", "workflow", "SAGA", "balanță", "TVA", "amortizare"],
    title: "Închidere lună — workflow standard contabilitate RO",
    body: `Închiderea lunii contabile urmează un workflow STRICT SECVENȚIAL în 7 pași (pattern preluat din SAGA, valabil generic):

1. **Înregistrare operații contabile stocuri** — generează note contabile pentru mișcările de stocuri din gestiuni cantitativ-valorice. ESTE primul pas pentru că afectează costul mărfurilor.

2. **Descărcare mărfuri vândute (global-valorică)** — pentru gestiuni global-valorice, folosește coeficient K. Restricție: soldul 371 nu trebuie să devină negativ.

3. **Închidere TVA** — generează note de regularizare TVA, compensează automat TVA de plată cu TVA de recuperat. Verifică concordanța între jurnalele TVA și soldurile conturilor 4428.

4. **Cheltuieli/venituri în avans** — transferă lunar pe costuri/venituri sumele din avans (471, 472).

5. **Amortizare imobilizări** — generează notele de amortizare. Format standard: "Amort.Imobilizare 16811 = 280x" și "Amort.Imobilizare 26811 = 281x".

6. **Închidere conturi venituri și cheltuieli** — transferă prin contul 121 (profit și pierdere). Permite analitică distinctă per an.

7. **Calcul diferențe de curs** — reevaluează conturi în valută la sfârșitul lunii (curs BNR oficial). Restricție: nu se introduc manual note contabile pe diferențe de curs.

ADAOS LA SFÂRȘIT DE TRIMESTRU (martie, iunie, septembrie, decembrie):
- Impozit pe profit (firme normale) → calculează + generează nota contabilă + registrul fiscal
- Impozit pe venit microîntreprinderi → generează declarațiile 107 și 177
- Declarația 100 (obligații la buget) + ordine de plată / foi de vărsământ

ADAOS LA SFÂRȘIT DE AN (decembrie):
- Declarația 101 (impozit profit anual) — preluare din balanță + verificare manuală
- Declarația 392/700 — înlocuit formularul 094 din 2023

REGULĂ DE AUR: revenirea la lună anterioară necesită devalidare ÎN ORDINE INVERSĂ (de la pas 7 la pas 1). Facturile reevaluate (pas 7) nu mai pot fi devalidate, deci atenție la cursul valutar.`,
    sources: [
      { label: "SAGA Manual — Închidere Lună", ref: "manual.sagasoft.ro/sagac/topic-48-inchidere-luna.html" },
      { label: "Cod Fiscal Titlul II (impozit profit)", ref: "legislatie.just.ro" },
      { label: "Reglementări contabile OMFP 1802/2014", ref: "monitoruloficial.ro" },
    ],
    last_verified: "2026-05-14",
  },
  // ===========================================================================
  // CALENDAR FISCAL CHEIE
  // ===========================================================================
  {
    id: "calendar-fiscal-lunar",
    tags: ["calendar fiscal", "termene", "25 ale lunii"],
    title: "Calendar fiscal — Termene recurente",
    body: `Termene recurente cele mai importante:
- **25 ale lunii**: D100 (impozit micro/profit trimestrial), D300 (TVA), D390 (TVA UE), D394 (operațiuni interne), D112 (salarii și contribuții) — pentru perioada anterioară.
- **Sfârșitul lunii februarie** (28/29): D205 (declarație informativă impozit reținut, în special pe dividende anul anterior), D394 pentru decembrie.
- **15 aprilie** (sau extins): Bilanț anual + Notă D205 verificare anuală (pentru SRL cu obligație raportare).
- **25 mai**: Bilanț extins pentru firme cu auditor obligatoriu.
- **D406 SAF-T**: aceeași periodicitate cu D300 (lunar/trimestrial) + anual pentru contribuabili mari.
- **e-Factura**: 5 zile lucrătoare de la emitere (din ian 2026).
- **e-TVA notificări**: 20 zile de la primire pentru răspuns.`,
    sources: [{ label: "ANAF — Calendarul Obligațiilor Fiscale", ref: "anaf.ro/calendar" }],
    last_verified: "2026-05-14",
  },
];

/**
 * Sumar pentru folosire în system prompt (când nu poți rula RAG).
 */
export function corpusSummary(): string {
  return `Cunoștințele tale fiscale RO sunt verificate la 2026-05-14. Acoperi: D100, D205, D300, D394, D406 SAF-T, D112, e-Factura, e-TVA, dividende, microîntreprindere, casa de marcat, TVA la încasare, dobânzi și penalități, DUKIntegrator Regula 98, calendar fiscal. Pentru orice altceva spui "Nu sunt sigur, verifică sursa oficială ANAF".`;
}
