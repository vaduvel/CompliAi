# 01. SAGA — Probleme tehnice (catalog complet)

**Sursa primară:** SAGA Forum (sagasoft.ro/forum) — 120 thread-uri prioritare (>5 replies), perioada 2021-2026.
**Metodologie:** extragere prin matching termen + verificare context. Frecvența = nr. menționări distincte în corpus de 2443 posturi.

---

## Tabel principal

| # | Problemă | Frecvență | Workaround comunitate | Cum o rezolvăm noi (FiscCopilot) | Thread-uri reprezentative |
|---|---|---|---|---|---|
| **1** | **D406/SAF-T — DUKIntegrator nu pornește / "lipsesc fișiere"** | 104 menționări | Reinstalare DUK, ștergere folder %APPDATA%/DUK, descărcare manuală validator nou de pe site ANAF, schimbare manuală tip token (SafeNet, cryptoID, Cloud) | Mapper eroare → root cause + comandă concretă; auto-detect versiune validator vs versiune SAGA și avertizează când nu sunt compatibile | t50015, t53898, t61656, t58489 (D406 cu semnătură cloud), t58406 |
| **2** | **D112 — erori validare la fiecare lună după modificare ANAF** | 91 menționări | "Devalidează statul, actualizează programul, intră pe CM, treci peste, actualizare pontaj, validare". Schimbări manuale în câmpurile B1_5, B1_6, B1_10. Modificare manuală scadență. | Library de "patch-uri D112" indexată după luna ANAF + simbol eroare (atentionare ASIGURATI etc.). Diff vizual între XML generat și XML cerut. | t61595 (D112 martie 2026), t60645 (EROARE D112), t60125 (EROARE D112 oct 2025), t60954 (CASS mod calcul eronat), t48829 (eroare CFS) |
| **3** | **D112 — calcul concediu medical 2026 (NZLCM-1, 5 zile carență angajator, OUG sezonieră)** | 14 menționări CM | Modificare manuală în 75%. Manual D112 la 8.4.3. Recalcul Excel paralel. | Calculator dedicat CM 2026 cu reguli OUG actualizate, transparent (afișează formula); export direct în CSV compatibil SAGA import | t61222 (CALCUL CM 2026, 71 replies), t61166 (CM ian-feb 2026, 61 replies), t61342 (CM februarie), t60919 (neconcordanta D112) |
| **4** | **D112 — REGES Online vs raportare contracte** | 23 menționări REGES | Cerere user/parolă REGES separat la ANAF, refacere manuală a contractelor în 2 sisteme paralele | Sincronizare contracte SAGA → REGES (diff + push), notificări la modificări | t59439 "REGES ONLINE" (**202 replies**!), t58657 (Cerere user/parola, 105 replies), t59500 (52 replies) |
| **5** | **SAGA Web — migrare desktop→web pierde date / format diferit / export Excel greșit (LL-ZZ-AA vs ZZ-LL-AA)** | 84 menționări | Re-introducere manuală facturi neachitate, re-export, conversie format dată în Excel | Validator de migrare (compară numere posturi, date scadente, solduri 401/411 înainte/după); raport diff downloadable | t53641 "Revenire la varianta Desktop" (50 replies, 2023→2025), t54778 "migrare saga web" (54), t55009 (Saga WEB), t60565 "NOUL SAGA WEB" (38), t61282 (Saga Web) |
| **6** | **SAGA — Client-Server: nu se conectează, port 3060, Firebird** | Thread `t56855` 83 replies | "cmd /k netsh advfirewall firewall add rule ... localport=3060"; reinstalare Firebird; configcs.txt manual | Diagnostic offline: scan port, check service Firebird, test conexiune ODBC; sumarizare în limba română pentru contabili non-IT | t60010 (eroare comutare client-server, 9+ replies), t56855 (83), t56692 (67), t59371 "Eroare conectare Saga licenta activa" (34) |
| **7** | **DUKIntegrator — versiuni multiple, conflict tipuri smart card** | 57 menționări DUK | Alege manual: SafeNet / cryptoID / Cloud-PDF semnat ulterior cu Adobe Reader | Wizard "ce semnătură am?" + setup ghidat per tip token; explică care e diferența între token fizic vs cloud | t58489 (D406 cu semnătură cloud), t59136 (Eroare D406), t59385 (depunere D406), t61656 (eroare d406 active 2026) |
| **8** | **e-Factura — facturi primite importate parțial (sumă greșită, linii lipsă)** | 33 menționări | Import manual, completare manuală linii, comparare cu PDF | Validator import e-Factura: hash + diff între XML primit și înregistrare contabilă | t59011 (Cumulare pozitii efactura), t54767 (Eroare e-Factura ian 2024), t56299 (e-factura, 36 replies) |
| **9** | **e-Factura — lipsă auto-trimitere ("robot") după X zile** | Thread t56299 sub-cluster | "Trec pe Oblio/FGO pentru asta". Setare manuală cron extern. | Feature out-of-the-box: trimite la T+N zile (N configurabil); reminder X zile înainte expirare 5 zile lucrătoare | t56299 (e-factura, 36 replies) |
| **10** | **D205 — risc dublare sume la rectificativă (dividende interimare)** | Thread `t61464` | Discuții pe forum; nimeni nu are validator dedicat | Validator D205 dedicat: detectează dividend interimar T1-T3 + plata anterioară; avertizează la dublare | t61464 (D205 Rectificativa, 2026-03) |
| **11** | **D394 — bug ANAF August 2025 blochează depunerea** | Thread t60034 36 replies | "Schimbă cont contabil corect, refă XML, redepune după 24h" | Mirror al regulilor validare ANAF (oglindă FiscCopilot) — detectează bug-uri ANAF înainte ca tu să crezi că e bug propriu | t60034 (Eroare DEC 394 August 2025) |
| **12** | **D101 — neconcordanță notă contabilă - declarație** | 9 menționări | Recalcul manual, refacere D101 | Reconciliator D101 ↔ balanță (412, 691, 121) | t49213 "D101/neconcordanta nota contab.-declaratie" |
| **13** | **D100 — eroare salariu minim 3750 când programul rămâne pe constantă veche** | 10 menționări | Actualizare manuală constantă în meniu setări | Watchdog: detectează schimbare salariu minim în Monitorul Oficial → recomandă update | t55941 (Eroare D100), t60125 |
| **14** | **D300 — discuții sporadice OUG abrogare e-TVA** | 3 menționări | n/a | Brief de informare contextuală pe utilizator când deschide D300 după OUG nouă | sporadic în t197 |
| **15** | **Eroare conectare licență Saga (online obligatoriu)** | Thread t59371 34 replies | "Resetează licență, re-login, completare manuală ID-uri activare" | n/a (problemă licență vendor); FiscCopilot poate doar logă incident |  |
| **16** | **!!!ATENȚIE pe ce dați click!!! — atacuri phishing/ID Saga falsificat** | Thread t58581 66 replies | Awareness comunitate; nu există protecție built-in | Modul "verifică legitimitate cerere SAGA" + bază de URL-uri/ID-uri phishing colectate de comunitate | t58581 |
| **17** | **Gestiune cu mai multe puncte de lucru — setări complexe casa de marcat per punct** | Thread t61219 53 replies | "Setări manuale per operator, per agent, per punct" | Wizard configurare multi-punct; checklist OPANAF 4156 | t61219 (gestiune 3 pdL), t60715 (cod fiscal pdL, 106 replies) |
| **18** | **Asigurări medicale private — preluare D112 manuală pentru fiecare salariat** | Thread t60622 | "Completare manuală pentru fiecare salariat" | Import bulk CSV polițe + map auto la salariat | t60622 (Asigurare Medicala Privata D112) |
| **19** | **Diurnă neimpozabilă — nu se preia automat în D112 (8.4 ok, 8 nu)** | Thread t60975 | Modifică manual la 8.4.3.; venitul brut tot greșit | Patch generator D112: ia diurne și impactează rd. 8 venit brut corect | t60975 (inregistrare diurna D112) |
| **20** | **Cumulare poziții e-Factura / raport gestiune / preț vânzare cu adaos dublat** | Thread t59011 | "Modifică manual prețul"; saga nu schimbă procentul după prima salvare | Detectare dublare adaos comercial + opțiune "revert ultima salvare cu impact preț" | t59011 |
| **21** | **Eroare comutare client-server — IP automat în loc de fix** | Thread t60010 | "Repun IP fix, restart Firebird, configcs.txt cu IP server" | Network diagnostic dedicat SAGA; one-click "exportă configurație rețea pentru suport" | t60010 |
| **22** | **Import din alte aplicații (Pharmec, ContaSAGA→SAGA, etc.)** | Thread t38167 43 replies (deschis 2017→2026!) | Conturi 401 dublate cu sintetice vs analitice; codare manuală furnizor | Mapper "alte ERP → SAGA": detectează coduri furnizori + propune unificare analitice | t38167 |
| **23** | **Cesiune părți capital propriu negative (probleme contabile rare)** | Thread t61813 73 replies (2026-05) | Discuții deschise, fără răspuns SAGA | Speță rezolvată: șablon înregistrări contabile cu fundamentare normativă | t61813 |
| **24** | **D112 — eroare baza calcul șomaj zero când contract mandat** | Thread t60645 | Scriere manuală în b1_10 valoare baza salariu minim | Patch automat pentru contracte mandat fără ore pontaj | t60645 |

---

## Thread-uri SAGA Forum cu cea mai mare presiune (TOP 15)

| Thread ID | Titlu | Replies | Forum | Activ ultimul post | Categorie pain |
|---|---|---:|---|---|---|
| t14733 | noutati versiuni | 683 | tehnice | 2026-02-18 | meta — versionare |
| t197 | Noutati legislative | 643 | legislatie | 2025-11-03 | meta — legislație |
| t50015 | SAF-T - declaratia 406 | 388 | diverse-c | 2026-04-22 | D406 |
| t59439 | REGES ONLINE | 202 | salarii | 2026-05-08 | REGES |
| t53898 | eroare declaratie 406 Saf-T | 111 | diverse-c | 2026-04-29 | D406 |
| t60715 | Cod fiscal pentru fiecare punct de lucru | 106 | legislatie | 2026-05-13 | multi-punct lucru |
| t58657 | Cerere obtinere USER si PAROLA REGES-ONLINE | 105 | legislatie | 2025-09-13 | REGES |
| t56855 | Client Server Client | 83 | tehnice | 2025-11-27 | Firebird / rețea |
| t12511 | registrul de casa | 82 | diverse | 2025-02-15 | speță contabilă |
| t61813 | cesiune parti cap.prop. negative | 73 | diverse-c | 2026-05-14 | speță contabilă |
| t61222 | CALCUL CONCEDIU MEDICAL INCEPAND cu 2026 | 71 | salarii | 2026-05-14 | CM |
| t56692 | Client- server | 67 | diverse-c | 2026-04-21 | Firebird |
| t58581 | !!!ATENȚIE pe ce dați click!!! | 66 | tehnice | 2025-12-09 | securitate |
| t61113 | Calcul tva si impozit auto la marja | 63 | diverse | 2026-02-03 | speță TVA |
| t61166 | concedii medicale ianuarie si februarie | 61 | salarii | 2026-03-31 | CM |

---

## Pattern recurent identificat

**"Saga nu schimbă, deschide manual"** — termenul `Saga nu` apare în 8+ thread-uri distincte; răspunsul tipic al moderatorilor SAGA = "alegeți manual" / "modificați manual" / "scrieți manual în XML". Acesta este **gap-ul de produs strategic**: utilizatorii știu unde e bug-ul dar nu au tool care să automatizeze workaround-ul.

**Citate:**
- "Saga nu știe să facă." (t54468, 2023, despre cota 10% sănătate)
- "Daca Saga nu intentioneaza sa lucreze la Saf-t, macar sa stim sa ne organizam altfel." (t50015, 2022)
- "Astia de la Saga nu-si fac treaba.... O zi cu zambete." (t48849, 2021)
- "saga nu schimba nimic" (t59011, 2025, preț vânzare auto-modificat)
- "Cred ca tot saga ar trebui sa rezolve problema nu sa cautam noi prin foldarele programului." (t61595, 2026)

**Implicație produs:** FiscCopilot poate fi poziționat literalmente ca "ce face Saga când nu vrea să facă" — un layer de **automatizare a workaround-urilor comunitare**.
