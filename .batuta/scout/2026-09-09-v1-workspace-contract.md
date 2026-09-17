## Answer

**Selected-option keyboard entry.** In both packages the open-focus owner is a two-part pipeline: trigger keydown handler, then a deferred focus effect that resolves `-2` to the option carrying `aria-selected="true"`. Click/Enter/Space open on the selected option (compliant with "opening the popup MUST focus the selected option when available"). **ArrowDown opens on the first option and ArrowUp on the last option in both packages — neither is the selected option.** The Alpine browser test asserts this divergence directly (selected is index 1, ArrowDown lands on index 0); the React test masks it because `current` defaults to the first workspace, so "first" and "selected" coincide in the fixture. In React, ArrowUp-open additionally lands on the create command button whenever `onCreate` is present (it is the last option). Smallest native/browser regression per package: React — with `current="lyra"` (second), trigger ArrowDown focuses `options[0]` (`aria-selected="false"`) instead of `options[1]`; Alpine — trigger ArrowDown with served `aria-selected` on the second option focuses the first, unselected option (already asserted as current behavior at test lines 126–128, a live conflict with the excerpt, not a historical claim).

**Create-command semantics.** React: **yes, create is currently exposed as a listbox option** — `role="option"` with `aria-selected={false}` inside the `role="listbox"` pop (tsx:220-238), counted by `optionButtons()` so Home/End/wrap-around rove onto it; the current React test asserts End lands on the create button (test:69-70). Native activation is preserved today purely by native button behavior (Enter/Space → click → `onCreate()` + `close(true)`, tsx:229-232); there is no keydown-based activation to rebuild. Therefore keeping it a command needs only presentation/roving changes: keep the real `<button type="button">`, drop `role="option"`/`aria-selected`, exclude it from the option set. **Strictly necessary containment change:** the pop wrapper `.lyra-wssw__pop` is simultaneously the OF-ANCHORED popup (`popoverRef`/`useFlipPlacement`, tsx:62/177-181) and the `role="listbox"` element (tsx:180-184); a command cannot be a listbox child, so the minimal split is an inner `role="listbox"` (carrying `listboxId`/`aria-labelledby`) inside the pop wrapper, with create as a sibling button after it. `optionButtons()` and open-focus keep working (they query within the pop); `aria-controls` then targets the inner listbox; no prop/API change. This is a proposal only — the exact markup is not assumed approved. Alpine: the component exposes **no create affordance and no create event**; the `option` binding's click always dispatches `lyra:change` with `{ id: dataset.id ?? '' }` (ts:237). So a create item is either bound with `option` (becomes a listbox option that emits a selection event with an empty id — smallest regression: click such a button → `lyra:change {id:""}` + close) or unbound (excluded from roving by `optionElements()`' `[role="option"]` filter, ts:90-92, and missing Escape/Tab wiring). Native activation is preserved by a consumer-owned `<button type="button">` with its own `@click` effect; the zero-API smallest alternative is consumer self-wiring (no component change). Alpine has no component-owned containment to change; if a consumer splits pop into wrapper + inner listbox, `popoverElement()` and `observeFlipPlacement` (ts:98-100, 134-142) would re-target the inner listbox unless the wrapper keeps `.lyra-wssw__pop`.

**Consumer cancellation/ARIA relationships.** React: consumer `onKeyDown` ownership is asymmetric — on the trigger the consumer handler runs before component logic and can cancel opening via `preventDefault` (tsx:165-168, guarded at tsx:107); on options the component handles first and the root forwards the same event afterward (tsx:195 then tsx:153-155), so the consumer cannot cancel Escape-close/Tab-close/rove on an option. Also, React unmounts the listbox when closed, so the trigger's `aria-controls` (tsx:163) resolves to no element while closed — Alpine's served markup keeps the listbox present with `display:none`, so only React has a dangling ARIA relationship while closed. Escape-restore vs Tab/outside-click close-without-restore is symmetric across both packages and asserted on both sides (React test:71-73; Alpine test:162-194). Alpine: `lyra:change` is dispatched before close/restore (ts:236-239, matching the inventory) and served `aria-selected` stays consumer-owned and untouched (test:212-216); cancellation emits no distinct signal — the only consumer-visible close channel is the `open` flip via `x-modelable` (test:239-273). The component binding owns `type`/`aria-haspopup`/`:aria-expanded` (ts:204-217) but not `aria-controls` or the listbox label; the current test wires both by hand (test:29, 33-39), so the trigger↔listbox relationship exists only if the consumer adds it — the smallest ARIA gap versus React, where the component owns `aria-controls`/`aria-labelledby` (tsx:161-163, 180-187).

## Files

- packages/react/src/workspace-switcher/workspace-switcher.tsx:106-115 — trigger keydown owner; Enter/Space→-2 (selected), ArrowDown→0, ArrowUp→-1.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:79-95 — open-focus effect; `-2` resolves to `aria-selected` option, `<0` to last.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:65-66 — `optionButtons()`: pop-scoped `[role="option"]`, includes create.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:117-136 — option roving + Escape(restore)/Tab(no-restore) owner.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:148-155 — root forwards consumer `onKeyDown` for non-trigger targets (post-component for options).
- packages/react/src/workspace-switcher/workspace-switcher.tsx:157-176 — trigger DOM/ARIA owners: `aria-haspopup`/`aria-expanded`/`aria-controls`, consumer-first keydown.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:177-187 — pop is both anchored popup and `role="listbox"` with internal label span.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:188-219 — workspace option buttons; `aria-selected` computed from consumer-owned `selected`.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:220-240 — create as `role="option"` `aria-selected=false`; click → `onCreate()` + `close(true)`.
- packages/react/src/workspace-switcher/workspace-switcher.tsx:62 — `useFlipPlacement(open, triggerRef, popoverRef)`: anchored measurement on the pop.
- packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx:61-70 — ArrowDown→`options[0]` (masked: selected defaults to first) and End→`options[2]` (create).
- packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx:71-85 — Escape restores trigger; onChange/onCreate + focus restore anchors.
- packages/alpine/src/workspace-switcher.ts:166-178 — trigger keydown owner; same -2/0/-1 split.
- packages/alpine/src/workspace-switcher.ts:102-117 — `focusPendingOption`; selected derived from consumer-served `aria-selected`.
- packages/alpine/src/workspace-switcher.ts:90-92 — `optionElements()` root-scoped `[role="option"]` filter.
- packages/alpine/src/workspace-switcher.ts:180-202 — option keydown: rove + Escape restore / Tab close.
- packages/alpine/src/workspace-switcher.ts:230-240 — option binding: `lyra:change {id}` before `closePopover(true)`; no create event.
- packages/alpine/src/workspace-switcher.ts:98-100 — `popoverElement()` targets `[role="listbox"]`.
- packages/alpine/src/workspace-switcher.ts:134-142 — `observeFlipPlacement(trigger, popover)` measurement target.
- packages/alpine/src/workspace-switcher.ts:204-228 — trigger/popover bindings: own `type`/`aria-haspopup`/`:aria-expanded`/display/class; no `aria-controls`, no label wiring.
- packages/alpine/src/workspace-switcher.ts:150-159 — outside mousedown close without restore.
- packages/alpine/src/workspace-switcher.browser.test.ts:29-39 — consumer-wired `aria-controls`/`aria-labelledby`/`role="listbox"` (not component-owned).
- packages/alpine/src/workspace-switcher.browser.test.ts:109-135 — asserts Enter/Space→selected, ArrowDown→first, ArrowUp→last with selected=second.
- packages/alpine/src/workspace-switcher.browser.test.ts:162-194 — Tab and outside-mousedown close without restore anchors.
- packages/alpine/src/workspace-switcher.browser.test.ts:196-217 — `lyra:change {id:"orbit"}`, close, restore, served `aria-selected` unchanged.
- packages/alpine/src/workspace-switcher.browser.test.ts:239-273 — `x-modelable` open sync (sole close-observation channel).

## Evidence

React trigger keydown split (tsx:108-114):
```tsx
if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
  event.preventDefault();
  openWithFocus(event.key === 'ArrowDown' ? 0 : -2);
} else if (event.key === 'ArrowUp') {
  event.preventDefault();
  openWithFocus(-1);
}
```

React selected resolution (tsx:86-93):
```tsx
const target =
  pendingFocus === -2
    ? Math.max(selectedIndex, 0)
    : pendingFocus < 0
      ? options.length - 1
      : pendingFocus;
options[Math.min(target, options.length - 1)]?.focus({ preventScroll: true });
```

React create as option (tsx:223-232):
```tsx
<button
  type="button"
  role="option"
  aria-selected={false}
  className="lyra-wssw__item lyra-wssw__create"
  onKeyDown={handleOptionKeyDown}
  onClick={() => {
    onCreate();
    close(true);
  }}
>
```

React pop is the listbox (tsx:178-184):
```tsx
<div
  ref={popoverRef}
  id={listboxId}
  ...
  role="listbox"
  aria-labelledby={listboxLabelId}
>
```

React event forwarding (tsx:153-155, 165-168):
```tsx
onKeyDown={(event) => {
  if (event.target !== triggerRef.current) onKeyDown?.(event);
}}
...
onKeyDown={(event) => {
  onKeyDown?.(event as unknown as KeyboardEvent<HTMLDivElement>);
  handleTriggerKeyDown(event);
}}
```

React test masking + End-on-create (test:61-70):
```tsx
await userEvent.keyboard('{ArrowDown}');
let options = container.querySelectorAll<HTMLButtonElement>('[role=option]');
expect(document.activeElement).toBe(options[0]);
expect(options[0].getAttribute('aria-selected')).toBe('true');
...
await userEvent.keyboard('{End}');
expect(document.activeElement).toBe(options[2]);
```

Alpine trigger keydown split (ts:168-177):
```ts
if (event.key === 'Enter' || event.key === ' ') {
  event.preventDefault();
  this.openPopover(-2);
} else if (event.key === 'ArrowDown') {
  event.preventDefault();
  this.openPopover(0);
} else if (event.key === 'ArrowUp') {
  event.preventDefault();
  this.openPopover(-1);
}
```

Alpine selected read + dispatch-before-close (ts:106-108, 236-239):
```ts
const selectedIndex = options.findIndex(
  (option) => option.getAttribute('aria-selected') === 'true',
);
...
['@click']() {
  this.$dispatch('lyra:change', { id: this.$el.dataset.id ?? '' });
  this.closePopover(true);
},
```

Alpine test asserting the keyboard-open divergence (test:124-134):
```ts
await userEvent.keyboard('{ArrowDown}');
await flush();
expect(document.activeElement).toBe(options(host)[0]);

await userEvent.keyboard('{Escape}');
await flush();
await userEvent.keyboard('{ArrowUp}');
await flush();
expect(document.activeElement).toBe(options(host)[2]);
```

Alpine consumer-wired ARIA (test:29, 33-39):
```html
<button class="lyra-wssw__trigger" aria-controls="${id}-listbox" x-bind="trigger">
<div id="${id}-listbox" class="lyra-wssw__pop" role="listbox" aria-labelledby="${id}-listbox-label" x-bind="popover">
```

## Uncertain

- Whether ArrowDown-open→first / ArrowUp-open→last is an intentional, approved divergence from the supplied excerpt or the excerpt supersedes current behavior. Changing it breaks the asserted Alpine test (test:126-134) and requires a new React fixture (the current one masks the divergence because `current` defaults to the first workspace). Controller ruling needed.
- The inner `role="listbox"` split for React is the minimal containment change identified, but the exact new markup is not approved (per instructions); axe re-validation of the split was not performed (no state-changing commands allowed).
- Whether a dedicated Alpine create event/binding is permissible at all: the inventory records "Alpine exposes no create event"; adding one may constitute a public API change, which is out of scope. The zero-API alternative (consumer self-wired create button outside the option set) duplicates Escape/Tab wiring on the consumer side and was not evaluated for style/axe.
- Whether the React option-side cancellation asymmetry (consumer cannot cancel Escape/Tab on options because the component acts first) is intended single-forwarding design — the comment at tsx:145-146 suggests intent; actual intent is undocumented.
- React ArrowUp-open landing on the create command when `onCreate` is present is inferred from tsx:110-113 plus option ordering; no current test asserts it.
- Whether the React dangling `aria-controls` while closed matters for OF-ANCHORED: axe-clean per the current test, and the Alpine composition model keeps the node present; treat as a relationship asymmetry, not a confirmed failure.
- All facts are from the two runtime files and their colocated browser tests in main only; no sibling checkouts, no `.batuta` artifacts, no runtime execution. The React test's actual-dark contrast difference was not investigated (styles/contrast out of scope); source-line anchors are current and left for controller validation.
