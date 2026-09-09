## Answer

All six failures reduce to two independent, source-verified wedges — neither is a demonstrated product bug.

**Cluster A — WebKit Tab traversal (#1–#4).** Verified source facts: `Popover` never moves focus into the panel on open — its open effect only installs outside-click and Escape handlers, and refocuses the trigger only on Escape (popover.tsx:77–95); the panel is non-modal, in-flow, and untrapped, so after `Enter` focus legitimately remains on the trigger and `Tab` is the only entry. Each failing test then hardcodes a Chromium DOM-order Tab walk: date/date-range count 4 stops (3 plain header buttons + the roving day), time-picker counts 1 stop (first option), the tooltip fixture counts 1 stop (the cloned trigger). All those intermediate stops are *implicit* native buttons with no `tabindex` attribute (calendar.tsx:310/324/336, time-picker.tsx:202, tooltip.tsx:94–127 adds none). Measured against the controller's Dropdown control experiment — on this WebKit build a native `Tab` out of a plain-button context reaches BODY while Chromium reaches the next implicit stop, and an explicit `tabIndex=0` stop rescues traversal — the four failures fit one model: WebKit skips implicit-button stops and exits to BODY; time-picker and tooltip fixtures contain **no** explicit `tabIndex=0` stop, so they exit on the first Tab (exact match to the Dropdown un-rescued arm). The picker cases add a wrinkle: the active day *does* carry explicit `tabIndex=0` via the roving pattern (calendar.tsx:384), so under the same model WebKit should reach it on Tab 1 and then overshoot to BODY on the remaining Tabs (nothing else is reachable; end of tab order). That "reach-early-then-overshoot" half is a hypothesis the control experiment must replay. Honest read: no source fact shows a missing normative keyboard entry — keeping focus on the trigger of a non-modal popover and Calendar's own declared contract "Only the active date is in the Tab sequence" (calendar.tsx:146–151) are APG-acceptable; the tests assume one engine's traversal semantics, and no engine-conditional helper exists anywhere in `packages/react/src` (grep verified).

**Cluster B — FileUpload, two distinct owners (#5 ≠ #6).** #5 (`FILE_UPLOAD_SCENARIOS.removal`, name read from tools/file-upload/scenarios.ts:7) fails inside the *post-commit focus fallback* wait. Verified: the fallback only fires when `lastFocusedActionRef` holds the removed item's id (file-upload.tsx:372–396); that ref is set only by focus landing on an action button (`handleActionFocus`, file-upload.tsx:499–501, wired at :553/:566/:587, plus the `focusin` reset at :223–244). WebKit mouse activation does not focus buttons (controller-established platform behavior), so `await removeMiddle.click()` (file-upload.browser.test.tsx:679) never establishes the component's precondition; on rerender the effect correctly computes `removedFocusedIndex = -1` and focuses nothing, and the first `toHaveFocus` wait (:689–691) times out. Product behaves as designed; the test setup is the engine-dependent part. #6 (`file-upload.browser.test.tsx:731`) fails *before any product logic matters*: it asserts the fixture's "Outside control" received focus from a trusted mouse click; on this WebKit the click leaves `activeElement` on BODY. The component is not even implicated in the first failing assertion (restoration requires a non-null ref, which is null on WebKit). Different owner, same underlying platform click-focus fact.

Smallest correction scopes (all fixture/test-side, no product DOM decoration): #4 add `tabIndex={0}` to the fixture target button passed to Tooltip (engine-neutral no-op in Chromium); #5 establish the row-action focus deterministically before/at the remove click (`element().focus()` or focus+Enter — `lockIntent` runs in `onClick` either way, verified at file-upload.tsx:588–590); #6 replace the Outside `.click()` with explicit focus establishment; #1–#3 decide via the static-fixture control experiment below, then either make the Tab walk stop-count-agnostic (bounded "Tab until target, max N") or establish target focus programmatically before continuing the selection/close contract. The only product-side candidate is an APG roving `tabIndex` on TimePicker options (explicit `tabIndex=0` on the selected option) — legitimate per APG but a behavior-adjacent change; keep it out of the default verification scope pending the control experiment.

## Files

packages/react/src/popover/popover.tsx:77–95 — open effect installs outside-click/Escape only; no initial-focus move; :86 Escape refocuses trigger; :109–115 Enter toggles with `preventDefault`, so open state is engine-independent.
packages/react/src/date-picker/date-picker.tsx:157–165 — DatePicker delegates desktop open/close/focus entirely to Popover; no own focus code.
packages/react/src/calendar/calendar.tsx:384 — `tabIndex={sameDay(date, activeDate) ? 0 : -1}`: the selected/active day is the only explicit stop in the grid; :310/:324/:336 header buttons are plain implicit buttons; :252–261 range normalization behind failure #2's click; :278–305 arrow/roving handlers.
packages/react/src/date-picker/date-picker.browser.test.tsx:71–73 — hardcoded `Enter`+4×`Tab` then `activeElement` must be the selected day.
packages/react/src/date-range-picker/date-range-picker.browser.test.tsx:74–77 — identical hardcoded 4-Tab walk for the range case.
packages/react/src/time-picker/time-picker.tsx:193–216 — listbox div `tabIndex={-1}` (never a Tab stop) and option buttons with **no** `tabindex` attribute; :171–172 comment declares the arrows contract; :173–191 arrow handler lives on the list, unreachable while focus is on the trigger.
packages/react/src/time-picker/time-picker.browser.test.tsx:67–71 — `Enter`, one `Tab`, assert first option button.
packages/react/src/tooltip/tooltip.tsx:90–127 — `cloneElement` adds `aria-describedby`/handlers only, no `tabindex`; :96–101 trigger `onFocus` is what opens the focused lifecycle, so a missed Tab cascades to `data-state` assertions.
packages/react/src/tooltip/tooltip.browser.test.tsx:38–44 — all-fixture plain buttons; `before.focus()` + `Tab` + assert trigger.
packages/react/src/file-upload/file-upload.tsx:372–396 — removal fallback: requires `lastFocusedActionRef` non-null and the item gone; else no-op; :499–501 with :553/:566/:587 the only setters (React focus on action buttons); :223–244 document `focusin` clears the ref when focus leaves root or lands outside an item row.
packages/react/src/file-upload/file-upload.browser.test.tsx:679, 689–691 — #5: click on "Remove middle.pdf" then first `toHaveFocus` wait on "Remove last.pdf" after the `[first, last]` rerender.
packages/react/src/file-upload/file-upload.browser.test.tsx:729–731 — #6: clicks on "Remove report.pdf" then "Outside control", assert Outside has focus.
tools/file-upload/scenarios.ts:7 — names test #5: `removal: 'DF-FU-06 confirmed removal and post-commit focus fallback'`.

## Evidence

Popover does not move focus on open (popover.tsx:77–88):
```tsx
useEffect(() => {
  if (!open) return;
  const onDocumentMouseDown = ...
  const onDocumentKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
  };
```
Calendar roving tabindex — the selected day is the only explicit stop (calendar.tsx:384):
```tsx
tabIndex={sameDay(date, activeDate ?? null) ? 0 : -1}
```
Header buttons are implicit buttons (calendar.tsx:310–314):
```tsx
<button type="button" className="lyra-cal__nav" aria-label={...previousMonth} onClick={() => navigate(-1)}>
```
TimePicker options carry no tabindex; list container is -1 (time-picker.tsx:198, 202–206):
```tsx
<div ref={listRef} ... role="listbox" aria-label={labels.timeOptions} tabIndex={-1} onKeyDown={onListKeyDown}>
  {options.map((time) => (
    <button key={time} type="button" role="option" aria-selected={time === selected || undefined} ...>
```
Tooltip clones the child without tabindex; trigger focus opens the lifecycle (tooltip.tsx:94–101):
```tsx
cloneElement(child, { 'aria-describedby': ..., onFocus: (event) => { childHandler?.(event); show(); }, ...
```
FileUpload fallback precondition and no-op path (file-upload.tsx:372–380, 394–395):
```tsx
const focusedItemId = lastFocusedActionRef.current;
const removedFocusedIndex = focusedItemId === null ? -1 : previousItems.findIndex(...);
if (removedFocusedIndex >= 0) { ... (focusTarget ?? inputRef.current)?.focus(); }
```
Ref set only on real focus of an action button (file-upload.tsx:499–501, 587):
```tsx
const handleActionFocus = (itemId, event) => { if (event.currentTarget === event.target) lastFocusedActionRef.current = itemId; };
<button ... className="lyra-upload__remove" onFocus={(event) => handleActionFocus(item.id, event)} ...>
```
Ref cleared when focus leaves the root — the Outside-control path (file-upload.tsx:229–231):
```tsx
if (!root.contains(focusedNode)) { lastFocusedActionRef.current = null; return; }
```
Tests hardcode engine traversal (date-picker.browser.test.tsx:71–73; range :74–77):
```tsx
await userEvent.keyboard('{Enter}{Tab}{Tab}{Tab}{Tab}');
const selected = screen.getByRole('button', { name: 'Wednesday, May 1, 2024' });
expect(document.activeElement).toBe(selected.element());
```
(time-picker.browser.test.tsx:67–71):
```tsx
await userEvent.keyboard('{Enter}'); ... await userEvent.keyboard('{Tab}');
expect(document.activeElement).toBe(listbox.element().querySelector('button'));
```
(tooltip.browser.test.tsx:41–44):
```tsx
before!.focus(); await userEvent.keyboard('{Tab}');
expect(document.activeElement).toBe(trigger);
```
(file-upload.browser.test.tsx:679, 689–691 and 729–731):
```tsx
await removeMiddle.click(); ... await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Remove last.pdf' })).toHaveFocus());
await screen.getByRole('button', { name: 'Remove report.pdf' }).click();
await screen.getByRole('button', { name: 'Outside control' }).click();
expect(screen.getByRole('button', { name: 'Outside control' })).toHaveFocus();
```

**Exact control experiments (controller to replay):**
1. Zero-product sanity (anchors #3/#4): fixture with two plain `<button>`s; focus first; `Tab`; log `activeElement` per engine. Expected under the platform hypothesis: WebKit → BODY, Chromium → second button. One extra variant gives the second button explicit `tabIndex={0}` — expected: WebKit now reaches it (mirrors the Dropdown rescued arm).
2. Picker decider (#1/#2): static fixture with no product code — trigger button, then an async-mounted subtree of 3 plain buttons + a target button with explicit `tabIndex={0}` + 41 siblings `tabIndex={-1}`; focus trigger; log `activeElement` after Tabs 1–4. Decides between (a) WebKit reaches the explicit stop on Tab 1 and overshoots to BODY on Tabs 2–4 — then the only correction is the tests' hardcoded count (bounded "Tab until day, max 4", or programmatic day focus before the selection/close contract, which stays the real assertion); (b) WebKit exits on Tab 1 without entering the subtree — then re-run the same fixture with the subtree present at mount to isolate conditional mounting as the trigger.
3. TimePicker decider (#3): same fixture with all-plain buttons (no explicit stop) — expect WebKit Tab 1 → BODY; then the `tabIndex={0}` variant — expect rescue. If rescued, the narrow APG-consistent product candidate (roving `tabIndex` on options) is viable but stays out of default scope; the verification-scope task is programmatic first-option focus before the click-select/close assertions.
4. #5 reproducer: isolated scratch test — one FileUpload item, `removeButton.element().focus()` then locator click (or focus+`{Enter}`), rerender without the item, assert the fallback wait passes on WebKit. Confirms product contract intact and setup as the sole engine-dependent piece; then add the same focus establishment to `FILE_UPLOAD_SCENARIOS.removal` (assertions unchanged, so not weaker; `.not.toHaveFocus()` guards at :681–686 still hold).
5. #6 reproducer: static fixture — click button A, click button B, assert `activeElement` (expect WebKit BODY); correction: replace the Outside `.click()` with explicit focus of the Outside control (or keep the click and assert the post-rerender non-steal contract only), preserving the `input` `.not.toHaveFocus()` guard at :741.

## Uncertain

- The WebKit traversal model (skip implicit buttons, honor explicit `tabIndex`, exit to BODY) is inferred from the controller's Dropdown experiment plus these sources; it has not been replayed per-failure. In particular, whether WebKit Tab 1 from the picker trigger reaches the explicitly-tabindexed active day inside the conditionally mounted panel (overshoot theory) or exits immediately is exactly what control experiment 2 must decide.
- Whether the mechanism behind the Dropdown result is the macOS "full keyboard access"-style setting of the CI WebKit build, a runner-iframe effect (tests run in the vitest iframe per the comment at date-picker.browser.test.tsx:26–27), or a vitest `userEvent` keyboard dispatch artifact — repo source cannot distinguish these; the control experiments are the arbiter.
- #5: the exact first-failing wait is inferred (:689–691) from the controller's "expected .toHaveFocus fails after removal" wording; I did not observe the run. Also unverified whether focus+`{Enter}` activation is behaviorally identical to click for `lockIntent` (source-verified the handler runs in `onClick`, file-upload.tsx:588–590, but not executed).
- #6: assumed the Outside click dispatches successfully and only focus differs; not verified (e.g., pointer-events/timing on WebKit).
- `tools/file-upload/scenarios.ts:7` was read here but is not one of the 14 controller-pinned files; assumed byte-identical because both failing tests import and it is current-tree source.
- No engine-conditional test helper exists in `packages/react/src` (grep verified), so none of the proposed corrections has an existing repo convention to follow; the per-engine decision style would be new.
- I did not inspect the styles package (`.lyra-popover`, `.lyra-cal__day--out` visibility), relying on Chromium passing plus axe-clean assertions as proof the panel and day are rendered/visible when the assertions run.