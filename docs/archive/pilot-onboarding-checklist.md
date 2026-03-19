# CompliScan - Pilot Onboarding Checklist

Data actualizarii: 2026-03-13

## Scop

Acest checklist ne ajuta sa pornim un pilot real fara improvizatii si fara promisiuni mai mari decat produsul.

## Inainte de acces

- organizatia este creata si verificata
- exista cel putin un `owner`
- exista cel putin un `compliance` sau `reviewer`
- mediul este confirmat:
  - `COMPLISCAN_AUTH_BACKEND`
  - `COMPLISCAN_DATA_BACKEND`
  - `COMPLISCAN_ALLOW_LOCAL_FALLBACK`

## Configurare minima

- `compliscan.yaml` sau primul document de baza este pregatit
- clientul intelege fluxul principal:
  - adaugi sursa
  - primesti verdict
  - primesti pasi de remediere
  - atasezi dovada
  - exporti audit pack
- este explicat clar ca:
  - sistemul propune
  - omul valideaza

## Prima sesiune de lucru

- rulam primul scan pe:
  - document
  - sau `compliscan.yaml`
  - sau manifest
- validam un baseline initial
- confirmam sistemele AI detectate relevante
- verificam:
  - drift panel
  - remediere
  - auditor vault

## Dovada si audit

- clientul ataseaza cel putin o dovada reala
- se vede in `Auditor Vault`:
  - calitatea dovezii
  - baza validarii
  - verdictul de audit
- se exporta un `Audit Pack` de test

## Criteriu de succes pentru pilot

- utilizatorul poate face cap-coada:
  - scan
  - review
  - dovada
  - export
- fara interventie tehnica din partea noastra dupa onboarding-ul initial

## Dupa onboarding

- notam:
  - blocaje UX
  - blocaje de incredere
  - lipsuri de dovada
  - cazuri in care verdictul a parut prea vag sau prea tare
