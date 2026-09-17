<<<REPORT
## Answer

Four retained repairs (nativeTab boundary guards, returnFocusTo eligibility resolver, Dialog nested-Escape containment) are present and must stay. Remaining modal ownership gaps vs docs/superpowers/specs/2026-08-30-overlay-family-design.md:195-245:

1. **No declared initial-focus target on any opening API.** Spec :220 requires each opening API to accept a declared initial-focus target with a resolver order (invalid-field → heading → least-destructive → declared → first safe → panel). All four APIs lack the prop; the effect hardcodes "first DOM-order focusable, else panel" (dialog.tsx:125-132, drawer.tsx:82-89, bottom-sheet.tsx:102-109; CommandPalette always targets the search input via rAF, command-palette.tsx:217-223). The raw `panel.querySelector(INITIAL_FOCUS_SELECTOR)` applies no safe-candidate filter (:227-230 requires connected/visible/enabled/non-inert/non-destructive) — a `[hidden]` or display:none button, or a destructive action placed first in DOM, is a legal current target. Owner: `DialogPanel` effect as semantic base; duplicated in Drawer/BottomSheet; missing prop on `DialogProps` (dialog.tsx:42-63), `DrawerProps` (drawer.tsx:27-44), `BottomSheetBaseProps` (bottom-sheet.tsx:26-43), `CommandPaletteProps` (command-palette.tsx:57-90).

2. **No inert mechanism outside the modal branch.** Spec :204-208 requires background content inert under platform contract or tested equivalent. No modal component or internal sets `inert` (grep: only accordion.tsx:70 and a use-return-focus test fixture use it). Focus trap blocks Tab only; programmatic focus and AT access to background remain possible. Owner: dialog.tsx (semantic base) + internal/portal.tsx:34-42; Drawer/BottomSheet inherit per :195-196.

3. **Topmost/nested Escape is Dialog-only and leaks for Drawer/BottomSheet.** Spec :245-246 (adjacent, scope edge :245) and :209: Escape dismisses only topmost modal. Dialog stops propagation and honors `defaultPrevented` (dialog.tsx:148-154; covered by dialog.browser.test.tsx:527-696). Drawer (drawer.tsx:99-102) and BottomSheet (bottom-sheet.tsx:119-122) call `onClose` with neither `stopPropagation` nor a `defaultPrevented` check, so a Drawer/BottomSheet composed inside a Dialog's children lets one Escape close both layers through React-tree portal bubbling. CommandPalette input does `preventDefault` (command-palette.tsx:252-255), which Dialog honors but Drawer/BottomSheet ignore. Not yet reproduced in a real browser — bounded reproducer below.

4. **No sibling/topmost coordination or child-strand teardown.** Spec :239-242: nested modal must restore within parent; parent close must close/transfer child in one operation; no stranded child portal. No modal registry/stack exists anywhere under packages/react/src/internal. Only the scroll lock is shared (use-scroll-lock.ts:7,26-43 — refcount retained, compliant with :255-259). Two independent sibling portals have no topmost arbitration; closing a parent while an independently rendered child modal is open strands the child with active `aria-modal` and scroll claim. Owner: none exists — missing API decision (registry hook vs per-component ownership prop).

5. **Focused-element removal without navigation strands focus.** Spec :213-216: removal/disabling of the focused node must recompute and move focus to nearest safe element, else panel. use-focus-trap.ts recomputes candidates only on Tab keydown (:131-171) and its `focusout` (:177-184) only deactivates boundary guards — removal of the currently focused node with no subsequent Tab drops focus to body; no MutationObserver/focus-recovery owner exists. Test use-focus-trap.browser.test.tsx:237 covers candidate re-read during navigation only.

Retained/compliant: opener capture before focus move (dialog.tsx:129, drawer.tsx:86, bottom-sheet.tsx:106, command-palette.tsx:219), returnFocusTo eligibility incl. inert/hidden/disconnected rejection (use-return-focus.ts:36-56), one-shot per close cycle (:87-115), presence machine (use-presence.ts:40-73), portal SSR guard + no public selector (portal.tsx:34-42, spec :186-189), panel `tabindex="-1"` fallback and zero-candidate containment (dialog.tsx:190, use-focus-trap.ts:144-148).

## Files

- packages/react/src/dialog/dialog.tsx — semantic base; initial-focus effect :125-132; Escape owner :146-155; props :42-63; Portal render :294-316
- packages/react/src/drawer/drawer.tsx — duplicated initial focus :82-89; unguarded Escape :99-102; props :27-44
- packages/react/src/bottom-sheet/bottom-sheet.tsx — duplicated initial focus :102-109; unguarded Escape :119-122; props :26-43
- packages/react/src/command-palette/command-palette.tsx — modal input-focus effect :217-223; Escape :252-255; props :57-90; inline/mode split :461-519
- packages/react/src/internal/use-focus-trap.ts — isTabbable :30-40; Tab recompute :131-171; non-recovering focusout :177-184
- packages/react/src/internal/use-return-focus.ts — eligibility :36-56; close-cycle owner :87-115
- packages/react/src/internal/use-scroll-lock.ts — refcounted claim :22-49
- packages/react/src/internal/use-presence.ts — exit machine :40-73
- packages/react/src/internal/portal.tsx — SSR guard, body default :34-42; no inert ownership
- Tests (narrowly named): dialog.browser.test.tsx:191-320 (trap/initial focus), :365-524 (restore/successor), :527-696 (nested Escape containment, Dialog-only); use-focus-trap.browser.test.tsx:159-279 (native containment, removal-during-navigation :237); use-return-focus.browser.test.tsx:76-309 (resolver eligibility/successor); drawer.browser.test.tsx:172-360; bottom-sheet.browser.test.tsx:150-505; command-palette.browser.test.tsx:258-520
- Spec: docs/superpowers/specs/2026-08-30-overlay-family-design.md:195-245 (focus containment :204-216, initial/restored focus :218-242, dismissal edge :244-245)

## Evidence

- dialog.tsx:125-132 `useEffect` → `captureOpener(activeElement)` then `(panel.querySelector(INITIAL_FOCUS_SELECTOR) ?? panel).focus()` — DOM order, no declared target, no isTabbable filter. Same body at drawer.tsx:82-89 and bottom-sheet.tsx:102-109 (verbatim duplicates; per :195-196 they MUST reuse Dialog behavior — currently copy-pasted).
- dialog.tsx:25-32 selector list has no visibility/inert predicate; contrast use-focus-trap.ts:30-40 `isTabbable` which does — filter exists but is not applied to initial focus.
- grep `inert` over packages/react/src/**/*.tsx → only accordion.tsx:70 and use-return-focus.browser.test.tsx:103; zero hits in dialog/drawer/bottom-sheet/command-palette/internal portal/trap.
- dialog.tsx:148-154: `event.stopPropagation(); if (!event.defaultPrevented && closeOnEsc) onClose?.()`. drawer.tsx:99-102: `if (event.key === 'Escape') onClose?.()` — no stopPropagation, no defaultPrevented read. bottom-sheet.tsx:119-122 identical shape.
- command-palette.tsx:252-255: `event.preventDefault(); onClose?.()` — Dialog path declines via defaultPrevented check; Drawer/BottomSheet path does not.
- use-focus-trap.ts:177-184 `onFocusOut` body only calls `deactivateBoundaries()`; no focus reassignment when `relatedTarget` is null (removed node).
- use-scroll-lock.ts:7 module-level `lockCount` shared — nested claims compliant; the only shared cross-modal state in the checkout.
- Minimal bounded reproducers for controller (unverified in real browsers):
  1. Inert/declared-target gap: open Dialog whose body renders `<button hidden>` before a visible control → current first-focus selector matches the hidden button; no `initialFocus` prop exists to declare a target (dialog.tsx:25-32,130).
  2. Drawer nested in Dialog children, focus in drawer, single Escape → drawer.tsx:101 closes drawer, React-portal bubbling then reaches dialog.tsx:148-154 which passes its `defaultPrevented` check and closes the parent too (mirrors the bubbling relied on by dialog.browser.test.tsx:527-696).
  3. Focused-node removal: focus a body button in open Dialog, unmount it without Tab → `document.activeElement` escapes to body; no recovery owner (use-focus-trap.ts:177-184).
  4. Stranded child: parent Dialog closes while an independently rendered child modal portal is open → child stays mounted with `aria-modal="true"` and an unreleased-equivalent scroll claim; no registry owner exists to close/transfer it.

## Uncertain

- Whether inert ownership belongs in `Portal` (would affect non-modal portal consumers) or per-panel on the overlay wrapper — missing API decision; no mechanism exists either way to inherit.
- Whether sibling (non-nested React-tree) modals must share a topmost registry per spec :209, or whether topmost is defined only by focus — spec text implies a stack; no component API today declares stack membership.
- Whether Drawer/BottomSheet should gain `closeOnEsc` (Dialog has it, dialog.tsx:53-54) to support spec :248-250 non-dismissible safety steps, and whether CommandPalette needs the same — missing API decision.
- Whether spec :237-238's final "named focusable workflow or page region" restore fallback is component-enforced or composition-owned; today use-return-focus.ts:106-114 warns in dev and leaves focus unset when both resolver and opener are ineligible — outcome is body, which :237-238 forbids, but the enforcing owner (component prop vs composition contract) is undecided.
- Exact severity of the hidden-element initial-focus case depends on browser `focus()` behavior on non-rendered nodes — controller reproduction decides; source-level gap (no safe-candidate filter, no declared target) stands regardless.
REPORT>>>
