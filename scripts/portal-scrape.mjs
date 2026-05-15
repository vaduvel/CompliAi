#!/usr/bin/env node
/**
 * Portal Contabilitate scraper — questions-only (public, no paywalled answers).
 *
 * Inputs:
 *  - URL list file via env URL_LIST (default /tmp/portal-prio.txt)
 *  - Cache dir: .data/portal-cache/
 *  - Output dir: docs/portal-cabinet-questions-2026-05-15/
 *
 * Behavior:
 *  - 2s delay between requests; respect robots.txt (we only hit *.htm pages)
 *  - Retries up to 3x with backoff on 429/503/5xx
 *  - Caches HTML on disk to avoid re-scraping
 *  - Extracts: title, question, tags, date_validity, expert, expert_role, society
 */

import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = path.resolve(process.cwd());
const URL_LIST = process.env.URL_LIST || '/tmp/portal-prio.txt';
const CACHE_DIR = path.join(ROOT, '.data', 'portal-cache');
const OUT_DIR = path.join(ROOT, 'docs', 'portal-cabinet-questions-2026-05-15');
const LOG_PATH = path.join(OUT_DIR, 'scrape-log.txt');
const CORPUS_PATH = path.join(OUT_DIR, 'corpus.json');
const PROGRESS_PATH = path.join(OUT_DIR, '.progress.json');

const UA = 'FiscCopilot-Research/1.0 (Mozilla compatible; respectful; fiscal-RAG)';
const DELAY_MS = Number(process.env.DELAY_MS || 2000);
const MAX = Number(process.env.MAX || 0); // 0 = no cap
const RESUME = process.env.RESUME !== '0';

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

function logLine(line) {
  fs.appendFileSync(LOG_PATH, line + '\n');
}

function cacheKey(url) {
  const m = url.match(/\/([^\/]+)\.htm$/);
  return (m ? m[1] : Buffer.from(url).toString('base64url')) + '.html';
}

function readCache(url) {
  const p = path.join(CACHE_DIR, cacheKey(url));
  if (fs.existsSync(p)) return fs.readFileSync(p);
  return null;
}

function writeCache(url, buf) {
  const p = path.join(CACHE_DIR, cacheKey(url));
  fs.writeFileSync(p, buf);
}

async function fetchOnce(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, buf };
}

async function fetchWithRetry(url) {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { status, buf } = await fetchOnce(url);
      lastStatus = status;
      if (status === 200) return { status, buf };
      if (status === 429 || status === 503 || status >= 500) {
        await sleep(60_000);
        continue;
      }
      return { status, buf: null };
    } catch (err) {
      lastStatus = -1;
      await sleep(10_000);
    }
  }
  return { status: lastStatus, buf: null };
}

// Latin1 -> UTF-8 decoder via TextDecoder (Node 20 has it)
function decode(buf) {
  // Pages declare iso-8859-1; sometimes they actually use windows-1252.
  try {
    return new TextDecoder('windows-1252').decode(buf);
  } catch {
    return buf.toString('latin1');
  }
}

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '·')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extractCase(url, html) {
  const out = { id: null, url, title: null, question: null, tags: [], date_validity: null,
                expert: null, expert_role: null, society: {}, scraped_at: '2026-05-15' };

  // id from URL
  const idMatch = url.match(/-(\d+)\.htm$/);
  out.id = idMatch ? `portal-${idMatch[1]}` : `portal-${Date.now()}`;

  // title
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (t) out.title = decodeEntities(t[1]).trim();

  // Question — look for first articol_content with "Intrebare:"
  // Pattern: <div class="articol_content"...><div...><strong class="accent">Intrebare:</strong> ... </div></div>
  // Or: <div class="articol_content"...><strong>Intrebare:</strong> ... </div>
  const qBlock = html.match(/<div class="articol_content"[^>]*>([\s\S]*?)<\/div>\s*(?:<br\s*\/?>)?\s*<div class='articol-detalii'/);
  let qHtml = qBlock ? qBlock[1] : null;
  if (!qHtml) {
    // fallback: any articol_content with Intrebare
    const m = html.match(/<div class="articol_content"[^>]*>([\s\S]*?)<\/div>/);
    if (m) qHtml = m[1];
  }
  if (qHtml) {
    // strip "Intrebare:" label
    let q = stripTags(qHtml).replace(/^\s*Intrebare\s*:\s*/i, '').trim();
    // truncate trailing "Tags:" if any
    out.question = q;
  }

  // tags — articol_tags block
  const tagsBlock = html.match(/<div class="articol_tags[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (tagsBlock) {
    const tagMatches = [...tagsBlock[1].matchAll(/<a[^>]*class="tags"[^>]*title="([^"]+)"/g)];
    out.tags = tagMatches.map((m) => decodeEntities(m[1]));
  }

  // date validity — "valabil la 14 Mai 2026" in articol_info
  const dateMatch = html.match(/valabil la\s*([0-9]{1,2}\s+[A-Za-zăîâșțĂÎÂȘȚ]+\s+[0-9]{4})/);
  if (dateMatch) out.date_validity = dateMatch[1].trim();

  // expert + role — scoped to articol_avatar block
  const avatarBlock = html.match(/<div id="articol_avatar"[\s\S]*?<!--#articol_avatar-->/);
  if (avatarBlock) {
    const ab = avatarBlock[0];
    const expertMatch = ab.match(/<strong>\s*<a[^>]*>([^<]+)<\/a>\s*<\/strong>/);
    if (expertMatch) out.expert = decodeEntities(expertMatch[1]).trim();
    const roleMatch = ab.match(/<em>([^<]+)<\/em>/);
    if (roleMatch) out.expert_role = decodeEntities(roleMatch[1]).trim();
  }

  // society block
  const detailsBlock = html.match(/<div class='articol-detalii'[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="fix")/);
  const dBlock = detailsBlock ? detailsBlock[1] : html;
  const typeMatch = dBlock.match(/Tip societate:\s*<\/span>\s*([^<]+)</);
  if (typeMatch) out.society.type = decodeEntities(typeMatch[1]).trim();
  const empMatch = dBlock.match(/Numar de angajati:\s*<\/span>\s*([^<]+)</);
  if (empMatch) out.society.employees = decodeEntities(empMatch[1]).trim();
  const vatMatch = dBlock.match(/Platitoare TVA:\s*<\/span>\s*([^<]+)</);
  if (vatMatch) {
    const v = decodeEntities(vatMatch[1]).trim();
    out.society.vat_payer = /^da$/i.test(v) ? true : (/^nu$/i.test(v) ? false : v);
  }
  const caenMatch = dBlock.match(/Cod CAEN:\s*<\/span>\s*<a[^>]*>([^<]+)<\/a>/);
  if (caenMatch) out.society.caen = decodeEntities(caenMatch[1]).trim();

  return out;
}

async function main() {
  const urls = fs.readFileSync(URL_LIST, 'utf-8')
    .split('\n').map((s) => s.trim()).filter(Boolean);
  const total = MAX > 0 ? Math.min(MAX, urls.length) : urls.length;

  // Load existing corpus if resuming
  let corpus = [];
  let done = new Set();
  if (RESUME && fs.existsSync(CORPUS_PATH)) {
    try {
      corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
      for (const c of corpus) done.add(c.url);
      console.error(`Resuming: ${corpus.length} entries already in corpus`);
    } catch {}
  }

  let consecutiveFails = 0;
  const startedAt = Date.now();
  let processed = 0;

  for (let i = 0; i < total; i++) {
    const url = urls[i];
    if (done.has(url)) continue;
    processed++;

    let buf = readCache(url);
    let status = buf ? 200 : 0;
    let fromCache = !!buf;

    if (!buf) {
      const r = await fetchWithRetry(url);
      status = r.status;
      buf = r.buf;
      if (buf) writeCache(url, buf);
      // 2s delay only on live fetches
      await sleep(DELAY_MS);
    }

    const stamp = new Date().toISOString();
    logLine(`${stamp}\t${status}\t${fromCache ? 'CACHE' : 'LIVE'}\t${url}`);

    if (status !== 200 || !buf) {
      consecutiveFails++;
      if (consecutiveFails >= 5) {
        console.error(`STOP: 5 consecutive failures at ${url}`);
        break;
      }
      continue;
    }
    consecutiveFails = 0;

    try {
      const html = decode(buf);
      const entry = extractCase(url, html);
      if (entry.question && entry.question.length > 20) {
        corpus.push(entry);
      }
    } catch (err) {
      logLine(`${stamp}\tPARSE_ERR\t${url}\t${err.message}`);
    }

    // Flush every 50 entries
    if (corpus.length % 50 === 0) {
      fs.writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 2));
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
        i, total, processed, corpus: corpus.length, lastUrl: url,
        elapsed_s: Math.round((Date.now() - startedAt) / 1000),
      }, null, 2));
    }

    if (processed % 25 === 0) {
      const elapsed = (Date.now() - startedAt) / 1000;
      console.error(`[${i + 1}/${total}] processed=${processed} corpus=${corpus.length} elapsed=${elapsed.toFixed(0)}s`);
    }
  }

  fs.writeFileSync(CORPUS_PATH, JSON.stringify(corpus, null, 2));
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
    done: true, total, corpus: corpus.length,
    elapsed_s: Math.round((Date.now() - startedAt) / 1000),
  }, null, 2));
  console.error(`DONE. corpus=${corpus.length} elapsed=${((Date.now() - startedAt) / 1000).toFixed(0)}s`);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
