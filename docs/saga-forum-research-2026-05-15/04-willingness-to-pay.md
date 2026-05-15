# 04. Willingness-to-pay — Citate explicite "aș plăti pentru..." / "merită X RON"

Citatele de mai jos sunt singurele puncte EMPIRICE pe care le avem pentru a calibra prețul FiscCopilot. Sunt extrase din thread-urile **Keez vs Solo / Sugestii facturare / Experienta Solo**.

---

## A. WTP exprimat direct ("aș da X RON")

> "[Daca un serviciu] sa adun facturi, bonuri fiscale si ordine de deplasare, sa le organizez si sa le trimit. Daca un serviciu din astea **2-3 ore ar face sa dureze 30min, as da 15€ pe luna** (firma mea e micro, entitate de freelancer)."
>
> r/programare, 2024-11-20, "Sugestiile voastre pentru un program de facturare"
> https://reddit.com/r/programare/comments/1gsjoeq/

→ **Anchor: 15€/lună (~75 RON) pentru micro/freelancer dacă produsul economisește 2h.**

---

## B. Prețuri de referință competitori (sublinie ce e "rezonabil")

> "la **Solo plătesc 1200 lei pe an**, plătitor TVA"
> r/RoFiscalitate2, 2025-03-06 — https://reddit.com/r/RoFiscalitate2/comments/1j35jb7/

→ **Solo: 100 RON/lună (1200/an) pentru plătitor TVA, cu facturare + raportări de bază.**

> "**plătesc 119 lei doar ca să am o interfață mișto** cu care nu pot face mai nimic. Ca idee, 90% din task-uri se pot integra într-un soft, care poate fi operat de administrator și verificat de contabil pentru conformitate. ANAF are un API pentru e-factura, și sunt sigur că există ceva și pentru celelalte mizerii."
> r/RoFiscalitate2, 2025-03-04 — https://reddit.com/r/RoFiscalitate2/comments/1j35jb7/

→ **Solo: 119 RON/lună perceput ca preț PREA MARE pentru valoarea curentă.** Există appetit dovedit pentru un produs care livrează cei 90% automatizați.

> "Sigur, **nu merita 119 lei pe luna pt contabilitate** :)."
> r/RoFiscalitate2, 2025-03-04 (același thread)

→ Confirmare: 119 RON/lună = limita superioară. Dacă FiscCopilot e ~50-80 RON și livrează valoare reală, e prețul sweet-spot.

> "Keez creste pretul din nou" — thread întreg cu utilizatori migrând la Solo din cauza prețului
> r/RoFiscalitate2, 2025-03 — https://reddit.com/r/RoFiscalitate2/comments/1j35jb7/

→ Sensibilitate ridicată la creșteri de preț pe verticala asta.

---

## C. WTP implicit prin time saving

> "**Mi-ar conveni sa declar totul pe Irlanda in 3 minute decat sa stau 3 ore in Excel**, dar si asta poate fi contestata."
> r/robursa, 2026-01-31 — https://reddit.com/r/robursa/comments/1qs2yrh/

→ Echivalența 3h → 3min = 60x time saving. La 100 RON/h (cost orar mediu freelancer micro), un produs care face asta merită clar 100+ RON/depunere.

> "**si cand ma gandesc ca am stat vreo 2 ore sa imi bat capul**...si a mers asa repede!"
> SAGA Forum, 2026-04-01

→ 2 ore pierdute pe O eroare D112. Multiplicat per lună pe X firme (contabil cu 10 firme = 20h/lună = 2000 RON cost de oportunitate). FiscCopilot la 50 RON/firmă = ROI evident.

---

## D. Pain de plată echivalent (cât pierzi dacă nu acționezi)

> "primesc somatie cu titlu de executare sa platesc 8500 de ron pentru acei 3500 plus accesorii"
> r/RoFiscalitate2, 2026-05-10 — https://reddit.com/r/RoFiscalitate2/comments/1rw348v/

→ Penalități = 142% supliment. Un produs care previne ratarea termenelor are valoare implicită = % din suma datorată.

> "Penalitatea de nedeclarare este de 0,08%/zi, iar dobanda este de 0,02%/zi. **Daca se achita toata suma datorata, penalitatea de nedeclarare se reduce cu 75%.**"
> r/RoFiscalitate2, 2025-07-23

→ **Insight pricing:** dacă FiscCopilot ajută utilizatorul să rezolve înainte de termenul de plată, el economisește efectiv 25-75% din amenda potențială. Pe 5000 RON → 1250-3750 RON economisiți. Justifică abonament 100 RON/lună cu un singur incident/an.

---

## E. Disponibilitate să plătească pentru consultanță fiscală individuală

> "Costă doar 50 lei taxă de timbru să îi dai în judecată fără avocat"
> r/RoFiscalitate2, 2026-03-18

> "Am vorbit si cu un avocat. Ce altceva as mai putea face?" (sugerează că deja a plătit consultatie juridică)
> r/RoFiscalitate2, 2026-03-17

→ Există apetit clar pentru consultanță plătită — dar la prețuri de avocat (300-600 RON/oră). FiscCopilot poate substitui consultanță fiscală 1-on-1 la o fracțiune din preț.

---

## F. WTP semnal indirect din volum de comentarii pe thread-uri "merită X?"

| Thread | Upvotes | Implicit WTP |
|---|---|---|
| "Experienta Solo - cum am pierdut bani" | 94 | Confirmă că utilizatorii care plătesc Solo s-ar muta dacă există alternativă |
| "Keez vs StartCo" | 7 (mic, nișă) | Compară prețuri activ |
| "Keez creste pretul din nou" | 27 | Sensibilitate price hike |
| "Sugestiile voastre program facturare" | 6 (mic) | Listă explicită nevoi |

---

## Recomandare pricing FiscCopilot (calibrat empiric)

| Tier | Preț | Justificare empirică |
|---|---|---|
| **Free / Trial** | 0 RON | Prima D406 sau primă reconciliere broker gratuite. Convertește pe pain (oricine intră a primit deja o somație). |
| **Starter (freelancer / PFA / micro)** | 49 RON/lună | Sub anchor-ul 75 RON; sub Solo 100 RON; ridiculizat 119 nu va fi. Single user, 1 firmă. |
| **Pro (SRL micro / SRL TVA)** | 99 RON/lună | Aliniat cu Solo plătitor TVA; +1 RON peste 99 ridiculizat de comunitate ca "interfață mișto cu care nu fac nimic". Multi-firmă (până la 3), watchdog SPV, brokeri inclus. |
| **Studio (contabil / consultant fiscal)** | 299-499 RON/lună | 10-30 firme, dashboard portfolio, alerte termene per client. Valoare: 20h/lună pe care le pierde manual cu erori D112/D406. |

**Pricing-killer differentiator (vs Solo):**
- Solo = 119 RON pentru "interfață mișto" perceput slab. FiscCopilot = 49-99 RON pentru "rezolvă efectiv eroarea X".
- Solo are chatbot care zice "du-te la București pentru 070". FiscCopilot trebuie să răspundă corect cu fundamentare normativă citată.

---

## Caveat metodologic

Eșantionul WTP empiric este **mic** (~5 citate directe). Cifrele de mai sus sunt indicative, nu validate. **Recomandare:** rulează un Wizard of Oz / fake door test pe landing cu trei niveluri de preț (49 / 79 / 119 RON) și măsoară conversia înainte de a fixa pricing-ul oficial.
