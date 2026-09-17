## Answer (short)

**F1 — Portal/context ownership paths.** One portal primitive, `internal/portal.tsx:34-41` (SSR-guarded, `createPortal(children, container ?? document.body)`). All four modals render `<Portal>` from the owner component and deliberately run every DOM-dependent effect in the *portal child* panel component (dialog.tsx:86-90,296-318; drawer.tsx:60,211-231; bottom-sheet.tsx:78,239-259; command-palette.tsx:186-188,543-569). There is **no React context** anywhere in the family; all ownership is prop/ref-threaded (panelRef/overlayRef/attachPanel/captureOpener). **No portalled nonmodal child exists in the package at HEAD**: the only `Portal`/`createPortal` users are the four modals plus the focus-trap test harness (grep across `packages/react/src`). Popover is in-flow inside its anchor `<span>` (popover.tsx:119-143); Tooltip/Dropdown/Select/Combobox/WorkspaceSwitcher import no Portal. CreateWorkspaceDialog composes Dialog (create-workspace-dialog.tsx:5,321). CommandPalette's `<Portal>` (command-palette.tsx:544) accepts **no `container` prop** — `CommandPaletteProps` (59-94) omits it, unlike the other three.

**F2 — Coordination across simultaneous instances.** There is **no layer registry / topmost authority**. Coordination today is:
- *Active status*: `use-modal-activity.ts:28` toggles `inert` **only on the modal's own overlay node** during exit (`toggleAttribute('inert', !open)`); the page background is never inerted. Background "isolation" = focus trap + scroll lock + overlay paint only.
- *Escape*: per-panel keydown + `event.stopPropagation()` then `if (!event.defaultPrevented)` → onClose (dialog.tsx:141-150; drawer.tsx:105-111; bottom-sheet.tsx:125-131; command-palette.tsx:283-291). The "topmost" rule works only for **React-tree-nested** instances (synthetic bubbling); cmdk input-level Escape dedupes with the panel via `defaultPrevented` (command-palette.tsx:277-279 vs 287-289). For **sibling** (non-nested) simultaneous modals there is no rule — dismissal follows whoever holds focus, not logical order.
- *Focus trap*: `useFocusTrap(panelRef, active)` per instance; ownership primitive `isOwnedByPanel` excludes nested `[role="dialog"][aria-modal="true"]` branches from the parent's trap (use-focus-trap.ts:92-100); Tab wrap + recovery re-query live DOM every keydown (302); MutationObserver recovery (288-289).
- *Initial focus*: one-shot `completedRef`; eligibility requires `closest('[role="dialog"][aria-modal="true"]') === panel` (use-initial-focus.ts:47) — nested-modal targets rejected by design.
- *Return focus*: one-shot per accepted close; resolver-then-opener eligibility check excludes panel/overlay/inert/hidden subtrees (use-return-focus.ts:36-56,100-104). **No parent/child close coordination**: closing the parent while a child is open unmounts the child portal without any close transition (owner returns `null` at dialog.tsx:291-293) — the spec-required transfer (spec:241-242) is unimplemented.
- *Scroll lock*: module-level refcount, correct 0→1 / 1→0 discipline (use-scroll-lock.ts:7,26-47), but **keyed inconsistently**: Dialog on `open` (dialog.tsx:273), Drawer/BottomSheet on `!closing` (drawer.tsx:96; bottom-sheet.tsx:114), cmdk on `modal && open` (command-palette.tsx:250).
- *Stacking*: static z-index tokens (`--z-overlay`/`--z-dialog`, styles/components/feedback/feedback.css:76,86,130,501,518) — all instances share values, so simultaneous-portal stacking is DOM-append order, which the spec forbids (spec:148-150).
- *Popover* (nonmodal, in-flow) runs **document-level** Escape/mousedown listeners regardless of modals (popover.tsx:77-95); whether the modals' synthetic `stopPropagation` shields these document listeners depends on React root-attachment mechanics (see Uncertain).

**F3 — Minimum existing owners relevant to isolation.** Per-modal owners already in place: Portal (one primitive), focus trap, initial focus, return focus, overlay activity/inert (self-only), scroll lock (shared refcount), presence, per-panel Escape + backdrop gesture refs. Missing owners: background-inert authority, topmost/layer registry, parent-close child transfer, per-family outside-dismissal authority. The existing `isOwnedByPanel` modal-branch check (use-focus-trap.ts:95-100) and initial-focus branch check (use-initial-focus.ts:47) are the only parent-child ownership primitives; they would be the natural base for scoped inert propagation. Because no nonmodal child portals exist at HEAD, today's inerting surface is only the four modal overlays — nothing legitimate is currently at risk of being inerted (see Suggestions for what changes if children gain portals).

**F4 — Existing tests.** Nested/controlled coverage is Dialog-centric: nested Escape containment suite (dialog.browser.test.tsx:545-734: close-child-only, restore trigger, second Escape closes parent; child `closeOnEsc=false`; ignored child close; consumer `preventDefault`; non-Escape bubbling preserved); controlled-parent-ignore (dialog:479-501, drawer:382, bottom-sheet:322, command-palette:385); trap nested-portal containment + child-branch ownership (use-focus-trap.browser.test.tsx:220-235, 677-697, 727+); nested scroll locks (internal.browser.test.tsx:122-134); exit-scope inert + sibling-not-inerted (use-modal-activity.browser.test.tsx:23-65; dialog:880+). **Absent**: sibling (non-nested) simultaneous modals; parent-close-while-child-active; logical topmost order; popover×modal coordination.

**Suggestions (S, not facts).** S1: a single layer registry owning topmost Escape/outside/inert scope would collapse the per-panel `stopPropagation` heuristics; S2: extend `useModalActivity` (or its successor) to inert the background branch *excluding* active child modal branches and any declared child portals, reusing the `isOwnedByPanel`-style closest-branch test; S3: implement parent-close child transfer in `useReturnFocus`/presence teardown; S4: unify scroll-lock keying on `!closing` (or a shared owner); S5: add `container` to CommandPalette or document its absence.

## Files

packages/react/src/internal/portal.tsx:34-41 — sole portal primitive, SSR guard, body default
packages/react/src/internal/portal.tsx:26-30 — documented portal-mount race, effects must live in portal child
packages/react/src/internal/use-modal-activity.ts:23-32 — inert toggled on own overlay node only
packages/react/src/internal/use-focus-trap.ts:92-100 — `isOwnedByPanel` modal-branch ownership primitive
packages/react/src/internal/use-focus-trap.ts:186-379 — per-panel trap: boundaries 284-287, MutationObserver 288-289, keydown re-query 302, wrap 305-331
packages/react/src/internal/use-focus-trap.ts:313 — reads global `document.activeElement`
packages/react/src/internal/use-initial-focus.ts:37-59 — eligibility incl. modal-branch check :47; one-shot 94-111
packages/react/src/internal/use-return-focus.ts:36-56 — return-target eligibility; 79-115 — one-shot close restore
packages/react/src/internal/use-scroll-lock.ts:7-47 — module-level refcounted body lock
packages/react/src/internal/use-presence.ts:40-74 — presence state machine, exit fallback 250ms
packages/react/src/dialog/dialog.tsx:141-150 — Escape stopPropagation + defaultPrevented gate
packages/react/src/dialog/dialog.tsx:273 — `useScrollLock(open)` (keyed on open)
packages/react/src/dialog/dialog.tsx:291-293,296-318 — owner returns null when unmounted; Portal + panel wiring
packages/react/src/drawer/drawer.tsx:96,105-111,211-231 — scroll lock on `!closing`; Escape; Portal wiring
packages/react/src/bottom-sheet/bottom-sheet.tsx:114,125-131,239-259 — same pattern
packages/react/src/command-palette/command-palette.tsx:249-250,277-291,429-433,543-569 — trap/lock gated on modal; input+panel Escape; overlay ref with `open: !inline && open`; `<Portal>` without container
packages/react/src/popover/popover.tsx:77-95 — document-level Escape+mousedown, no layer awareness
packages/react/src/create-workspace-dialog/create-workspace-dialog.tsx:5,321 — composes Dialog
packages/styles/components/feedback/feedback.css:76,86,130,501,518 — static `--z-overlay`/`--z-dialog` tokens
docs/superpowers/specs/2026-08-30-overlay-family-design.md:148-158 — registry order, topmost-only handling, owner-must-own-portal rules
docs/superpowers/specs/2026-08-30-overlay-family-design.md:203-208,239-242 — inert background incl. nested modal carve-out; parent-close child transfer
docs/superpowers/specs/2026-08-30-overlay-family-design.md:246-260 — topmost Escape, refcounted scroll lock, controlled close
packages/react/src/dialog/dialog.browser.test.tsx:545-734 — nested Escape containment suite
packages/react/src/dialog/dialog.browser.test.tsx:470-501 — controlled close ignored / resolver not called
packages/react/src/drawer/drawer.browser.test.tsx:382 — parent-ignore close (Drawer)
packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx:322 — parent-ignore close (BottomSheet)
packages/react/src/command-palette/command-palette.browser.test.tsx:385-408 — parent-ignore close (CommandPalette)
packages/react/src/internal/use-focus-trap.browser.test.tsx:52-65,220-235,677-697,727-734 — nested portal harness, containment, child-branch ownership, child-portal recovery relinquish
packages/react/src/internal/use-modal-activity.browser.test.tsx:23-65 — sibling/host never inerted; overlay self-inert on close
packages/react/src/internal/internal.browser.test.tsx:122-134 — nested scroll-lock refcount
packages/react/src/internal/use-initial-focus.browser.test.tsx:147-158 — rejects nested-modal declared target

## Evidence

portal.tsx:41 — `return createPortal(children, container ?? document.body);`
portal.tsx:26-30 — "children mount one effect-tick after the owner … any effect that must observe the portaled DOM … has to live INSIDE the portaled subtree"
use-modal-activity.ts:28 — `node.toggleAttribute('inert', !open);` (own overlay only; grep confirms no other inert writes in modal family)
use-focus-trap.ts:95-96 — `const modalBranch = element.closest('[role="dialog"][aria-modal="true"]'); if (modalBranch) return modalBranch === panel;`
use-initial-focus.ts:47 — `if (target.closest('[role="dialog"][aria-modal="true"]') !== panel) return false;`
dialog.tsx:148-149 — `event.stopPropagation(); if (!event.defaultPrevented && closeOnEsc) onClose?.();`
command-palette.tsx:277-279 vs 287-289 — input Escape `preventDefault(); onClose?.()`, then panel handler `if (!event.defaultPrevented) { event.preventDefault(); onClose?.(); }` (dedupe via defaultPrevented)
use-scroll-lock.ts:7 — `let lockCount = 0;` + comment "nested overlays … share one body lock"
dialog.tsx:273 `useScrollLock(open);` vs drawer.tsx:96 `useScrollLock(!closing);` vs command-palette.tsx:250 `useScrollLock(modal && open);`
command-palette.tsx:544 — `<Portal>` (no container prop anywhere in CommandPaletteProps)
dialog.tsx:291-293 — `if (!mounted) { return null; }` (parent close unmounts whole portal subtree incl. nested child portals)
dialog.browser.test.tsx:646-650 — `expect(onChildClose).toHaveBeenCalledTimes(1); expect(onParentClose).not.toHaveBeenCalled(); … expect(document.activeElement).toBe(childTrigger);`
use-focus-trap.browser.test.tsx:222-234 — nested-portal containment assertions (focus stays in child, leaves parent)
popover.tsx:89-90 — `document.addEventListener('mousedown', …); document.addEventListener('keydown', onDocumentKeyDown);`
feedback.css:86 — `z-index: var(--z-dialog);` (static token, same for all instances)
spec:148-153 — "Only the topmost active layer MUST handle Escape, outside interaction, focus containment, or background isolation … A child dismissal MUST NOT cascade to its parent."
spec:206-208 — "all content outside the active modal branch MUST be inert … A nested modal MUST keep the page isolated while allowing only its parent modal restoration context."
spec:241-242 — "Closing the parent while a child is active MUST close or transfer the child through one explicit operation; it MUST NOT strand a child portal."
Grep fact: `createPortal|<Portal` across packages/react/src matches only the four modals + portal.tsx + focus-trap browser test — no portalled nonmodal children exist at HEAD.

## Uncertain

1. Whether React's synthetic `event.stopPropagation()` at a modal panel reliably prevents native document-level listeners (Popover's Escape at popover.tsx:90) for both supported React majors — plausible via root-container attachment, but not verified here.
2. Behavior of two **sibling** (non-nested) simultaneously open modals: no test, no code path defines which is "topmost"; inference that Escape follows focus-holding panel is untested at HEAD.
3. Parent-close-while-child-active: I infer the child portal is unmounted mid-exit (no close transition, `open` stays true in consumer state) from dialog.tsx:291-293 + React tree semantics; not exercised by any test.
4. use-focus-trap.ts:313 uses global `document.activeElement` instead of `panel.ownerDocument.activeElement` — probable multi-document/iframe limitation, impact unverified.
5. Cross-component stacking when consumers supply `container` or z-index — spec forbids DOM-order stacking, but current CSS uses shared static tokens; actual stacking outcome between two open portals assumed to be DOM-append order, not directly measured.
6. Alpine surfaces are named by the spec but were not scouted (question scoped to React starting points).
7. HEAD identity taken from working tree (read-only constraint: no git commands run); no confirmation the worktree is clean.
