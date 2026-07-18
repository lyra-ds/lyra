#!/usr/bin/env node
/**
 * @lyra-ds/styles — STY-06 parity validator (zero-dependency Node, ESM).
 *
 * Proves the packaged CSS under packages/styles/** stayed a FAITHFUL copy of the
 * canonical design handoff under handoff/**. Three guarantees:
 *
 *   (A) Token check .......... 209 `--custom-property` declarations across the six
 *                              canonical token files (base+brand+colors+effects+
 *                              spacing+typography, including [data-theme="dark"]
 *                              re-declarations) exist in the package with identical
 *                              values. fonts.css (CDN divergence, 0 tokens) and
 *                              compat-shadcn.css (opt-in, outside the entry) are
 *                              excluded.
 *   (B) Placement- + cascade-aware declaration diff ... every declaration is keyed
 *                              by file + at-rule-ancestry + selector + property and
 *                              compared IN ORDER, so a declaration relocated to a
 *                              different selector/file, moved under/out of an
 *                              @media/@container/@keyframes block, OR reordered among
 *                              equal rules fails — even if the raw multiset is
 *                              unchanged. A small intentional-divergence allowlist
 *                              (fonts @import removal handled by exclusion; the
 *                              unpkg→data: chevron mask URLs) keeps the faithful copy
 *                              green.
 *   (C) Class inventory ...... the 248 unique `.lyra-*` class names in
 *                              handoff/components/** match the package set exactly.
 *   (D) External-URL guard ... every `url()` in the shipped package CSS targets a
 *                              `data:` URI or a relative path — any absolute scheme
 *                              (http:, https:, other scheme:) or protocol-relative
 *                              `url(//cdn…)` fails (no-runtime-CDN constraint).
 *
 * The parser is a real tokenizer / brace-depth state machine (NOT split(';') or a
 * flat regex): it tracks string state so quoted `data:` URIs with interior `;`/`{`/`}`
 * are opaque, strips comments, and maintains the ordered stack of enclosing at-rule /
 * selector blocks. Parser fixtures under tools/parity/fixtures/ exercise a nested
 * @media, a nested @container, a @keyframes block, and a quoted data: URI with an
 * interior `;`; a self-check runs before the parity checks.
 *
 * On any drift: prints a message naming the drifted token/class/declaration (and points
 * at handoff/ as canonical) and exits non-zero. On full pass:
 *   `parity OK: 209 tokens, 248 classes, placement + at-rule ancestry + no-CDN verified`
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const HANDOFF = join(REPO, 'handoff');
const PKG = join(REPO, 'packages', 'styles');
const FIXTURES = join(__dirname, 'fixtures');

const TOKEN_FILES = ['base', 'brand', 'colors', 'effects', 'spacing', 'typography']; // fonts + compat EXCLUDED
const EXPECTED_TOKENS = 209;
const EXPECTED_CLASSES = 248;

// Intentional-divergence allowlist: the unpkg.com chevron mask URLs rewritten to
// local data: URIs (forms/display/navigation). fonts.css's dropped Google-Fonts
// @import is handled by excluding fonts.css from the diff entirely (0 tokens).
const MASK_DIVERGENCE_FILES = new Set([
  'components/forms/forms.css',
  'components/display/display.css',
  'components/navigation/navigation.css',
]);

const errors = [];
const fail = (msg) => errors.push(msg);

// ---------------------------------------------------------------------------
// Tokenizer / brace-depth state machine
// ---------------------------------------------------------------------------

const normalizeWs = (s) => s.replace(/\s+/g, ' ').trim();

/**
 * Parse CSS into an ORDERED list of declaration records:
 *   { blockPath: string[], prop: string, val: string }
 * where blockPath is the ordered chain of enclosing block preludes (at-rules AND
 * selectors) from outermost to the declaration's immediate parent. Comments are
 * stripped; strings ('/") are treated as opaque so interior ;/{/} do not segment.
 */
function parse(css) {
  const decls = [];
  const stack = [];
  let buf = '';
  let i = 0;
  const n = css.length;

  const flush = () => {
    const s = normalizeWs(buf);
    buf = '';
    if (!s) return;
    const colon = s.indexOf(':');
    if (colon === -1) return; // not a declaration (e.g. stray prelude)
    const prop = s.slice(0, colon).trim();
    const val = s.slice(colon + 1).trim();
    if (!prop || prop.startsWith('@')) return; // ignore at-statements like @import/@charset
    decls.push({ blockPath: stack.slice(), prop, val });
  };

  while (i < n) {
    const c = css[i];

    // comment
    if (c === '/' && css[i + 1] === '*') {
      i += 2;
      while (i < n && !(css[i] === '*' && css[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // string (opaque)
    if (c === '"' || c === "'") {
      const q = c;
      buf += c;
      i++;
      while (i < n) {
        const d = css[i];
        if (d === '\\' && i + 1 < n) {
          buf += d + css[i + 1];
          i += 2;
          continue;
        }
        buf += d;
        i++;
        if (d === q) break;
      }
      continue;
    }
    if (c === '{') {
      stack.push(normalizeWs(buf));
      buf = '';
      i++;
      continue;
    }
    if (c === '}') {
      flush(); // trailing declaration with no ; before }
      stack.pop();
      i++;
      continue;
    }
    if (c === ';') {
      flush();
      i++;
      continue;
    }
    buf += c;
    i++;
  }
  return decls;
}

const keyOf = (d) => [...d.blockPath, d.prop].join(' >> ');
const describe = (d) => `${d.blockPath.join(' > ')} {${d.prop}}`;

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function listCss(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listCss(full));
    else if (name.endsWith('.css')) out.push(full);
  }
  return out;
}

const read = (p) => readFileSync(p, 'utf8');

// ---------------------------------------------------------------------------
// Fixture self-check (proves the tokenizer segments the hard constructs)
// ---------------------------------------------------------------------------

function fixtureSelfCheck() {
  const cases = [
    {
      file: 'nested-media.css',
      // one decl inside @media > selector
      expect: [{ path: ['@media (min-width: 640px)', '.lyra-x'], prop: 'color', val: 'red' }],
    },
    {
      file: 'nested-container.css',
      expect: [{ path: ['@container (max-width: 460px)', '.lyra-y'], prop: 'display', val: 'grid' }],
    },
    {
      file: 'keyframes.css',
      expect: [
        { path: ['@keyframes lyra-fade-in', 'from'], prop: 'opacity', val: '0.6' },
        { path: ['@keyframes lyra-fade-in', 'to'], prop: 'opacity', val: '1' },
      ],
    },
    {
      file: 'data-uri.css',
      // the interior `;` inside the quoted data: URI must NOT segment the declaration
      expect: [
        {
          path: ['.lyra-z'],
          prop: 'mask',
          val: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><path d="m6 9 6 6 6-6"/></svg>') no-repeat center / 100%`,
        },
      ],
    },
  ];

  for (const { file, expect } of cases) {
    const decls = parse(read(join(FIXTURES, file)));
    if (decls.length !== expect.length) {
      fail(
        `Fixture ${file}: tokenizer produced ${decls.length} declarations, expected ${expect.length}`,
      );
      continue;
    }
    for (let k = 0; k < expect.length; k++) {
      const got = decls[k];
      const want = expect[k];
      const gotKey = keyOf(got);
      const wantKey = [...want.path, want.prop].join(' >> ');
      if (gotKey !== wantKey || got.val !== want.val) {
        fail(
          `Fixture ${file} #${k}: got [${gotKey} = ${got.val}], expected [${wantKey} = ${want.val}]`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// (A) Token check — 209 custom properties, identical values
// ---------------------------------------------------------------------------

function collectTokens(baseDir) {
  const pairs = [];
  for (const f of TOKEN_FILES) {
    const p = join(baseDir, 'tokens', `${f}.css`);
    for (const d of parse(read(p))) {
      if (d.prop.startsWith('--')) pairs.push([d.prop, d.val]);
    }
  }
  return pairs;
}

function tokenCheck() {
  const handoff = collectTokens(HANDOFF);
  const pkg = collectTokens(PKG);

  if (handoff.length !== EXPECTED_TOKENS) {
    fail(
      `Token count drift: canonical handoff has ${handoff.length} token declarations, expected ${EXPECTED_TOKENS} — handoff/ is canonical`,
    );
  }

  // multiset of values per token name
  const toMap = (pairs) => {
    const m = new Map();
    for (const [name, val] of pairs) {
      if (!m.has(name)) m.set(name, []);
      m.get(name).push(val);
    }
    for (const arr of m.values()) arr.sort();
    return m;
  };
  const hMap = toMap(handoff);
  const pMap = toMap(pkg);

  for (const [name, hVals] of hMap) {
    const pVals = pMap.get(name);
    if (!pVals) {
      fail(`Token ${name}: missing from package tokens — handoff/ is canonical`);
      continue;
    }
    if (hVals.length !== pVals.length || hVals.some((v, k) => v !== pVals[k])) {
      fail(
        `Token ${name}: package=[${pVals.join(', ')}] handoff=[${hVals.join(', ')}] — handoff/ is canonical`,
      );
    }
  }
  for (const name of pMap.keys()) {
    if (!hMap.has(name)) {
      fail(`Token ${name}: present in package but not in canonical handoff — handoff/ is canonical`);
    }
  }
  return handoff.length;
}

// ---------------------------------------------------------------------------
// (B) Placement- + cascade-aware declaration diff
// ---------------------------------------------------------------------------

function isAllowedDivergence(relPath, hd, pd) {
  if (
    MASK_DIVERGENCE_FILES.has(relPath) &&
    (hd.prop === 'mask' || hd.prop === '-webkit-mask') &&
    /unpkg\.com\/lucide-static/.test(hd.val) &&
    /url\(\s*['"]?data:image\/svg\+xml/.test(pd.val)
  ) {
    return true;
  }
  return false;
}

function diffFile(relPath) {
  const hPath = join(HANDOFF, relPath);
  const pPath = join(PKG, relPath);
  if (!existsSync(pPath)) {
    fail(`Missing package file ${relPath} (present in handoff/) — handoff/ is canonical`);
    return;
  }
  const h = parse(read(hPath));
  const p = parse(read(pPath));
  const len = Math.max(h.length, p.length);
  for (let k = 0; k < len; k++) {
    const hd = h[k];
    const pd = p[k];
    if (!hd) {
      fail(`Extra declaration ${relPath} #${k}: package has [${describe(pd)}] with no handoff counterpart — handoff/ is canonical`);
      continue;
    }
    if (!pd) {
      fail(`Dropped declaration ${relPath} #${k}: handoff has [${describe(hd)}] absent from package — handoff/ is canonical`);
      continue;
    }
    if (keyOf(hd) !== keyOf(pd)) {
      fail(
        `Decl placement mismatch ${relPath} #${k}: package=[${describe(pd)}] handoff=[${describe(hd)}] — handoff/ is canonical`,
      );
      continue;
    }
    if (hd.val !== pd.val && !isAllowedDivergence(relPath, hd, pd)) {
      fail(
        `Decl mismatch ${relPath} ${describe(hd)} #${k}: package=${pd.val} handoff=${hd.val} — handoff/ is canonical`,
      );
    }
  }
}

function placementCheck() {
  const rels = [];
  for (const f of TOKEN_FILES) rels.push(`tokens/${f}.css`);
  for (const abs of listCss(join(HANDOFF, 'components'))) {
    rels.push(abs.slice(HANDOFF.length + 1).split(/[\\/]/).join('/'));
  }
  for (const rel of rels) diffFile(rel);
}

// ---------------------------------------------------------------------------
// (C) Class inventory — 248 unique .lyra-* names
// ---------------------------------------------------------------------------

function collectClasses(baseDir) {
  const set = new Set();
  for (const f of listCss(join(baseDir, 'components'))) {
    for (const m of read(f).matchAll(/\.lyra-[a-zA-Z0-9_-]+/g)) set.add(m[0]);
  }
  return set;
}

function classCheck() {
  const handoff = collectClasses(HANDOFF);
  const pkg = collectClasses(PKG);

  if (handoff.size !== EXPECTED_CLASSES) {
    fail(
      `Class count drift: canonical handoff has ${handoff.size} unique .lyra-* classes, expected ${EXPECTED_CLASSES} — handoff/ is canonical`,
    );
  }
  for (const c of handoff) {
    if (!pkg.has(c)) fail(`Class ${c}: missing from package components — handoff/ is canonical`);
  }
  for (const c of pkg) {
    if (!handoff.has(c)) fail(`Class ${c}: present in package but not in canonical handoff — handoff/ is canonical`);
  }
  return handoff.size;
}

// ---------------------------------------------------------------------------
// (D) External-URL guard — data: or relative only
// ---------------------------------------------------------------------------

/** Extract every url() target from a stylesheet, respecting comments + quotes. */
function extractUrls(css) {
  const urls = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      i += 2;
      while (i < n && !(css[i] === '*' && css[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < n && css[i] !== q) {
        if (css[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // match url( case-insensitively at a token boundary
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.slice(i, i + 4))) {
      i += 4;
      // skip leading whitespace
      while (i < n && /\s/.test(css[i])) i++;
      let target = '';
      if (css[i] === '"' || css[i] === "'") {
        const q = css[i];
        i++;
        while (i < n && css[i] !== q) {
          if (css[i] === '\\') {
            target += css[i + 1] || '';
            i += 2;
            continue;
          }
          target += css[i];
          i++;
        }
        i++; // closing quote
      } else {
        while (i < n && css[i] !== ')') {
          target += css[i];
          i++;
        }
      }
      urls.push(target.trim());
      continue;
    }
    i++;
  }
  return urls;
}

function urlGuard() {
  const schemeRe = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;
  for (const abs of listCss(PKG)) {
    const rel = abs.slice(PKG.length + 1).split(/[\\/]/).join('/');
    for (const target of extractUrls(read(abs))) {
      if (target.startsWith('data:')) continue; // allowed inline data URI
      if (target.startsWith('//')) {
        fail(`External url() ${rel}: protocol-relative "url(${target})" is forbidden (no runtime CDN) — use data: or a relative path`);
        continue;
      }
      const m = schemeRe.exec(target);
      if (m && m[1].toLowerCase() !== 'data') {
        fail(`External url() ${rel}: absolute-scheme "url(${target})" is forbidden (no runtime CDN) — use data: or a relative path`);
        continue;
      }
      // otherwise: relative path — allowed
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

fixtureSelfCheck();
const tokenCount = tokenCheck();
placementCheck();
const classCount = classCheck();
urlGuard();

if (errors.length) {
  console.error(`parity FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}) — handoff/ is canonical:\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(
  `parity OK: ${tokenCount} tokens, ${classCount} classes, placement + at-rule ancestry + no-CDN verified`,
);
process.exit(0);
