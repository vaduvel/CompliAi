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
