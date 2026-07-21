---
phase: 03-react-infrastructure-pilot-components
plan: 06
subsystem: ui
tags: [react, forwardRef, controllable-state, useId, aria-describedby, axe, vitest-browser-mode, ssr, css-first]

# Dependency graph
requires:
  - phase: 03-01
    provides: "@lyra-ds/react scaffold — tsup ./input entry, exports map, two-project vitest harness, input/index.ts placeholder, eslint test-file CSS-import carve-out (03-05)"
  - phase: 03-04
    provides: "internal/cx.ts (falsy-filtering class joiner, D-11) + internal/use-controllable-state.ts (value-callback controlled/uncontrolled hook, D-14/RCT-09)"
provides:
  - "Input pilot (forwardRef<HTMLInputElement>, byte-identical .lyra-field/.lyra-input DOM, D-14 controlled/uncontrolled via composed useControllableState, full field-chrome a11y wiring) — the FORM-component conversion recipe"
  - "The form-component test template: input.browser.test.tsx (real-typing D-14 contract + error a11y merge + useId uniqueness + partial-prop + overflow + smoke matrix light/dark axe) and input.ssr.test.ts (renderToString variants)"
affects: [03-07, 03-08, 03-09, phase-04-batch-conversion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FORM-component recipe: forwardRef wrapper composing useControllableState WITHOUT handing it the native event handler; public onChange stays the native ChangeEventHandler, DOM value binding stays native (string | number | readonly string[] pass through unmodified)"
    - "a11y id wiring: input id = id prop ?? useId(); a second useId() for the hint/error message node; aria-describedby space-merges the consumer value with the generated id (never replaces); aria-invalid on error"
    - "Real-typing browser test: vitest-browser-react render + locator.fill() fires a real DOM input event, React onChange receives a genuine ChangeEvent (event.target.value present); expect.poll for the controlled value-reset assertion"

key-files:
  created:
    - packages/react/src/input/input.tsx
    - packages/react/src/input/input.browser.test.tsx
    - packages/react/src/input/input.ssr.test.ts
  modified:
    - packages/react/src/input/index.ts

key-decisions:
  - "Public onChange kept as the inherited native ChangeEventHandler<HTMLInputElement>; useControllableState composed internally (setInputValue(event.target.value) then onChange?.(event)) — no onValueChange prop introduced (review-flagged value-callback vs event-handler conflation, resolved by composition)"
  - "InputProps extends Omit<InputHTMLAttributes,'size'> then redefines size 'sm'|'md'|'lg' — the handoff .d.ts shape (extends InputHTMLAttributes directly) fails strict typecheck against the native numeric size attribute; reproduced in intent, corrected in mechanics"
  - "id = id prop ?? useId(); the prototype's label-derived slug (lyra-in-<slug>) is DROPPED as a documented deviation — two same-labeled inputs would emit duplicate DOM ids (an a11y/correctness bug). Recorded in the component JSDoc; to be added to CONVENTIONS.md in 03-08"
  - "aria-describedby is space-joined merge of the consumer-provided value and the generated message id when hint/error present, never a replace; aria-invalid=true only on error (else consumer value passes through)"
  - "DOM value binding stays native: value rendered only when controlled (value !== undefined), else defaultValue — avoids React's value+defaultValue warning and preserves native value types"

patterns-established:
  - "FORM-component conversion recipe (Input): the composition wiring Phase 4 repeats for every stateful, value-carrying component (Textarea, Select, Switch, Checkbox, …)"
  - "FORM-component test template: real-typing D-14 assertions + error-a11y merge + useId-uniqueness + partial-prop no-empty-node + overflow backstop + light/dark axe smoke"

requirements-completed: [RCT-04]

coverage:
  - id: D1
    description: "Input pilot emits byte-identical handoff DOM/class assembly (.lyra-field > .lyra-label? + (.lyra-input-wrap? > .lyra-input-wrap__icon? + .lyra-input) + .lyra-hint?; size/error modifiers; consumer className last), bare control skips .lyra-field, ref on the input"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "packages/react/src/input/input.browser.test.tsx (class emission, no-empty-wrapper-node, ref)"
        status: pass
      - kind: unit
        ref: "packages/react/src/input/input.ssr.test.ts (bare vs field-chrome renderToString)"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-14 controlled/uncontrolled contract via composed useControllableState; public onChange is the native ChangeEventHandler and receives a real ChangeEvent"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "input.browser.test.tsx#Input — controlled/uncontrolled (D-14): uncontrolled typing, controlled fixed-value reset, stateful-parent flow — real chromium typing"
        status: pass
      - kind: unit
        ref: "input.ssr.test.ts#controlled input renders the given value"
        status: pass
    human_judgment: false
  - id: D3
    description: "Error a11y wiring: class swap + aria-invalid + aria-describedby MERGE (consumer id preserved); hint-only described-not-invalid; id = id prop ?? useId with same-label uniqueness"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "input.browser.test.tsx#Input — error a11y wiring + #Input — id wiring (merge, uniqueness, id precedence)"
        status: pass
      - kind: unit
        ref: "input.ssr.test.ts#error input wires the error classes + aria"
        status: pass
    human_judgment: false
  - id: D4
    description: "Smoke matrix (sizes x error x icon, light + dark) axe-clean; long value scrolls single-line; ~120-char label + hint stack without overlap"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "input.browser.test.tsx#Input — smoke matrix (light + dark) + #Input — overflow + long-text backstop"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-07-19
status: complete
---

# Phase 3 Plan 06: Input Pilot Summary

**Locked the FORM-component conversion recipe on real green code: the Input pilot composes `useControllableState` for the D-14 controlled/uncontrolled contract while keeping the public `onChange` a native `ChangeEventHandler`, wires full field-chrome a11y (label `htmlFor`/`useId`, `aria-describedby` merge, `aria-invalid`), and ships the reusable form-component test template (real-typing browser + `renderToString` ssr) that Phase 4 copies for every stateful component.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 replaced)

## Accomplishments
- **Input pilot** (`input.tsx`) converts the handoff `Input.jsx` byte-for-byte into a thin `forwardRef<HTMLInputElement>` wrapper: exact `.lyra-field` / `.lyra-input` DOM, `size` (`--sm`/`--lg`) + `--error` modifiers via `cx()` with consumer `className` last (D-09), the handoff early-return (bare control emits no `.lyra-field` chrome, no `.lyra-input-wrap` without `iconLeft`), ref on the `<input>` (D-08).
- **D-14 contract locked by composition** (the review fix): the public `onChange` stays the inherited native `ChangeEventHandler<HTMLInputElement>` — no `onValueChange` prop. Internally `useControllableState({ value, defaultValue })` is composed for controlledness detection + the dev switch-warning; the DOM change handler calls `setInputValue(event.target.value)` then forwards the original `event` to the consumer. The value binding is native (`value` only when controlled, else `defaultValue`) so `string | number | readonly string[]` pass through unmodified. This is the exact pattern Phase 4 (RCT-09) repeats for every stateful component.
- **Full a11y wiring:** input `id` = `id` prop `?? useId()` (the prototype's label-derived slug dropped as a documented deviation — duplicate-id bug for same-labeled inputs); a second `useId()` for the hint/error node; `aria-describedby` space-**merges** the consumer value with the generated id (never replaces); `aria-invalid` on `error`; `label` `htmlFor` resolves to the input id.
- **`InputProps` strict-typecheck fix:** `extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` before redefining `size?: 'sm'|'md'|'lg'` — the handoff `.d.ts` (which extends `InputHTMLAttributes` directly) fails strict TS against the native numeric `size`; reproduced in intent, corrected in mechanics.
- **Form-component test template** (31 tests): `input.browser.test.tsx` exercises the D-14 contract with **real chromium typing** (`locator.fill()` fires a genuine input event; the `onChange` spy receives a real `ChangeEvent` with `event.target.value`), error-a11y class-swap + `aria-invalid` + `aria-describedby` merge, two same-labeled inputs with distinct `useId` ids, partial-prop no-empty-node assertions, long-value horizontal-scroll and ~120-char label+hint stacking backstops, and a light/dark smoke matrix with `axe.run`. `input.ssr.test.ts` proves `renderToString` of bare / labeled+hint / error / controlled variants (D-26).
- Full `@lyra-ds/react` suite green: **100 tests** across the browser + ssr projects (69 prior + 31 Input); typecheck and eslint clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Input pilot** — `5d0d1ce` (feat)
2. **Task 2: Input browser + ssr test template** — `4f88722` (test)

## Files Created/Modified
- `packages/react/src/input/input.tsx` - Input `forwardRef` wrapper with the D-14 composition wiring and full a11y (created)
- `packages/react/src/input/index.ts` - re-export `Input` + `InputProps` for the `./input` subpath (replaced the 03-01 placeholder)
- `packages/react/src/input/input.browser.test.tsx` - FORM-component test template, 27 tests in real chromium (created)
- `packages/react/src/input/input.ssr.test.ts` - Input `renderToString` variants, 4 tests (created)

## Decisions Made
- **Composition over conflation:** the public `onChange` never enters `useControllableState` (whose `onChange` is a value-callback). The wrapper calls the hook's setter with the extracted value and forwards the native event separately — the review-flagged value-callback vs event-handler conflation, resolved.
- **Native value binding:** `value` is passed to the `<input>` only when controlled (`value !== undefined`), otherwise `defaultValue` — avoids React's simultaneous `value`+`defaultValue` warning and keeps native value semantics/types intact. The composed `inputValue` (which equals `value` while controlled) feeds the controlled branch so the hook state is genuinely referenced.
- **id deviation from the prototype:** `id ?? useId()` — no label-derived slug anywhere. Documented in the component JSDoc; the browser test's "two same-labeled inputs → distinct ids" fixture is the motivating case. To be recorded in CONVENTIONS.md by 03-08.
- **`aria-describedby` merge, not replace:** when `hint`/`error` is present the attribute is `[consumerValue, messageId].filter(Boolean).join(' ')`; with no message it passes the consumer value straight through.

## Deviations from Plan

None — plan executed exactly as written. Rules 1–4 were not triggered; no bugs, missing functionality, blocking issues, or architectural changes surfaced.

Note (not a deviation): the smoke matrix reuses the **existing** frozen-token `color-contrast` carve-out established by the Button pilot (03-05, logged in `deferred-items.md`) — allowing only that one locked-CSS finding while enforcing every other axe rule at full strength. No new eslint change was needed: the test-file CSS-import carve-out from 03-05 already covers `src/**/*.test.{ts,tsx}`.

## Issues Encountered
None. Typecheck, lint, and both vitest projects passed on first full run.

## Follow-ups for Later Plans
- **03-08 (CONVENTIONS.md):** record the two Input-originated conventions — (a) the dropped label-derived id slug (use `id` prop or `useId`; consumers needing deterministic ids pass `id`); (b) the FORM-component composition rule (public native `onChange` + internally composed `useControllableState`, never handing the hook a native event handler).
- **Phase 4:** copy `input.browser.test.tsx` / `input.ssr.test.ts` as the FORM-component template for every stateful, value-carrying component.

## User Setup Required
None - no external service configuration required.

## Self-Check: PASSED

All 4 files verified present on disk; both task commits (`5d0d1ce`, `4f88722`) verified in git history.
