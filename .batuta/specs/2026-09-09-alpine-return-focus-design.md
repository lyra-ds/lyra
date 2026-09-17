# Alpine modal return destination — incumbent API design

Status: Task30 incumbent implementation design; independent GLM final3/3 DONE with unchanged guard after one revision. Controller accepted the design within the user-authorized V1 completion scope. No separate human review of this exact text is claimed. The user authorized completion of the incumbent V1; this additive adapter design follows the already approved React returnFocusTo ownership split. It does not introduce another modal foundation or claim full cross-stack parity.

## Problem, ownership and bounded scope

Current Dialog, Drawer, BottomSheet and modal CommandPalette capture document.activeElement and later focus that value. WebKit pointer activation of an implicit button can blur it before Alpine observes open=true. Task25 proved six pre-existing source return failures and a compiled implicit-pointer failure while keyboard/explicit-stop openings returned correctly. The binding cannot infer the invoking application control after that blur. Applications also cannot declare a replacement or meaningful workflow destination when the original control disappears.

The invoking application chooses the destination; Lyra resolves it at accepted close, checks eligibility and performs one focus operation. Keep each existing open watcher, capture, presence, focus trap, scroll and destroy owner. Extract only duplicated return-target eligibility/operation into one private Alpine helper, shared by all four current restoreOpener methods. No document-wide pointer tracker, event bus, selector API, provider, framework or dependency.

## Complete affected option interfaces

The following root-exported option interfaces retain all existing fields and add exactly one optional callback. Referenced CommandPalette item/group/hint types remain unchanged. Component factory functions are internal; they are NOT new package exports. Existing plugin registrations and root export map remain unchanged.

```ts
export interface LyraDialogOptions {
  defaultOpen?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  labelId?: string;
  /** Resolves the current logical focus destination after an accepted modal close. */
  returnFocusTo?: () => HTMLElement | null;
}

export interface LyraDrawerOptions {
  defaultOpen?: boolean;
  labelId?: string;
  /** Resolves the current logical focus destination after an accepted modal close. */
  returnFocusTo?: () => HTMLElement | null;
}

export interface LyraBottomSheetOptions {
  /** Whether the sheet starts open. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Resolves the current logical focus destination after an accepted modal close. */
  returnFocusTo?: () => HTMLElement | null;
}

export interface LyraCommandPaletteOptions {
  /** Command groups rendered through nested consumer `x-for` templates. Default: `[]`. */
  groups?: LyraCommandPaletteGroup[];
  /** Overlay visibility; modelable with `x-modelable="open"`. Ignored in inline mode. */
  open?: boolean;
  /** Search input placeholder. Default: `"Type a command or search…"`. */
  placeholder?: string;
  /** Text shown before a quoted unmatched query. Default: `"No results for"`. */
  emptyMessage?: string;
  /** Accessible search-input name. Default: `"Search commands"`. */
  searchLabel?: string;
  /** Partial override for footer hint labels. */
  hints?: LyraCommandPaletteHints;
  /** Command/Ctrl key used to toggle the overlay. Falsy disables it. Default: `"k"`. */
  hotkey?: string | false;
  /** Render only the panel, without modal behavior. Default: `false`. */
  inline?: boolean;
  /** Accessible dialog name in overlay mode. Default: `"Command palette"`. */
  label?: string;
  /** Resolves the current logical focus destination after an accepted modal close. */
  returnFocusTo?: () => HTMLElement | null;
}
```

The option callback is supplied when the Alpine data factory is initialized, like its other initial options. It is resolved on close and should read current DOM references and application state; it is never evaluated during initialization, opening, SSR or destruction. No reactive replacement-callback public API is added. CommandPalette inline mode ignores the option and never resolves or captures modal return focus.

## Resolution and lifecycle

1. Preserve current accepted-opening capture timing for this slice. Define capture in the actual component root/panel ownerDocument rather than global document; this is an intentional correction for components in another document, not a claim that the old cross-document behavior is preserved. Initial-focus target policy is a separate owner task.
2. On the existing accepted open-to-closed watcher transition, preserve current trap/presence/scroll ordering. Clear the captured opener record before resolving/focusing so reentrant application work cannot replay the old capture. A request that leaves open=true does not restore; initially closed state, rerender, exit completion and destroy do not restore or call the resolver.
3. Resolve the configured callback once. Prefer that result if eligible; otherwise try the captured opener. BOTH the explicit result and the captured-opener fallback pass the identical complete eligibility list. This intentionally narrows today's unconditional focus attempts on unsafe captured elements; it does not preserve that unsafe outcome. The target must be an HTMLElement in the same ownerDocument, connected, programmatically focusable, visible with rendered rectangles, enabled including a disabled-fieldset relationship, outside hidden/inert/aria-hidden ancestry, and outside this closing panel/overlay. Exclude body/documentElement and hidden inputs. Explicit valid tabindex=-1 on a named heading/region is an eligible programmatic successor. Reuse the proven React eligibility rules as source reference, without importing React.
4. Focus the selected target once. Use focus({ preventScroll: true }) for an eligible explicit resolver target, matching the declared-destination contract. For the eligible captured-opener fallback, retain plain focus() so existing no-option scroll-into-view behavior remains unchanged. This scroll distinction is intentional and must be tested. A null or ineligible explicit result permits the eligible captured opener fallback. If neither is eligible, do not focus an unsafe element or invent a generic workflow destination. This is an application contract failure, not successful return qualification; documentation requires a meaningful current successor. Do not catch or separately log a throwing resolver: propagate the exception into Alpine's normal error handling after the existing close cleanup has run. A direct helper regression must prove the thrown object is preserved, the opener record was cleared and no target focus occurred. Do not add development warnings or warning strings when neither candidate is eligible; documentation and exact acceptance tests own that application contract failure.
5. Add a resolver-reopens-during-close case: resolution/focus happen once for that accepted close, the new open captures independently, and a subsequent close resolves once again without replaying the former capture. Closing and reopening starts a fresh capture; later destroy/animation callbacks cannot repeat restoration. Keep existing no-restore-on-destroy behavior. Nested return targets may be in the parent modal when outside the closing child overlay and otherwise eligible. Inert/topmost/child-transfer semantics remain Task31, not a new claim here.

## Registration, examples and fallback

Existing x-data names stay lyraDialog, lyraDrawer, lyraBottomSheet and lyraCommandPalette. Bind targets, events, bubbling, IDs, classes and consumer-served ARIA remain unchanged. There is no new creation or before-close event and no change to modelable open. Example callback registration must use the public default Lyra plugin plus ordinary consumer Alpine.data state, not import the internal component factories.

```js
import Alpine from 'alpinejs';
import lyra from '@lyra-ds/alpine';
Alpine.plugin(lyra);
Alpine.data('modalWorkflow', () => {
  const workflow = {
    canReturnToTrigger: true,
    returnTarget: () => {
      const heading = document.getElementById('workflow-heading');
      return workflow.canReturnToTrigger
        ? (document.getElementById('open-details') ?? heading)
        : heading;
    },
  };
  return workflow;
});
Alpine.start();
```

The outer workflow owns availability and changes it when disabling, hiding, retiring or replacing the trigger. Inside x-data="modalWorkflow", initialize the existing binding with x-data="lyraDialog({ returnFocusTo: returnTarget })"; the same option works in the other three modal registrations. Keep a named heading with id="workflow-heading" and tabindex="-1" outside the closing overlay. A stable trigger example may simply return the trigger; the successor example must show current availability, not rely on a non-null but disabled ref. Public documentation will include the full supported markup and run it in real browsers. Without JS, current server-owned markup/fallback behavior remains unchanged; no claim that adding this callback makes modal enhancement available without initialization.

## Compatibility, accessibility and visual scope

Optional additive callback, no removal or required markup change. Use an Alpine minor changeset; do not run versioning or publish. Existing no-option captured-focus behavior remains for eligible keyboard-owned openers. The six old pointer-fixture failures must be exercised with the new explicit return option, preserving exact target assertions and adding a no-option keyboard regression; do not silently replace mouse input with keyboard to claim the gap fixed. New tests must show that the old source ignores the option and fails the explicit-pointer contract.

The same DOM focus target supports keyboard, pointer, touch and AT return; no new visual variants, classes, translations or motion are introduced. Existing CSS/RTL/reflow/forced-colors/reduced-motion behavior is retained. Error/async/cancellation behavior outside this synchronous focus option is unchanged. Do not change package dependencies, immutable evidence or bundle limits. Alpine currently measures21394/21200B; additional delta and exact final packed qualification remain Task10 gates.

## Execution and acceptance

Runtime slice: four existing Alpine source owners and their colocated browser tests, one private return-focus helper with direct browser regressions, and one minor changeset. Public docs/generated catalog follow immediately as their own verified task; all eight en/pt-BR modal pages are candidates only where Alpine guidance needs updating. Newly written prose is English. Regenerate Alpine catalog with the built package through tools/docgen/alpine.mjs; do not edit generated output by hand. Do not modify index exports or claim factory exports.

Controller proof: four families × three engines with actual unprepared pointer opening and explicit resolver, fresh target/successor after removing or disabling the opener, exact resolver/focus once-counts, null/invalid resolver fallback through the SAME eligibility rules, captured fallback retaining native scroll-into-view, explicit target retaining preventScroll:true, throwing-resolver propagation/no-focus, controlled close acceptance, reentrant resolver reopening with exact once-counts, close/reopen, initially closed/destroy/inline no-calls. Shared helper tests cover hidden/inert/aria-hidden/disabled-fieldset/foreign-document/closing-panel/body rejection and tabindex=-1 successor. Negative old-source regression must fail and restored code pass. Three-engine modal source suites must close the six diagnosed return failures without changing unrelated assertions; types/build/catalog/format/public exports and actual documentation examples must pass. No release cell is marked qualified from local source proof alone.
