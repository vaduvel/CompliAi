# CompliAI Risk Resolution Coverage Map

## Scop

Acest document fixează adevărul operațional pentru cele `16` familii reale de risc pe care CompliAI le poate identifica azi din:

- `CUI`
- `website`
- `ANAF e-Factura / SPV`
- `questionary`

Întrebarea la care răspunde:

- `câte rezolvăm real azi`
- `câte asistăm serios`
- `cât cod avem deja`
- `ce mai lipsește până la o rezolvare aproape completă`

## Snapshot Actual

- `16` familii reale de risc detectabile
- `6/16` rezolvabile real azi prin `CompliAI + om`
- `10/16` încă nu sunt închise onest cap-coadă de produs
- `3` riscuri sunt deja `operational-assisted` în cod:
  - `GDPR-005`
  - `GDPR-017`
  - `AI-OPS`

## Clasele reale de rezolvare

- `documentary`
  - CompliAI generează documentul, validează, leagă la finding, îl trimite în Dosar și pornește monitorizarea
- `operational`
  - CompliAI cere acțiune reală și dovadă operațională
- `operational-assisted`
  - CompliAI generează un document de suport, dar cazul nu se închide fără dovadă operațională
- `specialist_handoff`
  - CompliAI trimite în modul specialist și readuce cazul în cockpit pentru închidere

## Surse de adevăr din cod

- clasă de execuție și suport de document:
  - `/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/finding-kernel.ts`
- finding-uri de intake și `suggestedDocumentType`:
  - `/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/intake-engine.ts`
- motoare reale de generare documente:
  - `/Users/vaduvageorge/Desktop/CompliAI/lib/server/document-generator.ts`
- suprafețe specialist deja existente:
  - `/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/dsar/page.tsx`
  - `/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/vendor-review/page.tsx`
  - `/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/fiscal/page.tsx`

## Harta Celor 16 Riscuri

### 1. Privacy / informare GDPR lipsă

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `90%`
- ce există:
  - generator `privacy-policy`
  - flow live confirmat cap-coadă
- ce mai lipsește până la 100%:
  - publicare asistată pe site și verificare automată post-publicare

### 2. Cookies consent neconform

- status azi: `rezolvat real, dar asistat`
- clasă: `operational-assisted`
- cât avem deja: `75%`
- ce există:
  - generator `cookie-policy`
  - flow live confirmat
  - dovadă operațională obligatorie
- ce mai lipsește până la 100%:
  - scanner preventiv mai strict pentru încărcarea scripturilor înainte de consimțământ
  - interpretare automată mai bună a configurării bannerului

### 3. DPA lipsă pentru procesatori / vendori

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `85%`
- ce există:
  - generator `dpa`
  - flow live confirmat
  - urmă bilaterală v1 în cockpit / Dosar / Vault:
    - `revizuit intern`
    - `trimis la semnare`
    - `semnat`
    - `pus în uz`
- ce mai lipsește până la 100%:
  - integrare reală cu e-sign sau vendor reply
  - legare automată mai bună la vendor registry

### 4. Vendor governance / documentație externă lipsă

- status azi: `asistat puternic`
- clasă: `specialist_handoff`
- cât avem deja: `75%`
- ce există:
  - vendor review engine
  - vendor review page
  - vendor risk / vendor library / vendor prefill
  - `Vendor Pack` generat în produs
  - template solicitare documentație vendor
  - checklist vendor governance
  - plan intern de remediere
  - checklist de revenire în cockpit
  - handoff + revenire automată în cockpit
- ce mai lipsește până la 100%:
  - scorecard vendor
  - tracking expirări și răspunsuri
  - follow-up mai clar pe review-ul pornit
  - smoke live final confirmat pe deploymentul public
- ce ar urca riscul:
  - specialist flow aproape complet, cu Vendor Pack gata de folosit în produs

### 5. Proces DSAR lipsă

- status azi: `asistat puternic`
- clasă: `specialist_handoff`
- cât avem deja: `75%`
- ce există:
  - modul DSAR
  - store DSAR
  - draft helpers
  - handoff + revenire în cockpit
  - `DSAR Pack` generat în produs
  - procedură DSAR
  - registru DSAR minim
  - playbook / owner guidance
  - checklist de revenire în cockpit
  - smoke live confirmat pe preview
- ce mai lipsește până la 100%:
  - template de răspuns DSAR afișat direct în același pack
  - salvare explicită a ownerului desemnat în state
  - follow-up mai clar pentru primul caz DSAR real
- ce ar urca riscul:
  - specialist flow aproape complet, cu pachet DSAR gata de folosit în produs

### 6. Retenție date neclară

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `90%`
- ce există:
  - generator `retention-policy`
  - flow live confirmat
  - follow-up automat `GDPR-016 -> GDPR-017`
- ce mai lipsește până la 100%:
  - asistent mai bun pentru categorii de date și reguli de retenție per sistem

### 7. Politică internă de utilizare AI lipsă

- status azi: `rezolvat real`
- clasă: `documentary`
- cât avem deja: `85%`
- ce există:
  - generator `ai-governance`
  - flow live confirmat
- ce mai lipsește până la 100%:
  - bibliotecă mai bogată de controale AI pe roluri și tool-uri
  - confirmare distribuire internă mai bine modelată

### 8. Date confidențiale introduse în AI fără protecție

- status azi: `rezolvat real, dar asistat`
- clasă: `operational-assisted`
- cât avem deja: `70%`
- ce există:
  - suport `ai-governance`
  - flow live confirmat pe modelul document de suport + dovadă operațională
- ce mai lipsește până la 100%:
  - inventory de tool-uri AI aprobate
  - controale de training / distribuire
  - eventual integrare DLP sau policy attestation

### 9. Fișe de post lipsă sau incomplete

- status azi: `specialist_handoff real`
- clasă: `specialist_handoff`
- cât avem deja: `65%`
- ce există:
  - finding de intake
  - tip canonic dedicat `GDPR-021`
  - `Job Description Pack` în suprafața `Documente`
  - revenire automată în cockpit cu dovadă precompletată
- ce mai lipsește până la 100%:
  - generator per rol
  - formular scurt: rol, departament, senioritate, manager
  - circuit de confirmare / semnare
- ce ar urca riscul:
  - generare per rol + rollout asistat până la fișiere finale

### 10. REGES / evidență contracte angajați neactualizată

- status azi: `specialist_handoff real`
- clasă: `specialist_handoff`
- cât avem deja: `70%`
- ce există:
  - finding de intake
  - tip canonic dedicat `GDPR-023`
  - `REGES Correction Brief` în suprafața `Documente`
  - suprafață de reconciliere `snapshot intern vs REGES`
  - revenire automată în cockpit cu dovadă precompletată
  - notă de handoff dinamică atunci când snapshotul intern și checklistul sunt salvate
- ce mai lipsește până la 100%:
  - import/export structurat și comparație minimă
  - dovadă mai strictă după operarea în registrul real
  - confirmare mai clară pe diferențe rezolvate
- ce ar urca riscul:
  - integrare mai adâncă HR / registru angajați

### 11. Proceduri interne pentru angajați lipsă

- status azi: `specialist_handoff real`
- clasă: `specialist_handoff`
- cât avem deja: `60%`
- ce există:
  - finding de intake
  - tip canonic dedicat `GDPR-022`
  - `HR Procedure Pack` în suprafața `Documente`
  - revenire automată în cockpit cu dovadă precompletată
- ce mai lipsește până la 100%:
  - pachet minim de proceduri interne
  - confirmare distribuire internă
- ce ar urca riscul:
  - rollout asistat și confirmare de distribuire

### 12. Contracte standard lipsă sau incomplete

- status azi: `specialist_handoff real`
- clasă: `specialist_handoff`
- cât avem deja: `60%`
- ce există:
  - finding de intake
  - tip canonic dedicat `GDPR-020`
  - `Contracts Pack` în suprafața `Documente`
  - revenire automată în cockpit cu dovadă precompletată
  - urmă bilaterală v1 în cockpit / Dosar / Vault:
    - `revizuit intern`
    - `trimis la semnare`
    - `semnat`
    - `pus în uz`
- ce mai lipsește până la 100%:
  - NDA
  - client services template
  - supplier baseline
  - configurare pe B2B/B2C și tip business
- ce ar urca riscul:
  - integrare externă de semnare și rollout asistat

### 13. Înregistrare SPV lipsă

- status azi: `asistat mediu-puternic`
- clasă: `operational`
- cât avem deja: `68%`
- ce există:
  - client ANAF/SPV
  - suprafață fiscală
  - `SPV Enrollment Guide`
  - checklist clar de activare
  - buton de portal + copy note pentru cockpit
  - verificare SPV în aceeași suprafață
- ce mai lipsește până la 100%:
  - producer public mai clar pentru `EF-001` în smoke-uri live
  - dovadă de activare mai strâns legată de integrarea ANAF
- ce ar urca riscul:
  - rămâne `operational`, dar mult mai asistat

### 14. Factură respinsă / XML invalid în e-Factura

- status azi: `operational-assisted puternic`
- clasă: `operational`
- cât avem deja: `84%`
- ce există:
  - validator e-Factura
  - hartă de erori
  - fiscal risk card
  - prefill / client ANAF
  - `Fiscal Pre-Validator v1` în `/dashboard/fiscal?tab=validator`
  - API `POST /api/efactura/repair`
  - helper de reparare sigură pentru coduri frecvente (`T003`, `V002`, `V003`, `V006`)
  - handoff direct din cockpit pentru `EF-003` și `EF-005`
  - `Fiscal Pre-Validator v2`: download XML reparat, notă pregătită pentru cockpit, protocol explicit după repair
- ce mai lipsește până la 100%:
  - acoperire mai largă de coduri ANAF / CIUS-RO
  - diff mai clar între XML inițial și XML reparat
  - legare mai bună cu stările SPV după retransmitere
- ce ar urca riscul:
  - extinderea `Fiscal Pre-Validator` din `v1` în protocol complet de retransmitere

### 15. Factură blocată în prelucrare ANAF

- status azi: `asistat mediu-puternic`
- clasă: `operational`
- cât avem deja: `62%`
- ce există:
  - fiscal state / checks
  - interpretare de risc
  - `Fiscal Status Interpreter` în `/dashboard/fiscal?tab=status`
  - protocol de verificare SPV + retry / escalare
  - copy note pentru cockpit + return cu dovadă precompletată
- ce mai lipsește până la 100%:
  - distincție clară între latență normală și blocaj real
  - urmărire mai automată a statusului după reverificare
  - validare runtime finală pe aliasul public

### 16. Factură generată dar netransmisă spre SPV

- status azi: `asistat puternic`
- clasă: `operational`
- cât avem deja: `72%`
- ce există:
  - fiscal checks
  - signal hardening
  - `Fiscal Pre-Validator v1/v2` pentru XML
  - `Fiscal Status Interpreter` pentru protocolul de transmitere
  - handoff secundar spre validator XML și SPV Check
  - copy note pentru cockpit + return cu dovadă precompletată
- ce mai lipsește până la 100%:
  - verificare recipisă / dovadă de transmitere
  - protocol de retransmitere
- ce ar urca riscul:
  - mutare în `operational-assisted`

## Cât Este Azi „Gata” Din Ce Ne Trebuie

### Rezolvabile real azi

- `6/16`
- acestea sunt:
  - `Privacy / informare GDPR lipsă`
  - `Cookies consent neconform`
  - `DPA lipsă`
  - `Retenție date neclară`
  - `Politică internă AI lipsă`
  - `Date confidențiale introduse în AI fără protecție`

### Asistate bine, dar încă neînchise curat doar de produs

- `4/16`
- acestea sunt:
  - `Vendor governance / documentație externă lipsă`
  - `Proces DSAR lipsă`
  - `Înregistrare SPV lipsă`
  - `cele 3 riscuri fiscale de execuție`

### Doar detectate azi

- `1/16`
- acestea sunt:
  - `SPV`

## Unde Putem Crește Cel Mai Repede

### Wave 1 — Quick Wins

- `DSAR Pack`
- `Vendor Pack`
- `Job Description Pack`
- `HR Procedure Pack`
- `Contracts Pack`

Impact estimat:

- implementat pe toate cele 5 inițiative
- acoperirea reală a urcat peste baseline-ul inițial de `6/16`

### Wave 2 — Leverage Mare

- `Fiscal Pre-Validator`
- `REGES Correction Brief`
- `SPV Enrollment Guide`

Impact estimat:

- urcare spre `13-14/16` asistate puternic

### Wave 3 — Integrări Grele

- semnare / urmă bilaterală pentru DPA și contracte
- integrare HR / registru angajați
- integrare fiscală mai adâncă
- remindere și expirări vendor

Notă de progres:

- `integrare fiscală mai adâncă v1` este acum pornită în produs
- `EF-004` și `EF-005` nu mai trimit userul doar într-un protocol static; există și un jurnal de execuție cu urmă persistată și notă dinamică de handoff spre cockpit
- încă nu pretindem retransmitere automată, recipise SPV sincronizate sau închidere autonomă a cazului fiscal
- `vendor lifecycle v1` este acum vizibil direct în `Vendor Review`, cu radar pentru review-uri expirate, due soon și follow-up activ
- `vendor lifecycle v2` adaugă follow-up programabil direct pe review-urile deschise:
  - termen explicit
  - notă de follow-up
  - semnal due soon / overdue direct în radar
- încă nu pretindem remindere externe sau follow-up automat complet; `v1 + v2` aduc prioritizare și următorul touch operațional, nu automatizare totală

## Reguli De Încredere

CompliAI rămâne legal, curat și credibil doar dacă păstrăm aceste reguli:

1. niciun draft nu este prezentat ca verdict juridic final
2. niciun risc factual nu se închide doar cu document dacă cere acțiune reală
3. fiecare recomandare tehnică trebuie să fie auditabilă și explicabilă
4. orice handoff extern trebuie să lase urmă în Dosar

## Concluzie

Ținta sănătoasă nu este `16/16 rezolvate autonom`.

Ținta sănătoasă este:

- `10/16` rezolvate real sau aproape real de `CompliAI + om`
- `13-14/16` asistate puternic
- `0` riscuri închise fals

Formula corectă de produs:

- `detectare`
- `drafting`
- `pre-fill`
- `guided execution`
- `evidence collection`
- `monitoring`

Nu `magic solve bot`.
