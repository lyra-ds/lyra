---
phase: 02-styles-package
fixed_at: 2026-07-18T00:00:00Z
review_path: .planning/phases/02-styles-package/02-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Source review:** `.planning/phases/02-styles-package/02-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 8 (4 warnings + 4 info)
- Fixed: 8
- Skipped: 0

All eight findings were applied and committed atomically. Every quality gate was
re-run and is green (see Verification below).

## Fixed Issues

### WR-01: no-runtime-CDN guard blind to `@import "https://…"` (string notation)

**Files:** `tools/parity/parity.mjs`, `tools/parity/fixtures/import-notation.css` (new)
**Commit:** `2f0d3f3`
**Change:** Added a comment-aware `@import` scheme guard (`extractImports` +
`importGuard`, sharing an `isExternalTarget` classifier with the url() guard) that
runs over every package CSS file and rejects any non-`data:` absolute/protocol-relative
`@import` target in **both** string and `url()` notation. Added an `importSelfCheck`
meta-test plus the `import-notation.css` fixture proving the string form, the `url()`
form, and the protocol-relative form are all caught, while relative + `data:` +
commented-out imports are not.
**Verification:** parity green; negative test (injecting `@import "https://…"` into
`fonts.css`) fails parity with exit 1, passes again after revert.

### WR-02: `isTealFamily()` passed vacuously for grayscale / transparent-black

**Files:** `packages/styles/tests/brand-theme.test.ts`
**Commit:** `76b6ff9`
**Change:** Added an alpha floor (`a < 0.02 → false`) and a near-black floor
(`max < 20 → false`) so an unresolved custom property (which computes to transparent
or black) now FAILS the soft/focus-ring assertions instead of passing vacuously. The
green-dominance test was kept loose (`g + 2 >= max`, equivalent to the original) rather
than tightened to `g > b + 8` — measured channel values show the legitimate white-mixed
teals are near-desaturated (light `accent-soft {231,242,240}`, dark `accent-active
{127,188,180}`, g exceeds b by only ~2), so a strict blue-separation margin would have
wrongly rejected real teals. Indigo (blue-dominant) still fails correctly.
**Verification:** all 9 existing tests pass; prettier clean.

### WR-03: chevron-mask allowlist accepted any `data:` SVG; only 1 of 3 masks decode-tested

**Files:** `tools/parity/parity.mjs`, `packages/styles/tests/brand-theme.test.ts`,
`packages/styles/tests/fixtures/brand-theme.html`
**Commit:** `ebf293e`
**Change:** Tightened the parity allowlist to pin the **exact** canonical `data:`
payload per file (down-chevron for forms + display, right-chevron for navigation) —
a truncated, malformed, or swapped SVG now fails parity instead of being waved through.
Added a `.lyra-breadcrumb__sep` (right-chevron) decode probe to the fixture and
parametrized the Browser Mode decode test over both distinct payloads, asserting each
decodes into a real image AND carries the expected path direction (catches a swap).
**Verification:** parity green; negative test (swapping navigation's path to the down
chevron) fails parity with exit 1; browser suite now 10 tests, all pass.

### WR-04: parity advertised "byte-for-byte" but is a declaration-level diff

**Files:** `tools/parity/parity.mjs`
**Commit:** `aa15cf7`
**Change:** A true byte backstop is infeasible **by design** — the package
intentionally rewrites the handoff's Portuguese header/section comments to English
MIT-tagged headers (verified: every token/component file differs only in comments), and
parity collapses whitespace + strips comments. Corrected the docstring from "FAITHFUL
copy" to state plainly that this is a whitespace- and comment-INSENSITIVE
declaration-level parity check, spelling out exactly what is and is not asserted, so no
maintainer reads it as license to reflow a token value's bytes.
**Verification:** parity green; prettier clean. (Documentation-accuracy fix — no
behavior change.)

### IN-01: `pack-smoke` leaked its temp dir on any failure

**Files:** `tools/pack-smoke/pack-smoke.mjs`
**Commit:** `a5edef2`
**Change:** `process.exit()` in `die()` skipped the `finally` cleanup, leaking
`lyra-pack-smoke-*` dirs on every failure. Promoted `tmp` to a module-scoped `let` and
made `die()` `rmSync` it before exiting.
**Verification:** node syntax check; forced-failure simulation confirms the temp dir is
removed before exit (no leftover dirs); full pack-smoke happy path still green.

### IN-02: parser lacked unquoted `url()` awareness (inconsistent with `extractUrls`)

**Files:** `tools/parity/parity.mjs`, `tools/parity/fixtures/unquoted-url.css` (new)
**Commit:** `10c0f8f`
**Change:** Added a `url()` branch to the `parse()` tokenizer that consumes `url()`
(quoted or unquoted) as an opaque token, mirroring `extractUrls`, so an unquoted
`url()` with an interior `;`/`{`/`}`/`:` no longer mis-segments the declaration. Added
the `unquoted-url.css` self-check fixture to the tokenizer self-check.
**Verification:** parity green (the new self-check asserts the exact single expected
declaration — it would produce multiple decls if the branch were broken); prettier clean.

### IN-03: published LICENSE depended on pnpm's root-copy behavior

**Files:** `packages/styles/LICENSE` (new), `packages/styles/package.json`,
`tools/pack-smoke/pack-smoke.mjs`
**Commit:** `e508af8`
**Change:** Committed `packages/styles/LICENSE` (byte-identical to the workspace-root
MIT LICENSE), added `LICENSE` to the `files` allowlist, and added `package/LICENSE` to
the pack-smoke `REQUIRED` list — so an MIT package can never ship without its license
text regardless of packer (npm would not copy the root LICENSE the way pnpm does).
**Verification:** `diff LICENSE packages/styles/LICENSE` identical; full pack-smoke
green (LICENSE now asserted present in the tarball); publint All good.

### IN-04: `styles.css` `@import` order unverified by any gate

**Files:** `tools/parity/parity.mjs`
**Commit:** `68cb100`
**Change:** Added `stylesEntryOrderCheck()` asserting `styles.css` imports the seven
token layers before the seven component layers in the documented cascade order, added as
guarantee (E) in the docstring.
**Verification:** parity green; negative test (reordering two token imports) fails parity
with exit 1, passes again after revert.

## Verification (all gates green)

| # | Gate | Result |
|---|------|--------|
| 1 | `pnpm run parity` (incl. self-check fixtures) | `parity OK: 209 tokens, 248 classes, placement + at-rule ancestry + no-CDN (url() + @import) verified` |
| 2 | `pnpm --filter @lyra-ds/styles run lint:css` | exit 0 |
| 3 | `pnpm exec prettier --check .` | All matched files use Prettier code style |
| 4 | `pnpm --filter @lyra-ds/styles run test` | Test Files 1 passed; Tests 10 passed |
| 5 | `pnpm exec publint packages/styles` | All good! |
| 6 | `node tools/pack-smoke/pack-smoke.mjs` | pack-smoke OK (exit 0) |

---

_Fixed: 2026-07-18_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
