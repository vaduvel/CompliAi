# Raport de Audit Tehnic Aprofundat ("The Detective's Report")

**Data:** 2026-03-13
**Analist:** Gemini Code Assist

## Cazul CompliScan

Acest raport nu este un audit de suprafață. Este o investigație meticuloasă a întregului proiect, tratând fiecare fișier ca pe o probă și fiecare linie de cod ca pe o mărturie. Am căutat nu doar erori evidente, ci și tensiuni arhitecturale, slăbiciuni logice și "crime" de implementare care, deși tăcute acum, pot compromite întregul caz în viitor.

---

### 🚨 Cazul #1: Fantoma din Mașinărie (Securitate & Identitate)

Aici se ascund cele mai mari riscuri existențiale. Securitatea nu este un feature, este fundația pe care se construiește încrederea.

**Proba A: Sesiunea care nu poate fi revocată**
- **Fișier:** `lib/server/auth.ts`
- **Modus Operandi:** Sistemul de autentificare (`createSessionToken`, `verifySessionToken`) folosește un token semnat simetric (HMAC), care este valid până la expirare (`SESSION_TTL_MS`).
- **Slăbiciune:** **Nu există un mecanism de revocare a sesiunii.** Dacă un token este compromis (ex: XSS, laptop furat), atacatorul are acces deplin timp de până la 7 zile, chiar dacă utilizatorul își schimbă parola. Pentru un produs de conformitate, acest lucru este inacceptabil.
- **Soluție:** Implementarea unei liste de revocare (ex: în Redis sau DB) sau, mai simplu, reducerea drastică a TTL-ului sesiunii și implementarea unui mecanism de refresh token.

**Proba B: IDOR-ul din Header rămâne activ**
- **Fișier:** `app/api/agent/commit/route.ts`
- **Modus Operandi:** Endpoint-ul încă se bazează pe `x-compliscan-org-id` din header, cu un `FIXME` care confirmă vulnerabilitatea.
- **Slăbiciune:** Aceasta nu este o problemă minoră. Este o ușă deschisă. Orice request direct către API poate manipula datele oricărei organizații.
- **Soluție:** Validarea server-side a sesiunii active (`getServerSession`) față de `orgId` trebuie să devină o prioritate P0. Nu este negociabil.

**Proba C: Cheia secretă cu fallback periculos**
- **Fișier:** `lib/server/auth.ts`
- **Modus Operandi:** `getSecret()` returnează un string hardcodat (`"dev-secret-change-me-in-production"`) dacă variabila de mediu lipsește.
- **Slăbiciune:** În haosul unui deployment, este foarte ușor să se omită o variabilă de mediu. A avea un fallback previzibil în producție înseamnă că oricine poate falsifica sesiuni.
- **Soluție:** Aplicația trebuie să crape la pornire (`throw new Error`) dacă `COMPLISCAN_SESSION_SECRET` lipsește în `NODE_ENV=production`.

---

### 💾 Cazul #2: Fundația de Nisip (Integritate Date & Stare)

Aici am găsit probleme care nu doar pierd date, ci le pot corupe în moduri subtile și greu de depanat.

**Proba A: Monolitul de stat și iluzia vitezei**
- **Fișiere:** `lib/server/mvp-store.ts` (implicit), `app/api/agent/commit/route.ts`
- **Modus Operandi:** Modelul `readState() -> modify -> writeState()` încarcă întregul `ComplianceState` în memorie la fiecare scriere.
- **Slăbiciune:** Pe lângă riscul de race condition (menționat anterior), acest model va degrada performanța exponențial. Mai rău, crește complexitatea oricărei modificări, deoarece întregul graf de obiecte trebuie menținut consistent în memorie.
- **Soluție:** Migrarea la Supabase (planificată în Sprint 5) este vitală. Dar trebuie făcută corect: nu prin scrierea aceluiași blob JSON într-un rând de tabel, ci prin normalizarea stării în tabele relaționale (`findings`, `drifts`, `systems`, etc.) și folosirea tranzacțiilor atomice pentru update-uri.

**Proba B: Crima din Regex (Validatorul e-Factura)**
- **Fișier:** `lib/compliance/efactura-validator.ts`
- **Modus Operandi:** Funcțiile `findTagValue`, `hasTag`, `countTags` folosesc expresii regulate pentru a parsa XML.
- **Slăbiciune:** **XML-ul nu este un limbaj regulat.** Aceasta este o "crimă" clasică de implementare. Un XML valid, dar cu atribute, spații de nume sau comentarii neașteptate, va sparge complet validatorul. Acesta nu este un risc teoretic; este o certitudine.
- **Soluție:** Înlocuirea imediată a regex-ului cu un parser XML robust (ex: `fast-xml-parser`). Altfel, la prima factură reală mai complexă, funcționalitatea va pica.

---

### 🧠 Cazul #3: Logica Defectuoasă (Motor de Analiză & Agenți)

Aici am investigat "inteligența" sistemului și am găsit mai multă euristică decât raționament.

**Proba A: Agentul care nu înțelege negația**
- **Fișier:** `lib/compliance/agent-runner.ts`
- **Modus Operandi:** Detecția se bazează pe `text.includes("scoring")`.
- **Slăbiciune:** Dacă un document de politici interne spune "Este interzisă folosirea sistemelor de credit scoring fără aprobare", agentul va detecta "High-Risk Scoring System". Nu înțelege contextul sau negația.
- **Soluție:** Pentru "precizie chirurgicală", motorul trebuie să treacă de la `includes` la o analiză de sentiment minimală sau la căutarea unor tipare de utilizare activă (ex: "folosim X pentru scoring" vs. "politica despre scoring").

**Proba B: Baseline-ul fantomă**
- **Fișier:** `lib/compliance/agent-runner.ts`
- **Modus Operandi:** `runDriftAgent` compară cu un baseline hardcodat (`before: { risk_class: "limited" }`).
- **Slăbiciune:** Agentul nu știe care este baseline-ul *real*, validat de utilizator. Acest lucru face ca detectarea drift-ului să fie fundamental nesigură și poate genera alerte false care erodează încrederea utilizatorului.
- **Soluție:** `SourceEnvelope` trebuie îmbogățit pentru a conține și ID-ul baseline-ului relevant, iar `runDriftAgent` trebuie să primească snapshot-ul real pentru comparație.

---

### 🎨 Cazul #4: Iluzia Controlului (UX & Încredere Falsă)

Interfața promite claritate, dar poate induce în eroare utilizatorii neavizați.

**Proba A: Butonul de respingere care șterge probe**
- **Fișier:** `lib/compliance/agent-workspace.tsx`
- **Modus Operandi:** Propunerile respinse sunt filtrate din `finalBundle` înainte de a fi trimise la server.
- **Slăbiciune:** Sistemul nu învață nimic din respingeri. Mai important, se pierde un audit trail vital. De ce a respins utilizatorul o propunere? A fost un fals pozitiv? O neînțelegere? Fără această "probă", nu putem îmbunătăți acuratețea agenților.
- **Soluție:** Trimite întregul pachet la server, marcând itemii respinși cu un status (`reviewState: 'rejected'`). Creează un log de respingeri pentru analiză ulterioară.

**Proba B: Numele "Agent Evidence OS"**
- **Observație:** Numele în sine este o promisiune. "Agent" și "OS" (Operating System) implică un nivel de autonomie, inteligență și control pe care implementarea actuală (bazată pe euristici) nu îl poate susține.
- **Slăbiciune:** Risc de marketing-driven development și de a crea așteptări nerealiste la clienți, ceea ce duce la dezamăgire.
- **Soluție:** Păstrarea unui limbaj mai precaut în comunicarea externă: "Asistent de Conformitate" sau "Motor de Propuneri" este mai aproape de adevărul tehnic.

---

### 🛠️ Cazul #5: Fisuri Arhitecturale (Mentenabilitate & Scalabilitate)

Aici am găsit probleme care nu vor cauza un crash mâine, ci vor face dezvoltarea viitoare un coșmar.

**Proba A: Schizofrenia hibridă (Local vs. Cloud)**
- **Fișiere:** `sprint-5-supabase-foundation.md`, `lib/server/mvp-store.ts`
- **Modus Operandi:** Proiectul se află într-o stare hibridă dureroasă, cu flag-uri (`COMPLISCAN_AUTH_BACKEND`, `COMPLISCAN_DATA_BACKEND`) care comută logica între fișiere locale și Supabase.
- **Slăbiciune:** Această complexitate este o sursă masivă de bug-uri. Orice feature nou trebuie testat pe multiple configurații. Depanarea devine extrem de dificilă.
- **Soluție:** Accelerarea migrării complete la Supabase (Sprint 5) și eliminarea codului de fallback local cât mai repede posibil. Starea hibridă trebuie să fie tranzitorie, nu permanentă.

**Proba B: Abuzul de `as any` și `unknown`**
- **Fișiere:** `lib/compliance/agent-runner.ts`, `lib/server/auth.ts`
- **Modus Operandi:** Codul folosește frecvent `as any` sau `as Record<string, unknown>` pentru a forța tipurile, în special la parsarea de YAML sau la manipularea de obiecte dinamice.
- **Slăbiciune:** Fiecare `as any` este o bombă cu ceas. O modificare în schema `compliscan.yaml` sau într-un payload de API nu va fi prinsă la compilare și va exploda în producție.
- **Soluție:** Adoptarea **Zod** pentru validarea la runtime a tuturor input-urilor externe (API requests, fișiere de configurare). `z.parse()` devine gardianul care asigură că datele au structura corectă înainte de a intra în logica de business.

---

## Concluzii & Plan de Acțiune

Investigația a scos la iveală nu doar neglijențe minore, ci probleme structurale care amenință integritatea și credibilitatea produsului.

**Prioritatea Zero (Existențială):**
1.  **Cazul #1 (Securitate):** Repară vulnerabilitatea IDOR din header și elimină fallback-ul pe secrete hardcodate. Fără asta, produsul este fundamental nesigur.
2.  **Cazul #2 (Integritate):** Înlocuiește parser-ul XML bazat pe regex și accelerează migrarea la o bază de date reală pentru a elimina riscul de corupere a datelor.

**Prioritatea Unu (Credibilitate):**
3.  **Cazul #3 (Logică):** Îmbunătățește agenții pentru a înțelege contextul (negație) și pentru a folosi baseline-ul real. Acuratețea este esențială.
4.  **Cazul #4 (UX):** Modifică fluxul de respingere pentru a păstra un audit trail. Fii onest în limbajul folosit.

Acest raport nu este un rechizitoriu, ci o hartă. O hartă care arată exact unde sunt capcanele. Ignorarea lor nu le va face să dispară.