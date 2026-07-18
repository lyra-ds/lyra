---
phase: 02-styles-package
plan: 03
subsystem: infra
tags: [css, package-json, exports-map, sideEffects, tree-shaking, white-label, fonts, shadcn-compat, npm-packaging]

# Dependency graph
requires:
  - phase: 02-styles-package (plan 02-01)
    provides: the 7 token CSS files under tokens/ that styles.css @imports and the ./tokens/* subpath exposes
  - phase: 02-styles-package (plan 02-02)
    provides: the 7 component CSS files under components/ that styles.css @imports
provides:
  - Aggregate entry styles.css @importing all 7 tokens + 7 components in verbatim handoff order (compat excluded)
  - Opt-in compat-shadcn.css at package root mapping shadcn semantic vars onto Lyra tokens, never imported by the entry
  - Publishable package.json with sideEffects ["**/*.css"], a four-key exports map (., ./styles.css, ./tokens/*, ./compat-shadcn.css), files allowlist, publishConfig, and lint:css/test scripts
  - README.md with the 4-token white-label brand contract, a copy-pasteable [data-brand="acme"] block, and @fontsource peer-install with explicit per-weight imports
affects: [02-04 (stylelint config the lint:css script points at), 02-05 (vitest config the test script points at), 02-06 (publint + pnpm-pack + vite pack-smoke gate that proves this import surface), phase-03-react]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS-package import surface: single aggregate entry (. and ./styles.css both target styles.css) + a ./tokens/* wildcard subpath + an explicit opt-in ./compat-shadcn.css, with NO per-component subpaths (D-02)"
    - "Broken-CSS-package guard: sideEffects [\"**/*.css\"] (never false) so consumer bundlers never tree-shake the CSS import away (STY-07)"
    - "CSS files preserve handoff-verbatim formatting (aligned columns, double-quoted @imports) and are NOT prettier-formatted; JSON/Markdown ARE prettier-clean — consistent with 02-01/02-02"

key-files:
  created:
    - packages/styles/styles.css
    - packages/styles/compat-shadcn.css
    - packages/styles/README.md
  modified:
    - packages/styles/package.json

key-decisions:
  - "compat-shadcn.css relocated to the package ROOT (not ./compat/shadcn.css) for a cleaner ./compat-shadcn.css exports entry — resolves D-02 subpath-naming discretion"
  - "Both `.` and `./styles.css` export keys target ./styles.css so `import '@lyra-ds/styles'` and the literal `import '@lyra-ds/styles/styles.css'` both resolve (the latter required by PROJECT.md:19 + ROADMAP criterion #1)"
  - "CSS files intentionally kept in handoff-verbatim formatting (not prettier-formatted): matches the already-committed 02-01/02-02 CSS convention, preserves pixel-perfect fidelity, and prettier's single-quote rule would break the byte-identical @import requirement. stylelint (lint:css) is the CSS quality gate, prettier governs JSON/MD"
  - "version stays 0.0.0 (monorepo lockstep, pre-release); only the private flag is dropped to flip publishability"

patterns-established:
  - "exports-map non-overlap: the four keys are disjoint — ./tokens/* does not match ./styles.css or ./compat-shadcn.css, and no ./components/* key leaks (STY-02, D-02)"
  - "Fonts documented as peer install with explicit per-weight CSS imports (PJS 400-800, JBM 400-600) so a consumer can actually LOAD the fonts, not just install the package (no runtime CDN)"

requirements-completed: [STY-01, STY-02, STY-05, STY-07]

coverage:
  - id: D1
    description: "styles.css @imports exactly the 14 handoff files (7 tokens then 7 components) in byte-identical order, with no compat reference (STY-01, STY-05)"
    requirement: "STY-01"
    verification:
      - kind: other
        ref: "grep -c '^@import' styles.css == 14; diff of extracted @import list vs handoff/styles.css empty; grep compat styles.css empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "compat-shadcn.css exists at package root mapping shadcn vars (--background/--foreground/--primary/--destructive/--ring/--radius…) onto Lyra tokens via var(), never imported by styles.css (STY-05)"
    requirement: "STY-05"
    verification:
      - kind: other
        ref: "grep -- '--background: *var(--surface-page)' compat-shadcn.css passes; required-token greps pass; styles.css has no compat reference"
        status: pass
    human_judgment: false
  - id: D3
    description: "package.json is publishable (no private) with sideEffects deep-equal [\"**/*.css\"], a four-key exports map (both . and ./styles.css target ./styles.css; ./tokens/*; ./compat-shadcn.css; no /components/ key), and a files allowlist including compat-shadcn.css (STY-02, STY-05, STY-07)"
    requirement: "STY-07"
    verification:
      - kind: unit
        ref: "node assertion in task-2 <verify>: sideEffects value, no private, four exports keys present, ./styles.css target, no /components/ leak, files includes compat"
        status: pass
    human_judgment: false
  - id: D4
    description: "README documents the 4-token brand contract table, the [data-brand=\"acme\"] example, the two @fontsource package names, and the explicit per-weight CSS import lines (PJS 400-800, JBM 400-600) in English (D-03a)"
    requirement: "STY-02"
    verification:
      - kind: other
        ref: "grep data-brand=\"acme\", grep @fontsource, per-weight import greps (PJS 400/500/600/700/800, JBM 400/500/600), 4-token table greps — all pass"
        status: pass
    human_judgment: false
  - id: D5
    description: "Import-safety backstop — that consumer bundlers never drop the CSS and both the root entry and a token subpath actually resolve from the packed tarball — proven by the publint + pnpm-pack + vite pack-smoke gate"
    verification: []
    human_judgment: true
    rationale: "Definitive packaging-integrity evidence (publint-green, tarball file inspection, real vite consumer build) is authored and executed in plan 02-06, not here"

# Metrics
duration: 8min
completed: 2026-07-18
status: complete
---

# Phase 2 Plan 03: Styles-package import surface & manifest Summary

**Aggregate `styles.css` entry (14 handoff @imports, compat excluded) plus a publishable `package.json` with `sideEffects: ["**/*.css"]`, a four-key exports map, an opt-in `compat-shadcn.css` subpath, and a README white-label brand + @fontsource peer-install contract.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-18T18:44:00Z
- **Completed:** 2026-07-18T18:52:44Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 replaced)

## Accomplishments
- `styles.css` reproduces the handoff `@import` chain verbatim — 7 tokens then 7 components, byte-identical order, compat omitted (STY-01, STY-05).
- `compat-shadcn.css` relocated to the package root as an explicit opt-in subpath, mapping shadcn semantic vars onto Lyra tokens, never imported by the entry (STY-05).
- `package.json` flipped publishable with `sideEffects: ["**/*.css"]` (the broken-CSS-package guard), a disjoint four-key exports map (`.`, `./styles.css`, `./tokens/*`, `./compat-shadcn.css`; no per-component subpaths), a `files` allowlist, `publishConfig`, and `lint:css`/`test` scripts (STY-02, STY-05, STY-07).
- `README.md` documents the 4-token white-label brand contract, a copy-pasteable `[data-brand="acme"]` block, and the `@fontsource` peer install with explicit per-weight imports so consumers can actually load the fonts (D-03a).

## Task Commits

Each task was committed atomically:

1. **Task 1: Author entry styles.css and opt-in compat-shadcn.css subpath** - `c67c88a` (feat)
2. **Task 2: Author package.json manifest and README brand/fonts docs** - `e734572` (feat)

## Files Created/Modified
- `packages/styles/styles.css` - Aggregate entry: 14 `@import`s (7 tokens + 7 components) in handoff order, compat excluded.
- `packages/styles/compat-shadcn.css` - Opt-in shadcn→Lyra `var()` mapping under `:root, [data-theme="dark"]`; never imported by the entry.
- `packages/styles/package.json` - Publishable manifest: `sideEffects: ["**/*.css"]`, four-key exports map, files allowlist, publishConfig, lint:css/test scripts.
- `packages/styles/README.md` - Brand 4-token contract table, `[data-brand="acme"]` example, `@fontsource` peer-install with per-weight imports (EN).

## Decisions Made
- Placed `compat-shadcn.css` at the package root (over `./compat/shadcn.css`) for a cleaner `./compat-shadcn.css` exports entry — resolves D-02 naming discretion.
- Both `.` and `./styles.css` export keys target `./styles.css` so the bare import and the literal-subpath import both resolve (PROJECT.md:19 + ROADMAP criterion #1).
- Kept CSS files in handoff-verbatim formatting (NOT prettier-formatted): consistent with the already-committed 02-01/02-02 CSS files, preserves pixel-perfect fidelity, and prettier's single-quote rule would break the byte-identical `@import` requirement. stylelint (`lint:css`) is the CSS gate; prettier governs JSON/Markdown, both of which are prettier-clean.
- `version` stays `0.0.0` (monorepo lockstep, pre-release); only `private` is dropped to flip publishability.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Prettier `--check` flags the two new CSS files (single-quote/aligned-column normalization). This is a **pre-existing, established convention**, not a regression: all 13 CSS files committed by plans 02-01/02-02 are likewise intentionally unformatted to preserve handoff fidelity, and prettier's single-quote rule would violate this plan's byte-identical `@import` verification. CSS quality is gated by stylelint (`lint:css`, config lands in 02-04); JSON and Markdown were formatted to be prettier-clean.

## Known Stubs
The `lint:css` and `test` package scripts reference tooling/config that lands in later plans (stylelint config → 02-04, vitest config → 02-05). This is by design per the plan ("these strings may point at not-yet-created files at author time"). Definitive import-safety evidence (publint-green, tarball inspection, vite pack-smoke) is authored and run in 02-06.

## Next Phase Readiness
- The complete `@lyra-ds/styles` import surface (entry, token subpath, compat subpath, manifest, README) is in place.
- Ready for 02-04 (stylelint) and 02-05 (vitest browser tests) to wire up the referenced scripts, and 02-06 to prove the packaging integrity end-to-end.

---
*Phase: 02-styles-package*
*Completed: 2026-07-18*

## Self-Check: PASSED
- All 4 package files + SUMMARY.md verified present on disk.
- Both task commits (c67c88a, e734572) verified in git history.
