## Answer
Four current owners must change, all local to the Tooltip module (no external consumers exist — only `packages/react/src/index.ts:150` re-exports it):

1. **State owner** — `tooltip.tsx:59-64`: one `open` boolean flipped by all four input paths must become combined focus/hover ownership (two ownership flags; visible = either) plus a coordinator-mediated open path. Today blur closes even while the pointer owns the content, and mouseleave closes synchronously.
2. **Event owners** — the cloned-child handlers `tooltip.tsx:96-125` and wrapper handlers `tooltip.tsx:144-160`: `mouseenter` must request open through a per-document coordinator (500 ms cold, 0 ms warm, no timer while warm) instead of calling `show()` directly; `mouseleave` must start a 100 ms pointer-transition grace timer (cancelled by re-enter or retained ownership) instead of immediate `hide()`; `blur` must not hide while pointer still owns; `focus` must open immediately and cancel warm-grace expiry. Wrapper handlers define the hover "branch" boundary and must use the same routing.
3. **Coordinator (new, module-local)** — no shared coordinator exists today; each `Tooltip` is fully independent. A module-scope per-document coordinator must own: warm/cold state, the 500 ms initial-delay timer, the 0 ms warm path, and the 300 ms warm-grace timer (started only on the last logical close with no owner and no visible tooltip; any open/retain cancels it and a fresh 300 ms starts after the next close). Final owner destroy/unmount must cancel all timers and reset cold. Home it in `tooltip.tsx` file scope; instances register/unregister in an effect — no new public API.
4. **Styling owner** — `feedback.css:249` and `453-455` (variants `426-452`): visibility today is `:hover`/`:focus-within` → `opacity:1`, with `data-state='closed'` winning the cascade. There is **no** rule making `data-state='open'` alone visible. Since the bubble is `pointer-events:none` (`feedback.css:243`) and sits outside the wrapper box, pointer over the bubble already drops wrapper `:hover`; once the 100 ms grace keeps `open` true after `:hover` falls, an open tooltip would be invisible. Visibility must key off `data-state` alone (open forces `opacity:1`), keeping the existing 120 ms transition (`effects.css:12`).

**Preserve existing public/cancellation semantics:** focus opens immediately without moving focus; `aria-describedby` merges consumer IDs with one stable `useId` (`tooltip.tsx:95`, verified by `tooltip.browser.test.tsx:75`); the described node always exists with matching text (`tooltip.tsx:163-165`); Escape dismisses without moving focus or activating the trigger and works for hover-opened content via the document listener (`tooltip.tsx:75-88`; tests `tooltip.browser.test.tsx:82-102,141-156`) — but note today every open instance listens, so one Escape closes **all** open tooltips, and the document listener never `preventDefault`s (only the trigger path does, `tooltip.tsx:84-87`); re-hover/refocus after Escape re-opens unconditionally; close resets placement to the requested side (`use-tooltip-placement.ts:41-44`); placement scroll/resize observers are already removed on close/unmount (`use-tooltip-placement.ts:77-86`) and the document Escape listener on close (`tooltip.tsx:75-82`) — new timers must be cleared by the same close/removal/destroy paths so a stale timer cannot reopen a removed tooltip.

**Minimal regression fixture for the first gap** (hover opens instantly, violating the 500 ms initial delay — the contract's first timing clause): in `tooltip.browser.test.tsx`, render one `<Tooltip tip="..."><button/></Tooltip>`, `await userEvent.hover(trigger)`, then immediately assert `root.dataset.state === 'closed'` (deterministic on the real clock — a 500 ms timer cannot have fired), then `await vi.waitFor(() => expect(root.dataset.state).toBe('open'))`. Fails today (`open` flips synchronously at `tooltip.tsx:108-113/144-147`), passes after. **Test clock precedent:** no `vi.useFakeTimers` exists anywhere in `packages/react/src`; browser tests use the real clock with `vi.waitFor` (`dialog.browser.test.tsx:283`) and raw real `setTimeout` (`toast-provider.browser.test.tsx:126`) — follow that.

## Files
- packages/react/src/tooltip/tooltip.tsx:59-64 — single `open` boolean + bare `show`/`hide`; must become combined focus/hover ownership routed through a coordinator.
- packages/react/src/tooltip/tooltip.tsx:96-125 — cloned-child focus/blur/mouseenter/mouseleave/key handlers; direct show/hide must become coordinator requests + 100 ms pointer grace + ownership retention.
- packages/react/src/tooltip/tooltip.tsx:144-160 — wrapper-level duplicate handlers; same routing; wrapper box is the hover branch boundary.
- packages/react/src/tooltip/tooltip.tsx:75-88 — document Escape listener (hover-open dismiss, no focus move) and trigger Escape `preventDefault`; must also cancel timers; topmost-only dismissal needs coordinator centralization.
- packages/react/src/tooltip/tooltip.tsx:163-165 — always-present `role="tooltip"` node with `tip` text; stable describedby target to preserve.
- packages/react/src/tooltip/tooltip.tsx:95 — describedby merge preserving consumer IDs.
- packages/react/src/internal/use-tooltip-placement.ts:77-86 — existing placement-observer cleanup to preserve (satisfies "cancel placement observers").
- packages/react/src/internal/use-tooltip-placement.ts:41-44 — close resets placement during render; interacts with coordinator-driven `open` flag.
- packages/styles/components/feedback/feedback.css:227-252 — visibility driven by `:hover`/`:focus-within` only; breaks once grace keeps state open after hover drops.
- packages/styles/components/feedback/feedback.css:453-455 — `data-state='closed'` cascade override; the model to invert (open ⇒ visible via `data-state`).
- packages/styles/components/feedback/feedback.css:226,243 — wrapper box + `pointer-events:none` bubble: bubble never generates wrapper `:hover`; 100 ms grace must be JS-owned.
- packages/styles/tokens/effects.css:12 — `--duration-fast: 120ms`; existing visible transition to keep.
- packages/react/src/tooltip/tooltip.browser.test.tsx:141-156 — existing focus-open/Escape-closes-no-focus-move semantics the fixture must not regress.
- packages/react/src/tooltip/tooltip.browser.test.tsx:82-102 — Escape hides the rendered bubble (`::after` opacity), the styling assertion that pins the CSS contract.
- packages/react/src/tooltip/tooltip.browser.test.tsx:19-53 — focused-lifecycle isolation (blur closes, consumer onBlur preserved).
- packages/react/src/toast-provider/toast-provider.browser.test.tsx:126 — real-clock precedent (`setTimeout` + `vi.waitFor`), pattern for the 500 ms fixture.
- packages/react/src/index.ts:150 — only external consumer surface; confirms no public API change needed.

## Evidence
```tsx
// tooltip.tsx:59-64 — one boolean, every path flips it
const [open, setOpen] = useState(false);
const show = (): void => setOpen(true);
const hide = (): void => setOpen(false);
```
```tsx
// tooltip.tsx:108-119 — hover opens/closes synchronously; no 500 ms, no 100 ms grace
onMouseEnter: (event) => { childHandler?.(event); show(); },
onMouseLeave: (event) => { childHandler?.(event); hide(); },
```
```tsx
// tooltip.tsx:102-107 — blur closes even if the pointer still owns the branch
onBlur: (event) => { childHandler?.(event); hide(); },
```
```tsx
// tooltip.tsx:75-82 — per-instance document listener: Escape closes every open tooltip; no preventDefault
if (!open) return;
const onDocumentKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') hide();
};
```
```css
/* feedback.css:242,249 — visibility only under :hover/:focus-within; no data-state=open rule */
opacity: 0;
.lyra-tooltip:hover::after, .lyra-tooltip:focus-within::after { opacity: 1; }
/* feedback.css:453-455 — closed state wins the cascade */
.lyra-tooltip[data-state='closed']::after { opacity: 0; }
/* feedback.css:243 — bubble never hoverable; grace must be JS */
pointer-events: none;
```
```ts
// use-tooltip-placement.ts:77-86 — observer cleanup already exists
return () => {
  window.removeEventListener('scroll', measure, true);
  window.removeEventListener('resize', measure);
  window.visualViewport?.removeEventListener('resize', measure);
  window.visualViewport?.removeEventListener('scroll', measure);
};
```
```tsx
// proposed minimal fixture shape (real clock, per toast-provider precedent)
await userEvent.hover(trigger);
expect(root.dataset.state).toBe('closed');            // fails today: flips synchronously
await vi.waitFor(() => expect(root.dataset.state).toBe('open')); // ~500 ms
```

## Uncertain
- The normative design file was not read (instructed; main copy differs across checkouts). The contract above is taken solely from the supplied excerpt.
- **Escape "topmost" scope:** source shows one Escape closes *all* simultaneously open tooltips (per-instance document listeners, `tooltip.tsx:75-82`). Whether topmost-only dismissal is a required behavior change or an existing semantic to preserve is ambiguous from source alone; flagged for the controller.
- **"Pointer over the tooltip":** with `pointer-events:none` (`feedback.css:243`) the bubble emits no pointer events, so "remain visible while the pointer is over the tooltip" is unobservable as a bubble-enter event; read as the 100 ms grace + retained ownership only. Not verified at runtime.
- **Duplicate announcement:** the text exists both as `::after` generated content (`content: attr(data-tip)`, `feedback.css:228`) and in the described hidden span (`tooltip.tsx:163-165`). Whether browsers expose both to the accessibility tree (violating "MUST NOT announce duplicate copies") was not tested — source-only, no runtime run per read-only mandate.
- **Per-document keying:** a module singleton is per JS realm, not literally per `document`; multi-document/iframe use is unsupported today and untested. Current fixtures are single-document, so this matches existing behavior.
- No tests were run and no timers exist in the component today, so the 500/300/100 ms behavior is entirely new surface — the fixture proves only the first gap; warm-coordinator (two-trigger) behavior remains unproven until implemented.
