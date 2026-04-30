# DPA CompliScan ↔ DPO Complet — document semnabil pilot

**Status:** document semnabil client-ready, necesită completare date societate și semnătură
**Versiune:** 2026.04-pilot  
**Părți:** CompliScan `[date societate de completat]` și DPO Complet `[date societate de completat]`  
**Rol:** CompliScan acționează ca furnizor/processor pentru cabinetul DPO în limita serviciilor platformei.

Acest document este forma semnabilă a acordului de prelucrare date pentru pilot. Nu este semnat automat și nu înlocuiește revizia juridică.

## 1. Scopul procesării

CompliScan procesează date doar pentru furnizarea platformei de lucru folosite de cabinet:

- organizare portofoliu clienți;
- workflow documente și approvals;
- magic links pentru aprobare, comentariu sau respingere;
- evidence ledger și traceability matrix;
- rapoarte lunare;
- export Audit Pack și export cabinet.

## 2. Categorii de date

Date potențial procesate în pilot:

- date utilizatori cabinet: nume, email, rol;
- date contacte client: nume, email, funcție, organizație;
- metadata workspace: nume client, statusuri, scoruri, task-uri;
- metadata documente: titlu, tip, status, versiune;
- artefacte evidence încărcate de cabinet;
- evenimente operaționale: approval, rejection, comment, upload, validation, export.

Pilotul trebuie pornit cu date pseudonimizate acolo unde este posibil.

## 3. Date care NU trebuie introduse în pilot fără acord explicit

- date medicale brute;
- CNP-uri sau copii acte identitate;
- dosare de angajați;
- date bancare sensibile;
- parole, secrete API, chei private;
- documente care conțin categorii speciale fără pseudonimizare.

## 4. Subprocessori

Subprocessorii sunt listați separat în `02-Subprocessors.md`. Lista trebuie atașată DPA-ului semnat înainte de producție.

Pentru pilotul standard DPO:

- Supabase production este storage-ul țintă pentru date reale;
- Mistral AI este provider-ul AI preferat dacă AI este activat;
- Google Gemini este dezactivat implicit pentru pilotul DPO;
- Resend este opțional și poate rămâne OFF pentru clienți sensibili.

## 5. AI processing

AI este configurabil ON/OFF per client/workspace.

- AI OFF: documentele se generează template-only, fără apel către provider AI.
- AI ON: se trimit doar prompturi minime și context strict necesar.
- Evidence files brute nu se trimit către AI.
- Conținutul clientului nu este folosit de CompliScan pentru training de modele proprii.
- Orice document generat rămâne draft de lucru și cere validare profesională.

## 6. Securitate și acces

CompliScan aplică:

- roluri explicite: owner, partner_manager, compliance, reviewer, viewer;
- audit trail pentru approvals, comments, rejections, evidence și baseline;
- magic links cu token unic;
- export cabinet/client;
- evidence soft delete cu motiv și restore window;
- hard delete owner-only.

Detaliile sunt în `03-Security-and-Hosting.md`.

## 7. Retenție, export și ștergere

La cererea cabinetului:

1. se generează export complet cabinet/client;
2. se confirmă descărcarea exportului;
3. se inițiază ștergere conform politicii agreate;
4. se păstrează event ledger minim necesar pentru dovada operațiunilor, conform termenilor semnați.

Detaliile sunt în `04-Backup-Retention-Deletion.md`.

## 8. Incident response

Dacă apare un incident care poate afecta datele cabinetului sau ale clienților săi, CompliScan notifică fără întârziere nejustificată contactul desemnat al cabinetului.

Notificarea trebuie să includă:

- natura incidentului;
- categoriile de date potențial afectate;
- măsurile aplicate;
- pașii următori;
- informații disponibile pentru evaluarea obligațiilor de notificare.

## 9. Export și portabilitate

Cabinetul poate solicita:

- export client Audit Pack;
- export complet cabinet;
- export rapoarte lunare;
- export template-uri cabinet;
- export event/evidence ledger.

## 10. Limitări

CompliScan nu certifică, nu emite atestări și nu înlocuiește consultantul DPO, avocatul, auditorul sau autoritatea.

Platforma organizează workflow-ul, documentele, dovezile și raportarea. Validarea profesională rămâne la cabinetul DPO.

## 11. Semnături

**CompliScan**  
Reprezentant: `[nume]`  
Funcție: `[funcție]`  
Data: `[data]`  
Semnătură: `[semnătură]`

**DPO Complet**  
Reprezentant: `[nume]`  
Funcție: `[funcție]`  
Data: `[data]`  
Semnătură: `[semnătură]`
