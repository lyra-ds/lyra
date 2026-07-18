---
phase: 02-styles-package
reviewed: 2026-07-18T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - tools/parity/parity.mjs
  - tools/parity/fixtures/data-uri.css
  - tools/parity/fixtures/keyframes.css
  - tools/parity/fixtures/nested-container.css
  - tools/parity/fixtures/nested-media.css
  - tools/pack-smoke/pack-smoke.mjs
  - tools/pack-smoke/fixture/entry.css
  - tools/pack-smoke/fixture/main.js
  - tools/pack-smoke/fixture/package.json
  - tools/pack-smoke/fixture/vite.config.mjs
  - packages/styles/tests/brand-theme.test.ts
  - packages/styles/tests/fixtures/brand-theme.html
  - packages/styles/vitest.config.ts
  - packages/styles/package.json
  - packages/styles/.stylelintrc.json
  - packages/styles/styles.css
  - packages/styles/compat-shadcn.css
  - packages/styles/README.md
  - package.json
  - .github/workflows/ci.yml
  - .prettierignore
  - .gitignore
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-07-18
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed the STY phase substrate: the zero-dependency parity validator (`parity.mjs`),
the packed-artifact smoke test (`pack-smoke.mjs`), the Browser Mode brand/theme test,
the `@lyra-ds/styles` manifest + entry `@import` chain + shadcn compat layer, and CI
wiring. The 13 handoff-verbatim token/component CSS files are out of scope.

Overall the work is careful and unusually well-instrumented — the tokenizer is a real
brace-depth state machine with self-check fixtures, the pack-smoke test exercises all
three exports paths through a real Vite build, and the Browser Mode suite uses reference
color values and luminance ordering rather than trivially-true assertions. I verified two
suspected blockers and cleared both: the exports/`@import` chain resolves correctly
(components are pulled via relative `@import`, not the exports map, which is intentional),
and the published tarball **does** contain `package/LICENSE` (pnpm copies the
workspace-root LICENSE at pack time — confirmed by running `pnpm pack`).

No blockers found. The remaining issues are gaps between what the gates *claim* to
guarantee and what they actually enforce — each is a soft spot where a real regression
could ship green. The highest-value fixes are WR-01 (a CDN vector the no-CDN guard
cannot see) and WR-02 (a test predicate that passes for unresolved custom properties).

## Warnings

### WR-01: no-runtime-CDN guard cannot see `@import "https://…"` (string notation)

**File:** `tools/parity/parity.mjs:398-451` (`extractUrls`) and `453-478` (`urlGuard`)
**Issue:** Guard (D) is documented as enforcing the no-runtime-CDN constraint, but
`extractUrls` only detects `url(` tokens and explicitly *skips* bare strings
(lines 410-419). A stylesheet-level CDN import written in string notation —
`@import "https://fonts.googleapis.com/…";` — carries no `url(` token, so it passes the
guard untouched. This is not hypothetical: it is exactly the construct that was removed
from `handoff/tokens/fonts.css` (verified: the handoff still contains
`@import url("https://fonts.googleapis.com/…")`, and the package replaces it with a
comment-only `fonts.css`). Worse, the project's own `.stylelintrc.json` pins
`"import-notation": "string"` (line 8), so *every* future `@import` will be in the one
form the guard is blind to. Today `fonts.css` is inert, so there is no live leak — but
the single most likely way a runtime CDN dependency re-enters this package is precisely
the path the guard does not cover.
**Fix:** Scan `@import` targets too. In the parser or a dedicated pass, capture every
`@import` prelude (string or `url()`) and run it through the same scheme check:
```js
// after stripping comments, collect @import targets:
for (const m of css.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")]+)\1/gi)) {
  const target = m[2].trim();
  if (!target.startsWith('data:') && (target.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(target)))
    fail(`External @import ${rel}: "${target}" is forbidden (no runtime CDN)`);
}
```

### WR-02: `isTealFamily()` returns true for grayscale / transparent-black — soft & focus-ring assertions can pass vacuously

**File:** `packages/styles/tests/brand-theme.test.ts:52-54` (predicate), used at `134-139`, `165`
**Issue:** `isTealFamily(c)` is `c.g >= c.b - 2 && c.g >= c.r - 2`. It has no lower bound
and no saturation check, so it returns `true` for black `{0,0,0}`, transparent
(`{0,0,0,0}`), and any near-grayscale color. The STY-04 assertions on `accent-soft`,
`accent-soft-text`, and `focus-ring` (lines 134-139) rest *solely* on `isTealFamily`
with no `eqRGB`/luminance/alpha backstop. If any of those custom properties fails to
resolve, the longhand computes to its initial value — `background-color`/`color` →
transparent black, and `border: 3px solid var(--focus-ring)` with an unset var becomes
invalid-at-computed-value → `border-color` → `currentColor` (typically black). All three
yield `{0,0,0}`, which `isTealFamily` accepts. So a regression that silently drops the
`--accent-soft*`/`--focus-ring` derivation would still pass the very tests meant to prove
it. (The `accent`/`hover`/`active` probes are safe — they carry `eqRGB` or luminance
ordering — so this is scoped to the soft/focus-ring group and the line-165 re-derivation
check.)
**Fix:** Add a magnitude/saturation floor so unresolved (black/transparent) values fail:
```js
function isTealFamily(c: RGB): boolean {
  if (c.a < 0.02) return false;                 // unresolved var -> transparent
  const max = Math.max(c.r, c.g, c.b);
  if (max < 20) return false;                   // reject near-black
  return c.g + 2 >= max && c.g > c.b + 8;       // green dominant AND meaningfully > blue
}
```

### WR-03: chevron-mask divergence allowlist accepts *any* `data:` SVG, and only one of the three rewritten masks is decode-tested

**File:** `tools/parity/parity.mjs:297-307` (`isAllowedDivergence`); coverage gap vs `packages/styles/tests/brand-theme.test.ts:171-197`
**Issue:** `isAllowedDivergence` waves through a package value if it merely matches
`/url\(\s*['"]?data:image\/svg\+xml/` — it does not compare the decoded SVG against any
expected payload. Three files carry rewritten chevron masks
(`forms/forms.css:70-71`, `display/display.css:156-157`, `navigation/navigation.css:78-79`),
and their SVGs differ (down-chevron `m6 9 6 6 6-6` vs right-chevron `m9 18 6-6-6-6`).
The Browser Mode decode proof only exercises `.lyra-acc__chevron` (display.css). So the
forms and navigation chevrons could be truncated, malformed, or swapped for each other
and still pass **both** gates: parity (any `data:` SVG is "allowed divergence") and the
browser suite (never rendered/decoded). The URL guard confirms they are `data:` but says
nothing about validity.
**Fix:** Either tighten the allowlist to exact expected payloads (store the three
canonical data URIs and require `pd.val` to equal one of them), or add decode probes for
the forms and navigation chevrons to the Browser Mode fixture mirroring the existing
`.lyra-acc__chevron` test.

### WR-04: parity is advertised as "byte-for-byte" but is a whitespace-normalized, comment-stripped declaration diff

**File:** `tools/parity/parity.mjs:6-8`, `40-41` (docstring), `74`/`90-100` (mechanism)
**Issue:** The docstring and phase context state parity "proves they match handoff
byte-for-byte." The implementation does not: `normalizeWs` collapses all runs of
whitespace (line 74), comments are stripped in the tokenizer, and only
declaration-level `blockPath + prop + val` tuples are compared. Consequently
whitespace reflow inside a value (`1px  2px` vs `1px 2px`), added/removed comments, and
inter-rule formatting all pass silently. For a project whose locked decision is
"byte-faithful fidelity" and which prettier-ignores these files *specifically* to
preserve bytes, the only automated fidelity gate does not actually assert bytes. A
maintainer trusting the "byte-for-byte" claim could reformat a token value and ship it
green.
**Fix:** Either add a true byte-level backstop (hash each package file against its
handoff counterpart for the files that are meant to be verbatim, allowing only the
explicitly-listed mask/`@import` divergences), or soften the docstring/context to
"declaration-level (whitespace- and comment-insensitive) parity."

## Info

### IN-01: `pack-smoke` leaks its temp dir on any failure

**File:** `tools/pack-smoke/pack-smoke.mjs:54-57`, `165-167`
**Issue:** `die()` calls `process.exit(1)` synchronously from inside the `try`. Node's
`process.exit` terminates immediately and does **not** run pending `finally` blocks, so
the `rmSync(tmp, …)` cleanup in `finally` (line 166) is skipped on every failure path.
Repeated failed local runs accumulate `lyra-pack-smoke-*` directories in the OS temp dir.
CI runners are ephemeral so this is cosmetic there.
**Fix:** Clean up before exiting in `die` (e.g. capture `tmp` in a module-scoped var and
`rmSync` inside `die` before `process.exit`), or throw instead of `process.exit` so the
`finally` runs.

### IN-02: parser does not special-case unquoted `url()` (inconsistent with `extractUrls`)

**File:** `tools/parity/parity.mjs:83-151`
**Issue:** `parse()` treats quoted strings as opaque but has no `url(` awareness, so an
*unquoted* `url(...)` containing an interior `;`, `{`, `}`, or `:` would mis-segment the
declaration — whereas `extractUrls` (used by the URL guard) *does* handle unquoted
`url()`. Currently harmless: every data URI in the package is single-quoted (verified),
so nothing triggers this. It is a latent correctness/consistency gap if a future
verbatim copy introduces an unquoted `url()`.
**Fix:** Give `parse()` the same `url(` handling `extractUrls` already has, or document
the quoted-URL assumption at the tokenizer.

### IN-03: published LICENSE depends on pnpm's root-copy behavior, not a committed file

**File:** `packages/styles/package.json:16-22` (`files`); `packages/styles/` (no LICENSE)
**Issue:** `packages/styles/` has no `LICENSE` file and `files` does not list one. The
tarball nonetheless contains `package/LICENSE` because `pnpm pack` copies the
workspace-root `LICENSE` for a package that lacks its own (verified). This is fine while
the repo is pnpm-locked, but `npm pack` would **not** do this — anyone packing/publishing
with npm would ship an MIT package with no license file. `pack-smoke`'s `REQUIRED`
allowlist also does not assert LICENSE, so the guard would not catch its absence.
**Fix:** Add `package/LICENSE` to the `pack-smoke` `REQUIRED` list, and optionally commit
a `packages/styles/LICENSE` so LICENSE presence is not tool-dependent.

### IN-04: `styles.css` `@import` order is hand-authored and unverified by parity

**File:** `packages/styles/styles.css:3-16`
**Issue:** `styles.css` is not part of the handoff and is not parity-checked. Its cascade
order (colors → … → brand → base → components) is asserted only behaviorally, and only
for the accent group (STY-03/STY-04). A mis-ordered non-accent token layer would not be
caught by any gate. Low risk given the file's simplicity, but there is no automated guard
on the one file the whole package's cascade depends on.
**Fix:** Optional — add a lightweight assertion that `styles.css` imports the seven token
layers before the seven component layers in the documented order, or expand behavioral
coverage beyond the accent group in a later phase.

---

_Reviewed: 2026-07-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
