---
phase: 02-styles-package
plan: 06
subsystem: ci
tags: [ci, github-actions, publint, vite, pack-smoke, stylelint, parity, playwright, packaging]

# Dependency graph
requires:
  - phase: 02-03
    provides: styles.css aggregate entry + package.json exports map + `lint:css`/`test` scripts
  - phase: 02-04
    provides: parity script (tools/parity), stylelint config, and blocking-checkpoint human approval of publint + vite devDependency legitimacy
  - phase: 02-05
    provides: Vitest Browser Mode harness (chromium) + playwright root devDependency
provides:
  - All Phase-2 quality gates wired as STEPS in the four frozen CI jobs (stylelint; chromium-install -> Browser Mode test -> parity; publint + pack-smoke)
  - Packed-artifact smoke test (real vite@8.1.5 consumer build of the published tarball)
  - Pinned publint@0.3.21 + vite@8.1.5 root devDependencies
affects: [phase-03-react, phase-07-release]

# Tech tracking
tech-stack:
  added:
    - "publint@0.3.21"
    - "vite@8.1.5"
  patterns:
    - "New quality gates land ONLY as steps inside the four frozen CI jobs (lint/typecheck/test/build), never as new jobs (required-status-check contexts)"
    - "CI tools invoked via lockfile-installed `pnpm exec` binaries, never floating `pnpm dlx`/`npx`"
    - "Browser install (`playwright install chromium --with-deps`) ordered BEFORE the root `pnpm run test` that recurses into Browser Mode suites"
    - "Packed-artifact smoke test = pnpm pack -> tarball allowlist guard -> extract into throwaway fixture -> REAL vite consumer build -> assert class + token in emitted CSS (not a bare require.resolve path check)"
    - "Vite binary resolved from vite/package.json bin field (vite exports block ./bin/vite.js), invoked with node against a temp fixture cwd"

key-files:
  created:
    - tools/pack-smoke/pack-smoke.mjs
    - tools/pack-smoke/fixture/entry.css
    - tools/pack-smoke/fixture/main.js
    - tools/pack-smoke/fixture/vite.config.mjs
    - tools/pack-smoke/fixture/package.json
  modified:
    - .github/workflows/ci.yml
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Pack-smoke extracts the tarball directly into the fixture's node_modules/@lyra-ds/styles (package has zero runtime deps) — a faithful, offline install of the published artifact, no npm/pnpm install of the tarball needed"
  - "Fixture vite config is a plain object (no `import from 'vite'`) because vite is resolved from the monorepo binary, not from the throwaway fixture that only has the tarball"
  - "Token assertion uses `--accent` (a real declaration in brand.css) and class assertion uses `.lyra-btn`; `--brand` itself is a consumer INPUT and never a declaration in the shipped CSS"
  - "vite bin path derived via require('vite/package.json').bin.vite joined to the package dir — vite's exports map forbids resolving ./bin/vite.js directly"
  - "publint reported no errors AND no suggestions for the CSS-only package (no types/main expected); nothing intentionally suppressed"

patterns-established:
  - "Committed fixture template (tools/pack-smoke/fixture) copied into an os.tmpdir throwaway per run; temp dir removed in finally"
  - "Tarball file-list allowlist: REQUIRED prefixes (styles.css, tokens/, components/, compat-shadcn.css, README.md) present AND FORBIDDEN prefixes (tests/, vitest.config.ts, .stylelintrc.json, node_modules/) absent"

requirements-completed: [STY-01, STY-02, STY-06, STY-07]

coverage:
  - id: D1
    description: "STY-07 — publint green on packages/styles: valid exports map (incl. ./styles.css) + sideEffects:['**/*.css'] protects CSS from consumer tree-shaking"
    requirement: "STY-07"
    verification:
      - kind: command
        ref: "pnpm exec publint packages/styles -> 'All good!' (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "STY-06 — token/class parity runs in CI on every PR and fails on any handoff drift/relocation/external-url"
    requirement: "STY-06"
    verification:
      - kind: command
        ref: "pnpm run parity -> 'parity OK: 209 tokens, 248 classes, placement + at-rule ancestry + no-CDN verified' (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "STY-01/STY-02 — the published tarball's root export, ./styles.css export, and ./tokens/* subpath all resolve and bundle through a REAL vite@8.1.5 consumer build; emitted CSS contains .lyra-btn + --accent"
    requirement: "STY-01"
    verification:
      - kind: e2e
        ref: "node tools/pack-smoke/pack-smoke.mjs -> 'pack-smoke OK: ... emitted CSS containing .lyra-btn and --accent' (exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Four frozen CI jobs unchanged (lint/typecheck/test/build); gates added only as steps; chromium install precedes root test; tools via pnpm exec; actionlint passes"
    verification:
      - kind: command
        ref: "grep -cE '^  (lint|typecheck|test|build):' == 4; awk order check; checksum-verified actionlint on ci.yml"
        status: pass
    human_judgment: false
  - id: D5
    description: "Browser Mode test green in chromium after playwright install (STY-03/STY-04 gate wired into CI test job)"
    verification:
      - kind: e2e
        ref: "pnpm --filter @lyra-ds/styles run test -> 1 file / 9 tests passed"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-07-18
status: complete
---

# Phase 2 Plan 06: CI Integration Summary

Wired every Phase-2 quality gate into the existing GitHub Actions workflow as STEPS inside the four FROZEN jobs — never new jobs — closing STY-06 (parity in CI), STY-07 (publint green with `sideEffects: ["**/*.css"]`), and validating STY-01/STY-02 by bundling the packed tarball through a real `vite@8.1.5` consumer build. This is the integration step that makes the phase's guarantees continuous on every PR.

## What was built

**Task 1 — CI wiring (`ci` commit 913f831):**
- `lint` job: added `pnpm --filter @lyra-ds/styles run lint:css` (stylelint — the CSS package's only static gate).
- `test` job: inserted `pnpm exec playwright install chromium --with-deps` **before** `pnpm run test` (the root `pnpm -r` test now recurses into packages/styles' Browser Mode suite, so a fresh runner must install chromium first — deterministic-fresh-runner ordering), then `pnpm run parity` after (STY-06).
- `build` job: added `pnpm exec publint packages/styles` (STY-07) and `node tools/pack-smoke/pack-smoke.mjs` (STY-01/STY-02).
- Root devDependencies pinned exact (save-exact): `publint@0.3.21`, `vite@8.1.5` (legitimacy-cleared in 02-04). All tools invoked via `pnpm exec`, never floating `dlx`/`npx`. Four job names unchanged; actionlint (checksum-verified binary) passes.

**Task 2 — packed-artifact smoke test (`feat` commit 0e4b801):**
- `tools/pack-smoke/pack-smoke.mjs`: `pnpm pack` → assert the tarball file list (allowlisted files present, dev-only surface absent) → extract into a throwaway temp fixture's `node_modules/@lyra-ds/styles` → run a **real** `vite@8.1.5` build of a consumer entry that `@import`s the root `@lyra-ds/styles` + the literal `./styles.css` + a `./tokens/*` subpath → assert the emitted/bundled CSS contains `.lyra-btn` AND `--accent`. Proves the root export, the `./styles.css` export, and the relative `@import` chain all resolve through a real bundler (not a bare `require.resolve` path check).
- `tools/pack-smoke/fixture/`: committed consumer fixture (entry.css, main.js, plain-object vite.config.mjs, package.json), copied into the temp dir per run.
- Root `pack-smoke` script added.

## Gates confirmed green locally

| Gate | Command | Result |
|------|---------|--------|
| stylelint | `pnpm --filter @lyra-ds/styles run lint:css` | exit 0 |
| parity (STY-06) | `pnpm run parity` | 209 tokens, 248 classes, no-CDN — exit 0 |
| publint (STY-07) | `pnpm exec publint packages/styles` | "All good!" — exit 0 |
| Browser Mode (STY-03/04) | `pnpm --filter @lyra-ds/styles run test` | 9 tests passed (chromium) |
| pack-smoke (STY-01/02) | `node tools/pack-smoke/pack-smoke.mjs` | exit 0 (.lyra-btn + --accent in emitted CSS) |
| actionlint | checksum-verified binary on ci.yml | passed |

publint reported **no errors and no suggestions** for the CSS-only package — nothing was intentionally suppressed (no `types`/`main` is correct for a zero-JS package).

## Deviations from Plan

**None** for the wired gates — plan executed as written. Two implementation clarifications resolved during execution (not plan deviations):
- The plan hinted at installing the tarball into the fixture; because `@lyra-ds/styles` has zero runtime deps, the script extracts the tarball straight into the fixture's `node_modules` (faithful + offline). 
- Vite's exports map forbids resolving `./bin/vite.js`; the bin path is derived from `require('vite/package.json').bin.vite`.

## Deferred Issues (out of scope — logged)

`.planning/phases/02-styles-package/deferred-items.md` records a **pre-existing** failure of the Phase-1 `lint` job (`prettier --check .`): 18 files flagged — all `packages/styles/**/*.css` (intentionally handoff-verbatim per locked decision) plus `tools/parity/*` — committed by plans 02-01..02-05, **not** modified by 02-06. Root cause: `.prettierignore` omits `packages/styles/**/*.css`. Suggested fix (future plan): add that glob to `.prettierignore`, aligning with the locked "CSS stays handoff-verbatim; prettier gates JSON/MD" decision. All 02-06-authored files pass `prettier --check`.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary surface introduced. Mitigations for the plan's threat register (T-02-SE publint, T-02-JOBS 4-jobs+actionlint, T-02-SC pinned pnpm-exec tools, T-02-ORDER chromium-before-test, T-02-PACK tarball allowlist + real build, T-02-PARITY parity step) are all wired.

## Self-Check: PASSED

All created files exist on disk; both task commits (0e4b801 feat, 913f831 ci) present in git history.
