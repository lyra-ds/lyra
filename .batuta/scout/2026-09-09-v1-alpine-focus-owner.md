# Answer

**(1) Shared Tab containment owner and cause**

Owner: `attachFocusTrap(panel)` in `packages/alpine/src/internal/focus-trap.ts:26-61`. It is the only shared Tab containment implementation; every Alpine modal (bottom-sheet, dialog, drawer, command-palette) attaches it to its panel. No dedicated focus-trap test file exists; the trap is exercised only through the four consumer suites.

Cause consistent with "native traversal skips implicit buttons": the keydown handler (focus-trap.ts:27-57) intercepts Tab only in three cases — activeElement === panel (lines 42-46), activeElement === first with shiftKey (48-52), activeElement === last without shift (53-56). `first`/`last` are DOM-order edges of the panel's focusable list (lines 30-40). During a *real* forward Tab from a non-edge position (e.g., the `<input aria-label="Middle">` body field), the handler intentionally does nothing — it defers to native traversal. WebKit (Full Keyboard Access off) skips implicit `<button>` elements, so the native successor from a middle position is not the DOM-last button; focus lands outside the panel and no guard branch ever fires. On engines whose native order matches DOM order, the same middle Tab hits `last` and wraps. This explains the controller's 8/8 WebKit forward-Tab escapes vs 16 contained paths on the other engines, independent of tabIndex/click/Enter variants — those variants only change *restoration* behavior, not this trap.

Synthetic edge tests mask this: all current Tab assertions pre-place focus on an edge or the panel before pressing Tab — programmatic `.focus()` is not subject to native traversal filtering, so activeElement always equals `first`/`last`/panel and a guard branch always runs, on every engine. Examples: `last.focus()` then Tab at bottom-sheet.browser.test.ts:134-136, dialog.browser.test.ts:141-143, drawer.browser.test.ts:138-140; panel-focus trap at bottom-sheet.browser.test.ts:117-123; command-palette single-candidate wrap at command-palette.browser.test.ts:220-222. No suite Tabs from a middle (non-edge) position.

Direct consumers of the owner (`import { attachFocusTrap } from './internal/focus-trap'`):
- bottom-sheet.ts:1, 117, 132-135
- dialog.ts:1, 125, 140-143
- drawer.ts:1, 115, 130-133
- command-palette.ts:2, 391, 399-402 (inline only when not inline-mode; 391)

Narrowly affected regression files (the only suites asserting trap behavior): bottom-sheet.browser.test.ts, dialog.browser.test.ts, drawer.browser.test.ts, command-palette.browser.test.ts. dialog/drawer/bottom-sheet share an identical synthetic body fixture with a Middle input (dialog.browser.test.ts:14, drawer.browser.test.ts:14, bottom-sheet.browser.test.ts:14), so the WebKit middle-Tab gap exists identically in all three; command-palette's trap shape differs (input wraps to itself, only candidate).

**(2) Captured-opener capture / restoration / teardown order; existing public surface**

bottom-sheet.ts order:
- Capture: `activateOpen()` line 114 `this.opener = document.activeElement;` — unconditional, no eligibility filter (body/null accepted). Then `$nextTick` (115-119) attaches trap + `focusInitial()` (143-148, panel-scoped selector lines 5-12).
- Close: `activateClose()` 122-130 — `presence.update(false)` (closing classes) → `detachFocusTrap()` (138-141: cleanup then null) → `unlockScroll()` → `restoreOpener()` (150-153: focus only if `opener instanceof HTMLElement && opener.isConnected`, then null). Restoration is synchronous at close activation, before the exit animation completes.
- Destroy: `destroy()` 92-101 — detaches trap, destroys presence, unlocks scroll, `this.opener = null` — teardown does NOT restore focus.
- Escape path: panel binding `@keydown` Escape → `dismiss()` (155-158) → `$watch('open')` (85-88) → `activateClose()`. This is the only tested restore path (bottom-sheet.browser.test.ts:143-152, synthetic KeyboardEvent).

Public options: only `defaultOpen?: boolean` (lines 15-18). Public bindings: `overlay` (160-173), `panel` (175-185), `close` (187-192). There is **no explicit return-target / successor mechanism**: `opener` is internal state, never settable or overridable, and no binding/option accepts a return element. `restoreOpener` is exposed as an x-data method but not wired to any option.

Per-component copies, not shared: `opener`/`restoreOpener` are duplicated inline in dialog.ts (158-160), drawer.ts (148-150), command-palette.ts (410-412) — none of those three check `isConnected`; only bottom-sheet does (151). Focus-restoration is therefore four separate implementations; only the trap is shared.

**(3) Smallest compatible scope for containment only**

- Source: `packages/alpine/src/internal/focus-trap.ts` only — the Tab logic inside `onKeyDown` (27-57). Constraint: keep exported shape `(panel: HTMLElement) => () => void` (26, 59-60) so the four consumers need zero edits. The fix must be self-contained in the panel-scoped closure: the trap receives only the panel, so it cannot know the opener, and any WebKit traversal workaround must derive from panel contents or event-target position. Cleanup must remain the existing `removeEventListener` closure (59-60) — `focusTrapCleanup` consumers (bottom-sheet.ts:30, 138-141 and twins) depend on that exact contract.
- Test: containment regression in the trap-consumer suite(s), exercising a real forward Tab from a non-edge/middle position rather than pre-focused edges. Narrowest per controller scope: `bottom-sheet.browser.test.ts` (the fixture already has the Middle input, line 14). Note dialog and drawer have byte-identical fixtures and gap, so they are candidates for the same case if scope widens; command-palette is not directly analogous.
- Captured-opener input/docs separate: yes. Restoration is orthogonal (per-component inline mechanism, four copies, no shared owner) and the WebKit restoration failure (implicit mouse opener not restored) involves `activateOpen` capture semantics (bottom-sheet.ts:114), not the trap. Bundling them would force touching four components plus the embedding docs (date-picker.ts:108, date-range-picker.ts:116, time-picker.ts:121, recurrence-selector.ts:297 markup templates) in one change. Keep the containment change at one source file + its suite; any caller-facing documentation of opener capture should be a separate change.

No source changes made. No invented APIs proposed above.

# Files

- packages/alpine/src/internal/focus-trap.ts — shared trap owner (read, 61 lines)
- packages/alpine/src/bottom-sheet.ts — consumer; opener capture/restore (read, 196 lines)
- packages/alpine/src/bottom-sheet.browser.test.ts — colocated suite (read, 243 lines)
- packages/alpine/src/dialog.ts — consumer (grep anchors only: 1, 122, 125, 137, 140-143, 158-160)
- packages/alpine/src/dialog.browser.test.ts — read 60-179 (Tab edge tests 133-170, open-via-click 66-72)
- packages/alpine/src/drawer.ts — consumer (grep anchors: 1, 112, 115, 127, 130-133, 148-150)
- packages/alpine/src/drawer.browser.test.ts — read 95-174 (Tab edge tests 130-167)
- packages/alpine/src/command-palette.ts — consumer (grep anchors: 2, 369, 380, 391, 399-402, 410-412)
- packages/alpine/src/command-palette.browser.test.ts — read 205-223 (single-candidate trap 216-223)
- packages/alpine/src/index.ts — export/registration of lyraBottomSheet (7, 8, 95, 185, 187)
- packages/alpine/src/internal/test-axe.ts — existing axe helper used by suites (not modified)

# Evidence

- focus-trap.ts:27-28 `if (event.key !== 'Tab') return;` — handler is Tab-only.
- focus-trap.ts:39-56 — the entire wrap decision:
  ```
  const first = candidates[0];
  const last = candidates[candidates.length - 1];
  ...
  if (activeElement === panel) { ... (event.shiftKey ? last : first).focus(); return; }
  if (event.shiftKey) { if (activeElement === first) { ... last.focus(); } }
  else if (activeElement === last) { ... first.focus(); }
  ```
  No branch covers a non-edge activeElement during forward Tab — native traversal decides, which is where WebKit's button skipping diverges.
- focus-trap.ts:59-60 — cleanup contract: `panel.addEventListener('keydown', onKeyDown); return () => panel.removeEventListener('keydown', onKeyDown);`
- bottom-sheet.ts:114 `this.opener = document.activeElement;`; 129 `this.restoreOpener();`; 150-152:
  ```
  restoreOpener() {
    if (this.opener instanceof HTMLElement && this.opener.isConnected) this.opener.focus();
    this.opener = null;
  ```
- bottom-sheet.ts:15-18 `LyraBottomSheetOptions { defaultOpen?: boolean }` — sole public option.
- bottom-sheet.ts:182-184 panel Escape → dismiss; test bottom-sheet.browser.test.ts:148-150 asserts restore after synthetic Escape.
- Synthetic-edge proof: bottom-sheet.browser.test.ts:134-135 `last.focus(); await userEvent.keyboard('{Tab}');` and 137-138 `first.focus(); ... {Shift>}{Tab}`; dialog.browser.test.ts:141-146 and drawer.browser.test.ts:138-143 identical patterns; open path is programmatic `control.focus(); await userEvent.click(control)` (bottom-sheet.browser.test.ts:66-72) — suites never Tab from middle in any trap-consumer suite (rg for `middle|Middle` across `*.browser.test.ts` matches only the fixture string, no Tab from it).
- Consumer wiring parity: bottom-sheet.ts:132-135, dialog.ts:140-143, drawer.ts:130-133, command-palette.ts:399-402 all `this.focusTrapCleanup = attachFocusTrap(panel)`; detach via `focusTrapCleanup?.()` (bottom-sheet.ts:138-141).
- Shared-fixture duplication: dialog.browser.test.ts:14, drawer.browser.test.ts:14, bottom-sheet.browser.test.ts:14 all `'<button ...>First</button><input aria-label="Middle"><button ...>Last</button>'`.
- No focus-trap test file: `ls packages/alpine/src/internal/*.test.ts` → no matches; `focus-trap` referenced only by the 4 consumer sources + CHANGELOG.md.

# Uncertain

- Mechanism vs observation: the WebKit skip-implicit-buttons traversal behavior is inferred as the cause consistent with the controller's 8/8-vs-16/24 evidence; I could not execute any browser test (read-only), and whether vitest's WebKit runner emulates engine-specific native Tab traversal exactly like real Safari (Full Keyboard Access setting) cannot be confirmed from source. Controller's recorded failures are the only ground truth available here.
- Exact containment-fix shape (e.g., wrap-on-target-outside-panel vs re-deriving successor within panel) is deliberately not designed — the trap only receives the panel, so feasibility of any panel-scoped fix for a native-traversal escape should be verified by the executor against the recorded WebKit runs.
- command-palette.ts:391 attaches the trap only when `!inline`; inline-mode palette behavior under a trap change was not inspected beyond the grep anchor.
- The `isConnected` guard difference (bottom-sheet.ts:151 vs dialog.ts:159 / drawer.ts:149 / command-palette.ts:411) was noted, not traced to a deliberate decision; CHANGELOG.md not consulted for history (and current proof overrides historical claims per instructions).
