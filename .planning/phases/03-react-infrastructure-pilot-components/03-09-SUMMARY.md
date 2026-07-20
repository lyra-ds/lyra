---
phase: 03-react-infrastructure-pilot-components
plan: 09
subsystem: infra
tags: [smoke, tarball, vite, nextjs, tree-shaking, ci, react, packaging]

# Dependency graph
requires:
  - phase: 03-01
    provides: package.json exports map (dual ESM+CJS, per-component subpaths), files allowlist
  - phase: 03-05
    provides: Button pilot + Icon dev-warn NODE_ENV-strip contract (production-silence proof)
  - phase: 03-06
    provides: Input pilot
  - phase: 03-07
    provides: Dialog pilot (.lyra-dialog-overlay runtime marker) + Icon pilot (registry)
  - phase: 03-08
    provides: tools/dist-scan/no-cdn-scan.mjs (shared CDN rule set), attw --profile node16 decision, size-limit budgets, final CI build-job step order
provides:
  - tools/smoke/smoke.mjs (D-27 scratch-app validation — pack → allowlist → temp npm install → tsc → build → CJS require → assertions, both fixtures)
  - tools/smoke/vite-app committed fixture (exact-pinned Vite consumer)
  - tools/smoke/next-app committed fixture (exact-pinned Next.js App Router consumer)
  - Barrel tree-shakeability: /*#__PURE__*/ on the four forwardRef component exports (RCT-03 for root-barrel imports)
  - no-cdn-scan.mjs exported rule set (CDN_HOSTS + allowlist + scanContent) shared byte-identically by the dist scan and the fixture scan
  - Root `smoke` script + the final Phase 3 CI build-job step
affects: [phase-04-component-conversion, phase-07-release]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scratch-app smoke: pnpm pack → tarball allowlist → REAL npm install into an OS-temp fixture copy (never tar-extract, because @lyra-ds/react has a real lucide-react dep) → tsc --noEmit → real bundler build → runtime assertions"
    - "JS-only Dialog-exclusion scan + separate CSS validation: the full @lyra-ds/styles stylesheet legitimately contains .lyra-dialog-overlay, so an all-assets exclusion scan is unsatisfiable — scope the exclusion to *.js"
    - "Shared CDN rule set imported (not forked) from no-cdn-scan.mjs → byte-identical dist scan and fixture scan by construction"
    - "forwardRef component exports need /*#__PURE__*/ to be tree-shakeable through a bundled root barrel (esbuild/Rollup treat an un-annotated forwardRef() call as side-effectful)"

key-files:
  created:
    - tools/smoke/smoke.mjs
    - tools/smoke/vite-app/package.json
    - tools/smoke/vite-app/vite.config.mjs
    - tools/smoke/vite-app/index.html
    - tools/smoke/vite-app/tsconfig.json
    - tools/smoke/vite-app/src/main.tsx
    - tools/smoke/next-app/package.json
    - tools/smoke/next-app/next.config.mjs
    - tools/smoke/next-app/tsconfig.json
    - tools/smoke/next-app/app/layout.tsx
    - tools/smoke/next-app/app/page.tsx
    - tools/smoke/next-app/app/dialog-demo.tsx
  modified:
    - tools/dist-scan/no-cdn-scan.mjs
    - packages/react/src/button/button.tsx
    - packages/react/src/input/input.tsx
    - packages/react/src/dialog/dialog.tsx
    - packages/react/src/icon/icon.tsx
    - .github/workflows/ci.yml
    - package.json

key-decisions:
  - "Barrel tree-shakeability via /*#__PURE__*/ on all four forwardRef exports: without it a root-barrel `{ Input }` import pulls the whole bundled barrel (Dialog included), leaving .lyra-dialog-overlay in the consumer JS. The annotation lets Rollup drop unused components — the plan's Dialog-exclusion assertion holds verbatim AND barrel imports become genuinely tree-shakeable (RCT-03). Zero-byte / zero-behavior change; size-limit unchanged (Button 249 B, Icon 5.95 kB)."
  - "CJS require() proof asserts a valid React component type (function OR $$typeof object), not the plan's literal typeof === 'function' — all pilots are forwardRef, whose runtime value is an exotic-component object."
  - "Shared CDN rule set is IMPORTED from no-cdn-scan.mjs (exported constants + scanContent) rather than the fixture shelling out to the CLI, because the fixture must scan .css assets too (outside the CLI's extension filter) while keeping the host list + allowlist byte-identical."
  - "next-app fixture pins @types/node (Next's build-time tsc step fails without it)."

requirements-completed: [RCT-03, RCT-04]

coverage:
  - id: D1
    description: "Vite scratch-app: tarball installs reproducibly from a real npm install; tsc --noEmit resolves types through the exports map; production build tree-shakes to Button+Input+Icon with Dialog excluded from JS; Icon dev-warning stripped; CSS ships full; semantic CDN scan clean with both allowlisted literals present-yet-passing; CJS require() of the barrel + ./icon subpath resolves to React components."
    requirement: "RCT-03, RCT-04"
    verification:
      - kind: automated
        ref: "node tools/smoke/smoke.mjs (vite path)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Next.js scratch-app: App Router server page importing Button/Input/Icon + a client-boundary Dialog completes next build from the packed tarball (exports-map resolution + 'use client' directive honored); prerendered output contains the lyra-btn class emission."
    requirement: "RCT-04"
    verification:
      - kind: automated
        ref: "node tools/smoke/smoke.mjs (next path)"
        status: pass
    human_judgment: false
  - id: D3
    description: "smoke wired as the final Phase 3 CI build-job step; four frozen job names intact; actionlint clean; full phase-exit gate chain green locally."
    requirement: "RCT-03"
    verification:
      - kind: automated
        ref: "lint, typecheck, test (139), parity, icon-registry --check, build, publint, attw --profile node16, size-limit, smoke; actionlint on ci.yml"
        status: pass
    human_judgment: false

# Metrics
duration: 45min
completed: 2026-07-20
status: complete
---

# Phase 3 Plan 09: Scratch-App Tarball Validation (D-27) Summary

**RCT-03/RCT-04 proven end to end: the packed @lyra-ds/react tarball installs via a real npm install into committed Vite and Next.js scratch apps, typechecks and builds in both, tree-shakes to only the imported pilots (Dialog excluded from JS), strips the Icon dev-warning in production, references zero CDNs, and resolves through CommonJS require() — wired as the final Phase 3 CI gate.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-20
- **Tasks:** 3 of 3
- **Files:** 12 created, 7 modified

## Accomplishments

- Built `tools/smoke/smoke.mjs`: packs both packages, verifies the react tarball REQUIRED/FORBIDDEN allowlist, does a REAL `npm install` of the tarballs into an OS-temp copy of each committed fixture (never a tar-extract — @lyra-ds/react's lucide-react dependency has to materialize), runs `tsc --noEmit`, a real production build, a JS-only isolation scan, separate CSS validation, the shared semantic CDN scan, and a CJS `require()` consumer proof. Unique `mkdtempSync` temp dirs with a `die()` cleanup contract; captured build/install output printed before cleanup.
- Committed two exact-pinned fixtures: `vite-app` (react/react-dom/@types/typescript/@vitejs/plugin-react/vite) and `next-app` (App Router: server page + client-boundary Dialog; next/react/react-dom/TS/@types incl. @types/node). Both live under `tools/smoke/` as data, so `pnpm --frozen-lockfile` at the repo root stays clean.
- Made the root barrel genuinely tree-shakeable by annotating the four `forwardRef` component exports with `/*#__PURE__*/`, so a barrel `{ Input, Icon }` import drops Dialog from the consumer bundle — the plan's Dialog-exclusion isolation assertion holds verbatim.
- Refactored `no-cdn-scan.mjs` to export its rule set (`CDN_HOSTS` + allowlist + `scanContent`) and imported it into the fixture scan, so both scans are byte-identical by construction; CLI behavior preserved (guarded main-module entry).
- Wired `node tools/smoke/smoke.mjs` as the final build-job CI step + a root `smoke` script; verified the entire Phase 3 exit-gate chain green locally (lint, typecheck, 139 tests, parity, icon-registry --check, build, publint, attw --profile node16, size-limit, smoke) and actionlint clean.

## Task Commits

1. **Task 1: smoke.mjs core + Vite fixture (+ barrel PURE annotations + shared-scan export)** - `06370b2` (feat)
2. **Task 2: Next.js App Router fixture + smoke Next path** - `f728af1` (feat)
3. **Pre-existing prettier drift fix (phase-exit lint gate)** - `35681fd` (style)
4. **Task 3: wire smoke as the final Phase 3 CI build-job step** - `a8a87bc` (feat)

## Files Created/Modified

- `tools/smoke/smoke.mjs` - The D-27 scratch-app validator (pack → allowlist → temp npm install → tsc → build → CJS require → JS/CSS/CDN assertions, both fixtures)
- `tools/smoke/vite-app/*` - Committed Vite consumer fixture (exact-pinned; Button via ./button subpath, Input+Icon via root barrel, full @lyra-ds/styles import)
- `tools/smoke/next-app/*` - Committed Next.js App Router fixture (server page + client-boundary Dialog; exact-pinned incl. @types/node)
- `tools/dist-scan/no-cdn-scan.mjs` - Exported the shared CDN rule set + `scanContent`; CLI guarded to main-module only
- `packages/react/src/{button,input,dialog,icon}/*.tsx` - `/*#__PURE__*/` before each `forwardRef(...)` export (barrel tree-shakeability, RCT-03)
- `.github/workflows/ci.yml` - Final build-job step `node tools/smoke/smoke.mjs` (Phase 3 / RCT-04 / D-27)
- `package.json` - Root `smoke` script

## Decisions Made

- **Barrel tree-shakeability via `/*#__PURE__*/`.** The tsup barrel (`splitting: false`) inlines all four components into one `dist/index.js`. An un-annotated `var Dialog = forwardRef(...)` initializer is treated as side-effectful by Rollup, so importing anything from the barrel kept Dialog's `.lyra-dialog-overlay` marker in the consumer JS — the smoke test caught this. Adding `/*#__PURE__*/` before each `forwardRef(...)` lets Rollup drop unused components. Verified: the Vite fixture's barrel `{ Input, Icon }` import now excludes Dialog from the JS, size-limit is unchanged (annotations are zero-byte), and all dist/publint/attw/test gates stay green. Beyond satisfying the assertion, this makes the common root-barrel import path genuinely tree-shakeable (RCT-03), not only the per-subpath imports the size-limit budget measures.
- **CJS proof asserts a React component type, not `typeof === 'function'`.** Every pilot is `React.forwardRef`, whose runtime value is an exotic-component object (`$$typeof: Symbol(react.forward_ref)`), never a function. The proof asserts `typeof === 'function' || ($$typeof present)` — proving the CJS require() path resolves to renderable components (the plan's literal assertion would have failed on correct code).
- **Import the shared CDN rule set, don't shell out.** The fixture must scan `.css` assets too (the CLI's `collectFiles` only walks `.js/.cjs/.d.ts`), so it imports `CDN_HOSTS`/allowlist/`scanContent` from `no-cdn-scan.mjs` and applies them to every emitted asset — same module, byte-identical rules, with two positive present-yet-passing assertions (Lucide `xmlns` under `http://www.w3.org/`, react-dom decoder URL under `https://react.dev/`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Root barrel was not tree-shakeable**
- **Found during:** Task 1 (the Vite JS Dialog-exclusion assertion failed)
- **Issue:** A barrel import (`{ Input, Icon }` from `@lyra-ds/react`) pulled the entire bundled barrel including Dialog, leaving `.lyra-dialog-overlay` in the consumer JS. Root cause: `forwardRef(...)` initializers in the single-file barrel lack PURE annotations, so Rollup cannot drop unused components. This undermined RCT-03 for the most common (barrel) import style.
- **Fix:** Added `/*#__PURE__*/` before each of the four `forwardRef(...)` component exports.
- **Files modified:** packages/react/src/{button,input,dialog,icon}/*.tsx
- **Verification:** smoke Dialog-exclusion assertion passes; size-limit unchanged (249 B / 5.95 kB); build/publint/attw/tests green.
- **Commit:** `06370b2`

**2. [Rule 1 - Bug] Plan's CJS `typeof === 'function'` assertion is wrong for forwardRef exports**
- **Found during:** Task 1 (designing the CJS proof)
- **Issue:** Pilots are `forwardRef` components → runtime `typeof` is `object`, not `function`; the literal assertion would fail against correct code.
- **Fix:** Assert a valid React component type (function OR an object carrying `$$typeof`).
- **Files modified:** tools/smoke/smoke.mjs
- **Commit:** `06370b2`

**3. [Rule 3 - Blocking] Next build-time tsc requires @types/node**
- **Found during:** Task 2 (`next build` failed its TypeScript step)
- **Issue:** Next's build runs `tsc` and errors without `@types/node`.
- **Fix:** Pinned `@types/node@24.13.3` in the next-app fixture devDependencies.
- **Files modified:** tools/smoke/next-app/package.json
- **Commit:** `f728af1`

**4. [Rule 3 - Blocking] Pre-existing prettier drift blocked the phase-exit lint gate**
- **Found during:** Task 3 (`pnpm run lint` — the plan's phase-exit check)
- **Issue:** 5 files from earlier plans (03-04/03-06/03-07) failed `prettier --check .` (printWidth line-wrapping). Not caused by this plan, but the plan's Task 3 runs the full phase gate chain as the exit check, which this blocked. Same class of fix as 03-08's own prettier-write deviation.
- **Fix:** `prettier --write` on the 5 files (formatting only, zero behavior change), committed separately as `style`.
- **Files modified:** dialog.browser.test.tsx, dialog.ssr.test.ts, input.browser.test.tsx, internal.browser.test.tsx, use-focus-trap.ts
- **Commit:** `35681fd`

---

**Total deviations:** 4 auto-fixed (1 Rule 2, 1 Rule 1, 2 Rule 3). No architectural changes; no scope creep beyond the barrel-tree-shaking fix that RCT-03 requires.

## Issues Encountered

None beyond the deviations above. Both fixtures build reproducibly from the packed tarballs.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None — all deliverables are complete and machine-verified.

## Threat Flags

None — no new security surface beyond the plan's `<threat_model>`. T-03-16/17/18 are mitigated: the fixture-output CDN grep is a second detection point on top of the dist grep; the REQUIRED/FORBIDDEN tarball allowlist runs before install; installs are `npm install --no-audit --no-fund` of local tarballs + exact-pinned registry deps with no postinstall scripts.

## Self-Check: PASSED

All created files exist on disk; all four commits (06370b2, f728af1, 35681fd, a8a87bc) are in git history.
