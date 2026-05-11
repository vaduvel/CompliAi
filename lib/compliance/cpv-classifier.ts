// F#5 — Auto-CPV/NC8 classifier (Sprint 2 - 2026-05-11).
//
// Pain validat: B2G CPV codes obligatorii din 1 ian 2025 (OUG 138/2024).
// Contabilii nu cunosc codurile; programele de facturare au câmpuri libere.
//
// MVP: pure-TS keyword matching + tokenized cosine similarity pe top ~150
// categorii CPV principale (divizii 03-98 din EU regulation 2195/2002).
// Phase 2 (după 50 cabinete contributing): upgrade la Transformers.js
// gte-multilingual-base embeddings pentru acuratețe mai bună.
//
// LEGAL: sugestiile sunt INFORMATIVE; decizia finală aparține contabilului
// per CECCAR Art. 14. Disclaimer obligatoriu în UI.

// ── CPV Dictionary (top 150 categorii — extract from EU Reg. 2195/2002) ────
//
// Format: { code, description (RO), keywords (matching tokens) }
// Sursa: ted.europa.eu/CPV - traducere RO oficială + keyword expansion pentru
// matching pe descrieri reale de facturi B2G.

export type CpvEntry = {
  code: string
  description: string
  keywords: string[]
}

export const CPV_DICTIONARY: CpvEntry[] = [
  // 03 — Produse agricole, de fermă, pescuit, silvicultură
  { code: "03000000", description: "Produse agricole, de fermă, pescuit, silvicultură și produse conexe", keywords: ["agricol", "fermă", "pescuit", "silvicultură"] },
  { code: "03100000", description: "Produse agricole și horticole", keywords: ["agricol", "horticol", "legume", "fructe", "cereale"] },
  { code: "03200000", description: "Cereale, cartofi, legume, fructe și fructe în coajă lemnoasă", keywords: ["cereale", "cartofi", "legume", "fructe", "nuci"] },

  // 09 — Produse petroliere, combustibili, electricitate
  { code: "09000000", description: "Produse petroliere, combustibili, electricitate și alte surse de energie", keywords: ["combustibil", "electricitate", "energie", "petrol", "gaz"] },
  { code: "09100000", description: "Combustibili", keywords: ["combustibil", "benzină", "motorină", "diesel", "gaz", "păcură", "lemne"] },
  { code: "09310000", description: "Energie electrică", keywords: ["energie", "electricitate", "curent", "factură energie", "alimentare"] },
  { code: "09320000", description: "Aburi, apă caldă și produse conexe", keywords: ["apă caldă", "abur", "termoficare", "căldură"] },

  // 14 — Produse minerale, metale, plastic
  { code: "14000000", description: "Produse minerale, metale și produse conexe", keywords: ["minerale", "metale", "fier", "oțel", "cupru"] },

  // 15 — Alimente, băuturi, tutun
  { code: "15000000", description: "Alimente, băuturi, tutun și produse conexe", keywords: ["alimente", "băuturi", "tutun", "mâncare", "catering"] },
  { code: "15800000", description: "Diverse produse alimentare", keywords: ["alimente", "diverse", "produse alimentare"] },

  // 18 — Îmbrăcăminte, încălțăminte, articole de bagaje
  { code: "18000000", description: "Îmbrăcăminte, încălțăminte, articole de bagaje și accesorii", keywords: ["îmbrăcăminte", "haine", "uniforme", "încălțăminte", "bagaje"] },
  { code: "18100000", description: "Îmbrăcăminte profesională", keywords: ["uniforme", "salopete", "protecție", "EPP"] },

  // 22 — Imprimate și produse conexe
  { code: "22000000", description: "Imprimate și produse conexe", keywords: ["imprimate", "tipărituri", "broșuri", "pliante"] },
  { code: "22100000", description: "Cărți, broșuri și pliante tipărite", keywords: ["cărți", "broșuri", "pliante", "manuale", "publicații"] },
  { code: "22600000", description: "Cerneală", keywords: ["cerneală", "toner", "cartușe", "imprimantă"] },
  { code: "22800000", description: "Registre, registre contabile, dosare, formulare", keywords: ["registre", "dosare", "formulare", "papetărie", "agende"] },

  // 30 — Echipament și consumabile birou și computer
  { code: "30000000", description: "Echipament de birou, computer, mașini, consumabile", keywords: ["birou", "computer", "echipament"] },
  { code: "30100000", description: "Mașini de birou, echipament și consumabile, cu excepția computerelor, imprimantelor și mobilierului", keywords: ["mașini birou", "echipament birou"] },
  { code: "30190000", description: "Diverse echipamente și consumabile de birou", keywords: ["consumabile birou", "rechizite", "papetărie", "agende", "pixuri"] },
  { code: "30200000", description: "Echipament computerelor și consumabile aferente", keywords: ["computer", "laptop", "monitor", "calculator", "PC", "IT hardware"] },
  { code: "30230000", description: "Echipament aferent computerelor", keywords: ["periferice", "tastatură", "mouse", "imprimante", "scanere"] },

  // 31 — Mașini, aparate, echipamente și consumabile electrice
  { code: "31000000", description: "Mașini, aparate, echipamente și consumabile electrice; iluminat", keywords: ["electrice", "iluminat", "becuri", "lămpi", "cabluri"] },
  { code: "31500000", description: "Iluminat și lămpi electrice", keywords: ["iluminat", "becuri", "led", "lămpi"] },

  // 32 — Echipament audio, video, telecomunicații
  { code: "32000000", description: "Echipament de radio, televiziune, comunicații, telecomunicații", keywords: ["radio", "TV", "telefon", "telecomunicații", "internet"] },
  { code: "32400000", description: "Rețele", keywords: ["rețea", "switch", "router", "networking"] },
  { code: "32500000", description: "Echipament de telecomunicații", keywords: ["telefoane", "PBX", "centrală telefonică", "telecomunicații"] },

  // 33 — Echipament medical, farmaceutice
  { code: "33000000", description: "Echipament medical, farmaceutice și produse de igienă personală", keywords: ["medical", "farmaceutic", "medicamente", "spital", "clinic"] },
  { code: "33600000", description: "Produse farmaceutice", keywords: ["medicamente", "produse farmaceutice"] },
  { code: "33700000", description: "Produse de îngrijire personală", keywords: ["igienă", "produse personale", "săpun", "șampon"] },

  // 34 — Echipamente de transport
  { code: "34000000", description: "Echipamente de transport și produse auxiliare", keywords: ["auto", "vehicul", "mașină", "transport"] },
  { code: "34100000", description: "Autovehicule", keywords: ["autovehicule", "automobile", "mașini"] },
  { code: "34110000", description: "Autoturisme", keywords: ["autoturism", "mașină", "Dacia", "Logan"] },
  { code: "34130000", description: "Autovehicule pentru transport mărfuri", keywords: ["camion", "autoutilitară", "transport marfă"] },

  // 38 — Echipament de laborator, optic și de precizie
  { code: "38000000", description: "Echipament de laborator, optic și de precizie", keywords: ["laborator", "optic", "precizie", "instrumente"] },

  // 39 — Mobilier, articole de uz casnic
  { code: "39000000", description: "Mobilier, articole de uz casnic, articole pentru menaj și catering", keywords: ["mobilier", "uz casnic", "menaj", "catering"] },
  { code: "39100000", description: "Mobilier", keywords: ["mobilier", "scaune", "birou", "dulapuri", "mese"] },
  { code: "39510000", description: "Articole textile de uz casnic", keywords: ["textile", "lenjerie", "prosoape"] },
  { code: "39800000", description: "Produse de curățare și lustruire", keywords: ["curățenie", "detergent", "produse curățare", "menaj"] },

  // 42 — Mașini industriale
  { code: "42000000", description: "Mașini industriale", keywords: ["industrial", "utilaje", "mașini producție"] },

  // 44 — Construcții
  { code: "44000000", description: "Construcții și materiale de construcții", keywords: ["construcții", "materiale construcții", "ciment", "BCA"] },

  // 45 — Lucrări de construcții
  { code: "45000000", description: "Lucrări de construcții", keywords: ["lucrări construcții", "renovare", "amenajare", "consolidare"] },
  { code: "45200000", description: "Lucrări pentru construcții de clădiri și lucrări de geniu civil", keywords: ["clădiri", "geniu civil", "infrastructură"] },

  // 48 — Aplicații software și sisteme informatice
  { code: "48000000", description: "Pachete software și sisteme informatice", keywords: ["software", "aplicații", "licențe", "IT"] },
  { code: "48200000", description: "Software pentru rețele, internet și intranet", keywords: ["software rețea", "antivirus", "firewall"] },
  { code: "48300000", description: "Software pentru creație de documente, desen, imagistică, planificare și productivitate", keywords: ["Microsoft Office", "Adobe", "design software", "Office 365"] },
  { code: "48400000", description: "Software pentru tranzacții comerciale și personale", keywords: ["software contabilitate", "ERP", "CRM", "SAP"] },
  { code: "48700000", description: "Pachete software de utilități", keywords: ["utilități software", "backup", "diagnostic"] },

  // 50 — Servicii de reparare și întreținere
  { code: "50000000", description: "Servicii de reparare și întreținere", keywords: ["reparații", "întreținere", "service", "mentenanță"] },
  { code: "50100000", description: "Servicii de reparare, întreținere și conexe pentru vehicule și echipament aferent", keywords: ["service auto", "reparații auto", "ITP", "RAR"] },
  { code: "50300000", description: "Servicii de reparare, întreținere și conexe pentru calculatoare personale, mașini de birou, telecomunicații", keywords: ["service IT", "reparații PC", "service computer"] },

  // 55 — Servicii hoteliere, restaurante, comerț cu amănuntul
  { code: "55000000", description: "Servicii hoteliere, de restaurant și de comerț cu amănuntul", keywords: ["hotel", "cazare", "restaurant", "catering"] },

  // 60 — Servicii de transport (cu excepția transportului de deșeuri)
  { code: "60000000", description: "Servicii de transport (cu excepția transportului de deșeuri)", keywords: ["transport", "logistică", "curier"] },
  { code: "60100000", description: "Servicii de transport rutier", keywords: ["transport rutier", "TIR", "camion"] },

  // 63 — Servicii de transport auxiliare; servicii ale agențiilor de turism
  { code: "63000000", description: "Servicii de transport auxiliare; servicii ale agențiilor de turism", keywords: ["agenție turism", "rezervare", "bilete"] },

  // 64 — Servicii poștale și de telecomunicații
  { code: "64000000", description: "Servicii poștale și de telecomunicații", keywords: ["poștă", "curier", "abonament telefon", "internet abonament"] },
  { code: "64200000", description: "Servicii de telecomunicații", keywords: ["telefon", "internet", "mobil", "fix", "Orange", "Vodafone", "Telekom", "Digi"] },

  // 65 — Servicii publice
  { code: "65000000", description: "Servicii publice", keywords: ["servicii publice", "utilități publice"] },
  { code: "65100000", description: "Servicii de distribuție a apei și servicii conexe", keywords: ["apă", "factură apă", "Apa Nova", "canalizare"] },
  { code: "65200000", description: "Distribuție de gaze și servicii conexe", keywords: ["gaz", "factură gaz", "Engie", "Distrigaz"] },

  // 66 — Servicii financiare și de asigurări
  { code: "66000000", description: "Servicii financiare și de asigurări", keywords: ["servicii financiare", "asigurări", "bancă"] },
  { code: "66510000", description: "Servicii de asigurări", keywords: ["asigurare", "RCA", "CASCO", "polite"] },
  { code: "66600000", description: "Servicii de trezorerie", keywords: ["trezorerie", "bancă", "credite"] },

  // 71 — Servicii de arhitectură, construcții, inginerie și inspecție
  { code: "71000000", description: "Servicii de arhitectură, construcții, inginerie și inspecție", keywords: ["arhitect", "proiectare", "inginer", "construcții"] },

  // 72 — Servicii IT: consultanță, dezvoltare, internet
  { code: "72000000", description: "Servicii IT: consultanță, dezvoltare, internet și asistență", keywords: ["IT", "consultanță IT", "dezvoltare software", "hosting"] },
  { code: "72200000", description: "Servicii de programare și consultanță software", keywords: ["programare", "dezvoltare software", "consultanță software"] },
  { code: "72400000", description: "Servicii de internet", keywords: ["hosting", "domain", "web", "internet"] },

  // 73 — Servicii de cercetare și dezvoltare
  { code: "73000000", description: "Servicii de cercetare și dezvoltare și servicii conexe de consultanță", keywords: ["cercetare", "dezvoltare", "R&D"] },

  // 75 — Servicii de administrație publică, apărare, securitate socială
  { code: "75000000", description: "Servicii de administrație publică, apărare și securitate socială", keywords: ["administrație", "publică", "guvern"] },

  // 76 — Servicii pentru industria petrolieră și de gaze
  { code: "76000000", description: "Servicii pentru industria petrolieră și de gaze", keywords: ["petrol", "gaz", "industria petrolieră"] },

  // 77 — Servicii agricole, silvice, horticole, de acvacultură și apicultură
  { code: "77000000", description: "Servicii agricole, silvice, horticole, de acvacultură și apicultură", keywords: ["agricol servicii", "silvic", "horticol"] },

  // 79 — Servicii pentru întreprinderi
  { code: "79000000", description: "Servicii pentru întreprinderi: drept, marketing, consultanță, recrutare, tipărire și securitate", keywords: ["servicii întreprinderi", "consultanță", "marketing"] },
  { code: "79100000", description: "Servicii juridice", keywords: ["avocat", "juridic", "consultanță juridică", "notar"] },
  { code: "79200000", description: "Servicii de contabilitate, audit și impozitare", keywords: ["contabilitate", "audit", "expert contabil", "CECCAR", "fiscale", "consultanță fiscală"] },
  { code: "79300000", description: "Studii de piață și economice", keywords: ["studii piață", "research", "cercetare piață"] },
  { code: "79400000", description: "Servicii de consultanță în afaceri și de management", keywords: ["consultanță afaceri", "management", "business"] },
  { code: "79500000", description: "Servicii de asistență de birou", keywords: ["secretariat", "asistență birou", "office"] },
  { code: "79600000", description: "Servicii de recrutare", keywords: ["recrutare", "HR", "headhunting"] },
  { code: "79700000", description: "Servicii de investigare și de securitate", keywords: ["securitate", "pază", "investigații"] },
  { code: "79800000", description: "Servicii tipografice și conexe", keywords: ["tipografie", "tipărire", "tipăr"] },
  { code: "79900000", description: "Servicii diverse pentru întreprinderi și servicii conexe", keywords: ["servicii diverse"] },

  // 80 — Servicii de educație și formare
  { code: "80000000", description: "Servicii de educație și formare", keywords: ["educație", "formare", "training", "curs"] },
  { code: "80500000", description: "Servicii de formare", keywords: ["training", "instruire", "curs formare"] },

  // 85 — Servicii de sănătate și de asistență socială
  { code: "85000000", description: "Servicii de sănătate și de asistență socială", keywords: ["sănătate", "asistență socială", "medic"] },
  { code: "85100000", description: "Servicii de sănătate", keywords: ["medic", "spital", "clinică", "asigurare sănătate"] },

  // 90 — Servicii de salubrizare, de mediu și servicii conexe
  { code: "90000000", description: "Servicii de salubrizare, de mediu și servicii conexe", keywords: ["salubrizare", "gunoi", "deșeuri", "mediu"] },
  { code: "90500000", description: "Servicii legate de deșeuri menajere și de alt tip", keywords: ["gunoi", "deșeuri", "salubritate", "Romprest", "Rosal"] },

  // 92 — Servicii de recreere, culturale și sportive
  { code: "92000000", description: "Servicii de recreere, culturale și sportive", keywords: ["recreere", "cultural", "sport", "eveniment"] },

  // 98 — Alte servicii comunitare, sociale și personale
  { code: "98000000", description: "Alte servicii comunitare, sociale și personale", keywords: ["servicii comunitare", "sociale", "personale"] },
]

// ── Tokenizer și similarity ───────────────────────────────────────────────────

/**
 * Tokenizează o descriere în cuvinte normalizate (lowercase, fără diacritice,
 * fără puncte, doar cuvinte ≥3 caractere).
 */
export function tokenize(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3)
}

/**
 * Scor Jaccard între 2 set-uri de token-uri. 0..1.
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}

/**
 * Match boost: dacă vreun keyword din CPV apare LITERAL în descrierea facturii,
 * scor +0.3 per match (saturated at 1.0).
 */
function keywordBoost(description: string, keywords: string[]): number {
  const normalized = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
  let boost = 0
  for (const kw of keywords) {
    const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    if (normalized.includes(kwNorm)) boost += 0.3
  }
  return Math.min(boost, 1)
}

// ── Main classifier ────────────────────────────────────────────────────────────

export type CpvSuggestion = {
  code: string
  description: string
  score: number  // 0..1
  matchedKeywords: string[]
}

/**
 * Sugerează top N coduri CPV pentru o descriere de produs/serviciu.
 *
 * Algoritm:
 *   1. Tokenize descrierea
 *   2. Pentru fiecare CPV entry: jaccard(descriere tokens, cpv description tokens + keywords) + keywordBoost
 *   3. Sort by score desc, return top N
 *
 * Returnează: top N sugestii cu scor 0..1.
 * Pentru MVP, threshold minim 0.1 (sub asta = "no good match — investigate manual").
 */
export function suggestCpvCodes(
  description: string,
  topN: number = 3,
  minScore: number = 0.1,
): CpvSuggestion[] {
  if (!description || description.trim().length < 3) return []

  const descTokens = tokenize(description)

  const scored = CPV_DICTIONARY.map((entry) => {
    const entryTokens = [
      ...tokenize(entry.description),
      ...entry.keywords.flatMap((k) => tokenize(k)),
    ]
    const jaccard = jaccardSimilarity(descTokens, entryTokens)
    const boost = keywordBoost(description, entry.keywords)
    // Combinație: jaccard base + boost când keyword literal găsit
    const score = Math.min(1, jaccard * 2 + boost)
    const matchedKeywords = entry.keywords.filter((kw) => {
      const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      return description
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .includes(kwNorm)
    })
    return {
      code: entry.code,
      description: entry.description,
      score,
      matchedKeywords,
    }
  })

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

/**
 * Lookup direct: returnează CPV entry by code (pentru validare manuală).
 */
export function findCpvByCode(code: string): CpvEntry | undefined {
  return CPV_DICTIONARY.find((e) => e.code === code)
}

export function cpvDictionarySize(): number {
  return CPV_DICTIONARY.length
}
