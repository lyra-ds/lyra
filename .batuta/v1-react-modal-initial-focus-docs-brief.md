You are the implementation worker already delegated by Batuta. Edit directly; no further orchestration/delegation/worktrees/commits/config/services/validation.
# React initial focus — public examples and documentation
## Goal
Publish the reviewed optional initialFocusTo contract using two existing live examples and React sections of eight existing MDX pages.
## Context
Runtime Task33 must be verified before this brief is dispatched. The exact contract is appended below; source names and example assignments were discovered by a read-only GLM scout and checked by the controller. Existing DialogBasic is a confirmation with Cancel and Delete footer buttons, both of which only dismiss. Existing DrawerWithoutFooter is read-only activity text. CommandPalette trigger example naturally enters search and stays unchanged. Root/subpath public types and generated API already include the option after controller generation. Keep existing returnFocusTo composition and successor logic. Drawer does expose a public panel ref; a named reading heading is chosen to demonstrate application intent, not work around missing ref support.
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
1. DialogBasic declares its existing least-destructive Cancel button as initialFocusTo using a current typed ref; current trigger/return-focus and dismissal behavior retained. DrawerWithoutFooter declares a named native heading with tabIndex=-1/current typed ref for reading entry and keeps its read-only purpose, no footer. Exactly two live examples changed. No fabricated deletion/success/network state, no additional examples or new CSS. Controller compiles/types/lints and exercises actual examples in three engines: unprepared mouse opening reaches exact Cancel/heading and accepted Escape returns to existing trigger. Existing palette example is a control for natural search.
2. Eight current MDX React sections describe optional () => HTMLElement | null, synchronous read-only resolver once per accepted opening, current eligible panel member, invalid/null -> named panel directly, omitted -> eligible task control (palette search) then panel. Document application-owned Cancel/reading/field choice, negative-tabindex reading targets, visibility/enabled/same-document/panel membership, no resolver replay on rerenders, inline palette ignores it. Form composition owns focus after failed validation; initial entry does not infer validation failure from aria-invalid. Mention thrown errors focus panel then propagate (palette animation-frame errors use browser handling); no swallowing/warning promise. Keep prose concise, English in both locales. Correct existing unconditional first-focus claims. Add Cancel choice to the existing DeleteProject React snippet so it matches confirmation guidance; preserve its return target logic and honest dismiss-only example. Explain both changed live examples in existing prose; no new MDX examples. Controller compiles exact MDX, validates snippet syntax and live behavior; API table remains generated.
3. Only ten scoped paths, all edits in MDX before the Alpine stack. Alpine/Blade portions byte-identical; unrelated examples, services/runtime/styles/deps/catalogs/config untouched. Pinned scoped format/types/lint/docs stack checks and independent review required; actual changed examples exercised by controller. No full qualification or library size change claimed; this docs slice adds no shipped library runtime.
## Boundaries
No runtime/library/tests/styles/layout/config/dependency/lock/generated catalogs/WORK/.batuta modifications. No package managers/builds/tests/git writes/hooks/ignores/services/remote/Docker/Colima. No visible implementation task IDs or unnecessary duplicated API tables. No permission interview; existing authorized local documentation scope.
## Scope
apps/docs/components/examples/dialog/basic.tsx
apps/docs/components/examples/drawer/without-footer.tsx
apps/docs/content/docs/en/components/dialog.mdx
apps/docs/content/docs/en/components/drawer.mdx
apps/docs/content/docs/en/components/bottom-sheet.mdx
apps/docs/content/docs/en/components/command-palette.mdx
apps/docs/content/docs/pt-BR/components/dialog.mdx
apps/docs/content/docs/pt-BR/components/drawer.mdx
apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx
apps/docs/content/docs/pt-BR/components/command-palette.mdx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Only read/edit/report. The sole allowed execution is /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write followed by scoped paths. Report exact paths and controller checks not run. For each acceptance criterion n, print isolated BATUTA-PROGRESS <n> START before edits and DONE only after proof passes; controller owns validation.
## Stop conditions
Source/design contradicts; same unexpected command fails twice; completion needs outside scope. Preserve and report without broadening. No new UI component or configuration.
## Exact reviewed contract
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
Current0.x additive option → React patch changeset under VERSIONING.md:20–37, no version command. Existing controlled open/close API, refs, classes, DOM presentation, presence, trap, scroll, returnFocusTo and Escape remain. Only four modal source owners, shared private initial helper/hook as concretely briefed, colocated browser/SSR tests, generated catalogs and immediate docs/examples migration. No Alpine initial-focus parity claim; Alpine returnFocusTo is an independent verified slice.
Controller proof: three-engine current hidden-first9 cases now reach visible eligible next control; declared task field/reading heading/Cancel and null/detached/hidden/disabled/foreign/body/outside/nested-other-panel result exact target or panel, empty panel stays focused. Verify no-declaration default search for CP and inline resolver0. No initial resolver during SSR/closed/rerender/ignored close/exit/destroy; fresh callback nextcycle; retained-exit reopen; initiallyopen portal; StrictMode exactlyonce. Callback throw exact-object propagation after panel focus. Original source negative for hidden-first and newoption tests. Existing returnFocusTo/Tab/Escape/native regressions retained. Build/types/export/docgen/scopedlint/format and exact affected sizes, with no budget changes.

## Qualification boundary
This adds safe entry and the declaration channel. Validation failed-field/error-summary priority is executed by Task26's form lifecycle and later documented generic form composition, not claimed complete by opening tests. Background inertness, topmost/sibling/nested ownership, dynamic removal rescue and parent-child closure/transfer remain Task31b/c. All V1 ledger cells remain pending exact final packed Linux/React18/19/browser/SSR/AT evidence. No release, remote writes, services or Colima/Docker operations.

## Controller precision corrections at implementation review
The final independent review accepts patch metadata under the existing0.x convention; original design-review snapshots preserve the earlier minor wording. CommandPalette modal panel is explicitly tabindex=-1 and handles unconsumed Escape so that the new declared/panel fallback remains keyboard dismissible; input Escape is not duplicated. These bounded corrections were included in final runtime review and controller native proof, with no new public option or shared owner change.
