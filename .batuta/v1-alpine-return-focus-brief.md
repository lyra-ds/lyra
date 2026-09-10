You are the implementation worker already delegated by Batuta. Edit directly; no further delegation/orchestration/worktrees/commits/git writes/config/hooks/services or validation commands.
# Alpine explicit modal return destination — high
## Goal
Implement the technically reviewed returnFocusTo option in the four current Alpine modal owners, with one private eligibility/focus helper and no new foundation or dependency.
## Context
Read .batuta/v1-alpine-return-focus-diagnosis.md and the exact design embedded below. Current six WebKit captured-pointer return failures are separate from now-verified nativeTab containment. Default plugin registrations and option type exports already forward the options; do not change index.ts or create factory exports. Existing React internal/use-return-focus.ts is the eligibility reference only: do not import React. Keep all existing focus-trap/presence/scroll/open watchers/destroy owners.
Public callback is initial configuration, resolved on accepted close to read current application state. It is NOT a new mutable data-state property or post-init test flag. Tests must pass it through actual factory initialization, using a consumer Alpine.data outer scope/function reference like the controller probe or supported x-data expression. Preserve old no-option keyboard capture coverage. The six old pointer restoration cases should use the new explicit option while preserving mouse input and exact target assertions, so old source still fails them; do not replace mouse with keyboard to claim the gap fixed.
## Conventions
Pinned Node24.18.0/pnpm11.13.1, TypeScript5.9.3, React functional components, Vitest Browser Mode+SSR. CSS-first .lyra-* styling; no CSS changes. All project docs English. Tests-after profile, but write regression from acceptance first. Only read/edit/report in this worker: all execution/validation belongs to controller. No suppression/config changes even if Stop hooks request them.
- Follow the project's existing state approach (props drilling, context,
  zustand, redux…).
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected.
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…).
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

Never:

- Class components in new code.
- A second state or styling library alongside the project's existing one.
- Conditional hooks.
- `any` in a TypeScript project — type props and returns explicitly.
- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow; no lockfile changes
  except from an allowed dependency.
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.
- Silence a signal instead of fixing its source (casts, empty catch blocks,
  sleeps, copy-paste to dodge the real fix) — the method line says how to
  mark an unavoidable workaround.

Test the behavior, never the mock.
A failing test means fix the code, not the test.
No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
## Acceptance criteria
1. Add exact optional returnFocusTo signature/JSDoc to the4existing option interfaces. On accepted close resolve once, prefer eligible explicit target with preventScroll:true; otherwise validate captured opener with the SAME full eligibility list and retain its plain focus() scroll behavior. Reject foreign-document/body/documentElement/closing panel or overlay/hidden/inert/aria-hidden/disabled including fieldsets/nonfocusable/unrendered targets. Allow valid tabindex=-1 workflow heading. Capture uses actual root/panel ownerDocument as a defined correction. Clearing the caller's opener record occurs BEFORE invoking the resolver/helper (or inside the helper if it explicitly owns that record), not after focus. No global pointer tracking, public selectors or extra export/API.
2. No resolver/focus on initial closed mount, opening, ignored close request, exit completion, destroy or inline CommandPalette. Preserve single watcher transition ownership, current trap/scroll/presence order, captured fallback for eligible keyboard openers and fresh capture after reopen. Resolver errors propagate into Alpine normal error handling; no catch/log/warning additions. Prove thrown object/no focus at helper layer and cleared opener at the integration owner if the helper has no mutable record. Cover resolver reopening during close with exact once-counts and subsequent independent close. All controller native24explicit trigger/successor cases must pass; preserve Task25nativeTab behavior and close six known source pointer-return failures through the real new option.
3. Runtime changes only four owners plus one private helper. Add direct helper and colocated browser regressions; preserve all unrelated assertions and no skips/sleeps/forced expected-destinationfocus. Public optional feature uses an Alpine minor changeset. Controller owns types/format/build/generatedcatalog/exports/threeengine/native/negative/size proof. Alpine21394/21200B already fails budget; no limit/hash/dependency changes. Public docs follow in a separate immediate task; do not edit MDX here.
## Boundaries
No React/focus-trap/presence/scroll/index/other components/styles/dependencies/export maps/config/WORK/.batuta edits. No new warning strings, pointer listener, selector API, registration, reactive callback-replacement API or general layer manager. No Colima/Docker/foreign services/remote/package managers/tests/validation/git writes/hooks/ignores/settings including .impeccable. Never edit generated outputs manually.
## Scope
packages/alpine/src/dialog.ts
packages/alpine/src/dialog.browser.test.ts
packages/alpine/src/drawer.ts
packages/alpine/src/drawer.browser.test.ts
packages/alpine/src/bottom-sheet.ts
packages/alpine/src/bottom-sheet.browser.test.ts
packages/alpine/src/command-palette.ts
packages/alpine/src/command-palette.browser.test.ts
packages/alpine/src/internal/return-focus.ts
packages/alpine/src/internal/return-focus.browser.test.ts
.changeset/alpine-modal-return-destination.md
Controller-generated scope only after build: tools/docgen/output/alpine-props.json, tools/docgen/output/alpine-llms.txt. Worker must not write these.
Do not change anything else; stop/report if needed.
## Expected evidence
Write meaningful regressions before implementation and report exact changed files/unverified items. Do not run validation. Only allowed execution is the scoped formatter edit with exact pinned binary: /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write followed ONLY by scoped source/test/changeset paths. Do not substitute pnpm or unpinned node. Read-only rg/git diff allowed. Print isolated BATUTA-PROGRESS n START before each criterion's edits, DONE only for proof actually run; controller checks remain unrun by worker.
## Stop conditions
Source contradicts the reviewed design, public types/factory export or another owner must change, same unexpected command fails twice, or a dependency/config suppression seems necessary. Stop/report with changes preserved; do not broaden scope.

## Exact reviewed design
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
