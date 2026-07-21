---
phase: 03-react-infrastructure-pilot-components
reviewed: 2026-07-20T20:41:56Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - packages/react/src/index.ts
  - packages/react/src/button/button.tsx
  - packages/react/src/button/index.ts
  - packages/react/src/icon/icon.tsx
  - packages/react/src/icon/icon-registry.ts
  - packages/react/src/icon/index.ts
  - packages/react/src/input/input.tsx
  - packages/react/src/input/index.ts
  - packages/react/src/dialog/dialog.tsx
  - packages/react/src/dialog/index.ts
  - packages/react/src/internal/cx.ts
  - packages/react/src/internal/use-controllable-state.ts
  - packages/react/src/internal/portal.tsx
  - packages/react/src/internal/use-focus-trap.ts
  - packages/react/src/internal/use-presence.ts
  - packages/react/src/internal/use-scroll-lock.ts
  - packages/react/tsup.config.ts
  - tools/icon-registry/generate.mjs
  - tools/dist-scan/assert-use-client.mjs
  - tools/dist-scan/no-cdn-scan.mjs
  - tools/smoke/smoke.mjs
  - tools/parity/parity.mjs
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-07-20T20:41:56Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed the `@lyra-ds/react` pilot components (Button, Input, Dialog, Icon), the shared
SSR-safe internals (portal, focus trap, presence, scroll lock, controllable state, `cx`),
the generated icon registry, and the five tooling scripts (icon-registry generator, dist
scanners, packed-tarball smoke, CSS parity validator).

Overall the code is unusually careful: the SSR/hydration story (`useSyncExternalStore`
portal guard, effects living inside the portal subtree), the reference-counted scroll lock,
the render-phase presence state machine, and the drift-guarded generators are all correct
under the scenarios they document. I could not find any security vulnerability, injection
surface, crash, or data-loss bug — the tooling spawns child processes with argv arrays (no
shell), the icon lookup is prototype-pollution-hardened with `Object.hasOwn`, and there is
no `eval`/`dangerouslySetInnerHTML`/dynamic `require`.

No BLOCKERs. The findings are real correctness/robustness gaps in edge cases (a masked
React controlled-input warning, two Dialog focus/close edge cases, a dead-state path in
Input, and a scanner that passes vacuously on empty input) plus three minor quality items.

## Warnings

### WR-01: Input silently freezes and suppresses React's controlled-without-onChange warning

**File:** `packages/react/src/input/input.tsx:87-110`
**Issue:** `handleChange` is attached to the `<input>` on **every** render, regardless of
whether the consumer passed an `onChange`:
```tsx
const handleChange = (event) => { setInputValue(event.target.value); onChange?.(event); };
// ...
<input {...(isControlled ? { value: inputValue } : { defaultValue })} onChange={handleChange} ... />
```
When a consumer renders a controlled field (`value` set) but forgets `onChange`, React
normally emits its well-known "You provided a `value` prop to a form field without an
`onChange` handler" warning and the mistake is caught immediately. Here that warning is
**suppressed** because React always sees an `onChange` (the internal `handleChange`). The
consumer's `onChange?.()` is a no-op, so the DOM value never updates — the input appears
frozen/read-only with **zero diagnostic**. `useControllableState` does not cover this: it
only warns on a controlled↔uncontrolled *switch*, not on a missing handler.
**Fix:** Re-surface the lost signal. Either add a dev-only guard, or set `readOnly` so React
can still reason about it:
```tsx
if (process.env.NODE_ENV !== 'production' && isControlled && onChange === undefined) {
  console.warn('[lyra-ds] Input: `value` was provided without `onChange`. The field will not update. Pass `onChange`, or use `defaultValue` for an uncontrolled field.');
}
```

### WR-02: Dialog closes on a drag-release that ends on the backdrop

**File:** `packages/react/src/dialog/dialog.tsx:142-146`
**Issue:** The overlay close uses a `click` handler with a target-identity check:
```tsx
onClick={(event) => {
  if (closeOnOverlayClick && event.target === event.currentTarget) onClose?.();
}}
```
A `click` fires on the nearest common ancestor of the `mousedown` and `mouseup` targets. If
a user presses the mouse inside the panel (e.g. selecting text in the dialog body) and
releases over the backdrop, the common ancestor is the overlay, so `event.target ===
event.currentTarget` is true and the dialog closes unexpectedly — potentially discarding
in-progress input. This is the classic overlay-dismiss pitfall (Radix/Ark guard against it
via `pointerdown`-origin tracking).
**Fix:** Only dismiss when the interaction *started* on the backdrop. Track the `mousedown`
target and require both endpoints to be the overlay:
```tsx
const downOnOverlay = useRef(false);
// on overlay:
onMouseDown={(e) => { downOnOverlay.current = e.target === e.currentTarget; }}
onClick={(e) => {
  if (closeOnOverlayClick && downOnOverlay.current && e.target === e.currentTarget) onClose?.();
}}
```

### WR-03: Reopening a Dialog during its exit animation drops initial focus and orphans the opener

**File:** `packages/react/src/dialog/dialog.tsx:109-115, 244-251` (with `use-presence.ts:40-51`)
**Issue:** Initial focus + opener capture live in `DialogPanel`'s **mount** effect, which
runs once per `DialogPanel` mount. But `usePresence` keeps `mounted === (open || closing)`
true throughout the exit animation, so `DialogPanel` is **not** unmounted on close. Trace a
close→reopen inside the presence window:
1. `open` → false: `closing` true, `mounted` stays true, `DialogPanel` stays mounted. The
   `[open]` restore effect fires and moves focus back to the opener, then sets
   `openerRef.current = null`.
2. `open` → true again (before `animationend`/fallback): `closing` cleared, `mounted` still
   true, so `DialogPanel` is the **same instance** — its mount effect does **not** re-run.
   `captureOpener` is never called again and focus is **never moved back into the panel**.
The reopened dialog is visible with focus stranded on the trigger (a keyboard/AT
accessibility break), and because `openerRef` was nulled, the *next* close cannot restore
focus either.
**Fix:** Drive initial-focus/capture off the `open` transition rather than component mount,
e.g. run the focus/capture effect with `open` in its dependency list (guarded on `open`
being true and `panelRef.current` present), so a false→true flip re-enters focus even when
`DialogPanel` never unmounted.

### WR-04: Input writes dead internal state on every keystroke while uncontrolled

**File:** `packages/react/src/input/input.tsx:71-105`
**Issue:** In the uncontrolled branch the DOM is bound to `defaultValue`
(`{...(isControlled ? { value: inputValue } : { defaultValue })}`), so the value returned by
`useControllableState` (`inputValue`) is **never read** in that branch. Yet `handleChange`
still calls `setInputValue(event.target.value)` on every keystroke, which calls
`setInternal` and forces a re-render whose result is identical DOM. The internal state is
write-only dead state in uncontrolled mode — confusing (a maintainer will assume it feeds
the input) and it triggers a redundant render per keystroke.
**Fix:** Only advance internal state when it is actually used (controlled composition), or
skip the setter when uncontrolled:
```tsx
const handleChange = (event) => {
  if (isControlled) setInputValue(event.target.value); // no-op state otherwise
  onChange?.(event);
};
```
Or drop `useControllableState` from Input entirely and keep only the controlled↔uncontrolled
dev-warning, since the value binding is already native.

### WR-05: assert-use-client.mjs passes vacuously when the target directory has no JS/CJS files

**File:** `tools/dist-scan/assert-use-client.mjs:23-37`
**Issue:** This is the belt-and-suspenders gate that guarantees the RSC `"use client"`
directive survived to `dist`. If `readdirSync(dir)` yields zero `.js`/`.cjs` files (a broken
or empty build, a wrong path, or a non-recursive miss if outputs ever move into
subdirectories), `files` is `[]`, `missing` is `[]`, and the script prints
`OK: all 0 JS/CJS files ... carry the directive` and exits 0. A positive assertion that
passes on an empty set gives false confidence exactly when the build silently produced
nothing. (`smoke.mjs` correctly guards this with `if (jsAssets.length === 0) die(...)`.)
**Fix:** Fail when no candidate files are found:
```js
if (files.length === 0) {
  console.error(`assert-use-client: no .js/.cjs files found in "${dir}" — nothing to assert (build produced no output?)`);
  process.exit(1);
}
```

## Info

### IN-01: Dead `tarballs` variable in the smoke test

**File:** `tools/smoke/smoke.mjs:171-180`
**Issue:** `const tarballs = pack(REACT_PKG, packDir)` captures the first pack's return, but
the real tarball paths are recomputed by re-reading `packDir` into `allTgz`, and `tarballs`
is discarded with `void tarballs`. The variable and the array return from `pack()` are dead.
**Fix:** Drop the `const tarballs = ` capture and the `void tarballs;` line, and have `pack()`
return `void` (it is only used for its side effect of writing the `.tgz`).

### IN-02: Generator's ternary-branch matcher can match non-ternary colons

**File:** `tools/icon-registry/generate.mjs:295-301`
**Issue:** `ternaryBranchLiterals` extracts any kebab string literal preceded by `?` or `:`
(`/[?:]\s*["']([a-z][a-z0-9-]*)["']/g`). Inside an `<Icon name={…}>` expression a non-ternary
`:` — an inline object property (`{ fallback: "check" }`) or a TS type annotation — would be
harvested as an icon name. It is currently harmless because the `CANONICAL_INVENTORY` diff
and the count boundary in `deriveCanonicalSet` reject any over-extraction, so a false match
fails the drift guard loudly rather than silently polluting the registry. Noting for
future-proofing as handoff expressions grow.
**Fix:** Tighten to the ternary shape (require the `?`/`:` to belong to a `cond ? a : b`
form), or restrict Pass B to the substring after the first `?` in the expression.

### IN-03: Icon renders an empty `<span class="lyra-btn__label">` for empty-string children (Button)

**File:** `packages/react/src/button/button.tsx:70`
**Issue:** `{children != null && <span className="lyra-btn__label">{children}</span>}` renders
an empty label wrapper when `children === ''` (empty string is `!= null`). Harmless, but it
emits an empty styled span that icon-only-button CSS may not expect. The `!= null` intent
(distinguish "no children" from `0`/`false`) is otherwise correct.
**Fix:** If an empty label wrapper is undesirable, gate on truthiness for strings while
keeping `0` renderable, e.g. `{children !== null && children !== undefined && children !== '' && (...)}`.

---

_Reviewed: 2026-07-20T20:41:56Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
