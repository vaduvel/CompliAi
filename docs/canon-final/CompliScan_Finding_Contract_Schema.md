# CompliScan — Finding Contract Schema

Acest document este schema de fuziune dintre:
- [COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md)
- [CompliScan_Finding_Type_Library.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Finding_Type_Library.md)
- [CompliScan_Resolve_Flow_Master_Table.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Resolve_Flow_Master_Table.md)
- [CompliScan_Cockpit_UI_State_Model.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Cockpit_UI_State_Model.md)

Scopul lui nu este sa mai adauge inca un strat de viziune.

Scopul lui este sa spuna exact:
- ce ramane simplu in modelul salvat
- ce devine tipologie canonica de finding
- ce devine flow UX derivat
- ce consuma cockpitul la runtime

---

## 0. Ordinea de precedenta

1. [COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md) ramane adevarul mare de produs.
2. Acest document este adevarul de contract pentru implementare.
3. [CompliScan_Finding_Type_Library.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Finding_Type_Library.md) ramane adevarul de tipologie.
4. [CompliScan_Resolve_Flow_Master_Table.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Resolve_Flow_Master_Table.md) ramane adevarul de flow UX per finding type.
5. [CompliScan_Cockpit_UI_State_Model.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/CompliScan_Cockpit_UI_State_Model.md) ramane adevarul de transpunere UI pentru card, detail panel, rail si blocuri vizibile.

Regula:
- daca apare conflict de wording intre cele doua tabele, acest document decide forma implementabila
- daca apare conflict de directie, canonul mare decide
- daca apare conflict intre UI state model si modelul persistat, modelul persistat ramane simplu, iar UI state model ramane derivat

---

## 1. Problema pe care o rezolva schema

Astazi, runtime-ul CompliScan are deja un model util, dar incomplet pentru cockpit:
- `findingStatus` exista
- `documentFlowState` exista
- `suggestedDocumentType` exista
- `evidenceRequired` si `evidenceTypes` exista

Dar lipsesc doua straturi canonice:
- `finding type` ca clasificare stabila
- `resolve flow recipe` ca adevar UX per tip de finding

Fara aceste doua straturi:
- cockpitul ramane partial ad-hoc
- CTA-urile se decid prea mult din heuristici locale
- dovada, inchiderea si revalidarea nu sunt suficient de table-driven

---

## 2. Cele 4 layere ale contractului

Implementarea corecta trebuie sa aiba 4 layere distincte.

### Layer 1. Persisted finding record

Acesta este recordul real salvat in sistem pentru fiecare caz concret.

Aici pastram:
- identitatea recordului
- severitatea reala
- textul concret detectat
- sursa
- statusul simplu
- legaturile catre dovezi / drafturi / metadate de monitorizare

Acest layer ramane simplu si auditabil.

### Layer 2. Finding type definition

Acesta este catalogul canonic al tipurilor de finding.

Aici definim:
- ce fel de caz este
- ce mod de rezolvare are
- ce dovada cere
- cum se inchide
- daca se reverifica automat

Acest layer vine din `Finding Type Library`.

### Layer 3. Resolve flow recipe

Acesta este stratul UX peste tipologia finding-ului.

Aici definim:
- ce vede userul prima data
- ce CTA primeste
- ce CTA secundar primeste
- in ce stare de flow intra
- ce trigger de revalidare il poate reaprinde

Acest layer vine din `Resolve Flow Master Table`.

### Layer 4. Cockpit runtime view model

Acesta este modelul derivat consumat de UI.

Aici calculam:
- hero CTA
- stepper adaptiv
- dossier rail
- monitoring rail
- close gating
- succes moment

Acest layer nu se persista integral.
El se calculeaza din primele 3 layere plus artifactele reale.

---

## 3. Ce ramane simplu in modelul salvat

### 3.1 `findingStatus` ramane simplu

Nu transformam statusul salvat intr-o lista lunga de pseudo-statusuri UX.

Forma canonica persistata ramane:

```ts
type PersistedFindingStatus =
  | "open"
  | "confirmed"
  | "dismissed"
  | "resolved"
  | "under_monitoring"
```

Acesta este statusul de orchestration si audit.
Nu trebuie supraincarcat cu limbaj de UX.

### 3.2 `documentFlowState` ramane simplu

Forma canonica persistata sau derivata din artifacte ramane:

```ts
type FindingDocumentFlowState =
  | "not_required"
  | "draft_missing"
  | "draft_ready"
  | "attached_as_evidence"
```

Acesta spune strict unde este documentul in relatia cu finding-ul.

### 3.3 `id` nu este `findingTypeId`

Regula critica:
- `id` din `ScanFinding` este id-ul recordului concret
- `findingTypeId` este clasificarea canonica a tipului de finding

Exemplu:
- `demo-gdpr-1` este record id
- `GDPR-001` este finding type id

Mai multe recorduri pot avea acelasi `findingTypeId`.

---

## 4. Ce introducem ca tipologie canonica

Acest strat trebuie sa existe explicit in cod, chiar daca in prima faza este derivat.

```ts
type FindingFramework = "GDPR" | "NIS2" | "eFactura" | "AI Act" | "Cross"

type ResolutionMode =
  | "in_app_guided"
  | "in_app_full"
  | "external_action"
  | "user_attestation"

type AutoRecheckMode = "no" | "partial" | "yes"
```

### 4.1 Contractul de tipologie

```ts
type FindingTypeDefinition = {
  findingTypeId: string
  framework: FindingFramework
  title: string
  category: string
  typicalSeverity: string
  signalTypes: string[]
  resolutionModes: ResolutionMode[]
  primaryActors: string[]
  compliCapabilities: string[]
  userResponsibilities: string[]
  requiredEvidenceKinds: string[]
  autoRecheck: AutoRecheckMode
  closingRule: string
}
```

### 4.2 Reguli

Orice `FindingTypeDefinition` trebuie sa spuna explicit:
- daca cere document generat sau nu
- daca cere actiune externa sau nu
- daca inchiderea cere rescan sau nu
- daca dovada poate fi doar de tip operational
- daca poate intra direct in dosar ca artifact generat

Nu intram in cockpit cu finding-uri care nu au aceste raspunsuri.

---

## 5. Ce introducem ca flow UX derivat

Nu persistam toate starile din tabele ca status intern.
Le normalizam intr-un flow layer derivat.

```ts
type ResolveFlowState =
  | "detected"
  | "ready_to_generate"
  | "need_your_input"
  | "external_action_required"
  | "needs_revalidation"
  | "evidence_required"
```

Observatie:
- randurile din tabel care spun lucruri de tip `evidence_uploaded / need_your_input` nu trebuie copiate brut
- alegem un `primary flow state`
- restul devin reguli de fallback sau tranzitie

### 5.1 Contractul de flow UX

```ts
type ResolveFlowRecipe = {
  findingTypeId: string
  initialFlowState: ResolveFlowState
  primaryCTA: string
  secondaryCTA?: string
  whatUserSees: string
  whatCompliDoes: string
  whatUserMustDo: string
  closeCondition: string
  revalidationTriggers: string[]
}
```

### 5.2 Reguli

Acest layer spune:
- cum incepe flow-ul in UI
- ce vede userul sus in cockpit
- ce trebuie sa faca prima data
- ce poate reactiva cazul dupa inchidere

Acest layer nu inlocuieste:
- `findingStatus`
- `documentFlowState`

El doar le interpreteaza pentru UX.

---

## 6. Ce introducem ca UI state derivat

`CompliScan_Cockpit_UI_State_Model` este bun, dar nu trebuie citit ca model de DB.

El trebuie tradus intr-un layer separat:

```ts
type CockpitUIState =
  | "detected"
  | "need_your_input"
  | "ready_to_generate"
  | "external_action_required"
  | "evidence_uploaded"
  | "rechecking"
  | "resolved"
  | "needs_revalidation"
  | "false_positive"
```

### 6.1 Regula critica

`CockpitUIState` nu este egal cu `PersistedFindingStatus`.

El este derivat din:
- `findingStatus`
- `documentFlowState`
- `ResolveFlowRecipe`
- existenta sau lipsa dovezii
- starea recheck / revalidation

### 6.2 Contractul de UI vizibil

```ts
type CockpitBlockKey =
  | "generator"
  | "input"
  | "external_action"
  | "evidence"
  | "confirmation"
  | "recheck"
  | "revalidation"
  | "audit_meta"

type CockpitVisibleBlocks = {
  collapsedPrimaryCTA: string
  collapsedStatusLabel: string
  detailBlocks: CockpitBlockKey[]
  aboveTheFoldBlocks: CockpitBlockKey[]
  belowTheFoldBlocks: CockpitBlockKey[]
}
```

### 6.3 Mapping obligatoriu dupa resolution mode

Acest mapping trebuie consumat de UI:

```ts
type ResolutionModeBlockRules = {
  resolutionMode: ResolutionMode
  generatorBlock: boolean
  inputBlock: boolean
  externalActionBlock: boolean
  evidenceBlock: boolean
  confirmationBlock: boolean
  recheckBlock: boolean
  revalidationBlock: boolean
}
```

Regulile canonice sunt:
- `in_app_full`
  - generator da
  - confirmation da
  - evidence da
- `in_app_guided`
  - input da
  - confirmation da
  - evidence da
- `external_action`
  - external action da
  - evidence da
  - confirmation da
  - recheck optional / da unde tipologia o cere
- `user_attestation`
  - input da
  - confirmation da
  - evidence optional

### 6.4 Regula de layout

Above the fold, detail panel-ul trebuie sa raspunda doar la:
1. ce este
2. de ce conteaza
3. ce poate face Compli acum
4. care este CTA-ul principal
5. care este dovada minima ceruta

Pasii detaliati, audit meta si rail-urile extinse stau sub fold sau in expand.

---

## 7. Contractul runtime care le leaga

Forma corecta in cod este:

```ts
type FindingRuntimeContract = {
  record: ScanFinding
  findingType: FindingTypeDefinition
  flow: ResolveFlowRecipe
  documentFlowState: FindingDocumentFlowState
  uiState: CockpitUIState
}
```

Din el derivam:

```ts
type CockpitRecipe = {
  statusLabel: string
  collapsedStatusLabel: string
  uiState: CockpitUIState
  resolveFlowState: ResolveFlowState
  heroTitle: string
  heroSummary: string
  primaryCTA: {
    label: string
    action:
      | "confirm"
      | "confirm_and_generate"
      | "open_generator"
      | "open_external_steps"
      | "upload_evidence"
      | "revalidate"
      | "rescan"
  }
  secondaryCTA?: {
    label: string
    action:
      | "show_diff"
      | "show_old_document"
      | "show_requirements"
      | "skip_vendor"
      | "already_have_evidence"
  }
  acceptedEvidence: string[]
  visibleBlocks: CockpitVisibleBlocks
  closeCondition: string
  dossierOutcome: string
  monitoringSignals: string[]
}
```

Acesta este obiectul pe care il foloseste cockpitul.

---

## 8. Maparea exacta pe runtime-ul actual

### 8.1 Din `ScanFinding` pastram direct

Din [types.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/types.ts) pastram direct:
- `id`
- `title`
- `detail`
- `severity`
- `sourceDocument`
- `legalReference`
- `impactSummary`
- `remediationHint`
- `evidenceRequired`
- `evidenceTypes`
- `rescanHint`
- `readyText`
- `resolution`
- `findingStatus`
- `suggestedDocumentType`

### 8.2 Ce trebuie adaugat sau derivat

Trebuie sa existe in runtime:

```ts
type FindingClassification = {
  findingTypeId: string
  framework: FindingFramework
}
```

In prima faza, `findingTypeId` poate fi derivat prin mapper.
In faza matura, trebuie salvat sau reasigurat determinist la detectie.

### 8.3 Ce nu facem

Nu facem asta:

```ts
finding.findingStatus = "ready_to_generate"
```

Asta ar fi gresit.

Facem asta:

```ts
const resolveFlowState = "ready_to_generate"
const findingStatus = "confirmed"
```

Adica:
- statusul persistat ramane curat
- starea de flow ramane strat UX

---

## 9. Reguli canonice de decizie in cockpit

### Regula 1

Daca `resolutionModes` contine `in_app_guided` si exista `suggestedDocumentType`, cockpitul poate afisa CTA de tip:
- `Confirma si genereaza`
- `Genereaza acum`
- `Continua flow-ul`

### Regula 2

Daca `resolutionModes` contine `external_action` si nu exista document obligatoriu, cockpitul nu trebuie sa afiseze generatorul ca CTA principal.

Exemplu:
- `EF-003 Factura respinsa ANAF`

Acolo CTA-ul corect este:
- `Vezi ce trebuie corectat`
- `Adauga dovada`
- `Re-scaneaza / verifica din nou`

Nu `Genereaza acum`.

### Regula 3

Daca `requiredEvidenceKinds` include `vendor_document`, finding-ul nu se inchide fara document legat la vendor sau confirmare explicita de neutilizare.

### Regula 4

Daca `autoRecheck` este `yes`, inchiderea nu este completa fara:
- dovada
- trigger de recheck
- regula de redeschidere

### Regula 5

Daca `initialFlowState` este `needs_revalidation`, hero-ul trebuie sa porneasca din:
- `Reconfirma acum`
- nu din `Rezolva`
- nu din `Genereaza acum`

---

## 10. Exemple canonice

### 9.1 GDPR-001

```ts
findingTypeId: "GDPR-001"
framework: "GDPR"
resolutionModes: ["in_app_guided"]
initialFlowState: "ready_to_generate"
primaryCTA: "Genereaza acum"
requiredEvidenceKinds: ["generated_document", "confirmation"]
closeCondition: "document generat, confirmat si salvat in Vault"
```

Traducere in cockpit:
- hero CTA: `Confirma si genereaza` sau `Genereaza acum`
- generator inline
- success moment: `Dovada a intrat la dosar`
- monitoring: website schimbat / date firma schimbate / review periodic

### 9.2 EF-003

```ts
findingTypeId: "EF-003"
framework: "eFactura"
resolutionModes: ["external_action"]
initialFlowState: "external_action_required"
primaryCTA: "Vezi ce trebuie corectat"
requiredEvidenceKinds: ["xml", "screenshot"]
closeCondition: "status nou valid sau dovada retransmiterii"
```

Traducere in cockpit:
- fara generator
- CTA operational
- dovada operationala
- recheck pana la validare

### 9.3 SYS-002

```ts
findingTypeId: "SYS-002"
framework: "Cross"
resolutionModes: ["user_attestation", "external_action"]
initialFlowState: "needs_revalidation"
primaryCTA: "Reconfirma acum"
requiredEvidenceKinds: ["confirmation", "uploaded_file"]
closeCondition: "review nou salvat"
```

Traducere in cockpit:
- caz de revalidare, nu de remediere initiala
- stepper porneste din `Monitorizat -> Revalidare`
- dosarul trebuie sa arate dovada veche si data noua de review

---

## 11. Ce trebuie implementat in cod

### 10.1 O librarie de clasificare

Trebuie sa existe un modul care expune:

```ts
getFindingTypeDefinition(findingTypeId)
getResolveFlowRecipe(findingTypeId)
classifyFinding(record: ScanFinding): FindingClassification
buildCockpitRecipe(record: ScanFinding, linkedArtifacts): CockpitRecipe
deriveCockpitUIState(contract: FindingRuntimeContract): CockpitUIState
```

### 11.2 O separatie clara intre persistent si derived

Trebuie sa existe:
- model persistent curat
- mapping tipologic
- mapping de flow UX
- builder de cockpit

Nu trebuie sa existe:
- CTA-uri hardcodate raspandite in 7 componente fara contract comun

### 11.3 O singura sursa pentru inchidere si reactivare

`closeCondition` si `revalidationTriggers` trebuie sa devina sursa comuna pentru:
- gating la `Marcheaza rezolvat`
- success moment
- mutarea in dosar
- trecerea in `under_monitoring`
- redeschiderea ulterioara

---

## 12. Ce nu rescriem

Nu rescriem de la zero:
- `ScanFinding`
- `findingStatus`
- `documentFlowState`
- generatorul
- resolve page
- monitoring signals

Le refolosim.

Ce schimbam este stratul de decizie:
- din heuristici locale
- in contract canonic

---

## 13. Definitia de gata pentru aceasta schema

Schema este considerata implementata corect cand:

1. fiecare finding activ are un `findingTypeId`
2. fiecare `findingTypeId` are:
- tipologie
- flow recipe
- close condition
- revalidation triggers
3. cockpitul isi ia CTA-ul principal din recipe, nu din if-uri imprastiate
4. cockpitul isi ia blocurile vizibile din `resolution mode + ui state`, nu din JSX hardcodata
5. `findingStatus` ramane simplu si curat
6. `Resolve Flow Master Table` nu mai este doar document, ci devine sursa directa pentru UI behavior
7. `Cockpit UI State Model` nu mai este doar document, ci devine sursa directa pentru layout si vizibilitate

---

## 14. Concluzie

Canonul mare ramane:

`Pages for intake`
`Findings for execution`
`Dossier for memory`
`Monitoring for continuity`

Aceasta schema spune cum devine asta cod.

Formula finala este:

```ts
persisted finding
-> classified finding type
-> resolve flow recipe
-> cockpit recipe
-> dossier + monitoring
```

Aceasta este forma implementabila corecta a fuziunii dintre cele doua tabele noi si smart canonul principal.
