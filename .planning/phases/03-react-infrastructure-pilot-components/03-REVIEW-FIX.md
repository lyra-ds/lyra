---
phase: 03-react-infrastructure-pilot-components
fixed_at: 2026-07-20T21:10:00Z
review_path: .planning/phases/03-react-infrastructure-pilot-components/03-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-07-20T21:10:00Z
**Source review:** .planning/phases/03-react-infrastructure-pilot-components/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (0 critical + 5 warning; the 3 Info findings IN-01/02/03 were out of `critical_warning` scope and left untouched)
- Fixed: 5
- Skipped: 0

**Post-fix verification (whole `@lyra-ds/react` package):**
- `typecheck` (tsc --noEmit): passing
- `lint` (eslint): passing
- `test` (vitest, browser + ssr projects): **133 passed** (up from the 129 baseline — 4 new regression tests added to keep the locked pilot template proven)

## Fixed Issues

### WR-01: Input silently freezes and suppresses React's controlled-without-onChange warning

**Files modified:** `packages/react/src/input/input.tsx`, `packages/react/src/input/input.browser.test.tsx`
**Commit:** 4162c72
**Applied fix:** Added a dev-only, effect-scoped guard that re-surfaces the diagnostic React itself
suppresses (because the internal `handleChange` is always attached). When `value` is set but
`onChange` is `undefined`, `console.warn` explains the field cannot update. Follows the existing
`use-controllable-state.ts` pattern: a narrow module-scoped `process` ambient + `process.env.NODE_ENV`
check so tsup/esbuild strips it from production; effect-scoped (not per-render) and SSR-safe. Added two
browser tests: one asserting the warning fires for controlled-without-onChange, one asserting it does
NOT fire when `onChange` is present.

### WR-04: Input writes dead internal state on every keystroke while uncontrolled

**Files modified:** `packages/react/src/input/input.tsx`
**Commit:** fe62976
**Applied fix:** Guarded the `setInputValue(...)` call in `handleChange` with `if (isControlled)`.
In the uncontrolled branch the DOM is bound to `defaultValue`, so the hook's `inputValue` is never
read — calling the setter there wrote write-only dead state and forced a redundant render per
keystroke. `useControllableState` composition (and its controlled↔uncontrolled switch dev-warning,
the D-14 contract) is preserved, per the reviewer's minimal-change option rather than removing the
hook. Existing uncontrolled/controlled typing tests continue to pass unchanged.

### WR-02: Dialog closes on a drag-release that ends on the backdrop

**Files modified:** `packages/react/src/dialog/dialog.tsx`, `packages/react/src/dialog/dialog.browser.test.tsx`
**Commit:** 7c9ad84
**Applied fix:** Added mousedown-origin tracking (`downOnOverlay` ref) on the overlay, matching the
Radix/Ark pattern. The overlay now dismisses only when BOTH the `mousedown` and the resulting `click`
originated on the backdrop itself (`event.target === event.currentTarget` at both ends). A press that
starts inside the panel (e.g. selecting body text) and releases over the backdrop no longer closes the
dialog. Updated the existing overlay-dismiss tests to fire a real press→release gesture (a bare
`.click()` no longer closes by design) and added a new regression test for the panel→backdrop drag.

### WR-03: Reopening a Dialog during its exit animation drops initial focus and orphans the opener

**Files modified:** `packages/react/src/dialog/dialog.tsx`, `packages/react/src/dialog/dialog.browser.test.tsx`
**Commit:** 74b78de
**Applied fix:** Drove the initial-focus/opener-capture effect off the `open` transition instead of
`DialogPanel` mount. Because `usePresence` keeps the panel mounted through the exit animation, a
close→reopen within that window reuses the same `DialogPanel` instance, so a mount-only effect never
re-ran and focus stranded on the trigger (also nulling `openerRef` so the next close could not restore
either). The `open` prop is now threaded into `DialogPanel` and the focus effect keys on `[open, …]`,
guarded on `open === true` and a present `panelRef`. Added a browser regression test that opens →
closes (enters the exit window) → reopens on the same instance and asserts focus returns into the
panel AND that a subsequent close still restores focus to the opener.

### WR-05: assert-use-client.mjs passes vacuously when the target directory has no JS/CJS files

**Files modified:** `tools/dist-scan/assert-use-client.mjs`
**Commit:** 78544dc
**Applied fix:** Added an explicit `files.length === 0` guard that prints an error and exits 1, so the
"use client" gate fails loudly on a broken/empty build (or a wrong/non-recursive path) rather than
printing `OK: all 0 JS/CJS files …`. Mirrors the zero-asset guard already present in `smoke.mjs`.
Verified: syntax check passes, and running the script against an empty directory now exits 1 with the
new diagnostic.

---

_Fixed: 2026-07-20T21:10:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
