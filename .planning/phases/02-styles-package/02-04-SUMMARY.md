---
phase: 02-styles-package
plan: 04
subsystem: testing
tags: [css, parity, stylelint, tokenizer, node, validation, no-cdn]

# Dependency graph
requires:
  - phase: 02-01
    provides: token CSS copies (tokens/*.css) + package.json + styles.css entry
  - phase: 02-02
    provides: component CSS copies (components/**/*.css) with unpkg→data: mask rewrites
provides:
  - "STY-06 parity validator (tools/parity/parity.mjs): zero-dep Node tokenizer/state-machine that proves 209 tokens + 248 .lyra-* classes match canonical handoff/ with a placement- + cascade-aware declaration diff and a package-wide external-URL guard"
  - "Parser fixtures (tools/parity/fixtures/) proving the tokenizer segments nested @media/@container, @keyframes, and quoted data: URIs with interior semicolons"
  - "stylelint gate (packages/styles/.stylelintrc.json) — the styles package's automated CSS quality gate"
  - "root package.json: parity script + stylelint@17.14.0 + stylelint-config-standard@40.0.0 devDeps"
affects: [02-05, 02-06, ci, styles-package]

# Tech tracking
tech-stack:
  added: [stylelint@17.14.0, stylelint-config-standard@40.0.0]
  patterns:
    - "Zero-dependency Node tokenizer/brace-depth state machine for CSS parity (no split(';')/flat regex)"
    - "Placement- + cascade-aware declaration diff keyed by file + at-rule-ancestry + selector + property + order"
    - "Intentional-divergence allowlist scoped to the exact known deltas (unpkg→data: chevron masks)"
    - "Broadened external-URL guard: data:/relative pass; absolute schemes + protocol-relative fail"

key-files:
  created:
    - tools/parity/parity.mjs
    - tools/parity/fixtures/nested-media.css
    - tools/parity/fixtures/nested-container.css
    - tools/parity/fixtures/keyframes.css
    - tools/parity/fixtures/data-uri.css
    - packages/styles/.stylelintrc.json
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "selector-class-pattern enforces the .lyra-* namespace (^lyra-[a-z0-9_-]+$) rather than policing BEM substructure — the DS contract is the namespace; __element/--modifier shapes are locked handoff and vary"
  - "Reformatting rules that would rewrite final handoff token values (color-hex-length, color-function-notation, alpha-value-notation, etc.) are disabled — CLAUDE.md fidelity constraint forbids reformatting locked values"
  - "fonts.css excluded from the placement diff entirely (0 tokens) — this naturally satisfies the fonts @import intentional-divergence allowlist entry"
  - "Parity keys declarations by full block-path sequence and compares in order, so rule reordering among equal-specificity rules is caught (not just multiset membership)"

patterns-established:
  - "CSS parity via a real tokenizer with opaque string handling for data: URIs and comment stripping"
  - "Fixture-backed self-check runs before the main parity checks to prove the parser handles the hard constructs"
  - "New quality gates wire as pnpm scripts (root parity, package lint:css) for CI consumption in 02-06"

requirements-completed: [STY-06]

coverage:
  - id: D1
    description: "STY-06 parity validator: proves 209 tokens + 248 .lyra-* classes match canonical handoff/ with a placement/cascade-aware declaration diff; exits 0 on the faithful copy and non-zero with a naming message on drift"
    requirement: STY-06
    verification:
      - kind: automated
        ref: "node tools/parity/parity.mjs (exit 0: 'parity OK: 209 tokens, 248 classes, placement + at-rule ancestry + no-CDN verified')"
        status: pass
      - kind: automated
        ref: "scratchpad/drift.mjs — 6 injected-drift cases (token value, dark→:root, @media ancestry, rule reorder, https:// url, //cdn url, class rename) each force non-zero exit + naming message; baseline restored green"
        status: pass
    human_judgment: false
  - id: D2
    description: "Parser is a tokenizer/state machine (not split(';')/flat regex): fixtures (nested @media, nested @container, @keyframes, quoted data: URI with interior ;) each segment into the expected declaration set"
    requirement: STY-06
    verification:
      - kind: unit
        ref: "tools/parity/parity.mjs fixtureSelfCheck() over tools/parity/fixtures/*.css (runs as part of node tools/parity/parity.mjs)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Broadened external-URL guard rejects absolute schemes + protocol-relative url() in packages/styles CSS while passing the local data: SVG masks (with their interior xmlns http literal)"
    requirement: STY-06
    verification:
      - kind: automated
        ref: "scratchpad/drift.mjs — injected url('https://…') and url('//cdn…') both fail; baseline (data: masks only) passes"
        status: pass
    human_judgment: false
  - id: D4
    description: "stylelint gate: packages/styles/.stylelintrc.json extends stylelint-config-standard and lints packages/styles/**/*.css clean; stylelint@17.14.0 + stylelint-config-standard@40.0.0 pinned exact in root devDeps"
    requirement: STY-06
    verification:
      - kind: automated
        ref: "pnpm --filter @lyra-ds/styles exec stylelint '**/*.css' (exit 0); pnpm --filter @lyra-ds/styles run lint:css (exit 0)"
        status: pass
    human_judgment: false

# Metrics
duration: ~35min
completed: 2026-07-18
status: complete
---

# Phase 2 Plan 04: Parity Validator + Stylelint Gate Summary

**STY-06 zero-dep Node tokenizer that proves 209 tokens + 248 `.lyra-*` classes match canonical `handoff/` via a placement/cascade-aware declaration diff and a no-CDN `url()` guard, plus a stylelint config tuned for the locked handoff CSS.**

## Performance

- **Duration:** ~35 min (continuation after the Task 1 package-legitimacy checkpoint was human-approved)
- **Completed:** 2026-07-18
- **Tasks:** 3 (Task 1 checkpoint approved; Tasks 2 + 3 executed)
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments
- STY-06 parity validator (`tools/parity/parity.mjs`) — a real CSS tokenizer/brace-depth state machine (no `split(';')`/flat regex) that treats quoted `data:` URIs as opaque, strips comments, and tracks the ordered stack of enclosing at-rule/selector blocks.
- Four parity checks: (A) 209-token count + identical values across the six canonical token files (fonts/compat excluded); (B) placement- + cascade-aware declaration diff keyed by file + at-rule-ancestry + selector + property + order; (C) 248 unique `.lyra-*` class inventory; (D) package-wide external-URL guard.
- Intentional-divergence allowlist scoped exactly to the `unpkg.com`→`data:` chevron mask rewrites, so the faithful copy passes but any unlisted drift/relocation fails with a naming message pointing at `handoff/` as canonical.
- Verified failure detection for all drift classes: token value change, `[data-theme="dark"]`→`:root` relocation, `@media` ancestry change, equal-rule reorder, injected `https://`/`//cdn` url(), and class rename.
- Stylelint gate (`packages/styles/.stylelintrc.json`) extending `stylelint-config-standard@40.0.0`, tuned so the locked handoff CSS lints clean without reformatting final token values.

## Task Commits

1. **Task 1: Package legitimacy checkpoint** — human-approved (no commit; cleared stylelint, stylelint-config-standard, vitest, @vitest/browser-playwright, playwright, publint, vite pins). This plan installed only the two it requires (stylelint + config); items 3-7 remain for plans 02-05/02-06.
2. **Task 2: Token + class parity script (STY-06)** — `57a3d84` (feat)
3. **Task 3: Stylelint config for the styles package** — `6757ec2` (feat)

**Plan metadata:** docs commit (this SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified
- `tools/parity/parity.mjs` — STY-06 parity validator (tokenizer, placement/cascade diff, class inventory, external-URL guard, fixture self-check)
- `tools/parity/fixtures/nested-media.css` — nested `@media` parser fixture
- `tools/parity/fixtures/nested-container.css` — nested `@container` parser fixture
- `tools/parity/fixtures/keyframes.css` — `@keyframes` (nested from/to) parser fixture
- `tools/parity/fixtures/data-uri.css` — quoted `data:` URI with interior `;` parser fixture
- `packages/styles/.stylelintrc.json` — stylelint config extending `stylelint-config-standard`
- `package.json` — `parity` script + `stylelint@17.14.0` + `stylelint-config-standard@40.0.0` devDeps (save-exact)
- `pnpm-lock.yaml` — lockfile updated for the two devDeps

## Decisions Made
- `selector-class-pattern` enforces the `.lyra-*` namespace (`^lyra-[a-z0-9_-]+$`) rather than a strict BEM regex — the classes legitimately use `__element` and `--modifier`, and the DS contract is the namespace prefix, not the internal BEM shape. Verified no uppercase class names exist.
- Disabled stylelint reformatting rules (`color-hex-length`, `color-function-notation`, `color-function-alias-notation`, `alpha-value-notation`, `value-keyword-case`, `property-no-vendor-prefix`, empty-line-before rules, `declaration-block-single-line-max-declarations`, `no-descending-specificity`, `selector-not-notation`) because they would rewrite the locked handoff token values/formatting — forbidden by CLAUDE.md fidelity constraint. Set `import-notation: string` and `media-feature-range-notation: prefix` to match the handoff's authored form.
- `fonts.css` is excluded from the placement diff entirely (0 tokens), which naturally satisfies the fonts `@import` allowlist entry without a special case in the diff loop.

## Deviations from Plan

None - plan executed exactly as written. (The one interpretive choice — namespace-only class pattern vs. strict BEM regex — is within the plan's "tuned so the handoff's modern CSS lints clean; do NOT introduce rules that would flag the locked token values" guidance, not a deviation.)

## Issues Encountered
- Initial `**/*.css` string inside the parity.mjs header doc-comment contained `*/`, prematurely closing the block comment (SyntaxError). Reworded the comment line. Resolved before first successful run.
- First `selector-class-pattern` regex was too strict (rejected `__element`/`--modifier` BEM classes, 214 false errors). Replaced with the namespace pattern `^lyra-[a-z0-9_-]+$`.

## User Setup Required
None - no external service configuration required. (The Task 1 legitimacy checkpoint was the only human gate and is cleared.)

## Next Phase Readiness
- `pnpm run parity` and `pnpm --filter @lyra-ds/styles run lint:css` are both green and ready to wire into the CI `test` and `lint` jobs in plan 02-06.
- Plan 02-05 (vitest/browser) and 02-06 (publint/vite pack-smoke) already have their devDependency pins legitimacy-approved from Task 1, so they stay autonomous. Those packages are NOT yet installed (this plan installed only stylelint + stylelint-config-standard, as its tasks required).

## Self-Check: PASSED

All created files verified present on disk (parity.mjs, 4 fixtures, .stylelintrc.json); both task commits (57a3d84, 6757ec2) verified in git log.

---
*Phase: 02-styles-package*
*Completed: 2026-07-18*
