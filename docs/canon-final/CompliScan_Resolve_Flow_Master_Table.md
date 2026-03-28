# CompliScan — Resolve Flow Master Table

**Data:** 2026-03-25  
**Scop:** matrice UX unica pentru toate flow-urile de finding -> resolve.  
**Utilizare:** design, product, backend, cockpit logic, QA.

**Pentru fiecare tip de finding raspundem la:**
- ce vede userul
- ce status apare
- ce CTA apare
- ce face CompliScan
- ce trebuie sa faca userul
- ce dovada se cere
- cand se inchide
- cand reapare ca revalidation

---

# 1. Campuri standard ale matricei

- `Finding ID`
- `Framework`
- `Finding title`
- `Resolution mode`
- `Initial status`
- `What user sees`
- `Primary CTA`
- `Secondary CTA`
- `What CompliScan does`
- `What user must do`
- `Required evidence`
- `Close condition`
- `Auto recheck`
- `Revalidation trigger`

---

# 2. GDPR — Resolve Flow

| Finding ID | Framework | Finding title | Resolution mode | Initial status | What user sees | Primary CTA | Secondary CTA | What CompliScan does | What user must do | Required evidence | Close condition | Auto recheck | Revalidation trigger |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GDPR-001 | GDPR | Politica de confidentialitate lipsa | in_app_guided | ready_to_generate | „Nu ai o politica de confidentialitate potrivita. Putem genera una pe baza datelor firmei tale.” | Genereaza acum | Am deja documentul | deschide generatorul, precompleteaza ce stie, leaga artifactul de finding | completeaza datele reale si confirma | generated_document + confirmation | document generat, confirmat si salvat in Vault | partial | website schimbat / date firma schimbate / >6-12 luni |
| GDPR-002 | GDPR | Politica de confidentialitate generica | in_app_guided | need_your_input | „Politica existenta pare prea generica si nu reflecta complet activitatea firmei.” | Actualizeaza acum | Vezi diferentele | evidentiaza golurile si deschide update flow | completeaza diferentele reale | updated_document + confirmation | document actualizat si confirmat | partial | rescan website / furnizori noi / data review expirata |
| GDPR-003 | GDPR | Politica de cookies lipsa | in_app_guided | ready_to_generate | „Ai nevoie de o politica de cookies pentru trackerele detectate pe site.” | Genereaza acum | Analizeaza site-ul din nou | genereaza draft bazat pe site scan | verifica si publica politica | generated_document + public_link | document publicat si salvat | partial | trackere noi / site schimbat |
| GDPR-004 | GDPR | Trackere nenecesare fara consimtamant | external_action | external_action_required | „Am detectat trackere care ar trebui blocate pana la consimtamant.” | Vezi ce trebuie sa faci | Reanalizeaza site-ul | explica trackerele gasite si pasii de remediere | configureaza banner / blocare trackere | screenshot + system_recheck | user aduce dovada si rescanul nu mai gaseste problema | yes | trackere noi / scripturi noi |
| GDPR-005 | GDPR | Banner de cookies neconform | external_action | external_action_required | „Bannerul de cookies nu pare sa colecteze consimtamant valid.” | Corecteaza bannerul | Vezi de ce conteaza | explica ce lipseste in banner | corecteaza implementarea | screenshot + system_recheck | screenshot + rescan curat | yes | modificari website |
| GDPR-006 | GDPR | Baza legala neclara | in_app_guided | need_your_input | „Pentru una sau mai multe prelucrari nu este clara baza legala.” | Completeaza acum | Vezi exemple | propune structura bazelor legale | confirma baza reala pentru fiecare activitate | confirmation + updated_document | bazele legale sunt completate si documentate | no | procese noi / schimbari business |
| GDPR-007 | GDPR | Consimtamant invalid sau incomplet | external_action | external_action_required | „Fluxul actual de consimtamant poate fi incomplet sau invalid.” | Vezi cum il corectezi | Genereaza copy nou | explica problema si poate genera wording | modifica formularul / fluxul real | screenshot + updated_document | dovada noului formular | partial | rescan website / modificari formular |
| GDPR-008 | GDPR | Registru Art.30 lipsa | in_app_guided | ready_to_generate | „Nu avem un registru al activitatilor de prelucrare.” | Genereaza registrul | Vezi ce va contine | genereaza structura registrului | completeaza activitatile reale | generated_document + confirmation | registru completat si salvat | no | activitati noi / review periodic |
| GDPR-009 | GDPR | Registru Art.30 incomplet | in_app_guided | need_your_input | „Registrul exista, dar lipsesc activitati sau campuri cheie.” | Completeaza registrul | Vezi ce lipseste | marcheaza campurile lipsa | completeaza informatiile reale | generated_document + confirmation | registru completat | no | date noi / review periodic |
| GDPR-010 | GDPR | DPA lipsa pentru vendor cunoscut | in_app_full / in_app_guided | ready_to_generate | „Furnizorul pare sa proceseze date pentru tine si nu avem un DPA atasat.” | Adauga DPA | Nu folosim acest vendor pentru date personale | propune DPA / link / template si deschide upload | confirma relatia si incarca / semneaza | vendor_document + confirmation | DPA prezent si confirmat | partial | expirare DPA / vendor schimbat |
| GDPR-011 | GDPR | DPA expirat / neverificat | external_action | external_action_required | „DPA-ul acestui furnizor trebuie reinnoit sau reverificat.” | Reinnoieste acum | Vezi documentul vechi | arata data / statusul vechi | obtine documentul nou | vendor_document | document nou incarcat | partial | data expirare / vendor update |
| GDPR-012 | GDPR | Subprocesatori netransparenti | in_app_guided | need_your_input | „Trebuie sa confirmi cu ce furnizori lucrezi efectiv.” | Confirma furnizorii | Vezi vendorii detectati | genereaza lista propusa | confirma vendorii reali | confirmation + updated_document | lista confirmata si salvata | no | vendori noi / website scan nou |
| GDPR-013 | GDPR | Cerere de acces activa | in_app_guided / external_action | need_your_input | „Ai o cerere activa de acces la date cu termen legal.” | Deschide cazul | Vezi termenul | creeaza cazul, calculeaza deadline-ul, genereaza draft | verifica identitatea si trimite raspunsul | email_sent / uploaded_file | dovada trimiterii + status responded | no | nu reapare, doar caz nou |
| GDPR-014 | GDPR | Cerere de stergere activa | in_app_guided / external_action | need_your_input | „Ai o cerere activa de stergere care cere raspuns si actiune.” | Gestioneaza cererea | Vezi ce trebuie sa trimiti | structureaza cazul si draftul | executa stergerea reala si raspunsul | email_sent + manual_attestation | dovada raspunsului + confirmarea executiei | no | nu reapare, doar caz nou |
| GDPR-015 | GDPR | Cerere DSAR depasita | external_action | external_action_required | „Termenul pentru aceasta cerere este depasit. Trebuie sa raspunzi imediat.” | Raspunde acum | Vezi istoricul cazului | marcheaza urgenta si pregateste raspunsul | trimite raspunsul si noteaza motivul | email_sent + note | raspuns trimis + explicatie salvata | no | nu reapare, doar audit log |
| GDPR-016 | GDPR | Retentie date neclara | in_app_guided | need_your_input | „Nu este clar cat pastrezi anumite categorii de date.” | Defineste retentia | Vezi categoriile afectate | genereaza matrice / policy | confirma duratele reale | generated_document + confirmation | matrice salvata si confirmata | no | review periodic / proces nou |
| GDPR-017 | GDPR | Stergere date neimplementata | external_action | external_action_required | „Ai nevoie de dovada ca stergerea datelor este implementata in practica.” | Adauga dovada | Vezi procedura recomandata | explica pasii si cere dovada | aplica stergerea si adauga dovada | screenshot / manual_attestation | dovada atasata + confirmare | partial | review periodic |
| GDPR-018 | GDPR | Transfer international netransparent | in_app_guided | need_your_input | „Unul sau mai multi furnizori pot implica transferuri internationale neclare.” | Clarifica transferul | Vezi vendorii implicati | pregateste checklist si sectiunile de documentatie | confirma temeiul si vendorii reali | confirmation + vendor_document | documentatie salvata | no | vendor nou / termen expirat |
| GDPR-019 | GDPR | Bresa de date cu impact personal | external_action | external_action_required | „Acest incident poate necesita notificare catre ANSPDCP.” | Deschide flow-ul de breach | Vezi ce inseamna | creeaza cazul si draftul de notificare / rationament | decide si trimite manual sau documenteaza de ce nu | official_reference / uploaded_file / note | notificare trimisa sau rationament complet documentat | no | doar daca incidentul evolueaza |
| GDPR-020 | GDPR | Lipsa dovezii pentru finding GDPR rezolvat | user_attestation / external_action | evidence_uploaded / need_your_input | „Spui ca problema este rezolvata, dar nu avem dovada.” | Adauga dovada | Vezi ce dovada acceptam | cere artifactul lipsa | incarca dovada | uploaded_file / screenshot / public_link | dovada prezenta si legata de finding | partial | la lipsa artefactului / artefact sters |

---

# 3. NIS2 — Resolve Flow

| Finding ID | Framework | Finding title | Resolution mode | Initial status | What user sees | Primary CTA | Secondary CTA | What CompliScan does | What user must do | Required evidence | Close condition | Auto recheck | Revalidation trigger |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NIS2-001 | NIS2 | Eligibilitate NIS2 neclara | user_attestation / in_app_guided | need_your_input | „Nu este clar daca firma ta intra sub NIS2.” | Verifica eligibilitatea | Vezi de ce conteaza | ruleaza wizardul de eligibilitate | completeaza datele cerute | confirmation | eligibilitate salvata | no | sector / dimensiune / activitate schimbata |
| NIS2-002 | NIS2 | Firma posibil eligibila, dar neverificata | in_app_guided | need_your_input | „Exista indicii ca ti se poate aplica NIS2, dar nu este verificat.” | Confirma acum | Vreau sa revad mai tarziu | deschide verificarea | completeaza informatiile lipsa | confirmation | verificare terminata | no | schimbari profil firma |
| NIS2-003 | NIS2 | Inregistrare DNSC lipsa | external_action | external_action_required | „Daca ti se aplica NIS2, trebuie sa pregatesti si sa trimiti inregistrarea.” | Pregateste inregistrarea | Vezi ce lipseste | prefill formular si checklist | trimite manual si revine cu dovada | official_reference / uploaded_file | dovada trimiterii + status submitted | no | daca statusul ramane neconfirmat |
| NIS2-004 | NIS2 | Inregistrare DNSC incompleta | external_action | external_action_required | „Inregistrarea DNSC nu este completa.” | Completeaza acum | Vezi campurile lipsa | marcheaza campurile lipsa | completeaza si retrimite | official_reference / uploaded_file | date completate + dovada | no | daca lipsurile persista |
| NIS2-005 | NIS2 | Assessment NIS2 neinceput | in_app_guided | need_your_input | „Nu avem inca o evaluare NIS2 pentru firma ta.” | Incepe evaluarea | Vezi ce contine | deschide assessment-ul si prefill-ul unde exista | raspunde si confirma | confirmation | assessment salvat | no | review periodic |
| NIS2-006 | NIS2 | Assessment NIS2 incomplet | in_app_guided | need_your_input | „Evaluarea NIS2 este incompleta.” | Continua evaluarea | Vezi intrebarile ramase | evidentiaza ce lipseste | completeaza intrebarile ramase | confirmation | assessment complet | no | review periodic |
| NIS2-007 | NIS2 | Dovezi insuficiente pentru controale NIS2 | in_app_guided / external_action | need_your_input | „Unele controale NIS2 nu au dovada suficienta.” | Adauga dovezi | Vezi controalele afectate | cere dovezi pe fiecare control | incarca artifactele | uploaded_file / screenshot | controalele au dovada atasata | no | review periodic / expirare |
| NIS2-008 | NIS2 | Roluri / responsabilitati NIS2 neclare | user_attestation / in_app_guided | need_your_input | „Nu este clar cine raspunde intern pentru cerintele NIS2.” | Defineste rolurile | Vezi structura recomandata | genereaza structura | confirma persoanele reale | confirmation + generated_document | roluri confirmate | no | schimbari organizatie |
| NIS2-009 | NIS2 | Training NIS2 lipsa | external_action | external_action_required | „Nu avem dovada unui training relevant pe NIS2.” | Adauga dovada | Vezi ce acceptam | explica ce dovada este utila | organizeaza trainingul / incarca dovada | uploaded_file / manual_attestation | dovada de training atasata | no | la >12 luni fara refresh |
| NIS2-010 | NIS2 | Backup / recovery neverificat | user_attestation / external_action | need_your_input | „Nu este clar daca backup-ul si recovery-ul sunt testate.” | Confirma acum | Vezi de ce conteaza | cere informatie si checklist | confirma sau testeaza in realitate | manual_attestation / screenshot | confirmare + dovada unde e cazul | no | la expirarea review-ului |
| NIS2-011 | NIS2 | MFA lipsa sau neverificata | external_action | external_action_required | „Accesul protejat prin MFA lipseste sau nu este confirmat.” | Activeaza si confirma | Vezi ce sisteme sunt afectate | explica remedierea | activeaza MFA si aduce dovada | screenshot | dovada atasata | partial | recheck periodic / sisteme noi |
| NIS2-012 | NIS2 | Logging / monitoring insuficient | external_action | external_action_required | „Nu avem suficienta dovada pentru logging si monitoring.” | Adauga dovada | Vezi cerintele minime | cere clarificari si checklist | implementeaza / documenteaza | screenshot / uploaded_file | dovada atasata | no | review periodic |
| NIS2-013 | NIS2 | Furnizor critic neverificat | in_app_guided | need_your_input | „Un furnizor critic trebuie evaluat.” | Deschide review-ul | Nu este critic | initiaza vendor review | confirma criticitatea si raspunde | vendor_document + confirmation | review complet | partial | expirare review / vendor nou |
| NIS2-014 | NIS2 | Furnizor critic fara dovezi | external_action / in_app_guided | need_your_input | „Lipsesc documentele necesare pentru acest furnizor critic.” | Adauga documente | Vezi ce lipseste | listeaza documentele minime | colecteaza si incarca | vendor_document | documentele sunt atasate | partial | expirare / vendor schimbat |
| NIS2-015 | NIS2 | Incident activ fara Early Warning | external_action | external_action_required | „Incidentul cere Early Warning.” | Genereaza si continua | Vezi deadline-ul | genereaza draftul si countdown-ul | trimite manual si pune referinta | official_reference / uploaded_file | dovada trimiterii | no | daca lipseste referinta / progres |
| NIS2-016 | NIS2 | Incident activ fara raport 72h | external_action | external_action_required | „Incidentul cere raportul initial detaliat.” | Continua raportul 72h | Vezi ce lipseste | pregateste draftul | completeaza si trimite manual | official_reference / uploaded_file | dovada trimiterii | no | daca lipseste referinta |
| NIS2-017 | NIS2 | Incident fara raport final / progres | external_action | external_action_required | „Mai lipseste raportul final sau de progres.” | Continua acum | Vezi istoricul incidentului | pregateste draftul final / progres | trimite manual | official_reference / uploaded_file | dovada trimiterii | no | pana la finalizarea incidentului |
| NIS2-018 | NIS2 | Corespondenta DNSC lipsa | external_action | need_your_input | „Nu avem la dosar raspunsurile sau referintele DNSC.” | Adauga corespondenta | Vezi ce acceptam | cere upload / log | incarca mailul / documentul | uploaded_file | corespondenta salvata | no | la orice raspuns nou |
| NIS2-019 | NIS2 | Maturitate NIS2 scazuta pe domenii cheie | in_app_guided | detected | „Exista domenii NIS2 cu maturitate scazuta.” | Vezi top gaps | Incepe cu cel mai urgent | prioritizeaza domeniile si taskurile | incepe remedierea | confirmation / uploaded_file | top gaps convertite in taskuri si/sau dovezi | no | review periodic |

---

# 4. eFactura / ANAF / SPV — Resolve Flow

| Finding ID | Framework | Finding title | Resolution mode | Initial status | What user sees | Primary CTA | Secondary CTA | What CompliScan does | What user must do | Required evidence | Close condition | Auto recheck | Revalidation trigger |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EF-001 | eFactura | SPV lipsa / neverificat | external_action | external_action_required | „Nu avem dovada ca SPV este activ si operational.” | Activeaza SPV | Vezi pasii | explica fluxul si cere dovada activarii | activeaza si confirma | screenshot / official_reference | dovada activarii | partial | daca accesul expira / schimbari |
| EF-002 | eFactura | SPV activ, dar flux neverificat | external_action | external_action_required | „SPV pare activ, dar nu avem confirmarea unui flux valid.” | Verifica fluxul | Vezi ce inseamna | cere test operational | face testul si adauga dovada | screenshot | test confirmat | partial | reverificare periodica |
| EF-003 | eFactura | Factura respinsa ANAF | external_action | external_action_required | „O factura a fost respinsa de ANAF.” | Vezi ce trebuie corectat | Vezi eroarea exacta | afiseaza motivul si remedierea probabila | corecteaza in softul de facturare | xml / screenshot | status nou valid sau dovada retransmiterii | yes | pana la validare |
| EF-004 | eFactura | Eroare XML / UBL nerezolvata | external_action | external_action_required | „Exista o eroare XML/UBL care blocheaza validarea.” | Corecteaza acum | Vezi explicatia | explica codul / campul | corecteaza si retransmite | xml / screenshot | dovada validarii | yes | pana la validare |
| EF-005 | eFactura | Factura netrimisa in termen | external_action | external_action_required | „O factura nu a fost transmisa corect sau in termen.” | Trimite acum | Vezi factura afectata | semnaleaza urgenta | transmite corect | screenshot / official_reference | dovada transmiterii | partial | daca apar noi intarzieri |
| EF-006 | eFactura | Factura duplicata / conflict de status | external_action | external_action_required | „Exista conflict sau duplicare in fluxul unei facturi.” | Clarifica acum | Vezi istoricul | arata conflictul cunoscut | investigheaza si corecteaza | screenshot / note | status clarificat si dovada | partial | daca reapare conflictul |
| EF-007 | eFactura | Factura procesata gresit pe partea de cumparator | external_action | external_action_required | „Fluxul intern al cumparatorului pare nealiniat cu procesul corect.” | Corecteaza procesul | Vezi riscul | explica riscul si cere dovada procedurii | corecteaza fluxul intern | manual_attestation / uploaded_file | procedura / confirmare salvata | no | review periodic |
| EF-008 | eFactura | Discrepanta e-TVA / notificare conformare | external_action | external_action_required | „Ai o discrepanta fiscala sau o notificare care cere raspuns.” | Deschide cazul | Vezi mesajul | afiseaza problema si cere raspuns | raspunde / corecteaza | uploaded_file / official_reference | dovada raspunsului sau corectiei | no | daca apare o notificare noua |
| EF-009 | eFactura | CUI invalid / date fiscale inconsistente | in_app_guided / external_action | need_your_input | „Datele fiscale ale firmei sunt inconsistnte.” | Corecteaza datele | Vezi cum au fost detectate | normalizeaza si arata conflictul | confirma varianta corecta | confirmation | datele corectate in profil | partial | daca reapar inconsistente |
| EF-010 | eFactura | Lipsa dovezii de remediere pentru finding fiscal | user_attestation / external_action | need_your_input | „Problema fiscala pare rezolvata, dar nu avem dovada.” | Adauga dovada | Vezi ce acceptam | cere artifactul lipsa | incarca / confirma | screenshot / xml / uploaded_file | dovada atasata | partial | daca dovada dispare / expira |

---

# 5. AI Act / AI Inventory — Resolve Flow

| Finding ID | Framework | Finding title | Resolution mode | Initial status | What user sees | Primary CTA | Secondary CTA | What CompliScan does | What user must do | Required evidence | Close condition | Auto recheck | Revalidation trigger |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AI-001 | AI Act | Sistem AI nedeclarat in inventar | in_app_guided | need_your_input | „Am detectat un posibil sistem AI care nu este in inventar.” | Adauga in inventar | Nu este AI / nu se aplica | propune intrarea | confirma si completeaza | confirmation | sistem salvat in inventar | no | tool nou / detectie noua |
| AI-002 | AI Act | Shadow AI detectat | in_app_guided / external_action | need_your_input | „Un tool AI pare folosit fara review.” | Clarifica folosirea | Vezi de ce conteaza | deschide review-ul si explica riscul | confirma utilizarea reala | confirmation / vendor_document | tool clarificat si logat | no | tool nou / utilizare noua |
| AI-003 | AI Act | Clasificare de risc lipsa | in_app_guided | need_your_input | „Acest sistem AI nu are clasificare de risc.” | Clasifica acum | Vezi logica propusa | propune clasificarea si explica baza | confirma scopul real | confirmation | clasificare confirmata | no | schimbare de use case |
| AI-004 | AI Act | Clasificare de risc incerta | in_app_guided | need_your_input | „Clasificarea acestui sistem AI este incerta.” | Completeaza informatia | Vezi ce lipseste | arata zonele neclare | completeaza contextul | confirmation | clasificare decisa | no | schimbare de use case |
| AI-005 | AI Act | Human oversight nedefinit | in_app_guided / user_attestation | need_your_input | „Nu este clar cine aproba sau supravegheaza acest sistem AI.” | Defineste oversight-ul | Vezi modelul recomandat | genereaza structura minima | confirma persoanele si regulile | confirmation + generated_document | oversight definit si salvat | no | reorganizare / sistem nou |
| AI-006 | AI Act | Transparency / disclosure lipsa | in_app_guided | ready_to_generate | „Lipsesc elemente de transparenta pentru acest sistem AI.” | Genereaza textul | Vezi unde se foloseste | genereaza disclosure / update de politica | confirma si publica | generated_document + public_link | disclosure salvat | partial | schimbare produs / use case |
| AI-007 | AI Act | Annex IV / documentatie tehnica lipsa | in_app_guided | ready_to_generate | „Documentatia tehnica necesara nu este completa.” | Genereaza documentatia | Vezi ce va contine | pregateste draftul | completeaza datele tehnice reale | generated_document + confirmation | documentatia salvata | no | modificare sistem / versiune noua |
| AI-008 | AI Act | EU Database readiness lipsa | in_app_guided / external_action | need_your_input | „Datele pentru EU Database nu sunt pregatite.” | Pregateste acum | Vezi ce lipseste | pregateste exportul si campurile | completeaza lipsurile si depune manual unde e cazul | generated_document / uploaded_file | export pregatit sau dovada depunerii | no | schimbari de sistem |
| AI-009 | AI Act | Vendor AI fara review | in_app_guided / external_action | need_your_input | „Vendorul AI folosit nu a trecut prin review.” | Deschide review-ul | Nu mai folosim acest vendor | initiaza review-ul si cere documente | confirma utilizarea si incarca docs | vendor_document | review complet si documentat | partial | expirare review / vendor schimbat |
| AI-010 | AI Act | Lipsa dovezii pentru controale AI | external_action / user_attestation | need_your_input | „Nu avem dovezi suficiente pentru controalele AI declarate.” | Adauga dovada | Vezi ce acceptam | cere artifactele lipsa | incarca sau confirma | uploaded_file / manual_attestation | dovezile sunt atasate | no | review periodic |

---

# 6. Cross / Evidence / Trust / Vault — Resolve Flow

| Finding ID | Framework | Finding title | Resolution mode | Initial status | What user sees | Primary CTA | Secondary CTA | What CompliScan does | What user must do | Required evidence | Close condition | Auto recheck | Revalidation trigger |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SYS-001 | Cross | Finding rezolvat fara dovada | user_attestation / external_action | need_your_input | „Problema pare rezolvata, dar nu avem dovada la dosar.” | Adauga dovada | Vezi ce acceptam | cere artifactul lipsa si blocheaza inchiderea finala | incarca dovada | uploaded_file / screenshot / public_link | dovada este prezenta | partial | daca dovada se pierde |
| SYS-002 | Cross | Dovada veche / needs revalidation | user_attestation / external_action | needs_revalidation | „Aceasta dovada este veche si trebuie reconfirmata.” | Reconfirma acum | Vezi data ultimului review | ridica findingul de revalidare | reconfirma sau reinnoieste | confirmation / uploaded_file | review nou salvat | partial | la expirarea urmatorului review |
| SYS-003 | Cross | Artifact lipsa din Vault | external_action | need_your_input | „Artifactul aferent nu este prezent in dosar.” | Adauga artifactul | Vezi unde ar trebui sa fie | cere atasarea lui | incarca artifactul | uploaded_file | artifact prezent in Vault | no | daca se sterge / lipseste |
| SYS-004 | Cross | Artifact fara owner / data / versiune | in_app_guided | need_your_input | „Artifactul exista, dar nu are metadatele minime.” | Completeaza metadatele | Vezi de ce conteaza | cere completarea metadatelor | completeaza owner / data / versiune | confirmation | metadate complete | no | la orice artifact nou incomplet |
| SYS-005 | Cross | Audit Pack incomplet | in_app_guided / external_action | detected | „Audit Pack-ul nu contine toate elementele necesare.” | Vezi ce lipseste | Genereaza din nou | afiseaza gaps-urile | completeaza lipsurile | uploaded_file / generated_document | gaps inchise si pack complet | partial | la artefacte noi / lipsa |
| SYS-006 | Cross | Trust Center neactualizat | in_app_guided / external_action | needs_revalidation | „Datele publice de trust trebuie actualizate.” | Actualizeaza acum | Vezi ce s-a invechit | semnaleaza campurile vechi | actualizeaza datele / linkurile | confirmation / public_link | trust data actualizata | partial | review periodic / schimbari companie |

---

# 7. Reguli UX finale

## Orice rand din aceasta matrice trebuie sa fie tradus in UI astfel:

### Zona 1
**Ce a gasit CompliScan**

### Zona 2
**Ce poate face CompliScan acum**

### Zona 3
**Ce trebuie sa faca userul**

### Zona 4
**Ce dovada se cere**

### Zona 5
**Cand se inchide si cand reapare**

---

# 8. Concluzie

Aceasta matrice transforma Finding Type Library intr-un model UX executabil.

Daca este folosita corect, orice finding din CompliScan poate fi prezentat coerent, cu:
- status corect
- CTA corect
- dovada corecta
- inchidere corecta
- revalidation corecta
