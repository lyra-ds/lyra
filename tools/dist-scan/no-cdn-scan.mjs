// Semantic no-CDN scan over built JS/CJS/DTS artifacts (RCT-05, threat T-03-16).
//
// WHY SEMANTIC, NOT PROTOCOL-BLIND: a bare `https?://` rejection deterministically
// fails on Lucide's baked-in SVG namespace attribute `xmlns="http://www.w3.org/2000/svg"`
// (a namespace *identifier*, never a network fetch) and on react-dom's minified-error
// decoder URLs under `https://react.dev/errors/` (an inert documentation string, never
// fetched at runtime). So the rule is: fail on any known CDN host, on the `lucide-static`
// package string, and on any OTHER `https?://` URL literal NOT covered by the allowlist.
//
// ┌─ SYNC POINTER ────────────────────────────────────────────────────────────────────┐
// │ This file is the SINGLE SOURCE OF TRUTH for the CDN-host list + URL allowlist.      │
// │ The Phase 3 build-job dist scan (plan 03-08) runs this as a CLI over packages/      │
// │ react/dist; the 03-09 scratch-fixture bundle scan (tools/smoke/smoke.mjs) IMPORTS   │
// │ these exact exported constants + scanContent() and applies them to the emitted      │
// │ Vite assets — so their rule sets are byte-identical by construction (same module     │
// │ objects, never a copy). The 03-09 fixture bundles react-dom, so its output           │
// │ deterministically contains the `https://react.dev/` decoder literal — which is why   │
// │ that prefix is on the allowlist here even though @lyra-ds/react keeps react external │
// │ (no such literal appears in its own dist). Do NOT fork these constants into a         │
// │ second scanner.                                                                       │
// └────────────────────────────────────────────────────────────────────────────────────┘
//
// Usage (CLI): node tools/dist-scan/no-cdn-scan.mjs <dir> [<dir> ...]
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Known CDN hosts — a runtime reference to any of these in shipped output is a
// forbidden CDN dependency (the exact thing RCT-05 deletes).
export const CDN_HOSTS = [
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'esm.sh',
  'skypack.dev',
];

// The npm package name whose CDN build the prototype used — its presence in dist
// would mean the CDN icon workaround leaked back in.
export const FORBIDDEN_PACKAGE_STRINGS = ['lucide-static'];

// Allowlist: URL PREFIXES that are inert identifiers/documentation, never network
// dependencies. Each carries its rationale. Any `https?://` literal NOT matching one
// of these prefixes is a violation.
export const URL_ALLOWLIST_PREFIXES = [
  // W3C/XML namespace: Lucide bakes `xmlns="http://www.w3.org/2000/svg"` (and the
  // xlink namespace) into every icon's default SVG attributes — a namespace URI the
  // browser matches by string, never fetches.
  'http://www.w3.org/',
  // React error-decoder: react-dom's production build embeds minified-error URLs under
  // https://react.dev/errors/ pointing humans at explanations — an inert doc string,
  // never fetched at runtime. Present in the 03-09 fixture bundle (react-dom bundled);
  // typically matches nothing in @lyra-ds/react's own dist (react is external).
  'https://react.dev/',
];

export const URL_LITERAL = /https?:\/\/[^\s'"`)\\<>]+/g;
const SCAN_EXTENSIONS = ['.js', '.cjs', '.d.ts'];

export function isAllowlisted(url) {
  return URL_ALLOWLIST_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// Apply the semantic rule set to one file's text, returning a list of violation
// strings (empty when clean). Shared verbatim by the CLI below and by the 03-09
// scratch-fixture scan (tools/smoke/smoke.mjs), so both enforce the same rules.
export function scanContent(fileLabel, code) {
  const found = [];
  for (const pkg of FORBIDDEN_PACKAGE_STRINGS) {
    if (code.includes(pkg)) {
      found.push(`${fileLabel}: forbidden package reference "${pkg}"`);
    }
  }
  for (const match of code.match(URL_LITERAL) ?? []) {
    if (isAllowlisted(match)) continue;
    const cdn = CDN_HOSTS.find((host) => match.includes(host));
    found.push(
      cdn
        ? `${fileLabel}: known CDN host "${cdn}" in URL ${match}`
        : `${fileLabel}: non-allowlisted URL literal ${match}`,
    );
  }
  return found;
}

function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      out.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

// ── CLI entry (only when invoked directly, not when imported) ──────────────────
// The 03-08 build-job step runs this over packages/react/dist; smoke.mjs imports
// the constants + scanContent() above instead of shelling out, so importing must
// have no side effects.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error('no-cdn-scan: at least one target directory is required');
    process.exit(2);
  }

  const violations = [];
  for (const dir of targets) {
    let files;
    try {
      files = collectFiles(dir);
    } catch (err) {
      console.error(`no-cdn-scan: cannot read "${dir}": ${err.message}`);
      process.exit(2);
    }
    for (const file of files) {
      violations.push(...scanContent(file, readFileSync(file, 'utf8')));
    }
  }

  if (violations.length > 0) {
    console.error('no-cdn-scan FAILED — runtime CDN/URL references in shipped output:');
    for (const v of violations) console.error(`  ✗ ${v}`);
    process.exit(1);
  }

  console.log(
    `no-cdn-scan OK: no CDN hosts, no lucide-static, no non-allowlisted URL literals in ${targets.join(', ')}`,
  );
}
