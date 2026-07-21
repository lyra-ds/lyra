#!/usr/bin/env node
/**
 * @lyra-ds/react — RCT-05 curated icon registry generator (zero-dependency Node, ESM).
 *
 * WHAT this proves / produces: a statically-analyzable, tree-shakable, no-CDN icon
 * surface. It derives the COMPLETE handoff icon inventory (literal AND dynamic uses)
 * by a FOUR-pass, dynamic-use-aware scan of handoff/components/** + handoff/ui_kits/**
 * (.jsx/.html/.tsx/.ts), then emits the committed module
 * packages/react/src/icon/icon-registry.ts: 69 static PascalCase lucide-react named
 * imports + one vendored `github` icon (createLucideIcon, brand icons were removed in
 * lucide 1.0) + the `IconName` literal union (D-04). Same pattern as tools/parity —
 * generated + committed + CI drift-guarded (D-01/D-02).
 *
 * WHY four passes (a naive `<Icon name="…">` literal regex yields only 50 names; the
 * handoff also feeds Icon through dynamic sources):
 *   Pass A — literal props: `<Icon name="kebab">` occurrences, scoped to the Icon
 *            element (a bare name-attr grep captures `<meta name="viewport">` and form
 *            `name="plan"` inputs — both must stay OUT). No comment stripping: the
 *            canonical `.d.ts` JSDoc examples `<Icon name="circle"…>` (Combobox.d.ts)
 *            and `<Icon name="file-plus"…>` (CommandPalette.d.ts) are INTENDED matches
 *            (Option B) — they join the inventory as `circle` + `file-plus`.
 *   Pass B — conditional branch literals: kebab literals that immediately follow a `?`
 *            or `:` inside an Icon-element `name={…}` ternary (sun/moon theme toggles,
 *            minus/check, circle-alert). Comparison operands (e.g. `status === "error"`)
 *            are NOT extracted — `"error"` follows `===`, not `?`/`:`.
 *   Pass C — SOURCE_MANIFEST indirection: the four enumerated indirect sources (a
 *            literal names[] array, two icon-resolver functions, and `icon:` nav-data
 *            properties). MASK_DIVERGENCE discipline: exact files, no wildcards; a
 *            missing file or a zero-extraction entry is a named manifest-drift failure.
 *   Pass D — unresolved-dynamic detector: every Icon-element `name={expr}` must be
 *            accounted for (contributed Pass-B literals OR its file is an
 *            ALLOWED_PASSTHROUGH site whose feeding literals are captured elsewhere);
 *            anything else FAILS with file:line + the expression (dynamic uses can
 *            never be silently excluded). Passes B and D share Pass A's Icon-element
 *            scoping, so `name={…}` on non-Icon components (e.g. `<Avatar name={…}>`)
 *            is out of scope and never needs a passthrough entry.
 *
 * Modes:
 *   (default)     regenerate and WRITE packages/react/src/icon/icon-registry.ts.
 *   --check       regenerate in-memory, byte-diff against the committed file, exit 1 on
 *                 drift or missing file, exit 0 on match; NEVER writes. Additionally, if
 *                 lucide-react is resolvable from packages/react, assert every generated
 *                 PascalCase import (except the vendored Github) is a real export; if not
 *                 installed yet, print a skip notice (CI runs --check after install).
 *   --self-test   run the four passes against tools/icon-registry/fixtures/ only and
 *                 assert the extraction rules behave (regression-tests the rules).
 *
 * Determinism: names dedupe into one Set and emit in sorted order, so equal inputs
 * always produce a byte-identical file. On any drift/failure: prints each issue with ✗
 * (naming handoff/ as canonical) and exits non-zero.
 *
 * NOTE: the vendored `github` path data below is copied verbatim from the ISC-licensed
 * upstream static-icon package the prototype pinned (documented here in the generator
 * ONLY). The EMITTED icon-registry.ts must never carry that package name — a comment
 * carrying it would survive dts emit into dist/icon.d.ts and trip the 03-08 semantic
 * dist scan. The emitted Github block's comment names no package.
 */
/* eslint-disable */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const HANDOFF = join(REPO, 'handoff');
const SCAN_ROOTS = [join(HANDOFF, 'components'), join(HANDOFF, 'ui_kits')];
const REACT_PKG = join(REPO, 'packages', 'react');
const OUT_FILE = join(REACT_PKG, 'src', 'icon', 'icon-registry.ts');
const FIXTURES = join(__dirname, 'fixtures');

const EXPECTED_ICONS = 70; // 69 lucide-resolvable + 1 vendored (github)

// The planning-time approved canonical inventory (03-03 objective). The four-pass scan
// must reproduce this EXACT set; deltas (added/missing) are reported by name. `github`
// is vendored (removed from lucide 1.0); the other 69 are lucide-react 1.25.0 exports.
const CANONICAL_INVENTORY = [
  'archive',
  'arrow-left',
  'arrow-right',
  'arrow-up-right',
  'bell',
  'book-open',
  'calendar',
  'chart-line',
  'check',
  'chevron-down',
  'chevron-right',
  'chevrons-up-down',
  'circle',
  'circle-alert',
  'circle-check',
  'circle-x',
  'cloud-upload',
  'code',
  'copy',
  'credit-card',
  'download',
  'ellipsis',
  'external-link',
  'eye',
  'file',
  'file-archive',
  'file-plus',
  'file-spreadsheet',
  'file-text',
  'film',
  'filter',
  'folder',
  'folder-open',
  'github',
  'hard-drive',
  'heart',
  'house',
  'image',
  'inbox',
  'info',
  'layout-dashboard',
  'layout-grid',
  'link',
  'list',
  'lock',
  'log-out',
  'mail',
  'minus',
  'moon',
  'music',
  'pencil',
  'plus',
  'rocket',
  'scale',
  'search',
  'send',
  'settings',
  'shield',
  'sparkles',
  'star',
  'sun',
  'terminal',
  'trash-2',
  'triangle-alert',
  'upload',
  'user',
  'user-plus',
  'users',
  'x',
  'zap',
];

// `github` is the single vendored icon: brand icons were removed in lucide 1.0, so
// `Github` is absent from lucide-react 1.x. The two path `d` strings are the ISC path
// data (origin documented in this file's header — NEVER named in emitted output).
const VENDORED_GITHUB = {
  name: 'github',
  paths: [
    {
      d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
      key: 'gh1',
    },
    { d: 'M9 18c-4.51 2-5-2-7-2', key: 'gh2' },
  ],
};

// ---------------------------------------------------------------------------
// SOURCE_MANIFEST — Pass C indirect sources (MASK_DIVERGENCE discipline: EXACT files,
// no wildcards). Each entry names a real handoff file + an extraction rule. Removing a
// file or an entry that extracts zero names is a named manifest-drift failure.
// ---------------------------------------------------------------------------
const SOURCE_MANIFEST = [
  // (1) the literal `const names = [...]` array of icon names in the Icons demo card.
  { rel: 'components/icons/icons.card.html', rule: 'array', arg: 'names' },
  // (2) the `uploadIconFor` resolver's `return "…"` icon-name literals.
  { rel: 'components/files/FileUpload.jsx', rule: 'resolver', arg: 'uploadIconFor' },
  // (3) the `fmIconFor` resolver's `return "…"` icon-name literals.
  { rel: 'components/files/FileManager.jsx', rule: 'resolver', arg: 'fmIconFor' },
  // (4) the `icon: "…"` string nav-data properties feeding `<Icon name={n.icon}>`.
  { rel: 'ui_kits/dashboard/shell.jsx', rule: 'dataprop', arg: 'icon' },
];

// ALLOWED_PASSTHROUGH — Icon-element `name={expr}` sites whose feeding literals are
// captured elsewhere (Pass C manifest or Pass B): the icons.card.html array iterator
// `name={n}`, the shell.jsx nav-data reference `name={n.icon}`, the screens.jsx
// PlaceholderScreen prop pass-through `name={icon}`, and the FileUpload/FileManager
// resolver call sites `name={…IconFor(…)}`. EXACT files, no wildcards — any other
// unaccounted dynamic use hard-fails Pass D.
const ALLOWED_PASSTHROUGH = new Set([
  'components/icons/icons.card.html',
  'ui_kits/dashboard/shell.jsx',
  'ui_kits/dashboard/screens.jsx',
  'components/files/FileUpload.jsx',
  'components/files/FileManager.jsx',
]);

const errors = [];
const fail = (msg) => errors.push(msg);
const read = (p) => readFileSync(p, 'utf8');
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

// ---------------------------------------------------------------------------
// Filesystem walk (parity.mjs listCss shape) — .jsx/.html/.tsx/.ts under the roots.
// ---------------------------------------------------------------------------
const SCAN_EXT = /\.(jsx|html|tsx|ts)$/;
function listFiles(dir, matcher = SCAN_EXT) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listFiles(full, matcher));
    else if (matcher.test(name)) out.push(full);
  }
  return out;
}

function relOf(baseDir, abs) {
  return abs
    .slice(baseDir.length + 1)
    .split(/[\\/]/)
    .join('/');
}

// ---------------------------------------------------------------------------
// Balanced-slice helper: returns the content between the first `open` at/after
// `openIdx` and its matching `close`, excluding the outer delimiters. Strings
// ('/"/`) are opaque so interior delimiters do not affect depth.
// ---------------------------------------------------------------------------
function sliceBalanced(text, openIdx, open, close) {
  let depth = 0;
  let out = '';
  let inStr = null;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      out += c;
      if (c === '\\') {
        out += text[i + 1] ?? '';
        i++;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c;
      out += c;
      continue;
    }
    if (c === open) {
      depth++;
      if (depth === 1) continue;
      out += c;
      continue;
    }
    if (c === close) {
      depth--;
      if (depth === 0) break;
      out += c;
      continue;
    }
    out += c;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pass A — literal Icon props: `<Icon … name="kebab" …>` scoped to the Icon element.
// ---------------------------------------------------------------------------
function iconLiteralProps(text) {
  const names = [];
  const re = /<Icon\b[^>]*?\bname\s*=\s*"([a-z][a-z0-9-]*)"/g;
  let m;
  while ((m = re.exec(text)) !== null) names.push(m[1]);
  return names;
}

// ---------------------------------------------------------------------------
// Icon-element `name={expr}` sites (feeds Pass B + Pass D). Same Icon-element scoping
// as Pass A: `<Avatar name={…}>` and other components never match.
// ---------------------------------------------------------------------------
function iconExprSites(text) {
  const sites = [];
  const re = /<Icon\b[^>]*?\bname\s*=\s*\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const braceIdx = m.index + m[0].length - 1; // position of the `{`
    const expr = sliceBalanced(text, braceIdx, '{', '}');
    sites.push({ line: lineOf(text, m.index), expr });
    re.lastIndex = braceIdx + 1;
  }
  return sites;
}

// Pass B — kebab literals that immediately follow a `?` or `:` (ternary RESULT branch).
function ternaryBranchLiterals(expr) {
  const out = [];
  const re = /[?:]\s*["']([a-z][a-z0-9-]*)["']/g;
  let m;
  while ((m = re.exec(expr)) !== null) out.push(m[1]);
  return out;
}

// ---------------------------------------------------------------------------
// Pass C extraction rules.
// ---------------------------------------------------------------------------
function extractArrayLiterals(text, arrayName) {
  const re = new RegExp(`\\b${arrayName}\\s*=\\s*\\[`);
  const m = re.exec(text);
  if (!m) return [];
  const inner = sliceBalanced(text, m.index + m[0].length - 1, '[', ']');
  return [...inner.matchAll(/["']([a-z][a-z0-9-]*)["']/g)].map((x) => x[1]);
}

function extractResolverReturns(text, fnName) {
  const re = new RegExp(`\\b${fnName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`);
  const m = re.exec(text);
  if (!m) return [];
  const body = sliceBalanced(text, m.index + m[0].length - 1, '{', '}');
  return [...body.matchAll(/return\s+["']([a-z][a-z0-9-]*)["']/g)].map((x) => x[1]);
}

function extractDataProps(text, propKey) {
  const re = new RegExp(`\\b${propKey}\\s*:\\s*["']([a-z][a-z0-9-]*)["']`, 'g');
  return [...text.matchAll(re)].map((x) => x[1]);
}

function applyManifestRule(entry, text) {
  if (entry.rule === 'array') return extractArrayLiterals(text, entry.arg);
  if (entry.rule === 'resolver') return extractResolverReturns(text, entry.arg);
  if (entry.rule === 'dataprop') return extractDataProps(text, entry.arg);
  return [];
}

// ---------------------------------------------------------------------------
// Run the four passes over a set of files. `manifest` + `passthrough` are injected so
// the real scan and the self-test exercise the SAME extraction code.
// ---------------------------------------------------------------------------
function runPasses(files, manifest, passthrough) {
  const names = new Set();
  const localErrors = [];

  for (const { rel, text } of files) {
    // Pass A
    for (const nm of iconLiteralProps(text)) names.add(nm);
    // Pass B + Pass D
    for (const site of iconExprSites(text)) {
      const branchLits = ternaryBranchLiterals(site.expr);
      for (const nm of branchLits) names.add(nm);
      const accounted = branchLits.length > 0 || passthrough.has(rel);
      if (!accounted) {
        localErrors.push(
          `Unresolved dynamic <Icon name={…}> at ${rel}:${site.line} — expression \`${site.expr.trim()}\` ` +
            `is neither ternary-branch-resolvable nor covered by SOURCE_MANIFEST/ALLOWED_PASSTHROUGH; ` +
            `dynamic Icon uses can never be silently excluded`,
        );
      }
    }
  }

  // Pass C — manifest indirection
  const byRel = new Map(files.map((f) => [f.rel, f]));
  for (const entry of manifest) {
    const f = byRel.get(entry.rel);
    if (!f) {
      localErrors.push(
        `Manifest drift: source file ${entry.rel} (${entry.rule} \`${entry.arg}\`) is missing`,
      );
      continue;
    }
    const extracted = applyManifestRule(entry, f.text);
    if (extracted.length === 0) {
      localErrors.push(
        `Manifest drift: ${entry.rule} \`${entry.arg}\` in ${entry.rel} extracted zero icon names`,
      );
      continue;
    }
    for (const nm of extracted) names.add(nm);
  }

  return { names, errors: localErrors };
}

function loadScanFiles() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    for (const abs of listFiles(root)) {
      files.push({ rel: relOf(HANDOFF, abs), text: read(abs) });
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// kebab → Pascal, and the emitted component identifier per name.
// ---------------------------------------------------------------------------
function toPascal(kebab) {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}
function componentIdent(kebab) {
  return kebab === VENDORED_GITHUB.name ? 'Github' : toPascal(kebab);
}

// ---------------------------------------------------------------------------
// Emit the icon-registry.ts content from an array of line strings (NOT a column-0
// template literal), so the generator's own top-level `import` statements are the only
// lines matching /^import /. The emitted output NEVER names the vendored source package.
// ---------------------------------------------------------------------------
function emit(sortedNames) {
  const lucideNames = sortedNames.filter((n) => n !== VENDORED_GITHUB.name);
  const lines = [];

  lines.push('// GENERATED FILE — DO NOT EDIT BY HAND.');
  lines.push(
    '// Source of truth: the four-pass scan of handoff/components/** + handoff/ui_kits/**.',
  );
  lines.push(
    '// Regenerate: `node tools/icon-registry/generate.mjs`  (drift-guarded by `--check`).',
  );
  lines.push(
    '// RCT-05: curated, tree-shakable, no-CDN icon surface (69 lucide-react imports + 1 vendored).',
  );
  lines.push('');

  // Named lucide-react imports (69), sorted, then the custom-icon factory + type.
  lines.push('import {');
  for (const n of lucideNames) lines.push(`  ${toPascal(n)},`);
  lines.push('  createLucideIcon,');
  lines.push('  type LucideIcon,');
  lines.push("} from 'lucide-react';");
  lines.push('');

  // Vendored `github` — brand icons were removed in lucide 1.0. Comment names no package.
  lines.push('// `github` is vendored: brand icons were removed from lucide-react in v1.0.');
  lines.push('// vendored icon path data (ISC) — provenance documented in the generator.');
  lines.push(`const Github = createLucideIcon('${VENDORED_GITHUB.name}', [`);
  for (const p of VENDORED_GITHUB.paths) {
    lines.push(`  ['path', { d: '${p.d}', key: '${p.key}' }],`);
  }
  lines.push(']);');
  lines.push('');

  // The registry object — sorted kebab keys → component.
  lines.push('export const iconRegistry = {');
  for (const n of sortedNames) lines.push(`  '${n}': ${componentIdent(n)},`);
  lines.push('} as const satisfies Record<string, LucideIcon>;');
  lines.push('');

  lines.push('export type IconName = keyof typeof iconRegistry;');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Derive + validate the canonical 70-name set from the real handoff scan.
// ---------------------------------------------------------------------------
function deriveCanonicalSet() {
  const files = loadScanFiles();
  const { names, errors: passErrors } = runPasses(files, SOURCE_MANIFEST, ALLOWED_PASSTHROUGH);
  for (const e of passErrors) fail(e);

  const derived = [...names].sort();
  const canonical = [...CANONICAL_INVENTORY].sort();
  const derivedSet = new Set(derived);
  const canonicalSet = new Set(canonical);

  const added = derived.filter((n) => !canonicalSet.has(n));
  const missing = canonical.filter((n) => !derivedSet.has(n));
  if (added.length || missing.length) {
    fail(
      `Icon inventory drift: derived ${derived.length} names, canonical is ${canonical.length}. ` +
        `Added (in scan, not canonical): [${added.join(', ') || '—'}]; ` +
        `Missing (canonical, not in scan): [${missing.join(', ') || '—'}] — handoff/ is canonical`,
    );
  }
  if (derived.length !== EXPECTED_ICONS) {
    fail(
      `Icon count boundary: derived ${derived.length} unique names, expected ${EXPECTED_ICONS} (69 lucide + 1 vendored github)`,
    );
  }
  if (!derivedSet.has(VENDORED_GITHUB.name)) {
    fail(`Vendored icon '${VENDORED_GITHUB.name}' missing from the derived inventory`);
  }
  const lucideCount = derived.filter((n) => n !== VENDORED_GITHUB.name).length;
  if (added.length === 0 && missing.length === 0 && lucideCount !== EXPECTED_ICONS - 1) {
    fail(
      `Import-count boundary: ${lucideCount} lucide-resolvable names, expected ${EXPECTED_ICONS - 1}`,
    );
  }
  return derived;
}

// ---------------------------------------------------------------------------
// --check: byte-diff against committed file + validate imports against installed lucide.
// ---------------------------------------------------------------------------
function validateLucideExports(sortedNames) {
  let req;
  try {
    req = createRequire(join(REACT_PKG, 'package.json'));
    req.resolve('lucide-react');
  } catch {
    console.log(
      '  ℹ lucide-react not resolvable from packages/react yet — skipping import validation (CI runs --check after install).',
    );
    return;
  }
  let lucide;
  try {
    lucide = req('lucide-react');
  } catch (e) {
    console.log(
      `  ℹ lucide-react present but not requirable (${e.message}) — skipping import validation.`,
    );
    return;
  }
  const missing = sortedNames
    .filter((n) => n !== VENDORED_GITHUB.name)
    .map(toPascal)
    .filter((ident) => typeof lucide[ident] === 'undefined');
  if (missing.length) {
    fail(`Generated imports not found in installed lucide-react: [${missing.join(', ')}]`);
  } else {
    console.log(
      `  ✓ all ${sortedNames.length - 1} generated imports validated against installed lucide-react.`,
    );
  }
}

function runCheck() {
  const sorted = deriveCanonicalSet();
  if (errors.length) return; // inventory already broken — report those first
  const expected = emit(sorted);
  if (!existsSync(OUT_FILE)) {
    fail(
      `Committed registry missing: ${relOf(REPO, OUT_FILE)} — run \`node tools/icon-registry/generate.mjs\` to generate it`,
    );
    return;
  }
  const actual = read(OUT_FILE);
  if (actual !== expected) {
    fail(
      `Registry drift: ${relOf(REPO, OUT_FILE)} does not match a fresh generation. ` +
        `The file is GENERATED — never hand-edit; fix the generator and regenerate. handoff/ is canonical`,
    );
    return;
  }
  validateLucideExports(sorted);
}

// ---------------------------------------------------------------------------
// --self-test: exercise the four passes against the committed fixture directory only.
// ---------------------------------------------------------------------------
function runSelfTest() {
  const fixtureFiles = listFiles(FIXTURES, /\.jsx$/).map((abs) => ({
    rel: relOf(FIXTURES, abs),
    text: read(abs),
  }));
  if (fixtureFiles.length === 0) {
    fail('Self-test: no fixture files found under tools/icon-registry/fixtures/');
    return;
  }

  // Fixture-scoped manifest + passthrough (empty passthrough so the deliberate
  // unresolvable Icon use MUST surface as a Pass-D error).
  const fixtureManifest = [
    { rel: 'self-test.jsx', rule: 'array', arg: 'iconNames' },
    { rel: 'self-test.jsx', rule: 'resolver', arg: 'pickIcon' },
    { rel: 'self-test.jsx', rule: 'dataprop', arg: 'icon' },
  ];
  const fixturePassthrough = new Set();

  const { names, errors: passErrors } = runPasses(
    fixtureFiles,
    fixtureManifest,
    fixturePassthrough,
  );

  const got = [...names].sort();
  const expected = [
    'bell',
    'circle-alert',
    'circle-check',
    'file',
    'folder',
    'heart',
    'moon',
    'settings',
    'star',
    'sun',
  ].sort();

  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    fail(`Self-test: extracted [${got.join(', ')}], expected [${expected.join(', ')}]`);
  }
  if (got.includes('error')) {
    fail(
      "Self-test: decoy comparison operand 'error' was extracted (must be excluded — it follows `===`, not `?`/`:`)",
    );
  }
  // Exactly one Pass-D error (the someUnknownFn Icon use), reported with file:line;
  // the Avatar dynamic-name site must produce neither an extraction nor an error.
  if (passErrors.length !== 1) {
    fail(
      `Self-test: expected exactly 1 Pass-D error (the unresolvable Icon use), got ${passErrors.length}: [${passErrors.join(' | ')}]`,
    );
  } else if (!/self-test\.jsx:\d+/.test(passErrors[0]) || !/someUnknownFn/.test(passErrors[0])) {
    fail(
      `Self-test: the Pass-D error must name the fixture file:line and the unresolvable expression — got: ${passErrors[0]}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const mode = process.argv[2];

if (mode === '--self-test') {
  runSelfTest();
} else if (mode === '--check') {
  console.log('icon-registry --check: verifying committed registry against a fresh scan…');
  runCheck();
} else {
  const sorted = deriveCanonicalSet();
  if (!errors.length) {
    writeFileSync(OUT_FILE, emit(sorted), 'utf8');
    console.log(
      `icon-registry: wrote ${relOf(REPO, OUT_FILE)} — ${sorted.length} icons (69 lucide + vendored github).`,
    );
  }
}

if (errors.length) {
  console.error(
    `icon-registry FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}) — handoff/ is canonical:\n`,
  );
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

if (mode === '--self-test')
  console.log(
    'icon-registry --self-test OK: four-pass extraction rules verified against the fixture.',
  );
if (mode === '--check')
  console.log(
    `icon-registry --check OK: committed registry matches the scan (${EXPECTED_ICONS} icons).`,
  );
process.exit(0);
