# Răspuns DPO Complet — cele 7 cerințe mapate la sprint dates (28 apr 2026)

**Trimite**: marți 28 apr 2026 dimineața (după update Doc 07)
**Către**: contact@dpocomplet.ro (cabinet pilot)
**Scop**: confirmă că am mapat cele 7 cerințe la roadmap concret + propune pilot strategy revizuit

---

## Email gata de copy/paste

**Subiect**: Re: Verificare pachet Sprint 0.5 — cele 7 cerințe mapate la sprints

```
Bună Diana,

Mulțumesc pentru feedback structurat și pozitiv pe pachetul Sprint 0.5.

Mă bucur că flow-ul cap-coadă a fost convingător — exact lanțul "document 
pregătit cabinet → magic link client → aprobare → dovadă → traceability 
validat" e ce vrem să fie standard în pilot.

Pentru cele 7 cerințe operaționale, am făcut maparea concretă la roadmap-ul 
nostru:

✅ DEJA LIVRAT (Sprint 0.5):
- Issue 4: documentele NU mai au mențiune "AI indisponibil temporar"
  (înlocuit cu: "Document construit din șablon validat de cabinet — versiune 
  deterministică")

🟡 SPRINT 1 (8-30 mai 2026, paralel cu pilot week):
- Issue 3: Reject + Comment flow magic link (S1.2, livrat 13 mai)
- Issue 5: Cookie banner discret pe pagina patron (S1.5+, livrat 14 mai)
- Issue 1: Scoruri consistente Trust Profile vs Audit Pack (S1.9, livrat 30 mai)

🟢 SPRINT 2A (1-15 iun 2026, în pilot week 4):
- Issue 6: Raport lunar cron din activitate reală (S2A.4, livrat 5 iun)
- Issue 2: Baseline validate workflow post-remediere (S2A.5, livrat 8 iun)
- Issue 7: Audit_ready transition automatic după dovezi 100% (S2A.6, livrat 10 iun)

Pilot strategy revizuit:
- Joi 7 mai 15:00 — Kickoff cu Sprint 0.5 product
- Săpt 1 (7-13 mai) — Internal-only cu produsul actual
- Săpt 2 (14-20 mai) — primesti Reject/Comment + Cookie discret + AI on/off + 
  Custom templates UI
- Săpt 3 (21-27 mai) — primesti Trust Profile↔Audit consistency + Email 
  notifications + ICP onboarding
- Săpt 4 (28 mai - 4 iun) — primesti Stripe billing + Monthly digest + 
  Baseline freeze + Audit_ready transition
- Joi 5 iun 15:00 — Final retro cu produs cap-coadă matur (7/7 cerințe livrate)

Asta e pragul DPO real: pilot livrabil incremental cu features noi 
zilnic/săptămânal, NU patch-uri scattered.

Confirmi pilot kickoff Joi 7 mai 15:00 cu această strategie?

Cu bine,
Daniel
CompliScan
daniel@compliscan.ro
```

---

## Mapare detaliată cele 7 → 11 task-uri

| # | Cerința DPO | Task ID Doc 07 | ETA livrare | Săptămâna pilot |
|---|---|---|---|---|
| 4 | Documente fără "AI indisponibil" | (Sprint 0.5 done) | ✅ 27 apr | Disponibil la kickoff |
| 3 | Reject + Comment flow magic link | S1.2 (1.5 zile) | 13 mai | Săpt 2 |
| 5 | Cookie banner discret pe `/shared` | S1.5+ (4h) | 14 mai | Săpt 2 |
| — | Custom templates UI | S1.1 (3 zile) | 13 mai | Săpt 2 |
| — | AI ON/OFF per client | S1.3 (4h) | 16 mai | Săpt 2 |
| — | Signature upload | S1.5 (1 zi) | 15 mai | Săpt 2 |
| — | ICP onboarding choice | S1.6 (2 zile) | 22 mai | Săpt 3 |
| — | UI pending approvals | S1.7 (1 zi) | 23 mai | Săpt 3 |
| — | Email notifications Resend | S1.8 (4h) | 24 mai | Săpt 3 |
| 1 | Trust Profile ↔ Audit Pack score consistency | S1.9 NEW (1 zi) | 30 mai | Săpt 3-4 |
| — | Stripe Checkout live | S2A.1 (2 zile) | 3 iun | Săpt 4 |
| 6 | Raport lunar cron real | S2A.4 (4h) | 5 iun | Săpt 4 |
| 2 | Baseline validate workflow | S2A.5 NEW (1.5 zile) | 8 iun | Post-pilot |
| 7 | Audit_ready transition | S2A.6 NEW (1 zi) | 10 iun | Post-pilot |

**Notă**: Issue 2 + 7 livrate post-pilot (8-10 iun) pentru că depind de Diana ar avea nevoie să închidă remedierile + valida toate dovezile. Realist săpt 4 pilot. Disponibil la final retro pe DPO Complet workspace dacă DPO ajunge la 100% closed.

---

**Maintainer**: Daniel Vaduva
**Trimite**: marți 28 apr 2026 dimineața
**Decizie pe baza răspunsului Diana**: pilot kickoff confirmat 7 mai SAU reschedule la 14 mai dacă Diana cere "așteaptă să fie livrat tot Sprint 1"
