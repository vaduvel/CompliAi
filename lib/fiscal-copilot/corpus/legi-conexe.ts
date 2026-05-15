/**
 * FiscCopilot — Corpus LEGI CONEXE
 *
 * Acoperă zonele NEACOPERITE de Cod Fiscal (L 227/2015):
 *
 * 1. **Cod Procedură Fiscală (L 207/2015)** — Inspecție, sancțiuni, amenzi,
 *    executare silită, poprire, contestație, prescripție, eșalonare
 * 2. **Legea Societăților (L 31/1990)** — Capital social, AGA, dividende,
 *    asociați, fuziune, divizare, lichidare
 * 3. **OUG 44/2008** — PFA, II, CMI (fără personalitate juridică)
 * 4. **Legea Contabilității (L 82/1991)** — Registru jurnal, inventar,
 *    obligații contabile generale
 * 5. **ONG**: Legea 246/2005 (sponsorizare) + OG 26/2000 (asociații)
 * 6. **OUG-uri active 2024-2026** — modificări recente Cod Fiscal
 * 7. **OG 28/1999** — Case de marcat (AMEF)
 *
 * Boost RAG: ×1.4 (autoritate legală secundară — sub Cod Fiscal ×1.5).
 *
 * Fiecare entry conține:
 * - Titlu cu numărul articolului + numele legii
 * - Body cu rezumat fiabil al conținutului articolului
 * - Surse cu URL la legislatie.just.ro pentru verificare
 * - Tags pentru retrieval inteligent
 */

import type { KnowledgeEntry } from "./seed-fiscal-ro";

export const LEGI_CONEXE_CORPUS: KnowledgeEntry[] = [
  // ===========================================================================
  // COD PROCEDURĂ FISCALĂ (Legea 207/2015) — Inspecție și sancțiuni
  // ===========================================================================
  {
    id: "cpf-art-173-dobanzi",
    tags: ["dobânzi", "obligații fiscale", "neplată", "CPF", "art 173"],
    title: "Art. 173 CPF — Dobânda pentru neplata obligațiilor fiscale (0,02%/zi)",
    body: `Pentru neachitarea la termen a obligațiilor fiscale principale, se datorează după acest termen DOBÂNZI:
- 0,02% pentru fiecare zi de întârziere (echivalent ~7,3%/an)
- Se aplică la cuantumul obligației fiscale neplătite
- Calcul automat de la data scadenței până la data plății
- Cumulative cu penalitatea de întârziere (0,01%/zi)

Total cumulat dobândă + penalitate = 0,03%/zi = ~10,95%/an.
Acestea NU se sting prin trecerea timpului — doar prin PLATĂ.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 173", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-174-penalitate",
    tags: ["penalități", "obligații fiscale", "art 174", "CPF"],
    title: "Art. 174 CPF — Penalitatea de întârziere (0,01%/zi)",
    body: `Pentru neachitarea la termen, se aplică PENALITATE DE ÎNTÂRZIERE:
- 0,01% pentru fiecare zi de întârziere (echivalent ~3,65%/an)
- Calcul similar dobânzii, dar diferită ca natură juridică
- Reducere 75% dacă plata totală se face în termenul de soluționare a contestației

Pentru NEDECLARARE (nu doar neplată), se aplică penalitate de NEDECLARARE separată: 0,08%/zi (~29,2%/an), reducere 75% dacă plata totală + corectă la termen contestație.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 174-175", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-181-prescriptie",
    tags: ["prescripție", "executare silită", "art 181", "CPF"],
    title: "Art. 181 CPF — Termenul de prescripție a dreptului de a stabili obligații fiscale",
    body: `Dreptul ORGANULUI FISCAL de a stabili obligații fiscale se prescrie în termen de 5 ANI, calculat de la data de 1 iulie a anului următor celui pentru care se datorează obligația.

EXCEPȚII (prescripție 10 ani):
- Frauda fiscală (Cod Penal art. 9 din L 241/2005)
- Sume sustrase de la plata obligațiilor

PENTRU CONTRIBUABIL — termenul de a obține rambursare / restituire e tot 5 ani de la nașterea dreptului.

ATENȚIE: prescripția SE ÎNTRERUPE la fiecare act de executare silită, comunicare decizie, contestație depusă. Deci în practică ANAF "resetează" prescripția frecvent.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 181-182", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-268-contestatie",
    tags: ["contestație", "decizie de impunere", "art 268", "CPF", "45 zile"],
    title: "Art. 268 CPF — Contestație împotriva deciziei de impunere (45 zile)",
    body: `Contribuabilul nemulțumit de o decizie a organului fiscal poate formula CONTESTAȚIE:
- TERMEN: 45 zile de la data comunicării deciziei (NU de la emitere)
- Forma: scrisă, motivată
- Adresată: direcției regionale ANAF care a emis decizia
- Taxă de timbru: NU se percepe pentru contestații fiscale
- Suspendă executarea: NU automat — necesită cerere separată

Conținut obligatoriu contestație:
1. Identificare contestator (nume, CUI, adresă)
2. Identificare actul atacat (număr, dată, organ emitent)
3. Motivele (de drept + de fapt)
4. Cererea concretă (anulare totală / parțială / modificare)
5. Anexe doveditoare

Răspuns ANAF: în 6 luni (poate fi extins). După respingerea contestației → instanță administrativ-fiscală (15 zile).`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 268-281", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-220-decizie-din-oficiu",
    tags: ["decizie din oficiu", "ANAF", "estimare", "art 220", "CPF"],
    title: "Art. 220 CPF — Decizia din oficiu (estimare ANAF dacă nu declari)",
    body: `Dacă contribuabilul NU depune declarațiile fiscale obligatorii, ANAF poate emite DECIZIE DIN OFICIU prin care stabilește obligațiile pe baza:
- Datelor din baza ANAF (declarații anterioare, parteneri)
- Sume estimate pe medii sectoriale
- Documente obținute la control

Caracteristici:
- Poate fi emisă fără audierea contribuabilului
- Are forța executorie
- Este atacabilă cu contestație în 45 zile (art. 268)
- Sumele stabilite generează imediat poprire/executare dacă nu se plătesc

CAZ TIPIC: PFA închis în 2019 → ANAF emite decizie din oficiu în 2025-2026 pentru ani neacoperiți → somație în 2026.

RECOMANDARE: contestație IMEDIAT, cu probe că PFA a fost închis (radiere ONRC + ANAF) → anulare retroactivă.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 220", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-188-esalonare",
    tags: ["eșalonare", "plata", "art 188", "CPF", "rate"],
    title: "Art. 188 CPF — Eșalonarea la plată a obligațiilor fiscale",
    body: `Contribuabilul cu dificultăți financiare poate cere EȘALONAREA obligațiilor fiscale restante:
- Cerere către ANAF cu plan de redresare
- Garanții obligatorii (gaj, ipotecă, cauțiune)
- Pe perioade până la 5 ani (excepțional 7 ani)
- Plata în rate lunare egale
- Dobânda redusă (50% din standard) pe perioada eșalonării

CONDIȚII:
- NU mai fi avut eșalonare în ultimii 3 ani (revocată din motive de neplată)
- Situație financiară documentată (bilanțuri ultimii 2 ani)
- Garanții acoperă minim 50% din datorie

EFECT: suspendă executarea silită + popririle pentru perioada eșalonării. Plata punctuală a ratelor = obligație. Întârzierea = revocare automată.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 184-209", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-227-poprire",
    tags: ["poprire", "executare silită", "cont bancar", "art 227", "CPF"],
    title: "Art. 227 CPF — Poprirea pe conturi bancare",
    body: `ANAF poate institui POPRIRE pe conturile bancare ale contribuabilului datornic:
- Comunicare la TOATE băncile la care contribuabilul are conturi
- Banca BLOCHEAZĂ suma datorată din ziua primirii adresei
- Banca virează la ANAF în 15 zile de la primire
- Pentru sume viitoare (salariu, încasări) — poprire continuă până achitare totală

POPRIRE PE VENITURI:
- Salariu: 1/3 din salariul net (NU 1/3 din brut)
- Pensie alimentară: 1/2 din venit net
- Diverse: 1/4 din venit lunar

EXCEPȚII (nu pot fi poprite):
- Sume necesare existenței (alocații sociale, ajutor social)
- Conturi de economii pentru copil minor

CONTESTAȚIA pe poprire are 15 zile, NU 45 ca decizie de impunere. Termen mai strict.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 220-237", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-art-336-amenzi-saf-t-efactura",
    tags: ["amenzi", "SAF-T", "e-Factura", "D406", "art 336", "CPF"],
    title: "Art. 336 CPF — Amenzi pentru declarații fiscale (SAF-T, e-Factura, D300, D112)",
    body: `Amenzi standard pentru NEDEPUNEREA / DEPUNEREA INCORECTĂ a declarațiilor fiscale:

DECLARAȚII INFORMATIVE (D205, D394, D406 SAF-T, D390):
- Nedepunere: 1.000 - 5.000 RON
- Depunere incorectă/incompletă: 500 - 1.500 RON

E-FACTURA (din 2026, termen 5 zile lucrătoare):
- Contribuabili mari: 5.000 - 10.000 RON
- Contribuabili mijlocii: 2.500 - 5.000 RON
- Alți contribuabili: 1.000 - 2.500 RON
- Plus sancțiune 15% din valoarea totală a facturii nedepuse (în anumite cazuri)

DECLARAȚII PE OBLIGAȚII (D100, D300, D112):
- Nedepunere: 1.000 - 5.000 RON
- Plus dobânzi + penalități pe suma datorată

REDUCERE 50%: dacă achiți amenda în 15 zile de la comunicare.`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 art. 336", ref: "https://legislatie.just.ro" },
      { label: "OUG 120/2021 e-Factura sancțiuni", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cpf-inspectie-fiscala",
    tags: ["inspecție fiscală", "ANAF", "control", "art 113", "CPF"],
    title: "Inspecția fiscală — etape, drepturi, obligații (CPF Cap. IX)",
    body: `INSPECȚIA FISCALĂ — proces în care ANAF verifică corectitudinea obligațiilor fiscale.

NOTIFICAREA: scrisă, cu minim 30 zile înainte (sau imediat pentru control inopinat).
DURATA: 3-6 luni standard, prelungită cu 3 luni pentru complexitate.

DREPTURI CONTRIBUABIL:
- Asistență consultant/expert contabil
- Punct de vedere scris la fiecare aspect
- Termen 5 zile pentru documente cerute
- Citarea documentelor specifice
- Audierea înainte de decizia finală

ETAPE:
1. Notificare + cerere documente
2. Verificare în 1-2 luni la sediu
3. Proiect raport inspecție (drept la punct vedere 5 zile)
4. Raport final + decizia de impunere
5. Termen 45 zile pentru contestație

DOCUMENTE CONTROLABILE: contabilitate, facturi, contracte, balanță, registru jurnal, jurnale TVA, registru inventar, registru personal. Termen păstrare: 10 ani contabilitate, 50 ani state plată.

NORME RECENTE: L 199/2023 — audit intensiv pentru sectoare risc (construcții, transport, IT, comerț online).`,
    sources: [
      { label: "Cod Procedură Fiscală L 207/2015 cap. IX", ref: "https://legislatie.just.ro" },
      { label: "Legea 199/2023 — audit intensiv", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  // ===========================================================================
  // LEGEA SOCIETĂȚILOR (L 31/1990)
  // ===========================================================================
  {
    id: "lege31-art-183-rezerva-legala",
    tags: ["rezerva legală", "5%", "capital social", "art 183", "L31"],
    title: "Art. 183 L 31/1990 — Rezerva legală 5% din profit (până la 20% capital social)",
    body: `Societățile comerciale au OBLIGAȚIA să formeze REZERVA LEGALĂ:
- 5% din profit anual brut
- Până la atinerea nivelului de 20% din capital social
- ÎNAINTE de orice distribuire de dividende

PROCEDURA:
1. La închiderea anului: calculul profit brut contabil
2. Înregistrare automată 5% în cont 1061 "Rezerve legale"
3. Reducere baza distribuibilă dividende

CONSECINȚE LIPSĂ:
- Distribuirea dividendelor înainte de formare = NEREGULĂ
- ANAF poate considera distribuire ilegală → reîntoarcere bani la firmă
- Risc fiscal mare la control

CAZ TIPIC: SRL nou cu capital social 200 RON × 20% = 40 RON rezervă necesară. La profit 10K, rezerva 500 RON > 40 limita → se formează doar 40 RON, restul disponibil dividende.`,
    sources: [
      { label: "Legea 31/1990 art. 183", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "lege31-aga-distribuire-dividende",
    tags: ["AGA", "dividende", "distribuire", "asociați", "art 67", "L31"],
    title: "AGA pentru distribuire dividende (Legea 31/1990 art. 67-69)",
    body: `Distribuirea de dividende necesită HOTĂRÂRE AGA (Adunarea Generală a Asociaților).

PROCES:
1. Convocare AGA cu minim 30 zile înainte (sau 15 dacă statutul prevede)
2. Ordine de zi: "Aprobarea situațiilor financiare + repartizarea profitului"
3. Cvorum: 50% capital social pentru AGA ordinară (75% pentru extraordinară)
4. Aprobare: majoritate simplă a voturilor prezente

ELEMENTE DECIZIE AGA:
- Suma totală repartizată ca dividende
- Cota părți per asociat
- Termen plată (de regulă 60 zile de la AGA, dar poate fi negociat)
- Forma plată (numerar, transfer bancar)

DIVIDENDE INTERIMARE (Codul Fiscal art. 28):
- Distribuite înainte de închiderea exercițiului anual
- Permise dacă statutul prevede expres
- Calcul pe rezultatul TRIMESTRIAL (intermediar)
- Regularizare la finalul anului (rezultat real)
- Cota impozit 8% reținut la sursă

INTERZICERI:
- Distribuire dacă firma are PIERDERI reportate neacoperite
- Distribuire înainte de formare rezervă legală (art. 183)
- Sumele care reduc capitalul social sub minimul legal`,
    sources: [
      { label: "Legea 31/1990 art. 67-69", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 91 + 132", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "lege31-lichidare-srl",
    tags: ["lichidare", "SRL", "dizolvare", "art 227", "L31"],
    title: "Lichidarea SRL — etape complete (L 31/1990 art. 227-260)",
    body: `LICHIDAREA voluntară SRL prin decizia asociaților.

ETAPE:
1. **AGA decizie dizolvare** (75% capital social)
2. **Publicare Monitorul Oficial** (decizia dizolvare)
3. **Numirea lichidatorului** (membru asociat sau extern autorizat)
4. **Inventar la zi** + bilanț de lichidare
5. **Plata datoriilor** (în ordine: salarii, creditori privilegiați, alți creditori)
6. **Vânzare activelor rămase**
7. **Bilanț final lichidare**
8. **AGA aprobare distribuire activ rămas la asociați**
9. **Cerere radiere la ONRC**
10. **Radiere fiscală ANAF** (D700)

OBLIGAȚII FISCALE:
- D110 (impozit profit lichidare) — final
- D101 anual
- D300 ultim
- D205 dividende dacă s-au distribuit interimar
- D700 modificare ANAF
- Plata TOATE obligațiile fiscale ÎNAINTE de radiere (altfel ANAF blochează)

DURATA TOTALĂ: 4-8 luni standard.
COSTURI: ~3.000-5.000 RON (lichidator, taxe ONRC, MO, comisioane).`,
    sources: [
      { label: "Legea 31/1990 art. 227-260", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "lege31-fuziune-divizare",
    tags: ["fuziune", "divizare", "reorganizare", "art 238", "L31"],
    title: "Fuziune și divizare societăți (L 31/1990 art. 238-251)",
    body: `FUZIUNEA poate fi:
- FUZIUNE PRIN ABSORBȚIE: o societate absoarbe alta (cea absorbită dispare)
- FUZIUNE PRIN CONTOPIRE: două societăți se desființează → una nouă

DIVIZARE poate fi:
- DIVIZARE TOTALĂ: societatea se desființează → 2+ societăți noi
- DIVIZARE PARȚIALĂ: o ramură de activitate trece la altă societate (vânzare/transfer)

DOCUMENTE OBLIGATORII:
- Proiect de fuziune/divizare (aprobat AGA toate părțile)
- Raport administratori
- Bilanț de fuziune
- Publicare Monitorul Oficial (cu 30 zile înainte de AGA finală)
- Aprobare AGA cu cvorum 75%
- Raport expert independent (pentru transferuri >250.000 RON)

REGIM FISCAL FUZIUNE NEUTRĂ (Cod Fiscal art. 32-33):
- NU se aplică impozit pe profit imediat
- Activele se transferă la valoarea contabilă
- Pierderile fiscale transferate (cu limite)
- Dividendele NU se distribuie automat
- TVA: tranzacția e neimpozabilă dacă continuitate activitate

TIMP: 6-12 luni proces complet. Costuri: 10.000-30.000 RON.`,
    sources: [
      { label: "Legea 31/1990 art. 238-251", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 32-33 (fuziune neutră)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  // ===========================================================================
  // OUG 44/2008 — PFA / II / CMI
  // ===========================================================================
  {
    id: "oug44-pfa-fara-personalitate",
    tags: ["PFA", "II", "personalitate juridică", "OUG 44/2008"],
    title: "OUG 44/2008 — PFA și II nu au personalitate juridică distinctă",
    body: `PFA (Persoană Fizică Autorizată) și II (Întreprindere Individuală) sunt EXTENSII ale persoanei fizice — NU entități juridice distincte.

IMPLICAȚII:
1. **Patrimoniul** PFA = patrimoniul personal al titularului (cu mențiunea separată "bunuri afectate activității")
2. **Răspunderea** = nelimitată cu averea personală
3. **Poprirea** cumulează venit total (salariu + PFA) — 1/3 din net (art. 729 CPC)
4. **Succesiunea** = moștenitorii preiau + radiază sau continuă activitatea
5. **Înregistrare/modificare** = D070 (NU D700 care e pentru PJ)

DIFERENȚE PFA vs II:
- PFA: doar titularul desfășoară activitatea
- II: titularul + membri familie pot lucra
- Ambele: contabilitate în partidă simplă (sau dublă opțional)

INCOMPATIBILITĂȚI:
- Salariat full-time la altă firmă pentru aceeași activitate = conflict
- Profesii reglementate (medic, avocat) cer formă specifică (PFI, cabinet)

ÎNREGISTRARE: ONRC + ANAF D070. Cost ~150-300 RON.`,
    sources: [
      { label: "OUG 44/2008 art. 2-3", ref: "https://legislatie.just.ro" },
      { label: "Cod Procedură Civilă art. 729 (poprire)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "oug44-pfa-succesiune",
    tags: ["PFA", "deces", "succesiune", "moștenitori", "OUG 44/2008"],
    title: "PFA decedat — succesiune și radiere (OUG 44/2008 art. 17)",
    body: `La decesul titularului PFA, OPȚIUNILE moștenitorilor:

OPȚIUNEA A — RADIERE PFA
1. Obținere certificat moștenitor (notariat)
2. Depunere D070 cu mențiune "deces + radiere"
3. Plata obligațiilor fiscale restante (PFA continuă să datoreze CASS/CAS până radiere)
4. Lichidare stoc (vânzare/preluare succesiune)
5. Bilanț de încheiere

OPȚIUNEA B — CONTINUARE ACTIVITATE DE MOȘTENITOR
- Moștenitorul (de regulă soț/copil) preia PFA dacă are calificarea profesională
- Modificare titular la ONRC + ANAF
- Continuitate fiscal (perioade neimpozabile transferate)

OBLIGAȚII FISCALE LA DECES:
- D200/D212 cu venitul realizat până la deces
- CASS/CAS pro rata zilelor anului
- D101 anual proprio rata
- TVA: ultim decont depus de moștenitor

CONTURI PFA:
- Sumele rămase trec la masa succesorală
- Banca poate cere dovada certificatului moștenitor pentru deblocarea conturilor
- Bunurile afectate activității → masa succesorală
- Stocuri → vândute sau preluate de moștenitor`,
    sources: [
      { label: "OUG 44/2008 art. 17 (succesiune)", ref: "https://legislatie.just.ro" },
      { label: "Cod Procedură Fiscală art. 24 (succesiune fiscală)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  // ===========================================================================
  // LEGEA CONTABILITĂȚII (L 82/1991) + OMFP 1802/2014
  // ===========================================================================
  {
    id: "lcont-registre-obligatorii",
    tags: ["registre", "contabilitate", "obligatoriu", "L 82/1991"],
    title: "Registre contabile obligatorii (L 82/1991 art. 22)",
    body: `Societățile comerciale au OBLIGAȚIA să țină registrele contabile:

1. **Registrul jurnal** — toate operațiunile economice și financiare în ordine cronologică
2. **Registrul inventar** — stocurile fizice anuale (sau periodice) cu cantități și valori
3. **Cartea mare** — pentru fiecare cont contabil
4. **Registrul de salarii / state plată** — calcul salarii și contribuții

PĂSTRAREA registrelor:
- **10 ani** — registrele și documentele justificative (regula generală)
- **50 ani** — state de plată pentru pensii (drepturile salariale)
- **Permanent** — actele de înființare, modificare, dizolvare

FORMA:
- Hârtie sau electronic (cu semnătură electronică)
- Pagini numerotate, sigilate
- Înregistrări în ordine cronologică, fără spații

CONTRAVENȚII (art. 41-44):
- Neținerea: 1.000 - 10.000 RON
- Ținerea necorespunzătoare: 500 - 5.000 RON
- Distrugere/sustragere: penal posibil (art. 9 L 241/2005 evaziune)

OBLIGAȚIE: la control ANAF, registrele trebuie prezentate IMEDIAT în formă citibilă.`,
    sources: [
      { label: "Legea contabilității 82/1991 art. 22", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (reglementări contabile)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  // ===========================================================================
  // ONG — Legea 246/2005 + OG 26/2000
  // ===========================================================================
  {
    id: "ong-og26-asociatii-fundatii",
    tags: ["ONG", "asociație", "fundație", "OG 26/2000"],
    title: "OG 26/2000 — Constituire ONG (asociații, fundații, federații)",
    body: `Constituirea ONG-urilor în RO:

ASOCIAȚIE:
- Minim 3 membri fondatori (persoane fizice sau juridice)
- Act constitutiv + statut (notarial sau privat)
- Patrimoniu minim: 200 RON (modificat OG 39/2020)
- Înregistrare în Registrul asociațiilor și fundațiilor (judecătoria)

FUNDAȚIE:
- Un singur fondator (PF sau PJ) suficient
- Patrimoniu minim: 200 RON
- Scop nepatrimonial obligatoriu
- Aceeași procedură de înregistrare

OBIECTIVE ELIGIBILE (sponsorizare deductibilă):
- Caritabile, culturale, sportive, sociale, educaționale
- Promovarea sănătății, protecția mediului
- Protecția consumatorului, asistența socială
- Cercetare, dezvoltare, educație

DUPĂ ÎNREGISTRARE:
- CIF de la ANAF (D070)
- Cod CAEN obligatoriu
- Eligibilitate sponsorizare (înregistrare în Registru ANAF special)
- Posibilitate primire 3,5% impozit pe venit (D177 redirectionare)

OBLIGAȚII FISCALE:
- Cod Fiscal Titlul IX — impozit pe venituri ONG (3% pe venituri economice)
- Scutire pentru: cotizații membri, donații, sponsorizări, finanțări nerambursabile
- D101 anual + D300 dacă are activitate economică TVA`,
    sources: [
      { label: "OG 26/2000 privind asociațiile și fundațiile", ref: "https://legislatie.just.ro" },
      { label: "Legea 246/2005 — sponsorizare", ref: "https://legislatie.just.ro" },
      { label: "Legea 32/1994 (modif.) — sponsorizare", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "ong-sponsorizare-deductibila",
    tags: ["ONG", "sponsorizare", "deductibilitate", "L 32/1994", "L 246/2005"],
    title: "Sponsorizarea către ONG — deductibilitate fiscală",
    body: `SPONSORIZAREA către ONG eligibil = deductibilă fiscal pentru SPONSOR (firma).

LIMITĂ DEDUCERE — MIN dintre:
- **20% × impozit pe profit datorat anual**
- **0,75% × cifra de afaceri anuală**

Se alege întotdeauna VARIANTA MAI MICĂ.

ELIGIBILITATE ONG BENEFICIAR:
- Înregistrat în Registrul entităților ANAF pentru sponsorizare
- Activitate non-profit conform statut
- Scop social, cultural, educațional, sportiv, etc.
- Acreditare specifică pentru anumite domenii (sport, educație)

DIFERENȚIERE Sponsorizare vs Mecenat (L 32/1994):
- **Sponsorizare**: contract scris, contraprestație publicitară (logo, mențiune sponsor)
- **Mecenat**: act unilateral fără contraprestație, doar pentru artiști/operă artă

ÎNREGISTRARE CONTABILĂ:
- 6582 = 5121 (la transfer bancar)
- Sau 6582 = 401 + plata ulterioară
- La D101: deducerea sumelor ca cheltuieli + adăugare 20%/0,75% la calcul

REDIRECTIONARE 3,5% IMPOZIT PE VENIT (PF cu venituri salarii):
- D230 cerere (până 25 mai an următor)
- ONG primește direct de la ANAF
- Doar pentru ONG-uri certificate cu eligibilitate redirectionare

REDIRECTIONARE 20% IMPOZIT PROFIT (D177):
- Pentru SRL/SA cu impozit profit
- Termen 25 iunie an următor
- Procedură separată (vezi entry decl-d177-redirectionare-ong)`,
    sources: [
      { label: "Legea 32/1994 — sponsorizare", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25 alin. (4) lit. i)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF D230 + D177", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  // ===========================================================================
  // OG 28/1999 — Case de marcat (AMEF)
  // ===========================================================================
  // ===========================================================================
  // PATTERN DENSITY din batch Portal (50+ spețe noi, 2026-05-15)
  // Zone NEACOPERITE bine de Cod Fiscal generic — entries dedicate
  // ===========================================================================
  {
    id: "tva-operatiuni-triunghiulare",
    tags: ["TVA", "operațiuni triunghiulare", "intracomunitar", "lanț"],
    title: "Operațiuni triunghiulare UE — măsură de simplificare TVA",
    body: `Operațiuni triunghiulare = 3 societăți din 3 state membre UE diferite, în lanț comercial (A → B → C), unde marfa pleacă direct de la A la C, fără a tranzita statul lui B (intermediarul).

CONDIȚII obligatorii pentru aplicare (Cod Fiscal art. 268, 270):
1. Trei părți: furnizor (A), intermediar (B), beneficiar (C)
2. Toate înregistrate în scopuri TVA în state membre UE DIFERITE
3. Marfa pleacă din statul A direct la C (NU prin B)
4. B nu este înregistrat TVA în statul C

EFECT FISCAL (simplificare):
- A → B: livrare intracomunitară scutită (cu cod TVA valid B în VIES)
- B → C: B NU plătește TVA în statul C; menționează pe factură "operațiune triunghiulară simplificată"
- C: aplică taxare inversă pe achiziția intracomunitară

PE FACTURA B → C, OBLIGATORIU:
- Mențiunea "Operațiune triunghiulară simplificată"
- Codul TVA al cumpărătorului final C
- Trimitere la art. 197(1)(b) sau 141 Directiva TVA UE

DECLARAȚII (pentru B român):
- D300: linia 6 (achiziție intracomunitară fictivă fără TVA)
- D390: cod L (livrare în triunghi) — important pentru cross-check VIES
- NU se cumulează cu plafonul 10.000 EUR (achiziții intracomunitare obișnuite)

EXEMPLU: Italia A → România B → Cehia C. Marfa pleacă din Italia direct la Cehia. România NU plătește TVA, doar declară D300+D390.`,
    sources: [
      { label: "Cod Fiscal art. 268, 270, 297", ref: "https://legislatie.just.ro" },
      { label: "Directiva 2006/112/CE art. 141, 197", ref: "https://eur-lex.europa.eu" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "tva-plafon-10k-cod-special",
    tags: ["TVA", "achiziții intracomunitare", "plafon 10K EUR", "cod special TVA"],
    title: "Plafon 10.000 EUR achiziții intracomunitare — cod special TVA",
    body: `Persoanele neplătitoare de TVA (microîntreprinderi sub plafon, PFA, asociații) au obligația obținerii CODULUI SPECIAL DE TVA când depășesc cumulativ plafonul de 10.000 EUR (34.000 RON) la achiziții intracomunitare.

PRAGUL DECLANȘATOR:
- 10.000 EUR (~34.000 RON la curs medie BNR) achiziții intracomunitare CUMULATE într-un an calendaristic
- Calculat după valoarea de pe facturi (fără TVA)
- Inclusiv achiziții de la mici fermieri/persoane fără cod valid VIES

OBLIGAȚII LA DEPĂȘIRE:
1. **Cerere cod special TVA** (formular 091) ÎNAINTE de operațiunea care depășește plafonul
2. **Cod RO + cod special** = doar pentru achiziții intracomunitare, NU pentru operațiuni interne
3. **Declarare obligatorie**: D301 + D390 lunar
4. **Plată TVA în România** prin D301 (autocollect, 19%/21% după caz)

NEPLĂTITOR TVA + COD SPECIAL — TVA pentru:
- ✅ Achiziții intracomunitare bunuri (autocollect)
- ✅ Servicii primite din UE (taxare inversă)
- ❌ NU pentru vânzări intracomunitare (rămân neimpozabile)
- ❌ NU pentru operațiuni interne (rămân neimpozabile)

CAZ EDGE: achiziție de la mic fermier UE fără cod VIES valid — TVA tot se plătește în România dacă plafonul e depășit.`,
    sources: [
      { label: "Cod Fiscal art. 268 alin. 4-5", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 091/2014 — cerere cod special", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "refacturare-cheltuieli",
    tags: ["refacturare", "cheltuieli", "acreditare", "TVA"],
    title: "Refacturare cheltuieli (ARACIP, ISU, alte taxe) — TVA și deductibilitate",
    body: `REFACTURAREA = redirecționarea costurilor către beneficiar (în special grup, fondator unitate de învățământ, etc.).

REGULA GENERALĂ TVA (Cod Fiscal art. 286):
- Dacă a) cheltuiala a fost cu TVA și b) beneficiarul final are dreptul de deducere → refacturare CU TVA (re-aplicat la cota de la furnizor)
- Dacă a) cheltuiala a fost FĂRĂ TVA (scutire) sau b) beneficiarul nu are drept de deducere → refacturare FĂRĂ TVA (cu mențiune scutire/exception)

TAXE SPECIFICE (ARACIP, ISU, ITM):
- Taxa de acreditare ARACIP: SCUTITĂ de TVA (art. 292 alin. 1 lit. f — servicii educație)
- Refacturare către unitate de învățământ: FĂRĂ TVA, cu mențiune art. 286 alin. 4 + art. 292
- Cont contabil: 7588 "Alte venituri din exploatare — refacturare" sau 704 (servicii) după caz

ATENȚIE — ABSENȚA MARJEI:
- Refacturare la cost = neutră fiscal (venit 7588 = cheltuială 628)
- Refacturare cu marjă = venit impozabil pe diferență
- Documentar: contract scris cu beneficiarul ce stipulează refacturare la cost

DOCUMENTAR OBLIGATORIU:
- Factura originală (cea pe care o refacturezi)
- Contract cu beneficiar specificând tipul refacturare
- Notă explicativă în factura ta către beneficiar`,
    sources: [
      { label: "Cod Fiscal art. 286, 292", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 art. 30-35", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "asociere-participatiune",
    tags: ["asociere în participațiune", "fără personalitate juridică", "art 1949"],
    title: "Asociere în participațiune — fără personalitate juridică (Cod Civil art. 1949)",
    body: `ASOCIEREA ÎN PARTICIPAȚIUNE = colaborare între 2+ părți pentru un proiect comun, FĂRĂ a crea entitate juridică nouă.

CARACTERISTICI (Cod Civil art. 1949-1954):
- Părțile rămân entități separate (fiecare cu CIF propriu)
- Contract scris obligatoriu, înregistrat la ANAF (D070 modif)
- Cota părți (procent venituri/cheltuieli) stabilită prin contract
- O parte = ASOCIAT PRINCIPAL (înregistrează în contabilitate)
- Restul = ASOCIAȚI PARTICIPANȚI (transferă cota lor)

REGIM FISCAL:
- Asociatul principal: înregistrează venituri și cheltuieli 100% în contabilitate
- La final lunar/trimestrial: distribuire venituri și cheltuieli per cota
- Notă contabilă transfer cotă: 461/411 partener × proporție
- D101: doar pentru cota proprie a fiecăruia
- TVA: factura emisă pe asociatul principal; cota se transferă prin notă contabilă

CAZ TIPIC: 2 SRL-uri colaborează pe proiect imobiliar.
- Asociatul A (60%) cumpără terenul, construiește (toate cheltuielile)
- Asociatul B (40%) contribuie cu fonduri
- La finalizare: B transferă 40% din cheltuieli + 40% din venituri în contabilitatea lui

IMPORTANT: NU se confundă cu societate civilă (cu personalitate juridică) sau cu joint venture (entitate UE distinctă).`,
    sources: [
      { label: "Cod Civil art. 1949-1954", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 7 alin. (32) — asociere fără personalitate juridică", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cesiune-parti-sociale-dare-plata",
    tags: ["cesiune", "părți sociale", "dare în plată", "creanță"],
    title: "Dare în plată cu părți sociale — stingere creanțe (Cod Civil art. 1492)",
    body: `DAREA ÎN PLATĂ = stingerea unei datorii prin transmiterea către creditor a unui bun ALT decât cel inițial datorat (Cod Civil art. 1492).

CAZ FREQUENT: SRL datornic (B) nu are lichidități → transmite părți sociale către creditor (A) pentru a stinge datoria.

CONDIȚII:
1. Acord scris al ambelor părți (contract de dare în plată)
2. Evaluare părți sociale = valoarea creanței (sau diferență acoperită cu plată suplimentară)
3. Aprobare ONRC dacă cesiunea afectează structura asociaților

ÎNREGISTRARE CONTABILĂ:
**Asociatul A (creditor cu părți sociale primite):**
- 261/263 = 461/411 (investiție financiară = stingere creanță)
- TVA: NU se aplică (operațiune cu titluri de valoare, scutită art. 292)

**Societatea B (debitor care cedează părți sociale):**
- 401/462 = 1011/1012 (achitare datorie = reducere capital social, dacă e cazul) — depinde de structură
- Sau transmiterea unor părți sociale deținute de B în altă societate

ASPECTE FISCALE:
- NU se generează TVA (părți sociale = instrument financiar)
- Eventual câștig de capital pentru cedent (Cod Fiscal art. 91, 105)
- Pentru PF cedant: impozit 10% pe câștig (diferență valoare cesiune - valoare achiziție)

ONRC: notificare obligatorie + actualizare în Registrul Comerțului (taxă ~150 RON).`,
    sources: [
      { label: "Cod Civil art. 1492 (dare în plată)", ref: "https://legislatie.just.ro" },
      { label: "Legea 31/1990 art. 198-202 (cesiune părți sociale)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "plafon-numerar-legea-70",
    tags: ["numerar", "plafon", "Legea 70/2015", "incasari/plati"],
    title: "Plafoane numerar (Legea 70/2015) — 5.000 RON/zi PJ↔PJ, 10.000 RON/zi PJ↔PF",
    body: `LEGEA 70/2015 reglementează strict operațiunile cu NUMERAR pentru a combate evaziunea.

PLAFOANE ZILNICE per partener:
- **PJ ↔ PJ**: 5.000 RON/zi (între persoane juridice)
- **PJ ↔ PF**: 10.000 RON/zi (între PJ și persoană fizică)
- **PJ ↔ Comercianți**: 10.000 RON/zi (cu PFA, II care vând)
- **Magazine cash-and-carry**: 50.000 RON/zi (vânzări en gros cu numerar)

CALCUL PLAFON:
- Cumul pe ZIUA CALENDARISTICĂ
- Cumul pe PARTENER (același CIF)
- Indiferent câte facturi sau chitanțe se emit

EXEMPLU CONFORM:
- Factura 111: 4.900 RON încasată numerar pe 04.05
- Factura 222: 3.000 RON încasată numerar pe 04.05
- Total: 7.900 RON > 5.000 RON plafon PJ↔PJ → **PLAFON DEPĂȘIT**

CONSECINȚE NEPLAFONARE:
- Amendă 25% din valoarea peste plafon (atât plătitor cât și încasator)
- Amenda fiecare = 25% din diferență

EXCEPȚII:
- Plata salariilor în numerar (chiar dacă >5.000): permisă cu condiție evidență strictă
- Tranzacții imobiliare prin notariat
- Plata datoriilor către bugetul de stat (dar băncile preferă transfer)

REGULĂ DE AUR: pentru orice tranzacție >5.000 RON, **folosește OP/transfer bancar**.`,
    sources: [
      { label: "Legea 70/2015 art. 4-6", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "provizioane-garantie-buna-executie",
    tags: ["provizioane", "garanție bună execuție", "construcții-montaj", "cont 1512"],
    title: "Provizioane garanție bună execuție (cont 1512) — construcții și montaj",
    body: `PROVIZIONUL pentru garanție bună execuție se constituie când contractele prevăd o sumă reținută de client (3-7% din valoare) pentru a acoperi eventualele reparații în perioada de garanție.

CONT CONTABIL: 1512 "Provizioane pentru garanții acordate clienților"

DEDUCTIBILITATE FISCALĂ (Cod Fiscal art. 26 alin. 1 lit. b):
✅ DEDUCTIBILE integral provizioanele constituite pentru garanție bună execuție pe contracte de construcții-montaj
- Limita: valoarea garanției efective stabilite în contract
- Perioada: maxim durata garanției contractuale

ÎNREGISTRARE:
- Constituire: 6812 = 1512 (cheltuială deductibilă)
- Plata reparații în garanție: 1512 = 401/462 (consumare provizion)
- La expirarea garanției fără cheltuieli: 1512 = 7812 (venit din anularea provizioanelor)

RAPORTARE D101:
- La inscriere: deducere fiscală în anul constituirii
- La anulare: venit impozabil în anul anulării

ATENȚIE — VECHIME PROVIZIOANE:
- Provizioanele rămase >3 ani fără utilizare = trebuie analizate
- Verifică dacă perioada garanție contractuală s-a încheiat
- Dacă DA → anulează (1512 = 7812) și impozitează ca venit
- Dacă NU → menține în continuare

ALTE TIPURI PROVIZIOANE 151:
- 1511 — Litigii (deductibil parțial cf. art. 26)
- 1513 — Restructurare (deductibil cu condiții)
- 1514 — Pensii (deductibil cu plan oficial)
- 1518 — Alte provizioane (case by case)`,
    sources: [
      { label: "Cod Fiscal art. 26 alin. 1 lit. b", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 art. 376-383", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "subventii-pnrr-monografie",
    tags: ["PNRR", "subvenții", "monografie", "OMFP 3103/2017"],
    title: "Monografie contabilă subvenții PNRR — recunoaștere + amortizare",
    body: `SUBVENȚIILE PNRR (Planul Național de Redresare și Reziliență) urmează OMFP 3103/2017 + OMFP 1802/2014.

CONTABILIZARE:

**1. Aprobare subvenție (creanță):**
- 4458 = 472 (subvenție pentru investiții — venit în avans)

**2. Încasare în bancă:**
- 5121 = 4458 (transformare creanță în bani)

**3. Achiziție bun cu subvenție (ex: instalație fotovoltaică):**
- 213 = 404 (imobilizare la valoare integrală)
- 4426 = 404 (TVA dedusă)
- Plata: 404 = 5121

**4. Amortizare LUNARĂ (proporțional pe durata utilă):**
- 6811 = 281x (amortizare cheltuială)
- 472 = 7584 (transferul subvenției pe venit — proporțional cu amortizarea)

EXEMPLU: Subvenție 50.000 RON pentru instalație 100.000 RON, durata 10 ani:
- Lunar 10 ani: 6811 = 281x cu 833 RON (amortizare lunară)
- Lunar 10 ani: 472 = 7584 cu 417 RON (50% transfer subvenție)
- Net pe P&L lunar: -416 RON (jumătate amortizare absorbită)

REGIM FISCAL:
- Subvenția 7584 = VENIT NEIMPOZABIL (Cod Fiscal art. 22)
- Amortizarea 6811 = INTEGRAL DEDUCTIBILĂ
- Calcul D101: scădeți 7584 din venit + adăugați amortizarea integrală

CORECȚIE ANI ANTERIORI (dacă subvenția se primește în anul N+1 dar amortizare e din N):
- Eroare contabilă semnificativă → corectare prin contul 1174 (rezultatul reportat)
- Eroare nesemnificativă → corectare în anul curent prin venituri/cheltuieli`,
    sources: [
      { label: "OMFP 3103/2017", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 art. 426-430", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 22 (venituri neimpozabile)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "oug-8-2026-amortizare-prag",
    tags: ["OUG 8/2026", "amortizare", "prag", "2500", "5000"],
    title: "OUG 8/2026 — Praguri amortizare (2.500 lei + 5.000 lei)",
    body: `OUG 8/2026 a introdus PRAGURI NOI pentru tratamentul fiscal al achizițiilor de bunuri:

REGIM TREI PRAGURI:

**1. Sub 2.500 RON (fără TVA):**
- Cheltuială integrală în anul achiziției (cont 603, 604, 628)
- NU este mijloc fix
- NU se amortizează
- Beneficii: tot impactul în P&L imediat, simplificare

**2. Între 2.500 - 5.000 RON (fără TVA):**
- Opțiune: cheltuială totală SAU amortizare
- Recomandat: cheltuială (mai simplu, beneficiu fiscal imediat)
- Pentru durabilitate >1 an: poate fi amortizat (alegere contabil)

**3. Peste 5.000 RON (fără TVA):**
- OBLIGATORIU mijloc fix
- Amortizare lineară pe durata utilă
- Cont 21x în funcție de natura activului
- Înregistrare în Registrul Imobilizărilor

INSTITUȚII PUBLICE FINANȚATE DIN VENITURI PROPRII (OUG 8/2026):
- Aceleași praguri se aplică
- Plus reguli speciale pentru amortizarea accelerată
- Categorii eligibile amortizare accelerată: echipamente IT, software, autovehicule electrice

EXEMPLU: Cumpăr laptop 3.500 RON:
- ✅ Decid cheltuială integrală în luna achiziției (cont 628 sau 213 amortizat 100%)
- SAU
- ✅ Înregistrez ca mijloc fix amortizat 3 ani

INTRAREA ÎN VIGOARE: praguri aplicabile la achiziții făcute după publicarea OUG.`,
    sources: [
      { label: "OUG 8/2026 — modificări Cod Fiscal", ref: "https://monitoruloficial.ro" },
      { label: "Cod Fiscal art. 28 (după modificări)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "tva-taxare-inversa-deseuri",
    tags: ["TVA", "taxare inversă", "deșeuri", "scrap", "lemn", "art 331"],
    title: "Taxare inversă pentru deșeuri — scrap, lemn, aur, materiale reciclabile",
    body: `TAXAREA INVERSĂ se aplică OBLIGATORIU pentru anumite categorii de deșeuri și materiale reciclabile (Cod Fiscal art. 331).

CATEGORII CU TAXARE INVERSĂ OBLIGATORIE:
1. **Deșeuri feroase și neferoase** (scrap metal)
2. **Reziduuri și material reciclabil** (sticlă, hârtie, plastic, cauciuc)
3. **Deșeuri lemnoase**
4. **Cereale și plante tehnice**
5. **Aur de investiții** (lingouri, monede)
6. **Telefoane mobile, tablete, console**
7. **Cipuri electronice și jocuri**
8. **Energie electrică** (între distribuitori)
9. **Certificate verzi**

MECANISM:
- Furnizor: emite factura FĂRĂ TVA (cu mențiune "Taxare inversă, art. 331")
- Cumpărător: ÎNREGISTREAZĂ TVA-ul în D300 ca:
  - TVA colectată (4427) — rândul de autocollect
  - TVA deductibilă (4426) — același rând cu deducere
  - Efect net pe TVA = 0

ÎNREGISTRARE CONTABILĂ CUMPĂRĂTOR:
- 3xx/6xx = 401 (cheltuiala fără TVA, valoarea integrală a facturii)
- 4426 = 4427 (auto-collect TVA pe valoarea bazei)

CAZ COMERȚ DEȘEURI (revanzare):
- Achiziție de la persoane fizice (scrap)
- Persoanele fizice NU au CUI → tranzacția e cu "particulari"
- Aplicare regim special revanzare bunuri second-hand (art. 312) sau taxare inversă dacă societate→societate

CAZ AUR INVESTIȚIE (Cod Fiscal art. 313):
- Scutire de TVA pentru aur ≥99,5% puritate (investiție pură)
- Taxare inversă pentru aur cu altă puritate
- Bijuterii fără TVA (vânzare PJ→PF) — scutire conform art. 292`,
    sources: [
      { label: "Cod Fiscal art. 331 (taxare inversă)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 313 (aur de investiții)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 312 (regim bunuri second-hand)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "dividende-interimare-regularizare",
    tags: ["dividende interimare", "regularizare", "T4", "463", "456"],
    title: "Dividende interimare + regularizare T4 (regularizare 463/456)",
    body: `DIVIDENDELE INTERIMARE = distribuiri pe trimestru, înainte de aprobarea situațiilor financiare anuale (Cod Fiscal art. 67 + Legea 31/1990).

PROCEDURĂ PE TRIMESTRE:
**T1, T2, T3:**
1. Bilanț interimar trimestrial
2. AGA decizie dividende interimare
3. Note contabile:
   - 463 = 456 (dividende declarate)
   - 456 = 446 (impozit reținut 8%)
   - 456 = 5121 (plata netă către asociați)

**T4 / SFÂRȘIT AN (regularizare):**

CAZUL 1 — Profit net real ≥ dividende interimare distribuite:
- Repartizare profit rest: 121 = 117 (rezerve) sau 121 = 117 (rezultat reportat)
- Notă reglare: 117 = 463 (transferul dividend acumulat în categoria definitivă)

CAZUL 2 — Profit net real < dividende interimare distribuite:
- ATENȚIE: dividendele interimare distribuite peste profit = RESTITUIRE OBLIGATORIE
- Asociații restituie suma în plus în 60 zile de la aprobarea bilanțului anual
- Notă contabilă: 5121 = 463 (recuperare dividend exces)
- Sau menținere ca avans asociat: 463 = 4551 (împrumut asociat)

OBLIGAȚIE PROCEDURALĂ:
- Statutul societății trebuie să prevadă EXPLICIT posibilitatea dividendelor interimare
- Bilanțul interimar trebuie auditat pentru SRL cu peste 50 angajați
- D205 cumulează TOATE plățile (interimare T1-T3 + final)
- D100 lunar pentru fiecare plată

CAZ COMPLEX (din spețe Portal):
- T1-T3 distribuit 310.000 RON
- Profit net real la 31.12: doar 273.987 RON
- Diferența 36.013 RON: trebuie restituită sau menținută ca împrumut asociat`,
    sources: [
      { label: "Cod Fiscal art. 67, art. 132", ref: "https://legislatie.just.ro" },
      { label: "Legea 31/1990 art. 67 (dividende)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 art. 414 (dividende)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "casa-numerar-pfa-titular",
    tags: ["PFA", "numerar", "titular", "deducere", "personal"],
    title: "PFA — retragere numerar din cont pentru folosință personală titular",
    body: `PFA NU are personalitate juridică distinctă de titular (OUG 44/2008). Banii din cont sunt ai persoanei fizice cu mențiunea afectării activității.

REGULĂ FISCALĂ:
- Banii din contul PFA aparțin titularului persoană fizică
- Retragerea cu card pentru folosință personală = LEGAL (nu e dividend ca la SRL)
- NU se impozitează la retragere
- DAR — cheltuielile personale NU SUNT deductibile

ÎNREGISTRARE CONTABILĂ (partidă simplă):
- Retragere cu card pentru activitate: notează în registrul de încasări/plăți cu mențiune
- Retragere personală: NU se înregistrează deloc (sau cu mențiune clară "personal", cheltuială ne-deductibilă)
- Plată personală cu cardul PFA: notează ca neîncadrabilă în activitate

REGULA DE AUR: la sfârșit de an, calculezi venitul NET conform art. 68 — numai cheltuielile pentru activitate scad din venituri. Cele personale nu.

CAZ TIPIC: PFA serviciu de consultanță, încasează 10.000 RON pe lună.
- Retrage 6.000 numerar pentru cheltuieli personale (alimente, chirie locuință)
- Plătește din cont PFA cu cardul 1.500 RON pentru abonamente (jumate activitate, jumate personal)

REGISTRU PFA:
- Venit lunar: 10.000 RON
- Cheltuieli deductibile: 750 RON (50% din abonamente, partea pentru activitate)
- Cheltuieli ne-deductibile: 6.750 RON (retrageri personale + 50% abonamente)
- Venit net impozabil: 10.000 - 750 = 9.250 RON

IMPORTANT — TVA pe carduri PFA:
- Plățile cu cardul PFA NU sunt impozitate cu TVA pe extragere (nu e tranzacție impozabilă)
- TVA se aplică doar la facturare către clienți`,
    sources: [
      { label: "Cod Fiscal art. 68 (cheltuieli deductibile PFA)", ref: "https://legislatie.just.ro" },
      { label: "OUG 44/2008 (PFA — patrimoniu)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "og28-case-marcat-amef",
    tags: ["casă marcat", "AMEF", "OG 28/1999", "obligație"],
    title: "OG 28/1999 — Case de marcat (AMEF) obligație și înregistrare",
    body: `CASE DE MARCAT ELECTRONICE FISCALE (AMEF) obligatorii pentru operatori economici care încasează NUMERAR de la persoane fizice.

ACTIVITĂȚI CU OBLIGAȚIE AMEF:
- Comerț cu amănuntul (food, non-food)
- HoReCa (restaurante, baruri, cafenele)
- Servicii pentru populație (frizerie, salon, atelier reparații)
- Vânzare cu plată cash la livrare (B2C)

EXCEPȚII:
- Tranzacții B2B (între firme)
- Vânzare online cu plată exclusiv card/transfer
- PFA/II fără activitate publică
- Anumite servicii scutite expres

PROCEDURĂ INSTALARE:
1. Achiziție AMEF de la distribuitor autorizat ANAF
2. Cerere atribuire număr unic (formular C801 prin SPV)
3. Confirmare ANAF cu serie + număr (2-5 zile)
4. Fiscalizare la distribuitor (instalează profil fiscal)
5. Activare punct de lucru (CIF + adresă declarate la ONRC)
6. Configurare raportare Z lunară (obligatoriu transmitere ANAF)

OBLIGAȚII OPERATIONALE:
- Tipăriri bon fiscal LA FIECARE tranzacție
- Z zilnic la sfârșitul programului
- Raport Z lunar transmis ANAF (electronic obligatoriu din 2020)
- Păstrare role bonuri 5 ani

AMENZI (L 70/2015 cumulativ):
- Lipsa AMEF când e obligatorie: 8.000 - 10.000 RON
- Neemitere bon fiscal: 5.000 - 10.000 RON
- Lipsa Z lunar transmis: 1.000 - 5.000 RON`,
    sources: [
      { label: "OG 28/1999 cu modificările ulterioare", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 4156/2017 (procedură AMEF)", ref: "https://anaf.ro" },
      { label: "Legea 70/2015 (sancțiuni numerar)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
];
