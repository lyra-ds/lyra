---
phase: 03-react-infrastructure-pilot-components
plan: 03
subsystem: infra
tags: [icon-registry, lucide-react, code-generation, ci-gate, tree-shaking, react]

# Dependency graph
requires:
  - phase: 03-react-infrastructure-pilot-components (plan 03-01)
    provides: packages/react package skeleton, lucide-react 1.25.0 install, src/icon/ entry
provides:
  - Zero-dep four-pass icon-inventory generator (tools/icon-registry/generate.mjs)
  - Committed, drift-guarded packages/react/src/icon/icon-registry.ts (70 icons + IconName union)
  - Self-test fixture regression-testing the extraction rules
  - --check CI drift gate + lucide-export validation (consumed by plan 03-08)
affects: [03-05 Icon pilot (70-icon render matrix), 03-08 CI wiring + dist no-CDN scan]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generated+committed+CI-drift-guarded source (tools/parity skeleton reused for a TS emitter)"
    - "MASK_DIVERGENCE-style named allowlist (SOURCE_MANIFEST + ALLOWED_PASSTHROUGH) for dynamic-use auditing"
    - "createLucideIcon vendoring for icons removed from lucide 1.x (github)"

key-files:
  created:
    - tools/icon-registry/generate.mjs
    - tools/icon-registry/fixtures/self-test.jsx
    - packages/react/src/icon/icon-registry.ts
  modified:
    - .prettierignore

key-decisions:
  - "Prettier-ignore the generated registry + fixtures: --check owns their byte-exact format; prettier --write would strip identifier-safe key quotes and break the drift guard (and the plan's own quoted-key verify)"
  - "Fixture Pass-C sources are const declarations only (no Icon render sites) so exactly one deliberate unresolvable Icon use remains for the Pass-D assertion"
  - "Scan preserves comments (no stripping) so .d.ts JSDoc examples contribute circle + file-plus (Option B) — fixture comments must therefore avoid literal <Icon name={...}> text"

patterns-established:
  - "Pattern: four-pass dynamic-aware source scan (literal / ternary-branch / manifest-indirection / unresolved-dynamic hard-fail) reproducing an approved canonical inventory with named add/missing deltas"
  - "Pattern: shared runPasses(files, manifest, passthrough) so real scan and self-test exercise identical extraction code"

requirements-completed: [RCT-05]

coverage:
  - id: D1
    description: "Zero-dep four-pass generator derives the exact 70-name handoff icon inventory (literal + dynamic), manifest-guarded, with Pass-D hard-fail on unaccounted dynamic Icon uses"
    requirement: RCT-05
    verification:
      - kind: unit
        ref: "node tools/icon-registry/generate.mjs --self-test (exit 0)"
        status: pass
      - kind: other
        ref: "node tools/icon-registry/generate.mjs (derives 70, EXPECTED_ICONS boundary + canonical-delta assertion pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Committed icon-registry.ts: 69 static lucide-react imports + vendored Github + IconName union, sorted/deduped, no 'lucide-static' string; drift guard red on modification, green on match"
    requirement: RCT-05
    verification:
      - kind: unit
        ref: "node tools/icon-registry/generate.mjs --check (exit 0; validates 69 imports against installed lucide-react 1.25.0)"
        status: pass
      - kind: other
        ref: "negative drift proof: appended char → --check exit 1, never rewrote; missing file → --check exit 1, never created"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-07-19
status: complete
---

# Phase 3 Plan 03: Curated Icon Registry Pipeline Summary

**Zero-dep four-pass generator that derives the complete 70-icon handoff inventory (literal + dynamic uses) and emits a committed, CI-drift-guarded icon-registry.ts — 69 static lucide-react imports plus a vendored `github` via createLucideIcon.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-19T14:50:00Z
- **Completed:** 2026-07-19T15:05:00Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `tools/icon-registry/generate.mjs`: zero-dependency Node ESM generator built on the `tools/parity` skeleton, running a FOUR-pass dynamic-aware scan of `handoff/components/**` + `handoff/ui_kits/**` (.jsx/.html/.tsx/.ts) that reproduces the planning-approved canonical 70-name inventory with named add/missing deltas.
- Four passes: (A) literal `<Icon name="…">` props scoped to Icon elements (no comment stripping, so `.d.ts` JSDoc examples contribute `circle` + `file-plus`); (B) ternary branch literals inside Icon `name={…}` (sun/moon, minus/check, circle-alert — `===` decoys excluded); (C) `SOURCE_MANIFEST` indirection (names[] array, `uploadIconFor`/`fmIconFor` resolvers, `icon:` nav-data); (D) unresolved-dynamic detector that hard-fails with file:line on any unaccounted Icon `name={expr}`.
- `--check` drift gate: byte-diffs a fresh in-memory generation against the committed file (exit 1 on drift/missing, never writes) and validates all 69 generated imports against the installed lucide-react 1.25.0 exports.
- `--self-test` mode + committed fixture regression-test the extraction rules (literal, ternary-with-decoy, array, resolver, data-prop, unresolvable-dynamic, and an ignored non-Icon `<Avatar name={…}>` site).
- Committed `packages/react/src/icon/icon-registry.ts`: 69 sorted PascalCase lucide-react named imports + vendored `Github` (createLucideIcon, brand icons removed in lucide 1.0) + `IconName` literal union (D-04); zero occurrences of the string `lucide-static` (03-08 dist-scan protection).

## Task Commits

Each task was committed atomically:

1. **Task 1: Registry generator (four-pass scan, self-test, --check)** - `c12414b` (feat)
2. **Task 2: Generate + commit icon-registry.ts (70 icons, drift-guarded)** - `0ec3e08` (feat)

## Files Created/Modified
- `tools/icon-registry/generate.mjs` - zero-dep four-pass generator, `--check` drift/import-validation gate, `--self-test` mode
- `tools/icon-registry/fixtures/self-test.jsx` - committed extraction-rule regression fixture
- `packages/react/src/icon/icon-registry.ts` - GENERATED + COMMITTED registry (70 icons, IconName union)
- `.prettierignore` - excludes the generated registry + the extraction fixtures from prettier (format owned by `--check`)

## Decisions Made
- **Prettier-ignore the generated registry and fixtures.** The repo `lint` gate is `prettier --check .`; prettier would strip quotes from identifier-safe object keys (`archive:` vs `'arrow-left':`), which both fails CI lint AND breaks the plan's own Task-2 verify regex (which requires quoted keys), while `prettier --write` would permanently break the `--check` drift guard. Mirrors the existing `tools/parity/fixtures/` prettier-ignore precedent. (See deviation below.)
- **Fixture Pass-C sources are declaration-only.** The array/resolver/data-prop manifest sources are plain `const` declarations with no accompanying `<Icon name={…}>` render sites, so the fixture keeps exactly ONE deliberate unresolvable Icon use for the Pass-D assertion.
- **Comment-preserving scan implies comment-hygiene in the fixture.** Because Pass A intentionally does not strip comments (to pick up `.d.ts` JSDoc examples), the fixture's own header comment must not contain literal `<Icon name={…}>` text — reworded to prose to avoid a spurious extra Pass-D match.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prettier-ignore the generated registry + extraction fixtures**
- **Found during:** Task 2 (generate + commit icon-registry.ts)
- **Issue:** The generated `icon-registry.ts` is not prettier-clean and was not in `.prettierignore`. The repo `lint` script (`prettier --check .`) is a CI gate, so it would fail on the file. Worse, prettier's formatting (a) strips quotes from identifier-safe keys, which breaks the plan's own Task-2 verify regex `/^\s*'([a-z0-9-]+)':/gm` (expects ALL keys quoted → would count fewer than 70), and (b) a `prettier --write` would rewrite the file and permanently break the `--check` byte-diff drift guard.
- **Fix:** Added `packages/react/src/icon/icon-registry.ts` and `tools/icon-registry/fixtures/` to `.prettierignore`, following the existing `tools/parity/fixtures/` precedent ("intentional formatting preserved for the self-check"). Formatted the generator source itself (`generate.mjs`) to stay prettier-clean.
- **Files modified:** `.prettierignore`, `tools/icon-registry/generate.mjs` (formatting only)
- **Verification:** `prettier --check` reports the registry + fixtures as clean (ignored); `prettier --check tools/icon-registry/generate.mjs` clean; `--check` still exits 0 and Task-2 verify (70 quoted keys) passes.
- **Committed in:** `c12414b` (`.prettierignore` + generator) — the generated file landed clean in `0ec3e08`.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The prettier-ignore is required for the generated file to survive the CI lint gate and to keep the `--check` drift guard stable; it directly enables the plan's own quoted-key verify contract. No scope creep.

## Issues Encountered
- Initial self-test reported 2 Pass-D errors instead of 1: the fixture's header comment literally contained `<Icon name={someUnknownFn(x)}>`, which the (intentionally comment-preserving) scan matched. Resolved by rewording the comment to prose. This confirms the comment-preserving design works as intended.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The curated 70-icon registry + `IconName` union are ready for the Icon pilot (plan 03-05, 70-icon render matrix) and the Icon size-limit calibration text (plan 03-08).
- `--check` and `--self-test` are ready to be wired as CI steps by plan 03-08 (same contract as `pnpm run parity`). Suggested root script: `"icon-registry": "node tools/icon-registry/generate.mjs"` (mirrors the existing `parity` script) — not added in this plan since 03-08 owns CI wiring.
- No blockers.

## Self-Check: PASSED

All created/modified files present on disk (generate.mjs, self-test.jsx, icon-registry.ts, .prettierignore, this SUMMARY). Both task commits (`c12414b`, `0ec3e08`) present in git history.

---
*Phase: 03-react-infrastructure-pilot-components*
*Completed: 2026-07-19*
