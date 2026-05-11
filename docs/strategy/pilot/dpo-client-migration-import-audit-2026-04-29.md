# DPO Client Migration Import Audit — 29 apr 2026

Status: operational truth pentru pilot DPO Complet.
Scope: strict DPO consultant / cabinet DPO. Nu include full NIS2, DORA, fiscal, pay transparency sau compliance officer intern.

## Update 30 apr 2026 — Migration Hub v1 implementat

Gap-ul de migrare istorică nu mai este doar plan. `DPO Migration Hub v1` este implementat în cod și inclus în hard-gate-ul `npm run smoke:dpo-sale-readiness`.

Acum Diana poate importa structurat, pentru un client pilot:

- registru DSAR istoric;
- RoPA Art. 30 istoric ca draft de revizie;
- vendor/DPA register istoric;
- training tracker GDPR;
- breach/incident log cu date personale, inclusiv finding ANSPDCP 72h;
- aprobări istorice email/Word ca dovadă istorică, fără să fie prezentate fals drept magic-link nativ;
- arhive evidence ca import/arhivă urmărită.

Validare runtime: `smoke:dpo-sale-readiness` -> 51/51 PASS, inclusiv import istoric + document DPA + magic link + evidence + Dosar + raport lunar + audit pack + export cabinet.

## Raspuns scurt

Diana poate importa portofoliul de firme si poate incepe munca DPO pentru o firma noua in CompliScan.

Diana poate importa acum istoricul operational esential al cabinetului ca date structurate sau ca arhiva urmarita. Nu promitem inca clasificare automata pentru un Drive intreg aruncat ca ZIP, dar registrele principale ale muncii DPO sunt acoperite v1.

Verdict pentru pilot:

- DA: import portofoliu + scan + workflow nou pentru 1-2 clienti.
- DA: import template-uri cabinet .docx/.md/.txt.
- DA: atasare dovezi importante pe task-uri/finding-uri.
- DA v1: import istoric DSAR / RoPA / vendor-DPA / training / breach / aprobari istorice.
- PARTIAL: clasificare automata a unui Drive/ZIP complet si legare automata perfecta la toate finding-urile.
- NU promitem in pilot: "arunca tot Drive-ul si il clasificam perfect fara confirmare DPO".

Mesaj corect pentru Diana:

> Importam portofoliul, template-urile si registrele tale esentiale. Ce putem mapa sigur intra structurat; ce vine ca dovada istorica ramane marcat clar ca istoric/arhiva, fara promisiuni false.

## Ce foloseste Diana azi

Profil realist: consultant DPO extern cu 5-30 clienti IMM/institutii/clinici/e-commerce/servicii profesionale.

Pe baza rolului DPO descris de GDPR Art. 39 si ANSPDCP, Diana are in lucru:

- Lista clienti: Excel / Google Sheets cu nume firma, CUI, contact, domeniu, numar angajati, status abonament.
- Foldere per client: Google Drive / OneDrive / Dropbox / local, cu subfoldere `Contracte`, `RoPA`, `DPA`, `DSAR`, `Training`, `Website`, `Incident`, `Rapoarte`.
- Template-uri Word: DPA, privacy policy, cookie policy, RoPA, procedura DSAR, raspuns DSAR, retention policy, notificare incident, raport lunar, proces verbal training.
- Registre Excel: RoPA Art. 30, cereri DSAR, vendor/DPA register, training tracker, incidente/breach log.
- Email: trimite documente, cere aprobari, primeste observatii, pastreaza dovezi in inbox.
- Calendar/reminders: DSAR 30 zile, breach 72h, review trimestrial, raport lunar.
- Portal ANSPDCP: declarare DPO si notificare bresa RGPD.
- Legal research: Lege5/Indaco/legislatie/ANSPDCP/EDPB, dupa caz.
- Semnatura/eIDAS: DocuSign/Adobe/Namirial/CertSign/DigiSign, daca are clienti care cer semnatura formala.

Ce produce lunar:

- Ce am lucrat pentru client.
- Ce documente au fost generate/revizuite.
- Ce client trebuie sa aprobe.
- Ce dovezi exista si ce lipseste.
- Ce deadline-uri sunt aproape sau depasite.
- Ce dosar poate fi aratat la control/audit si ce ramane de remediat.

## Ce poate importa CompliScan azi

| Obiect Diana | Import azi | Status | Observatie |
|---|---:|---|---|
| Lista clienti Excel/CSV | DA | structurat | `app/api/partner/import/preview` accepta `.xlsx`, `.xls`, `.csv`; fuzzy mapping pe nume firma, CUI, sector, angajati, email, website. |
| CUI / firma / sector / angajati | DA | structurat | `execute` creeaza organizatii, profile, applicability si white-label client. |
| ANAF / website baseline | DA | structurat | `baseline-scan` ruleaza CUI/website signals si genereaza findings initiale. |
| Template-uri cabinet Word/Markdown/Text | DA | structurat | `app/api/cabinet/templates`; suporta `.docx`, `.md`, `.txt`. Am adaugat `dsar-response` si detectie variabile mix-case. |
| DPA / privacy / cookie / RoPA template | DA | structurat ca template | Se pot folosi la generare; nu inseamna automat import RoPA istoric pe campuri. |
| Dovezi PDF/DOCX/ZIP/imagini/log/csv/json | DA | atasare pe task | `app/api/tasks/[id]/evidence` accepta fisiere comune si le leaga de task/evidence ledger. |
| Cerere DSAR noua | DA | structurat | `app/api/dsar` creeaza cerere, deadline 30 zile si draft raspuns. |
| Training GDPR nou | DA | structurat | `app/api/gdpr/training` creeaza/actualizeaza training record. |
| Raport lunar nou | DA | generat | `app/api/partner/reports/monthly` produce preview/HTML pe activitate reala. |
| Export cabinet + clienti | DA | structurat JSON | `app/api/partner/export` exporta cabinet, white-label, template-uri, clienti, DSAR, vendor reviews, security pack. |
| Audit Pack client | DA | export/dosar | Audit Pack exista, dar trebuie verificat per scenariu ca starea dashboard/report/audit pack ramane sincronizata. |

## Ce NU poate importa inca 100% structurat

Acestea sunt gap-uri de migrare, nu de thesis. Sunt exact ce trebuie construit ca "DPO Client Migration Wizard".

| Obiect Diana | Status azi | De ce conteaza |
|---|---|---|
| DSAR log istoric din Excel | DA v1 | Bulk import CSV/XLS cu deduplicare pe email + tip + data. |
| RoPA istoric complet | DA v1 | Import structurat ca document RoPA draft, cu activitati/scop/temei/categorii/destinatari/retentie/masuri. |
| Vendor/DPA register istoric | DA v1 | Import in vendor review workbench: furnizor, DPA status, transfer, review date, dovada. |
| Training tracker istoric | DA v1 | Import CSV/XLS in `gdprTraining`, cu data/status/dovada si tip audienta. |
| Breach/incident log istoric | DA v1 | Import in NIS2/incident store; daca implica date personale, creeaza finding ANSPDCP 72h. |
| Email approvals vechi | DA v1 istoric | Devin documente/dovezi istorice marcate explicit; nu sunt prezentate drept magic-link native. |
| Foldere Drive intregi | NU structurat | Pot fi importate ca ZIP evidence/archive, dar nu exista clasificare automata per document type + legare la finding-uri. |
| Rapoarte lunare vechi | PARTIAL | Pot fi atasate ca documente, dar nu devin activitati istorice lunare decat daca sunt importate/marcate manual. |
| Semnaturi digitale/eIDAS | NU | CompliScan nu inlocuieste DocuSign/Namirial/CertSign; magic link inseamna aprobare trasabila, nu semnatura calificata. |

## Flow real de testare pentru o firma noua

Acesta este flow-ul pe care trebuie sa il ruleze Diana/noi in browser live, nu un test generic de module:

1. Diana exporta din Excel/Google Sheets 3 firme cu coloanele ei reale, nu formatul nostru.
2. Importa fisierul in CompliScan.
3. Verifica auto-mapping: nume firma, CUI, sector, angajati, email, website.
4. Ruleaza baseline scan dupa import.
5. Verifica dashboard client: findings GDPR, Legea 190/2018/CNP unde e cazul, training GDPR, DPA/vendor, RoPA, cookie/website.
6. Incarca 3 template-uri proprii: DPA, raspuns DSAR, raport lunar.
7. Creeaza o cerere DSAR noua si verifica deadline 30 zile + draft.
8. Rezolva un finding: genereaza document, trimite magic link, client aproba/respinge/comenteaza.
9. Ataseaza dovada externa: PDF/DOCX/screenshot/ZIP.
10. Inchide finding-ul si verifica evidence ledger + traceability.
11. Genereaza raport lunar client-facing.
12. Genereaza Audit Pack / dosar de lucru.
13. Exporta clientul si cabinetul.
14. Verifica daca un DPO real poate explica traseul fara sa caute in email.

Acceptanta:

- Fiecare obiect introdus trebuie sa se regaseasca intr-un loc clar: client, task, DSAR, template, evidence, report sau export.
- Daca un obiect intra doar ca arhiva, UI trebuie sa spuna "importat ca arhiva, nu structurat".
- Nu trebuie sa existe promisiunea falsa ca toate registrele vechi devin automat entitati structurate.

## Ce ramane pentru migrare completa

`DPO Migration Hub v1` acopera registrele principale. Ce ramane pentru un cabinet mare nu este "import CSV", ci migrare asistata de arhiva:

1. Evidence archive classifier
   - Upload ZIP/Drive export.
   - Clasificare asistata: DPA / RoPA / DSAR / training / policy / incident / other.
   - Diana confirma maparea inainte sa intre in dosar.

2. Historical monthly reports import
   - Rapoarte vechi atasate la client si luna.
   - Marcate clar ca "istoric importat", nu activitate generata de CompliScan.

3. Approval history enrichment
   - V1 importa aprobarile ca dovada istorica.
   - V2 poate extrage automat aprobator, data, fisier sursa si hash din email/PDF/EML, dar tot fara sa pretinda magic-link nativ.

4. UI polish pentru migration QA
   - Preview per rand cu warnings.
   - Confirmare finala "structurat" vs "arhiva".
   - Raport post-import pe client, pregatit pentru audit trail.

## Verdict cumparare

Diana cumpara pilot daca promisiunea e:

> Importam portofoliul tau, template-urile tale si 1-2 clienti pilot. Pentru acesti clienti facem aprobarile, dovezile, raportul lunar si dosarul audit-ready mai curate decat in email/Drive.

Diana respinge daca promisiunea e:

> Muta tot cabinetul si tot istoricul tau in CompliScan de azi.

De ce: migrarea completa inseamna risc profesional. Trebuie facuta gradual, pe 30-60 zile, cu export/offboarding si fara pierdere de istoric.

## Decizie operationala

Pentru testul Diana/noi live:

- Testam intai import portofoliu + firma noua + workflow nou.
- Nu testam inca "migreaza tot Drive-ul vechi".
- Pentru primul client pilot, importam manual/semistructurat:
  - lista firma,
  - 3 template-uri cabinet,
  - 3-5 documente/dovezi critice,
  - 1 DSAR,
  - 1 vendor/DPA,
  - 1 raport lunar,
  - 1 audit pack.

Aceasta este calea sanatoasa catre DPO-ready vandabil.

## Surse externe folosite

- ANSPDCP — Responsabilul cu protectia datelor: https://www.dataprotection.ro/?page=Responsabilul_cu_protectia_datelor
- ANSPDCP — formulare operatori, declarare DPO si notificare bresa RGPD: https://www.dataprotection.ro/?page=Aplicarea_Noului_Regulament_General_privind_Protectia_Datelor_in_sectorul_public_-_obligatii_si_responsabilitati
- GDPR Art. 39 — sarcinile DPO: https://gdpr-info.eu/art-39-gdpr/
- GDPR Complet — servicii DPO externalizat: https://gdprcomplet.ro/
- LegalUp — servicii GDPR/DPO, documentatie, training, DSAR si incidente: https://legalup.ro/servicii-gdpr/
- Decalex MyDPO — document management, training hub, RoPA si registre cereri: https://decalex.ro/mydpo
