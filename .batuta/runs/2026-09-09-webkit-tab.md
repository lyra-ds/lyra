# Run — native modal Tab containment

**Date:** 2026-09-09 · **Lane:** frontend/high, then critical completion
**Executor:** Codex gpt-5.6-terra (high reasoning), then controller
**Commit:** f9cb9d2 · **Verdict:** ✅ approved

## Brief as dispatched

# WebKit modal Tab containment

## Goal
Prevent Tab/Shift+Tab from leaving an active modal when WebKit skips native button stops. Preserve native intermediate navigation; repair the shared focus owner without new dependencies or a layer framework.

## Context
You are the implementation executor already delegated by Batuta. Implement directly; no recursive delegation, Superpowers, workflow approval or commit. Worktree /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization, branch feat/v1-incumbent-stabilization, base6e166ec. Controller-owned WORK/.batuta records and temporary root/React node_modules links must be preserved.
Known owner packages/react/src/internal/use-focus-trap.ts. It queries visible eligible candidates and handles only panel/zero-candidate routing and first/last wrapping. Native intermediate steps are left alone. Callers are Dialog, Drawer, BottomSheet and modal CommandPalette; do not change their implementations/API. Native WebKit26.5 on this machine skips buttons without explicit tabindex; Chromium151 visits them. Plain HTML probe .batuta/runs/v1-webkit-tab/plain.json proves input Tab→BODY and reverse Tab→BODY without Lyra; tabindex=0 controls are traversed. WebKit source reference https://bugs.webkit.org/show_bug.cgi?id=199671 documents platform keyboard policy. Do not change any browser/system setting or add a platform sniff.
Consequently Lyra's theoretical first/last candidates do not always equal native Tab boundaries. The prior retained nested reproduction .batuta/runs/v1-dialog-nested-escape/diagnostic-green.json shows input Tab→BODY. Current .batuta/runs/v1-webkit-tab/run.mjs uses real trusted keys, StrictMode, current Dialog and shared hook; red.json is controller baseline proof for single/nested panels. All files are inside this worktree. Baseline hook snapshot is baseline.ts. Target requirement is containment, not forcing WebKit to visit skipped native buttons. Source tests already cover explicit edge wrapping, panel/zero-content paths, dynamic visibility, portals and restore. Do not weaken existing tests.
Existing .lyra-visually-hidden CSS utility lives in packages/styles/components/primitives/primitives.css and is available through the existing styles import; styling must remain CSS-first. Any owned DOM/listener resources must not alter caller semantics or remain after deactivation/unmount. Initial focus, logical sibling-modal ordering, inert coordination, outside-click dismissal and non-Tab keys remain separate requirements; no global focus enforcement or focus-stealing on unrelated pointer/programmatic interactions.
Controller runs actual checks outside executor sandbox with installed tools/pinned Node24.18.0. Do not run tests/lint/build/package managers/install in your sandbox. You may run installed Prettier --write on exactly your scoped files: Node /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node, Prettier /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/prettier/bin/prettier.cjs. No global pnpm. The executor report is not proof.

## Conventions
Batuta only; English docs; React TypeScript with existing CSS-first conventions; no new library. Sequential high lane, existing feature worktree. Conventional Commit by controller. React patch changeset per incumbent 0.x policy.

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

Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

## Acceptance criteria
1. Trusted Tab and Shift+Tab from an input between native buttons stay within the active panel in WebKit and Chromium, in single and React-portal-nested Dialogs. Final focus is an eligible user control or the zero-candidate panel, never BODY or an internal boundary node. Preserve native intermediate input/textarea/radio/explicit-tabindex traversal rather than replacing every Tab with an unconditional manual walk. Proof: controller native red/green and focused new browser regressions, including reverse first action from the input.
2. Existing wrapping, panel routing and zero-candidate containment remain correct; re-read current eligible content after children mount/unmount or become hidden/disabled. Active=false, repeated activation, unmount and StrictMode release all task-owned resources; no duplicated stops, leaked focus callbacks, changed panel DOM content or return-focus regression. Nested default-body portals must not route into the parent's controls. Respect a descendant native Tab preventDefault; unrelated keys and pointer/programmatic focus remain unchanged. Proof: behavioral hook/real-component regressions and controller existing Dialog/Drawer/BottomSheet/CommandPalette browser+SSR suites.
3. Keep product changes within the shared hook, its focused browser tests and one React patch changeset. No public API/dependency/CSS contract/global modal ownership change, UA detection, browser/system preference change, observer polling loop or new background service. Add only resources demonstrably necessary for native containment and clean them up. Proof: diff/scope review, independent review, TypeScript/scoped ESLint/Prettier plus controller suites.

## Boundaries
No Colima/Docker/configuration/resource operation, installs/dependency/lockfile changes, global registry/listener framework, component API/caller implementation changes, experiments, unrelated cleanup, CI/ledger qualification, remote actions/versioning/publication. No arbitrary timing waits, ignored failing assertions or hidden unqualified cases. Do not edit managed controller records/raw fixtures. Preserve native user preference inside panels; no blanket override of Tab order.

## Scope
- packages/react/src/internal/use-focus-trap.ts
- packages/react/src/internal/use-focus-trap.browser.test.tsx (new)
- .changeset/modal-native-tab-containment.md (new)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
Report files touched, cause, actual commands/output, lifecycle/native-navigation tradeoffs and all controller-pending checks. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.

## Stop conditions
1. The code shape contradicts this brief.
2. The same command fails twice for the same unexpected reason (a new red test does not count).
3. The correction requires edits beyond Scope or Boundaries.

## Executor report

Implemented the WebKit Tab-containment repair; no commit made.

- Updated [use-focus-trap.ts](/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-focus-trap.ts) with lifecycle-cleaned, visually hidden native focus boundaries that redirect only during the originating Tab gesture.
- Added focused browser regressions in [use-focus-trap.browser.test.tsx](/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/packages/react/src/internal/use-focus-trap.browser.test.tsx).
- Added [patch changeset](/Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization/.changeset/modal-native-tab-containment.md).

Scoped Prettier completed and `git diff --check` is clean. Per the brief, I did not run tests, lint, build, or installs; controller verification remains pending.

## Retry feedback

# WebKit Tab containment — one high-lane retry

The controller ran all checks. Native main matrix8/8 PASS, Chromium/SSR111 PASS, types/lint/format PASS. WebKit96/98: two BottomSheet opener-return failures also reproduce against the byte-exact original hook (baseline-bottom-sheet.log:10 pass, same2 failures at bottom-sheet.browser.test.tsx:160 and251). Those pre-existing return-focus failures are outside this task; do not change BottomSheet or weaken its assertions. No implementation regression is inferred from them.

Current hook snapshot initial-implementation.ts SHA3357d8fb06c312b70124fda297cc66e3a5f2ab2eec404baa4c5d20f4d4b8da20 is restored; baseline substitution was controller-only and completed in finally.

Fix these concrete defects and missing acceptance proofs within the original three-file scope:
1. use-focus-trap.ts: createFocusBoundary sets permanent tabindex0, while onFocus does nothing if consumePendingBoundary returns false. Trusted diagnostic edge-run.mjs green focuses the legitimate external Open button after ordinary in-panel Tab/keyup, then presses Tab: all8cases end on the invisible internal BUTTON (outsideResult.boundary=true). Do not add new invisible keyboard stops when no in-panel Tab operation owns them, and do not expose an internal technical "Focus boundary" button to the accessibility tree. Keep unrelated legitimate external pointer/programmatic focus unchanged. Existing test boundary.focus()/expect(boundary) is not a behavioral proof of preserving user-control focus; replace it with legitimate outside-control coverage and add trusted incoming Tab coverage.
2. use-focus-trap.ts: onKeyDown ignores event.defaultPrevented. edge-run.mjs installs a real native descendant keydown listener cancelling Tab on the Last button, then trusted Tab still wraps to Close (cancelledStayed=false in all8cases). Honor descendant-native cancellation, including edge wrap. The current React cancellation test on an intermediate input does not cover this owner ordering case. Preserve native intermediate default behavior when not cancelled.
3. Current3test file does not prove AC1 native input/textarea/checked-radio/explicit-tabindex intermediate order, AC2 dynamic insertion/removal or hidden/disabled filtering, or final unmount/disposed callbacks. Add focused behavioral regressions, preserving real keyboard input. Verify active false/true and StrictMode resource cleanup, including no residual nodes/callback effects after unmount. Do not introduce broad DOM observation or manual all-Tab navigation to get these tests green. Reuse the existing owner-local approach; no new dependencies/API/caller changes.

Evidence lives inside .batuta/runs/v1-webkit-tab/: edge-green.json/log and edge-run.mjs, green.json, checks.json and baseline-bottom-sheet.log. The main Tab fix already works; keep its good behavior and limit this retry to the above. All original conventions/boundaries apply. You may use the pinned installed Prettier --write on the three scoped files only. Do not run tests/lint/build/install/commit. Controller proof remains pending. Report exact edits/commands and no fabricated test claims.

## Retry report

Implemented the single retry; no commit made.

- Boundaries are now `tabIndex=-1` and `aria-hidden` by default, armed only for the active panel’s current Tab direction, then disarmed on focus exit/key release.
- Native descendant `preventDefault()` is honored before trap ownership.
- Expanded focused browser coverage for native intermediates, edge cancellation, incoming Tab, dynamic candidates, nested portals, StrictMode, deactivation, and unmount cleanup.

Scoped Prettier completed and `git diff --check` is clean. Per the feedback, I did not run browser/SSR/type/lint/build checks; controller verification remains pending.

## Critical completion contract

# Critical completion — native modal Tab containment

The single high-lane retry fixed both native matrices (8+8 pass), but WebKit new
tests incorrectly require platform-skipped radio/button stops. Chromium/SSR115
passes; WebKit98/102 has the same2 baseline BottomSheet failures plus2 new fixture
failures at use-focus-trap.browser.test.tsx:182 and259. ESLint flags prefer-const
at use-focus-trap.ts:116-117. Types and formatting pass.

Controller critical scope: correct the two test preconditions/expected native
sequence and the two immutable resource declarations in the original source/test
scope. Preserve the verified boundary mechanism and all strict containment,
count/cleanup assertions. Compare active traversal to the same real browser's
inactive-hook traversal; make external fixture buttons explicitly keyboard stops.
This does not override a browser preference or prepare a mouse opener. No test
skip, UA branch, dependency, API or other component edit. The original BottomSheet
assertions remain failing/unqualified; do not fix or weaken them in this slice.

Retain retry source/tests and logs. Run actual native control diagnosis, then
final focused Chromium/WebKit suites, types/lint/format, current-hash native
main/edge probes. Independently review full original brief plus feedback and this
completion contract. No reset of verified code or unrelated worktree state.

## Verification

- Criterion1: native main baseline4/8→final8/8; focused native intermediate
  comparison and final hook tests pass. Final native hash equals final source.
- Criterion2: native edge0/8→8/8; seven final hook regressions pass in both engines.
  Consumers Chromium/SSR115 pass; WebKit100/102 retains exactly the baseline
  BottomSheet two failures. No return-focus regression attributed to this change.
- Criterion3: closed three-file scope, patch entry, final types/lint/format and
  diff hygiene pass. No global listeners, libraries or changed caller APIs.
- Gate0: both executor rounds exit0. Gate1: scoped implementation/tree changes.
  Gate2: focused suite/native proof pass; broader WebKit is baseline-limited,
  not reported green. Gate3: independent reviewer3/3 DONE, unchanged guards, Batuta verifier PASS.
- Details and all failure disposition: .batuta/v1-webkit-tab-verification.md.

## Retry and escalation

One high retry fixes hidden incoming stops, cancellation and missing tests.
Second verification exposes native-order fixture assumptions and prefer-const;
critical/controller completes only those, preserving the proven hook mechanism.
No reset of good implementation or unrelated state. Original BottomSheet failures
are retained and queued separately. Initial setup syntax error and intermittent
claude-mem availability-hook errors are recorded; no hook/service setting changed.

## Independent review disposition

Independent OpenCode/opencode/glm-5.3-flash completed the technical review with
three DONE criteria, no findings and unchanged status/diff/scoped-file hash guard.
Its first report omitted the required findings markers, so that report-format
round was invalid. A formatting-only retry reissued the exact same report with
the required markers, no tool use or judgment changes; exact-content comparison
and the second unchanged guard pass. Batuta verifier PASS, 3/3 DONE. Verbatim
findings file: .batuta/runs/2026-09-09-webkit-tab.review.md (`none`).

Controller adjudication: approved for the bounded Tab slice. The review's first
paragraph overstates the release limitation with “only”: the two BottomSheet
failures are the remaining failures in this scoped suite, not the only V1 blockers.
The incumbent backlog, logical modal/inert contracts and full release matrix remain
open. Reviewer uncertainties about direct boundary-focus telemetry, the zero-content
armed window and hypothetical reparenting do not identify a concrete failure in the
accepted static-body portal scope; outcome-level proof and cleanup checks pass.

Raw review/format prompts, reports, unchanged guards and verifier JSON remain in
main checkout .batuta/runs/2026-09-09-webkit-tab-review/. All owned browser/server
runs exited. The two controller-owned dependency symlinks were removed after
verification/review; raw evidence is retained. No foreign files/services were removed.

