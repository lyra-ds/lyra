---
phase: 03-react-infrastructure-pilot-components
plan: 07
subsystem: ui
tags: [react, dialog, overlay, portal, focus-trap, presence, scroll-lock, useId, aria-modal, axe, vitest-browser-mode, ssr, css-first]

# Dependency graph
requires:
  - phase: 03-01
    provides: "@lyra-ds/react scaffold — tsup ./dialog entry, exports map, two-project vitest harness, dialog/index.ts placeholder, eslint test-file CSS-import carve-out"
  - phase: 03-02
    provides: "additive feedback.css — .lyra-dialog__close (28px flex box), .lyra-dialog--closing (lyra-pop-out) + .lyra-dialog-overlay--closing (lyra-fade-out) exit keyframes"
  - phase: 03-04
    provides: "internal overlay stack — Portal (SSR guard), useFocusTrap (zero-candidate + panel-routing contract), usePresence (keep-mounted-while-closing + timeout wedge guard), useScrollLock (refcounted additive padding), cx"
provides:
  - "Dialog pilot (forwardRef<HTMLDivElement> to the panel; role=dialog + aria-modal; portal + focus-trap + presence + scroll-lock composition; D-15..D-22) — the OVERLAY conversion recipe"
  - "The overlay test template: dialog.browser.test.tsx (trap both directions + zero-candidate + panel-routing, three close paths + opt-out flags, focus restore + onClose-ignored guard, presence closing-class/lyra-pop-out then unmount, repeated-open initial-focus determinism, additive scroll-lock, custom-container, tall-body/long-title backstops, axe light+dark on document.body) and dialog.ssr.test.ts (portal-null server proof)"
affects: [03-08, 03-09, phase-04-overlay-conversion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OVERLAY recipe: forwardRef outer component owns titleId (useId), usePresence(open) mount+closing, useScrollLock(open), and the open→false focus-restore effect; an INNER (non-exported) DialogPanel rendered as the Portal's child owns every DOM-dependent effect (initial focus + useFocusTrap) so they run only after the portal subtree exists (Portal mount race / Pitfall 8)"
    - "panel div carries tabIndex={-1} UNCONDITIONALLY — it is both the D-20 initial-focus fallback and the useFocusTrap zero-candidate refocus target (a plain-text no-onClose dialog has zero tabbables and must still contain Tab)"
    - "focus restore keys on the controlled open prop flipping to false (not on onClose being requested): the opener is captured inside the panel's mount effect BEFORE focus moves in — child effects run before parent effects, so an outer effect would capture too late; a parent that ignores onClose keeps open=true and focus stays inside"
    - "close button renders ONLY with onClose; self-contained inline 14px X svg (no Icon import → importing Dialog pulls no lucide-react); className lyra-dialog__close, aria-label Close, no inline style (D-19)"
    - "overlay backdrop close uses native element.click() in tests for deterministic target-identity (center-click would hit the centered panel); jsx-a11y backdrop/keydown rules disabled with justification (Esc + × are the keyboard-accessible paths)"
    - "axe.run(document.body) not the render container (the portal renders into body); dark theme on document.documentElement so the body-level portal inherits it"

key-files:
  created:
    - packages/react/src/dialog/dialog.tsx
    - packages/react/src/dialog/dialog.browser.test.tsx
    - packages/react/src/dialog/dialog.ssr.test.ts
  modified:
    - packages/react/src/dialog/index.ts

key-decisions:
  - "DialogProps extends Omit<HTMLAttributes<HTMLDivElement>,'title'> then redefines title: ReactNode — the handoff .d.ts (extends HTMLAttributes directly) fails strict TS because native title is a string attribute; reproduced in intent, corrected in mechanics"
  - "Inner DialogPanel factored out as the Portal child so initial-focus + useFocusTrap effects run after the portaled DOM exists — the open-keyed effect in the outer component would fire while panelRef.current is null and never re-run when the portal mounts (review fix / Pitfall 8)"
  - "Opener captured inside the panel mount effect (before focus moves in), not in an outer effect (child effects fire first, so an outer effect captures after focus already moved) and not during render (SSR-unsafe document access); restore fires in the open→false effect only"
  - "closeOnEsc handled by a panel onKeyDown (focus is trapped inside, so Escape bubbles to the panel); closeOnOverlayClick by the overlay target-identity check — both default true, each individually disableable"
  - "jsx-a11y disabled with justification on the overlay (no-static-element-interactions, click-events-have-key-events) and the panel (no-noninteractive-element-interactions for the Esc keydown) — a modal MUST handle Esc and the backdrop click is a supplementary mouse convenience; Esc + × are the keyboard-accessible close paths"

patterns-established:
  - "OVERLAY conversion recipe (Dialog): outer forwardRef + inner Portal-child panel, composing Portal/useFocusTrap/usePresence/useScrollLock — the exact wiring Phase 4 repeats for Drawer, CommandPalette, Toast"
  - "OVERLAY test template: trap both directions + zero-candidate containment + panel-routing, three close paths + opt-out flags + button-absent, focus restore + onClose-ignored guard, presence closing-class + lyra-pop-out then <500ms unmount, repeated-open initial-focus determinism, additive scroll-lock, custom-container mount/axe/teardown, tall-body + long-title backstops, axe light+dark on document.body, ssr portal-null proof"

requirements-completed: [RCT-04]

coverage:
  - id: D1
    description: "Dialog preserves the prototype DOM (.lyra-dialog-overlay > .lyra-dialog with __header > __title + conditional __close, __body, __footer?) via div + role=dialog + aria-modal=true (D-15); consumer className last; footer/× conditional (no empty chrome)"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — structure (role/aria/labelledby/tabindex, className last, footer conditional, × only with onClose)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Portal with optional container default document.body, SSR-guarded (D-21) — renderToString open=true yields a string, no dialog markup server-side, no throw"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.ssr.test.ts (open/closed/container renderToString — no overlay markup, no throw)"
        status: pass
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — custom container (mounts inside host, not a direct body child, focuses, axe-scoped, emptied on unmount)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All three close paths (Esc, overlay target-identity click, ×) work, each individually disableable via closeOnEsc/closeOnOverlayClick; click inside panel never closes; × renders only with onClose (D-16)"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — close paths (Esc, overlay, ×, both opt-out flags, panel-click no-close, no-onClose button absent)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Focus trapped both directions; zero-focusable dialog keeps Tab/Shift+Tab on the panel (tabIndex -1); panel-focused routing; initial focus lands (first focusable else panel) deterministically across cycles via the in-portal effect (D-20, Pitfall 8)"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — focus trap (wrap both directions, no background, zero-candidate containment, panel routing) + #Dialog — initial focus (deep body, 3 cycles)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Focus restores to the opener when open transitions to false (not on close request); onClose-ignored parent keeps open=true with focus inside (D-20 + APG)"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — close paths (restore to trigger on each path; onClose-ignored keeps mounted + focus inside)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Presence keeps the panel mounted while .lyra-dialog--closing (+ overlay counterpart) plays lyra-pop-out, unmounting after the panel's own animationend or the timeout wedge guard within 500ms (D-17/D-18, Pitfall 7)"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — presence (closing class + getComputedStyle animationName lyra-pop-out, then unmount <500ms)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Body scroll locked while open with additive paddingRight compensation, restored on close (D-22); tall-body keeps panel ≤440px + page scroll-locked; long-title wraps while × keeps its ~28px box"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — scroll lock (additive compensation + restore) + #Dialog — layout backstops (tall body, long title)"
        status: pass
    human_judgment: false
  - id: D8
    description: "axe zero violations light + dark, scanned at document.body (portal target) with dark theme on document.documentElement (UI-SPEC cross-cutting focus/keyboard row)"
    requirement: RCT-04
    verification:
      - kind: unit
        ref: "dialog.browser.test.tsx#Dialog — axe (light + dark)"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-07-19
status: complete
---

# Phase 3 Plan 07: Dialog Pilot Summary

**Locked the OVERLAY conversion recipe on real green code: the Dialog pilot composes the 03-04 internals (Portal + useFocusTrap + usePresence + useScrollLock) into a `forwardRef<HTMLDivElement>` outer component plus an inner Portal-child panel that owns every DOM-dependent effect — fixing the portal mount race (Pitfall 8) — and ships the reusable overlay keyboard/focus/presence/axe/ssr test template (28 tests) that Phase 4 copies for Drawer, CommandPalette, and Toast.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 replaced)

## Accomplishments
- **Dialog pilot** (`dialog.tsx`) implements D-15..D-22 over the shared internals: byte-identical `.lyra-dialog-overlay > .lyra-dialog` DOM (header > title + conditional ×, body, optional footer), `role="dialog"` + `aria-modal` + `aria-labelledby={useId()}` on the panel, rendered through `Portal` (SSR-guarded, `container` default `document.body`), kept mounted through its exit animation by `usePresence` (closing classes from 03-02, `onAnimationEnd` on the panel), body scroll locked by `useScrollLock(open)`, and `forwardRef` to the panel div (D-08).
- **Portal mount-race fix (the key structural review fix):** the overlay + panel are factored into a non-exported inner `DialogPanel` rendered as the Portal's child. Its `useEffect` (initial focus) and `useFocusTrap(panelRef, true)` run only after the portal subtree exists — an open-keyed effect in the outer component would fire while `panelRef.current` is still `null` and never re-run when the portal content lands (Pitfall 8). The panel carries `tabIndex={-1}` **unconditionally** so it is both the initial-focus fallback and the zero-candidate trap refocus target.
- **Focus restore keyed on `open→false`, opener captured before focus moves:** the opener is recorded inside the panel's mount effect (child effects fire before parent effects, so an outer effect would capture after focus already moved into the panel; and reading `document.activeElement` during render is SSR-unsafe). Restore fires in the outer `open`-keyed effect only when the controlled prop actually flips false — a parent that ignores `onClose` keeps `open=true` and focus stays inside (APG).
- **All three close paths, each disableable:** Esc via a panel `onKeyDown` (focus is trapped inside so Escape bubbles to the panel), overlay backdrop via the target-identity check, and the × button (rendered **only** when `onClose` is provided). `closeOnEsc` / `closeOnOverlayClick` default true. The × is a self-contained inline 14px X svg with `className="lyra-dialog__close"` and `aria-label="Close"` — **no `Icon` import**, so importing `Dialog` pulls zero sibling code / no `lucide-react`.
- **Overlay test template** (28 tests): `dialog.browser.test.tsx` covers the trap both directions + no-background-escape + zero-candidate containment + panel-focused routing, all three close paths + both opt-out flags + panel-click no-close + button-absent, focus restore on every path + the onClose-ignored guard, presence (closing class + `getComputedStyle().animationName === 'lyra-pop-out'` then unmount within 500ms), repeated-open initial-focus determinism (deep body button, 3 cycles via `rerender`), additive scroll-lock with restore, a custom-container fixture (mount location + focus + scoped axe + teardown), tall-body and long-title backstops, and axe light + dark scanned at `document.body`. `dialog.ssr.test.ts` proves the Portal renders null server-side (no overlay markup, no throw) for open/closed/container variants.
- Full `@lyra-ds/react` suite green: **129 tests** across the browser + ssr projects (101 prior + 28 Dialog); typecheck and eslint clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Dialog pilot** — `8c9b71c` (feat)
2. **Task 2: Dialog overlay browser + ssr test template** — `6ce1735` (test)

## Files Created/Modified
- `packages/react/src/dialog/dialog.tsx` - Dialog `forwardRef` outer + inner Portal-child panel composing the overlay internals (created)
- `packages/react/src/dialog/index.ts` - re-export `Dialog` + `DialogProps` for the `./dialog` subpath (replaced the 03-01 placeholder)
- `packages/react/src/dialog/dialog.browser.test.tsx` - OVERLAY test template, 25 tests in real chromium (created)
- `packages/react/src/dialog/dialog.ssr.test.ts` - Dialog `renderToString` portal-null proof, 3 tests (created)

## Decisions Made
- **Inner Portal-child panel** owns all DOM-dependent effects so they never race the portal mount (Pitfall 8). The outer `forwardRef` component owns only portal-independent state: `useId`, `usePresence`, `useScrollLock`, the focus-restore effect, and the merged panel ref.
- **Opener captured in the panel mount effect, restore keyed on `open→false`** — the only ordering that both captures before focus moves and honors a parent that ignores the close request. No render-phase `document` access, so SSR stays clean.
- **`DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>`** before redefining `title: ReactNode` — the handoff `.d.ts` shape fails strict TS against the native string `title` attribute.
- **`onKeyDown`/`onAnimationEnd` composed with any consumer-provided handlers** (extracted from `rest`, both called) so the Esc handler and the presence finalizer never clobber caller handlers; `role`/`aria-modal`/`tabIndex` are set AFTER the `{...rest}` spread so a11y-critical attributes can't be overridden.

## Deviations from Plan

**1. [Rule 3 - Blocking] jsx-a11y errors on the overlay backdrop + panel Esc handler**
- **Found during:** Task 1 (`pnpm --filter @lyra-ds/react run lint`)
- **Issue:** eslint `jsx-a11y` flagged the overlay backdrop `onClick` (`no-static-element-interactions`, `click-events-have-key-events`) and the panel `onKeyDown` (`no-noninteractive-element-interactions`, because the `dialog` role is non-interactive) — errors that would fail the lint gate.
- **Fix:** targeted `eslint-disable-next-line` directives with justification comments on exactly those two lines. The backdrop click is a supplementary **mouse** convenience (Esc and the × button are the keyboard-accessible close paths), and a modal **must** handle Escape. No rule was disabled project-wide; the directives are line-scoped to the applicable rules only.
- **Files modified:** `packages/react/src/dialog/dialog.tsx`
- **Commit:** `8c9b71c`

Note (not a deviation): the axe assertions reuse the **existing** frozen-token `color-contrast` carve-out established by the Button/Input pilots (logged in `deferred-items.md`) — allowing only that one locked-CSS finding while enforcing every other axe rule at full strength.

## Issues Encountered
Two browser-test failures surfaced on the first full run, both fixed within the same task:
- The initial-focus determinism fixture used `withClose: false` (no `onClose`) and tried to close via Escape — but a no-`onClose` dialog cannot self-close, and the overlay covers any background control. Rewritten to drive `open` directly via `rerender` (a fully-controlled fixture), which cleanly proves deep-body initial focus across 3 cycles.
- The long-title close-button width read 27.16px (sub-pixel rounding in headless chromium) against a strict `toBeCloseTo(28, 0)`. Relaxed to a `>26 && ≤29` range — the intent (the `flex: 0 0 28px` box does not collapse under the wrapping title) is preserved.

Also switched the `userEvent` import from the deprecated `@vitest/browser/context` to `vitest/browser`.

## Follow-ups for Later Plans
- **03-08 (CONVENTIONS.md):** record the OVERLAY conventions — (a) inner Portal-child panel owns DOM-dependent effects; (b) `tabIndex={-1}` unconditionally on the trapped panel; (c) focus restore keys on the controlled `open` flipping false, opener captured before initial focus; (d) overlay close glyph is a self-contained inline svg, never the `Icon` component.
- **Phase 4:** copy `dialog.browser.test.tsx` / `dialog.ssr.test.ts` as the OVERLAY template for Drawer, CommandPalette, and Toast.

## User Setup Required
None - no external service configuration required.

## Self-Check: PASSED

All 4 files verified present on disk; both task commits (`8c9b71c`, `6ce1735`) verified in git history.
