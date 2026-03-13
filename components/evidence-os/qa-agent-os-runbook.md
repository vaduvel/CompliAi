# QA Runbook: Agent Evidence OS

## Scop
Validarea manuală a fluxului `Sursă -> Agent -> Propunere -> Confirmare` folosind fixtures canonice.

## Scenariul 1: Autodiscovery din Manifest

**Input:** `tests/fixtures/agent-os/source-envelope-manifest.json`
**Acțiune:** Rulează `Intake Agent`.

**Rezultate Așteptate:**
1.  Detectează `OpenAI` și `LangChain`.
2.  Propune un sistem cu scop `support-chatbot` (sau generic).
3.  Risk Class sugerat: `limited`.
4.  Status: `needs_review`.

**Verificare Umană:**
- [ ] Utilizatorul poate edita numele sistemului.
- [ ] Utilizatorul poate respinge propunerea dacă este un dev dependency irelevant.
- [ ] Commit-ul creează un `DetectedAISystem` în inventar.

## Scenariul 2: High-Risk Document Analysis

**Input:** `tests/fixtures/agent-os/source-envelope-document.json`
**Acțiune:** Rulează `Intake` și `Findings Agent`.

**Rezultate Așteptate:**
1.  Detectează scopul `hr-screening`.
2.  Propune Risk Class: `high`.
3.  Generează Finding Critic: `Lipsă Human Oversight`.
4.  Evidence Agent marchează audit-ul ca `blocked`.

**Verificare Umană:**
- [ ] Finding-ul apare cu badge roșu/critic.
- [ ] Utilizatorul vede clar fragmentul de text care a declanșat alerta ("fără intervenție umană").
- [ ] Commit-ul creează un `Finding` și un `Task` de remediere.

## Ce NU trebuie să facă agentul

1.  Să inventeze provideri care nu apar în text/manifest (halucinații).
2.  Să marcheze automat ca `resolved` un finding critic.
3.  Să suprascrie datele existente în inventar fără confirmare (drift).