#!/usr/bin/env node
/**
 * @lyra-ds/styles — STY-01/STY-02 packed-artifact smoke test (plain Node, ESM).
 *
 * Proves the PUBLISHED shape of @lyra-ds/styles actually installs and bundles
 * through a REAL consumer bundler. A bare `require.resolve('@lyra-ds/styles')`
 * only resolves a .css PATH without loading/bundling it — it proves nothing about
 * the exports map, the nested relative `@import` chain, or bundler compatibility.
 * This test instead:
 *
 *   1. `pnpm pack` in packages/styles -> a real tarball.
 *   2. Asserts the tarball file list contains the allowlisted files
 *      (styles.css, tokens/, components/, compat-shadcn.css, README.md) and
 *      EXCLUDES dev-only surface (tests/, vitest.config.ts, .stylelintrc.json,
 *      node_modules) — the `files` allowlist guard (T-02-PACK).
 *   3. Extracts the tarball into a throwaway temp fixture's
 *      node_modules/@lyra-ds/styles (the package has zero runtime deps, so a plain
 *      extract is a faithful, offline install of the published artifact).
 *   4. Copies the committed fixture (tools/pack-smoke/fixture/*: main.js, entry.css,
 *      vite.config.mjs, package.json) into the temp dir. entry.css `@import`s the
 *      root `@lyra-ds/styles`, the literal `./styles.css`, and a `./tokens/*` subpath.
 *   5. Runs a REAL `vite@8.1.5` build (the monorepo's pinned binary) that bundles
 *      the fixture entry.
 *   6. Reads the EMITTED/bundled CSS from the fixture's dist/ and asserts it contains
 *      a known `.lyra-*` class (.lyra-btn) AND a known token (--accent) — proving the
 *      root export, the `./styles.css` export, and the relative `@import` chain all
 *      resolve and bundle through a real consumer bundler.
 *
 * Exits non-zero with a clear message on any failure (missing/leaked tarball entry,
 * vite build error, or missing class/token in the emitted CSS). Cleans up the temp dir.
 */

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..', '..');
const STYLES = join(REPO, 'packages', 'styles');
const FIXTURE_SRC = join(__dirname, 'fixture');

// `tmp` is created further below; `die` cleans it up before exiting because
// process.exit() terminates immediately and SKIPS the finally block, so without
// this every failed run leaks a lyra-pack-smoke-* dir in the OS temp dir (IN-01).
let tmp;
const die = (msg) => {
  console.error(`pack-smoke FAILED: ${msg}`);
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
};

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.error) die(`could not run ${cmd}: ${r.error.message}`);
  return r;
};

// Files that MUST ship (matched as a prefix under the tarball's `package/` root).
const REQUIRED = [
  'package/styles.css',
  'package/tokens/',
  'package/components/',
  'package/compat-shadcn.css',
  'package/README.md',
];
// Dev-only surface that MUST NOT leak into the published tarball.
const FORBIDDEN = [
  'package/tests/',
  'package/vitest.config.ts',
  'package/.stylelintrc.json',
  'package/node_modules/',
];

tmp = mkdtempSync(join(tmpdir(), 'lyra-pack-smoke-'));
let ok = true;
try {
  // -- 1. pack ---------------------------------------------------------------
  const packDir = join(tmp, 'tarball');
  mkdirSync(packDir, { recursive: true });
  const pack = run('pnpm', ['pack', '--pack-destination', packDir], { cwd: STYLES });
  if (pack.status !== 0) die(`pnpm pack exited ${pack.status}\n${pack.stderr || pack.stdout}`);
  const tgz = readdirSync(packDir).find((f) => f.endsWith('.tgz'));
  if (!tgz) die('pnpm pack produced no .tgz');
  const tarball = join(packDir, tgz);

  // -- 2. tarball file-list allowlist ---------------------------------------
  const list = run('tar', ['-tzf', tarball]);
  if (list.status !== 0) die(`tar -tzf exited ${list.status}\n${list.stderr}`);
  const entries = list.stdout.split('\n').filter(Boolean);
  for (const req of REQUIRED) {
    if (!entries.some((e) => e === req || e.startsWith(req))) {
      die(`tarball is missing required entry "${req}"`);
    }
  }
  for (const bad of FORBIDDEN) {
    if (entries.some((e) => e === bad || e.startsWith(bad))) {
      die(`tarball leaks dev-only entry "${bad}" (tighten the "files" allowlist)`);
    }
  }

  // -- 3. extract into the fixture's node_modules ---------------------------
  const fixture = join(tmp, 'fixture');
  mkdirSync(fixture, { recursive: true });
  const extractDir = join(tmp, 'extract');
  mkdirSync(extractDir, { recursive: true });
  const untar = run('tar', ['-xzf', tarball, '-C', extractDir]);
  if (untar.status !== 0) die(`tar -xzf exited ${untar.status}\n${untar.stderr}`);
  const dest = join(fixture, 'node_modules', '@lyra-ds', 'styles');
  mkdirSync(dirname(dest), { recursive: true });
  renameSync(join(extractDir, 'package'), dest);

  // -- 4. copy the committed consumer fixture -------------------------------
  for (const f of readdirSync(FIXTURE_SRC)) {
    cpSync(join(FIXTURE_SRC, f), join(fixture, f), { recursive: true });
  }

  // -- 5. real Vite build ----------------------------------------------------
  // Resolve the monorepo's pinned vite binary (fixture only has the tarball).
  const require = createRequire(import.meta.url);
  const vitePkg = require.resolve('vite/package.json');
  const viteBin = join(dirname(vitePkg), require(vitePkg).bin.vite);
  const build = run(process.execPath, [viteBin, 'build'], { cwd: fixture });
  if (build.status !== 0) {
    die(`vite build exited ${build.status}\n${build.stdout}\n${build.stderr}`);
  }

  // -- 6. assert the emitted CSS -------------------------------------------
  const distDir = join(fixture, 'dist');
  if (!existsSync(distDir)) die('vite build produced no dist/ directory');
  const cssFiles = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else if (name.name.endsWith('.css')) cssFiles.push(full);
    }
  };
  walk(distDir);
  if (cssFiles.length === 0)
    die('vite build emitted no CSS (the CSS @import chain did not bundle)');
  const emitted = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

  if (!emitted.includes('.lyra-btn')) {
    die('emitted CSS is missing the ".lyra-btn" class — the component layer did not bundle');
  }
  if (!emitted.includes('--accent')) {
    die('emitted CSS is missing the "--accent" token — the token layer did not bundle');
  }

  console.log(
    'pack-smoke OK: tarball allowlist verified; real vite@8.1.5 consumer build of ' +
      '@lyra-ds/styles + ./styles.css + ./tokens/brand.css emitted CSS containing ' +
      '.lyra-btn and --accent',
  );
} catch (err) {
  ok = false;
  die(err && err.stack ? err.stack : String(err));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

process.exit(ok ? 0 : 1);
