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
];
