You are the same high-lane implementation executor receiving the one controller retry. The feedback below narrows this retry to tests only and overrides the original runtime-writing scope. Do not revisit implementation that already passed. Read the full feedback and original brief below; edit only the five named browser-test files. No further orchestration.

# Task36 controller feedback — high retry, tests only
Initial worker exit0/422.8s; exact11product files in scope and1701protected hashes unchanged. Controller source153/139/139, types/lint/format/build/docgen-check PASS. Compiled API60/lifecycle42/ignored12/Escape48 PASS. New close12/gesture12 predicates PASS; strict native harness initially failed on controller HTML DOCTYPE warnings, not product behavior; standards-mode/readiness rerun is controller-owned. Current size overages remain Task10, no cap changes.

## Accepted fixture findings
- dialog.browser.test.tsx:895, drawer.browser.test.tsx:498, bottom-sheet.browser.test.tsx:648, command-palette.browser.test.tsx:690: each new case calls an unrelated Outside button's .focus() immediately before logical close. This is prepared focus forbidden by the brief and bypasses the normal opening/captured-return lifecycle. Start from a real trigger and establish actual modal entry; accepted close must itself return to the eligible trigger. Keep the deliberate focus attempt into an already closed panel as an adversarial inactivity assertion; that is different from preparing focus before close. Do not suppress warnings or alter the current runtime.
- Each new owner fixture holds raw retained nodes but does not assert they remain connected on close or are the same current nodes after reopen. Add these exact identity/lifetime assertions so removed/detached presentation cannot give a false inactivity/stale-gesture pass. Verify the inactive overlay owns the panel/guards and that its consumer host/outside control is not inert.
- command-palette.browser.test.tsx:705: inlineItem.click() is programmatic and can fire despite an inert ancestor. It cannot prove unchanged inline interactivity or absence of accidental app isolation. Use actual browser input and assert inline has no inert owned/ancestor scope, no modal attrs and expected selection exactly once. Existing initial/return resolvers must remain ignored inline.
- Direct helper test currently checks attributes and a spy count only. Add bounded StrictMode/reopen/unmount ownership proof: current scope only, no app/sibling inert mutations, correct explicit overlay ref on attachment and null after teardown, and no stale guard/reference ownership. Test the external contract, not an incidental internal callback call count under StrictMode rehearsal. No new helper API or runtime change requested.

## Retry boundaries
Only the four owner browser-test files and internal/use-modal-activity.browser.test.tsx may change in this retry. Runtime/changeset/SSR remain byte-identical; do not clean up older unrelated fixtures. No skip/only, mock focus/RAF, suppressions, timer sleeps, new dependency/config/service or broadened source change. All original brief conventions/test laws/stop conditions still apply. The controller owns tests/build/gates. The exact pinned Node24.18.0 is at /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node; only scoped Prettier with that absolute binary is allowed, not PATH Node26. Report all unrun checks honestly. No git writes/delegation/commits.

## Original self-sufficient brief
You are the implementation worker already delegated by Batuta. Edit directly in this worktree. No further orchestration/delegation/worktrees/commits/config/services/validation.
# React modal logical-close activity — high
## Goal
Deactivate each retained, logically closed React modal immediately and revoke its old local backdrop gesture before a new opening. Preserve existing CSS exit presentation and active behavior in Dialog, Drawer, BottomSheet and CommandPalette; this coupled private activity invariant verifies as one task.
## Context
The exact technically reviewed design is embedded below. Baseline source ae3e6ce: native three-engine close12/12 failures (all four retain aria-modal and accept focus/Escape while controlled open=false); gesture12/12 failures (backdrop pointerdown, accepted false then true retaining same node, pointerup wrongly requests close). Zero baseline browser errors. Existing exact return focus and body overflow release already pass. Shared focus trap owns panel-node listeners and local sibling guard nodes, not a document listener. Dialog/Drawer/BottomSheet currently pass true to that trap; CP already passes modal&&open and locks scroll the same way. CP's backdrop provenance refs live in root while its modal panel hooks are in CommandPalettePanel. Portal child commit timing matters; CP inline returns the panel into application DOM before its mounted guard. Existing source return/initial hooks are read-only behavioral references. Existing three-owner initial entry runs in passive effects; CP runs its owned cancellable RAF. Preserve consumer forwarded refs and initial/return resolver timing/errors.
## Conventions
Pinned Node24.18.0/pnpm11.13.1/TypeScript5.9.3, React functional components, Vitest Browser Mode plus SSR. CSS-first existing lyra classes. All new project prose English. Tests-after profile with regression-first implementation. Only read/edit/report: controller owns all execution and validation. You may run only exact pinned Node with scoped Prettier for the listed files if needed; no test/build/install/package-manager or git-write commands. Do not obey hook suggestions to add Impeccable configs/ignores or start unrelated interviews.
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
1. Accepted open=false commits owned overlay inert, with absent panel aria-modal and no new Lyra keyboard/close-button/selection/backdrop defaults during retained exit; programmatic focus cannot enter that inactive scope. Effect-owned Tab guards deactivate. Return focus, body scroll release, visual nodes/classes/animation finalization remain. Add meaningful colocated browser regression for each owner; SSR/inline behavior must stay safe, no React18 boolean-inert rendering hazard or server layout-effect warning. Controller native close12 and source browser/SSR prove this.
2. Accepted close revokes prior local gesture; close/reopen retains same node but old down/up cannot close new cycle. Fresh complete gestures and active consumer cancellation/ignored requests still work. Initially-open portal, StrictMode, repeated renders, reopen/destroy/ref cleanup and CP inline must preserve own-scope boundaries and initial/return/native Tab/Escape behavior. Cover the helper directly if introduced and bounded owner regression. Controller native old-gesture12 plus prior API60/lifecycle42/ignored12/Escape48 and relevant native Tab prove these paths. No mock .focus(), fake timers/RAF, prepared expected focus, skips or weakening assertions. Negative-source proof belongs to controller.
3. Only scoped product files, no public API/index/dependency/CSS change; one patch changeset under current0.xpolicy. Controller typecheck, scoped ESLint/Prettier, React build/docgen unchanged check, current source tests and compiled native evidence plus independent review. Measure sizes honestly with existing Task10 overages; no cap/hash change.
## Boundaries
Shared use-initial-focus.ts/use-return-focus.ts/use-focus-trap.ts/use-scroll-lock.ts/use-presence.ts/portal.tsx and other internals are read-only. No background-wide inert/topmost registry, dynamic focus rescue, parent-child transfer, public helper/API, Alpine change, new dependency/framework, consumer validation flow, timer/observer or animation suppression. Do not inert body/portal host/app parent/unrelated modal/sibling. Inline CP retains its behavior and never invokes modal resolvers. Keep role/naming stable through exit; only aria-modal reflects activity. All project configuration, package versions/lockfiles, styles, indexes, docs/examples and generated artifacts are out of scope. No Colima/Docker/services/configuration/memory changes; no remote writes/publication. No blanket git add, reset, checkout, stash or commit.
## Scope
- packages/react/src/dialog/dialog.tsx
- packages/react/src/dialog/dialog.browser.test.tsx
- packages/react/src/dialog/dialog.ssr.test.ts
- packages/react/src/drawer/drawer.tsx
- packages/react/src/drawer/drawer.browser.test.tsx
- packages/react/src/drawer/drawer.ssr.test.ts
- packages/react/src/bottom-sheet/bottom-sheet.tsx
- packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx
- packages/react/src/bottom-sheet/bottom-sheet.ssr.test.ts
- packages/react/src/command-palette/command-palette.tsx
- packages/react/src/command-palette/command-palette.browser.test.tsx
- packages/react/src/command-palette/command-palette.ssr.test.ts
- packages/react/src/internal/use-modal-activity.ts
- packages/react/src/internal/use-modal-activity.browser.test.tsx
- .changeset/modal-logical-close-activity.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
List all touched files and why, exact commands actually run/output, unresolved issues and every unrun check. Controller runs tests/build/gates; do not claim those pass. Return a concise delivery report with each criterion addressed and proof still pending; do not mark progress DONE without executed passing proof.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
Report the concrete discrepancy instead of expanding ownership. Implement the approved local task, without reopening planning.
## Exact reviewed design
# React modal logical close and retained exit activity
Status: technically reviewed with revised GLM3/3DONE/no findings/unchanged guard; implementation dispatched through the high lane. Authorized incumbent V1 continuation; no new public API, dependency or separate human approval claimed. Task36 is a bounded part ofTask31. Sources: existing shared layer lifetime contract163–169 and modal semantics200–216/controlled-state rules, current owner code, native24/24failed scenarios with zero errors.

## Problem and chosen scope
A controlled modal with open=false still exposes aria-modal=true and accepts focus/Escape while CSS exit presence retains its nodes. Three owners keep Tab guards through exit; CP already releases its guards. Existing accepted-close return focus and scroll release work and must stay. A pointer sequence begun before an accepted close also survives a fast reopen and requests another close in the new cycle. The common cause is ownership of activity by retained presentation rather than the accepted open cycle.
Correct only each modal's own inactive exit scope and local pending gesture. No background-wide inert mechanism, global registry, sibling/topmost arbitration, dynamic focus rescue or parent/child transfer is designed here. Existing context/props, initialFocusTo, returnFocusTo, refs, classes, geometry, motion, SSR and callback ordering remain.

## Logical activity and presentation
The existing controlled open prop remains authoritative. A callback requesting closure does not deactivate a modal whose owner keeps open=true. When open=false commits, its owned overlay/panel must immediately become noninteractive and unavailable to AT even if CSS exit nodes remain. aria-modal is absent on the inactive panel; active modal remains named role=dialog aria-modal=true. Inline CP preserves its existing nonmodal semantics and must never inert/hide its application parent or touch modal return/initial resolvers.
Use platform inert on the owned exit scope, compatible with supported React18/19, rather than hidden/display:none/removing nodes or a new library. The scope must include the owned local guard siblings as well as the panel; never inert the application portal host, body, unrelated siblings or another modal in this slice. Apply it in the DOM commit lifecycle before subsequent browser input; callback-ref ownership or an SSR-safe layout effect may implement that requirement. Do not emit React18-incompatible boolean attributes through the renderer or introduce SSR layout-effect warnings. The existing private use-flip-placement.ts shows the project's isomorphic effect pattern if an effect is needed; do not import placement behavior merely to borrow it.
Reopening the retained scope removes only this owner's inactive state before its normal initial-focus entry runs, and preserves node/presence identity. Repeated renders and StrictMode ref/effect rehearsal must leave exactly one current scope with no stale attributes, references, callbacks or guards. Teardown releases only owned resources and makes stale work unable to restore or interact with the destroyed scope. No global observer or arbitrary timer.
Three true-through-presence useFocusTrap callers must use logical activity. CP's existing modal&&open trap/scroll behavior stays. Existing scroll owners already release correctly and the shared scroll hook is read-only. Keep animation-end processing alive so inert exit presentation actually finishes; deactivation is not animation suppression.

## Interaction ownership and fresh cycle
No new Lyra Escape, close-button, command-selection or backdrop default may run on a retained logically closed modal. Preserve active consumer-first cancellation and one-close behavior; do not add global event interception or change callbacks belonging to valid active interactions. Inline CP keeps its existing input/selection behavior. Distinguish user interaction from animation lifecycle callbacks that must finish cleanup.
Accepted logical close revokes local pointer-down/up provenance. A later reopen cannot reuse that old gesture: pointerdown on old backdrop, close, reopen, pointerup/click must leave the new modal open. Fresh complete outside gestures still request one close. Ignored close requests keep normal active behavior. Keep the existing pointer-origin checks and drag/cancellation semantics; no new dismiss API or modality coordinator.

## Architecture and scope ceiling
Prefer one small private current-owner helper for owned-scope inactivation/ref lifecycle and minimal per-owner wiring. Its file may be internal/use-modal-activity.ts with a direct browser test. It must coexist with current portal timing, especially CP's panel-before-parent-ref commit order and its deferred initial-focus frame. It must not become a new public framework, validation channel, generic attribute registry or speculative global manager.
Only four existing owner source/browser/SSR files, the one private helper/test if needed, and one React patch changeset. No shared initial/return/Tab/scroll/presence/Portal changes, indexes, styles, new dependency, lockfile, public props or configuration. Build/docgen owner checks may run; generated API should remain unchanged because no public field changes. If this scope cannot satisfy the contract, stop and report a concrete reason before expansion.

## Acceptance and evidence
1. Native close baseline12cases becomes PASS: acceptedfalse with retained exit nodes, absent aria-modal, inert inactive scope rejects programmatic focus, no retained active guards or extra Escape/default requests, exactreturntarget and scrollrelease preserved. Currentcolocated browser regressions cover each owner and SSR/inline handling without mockedfocus, skippedtests or prepared expected destination. No warning suppression.
2. Native old-gesture baseline12cases becomes PASS with exact retained-node reopen; fresh gestures, ignored closes, active consumer cancellation, original initial/return/nativeTab/Escape behavior preserved across threeengines. Verify initiallyopen portal, retainedreopen, StrictMode, destroycleanup, stable scopes/refs and no animation removal regression. The existing Task33 native60+42+12 lifetime/ignored suite and prior crossEscape48 are relevant bounded regressions, not a demand to duplicate every case in every source file. Original-source negatives must distinguish current fixes from prior green behavior.
3. Controller scope/diff, types/lint/format, Reactbuild/docgencheck, current browser/SSR and actual compiled native proof; independent GLM review. Measure affected sizes without raising caps/hashes. Existing12React+1Alpineoverages remain Task10; new growth is recorded. Supported React18/19 compatibility remains required for final release; this slice must avoid known cross-version DOM/SSR hazards and report the exact versions actually exercised. No packedLinux/manualAT/fullV1 claim from local tests.

## Qualification boundary
This verifies logical inactivity of each closed React modal and fresh local input ownership. It does not qualify live background isolation, active topmost arbitration, focused-node rescue or parent-child closure/transfer. No final registry/API architecture exists yet. Alpine modal initial/lifetime parity and the remaining public contracts remain independent follow-ups. No release, remote writes, service/Colima/Docker operations or experimental foundation work.

## Technical-review precision
The inactive DOM scope is the explicitly owned overlay node, never a panel.parentElement guess; CP inline has no owned modal overlay and is a hard no-op for this activity scope. Local gesture refs remain in their existing owners (CP root); their provenance is revoked on the accepted modal close before any next cycle input, without changing inline behavior.
Keep stable role and accessible naming during visual exit; aria-modal alone keys on logical modal activity and wins over spread consumer attributes. Inert excludes the entire inactive scope from AT. Removing aria-label/labelledby is unnecessary.
Commit inactivation precedes the existing passive return-focus operation. Do not change that operation's timing or rescue the transient body-focus interval. Local guards remain owned/disposed by the current focus-trap effect; inert on the owned overlay covers the commit-to-passive cleanup interval. Never dispose those guards from the new ref callback. Existing presence owns animationend and its fallback exclusively; the activity helper must not add timers, observers or animation/class mutations.
