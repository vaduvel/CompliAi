# CompliScan — Finding Type Library

**Data:** 2026-03-25  
**Scop:** librarie practica de finding-uri pentru CompliScan.  
**Utilizare:** design, product logic, backend rules, resolve cockpit, evidence rules.

**Campuri folosite:**
- `ID`
- `Framework`
- `Finding title`
- `Category`
- `Typical severity`
- `Signal type`
- `Resolution mode`
- `Primary actor`
- `What CompliScan can do`
- `What user must do`
- `Required evidence`
- `Auto recheck`
- `Closing rule`

---

# 1. GDPR

| ID | Framework | Finding title | Category | Typical severity | Signal type | Resolution mode | Primary actor | What CompliScan can do | What user must do | Required evidence | Auto recheck | Closing rule |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GDPR-001 | GDPR | Politica de confidentialitate lipsa | Privacy notice | High | direct / inferred | in_app_guided | user | genereaza draft, precompleteaza, leaga de finding | completeaza date reale, confirma, salveaza | generated_document + confirmation | partial | document generat + confirmare explicita |
| GDPR-002 | GDPR | Politica de confidentialitate generica | Privacy notice | High | direct | in_app_guided | user | marcheaza zonele lipsa, propune actualizare | completeaza diferentele reale | generated_document + confirmation | partial | document actualizat + confirmare |
| GDPR-003 | GDPR | Politica de cookies lipsa | Cookies | Medium / High | direct | in_app_guided | user | genereaza draft de politica / copy | completeaza si publica | generated_document + public_link | partial | document + link / screenshot |
| GDPR-004 | GDPR | Trackere nenecesare fara consimtamant | Cookies / website | High | direct | external_action | user / web dev | detecteaza trackere, explica problema, cere rescan | configureaza banner / blocare trackere | screenshot + system_recheck | yes | dovada + rescan curat |
| GDPR-005 | GDPR | Banner de cookies neconform | Cookies | Medium / High | direct | external_action | user / web dev | explica lipsa / problema | corecteaza implementarea | screenshot + system_recheck | yes | screenshot + rescan |
| GDPR-006 | GDPR | Baza legala neclara pentru prelucrare | Legal basis | Medium | inferred | in_app_guided | user | propune structura, pune intrebarile corecte | confirma baza legala reala | confirmation + updated_document | no | confirmare + document actualizat |
| GDPR-007 | GDPR | Consimtamant invalid sau incomplet | Consent | High | direct / inferred | external_action | user | explica ce lipseste, propune wording | corecteaza formularul / fluxul | screenshot + updated_document | partial | dovada formular actualizat |
| GDPR-008 | GDPR | Registru Art.30 lipsa | Records of processing | High | inferred | in_app_guided | user | genereaza registru, precompleteaza ce stie | completeaza activitatile reale | generated_document + confirmation | no | registru generat + confirmare |
| GDPR-009 | GDPR | Registru Art.30 incomplet | Records of processing | Medium | direct / inferred | in_app_guided | user | marcheaza campuri lipsa | completeaza zonele lipsa | generated_document + confirmation | no | registru completat + confirmare |
| GDPR-010 | GDPR | DPA lipsa pentru vendor cunoscut | Vendor / processor | High | direct / inferred | in_app_full / in_app_guided | user | propune DPA / template / link vendor | confirma relatia si semneaza / incarca | vendor_document | partial | DPA incarcat + confirmare |
| GDPR-011 | GDPR | DPA expirat / neverificat | Vendor / processor | Medium / High | direct | external_action | user | semnaleaza expirarea, cere revalidare | obtine / reinnoieste DPA | vendor_document | partial | document nou incarcat |
| GDPR-012 | GDPR | Subprocesatori netransparenti | Vendor / transparency | Medium | inferred | in_app_guided | user | genereaza lista / sectiune politica | confirma vendorii reali | confirmation + updated_document | no | lista validata + document actualizat |
| GDPR-013 | GDPR | Cerere de acces activa | Data subject rights | High | direct | in_app_guided / external_action | user | creeaza caz, calculeaza deadline, genereaza draft raspuns | verifica identitatea, trimite raspunsul | email_sent / uploaded_file | no | dovada trimiterii + status final |
| GDPR-014 | GDPR | Cerere de stergere activa | Data subject rights | High | direct | in_app_guided / external_action | user | structureaza raspunsul, logheaza cazul | executa stergerea reala / raspunsul | email_sent + manual_attestation | no | dovada raspunsului + confirmare |
| GDPR-015 | GDPR | Cerere DSAR depasita | Data subject rights | Critical | direct | external_action | user | semnaleaza urgenta, pregateste raspuns tardiv / note | trimite raspuns si documenteaza motivul | email_sent + note | no | raspuns trimis + explicatie |
| GDPR-016 | GDPR | Retentie date neclara | Retention | Medium | inferred | in_app_guided | user | genereaza matrice / policy de retentie | confirma duratele reale | generated_document + confirmation | no | matrice salvata |
| GDPR-017 | GDPR | Stergere date neimplementata | Retention / deletion | High | inferred | external_action | user | explica pasii, cere dovada procesului | aplica procesul real | screenshot / manual_attestation | partial | dovada + confirmare |
| GDPR-018 | GDPR | Transfer international netransparent | International transfer | Medium / High | direct / inferred | in_app_guided | user | genereaza sectiuni / checklist | confirma vendorii si temeiul transferului | confirmation + vendor_document | no | confirmare + documentatie |
| GDPR-019 | GDPR | Bresa de date cu impact pe date personale | Breach | Critical | direct | external_action | user / dpo | creeaza incident, pregateste draft ANSPDCP, logheaza | decide notificarea, trimite manual | official_reference / email_sent / uploaded_file | no | dovada trimiterii sau rationament documentat |
| GDPR-020 | GDPR | Lipsa dovezii pentru finding GDPR rezolvat | Evidence | Medium / High | direct | user_attestation / external_action | user | cere artifactul lipsa | incarca / confirma dovada | uploaded_file / screenshot / public_link | partial | dovada prezenta si legata de finding |

---

# 2. NIS2

| ID | Framework | Finding title | Category | Typical severity | Signal type | Resolution mode | Primary actor | What CompliScan can do | What user must do | Required evidence | Auto recheck | Closing rule |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NIS2-001 | NIS2 | Eligibilitate NIS2 neclara | Applicability | High | inferred | user_attestation / in_app_guided | user | ruleaza wizard de eligibilitate | confirma sector, dimensiune, rol | confirmation | no | rezultat eligibilitate salvat |
| NIS2-002 | NIS2 | Firma posibil eligibila, dar neverificata | Applicability | High | inferred | in_app_guided | user | cere verificarea aplicabilitatii | completeaza datele lipsa | confirmation | no | verificare finalizata |
| NIS2-003 | NIS2 | Inregistrare DNSC lipsa | Registration | High | direct / inferred | external_action | user | prefill formular, draft, checklist | trimite manual si adauga dovada | official_reference / uploaded_file | no | dovada trimiterii |
| NIS2-004 | NIS2 | Inregistrare DNSC incompleta | Registration | Medium / High | direct | external_action | user | arata campurile lipsa | completeaza si retrimite | official_reference / uploaded_file | no | campuri completate + dovada |
| NIS2-005 | NIS2 | Assessment NIS2 neinceput | Assessment | High | direct / inferred | in_app_guided | user | deschide assessment-ul, propune raspunsuri unde poate | completeaza si confirma | confirmation | no | assessment salvat |
| NIS2-006 | NIS2 | Assessment NIS2 incomplet | Assessment | High | direct | in_app_guided | user | marcheaza zonele lipsa | completeaza raspunsurile ramase | confirmation | no | assessment complet |
| NIS2-007 | NIS2 | Dovezi insuficiente pentru controale NIS2 | Evidence | High | direct / inferred | in_app_guided / external_action | user | cere dovezi pe control | incarca dovezile reale | uploaded_file / screenshot | no | dovezi atasate pe controale |
| NIS2-008 | NIS2 | Roluri / responsabilitati NIS2 neclare | Governance | Medium | inferred | user_attestation / in_app_guided | owner / dpo | genereaza structura de roluri / policy | confirma cine raspunde | confirmation + generated_document | no | roluri confirmate |
| NIS2-009 | NIS2 | Training NIS2 lipsa | Governance / awareness | Medium | inferred | external_action | owner | explica cerinta si cere dovada | organizeaza trainingul real | uploaded_file / manual_attestation | no | dovada training |
| NIS2-010 | NIS2 | Backup / recovery neverificat | Technical measure | High | direct / inferred | user_attestation / external_action | user / IT | cere informatie, explica de ce conteaza | testeaza sau confirma backup-ul | manual_attestation / screenshot | no | confirmare + dovada |
| NIS2-011 | NIS2 | MFA lipsa sau neverificata | Technical measure | High | direct / inferred | external_action | user / IT | explica remedierea | activeaza si revine cu dovada | screenshot | partial | dovada + recheck unde posibil |
| NIS2-012 | NIS2 | Logging / monitoring insuficient | Technical measure | Medium / High | inferred | external_action | user / IT | cere clarificari si checklist | implementeaza sau documenteaza | screenshot / uploaded_file | no | dovada atasata |
| NIS2-013 | NIS2 | Furnizor critic neverificat | Supply chain | High | direct / inferred | in_app_guided | user | deschide vendor review, cere docs | confirma criticitatea si incarca docs | vendor_document | partial | vendor review complet |
| NIS2-014 | NIS2 | Furnizor critic fara dovezi | Supply chain | High | direct | external_action / in_app_guided | user | cere documente minime | colecteaza dovezile | vendor_document | partial | documente atasate |
| NIS2-015 | NIS2 | Incident activ fara Early Warning | Incident | Critical | direct | external_action | user / dpo | genereaza draft 24h | trimite manual si adauga referinta | official_reference / uploaded_file | no | dovada trimiterii |
| NIS2-016 | NIS2 | Incident activ fara raport 72h | Incident | Critical | direct | external_action | user / dpo | genereaza draft 72h | trimite manual | official_reference / uploaded_file | no | dovada trimiterii |
| NIS2-017 | NIS2 | Incident fara raport final / progres | Incident | High / Critical | direct | external_action | user / dpo | pregateste raport final sau progres | trimite manual | official_reference / uploaded_file | no | dovada trimiterii |
| NIS2-018 | NIS2 | Corespondenta DNSC lipsa | Incident tracking | Medium | direct | external_action | user | cere upload / log | adauga raspunsurile primite | uploaded_file | no | corespondenta salvata |
| NIS2-019 | NIS2 | Maturitate NIS2 scazuta pe domenii cheie | Maturity | Medium / High | inferred | in_app_guided | user | arata domeniile slabe si top actiuni | incepe task-urile prioritare | confirmation / uploaded_file | no | top gaps transformate in actiuni |

---

# 3. eFactura / ANAF / SPV

| ID | Framework | Finding title | Category | Typical severity | Signal type | Resolution mode | Primary actor | What CompliScan can do | What user must do | Required evidence | Auto recheck | Closing rule |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EF-001 | eFactura | SPV lipsa / neverificat | SPV | High | direct / inferred | external_action | user | explica pasii, cere dovada activarii | activeaza SPV | screenshot / official_reference | partial | dovada activarii |
| EF-002 | eFactura | SPV activ, dar flux neverificat | SPV | Medium | direct / inferred | external_action | user | cere o verificare operationala | testeaza fluxul | screenshot | partial | test confirmat |
| EF-003 | eFactura | Factura respinsa ANAF | Invoice error | High | direct | external_action | user | afiseaza motivul si actiunea recomandata | corecteaza in ERP / soft | xml / screenshot | yes | status nou valid sau dovada corectiei |
| EF-004 | eFactura | Eroare XML / UBL nerezolvata | Invoice error | High | direct | external_action | user | explica eroarea | corecteaza si retransmite | xml / screenshot | yes | validare noua / dovada |
| EF-005 | eFactura | Factura netrimisa in termen | Operational | High | direct / inferred | external_action | user | semnaleaza intarzierea | transmite factura corect | screenshot / official_reference | partial | dovada transmiterii |
| EF-006 | eFactura | Factura duplicata / conflict de status | Operational | Medium / High | direct | external_action | user | explica riscul si pasii | investigheaza si corecteaza | screenshot / note | partial | status clarificat |
| EF-007 | eFactura | Factura procesata gresit pe partea de cumparator | Buyer risk | High | inferred | external_action | user / accountant | explica riscul si cere dovada procedurii | corecteaza fluxul intern | manual_attestation / uploaded_file | no | procedura / confirmare |
| EF-008 | eFactura | Discrepanta e-TVA / notificare conformare | Fiscal signal | High | direct | external_action | user / accountant | afiseaza semnalul si cere raspuns | raspunde / corecteaza | uploaded_file / official_reference | no | dovada raspunsului |
| EF-009 | eFactura | CUI invalid / date fiscale inconsistente | Data quality | Medium | direct | in_app_guided / external_action | user | normalizeaza si arata problema | confirma datele corecte | confirmation | partial | date corectate |
| EF-010 | eFactura | Lipsa dovezii de remediere pentru finding fiscal | Evidence | Medium / High | direct | user_attestation / external_action | user | cere artifactul lipsa | incarca dovada | screenshot / xml / uploaded_file | partial | dovada atasata |

---

# 4. AI Act / AI Inventory

| ID | Framework | Finding title | Category | Typical severity | Signal type | Resolution mode | Primary actor | What CompliScan can do | What user must do | Required evidence | Auto recheck | Closing rule |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AI-001 | AI Act | Sistem AI nedeclarat in inventar | Inventory | High | direct / inferred | in_app_guided | user | propune intrarea in inventar | confirma si completeaza | confirmation | no | sistem salvat in inventar |
| AI-002 | AI Act | Shadow AI detectat | Inventory / shadow AI | High | direct / inferred | in_app_guided / external_action | user | semnaleaza tool-ul si cere review | confirma utilizarea si contextul | confirmation / vendor_document | no | tool clarificat |
| AI-003 | AI Act | Clasificare de risc lipsa | Classification | High | inferred | in_app_guided | user | propune clasificare | confirma scopul si contextul real | confirmation | no | clasificare confirmata |
| AI-004 | AI Act | Clasificare de risc incerta | Classification | Medium / High | inferred | in_app_guided | user / dpo | explica de ce e incert | completeaza datele lipsa | confirmation | no | clasificare decisa |
| AI-005 | AI Act | Human oversight nedefinit | Governance / transparency | High | inferred | in_app_guided / user_attestation | owner / dpo | genereaza checklist / policy | confirma cine aproba si cum | confirmation + generated_document | no | oversight definit |
| AI-006 | AI Act | Transparency / disclosure lipsa | Transparency | Medium / High | inferred | in_app_guided | user | genereaza draft disclosure / policy update | confirma si publica unde e cazul | generated_document + public_link | partial | disclosure salvat |
| AI-007 | AI Act | Annex IV / documentatie tehnica lipsa | Documentation | High | inferred | in_app_guided | user | genereaza draft documentatie | completeaza datele tehnice reale | generated_document + confirmation | no | documentatie salvata |
| AI-008 | AI Act | EU Database readiness lipsa | Registration readiness | High | inferred | in_app_guided / external_action | user | pregateste datele si exportul | confirma si depune manual unde e cazul | generated_document / uploaded_file | no | export gata sau depunere documentata |
| AI-009 | AI Act | Vendor AI fara review | Vendor review | High | direct / inferred | in_app_guided / external_action | user | deschide review, cere docs | confirma utilizarea si incarca docs | vendor_document | partial | vendor review complet |
| AI-010 | AI Act | Lipsa dovezii pentru controale AI | Evidence | Medium | direct / inferred | external_action / user_attestation | user | cere dovada controlului | incarca sau confirma | uploaded_file / manual_attestation | no | dovada atasata |

---

# 5. Transversal / Evidence / Trust / Vault

| ID | Framework | Finding title | Category | Typical severity | Signal type | Resolution mode | Primary actor | What CompliScan can do | What user must do | Required evidence | Auto recheck | Closing rule |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SYS-001 | Cross | Finding rezolvat fara dovada | Evidence | High | direct | user_attestation / external_action | user | blocheaza inchiderea finala si cere dovada | incarca dovada | uploaded_file / screenshot / public_link | partial | dovada atasata |
| SYS-002 | Cross | Dovada veche / needs revalidation | Revalidation | Medium | direct | user_attestation / external_action | user | ridica finding de revalidare | reconfirma / reinnoieste | confirmation / uploaded_file | partial | data noua de review |
| SYS-003 | Cross | Artifact lipsa din Vault | Evidence | Medium | direct | external_action | user | cere atasarea artifactului | adauga artifactul | uploaded_file | no | artifact prezent |
| SYS-004 | Cross | Artifact fara owner / data / versiune | Evidence quality | Low / Medium | direct | in_app_guided | user | cere completarea metadatelor | completeaza metadatele | confirmation | no | metadate complete |
| SYS-005 | Cross | Audit Pack incomplet | Auditability | Medium / High | direct / inferred | in_app_guided / external_action | user | arata ce lipseste din pack | completeaza lipsurile | uploaded_file / generated_document | partial | pack complet |
| SYS-006 | Cross | Trust Center neactualizat | External credibility | Low / Medium | direct / inferred | in_app_guided / external_action | user | semnaleaza elementele invechite | actualizeaza datele / share links | confirmation / public_link | partial | trust data actualizata |

---

# 6. Reguli finale de folosire a librariei

## Regula 1
Fiecare finding nou trebuie mapat la unul din aceste tipuri sau la o extensie a lor.

## Regula 2
Niciun finding nu intra in UI fara:
- severity
- resolution mode
- required evidence
- closing rule

## Regula 3
Daca nu exista closing rule clar, finding-ul nu este matur.

## Regula 4
Daca o categorie noua apare des, se promoveaza din finding generic in finding type dedicat.

## Regula 5
Orice finding trebuie sa poata raspunde la 3 intrebari in UI:
1. Ce a gasit CompliScan?
2. Ce poate face CompliScan acum?
3. Ce trebuie sa faca userul ca sa inchida cazul?

---

# 7. Concluzie

Aceasta librarie este punctul de adevar pentru:
- designul cockpit-ului
- logica de resolve
- regulile de dovada
- statusurile de lucru
- criteriile de inchidere
- recheck si revalidation

Daca Smart Cockpit-ul se construieste pe aceasta librarie, CompliScan nu mai pare un simplu checklist.
Pare un sistem care:
- gaseste
- explica
- ghideaza
- cere dovada corecta
- revalideaza
- pastreaza totul la dosar
