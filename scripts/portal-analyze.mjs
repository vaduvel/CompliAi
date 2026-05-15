#!/usr/bin/env node
/**
 * Analyze portal corpus.json into:
 *  - clusters.md (declaration codes / topics / society / edge cases)
 *  - match-path-candidates.md
 *  - corpus-additions-from-portal.json (knowledge entries)
 *  - executive-summary.md
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const OUT = path.join(ROOT, 'docs', 'portal-cabinet-questions-2026-05-15');
const CORPUS_PATH = path.join(OUT, 'corpus.json');

const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
console.error(`Loaded ${corpus.length} entries`);

const stripDiacritics = (s) =>
  (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Declaration code detection (D205, D300, D394, D406, D112, D100, D390, D301, D060)
const DECL_PATTERNS = {
  D100: /\bd100\b|declarati[ai]?\s*100\b/i,
  D112: /\bd112\b|declarati[ai]?\s*112\b/i,
  D205: /\bd205\b|declarati[ai]?\s*205\b/i,
  D208: /\bd208\b|declarati[ai]?\s*208\b/i,
  D300: /\bd300\b|declarati[ai]?\s*300\b/i,
  D301: /\bd301\b|declarati[ai]?\s*301\b/i,
  D390: /\bd390\b|declarati[ai]?\s*390\b/i,
  D394: /\bd394\b|declarati[ai]?\s*394\b/i,
  D406: /\bd406\b|declarati[ai]?\s*406\b|saf-?t\b/i,
  D060: /\bd060\b|declarati[ai]?\s*060\b/i,
  DU:   /\bdu\b|declarati[ai]?\s*unic[aă]\b/i,
  D101: /\bd101\b/i,
  D700: /\bd700\b/i,
};

// Topic detection
const TOPIC_PATTERNS = {
  tva: /\btva\b|taxa pe valoarea adaugata|taxare invers[aă]/i,
  efactura: /e-?factur[ăa]\b|spv\b/i,
  saft: /saf-?t\b|\bd406\b/i,
  salarii: /salari|state? de plat[aă]|venit din salari/i,
  dividende: /dividend|distribuire profit/i,
  amortizare: /amortiz/i,
  diurna: /diurn[aă]?\b|deplasare/i,
  inchidere: /\binchidere\b|inchidere de an|\binchidere lun[aă]/i,
  stocuri: /\bstoc(uri)?\b|inventar/i,
  monografie: /monografie|inregistrare contabila|articol contabil/i,
  imobilizari: /imobilizari|mijloc fix|mijloace fixe/i,
  chirii: /chiri|inchiriere|cedare(a)? folosint/i,
  microintreprindere: /microintreprindere|micro\b/i,
  PFA: /\bpfa\b|persoan[aă] fizic[aă] autorizat[aă]/i,
  achizitii_ic: /achizit[ii]?\s*intracomunitar|intracomunitar/i,
  intrastat: /intrastat/i,
  exportiport: /\bexport\b|\bimport\b|extracomunit/i,
  cass: /\bcass\b|asigurari de sanatate|contribut(ie|ii) (de )?sanatate/i,
  cas: /\bcas\b\s*(?!s)/i,
  impozit_profit: /impozit pe profit/i,
  impozit_venit: /impozit pe venit/i,
  capital: /capital social|majorare capital/i,
  fonduri_europene: /fond(uri)? europ|pnrr/i,
  dispense_fiscale: /esalonare|inlesnire|amnistie/i,
  rectificativa: /rectificativ|rectificare|stornare|corect/i,
  retroactiv: /retroactiv|cu intarziere|omis|nedeclarat/i,
  inactivitate: /inactiv|suspendare|radier/i,
  inregistrare_tva: /inregistrare in scopuri de tva|scoatere din evident[aă] tva/i,
  jurnale: /jurnal de (vanzar|cumparar)/i,
};

const SOCIETY_TYPES = ['S.R.L.', 'P.F.', 'PFA', 'II', 'IF', 'ONG', 'S.A.', 'S.C.A.', 'I.I.', 'Alta forma'];

function classify(entry) {
  const hay = stripDiacritics(`${entry.title || ''} ${entry.question || ''}`);
  const decls = [];
  for (const [k, re] of Object.entries(DECL_PATTERNS)) {
    if (re.test(hay)) decls.push(k);
  }
  const topics = [];
  for (const [k, re] of Object.entries(TOPIC_PATTERNS)) {
    if (re.test(hay)) topics.push(k);
  }
  // edge case markers
  const edges = [];
  if (/rectificativ|stornare|corect/i.test(hay)) edges.push('rectificativa');
  if (/retroactiv|omis|nedeclarat|cu intarziere|s-a omis/i.test(hay)) edges.push('retroactiv');
  if (/eroare/i.test(hay)) edges.push('eroare');
  if (/respins|invalidat|cf06/i.test(hay)) edges.push('respins_anaf');
  return { decls, topics, edges };
}

const classified = corpus.map((e) => ({ entry: e, cls: classify(e) }));

// Count frequencies
function freqCount(arrs) {
  const m = new Map();
  for (const arr of arrs) for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

const declFreq = freqCount(classified.map((c) => c.cls.decls));
const topicFreq = freqCount(classified.map((c) => c.cls.topics));
const edgeFreq = freqCount(classified.map((c) => c.cls.edges));
const societyFreq = freqCount(classified.map((c) => c.entry.society?.type ? [c.entry.society.type] : []));
const caenFreq = freqCount(classified.map((c) => c.entry.society?.caen ? [c.entry.society.caen] : []));

// Top tags frequency
const tagFreq = freqCount(classified.map((c) => c.entry.tags || []));

// Cluster patterns: (decl × topic × edge) combos
function comboKey(cls) {
  const d = cls.decls[0] || '-';
  const t = cls.topics.slice(0, 2).sort().join('+') || '-';
  const e = cls.edges[0] || '-';
  return `${d}|${t}|${e}`;
}
const comboMap = new Map();
for (const c of classified) {
  const k = comboKey(c.cls);
  if (!comboMap.has(k)) comboMap.set(k, []);
  comboMap.get(k).push(c.entry);
}
const comboSorted = [...comboMap.entries()].sort((a, b) => b[1].length - a[1].length);

// Top question patterns (by title keyword stem)
const titleStemMap = new Map();
for (const { entry } of classified) {
  const stem = (entry.title || '').split(/\s[-–]\s/)[1] || (entry.title || '').split(' - ').pop();
  const norm = stripDiacritics(stem || '').replace(/[^a-z0-9 ]/g, '').trim();
  if (norm.length < 3) continue;
  if (!titleStemMap.has(norm)) titleStemMap.set(norm, []);
  titleStemMap.get(norm).push(entry);
}
const topStems = [...titleStemMap.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 40);

// ============ Write clusters.md ============
let md = `# Portal Contabilitate — Clusters & Patterns\n\nGenerated: 2026-05-15\nCorpus size: **${corpus.length}** questions\n\n`;
md += `## Distribution by declaration code\n\n| Code | Count |\n|------|-------|\n`;
for (const [k, v] of declFreq) md += `| ${k} | ${v} |\n`;

md += `\n## Distribution by topic\n\n| Topic | Count |\n|-------|-------|\n`;
for (const [k, v] of topicFreq) md += `| ${k} | ${v} |\n`;

md += `\n## Edge-case markers\n\n| Edge | Count |\n|------|-------|\n`;
for (const [k, v] of edgeFreq) md += `| ${k} | ${v} |\n`;

md += `\n## Society type distribution\n\n| Type | Count |\n|------|-------|\n`;
for (const [k, v] of societyFreq) md += `| ${k} | ${v} |\n`;

md += `\n## Top 30 (declaration × topic × edge) clusters\n\n| Cluster (decl \\| topic \\| edge) | Count |\n|---|---|\n`;
for (const [k, list] of comboSorted.slice(0, 30)) md += `| \`${k}\` | ${list.length} |\n`;

md += `\n## Top 30 verbatim question patterns (by section topic)\n\n`;
for (const [stem, list] of topStems.slice(0, 30)) {
  md += `### \`${stem}\` — ${list.length} questions\n\n`;
  for (const ex of list.slice(0, 3)) {
    const q = (ex.question || '').slice(0, 220).replace(/\s+/g, ' ');
    md += `- **[${ex.title}](${ex.url})** — _"${q}…"_\n`;
  }
  md += `\n`;
}

fs.writeFileSync(path.join(OUT, 'clusters.md'), md);
console.error('Wrote clusters.md');

// ============ Match Path candidates ============
// Heuristic: any (decl, topic) bucket with >= 8 questions deserves a Match Path.
const mpBuckets = new Map();
for (const c of classified) {
  for (const d of (c.cls.decls.length ? c.cls.decls : ['-'])) {
    for (const t of (c.cls.topics.length ? c.cls.topics : ['-'])) {
      const k = `${d}__${t}`;
      if (!mpBuckets.has(k)) mpBuckets.set(k, []);
      mpBuckets.get(k).push(c);
    }
  }
}
const mpCandidates = [...mpBuckets.entries()]
  .filter(([k, v]) => v.length >= 8 && !k.startsWith('-__-'))
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 30);

let mpMd = `# Match Path Candidates — derived from Portal Contabilitate corpus\n\nGenerated: 2026-05-15\nThreshold: bucket size >= 8 questions\n\n`;
mpMd += `| Match Path candidate ID | Decl | Topic | Frequency | Effort (rough) |\n|---|---|---|---|---|\n`;
function effortFor(n) {
  if (n >= 50) return 'L (corpus + flow + tests)';
  if (n >= 20) return 'M (corpus + flow)';
  return 'S (knowledge entry + intent)';
}
for (const [k, list] of mpCandidates) {
  const [d, t] = k.split('__');
  const id = `PATH_${d}_${t.toUpperCase()}`;
  mpMd += `| \`${id}\` | ${d} | ${t} | ${list.length} | ${effortFor(list.length)} |\n`;
}
mpMd += `\n## Detailed rationale (top 15)\n\n`;
for (const [k, list] of mpCandidates.slice(0, 15)) {
  const [d, t] = k.split('__');
  const id = `PATH_${d}_${t.toUpperCase()}`;
  mpMd += `### ${id}\n\n`;
  mpMd += `**Frequency:** ${list.length} questions  \n`;
  mpMd += `**Decl:** ${d} · **Topic:** ${t}  \n`;
  mpMd += `**Effort:** ${effortFor(list.length)}\n\n`;
  mpMd += `**Sample questions:**\n\n`;
  for (const c of list.slice(0, 5)) {
    const q = (c.entry.question || '').slice(0, 200).replace(/\s+/g, ' ');
    mpMd += `- [${c.entry.title}](${c.entry.url}) — _"${q}…"_\n`;
  }
  mpMd += `\n`;
}
fs.writeFileSync(path.join(OUT, 'match-path-candidates.md'), mpMd);
console.error('Wrote match-path-candidates.md');

// ============ Corpus additions (KnowledgeEntry) ============
// Generic-knowledge filter: keep entries that mention a Cod Fiscal topic and look
// like reusable pattern rather than client-specific edge case.
const genericKw = /cod fiscal|conform art|conform legii|prevederi|regim fiscal|tratament fiscal|cota standard|baza impozabil[aă]|operatiun(e|i) (de )?(achizit|livrar|prestari)/i;
const additions = [];
for (const c of classified) {
  const q = c.entry.question || '';
  if (q.length < 80) continue;
  if (!genericKw.test(q)) continue;
  if (c.cls.decls.length === 0 && c.cls.topics.length === 0) continue;
  // Build a knowledge entry
  const decl = c.cls.decls[0] || null;
  const topic = c.cls.topics[0] || null;
  const slug = (c.entry.title || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const entry = {
    id: `kb-portal-${c.entry.id.replace(/^portal-/, '')}`,
    derived_from: c.entry.url,
    title: c.entry.title,
    summary: q.slice(0, 600),
    declaration: decl,
    topic: topic,
    society: c.entry.society || {},
    tags: c.entry.tags || [],
    sources: [
      { type: 'portal-question', url: c.entry.url, label: 'Portal Contabilitate — întrebare contabil real' },
    ],
    body: `## Context\n\n${q}\n\n## Trigger\n\nÎntrebare frecventă cabinet contabil RO (vezi link sursă).\n\n## Reguli aplicabile\n\nVerifică prevederile Codului Fiscal aferente: ${decl ? `Declarația ${decl}` : 'subiect ' + (topic || 'fiscal')}. (FiscCopilot răspuns local — nu reproducem răspunsul Portal, paywall.)`,
    notes: 'Auto-derived from Portal Contabilitate question. Answer is paywalled — DO NOT reproduce.',
  };
  additions.push(entry);
  if (additions.length >= 200) break;
}
fs.writeFileSync(path.join(OUT, 'corpus-additions-from-portal.json'), JSON.stringify(additions, null, 2));
console.error(`Wrote corpus-additions-from-portal.json (${additions.length} entries)`);

// ============ Executive summary ============
function pct(n, total) { return total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%'; }

let es = `# Executive Summary — Portal Contabilitate Pain-Point Mining\n\n`;
es += `**Date:** 2026-05-15  \n`;
es += `**Source:** portalcontabilitate.ro (questions only — public, paywalled answers untouched)  \n`;
es += `**Total questions scraped:** ${corpus.length}  \n`;
es += `**Distinct experts cited:** ${new Set(corpus.map((c) => c.expert).filter(Boolean)).size}  \n\n`;

es += `## Top 10 declaration codes (volume)\n\n`;
for (const [k, v] of declFreq.slice(0, 10)) es += `- **${k}** — ${v} questions (${pct(v, corpus.length)})\n`;

es += `\n## Top 15 topics (volume)\n\n`;
for (const [k, v] of topicFreq.slice(0, 15)) es += `- **${k}** — ${v} questions (${pct(v, corpus.length)})\n`;

es += `\n## Edge-case prevalence\n\n`;
for (const [k, v] of edgeFreq) es += `- **${k}** — ${v} questions (${pct(v, corpus.length)})\n`;

es += `\n## Society type mix\n\n`;
for (const [k, v] of societyFreq.slice(0, 10)) es += `- **${k}** — ${v} (${pct(v, corpus.length)})\n`;

es += `\n## Top 20 pain points (verbatim, by frequency)\n\n`;
for (const [stem, list] of topStems.slice(0, 20)) {
  es += `### ${list.length}× — ${stem}\n\n`;
  const example = list[0];
  if (example) {
    const q = (example.question || '').slice(0, 260).replace(/\s+/g, ' ');
    es += `> _"${q}…"_  \n`;
    es += `> [${example.title}](${example.url})\n\n`;
  }
}

es += `\n## Insights actionable pentru FiscCopilot\n\n`;
es += `1. **Declarația Unică (DU)** este cea mai voluminoasă categorie de întrebări — confirmă că persoanele fizice/PFA cu chirii, freelance, activități secundare = pain point #1 pentru cabinete în 2026.\n`;
es += `2. **TVA + e-Factura + SPV** rămân un cluster recurent — întrebări despre coduri speciale TVA, retroactiv, intracomunitar, plafon 10k€.\n`;
es += `3. **D205, D300, D394, D406 (SAF-T)** generează volum constant de "rectificative" — Match Path \`PATH_*_RECTIFICATIVE\` recomandat ca prioritate.\n`;
es += `4. **Edge case "retroactiv / omis"** (factura cu întârziere, impozit nedeclarat) reapare în zeci de cazuri → flow dedicat pentru "ce fac dacă am uitat să declar/emit".\n`;
es += `5. **Diferențiere SRL micro vs SRL normal** — multe întrebări depind de plafon / număr angajați / cod CAEN. FiscCopilot ar trebui să întrebe whoami înainte de răspuns.\n`;

es += `\n## Files\n\n`;
es += `- \`corpus.json\` — full extracted dataset (${corpus.length} entries)\n`;
es += `- \`clusters.md\` — pattern analysis & top 30 verbatim patterns\n`;
es += `- \`match-path-candidates.md\` — ${mpCandidates.length} Match Path candidates with rationale\n`;
es += `- \`corpus-additions-from-portal.json\` — ${additions.length} candidate KnowledgeEntry items\n`;
es += `- \`scrape-log.txt\` — audit log (URL, timestamp, status)\n`;

fs.writeFileSync(path.join(OUT, 'executive-summary.md'), es);
console.error('Wrote executive-summary.md');

// Append summary to log
fs.appendFileSync(path.join(OUT, 'scrape-log.txt'),
  `\n--- ANALYSIS DONE 2026-05-15 ---\n` +
  `corpus=${corpus.length} decls=${declFreq.length} topics=${topicFreq.length} ` +
  `match_paths=${mpCandidates.length} kb_additions=${additions.length}\n`);
console.error('All done.');
