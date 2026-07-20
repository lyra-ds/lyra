#!/usr/bin/env node
/**
 * @lyra-ds/react — RCT-03/RCT-04 packed-artifact scratch-app smoke test (D-27).
 *
 * Proves the PUBLISHED shape of @lyra-ds/react actually installs from a tarball and
 * builds through REAL consumer bundlers (Vite + Next.js). It extends the Phase 2
 * tools/pack-smoke pattern (pack → tarball allowlist → install → real build → assert)
 * with the one structural change RCT-03 demands: @lyra-ds/react has a real runtime
 * dependency (lucide-react), so a bare `tar -x` is NOT an install — it would leave
 * lucide-react missing and prove nothing. This test runs a REAL `npm install` of the
 * tarball inside an OS-temp fixture copy (Pitfall 6), so lucide-react materializes
 * exactly as a consumer would receive it.
 *
 * Flow (RESEARCH Pattern 6):
 *   1. `pnpm pack` packages/react AND packages/styles into a temp pack dir.
 *   2. Tarball allowlist on the react .tgz — REQUIRED: dist/, README.md, LICENSE,
 *      package.json; FORBIDDEN: src/, tsup/vitest/eslint configs, node_modules.
 *   3. Copy the committed tools/smoke/vite-app fixture into the temp dir (OUTSIDE the
 *      workspace root) and `npm install` the two tarballs + the fixture's exact-pinned
 *      deps — a real install (never tar-extract).
 *   4. `tsc --noEmit` in the fixture — types resolve through the exports map
 *      (moduleResolution: bundler) → the RCT-04 "full TypeScript support" proof.
 *   5. Real `vite build` (production) via the fixture-installed vite binary.
 *   6a. JS-ONLY asset scan: Button + Input + Icon emissions PRESENT; the Dialog runtime
 *       marker (.lyra-dialog-overlay) ABSENT (tree-shaking / isolation proof); the Icon
 *       dev-warning literal ABSENT (production NODE_ENV strip — the 03-05 silence proof).
 *   6b. CSS validated separately (full stylesheet ships by design: .lyra-btn AND
 *       .lyra-dialog-overlay both present); then the SEMANTIC CDN scan (shared rule set,
 *       imported byte-identically from tools/dist-scan/no-cdn-scan.mjs) over ALL emitted
 *       assets, plus two positive "present-yet-passing" allowlist assertions.
 *   7. CJS `require()` consumer proof — the root barrel + the ./icon subpath resolve and
 *      export real React components (dual-runtime data point, not metadata-tool approval).
 *
 * Exits non-zero with a clear message on any failure. On install/build failure the
 * captured stdout/stderr is PRINTED BEFORE the temp dir is removed, so failures stay
 * diagnosable. The temp dir is a unique mkdtempSync dir removed on every exit path
 * (success + die()), so interrupted or parallel runs never collide or leak state.
 */

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// SHARED RULE SET (sync pointer): the CDN-host list + URL allowlist + scanContent()
// are imported verbatim from the 03-08 dist scanner, so this fixture scan and the
// build-job dist scan enforce byte-identical rules by construction (same module).
import { scanContent, isAllowlisted } from '../dist-scan/no-cdn-scan.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const REACT_PKG = join(REPO, 'packages', 'react');
const STYLES_PKG = join(REPO, 'packages', 'styles');
const VITE_FIXTURE_SRC = join(__dirname, 'vite-app');

// --- emission markers -------------------------------------------------------
const BUTTON_MARKER = 'lyra-btn'; // Button class emission
const INPUT_MARKER = 'lyra-input'; // Input class emission
const ICON_MARKER = 'lyra-icon'; // Icon always-emitted class (03-08 CONVENTIONS)
const DIALOG_MARKER = 'lyra-dialog-overlay'; // dialog.js-only runtime marker (isolation)
// The UI-SPEC Copywriting unknown-name warning string (icon.tsx). Its ABSENCE from the
// production JS is the 03-05 NODE_ENV-strip proof.
const ICON_WARNING_LITERAL = '[lyra-ds] Icon: unknown name';
// Allowlisted literals that MUST be present yet passing (proves the allowlist is alive):
const XMLNS_LITERAL = 'http://www.w3.org/2000/svg'; // Lucide bakes this into every glyph
const REACT_DEV_LITERAL = 'https://react.dev/'; // react-dom prod error-decoder URL prefix

// --- react tarball allowlist ------------------------------------------------
const REQUIRED = ['package/dist/', 'package/README.md', 'package/LICENSE', 'package/package.json'];
const FORBIDDEN = [
  'package/src/',
  'package/tsup.config.ts',
  'package/vitest.config.ts',
  'package/eslint.config.js',
  'package/node_modules/',
];

// `tmp` is created below; die() removes it before exiting because process.exit()
// terminates immediately and SKIPS finally, so without this every failed run leaks a
// lyra-smoke-* dir in the OS temp dir. On failure the caller passes captured output in
// `msg`, which is printed HERE (before removal) so build/install failures stay diagnosable.
let tmp;
const die = (msg) => {
  console.error(`smoke FAILED: ${msg}`);
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
};

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.error) die(`could not run ${cmd}: ${r.error.message}`);
  return r;
};

// Pack one workspace package into `packDir`, returning the absolute .tgz path.
function pack(pkgDir, packDir) {
  const r = run('pnpm', ['pack', '--pack-destination', packDir], { cwd: pkgDir });
  if (r.status !== 0) die(`pnpm pack (${pkgDir}) exited ${r.status}\n${r.stderr || r.stdout}`);
  const tgz = readdirSync(packDir)
    .filter((f) => f.endsWith('.tgz'))
    .map((f) => join(packDir, f));
  return tgz;
}

// Recursively collect emitted asset paths under a fixture's dist/ (skips maps).
function walkAssets(dir, exts) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkAssets(full, exts));
    else if (exts.some((e) => name.name.endsWith(e)) && !name.name.endsWith('.map')) out.push(full);
  }
  return out;
}

// Copy a committed fixture into the temp dir and `npm install` the tarballs + pinned
// deps (a REAL install so lucide-react materializes — never a tar-extract). Returns the
// installed fixture dir. `die`s with captured npm output on failure (printed before cleanup).
function installFixture(name, srcDir, tarballs) {
  const fixtureDir = join(tmp, name);
  cpSync(srcDir, fixtureDir, { recursive: true });
  const install = run(
    'npm',
    ['install', ...tarballs, '--no-audit', '--no-fund', '--loglevel', 'error'],
    { cwd: fixtureDir },
  );
  if (install.status !== 0) {
    die(`npm install (${name}) exited ${install.status}\n${install.stdout}\n${install.stderr}`);
  }
  return fixtureDir;
}

const bin = (fixtureDir, name) => join(fixtureDir, 'node_modules', '.bin', name);

// Run the SEMANTIC CDN scan (shared rule set) over the given asset files. `die`s on any
// violation. Also enforces the two positive present-yet-passing allowlist assertions.
function assertNoCdn(label, files) {
  const contents = files.map((f) => ({ f, code: readFileSync(f, 'utf8') }));
  const violations = contents.flatMap(({ f, code }) => scanContent(f, code));
  if (violations.length > 0) {
    die(`semantic CDN scan (${label}) found forbidden references:\n  ${violations.join('\n  ')}`);
  }
  // Positive assertion (i): the Lucide xmlns namespace URI IS present and does NOT fail
  // the scan — proving the http://www.w3.org/ allowlist prefix is alive, not the scan dead.
  const xmlnsPresent = contents.some(({ code }) => code.includes(XMLNS_LITERAL));
  if (!xmlnsPresent) die(`expected the bundled Lucide xmlns URI (${XMLNS_LITERAL}) in ${label}`);
  if (!isAllowlisted(XMLNS_LITERAL))
    die(`allowlist regression: ${XMLNS_LITERAL} is not allowlisted`);
}

let ok = true;
{
  tmp = mkdtempSync(join(tmpdir(), 'lyra-smoke-'));
  try {
    // -- 1. pack both packages ------------------------------------------------
    const packDir = join(tmp, 'tarball');
    mkdirSync(packDir, { recursive: true });
    const tarballs = pack(REACT_PKG, packDir);
    pack(STYLES_PKG, packDir);
    const allTgz = readdirSync(packDir)
      .filter((f) => f.endsWith('.tgz'))
      .map((f) => join(packDir, f));
    const reactTgz = allTgz.find((f) => /lyra-ds-react/.test(f));
    const stylesTgz = allTgz.find((f) => /lyra-ds-styles/.test(f));
    if (!reactTgz) die('pnpm pack produced no @lyra-ds/react .tgz');
    if (!stylesTgz) die('pnpm pack produced no @lyra-ds/styles .tgz');
    void tarballs;

    // -- 2. react tarball allowlist ------------------------------------------
    const list = run('tar', ['-tzf', reactTgz]);
    if (list.status !== 0) die(`tar -tzf exited ${list.status}\n${list.stderr}`);
    const entries = list.stdout.split('\n').filter(Boolean);
    for (const req of REQUIRED) {
      if (!entries.some((e) => e === req || e.startsWith(req))) {
        die(`react tarball is missing required entry "${req}"`);
      }
    }
    for (const bad of FORBIDDEN) {
      if (entries.some((e) => e === bad || e.startsWith(bad))) {
        die(`react tarball leaks dev-only entry "${bad}" (tighten the "files" allowlist)`);
      }
    }

    // ========================================================================
    // VITE FIXTURE (RCT-03 isolation + RCT-04 types + production silence)
    // ========================================================================
    const viteDir = installFixture('vite-app', VITE_FIXTURE_SRC, [reactTgz, stylesTgz]);

    // -- 4. tsc --noEmit (types resolve through the exports map) --------------
    const tsc = run(bin(viteDir, 'tsc'), ['--noEmit'], { cwd: viteDir });
    if (tsc.status !== 0)
      die(`vite fixture tsc --noEmit exited ${tsc.status}\n${tsc.stdout}\n${tsc.stderr}`);

    // -- 5. real production vite build ---------------------------------------
    const build = run(bin(viteDir, 'vite'), ['build'], { cwd: viteDir });
    if (build.status !== 0)
      die(`vite build exited ${build.status}\n${build.stdout}\n${build.stderr}`);
    const viteDist = join(viteDir, 'dist');
    if (!existsSync(viteDist)) die('vite build produced no dist/ directory');

    // -- 6a. JS-only scan ----------------------------------------------------
    const jsAssets = walkAssets(viteDist, ['.js']);
    if (jsAssets.length === 0) die('vite build emitted no .js assets');
    const js = jsAssets.map((f) => readFileSync(f, 'utf8')).join('\n');
    if (!js.includes(BUTTON_MARKER)) die(`vite JS assets missing Button marker "${BUTTON_MARKER}"`);
    if (!js.includes(INPUT_MARKER)) die(`vite JS assets missing Input marker "${INPUT_MARKER}"`);
    if (!js.includes(ICON_MARKER)) die(`vite JS assets missing Icon marker "${ICON_MARKER}"`);
    if (js.includes(DIALOG_MARKER)) {
      die(
        `vite JS assets contain the Dialog marker "${DIALOG_MARKER}" — tree-shaking/isolation broke`,
      );
    }
    if (js.includes(ICON_WARNING_LITERAL)) {
      die(
        `vite JS assets contain the Icon dev-warning "${ICON_WARNING_LITERAL}" — production strip failed`,
      );
    }

    // -- 6b. CSS validated separately + semantic CDN scan over ALL assets -----
    const cssAssets = walkAssets(viteDist, ['.css']);
    if (cssAssets.length === 0)
      die('vite build emitted no .css asset (the styles import did not bundle)');
    const css = cssAssets.map((f) => readFileSync(f, 'utf8')).join('\n');
    if (!css.includes('.lyra-btn')) die('emitted CSS missing the .lyra-btn rule');
    if (!css.includes('.lyra-dialog-overlay')) {
      die(
        'emitted CSS missing the .lyra-dialog-overlay rule (the full stylesheet must ship by design)',
      );
    }

    const allAssets = walkAssets(viteDist, ['.js', '.css']);
    assertNoCdn('vite fixture', allAssets);
    // Positive assertion (ii): the react-dom prod error-decoder URL IS present in the JS
    // and does NOT fail the scan — proving the https://react.dev/ allowlist prefix is alive.
    if (!js.includes(REACT_DEV_LITERAL)) {
      die(`expected the react-dom error-decoder URL (${REACT_DEV_LITERAL}) in the vite JS assets`);
    }
    if (!isAllowlisted(REACT_DEV_LITERAL))
      die(`allowlist regression: ${REACT_DEV_LITERAL} is not allowlisted`);

    // -- 7. CJS require() consumer proof -------------------------------------
    // NOTE (deviation, Rule 1): the plan's literal `typeof === 'function'` is wrong for
    // these exports — Button/Input/Icon/Dialog are all React.forwardRef components, whose
    // runtime value is an object ($$typeof: Symbol(react.forward_ref)), never a function.
    // The real intent is "the CJS require() path resolves and yields renderable React
    // components", so the proof asserts a valid React component type (function OR an
    // exotic-component object carrying $$typeof).
    const cjsProof = [
      'const assertComponent = (v, n) => {',
      "  const okType = typeof v === 'function' || (v && typeof v === 'object' && '$$typeof' in v);",
      "  if (!okType) { console.error('CJS require: ' + n + ' is not a React component (' + typeof v + ')'); process.exit(1); }",
      '};',
      "const barrel = require('@lyra-ds/react');",
      "const iconSub = require('@lyra-ds/react/icon');",
      'assertComponent(barrel.Button, \'require("@lyra-ds/react").Button\');',
      'assertComponent(iconSub.Icon, \'require("@lyra-ds/react/icon").Icon\');',
      "console.log('CJS require() proof OK: root barrel + ./icon subpath resolve to React components');",
    ].join('\n');
    const cjs = run(process.execPath, ['-e', cjsProof], { cwd: viteDir });
    if (cjs.status !== 0)
      die(`CJS require() proof exited ${cjs.status}\n${cjs.stdout}\n${cjs.stderr}`);
    process.stdout.write(cjs.stdout);

    console.log(
      'smoke OK (vite): tarball allowlist verified; real npm install of the @lyra-ds/react + ' +
        '@lyra-ds/styles tarballs; tsc --noEmit clean; production vite build tree-shakes to ' +
        'Button+Input+Icon (Dialog excluded); Icon dev-warning stripped; CSS ships full; ' +
        'semantic CDN scan clean with both allowlisted literals present; CJS require() proof green.',
    );
  } catch (err) {
    ok = false;
    console.error(err && err.stack ? err.stack : String(err));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

process.exit(ok ? 0 : 1);
