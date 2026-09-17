## Answer

Yes — fixture precondition repair is legitimate, and no production API is required to keep the prepared-composition tests honest. But it is only legitimate if the unprepared composition is recorded as an unresolved V1 gap; by itself the fixture fix hides that gap.

Precise diagnosis:

1. Root cause is capture-sensitivity to engine click-focus behavior. Both components capture `document.activeElement` at the moment the open effect runs (dialog.tsx:120-127, drawer.tsx:75-81). On WebKit, a mouse click on a button never moves focus to it (controller trace: no `focusin` on the trigger during the whole click sequence; pre-focus is destroyed by `mousedown` → `focusout` to BODY). So at capture time `activeElement` is `document.body`. `openerRef` stores body; restore calls `body.focus()` — a silent body fall. That violates the spec's "MUST NOT silently fall to body" (overlay-family-design.md:238) for real WebKit mouse users. This is a production behavior gap, not a test artifact.

2. The viable fixture hook is synchronous programmatic focus inside the opening composition — e.g. `event.currentTarget.focus()` before `setOpen(true)` in the trigger's own handler (or any synchronous focus between the click dispatch and React's commit/ passive-effect capture). That is deterministic: the blur happened at `mousedown`, the click has no focus side effects, and the capture effect runs strictly after the handler. Pointer events stay trusted (the fixture adds no synthetic pointer input; controller trace proves current helpers already emit `trusted: true` events). Pre-click focus alone is proven insufficient on WebKit (focused-mouse trace). Post-`await userEvent.click()` focus is racy against React's passive-effect flush and must not be relied on.

3. Legitimacy boundary. The prepared composition ("opener is focused as part of invoking the overlay") is a composition the design contract supports: spec 234-238 already assigns the invoking composition responsibility for opener availability and successor logic. Testing it with strict `activeElement === trigger` assertions is contract-conforming and matches the capture timing rule ("opener MUST be captured immediately before focus moves into the modal", spec 231) — V1's capture timing itself is compliant. However, no real WebKit user produces a focused trigger via mouse click, so the fixture must not be the only story: the unprepared WebKit-mouse composition (capture = body → restore = body) must be recorded as an unresolved known gap. Deleting or weakening the strict assertions would be the "hiding" failure mode.

4. Does the contract require production repair with new API/owner? Not for the fixture question — but yes, eventually, for the unprepared composition. Within the current API and the stated constraint (no global tracking / framework assumptions), the component cannot know the opener when the engine never focused it: the component mounts after the trigger click, and the only thing readable at capture time is `document.activeElement`. No existing prop can carry a declared opener. So resolving the unprepared case needs a new declared-opener (or composition-provided successor) API surface — which spec 220 (declared initial-focus target MUST) and 234-238 (composition-provided successor) already anticipate. Recommendation: record the gap now, scope fixture fix to the prepared composition, defer the API decision as a separate tracked item.

## Files

- `packages/react/src/dialog/dialog.tsx` — capture at dialog.tsx:120-127 (open-transition effect: `captureOpener(document.activeElement)` then focus into panel); restore at dialog.tsx:267-274 (on `open`→false, unconditional `opener.focus()` when `instanceof HTMLElement`).
- `packages/react/src/drawer/drawer.tsx` — capture at drawer.tsx:75-81 (MOUNT-only effect, keyed `[panelRef, captureOpener]`, unlike Dialog's `open`-keyed effect); restore at drawer.tsx:166-170.
- `packages/react/src/dialog/dialog.browser.test.tsx` — helper `openHarness` at lines 105-117: pre-focuses trigger then `userEvent.click` (the "focused-mouse" composition); strict restore assertions at 321, 335, 366, 419, 446. Header comment lines 3-5 claims "real chromium" only.
- `packages/react/src/drawer/drawer.browser.test.tsx` — test at lines 165-188: clicks opener with NO pre-focus (the "mouse" composition); strict restore assertions at 179, 187.
- `packages/react/vitest.config.ts` + `tools/phase1/browser-matrix.mjs` — browser project runs chromium, firefox, webkit (browser-matrix.mjs:6-10; config `instances` at vitest.config.ts:37). The dialog test's "real chromium" comment has drifted from the actual 3-engine matrix.
- `docs/superpowers/specs/2026-08-30-overlay-family-design.md` — contract section "Initial and restored focus" 218-239: 220 declared initial-focus target MUST (absent in V1); 231 capture opener immediately before focus moves in; 232-233 restore only if opener remains connected/focusable/visible/enabled/non-inert/meaningful; 238 MUST NOT silently fall to body.

## Evidence

Source facts (code):
- Both components restore via `openerRef.current.focus()` with no connected/visible/enabled guard (dialog.tsx:267-274, drawer.tsx:166-170) — spec 232-233's guards are not implemented (separate V1 shortfall from the WebKit issue).
- `document.body` passes the `instanceof HTMLElement` check, so a body capture is "restored" as a body focus — this is the exact mechanism of the observed gap.
- Drawer capture is mount-keyed; Dialog capture is open-transition-keyed (WR-03). Both read `document.activeElement` verbatim at effect time; neither has any prop to declare an opener.
- Test helpers emit trusted pointer events (controller trace: every pointer event `"trusted": true`), so the pointer path is already real CDP input in current helpers.

Runtime facts (controller, source 574faa1b, current components/styles):
- WebKit 26.5, mouse open (both drawer and dialog): trace shows `mousedown` on trigger with `active = BODY`, no `focusin` on the trigger; capture-time activeElement = BODY; `restored = BODY`, `restoredTrigger: false`.
- WebKit 26.5, focused-mouse (pre-focus before click, exactly the dialog `openHarness` composition): `focusin` on trigger, then `mousedown` → `focusout` → active = BODY; capture = BODY; `restoredTrigger: false`. Proves pre-click focusing cannot survive WebKit `mousedown`.
- Chromium 151, all open modes: `focusin` on trigger during the click; capture = trigger; `restored = trigger`, `restoredTrigger: true`.
- Keyboard open (Enter), both engines and both components: active stays on trigger through `keydown`/`click`; capture = trigger; restore works (`restoredTrigger: true`). Focus restore to the trigger itself works on WebKit when captured correctly — the failure is capture, not restore.
- Consequence as written: both test files' strict assertions (`activeElement === trigger` after close) contradict observed WebKit mouse behavior; per the matrix config these browser tests declare a webkit instance, so the mismatch is expected to surface on webkit runs (execution status unobserved).

Design decisions (spec + code comments, not facts):
- Capture-from-`activeElement`-at-open-effect is a V1 design choice satisfying spec 231's timing literally; it is what makes restoration sensitive to engine click-focus behavior.
- V1 has no declared-opener/declared-target API; spec 220 and 234-238 define that API surface as a composition responsibility — the contract already points at "new API/owner" as the eventual home for the unprepared case.
- Fixture design (pre-focus in dialog helper, no pre-focus in drawer test, strict assertions everywhere) is a test-authoring decision, not a component contract; it assumed engine click-focus behavior that WebKit does not provide.

## Uncertain

- Firefox behavior unmeasured (controller data covers chromium/webkit only). Firefox typically does focus buttons on click, so it likely behaves like chromium, but this is unverified.
- Whether the webkit browser instance currently executes (locally or CI) for these suites was not observed; no test runs were permitted. The dialog test header's "real chromium" comment suggests at minimum documentation drift.
- React passive-effect flush ordering vs. a fixture focus placed AFTER `await userEvent.click()` is unproven; only a synchronous focus inside the opening composition (during the click handler / before commit) is deterministic by reasoning. Distinguishing these two placements matters for any fixture change.
- Drawer's mount-only capture effect means a close→reopen within the exit-presence window would skip re-capture (Dialog fixed this via WR-03 open-keying; drawer.tsx:75-81 has no `open` dependency). Not exercised by the controller data; a separate latent divergence from the Dialog pattern, listed only as observed code difference.
- Whether vitest/browser exposes lower-level trusted primitives (mousedown/mouseup split with interjection) was not verified; if it did, a between-mousedown-and-mouseup focus would be an alternative fixture hook, but no such surface is in evidence in the current helpers.
