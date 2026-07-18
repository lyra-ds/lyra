---
phase: 02-styles-package
plan: 05
subsystem: testing
tags: [vitest, browser-mode, playwright, chromium, color-mix, css, white-label, theming]

# Dependency graph
requires:
  - phase: 02-01
    provides: tokens/brand.css color-mix derivation + tokens/colors.css dark overrides
  - phase: 02-02
    provides: component CSS (display.css .lyra-acc__chevron direct-mask, navigation.css)
  - phase: 02-03
    provides: styles.css aggregate entry + package `test` script (vitest run)
  - phase: 02-04
    provides: blocking-checkpoint human approval of vitest/playwright devDependency legitimacy
provides:
  - Minimal Vitest 4 Browser Mode (chromium) harness for @lyra-ds/styles
  - brand-theme fixture + test validating STY-03 (dark theming) and STY-04 (white-label color-mix)
  - Chevron data: mask DECODE probe pattern (new Image() + decode())
  - Canvas-based universal color parser (handles chromium oklab() serialization)
affects: [02-06, phase-03-react]

# Tech tracking
tech-stack:
  added:
    - "vitest@4.1.10"
    - "@vitest/browser-playwright@4.1.10"
    - "playwright@1.61.1"
  patterns:
    - "Browser Mode is the only valid vehicle for CSS-first validation (jsdom renders no CSS/color-mix)"
    - "Read RESOLVED longhands off dedicated probe elements, never getPropertyValue on the raw custom property"
    - "1x1 canvas getImageData as universal sRGB converter for oklab()/color-mix serialization"
    - "Ordered luminance + hue-family assertions prove derivation direction, not mere presence"
    - "data: mask decode proof via new Image()+await decode()+positive intrinsic dimensions"

key-files:
  created:
    - packages/styles/vitest.config.ts
    - packages/styles/tests/brand-theme.test.ts
    - packages/styles/tests/fixtures/brand-theme.html
  modified:
    - package.json
    - pnpm-lock.yaml
    - .gitignore

key-decisions:
  - "Fixture loading mechanism = option (b): test imports ../styles.css (Vite injects the @import graph) + injects the fixture DOM raw; no browser.testerHtmlPath"
  - "Colors read via 1x1 canvas because chromium serializes color-mix() as oklab(), which no rgb() regex parses"
  - "Assertions verify ordered luminance direction (light darkens, dark lightens) + teal-family hue, giving a mutation-proof derivation check (removing brand.css fails 3 tests)"
  - "Chevron decode targets the DIRECT-mask .lyra-acc__chevron; computed url() is CSS-unescaped before re-encoding for Image.decode()"
  - "Vitest __screenshots__/.vitest-attachments gitignored (generated failure artifacts, never committed or published)"

patterns-established:
  - "Probe-per-derived-var: each token bound to a real longhand so color-mix() resolves to channels"
  - "setPermutation(theme, brand) toggles data-theme/data-brand on the fixture root across 4 permutations"

requirements-completed: [STY-03, STY-04]

coverage:
  - id: D1
    description: "STY-03 — data-theme=dark switches semantic accent token with no rebuild (indigo-600 -> indigo-500), read off a resolved longhand"
    requirement: "STY-03"
    verification:
      - kind: e2e
        ref: "packages/styles/tests/brand-theme.test.ts#STY-03 — dark theming (no rebuild, read resolved longhands)"
        status: pass
    human_judgment: false
  - id: D2
    description: "STY-04 — acme white-label brand color-mix accent group resolves in light (ordered darker) and dark (ordered lighter), teal-family"
    requirement: "STY-04"
    verification:
      - kind: e2e
        ref: "packages/styles/tests/brand-theme.test.ts#STY-04 — acme brand color-mix accent group"
        status: pass
    human_judgment: false
  - id: D3
    description: "Chevron direct-mask data: URI actually decodes (new Image()+decode(), positive intrinsic dimensions)"
    verification:
      - kind: e2e
        ref: "packages/styles/tests/brand-theme.test.ts#chevron mask data: URI decodes (direct-mask element)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Long-text backstop: overlong label truncates inside its fixed-width box without expanding the container (broader overflow deferred to Phase 3)"
    verification:
      - kind: e2e
        ref: "packages/styles/tests/brand-theme.test.ts#long-text robustness backstop"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-07-18
status: complete
---

# Phase 2 Plan 05: Vitest Browser Mode Harness Summary

**Minimal Vitest 4 + chromium Browser Mode harness validating STY-03 dark theming and STY-04 white-label color-mix derivation across 4 theme x brand permutations, reading resolved longhands off probe elements (jsdom renders no CSS/color-mix).**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-07-18T17:49:03-03:00
- **Completed:** 2026-07-18T17:55:47-03:00
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Stood up `packages/styles/vitest.config.ts` — Browser Mode via the `playwright()` provider, chromium, headless. Fixture mechanism made explicit (option b: `import "../styles.css"` injects the entry `@import` graph; the test injects the fixture DOM). The package `test` script (`vitest run`) auto-resolves it.
- Installed the three approved devDependencies at exact pins (`vitest@4.1.10`, `@vitest/browser-playwright@4.1.10`, `playwright@1.61.1`) and chromium via `pnpm exec playwright install chromium`.
- Authored `brand-theme.html` fixture + `brand-theme.test.ts` (9 tests, all green): STY-03 dark switch, STY-04 acme color-mix (ordered darkening in light / lightening in dark + teal-family), chevron `data:` mask DECODE, and a long-text truncation backstop.
- Mutation-verified the derivation assertions: neutralizing `[data-brand]` in `brand.css` fails 3 tests, proving the suite asserts resolved derivation rather than mere presence.

## Task Commits

1. **Task 1: Stand up the Browser Mode harness** — `f06317e` (feat)
2. **Task 2: Author the acme brand + theme fixture test** — `b131e1d` (test)
3. **Formatting follow-up (prettier gate)** — `309e38b` (style)

**Plan metadata:** committed with STATE.md/ROADMAP.md/REQUIREMENTS.md update.

## Files Created/Modified

- `packages/styles/vitest.config.ts` — Browser Mode (chromium/playwright) config; documents the explicit fixture-loading mechanism and the CI `playwright install` prerequisite.
- `packages/styles/tests/fixtures/brand-theme.html` — per-derived-var probe DOM (each token bound to a real longhand), direct-mask `.lyra-acc__chevron` probe, long-text truncation box; supplies the acme `--brand: #0D9488` seed.
- `packages/styles/tests/brand-theme.test.ts` — 9 tests across 4 permutations; canvas-based color parsing; ordered luminance + teal-family assertions; mask decode via `new Image()`.
- `package.json` / `pnpm-lock.yaml` — three pinned test devDependencies.
- `.gitignore` — ignore Vitest `__screenshots__` / `.vitest-attachments` generated artifacts.

## Decisions Made

- **Canvas color parsing (not rgb regex):** chromium serializes `color-mix(in oklab, ...)` computed values as `oklab(...)`. A 1x1 canvas `getImageData` is the universal sRGB converter, so a single parser handles rgb/rgba/oklab uniformly.
- **Ordered direction + hue-family, not "teal not indigo":** light asserts hover/active progressively darker than accent; dark asserts accent/hover/active/soft-text progressively lighter than raw acme, each teal-family — proving the specific brand.css mix formulas.
- **Direct-mask element for decode:** targeted `.lyra-acc__chevron` (mask on the element), CSS-unescaped the computed `url()` (chromium escapes inner `"` as `\"`), then re-encoded for `Image.decode()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prettier-format the new TS/HTML harness files**
- **Found during:** Task 2 (post-authoring lint check)
- **Issue:** The hand-authored `vitest.config.ts`, `brand-theme.test.ts`, and `brand-theme.html` did not match repo prettier style; the root `prettier --check .` lint gate (CI) would fail. Test TS/HTML are prettier-gated (only CSS stays handoff-verbatim per project conventions).
- **Fix:** Ran `prettier --write` on the three files; re-ran the suite (still 9/9 green).
- **Files modified:** packages/styles/vitest.config.ts, packages/styles/tests/brand-theme.test.ts, packages/styles/tests/fixtures/brand-theme.html
- **Verification:** `prettier --check` now reports "All matched files use Prettier code style!"; tests remain green.
- **Committed in:** `309e38b` (style commit — formatting spans both task commits)

**2. [Rule 3 - Blocking] Gitignore generated Vitest artifacts**
- **Found during:** Task 2 (post-run status check)
- **Issue:** Failure runs during test development generated `tests/__screenshots__/` and `.vitest-attachments/` PNGs — generated runtime output that must not be committed.
- **Fix:** Added `**/__screenshots__/` and `**/.vitest-attachments/` to `.gitignore` and removed the artifacts.
- **Files modified:** .gitignore
- **Verification:** `git status` clean of artifacts; `npm pack --dry-run` confirms no test/fixture/artifact files enter the published package.
- **Committed in:** `b131e1d` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking/hygiene).
**Impact on plan:** Both keep the repo lint-green and publish-clean. No scope creep; no change to test semantics.

## Issues Encountered

- **oklab serialization:** first test run threw `Unparseable color: "oklab(...)"` — resolved by switching to canvas-based parsing (universal sRGB conversion).
- **Chevron decode failure:** `Image.decode()` initially threw `EncodingError`. Root cause: `getComputedStyle().maskImage` wraps the url in `"..."` and CSS-escapes the SVG's inner `"` as `\"`, producing malformed XML on extraction. Fixed by unescaping (`\\(.) -> $1`) then re-encoding via `encodeURIComponent` before setting `Image.src`.

## Prohibitions honored

- No jsdom validation of brand/theme (Browser Mode only).
- No test/fixture/config file enters the package `files` allowlist (verified via `npm pack --dry-run`); tests are dev-only.

## User Setup Required

None — no external service configuration required. (Local/CI note: `pnpm exec playwright install chromium --with-deps` must precede the test step; CI wiring lands in plan 02-06.)

## Next Phase Readiness

- STY-03 and STY-04 are now runtime-proven; plan 02-06 wires `playwright install` + the test step into CI.
- The harness (config + probe/canvas/decode patterns) is the foundation Phase 3 extends for React component testing.

## Self-Check: PASSED

- Files verified on disk: `vitest.config.ts`, `tests/brand-theme.test.ts`, `tests/fixtures/brand-theme.html` — all FOUND.
- Commits verified: `f06317e`, `b131e1d`, `309e38b` — all FOUND.
- Test suite: 9/9 passing in chromium; mutation check confirms derivation is actually asserted.

---
*Phase: 02-styles-package*
*Completed: 2026-07-18*
