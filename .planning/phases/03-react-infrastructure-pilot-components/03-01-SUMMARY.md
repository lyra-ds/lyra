---
phase: 03-react-infrastructure-pilot-components
plan: 01
subsystem: infra
tags: [react, tsup, vitest, eslint, packaging, exports-map, rsc, lucide-react, monorepo]

# Dependency graph
requires:
  - phase: 02-styles
    provides: "@lyra-ds/styles CSS package (imported by browser tests, never by src)"
  - phase: 01-foundation
    provides: "pnpm workspace, tsconfig.base.json, changesets, save-exact .npmrc, 4-check main CI"
provides:
  - "@lyra-ds/react as a real dual-format (ESM+CJS) workspace package that typechecks, lints, and builds green"
  - "attw-safe exports map: root + ./button/./input/./dialog/./icon subpaths with split per-condition types (D-13)"
  - "tsup config: 5 per-entry outputs, splitting:false, deterministic RSC 'use client' directive on every chunk"
  - "two-project Vitest harness (browser chromium + ssr node) template for Phase 4 batch conversion (D-26)"
  - "RCT-03 ESLint no-CSS-import ban active in packages/react/src"
  - "folder-per-component scaffold with buildable placeholder entries (D-28) for the wave-3 pilots"
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08, 03-09, phase-04-batch-conversion]

# Tech tracking
tech-stack:
  added:
    - "tsup@8.5.1, @arethetypeswrong/cli@0.18.5, size-limit@12.1.0, @size-limit/preset-small-lib@12.1.0"
    - "eslint@10.7.0, typescript-eslint@8.64.0, eslint-plugin-jsx-a11y@6.10.2, eslint-plugin-react-hooks@7.1.1"
    - "vitest-browser-react@2.2.0, axe-core@4.12.1, react@19.2.7, react-dom@19.2.7, @types/react@19.2.17, @types/react-dom@19.2.3"
    - "lucide-react@1.25.0 (the ONLY runtime dependency of @lyra-ds/react, D-11)"
  patterns:
    - "attw-safe exports map with split .d.ts/.d.cts per condition, types-first"
    - "tsup onSuccess post-write step to guarantee 'use client' where tsup's banner is stripped by Rollup"
    - "flat ESLint config with RCT-03 no-restricted-imports CSS ban"

key-files:
  created:
    - packages/react/tsconfig.json
    - packages/react/tsup.config.ts
    - packages/react/vitest.config.ts
    - packages/react/eslint.config.js
    - packages/react/LICENSE
    - packages/react/README.md
    - packages/react/src/index.ts
    - packages/react/src/{button,input,dialog,icon}/index.ts
  modified:
    - packages/react/package.json
    - package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml

key-decisions:
  - "RSC 'use client' emitted via tsup onSuccess post-write step: tsup 8.5.1 routes esbuild output through Rollup, which strips leading directive prologues from banner AND source — the banner option is a silent no-op, so a deterministic prepend is the only reliable mechanism (verified on all 5 entries x esm+cjs)"
  - "onlyBuiltDependencies:[] in pnpm-workspace.yaml — no dependency runs install/postinstall scripts; esbuild's binary comes from optionalDependencies, so its build script is unnecessary and the dual-format build is verified green with scripts ignored"
  - "lucide-react pinned 1.25.0 (RESEARCH A6, superseding UI-SPEC 1.24.0)"

patterns-established:
  - "Exports-map subpath keys must equal tsup entry keys must equal dist basenames (D-13 filename contract)"
  - "Placeholder folder entries (export {} + scaffold banner) keep the multi-entry build green across waves (D-28)"
  - "CSS never imported in src; appearance flows only through @lyra-ds/styles .lyra-* classes, enforced by lint (RCT-03)"

requirements-completed: [RCT-03, RCT-04]

coverage:
  - id: D1
    description: "attw-safe package.json: sideEffects:false, exports for . + ./button/./input/./dialog/./icon + ./package.json, split per-condition types (types-first), no ./internal, peers react/react-dom >=18 <20, exactly one runtime dep (lucide-react), no private flag"
    requirement: "RCT-04"
    verification:
      - kind: other
        ref: "node -e assertion on packages/react/package.json (Task 2 verify) — sideEffects, exports types split, no ./internal, peers, single dependency, not private"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dual-format (ESM+CJS) tsup build: 5 entries emit .js/.cjs/.d.ts/.d.cts, splitting:false (no chunk-*.js), and every js/cjs chunk starts with the RSC 'use client'; directive"
    requirement: "RCT-04"
    verification:
      - kind: integration
        ref: "pnpm --filter @lyra-ds/react run build (exit 0) + head -1 of dist/{index,button,input,dialog,icon}.{js,cjs} == '\"use client\";' + zero chunk files"
        status: pass
    human_judgment: false
  - id: D3
    description: "RCT-03 ESLint rule bans every *.css import inside packages/react/src (CI-enforced zero-CSS-imports guard)"
    requirement: "RCT-03"
    verification:
      - kind: integration
        ref: "clean lint exit 0; throwaway src file importing './x.css' makes eslint exit non-zero (smoke-verified, file removed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two-project Vitest harness: browser (chromium via @vitest/browser-playwright, src/**/*.browser.test.tsx) and ssr (node, src/**/*.ssr.test.ts) per D-26"
    requirement: "RCT-04"
    verification:
      - kind: other
        ref: "config assertion on packages/react/vitest.config.ts — both project names + include globs present"
        status: pass
    human_judgment: false

# Metrics
duration: ~13min active (plan spanned a human package-legitimacy checkpoint wait)
completed: 2026-07-19
status: complete
---

# Phase 3 Plan 01: React package infrastructure Summary

**`@lyra-ds/react` turned into a real dual-format library workspace — attw-safe exports map (root + 4 subpaths), tsup ESM+CJS build with a deterministic `"use client"` directive, two-project Vitest harness (browser+ssr), and the RCT-03 CSS-import ban — typechecking, linting, and building green from wave 1 on buildable placeholders.**

## Performance

- **Duration:** ~13 min active execution (the plan's first task was a blocking-human package-legitimacy checkpoint; wall-clock includes that human verification wait)
- **Started (resume):** 2026-07-19T04:02:56Z
- **Completed:** 2026-07-19T14:15:56Z
- **Tasks:** 2 auto tasks completed (Task 1 was the approved supply-chain checkpoint)
- **Files modified:** 15

## Accomplishments
- Installed the exact-pinned React toolchain after the human-verified package-legitimacy gate; `lucide-react` is the sole runtime dependency (D-11).
- Rewrote `packages/react/package.json` into a publishable manifest: attw-safe exports map with split per-condition types (`.d.ts` import / `.d.cts` require, types-first), `sideEffects:false`, node10 fallbacks, peers `react`/`react-dom >=18 <20`, no `./internal`, private flag dropped.
- Authored `tsup.config.ts` (5 per-entry outputs, `splitting:false`, no chunk files), `vitest.config.ts` (browser+ssr projects, D-26), and a flat `eslint.config.js` carrying the RCT-03 CSS-import ban.
- Scaffolded folder-per-component placeholders so the 5-entry build is green from wave 1 (D-28); the wave-3 pilots replace them.

## Task Commits

Each task was committed atomically:

1. **Task 1: Package-legitimacy checkpoint** — no commit (blocking-human gate; human verified the six `[SUS]` too-new packages against npmjs.com and approved)
2. **Task 2: Install pinned toolchain + rewrite manifest** - `01209a5` (feat)
3. **Task 3: tsup/vitest/eslint configs + buildable placeholders** - `23032f9` (feat)

**Plan metadata:** committed with SUMMARY/STATE/ROADMAP/REQUIREMENTS (docs commit)

## Files Created/Modified
- `packages/react/package.json` - real manifest: exports map, sideEffects:false, peers, scripts, single runtime dep
- `packages/react/tsconfig.json` - extends base, adds `jsx: react-jsx`
- `packages/react/tsup.config.ts` - 5 object-form entries, esm+cjs, dts, splitting:false, `onSuccess` prepends the RSC directive
- `packages/react/vitest.config.ts` - two projects (browser chromium + ssr node)
- `packages/react/eslint.config.js` - flat config with typescript-eslint + react-hooks + jsx-a11y + RCT-03 CSS ban
- `packages/react/LICENSE` / `packages/react/README.md` - mirror @lyra-ds/styles
- `packages/react/src/index.ts` - barrel stub (finalized in 03-08)
- `packages/react/src/{button,input,dialog,icon}/index.ts` - placeholder entries keeping the build green
- `package.json` - root devDependency pins (exact)
- `pnpm-lock.yaml` - resolved lockfile
- `pnpm-workspace.yaml` - `onlyBuiltDependencies: []` (no install scripts run)

## Decisions Made
- **RSC `"use client"` via `onSuccess`, not `banner`:** empirically, tsup 8.5.1 routes esbuild output through Rollup, which strips leading `"use client"`/`"use strict"` directive prologues — from the `banner` option, from `esbuildOptions.banner`, from a `renderChunk` return, and from source-level directives alike (esbuild alone preserves them; tsup's post-pass removes them). A post-write prepend in `onSuccess` is the only mechanism that survives, and it now emits the directive deterministically on all 5 entries × esm+cjs. Trade-off: sourcemaps are off-by-one for the single prepended directive line (the standard, tolerated cost of this well-known workaround). Plan 03-08's dist grep + next-app RSC fixture remain the end-to-end verifiers.
- **`onlyBuiltDependencies: []`:** pnpm flagged esbuild's build script; since esbuild's platform binary ships via optionalDependencies and the dual-format build is verified green with scripts ignored, no dependency is permitted to run install scripts (belt-and-suspenders with `--frozen-lockfile`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] tsup `banner: { js: '"use client";' }` is a silent no-op — replaced with an `onSuccess` post-write directive prepend**
- **Found during:** Task 3 (tsup config authoring)
- **Issue:** The plan specified the RSC directive via tsup's `banner` option ("deterministic directive across all outputs"). Empirically, tsup 8.5.1 emits NO `"use client"` in any output: it routes esbuild output through Rollup, which strips leading directive prologues regardless of whether they come from `banner`, `esbuildOptions.banner`, a `renderChunk` return, or a source-level directive (isolated: esbuild alone preserves the banner with `bundle:true`; the loss is tsup-side). Left unfixed, plan 03-08's `'use client'` dist grep and the Next.js App Router RSC fixture would fail, and the published components would break under RSC (a real correctness defect).
- **Fix:** Removed the ineffective `banner` and added an `onSuccess` step (`ensureUseClientDirective`) that prepends `"use client";` to every emitted `.js`/`.cjs` chunk after tsup writes them (post-Rollup, so nothing strips it). Documented the mechanism and the one-line sourcemap trade-off in the config.
- **Files modified:** packages/react/tsup.config.ts
- **Verification:** `head -1` of all 5 entries × esm+cjs == `"use client";`; build exits 0; no chunk files.
- **Committed in:** `23032f9` (Task 3 commit)

**2. [Rule 3 - Blocking] `eslint-plugin-react-hooks` flat config path**
- **Found during:** Task 3 (ESLint config authoring / lint verify)
- **Issue:** `reactHooks.configs['recommended-latest']` exposes a legacy array-form `plugins` key, which ESLint 10 flat config rejects ("plugins must be an object"), making `run lint` exit 2.
- **Fix:** Used the flat-namespace config `reactHooks.configs.flat['recommended-latest']` (object-form `plugins`), confirmed by inspecting the installed plugin's exports.
- **Files modified:** packages/react/eslint.config.js
- **Verification:** `pnpm --filter @lyra-ds/react run lint` exits 0.
- **Committed in:** `23032f9` (Task 3 commit)

**3. [Rule 3 - Blocking] `pnpm-workspace.yaml` invalid build-approval placeholder**
- **Found during:** Task 2 (install)
- **Issue:** `pnpm add` injected `allowBuilds:\n  esbuild: set this to true or false` (an unresolved interactive placeholder) because esbuild carries a build script — an invalid value left in the workspace file.
- **Fix:** Replaced it with the documented `onlyBuiltDependencies: []` (approve no build scripts); verified `pnpm install` exits 0 with no ignored-builds warning and the react build stays green (esbuild binary resolves from optional deps).
- **Files modified:** pnpm-workspace.yaml
- **Verification:** `pnpm install` exit 0; `pnpm --filter @lyra-ds/react run build` exit 0.
- **Committed in:** `01209a5` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All three were necessary for correctness (RSC directive) or to complete the task (lint/install). No scope creep — the exports map, test projects, and CSS ban were delivered exactly as specified.

## Issues Encountered
- Diagnosing the `"use client"` loss required isolating esbuild (preserves the banner) from tsup+Rollup (strips it). Resolved by moving directive emission to `onSuccess`, which runs after all post-processing.

## User Setup Required
None - no external service configuration required. (The one manual step, the package-legitimacy verification, was completed as the approved Task 1 checkpoint.)

## Next Phase Readiness
- The package skeleton is ready for the wave-2 internals plan and the wave-3 pilots (Button/Input/Dialog/Icon) to replace the placeholder entries.
- Build/typecheck/lint are green from this plan onward, so every later plan bisects cleanly.
- Plan 03-08 must still add the machine gates (publint/attw/size-limit) and verify the `"use client"` directive end-to-end via the dist grep + Next.js App Router fixture.

## Self-Check: PASSED

All claimed artifacts exist on disk (package.json, tsup/vitest/eslint configs, src barrel, SUMMARY) and both task commits (`01209a5`, `23032f9`) are present in git history.

---
*Phase: 03-react-infrastructure-pilot-components*
*Completed: 2026-07-19*
