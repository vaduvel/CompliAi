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
  // PFA / PFI / CMI — pattern density din batch Portal 2026-05-15
  // ===========================================================================
  {
    id: "pfa-cass-pensionar",
    tags: ["CASS", "pensionar", "PFA", "art 174", "plafon"],
    title: "CASS pentru pensionar cu PFA — datorează 10% pe venit net",
    body: `Pensionarii care obțin venituri din activități independente (PFA, PFI, drepturi autor, etc.) DATOREAZĂ CASS pe venitul respectiv, chiar dacă pensia este scutită de contribuții.

Regulă cheie (art. 174 Cod Fiscal):
- CASS se calculează 10% × venitul net realizat din activitate independentă
- NU se aplică plafonul minim de 6 salarii minime pentru pensionari când venitul e mai mic
- Dobânzile bancare separate sub plafonul de 6 salarii minime NU generează CASS

Exemple practice:
- Pensionar cu PFA expert tehnic, venit net 1.365 RON → CASS = 136 RON (10%)
- Pensionar cu cabinet medical PFI, venit net 10.477 RON → CASS = 1.048 RON
- Dacă venitul depășește plafonul 6 salarii minime, CASS se aplică la nivelul plafonului

ATENȚIE: chiar dacă venitul e mic, CASS rămâne datorată pentru activitatea independentă.`,
    sources: [
      { label: "Cod Fiscal art. 174", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 170 (plafon CASS)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 155 alin. (1) lit. g)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "pfa-fara-activitate-cass",
    tags: ["CASS", "PFA", "fără activitate", "opțional", "art 180"],
    title: "PFA fără activitate — CASS opțional, nu obligatoriu",
    body: `Persoanele cu PFA care au înregistrat venit net zero sau pierdere într-un an fiscal NU datorează CASS obligatoriu.

Regulă (art. 174 alin. 2 Cod Fiscal):
- Sub plafonul de 6 salarii minime → nu există obligație CASS
- Sub plafonul de 6 salarii minime + pierdere → idem
- Activitate suspendată ONRC → idem

OPȚIONAL: Pot opta pentru plata CASS prin Declarația Unică (art. 180), la nivelul plafonului de 6 salarii minime, pentru a beneficia de asigurarea de sănătate publică. Plata anticipată asigură până la sfârșitul anului, regularizare la finalizare.

Cazuri tipice: medic cu PFA care n-a avut activitate 2021-2025 → fără CASS obligatoriu, dar fără asigurare medicală. Soluția: opțional prin DU.`,
    sources: [
      { label: "Cod Fiscal art. 174 alin. (2)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 180 (asigurare opțională)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "pfa-salariu-minim-plafon-anual",
    tags: ["salariu minim", "plafon", "CASS", "CAS", "art 135"],
    title: "Plafon CASS/CAS = salariul minim de la 1 ianuarie (nu cel modificat în iulie)",
    body: `Confuzie frecventă în 2026: salariul minim brut crește din iulie 2026, dar plafoanele anuale CASS/CAS NU se modifică.

Regulă (art. 135¹ alin. (3) Cod Fiscal):
- Plafoanele 6 și 12 salarii minime pentru CASS/CAS se calculează în funcție de salariul minim brut în vigoare LA 1 IANUARIE a anului respectiv
- Majorarea de la jumătatea anului NU modifică baza de calcul

Exemplu 2026: salariu minim la 1.01.2026 = 4.050 RON
- Plafon 6 salarii minime CASS = 24.300 RON
- Plafon 12 salarii minime CAS = 48.600 RON
- Indiferent ce se modifică în iulie 2026, aceste praguri rămân pentru anul fiscal 2026.

Asta înseamnă: contribuabilii care depășesc pragul calculat la 1 ianuarie datorează CASS/CAS chiar dacă cresterea de la iulie ar muta pragul.`,
    sources: [
      { label: "Cod Fiscal art. 135¹ alin. (3)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "pf-d070-vs-d700",
    tags: ["D070", "D700", "PFA", "PFI", "modificare ANAF"],
    title: "D070 vs D700 — confuzie frecventă pe modificări fiscale",
    body: `Confuzie comună: D700 e pentru PERSOANE JURIDICE (SRL, SA, etc.), D070 e pentru PERSOANE FIZICE (PFA, PFI, II, CMI).

Reguli:
- **D010** — Cerere înregistrare/modificare PJ (SRL) — folosită la ONRC pentru aspecte care nu apar pe D700
- **D070** — Declarație de înregistrare fiscală PF (PFA/PFI/II/CMI). Folosită la modificare elemente fiscale (CAEN, sediu, regim TVA, fuziune cabinete, etc.)
- **D700** — Modificare elemente fiscale ulterioare înregistrării PJ. NU se aplică pentru PF.

Caz tipic: cabinet individual de insolvență (CII) fuzionează cu alt cabinet:
- ❌ NU completezi D700 (nu există rubrici pentru fuziune CII)
- ❌ NU completezi D010 (e pentru ONRC, nu pentru fiscale PF)
- ✅ Completezi D070 la organul fiscal competent

Pentru SRL care fuzionează: D700 + acte ONRC + D199.`,
    sources: [
      { label: "OPANAF 2.890/2022 (D070)", ref: "https://anaf.ro" },
      { label: "OPANAF (D700 — modificare PJ)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "pfa-cheltuieli-medicale-titular",
    tags: ["PFA", "cheltuieli deductibile", "medical", "titular", "art 68"],
    title: "Cheltuieli medicale titular PFA — NEDEDUCTIBILE",
    body: `Cheltuielile medicale ale titularului PFA nu sunt deductibile fiscal, chiar dacă afectează capacitatea de muncă.

Regulă (art. 68 alin. (4) și (7) Cod Fiscal):
Sunt deductibile DOAR cheltuielile efectuate "în scopul desfășurării activității" și "în vederea obținerii veniturilor". Cheltuielile medicale personale ale titularului:
- NU sunt în scopul activității (sunt cheltuieli personale)
- NU contribuie direct la obținerea veniturilor (chiar dacă indirect afectează prestația)

Exemplu: cabinet medical PFI, titularul face operație cataractă pentru a continua activitatea → cheltuiala NU se deduce, chiar dacă pare logic.

Excepție: cheltuieli medicale pentru ANGAJAȚI (controale medicale obligatorii, medicina muncii) — DEDUCTIBILE conform art. 68 alin. (4) lit. h).

Recomandare: cheltuieli medicale titular = personale, fără bilet trezorerie pe PFA.`,
    sources: [
      { label: "Cod Fiscal art. 68 alin. (4)-(7)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "pfa-autoturism-mixt",
    tags: ["PFA", "autoturism", "amortizare", "cheltuieli", "art 28", "art 68"],
    title: "Autoturism mixt PFA — 50% cheltuieli + 1500 lei/lună amortizare max",
    body: `Achiziție și utilizare autoturism mixt (PFA + uz personal) — reguli specifice.

DOBÂNDA CREDIT PERSONAL: NEDEDUCTIBILĂ
- Creditul personal contractat pe persoană fizică NU pe PFA → dobânda nu se include în cheltuieli PFA
- Soluția corectă: credit pe PFA (mai dificil de obținut) sau achiziție directă cu numerar/cont PFA

AMORTIZAREA AUTOTURISMULUI:
- Maxim 1.500 RON/lună pentru autovehicule (art. 28 alin. (4) lit. l Cod Fiscal)
- Durată normală: 60 luni (5 ani)
- Înregistrare ca activ în patrimoniul PFA

CHELTUIELI MIXTE (carburant, asigurare, întreținere, ITP):
- Deductibile în proporție de 50% (art. 68 alin. (4) lit. r) — limitare specifică autoturisme mixte
- Necesar foaie de parcurs sau dovezi proporție utilizare profesională

LIMITARE NUMERAR (Legea 70/2015):
- Plata pentru achiziție trebuie făcută PRIN TRANSFER BANCAR
- Plafon numerar 5.000 RON/zi între PJ și PF/PFA
- Pentru autoturism (zeci de mii RON): obligatoriu OP din contul PFA

Pentru Uber/taxi: dacă autoturismul e folosit EXCLUSIV pentru activitate → 100% deductibil, fără limitare 50%.`,
    sources: [
      { label: "Cod Fiscal art. 68 alin. (4) lit. r)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 28 alin. (4) lit. l)", ref: "https://legislatie.just.ro" },
      { label: "Legea 70/2015 (numerar)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "pfa-poprire-salariu-cumulat",
    tags: ["poprire", "PFA", "executare silită", "salariu", "art 729"],
    title: "Poprire pe PFA + salariat la aceeași firmă — cumulează 1/3 din net total",
    body: `Persoana fizică autorizată NU are personalitate juridică distinctă de titular. Patrimoniul PFA = patrimoniul persoanei fizice (cu mențiunea separată pentru bunuri afectate activității).

Implicație poprire (art. 729 Cod de Procedură Civilă):
Dacă o persoană este SIMULTAN salariat și titular PFA la aceeași firmă, poprirea se aplică PE TOTAL venituri (salariu + sume facturate prin PFA), NU separat.

Procent reținere:
- 1/3 din venitul net total (după impozite, contribuții) pentru obligații fiscale, civile
- 1/2 pentru pensii alimentare

Cine aplică: angajatorul/plătitorul are obligația aplicării popririi cumulate. Comunicarea de la organul de executare specifică suma totală de reținut.

Erori frecvente:
- ❌ Reținere 1/3 doar din salariu (pierd 1/3 din PFA)
- ❌ Refuz aplicare poprire pe PFA "pentru că e altă persoană"
- ✅ Calculează net total (salariu + PFA facturat) → reține 1/3 din total

Confuzia provine din ideea greșită că PFA = entitate separată. Juridic e EXTENSIE a persoanei fizice.`,
    sources: [
      { label: "Cod Procedură Civilă art. 729", ref: "https://legislatie.just.ro" },
      { label: "OUG 44/2008 (PFA — fără personalitate juridică)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "conventie-civila-risc-reincadrare",
    tags: ["convenție civilă", "reîncadrare", "drepturi de autor", "art 7", "Cod Muncii"],
    title: "Convenție civilă cu propriul salariat — risc reîncadrare ca relație de muncă",
    body: `Încheierea unei convenții civile cu propria firmă (când persoana este deja salariată acolo) prezintă risc FOARTE RIDICAT de reîncadrare ca relație de muncă de către ANAF și ITM.

Criterii reîncadrare (art. 7 Cod Fiscal + art. 10 Cod Muncii):
- Activitatea din convenție coincide cu atribuțiile postului → REÎNCADRARE
- Munca se desfășoară în programul salariat → REÎNCADRARE
- Folosește mijloacele angajatorului → REÎNCADRARE
- Subordonare ierarhică → REÎNCADRARE
- Plata e regulată/fixă (nu pentru rezultat specific) → REÎNCADRARE

Consecințe reîncadrare:
- Recalcul CAS, CASS, impozit pe venit ca salariu (3-5 ani retroactiv)
- Penalități + dobânzi
- ITM amendă pentru muncă nedeclarată
- Riscă chiar evaziune fiscală (Legea 199/2023 audit intensiv)

Alternative legale:
- Act adițional la CIM cu atribuții suplimentare + spor pe ore extraordinare
- Drepturi de autor (DA1) — doar pentru opere intelectuale REAL diferite
- Contract de management (pentru funcții executive specifice)

Caz tipic: universitate vrea convenție civilă cu profesor propriu pentru cercetare. RISC: dacă proiectul are caracter didactic/cercetare obișnuită → reîncadrare.`,
    sources: [
      { label: "Cod Fiscal art. 7 (definitii)", ref: "https://legislatie.just.ro" },
      { label: "Codul Muncii art. 10", ref: "https://legislatie.just.ro" },
      { label: "Legea 199/2023 (audit intensiv)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  // ===========================================================================
  // REDIRECTIONARE 20% / 0.75% — Declarația D177 către ONG
  // ===========================================================================
  {
    id: "decl-d177-redirectionare-ong",
    tags: ["D177", "redirectionare", "ONG", "sponsorizare", "impozit profit"],
    title: "Declarația D177 — Redirectionare impozit profit către ONG",
    body: `D177 este formularul pentru redirectionarea unei părți din impozitul pe profit către o entitate nonprofit (ONG/biserică).

LIMITA DE REDIRECTIONARE — important pentru a evita respingerea:
Suma redirectionată NU poate depăși MINIMUL dintre:
- 20% × impozitul pe profit declarat anual
- 0.75% × cifra de afaceri anuală

Se alege întotdeauna VARIANTA MAI MICĂ (cea care rezultă suma mai puțin).

ORDINE OBLIGATORIE de depunere:
1. ÎNTÂI D101 (impozit pe profit anual) — ANAF folosește această sumă ca referință
2. APOI D177 — ANAF face cross-check automat: dacă suma redirectionată nu se încadrează în limita 20%/0.75%, declarația e RESPINSĂ

TERMEN: 25 iunie anul curent, pentru anul fiscal precedent. După această dată redirectionarea nu mai e posibilă.

ELIGIBILITATE ONG: doar ONG-uri din Registrul entităților/cult de pe site-ul ANAF. Verificare obligatorie ÎNAINTE de depunere.

NU SE FAC ÎNREGISTRĂRI CONTABILE — D177 e doar redirectionare ANAF, nu generează note contabile.

DATE NECESARE: CIF ONG, denumire ONG, cod IBAN beneficiar, suma redirectionată (max calculată).`,
    sources: [
      { label: "Cod Fiscal art. 25 alin. (4) lit. i)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF cu modificările ulterioare — formularul D177", ref: "https://anaf.ro" },
      { label: "Legea 32/1994 privind sponsorizarea", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
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
