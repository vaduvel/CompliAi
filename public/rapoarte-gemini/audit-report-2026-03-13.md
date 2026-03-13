# Audit Report - CompliScan

Data: 2026-03-13

Acest document consolidează auditul static realizat asupra codului și arhitecturii proiectului, concentrându-se pe securitate, integritatea datelor și calitatea implementării.

## 🚨 1. Securitate & Acces (Critic)

### Breșa principală: Trust-ul implicit în Header (IDOR Risk)

În `app/api/agent/commit/route.ts` și `run/route.ts`, backend-ul se bazează pe header-ul `x-compliscan-org-id`:

```typescript
const orgId = request.headers.get("x-compliscan-org-id")
if (!orgId) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
// ... apoi folosește direct orgId pentru a scrie în store
const store = getMVPStore(orgId)
```

*   **Vulnerabilitate:** Dacă Middleware-ul nu validează strict că utilizatorul din sesiunea activă (cookie) are dreptul să acceseze `orgId`-ul trimis în header, un atacator poate schimba manual header-ul în request și poate citi/scrie datele altei organizații (Insecure Direct Object Reference).
*   **Fix:** În `route.ts`, nu te baza doar pe header. Extrage user-ul din sesiune și verifică dacă `user.membership` include `orgId`-ul din header.

### Hardcoded Org ID în Client

În `lib/compliance/use-agent-flow.ts`:

```typescript
"x-compliscan-org-id": "org-demo-ion-popescu" // Hardcoded pentru MVP
```

*   **Slăbiciune:** Deși e marcat ca MVP, acest hardcode în client-side code este periculos dacă ajunge în producție. Orice utilizator va scrie în același store de demo. Trebuie injectat din contextul utilizatorului (`useUser()` sau similar).

## 💾 2. Integritatea Datelor & Concurență

### Race Condition la Commit

În `app/api/agent/commit/route.ts`:

```typescript
const state = await store.read()
// ... modificări în memorie (push findings, drifts) ...
await store.write(state)
```

*   **Bug:** Dacă doi utilizatori (sau doi agenți) fac commit simultan pentru aceeași organizație:
    1.  Request A citește starea v1.
    2.  Request B citește starea v1.
    3.  Request A scrie starea v2.
    4.  Request B scrie starea v2 (suprascriind modificările lui A).
*   **Impact:** Pierderi de date (findings sau drift-uri dispărute).
*   **Fix:** Ai nevoie de un mecanism de locking pe fișier (dacă rămâi pe JSON) sau tranzacții atomice (dacă treci pe DB/Supabase). Pentru MVP JSON, folosește o librărie de genul `proper-lockfile` sau mută logica de scriere într-o coadă (queue).

### Lipsa deduplicării

La commit, se face `state.detectedAISystems.push(...)` fără a verifica dacă sistemul/finding-ul există deja (bazat pe `findingId` sau hash de conținut).

*   **Efect:** Dacă apeși "Confirm" de două ori rapid sau dacă re-rulezi agentul pe același output, vei duplica intrările în baza de date.

## 🧠 3. Logică Agenți (`agent-runner.ts`)

### Heuristici Fragile (Intake Agent)

Detectarea se bazează pe `includes("openai")` sau `includes("scoring")`.

*   **False Positives:** Dacă un fișier `README.md` explică "cum să *nu* faci credit scoring", agentul va detecta totuși "High-Risk Scoring System".
*   **Îmbunătățire:** Agentul trebuie să verifice contextul (negativ/pozitiv). Deși pentru v1 e acceptabil, pentru "precizie chirurgicală" ai nevoie de o analiză mai fină (ex: regex care caută utilizare activă, nu doar mențiuni).

### Drift Detection Simulat

`runDriftAgent` din runner compară cu un baseline *implicit* hardcodat în cod (`before: { risk_class: "limited" }`), nu cu baseline-ul real din DB.

*   **Slăbiciune:** Dacă baseline-ul real al utilizatorului era deja "high", agentul va raporta greșit un drift de la "limited" la "high".
*   **Fix:** `runDriftAgent` ar trebui să primească în `SourceEnvelope` și snapshot-ul de baseline real (dacă există) pentru a face diff-ul corect.

## 🎨 4. Frontend & UX (`agent-workspace.tsx`)

### Filtrare Client-Side vs Server-Side

Logica de respingere (`rejectedIds`) se aplică doar în client înainte de a trimite la API.

*   **Observație:** API-ul `/commit` primește doar ce a rămas. Nu există o evidență a ceea ce a fost *respins*.
*   **Îmbunătățire:** Ar fi valoros pentru audit să trimiți tot pachetul la server, cu un flag `status: 'rejected'` pe itemi. Astfel, sistemul învață din respingeri și ai audit trail complet ("Utilizatorul X a respins propunerea Y").

## 🛠️ 5. Code Quality & Types

### Type Casting Periculos

În `engine.ts` și `agent-runner.ts`, există multe cast-uri `as any` sau aserțiuni de tip care pot ascunde erori runtime dacă structura JSON se schimbă.
Exemplu: `const gov = envelope.parsedYaml.governance as any`.

*   **Fix:** Folosește o librărie de validare la runtime precum **Zod**. Când parsezi un `compliscan.yaml` sau un output de la LLM, trece-l prin `z.parse()`. Asta îți garantează că structura e validă înainte să crape logica de business.

## Rezumat Audit

| Categorie | Severitate | Problema | Soluție Rapidă |
| :--- | :--- | :--- | :--- |
| **Securitate** | **Critic** | IDOR pe `x-compliscan-org-id` | Validare sesiune vs OrgID în route handler |
| **Date** | **Mare** | Race Condition la `store.write` | Implementare locking sau trecere la DB atomic |
| **Logic** | **Mediu** | Duplicate la `commit` | Check de existență ID înainte de `push` |
| **Logic** | **Mediu** | Drift compară cu baseline fictiv | Injectare baseline real în `SourceEnvelope` |
| **UX/Audit** | **Mic** | Respingerea șterge datele, nu le marchează | Trimite status `rejected` la backend |

## Următorul pas recomandat

Recomand să rezolvăm **Securitatea (Header IDOR)** și **Integritatea (Duplicate/Race Condition)** înainte de a extinde funcționalitatea agenților, deoarece acestea sunt riscuri structurale majore pentru un produs de audit.