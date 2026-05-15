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
  {
    id: "corectare-erori-cont-1174-vs-1171",
    tags: ["corectare erori", "1174", "1171", "rezultat reportat", "OMFP 1802", "erori contabile"],
    title: "Cont 1174 vs 1171 — distincția canonică pentru corectarea erorilor",
    body: `CONT 1174 = Rezultat reportat provenit din corectarea erorilor contabile
CONT 1171 = Rezultat reportat — profit/pierdere din anii precedenți (NEDISTRIBUIT)

REGULA DE BAZĂ (OMFP 1802/2014 art. 63-65):
- Erori NESEMNIFICATIVE → trec pe CHELTUIALA/VENITUL anului curent (NU 1174)
- Erori SEMNIFICATIVE aferente anilor precedenți cu bilanț DEPUS → cont 1174

CÂND FOLOSEȘTI 1174:
1. Factură veche neînregistrată descoperită în anul curent (suma SEMNIFICATIVĂ):
   1174 = 401  (cheltuială istorică)
   4426 = 401  (TVA aferentă — dacă există drept de deducere)

2. Anulare venit eronat înregistrat în anul precedent:
   4111 = 1174 (cu minus) sau 1174 = 4111 (în roșu)

3. Storno facturi emise eronat în anii precedenți:
   4111 = 1174 (storno venit istoric)
   4427 = 1174 (storno TVA istoric)

4. Decizie ANAF — TVA/impozit suplimentar pentru anii precedenți:
   635 sau 1174 = 446 (impozit suplimentar)
   4426 sau 1174 = 4423 (TVA suplimentar de plată)

5. Amortizare neînregistrată în anii precedenți:
   1174 = 281x (recuperare amortizare istorică)

ÎNCHIDEREA CONTULUI 1174:
La sfârșitul exercițiului în care s-a făcut corectarea:
- Sold CREDITOR 1174 → trece la 1171 (rezultat reportat)
  1174 = 1171 (transfer la profit/pierdere reportat)
- Sold DEBITOR 1174 → tot 1171 (acoperire pierdere reportată)
  1171 = 1174

NU se închide pe 121 (rezultat curent)! Asta ar distorsiona profitul/pierderea anului curent.

TRATAMENT FISCAL CRUCIAL:
- Sumele înregistrate prin 1174 NU sunt deductibile/impozabile la calculul impozitului pe profit din anul curent
- Se ajustează D101 (rectificativa) pentru anul cu eroarea, NU se modifică 101 din anul curent
- EXCEPȚIE: dacă eroarea este nesemnificativă (sub prag), se trece pe cheltuiala curentă și este deductibilă în anul curent (justificare: principiul materialității)

PRAG SEMNIFICATIVITATE:
OMFP 1802/2014 NU stabilește un prag fix. În practică:
- Sub 5% din profit brut → nesemnificativă (politică contabilă proprie)
- Peste 5% sau peste 1% din cifră afaceri → semnificativă obligatoriu pe 1174
- Erori care schimbă rezultatul din profit în pierdere sau invers → ÎNTOTDEAUNA semnificative

ATENȚIE PIERDERE FISCALĂ:
Dacă corectezi prin 1174 pe profit istoric, pierderea fiscală reportată trebuie recalculată în D101 rectificativă.`,
    sources: [
      { label: "OMFP 1802/2014 art. 63-65 (corectarea erorilor)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 19 (impozit profit — erori)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "erori-semnificative-vs-nesemnificative-prag",
    tags: ["erori semnificative", "erori nesemnificative", "OMFP 1802", "materialitate", "corectare erori"],
    title: "Erori contabile semnificative vs nesemnificative — prag și tratament",
    body: `OMFP 1802/2014 art. 63-65 — TRATAMENT ERORI CONTABILE:

ERORI NESEMNIFICATIVE (curente):
- Înregistrare pe seama VENITULUI/CHELTUIELII anului curent
- Conturi: 7x (venituri) sau 6x (cheltuieli) cu data constatării
- TRATAMENT FISCAL: deductibilă/impozabilă în anul curent
- D101 anul curent (NU rectificativă anteriori)
- Justificare în Registru Inventar + notă explicativă

ERORI SEMNIFICATIVE:
- Înregistrare pe cont 1174 (Rezultat reportat din corectare erori)
- D101 rectificativă pentru anul cu eroarea (cu accesorii: dobânzi 0.02%/zi + penalități 0.01%/zi)
- Bilanț depus NU se modifică retroactiv (excepție: descoperire înainte de aprobarea AGA)
- TRATAMENT FISCAL: NU deductibilă/impozabilă în anul curent — ajustare anul cu eroarea

PRAG SEMNIFICATIVITATE (politică contabilă proprie):
- Practica curentă: 5% din profit brut sau 1% din cifră afaceri
- Erori cumulative: dacă suma erorilor depășește pragul → toate semnificative
- Schimbarea rezultatului (profit→pierdere sau invers) = AUTOMAT semnificativă
- Erori cu impact pe TVA recuperabilă/plată → de obicei semnificative (impact ANAF)

EXEMPLE PRACTICE:
EROARE NESEMNIFICATIVĂ (firma 5M cifră afaceri, profit 200K):
- Factură 1.000 lei neînregistrată 2024 → 600/611 = 401 în 2025 (sub 0.5% profit)

EROARE SEMNIFICATIVĂ (aceeași firmă):
- Factură 50.000 lei neînregistrată 2024 → 1174 = 401 + D101 rectificativă 2024 (25% profit)
- TVA 9.500 lei nededus 2024 → 4426 = 401 cu 1174 prin diferență

DECIZIE PERMANENTĂ:
Politica contabilă proprie a firmei TREBUIE să definească pragul de materialitate în scris (politica contabilă internă) — auditat de cenzori/auditori dacă este cazul.

DOCUMENTAȚIE OBLIGATORIE:
1. Notă explicativă în Registru Inventar
2. Hotărâre administrator (decizie corectare)
3. Calcul accesorii (dobânzi + penalități) pentru rectificative
4. Anexă la situațiile financiare anuale (rezumat erori corectate)`,
    sources: [
      { label: "OMFP 1802/2014 art. 63-65", ref: "https://legislatie.just.ro" },
      { label: "Cod Procedură Fiscală art. 173-174 (dobânzi/penalități)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "regularizare-tva-schimbare-cota-avans-livrare",
    tags: ["TVA", "schimbare cotă", "avans", "regularizare", "21%", "11%", "OUG 156/2024"],
    title: "Regularizare TVA — schimbare cotă între avans și livrare (2025: 19→21% și 9→11%)",
    body: `OUG 156/2024 a modificat cotele TVA de la 01.07.2025:
- Cota standard: 19% → 21%
- Cota redusă: 9% → 11%
- Cota redusă: 5% → 11% (alimentație, cărți, medicamente)

PROBLEMA RECURENTĂ: avans facturat cu cota veche (înainte 01.07.2025), livrare după 01.07.2025.

REGULA FUNDAMENTALĂ (Cod Fiscal art. 291):
TVA datorată = cota la data FAPTULUI GENERATOR (livrarea bunului / prestarea efectivă a serviciului)
NU cota la data facturii de avans.

PROCEDURĂ REGULARIZARE:

1. FACTURA AVANS emisă cu cota veche (ex. 9% în iunie 2025):
   - Bază: 29.136 lei + TVA 9% = 2.622 lei
   - Înregistrare 4111 = 419 + 4427 (TVA exigibilă la avans)

2. FACTURA FINALĂ la livrare (ex. octombrie 2025, cotă nouă 11%):
   Trei coloane:
   a) STORNARE AVANS la cota veche (-29.136 + -2.622 TVA 9%)
   b) FACTURARE LIVRARE TOTAL la cota nouă 11%
   c) DIFERENȚĂ NET de încasat/restituit

3. EXEMPLU CONCRET:
   Avans iulie: 29.136 + 2.622 (9%) = 31.758 lei (deja achitat)
   Livrare oct: 7.820 kg × 3.642 = 28.479 lei + TVA 11% = 3.133 lei = 31.612 lei

   Factura finală conține:
   - Storno avans: -29.136 lei + -2.622 TVA 9%
   - Livrare totală: 28.479 lei + 3.133 TVA 11%
   - Diferență netă: -657 lei (de restituit clientului) sau încasare diferență

DECLARAȚII:
- D300: stornare avans la rândul 12 (cota veche), facturare la rândul 9/10 (cota nouă)
- D394: două rânduri separate (avans negativ + livrare pozitivă)
- D406 (SAF-T): tip factură "388" (storno avans) + "380" (factură obișnuită)

CAZ AVANS UE (achiziție intracomunitară):
- Avans 2024 cu 19%, factură finală 2026 (după aplicare 21%):
- Storno avans cu 19% (taxare inversă negativă pe cota veche)
- Factură finală cu 21% (taxare inversă pe cota nouă)
- Diferența 2% intră în TVA de plată în luna stornării
- Conturi: 4426 = 4427 cu cota nouă, regularizare 4426 = 1174 cu diferența istorică (dacă semnificativă)`,
    sources: [
      { label: "OUG 156/2024 (modificare cote TVA)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 282, 291 (fapt generator + cote)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF (norme aplicare schimbare cotă)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "decizie-impunere-anaf-monografie",
    tags: ["decizie impunere", "ANAF", "control fiscal", "monografie", "1174", "TVA suplimentar", "impozit suplimentar"],
    title: "Decizie de impunere ANAF — monografie contabilă rezultat control fiscal",
    body: `Rezultat control fiscal = decizie impunere cu TVA/impozit suplimentar + accesorii.

PRINCIPIU GENERAL:
- Sumele suplimentare = corectare retroactivă → cont 1174 (rezultat reportat din corectare erori)
- Accesoriile (dobânzi + penalități) = cheltuială ANULUI deciziei (NU 1174) — sunt cheltuieli noi, nu corecții
- NU se modifică rezultatul anilor controlați; ajustarea se face în 1174 + D101 rectificativă

MONOGRAFIE COMPLETĂ:

1. ÎNREGISTRARE DECIZIE PRIMITĂ (la data deciziei):
   a) Impozit profit suplimentar:
      1174 = 4411 (impozit profit suplimentar — anii anteriori)
   b) TVA suplimentar de plată:
      1174 = 4423 (TVA suplimentar; sau 4426 dacă era de recuperare anulată)
   c) Impozit pe dividende suplimentar (rar):
      1174 = 446 (impozit dividende suplimentar)
   d) Accesorii (dobânzi + penalități):
      6581 = 448 (cheltuieli — penalități nedeductibile fiscal!)
      6588 = 448 (dobânzi de întârziere — nedeductibile)

2. PLATA OBLIGAȚIILOR:
   4411 = 5121 (plată impozit)
   4423 = 5121 (plată TVA)
   448 = 5121 (plată accesorii)

3. STORNARE TVA NEDEDUCTIBIL ANULAT (când ANAF respinge TVA deductibil):
   1174 = 4426 (anulare TVA deductibil aferent anilor controlați)
   1174 = 4423 (TVA suplimentar de plată)

4. ÎNCHIDERE 1174 LA SFÂRȘITUL ANULUI:
   1174 = 1171 (transfer rezultat reportat din corectare erori la rezultat reportat)

D101 RECTIFICATIVĂ:
- Obligatoriu pentru anul/anii corectați
- Termen: 5 ani de la data deciziei (prescripție drept rectificare)
- Atenție: D101 rectificativă cu profit mai mare = recalcul amânat impozit + accesorii (deja achitate)

ATENȚIE FISCAL:
- Accesoriile (cont 6581/6588) sunt NEDEDUCTIBILE la calculul impozit profit anul curent
- TVA suplimentar dat jos de ANAF din TVA deductibil = NU este cheltuială; trece direct pe 1174
- Impozit profit suplimentar = NU este cheltuială deductibilă; trece pe 1174 (ajustare reportată)

CONTESTAȚIE ANAF:
Dacă firma contestă decizia (15 zile de la primire):
- Înregistrare PROVIZORIE pe cont 168 sau 408 până la rezolvare contestație
- 168/408 = 4423 (TVA suplimentar contestat)
- Dacă contestația e admisă → storno înregistrare
- Dacă contestația e respinsă → 1174 = 168/408 (definitivare datorie)`,
    sources: [
      { label: "Cod Procedură Fiscală art. 188, 268-270 (decizie impunere + contestație)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (cont 1174)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25 alin. 4 lit. b (cheltuieli nedeductibile — penalități)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "preluare-evidenta-solduri-mostenite",
    tags: ["preluare evidență", "solduri vechi", "461", "401", "5191", "casierie", "corectare", "due diligence"],
    title: "Preluare evidență contabilă — solduri vechi neidentificabile (write-off canonic)",
    body: `SCENARIU: contabil nou preia firmă cu solduri vechi în 461 (Debitori), 401 (Furnizori), 5191 (Credite bancare), 5311 (Casierie), 411 (Clienți) care nu au origine documentată.

PROCEDURĂ DUE DILIGENCE OBLIGATORIE (înainte de orice write-off):

1. INVENTARIERE ANALITICĂ:
   - Listă toate soldurile pe analitice / persoană / contract
   - Solicitare extrase de cont fiscă de la furnizori/clienți (confirmări sold)
   - Verificare extrase bancare istorice (5191, 5121, 5311)
   - Note explicative semnate de administrator pe fiecare sold

2. ÎNCERCARE RECUPERARE/CLARIFICARE:
   - Solduri creditoare 401 vechi (>3 ani) → solicitare furnizor confirmare
   - Solduri debitoare 461/411 → demers recuperare (somație, instanță dacă >prag)
   - Solduri 5191 nepotriviri vs extras → contact bancă pentru extras analitic

3. PRESCRIPȚIE 3 ANI (Cod Civil art. 2517):
   După 3 ani de la scadență:
   - Datoria (cont 401) → prescriere → 401 = 7588 (venituri din prescriere)
   - Creanța (cont 411/461) → write-off → 6588 = 411/461

MONOGRAFII CANONICE:

A) Sold creditor 5191 vechi (linie credit deja achitată — eroare 2023):
   5191 = 1174 (corectare eroare retro — semnificativă)
   Dacă nesemnificativ: 5191 = 7588 (venit din corectare anul curent)

B) Sold creditor 461 (Debitori diversi — bani „dispăruți" din casierie):
   ATENȚIE: ANAF impozitează ca venit din alte surse (10% conform Cod Fiscal art. 114-115)
   Monografie după control ANAF:
   1174 = 446 (impozit suplimentar pe venituri din alte surse)
   461 = 1174 (închidere sold creditor)
   sau 461 = 117x cu decizie administrator

C) Sold furnizor 401 vechi (>3 ani, fără confirmare furnizor):
   401 = 7588 (venit din prescriere — IMPOZABIL)
   ATENȚIE: este venit impozabil → mărește profitul anului curent

D) Sold client 411 vechi nerecuperabil:
   - Dacă există provizion 491:
     491 = 411 (anulare creanță + storno provizion 7814 = 491)
   - Fără provizion: 6588 = 411 (cheltuială cu pierdere — DEDUCTIBILĂ doar dacă sunt îndeplinite condiții art. 25 alin. 3 lit. b Cod Fiscal: declarat în insolvență, instanță, sau dovadă imposibilitate)

E) Plus/minus casierie inventariere:
   PLUS casierie: 5311 = 7588 (venit impozabil)
   MINUS casierie: 6588 = 5311 (cheltuială; nedeductibilă fără proces-verbal + decizie responsabilitate)
   Acoperire de asociat: 5311 = 4551 (cont curent asociat — împrumut)

DOCUMENTAȚIE OBLIGATORIE write-off:
1. Proces-verbal inventariere semnat de comisia de inventar
2. Demersuri documentate de recuperare (somații, scrisori — pentru deductibilitate)
3. Hotărâre administrator pentru write-off (specifică suma, contul, justificarea)
4. Notă explicativă în Registru Inventar
5. Notificare AGA (asociați) dacă suma e materială

ATENȚIE LITIGII:
Solduri în litigiu (ex: 1174 din nepotriviri furnizor după control fiscal) NU se închid prin write-off — rămân până la sentință definitivă.`,
    sources: [
      { label: "OMFP 1802/2014 art. 63-65 (corectare erori)", ref: "https://legislatie.just.ro" },
      { label: "Cod Civil art. 2517 (prescripție 3 ani)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25 alin. 3 lit. b (deductibilitate pierderi creanțe)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 114-115 (venituri din alte surse — impozit 10%)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "inventariere-plus-minus-monografie",
    tags: ["inventariere", "plus marfă", "minus marfă", "casierie", "stoc", "diferențe inventar", "OMFP 2861"],
    title: "Inventariere anuală — plus/minus marfă + casierie + implicații fiscale",
    body: `OMFP 2861/2009 (norme inventariere) + OMFP 1802/2014.

INVENTARIEREA OBLIGATORIE LA 31.12:
- Stocuri (marfă, materii prime, produse finite)
- Casierie + valori (timbre, tichete masă)
- Imobilizări corporale + necorporale
- Creanțe + datorii (cu confirmări extrase)

REZULTATE POSIBILE LA INVENTAR:

A) PLUS DE INVENTAR (faptic > scriptic):
   1. Stoc marfă plus (eroare NIR sau intrări neînregistrate):
      371 = 6588 (înregistrare plus stoc — cheltuială negativă/venit) — VARIANTA 1
      sau 371 = 7588 (venit impozabil) — VARIANTA 2 (mai des folosită)
      ATENȚIE: dacă plus din schimbarea cotei TVA → 4428 (TVA neexigibilă) trebuie ajustat

   2. Plus casierie (rar — mai des minus):
      5311 = 7588 (venit din plus inventariere)
      IMPOZABIL la calcul profit + microîntreprindere

   3. Plus mijloc fix (mij. fix neînregistrat):
      213/214 = 117x (rezultat reportat) sau 7588 (dacă nesemnificativ)
      Apoi se ia în amortizare cu data inventarului

B) MINUS DE INVENTAR (faptic < scriptic):
   1. Stoc marfă minus (lipsă inventar):
      a) Vină responsabil → recuperare:
         4282 = 7588 (debit angajat + venit)
         5311/5121 = 4282 (recuperare prin reținere salariu)
         NU este TVA colectat (nu e vânzare)

      b) Cauze obiective (perisabilități în limite legale):
         607 = 371 (descărcare stoc)
         CHELTUIALĂ DEDUCTIBILĂ (Cod Fiscal art. 25 — în limitele norme perisabilități HG 831/2004)

      c) Cauze nedovedite (furt nesancționat, lipsă fără responsabil):
         607 = 371 (descărcare)
         + TVA ajustare obligatorie: 4427 = 4426 (anulare TVA dedusă inițial — Cod Fiscal art. 304)
         CHELTUIALĂ NEDEDUCTIBILĂ la calcul profit (Cod Fiscal art. 25 alin. 4)

   2. Minus casierie:
      6588 = 5311 (descărcare lipsă casierie)
      ATENȚIE: nedeductibilă fără PV inventar + decizie responsabilitate
      Acoperire prin asociat (creditare):
      5311 = 4551 (împrumut asociat fără dobândă)

C) MARFĂ DEPRECIATĂ / DEGRADATĂ:
   a) Cu dovada (PV degradare, casare):
      607 = 371 (descărcare)
      TVA: NU se ajustează dacă există PV de la cauze obiective/calamitate
      Cheltuială DEDUCTIBILĂ dacă proces verbal + cauze documentate

   b) Fără dovadă (deteriorare de gestiune):
      607 = 371 + 4427 = 4426 (ajustare TVA)
      Cheltuială NEDEDUCTIBILĂ

D) DIFERENȚE STOC între contabilitate și gestiune (soft eronat):
   - Eroare nesemnificativă: ajustare cu 6588/7588 anul curent
   - Eroare semnificativă: ajustare prin 1174 + D101 rectificativă

DOCUMENTAȚIE OBLIGATORIE:
1. Decizia administratorului de inventariere (comisie + termene)
2. Listă inventar semnată pe fiecare gestiune
3. Proces-verbal valorificare diferențe (comisie + administrator)
4. Decizie încadrare cauze (perisabilități / vină / cauze obiective)
5. Pentru perisabilități: aplicare norme HG 831/2004 (limite procente pe categorie)

DECLARAȚII AFECTATE:
- D300: ajustare TVA pe lipsuri (rând 31 — ajustări TVA dedus)
- D101: cheltuieli deductibile/nedeductibile pe categorii
- D406 (SAF-T): mișcări stoc cu tip "ADJ" (ajustare)`,
    sources: [
      { label: "OMFP 2861/2009 (norme inventariere)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (tratament rezultate inventar)", ref: "https://legislatie.just.ro" },
      { label: "HG 831/2004 (norme perisabilități)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25, 304 (deductibilitate + ajustare TVA)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "storno-facturi-anii-anteriori",
    tags: ["storno", "facturi anii anteriori", "curs valutar", "TVA cota veche", "rectificative", "e-Factura"],
    title: "Storno facturi anii anteriori — curs valutar, cotă TVA, rectificative",
    body: `STORNAREA FACTURILOR EMISE ÎN ANII PRECEDENȚI:

PRINCIPII FUNDAMENTALE:
1. Storno se face cu DATA documentului inițial (NU data curentă) — Cod Fiscal art. 330
2. Cota TVA aplicată = cota la data faptului generator inițial (NU cota curentă)
3. Curs valutar = cursul din ziua facturii ORIGINALE
4. Rectificative obligatorii pentru declarațiile lunilor inițiale (D300, D394, D406)

MONOGRAFIE STORNO:

A) Factură venit eronat 2023 (TVA 19%, prestare neefectuată):
   Storno cu cotă originală 19%, curs original:
   4111 = 1174 (anulare venit istoric)
   4427 = 1174 (storno TVA colectat istoric)
   sau pentru eroare nesemnificativă:
   4111 = 707/704 (cu minus, în roșu) + 4427 cu minus

   Dacă TVA la încasare:
   4111 = 1174 (storno creanță)
   4428 = 1174 (storno TVA neexigibilă)

B) Factură valută stornată în luna ulterioară:
   - Curs storno = CURS DATA FACTURII ORIGINALE (nu data stornării)
   - Diferența de curs între facturare și storno = NU se calculează (e o anulare)
   - Dacă factura a fost încasată parțial: diferența de curs realizată pe partea încasată rămâne în venituri/cheltuieli din diferențe curs (NU se stornează)

C) Reemitere factură corectă valută:
   - Curs reemitere = curs din ziua reemiterii (NOUĂ factură, NU continuarea celei vechi)
   - Dacă pretul corect se aplică retroactiv la data inițială: diferența de curs se contabilizează la cheltuieli/venituri din diferențe curs

D) Schimbare cotă TVA între facturare și storno:
   - Factură emisă mai 2025 (19%) → storno august 2025 (după 21%):
   - Storno cu COTA 19% (cota originală)
   - Reemitere corectă tot cu 19% (dacă faptul generator e mai 2025) sau 21% (dacă faptul generator e după 01.07.2025)

RECTIFICATIVE DECLARAȚII:
- D300 luna originală: rectificativă cu valori negative la rândurile inițiale
- D394 luna originală: rectificativă cu storno
- D406 (SAF-T): tip „TipFactura: 388" (factură de stornare)
- D101 anul cu eroarea: rectificativă dacă storno schimbă rezultatul

CAZ FACTURĂ DUBLATĂ TRANSMISĂ SPV (e-Factura):
Probleme dacă în 2025 retransmiteți eronat facturi din 2024:
1. Comunicare imediată client (refuz prelucrare facturi)
2. Înregistrare contabilă storno: 4111 = 1174 cu minus (anulare în contabilitate proprie)
3. Notificare scrisă ANAF + administratori (deschidere ticket)
4. NU se mai pot șterge din SPV — rămân ca facturi „dublate"
5. Client va respinge factura ÎN SPV ("Factură primită cu obiecție" — mecanism nou ANAF din 2024)
6. Documentar la procese verbale interne — protejare contestație

ATENȚIE FACTURI VECHI 2018-2024 (înainte de e-Factura obligatoriu):
- Pot fi încă înregistrate ÎN CONTABILITATE (NU mai pot fi transmise în SPV)
- Tratament: 1174 = 401 (cheltuieli istorice semnificative)
- TVA: 4426 = 401 (deductibil DOAR dacă nu s-a prescris dreptul de deducere — 5 ani de la facturare)
- D300 rectificativă luna originală + D394`,
    sources: [
      { label: "Cod Fiscal art. 330 (stornarea facturilor)", ref: "https://legislatie.just.ro" },
      { label: "OUG 120/2021 (e-Factura)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (1174 corectare erori)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "reclasificare-incadrare-eronata-mijloace-fixe",
    tags: ["reclasificare", "obiecte inventar", "mijloace fixe", "marfă", "amortizare neînregistrată", "OUG 8/2026"],
    title: "Reclasificare încadrare eronată — obiect inventar/marfă → mijloc fix (și invers)",
    body: `SCENARII RECURENTE DE RECLASIFICARE:

A) OBIECT INVENTAR (cont 303) → MIJLOC FIX (cont 213/214):
   Justificare: depășește pragul de 2.500 lei (sau noul prag OUG 8/2026 → 3.500 lei din 2026)

   MONOGRAFIE:
   1. Casare obiect inventar (dacă încă în uz):
      603 = 303 (descărcare obiect inventar)
   2. Recunoaștere mijloc fix:
      213/214 = 4754 (subvenții) sau 1174 (corectare eroare)
      Mai uzual: 213/214 = 1174 (când vine din corectare istorică)
   3. Calcul amortizare istoric (de la data achiziției originale):
      1174 = 281x (amortizare cumulată retroactiv)
   4. Amortizare curentă:
      6811 = 281x (lunar)
   5. Subvenții/surse finanțare (dacă există):
      4754 = 7584 (rec. la profit/pierdere lunar conform amortizării)

B) MARFĂ (cont 371) → MIJLOC FIX (213/214):
   Scenariu: echipamente IT achiziționate ca marfă, fără să fi fost destinate revânzării

   MONOGRAFIE:
   1. Scoatere din stoc marfă:
      6588 sau 1174 = 371 (cost istoric)
   2. Recunoaștere mijloc fix:
      213 = 1174 (sau venituri reportare dacă semnificativă)
   3. Amortizare retroactivă:
      1174 = 281x (cumulată de la data achiziției)
   4. Curent: 6811 = 281x

C) AMORTIZARE NEÎNREGISTRATĂ ANII PRECEDENȚI:
   Scenariu: mijloc fix recunoscut corect, dar amortizare neînregistrată din 2023-2024

   MONOGRAFIE:
   - Amortizare istorică recuperată:
     1174 = 281x (amortizare 2023-2024 cumulată)
   - Amortizare curentă 2025+: 6811 = 281x normal
   - D101 rectificativă pentru anii afectați (pierdere fiscală suplimentară din amortizare neînregistrată)
   - Atenție: la calcul impozit profit anul curent, amortizarea fiscală este DEDUCTIBILĂ doar pe anul curent + reportul pierderii fiscale recalculate

D) MIJLOC FIX → MARFĂ (rar):
   Doar dacă administratorul decide vânzarea efectivă:
   371 = 213/214 (valoare netă contabilă)
   281x = 213/214 (descărcare amortizare cumulată)
   Apoi: 4111 = 707 (vânzare) + 6583 = 371 (descărcare stoc)

NORMA AMORTIZARE:
Pentru reclasificări retroactive, amortizarea fiscală pe anii anteriori se ajustează în D101 rectificativă:
- Anul recunoaștere: amortizare prorata (de la data achiziție efectivă)
- Anii intermediari: amortizare 12 luni
- Anul curent: continuă cu sold rămas

PRAG AMORTIZARE (OUG 8/2026 — relevant pentru reclasificări 2026+):
- Pragul pentru mijloc fix se majorează de la 2.500 lei la 3.500 lei începând cu 01.01.2026
- Pentru bunuri achiziționate înainte: rămân la prag 2.500 lei (drept dobândit)
- Reclasificările aplicate retroactiv folosesc pragul de la data achiziției

DOCUMENTAȚIE:
1. Notă constatare eroare semnată administrator
2. Decizie reclasificare cu data și valorile
3. Recalcul amortizare anex
4. D101 rectificativă pentru anii afectați
5. Calcul accesorii (dacă impozit profit suplimentar)`,
    sources: [
      { label: "OMFP 1802/2014 (clasificare imobilizări)", ref: "https://legislatie.just.ro" },
      { label: "HG 2139/2004 (catalog mijloace fixe + durate amortizare)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 28 (amortizare fiscală)", ref: "https://legislatie.just.ro" },
      { label: "OUG 8/2026 (prag mijloace fixe 3.500 lei)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "rectificative-declaratii-unified",
    tags: ["rectificative", "D100", "D300", "D394", "D205", "D112", "D101", "D406", "accesorii", "termene"],
    title: "Rectificative declarații fiscale — guide unificat (D100/D300/D394/D205/D112/D101)",
    body: `REGULA GENERALĂ (Cod Procedură Fiscală art. 105):
- Rectificativa poate fi depusă în orice moment până la expirarea termenului de prescripție (5 ani)
- Calcul accesorii: dobânzi 0.02%/zi + penalități 0.01%/zi (de la termenul inițial al obligației)
- Penalități de nedeclarare: 0.08%/zi pentru sume nedeclarate (peste rectificative)

D100 — Declarație obligații lunare (impozit micro, salarii, impozit profit trimestrial):
- Rectificativă: F1 = „T" + perioada corectată
- Termen: oricând în 5 ani
- Calcul accesorii dacă suma rezultantă e mai mare (de plată suplimentar)
- Caz frecvent: impozit micro 1% calculat eronat ca 3% — rectificativă + cerere rambursare diferență
- Procedură rambursare: cerere scrisă ANAF + extras D300/D100 corectate + decizie firmă

D300 — Decont TVA:
- Rectificativă: prin Spațiu Privat Virtual SPV, opțiunea „depune rectificativă"
- Termen: în luna constatării (pentru erori în propria evidență); în 5 ani pentru erori cu impact
- Atenție: rectificativă D300 modifică automat balanța TVA — verifică sold final cont 4423/4424
- Caz: storno facturi anii anteriori → rectificativă D300 lunilor originale (cu valori negative la rândurile inițiale)

D394 — Declarație informativă livrări/achiziții:
- Rectificativă: în SPV, retransmite cu același număr ID, marcat rectificativă
- Termen: lunar/trimestrial conform perioadei TVA
- Caz frecvent: lipsă livrări cu taxare inversă (deșeuri) — rectificativă cu corespondență D300

D205 — Declarație venituri câștigate de NR (nerezidenți) / persoane fizice:
- Rectificativă: prin formular online (CNP greșit la beneficiar, sumă eronată)
- Procedură CNP greșit:
  1. D205 rectificativă cu valori 0 la CNP greșit
  2. D205 nouă cu CNP corect + sumă corectă
  3. Notificare beneficiar afectat (pentru fișa fiscală)
  4. Nu există accesorii dacă suma rămâne aceeași (nu impozit suplimentar)

D112 — Declarație contribuții salarii:
- Rectificativă: pentru CO eronat, sume reținute eronat, lipsuri impozit
- Caz: 4 zile concediu medical declarate în loc de 3 — rectificativă cu reducere o zi
- Atenție SAGA: refacere stat plată în soft + retransmitere
- Casa Sănătate poate solicita rectificativă pentru concedii medicale eronate

D101 — Declarație anuală impozit profit / micro:
- Rectificativă: oricând în 5 ani de la termen inițial
- Termen inițial: 25 martie anul următor pentru impozit profit, 25 ianuarie pentru micro
- Caz frecvent: nesocotire pierdere fiscală reportată — rectificativă cu pierdere recuperată
- Pierderea fiscală: recuperabilă în 5 ani consecutivi (Cod Fiscal art. 25 alin. 14)
- Exemplu: pierdere 2024 = 4.937 lei; profit 2025 = 2.626 lei → D101 2025 rectificativă cu pierdere recuperată; restul de 2.311 lei se reportează 2026 (max 5 ani)

D406 — SAF-T (Standard Audit File for Tax):
- Rectificativă: retransmitere fișier XML cu marcaj „rectificativă"
- Termen: în 5 ani de la transmiterea inițială
- Procesare ANAF: 1-5 zile; dacă rămâne „În prelucrare" >7 zile, contact departament tehnic
- Atenție: rectificativă D406 poate forța recalcul D300 (corelație automată ANAF)

CAZ COMPLEX: rectificative multiple corelate
Scenariu: descoperit eronat venit 2024 → rectificativă D300, D394, D101 (toate corelate):
1. ÎNTÂI rectificativă D300 + D394 luna originală
2. APOI rectificativă D101 anul 2024 (cu noul profit)
3. Plată diferență impozit + accesorii (calcul de la termen inițial)
4. Înregistrare contabilă: 1174 = 4423 (TVA suplim) + 1174 = 4411 (impozit suplim) + 6581 = 448 (accesorii)
5. D406 SAF-T pentru luna corectării (cu tip „AJ" — ajustare)

CALCUL ACCESORII (dobânzi + penalități):
- Dobândă: 0.02%/zi × suma × număr zile întârziere (de la termen inițial)
- Penalitate: 0.01%/zi × suma × număr zile întârziere
- Maxim cumulat: 100% din suma neachitată (după 13.9 ani fără plată)
- Calculul se face în SPV automat la finalizare rectificativă

ÎNREGISTRARE CONTABILĂ ACCESORII:
6581 = 448 (cheltuieli cu dobânzi/penalități fiscale — NEDEDUCTIBILE)
La plată: 448 = 5121`,
    sources: [
      { label: "Cod Procedură Fiscală art. 105, 173-174 (rectificative + accesorii)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25 alin. 14 (pierdere fiscală recuperabilă 5 ani)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF (formulare D100, D300, D394, D101, D205, D112, D406)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "servicii-it-caen-6210-6220-facilitate-programatori",
    tags: ["IT", "CAEN 6210", "CAEN 6220", "programatori", "scutire impozit", "creare software"],
    title: "Servicii IT (CAEN 6210, 6220) — facilitate programatori + monografie creare software",
    body: `CAEN 6210 = Activități de realizare a softului la comandă (software la comandă)
CAEN 6220 = Activități de consultanță în tehnologia informației
CAEN 6201 = Activități de realizare a softurilor orientate-client (similar 6210)

FACILITATEA FISCALĂ "PROGRAMATORI" (Cod Fiscal art. 60 lit. b):

SCUTIRE IMPOZIT VENIT salariu programatori:
- Aplicabilă: salariați cu poziție creare programe pe calculator (programator, programator IT, analist, software developer, project manager IT etc.)
- Sumă scutire: TOTAL impozit pe venit salarial (16%) — DOAR pe venit brut până la 10.000 lei lunar
- Diferența peste 10.000 lei → impozit normal 16%
- Plafonul 10.000 lei se aplică pe lună, nu cumulat

CONDIȚII OBLIGATORII pentru scutire (Cod Fiscal art. 60 lit. b + OMFP-MMSS comun):
1. Diplomă universitară / studii superioare confirmate (sau echivalent — diplomă bacalaureat + experiență 3 ani)
2. Activitate efectivă de programare/dezvoltare softuri orientate-client (NU activități administrative)
3. Angajator are venituri DIN realizarea programelor pe calculator (CAEN 6210/6220 ca activitate efectivă, NU doar declarată)
4. Venituri din software ≥ 10.000 EUR/an pe fiecare salariat scutit (echivalent în RON la cursul BNR ultima zi lucr.)

DOCUMENTAȚIE OBLIGATORIE (control ANAF):
1. Diplomă studii fiecare salariat scutit
2. Fișa post + atribuții programare
3. Contract muncă cu specificare poziție programator/IT
4. Demonstrare venituri minim 10K EUR/salariat (facturi clienți + corelare ore programate)
5. Pontaj cu activități specifice (NU generice)

CASS și CAS:
- ATENȚIE: scutirea NU se aplică contribuțiilor sociale (CAS 25% + CASS 10%) → se calculează și se rețin normal
- Numai impozitul pe venit (16% până la 10.000 lei) este scutit

MONOGRAFIE CONTABILĂ FACTURARE SOFTWARE:
A) Creare software la comandă (CAEN 6210):
   1. Recunoaștere venit pe etape (procent îndeplinire):
      4111 = 704 (venit servicii — pe fiecare livrare/sprint)
      4111 = 4427 (TVA colectat — la fapt generator)
   2. Acumulare costuri în 332 (lucrări în curs):
      6xx = 401/421 (cheltuieli salariale + servicii)
      Sfârșit lună: 332 = 711 (variație stoc — capitalizare costuri în curs)
   3. La livrare finală: 332 = 711 (descărcare costuri) + 4111 = 704 (factură finală)

B) Software propriu dezvoltat pentru revânzare:
   1. Capitalizare: 203/208 = 711 (imobilizări necorporale)
   2. Amortizare: 6811 = 280x (durată 1-3 ani sau pe baza estimării utilizării)

C) Service/mentenanță software (CAEN 6220 - consultanță):
   - Recunoaștere venit lunar pe baza contract: 4111 = 704

DECLARAȚII SPECIALE (peste D100/D101/D112/D300):
- D205: NU specifice IT (declarație generală venituri persoane fizice)
- D406 SAF-T: obligatoriu de la 01.01.2025 pentru toate firmele (NU specific IT)
- INCLUDE în D101: anexa scutire impozit programatori (sume scutite + condiții)

ATENȚIE TVA EXPORT SERVICII IT:
- Servicii IT către clienți UE non-PJ → cota TVA RO (21%)
- Servicii IT către clienți UE PJ → SCUTITE de TVA (taxare inversă la beneficiar), declarare în D390 VIES
- Servicii IT către clienți non-UE → SCUTITE de TVA (locul prestării e străinătate)`,
    sources: [
      { label: "Cod Fiscal art. 60 lit. b (scutire impozit programatori)", ref: "https://legislatie.just.ro" },
      { label: "OMFP-MMSS comun 1168/2017 (norme aplicare scutire)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (capitalizare software dezvoltat intern)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "punct-lucru-cif-distinct-legea-245-2025",
    tags: ["punct lucru", "CIF distinct", "sediu secundar", "Legea 245/2025", "D060", "D700"],
    title: "Punct de lucru CIF distinct — Legea 245/2025 (obligație 2026)",
    body: `LEGEA 245/2025 a introdus de la 01.01.2026 obligația obținerii CIF distinct pentru punctele de lucru cu salariați.

PRINCIPIU NOU 2026:
- Punctele de lucru CU SALARIAȚI → obligat CIF distinct (chiar și în aceeași localitate cu sediul social)
- Punctele de lucru FĂRĂ salariați → continuă cu CIF-ul societății principale

PROCEDURĂ OBȚINERE CIF (D060):
1. Depunere D060 la ANAF (sediul fiscal al sediului secundar)
2. Anexe obligatorii la D060:
   - Certificat înregistrare sediu secundar de la ONRC
   - Document spațiu (contract chirie, comodat, proprietate)
   - Decizie autorizare punct de lucru
   - Listă salariați transferați la punct de lucru
3. Termen: 30 zile de la deschidere punct de lucru
4. CIF se obține în 5-10 zile lucrătoare

UTILIZARE CIF PUNCT DE LUCRU:
- NU are personalitate juridică (rămâne sub firma principală)
- Salariații se declară în D112 sub CIF punctului de lucru (NU al sediului social)
- Impozit salarii și contribuții → plătite separat pe CIF-ul punctului
- Facturile către clienți → emise în general pe CIF-ul firmei principale (sediul social), cu mențiune punct de lucru pe factură
- TVA → rămâne unitar pe CIF-ul firmei principale (un singur cont TVA)

EXCEPȚII:
- Punct de lucru fără salariați, fără emitere facturi proprii → NU necesită CIF distinct
- Sucursale (înregistrate ca atare la ONRC) → CIF propriu obligatoriu indiferent de salariați
- Filiale → societate distinctă, CIF propriu

CAZURI SPECIALE:
- Punct lucru cu CIF în AFP-uri diferite → impozit salarii se plătește la AFP-ul CIF-ului punctului
- Punct lucru CMI/CMV (medic, veterinar) → CIF distinct DOAR dacă are salariați; altfel folosește CIF principal
- Punct lucru entități culte → CIF distinct cu salariați, dar regim special (D060 cu anexă cult)

ACTUALIZARE D700:
După obținerea CIF la D060:
- D700: secțiunea sediu secundar — completare cu noul CIF
- Termen depunere D700: 30 zile de la modificare
- Anexă: copie CIF eliberat de ANAF
- Submisie online prin SPV (semnătură digitală administrator)

CASA DE MARCAT (AMEF):
- Casa de marcat se înregistrează pe CIF-ul punctului de lucru (NU al sediului)
- C801 (cerere atribuire număr unic AMEF) → folosește CIF punctului
- Bonurile fiscale conțin CIF-ul punctului

SANCȚIUNI:
- Nedepunere D060 la termen: 1.000 - 5.000 RON (OG 21/2026)
- Activitate fără CIF distinct (salariați): activitate ascunsă → 5.000 - 10.000 RON + posibilă restituire impozite calculate eronat

VECTOR FISCAL PUNCT DE LUCRU:
- Impozit pe salarii: DA (pe CIF punct de lucru)
- CAS/CASS: DA (pe CIF punct de lucru)
- TVA: NU (rămâne pe firmă principală)
- Impozit profit: NU (rămâne pe firmă principală)`,
    sources: [
      { label: "Legea 245/2025 (CIF puncte de lucru cu salariați)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF (D060, D700)", ref: "https://anaf.ro" },
      { label: "Cod Procedură Fiscală art. 88 (înregistrare fiscală sedii secundare)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "arhivare-documente-legea-16-1996",
    tags: ["arhivare", "Legea 16/1996", "termene arhivare", "documente contabile", "CMR", "DVI", "digitalizare"],
    title: "Arhivare documente — Legea 16/1996 + termene canonice contabile",
    body: `LEGEA 16/1996 (Arhive Naționale) + OMFP 2634/2015 (norme arhivare contabilă).

TERMENE ARHIVARE OBLIGATORII (OMFP 2634/2015):

10 ANI (după închidere exercițiu):
- Registru jurnal
- Registru inventar
- Registru cartea mare
- Balanță verificare lunară
- Note contabile
- Facturi emise + primite
- Extrase de cont
- Bonuri fiscale
- State plată salarii
- Contracte individuale muncă (10 ani de la încetare)
- D112, D300, D394, D406, D101, D205 (după depunere)

5 ANI:
- Documente justificative auxiliare (note recepție, bonuri consum, fișe magazie)
- CMR (după efectuare transport)
- DVI (declarații vamale)
- Procese verbale predare-primire
- Cereri salariați (concedii, deplasări)
- Ordin deplasare cu deconturi

50 ANI:
- Documente personal (carnete muncă, decizii salariale, dosare angajare)
- Documente pensii (state, înregistrări CAS individuale)
- Documente medicale ocupaționale

PERMANENT:
- Acte constitutive (statut, contract societate, modificări)
- Hotărâri AGA și CA (decizii strategice)
- Registru AGA + Registru asociați
- Acte de proprietate imobile
- Brevete + mărci

ARHIVARE ELECTRONICĂ (OMFP 2861/2009 + Legea 161/2003):

CONDIȚII OBLIGATORII pentru arhivare ELECTRONICĂ exclusivă:
1. Sistem informatic CERTIFICAT pentru arhivare electronică (registru MCSI)
2. Semnătură electronică calificată pe fiecare document
3. Marca temporală pe documente (timestamp securizat)
4. Procedură backup și recuperare disaster
5. Politică acces controlat + jurnale audit
6. Garantarea integrității + autenticității în timp

DOCUMENTE care POT fi arhivate exclusiv electronic:
- Facturi e-Factura (SPV) — original electronic
- Documente generate intern (note contabile electronice)
- Rapoarte SAF-T
- Extrase bancare digitale (cu semnătură electronică bancă)

DOCUMENTE care TREBUIE păstrate ÎN ORIGINAL (fizic):
- CMR (în original — semnătură mâna conducător auto + ștampila clienților)
- DVI (declarații vamale) — original cu ștampila vamă
- Documente cu semnătură olografă manuală (note recepție, procese verbale)
- Documente notariale (contracte, hotărâri AGA notarial)
- Ordin de deplasare cu semnături și ștampile

OBLIGAȚIE NUMIRE RESPONSABIL ARHIVĂ:
- Firmă > 50 angajați: numire obligatorie responsabil arhivă cu formare specifică (curs 40 ore Arhive Naționale)
- Firmă mică: poate fi cumulat cu administrator/contabil, dar cu instruire minimă

DISTRUGERE DOCUMENTE LA EXPIRARE TERMEN:
1. Inventariere documente expirat termen
2. Proces verbal de distrugere (semnat de comisie)
3. Notificare Arhive Naționale (dacă documente cu valoare istorică)
4. Distrugere fizică (mărunțitor) + electronică (ștergere securizată)
5. Păstrare PV distrugere 5 ani pentru audit

ARHIVARE SOCIETATE RADIATĂ:
- Documente preluate de lichidator/administrator desemnat
- Termen păstrare: 50 ani după radiere (pentru documente personal) sau 10 ani (pentru contabile)
- Depozitare: arhive proprii sau servicii arhivare specializate (firme autorizate Arhive Naționale)

SANCȚIUNI:
- Lipsă arhivare termen legal: 10.000 - 50.000 RON (Legea 16/1996 art. 60)
- Distrugere documente înainte de termen: 50.000 - 100.000 RON + recuperare obligații fiscale prescrise`,
    sources: [
      { label: "Legea 16/1996 (Arhive Naționale)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 2634/2015 (norme arhivare contabilă)", ref: "https://legislatie.just.ro" },
      { label: "Legea 161/2003 (semnătură electronică)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "sponsorizare-d107-declaratie-informativa",
    tags: ["sponsorizare", "D107", "Legea 32/1994", "mecenat", "burse", "contract sponsorizare"],
    title: "Sponsorizare — D107 declarație informativă + condiții deductibilitate",
    body: `LEGEA 32/1994 (Sponsorizare) + Cod Fiscal art. 25 alin. 4 lit. i.

DEDUCTIBILITATE SPONSORIZARE:
Sponsorizările sunt CHELTUIELI NEDEDUCTIBILE la calculul impozit profit, DAR se scad direct din impozit (credit fiscal) în limita:
- 0.75% din cifra afaceri SAU
- 20% din impozit profit datorat
(se aplică limita MAI MICĂ)

CONDIȚII OBLIGATORII (Cod Fiscal art. 25 alin. 4 lit. i):
1. Contract scris de sponsorizare (semnat + datat)
2. Beneficiar = entitate non-profit (ONG, fundație, asociație, biserică) ÎNSCRISĂ în Registrul Entităților Non-Profit (ANAF)
3. Bani plătiți prin BANCĂ (NU numerar peste 5.000 RON — Legea 70/2015)
4. Sponsorizare în BUNURI: factură + proces verbal predare-primire
5. Declarare beneficiar în D107 (informativă)

DECLARAȚIA 107 (declarație informativă sponsorizări):
- Cine depune: societățile care au efectuat sponsorizări în anul precedent
- Cine NU depune: societăți pe pierdere fiscală (fără credit fiscal aplicabil)
- Termen depunere: 25 IUNIE anul următor (pentru anul calendaristic închis) sau 25 luna 6 după închidere exercițiu (an fiscal modificat)
- Conținut: beneficiari + sume + scop sponsorizare

SPONSORIZARE PE PIERDERE FISCALĂ:
- Permite acordare sponsorizare (Legea 32/1994 NU interzice)
- DAR NU se poate aplica credit fiscal (nu există impozit profit datorat)
- Sponsorizarea rămâne cheltuială NEDEDUCTIBILĂ
- Pierderea fiscală rămâne nemodificată

SPONSORIZARE ÎN BUNURI:
- TVA: sponsorizarea în bunuri NU este livrare către sine — NU se colectează TVA suplimentar
- Dacă bunul a fost achiziționat cu TVA dedus, ajustare TVA dacă scop este DIFERIT de cel inițial declarat
- Pentru bunuri achiziționate special pentru sponsorizare: TVA NU este deductibilă (Cod Fiscal art. 297)

MONOGRAFIE CONTABILĂ:
A) Sponsorizare în bani:
   6582 = 5121 (cheltuieli sponsorizare — NEDEDUCTIBILE la profit)
   La D101: scădere din impozit profit limita 0.75% CA sau 20% impozit (mai mic)

B) Sponsorizare în bunuri:
   6582 = 371 (cost contabil bunuri sponsorizate)
   PV predare-primire ca document justificativ
   FACTURĂ obligatorie către beneficiar (Cod Fiscal art. 319) — cu mențiune "sponsorizare", fără TVA

REPORT SUMĂ NEUTILIZATĂ (Cod Fiscal art. 25 alin. 4 lit. i):
- Sume necheltuite (peste limita 0.75% / 20%) → REPORT max 7 ANI consecutivi
- Pierdere fiscală NU împiedică reportul (rămân pentru aplicare în anii cu profit)
- Atenție: prima utilizare se face din suma cea mai veche (FIFO)

BURSĂ PRIVATĂ (Legea 376/2004):
- Bursă acordată elevilor/studenților → cheltuială deductibilă în limita 1.500 RON/lună/bursier
- Tratament D107: DA — beneficiarii burselor private se declară în D107
- Documentație: contract bursă + procese verbale plată lunare

DIRECȚIONARE 3.5% MICROÎNTREPRINDERI:
Spre deosebire de sponsorizare clasică, microîntreprinderile pot redirecționa 3.5% din impozitul micro (1% sau 3%) către ONG (acord în D177 — declarație nominativă).`,
    sources: [
      { label: "Legea 32/1994 (sponsorizare)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25 alin. 4 lit. i + art. 56 alin. 1^1 lit. b (credit fiscal sponsorizare)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF (formular D107)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "foi-parcurs-deductibilitate-combustibil",
    tags: ["foi parcurs", "combustibil", "TVA 50%", "TVA 100%", "auto", "deductibilitate", "test drive"],
    title: "Foi de parcurs — deductibilitate combustibil + TVA 50% vs 100%",
    body: `Cod Fiscal art. 25 alin. 3 lit. l + art. 298 (deductibilitate auto):

REGULĂ GENERALĂ (autovehicule mixt — folosite parțial business):
- TVA combustibil + reparații + amortizare: 50% DEDUCTIBIL
- Cheltuieli combustibil + reparații + amortizare: 50% DEDUCTIBIL la profit
- Aplicabil: orice autovehicul utilizat și în scop personal (asumat)

EXCEPȚII — DEDUCERE 100%:
1. Vehicule utilizate EXCLUSIV pentru activitate economică (cu DOVEDIRE)
2. Vehicule transport marfă (CAEN 4941 — transport rutier marfă)
3. Vehicule transport persoane (CAEN 4931, 4939 — taxi, transport persoane)
4. Vehicule școală auto (CAEN 8553)
5. Vehicule curse de taxiuri și închiriere
6. Vehicule poliție, jandarmerie, ambulanță, intervenții (utilitate publică)
7. Vehicule destinate test drive (dealer auto)

DOCUMENTUL CHEIE: FOAIA DE PARCURS

Pentru deducere 100% (vehicul mixt → demonstrare utilizare exclusivă business):
Foaia parcurs OBLIGATORIE (model OMFP 2861/2009 sau model propriu cu informații minime):
1. Data + ora plecare + ora retur
2. Persoană conducătoare (nume + funcție)
3. Itinerar precis (de la-la, locații cu denumire)
4. Scop deplasare (specific — NU "diverse")
5. Km parcurși la plecare + retur
6. Diferență km utilizați pentru deplasarea respectivă
7. Semnătură conducător + ștampila/semnătura persoanei vizitate (când e cazul)
8. Atașare bon combustibil cu km confirmate

FĂRĂ FOAIA DE PARCURS — DEDUCERE LIMITATĂ:
- TVA: 50% maxim (regulă auto mixt)
- Cheltuieli: 50% maxim
- Bonuri combustibil cu cod fiscal firmă: deductibilitate combustibil + TVA 50%

VEHICULE TEST DRIVE (dealer auto):
- Imobilizare corporală (cont 214) — destinată EXPRES test drive
- Documentație: procese verbale predare-primire (client test drive) + foi de parcurs interne
- TVA deductibil 100% (utilizare exclusivă activitate economică — comercializare)
- Cheltuieli combustibil deductibile 100% pe foi parcurs

LEASING AUTO:
- Pentru auto operațional (mixt): TVA 50% + cheltuieli 50%
- Pentru auto exclusiv business cu foi parcurs: TVA 100% + cheltuieli 100%
- Atenție: schimbarea regimului mid-contract necesită justificare ANAF (foi parcurs din momentul aplicării 100%)

DECONTARE COMBUSTIBIL DELEGAȚII (salariați):
Cod Fiscal art. 76 alin. 4 + HG 714/2018:
- 7.5 litri/100 km (pentru autoturism normal)
- Document justificativ: ordin deplasare + bon combustibil
- Bonul NU trebuie să aibă valoarea exactă decontată — se decontează KM × 7.5 litri × preț mediu
- Bonul certifică doar achiziție efectivă, NU valoarea decontată

ATENȚIE FACTURĂ vs BON pentru combustibil:
- Bon fiscal cu COD FISCAL firmă tipărit: deductibil până la 100 EUR (echivalent RON, fără factură)
- Bon fără cod fiscal: NU deductibil (necesar factură suplimentară)
- Peste 100 EUR per bon: OBLIGATORIE factură (Cod Fiscal art. 319)

DECLARAȚII:
- D300: TVA deductibil rândul 23 (50% sau 100%)
- D101: anexa cheltuieli auto (50% sau 100%)
- D406 SAF-T: cont 6022 (combustibil), 6024 (alte cheltuieli auto)`,
    sources: [
      { label: "Cod Fiscal art. 25 alin. 3 lit. l, art. 298 (deductibilitate auto)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 319 (facturare obligatorie peste prag)", ref: "https://legislatie.just.ro" },
      { label: "HG 714/2018 (decontare combustibil delegații)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 2861/2009 (model foaie parcurs)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "reevaluare-imobilizari-monografie",
    tags: ["reevaluare", "imobilizări", "cont 105", "cont 6813", "rezervă reevaluare", "raport evaluare"],
    title: "Reevaluare imobilizări — monografie + tratament fiscal (creștere/diminuare)",
    body: `OMFP 1802/2014 (cap. III — reevaluare) + Cod Fiscal art. 28 (amortizare după reevaluare).

REGULĂ GENERALĂ:
- Reevaluarea NU este obligatorie, dar este recomandată dacă valoarea contabilă diferă SEMNIFICATIV de valoarea de piață
- Se face de evaluator autorizat (ANEVAR) prin raport de evaluare
- Aplică la TOATE imobilizările aceleași categorii (NU selectiv pe câteva)

CREȘTERE DE VALOARE (valoare reevaluată > valoare contabilă):

A) Prima reevaluare cu plus valoare:
   213/214 = 105 (Rezerve din reevaluare)
   Suma = diferența (val. reevaluată - val. netă contabilă curentă)
   IMPOZIT PROFIT: NU se impozitează (rezerva 105 — neimpozabilă până la realizare)

B) Reevaluări ulterioare cu plus valoare (după o reducere anterioară):
   213/214 = 105 până la nivelul reducerii anterioare anulate
   213/214 = 7813 (venit din reluare provizion) DACĂ depășește reducerea anterioară
   IMPOZIT: doar venitul 7813 este impozabil

DIMINUARE DE VALOARE (valoare reevaluată < valoare contabilă):

A) Prima reevaluare cu minus valoare:
   6813 = 213/214 (cheltuială amortizare/diminuare)
   IMPOZIT: NEDEDUCTIBILĂ la calcul profit (Cod Fiscal art. 28 — amortizarea contabilă diferă de cea fiscală)

B) Diminuare după o reevaluare ANTERIOARĂ cu plus (utilizare rezerva existentă):
   105 = 213/214 (până la nivelul rezervei existente — reducere rezervă)
   6813 = 213/214 (depășire — pentru partea peste rezerva existentă)
   IMPOZIT: doar 6813 este nedeductibil

SCENARIU SPECIFIC: clădire cu reevaluare 2025 mai mică decât amortizarea cumulată:

Date exemplu:
- Valoare inițială: 306.809 lei
- Amortizare la 31.12.2025: 204.539 lei
- Valoare reevaluată 31.12.2025: 144.989 lei
- Valoare netă contabilă: 306.809 - 204.539 = 102.270 lei
- Reevaluare mai MARE decât valoare netă (144.989 > 102.270) → CREȘTERE 42.719 lei

Monografie 31.12.2025:
1. Stornare amortizare cumulată (metoda 1 — reset):
   281x = 213 (204.539 lei — anulare amortizare cumulată)
2. Plus valoare:
   213 = 105 (42.719 lei — rezervă reevaluare)
3. Amortizare nouă de la 2026 pe baza valorii reevaluate (144.989 lei) pe restul duratei

REGULA RELUARE 105 LA REZULTAT REPORTAT:
La data SCOATERII DIN GESTIUNE a imobilizării (vânzare, casare, dispariție):
105 = 1175 (transfer rezervă la rezultat reportat)
IMPOZIT: suma transferată la 1175 este IMPOZABILĂ la momentul realizării (Cod Fiscal art. 25)

LA AMORTIZARE LUNARĂ DUPĂ REEVALUARE:
Practica recomandată: transfer treptat al 105 la 1175 PROPORȚIONAL cu amortizarea:
105 = 1175 (parte rezervă proporțional cu amortizarea consumată)
Asta evită impozit profit BRUSC la realizare; se eșalonează.

AMORTIZARE FISCALĂ vs CONTABILĂ după reevaluare:
- Amortizarea contabilă = pe noua valoare reevaluată
- Amortizarea fiscală = continuă pe valoarea ORIGINALĂ de achiziție (Cod Fiscal art. 28 alin. 12)
- Diferență: ANEXĂ FISCALĂ în D101 (recalcul amortizare fiscală vs contabilă)

ATENȚIE REPRODUCERE:
- Imobilizările reevaluate NU pot fi re-reevaluate retrocedat pe ani anteriori (NUMAI prospectiv)
- O reevaluare odată făcută se aplică TOATE imobilizările categoriei (nu selectiv)
- Frecvență: o dată la 3-5 ani (recomandare profesională) sau ad-hoc dacă fluctuație piață > 20%`,
    sources: [
      { label: "OMFP 1802/2014 cap. III (reevaluare imobilizări)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 28 (amortizare fiscală + tratament reevaluare)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1746/2015 (reguli ANEVAR pentru evaluatori)", ref: "https://anevar.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "bonuri-fiscale-cod-firma-deductibilitate",
    tags: ["bon fiscal", "cod firmă", "deductibilitate", "TVA dedus", "factură", "prag 100 EUR"],
    title: "Bonuri fiscale cu cod firmă — deductibilitate cheltuieli + TVA",
    body: `Cod Fiscal art. 319 + OMFP 2634/2015 (reguli documente justificative).

REGULA FUNDAMENTALĂ:
- Bonul fiscal este document justificativ pentru cheltuieli + TVA dedus DOAR dacă conține CODUL FISCAL al firmei beneficiare (tipărit pe bon de casa de marcat)

PRAG 100 EUR (echivalent RON la curs BNR ziua tranzacției):
- SUB 100 EUR pe bon: bonul fiscal cu cod firmă tipărit = DOCUMENT JUSTIFICATIV COMPLET (deducere cheltuieli + TVA)
- PESTE 100 EUR pe bon: NECESARĂ factură suplimentară (bonul singur nu mai este suficient)

CONDIȚII OBLIGATORII pe bon fiscal pentru deductibilitate:
1. Cod fiscal firmă TIPĂRIT (NU scris manual)
2. Denumire firmă beneficiară (sau cel puțin CIF clar)
3. Data emiterii
4. Numele articolelor achiziționate (cu specificare TVA pe rând)
5. Suma totală + TVA detaliat
6. Semnătura/identificarea casierului (la dimensiuni mai mari)

CATEGORII DE CHELTUIELI ADMISE PE BON CU COD FIRMĂ:
- Combustibil + uleiuri (până la 100 EUR/bon)
- Consumabile birou (până la 100 EUR/bon)
- Reparații + piese auto (până la 100 EUR/bon)
- Alimente protocol (până la 100 EUR/bon)
- Servicii salon, materiale curățenie (până la 100 EUR/bon)

LIMITĂRI DEDUCTIBILITATE (chiar dacă bon valid):
- Cheltuieli auto mixt: deducere 50% TVA + 50% cheltuieli (vezi entrie foi parcurs)
- Cheltuieli protocol: limită 2% din profit (vezi entrie protocol)
- Cheltuieli reprezentare angajat: plafoane HG 1860/2006

BONURI FĂRĂ COD FIRMĂ:
- NU sunt documente justificative pentru firmă
- Pot fi acceptate DOAR pentru cheltuieli minore (< 50 RON) cu document suplimentar (decont angajat + bon)
- Pentru control fiscal: ANAF poate respinge total deducerea TVA fără bon cu cod firmă

BONURI ELECTRONICE (bon fiscal e-Bon):
- Din 2025+, bonurile pot fi emise în format electronic prin sistem ANAF "e-Bon"
- Conțin QR cod pentru verificare în SPV
- Tratament fiscal IDENTIC cu bonurile fiscale fizice tipărite
- Arhivare: format electronic suficient

CAZ FRECVENT: PLATA CU CARDUL PERSONAL SALARIAT
Dacă bonul are codul firmei dar plata e cu cardul personal al angajatului:
- Bonul rămâne valid pentru firmă (cod firmă = beneficiar real)
- Decontare salariat prin cont 542 (avansuri spre decontare) sau 461 (debitori)
- Monografie:
  6xx = 401 (cheltuială + TVA)
  401 = 542 (stingere prin avans angajat)
  542 = 5311 (restituire angajat)

INTERZICERE EXPRESĂ (Cod Fiscal art. 319):
- Bonurile fiscale NU pot fi folosite pentru tranzacții B2B peste 100 EUR — ÎNTOTDEAUNA factură
- Bonurile pentru cheltuieli salariu/dividende → NU acceptate (necesare contracte + state plată)
- Bonuri achiziții pentru asociat persoană fizică → NU sunt deductibile pentru firmă (cheltuială personală a asociatului)

DOCUMENTAȚIE SUPLIMENTARĂ recomandată:
1. Notă internă cu scopul achiziției (justificare cheltuială deductibilă)
2. Referat avizat de administrator pentru cheltuieli ne-clar legate de activitatea economică
3. Pentru cheltuieli protocol/alimentație: listă participanți + scop`,
    sources: [
      { label: "Cod Fiscal art. 319 (documente justificative)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 2634/2015 (norme documente)", ref: "https://legislatie.just.ro" },
      { label: "Legea 70/2015 (disciplina numerar)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cheltuieli-protocol-plafon-tva",
    tags: ["protocol", "plafon 2%", "TVA protocol", "cheltuieli reprezentare", "art. 25"],
    title: "Cheltuieli protocol — plafon 2% profit + TVA tratament",
    body: `Cod Fiscal art. 25 alin. 3 lit. b + art. 297 (TVA protocol).

DEFINIȚIE PROTOCOL:
Cheltuieli efectuate pentru întâlniri de afaceri cu clienți, parteneri, autorități (NU pentru angajați proprii — acelea sunt cheltuieli de personal):
- Hrană și băuturi la întâlniri business
- Cazare oaspeți business
- Cadouri pentru parteneri (limite specifice)
- Materiale promoționale cu logo firma

PLAFON DEDUCTIBILITATE (Cod Fiscal art. 25 alin. 3 lit. b):
- Cheltuieli protocol: DEDUCTIBILE în limita 2% din DIFERENȚA dintre venituri impozabile și cheltuieli aferente
- Formula simplificată: 2% × (Venituri impozabile - Cheltuieli aferente)
- Cheltuielile protocol care depășesc 2% → NEDEDUCTIBILE

EXEMPLU CALCUL:
- Venituri impozabile 2025: 5.000.000 lei
- Cheltuieli aferente: 4.500.000 lei
- Bază protocol: 5.000.000 - 4.500.000 = 500.000 lei
- Plafon protocol deductibil: 500.000 × 2% = 10.000 lei
- Dacă cheltuieli protocol = 15.000 lei → 10.000 deductibile + 5.000 nedeductibile

TVA PROTOCOL (Cod Fiscal art. 297 + 301):
- TVA pentru cheltuieli protocol: NEDEDUCTIBIL în GENERAL
- EXCEPȚIE: materiale promoționale (mostre, samples) cu logo firmă → TVA deductibil dacă scopul este promovarea
- Cadouri către clienți: TVA deductibil dacă valoare individuală ≤ 100 RON (publicitate) — peste prag, TVA nedeductibil

CAZURI SPECIFICE:

A) Hrană și băuturi la evenimente proprii (târguri, expoziții):
   Cod Fiscal NU consideră protocol în sens strict — cheltuieli marketing/publicitate
   Deductibilitate 100% dacă: factură + scop comercial documentat + participanți listați
   TVA deductibil 100%

B) Cadouri partenerilor:
   - Sub 100 RON valoare individuală: cheltuială publicitate (deductibilă 100%, TVA deductibil)
   - 100 - 500 RON: cheltuială protocol (în limita 2%, TVA nedeductibil)
   - Peste 500 RON: posibil considerată plată în natură partener (impozit nerezident pentru străini)

C) Cheltuieli pentru angajații proprii:
   - NU sunt protocol — sunt cheltuieli personal (salarii, beneficii, deplasări)
   - Plafoane specifice (HG 1860/2006 pentru deplasări, Cod Fiscal art. 76 pentru beneficii)

D) Aliniament management (district managers + store managers):
   - Cheltuieli de FORMARE/instruire — DEDUCTIBILE 100% (Cod Fiscal art. 25 alin. 1)
   - NU se încadrează la protocol
   - Documentație: agendă întâlnire + participanți + materiale formare

MONOGRAFIE CONTABILĂ:
A) Achiziție cu factură (TVA inclus):
   623 = 401 (cheltuială protocol)
   4426 = 401 (TVA — NEDEDUCTIBIL, dar înregistrat pentru calcul)

B) Înregistrare TVA nedeductibil la sfârșit perioadă:
   623 = 4426 (transfer TVA nedeductibil la cheltuială)
   Sau direct: 623 = 401 (cu TVA inclus la cheltuială)

C) La calcul impozit profit:
   Cheltuieli protocol peste 2% plafon → ADAUS LA PROFITUL FISCAL (D101 anexa cheltuieli nedeductibile)

DOCUMENTAȚIE OBLIGATORIE:
1. Factura/bon fiscal cu beneficiar firma
2. Listă participanți (cu funcție + firma asociată)
3. Scop întâlnire (negociere contract, semnătură proiect, conferință)
4. Aprobată administrator (sumar internal pentru control fiscal)
5. Pentru cadouri: PV predare-primire (la valoare > 100 RON)

ATENȚIE PROVISIOANE:
Cheltuielile protocol NU pot fi capitalizate (NU se trec pe imobilizări) — sunt cheltuieli ale perioadei.
Provizioanele pentru protocol planificat sunt POSIBILE doar pentru sume EXACT determinate (rar acceptat de ANAF).`,
    sources: [
      { label: "Cod Fiscal art. 25 alin. 3 lit. b (plafon protocol 2%)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 297, 301 (TVA protocol)", ref: "https://legislatie.just.ro" },
      { label: "HG 1860/2006 (diurna + deplasări — nu protocol)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "indemnizatie-mobilitate-clauza-mobilitate",
    tags: ["mobilitate", "clauză mobilitate", "delegație", "diurnă", "plafon neimpozitare", "salariu"],
    title: "Indemnizație de mobilitate (clauza mobilitate) — plafon + tratament fiscal",
    body: `Codul Muncii art. 25-26 (clauza mobilitate) + Cod Fiscal art. 76 alin. 2 lit. k.

DEFINIȚIE CLAUZA MOBILITATE:
Clauză inclusă în contract muncă prin care salariatul se obligă să presteze activitatea în mai multe locuri (NU un singur loc fix). Compensare: indemnizație mobilitate (NU este diurnă/delegație).

DIFERENȚE FAȚĂ DE DELEGAȚIE (HG 1860/2006):
- Delegație = trimitere TEMPORARĂ la un alt loc (cu ordin deplasare) — primește diurnă
- Mobilitate = activitate permanentă pe mai multe locuri (CIM prevede aceasta) — primește indemnizație mobilitate

PLAFON NEIMPOZITARE (Cod Fiscal art. 76 alin. 2 lit. k — actualizat 2024+):
Indemnizația mobilitate NEIMPOZABILĂ (fără impozit venit + CAS + CASS) în limita:
- 2.5 × nivel salariu minim brut pe țară × număr zile lucrătoare cu mobilitate
- 2025: salariu minim brut = 4.050 RON / 21 zile lucrătoare = ~193 RON/zi
- 2.5 × 193 = ~482 RON/zi maxim neimpozabil

PESTE PLAFON → IMPOZABIL ca SALARIU (16% impozit venit + 25% CAS + 10% CASS).

EXEMPLU CALCUL:
Salariat cu clauză mobilitate, 22 zile lucrătoare luna iulie 2025:
- Indemnizație acordată: 600 RON/zi × 22 zile = 13.200 RON
- Plafon neimpozabil: 482 × 22 = 10.604 RON
- Depășire plafon: 13.200 - 10.604 = 2.596 RON
- Tratament: 10.604 RON neimpozabil (cheltuială deductibilă fără contribuții)
- 2.596 RON impozabil ca salariu (+ contribuții CAS, CASS, impozit)

DEDUCTIBILITATE LA FIRMĂ:
Toată indemnizația mobilitate (atât neimpozabilă cât și impozabilă) = CHELTUIALĂ DEDUCTIBILĂ la profit (Cod Fiscal art. 25 alin. 1).

MONOGRAFIE CONTABILĂ:
A) Plată indemnizație mobilitate:
   625 = 421 (cheltuieli mobilitate — partea neimpozabilă)
   641 = 421 (cheltuieli salariale — partea impozabilă peste plafon)

B) Contribuții pe partea impozabilă (2.596 RON din exemplu):
   421 = 4431 (CAS 25% × 2.596 = 649 RON)
   421 = 4432 (CASS 10% × 2.596 = 260 RON)
   421 = 4441 (impozit venit 16% × 2.596 = 415 RON)
   6451 = 4431 (CAS angajator)

C) Plată netă către salariat:
   421 = 5121 / 5311 (suma rămasă după rețineri)

DOCUMENTAȚIE OBLIGATORIE pentru control fiscal:
1. Clauza mobilitate scrisă în CIM (semnată salariat + angajator)
2. Decizia administrator privind suma indemnizație + frecvență
3. Pontaj cu locurile efective de muncă pe zi
4. Listă activități prestate la fiecare locație
5. State plată cu calcul detaliat (neimpozabil vs impozabil)

DIFERENȚE FAȚĂ DE DIURNĂ (Cod Fiscal art. 76 alin. 2 lit. l):
- Diurna delegație internă: 2.5 × salariu minim/zi neimpozabilă (cu plafon HG 1860/2006 — 17.5 RON/zi minimul)
- Diurnă delegație externă: 2.5 × diurna externă pe țară neimpozabilă (HG 518/1995)
- Mobilitate: aplicabilă DOAR cu clauză în CIM (NU se poate aplica retroactiv)

CAZ SPECIAL: PROPAGARE DIURNĂ ÎN D112
Indemnizațiile mobilitate se declară SEPARAT în D112:
- Secțiunea F1: indemnizație mobilitate (neimpozabilă)
- Secțiunea G: dacă există depășire plafon (parte impozabilă)
- Notă: NU se declară la rubrica "diurnă" (acolo doar pentru delegații)

ATENȚIE LIMITĂRI:
- Clauza mobilitate NU se poate aplica la salariați cu loc fix de muncă (programator la birou, vânzător la magazin)
- Profesii cu mobilitate naturală: conductoare auto, instalatori, consultanți teren, agenți comerciali
- ANAF poate respinge mobilitate dacă în pontaj salariatul a fost mai mult de 80% în același loc`,
    sources: [
      { label: "Codul Muncii art. 25-26 (clauza mobilitate)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 76 alin. 2 lit. k (plafon mobilitate)", ref: "https://legislatie.just.ro" },
      { label: "HG 1860/2006 (diurnă delegație)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "n408-pillar-2-impozit-suplimentar",
    tags: ["N408", "Pillar 2", "impozit suplimentar", "GloBE", "multinationale", "OUG 107/2024"],
    title: "N408 — notificare impozit suplimentar Pillar 2 (multinaționale)",
    body: `OUG 107/2024 (Pillar 2 — GloBE) + Directiva (UE) 2022/2523.

REGULA IMPOZIT SUPLIMENTAR (Pillar 2):
- Aplicabilă: grupurilor multinationale cu venituri consolidate ≥ 750 milioane EUR/an
- Cotă efectivă minimă: 15% pe profit în fiecare jurisdicție unde grupul operează
- Dacă cota efectivă într-o jurisdicție < 15% → impozit suplimentar (Top-up Tax) datorat

ENTITĂȚI OBLIGATE ÎN ROMÂNIA:
1. Filială UPE (Ultimate Parent Entity) din străinătate — filiala din RO declară top-up tax dacă RO are cota < 15%
2. Filială intermediară IPE (Intermediate Parent Entity) — dacă desemnată
3. Sucursală a unei UPE — desemnată automat pentru declarare în RO

NOTIFICAREA N408 (formular nou 2025+):
Conținut obligatoriu:
- Identificare grup (denumire UPE, jurisdicție UPE, CIF UPE)
- Identificare entitate raportoare în RO
- An fiscal aplicabil (atenție: poate diferi între UPE și filiala RO)
- Calcul cota efectivă în RO (impozit pe profit / profit contabil ajustat)
- Impozit suplimentar datorat (dacă < 15%)

SECȚIUNEA E (an fiscal modificat):
Dacă societatea-mamă are AN FISCAL DIFERIT de cel calendaristic al sucursalei RO:
- Sucursală: an fiscal 01.01 - 31.12.2026
- UPE: an fiscal 01.04.2025 - 31.03.2026
- În N408 se completează AMBELE intervale + specificare an de raportare aplicabil

TERMENE DEPUNERE N408:
- Notificare inițială: 15 luni după sfârșitul anului fiscal grupului (UPE)
- Notificare anuală: 15 luni pentru primul an, apoi anual la fiecare exercițiu
- Plata impozit suplimentar: până la 15 luni de la sfârșitul anului UPE

CALCUL COTĂ EFECTIVĂ (Cod Fiscal art. 401^2):
Cota efectivă RO = (Impozit profit datorat + impozit suplimentar deja plătit) / Profit contabil ajustat × 100

DACĂ COTĂ EFECTIVĂ < 15%:
Impozit suplimentar (Top-up Tax) = (15% - cota efectivă) × Profit contabil ajustat - Substance Carve-Out

SUBSTANCE CARVE-OUT (reducere top-up tax pentru entități cu activitate reală):
- 5% (declină gradual la 8% în 10 ani) × Valoarea bunurilor materiale
- 5% (declină) × Cheltuielile salariale brute
Sumă SCAZUTĂ din baza top-up tax (dacă rezultat negativ → 0 top-up tax).

EXEMPTIONS SAFE HARBOUR (entități scutite în primii 5 ani):
1. Activitate transfrontalieră < 50 milioane EUR/an
2. Venituri totale grup < 750 milioane EUR (sub prag general)
3. Tranzitorie 2024-2026: aplicarea Country-by-Country Reporting safe harbour (cota efectivă din CBCR > 15%)

MONOGRAFIE CONTABILĂ TOP-UP TAX:
A) Provizionare la sfârșit an:
   698 = 4419 (impozit suplimentar — cheltuială NEDEDUCTIBILĂ în RO)
B) La plată:
   4419 = 5121

ATENȚIE COMPLEXITATE:
- Calculul efectiv presupune date detaliate consolidate (audit grup obligatoriu)
- Recomandare: consultanță fiscală internațională specializată (PWC, EY, KPMG, Deloitte Big4)
- DTA (Deferred Tax Asset/Liability) impact pe top-up tax

DECLARAȚII LEGATE:
- D107 — informativă sponsorizări (NU este legat de Pillar 2)
- D406 SAF-T — date analitice grup (poate fi solicitate)
- D101 — calcul cota efectivă în anexă specifică (de la 2025+)
- N408 — notificare anuală obligatorie

SANCȚIUNI NEDEPUNERE N408:
- Amendă: 70.000 - 100.000 RON per an de raportare nedepus
- Calcul automat din oficiu cu prezumție cota 0% în RO (top-up tax maxim posibil)
- Penalități de întârziere conform Cod Procedură Fiscală art. 173-174`,
    sources: [
      { label: "OUG 107/2024 (Pillar 2 — Romania)", ref: "https://legislatie.just.ro" },
      { label: "Directiva (UE) 2022/2523 (GloBE — Pillar 2)", ref: "https://eur-lex.europa.eu" },
      { label: "OPANAF (formular N408)", ref: "https://anaf.ro" },
      { label: "OECD GloBE Model Rules", ref: "https://www.oecd.org/tax/beps/" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "diurna-administrator-asociat-fara-cim",
    tags: ["diurnă", "administrator", "asociat", "contract mandat", "delegație", "plafon 2.5x"],
    title: "Diurnă administrator/asociat fără CIM — condiții + plafon neimpozitare",
    body: `Cod Fiscal art. 76 alin. 2 lit. l + Codul Muncii art. 43-45 (diurnă delegație) + L 31/1990 (administrator).

REGULA FUNDAMENTALĂ:
Diurna se acordă DOAR persoanelor care au RAPORT contractual cu firma:
- Salariați cu CIM (Cod Muncii) — diurnă pe ordin deplasare
- Administratori cu contract mandat — diurnă pe deplasare în interesul societății
- Directori cu contract de management — similar
- NU asociați simpli (fără funcție/CIM) — NU primesc diurnă

ASOCIAT SIMPLU (NU administrator, NU angajat):
- NU poate primi diurnă (lipsă raport contractual operațional)
- Poate primi DOAR DIVIDENDE (la distribuire profit)
- Eventuale rambursări cheltuieli reale ocazionate de deplasări în interes social = DOAR pe baza decont cu documente justificative (transport, cazare), NU diurnă forfetară
- Tratament: 1174 sau 658 = 462 (datorie față de asociat) → 462 = 5121 plată

ADMINISTRATOR cu CONTRACT MANDAT:
- POATE primi diurnă pentru deplasări în interesul societății
- Diurnă neimpozabilă în limita 2.5× salariu minim brut × zile deplasare (Cod Fiscal art. 76 alin. 2 lit. l)
- 2025: 2.5 × 4.050 / 21 = ~482 RON/zi maxim neimpozabil
- Peste plafon: impozabil ca venit asimilat salariului (16% impozit + CAS 25% + CASS 10%)
- DEDUCTIBILĂ la firmă la calcul profit indiferent de impozabil/neimpozabil

CONDIȚII MINIME pentru diurnă administrator/director:
1. CONTRACT MANDAT scris (semnat + datat la ONRC)
2. Mandatul prevede expres dreptul la diurnă pentru deplasări
3. Hotărâre AGA pentru cuantum diurnă (poate fi diferit de plafon legal)
4. Ordin de deplasare semnat pentru fiecare deplasare
5. Justificare scop deplasare (negociere contract, achiziție utilaje, ședință consiliu admin)

ADMINISTRATOR FĂRĂ CONTRACT MANDAT (numit doar prin hotărâre AGA):
- POATE primi diurnă, dar tratament DIFERIT:
- Diurna se consideră VENIT DIN ALTE SURSE (Cod Fiscal art. 114)
- Impozabil 10% reținut la sursă
- NU se aplică plafonul 2.5× (acela este doar pentru raport salarial/mandat)

RENUNȚARE LA DIURNĂ:
- Administrator/salariat poate renunța în scris la diurnă pentru o deplasare specifică
- Documentație: declarație scrisă semnată + atașată ordin deplasare
- ATENȚIE: dacă firma decide să nu plătească diurna (NU renunțare proprie), poate fi considerat avantaj nedat → control fiscal poate adăuga obligații retroactiv

DIRECTOR GENERAL cu CONTRACT MANDAT:
Similar administrator: diurnă admisă cu plafon neimpozabil 2.5× salariu minim.
Sed: contract trebuie să specifice că poate participa la ședințe consiliul de administrație în alte localități cu drept la diurnă.

SCENARIU SPECIFIC: ASOCIAT 50% + DIRECTOR MANAGEMENT
Dacă asociatul este și director general cu contract management:
- Diurnă: DA (în calitate de director, NU asociat)
- Plafon: 2.5× salariu minim/zi (regulile salariale)
- D112: declarare în secțiunea F1 (diurnă neimpozabilă)

MONOGRAFIE CONTABILĂ:
A) Plată diurnă administrator/director:
   625 = 462 / 542 (cheltuieli deplasare — DEDUCTIBILĂ)
   Sau dacă cu CIM: 625 = 421
B) Plată efectivă:
   462/542/421 = 5311/5121

INTERZISE:
- Asociat fără funcție + fără CIM care primește "diurnă" → recodificare obligatorie ca dividende mascate sau plată în natură (impozit 10% + CAS/CASS suplimentare)
- Administrator care nu se deplasează efectiv (diurnă pe document) → ANAF poate recodifica ca salariu fictiv (Cod Fiscal art. 13)

DOCUMENTAȚIE PENTRU CONTROL FISCAL:
1. Contract mandat / hotărâre AGA numire administrator
2. Ordin de deplasare semnat (cu rută, scop, durată)
3. Documente justificative deplasare (bilete avion, cazare — chiar dacă nu decontate)
4. Recommendation: foi de parcurs dacă deplasarea este cu auto firmă
5. Notă scop deplasare (corelare cu activitatea economică)`,
    sources: [
      { label: "Cod Fiscal art. 76 alin. 2 lit. l (plafon diurnă neimpozabilă)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 114 (venituri alte surse — 10%)", ref: "https://legislatie.just.ro" },
      { label: "L 31/1990 art. 137-152 (administratori)", ref: "https://legislatie.just.ro" },
      { label: "Codul Muncii art. 43-45 (delegație)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cheltuieli-sociale-plafon-5-fond-salarii",
    tags: ["cheltuieli sociale", "5% fond salarii", "8 martie", "Crăciun", "ajutor înmormântare", "team building", "ajutor social"],
    title: "Cheltuieli sociale — plafon 5% fond salarii (8 martie, Crăciun, ajutor înmormântare)",
    body: `Cod Fiscal art. 25 alin. 3 lit. b + Cod Fiscal art. 76 alin. 4 (avantaje neimpozabile salariați).

DEFINIȚIE CHELTUIELI SOCIALE:
Cheltuieli efectuate pentru salariați (și familii lor) ca beneficii sociale (NU salariu, NU diurnă):
- Cadouri ocazia 8 martie, Crăciun, Paste
- Tichete cadou (Legea 165/2018)
- Bilete odihnă/tratament (decontare totală sau parțială)
- Ajutoare înmormântare (la deces salariat sau membru familie)
- Ajutoare boli grave (cancer, AVC, accidente)
- Cadouri ocazia copilărie (8 iunie, 1 iunie)
- Team building / evenimente corporate
- Petrecere Crăciun / sărbători firmă
- Abonamente sportive (Benefit 7Card, World Class)
- Cheltuieli SPA salariați
- Activități sportive organizate de firmă (cros, maraton companii)

PLAFON DEDUCTIBILITATE GLOBAL (Cod Fiscal art. 25 alin. 3 lit. b):
TOATE cheltuielile sociale cumulat: max 5% din valoarea cheltuielilor cu salariile (cont 641) ale anului fiscal.

EXEMPLU CALCUL:
- Fond salarii anual: 800.000 lei
- Plafon cheltuieli sociale deductibile: 800.000 × 5% = 40.000 lei
- Dacă cheltuieli sociale = 50.000 lei → 40.000 deductibile + 10.000 nedeductibile

PE CATEGORII SPECIFICE (Cod Fiscal art. 76 alin. 4):

A) CADOURI 8 MARTIE / CRĂCIUN / PASTE pentru SALARIATE/SALARIATI:
- NEIMPOZABILĂ la salariat: 300 RON/cadou/eveniment (inclusiv pentru copii)
- Peste 300 RON: impozabil ca avantaj în natură (salariu)
- DEDUCTIBILĂ la firmă în limita 5% (cumulativ cu alte cheltuieli sociale)
- TVA: nedeductibilă pe cadouri (cheltuială protocol/social — art. 297 Cod Fiscal)
- Monografie: 6458 = 401 (cheltuială cu cadouri) — NEDEDUCTIBILĂ TVA inclus

B) AJUTOR ÎNMORMÂNTARE:
- NEIMPOZABILĂ la salariat: nelimitată (Cod Fiscal art. 76 alin. 4 lit. a)
- DEDUCTIBILĂ la firmă în limita 5% (cumulativ)
- Acordat la decesul: salariatului, soțului/soției, copiilor, părinților, fraților/surorilor
- Documente: copie certificat deces + cerere salariat + decizie administrator
- Monografie: 6458 = 421 sau 462 (la decedat salariat — beneficiar familie)

C) AJUTOR BOLI GRAVE:
- Cancer, AVC, intervenții cardiologice grave, transplant, accidente grave
- NEIMPOZABILĂ la salariat: nelimitată
- DEDUCTIBILĂ la firmă în limita 5%
- Documente: adeverință medicală + cerere salariat
- Aplicabil și pentru membri familie (soț, copii, părinți)

D) TEAM BUILDING / EVENIMENTE CORPORATE:
- NEIMPOZABILĂ la salariat: dacă PARTICIPAREA este OBLIGATORIE (declarat în decizie)
- IMPOZABILĂ: dacă participare voluntară → considerat avantaj în natură (impozit + CAS + CASS pe fiecare participant)
- DEDUCTIBILĂ la firmă în limita 5% (sau 100% dacă demonstrabil scop business: formare, comunicare strategică)
- Documente: agendă obligatorie + listă participanți + materiale formare/team building
- Cheltuieli aferente: cazare, masă, activități team building, transport

E) ABONAMENTE SPORTIVE (Benefit, World Class, 7Card):
- NEIMPOZABILĂ la salariat: până la 100 EUR/lună/salariat (1.200 EUR/an)
- DEDUCTIBILĂ la firmă: 100% (NU intră în cei 5% sociale — categorie distinctă Cod Fiscal art. 25 alin. 1)
- Documente: factură + listă beneficiari + adeziune scrisă salariat
- Monografie: 6458 = 401

F) BILETE ODIHNĂ/TRATAMENT:
- NEIMPOZABILĂ la salariat: până la o limită egală cu salariul mediu brut pe economie/an/salariat (~7.700 RON în 2025)
- DEDUCTIBILĂ la firmă în limita 5%
- Decontare integrală sau parțială (procent stabilit prin contract colectiv muncă)

G) PETRECERE CRĂCIUN / EVENIMENTE pentru SALARIAȚI + PARTENERI:
Aici se DIVIZEAZĂ tratamentul:
- Partea pentru salariați: cheltuială socială (5%)
- Partea pentru parteneri/colaboratori: protocol (2%)
- Estimare proporțională după număr participanți
- Documentație: listă participanți divizată (salariați + externi)

MONOGRAFIE GENERALĂ:
A) Achiziție bunuri/servicii pentru cheltuieli sociale:
   6458 = 401 (Cheltuieli cu avantaje în natură salariați + cheltuieli sociale)
   4426 = 401 (TVA — atenție: NEDEDUCTIBIL pentru majoritatea cheltuielilor sociale)

B) La sfârșit an — calcul depășire plafon 5%:
   - Sume peste 5% fond salarii → ANEXĂ D101 ca cheltuieli nedeductibile
   - Suma neimpozabilă la salariat NU se include în baza CAS/CASS/impozit
   - Suma impozabilă peste plafon individual (de ex. cadou 500 RON > 300 plafon) → impozit + CAS + CASS pe diferența 200 RON

DECLARAȚII:
- D112: include avantajele impozabile (la fiecare salariat afectat)
- D101: anexa cheltuieli nedeductibile (sume peste 5%)
- D406 SAF-T: detalii beneficii salariale

ATENȚIE: AJUTOR ÎNMORMÂNTARE pentru AVANGI/ASOCIAȚI (NU salariați):
- NU intră la cheltuieli sociale (acela e pentru salariați)
- Acordat ca decizie administrator → impozit pe venit nerezident (10% reținut) + NEDEDUCTIBIL la firmă`,
    sources: [
      { label: "Cod Fiscal art. 25 alin. 3 lit. b (plafon 5% cheltuieli sociale)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 76 alin. 4 (avantaje neimpozabile salariați)", ref: "https://legislatie.just.ro" },
      { label: "Legea 165/2018 (tichete cadou + tichete masă)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "refacturare-utilitati-chiriasi-704-vs-758",
    tags: ["refacturare", "utilități", "chiriași", "704", "758", "TVA refacturare", "energie", "apă"],
    title: "Refacturare utilități chiriași — 704 vs 758 + tratament TVA",
    body: `OMFP 1802/2014 + Cod Fiscal art. 286 alin. 4 (refacturare TVA).

PROBLEMA RECURENTĂ:
Proprietar spațiu primește facturi utilități (energie electrică, apă, gaze) pe propriul cod fiscal, dar utilizarea este a chiriașilor. Refacturare obligatorie cu tratament fiscal corect.

DEBATE CLASIC: 704 (venituri prestări servicii) vs 758 (venituri din recuperarea cheltuielilor)

REGULA CANONICĂ (OMFP 1802/2014):
- Dacă refacturarea este la VALOAREA EXACTĂ a facturii primite (fără adaos) → CONT 758 (venituri din recuperarea cheltuielilor)
- Dacă refacturarea este cu ADAOS sau în pachet cu chiria → CONT 704 (venituri prestări servicii)

CAZ A) REFACTURARE FĂRĂ ADAOS (recuperare costuri pură):
Monografie proprietar:
1. Înregistrare factură utilități primită:
   605/6051/6052 = 401 (cheltuieli energie/apă/gaze)
   4426 = 401 (TVA dedus)
2. Refacturare către chiriaș:
   4111 = 758 (venituri recuperare cheltuieli — valoare exactă fără adaos)
   4111 = 4427 (TVA colectat)
   ATENȚIE: 758 NU intră în cifra de afaceri (NU contribuie la praguri TVA, NU se declară la calcul plafon micro)
3. Anulare cheltuieli inițiale:
   758 = 605/6051/6052 (compensare — opțional, evită dublă înregistrare)

CAZ B) REFACTURARE INCLUSĂ ÎN CHIRIE (pachet):
Monografie:
1. Înregistrare factură utilități primită:
   605 = 401 (cheltuială deductibilă a proprietarului — devine costul prestării serviciului închiriere)
   4426 = 401 (TVA dedus)
2. Factură chirie + utilități unitate către chiriaș:
   4111 = 706 (chirie) sau 704 (servicii)
   4111 = 4427 (TVA colectat pe valoare totală)
   Cheltuielile rămân în 605 (deductibile ca aferente venitului din chirie)

REGULA TVA (Cod Fiscal art. 286 alin. 4 + art. 297):
- TVA refacturat IDENTIC cu TVA primit (cota + sumă) — măsură simplificare
- ATENȚIE: dacă utilitatea este facturată cu TVA către proprietar dar chiriașul nu poate deduce (ex: spital, școală scutită), refacturarea rămâne cu TVA — chiriașul suportă TVA-ul ca cost

CAZ C) UTILITĂȚI cu CONTOR INDIVIDUAL pe CHIRIAȘ:
Recomandare: contractul de furnizare să fie încheiat DIRECT pe chiriaș (NU pe proprietar). Atunci nu mai e refacturare, ci facturare directă de furnizor către chiriaș. Proprietarul nu intermediază.

CAZ D) FACTURĂ pe COD FISCAL PROPRIETAR dar LOC CONSUM CHIRIAȘ:
Refacturare obligatorie (la valoare exactă cu cont 758) — vezi cazul A.
Furnizorul utilităților trebuie notificat să modifice loc consum și/sau să încheie contract direct cu chiriașul (recomandare).

CAZ E) CHIRIE PERSOANĂ FIZICĂ pentru SEDIU SOCIAL SRL:
- Contract pe SRL — utilitățile rămân pe cod fiscal SRL
- Deductibilitate: 100% (utilizare exclusivă activitate economică)
- TVA: deductibilă 100%
- Dacă facturile sunt pe persoană fizică proprietar: refacturare cu cont 758 sau notificare furnizor pentru schimbare

CAZ F) PERSOANĂ FIZICĂ ÎNCHIRIEZE LA SRL (proprietar PF):
- Persoană fizică NU poate factura — venit din chirie se declară în D212 (declarație unică)
- Utilități plătite de PF rămân pe PF (NU se refacturează cu factură de la PF la SRL)
- Soluție: contract chirie BRUT (chirie + utilități incluse) — PF suportă utilități din chiria primită

TRATAMENT FISCAL la CALCUL PROFIT:
- Cheltuieli utilități primite + refacturate → NEDEDUCTIBILE (compensate de venitul recuperare)
- Sau alternativ: deductibile dacă sunt corelate direct cu venitul din chirie

ANAF a clarificat (Circular 2023):
Refacturarea exactă cu cont 758 este metoda preferată (transparentă, urmărire directă, fără impact pe profit).

FACTURĂ REFACTURARE - elemente obligatorii:
- Mențiune "Refacturare utilități pentru spațiul ___ (adresa)"
- Perioada de consum acoperită
- Referință la factura inițială (număr + furnizor)
- Defalcare pe categorii (apă, electric, gaze) dacă există contoare separate
- TVA aplicată identic cu cea de pe factura inițială`,
    sources: [
      { label: "OMFP 1802/2014 (conturi 704, 706, 758)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 286 alin. 4 (refacturare TVA)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 297 (drept deducere TVA)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "capitalizare-dobanda-proiect-imobil",
    tags: ["capitalizare dobândă", "OMFP 1802", "IAS 23", "proiect imobil", "credit", "cost îndatorare", "împrumut asociat"],
    title: "Capitalizare dobândă proiect imobil — OMFP 1802 + condiții",
    body: `OMFP 1802/2014 cap. 5 (costuri îndatorare) + IAS 23 (referință internațională).

REGULA FUNDAMENTALĂ:
Dobânda + comisioanele aferente unui ÎMPRUMUT folosit pentru achiziția/construcția unui ACTIV CU CICLUL LUNG DE PREGĂTIRE (>12 luni de la dobândire până la utilizare/vânzare) → SE CAPITALIZEAZĂ în costul activului (NU se trece pe cheltuială financiară curentă).

ACTIVE ELIGIBILE PENTRU CAPITALIZARE:
- Construcții imobiliare (clădiri, hale, depozite, ansambluri rezidențiale)
- Echipamente complexe cu instalare lungă (>12 luni)
- Active necorporale dezvoltate intern (software propriu, brevete)
- Stocuri cu ciclu fabricație lung (>12 luni)

CONDIȚII CUMULATIVE (OMFP 1802/2014):
1. Activul necesită >12 luni pentru a fi finalizat
2. Există împrumut DIRECT identificabil pentru achiziția activului (sau parte dintr-un împrumut general utilizat pentru activ)
3. Costurile de îndatorare sunt direct atribuibile activului
4. Activul nu este încă pus în funcțiune/vândut

PERIOADA DE CAPITALIZARE:
- Începe: când au început cheltuielile + împrumutul + lucrările pe activ
- Suspendare: când lucrările sunt OPRITE pentru perioade lungi (>3 luni)
- Încetează: când activul este FINALIZAT și pus în funcțiune (recepție definitivă)

MONOGRAFIE CONTABILĂ CAPITALIZARE:

A) Pentru clădire în curs de construcție (cont 231):
   1. Înregistrare dobândă (în loc de 666):
      231 = 1684 (capitalizare dobândă pe cost construcție)
   2. La recepție finală:
      212 = 231 (transfer la cont mijloace fixe)
   3. Amortizare ulterioară pe valoarea TOTALĂ (inclusiv dobânda capitalizată)

B) Pentru teren în curs amenajare (cont 211 sau 231):
   Pentru terenuri pure (NU se amortizează): capitalizare DOAR pe perioada lucrărilor de amenajare semnificative
   - Dacă terenul rămâne neamenajat, NU se capitalizează dobânda (NU există activ în pregătire)

C) Pentru ansamblu imobiliar (dezvoltator imobiliar):
   - Active înregistrate ca STOCURI (cont 371) — apartamente destinate vânzării
   - Capitalizare pe stocuri:
     371 = 1684 (capitalizare dobândă pe cost stoc)
   - La vânzare: cheltuiala apartamentului inclus capitalizat (607 = 371)

EXEMPLU CONCRET:
SRL achiziționează teren 16M EUR cu împrumut asociat 16M EUR cu dobândă 6% anuală.
- Dobândă lunară: ~80.000 EUR/lună
- Lucrări construcție ansamblu imobiliar (durata 36 luni)
- Dobândă cumulată pe toată construcția: 2.880.000 EUR

Capitalizare pe stoc:
231 = 1684 (lunar 80.000 EUR × curs BNR)
La final construcție (36 luni): transfer la 371 cu valoare totală 16M + 2.88M = 18.88M EUR
La vânzare apartamente: 607 = 371 (pe fiecare unitate)

LIMITĂRI FISCALE (Cod Fiscal art. 25):
- Dobândă capitalizată = NU intră în limitele cheltuielilor cu dobânzile deductibile (art. 25 alin. 1 lit. b)
- Aceasta devine COST AL ACTIVULUI, deci INTRARE ÎN AMORTIZARE FISCALĂ (NU cheltuială financiară)
- Pentru ansambluri imobiliare destinate VÂNZĂRII: deductibilă la momentul vânzării apartamentului (parte din cost vândut)
- Pentru imobile destinate UTILIZĂRII PROPRII: deductibilă prin amortizare pe durata utilizării

DOBÂNDĂ după FINALIZARE ACTIV (după recepție):
- Trece pe cheltuială financiară curentă (cont 666)
- Aplicabile limitări OUG 156/2024 + Cod Fiscal art. 25 alin. 1 lit. b (deductibilitate limitată dobânzi)

ÎMPRUMUT ASOCIAT pentru PROIECT IMOBIL:
- Dobândă LEGAL aplicabilă: max nivelul dobânzii ROBOR + 4 procente (Cod Fiscal art. 25 alin. 8)
- Peste limita legală: NEDEDUCTIBILĂ (chiar și capitalizată)
- Cota dobândă REZONABILĂ pe piață (pentru transfer pricing dacă afiliat)
- Contract împrumut OBLIGATORIU (scris, datat, semnat AGA)

CAZ: ÎMPRUMUT GENERAL utilizat parțial pentru activ:
Calcul capitalizare PROPORȚIONALĂ:
Dobândă capitalizabilă = Dobândă totală × (Cheltuieli activ / Total împrumut)

DEZAVANTAJ NECAPITALIZARE:
Dacă firma nu capitalizează (înregistrează tot pe 666):
- Profit denaturat anul curent (cheltuială mare imediată)
- ANAF poate AJUSTA în control fiscal → impunere retroactivă cu capitalizare obligatorie (la activele eligibile)
- Documentare politică contabilă SCRISĂ pentru opțiunea (capitalizare vs cheltuială imediată)`,
    sources: [
      { label: "OMFP 1802/2014 cap. 5 (costuri îndatorare)", ref: "https://legislatie.just.ro" },
      { label: "IAS 23 (Borrowing Costs)", ref: "https://www.ifrs.org" },
      { label: "Cod Fiscal art. 25 alin. 1 lit. b (deductibilitate dobânzi)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 25 alin. 8 (dobândă afiliați)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "decontare-transport-salariati",
    tags: ["decontare transport", "abonament", "combustibil salariat", "art. 76", "deductibilitate", "neimpozabil"],
    title: "Decontare transport salariați la/de la locul de muncă",
    body: `Cod Fiscal art. 76 alin. 4 lit. p + Codul Muncii art. 197.

REGULA GENERALĂ:
Decontarea transportului salariaților la și de la locul de muncă = facilitate ce poate fi NEIMPOZABILĂ în condiții specifice.

MODALITĂȚI DE DECONTARE:

A) ABONAMENT TRANSPORT PUBLIC:
- NEIMPOZABILĂ la salariat: integral, fără plafon (Cod Fiscal art. 76 alin. 4 lit. p)
- DEDUCTIBILĂ la firmă: 100% (cont 6588 sau 6451 — cheltuieli cu personalul)
- Documente: factură/bon cu CIF firmă pe numele firmei (NU al salariatului)
- Aplicabil: STB, RATB, metro, alte transporturi publice
- Atenție: dacă bonuri/abonamente pe numele salariatului → NU sunt deductibile (avantaj salarial impozabil)

Monografie:
6458 = 401 (cheltuieli sociale — transport public)
Sau: 6451 = 401 (cheltuieli cu personalul — dacă declarat ca beneficiu legal)

B) DECONT BONURI COMBUSTIBIL (transport propriu salariat):
- NEIMPOZABILĂ la salariat: în limita 7.5 litri × distanță acasă-serviciu × număr zile lucrătoare × preț carburant
- Peste plafon: impozabil ca avantaj salarial
- DEDUCTIBILĂ la firmă: 100% pe partea neimpozabilă + 50% pe partea impozabilă peste plafon (pentru cheltuieli auto mixt — vezi entrie foi parcurs)
- Documentație: bon combustibil cu cod firmă tipărit + declarație salariat km parcurși zilnic

REGULA SPECIFICĂ DECONT COMBUSTIBIL (NU pentru deplasări — pentru transport zilnic):
- Cheltuiala este DECONT TRANSPORT, NU cheltuială auto pură
- Deductibilitate INTEGRALĂ (NU se aplică regula 50% pentru auto mixt)
- Justificare: este compensare cost transport pentru salariat (similar abonament transport public)

C) PLATĂ CHIRIE APARTAMENT pentru SALARIAT (cazare):
- NEIMPOZABILĂ la salariat: dacă salariatul are domiciliul în ALTĂ localitate decât locul muncii (Cod Fiscal art. 76 alin. 4 lit. q)
- Plafon: maxim 20% din salariul minim brut pe țară pe lună (~810 RON în 2025)
- Peste plafon: impozabil
- DEDUCTIBILĂ la firmă: 100% (cheltuieli cu personalul)
- Documente: contract chirie + factură proprietar + dovada domiciliu diferit salariat

D) MAȘINĂ DE SERVICIU pentru NAVETĂ:
- NEIMPOZABILĂ DOAR dacă uzul personal este NEEXISTENT
- Pentru uz personal admis: avantaj salarial impozabil (calcul după valoarea contabilă auto)
- Cele 50% TVA + 50% cheltuieli auto pentru regim mixt se aplică

E) TRANSPORT ORGANIZAT FIRMĂ (autocar firmă pentru salariați):
- NEIMPOZABILĂ la salariat: integral
- DEDUCTIBILĂ la firmă: 100%
- Documente: program transport + listă salariați transportați

DECLARAȚII:
- D112: include partea impozabilă (dacă există depășire plafon)
- Pe linie F1: avantaje neimpozabile
- Pe linie G: avantaje impozabile

CAZ SPECIFIC: SALARIAT cu DOMICILIU în ACEEAȘI LOCALITATE
- NU se poate aplica facilitatea chirie (plafon 20% salariu minim) — doar dacă salariatul SCHIMBĂ domiciliul în altă localitate
- Decontare transport zilnic = aplicabil normal

DOCUMENTAȚIE OBLIGATORIE:
1. Decizie administrator privind politica decontare transport
2. Contract individual muncă cu mențiune decontare (dacă există)
3. Bonuri/abonamente cu cod firmă
4. Declarații lunare salariat (km parcurși acasă-serviciu)
5. Listă salariați eligibili + suma decontată pe fiecare

ATENȚIE LA ANAF:
- Dacă bonurile sunt PE NUMELE SALARIATULUI (NU al firmei): se consideră RAMBURSARE PERSONALĂ → impozabilă ca salariu
- Recomandare: bonurile să fie EMISE direct pe firmă (cu cod fiscal firmă tipărit)
- Abonamentele trebuie să fie nominative + emise pe firmă (NU pe salariat personal)`,
    sources: [
      { label: "Cod Fiscal art. 76 alin. 4 lit. p, q (avantaje neimpozabile transport)", ref: "https://legislatie.just.ro" },
      { label: "HG 714/2018 (decontare combustibil delegații)", ref: "https://legislatie.just.ro" },
      { label: "Codul Muncii art. 197 (obligație angajator transport)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "sucursala-punct-lucru-strainatate",
    tags: ["sucursală", "punct lucru străinătate", "Moldova", "Bulgaria", "Germania", "stabilirea permanentă"],
    title: "Sucursală/punct lucru în străinătate — tratament fiscal românesc",
    body: `Cod Fiscal art. 25 alin. 1 + Tratate eviti dublă impunere (CDI).

DEFINIȚII:
- SUCURSALĂ în străinătate = entitate fără personalitate juridică, înregistrată local
- FILIALĂ în străinătate = entitate cu personalitate juridică (companie separată)
- PUNCT DE LUCRU/ȘANTIER în străinătate = activitate temporară (sub 6-12 luni de obicei)

PRINCIPII FUNDAMENTALE:
1. Sucursala românească în străinătate = parte din firma română — contabilitate consolidată în RO
2. Veniturile sucursalei sunt impozabile în RO (cu aplicare CDI — credit fiscal pentru impozit plătit în străinătate)
3. Cheltuielile sucursalei sunt deductibile în RO (dacă corelate cu venituri impozabile)

CONTABILITATE SUCURSALĂ STRĂINĂTATE:
- Sucursala ține contabilitate LOCALĂ (conform legislației țării unde funcționează)
- La sfârșit lună/trimestru: TRANSFER situație contabilă în RO (în lei) pentru consolidare
- Conturi tehnice de consolidare în RO:
  481 (decontări între unități) sau 6/7 (venituri/cheltuieli intersucursale)

MONOGRAFIE STANDARD:

A) CHELTUIELI SUCURSALĂ (din situație locală):
   În RO:
   6xx = 481 (cheltuieli aferente sucursală — translatate la curs BNR sfârșit lună)

B) VENITURI SUCURSALĂ:
   În RO:
   481 = 7xx (venituri aferente sucursală — translatate la curs)

C) PROFIT SUCURSALĂ:
   La sfârșit an: profitul/pierderea SUCURSALEI se include în profitul global al firmei RO
   Impozit profit: pe profitul GLOBAL (RO + sucursală) la cota 16%
   Credit fiscal: impozit deja plătit local (Moldova/Bulgaria) — se deduce din impozit profit datorat în RO

D) RAMBURSARE CHELTUIELI între SEDIU CENTRAL și SUCURSALĂ:
   Ranbursarea NU este venit/cheltuială (sunt aceeași entitate juridică) — folosire cont 481

CAZ A) SUCURSALĂ în MOLDOVA:
- CDI Romania-Moldova prevede: profitul sucursalei impozabil la sursă (Moldova) + credit fiscal în RO
- Contabilitate locală în Moldova (legislația moldovenească)
- Raportare în RO: situație lunară + situație anuală consolidată
- Atenție: salariile din Moldova trebuie raportate în D112 conform legislației RO (cu credit pentru impozit reținut local)
- TVA: NU se aplică TVA RO pe veniturile sucursalei (impozitabile în Moldova)

CAZ B) PUNCT LUCRU în BULGARIA cu COD TVA BG:
- Cod TVA bulgar pentru livrări locale în Bulgaria
- Veniturile facturate cu TVA BG (NU TVA RO) — declarate în decont BG
- Cheltuielile achiziționate cu cod TVA BG — declarate în decont BG
- În RO: doar consolidare pentru calcul profit (impozit profit pe profitul global)

CAZ C) ȘANTIER în GERMANIA (durată > 12 luni):
- Devine STABILIREA PERMANENTĂ în Germania (CDI Romania-Germania)
- Profit alocat șantierului = impozabil în Germania
- Veniturile facturate clientului german pot fi cu sau fără TVA RO (în funcție de TVA reverse charge)
- Salariații detașați necesită formular A1 (UE) pentru evitarea dublă contribuție CAS

DOCUMENTAȚIE OBLIGATORIE:
1. Hotărâre AGA înființare sucursală
2. Înregistrare la autoritățile locale (registru comerțului, autoritate fiscală)
3. Contract înregistrare sucursală (statul respectiv)
4. Bilanț + cont profit/pierdere LOCAL + RO (consolidat)
5. Politică contabilă scrisă pentru consolidare (curs valutar utilizat, periodicitate)

DETAȘARE SALARIAȚI în UE (pentru șantiere/punct lucru):
- Formular A1 obligatoriu (UE) — emis de Casa Națională Pensii din RO
- Documentare detașare conform Directiva 96/71/CE (UE) + cod muncă local
- Salariații rămân plătitori de CAS în RO (cu A1) — NU CAS local
- Diurnă conform reglementări țara destinație (peste plafonul RO se aplică plafonul RO pentru impozit)

CAZ DETAȘARE în TURCIA (non-UE):
- NU se aplică A1 (non-UE)
- Aplicabile reguli CDI Romania-Turcia + reguli muncii Turcia
- Salariații pot fi obligați la dublă contribuție (RO + Turcia) — căutare scutire prin CDI

VECTOR FISCAL:
- TVA: rămâne pe firma RO (sucursala NU are personalitate juridică separată)
- Impozit profit: pe profit consolidat RO + sucursală
- Salarii: D112 pentru salariații RO + raportare locală pentru salariați la sucursală`,
    sources: [
      { label: "Cod Fiscal art. 25 alin. 1 (deductibilitate cheltuieli)", ref: "https://legislatie.just.ro" },
      { label: "Tratate evitare dublă impunere (CDI) — model OCDE", ref: "https://www.oecd.org" },
      { label: "Regulament UE 883/2004 (coordonare securitate socială + A1)", ref: "https://eur-lex.europa.eu" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "bonificatie-3-impozit-oug-107",
    tags: ["bonificație", "3% impozit", "OUG 107/2024", "micro", "impozit profit", "venit neimpozabil"],
    title: "Bonificație 3% impozit (OUG 107/2024) — monografie + tratament fiscal",
    body: `OUG 107/2024 (Pillar 2 + măsuri fiscale) + Cod Fiscal art. 1, 56.

REGULA BONIFICAȚIEI:
OUG 107/2024 a introdus bonificația 3% din impozitul declarat și plătit la termen pentru:
- Microîntreprinderi (impozit 1% sau 3%)
- Plătitori impozit profit (cota 16%)
- Aplicabilă pentru anul fiscal 2024+ (cu plată la termen integrală)

CONDIȚII OBLIGATORII pentru aplicare:
1. Declarația D100/D101 depusă în termen
2. Impozit plătit INTEGRAL în termen (NU plată parțială)
3. Fără datorii fiscale restante > 200 RON (Cod Procedură Fiscală)
4. Firma NU este în insolvență/dizolvare/lichidare

CALCUL BONIFICAȚIE:
Bonificație = Impozit datorat × 3%

EXEMPLU:
- Microîntreprindere impozit 1% pe 2024: 50.000 RON
- Bonificație 3%: 50.000 × 3% = 1.500 RON
- Impozit efectiv plătit: 50.000 - 1.500 = 48.500 RON

OPERARE PRACTICĂ:
1. La depunere D100 trimestrial/D101 anual: se completează valoarea impozitului INTEGRAL (50.000 RON)
2. Sistemul ANAF aplică automat bonificația dacă condițiile sunt îndeplinite
3. Plata efectivă: 48.500 RON
4. Decizia ANAF de bonificație: emisă în 30-60 zile + apariție pe Fișa pe Plătitor

MONOGRAFIE CONTABILĂ:
A) Înregistrare impozit datorat (anul corespunzător — 2024 pentru bonificație 2024):
   691 = 4411 (impozit profit datorat — 50.000 RON)

B) Plata efectivă:
   4411 = 5121 (48.500 RON — plata redusă cu bonificația)

C) ÎNREGISTRARE BONIFICAȚIE PRIMITĂ (la primirea deciziei ANAF):
   4411 = 7588 (Venituri din bonificații — 1.500 RON)
   Sau alternativ: 4411 = 6919 (Cheltuieli ajustare impozit — negative)

D) ANUL CONTABIL DE ÎNREGISTRARE:
   - Bonificația 2024 → înregistrare în anul primirii deciziei (cel mai des 2025)
   - În baza contabilității de exercițiu: dacă decizia se primește înainte de închidere bilanț 2024, se include în 2024
   - Pentru bilanț depus: înregistrare în 2025 cu 7588 (venit anul curent)

TRATAMENT FISCAL (Cod Fiscal art. 23 alin. 1 lit. b):
BONIFICAȚIA = VENIT NEIMPOZABIL la calcul impozit profit (NU se include în baza impozabilă anul primirii)

ATENȚIE: NU se include în CIFRA AFACERI (pentru praguri TVA, micro, etc.)

DECLARAȚII:
- D101 / D300: bonificația apare automat ca regularizare (NU se completează manual)
- D406 SAF-T: înregistrare tranzacție cu cod special

CAZ MICROÎNTREPRINDERE:
- Bonificație DOAR pe impozitul micro (1% sau 3%)
- NU se aplică pe impozitul pe dividende (aceasta nu este impozit pe profit)
- Se aplică pe impozit calculat pe veniturile firmei (NU pe veniturile asociaților)

CAZ PIERDERE FISCALĂ (impozit profit = 0):
- NU se aplică bonificație (nu există impozit datorat)
- Excepție: dacă firma are pierdere DAR are impozit minim (Cod Fiscal art. 24) → bonificație pe impozitul minim

PIERDERE BONIFICAȚIE:
Dacă firma plătește cu ÎNTÂRZIERE (chiar și 1 zi):
- Bonificația SE PIERDE
- Impozit datorat: 100% (50.000 din exemplu)
- Penalități pe întârziere: 0.02% + 0.01% pe zi

REVOCARE BONIFICAȚIE (Cod Procedură Fiscală art. 188):
ANAF poate revoca bonificația ulterior dacă:
- Se descoperă datorii fiscale nedeclarate la momentul aplicării
- Inspecție fiscală constată evaziune
- Firma intră în insolvență ulterior

DOCUMENTAȚIE pentru CONTROL:
1. Decizia ANAF de aplicare bonificație (din Fișa pe Plătitor)
2. Extras de cont cu plata în termen
3. Confirmare ANAF emitere bonificație
4. Înregistrare contabilă cu cont 7588`,
    sources: [
      { label: "OUG 107/2024 (bonificație 3% impozit)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 23 alin. 1 lit. b (venituri neimpozabile)", ref: "https://legislatie.just.ro" },
      { label: "Cod Procedură Fiscală art. 188 (revocare beneficii)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "renuntare-imprumut-asociat",
    tags: ["renunțare împrumut", "asociat", "4551", "1068", "capital", "venit impozabil", "ANC negativ"],
    title: "Renunțare împrumut asociat — venit impozabil vs capitalizare în capital",
    body: `Cod Fiscal art. 23, 31 + L 31/1990 (proceduri capital) + L 239/2025 (active net contabil).

CONTEXTUL RECURENT:
Asociatul a împrumutat societatea (cont 4551 — Decontări cu asociați conturi curente). Acum vrea să renunțe la împrumut pentru:
- Acoperire pierderi reportate (1171 debitor)
- Reglare activ net contabil negativ (cerinta L 31/1990 art. 153^24 + L 239/2025)
- Consolidare capital

OPȚIUNI DE TRATAMENT:

OPȚIUNEA 1: RENUNȚARE LA ÎMPRUMUT — VENIT IMPOZABIL
Asociatul scrie declarație de renunțare la creanță (împrumut + dobânzi).

Monografie:
4551 = 7588 (Venituri din anulare datorii)

CONSECINȚE FISCALE:
- Venit IMPOZABIL la calcul profit (Cod Fiscal art. 23 — venituri din anularea datoriilor sunt impozabile)
- Cota: 16% impozit profit (sau 1%/3% micro pe cifră de afaceri — atenție: include venitul în cifra de afaceri!)
- Impact micro: poate face firma să iasă din regim micro dacă depășește 500K EUR

OPȚIUNEA 2: APORT LA CAPITAL SOCIAL (majorare capital)
Asociatul transferă creanța în capital prin majorare capital social.

Procedură ONRC:
1. Hotărâre AGA majorare capital prin conversie creanță
2. Raport evaluator autorizat (dacă creanța valuta sau peste plafon)
3. Mențiune ONRC majorare capital
4. Modificare statut

Monografie:
4551 = 1012 (creanța devine capital social)
Sau pentru aport în natură:
4551 = 1041/1042 (prime emisiune capital)

CONSECINȚE FISCALE:
- NU este venit impozabil (Cod Fiscal art. 23 alin. 1 lit. a — aport capital)
- NU intră în cifra de afaceri
- Nu afectează regim micro

DEZAVANTAJ: procedura ONRC e mai lentă (30-60 zile) + costuri (taxe ONRC, evaluator)

OPȚIUNEA 3: APORT LA REZERVE FACULTATIVE (1068)
Asociatul renunță la împrumut și banii sunt înregistrați ca rezerve facultative (cont 1068).

Monografie:
4551 = 1068 (Rezerve provenite din alte surse)

CONSECINȚE FISCALE:
- Tratament intermediar: NU venit impozabil curent
- DAR la distribuire ulterioară: impozabil ca dividende (16% sau alt regim)
- Util pentru acoperire pierderi reportate fără majorare capital

ACOPERIRE PIERDERI REPORTATE (1171 debitor):
Combinație cu 1068 sau 1175:
1068 = 1171 (acoperire pierdere din rezerve)
Sau:
1175 (Rezerve reprezentând surplus realizat din rezerve din reevaluare) = 1171

PROCEDURĂ STANDARD pentru ACTIV NET NEGATIV (L 31/1990 art. 153^24 + L 239/2025):
Dacă ANC < 50% capital social → obligatoriu reglare în 2 ani:
1. Aport asociați (capital sau 1068)
2. Reducere capital (până la nivel ANC pozitiv)
3. Conversie împrumut asociat în capital

DOCUMENTAȚIE OBLIGATORIE pentru ANULARE ÎMPRUMUT:
1. Contract împrumut original (semnat, datat)
2. Hotărâre AGA renunțare la creanță (specifică suma + data + scop)
3. Declarație asociat de renunțare (scrisă, semnată, datată)
4. Notă explicativă în Registru Inventar
5. Pentru capitalizare: hotărâre AGA majorare + raport evaluator (dacă > prag)

RENUNȚARE DOBÂNDĂ (NU principal):
Dacă asociatul renunță DOAR la dobânzi (păstrează principalul):
4551 = 7588 (venit din anulare dobândă — IMPOZABIL)
Sau dacă dobânda nu a fost încă acumulată:
NU se înregistrează nimic (nu există datorie)

CAZ DIVIDENDE NEÎNCASATE de ASOCIAT (renunțare):
Renunțarea la dividende votate dar neîncasate:
457 = 7588 (venit din anulare datorii dividende — IMPOZABIL)
Atenție: impozit pe dividende deja reținut și plătit (impozit 8% sau 10%) → NU se recuperează

ATENȚIE CONTROL ANAF:
ANAF poate recodifica renunțarea la împrumut ca DIVIDENDE MASCATE dacă:
- Asociatul are alte beneficii similare
- Renunțarea este corelată cu profituri mari în firmă
- Lipsește documentația justificativă a împrumutului inițial

PROCEDURA RECOMANDATĂ pentru ACTIV NET NEGATIV:
1. Evaluare situație contabilă (balanță + ANC)
2. Hotărâre AGA cu alegere opțiune (capital vs rezerve vs venit)
3. Documentație complete (renunțare scrisă, AGA, evaluator dacă e cazul)
4. Înregistrare contabilă corectă
5. Declarații fiscale (D100/D101 dacă opțiune cu venit impozabil)
6. ONRC dacă majorare capital`,
    sources: [
      { label: "Cod Fiscal art. 23, 31 (venituri impozabile + neimpozabile)", ref: "https://legislatie.just.ro" },
      { label: "L 31/1990 art. 153^24 (activ net contabil)", ref: "https://legislatie.just.ro" },
      { label: "L 239/2025 (modificări regim activ net)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (conturi 1068, 4551)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "reduceri-comerciale-vs-financiare-709-667-609",
    tags: ["reduceri", "discount", "709", "667", "609", "scont", "rabat", "discount volum"],
    title: "Reduceri comerciale vs financiare — 709 vs 667 vs 609",
    body: `OMFP 1802/2014 + Cod Fiscal art. 286 (baza impozabilă TVA).

DEFINIȚII:
- REDUCERE COMERCIALĂ = legată de TRANZACȚIE (volum, fidelizare, calitate produs) → afectează VENITUL/COSTUL
- REDUCERE FINANCIARĂ = legată de PLATĂ (plată anticipată, scont prompt-pay) → afectează VENITURI/CHELTUIELI FINANCIARE

REDUCERI COMERCIALE — CONTURI 709 (la furnizor) / 609 (la cumpărător):

CONT 709 = "Reduceri comerciale acordate" (la furnizor — afectează venit)
CONT 609 = "Reduceri comerciale primite" (la cumpărător — afectează cost)

Exemple:
- Discount volum (peste prag cifră vânzări)
- Rabat pentru calitate redusă
- Discount fidelizare client recurent
- Reducere pentru lansare produs

MONOGRAFIE FURNIZOR (acordare discount comercial pe factură separată ulterior):
1. Înregistrare factură discount:
   709 = 4111 (storno parțial venit — ROȘU sau cu minus)
   4427 = 4111 (storno TVA colectat aferent reducerii)

2. Pentru DISCOUNT VOLUM TRIMESTRIAL (autofacturare):
   709 = 4111 (cu minus pe fiecare factură de discount)

MONOGRAFIE CUMPĂRĂTOR (primire discount comercial):
1. Înregistrare factură discount primită:
   401 = 609 (reducere cost — cu minus din factură furnizor)
   401 = 4426 (storno TVA dedusă inițial)

REDUCERI FINANCIARE — CONTURI 667 (la cumpărător) / 767 (la furnizor):

CONT 667 = "Cheltuieli privind sconturile acordate" (la cumpărător — PLĂTITOR primește scont)
CONT 767 = "Venituri din sconturi obținute" (la furnizor — DESTINATAR plătește scont)

WAIT — INVERS:
- Scontul de DECONTARE acordat la PLATĂ ANTICIPATĂ:
  - FURNIZOR acordă scont → 667 (cheltuială financiară)
  - CUMPĂRĂTOR primește scont → 767 (venit financiar)

Acesta este sensul standard în OMFP 1802/2014 (cont 667 e la furnizor care acordă scont, NU cumpărător).

CLARIFICARE FINALĂ (Cod Fiscal + OMFP 1802):
- 667 (Cheltuieli sconturi acordate) = furnizor care acordă scont pt plată anticipată client
- 767 (Venituri sconturi obținute) = client care primește scont pt plată anticipată

DIFERENȚA CHEIE — IMPACT TVA:
- REDUCERE COMERCIALĂ (709/609): AFECTEAZĂ baza impozabilă TVA → reducere TVA colectat/dedus
- REDUCERE FINANCIARĂ (667/767): NU afectează baza impozabilă TVA (scontul e financiar, NU comercial)

EXEMPLU PRACTIC FACTURĂ:
Furnizor X facturează către Client Y:
- Servicii cazare: 10.000 RON
- Masă festivă: 20.000 RON
- Total: 30.000 RON
- Discount 10% (3.000 RON) — REDUCERE COMERCIALĂ
- TVA 21% pe baza redusă: (30.000 - 3.000) × 21% = 5.670 RON
- Total factură: 27.000 + 5.670 = 32.670 RON

Înregistrare la furnizor:
4111 = 706 (cazare 10.000)
4111 = 704 (masă 20.000)
4111 = 709 (discount -3.000)
4111 = 4427 (TVA 5.670 pe baza netă)

Total contabil: 4111 debit cu 32.670, credit 27.000 (venituri nete) + 5.670 TVA

CONT 609 vs 6041 / 6042:
- 609 = doar reduceri ulterioare la facturile deja înregistrate (la achiziții servicii/materii prime/marfă)
- 6041 = pe materii prime / 6042 = pe materiale auxiliare (reduceri pe facturi inițiale)

Pentru REDUCERI ULTERIOARE primite, se folosește 609 (NU 6041/6042) pentru claritate.

CAZ AUTOFACTURARE pentru DISCOUNT VOLUM:
Furnizor emite factură pe minus (autofacturare) pentru discount calculat trimestrial pe baza vânzărilor:
- 709 = 4111 (cu valoare negativă)
- 4427 = 4111 (cu valoare negativă pentru TVA aferent)

Declarații:
- D300: reducere baza impozabilă (rândul corespunzător cotei)
- D394: factură de discount cu valori negative
- D406 SAF-T: tip factură "381" (factură de reducere/anulare)

DISTINCȚIE IMPORTANTĂ — CONT 667 vs CONT 6588:
- 667 = SCONT ACORDAT pentru plată anticipată (cheltuială FINANCIARĂ)
- 6588 = PIERDERE din creanțe nerecuperabile, anulare datorii, etc. (cheltuială OPERAȚIONALĂ)

DACĂ se aplică SCONT pe PLATĂ ANTICIPATĂ:
- Termenul plății facturii: 60 zile
- Client plătește în 10 zile (în 50 zile mai devreme)
- Scont 2% pentru promptpay
- Calcul: 2% × valoare factură = sumă scont

Înregistrare furnizor (scont acordat):
667 = 4111 (scont acordat client — cheltuială financiară DEDUCTIBILĂ)
Nu se ajustează TVA (scontul este financiar, nu comercial)

Înregistrare cumpărător (scont primit):
401 = 767 (scont primit — venit financiar IMPOZABIL)
Nu se ajustează TVA dedusă inițial`,
    sources: [
      { label: "OMFP 1802/2014 (conturi 709, 609, 667, 767)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 286 alin. 4 (reduceri comerciale și baza TVA)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "provizioane-concedii-odihna-neefectuate",
    tags: ["provizioane", "concedii odihnă", "151", "1518", "CO neefectuate", "OMFP 1802", "IAS 19"],
    title: "Provizioane concedii odihnă neefectuate — obligație + monografie",
    body: `OMFP 1802/2014 + IAS 19 (Employee Benefits) + Codul Muncii art. 144-149.

OBLIGAȚIE LEGALĂ:
La sfârșitul fiecărui exercițiu (31.12) entitățile contabile sunt OBLIGATE să constituie provizioane pentru concediile de odihnă neefectuate ale salariaților (drepturi câștigate dar neutilizate).

BAZA LEGALĂ:
- Codul Muncii art. 144: dreptul la concediu se naște în fiecare an calendaristic
- Codul Muncii art. 149: dacă concediul nu se efectuează, salariatul are dreptul la compensare în bani (la încetare CIM) sau report
- OMFP 1802/2014: obligație constituire provizion (principiul prudenței)

CALCUL PROVIZION:
Pentru fiecare salariat:
1. Determinare zile CO ACUMULATE neutilizate până la 31.12
2. Calcul valoare zi CO neefectuat = salariu mediu brut zilnic × (1 + contribuții angajator)
3. Total provizion = Σ (zile neutilizate × valoare zi × contribuții)

EXEMPLU:
Salariat cu salariu brut 5.000 RON/lună (21 zile lucrătoare):
- Salariu zilnic brut: 5.000 / 21 = 238 RON
- Contribuții angajator (CAS 2.25% pe muncă specială + CAM 2.25%): ~4.5%
- Valoare zi CO: 238 × 1.045 = 249 RON
- Dacă are 5 zile CO neefectuate: provizion = 5 × 249 = 1.245 RON

MONOGRAFIE CONTABILĂ:

A) CONSTITUIRE PROVIZION (31.12 fiecare an):
   6812 = 1518 (Cheltuieli cu provizioane — Alte provizioane pentru riscuri și cheltuieli)
   Sau direct cu cont specific 151x conform politicii contabile

B) UTILIZARE PROVIZION (anul următor când se efectuează CO sau se compensează):
   1518 = 7812 (Reluare provizion — venit din anulare provizion)

C) PLATĂ CONCEDIU ODIHNĂ (în luna efectuării):
   641 = 421 (cheltuieli salariale)
   Sau dacă utilizezi provizion: 6412 = 1518 cu storno paralel

TRATAMENT FISCAL:

D) DEDUCTIBILITATE PROVIZION:
- Provizionul pentru CO neefectuate: DEDUCTIBIL la calcul impozit profit (Cod Fiscal art. 26 alin. 1 lit. a)
- Limită: max 7 zile CO neefectuate per salariat (la legal 20-25 zile/an)
- Peste 7 zile: necesar documentație suplimentară (refuz salariat documentat, imposibilitate concediu)

E) RELUARE PROVIZION ANUL URMĂTOR:
- Venit IMPOZABIL la momentul reluării (când CO se efectuează sau se compensează)
- Compensare cu cheltuiala efectivă (641) — efect net zero pe profit

DOCUMENTAȚIE OBLIGATORIE (control fiscal):
1. Pontaj salariați 2025 cu evidență zile CO efectuate / neefectuate
2. Calcul provizion pe fiecare salariat (anexă)
3. Decizie administrator constituire provizion
4. Politică contabilă scrisă privind provizioane CO

EFECTE LIPSĂ PROVIZION:
Dacă firma NU constituie provizion:
- Înregistrare lipsește pe seama prudenței (RAPORT AUDIT critică)
- La control fiscal: ANAF poate IMPUNE constituirea retroactivă + ajustare profit
- Bilanț distorsionat (datoriile salariale subestimate)
- La încetare CIM: cheltuiala bruscă cu compensare CO (impact mare pe anul respectiv)

CAZ COMPENSARE BANI la ÎNCETARE CIM:
Când un salariat încetează CIM cu CO neefectuate:
- OBLIGATORIE compensare în bani (Cod Muncii art. 149)
- Calcul: zile CO neefectuate × salariu mediu zilnic
- Contribuții normale (CAS + CASS + impozit) pe această sumă
- DEDUCTIBILĂ integral la firmă

CAZ SPECIAL: CONCEDIU MEDICAL NEEFECTUAT
- NU se aplică provizion pentru concediu medical (acela e drept ce nu se "acumulează")
- Provizionul vizează DOAR concediul de odihnă (CO)

PROVIZIOANE SIMILARE recomandate (OMFP 1802):
- Provizion pentru ore suplimentare neutilizate (compensare bani)
- Provizion pentru a 13-a salariu / bonusuri (dacă există clauză în CIM/CCM)
- Provizion pentru pensionări viitoare cu compensații
- Provizion garanție execuție (vezi entrie dedicate)
- Provizion litigii (Cod Fiscal art. 26 — deductibil cu condiții)`,
    sources: [
      { label: "OMFP 1802/2014 (provizioane)", ref: "https://legislatie.just.ro" },
      { label: "IAS 19 (Employee Benefits)", ref: "https://www.ifrs.org" },
      { label: "Codul Muncii art. 144-149 (concedii)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 26 (deductibilitate provizioane)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "anc-negativ-legea-239-2025-art-153-24",
    tags: ["ANC negativ", "activ net contabil", "Legea 239/2025", "art. 153^24", "capital social", "reîntregire", "dizolvare"],
    title: "ANC negativ — Legea 239/2025 + art. 153^24 (reîntregire obligatorie)",
    body: `LEGEA 239/2025 (publicată în M.O. 160/15.12.2025) — modificări la L 31/1990 referitor la ACTIV NET CONTABIL (ANC).

DEFINIȚIE ANC (Activ Net Contabil):
ANC = TOTAL ACTIVE - DATORII TOTALE = CAPITALURI PROPRII (cont 10x, 11x, 12x consolidat)

Concret în bilanț:
ANC = Capital social (1012) + Prime (104x) + Rezerve (106x, 1068, 1175) + Rezultat reportat (117x) + Profit/Pierdere curentă (121) ± Reevaluare (105) - Subvenții imobilizări (4751)

ATENȚIE CALCUL: subvenții (4751) și reevaluare (105) — interpretări variate:
- 4751 SUBVENȚII pentru imobilizări: NU se scad de obicei (sunt în capitalurile proprii dar cu obligație restituire)
- 105 REZERVE din REEVALUARE: SE INCLUD ÎN ANC (cu rezerva că sunt nedistribuibile)

REGULA FUNDAMENTALĂ (L 31/1990 art. 153^24, modificată de L 239/2025):

PRAGURI CRITICE:
1. ANC < 50% capital social subscris → AGA EXTRAORDINARĂ obligatorie (max 6 luni de la constatare)
2. ANC < ZERO (negativ) → SITUAȚIE GRAVĂ + restricții puternice
3. ANC < 50% capital social pentru DOI ANI consecutiv → posibilă DIZOLVARE de drept (Cod Civil art. 232)

OBLIGAȚII ADMINISTRATOR la constatare ANC < 50% capital:
1. Convocare AGA EXTRAORDINARĂ în max 6 luni
2. AGA decide:
   a) Reducere capital social până la nivel ANC (procedură ONRC + Monitor Oficial)
   b) Majorare capital prin aport asociați (numerar sau în natură)
   c) Dizolvare societate (lichidare voluntară)

TERMEN REGLARE (art. 153^24 alin. 4 — modificat L 239/2025):
Dacă AGA NU hotărăște dizolvarea, societatea este OBLIGATĂ ca până la încheierea exercițiului financiar ULTERIOR celui în care au fost constatate pierderile să procedeze la reducerea capitalului social cu un cuantum CEL PUȚIN egal cu pierderile care nu au putut fi acoperite din rezerve.

INTERPRETARE PRACTICĂ:
- Constatare la bilanț 2025 (depus aprilie 2026) → reglare obligatorie până la 31.12.2026
- Constatare la bilanț 2024 (depus aprilie 2025) → reglare obligatorie până la 31.12.2025
- IMPORTANT: termenul rulează din ANUL FINANCIAR în care s-a CONSTATAT pierderea, NU din anul depunerii bilanțului

OPȚIUNI REGLARE ANC (cele mai des întâlnite):

A) APORT ASOCIAT la CAPITAL SOCIAL (majorare):
Procedura ONRC:
1. Hotărâre AGA majorare capital
2. Mențiune ONRC cu raport evaluator (dacă aport în natură)
3. Mențiune în Monitor Oficial
Monografie:
5121 = 1012 (aport numerar)
sau 4551 = 1012 (conversie împrumut în capital)
Avantaj: NU este venit impozabil
Dezavantaj: procedură lentă (30-60 zile) + costuri

B) RENUNȚARE LA ÎMPRUMUT ASOCIAT (cont 1068 sau venit):
Vezi entrie dedicate "renuntare-imprumut-asociat"
Variante:
- 4551 = 1068 (rezerve facultative — fără impact venituri)
- 4551 = 7588 (venit impozabil — impact pe profit/cifra micro)

C) APORT la REZERVE FACULTATIVE direct (NU prin majorare capital):
5121 = 1068 (asociat depune bani direct în rezerve)
Simplu, fără ONRC, fără impozit

D) REDUCERE CAPITAL SOCIAL:
- Capital subscris se reduce până la nivel ANC pozitiv
- Procedură ONRC + Monitor Oficial (60-90 zile)
- Util pentru companii vechi cu capital istoric foarte mare

E) REEVALUARE IMOBILIZĂRI cu PLUS VALOARE:
Dacă există active subevaluate (clădiri, terenuri vechi):
Reevaluare ANEVAR → 213/214 = 105 (rezervă reevaluare) → crește ANC
Atenție: reevaluarea efectivă necesită raport evaluator autorizat

RESTRICȚII când ANC < 50% capital (Legea 239/2025 — NOU):

1. DISTRIBUIRE DIVIDENDE — INTERZISĂ:
Art. 691 (nou introdus): societățile cu ANC sub jumătate capital social NU pot distribui dividende (inclusiv interimare) din profitul curent.

EXCEPȚIE: profitul curent (anul curent) poate fi distribuit DOAR pentru ACOPERIREA PIERDERILOR REPORTATE (NU către asociați).

2. RESTITUIRE ÎMPRUMUTURI ASOCIAȚI — INTERZISĂ (art. 67 alin. 23-26 nou):
Societățile cu ANC sub jumătate capital NU pot restitui împrumuturi acordate de asociați (numerar sau bunuri).

Excepție: restituire prin conversie în capital (NU plată efectivă).

3. ÎMPRUMUTURI NOI de la ASOCIAȚI — PERMISE:
Asociații POT acorda noi împrumuturi (ajută la reîntregire ANC indirect prin creșterea activelor)

4. RESTITUIRE ÎMPRUMUT TERȚ (NU asociat) — PERMISĂ:
Restituirea împrumuturilor către bănci, alte societăți NE-AFILIATE rămâne permisă (Legea 239/2025 NU restricționează).

SCENARIU TIPIC POST-2025:
Bilanț 2025: ANC negativ -50.000 lei (capital 200 lei, creditare asociat 100.000 lei, pierdere -50.200 lei)
Opțiuni:
1. Renunțare creditare 50.200 lei → 4551 = 7588 (venit impozabil 16%)
2. Conversie creditare în 1068: 4551 = 1068 (fără impozit imediat)
3. Aport capital nou: 5121 = 1012 cu 100.000 lei (majorare ONRC)

CAZ SUSPENDARE ACTIVITATE:
Suspendarea la ONRC pe 3 ani NU SCUTEȘTE de obligația reîntregirii ANC. La revenirea din suspendare, obligația rămâne aplicabilă.

CONSECINȚE NERESPECTARE:
1. Amendă: 2.000 - 5.000 RON (Codul Civil + L 31/1990)
2. ANAF poate solicita reglare prin acțiune în instanță
3. POSIBILĂ DIZOLVARE de drept la ANC < 50% pentru 2 ani consecutiv
4. Răspundere personală administrator pentru datoriile firmei (Codul Civil art. 222)

BIFĂ ÎN BILANȚ:
Formularul bilanț 2025 conține bifă specifică pentru declararea ANC < 50% capital — OBLIGATORIE bifare dacă situația se aplică.
Nebifarea → posibil control fiscal + ajustare retroactivă (Cod Procedură Fiscală)

DOCUMENTAȚIE OBLIGATORIE:
1. Hotărâre AGA constatare ANC < 50% capital
2. Decizie privind opțiune reglare (reducere/majorare capital sau dizolvare)
3. Calcul ANC detaliat (anexă la AGA)
4. Mențiune ONRC dacă reducere/majorare capital
5. Pentru renunțare împrumut: declarație asociat + hotărâre AGA + monografie contabilă`,
    sources: [
      { label: "L 239/2025 (modificări L 31/1990 — ANC)", ref: "https://legislatie.just.ro" },
      { label: "L 31/1990 art. 153^24, 67, 691 (capital + restricții)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (calcul capitaluri proprii)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "categorii-marime-entitati-tip-bilant",
    tags: ["micro", "entitate mică", "entitate mijlocie", "entitate mare", "praguri bilant", "OMFP 1802", "S1001", "S1002"],
    title: "Categorii mărime entități + tip bilanț — micro/mică/mijlocie/mare",
    body: `OMFP 1802/2014 (cap. 1 secț. 2) + Directiva 2013/34/UE.

CRITERIILE de MĂRIME (OMFP 1802/2014 pct. 9):

MICROENTITĂȚI (max 2 din 3 criterii):
- Total active: 2.250.000 LEI
- Cifra de afaceri netă: 4.500.000 LEI
- Număr mediu salariați: 10

ENTITĂȚI MICI (max 2 din 3 criterii, peste micro):
- Total active: 22.500.000 LEI
- Cifra de afaceri netă: 45.000.000 LEI
- Număr mediu salariați: 50

ENTITĂȚI MIJLOCII (max 2 din 3 criterii, peste mici):
- Total active: 75.000.000 LEI
- Cifra de afaceri netă: 150.000.000 LEI
- Număr mediu salariați: 250

ENTITĂȚI MARI: depășesc 2 din 3 criterii mijlocii.

REGULA DE TRANZIȚIE (OMFP 1802/2014 pct. 13):
Entitatea schimbă categoria DOAR dacă, în DOUĂ EXERCIȚII FINANCIARE CONSECUTIVE, depășește/scade sub limitele a 2 din 3 criterii.

EXEMPLU APLICARE REGULĂ DE TRANZIȚIE:
Bilanț 2024: depășește 2 criterii peste micro
Bilanț 2025: depășește 2 criterii peste micro
→ În 2026 SE SCHIMBĂ la categoria "mici"

Bilanț 2024: depășește 2 criterii peste micro
Bilanț 2025: rămâne sub praguri micro
→ Rămâne MICRO (nu se schimbă, fiindcă nu sunt 2 ani consecutivi peste)

EXCEPȚIE primul an de activitate:
- Societate înființată în 2024: aplică regula DIRECTĂ (chiar de la primul exercițiu)
- Pentru 2024 și 2025: dacă în 2024 depășește 2 criterii → entitate mică în 2025

PRIMUL AN DE ACTIVITATE: aplică regula de încadrare la categoria pe care o îndeplinește (fără regula de 2 ani consecutiv pentru FIRMELE NOI).

PRAGURI ACTUALIZATE (OMFP 1802/2014 modificat 2024):
- Micro: 2.250.000 / 4.500.000 / 10 (modificate de la 2024)
- Mici: 22.500.000 / 45.000.000 / 50
- Mijlocii: 75.000.000 / 150.000.000 / 250

FORMULARE DE BILANȚ pe categorii:

MICROENTITĂȚI: formular S1001 (Bilanț scurt micro)
- Active circulante curente (rd 06-13)
- Datorii curente (rd 16-23)
- Capitaluri proprii (rd 24-35)
- F30 simplificat
- NU sunt obligate la note explicative detaliate

ENTITĂȚI MICI: formular S1002 (Bilanț entitate mică)
- Bilanț complet (active fixe + circulante + capitaluri detaliate)
- Cont profit/pierdere complet (F20)
- Note explicative obligatorii
- F30 complet

ENTITĂȚI MIJLOCII: formular S1002 (același cu entitate mică) + ANEXE SUPLIMENTARE:
- Situația modificărilor capitalului propriu (obligatorie)
- Situația fluxurilor de trezorerie (obligatorie)
- Audit STATUTAR OBLIGATORIU (Legea 162/2017)

ENTITĂȚI MARI: formular S1002 + IFRS pentru societățile listate:
- Toate situațiile financiare complete (5 piese)
- Audit statutar
- Raport conducere
- Raport sustenabilitate (CSRD pentru cele cu > 250 angajați și > 50 mil EUR cifră)
- Consolidare grup obligatorie

FORMULARE SPECIALE:

S1014 = ONG cu activitate economică
S1015 = ONG fără activitate economică
S1039 = Bilanț LICHIDARE/DIZOLVARE (etapă I sau II)
S1052 = Bilanț FUZIUNE/DIVIZARE

ATENȚIE FORMULARE 2025+:
ANAF publică anual modelele actualizate (de obicei în martie). Verifică la https://anaf.ro/declaratiionline pentru versiunea curentă.

TERMENE DEPUNERE (OMFP 2861/2009 actualizat OUG 8/2026):
1. Microîntreprinderi/Mici: 31 MAI anul următor (sau 31 martie pentru a rămâne micro — OUG 8/2026)
2. Mijlocii/Mari: 31 MAI anul următor
3. ONG: 30 APRILIE
4. PFA/CMI/II: 31 IUNIE (declarație unică D212)
5. Sucursale entități străine: 30 zile de la depunerea bilanțului mama
6. An fiscal modificat: 31 mai după sfârșit an fiscal

OBLIGAȚIE depunere micro RAMÂN LA MICRO (OUG 8/2026):
Pentru a rămâne plătitor de impozit micro în 2026, situațiile financiare aferente 2025 trebuie depuse până la 31.03.2026.
Depunere între 01.04.2026 și 31.05.2026: pierdere statutului de micro automatic (trecere la impozit profit din 01.01.2026).

CONSECINȚE CATEGORII GREȘITE:
- Bilanț depus pe categorie greșită (ex: micro în loc de mică) → BILANȚ NEVALID
- Necesitate REDEPUNERE cu formular corect
- Eventuale ajustări fiscale pentru anii afectați

DETERMINARE INDICATORI:
- Total active: bilanț ACTIV TOTAL la 31.12 (NU rulaje, NU media)
- Cifra de afaceri: cont 70x rulaj anual (708-709 reduceri)
- Salariați mediu: SUMA pontaje / 12 luni × COEFICIENT timp lucrat (ex: salariat 1/2 normă = 0.5)

CASE EDGE: an cu activitate parțială
- Societate înființată 01.07.2025: cifră anuală × (12/6) = anualizată pentru determinare categoriei`,
    sources: [
      { label: "OMFP 1802/2014 pct. 9-13 (categorii mărime)", ref: "https://legislatie.just.ro" },
      { label: "Directiva 2013/34/UE (Accounting Directive)", ref: "https://eur-lex.europa.eu" },
      { label: "OUG 8/2026 (termen 31.03 pentru micro)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "termen-depunere-bilant-oug-8-2026",
    tags: ["termen bilant", "OUG 8/2026", "31 martie", "31 mai", "micro", "trecere profit"],
    title: "Termen depunere bilanț 2025 + OUG 8/2026 (regulă specială micro)",
    body: `OMFP 2861/2009 + OUG 8/2026 (regulă specială microîntreprinderi 2026).

REGULA GENERALĂ:
Situațiile financiare anuale se depun la ANAF/ONRC până la:
- 30 APRILIE pentru ONG
- 31 MAI pentru societăți comerciale, PFA, CMI

EXCEPȚIE NOUĂ (OUG 8/2026):
Pentru a păstra statutul de microîntreprindere în 2026, situațiile financiare aferente exercițiului 2025 TREBUIE depuse până la 31 MARTIE 2026.

CONSECINȚE DEPUNERE DUPĂ 31.03.2026 (pentru micro):
- Pierdere AUTOMATĂ statut micro de la 01.01.2026
- Trecere la regim impozit profit (16%) începând cu 01.01.2026
- Recalculare obligatorie D101 trimestre 1-2 2026 (cu impozit profit)
- D100 trimestrial transformat în D101 anual cu trimestre

EXCEPȚIE: depunere bilanț cu ÎNTÂRZIERE pentru anii 2023/2024:
Dacă firma nu a depus bilanțurile pentru 2023 și 2024 la termen → automat plătitoare impozit profit (NU mai poate fi micro)
Nu există posibilitate de "revenire la micro" prin depunerea retrospectivă a bilanțurilor.

CINE TREBUIE SĂ DEPUNĂ BILANȚ:
- Toate firmele active (cu activitate)
- Microîntreprinderile, fără excepție
- ONG-urile (chiar fără activitate economică)
- Sucursalele de firme străine în RO

CINE POATE DEPUNE DECLARAȚIE DE INACTIVITATE (în loc de bilanț):
Societăți care în cursul anului fiscal:
- NU au avut tranzacții (bancă, casierie)
- NU au avut facturi emise sau primite
- NU au avut salariați activi
- NU au avut active sau datorii (sau le-au moștenit fără mișcare)

Termen depunere declarație inactivitate: 25 IUNIE anul următor (extins de OPANAF)

DACĂ EROARE — DEPUSĂ DECLARAȚIE INACTIVITATE în loc DE BILANȚ:
Procedură corectare:
1. Cerere la ANAF cu motivare eroare
2. Anulare declarație inactivitate (formular 700 cu indicare)
3. Depunere bilanț corect (cu rectificative dacă termen expirat)
4. Recalcul accesorii (dobânzi, penalități) dacă impozit neplatit la termen

DACĂ EROARE — DEPUSĂ BILANȚ în loc DE INACTIVITATE:
Mai simplu: păstrează bilantul depus (cu valori 0 pe majoritatea liniilor) — nu e necesară corecție.

REDEPUNERE BILANȚ (rectificativă):
OMFP 450/2016 permite redepunere bilanț DOAR dacă:
1. S-au descoperit erori MATERIALE care afectează indicatori cheie (active, capital, profit)
2. Indicatorii raportați anterior diferă semnificativ
3. Aprobat de AGA noua aprobare a situațiilor financiare rectificate

Procedură rectificativă:
1. Hotărâre AGA cu motivare rectificare
2. Bilanț rectificativ (cu bifă rectificativă în PDF inteligent)
3. Anexe corectate
4. Depunere ONRC + ANAF în 60 zile de la AGA

OBLIGAȚIE AGA pentru APROBARE BILANȚ:
L 31/1990 art. 111-129: bilanțul TREBUIE aprobat de AGA înainte de depunere
- AGA ordinară: maximum 5 luni de la sfârșitul exercițiului (până la 31 mai)
- Termen depunere ONRC bilanț aprobat: maximum 6 luni de la sfârșit exercițiu (până la 30 iunie)
- Termen ANAF: similar 30 iunie

BILANȚ DEPUS FĂRĂ AGA — REGULARIZARE RETROACTIVĂ:
Dacă s-a depus bilanț fără AGA prealabilă (situație frecventă în firme mici), se poate organiza AGA ULTERIOARĂ pentru aprobare retroactivă:
- Hotărâre AGA care aprobă bilanțul deja depus
- Mențiune motivare retroactivă
- Anexare la depunere ONRC (chiar și după termen)

DOCUMENTE OBLIGATORII ÎN ARHIVA ZIP BILANȚ:
1. Formular bilanț PDF inteligent (semnat electronic)
2. Anexele F10, F20, F30, F40 (corespunzător categoriei)
3. Note explicative (pentru entitate mică+)
4. Politici contabile (pentru entitate mijlocie+)
5. Raport administrator (pentru entitate mică+)
6. Raport audit (dacă audit obligatoriu)
7. Raport cenzor (pentru SA + ONG cu cenzor obligatoriu)
8. Pentru entitate mijlocie+: Situație modificări capital + Cash flow

ATENȚIE SEMNĂTURĂ:
- Reprezentant legal (administrator): semnătură ELECTRONICĂ CALIFICATĂ obligatorie
- Întocmitor bilanț (contabil/expert contabil): semnătură electronică sau olografă (în funcție de role)
- PDF inteligent permite DOAR DOUĂ semnături calificate (administrator + întocmitor)

SANCȚIUNI NEDEPUNERE BILANȚ:
- Nedepunere la termen: 1.000 - 10.000 RON (Legea 82/1991 art. 41)
- Nedepunere repetată (3+ ani): inactivitate fiscală + dizolvare ONRC posibilă
- Pentru entități mari: 10.000 - 30.000 RON + posibilă suspendare CAEN`,
    sources: [
      { label: "OMFP 2861/2009 (norme depunere situații financiare)", ref: "https://legislatie.just.ro" },
      { label: "OUG 8/2026 (termen 31.03 micro)", ref: "https://legislatie.just.ro" },
      { label: "L 82/1991 art. 41 (sancțiuni)", ref: "https://legislatie.just.ro" },
      { label: "L 31/1990 art. 111-129 (AGA aprobare bilanț)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "semnare-situatii-financiare-2025",
    tags: ["semnare bilant", "semnătură electronică", "calificată", "administrator", "contabil", "categorii 11 12 13"],
    title: "Semnare situații financiare 2025 — calificată + roluri (11/12/13)",
    body: `OMFP 2861/2009 + OPANAF (formular bilanț PDF inteligent).

OBLIGAȚII SEMNARE (din 2024+):
Situațiile financiare anuale TREBUIE semnate ELECTRONIC cu SEMNĂTURĂ CALIFICATĂ (eIDAS) de DOUĂ persoane:
1. Reprezentant legal al entității (administrator)
2. Persoană care întocmește bilanțul

NU MAI SUNT ADMISE:
- Semnături olografe (scrise de mână, scanate)
- Semnături electronice avansate non-calificate (PAdES Basic)
- Imagini de semnătură

CATEGORIA ROL ÎNTOCMITOR (în formular PDF inteligent):

COD 11 = EXPERT CONTABIL membru CECCAR (cu carnet + viză anuală)
- Studii superioare ECONOMICE + stagiu CECCAR + examen
- Numire prin contract servicii contabile cu firma
- Răspundere profesională pentru semnătură

COD 12 = CONTABIL ANGAJAT cu studii ECONOMICE SUPERIOARE (cod COR 121125)
- Studii superioare în domeniul economic
- Angajat al firmei (CIM)
- Numit prin decizie administrator ca responsabil contabilitate

COD 13 = CONTABIL ANGAJAT FĂRĂ studii superioare economice
- Studii medii sau alte specializări
- Angajat cu CIM la firmă
- Permis pentru firmele MICRO și mici cu activitate redusă

REGULA APLICARE:
- Codul 11 (expert contabil): ÎNTOTDEAUNA acceptat
- Codul 12 (contabil angajat economic): acceptat pentru orice categorie firma
- Codul 13 (contabil fără studii economice): acceptat doar pentru micro/mici cu cifră < 4.500.000 lei

CONTABIL la PROPRIA FIRMĂ:
Administratorul firmei cu studii economice superioare + CIM la propria firmă POATE semna ambele roluri (reprezentant legal + întocmitor) — caz frecvent în micro.
Codul în acest caz: 12 (în calitate de angajat economic) + bifă "administrator"

CONTABILITATE EXTERNALIZATĂ (firmă servicii contabile):
Persoana semnatară: expert contabil CECCAR (cod 11) cu împuternicire scrisă de la administratorul firmei beneficiar
ATENȚIE: contractul de servicii TREBUIE să prevadă expres dreptul de semnătură electronică

ÎMPUTERNICIRE NOTARIALĂ pentru DEPUNERE:
Dacă semnatarul electronic NU este administrator, e necesară împuternicire notarială pentru:
- Acces SPV firma client
- Depunere declarații fiscale
- Semnare bilanț în numele firmei

PDF INTELIGENT — LIMITĂRI:
- Permite EXACT 2 semnături calificate (administrator + întocmitor)
- NU se pot adăuga semnături olografe (acestea se aplică pe documentele anexe DACĂ se solicită)
- Semnăturile electronice se validează la DUK Integrator (online ANAF)

VALIDARE DUK INTEGRATOR:
Înainte de depunere, bilantul TREBUIE validat la DUK Integrator (formularul își generează automat un PDF semnat S1002 pentru transmitere prin e-guvernare).
EROARE comună: DUK Integrator NU validează bilantul cu erori (corelații F10-F30 incorecte, lipsă semnături, etc.) — necesar corectare ÎNAINTE de depunere.

EROARE TEHNICĂ la VALIDARE S1002:
Cauze frecvente:
1. Versiune browser/Java incompatibilă (recomandate IE 11 / Edge legacy / Firefox cu Java plugin)
2. Semnătură expirată / nevalabilă la momentul validării
3. PDF inteligent corupt (necesar redownload din SPV)
4. Probleme conexiune la DUK Integrator (server ANAF)

SOLUȚII:
- Refresh browser + reîncărcare PDF
- Verificare validitate semnătură electronică (panou de validare semnături)
- Folosire formular alternativ (versiune offline)
- Asistență departament tehnic ANAF

PERSOANĂ ÎNTOCMITOR cu CIM PARȚIAL la FIRMĂ + LA ALTĂ FIRMĂ:
Întocmitorul poate fi angajat cu CIM la firma respectivă (norma parțială) sau prestator extern.
Pentru ONG fără salariați: contabilul de la altă firmă POATE întocmi bilantul (cu contract servicii + împuternicire pentru semnătură)

RĂSPUNDERE LEGALĂ:
- Administratorul: răspunde PENAL pentru veridicitate bilanț (Codul Penal art. 271-275)
- Întocmitorul: răspunde CIVIL pentru erori procedurale (Cod Fiscal + L 31/1990)
- Expertul contabil CECCAR: răspundere SUPLIMENTARĂ disciplinară (cod etic CECCAR)

CAZUL: 2 ADMINISTRATORI ÎN SPV
Dacă firma are 2 administratori cu drepturi depline, AMBII pot accesa SPV. Bilantul semnat de UNUL SINGUR este valid (NU e necesară semnătură ambilor).
Atenție: fostul contabil neinrolat în SPV NU poate semna pentru administratorul actual fără împuternicire.

ATENȚIE ROL "11/12/13" trebuie ales CORECT:
- Greșeala în categoria rolului (ex: bifare 13 când persoana e expert contabil) → potențial control fiscal cu impunere bilanț recalificat
- Recomandare: bifează cea mai înaltă categorie pe care o îndeplinește persoana semnatară`,
    sources: [
      { label: "OMFP 2861/2009 (semnare situații financiare)", ref: "https://legislatie.just.ro" },
      { label: "Regulament eIDAS UE (semnături electronice)", ref: "https://eur-lex.europa.eu" },
      { label: "OUG 75/1999 (CECCAR — experți contabili)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "audit-statutar-intern-praguri",
    tags: ["audit statutar", "audit intern", "Legea 162/2017", "OUG 75/1999", "ASPAAS", "auditor", "cenzor"],
    title: "Audit statutar + intern — praguri obligatorii + criterii",
    body: `Legea 162/2017 (audit statutar) + OUG 75/1999 (organizare profesia auditor) + ASPAAS (autoritatea de supraveghere).

AUDIT STATUTAR — OBLIGATORIU pentru (Legea 162/2017 art. 2):

ENTITĂȚI MIJLOCII și MARI:
- Depășire 2 din 3 criterii pentru 2 EXERCIȚII CONSECUTIVE:
  - Total active: 22.500.000 LEI (NEW: pentru mijlocii 75M)
  - Cifra afaceri netă: 45.000.000 LEI
  - Număr mediu salariați: 50

ENTITĂȚI MICI care DEPĂȘESC 2/3 CRITERII MICI:
ATENȚIE: entitatea poate rămâne în categorie "mică" și totuși să fie OBLIGATĂ la audit dacă depășește 2 din 3 praguri "audit obligatoriu" (15.000.000 lei active / 33.000.000 lei CA / 25 angajați).

PRAGURI AUDIT OBLIGATORIU (Legea 162/2017 specific):
- Total active: 16.000.000 LEI (modificat)
- Cifra afaceri netă: 32.000.000 LEI (modificat)
- Număr mediu salariați: 50

ÎNTÂLNIT 2 DIN 3 ÎN 2 ANI CONSECUTIVI → audit obligatoriu

CATEGORII SPECIALE AUDIT OBLIGATORIU:
1. Entități de interes public (PIE): bănci, asigurări, societăți listate la BVB
2. Companii reglementate ASF (broker, fonduri investiții)
3. Societăți cu acționari majoritari străini (în condiții specifice)
4. Companii cu obiect activitate "audit"/"contabilitate" (CECCAR)
5. Entități care au depășit pragurile audit obligatoriu

AUDIT INTERN — OBLIGATORIU pentru (Legea 162/2017 + OUG 75/1999):

CATEGORII OBLIGATORIU AUDIT INTERN:
1. Companii de interes public (PIE): obligatoriu
2. Companii listate la BVB: obligatoriu
3. Entități SUPUSE AUDITULUI STATUTAR: opțional dar RECOMANDAT
4. Companii grup cu departament audit intern central: poate fi externalizat la grup

ENTITĂȚI MICI sau MIJLOCII AUDITATE:
- Audit STATUTAR obligatoriu (dacă întâlnesc praguri)
- Audit INTERN: NU obligatoriu (chiar dacă auditate statutar)
- Bifă "audit intern organizat" în bilanț: NU (pentru entitățile fără obligație)

ENTITATE MARE cu audit statutar:
- Audit intern: OBLIGATORIU
- Bifă "audit intern organizat" în bilanț: DA
- Departament audit intern intern sau externalizat la firma autorizată ASPAAS

CRITERIU "MARE CONTRIBUABIL":
- Total active > 250M lei sau CA > 250M lei → poate fi calificat "Mare Contribuabil" de ANAF
- Mare contribuabil = OBLIGATORIU audit intern (regulamente specifice ANAF)
- Departament audit intern intern sau servicii externe (firme autorizate ASPAAS)

CERINȚE PENTRU AUDITOR STATUTAR (Legea 162/2017):
- Persoană fizică/juridică autorizată ASPAAS (registru public)
- Independent față de entitatea auditată
- NU poate fi simultan auditor și consultant (separare obligatorie)
- NU poate audita o firmă care e client de servicii contabile a aceleiași firme

CERINȚE PENTRU AUDITOR INTERN:
- Studii superioare ÎN ECONOMIE/FINANȚE/AUDIT
- Pregătire profesională specifică (CAFR, IIA International)
- Pentru grupuri internaționale: pregătire CIA (Certified Internal Auditor)
- Independent operațional față de departamentele auditate

CENZOR vs AUDITOR — DIFERENȚE:
CENZOR:
- Aplicabil la SA și ONG (NU SRL)
- Numit de AGA (3 cenzori titulari + 3 supleanți pentru SA)
- Studii medii sau superioare în economie
- Răspundere LIMITATĂ (verifică doar conformitate de bază)
- Înlocuit de AUDITOR la SA care îndeplinesc praguri audit obligatoriu

AUDITOR:
- Profesionist autorizat ASPAAS (răspundere profesională mare)
- Numit prin contract
- Răspundere PROFESIONALĂ (asigurare profesională obligatorie)
- Emite RAPORT AUDIT detaliat (opinia: fără rezerve / cu rezerve / contrară / abțineri)

CENZOR la ONG fără utilitate publică:
- NU este obligatoriu la fundații/asociații cu 7 sau mai puțini fondatori
- Pot avea cenzor opțional din rândul asociaților
- Bilanțul ONG NU necesită audit statutar (excepție: ONG de utilitate publică)

ONG DE UTILITATE PUBLICĂ:
- Audit statutar obligatoriu (chiar fără praguri financiare)
- Cenzor SUPLIMENTAR la audit
- Raportare specială la Min. Justiție

INCOMPATIBILITĂȚI CENZOR/AUDITOR:
- Persoană care e cenzor NU poate fi simultan auditor la aceeași entitate
- Salariat firmă audit/contabilitate NU poate fi cenzor la o firmă auditată/asigurată servicii contabile de aceeași firmă (conflict interes)
- Familie până în gradul 4 cu administrator/asociat — incompatibilitate cu auditor/cenzor

REGULA "2 ANI CONSECUTIV" PENTRU AUDIT:
Obligație audit statutar începe la al 2-LEA exercițiu consecutiv de depășire praguri.
Exemplu:
- 2024: depășire 2/3 criterii → încă fără obligație
- 2025: depășire 2/3 criterii (al doilea an consecutiv) → AUDIT OBLIGATORIU pe 2025 (bilanț depus în 2026 cu raport auditor)

INTRARE / IEȘIRE din audit obligatoriu:
- INTRARE: 2 ani consecutiv peste praguri → audit obligatoriu din anul 2
- IEȘIRE: 2 ani consecutiv sub praguri → poate renunța la audit (decizie AGA)

DOCUMENTE ATAȘATE ÎN ARHIVA ZIP BILANȚ pentru AUDITATE:
1. Raport audit statutar (semnat de auditor)
2. Raport audit intern (dacă obligatoriu)
3. Raport cenzori (pentru SA și ONG cu cenzor)
4. Politici contabile detaliate
5. Note explicative complete`,
    sources: [
      { label: "Legea 162/2017 (audit statutar)", ref: "https://legislatie.just.ro" },
      { label: "OUG 75/1999 (organizare profesia auditor)", ref: "https://legislatie.just.ro" },
      { label: "ASPAAS — registru auditori", ref: "https://aspaas.gov.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "bilant-lichidare-dizolvare-s1039",
    tags: ["lichidare", "dizolvare", "S1039", "bilanț lichidare", "etape", "voluntară", "simultană"],
    title: "Bilanț lichidare/dizolvare — S1039 + etape + monografie închidere",
    body: `L 31/1990 art. 227-237 (dizolvare/lichidare) + OMFP 1376/2004 (norme bilanț lichidare).

DEFINIȚII:
DIZOLVARE = decizia oprire activitate firmă
LICHIDARE = procedura efectivă închidere (după dizolvare)
DIZOLVARE+LICHIDARE SIMULTANĂ = procedură rapidă (firme fără datorii/active complicate)

CAUZE DIZOLVARE (L 31/1990 art. 227):
1. Expirare durată firmei (rar)
2. Decizie AGA (cea mai frecventă)
3. Imposibilitate realizare obiect activitate
4. Faliment / insolvență (procedură specială)
5. Dizolvare de drept (ANC < 50% pentru 2 ani consecutivi nereglat — Legea 239/2025)

FORMULARUL DE BILANȚ pentru LICHIDARE/DIZOLVARE:
S1039 = Bilanț specific lichidare/dizolvare
- Bifă etapă: I (la deschidere lichidare) sau II (la închidere)
- Conține bilanț + cont profit/pierdere + note explicative

ETAPE LICHIDARE VOLUNTARĂ:

ETAPA 1 — DESCHIDERE LICHIDARE:
1. Hotărâre AGA dizolvare (publicată în Monitor Oficial — Partea IV)
2. Numire lichidator (poate fi administratorul existent sau alt lichidator autorizat)
3. Bilanț LA DATA HOTĂRÂRII AGA (NU la 31.12)
4. Depunere S1039 etapa I la ONRC + ANAF în 30 ZILE de la AGA
5. Notificare creditorilor (Monitor Oficial)
6. Publicare în 30 zile de la AGA

ETAPA 2 — ÎNCHIDERE LICHIDARE:
1. Recuperare creanțe + plată datorii
2. Vânzare/distribuire active
3. Calcul rezultat lichidare (profit/pierdere finală)
4. Plata impozit lichidare (impozit profit pe rezultatul lichidării)
5. Distribuire reziduu asociaților
6. Bilanț FINAL DE LICHIDARE (S1039 etapa II)
7. Radiere la ONRC (eliminarea din registrul comerțului)

LICHIDARE SIMULTANĂ (procedură rapidă):
- Aplicabilă firmelor FĂRĂ DATORII + FĂRĂ ACTIVE COMPLEXE
- Hotărâre AGA cu mențiune "dizolvare simultană cu lichidare"
- O SINGURĂ etapă (NU 2 etape)
- Termen: 30 ZILE de la publicare Monitor Oficial pentru obiecții creditori
- Dacă nu există obiecții → radiere directă

MONOGRAFIE CONTABILĂ LICHIDARE (canonică):

Situație inițială (de la balanță):
- Cont 1012 (capital social) = creditor
- Cont 1171/121 (profit/pierdere reportat/curent)
- Cont 4551 (creditare asociat)
- Cont 5311/5121 (numerar)
- Cont 411/461 (creanțe)
- Cont 401/421 (datorii)

PAS 1 — Recuperare creanțe:
5121 = 411 (încasare clienți)
Dacă nu se recuperează: 6588 = 411 (pierdere)

PAS 2 — Plată datorii:
401 = 5121 (plată furnizori)
421 = 5121 (plată salarii dacă există)

PAS 3 — Vânzare active:
5121 = 7583 (venit din vânzare imobilizări)
6583 = 213/214 (descărcare valoare contabilă)
281x = 213/214 (anulare amortizare)

PAS 4 — Închidere conturi venituri/cheltuieli:
121 = 6xx (preluare cheltuieli pe rezultat)
7xx = 121 (preluare venituri pe rezultat)

PAS 5 — Calcul impozit lichidare (dacă profit):
691 = 4411 (impozit profit pe rezultat lichidare)
4411 = 5121 (plată impozit)

PAS 6 — Închidere rezultat curent:
121 = 1171 sau invers (transfer rezultat reportat)

PAS 7 — Distribuire reziduu către asociați:
1171 = 5311/5121 (cu calculul impozit dividende 10% pe sume distribuite)
1012 = 5311/5121 (restituire capital social)
4551 = 5121 (rambursare împrumut asociat)

CAZ SPECIFIC: ATRIBUIRE IMOBIL la ASOCIATUL UNIC:
- Imobil din 212 (clădire) trece în proprietatea asociatului prin distribuire în natură
- Monografie:
  1012 = 212 (până la valoarea capital social — fără impozit)
  117x = 212 (rest peste capital — IMPOZABIL ca dividend distribuit în natură)
  Impozit pe dividende 10% pe partea peste capital
- ATENȚIE: imobilul trece în proprietate prin act notarial (NU automat)

IMPOZIT DIVIDENDE LA LICHIDARE:
- Distribuire reziduu către asociați = DIVIDENDE (Cod Fiscal art. 91-97)
- Cota: 10% (cota standard 2025) sau alte cote (asociați PJ — 0% în condiții specifice)
- Plata: 25 a luni următoare distribuirii
- D205: declarare beneficiari

CAZ ONG la LICHIDARE:
- Activele NU pot fi distribuite asociaților (statut ONG)
- TREBUIE transferate către alte ONG sau către stat
- Bilanț S1039 cu mențiune destinație active
- NU se aplică impozit pe distribuire (este transfer non-profit)

CAZ FALIMENT (procedură specială):
- Bilanț ÎNTOCMIT de lichidator judiciar (NU de firma însăși)
- Procedură guvernată de L 85/2014 (insolvență)
- Bilanț FINAL după plata tuturor datoriilor (în ordinea legală: salariați, fisc, garantați, chirografari)
- Reziduu eventual: către asociați (rar — de obicei nu rămâne)

DECLARAȚII FINAL LICHIDARE:
1. D101 anul lichidării (cu calcul impozit pe rezultat lichidare)
2. D300 ultimul decont TVA (cu sold 0 sau de rambursare ANAF)
3. D406 SAF-T anual (Active) pentru perioada anului lichidării
4. Decont radiere TVA (formular 700 cu radiere cod TVA)

DECONT DE TVA pentru RADIERE:
- Stocuri rămase: ajustare TVA (dacă TVA fusese dedus la achiziție)
- Imobilizări nedistribuite: ajustare TVA pe partea neamortizată (Cod Fiscal art. 305-306)
- Cerere rambursare TVA dacă există sold TVA de recuperat

EVALUARE CREANȚE/DATORII în VALUTĂ la LICHIDARE:
- Suspendare activitate firmă → NU se mai reevaluează creanțele/datoriile (păstrare la cursul de pe data suspendării)
- La închidere finală: reevaluare ultima la cursul BNR de la data radierii (diferența pe 765/665)

BILANȚ DEPUS DUPĂ RADIERE:
Dacă firma e deja radiată la ONRC (ex: ianuarie 2026), NU mai are obligație depunere bilanț pentru 2025 (ANAF nu mai are evidență firmă). Excepție: dacă există proceduri în curs (recuperări TVA, etc.).`,
    sources: [
      { label: "L 31/1990 art. 227-237 (dizolvare/lichidare)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1376/2004 (norme bilanț lichidare)", ref: "https://legislatie.just.ro" },
      { label: "L 85/2014 (procedura insolvenței)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "dividende-interimare-regularizare-bilant",
    tags: ["dividende interimare", "regularizare", "456", "457", "463", "T4", "710", "S1002", "bilanț interimar"],
    title: "Dividende interimare — regularizare T4 + S1002 + activ net pozitiv",
    body: `Cod Fiscal art. 67^1 + L 31/1990 art. 67 alin. 4 + L 239/2025 (restricții ANC).

REGULA INTERIMARE (Cod Fiscal art. 67^1):
Dividende interimare = distribuiri TRIMESTRIALE din profitul anului curent, pe baza unui BILANȚ INTERIMAR (S1002).

CONDIȚII OBLIGATORII pentru distribuire interimară:
1. Bilanț interimar întocmit + aprobat de AGA (S1002)
2. Activ Net Contabil POZITIV (peste 50% capital social — Legea 239/2025 nou)
3. Profit interimar SUFICIENT (peste rezerve legale obligatorii)
4. Hotărâre AGA pentru distribuire (cu suma + beneficiari + dată plată)

LIMITAREA NOUĂ (Legea 239/2025):
Societățile cu ANC sub jumătate capital NU pot distribui dividende interimare (interdicție absolută).
Doar acoperire pierderi reportate (profitul intern poate stinge pierderile, NU distribuit asociaților).

PERIOADE STANDARD pentru BILANȚ INTERIMAR:
- T1: 31.03 (depus cu raportarea semestrială 16.08)
- T2: 30.06 (semestrial)
- T3: 30.09 (cea mai frecventă pentru interimare)
- T4: 31.12 → DIN bilanțul anual normal (NU interimar)

IMPOZIT DIVIDENDE INTERIMARE:
- Cotă: 10% (cota standard 2025+)
- Reținut la sursă la plata efectivă
- Declarat în D100 lunar (cont 4424 — Impozit dividende)
- Plătit până la 25 luna următoare distribuirii
- Declarat în D205 anuală (toate distribuirile)

REGULARIZARE LA SFÂRȘIT AN (cel mai recurent topic):

SCENARIU TIPIC:
- T3 (30.09): distribuire interimară 310.000 lei (ridicare bani + impozit 31.000 reținut)
- Net plătit: 279.000 lei
- 31.12: bilanțul anual final arată profit NET = 273.987 lei
- DIFERENȚĂ: 310.000 distribuit > 273.987 profit → restituire OBLIGATORIE de la asociat

MONOGRAFIE INTERIMARĂ (T3 — distribuire):
1. Constatare profit interimar:
   121 = 1171 (preluare temporară profit interimar)
2. Decizie distribuire:
   463 = 456 (Decontări asociați conturi curente — 310.000 lei brut)
3. Reținere impozit 10%:
   456 = 4424 (impozit dividende — 31.000 lei)
4. Plată netă către asociat:
   456 = 5121 (279.000 lei)
5. Plată impozit ANAF:
   4424 = 5121 (31.000 lei)

REGULARIZARE T4 (la 31.12 cu profit final < interimar):

SCENARIU A) ASOCIAT RESTITUIE diferența:
1. Calcul diferență: 310.000 - 273.987 = 36.013 lei (suma de restituit)
2. Notă contabilă regularizare:
   456 = 463 (storno parțial distribuire, cu minus)
3. Restituire de la asociat:
   5121 = 456 (asociat restituie net 32.412 lei după impozit 10%)
4. Rectificare D100 (impozit dividende mai mic):
   4424 = 456 (storno parțial impozit pe diferență — 3.601 lei)

5. Rectificare D205 ANUALĂ:
- Coloana valori distribuite: reduce cu 36.013 lei
- Coloana impozit: reduce cu 3.601 lei

SCENARIU B) Profit suficient (distribuire interimară < profit final):
- 310.000 lei distribuit + 50.000 lei suplimentar din T4 → 360.000 lei total
- Distribuire suplimentară: 456 = 463 (50.000 lei) + reținere 10% impozit
- D205 raportează TOATĂ distribuirea (310.000 + 50.000)

SCENARIU C) NICI O REGULARIZARE necesară:
Dacă asociatul UNIC nu ridică banii efectiv (rămâne în 456 ca datorie):
- Datoria 456 rămâne în bilanț
- NU se mai face regularizare contabilă (banii nu au fost încasați)
- IMPOZITUL deja plătit la T3 rămâne ca a fost (NU se cere rambursare)

ATENȚIE LEGEA 239/2025 — restricții 2026:
Dacă firma se află ÎN AN CU PROFIT (înainte de bilanț final) și constată ANC < 50% capital → INTERDICȚIE retrospectivă pe distribuirile deja efectuate?
NU: distribuirile deja efectuate înainte de constatare RĂMÂN VALIDE. Doar distribuirile VIITOARE sunt interzise.

DACĂ ASOCIATUL UNIC nu DOREȘTE să primească dividende:
Opțiuni:
1. Repartizare la rezerve facultative (1068):
   121 = 1068 (transfer profit la rezerve)
2. Repartizare la rezultat reportat (1171):
   121 = 1171 (păstrare la dispoziție anilor următori)
3. Distribuire dividende oricum + asociatul nu le ridică (rămân în 456)

ATENȚIE: opțiunea 1 sau 2 sunt PREFERATE pentru economia de impozit pe dividende (10%).

DIVIDENDE PREFERENȚIALE (Legea 239/2025):
Asociatul A primește dividende, asociatul B preferă rezerve:
Hotărâre AGA cu mențiune distribuire diferențiată:
- Asociat A (50%): primește 50 lei dividende (cu reținere 10%)
- Asociat B (50%): partea sa de 50 lei trece la 1068 (rezerve facultative)
ATENȚIE: legalitatea depinde de actul constitutiv — unii experți consideră ilegală distribuirea diferențiată.

BILANȚ INTERIMAR (S1002) — STRUCTURA:
- Identic cu bilanț anual dar pentru perioada parțială (1.1 — 30.09)
- Cont profit/pierdere parțial
- F30 simplificat
- Note explicative reduse

DEPUNERE S1002 la ANAF:
- OBLIGATORIE pentru distribuirea interimară
- Termen depunere: în 30 zile de la AGA distribuire
- Bilanț atașat la hotărârea AGA pentru ONRC dacă se cere

DOCUMENTE OBLIGATORII:
1. Bilanț interimar S1002 (semnat electronic)
2. Cont profit/pierdere interimar
3. Hotărâre AGA distribuire (cu sumă, beneficiari, dată)
4. Document plată impozit ANAF
5. Document plată dividende către asociat (extras bancar)
6. D100 luna cu distribuire (impozit dividende inclus)
7. D205 anuală (toate distribuirile cumulative)`,
    sources: [
      { label: "Cod Fiscal art. 67^1, 91-97 (dividende + impozit)", ref: "https://legislatie.just.ro" },
      { label: "L 31/1990 art. 67 (dividende interimare)", ref: "https://legislatie.just.ro" },
      { label: "L 239/2025 (restricții ANC distribuire)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (bilanț interimar)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "acoperire-pierdere-reportata",
    tags: ["acoperire pierdere", "1171", "1068", "1175", "1041", "rezerve", "prime emisiune", "pierdere reportată"],
    title: "Acoperire pierdere reportată — surse 1068, 1175, 1041, capital",
    body: `L 31/1990 art. 69 + OMFP 1802/2014 (rezultatul reportat).

ORDINEA LEGALĂ de ACOPERIRE PIERDERE REPORTATĂ (1171 debitor):

PASUL 1 — REZULTAT CURENT POZITIV (cont 121 creditor):
121 = 1171 (preluare profit curent pe acoperire pierdere)
PRIORITATE: profitul anului curent acoperă întâi pierderile reportate (Cod Fiscal art. 25 alin. 14)

PASUL 2 — REZERVE FACULTATIVE (1068):
1068 = 1171 (acoperire din rezerve facultative)
Aplicare: dacă există rezerve constituite voluntar din profit anterior

PASUL 3 — REZERVE LEGALE (1061):
ATENȚIE: rezerva legală 1061 NU se folosește direct pentru acoperire pierderi (rezerva legală este obligatorie minim 5% profit anual până la 20% capital).
Dacă rezerva legală depășește 20% capital, surplusul poate trece pe 1068 și apoi la acoperire pierdere:
1061 = 1068 (transfer surplus la rezerve facultative)
1068 = 1171 (acoperire pierdere)

PASUL 4 — REZERVE din REEVALUARE (1175):
1175 = 1171 (acoperire pierdere din surplus realizat reevaluare)
Aplicabil DOAR dacă rezerva s-a REALIZAT (active reevaluate vândute sau amortizate complet)
Pentru rezerve 105 NEREALIZATE: NU se pot folosi direct (sunt neidstribuibile)

PASUL 5 — PRIME DE EMISIUNE (1041):
1041 = 1171 (acoperire din prime emisiune capital)
Aplicare: dacă firma a primit prime la emisiunea/majorarea capital social (rar la SRL)

PASUL 6 — REDUCERE CAPITAL SOCIAL (1012):
1012 = 1171 (reducere capital social pentru acoperire pierdere)
Procedură ONRC:
1. Hotărâre AGA reducere capital
2. Anunț Monitor Oficial (60 zile pentru obiecții creditori)
3. Mențiune ONRC
4. Reflectare contabilă în luna mențiunii ONRC

SCENARIU TIPIC: ACTIV NET NEGATIV cu PIERDERI MARI
Exemplu balanță:
- 1012 = 200 lei (creditor)
- 1061 = 40 lei (creditor)
- 1068 = 139.427 lei (creditor)
- 1171 = -461.924 lei (debitor — pierdere mare)
- 121 = -119.466 lei (debitor — pierdere curentă)

Pași acoperire:
1. 1068 = 1171 (139.427 lei) → 1171 rămâne -322.497 lei
2. 1061 = 1068 (40 lei) → 1068 = 0, 1061 = 0
3. 1068 = 1171 (40 lei) → 1171 rămâne -322.457 lei
4. Capital 1012 = 200 lei → reducere până la 0 prin acoperire:
   1012 = 1171 (200 lei reducere capital)
5. Rezultă 1171 = -322.257 lei (pierdere acoperită până la sursele disponibile)

PROBLEMA: capital sub minim legal 200 lei (SRL):
- L 31/1990 art. 11: SRL trebuie capital minim 200 lei
- Dacă reducere capital ar scădea sub 200 lei → INTERZIS
- Alternativă: dizolvare societate sau aport asociat capital

ALTERNATIVĂ: aport asociat pentru acoperire pierdere (după reducere):
1. Asociatul depune bani (creditare): 5121 = 4551
2. Renunțare creditare în rezerve: 4551 = 1068
3. Acoperire pierdere: 1068 = 1171
Avantaj: NU este venit impozabil (NU 7588), NU afectează cifra de afaceri

REZERVĂ LEGALĂ — CONSTITUIRE OBLIGATORIE (L 31/1990 art. 183):
- Minim 5% din profitul anual TREBUIE constituit ca rezervă legală
- Constituire până la 20% din capitalul social subscris
- Monografie: 129 = 1061 (la închiderea anului)
- Atenție: 129 este cont de profit care reflectă REPARTIZAREA profitului (NU cheltuială)

DECIZIA de CONSTITUIRE — TIMING:
- Calcul la 31.12 (în nota contabilă închidere)
- Decizia AGA pentru constituire: în 5 luni de la închidere
- Reflectare contabilă: la 31.12 anul anterior (NU la data AGA)

REZERVĂ LEGALĂ deja CONSTITUITĂ ÎN ANI ANTERIORI:
Dacă firma are sold creditor mare în 1061 (ex: 64.000 lei), poate folosi acest sold pentru acoperire pierderi:
ATENȚIE: doar surplusul peste 20% capital social.
Dacă capital 50.000 lei și rezervă legală 64.000 → surplus 54.000 lei poate trece la 1068 și apoi la 1171.

PIERDERE FISCALĂ vs PIERDERE CONTABILĂ:
- Pierderea CONTABILĂ (1171) este cea din evidența contabilă (după închidere conturi)
- Pierderea FISCALĂ este cea din D101 (după ajustări cheltuieli ne/deductibile)
- Pot fi DIFERITE (ex: cheltuieli nedeductibile mari → pierdere contabilă mică dar pierdere fiscală mare)
- Recuperare pierdere fiscală: 5 ani consecutivi (Cod Fiscal art. 31)

CAZ SPECIFIC: 1175 SURPLUS REALIZAT din REEVALUARE
Dacă reevaluarea s-a realizat (active reevaluate amortizate/vândute):
1175 = 1171 (acoperire pierdere din realizat reevaluare)

EXEMPLU:
- 1175 = 45.360.760 lei (sold creditor — surplus realizat)
- 1171 = -29.586.165 lei (sold debitor — pierdere reportată)
- Acoperire: 1175 = 1171 cu 29.586.165 lei → 1171 = 0, 1175 = 15.774.595 lei

ACEASTĂ ACOPERIRE FACE FIRMA să aibă din nou ACTIV NET POZITIV (dacă pierderea era cauza ANC negativ).

DOCUMENTE OBLIGATORII pentru ACOPERIRE PIERDERE:
1. Hotărâre AGA aprobare metoda acoperire
2. Calcul detaliat pe surse (notă explicativă)
3. Monografie contabilă cu notele aferente
4. Bilanț cu reflectare corectă (1171 redus, 1068/1175/1041 redus)
5. Pentru reducere capital: mențiune ONRC + Monitor Oficial`,
    sources: [
      { label: "L 31/1990 art. 69, 183 (rezultatul reportat + rezerva legală)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (rezultate reportate)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 31 (pierdere fiscală recuperabilă)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "f30-corelatii-creante-neincasate",
    tags: ["F30", "F10", "corelații bilanț", "creanțe neîncasate", "rd 57", "rd 185", "dividende"],
    title: "F30 din bilanț — corelații + creanțe neîncasate + dividende",
    body: `OMFP 2861/2009 + OPANAF (formulare F10/F20/F30/F40).

FORMULAR F30 = "Date informative" din bilanț, conține informații analitice nu acoperite de F10 (bilanț) și F20 (cont profit/pierdere).

STRUCTURA F30:
- Rd 1-30: salariați (număr, plăți restante către salariați)
- Rd 31-60: creanțe + datorii (analiza pe termene)
- Rd 61-90: dividende + impozite + alte plăți
- Rd 91-120: cifră afaceri + venituri detaliate
- Rd 121-200: alte informații

CORELAȚII OBLIGATORII F10 ↔ F30:

RD 57 F30 = Creanțe neîncasate la termen:
Suma celor din cont 4118 (clienți incerți), 4091 (avansuri pentru bunuri facturate), 4092 (avansuri pentru servicii prestate), 4282 (debite angajați), etc.

CORELAȚIE RD 57 F30 + RD 06a F10:
- RD 06a F10 (Total creanțe): 4111 + 4118 - 491 + 267 + 296 + 4092 + 411 + 413 + 418 + 425 + 4282 + 431 + 436 + 437 + 4382 + 441 + 4424 + 4428 + 444 + 445 + 446 + 447 + 4482 + 451 + 453 + 456 + 4582 + 461 + 4662 + 473 - 491 - 495 - 496

- RD 57 F30 (Creanțe neîncasate): doar SUBSETUL CU SOLD VECHI/INCERT (4091, 4092, 411 vechi, 413 vechi, 4118)

ATENȚIE: 4118 (clienți incerți) este DIFERIT de 411 (clienți obișnuiți):
- 4118 = clienți cu probleme de încasare (litigioși, depășire 90 zile, etc.)
- 411 = clienți normali în termenele standard

RD 185 F30 = Dividende distribuite în perioada de raportare din profitul reportat:
- Suma BRUTĂ a dividendelor distribuite în anul calendaristic (NU netă, NU impozit)
- INCLUDE dividendele distribuite chiar dacă neîncasate de asociați
- INCLUDE dividende interimare distribuite ÎN ANUL CURENT (chiar dacă regularizate ulterior)

EXEMPLU calcul RD 185:
- Distribuit T3 2025: 100.000 lei brut
- Distribuit T4 2025: 50.000 lei brut
- Total RD 185 = 150.000 lei (cu impozit brut, NU net)

RD 165a F30 = Dividende distribuite din profitul REPORTAT (NU din profitul curent):
- Sume distribuite din 1171/1175 (rezerve sau profit din ani anteriori)
- NU include dividendele interimare din anul curent (acelea în RD 185)

EXEMPLU SPECIFIC pentru RD 165a:
- 1171 = 200.000 lei (profit reportat din 2024)
- Distribuire 2025: 100.000 lei din 1171 → 4571 → asociați
- RD 165a = 100.000 lei

CORELAȚIE: RD 185 vs RD 165a:
- RD 185 = total dividende în AN curent (interimare + reportate)
- RD 165a = doar partea din profit REPORTAT distribuită în AN curent

ALTE CORELAȚII F30 important:

RD 21 = NUMĂRUL EFECTIV salariați la 31.12:
- Salariați ACTIVI: DA
- Salariați SUSPENDAȚI (CO, CIC, CDP, CFM, alte concedii): DA (sunt parte din efectivul firmei)
- Salariați la SFÂRȘITUL contractului în decembrie: NU (au plecat)
- Total: efectiv listat la 31.12 (cu suspendați incluși)

RD 22-23 = NUMĂR MEDIU salariați:
- Calcul: SUMA pontaje / 12 luni × COEFICIENT timp lucrat (norma parțială)
- Exemplu: salariat plin 12 luni = 1.0, salariat 1/2 normă 12 luni = 0.5
- Pentru calcul categorie firmă: media anuală (NU efectiv 31.12)

RD 09 din F10 = TOTAL ACTIVE:
- Active imobilizate (1-205, 26, 27) + Active circulante (3, 4 debitor, 5 debitor) + Cheltuieli avans (471, 473)
- NU se scad amortizările (cont 28x) — acelea sunt deja înregistrate în cont 213 cu valoare netă

CONT 508 (Alte investiții pe termen scurt + depozite colaterale):
- ÎN BILANȚ apare la RD "Casa și conturi la bănci" SAU la "Alte investiții pe termen scurt"
- DEPOZITELE COLATERALE: tratate ca investiții pe termen scurt (cont 508)
- DEPOZITE LICHIDE pe overnight: tratate ca echivalent monetar (RD "Casa și conturi la bănci")

CONT 4411 (impozit profit) — RAPORTARE F10:
Dacă sold DEBITOR 4411 (impozit plătit în PLUS):
- Raportare la CREANȚE (RD "Alte creanțe") NU la datorii negative
- Mențiune în nota explicativă

Dacă sold CREDITOR 4411 (impozit DE PLATĂ):
- Raportare la DATORII (RD "Datorii curente")

CAZ FRECVENT: an cu impozit micro plătit + bonificație 3%
- 4411 sold creditor 50.000 lei (impozit din decizie)
- Plată în an: 48.500 lei (cu bonificație)
- Sold final 4411: 1.500 lei DEBITOR (creanță față de buget)
- Raportare RD bilanț: creanță 1.500 lei

CAZUL: SUBVENȚII APIA pentru AGRICULTURĂ (ce intră în cifra de afaceri F30?):
- Subvenții pentru SUPRAFEȚE declarate (APIA): VENITURI DIN SUBVENȚII (cont 7411)
- NU se include în cifra de afaceri (CA) — categorii separate
- F30: rd specifică pentru "venituri din subvenții" (NU "cifră afaceri")

CAZUL: REVENIRE DIN SUSPENDARE — primul bilanț cu activitate parțială:
- Cifra de afaceri = doar perioada de activitate (luni)
- Pentru praguri categorii firmă: anualizare (× 12/luni active)
- Număr mediu salariați: per LUNI ACTIVE doar (NU pe an întreg)

ATENȚIE RD 06a (CREANȚE) și RD 09 (TOTAL ACTIVE):
Pentru CALCUL ANC trebuie să NU se scadă din 4111 încă o dată provizionul 491 (este DEJA scăzut în 4118).
ANC = Active TOTALE (rd 09) - Datorii TOTALE
NU SE SCAD din nou provizioane (sunt deja în calculul activelor nete).`,
    sources: [
      { label: "OMFP 2861/2009 (norme F10/F20/F30/F40)", ref: "https://legislatie.just.ro" },
      { label: "OMFP 1802/2014 (conturi 4111, 4118, 1171, 1175)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF (formulare bilanț anual)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d212-declaratie-unica",
    tags: ["D212", "Declarația Unică", "PFA", "PFI", "CMI", "profesii liberale", "CASS", "CAS", "OPANAF 2719/2025"],
    title: "D212 Declarația Unică — PFA/PFI/CMI + impozit + CAS + CASS",
    body: `Cod Fiscal art. 122 + OPANAF 2719/2025 + OPANAF 2736/2025 (modele actualizate 2026).

DEFINIȚIE D212:
Declarația Unică privind impozitul pe venit și contribuțiile sociale datorate de persoanele fizice = formularul UNIC pentru:
- PFA (Persoană Fizică Autorizată)
- PFI (Persoană Fizică Independentă)
- II (Întreprindere Individuală)
- IF (Întreprindere Familială)
- CMI/CMV (Cabinet Medical Individual/Veterinar)
- Profesii liberale (avocat, notar, executor judecătoresc, psiholog, mediator)
- Persoane fizice cu venituri din chirii, dividende, dobânzi
- Asociați PJ pentru venituri impozabile

OBLIGAȚIE depunere D212:
1. Persoane fizice cu venituri DIN ACTIVITĂȚI INDEPENDENTE (PFA, II, CMI, profesii)
2. Persoane fizice cu venituri DIN CHIRII (peste 80 RON/lună)
3. Persoane fizice cu venituri DIN INVESTIȚII (dividende > 6 salarii minime)
4. Persoane fizice cu VENITURI DIN STRĂINĂTATE (oriunde > 6 salarii minime)
5. Persoane fizice care depășesc plafoanele de venit pentru CAS/CASS

STRUCTURA D212 (2025+):
- Capitolul I: Date identificare contribuabil
- Capitolul II: VENITURI ESTIMATIVE pentru anul curent (impozit + CAS + CASS)
- Capitolul III: VENITURI REALIZATE anul anterior + recalcul

VENITURI ÎN SISTEM REAL vs NORME VENIT (alegere PFA/II/CMI):
SISTEM REAL:
- Venit impozabil = Venituri ÎNCASATE - Cheltuieli PLĂTITE deductibile (contabilitate partidă simplă)
- Impozit 10% pe venit net
- CAS 25% dacă venit > 6 salarii minime brute (24.300 lei în 2025)
- CASS 10% dacă venit > 6 salarii minime brute

NORME VENIT:
- Aplicabile DOAR pentru anumite activități CAEN (transport, comerț local, agricultură, alimentație publică) — listă MFP
- Venit forfetar pe lună stabilit de Direcția Județeană Finanțe
- Impozit 10% pe venit NORMAT (NU venit real)
- CAS/CASS calculat pe venit NORMAT
- ATENȚIE 2025+: norme venit RESTRÂNSE (multe activități scoase din lista de norme)

PLAFOANE 2025 pentru PFA/PFI/CMI:
- Salariu minim 2025: 4.050 RON brut
- 6 salarii minime: 24.300 RON anual (prag CAS+CASS)
- 12 salarii minime: 48.600 RON anual (prag CAS la 12 salarii)
- 24 salarii minime: 97.200 RON anual (prag CAS la 24 salarii)

CALCUL CAS pentru PFA (sistem real):
- Venit < 6 salarii minime → CAS opțional 0 lei (NU se plătește)
- Venit 6-12 salarii minime → CAS 25% × 6 salarii = 6.075 lei
- Venit 12-24 salarii minime → CAS 25% × 12 salarii = 12.150 lei
- Venit > 24 salarii minime → CAS 25% × 24 salarii = 24.300 lei

CALCUL CASS pentru PFA (sistem real):
- Venit < 6 salarii minime → CASS 10% × salariu minim × 12 luni = ~4.860 lei (obligatoriu chiar fără venit)
- Venit 6-12 salarii minime → CASS 10% × 6 salarii = 2.430 lei
- Venit 12-24 salarii minime → CASS 10% × 12 salarii = 4.860 lei
- Venit > 24 salarii minime → CASS 10% × 24 salarii = 9.720 lei

PFA fără ACTIVITATE — OBLIGAȚII:
- PFA care nu a desfășurat activitate în 2024 → totuși obligat la CASS 2024 (10% × salariu minim × 12 luni)
- EXCEPȚII: pensionari, salariați cu salariu peste 24 salarii minime, persoane cu handicap
- Soluție: SUSPENDARE PFA la ONRC → scutire CASS pe perioada suspendării

PROFESII LIBERALE (avocat, notar):
- CAS la Casa de Asigurări proprie a profesiei (NU la CAS de stat)
- Plata CAS direct la Casa Asigurări Avocaților / Notarilor / Mediatorilor
- CASS la CNAS de stat (declarat în D212)
- Atenție: CAS plătit la casa proprie e DEDUCTIBIL în D212 (reduce baza impozabilă)

DEDUCERI și CHELTUIELI în SISTEM REAL:
- Cheltuieli aferente activității (chirie, utilități, comunicații, contabil)
- 50% TVA + 50% cheltuieli auto mixt
- Cotizații profesionale obligatorii (CECCAR, Barou, OAR): deductibile 100% la venit net
- Cotizații facultative (până la 5% venit): deductibile la impozit (NU la CAS/CASS)
- Cheltuieli formare profesională continuă: deductibile
- Donații (max 5% venit): deductibile

TERMENE depunere D212:
- 25 MAI anul următor (pentru venit anual realizat anul precedent)
- 25 MAI anul curent (pentru venit estimat anul curent — opțional, doar pentru CAS/CASS)
- 25 MAI 2026 pentru venit realizat 2025 + estimat 2026

PRECOMPLETARE D212 (Ordinul ANAF 2719/2025):
- Sistem ANAF precompletează automat datele din SAF-T, e-Factura, D205, D207
- Contribuabilul verifică + corectează + transmite
- Reduce semnificativ erori comune (CNP greșite, sume duplicate)

DECONTAREA OBLIGAȚIILOR D212:
- Plata 2 TRANȘE: 25% la depunere (până 25 mai) + 75% până la 25 noiembrie
- Bonificație 3% la PLATA INTEGRALĂ la depunere (Cod Fiscal art. 130 modificat)
- Plata electronică prin SPV sau ghișeu virtual

DIRECȚIONARE 3.5% (din D212):
PFA poate redirecționa până la 3.5% din impozitul anual către ONG (similar D230 pentru salariați).
Procedură: completare anexă în D212 cu beneficiar (cont IBAN + CIF)

REGISTRU JURNAL ÎNCASĂRI ȘI PLĂȚI (RJIP):
PFA în sistem real ține:
- RJIP (cronologic încasări/plăți)
- Registru Inventar (cu mențiune activelor)
- Pentru PFA plătitor TVA: D300 lunar/trimestrial + D394

PFA PLĂTITOR DE TVA:
- Înregistrare la TVA: opțional sub 88.500 lei (pragul mic), obligatoriu peste
- D212 conține veniturile FĂRĂ TVA (TVA NU este venit propriu)
- Cheltuielile FĂRĂ TVA deductibilă (TVA dedus deja prin D300)

CAZ SPECIFIC: PFA AVOCATURĂ
- CAS la Casa Asigurări Avocaților (NU declarată în D212 secțiunea CAS — DOAR plata pe document)
- CASS în D212 ca pentru orice PFA
- Cotizație Barou (cotizație profesională obligatorie): deductibilă la venit net

CAZ COASIGURATI SĂNĂTATE (Legea 141/2025):
Pentru persoane fără venituri proprii (soți/copii) care depind de altă persoană:
- D212 anexă coasigurați cu contribuție 2.430 RON/an (2 tranșe)
- Întreținătorul plătește CASS pentru coasigurați

REGULA DEPUNERE PFA fără ACTIVITATE 2026:
PFA înființată în 2026 fără contracte: dacă în 2026 nu generează venituri, depune D212 cu venituri 0 sau SUSPENDĂ la ONRC.

REGISTRU PARTIDĂ SIMPLĂ — TVA la încasare:
PFA plătitor de TVA cu TVA la încasare:
- Venit impozabil în D212 = ÎNCASĂRI fără TVA (regula partidă simplă)
- TVA gestionat separat în D300 (cu jurnal TVA la încasare)

DOCUMENTAȚIE OBLIGATORIE:
1. CIF PFA + actul autorizare (CUI ONRC)
2. Contract spațiu sediu profesional
3. Contracte încheiate cu clienții
4. RJIP + Registru Inventar (în partida simplă)
5. Pentru profesii liberale: carnet profesional valabil
6. Factura/bonuri pentru toate veniturile + cheltuielile deductibile`,
    sources: [
      { label: "Cod Fiscal art. 122 (impozit venit PF independente)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 2719/2025 (procedură precompletare D212)", ref: "https://anaf.ro" },
      { label: "OPANAF 2736/2025 (model + gestionare D212)", ref: "https://anaf.ro" },
      { label: "L 141/2025 (coasigurați CASS)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d230-d177-directionare-3-5",
    tags: ["D230", "D177", "3.5%", "redirecționare", "ONG", "bursă privată", "unitate cult", "impozit anual"],
    title: "D230 + D177 — Direcționare 3.5% impozit către ONG/cult",
    body: `Cod Fiscal art. 56 alin. 1^1 + art. 79 + OPANAF 15/2021 (D230) + OPANAF (D177 — micro).

D230 — REDIRECȚIONARE 3.5% IMPOZIT VENIT (Persoane Fizice):
Aplicabil pentru:
- Salariați (impozit pe salarii reținut prin D112)
- PFA/PFI/CMI (impozit prin D212)
- Persoane fizice cu alte venituri impozabile

DESTINAȚII PERMISE pentru 3.5%:
1. ENTITĂȚI NON-PROFIT (asociații, fundații, ONG-uri) — cu CIF + cod special
2. UNITĂȚI DE CULT (biserici, mănăstiri, parohii)
3. BURSE PRIVATE pentru studenți/elevi (max 1.500 RON/lună/bursier)

CONDIȚII OBLIGATORII pentru BENEFICIAR:
1. Înscris în Registrul Entităților Non-Profit (ANAF) — verificare anuală
2. CIF + cod bancar IBAN valid
3. Activitate desfășurată conform statut
4. NU este entitate publică, NU este partid politic, NU este sindicat

DEPUNERE D230:
- Termen: până la 25 MAI anul următor (pentru impozit anul precedent)
- Modalități: SPV electronic SAU formular scriptic la AFP-ul de domiciliu fiscal
- Documente atașate: copie certificat înregistrare beneficiar (ANAF nu mai cere — verificare automată)

CALCUL 3.5%:
- Maxim 3.5% × IMPOZIT ANUAL DATORAT (NU venit anual)
- Exemplu: salariu net 4.000 RON/lună × 12 luni = 48.000 RON brut → impozit 16% = 7.680 RON → maxim direcționabil 268 RON

IMPACT FISCAL:
- Direcționarea 3.5% NU reduce impozitul datorat (este o redistribuire post-impozit)
- Banii rămân INTEGRAL la stat dacă NU se direcționează
- Beneficiarul primește direct sumele de la Trezoreria Statului (NU prin firmă)

D177 — REDIRECȚIONARE 3.5% IMPOZIT MICRO (Microîntreprinderi):
Microîntreprinderile pot redirecționa până la 3.5% din impozitul anual micro (1% sau 3%) către:
- ONG / fundație
- Unități de cult

CONDIȚII D177:
- Bilanțul anual depus la termen (pentru a fi micro)
- Impozit micro plătit integral
- Beneficiar înscris în Registrul Entităților Non-Profit

DEPUNERE D177:
- Termen: 25 MARTIE anul următor (similar D101 pentru profit, dar pentru micro)
- Format: declarație nominativă cu beneficiari + sume
- Maxim 3.5% × IMPOZIT MICRO anual

EXEMPLU CALCUL D177:
- Cifră afaceri 2025: 800.000 RON
- Impozit micro 3% (cu salariați): 24.000 RON
- Maxim direcționabil 3.5%: 840 RON
- Hotărâre micro: distribuire 840 RON către ONG Fundatia X (CIF ____)

DIFERENȚE D230 vs D177:
| Aspect | D230 (PF) | D177 (Micro) |
|---|---|---|
| Cine depune | Persoane fizice | Microîntreprinderi |
| Impozit bază | Impozit venit PF (10/16%) | Impozit micro (1/3%) |
| Termen | 25 mai | 25 martie |
| Procent max | 3.5% | 3.5% |
| Beneficiari | ONG, cult, burse | ONG, cult |

MONOGRAFIE CONTABILĂ — DIRECȚIONARE PROFIT MICRO:
Direcționarea NU se înregistrează ca cheltuială (este redistribuire impozit):
- ANAF transfer direct din Trezoreria Statului către beneficiar
- Firma plătește impozit micro INTEGRAL la stat
- D177 informativă: ANAF folosește pentru calcul redistribuire

D177 vs SPONSORIZARE (Legea 32/1994):
- Sponsorizare = cheltuială cu credit fiscal (max 0.75% CA sau 20% impozit)
- D177 = redirecționare 3.5% din impozit deja datorat
- AVANTAJ D177 (micro): NU reduce profit micro (cheltuiala sponsorizare ar reduce)
- DEZAVANTAJ D177: doar 3.5% din impozit (sponsorizarea poate fi mai mare)

CONTRACT EXPLICIT cu BENEFICIARUL:
NU este obligatoriu pentru D230/D177 (suficient datele identificare ONG)
Recomandare: contract de "redirecționare" pentru transparență, mai ales pentru sume mari

REGULA "FIFO" pentru REDIRECȚIONĂRI:
Dacă cota disponibilă 3.5% este mai mică decât suma cerută în D230/D177, ANAF redistribuie PROPORȚIONAL între beneficiari.

REGISTRU PUBLIC ANAF:
Lista entităților non-profit eligibile pentru D230/D177 este publicată pe site ANAF cu actualizare anuală.
Verificare obligatorie ÎNAINTE de depunere (entități care își pierd statut → 3.5% se pierde)

CONSECINȚE NEDEPUNERE:
- D230: 3.5% rămâne la stat (NU este sancțiune)
- D177: 3.5% rămâne la stat
- NU se sancționează nedepunerea

CONSECINȚE EROARE BENEFICIAR (CIF greșit):
- ANAF respinge declarația dacă beneficiar invalid
- Rectificativă posibilă în termenul de depunere
- După termen: imposibilitate corectare`,
    sources: [
      { label: "Cod Fiscal art. 56 alin. 1^1 (credit fiscal sponsorizare micro)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 79 (3.5% impozit anual)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 15/2021 (D230)", ref: "https://anaf.ro" },
      { label: "OPANAF (D177 — micro)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d700-vector-fiscal-modificare",
    tags: ["D700", "vector fiscal", "modificare obligații", "TVA", "salarii", "trimestru", "perioada fiscală"],
    title: "D700 Vector fiscal — modificare obligații declarative",
    body: `OPANAF 3725/2017 + modificări ulterioare (D700 — formular declarații electronice).

DEFINIȚIE VECTOR FISCAL:
Vector fiscal = lista obligațiilor declarative + plată ale unei firme. Fiecare firmă are vector fiscal individual înregistrat la ANAF.

COMPONENTE VECTOR FISCAL:
1. TVA (cod TVA, perioadă fiscală — lunară/trimestrială/semestrială/anuală)
2. Impozit profit / impozit micro
3. Impozit pe salarii (D112 lunar)
4. Contribuții sociale (CAS, CASS)
5. Accize (dacă aplicabil)
6. Impozit pe dividende
7. Alte impozite specifice (mineritul, jocuri noroc)

FORMULAR D700:
Înlocuiește formulare anterioare (010, 020, 040) pentru DECLARARE ELECTRONICĂ a modificărilor vector fiscal.

CÂND SE DEPUNE D700:
1. ÎNREGISTRARE OBLIGAȚII NOI:
   - Înregistrare TVA (depășire prag 88.500 sau opțiune)
   - Înregistrare TVA intracomunitar (cod special pentru achiziții IC)
   - Înregistrare ca plătitor accize
   - Trecere la impozit profit (din micro)

2. MODIFICARE OBLIGAȚII EXISTENTE:
   - Schimbare perioadă fiscală TVA (lunar → trimestrial sau invers)
   - Modificare adresă sediu/punct lucru
   - Modificare cod CAEN (după actualizare ONRC)
   - Schimbare administrator/reprezentant legal

3. RADIERE OBLIGAȚII:
   - Renunțare la TVA (sub prag)
   - Trecere de la profit la micro
   - Suspendare activitate la ONRC

4. ÎNCETARE ACTIVITATE:
   - Dizolvare societate
   - Radiere ONRC

D060 vs D700:
- D060 = ÎNREGISTRARE FISCALĂ INIȚIALĂ (la înființare firmă sau punct de lucru nou)
- D700 = MODIFICAREA / RADIEREA vector fiscal după înregistrare
- Pentru puncte de lucru cu salariați (Legea 245/2025): D060 pentru CIF distinct + D700 pentru update vector

SECȚIUNI ÎN D700:

SECȚIUNEA 1 — Date identificare societate (CIF, denumire, adresă, CAEN principal)

SECȚIUNEA 2 — Acțiuni cerute:
- Înregistrare obligație nouă (bifă + detalii)
- Modificare obligație existentă (bifă + detalii noi)
- Radiere obligație (bifă)

SECȚIUNEA 3 — Detalii TVA:
- Cod TVA (RO + 9 cifre)
- Perioadă fiscală: lunar / trimestrial / semestrial / anual
- Dată început / sfârșit perioadă
- TVA la încasare (DA/NU)

SECȚIUNEA 4 — Impozit profit/micro:
- Plătitor profit (DA/NU)
- Plătitor micro 1% sau 3% (DA/NU)
- Anul fiscal (calendaristic sau modificat)

SECȚIUNEA 5 — Salariați:
- Plătitor impozit salarii (DA/NU)
- CIF punct lucru cu salariați (dacă diferit)

SECȚIUNEA 6 — Sedii secundare:
- Listă puncte lucru (cu CIF distinct dacă există)
- Adresă fiecare punct

TERMEN DEPUNERE D700:
- 30 ZILE de la modificarea efectivă (Cod Procedură Fiscală art. 88)
- Pentru depășire prag TVA: 10 ZILE de la depășire
- Pentru schimbare perioadă fiscală: 25 ianuarie anul aplicării

SCHIMBARE PERIOADĂ FISCALĂ TVA:
- Trecere de la TRIMESTRIAL la LUNAR:
  - Obligatorie când: efectuare achiziție intracomunitară
  - Opțională oricând (decizie management)
  - D700 la 25 ianuarie anul aplicării
  - Atenție: trecerea la lunar e DEFINITIVĂ pentru anul respectiv

- Trecere de la LUNAR la TRIMESTRIAL:
  - Posibilă DOAR dacă în anul precedent cifra afaceri < 100.000 EUR
  - Și fără achiziții intracomunitare în anul precedent
  - D700 la 25 ianuarie anul aplicării

REGULA NEFICĂ pentru TVA: dacă cifra afaceri SCADE sub 100.000 EUR în 2025, dar firma a fost lunar în 2025 + a făcut achiziție IC → poate alege să rămână lunar sau să treacă trimestrial pentru 2026 (cu D700)

D094 = DECLARAȚIE ANUALĂ pentru cifra afaceri trimestrial fără IC:
- Depusă de firme TRIMESTRIAL care nu au făcut achiziții IC anul precedent
- Termen: 25 IANUARIE anul curent pentru anul precedent
- Confirmă rămânerea în regim trimestrial

CAZ ACTUALIZARE COD CAEN Rev. 3:
Firma actualizează codul CAEN la ONRC (din CAEN Rev. 2 în CAEN Rev. 3):
- D700 secțiunea CAEN cu noul cod
- Termen: 30 zile de la mențiunea ONRC
- Atenție: dacă nu se actualizează în D700, ANAF poate trimite notificare cu cod CAEN învechit

CAZ ACTUALIZARE ADRESĂ SEDIU SOCIAL:
- D700 secțiunea sediu + ADRESĂ NOUĂ
- Atașare document de la ONRC cu noua adresă
- Termen: 30 zile de la mențiune ONRC
- Atenție: schimbare adresă poate schimba AFP-ul de domiciliu fiscal → procedură separată

DOCUMENTE OBLIGATORII pentru D700:
1. Hotărâre AGA / decizie administrator pentru modificare
2. Document de la ONRC dacă modificare ONRC (act adițional + extras nou)
3. Pentru schimbare TVA: calcul plafon + documente justificative
4. Pentru punct lucru: contract spațiu + CIF nou (dacă obținut D060)

SANCȚIUNI nedepunere D700:
- Nedepunere la termen: 1.000 - 5.000 RON (Cod Procedură Fiscală)
- Activitate cu vector fiscal incorect: ajustare retroactivă + accesorii`,
    sources: [
      { label: "OPANAF 3725/2017 (D700 vector fiscal)", ref: "https://anaf.ro" },
      { label: "Cod Procedură Fiscală art. 88 (înregistrare fiscală)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 316 (înregistrare TVA)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d394-d390-livrari-intracomunitare",
    tags: ["D394", "D390", "VIES", "livrări intracomunitare", "achiziții IC", "informativă", "lunar"],
    title: "D394 + D390 — Declarații TVA livrări/achiziții (intern + intracomunitar)",
    body: `Cod Fiscal art. 324, 325 + OPANAF 3281/2020 (D394) + OPANAF 705/2020 (D390).

D394 — DECLARAȚIE INFORMATIVĂ INTERN:
Conține DETALII tranzacții cu PARTENERI ROMÂNI (cod TVA RO) pe luna/trimestrul respectiv.

OBLIGAȚIE DEPUNERE D394:
- Toate firmele înregistrate TVA (cod 316 sau 317)
- Inclusiv firme cu cod special (achiziții intracomunitare doar)
- Inclusiv firme cu pro-rata

PERIODICITATE D394:
- Identică cu D300 (lunar sau trimestrial)
- Termen: 25 luna/trimestrul următor

CONȚINUT D394:
- Secțiunea A: livrări către parteneri RO (cu CIF cumpărător)
- Secțiunea B: achiziții de la furnizori RO (cu CIF furnizor)
- Secțiunea C: livrări/achiziții cu TAXARE INVERSĂ (deșeuri, scrap, aur, electronice — cod special "T")
- Secțiunea D: livrări/achiziții cu COD SPECIAL (Brexit UK, Norvegia, etc.)

CORELAȚIE D394 ↔ D300:
- Total livrări D394 trebuie să corespundă cu rândul 1-3 D300
- Total achiziții D394 trebuie să corespundă cu rândul 23 D300 (TVA deductibil)
- Necorelări → notificare ANAF + obligatoriu explicate

VERIFICARE ANAF prin D394:
- Cross-check automatic: dacă firma X declară livrare 10.000 lei către firma Y, dar firma Y nu declară achiziția → notificare cu solicitare clarificare
- Penalități: 1.000 - 5.000 RON pentru necorelare repetată

D390 — DECLARAȚIE RECAPITULATIVĂ INTRACOMUNITARĂ (VIES):
Conține tranzacții cu PARTENERI UE (cod TVA altul decât RO) pe luna respectivă.

OBLIGAȚIE DEPUNERE D390:
- Firme cu cod TVA art. 316 (normal) sau art. 317 (special pentru achiziții IC)
- Numai în lunile cu tranzacții IC (NU depunere obligatorie în luni fără tranzacții)

PERIODICITATE D390:
- ÎNTOTDEAUNA LUNAR (NU trimestrial, chiar dacă firma are TVA trimestrial)
- Termen: 25 luna următoare cu tranzacții IC

CONȚINUT D390:
- Secțiunea I: livrări intracomunitare scutite (cumpărător PJ UE cu cod TVA valid)
- Secțiunea II: prestări servicii IC către PJ UE
- Secțiunea III: achiziții IC bunuri (autoadjucare TVA prin reverse charge)
- Secțiunea IV: prestări servicii IC primite de la PJ UE (reverse charge)
- Secțiunea V: livrări TRIANGULARE (operațiuni 3-flux)

VALIDITATE COD TVA PARTENER UE:
- OBLIGATORIE verificare la VIES (https://ec.europa.eu/taxation_customs/vies) ÎNAINTE de declarare
- Cod invalid → tratament ca livrare DOMESTICĂ (TVA RO)
- Cod valid → livrare IC scutită (cu evidență D390)

CAZ COD TVA RO ANULAT:
Dacă firma RO și-a pierdut codul TVA (suspendat 1 semestru fără activitate):
- Cumpărător din alt stat UE → tratează achiziția ca import (cu obligație plată TVA în statul propriu)
- Firma RO: rezilizarea facturilor primite cu TVA din alt stat (D311 — TVA cod anulat)
- D390: NU se depune pentru perioada fără cod TVA
- D311 obligatoriu (cumpărări UE cu TVA reverse charge)

OPERAȚIUNI TRIANGULARE — REGULA D390 secțiunea V:
A (RO) → B (CZ) → C (DE) cu transport direct A → C:
- A facturează B (livrare scutită IC din RO)
- B facturează C (cu TVA DE — sau cu scutire dacă C plătește TVA în DE)
- Pentru B (intermediar) — măsură simplificare: B NU se înregistrează în DE (declarație simplificată în D390)
- A: declară în D390 livrarea către B
- C: declară în D390 (din DE) achiziția de la B

NOTĂ DE CREDIT (CN) pentru ACHIZIȚII IC:
- CN primită de la furnizor UE pentru reducere preț ulterioară
- Declarare D300: ajustare rd 5 + rd 6 (TVA achiziție IC negativă)
- Declarare D390: secțiunea III cu valori negative (achiziție IC ajustată)
- D394: NU (operațiunea NU este cu partener RO)

SUME RAPORTATE ÎN D390:
- Valori FĂRĂ TVA (TVA gestionat separat în D300 cu reverse charge)
- Conversia în RON la curs BNR ziua tranzacției
- Sume cumulate pe partener (NU pe factură individuală)

CAZ INCORECT: TVA FACTURAT ÎN AFARA UE (TVA INVALID):
Furnizor UE emite factură cu TVA RO sau alt TVA invalid pentru achiziția IC:
- Solicitare furnizor: emitere CREDIT NOTE (corectare cu TVA 0)
- Sau emitere nouă factură corectă
- Refuz ÎNREGISTRARE CONTABILĂ cu TVA invalid (NU se deduce TVA fictiv)

ATENȚIE: PRESTĂRI SERVICII IC vs LIVRĂRI BUNURI IC:
- LIVRARE BUNURI IC: locul prestării e ȚARA EXPEDITORULUI (RO pentru export RO)
- PRESTARE SERVICII IC: locul prestării e ȚARA BENEFICIARULUI (regula B2B — sediul economic beneficiar)

Pentru servicii IC către PJ UE:
- Furnizor RO: factură SCUTITĂ DE TVA RO (TVA reverse la beneficiar)
- D390: secțiunea II
- D394: NU (operațiunea NU în RO)

SANCȚIUNI nedepunere D394/D390:
- 500 - 5.000 RON per declarație neidentificată
- Penalități de nedeclarare 0.08%/zi pentru sume care ar fi trebuit declarate
- Pentru repetitivitate: posibilă suspendare cod TVA`,
    sources: [
      { label: "Cod Fiscal art. 324-325 (declarații TVA)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 3281/2020 (D394 actualizat)", ref: "https://anaf.ro" },
      { label: "OPANAF 705/2020 (D390)", ref: "https://anaf.ro" },
      { label: "VIES — verificare cod TVA UE", ref: "https://ec.europa.eu/taxation_customs/vies" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "f7000-dac7-operatori-platforme",
    tags: ["F7000", "DAC7", "platforme online", "Airbnb", "OLX", "eMag", "vânzări online", "operator platformă"],
    title: "F7000 + DAC7 — Operatori platforme online (Airbnb, OLX, eMag)",
    body: `Cod Procedură Fiscală art. 291^5 + OANAF 1996/2023 + Directiva UE DAC7 (2021/514).

CONTEXT DAC7:
Directiva (UE) 2021/514 (DAC7) obligă platformele online să raporteze către autoritățile fiscale ale statelor membre datele tranzacțiilor utilizatorilor — vânzători de pe platformă.

DOMENIUL APLICĂRII DAC7:
1. Închiriere imobile (Airbnb, Booking.com, Vrbo, Homelidays, Spotahome)
2. Vânzare bunuri (eMag Marketplace, OLX, Amazon, eBay)
3. Servicii personale (Uber, Bolt — taxi alternativ; FreelanceR, Fiverr — servicii diverse)
4. Închiriere mijloace de transport (auto, bărci, vehicule recreative)

ENTITĂȚI OBLIGATE LA RAPORTARE (Operatori Platforme):
- Operatori UE: rapotează în statul de sediu (cu mecanism schimb informații)
- Operatori non-UE: trebuie să se înregistreze ÎNTR-UN STAT UE (sau să nominalizeze reprezentant)
- Operatori RO: raportare directă la ANAF prin F7000

FORMULAR F7000:
Conține:
- Date identificare OPERATOR platformă (CIF, denumire, sediu)
- Date PERIOADĂ raportare (anul calendaristic)
- DETALII pentru fiecare VÂNZĂTOR de pe platformă:
  - CNP / CIF
  - Venituri totale anuale (per trimestru detaliat)
  - Comisioane reținute de platformă
  - Adresă bancară (IBAN)
  - Pentru imobile: adresă imobil, perioade închiriere, număr nopți

TERMEN DEPUNERE F7000:
- 31 IANUARIE anul următor (pentru tranzacțiile anului anterior)
- Format electronic prin SPV

OPERATORI ROMÂNI cu OBLIGAȚIE F7000:
- Platforme online cu sediu în RO (eMag, OLX RO)
- Platforme cu reprezentant RO desemnat
- Atenție: chiar platforme mari (Airbnb, Booking) au desemnări specifice pentru RO

IMPACT PENTRU VÂNZĂTORI PF / FIRME:
1. PERSOANE FIZICE care vând pe OLX/eMag/Airbnb:
   - ANAF primește detalii anuale de la platformă (F7000)
   - Cross-check cu D212 (Declarația Unică)
   - Discrepanțe → notificare ANAF + impunere venit nedeclarat

2. PFA/SRL care vând pe platforme:
   - Datele din F7000 cross-checked cu D300 (TVA) + D101/D212
   - Discrepanțe → control fiscal

PRAGURI DAC7 (raportare obligatorie):
- > 30 tranzacții/an pe platformă
- > 2.000 EUR venituri totale anual

Sub aceste praguri: raportare NU obligatorie de operator (vânzător scapă de radar — DAR rămâne obligația proprie de declarare venituri)

CAZ AIRBNB — IMPORT NR. NOPȚI:
Pentru închiriere casa/cameră turistic pe Airbnb:
- D212 PFA cu cod CAEN 5510 sau 5520
- F7000 conține detalii: număr nopți + valoare/noaptea + adresa
- Cross-check ANAF: discrepanță între F7000 și D212 → impunere venit ascuns

CAZ ÎNCHIRIERE PERSOANĂ FIZICĂ (NU PFA):
- Persoană fizică cu venit din chirie peste 80 RON/lună → D212 obligatoriu
- Airbnb raportează în F7000 → cross-check cu D212
- Atenție: pentru închiriere ocazională (1-2 luni/an), tot trebuie declarat

CAZ ÎNCHIRIERE ÎN SCOP TURISTIC (FISA CAPACITATE CAZARE — OPANAF 398/2021):
- Pentru maxim 5 camere închiriate turistic
- Fișa capacitate cazare la AFP cu detalii camere + tarife
- Impozit anual fix per cameră (norma venit) sau sistem real în D212

REGISTRU PUBLIC OPERATORI:
ANAF menține registru public al operatorilor de platforme înregistrați pentru DAC7. Verificare: https://anaf.ro/registru-operatori-platforme

CONSECINȚE DEPUNERE LIPSĂ F7000:
Pentru operator:
- Amendă 50.000 - 100.000 RON
- Posibilă suspendare activitate în RO

Pentru vânzător (cross-check ANAF):
- Impunere retroactivă venit nedeclarat (10-50% impozit + CAS + CASS)
- Penalități: 0.02%/zi dobândă + 0.01%/zi penalitate

RECOMANDARE pentru VÂNZĂTORI:
1. Înregistrare cont fiscal corect (CNP în profil platformă)
2. Declarare venituri în D212 la timp (până 25 mai anul următor)
3. Păstrare documentație tranzacții (printscreen-uri profil + extrase plată)
4. Pentru închiriere imobile: contract de închiriere cu fiecare chiriaș (chiar și Airbnb generează contract simplificat)

PERSPECTIVĂ 2026+: extindere DAC7 la criptomonede (DAC8):
- DAC8 va impune platforme crypto să raporteze tranzacții cu monede virtuale
- Termen aplicare: 2026 (în transpunere RO)
- F7001 sau formular separat (în pregătire)`,
    sources: [
      { label: "Cod Procedură Fiscală art. 291^5 (DAC7 transpunere)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 1996/2023 (F7000)", ref: "https://anaf.ro" },
      { label: "Directiva (UE) 2021/514 (DAC7)", ref: "https://eur-lex.europa.eu" },
      { label: "OPANAF 398/2021 (Fișa capacitate cazare)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d406-saft-complet",
    tags: ["D406", "SAF-T", "Standard Audit File", "Active", "lunar", "trimestrial", "anual", "OPANAF"],
    title: "D406 SAF-T — declarație completă (lunar + trimestrial + anual Active)",
    body: `OPANAF 1783/2021 + actualizări (D406 — Standard Audit File for Tax).

DEFINIȚIE SAF-T:
Standard Audit File for Tax (XML structurat OECD) — declarație detaliată cu TOATE datele contabile + fiscale ale firmei pe perioadă specifică. Obligatoriu pentru toate firmele RO din 2025.

OBLIGAȚIE PERIODICITATE:
1. SAF-T LUNAR/TRIMESTRIAL: identic cu perioada TVA (D300)
   - Firme cu D300 lunar: SAF-T lunar
   - Firme cu D300 trimestrial: SAF-T trimestrial
   - Termen: 25 luna/trimestrul următor (același cu D300)

2. SAF-T ANUAL ACTIVE:
   - Conține EXCLUSIV evidența mijloacelor fixe + amortizare
   - Termen: 31 MAI anul următor (cu termenul bilanțului)
   - Obligatoriu pentru TOATE firmele cu evidență contabilă (inclusiv micro)

STRUCTURA D406 LUNAR/TRIMESTRIAL:
- Header: identificare firmă + perioadă + soft contabilitate
- MasterFiles: liste master (clienți, furnizori, conturi, taxe, produse)
- SalesInvoices: facturi emise (cu detalii rânduri + TVA)
- PurchaseInvoices: facturi primite
- Payments: plăți + încasări
- Movements: mișcări stoc (dacă există)
- GeneralLedgerEntries: înregistrări jurnal cu cont debit/credit

STRUCTURA D406 ANUAL ACTIVE:
- Header simplificat
- MasterFiles: doar conturi contabile + clase imobilizări
- Assets: lista TOTALĂ a mijloacelor fixe la 31.12
  - Valoare achiziție / Valoare reevaluată
  - Amortizare cumulată
  - Valoare netă contabilă
  - Categorie amortizare (HG 2139/2004 — clase utile)
  - Date achiziție + recepție

GENERARE D406:
- Soft contabilitate (SAGA, eDevSoft, Mentor, Wizcount) — generator automat XML
- Validare cu DUK Integrator (online ANAF) ÎNAINTE de depunere
- Erori frecvente: corelații lipsă, valori NULL, format date incorect

VALIDARE FORMATIVĂ:
1. Conturi din MasterFiles trebuie să corespundă cu cele din SalesInvoices/PurchaseInvoices
2. Sume facturi trebuie să corespundă cu sumele din GeneralLedgerEntries
3. TVA pe facturi trebuie să corespundă cu D300

ERORI COMUNE D406 LUNAR:
- Cont contabil INVALID (cont care nu există în MasterFiles)
- Cota TVA INVALIDĂ pentru data tranzacției (ex: 19% după 01.07.2025)
- CNP/CIF furnizor/client INVALID (verificare CUI)
- Tip factură INCORECT (380 normală, 388 storno, 384 corectivă)
- Lipsă referință la documentul inițial pentru storno

ERORI COMUNE D406 ANUAL ACTIVE:
- Lipsă cod IMOBILIZARE (clasa HG 2139/2004)
- Amortizare cumulată > valoare achiziție (eroare evident)
- Data achiziție lipsă/invalidă
- Mijloc fix transferat dar prezent în listă

REGULA ANULUI FISCAL MODIFICAT:
Pentru firme cu an fiscal diferit de calendaristic (ex: 01.04 - 31.03):
- D406 ANUAL ACTIVE: pentru anul fiscal (NU calendaristic)
- Termen: 31 mai după sfârșit an fiscal
- D406 LUNAR: tot pe lună calendaristică (NU fiscală)

CAZ FIRMĂ ÎN LICHIDARE:
- D406 ANUAL ACTIVE pentru perioada până la radiere
- Termen: similar cu bilanțul de lichidare (S1039)
- Eroare frecventă: tip declarație "A" (anual) cu perioadă PARȚIALĂ → respinsă de ANAF
- Soluție: contact departament tehnic ANAF pentru formă specifică

D406 PENTRU FIRME FĂRĂ ACTIVITATE:
- Firmă cu DECLARAȚIE INACTIVITATE: NU trebuie D406 lunar
- Firmă fără tranzacții dar fără declarație inactivitate: D406 GOL (cu header dar fără facturi/plăți)
- D406 ANUAL ACTIVE: obligatoriu dacă există mijloace fixe în evidență (chiar pentru firme fără activitate)

D406 RECTIFICATIV:
- Permis pentru corecturi
- Bifă în header "rectificativ" + referință D406 inițial
- Termen: 5 ani de la depunerea inițială
- Atenție: rectificativă D406 poate forța recalcul D300 (corelație automată ANAF)

PROCESARE ANAF — TIMP DE RĂSPUNS:
- Validare automată: 1-5 zile lucrătoare
- Probleme: "În prelucrare" >7 zile → contact departament tehnic ANAF
- Confirmare validare: prin SPV (notificare automată)

SANCȚIUNI nedepunere D406:
- Lunar: 1.000 - 5.000 RON per declarație neidentificată
- Anual Active: 5.000 - 10.000 RON
- Repetitivitate: control fiscal automat + posibilă recalculare retroactivă

CINE TREBUIE SĂ DEPUNĂ D406 ANUAL ACTIVE:
- Toate firmele cu mijloace fixe în evidență (cont 213-216)
- Inclusiv micro
- Inclusiv PFA cu evidență contabilă în partidă simplă (dacă au mijloace fixe pe firmă)
- ONG cu activitate economică + mijloace fixe

CINE ESTE SCUTIT DE D406 ANUAL ACTIVE:
- Firme cu DECLARAȚIE INACTIVITATE depusă
- Firme fără mijloace fixe (rar — chiar firmă mică are computer, mobilier)
- PFA în partidă simplă FĂRĂ mijloace fixe pe firmă (totul personal)

CAZ TRECERE DE LA MICRO LA PROFIT:
Trecerea în cursul anului (depășire prag micro):
- D406 LUNAR: continuă identic (nu se modifică formatul pe baza categoriei impozit)
- D406 ANUAL ACTIVE: nemodificat (rămâne pe an calendaristic)`,
    sources: [
      { label: "OPANAF 1783/2021 (D406 SAF-T)", ref: "https://anaf.ro" },
      { label: "OECD Standard Audit File for Tax", ref: "https://www.oecd.org/tax/forum-on-tax-administration/publications-and-products/SAF-T.htm" },
      { label: "HG 2139/2004 (clase amortizare)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d311-tva-cod-anulat",
    tags: ["D311", "TVA cod anulat", "art. 316 alin. 11", "Cod Fiscal", "achiziție UE", "regularizare TVA"],
    title: "D311 — TVA colectat pentru firme cu cod TVA anulat",
    body: `Cod Fiscal art. 324 alin. 10 + OPANAF 188/2018 (D311).

CONTEXT D311:
Firmele cărora le-a fost ANULAT codul de TVA (din diverse motive — inactivitate, neconformare) au în continuare obligația să PLĂTEASCĂ TVA pentru anumite tranzacții, chiar fără cod TVA valabil.

CAZURI ANULARE COD TVA (Cod Fiscal art. 316 alin. 11):
a) NU au depus deconturi TVA pentru 1 SEMESTRU (firme cu TVA trimestrial) sau 2 SEMESTRE consecutive (firme cu TVA lunar)
b) Au depus deconturi cu sume ZERO 6 luni consecutiv (firmă fără activitate)
c) NU au îndeplinit obligațiile declarative repetate
d) Au înregistrat retroactiv evaziune fiscală TVA
e) Modificare structură asociați/administratori cu probleme fiscale
g) Schimbare adresă sediu fără notificare ANAF
h) Riscul fiscal mare (criterii specifice ANAF)

DUPĂ ANULAREA COD TVA:
- Firma NU MAI POATE deduce TVA pe achiziții
- Firma NU MAI POATE colecta TVA pe vânzări (factură fără TVA)
- DAR: pentru ACHIZIȚII INTRACOMUNITARE și anumite tranzacții speciale — firma RĂMÂNE obligată la plata TVA

OBLIGAȚIE D311:
Firma cu cod TVA anulat trebuie să depună D311 dacă în luna respectivă a:
1. Făcut achiziții intracomunitare (cu TVA care altfel s-ar plăti prin reverse charge)
2. Achiziții servicii intracomunitare cu reverse charge
3. Primit livrări cu TAXARE INVERSĂ pe teritoriul RO (deșeuri, scrap, electronice)
4. Importat bunuri (dacă plătit TVA la vamă în plus de declarația vamală)

CONȚINUT D311:
- Identificare firmă (CIF — fără RO, fiind anulat)
- Perioada raportare (luna)
- Tranzacții cu TVA colectat care trebuie plătit:
  - Secțiunea 1: achiziții IC bunuri
  - Secțiunea 2: prestări servicii IC primite
  - Secțiunea 3: taxare inversă internă
  - Secțiunea 4: alte tranzacții TVA datorat

TERMEN DEPUNERE D311:
- Lunar: 25 a lunii următoare cu tranzacții
- Plata TVA datorat: până la 25 luna următoare

CALCUL TVA D311:
Pentru achiziții IC:
- Bunuri 200.000 EUR achiziție din Cehia (cu cod TVA RO anulat):
- TVA RO datorat: 200.000 EUR × curs BNR × 21% = ~210.000 RON TVA de plată
- Înregistrare contabilă:
  301 = 401 (200.000 EUR × curs)
  635 = 4423 (TVA 21% suplim — cheltuială NEDEDUCTIBILĂ la profit)
  4423 = 5121 (plată)

CAZUL: FACTURĂ FURNIZOR UE CU TVA ÎN PLUS:
Furnizor UE emite factură cu TVA propriul (ex: TVA cehă 21%):
- Firma RO NU poate deduce TVA cehesc
- Trebuie plătit TVA RO 21% prin D311 (pe valoarea FĂRĂ TVA cehesc)
- Solicitare furnizor: credit note pentru TVA cehesc + recalcul fără TVA

DIFERENȚA D311 vs D300:
D300:
- Pentru firme cu cod TVA VALID
- Permite atât TVA colectat cât și TVA dedus
- Sold final = de plată sau de rambursare

D311:
- Pentru firme cu cod TVA ANULAT
- DOAR TVA DE PLATĂ (NU se mai deduce)
- Sold final = ÎNTOTDEAUNA de plată (nu există rambursare)

REVENIREA LA COD TVA VALID:
Procedură reglare după anulare:
1. Depunere D700 cu cerere reactivare cod TVA
2. Plata datoriilor istorice TVA + accesorii
3. ANAF evaluează situația (30-60 zile)
4. Reactivare cod TVA (cu nou cod sau cu vechi cod)
5. După reactivare: trecere la D300 normal

CAZUL: FIRMĂ CU COD TVA ANULAT face VÂNZĂRI:
Vânzarea făcută de firmă cu cod anulat:
- Factură EMISĂ FĂRĂ TVA (mențiune "TVA neaplicabil - cod anulat conform art. 316")
- Cumpărător RO: NU poate deduce TVA (NU există TVA pe factură)
- Vânzător: NU mai are obligație D300 (DAR ANAF poate impune retroactiv dacă veniturile depășesc pragul)

D094 — Declarație anuală cifra afaceri trimestrial fără IC:
Pentru firmele TVA trimestrial care vor să rămână trimestrial (nu au achiziții IC):
- Depusă anual până la 25 IANUARIE
- Confirmă cifra de afaceri și absență achiziții IC
- Permite menținere perioadă trimestrială

VECTOR FISCAL după ANULARE COD TVA:
- Vector fiscal se actualizează automat de ANAF după anulare
- D700 NU este obligatoriu (operațiune automată ANAF)
- Verificare în SPV: Fișa pe Plătitor confirmă anularea

CAZ FIRMĂ CU TVA ANULAT + ACHIZIȚIE BUNURI BULGARIA:
- Achiziție 2.000 EUR (bunuri) din Bulgaria în ianuarie 2026
- Cod TVA RO anulat din decembrie 2025
- Obligație: D311 ianuarie 2026 cu TVA 21% pe 2.000 EUR
- TVA datorat: ~2.000 EUR × 4.95 RON × 21% = ~2.080 RON
- Plata: până la 25 februarie 2026
- D390: NU se depune (firma nu mai are cod TVA valabil pentru VIES)`,
    sources: [
      { label: "Cod Fiscal art. 316 alin. 11 (anulare cod TVA)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 324 alin. 10 (D311)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 188/2018 (D311)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "f083-e-factura-nerezidenti",
    tags: ["F083", "e-Factura", "nerezidenți", "operatori economici străini", "RO e-Factura", "SPV"],
    title: "F083 — e-Factura pentru operatori economici nerezidenți",
    body: `OUG 120/2021 + OPANAF 1831/2021 + OUG 130/2023 (e-Factura).

CONTEXT:
Sistemul național RO e-Factura este obligatoriu pentru tranzacții B2B și B2G în RO din 2024+. Operatorii economici NEREZIDENȚI care fac tranzacții în RO pot opta să utilizeze sistemul.

FORMULAR F083:
"Opțiune privind utilizarea, de către operatorii economici nerezidenți, a sistemului național privind factura electronică RO e-Factura"

CINE POATE DEPUNE F083:
- Operatori economici nerezidenți (firme străine) cu activitate ocazională în RO
- NU au cod fiscal RO permanent
- Vor să emită facturi electronice prin sistem RO e-Factura

CONȚINUT F083:
- Identificare operator nerezident (denumire, CIF străin, adresă)
- Țara de origine
- Tipul tranzacțiilor preconizate (vânzări/cumpărări în RO)
- Opțiune utilizare RO e-Factura (DA/NU)
- Beneficiari români preconizați (dacă cunoscut)

OBLIGAȚII după ÎNREGISTRARE F083:
1. Operatorul primește cod RO E-FACTURA (similar cod fiscal dar pentru e-Factura)
2. Acces în SPV cu acest cod (limitat la funcționalitate e-Factura)
3. Emitere facturi prin RO e-Factura cu cod beneficiar RO
4. Primire facturi de la furnizori RO prin sistem

DIFERENȚE F083 vs ÎNREGISTRARE TVA RO:
| Aspect | F083 (e-Factura) | Cod TVA RO |
|---|---|---|
| Scop | Doar utilizare e-Factura | TVA complet (D300, D394, D390) |
| Cod atribuit | RO E-FACTURA | RO + 9 cifre TVA |
| Obligații | Doar emiterea/primirea e-Factura | TVA complet + raportare |
| Termen procesare | 5-10 zile | 30-60 zile |

CAZ TIPIC F083:
Firmă germană fără cod TVA RO permanent, dar care vinde ocazional în RO (B2B):
- F083 + cod RO E-FACTURA
- Emitere facturi prin sistem (cu codul TVA german pe factură — pentru livrări IC scutite)
- Beneficiarii RO primesc facturi în SPV (cu reverse charge dacă achiziție IC)

NU TREBUIE F083 dacă:
- Firma străină are cod TVA RO permanent (folosește RO + cod TVA pentru e-Factura)
- Tranzacțiile sunt scutite total de e-Factura (ex: vânzare către PF — B2C exclus)

INTRARE ÎN OBLIGAȚIE e-Factura pentru NEREZIDENȚI:
2026+ a fost extinsă obligația și la operatorii nerezidenți cu CONTRACTE PERMANENTE de furnizare cu firme RO. Procedura:
- Operatorul nerezident depune F083
- Devine emisor obligat în RO e-Factura
- Sancțiuni similare cu cele pentru rezidenți (1.000-10.000 RON per factură neemisă)

CONTRACTE OCAZIONALE — F083 nu obligatoriu:
Pentru tranzacții ocazionale (1-2 facturi pe an), F083 nu este obligatoriu (factura poate fi emisă fără e-Factura, doar pe e-mail).

CAZUL: SUCURSALĂ FIRMĂ STRĂINĂ ÎN RO:
- Sucursala primește cod fiscal RO automat (la înregistrare ONRC)
- NU este nerezident — NU depune F083 (folosește cod RO TVA propriu)

CAZUL: REPREZENTANT FISCAL RO desemnat de FIRMĂ STRĂINĂ:
- Reprezentantul fiscal este o firmă RO cu cod TVA
- Folosește codul RO TVA al reprezentantului pentru toate operațiunile firmei străine
- F083 NU este necesar (există deja cod RO TVA)

SANCȚIUNI nedepunere F083 când obligatoriu:
- 5.000 - 50.000 RON per perioadă neidentificată
- Pentru repetitivitate: posibilă suspendare activitate operator în RO

CONEXIUNE F083 cu OSS/IOSS:
F083 NU înlocuiește OSS (One-Stop-Shop) sau IOSS pentru B2C în UE:
- OSS: pentru vânzări B2C la distanță în UE (declarație centralizată într-un stat)
- IOSS: pentru import bunuri sub 150 EUR
- F083: pentru e-Factura B2B în RO specific

Sunt sisteme SEPARATE — un operator nerezident poate avea toate cele 3 simultan.`,
    sources: [
      { label: "OUG 120/2021 (e-Factura)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 1831/2021 (F083)", ref: "https://anaf.ro" },
      { label: "OUG 130/2023 (extindere e-Factura)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "d207-d401-d402-d403-nerezidenti",
    tags: ["D207", "D401", "D402", "D403", "nerezidenți", "venituri RO", "rezidenți UE", "impozit reținut sursa"],
    title: "D207 + D401/402/403 — Declarații informative venituri nerezidenți UE",
    body: `Cod Fiscal art. 223-235 (impozit nerezidenți) + OPANAF specifice.

CONTEXT:
România are obligația de a raporta către statele UE veniturile obținute pe teritoriul RO de cetățenii/firmele acelor state (schimb automatic informații fiscale — DAC2).

D207 — Declarație informativă privind impozitul reținut la sursă (NEREZIDENȚI):
Conține detalii pentru fiecare plată făcută unei persoane nerezidente (PF sau PJ) pentru:
- Salarii / remunerații administratori (D402 separat)
- Dividende
- Dobânzi
- Redevențe
- Royalties / drepturi proprietate intelectuală
- Comisioane
- Cheltuieli administrative

PERIODICITATE D207:
- ANUALĂ
- Termen: 28/29 FEBRUARIE anul următor

CONȚINUT D207:
- CIF/CNP nerezident + nume + adresă
- Statul de rezidență
- Tipul venitului (cod specific)
- Suma BRUTĂ plătită
- Cota impozit reținut la sursă (în funcție de CDI)
- Impozit reținut efectiv

CDI (Convenții pentru evitarea dublei impuneri):
România are CDI cu majoritatea statelor lumii. Pentru fiecare beneficiar trebuie verificat:
1. Are CDI cu RO?
2. Cota impozit redusă conform CDI?
3. Certificat rezidență fiscală prezentat de beneficiar (obligatoriu pentru cota redusă)

EXEMPLE COTE:
- Dividende: standard 10% / cu CDI 5% (pentru companii) / 15% (pentru persoane fizice — variabil)
- Dobânzi: standard 10% / cu CDI 0% sau 5% / 10%
- Redevențe: standard 10% / cu CDI 5% / 10%
- Servicii management/consultanță: standard 10% / cu CDI 0% pentru anumite statele

CAZ TIPIC SERVICII IT NEREZIDENT:
Firma RO plătește 10.000 EUR servicii IT către firmă din Moldova:
- CDI Romania-Moldova: cotă impozit servicii 10%
- Reținere la sursă: 10.000 × 10% = 1.000 EUR
- Plată netă: 9.000 EUR
- D207 anual cu detalii

CAZ EXCEPȚIE — UE 2003/49/CE (Dividende intra-grup):
Pentru dividende plătite de la filială RO către părinte UE cu participație > 10% + minim 1 an:
- COTĂ 0% impozit nerezidenți
- Condiții: certificat rezidență + declarație participație
- D207 anual cu mențiune 0% impozit

D401 — Declarație informativă PROPRIETĂȚI IMOBILIARE rezidenți UE:
- Persoane fizice rezidenți UE care DEȚIN imobile în RO
- Date: adresa imobil + valoare estimată + cotă proprietate
- Raportare la statul de rezidență al proprietarului (schimb automat informații)

OBLIGAȚIE DECLARARE D401:
- Notarii și consilierii imobiliari pentru transferuri proprietate
- Primăriile pentru proprietățile înregistrate
- Termen: anual până la 28 februarie

D402 — Declarație informativă VENITURI SALARIALE rezidenți UE:
- Angajatori RO care plătesc salarii către rezidenți UE care lucrează în RO
- Detalii: nume, CNP, sumă brută anuală, impozit reținut, perioada de muncă

OBLIGAȚIE DEPUNERE D402:
- Toți angajatorii care au în 2025 cel puțin un salariat rezident fiscal UE
- Termen: 28 februarie 2026

CAZ TIPIC D402:
Cetățean Germania angajat la firmă RO ca consultant:
- Salariu 5.000 EUR/lună × 12 luni = 60.000 EUR anual
- Impozit RO 16% reținut: 9.600 EUR
- D112 lunar (raportare RO) + D402 anuală (schimb cu Germania)
- Cetățeanul german declară venitul și în Germania (cu credit pentru impozitul RO conform CDI)

D403 — Declarație informativă ASIGURĂRI DE VIAȚĂ rezidenți UE:
- Companii asigurări care vând produse de viață pentru rezidenți UE
- Detalii: poliță, primă anuală, beneficiar
- Termen: anual (similar D401/402)

CAZ A1 — DETAȘARE UE:
Pentru salariații RO detașați în UE:
- Formular A1 obligatoriu (UE 883/2004)
- Permite menținere CAS în RO (nu dublă contribuție)
- Emis de Casa Națională Pensii la cerere
- Termen valabilitate: 24 luni (cu posibilitate prelungire)

CAZ ADMINISTRATOR FIRMĂ RO REZIDENT NEREZIDENT FISCAL:
Cetățean RO cu domiciliu fiscal în SUA, asociat majoritar firmă RO:
- Dividende RO → reținere 10% (impozit nerezident)
- D207 anual cu detalii
- Nu se aplică CDI RO-SUA pentru dividende (cota standard 10%)
- Pentru salarii: dacă lucrează efectiv în RO → impozit normal RO + CAS + CASS
- Pentru salarii dacă în SUA: scutire RO + impozit SUA

DOCUMENTE OBLIGATORII pentru CDI:
Pentru a aplica cota redusă conform CDI, beneficiarul trebuie să prezinte:
1. CERTIFICAT REZIDENȚĂ FISCALĂ (emis de autoritatea fiscală a statului de rezidență)
2. Termen valabilitate certificat: 1 an
3. Declarație pe propria răspundere beneficiar (proprietar efectiv venituri)
4. Anexă la D207 / contabilitate firmă

FĂRĂ CERTIFICAT REZIDENȚĂ → cotă standard RO (10%):
Dacă beneficiar nu prezintă certificat → reținere la sursă cu cota standard (de obicei 10%).
Beneficiar poate solicita rambursare ulterioară prin procedura specială (cerere ANAF + dovezi).

RECOMANDARE:
Întotdeauna verificare CDI pentru beneficiarul nerezident ÎNAINTE de plată — evită rambursări complicate ulterioare.`,
    sources: [
      { label: "Cod Fiscal art. 223-235 (impozit nerezidenți)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 48/2019 (D207)", ref: "https://anaf.ro" },
      { label: "OPANAF 2727/2015 (D401, D402, D403)", ref: "https://anaf.ro" },
      { label: "Tratate CDI România", ref: "https://anaf.ro/conventii-fiscale" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "micro-2026-conditii-aplicare-intreprinderi-legate",
    tags: ["micro 2026", "microîntreprindere", "art. 47", "art. 48", "art. 51", "OUG 8/2026", "întreprinderi legate", "contract mandat", "100000 EUR"],
    title: "Microîntreprindere 2026 — condiții aplicare + plafon 100K EUR + întreprinderi legate",
    body: `Cod Fiscal Titlul III art. 47-57 + OUG 8/2026 (modificări 2026) + Legea 296/2023 (întreprinderi legate).

CONDIȚII APLICARE MICRO 2026 (Cod Fiscal art. 47):
La data de 31 decembrie a anului fiscal precedent (pentru micro 2026 → la 31.12.2025):

a) Venituri realizate ≤ PRAGUL ACTUALIZAT (OUG 8/2026):
   - 2024-2025: plafon 500.000 EUR
   - 2026+: plafon REDUS la **100.000 EUR** (echivalent ~496.500 RON la curs BNR 31.12)

b) Venituri ≤ 20% din venituri din consultanță/management (excepție: IT, contabilitate, expertize tehnice, juridice — pentru anumite categorii)

c) Activitate principală NU este interzisă (asigurări, bancare, jocuri noroc, energie electrică, produse petroliere — vezi art. 47 alin. 3)

d) Capitalul social NU deținut de stat/UAT

e) NU în lichidare/dizolvare/insolvență

f) Are CEL PUȚIN UN SALARIAT (art. 47 alin. 1 lit. g) — vezi mai jos pentru opțiuni

g) Asociații dețin (direct/indirect) peste 25% într-O SINGURĂ persoană juridică care aplică micro

CONDIȚIA SALARIAT (Cod Fiscal art. 51 alin. 4):
"Salariat" = persoană angajată cu CIM cu normă întreagă (Legea 53/2003 — Codul Muncii).

CONDIȚIA SE CONSIDERĂ ÎNDEPLINITĂ și în următoarele variante:
a) Mai mulți salariați cu CIM cu TIMP PARȚIAL → fracțiunile cumulate echivalează o normă întreagă (ex: 2 × 4h/zi = 1 × 8h/zi)
b) CONTRACT MANDAT sau ADMINISTRARE cu remunerație ≥ salariul minim brut pe țară garantat în plată (2025: 4.050 RON; 2026: presumabil actualizat)

ATENȚIE: contractul de mandat trebuie încheiat și remunerat efectiv lunar. Simpla existență a documentului fără plată = neîndeplinire condiție.

FIRMĂ NOU-ÎNFIINȚATĂ (Cod Fiscal art. 48 alin. 3):
- Poate opta pentru micro din PRIMUL AN dacă condițiile art. 47(1) lit. d (capital) și h (>25% într-o singură PJ) sunt îndeplinite la data înregistrării ONRC
- Condiția salariat (lit. g) → 90 ZILE de la înregistrare ONRC pentru îndeplinire
- Dacă în 90 zile NU se îndeplinește → trecere la impozit profit începând cu trimestrul URMĂTOR celui în care expiră perioada

ÎNTREPRINDERI LEGATE (Legea 296/2023):
Pentru calculul plafonului 100.000 EUR în 2026, se cumulează cifra de afaceri a TOATE întreprinderile LEGATE.

DEFINIȚIE legate (UE — Recomandare 2003/361/CE transpusă RO):
- Aceeași persoană fizică / aceeași familie deține >25% din 2+ firme
- Aceleași firme au administrator/asociat comun cu putere de decizie
- Persoane fizice cu legături de rudenie până în gradul 4 (soți, copii, părinți, frați)

EXEMPLU CONCRET:
Asociat unic A deține:
- Firma X — CA 2025: 80.000 EUR
- Firma Y (nou-înființată 2026) — CA estimat 50.000 EUR
- Total cumulat: 130.000 EUR > 100.000 EUR prag micro
→ Firma Y NU poate fi micro în 2026 (cumulează depășirea cu firma X care e ÎNTREPRINDERE LEGATĂ)

EXCEPȚIE persoană fizică cu firme deja existente cu impozit profit:
- Firma X existentă cu impozit profit (CA 700K lei depășit pragul în 2025)
- Asociatul A vrea să înființeze firma Y micro 2026
- Întrucât A este legat cu X (>25%), iar X depășește pragul → Y NU poate fi micro
- Soluție: A trebuie să cedeze poziția majoritară (< 25%) într-una dintre firme

PRAG REDUS DE LA 500K LA 100K EUR (OUG 8/2026):
Schimbarea pragului de la 01.01.2026:
- Firme cu CA în 2025 între 100K-500K EUR → trec OBLIGATORIU la impozit profit din 01.01.2026
- Bilanțul 2025 → depus până la 31 MARTIE 2026 (regula nouă pentru a beneficia de micro 2026 — vezi entrie "termen depunere bilanț")
- Firme care depun bilant DUPĂ 31 martie 2026 → automat impozit profit (NU mai pot reveni la micro)

REVENIREA LA MICRO:
Cazul: firmă care a fost micro, a depășit pragul în trim. III 2025 → trecere la impozit profit pentru trim. III + IV
- Pentru 2026: poate reveni la micro DACĂ:
  - CA 2025 (total an, micro + profit) ≤ 100K EUR
  - Are salariat la 31.12.2025
  - Îndeplinește toate celelalte condiții
- D700 cu solicitare reactivare micro din 01.01.2026

COTE IMPOZIT MICRO 2026:
- 1% pentru firme CU SALARIAT
- 3% pentru firme FĂRĂ SALARIAT (excepție: art. 48 alin. 3 — primii 90 zile pentru nou-înființate)

ATENȚIE 2026: cu pragul redus la 100K EUR, multe firme care erau micro vor trece la profit. Verificare obligatorie a CA 2025 pentru decizia statutului 2026.

CALCUL CIFRA DE AFACERI pentru pragul micro:
- Veniturile din producție + comerț + servicii (cont 70x)
- - Reducerile comerciale acordate (cont 709)
- + Venituri din subvenții pentru exploatare aferente cifrei (cont 7411 — DOAR dacă sunt operate)
- Conversie în EUR: la cursul BNR din 31.12 anul respectiv

DOCUMENTAȚIE OBLIGATORIE:
1. Bilanț 2025 + cont profit/pierdere
2. Contract muncă/mandat cu remunerație
3. Listă asociați + cote (pentru verificare întreprinderi legate)
4. Calcul CA în EUR la 31.12.2025
5. Hotărâre AGA pentru opțiune micro (dacă era pe profit)

SANCȚIUNI APLICARE INCORECTĂ:
- Firma a aplicat micro fără să îndeplinească condițiile → recalcul retroactiv ca impozit profit + accesorii
- Diferență impozit + dobânzi 0.02%/zi + penalități 0.01%/zi (de la termenele plății micro inițiale)`,
    sources: [
      { label: "Cod Fiscal art. 47-57 (Titlul III — Microîntreprinderi)", ref: "https://legislatie.just.ro" },
      { label: "OUG 8/2026 (modificări regim micro 2026)", ref: "https://legislatie.just.ro" },
      { label: "Legea 296/2023 (întreprinderi legate)", ref: "https://legislatie.just.ro" },
      { label: "Recomandarea (UE) 2003/361/CE (definiție IMM + întreprinderi legate)", ref: "https://eur-lex.europa.eu" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "tva-incasare-plafon-oug-8-2026",
    tags: ["TVA la încasare", "art. 282", "plafon 5M", "plafon 5.5M", "OUG 8/2026", "intrare ieșire", "exigibilitate"],
    title: "TVA la încasare — plafon nou OUG 8/2026 (5M/5.5M) + intrare/ieșire",
    body: `Cod Fiscal art. 282 alin. (3)-(8) + OUG 8/2026 (modificare plafon).

REGIM TVA LA ÎNCASARE — DEFINIȚIE:
Sistem opțional de exigibilitate amânată: TVA colectat devine exigibil la DATA ÎNCASĂRII de la client (NU la data facturii). Similar pentru TVA dedus din achiziții — exigibilă la data plății furnizorului.

PLAFON NOU (OUG 8/2026):
Plafonul cifrei de afaceri pentru aplicare TVA la încasare:
- Până la 28.02.2026: 4.500.000 LEI (vechi)
- **01.03.2026 - 31.12.2026: 5.000.000 LEI** (NOU)
- **2027+: 5.500.000 LEI** (NOU)

CONDIȚII INTRARE în sistem TVA la încasare (art. 282 alin. 3¹ — introdus OUG 8/2026):

a) În ANUL CALENDARISTIC PRECEDENT NU a depășit plafonul valabil pentru ACEL AN
   - Pentru intrare 2026: CA 2025 < 4.500.000 lei (pragul 2025)
   - Pentru intrare 2027: CA 2026 < 5.000.000 lei (pragul 2026)

b) La DATA EXERCITĂRII OPȚIUNII să NU fi depășit plafonul pentru anul în curs

c) Cerere D097 la ANAF (Notificare aplicare TVA la încasare) cu min. 25 zile înainte de începerea perioadei fiscale dorite

INTRARE PRACTICĂ:
- Firme noi (înregistrate TVA în cursul anului): pot opta din momentul înregistrării (cu D097 atașat la D700)
- Firme existente: opțiune cu D097 până la 25 a lunii anterioare perioadei fiscale dorite

EXEMPLU SCENARIU REAL 2026 (din Q&A Portal):
Firmă cu CA 2025 = 5.200.000 lei (depășit plafonul 4.5M 2025).
ÎNTREBARE: Poate aplica TVA la încasare în 2026 (plafonul 5M)?
RĂSPUNS NU. Conform art. 282 alin. (4) lit. c, dacă a depășit plafonul în anul precedent (valabil pentru anul respectiv = 4.5M pentru 2025), firma NU este eligibilă pentru anul curent. Plafonul nou (5M) NU se aplică retroactiv.
Reactivare posibilă: 2027 (dacă CA 2026 < 5M).

IEȘIRE OBLIGATORIE din sistem (art. 282 alin. 4):
a) Depășire plafon în cursul anului → ieșire începând cu prima zi a perioadei fiscale URMĂTOARE celei în care s-a depășit
b) Anularea codului TVA → ieșire automată la data anulării
c) Schimbare regim (ex: trecere la TVA art. 317 — special) → ieșire

IEȘIRE OPȚIONALĂ:
Firma poate renunța oricând la sistem cu D097 (cerere ieșire). Termen: 25 zile înainte de începerea perioadei fiscale dorite.
ATENȚIE: după renunțare voluntară, REINTRARE permisă DOAR după minim 1 AN CALENDARISTIC complet.

EXIGIBILITATE PRACTICĂ:

A) PENTRU FURNIZOR (în sistem TVA la încasare):
- Factură emisă 100.000 + TVA 21% în ianuarie 2026
- TVA colectat (4427) — ÎNREGISTRAT dar NEEXIGIBIL
- Cont contabil: 4111 = 707 (venit) + 4111 = 4428 (TVA neexigibil)
- Plata clientului în martie 2026: 4428 → 4427 (TVA devine exigibil → decont D300 martie)

B) PENTRU CUMPĂRĂTOR (cumpără DE LA furnizor cu TVA la încasare):
- Factură primită ianuarie 2026: cheltuială + TVA dedus
- Dar TVA deducibil DOAR DUPĂ PLATA furnizorului (art. 297 alin. 2)
- Cont contabil: 601 = 401 + 4428 = 401 (TVA neexigibil)
- Plata furnizorului în aprilie 2026: 4428 → 4426 (TVA devine deductibil → decont D300 aprilie)

REGULA 90 ZILE (art. 282 alin. 3):
TVA colectat devine exigibil OBLIGATORIU la 90 ZILE de la data facturii, chiar dacă nu s-a încasat încă.
Aceasta este o LIMITĂ MAXIMĂ de amânare a exigibilității.

IEȘIRE DIN TVA cu STOC DE MARFĂ — CAZ SPECIAL:
La data ieșirii din evidența TVA (cerere scoatere voluntară):
- Stoc marfă (cont 371) — ajustare prin transferul TVA neexigibil:
  371 = 4428 (anulare TVA neexigibil aferent stocului)
- TVA neexigibil din facturi furnizori: anulare cu același tip (firma NU mai are drept de deducere)

MONOGRAFIE COMPLETĂ ieșire TVA cu sold neexigibil:
- 371 = 4428 (cu sumă pozitivă pentru TVA intrări aferentă stocului)
- 371 = 4428 (cu sumă negativă pentru TVA neexigibil deja existent)
- 371 = 378 (ajustare adaos comercial cu diferența) — pentru păstrare preț de vânzare neschimbat

FACTURI EMISE de FURNIZOR ÎN TVA la ÎNCASARE — pentru CUMPĂRĂTOR:
Mențiune obligatorie pe factură: "TVA la încasare" (sau "TVA aplicat conform art. 282 alin. 3-8 Cod Fiscal")
Cumpărător: drept de deducere AMÂNAT până la plata efectivă.

ATENȚIE FURNIZORI MIXTI:
Furnizor cu TVA la încasare emite factură care e POATE NU MARCATĂ ca "TVA la încasare":
- Pentru clarificare: verificare DOCUMENT JUSTIFICATIV (factură + mențiunea pe factură)
- Dacă mențiunea lipsește: clientul tratează ca TVA normal (deductibil imediat)
- Riscul rămâne la furnizor (poate fi sancționat de ANAF pentru lipsa mențiunii)

SANCȚIUNI nedeclarare TVA la încasare:
- Aplicare regim fără îndeplinire condiții: ajustare retroactivă + accesorii
- Lipsa mențiunii pe factură: amendă 500-1.000 RON per factură
- Cumpărător care deduce TVA înainte de plată (când furnizorul are TVA la încasare): ajustare deducere + accesorii`,
    sources: [
      { label: "Cod Fiscal art. 282 alin. (3)-(8) (TVA la încasare)", ref: "https://legislatie.just.ro" },
      { label: "OUG 8/2026 (modificare plafon 5M/5.5M)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 297 alin. 2 (drept deducere amânat)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 409/2021 (D097 — notificare TVA la încasare)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "tva-imobiliar-cladire-veche-noua-scutire",
    tags: ["TVA imobiliar", "art. 292", "scutire TVA", "clădire veche", "clădire nouă", "teren construibil", "teren neconstruibil", "ajustare"],
    title: "TVA imobiliar — clădire veche/nouă, teren construibil/neconstruibil + scutire art. 292",
    body: `Cod Fiscal art. 292 alin. (2) lit. f) + art. 268-270 + art. 286 + Norme metodologice pct. 55-56.

REGULA FUNDAMENTALĂ:
Livrarea de bunuri imobile este IMPOZABILĂ cu TVA, EXCEPȚIE: cazurile prevăzute la art. 292 alin. (2) lit. f), care sunt SCUTITE DE TVA fără drept de deducere.

CAZURI SCUTITE (art. 292 alin. 2 lit. f):
1. Livrarea de CONSTRUCȚII / PĂRȚI DE CONSTRUCȚII și a TERENULUI pe care sunt construite (CLĂDIRE VECHE)
2. Livrarea oricărui alt TEREN (TEREN NECONSTRUIBIL — agricol, fără PUZ pentru construcție)

EXCEPȚII DE LA SCUTIRE (rămân impozabile cu TVA — chiar dacă încadrate inițial):
1. Livrarea de TERENURI CONSTRUIBILE (cu PUZ/PUG pentru construcție)
2. Livrarea de CONSTRUCȚII NOI (sau părți de construcții noi) — vândute ÎNAINTE de prima ocupare

DEFINIȚII CHEIE (norme metodologice pct. 55):

A) CONSTRUCȚIE NOUĂ:
- Construcție livrată ÎNAINTE de "prima ocupare" sau folosință (chiar și de către constructor)
- "Prima ocupare" = utilizarea efectivă (ex: locuit, închiriat, comercial)
- DACĂ construcția nu a fost ocupată/utilizată de nimeni → încă "nouă"

B) CONSTRUCȚIE VECHE:
- Construcție livrată DUPĂ prima ocupare/folosință
- "Veche" indiferent de vârsta efectivă (poate fi construită acum 2 ani, dar dacă a fost locuită/închiriată → veche)

C) TEREN CONSTRUIBIL:
- Teren cu PUZ/PUG aprobat care permite construire
- Atestat prin Certificat de Urbanism sau extras CF cu mențiune
- TVA aplicabilă obligatoriu (NU se aplică scutire)

D) TEREN NECONSTRUIBIL:
- Teren agricol, fâneață, pădure
- Fără posibilitate de construire conform PUG
- SCUTIT de TVA conform art. 292

OPȚIUNE TAXARE (art. 292 alin. 3):
Furnizorul POATE OPTA pentru aplicarea TVA chiar pe operațiuni scutite (teren agricol, clădire veche) prin NOTIFICARE la ANAF înainte de operațiune.
Avantaj: păstrare drept de deducere pe achiziții/costuri aferente.

CAZURI PRACTICE 2026:

A) Vânzare APARTAMENT NOU în 2026 către persoană fizică:
- Construcție livrată după 01.07.2025 → TVA 11% (cota redusă pentru locuințe)
- Dacă persoana fizică e prima locuință + maxim 1 apartament la o cotă redusă/an
- TVA 11% pe valoarea totală (teren + apartament)

B) Vânzare APARTAMENT VECHI (locuit anterior) către PJ:
- Scutire art. 292 alin. (2) lit. f) → fără TVA
- Opțiune taxare: pentru a beneficia de deducere TVA pe costuri (renovări etc.) — taxare cu cota 21%
- Notificare ANAF înainte de operațiune

C) Vânzare CLĂDIRE COMERCIALĂ VECHE între PJ:
- Scutire fără drept deducere (pentru vânzător)
- OPȚIUNE taxare frecventă: ambele părți preferă cu TVA (cumpărător deduce, vânzător își păstrează drept deducere)
- Cu opțiune: TVA 21%
- Taxare inversă posibilă dacă ambele PJ sunt plătitoare de TVA (art. 331)

D) Vânzare TEREN AGRICOL între PJ:
- Scutire fără drept deducere (necontruibil)
- Opțiune taxare posibilă

E) Vânzare TEREN INTRAVILAN cu CERTIFICAT URBANISM pentru construire:
- TEREN CONSTRUIBIL — TVA OBLIGATORIE (cotă 21%)
- NU se poate aplica scutire

AJUSTARE TVA la VÂNZARE SCUTITĂ (art. 305 — bunuri de capital):

Pentru clădiri vândute în regim de scutire:
- Perioada de ajustare: 20 ANI (de la achiziție/recepție)
- Ajustare: (TVA inițial dedus) × (Ani rămași până la final perioadă 20) / 20

EXEMPLU:
Clădire achiziționată cu TVA dedus 100.000 lei în 2020 (20 ani perioadă = până 2040).
Vânzare scutită în 2026.
Ani folosiți în scop deductibil: 2020-2025 = 6 ani.
Ani rămași: 2026-2040 = 14 ani.
TVA de ajustat (returnat la stat): 100.000 × 14/20 = 70.000 lei.

ECHIVALENT pentru ECHIPAMENTE (perioadă 5 ani):
TVA de ajustat = TVA inițial × ani rămași / 5

TRANSFER DE ACTIVITATE art. 270(7) — SCUTIT DE AJUSTARE:
Dacă bunul imobil face parte din transferul unei activități/ramuri întregi (succesor în drepturi):
- NU se consideră livrare (art. 270 alin. 7)
- NU se aplică ajustare TVA
- CONDIȚIE: primitorul declară pe propria răspundere INTENȚIA DE CONTINUARE a activității economice
- Documentul obligatoriu: declarație primitor + factură art. 320 alin. 12 cu valoare 0

FACTURĂ EMISĂ ÎN TRANSFER ACTIVITATE:
- NU se emite factură normală
- Document specific art. 320 alin. 12 — proces verbal/document de predare-primire activ
- Valoare 0 (NU livrare impozabilă)
- ABSENȚA art. 270(7): operațiunea e LIVRARE → trebuie aplicat TVA sau ajustare

CAZUL: CESIUNE CONTRACT vs VÂNZARE FINALĂ:
- Persoană fizică achiziționează apartament în 2021 cu antecontract (plată integrală)
- 2026: cesionează antecontract către altă persoană fizică
- Tratament: NU este vânzare apartament (clădire) — este vânzare DREPT contractual
- Vânzător PF: venit din alte surse (impozit 10%)
- TVA: nu se aplică pe cesiune
- Dezvoltatorul vinde apartamentul către CESIONAR cu factură pe noul nume + TVA cota redusă (dacă îndeplinește condițiile cota redusă)

DOCUMENTAȚIE OBLIGATORIE:
1. Contract VÂNZARE-CUMPĂRARE notarial cu detalii imobil + valoare
2. Extras CF cu mențiune scop construire (pentru teren)
3. Certificat urbanism (dacă teren cu construcție posibilă)
4. Notificare opțiune taxare (dacă aplicată) — depusă la ANAF
5. Calcul ajustare TVA (dacă aplicabilă)
6. Pentru transfer activitate: declarație primitor + document predare-primire`,
    sources: [
      { label: "Cod Fiscal art. 292 alin. (2) lit. f) (scutire imobile)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 268-270 (livrare bunuri), 286 (baza impozabilă)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 305 (ajustare bunuri capital)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 270 alin. (7) (transfer activitate)", ref: "https://legislatie.just.ro" },
      { label: "Norme metodologice Cod Fiscal pct. 55-56 (construcție nouă/veche)", ref: "https://legislatie.just.ro" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "diurna-plafon-33-procente-detasare-ue",
    tags: ["diurnă", "plafon 33%", "art. 76", "delegație", "detașare", "HG 714/2018", "A1", "sofer transport", "indemnizație"],
    title: "Diurnă internă/externă — plafon 33% salarii brute + A1 detașare UE",
    body: `Cod Fiscal art. 76 alin. (4) lit. h) + alin. (4¹) + HG 714/2018 + Regulament (CE) 883/2004.

DEFINIȚII:

DIURNĂ = indemnizație acordată salariaților pentru deplasări temporare (delegație) sau permanente (mobilitate).

DELEGAȚIE (Cod Muncii art. 43):
- Trimitere TEMPORARĂ a salariatului la alt loc decât locul obișnuit (în interesul angajatorului)
- Caracteristici: ocazional, max 60 zile/an consecutiv, cu ordin deplasare per eveniment

DETAȘARE (Cod Muncii art. 45-47):
- Modificare temporară a locului muncii (transferare la altă firmă/locație)
- Caracteristici: poate fi mai îndelungată (max 1 an + prelungire), schimbă subordonarea

PLAFON NEIMPOZABIL DIURNĂ (Cod Fiscal art. 76 alin. 4 lit. h):
Diurna NEIMPOZABILĂ în limita:
- 2.5 × nivelul legal stabilit pentru personalul instituțiilor publice (HG 714/2018)
- Calculat per zi de deplasare

PLAFON LEGAL HG 714/2018 (2025+):
- Diurnă RO (delegații interne): 23 RON/zi sector buget → 57.5 RON/zi maxim neimpozabil pentru privat (2.5x)
- Diurnă externă (delegații externe): variabil pe țară (HG 518/1995 actualizat anual)
  - UE: aproximativ 35 EUR/zi sector buget → ~87.5 EUR/zi pentru privat (~430 RON/zi cu curs 4.95)
  - Țări non-UE: variabil (ex: Turcia 35 EUR, China 40 EUR, etc.)

PLAFONUL ADIȚIONAL DE 33% (Cod Fiscal art. 76 alin. 4¹ — introdus 2023):
Indiferent de plafonul 2.5x HG 714/2018, **suma totală a INDEMNIZAȚIILOR NEIMPOZABILE acordate unui salariat pe lună NU poate depăși 33% din SALARIUL BRUT LUNAR de bază**.

CALCUL DUBLU PLAFON (regula CEA MAI MICĂ):
Plafon = MIN(2.5 × HG 714 × zile deplasare, 33% × salariu brut lunar)

EXEMPLU TRANSPORT INTERNATIONAL SOFER:
Salariu brut lunar: 5.000 RON
33% plafon: 1.650 RON/lună maxim neimpozabil
Sofer cu 20 zile delegații externe în lună:
- Plafon clasic 2.5×: 20 × 87.5 EUR × 4.95 = ~8.662 RON
- Plafon 33%: 1.650 RON
- MAI MIC: 1.650 RON → maxim neimpozabil per lună
- Sumă peste plafon (8.662 - 1.650 = 7.012 RON): IMPOZABIL ca salariu (impozit 16% + CAS 25% + CASS 10%)

EXEMPLU PERSONAL ADMINISTRATIV (puține deplasări):
Salariu brut lunar: 5.000 RON
3 zile delegație internă în lună × 57.5 RON = 172.5 RON
33% plafon: 1.650 RON
- Plafon 2.5×: 172.5 RON (sub limita 33%)
- Aplicabil: 172.5 RON neimpozabil

IMPACT REGULA 33%:
Pentru salariile MICI cu DELEGAȚII LUNGI/FRECVENTE → plafon 33% activează LIMITAREA.
Pentru salariile MARI cu delegații punctuale → rar activează (rămâne sub 33%).

CINE BENEFICIAZĂ DE DIURNĂ:
- Salariați cu CIM normă întreagă
- Salariați cu CIM normă parțială (proporțional cu timpul)
- Administratori cu CONTRACT MANDAT (vezi entrie diurnă-administrator)
- Directori cu contract management

CINE NU BENEFICIAZĂ:
- Asociați FĂRĂ CIM și FĂRĂ contract mandat (Cod Fiscal art. 25 alin. 4 lit. d — sumele acordate sunt CHELTUIELI NEDEDUCTIBILE; nu este indemnizație de delegare)
- Colaboratori externi (PFA, contracte civile) — au propriile reguli de impozitare

DETAȘARE TRANSNAȚIONALĂ UE — FORMULAR A1 (Reg. CE 883/2004):
Pentru salariați detașați în UE cu durată > 24 luni:
- A1 OBLIGATORIU emis de Casa Națională Pensii (CNPP)
- Permite menținere CAS în RO (NU CAS în țara de detașare)
- Termen valabilitate: 24 luni (cu posibilitate prelungire la Comisia UE)
- Documente solicitare: contract muncă + contract servicii cu beneficiarul + dovada activității

DETAȘARE NON-UE (Turcia, Elveția, SUA):
- A1 NU se aplică (este UE-only)
- Reguli CDI între RO și țara de detașare
- Posibil dublă contribuție (RO + țară detașare) sau scutire prin CDI
- Diurnă acordată: aplicabil plafon RO (2.5× sau 33%)

CAZUL CIRCULAȚIE LA BAZĂ:
Pentru șoferi internaționali cu BAZĂ FIXĂ în RO + curse externe:
- Tratament CA DELEGAȚIE (NU mobilitate) dacă revin regulat la bază
- Diurnă externă pentru zilele OAFRA țării RO
- Diurnă internă pentru zilele în RO

REGISTRU OBLIGATORIU pentru DELEGAȚIE:
1. Ordin de deplasare (Cod Muncii) — semnat înainte de plecare
2. Itinerar precis: destinație, durată, scop
3. Documente justificative (bilete, cazare, alimentație)
4. Decont final (la întoarcere)
5. Pentru externe: vouchere/extrase plată valută

REGULA pentru DIURNĂ "CASH" CASA:
- Diurna primită în numerar din casierie
- Cuantum maxim: respectă plafonul Legea 70/2015 (5.000 RON/zi pentru persoană fizică)
- Pentru sume mai mari: plată prin bancă

MONOGRAFIE CONTABILĂ:
A) Plată diurnă (în limita neimpozabilă):
   625 = 421 (cheltuială cu deplasări — DEDUCTIBILĂ)
   421 = 5311/5121 (plată)

B) Diurnă peste plafon (impozabilă):
   421 = 4431/4432/4441 (contribuții + impozit pe suma peste plafon)
   421 = 5311/5121 (plata netă)
   641 = 421 (parte salarială transferată — pentru claritate contabilă)

D112 RAPORTARE:
- Secțiunea F1: diurnă neimpozabilă (sub plafon)
- Secțiunea G: parte impozabilă (peste plafon)
- Atenție: NEDECLARARE peste plafon → control fiscal cu impunere retroactivă + accesorii

SANCȚIUNI:
- Diurnă acordată fără justificare/ordin deplasare: ANAF reclasifică ca salariu → impozit + contribuții suplim.
- Plafonul 33% nedeclarat: ajustare în D112 + accesorii`,
    sources: [
      { label: "Cod Fiscal art. 76 alin. (4) lit. h), alin. (4¹) (plafoane diurnă)", ref: "https://legislatie.just.ro" },
      { label: "Cod Muncii art. 43-47 (delegație, detașare)", ref: "https://legislatie.just.ro" },
      { label: "HG 714/2018 (diurnă sector public)", ref: "https://legislatie.just.ro" },
      { label: "Regulament (CE) 883/2004 (A1 detașare UE)", ref: "https://eur-lex.europa.eu" },
    ],
    last_verified: "2026-05-15",
  },
  {
    id: "cod-tva-anulat-reactivare-d311",
    tags: ["cod TVA anulat", "art. 316 alin. 11", "art. 11", "reînregistrare TVA", "D311", "drept deducere", "proc. 2393"],
    title: "Cod TVA anulat — anulare oficiu, reactivare, D311, impact parteneri",
    body: `Cod Fiscal art. 316 alin. (11) + art. 11 alin. (6)-(9) + OPANAF 2393/2017 (procedură reînregistrare).

MOTIVE ANULARE COD TVA DIN OFICIU (Cod Fiscal art. 316 alin. 11):

a) NU au depus deconturi TVA pentru 1 SEMESTRU (trimestrial) sau 2 SEMESTRE (lunar) consecutive
b) Au depus deconturi cu sume ZERO 6 LUNI consecutive (sub 6 trimestre consecutive pentru trimestrial)
c) Sunt declarați INACTIVI fiscal (art. 92 Cod Procedură Fiscală)
d) Au asociați/administratori cu cazier fiscal / fapte penale fiscale
e) Modificare structură asociați cu risc fiscal
f) Risc fiscal mare (criterii ANAF — note de risc)
g) Schimbare adresă fără notificare 30 zile
h) Activitate suspendată la ONRC fără declarare ANAF

CONSECINȚE ANULARE:
1. Firma RĂMÂNE PERSOANĂ IMPOZABILĂ (poate vinde/cumpăra) DAR:
2. NU MAI POATE COLECTA TVA pe vânzări (factură fără TVA)
3. NU MAI POATE DEDUCE TVA pe achiziții
4. NU MAI ARE acces la rambursări TVA
5. Continuă obligația D311 pentru anumite operațiuni (achiziții IC, taxare inversă internă)

LIMITARE DEDUCERE pentru PARTENERII (art. 11 alin. 6-9):
Firmele care cumpără DE LA o firmă cu COD TVA ANULAT au limitări:

a) **Cumpărător PĂSTREAZĂ dreptul deducere** dacă:
   - Furnizorul are codul TVA ANULAT din motivele de la lit. a-c (inactivitate declarații)
   - Furnizorul ulterior se REACTIVEAZĂ (recâștigă cod TVA)
   - În acest caz, cumpărătorul DEDUCE TVA pe facturile primite în perioada cu cod anulat, după reactivarea furnizorului

b) **Cumpărător PIERDE dreptul deducere** dacă:
   - Furnizorul are codul ANULAT din lit. d-h (risc fiscal, cazier, etc.)
   - Dedu cerea NU se recuperează niciodată

VERIFICARE STATUS COD TVA:
- Registru public ANAF: https://www.anaf.ro/PublicWebApp (verifică valabilitate cod TVA)
- Verificare ÎNAINTE de fiecare factură (mai ales pentru cumpărări mari)
- Documentul de verificare se păstrează ca anexă (poate fi solicitat la control)

D311 — Decont special pentru firme cu cod anulat (OPANAF 188/2018):
Vezi entrie dedicate "D311 — TVA cod anulat". Cuprinde:
- Achiziții IC bunuri (cu TVA datorat RO)
- Servicii IC primite (reverse charge)
- Taxare inversă internă (deșeuri, scrap)
- Importuri

PROCEDURA REACTIVARE COD TVA (OPANAF 2393/2017):

PASUL 1 — VERIFICARE EligIBILITATE:
- Firma NU mai e inactivă fiscal (art. 92 CPF)
- Toate declarațiile la zi (D300, D394, D112, D101, bilanț)
- Toate plățile la zi (sau eșalonare aprobată)
- Conformare contabilă (audit dacă necesar)

PASUL 2 — DEPUNERE D700:
- D700 cu secțiunea reactivare TVA bifată
- Atașamente:
  - Bilanț + declarații depuse
  - Documente eliminare cauze anulare
  - Pentru risc fiscal: documente justificative + declarații cazier curat
  - Pentru sediu schimbat: extras ONRC actualizat

PASUL 3 — EVALUARE ANAF:
- ANAF evaluează în 30-60 zile
- Inspecție fiscală scurtă (la sediu)
- Verificare contabilitate (random 3-6 luni)

PASUL 4 — DECIZIE ANAF:
- APROBARE: cod TVA reactivat (sau cod NOU dacă inactivitate >12 luni)
- RESPINGERE: motivare + cale contestație (Cod Procedură Fiscală art. 268-270)

DURATA REACTIVARE FĂRĂ COD NOU:
- Dacă reactivare ÎN 6 LUNI de la anulare: același cod TVA
- Peste 6 luni: cod NOU (cu RO + cifre noi)

CAZ FRECVENT: REÎNREGISTRARE ÎNTÂRZIATĂ după anulare:

SCENARIU:
Firma și-a pierdut codul TVA din inactivitate (motive a-c). Continuă activitatea fără să observe.
Trece 1 an cu vânzări fără TVA + cumpărări fără deducere.
Realizează problema → demarează reactivare.

CONSECINȚE FISCALE:
- Pentru vânzările făcute în perioada cu cod anulat: TVA datorat retroactiv (de la ANAF) pe baza tranzacțiilor
- Pentru achizițiile făcute: TVA NU se poate deduce retroactiv (excepție: dacă furnizorul are cod activ)
- Accesorii: 0.02%/zi dobândă + 0.01%/zi penalitate (de la termene plată inițiale)
- D311 retroactiv pentru achiziții IC care nu au fost declarate

AJUSTARE NEGATIVĂ TVA BUNURI CAPITAL la ANULAREA CODULUI (art. 305):
La data anulării codului → ajustare obligatorie TVA dedus inițial pe bunuri de capital:
- Clădiri: perioada 20 ani → recuperare proporțională
- Echipamente: perioada 5 ani → recuperare proporțională

EXEMPLU:
Mijloc fix (laptop/server) achiziționat 2024 cu TVA dedus 5.000 lei (perioada amortizare 3 ani / perioadă ajustare 5 ani).
Anulare cod TVA: 06.04.2026 (după 2 ani de utilizare).
Ani rămași în perioada ajustare: 5 - 2 = 3.
TVA de ajustat (returnat la stat): 5.000 × 3/5 = 3.000 lei.

ALTERNATIVE LEGALE pentru AJUSTARE:
- Dacă mijlocul fix se vinde (deși firma nu mai are TVA): tratament special art. 304-305
- Cu cod anulat, nu se mai colectează TVA la vânzare (factură fără TVA)

PLATĂ TVA AJUSTAT:
- La data anulării: TVA ajustat în D311 (sau decont special)
- Plata: 25 luna următoare anulării

CAZ SPECIAL: SUSPENDARE ACTIVITATE 3 ANI + COD ANULAT:
Firmă cu mijloace fixe + suspendare ONRC 3 ani:
- Anulare cod TVA automată
- Ajustare TVA toate bunurile de capital (la data suspendării)
- Mijloace fixe ramân în patrimoniu DAR fără TVA dedus
- La reactivare: cod TVA nou, fără posibilitate de recuperare TVA ajustat

DREPT DEDUCERE TVA NEEXIGIBILĂ la IEȘIRE DIN TVA:
Pentru firme care ies VOLUNTAR din TVA (cerere proprie):
- Stocuri marfă: ajustare conform 371 = 4428 (vezi monografie din Portal)
- TVA neexigibilă din facturi (TVA la încasare): NU se mai poate deduce niciodată (renunțare drept)
- Cont 4428 sold creditor: anulat la data ieșirii

DOCUMENTAȚIE OBLIGATORIE:
1. Decizia ANAF anulare cod
2. D700 cu cerere reactivare
3. Calcul ajustare TVA bunuri capital
4. D311 pentru tranzacțiile care necesită declarare
5. Pentru parteneri: notificare anulare cod (păstrare drept deducere)`,
    sources: [
      { label: "Cod Fiscal art. 316 alin. (11) (anulare cod TVA)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 11 alin. (6)-(9) (limitare deducere parteneri)", ref: "https://legislatie.just.ro" },
      { label: "Cod Fiscal art. 305 (ajustare bunuri capital la anulare)", ref: "https://legislatie.just.ro" },
      { label: "OPANAF 2393/2017 (procedură reactivare cod TVA)", ref: "https://anaf.ro" },
      { label: "OPANAF 188/2018 (D311)", ref: "https://anaf.ro" },
    ],
    last_verified: "2026-05-15",
  },
];
