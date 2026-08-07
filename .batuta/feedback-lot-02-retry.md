# Lot 02 retry — verification failed: 6/8 dropdown tests red

The maestro ran your suite in the real browser. Your typecheck/prettier were
green, but the behavior is not. Fix the IMPLEMENTATION (and only where noted,
the fixture); the test expectations below are correct unless stated.

<failures>
1. `opens and closes from its trigger while preserving the menu item danger class`
   → `AssertionError: expected "lyra-menu--start" to contain "lyra-menu"`.
   Root cause: in the `menu` binding object you mix a static `class` key with
   a `:class` function — Alpine applies both as bindings and the object-form
   `:class` result REPLACES the static one. Emit ONE `:class` that returns
   everything (`lyra-menu`, `lyra-menu--${align}`, conditional
   `lyra-menu--up`). Audit `trigger` and `item` for the same collision risk.
2. `emits menu placement classes, including an upward flip...`
   → `expected "lyra-menu--end" to contain "lyra-menu-up"`-class family —
   same root cause as (1) plus verify the flip actually drives `placement`.
3. `moves DOM focus through commands and restores the trigger after Escape`
   → focused element is the TRIGGER when a menu item was expected. The React
   contract: keyboard open (Enter/Space/ArrowDown) focuses command 0,
   ArrowUp focuses the last; plain click opens WITHOUT moving focus. Your
   `focusPendingItem` runs via `$nextTick`, but the menu is gated by
   `x-show` — at that tick the element may still be hidden and unfocusable.
   Re-read how `dropdown.tsx` sequences pendingFocus; make focus happen
   after the menu is actually visible.
4. `closes after a command selection with focus restored, while Tab keeps native focus order`
   → inverse focus mismatch, same family as (3).
5. `closes when a mousedown lands outside and removes that listener after close and destroy`
   → `expected [] to have a length of 1 but got +0`. There is NO
   document-level mousedown listener in `dropdown.ts` at all — the lot's
   behavior contract requires it (attach while open, remove on close AND on
   destroy), ported from `dropdown.tsx:98`.
6. `synchronizes open with x-modelable in both directions`
   → `TimeoutError: locator.click ... waiting for element to be visible,
   enabled and stable` on the external control. After fixing (1)–(5), rerun
   your reasoning on this fixture: the external control must be a real
   visible interactive element outside the component; if the failure was a
   cascade of (1)/(3) it may just pass — do not weaken the assertions.
</failures>

<constraints>
Same Scope, same conventions, same environment limits as before (you still
cannot run the browser suite — reason from the errors above, which came from
a real chromium run). Re-run typecheck, prettier and size-limit for real and
report their output. Do not commit.
</constraints>
