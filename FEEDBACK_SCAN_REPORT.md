# Feedback Scan Report

Data: 2026-03-09

## Verdict

Feedback-ul primit este in mare parte corect. Ca imagine de ansamblu, descrie bine produsul ca MVP intern/demo, cu scanare, findings, alerte, task-uri si export de raport.

Totusi, exista cateva puncte unde feedback-ul amesteca lucruri reale cu inferente sau rateaza detalii importante din implementarea actuala.

## Confirmat in cod

- Aplicatia este single-tenant si foloseste un `org-demo-ion-popescu` hardcodat in persistenta.
- Persistenta principala este un singur blob de stare in `.data/compliance-state.json` sau un singur rand `app_state` in Supabase.
- Scanarea foloseste OCR Google Vision daca exista configurare si apoi ruleaza analiza pe reguli simple, bazate pe cuvinte cheie.
- e-Factura este doar simulata. Sync-ul seteaza `efacturaConnected = true` si actualizeaza timpul ultimei sincronizari.
- Raportul nu este un verdict oficial si include explicit disclaimer.
- Task-urile si dovada atasata sunt persistate, dar doar ca metadate usoare in `taskState`.
- Nu exista autentificare reala, sesiuni sau separare pe clienti.
- Nu exista stocare dedicata pentru fisierele originale; se retin doar preview si text extras.
- Chat-ul Gemini exista in backend, dar nu este conectat intr-un flux UI real al cockpit-ului.

## Corectii fata de feedback

### 1. Scorul de risc nu este stocat separat

Critica despre "risk score stocat langa datele sursa" nu este exacta pentru implementarea de acum.

- `computeDashboardSummary()` calculeaza scorul la citire, nu il persista.
- In schimb, alte campuri derivate sunt tinute in acelasi blob si apoi normalizate la read/write: `highRisk`, `lowRisk`, `gdprProgress`, `scannedDocuments`, `efacturaSignalsCount`.

Concluzie:
- problema "blob monolitic" este reala
- problema specifica "scor stale pentru ca este persistat" nu este reala in forma actuala

### 2. OCR failure nu pica tot fluxul

Feedback-ul spune ca daca OCR esueaza, scanarea esueaza complet. Nu asta face codul acum.

Comportamentul real:
- OCR failure produce doar `ocrWarning`
- scanarea continua
- daca nu exista nici text manual, sistemul poate ajunge sa creeze un finding generic de risc redus

Practic, riscul real este altul: nu timeout-ul, ci un rezultat fals-linistitor dupa o extragere ratata.

### 3. "Generare PDF" este de fapt HTML printabil

Feedback-ul spune corect ca nu este PDF real, dar merita formulat mai precis:

- backend-ul construieste HTML
- frontend-ul deschide HTML-ul intr-o fereastra noua
- browserul face apoi print/export daca utilizatorul vrea PDF

Nu exista librarie de PDF si nu exista fisier PDF generat server-side.

## Riscuri suplimentare gasite la scan

### 1. OCR ratat + continut gol poate genera "risc redus"

Problema cea mai periculoasa operational.

Fluxul actual:
- upload imagine/PDF
- OCR esueaza sau nu extrage text
- `finalContent` ramane gol
- `simulateFindings()` produce finding generic: `Scanare completa, risc redus`

Efect:
- utilizatorul poate primi un semnal de siguranta pe un document care de fapt nu a fost citit corect

## 2. Endpoint-ul de task-uri accepta orice task id

`PATCH /api/tasks/:id` nu valideaza daca task-ul exista in lista reala.

Efect:
- se pot crea intrari arbitrare in `taskState`
- starea poate fi umflata sau poluata cu ID-uri inexistente

## 3. Relatia finding -> alert -> task nu exista in persistenta

UI-ul deriva task-uri din findings si din planul de remediere, dar nu exista foreign keys sau link-uri explicite intre entitati.

Efect:
- nu poti auto-rezolva corect o alerta cand toate task-urile ei sunt gata
- nu poti audita clar de ce exista un task si din ce finding vine

## 4. Nu exista idempotenta pentru scanari

Fiecare `POST /api/scan` creeaza un scan nou cu ID random.

Efect:
- refresh/retry/browser retry poate duplica datele
- nu exista `clientId` sau cheie de deduplicare

## Prioritati recomandate

### Prioritate 1

- blocheaza scanarea fara continut util; daca OCR nu extrage nimic si utilizatorul nu a dat text, raspunsul trebuie sa fie eroare sau "review required", nu "risc redus"
- adauga validare ca task-ul exista inainte sa scrii in `taskState`
- muta `orgId` intr-un helper/context, nu hardcodat in store

### Prioritate 2

- separa scanarea in `extract -> review -> analyze`
- adauga provenance minima pentru findings: keyword, context, document, regula
- adauga idempotenta la scan prin `clientId`

### Prioritate 3

- sparge blob-ul de stare pe domenii
- adauga event log append-only
- abia dupa asta merita migrata schema Supabase in tabele separate

## Fisiere cheie verificate

- `lib/server/mvp-store.ts`
- `lib/compliance/engine.ts`
- `app/api/scan/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/alerts/[id]/resolve/route.ts`
- `app/api/reports/route.ts`
- `app/api/chat/route.ts`
- `app/api/integrations/efactura/sync/route.ts`

