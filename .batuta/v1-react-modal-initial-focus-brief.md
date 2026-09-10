You are the implementation worker already delegated by Batuta. Edit directly in this worktree; no further orchestration/delegation/worktrees/commits/config/services/validation.
# React safe initial modal destination — high
## Goal
Implement the technically reviewed optional initialFocusTo contract in four incumbent React modals, correcting hidden-first unsafe entry with one private shared initial-focus module.
## Context
Exact design below is authoritative for this slice. Fresh native diagnosis .batuta/v1-modal-ownership-diagnosis.md:9hidden-first cases allfail under threeengines, separate from12inert and9removal failures. Source owners are four listedmodal .tsx files; existing portaled initial effects/raw selectors and CP onReady+RAF are the only entry owners to replace/compose. Existing returnFocusTo, Tab/Escape fixes and current presence/scroll/portal stay unchanged. BottomSheet's exported props come through BottomSheetBaseProps union, add the optional field there without changing naming/name requirement. All four props already flow through current root/subpath exports: no index edits. No public helper export, validation token, intent markers or hypothetical future metadata.
Use one private internal/use-initial-focus.ts module for shared initial eligibility/operation and minimal per-open effect state. Direct browser proof may live in its scoped test. No extra files or shared return/trap refactor. Existing helper use-return-focus.ts is eligibility reference read-only; panel-membership semantics differ, do not import a hook just for that filter. Domain reading/destructive meaning remains application-declared. Do not implement the later CreateWorkspace validation branch now.
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
1. Four public initialFocusTo?: () => HTMLElement | null options with exact JSDoc, CP inline ignored/documented. On actual opening prefer eligible declared current panel member, or named panel for invalid declaration; no-option defaults first genuinely eligible task control (CPsearch), thenpanel. RuntimeHTMLElement+sameDocument+connected/rendered/visible/enabledinclfieldset/nonhidden/noninert/nonariahidden; allow declared headingtabindex-1; exclude other modal/foreign/outside/body. No business text/color guessing. Resolverthrow: focuspanel then exactvalue propagation via existingcontext (CPRAF global, otherseffectReact). Proof directhelper and realconsumer browser cases; actualhidden-first mustfailunderoldsource. No general safe-role/metadata framework.
2. Resolve and capture exactly once per accepted entry at existing portaled owner timing; no rerender/callbackidentity/openfalse/SSR/exit/destroy replay. Latest committed callback used nextcycle; speculative render cannot overwrite current choice. CP onReady/reset thenownedRAF kept, capture immediately beforeactualfocus; pendingframecanceled onclose/destroy, not markedcompleteduntil execution. StrictMode rehearsal doesnot duplicate resolver and doesnot lose canceled firstRAF; fastclose/reopen usesfreshcapture. Preserve existing returnFocusTo/Tab/Escape/scroll/presence behavior. Proof colocatedbrowser/SSR lifecycle tests with real inputs and exactnodes, include ordinary immediate owners and deferredCP separately. No arbitrarysleep/forcedexpecteddestinationfocus or mocks of required realfocus.
3. Only scoped15product files; React minorchangeset for additiveoption. Existing inheritednative attributes/ref/classes/roles/names/controlledstate pass through; no prop leaked to DOM. Scope source cleanup only old initialselector/imports nowobsolete. GeneratedAPI onlycontrollerowner command. Controller types/lint/format/build/docgen/threeengine/native/negative/size proof required. Existing11React+1Alpineoverages not waived or hidden; no limits/hash/dependency changes. Docs immediatelyfollow, not in this runtime worker.
## Boundaries
No Alpine/othercomponents/useReturnFocus/useFocusTrap/usePresence/useScrollLock/Portal/index/styles/handoff/dependencies/lock/exportmap/config/WORK/.batuta changes. No package managers/tests/builds/validation/git writes/hooks/ignores/services/remote/Docker/Colima. No comments narrating obvious code, casts/suppressions to silence failures, globalmanager or arbitrarytimeout.
## Scope
packages/react/src/dialog/dialog.tsx
packages/react/src/dialog/dialog.browser.test.tsx
packages/react/src/dialog/dialog.ssr.test.ts
packages/react/src/drawer/drawer.tsx
packages/react/src/drawer/drawer.browser.test.tsx
packages/react/src/drawer/drawer.ssr.test.ts
packages/react/src/bottom-sheet/bottom-sheet.tsx
packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx
packages/react/src/bottom-sheet/bottom-sheet.ssr.test.ts
packages/react/src/command-palette/command-palette.tsx
packages/react/src/command-palette/command-palette.browser.test.tsx
packages/react/src/command-palette/command-palette.ssr.test.ts
packages/react/src/internal/use-initial-focus.ts
packages/react/src/internal/use-initial-focus.browser.test.tsx
.changeset/modal-initial-focus-destination.md
Controller-generated only afterbuild: tools/docgen/output/props.json, tools/docgen/output/llms.txt. Never edit them manually.
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Report exactpaths and unverifiedcontrollerchecks. Only permitted execution: /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write followed only by scoped source/test/changeset paths. No unpinnednode or package managers. Read-only rg/gitdiff allowed. For each acceptance criterion n, print isolated BATUTA-PROGRESS <n> START before edits; DONE only afterproofactuallypasses. Tests/builds/controller validation remain unrun by worker.
## Stop conditions
Source/design contradict; same unexpectedcommand fails twice; fix needs outside scope. Preserve work/report; do not broaden or replan. Full V1/inert/validation/dynamic ownership is not this task.

## Exact reviewed design
# React modal initial destination and safe entry
Status: technically reviewed incumbent implementation design. GLM initial3/3DONE with one accepted exception-context correction; bounded final3/3DONE/no findings, both guards unchanged. Controller authorized implementation within ongoing V1 completion. Authorized local incumbent V1 continuation; no separate human approval of this text claimed. Sources: original OF-MODAL initial-focus/ownership requirements, current native hidden-first9/9 failure, and GLM consultation with unchanged guard. This is a bounded slice of Task31, not full modal qualification.

## Public surface and responsibility
Add exactly initialFocusTo?: () => HTMLElement | null to existing DialogProps, DrawerProps, BottomSheetProps and CommandPaletteProps, preserving all other public fields/root/subpath exports. JSDoc: “Resolves the initial focus destination inside the modal on each accepted opening.” CommandPalette additionally documents “Ignored in inline mode.” It is a synchronous element resolver, not a selector or ref-owning provider. No new runtime dependencies, public exports for helpers, validation token, intent metadata or data attributes.
The application owns reading/destructive/validation meaning. For large reading content it must choose a named heading or panel; for destructive confirmation, its least destructive action; for an ordinary form, its intended task field. These are declarations of the normative context priorities, not guesses from label or CSS color. The callback only reads committed state and DOM refs; no focusing/mutation/asynchronous work. Lyra validates element eligibility and executes focus. A safe confirmation must not declare its destructive action. Documentation must demonstrate a cancel-first confirmation and a reading heading, and explicitly name the validation owner.

## Opening selection
No validation failure is inferred merely because existing markup has aria-invalid. Validation re-entry is a later explicit action by the form composition, particularly CreateWorkspaceDialog Task26; it is not an observer-driven refocus during arbitrary renders. This slice adds no unused validation branch. The initial helper will be reused by that owner when its lifecycle is implemented.
On each accepted opening of an eligible visible named modal panel:
- With a configured resolver, call it exactly once. If its result is an eligible member of this panel, focus that element. If null or ineligible, focus the named panel directly. A failed declaration provides no certified safe alternative action; the panel is the mandatory conservative fallback. Do not accidentally focus the first destructive button after a vanished Cancel reference.
- Without a configured resolver, use the first eligible existing task control in DOM order; CommandPalette retains its search input as the default. If none is eligible, focus the named panel. Ordinary no-option first-control behavior is preserved except unsafe candidates are skipped. Domain-specific reading/confirmation compositions require an appropriate declaration rather than relying on unknown first-control meaning.
- Focus uses ordinary focus() to preserve existing opening scroll behavior. The panel remains tabindex=-1. No warning strings.
- If the resolver throws, focus the eligible named panel, then rethrow the exact value from the owner’s existing execution context: Dialog/Drawer/BottomSheet effect errors use React error handling; CommandPalette’s preserved animation-frame callback reports an uncaught browser error, which does not enter a React error boundary. No swallowing or warning-only behavior. Subsequent error-boundary teardown for an effect error is ordinary React behavior; no automatic return-focus claim is made for that teardown.

## Eligibility and scope
One private shared initial-focus helper validates actual HTMLElement in panel.ownerDocument, connected, visible with rendered rectangles, enabled including disabled fieldsets, programmatically focusable, outside hidden/inert/aria-hidden ancestry. Hidden inputs and nonfocusable text are rejected. Declared tabindex=-1 heading/container is allowed. The panel itself is an eligible declared target and fallback.
Other target must be contained by panel and belong to this active modal panel: its closest role=dialog aria-modal=true ancestor must equal panel. This excludes a nested modal's descendants even if portaled into the parent panel; sibling portals outside the panel fail containment. A nonmodal descendant dialog has no aria-modal=true and remains part of the panel branch. Multi-portal logical child coordination is deliberately separateTask31b, not inferred here.
Default candidates preserve current selector intent while filtering every candidate, rather than choosing one raw match; negative tabindex-only non-task regions are declaration targets, not default sequential controls. Do not edit shared Tab or return-focus helpers in this slice.

## Per-owner commit points and exact lifetime
Dialog/Drawer/BottomSheet call the common initial-focus owner inside their existing portaled panel subtree, at the effect that currently captures opener and chooses first raw focusable. CommandPalette retains its existing onReady query reset and animation-frame entry timing; invoke the shared initial choice in that owned frame, not before search exists. Inline CommandPalette retains its existing search focus and never invokes initialFocusTo.
Capture the opener from panel.ownerDocument.activeElement immediately before first initial resolution/focus, once for this accepted opening. Reuse current captureOpener callback from useReturnFocus; no new capture listener. Track completed opening locally in the panel owner (or one small shared hook). Mark completion before calling consumer code. Accepted open=false resets completion; retained-exit reopening is a new opening. Effect cleanup only cancels the owner's pending frame/resources; it must not reset a completed opening during StrictMode rehearsal. A canceled frame has not completed opening and a subsequent valid setup must schedule it again.
Read only a committed resolver at the moment focus is executed. Callback identity changes during an already completed open cycle never rerun resolution/focus; next opening uses current callback. Aborted renders cannot replace committed state. Changes before CommandPalette's initial pending frame may cancel/reschedule that frame to use current committed callback, without duplicate initial resolution. No stale timer after close/unmount. Initially-open portal/hydration and StrictMode each resolve once per actual entry.

## Compatibility and proof
Additive option → React minor changeset, no version command. Existing controlled open/close API, refs, classes, DOM presentation, presence, trap, scroll, returnFocusTo and Escape remain. Only four modal source owners, shared private initial helper/hook as concretely briefed, colocated browser/SSR tests, generated catalogs and immediate docs/examples migration. No Alpine initial-focus parity claim; Alpine returnFocusTo is an independent verified slice.
Controller proof: three-engine current hidden-first9 cases now reach visible eligible next control; declared task field/reading heading/Cancel and null/detached/hidden/disabled/foreign/body/outside/nested-other-panel result exact target or panel, empty panel stays focused. Verify no-declaration default search for CP and inline resolver0. No initial resolver during SSR/closed/rerender/ignored close/exit/destroy; fresh callback nextcycle; retained-exit reopen; initiallyopen portal; StrictMode exactlyonce. Callback throw exact-object propagation after panel focus. Original source negative for hidden-first and newoption tests. Existing returnFocusTo/Tab/Escape/native regressions retained. Build/types/export/docgen/scopedlint/format and exact affected sizes, with no budget changes.

## Qualification boundary
This adds safe entry and the declaration channel. Validation failed-field/error-summary priority is executed by Task26's form lifecycle and later documented generic form composition, not claimed complete by opening tests. Background inertness, topmost/sibling/nested ownership, dynamic removal rescue and parent-child closure/transfer remain Task31b/c. All V1 ledger cells remain pending exact final packed Linux/React18/19/browser/SSR/AT evidence. No release, remote writes, services or Colima/Docker operations.
