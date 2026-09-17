# Task30 initial delivery feedback — one high-lane retry
## Reproduced failure
Controller pinned config `.batuta/runs/alpine-return-focus-checks.json` (MAIN) completed. Chromium58/58 and Firefox58/58 pass, types/format/build/docgen/check pass. WebKit51/58 fails. Size remains expected separate gate failure, do not change budgets.
Six specified OLD pointer-return fixtures were not wired to the new option at all, contrary to criteria2. Failures: bottom-sheet closes from Escape on panel; command-palette mounts overlay/focuses input/resets query/restores opener; dialog close paths and cancels exit/reopen; drawer close paths and cancels exit/reopen. Wire ONLY those fixtures through genuine initial options and outer Alpine.data callback, preserving pointer opening and each exact trigger assertion. Callback may read test-owned variable set to actual trigger after mount, not assign a private callback state property. Do not globally change fixture defaults; retain no-option keyboard fallback coverage for each family (add if none exists).
Seventh WebKit failure: command-palette synchronizes modelable open state in both directions, line485 expected true to be false (see exact excerpt below). Diagnose sequencing; do not broaden runtime scope or weaken assertions. Await actual model/panel settled state before next input if necessary, not delay sleeps. Full controller log follows.
## Missing required acceptance proofs
Initial tests only cover successor +4helper cases. Add meaningful direct-helper cases covering BOTH explicit and fallback eligibility: disconnected, foreign document, body/documentElement, closing panel/overlay, hidden/inert/aria-hidden ancestry, CSS display/visibility/no renderedrects, disabled fieldset, hidden input/nonfocusable. Valid heading tabindex=-1. Same-document HTMLElement contract must actually be enforced for explicit as well as fallback (normalizing only opener currently omits runtime HTMLElement check on explicit SVG element supplied by JS); use existing small constructor check, no general coercion/defensive framework. Keep eligibility helper module-private if no external call needs it.
Prove initial closed/opening/ignored close request/exit completion/destroy/inline CP call no resolver; accepted close once; new capture after reopen; callback reopens during close then later independent close exact once-counts. Verify caller opener null before resolver invocation including a throwing callback, with thrown object propagated and no unwanted focus. Integration observer can read owner record; helper does not own it. Use one representative integration owner for coupled cleared-record/throw/reentrant semantics plus per-family lifecycle counts if minimal parameterization supports this. Do not add hundreds of mirrored assertions.
Existing helper tests spy on focus call arguments and use real focus; retain this. Explicit preventScroll vs legacy plainfocus fallback must remain distinct. No consumer destination focus used to fake restoration. BottomSheet new successor test should use native Escape, not synthetic panel KeyboardEvent, since opening already owns focus.
## Bounds
Original11file scope unchanged; controller alone updates generated catalogs. No docs/WORK/Batuta edits, builds/tests/package managers/dependency/lock/config/hooks/git writes. Only exact pinnedNode Prettier execution from originalbrief permitted. Read-only source/diff allowed. No validation; controller owns it. Read originalbrief/design again then correct directly. Report unverified criteria honestly.

## Raw controller WebKit log
```

 RUN  v4.1.10 /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/alpine

 ❯ |webkit| src/command-palette.browser.test.ts (13 tests | 2 failed) 5715ms
     × mounts the overlay, focuses the input, resets query and active state, and restores its opener 3293ms
     × synchronizes modelable open state in both directions 145ms
 ❯ |webkit| src/drawer.browser.test.ts (13 tests | 2 failed) 2051ms
     × closes through Escape, backdrop click, and the close button while restoring focus 112ms
     × cancels an exit on reopen and focuses again before a subsequent restore 108ms
 ❯ |webkit| src/bottom-sheet.browser.test.ts (12 tests | 1 failed) 1916ms
     × closes from Escape on the panel and restores focus to its opener 118ms
 ❯ |webkit| src/dialog.browser.test.ts (13 tests | 2 failed) 1985ms
     × closes through Esc, backdrop press-and-release, and the close button while restoring focus 116ms
     × cancels an exit on reopen and focuses again before a subsequent restore 156ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 7 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |webkit| src/bottom-sheet.browser.test.ts > lyraBottomSheet > closes from Escape on the panel and restores focus to its opener
AssertionError: expected <button …(3)></button> to be <button type="button" …(2)></button> // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/bottom-sheet.browser.test.ts/lyraBottomSheet-closes-from-Escape-on-the-panel-and-restores-focus-to-its-opener-1.png

[32m- Expected[39m
[31m+ Received[39m

[2m  <button[22m
[32m-   data-testid="trigger"[39m
[31m+   class="lyra-bottomsheet__close"[39m
[2m    type="button"[22m
[32m-   x-on:click="open = true"[39m
[31m+   x-bind="close"[39m
[2m  >[22m
[32m-   Open[39m
[31m+   ×[39m
[2m  </button>[22m

 ❯ src/bottom-sheet.browser.test.ts:197:40
    195|     panel(host).dispatchEvent(new KeyboardEvent('keydown', { bubbles: …
    196|     await flush();
    197|     expect(document.activeElement).toBe(opener);
       |                                        ^
    198|     expect(overlay(host).classList).toContain('lyra-bottomsheet-overla…
    199|   });

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraBottomSheet-closes-from-Escape-on-the-panel-and-restores-focus-to-its-opener-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/7]⎯

 FAIL  |webkit| src/command-palette.browser.test.ts > lyraCommandPalette > mounts the overlay, focuses the input, resets query and active state, and restores its opener
AssertionError: expected <body style><div>…(1)</div></body> to be <button type="button" …(2)></button> // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/command-palette.browser.test.ts/lyraCommandPalette-mounts-the-overlay--focuses-the-input--resets-query-and-active-state--and-restores-its-opener-1.png

[32m- Expected[39m
[31m+ Received[39m

[31m+ <body[39m
[31m+   style=""[39m
[31m+ >[39m
[31m+   [39m
[31m+   [39m
[31m+[39m
[31m+[39m
[31m+   <div>[39m
[31m+     [39m
[31m+     [39m
[31m+     <div>[39m
[31m+       [39m
[31m+       [39m
[31m+       <div[39m
[31m+         class="lyra-command-palette"[39m
[31m+         id="lyra-command-palette-1"[39m
[31m+         x-data="lyraCommandPalette({\"groups\":[{\"label\":\"Actions\",\"items\":[{\"id\":\"new\",\"label\":\"New file\",\"hint\":\"Create a document\",\"shortcut\":\"⌘ N\"},{\"id\":\"settings\",\"label\":\"Settings\",\"hint\":\"Configure workspace\",\"shortcut\":\"⌘ ,\"}]},{\"label\":\"Navigation\",\"items\":[{\"id\":\"home\",\"label\":\"Go home\",\"hint\":\"Open dashboard\"}]}]})"[39m
[31m+       >[39m
[31m+         [39m
[31m+         [39m
[2m          <button[22m
[2m            @click="open = true"[22m
[2m            data-testid="opener"[22m
[2m            type="button"[22m
[2m          >[22m
[2m            Open[22m
[31m+         </button>[39m
[31m+         [39m
[31m+         [39m
[31m+         <button[39m
[31m+           data-testid="background"[39m
[31m+           type="button"[39m
[31m+         >[39m
[31m+           Background[39m
[31m+         </button>[39m
[31m+         [39m
[31m+         [39m
[31m+         <div[39m
[31m+           class="lyra-cmdk-overlay"[39m
[31m+           style="display: none;"[39m
[31m+           x-bind="overlay"[39m
[31m+         >[39m
[31m+           [39m
[31m+     [39m
[31m+           <div[39m
[31m+             aria-label="Command palette"[39m
[31m+             aria-modal="true"[39m
[31m+             class="lyra-cmdk"[39m
[31m+             role="dialog"[39m
[31m+             x-bind="panel"[39m
[31m+           >[39m
[31m+             [39m
[31m+       [39m
[31m+             <div[39m
[31m+               class="lyra-cmdk__search"[39m
[31m+             >[39m
[31m+               [39m
[31m+         [39m
[31m+               <svg[39m
[31m+                 aria-hidden="true"[39m
[31m+                 class="lyra-cmdk-trigger__icon"[39m
[31m+                 fill="none"[39m
[31m+                 stroke="currentColor"[39m
[31m+                 stroke-linecap="round"[39m
[31m+                 stroke-linejoin="round"[39m
[31m+                 stroke-width="2"[39m
[31m+                 viewBox="0 0 24 24"[39m
[31m+               >[39m
[31m+                 [39m
[31m+           [39m
[31m+                 <circle[39m
[31m+                   cx="11"[39m
[31m+                   cy="11"[39m
[31m+                   r="8"[39m
[31m+                 />[39m
[31m+                 <path[39m
[31m+                   d="m21 21-4.3-4.3"[39m
[31m+                 />[39m
[31m+                 [39m
[31m+         [39m
[31m+               </svg>[39m
[31m+               [39m
[31m+         [39m
[31m+               <input[39m
[31m+                 aria-activedescendant="lyra-command-palette-1-option-0"[39m
[31m+                 aria-autocomplete="list"[39m
[31m+                 aria-controls="lyra-command-palette-1-listbox"[39m
[31m+                 aria-expanded="true"[39m
[31m+                 aria-label="Search commands"[39m
[31m+                 placeholder="Type a command or search…"[39m
[31m+                 role="combobox"[39m
[31m+                 x-bind="search"[39m
[31m+               />[39m
[31m+               [39m
[31m+         [39m
[31m+               <kbd[39m
[31m+                 class="lyra-kbd"[39m
[31m+               >[39m
[31m+                 esc[39m
[31m+               </kbd>[39m
[31m+               [39m
[31m+       [39m
[31m+             </div>[39m
[31m+             [39m
[31m+       [39m
[31m+             <div[39m
[31m+               class="lyra-cmdk__body"[39m
[31m+               id="lyra-command-palette-1-listbox"[39m
[31m+               role="listbox"[39m
[31m+               x-bind="list"[39m
[31m+             >[39m
[31m+               [39m
[31m+         [39m
[31m+               <p[39m
[31m+                 class="lyra-cmdk__empty"[39m
[31m+                 style="display: none;"[39m
[31m+                 x-bind="empty"[39m
[31m+                 x-text="emptyText()"[39m
[31m+               >[39m
[31m+                 No results for “settings”.[39m
[31m+               </p>[39m
[31m+               [39m
[31m+         [39m
[31m+               <template[39m
[31m+                 :key="group.index"[39m
[31m+                 x-for="group in visibleGroups()"[39m
[31m+               />[39m
[31m+               <div[39m
[31m+                 :aria-labelledby="groupLabelledby(group)"[39m
[31m+                 aria-labelledby="lyra-command-palette-1-group-0"[39m
[31m+                 class="lyra-cmdk__group"[39m
[31m+                 role="group"[39m
[31m+               >[39m
[31m+                 [39m
[31m+             [39m
[31m+                 <template[39m
[31m+                   x-if="group.label"[39m
[31m+                 />[39m
[31m+                 <span[39m
[31m+                   :id="groupLabelId(group)"[39m
[31m+                   class="lyra-cmdk__group-label"[39m
[31m+                   id="lyra-command-palette-1-group-0"[39m
[31m+                   x-text="group.label"[39m
[31m+                 >[39m
[31m+                   Actions[39m
[31m+                 </span>[39m
[31m+                 [39m
[31m+             [39m
[31m+                 <template[39m
[31m+                   :key="entry.item.id"[39m
[31m+                   x-for="entry in group.items"[39m
[31m+                 />[39m
[31m+                 <button[39m
[31m+                   :aria-selected="isActive(entry.index) ? 'true' : 'false'"[39m
[31m+                   :class="itemClass(entry.index)"[39m
[31m+                   :id="optionId(entry.index)"[39m
[31m+                   @click="pick(entry.item)"[39m
[31m+                   @mouseenter="setActive(entry.index)"[39m
[31m+                   aria-selected="true"[39m
[31m+                   class="lyra-cmdk__item lyra-cmdk__item--active"[39m
[31m+                   id="lyra-command-palette-1-option-0"[39m
[31m+                   role="option"[39m
[31m+                   tabindex="-1"[39m
[31m+                   type="button"[39m
[31m+                   x-bind="item(entry.index)"[39m
[31m+                 >[39m
[31m+                   [39m
[31m+                 [39m
[31m+                   <span[39m
[31m+                     class="lyra-cmdk__item-icon"[39m
[31m+                   >[39m
[31m+                     <!-- consumer icon template slot -->[39m
[31m+                   </span>[39m
[31m+                   [39m
[31m+                 [39m
[31m+                   <span[39m
[31m+                     class="lyra-cmdk__item-label"[39m
[31m+                     x-text="entry.item.label"[39m
[31m+                   >[39m
[31m+                     Settings[39m
[31m+                   </span>[39m
[31m+                   [39m
[31m+                 [39m
[31m+                   <span[39m
[31m+                     class="lyra-cmdk__item-hint"[39m
[31m+                     x-show="entry.item.hint"[39m
[31m+                     x-text="entry.item.hint"[39m
[31m+                   >[39m
[31m+                     Configure workspace[39m
[31m+                   </span>[39m
[31m+                   [39m
[31m+                 [39m
[31m+                   <span[39m
[31m+                     class="lyra-cmdk__shortcut"[39m
[31m+                     x-show="entry.item.shortcut"[39m
[31m+                   >[39m
[31m+                     [39m
[31m+                   [39m
[31m+                     <kbd[39m
[31m+                       class="lyra-kbd"[39m
[31m+                       x-text="entry.item.shortcut"[39m
[31m+                     >[39m
[31m+                       ⌘ ,[39m
[31m+                     </kbd>[39m
[31m+                     [39m
[31m+                 [39m
[31m+                   </span>[39m
[31m+                   [39m
[31m+               [39m
[2m                  </button>[22m
[31m+                 [39m
[31m+           [39m
[31m+               </div>[39m
[31m+               [39m
[31m+       [39m
[31m+             </div>[39m
[31m+             [39m
[31m+       [39m
[31m+             <div[39m
[31m+               class="lyra-cmdk__footer"[39m
[31m+             >[39m
[31m+               [39m
[31m+         [39m
[31m+               <span>[39m
[31m+                 <kbd[39m
[31m+                   class="lyra-kbd"[39m
[31m+                 >[39m
[31m+                   ↑[39m
[31m+                 </kbd>[39m
[31m+                 <kbd[39m
[31m+                   class="lyra-kbd"[39m
[31m+                 >[39m
[31m+                   ↓[39m
[31m+                 </kbd>[39m
[31m+                  [39m
[31m+                 <span[39m
[31m+                   x-text="hints.navigate"[39m
[31m+                 >[39m
[31m+                   navigate[39m
[31m+                 </span>[39m
[31m+               </span>[39m
[31m+               [39m
[31m+         [39m
[31m+               <span>[39m
[31m+                 <kbd[39m
[31m+                   class="lyra-kbd"[39m
[31m+                 >[39m
[31m+                   ↵[39m
[31m+                 </kbd>[39m
[31m+                  [39m
[31m+                 <span[39m
[31m+                   x-text="hints.select"[39m
[31m+                 >[39m
[31m+                   select[39m
[31m+                 </span>[39m
[31m+               </span>[39m
[31m+               [39m
[31m+         [39m
[31m+               <span>[39m
[31m+                 <kbd[39m
[31m+                   class="lyra-kbd"[39m
[31m+                 >[39m
[31m+                   esc[39m
[31m+                 </kbd>[39m
[31m+                  [39m
[31m+                 <span[39m
[31m+                   x-text="hints.close"[39m
[31m+                 >[39m
[31m+                   close[39m
[31m+                 </span>[39m
[31m+               </span>[39m
[31m+               [39m
[31m+       [39m
[31m+             </div>[39m
[31m+             [39m
[31m+     [39m
[31m+           </div>[39m
[31m+           [39m
[31m+   [39m
[31m+         </div>[39m
[31m+         [39m
[31m+         [39m
[31m+       [39m
[31m+       </div>[39m
[31m+       [39m
[31m+     [39m
[31m+     </div>[39m
[31m+     [39m
[31m+   [39m
[31m+   </div>[39m
[31m+ </body>[39m

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraCommandPalette-mounts-the-overlay--focuses-the-input--resets-query-and-active-state--and-restores-its-opener-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/7]⎯

 FAIL  |webkit| src/command-palette.browser.test.ts > lyraCommandPalette > synchronizes modelable open state in both directions
AssertionError: expected true to be false // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/command-palette.browser.test.ts/lyraCommandPalette-synchronizes-modelable-open-state-in-both-directions-1.png

[32m- Expected[39m
[31m+ Received[39m

[32m- false[39m
[31m+ true[39m

 ❯ src/command-palette.browser.test.ts:459:11
    457|     expect(
    458|       (Alpine.$data(host.firstElementChild as HTMLElement) as { outerO…
    459|     ).toBe(false);
       |           ^
    460|   });
    461|

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraCommandPalette-synchronizes-modelable-open-state-in-both-directions-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/7]⎯

 FAIL  |webkit| src/dialog.browser.test.ts > lyraDialog > closes through Esc, backdrop press-and-release, and the close button while restoring focus
AssertionError: expected <button …(4)></button> to be <button type="button" …(2)></button> // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/dialog.browser.test.ts/lyraDialog-closes-through-Esc--backdrop-press-and-release--and-the-close-button-while-restoring-focus-1.png

[32m- Expected[39m
[31m+ Received[39m

[2m  <button[22m
[32m-   data-testid="trigger"[39m
[31m+   aria-label="Close"[39m
[31m+   class="lyra-dialog__close"[39m
[2m    type="button"[22m
[32m-   x-on:click="open = true"[39m
[31m+   x-bind="close"[39m
[2m  >[22m
[32m-   Open[39m
[31m+   ×[39m
[2m  </button>[22m

 ❯ src/dialog.browser.test.ts:188:40
    186|     await openDialog(host);
    187|     await userEvent.keyboard('{Escape}');
    188|     expect(document.activeElement).toBe(control);
       |                                        ^
    189|     await vi.waitFor(() => expect(overlay(host).style.display).toBe('n…
    190|

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraDialog-closes-through-Esc--backdrop-press-and-release--and-the-close-button-while-restoring-focus-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/7]⎯

 FAIL  |webkit| src/dialog.browser.test.ts > lyraDialog > cancels an exit on reopen and focuses again before a subsequent restore
AssertionError: expected <button …(4)></button> to be <button type="button" …(2)></button> // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/dialog.browser.test.ts/lyraDialog-cancels-an-exit-on-reopen-and-focuses-again-before-a-subsequent-restore-1.png

[32m- Expected[39m
[31m+ Received[39m

[2m  <button[22m
[32m-   data-testid="trigger"[39m
[31m+   aria-label="Close"[39m
[31m+   class="lyra-dialog__close"[39m
[2m    type="button"[22m
[32m-   x-on:click="open = true"[39m
[31m+   x-bind="close"[39m
[2m  >[22m
[32m-   Open[39m
[31m+   ×[39m
[2m  </button>[22m

 ❯ src/dialog.browser.test.ts:290:40
    288|     expect(panel(host).contains(document.activeElement)).toBe(true);
    289|     await userEvent.keyboard('{Escape}');
    290|     expect(document.activeElement).toBe(control);
       |                                        ^
    291|   });
    292|

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraDialog-cancels-an-exit-on-reopen-and-focuses-again-before-a-subsequent-restore-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/7]⎯

 FAIL  |webkit| src/drawer.browser.test.ts > lyraDrawer > closes through Escape, backdrop click, and the close button while restoring focus
AssertionError: expected <button …(4)></button> to be <button type="button" …(2)></button> // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/drawer.browser.test.ts/lyraDrawer-closes-through-Escape--backdrop-click--and-the-close-button-while-restoring-focus-1.png

[32m- Expected[39m
[31m+ Received[39m

[2m  <button[22m
[32m-   data-testid="trigger"[39m
[31m+   aria-label="Close"[39m
[31m+   class="lyra-drawer__close"[39m
[2m    type="button"[22m
[32m-   x-on:click="open = true"[39m
[31m+   x-bind="close"[39m
[2m  >[22m
[32m-   Open[39m
[31m+   ×[39m
[2m  </button>[22m

 ❯ src/drawer.browser.test.ts:185:40
    183|     await openDrawer(host);
    184|     await userEvent.keyboard('{Escape}');
    185|     expect(document.activeElement).toBe(control);
       |                                        ^
    186|     await vi.waitFor(() => expect(overlay(host).style.display).toBe('n…
    187|

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraDrawer-closes-through-Escape--backdrop-click--and-the-close-button-while-restoring-focus-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/7]⎯

 FAIL  |webkit| src/drawer.browser.test.ts > lyraDrawer > cancels an exit on reopen and focuses again before a subsequent restore
AssertionError: expected <button …(4)></button> to be <button type="button" …(2)></button> // Object.is equality

Failure screenshot:
  - .artifacts/browser/screenshots/src/drawer.browser.test.ts/lyraDrawer-cancels-an-exit-on-reopen-and-focuses-again-before-a-subsequent-restore-1.png

[32m- Expected[39m
[31m+ Received[39m

[2m  <button[22m
[32m-   data-testid="trigger"[39m
[31m+   aria-label="Close"[39m
[31m+   class="lyra-drawer__close"[39m
[2m    type="button"[22m
[32m-   x-on:click="open = true"[39m
[31m+   x-bind="close"[39m
[2m  >[22m
[32m-   Open[39m
[31m+   ×[39m
[2m  </button>[22m

 ❯ src/drawer.browser.test.ts:273:40
    271|     expect(panel(host).contains(document.activeElement)).toBe(true);
    272|     await userEvent.keyboard('{Escape}');
    273|     expect(document.activeElement).toBe(control);
       |                                        ^
    274|   });
    275|

 ❯ traces
   ↳ .artifacts/browser/traces/webkit-lyraDrawer-cancels-an-exit-on-reopen-and-focuses-again-before-a-subsequent-restore-0-0.trace.zip

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/7]⎯


 Test Files  4 failed | 2 passed (6)
      Tests  7 failed | 51 passed (58)
   Start at  21:27:01
   Duration  13.76s (transform 0ms, setup 12ms, import 275ms, tests 11.95s, environment 0ms)


```
