# AI Processing Terms — pilot DPO Complet

**Status:** production policy draft pentru pilot  
**Scop:** clarifică ce se întâmplă când AI este ON sau OFF în CompliScan.

## Principiu de bază

AI este asistent de redactare și structurare. Nu validează juridic, nu semnează, nu certifică și nu înlocuiește consultantul DPO.

## Moduri disponibile

### AI OFF

Folosit pentru clienți sensibili sau când cabinetul nu dorește procesare prin provider AI.

Comportament:

- documentele se generează template-only;
- nu se face apel către provider AI;
- template-urile cabinetului sunt completate determinist;
- evidence files nu ies către AI.

### AI ON

Folosit doar dacă cabinetul activează explicit AI pentru client/workspace.

Comportament:

- se trimite prompt minim;
- se trimit variabile de document strict necesare;
- se pot trimite fragmente relevante, nu arhive brute de evidence;
- output-ul rămâne draft pentru revizie profesională.

## Provideri

### Mistral AI

- Provider preferat pentru pilot DPO cu cerință EU.
- Regiune: EU provider route.
- Status: optional, AI ON doar dacă este activat.
- Training: no customer training.

### Google Gemini

- Provider global.
- Status: disabled by default pentru pilotul DPO standard.
- Se activează doar prin decizie explicită a cabinetului.
- Training: no customer training pentru conținutul clientului în CompliScan.

## Date trimise către AI

Doar când AI este ON:

- tip document;
- nume organizație / vendor dacă este necesar;
- variabile template;
- instrucțiuni de redactare;
- context minim introdus de consultant.

Nu se trimit către AI în pilotul standard:

- evidence files brute;
- arhive cabinet;
- date speciale brute;
- documente medicale brute;
- parole, chei sau secrete.

## Clienți sensibili

Pentru healthcare, fintech, banking, HR sensibil sau date speciale:

- AI OFF implicit;
- template-only mode;
- consultantul poate activa AI doar după acord explicit.

## Validare profesională

Orice document generat sau asistat AI trebuie marcat ca draft până când consultantul îl validează.

Formulare recomandată:

> Document de lucru pregătit de cabinet. Necesită validare profesională înainte de utilizare oficială.

## Rapoarte și audit

În pilot, CompliScan trebuie să poată arăta:

- dacă AI a fost ON sau OFF pentru client;
- provider-ul ales;
- faptul că documentul a fost validat de consultant;
- event ledger pentru aprobări și modificări relevante.
