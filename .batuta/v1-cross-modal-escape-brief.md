You are the implementation worker already delegated by Batuta. Edit directly. No further delegation, orchestration, git writes, worktrees, configuration, hooks, services or validation commands.
# Cross-family modal Escape containment — medium
## Goal
Complete the existing Dialog Escape-consumption protocol in Drawer and BottomSheet so one native Escape cannot dismiss an ancestor modal, and a consumer can cancel the original close request.
## Context
Read .batuta/v1-cross-modal-escape-diagnosis.md. Current DrawerPanel and BottomSheetPanel handleKeyDown call the original restOnKeyDown first but then call onClose unconditionally for Escape. DialogPanel already implements the desired local protocol: call consumer once, for Escape stopPropagation, and only dispatch close when !event.defaultPrevented (plus Dialog's existing closeOnEsc). CommandPalette deliberately preventDefaults its Escape; the two current parent owners ignore that. Reuse the current Dialog handler semantics directly, with no new shared helper or API.
Current native baseline resolves the real Child dialog and waits for its actual opening focus; Escape closes parent+child for mixed nested pairs, and the consumer/native preventDefault cases still dismiss. It includes Drawer/BottomSheet as both parent and child and CommandPalette children. These two owners are a coupled deliverable because their mutual nesting and child-origin cancellation must obey one event-consumption protocol in both directions. Pointer-only hit testing and sibling stack/inert ownership are separate pending tasks, not claims of this repair.
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
1. In BOTH current handleKeyDown owners, original root restOnKeyDown executes once with original currentTarget before component defaults. On Escape consume propagation at that modal boundary even if canceled or onClose is absent. Call onClose only when defaultPrevented is false. stopPropagation alone does not cancel local close. Already-prevented descendant Escape stays canceled. Non-Escape handling/propagation is unchanged. No synthetic event, cast or new option. Proof: exact colocated cancellation/propagation regression plus compiled native controller cases.
2. One Escape on Drawer/BottomSheet nested inside Dialog, each other, or with a CommandPalette descendant closes only the intended child; parent stays open. A nondismissible child still blocks ancestor Escape. Preserve current Dialog and CommandPalette source, controlled visibility, actual DOM focus/returnFocusTo, Tab trap, pointer-origin checks, SSR, motion/presence and scroll behavior. Tests use real native keyboard and actual child opening focus; do not manually focus an expected child/destination or invent new fixture semantics. Proof: current3engine native matrix, source suites and original-owner RED/restored GREEN.
3. Exactly5files below. Existing public APIs/classes/styles/exports/dependencies unchanged. English React patch changeset. Controller types/lint/format/build/docgen and size measurement; existing11React/1Alpine overages remain pending with no limit/hash edits. No source skips/only or weakened old assertions; preserve every existing test.
## Boundaries
No Dialog/CommandPalette/Alpine/shared owner/styles/dependency/exports/config/WORK/.batuta edits. Do not change initial focus, inert/sibling management, modal API or return-focus logic. No hooks/settings/ignores including .impeccable; no Colima/Docker/services/remote/commits/git writes including stash/reset/restore/checkout or package managers/tests/validation. Only formatter exception below.
## Scope
packages/react/src/drawer/drawer.tsx
packages/react/src/drawer/drawer.browser.test.tsx
packages/react/src/bottom-sheet/bottom-sheet.tsx
packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx
.changeset/modal-escape-consumption.md
Do not change anything outside this list; stop and report if required.
## Expected evidence
Write regression before fix, then implement and report exact touched files. Controller owns all verification. The ONLY permitted execution is this scoped formatter edit (use the exact absolute pinned binary; do not use pnpm or unpinned node): /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs --write followed ONLY by scoped paths. Read-only rg/git diff are allowed; no tests/check commands. Print isolated BATUTA-PROGRESS n START before each criterion's edits; DONE only for proof actually run, never for controller-pending validation.
## Stop conditions
Source contradicts the described local protocol, fix needs another owner/API or unrelated change, same unexpected command fails twice, or validation cannot be specified. Stop/report with edits preserved; do not widen scope or change configuration.
