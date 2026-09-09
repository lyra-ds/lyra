# Run — nested Dialog Escape containment

**Date:** 2026-09-09 · **Lane:** frontend/medium · **Executor:** Codex gpt-5.6-terra
**Commit:** e55a1bb · **Verdict:** ✅ approved

## Brief as dispatched

# Nested Dialog Escape containment

## Goal
Fix one Escape cascading from a React-nested Dialog to its parent. Respect consumer cancellation and the child's existing closeOnEsc option without a new API or layer framework.

## Context
You are the implementation executor already delegated by Batuta. Implement directly; no recursive delegation, Superpowers, workflow approval or commit. Checkout /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization, base e976cf3, branch feat/v1-incumbent-stabilization. Managed .batuta/WORK state and temporary root/React node_modules links are controller-owned and must be preserved.
Known owner: packages/react/src/dialog/dialog.tsx, DialogPanel.handleKeyDown (~149). It runs restOnKeyDown then calls onClose on Escape/closeOnEsc, without honoring defaultPrevented or isolating the nested Dialog's Escape. Child Dialog is portaled into a separate DOM branch but React keyboard events still bubble to the parent Dialog's handler. The existing useFocusTrap listener binds to the actual panel node and is outside this fix.
Controller trusted StrictMode Chromium/WebKit proof .batuta/runs/v1-dialog-nested-escape/red.json: all10 scenarios fail because parent onClose fires on child Escape. Cases: normal, closeOnEsc=false, panel consumer preventDefault, child input preventDefault, ignored child close request. Normal closes both; disabled still closes parent; prevented still closes both. Basic child Tab/Shift+Tab controls pass. There are no page errors. Fixtures use existing returnFocusTo refs, no mouse pre-focus workaround.
Existing family requirements at docs/superpowers/specs/2026-08-30-overlay-family-design.md: one user operation dismisses at most one layer; child dismissal must not cascade; consumer handlers precede cancellable default and preventDefault leaves state/resources unchanged. This task owns only Escape propagation for React-nested Dialogs. Global sibling-stack ordering, inert isolation, focus policy, non-Dialog child owners, custom portal hosts, pointer cancellation, exit-presence interaction ownership and parent-forced teardown remain separate unqualified slices.
Dialog existing browser/SSR tests are colocated; keep all strict focus/pointer/presence assertions. Controller runs real tests outside your sandbox using installed tools and pinned Node24.18.0. Never run pnpm or install. You may use the already-installed Prettier via pinned Node with --write on your scoped files only; no tests/lint/build/generation in executor. All proof remains controller pending.

## Conventions
Batuta coordination only; English documentation; React TypeScript CSS-first existing classes, no style changes. Node24.18.0/pnpm11.13.1 repository; global pnpm differs and must not be invoked. Worktree medium lane, sequential; Conventional Commits controller-owned. Follow surrounding file naming/style. New .changeset entry uses React patch per 0.x additive version policy.

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
1. A trusted Escape handled within the child Dialog requests only its onClose, exactly once; parent stays open. After accepted child close and exit, focus returns to its trigger in the parent; a second Escape can then close only the parent. Add a behavioral nested regression. Proof: controller native normal case in Chromium/WebKit and browser suite.
2. Child closeOnEsc=false, ignored child close request, panel consumer preventDefault and input/editor preventDefault never cause the parent's onClose. PreventDefault suppresses child's close too; ignored close notifies child once but leaves it open. Consumer handler runs before Lyra's cancellable default. Non-Escape keys retain bubbling and single-dialog Escape remains valid. Add focused regressions for these cases. Proof: native variants plus colocated tests and unchanged single-dialog suite.
3. Runtime change stays in Dialog's keyboard owner; no global listeners, context/registry, dependency, public API, focus/portal/presence/scroll/other-component changes. Add a compatible React patch changeset. Proof: scope/diff check, Chromium/SSR and WebKit suites, TypeScript, scoped lint/format.

## Boundaries
No Colima/Docker/resource configuration or restart; no install/deps/lockfiles, global registry/framework, other modal implementation, API change, unrelated refactor, docs-generation, CI/ledger/experimental integration, remote action, versioning or publication. Do not add a blanket propagation block for all keys or force-focus inside mouse opening. Do not change existing pointer/return-focus behavior. Preserve controller artifacts/links. No commit or proof claims without actual runs.

## Scope
- packages/react/src/dialog/dialog.tsx
- packages/react/src/dialog/dialog.browser.test.tsx
- .changeset/dialog-nested-escape.md (new)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
Report changed files, traced cause, commands actually run/output, and unverified checks as controller pending. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.

## Stop conditions
1. The code shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The correction needs edits beyond scope or boundaries.

## Executor report

Implemented the nested Dialog Escape containment fix.

- Child Escape now stops React propagation after consumer handling; `preventDefault()` cancels child close.
- Added nested browser regressions for normal close, disabled Escape, ignored close, panel/input cancellation, event order, and non-Escape bubbling.
- Added `.changeset/dialog-nested-escape.md`.

No tests, lint, build, or commit run; controller verification remains pending.

## Retry report

Formatted the requested file successfully.

Command:

```sh
/Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node /Volumes/Home/francisross/Projects/lyra/lyra/node_modules/prettier/bin/prettier.cjs --write packages/react/src/dialog/dialog.browser.test.tsx
```

Result: `packages/react/src/dialog/dialog.browser.test.tsx 85ms`

## Verification

- Criterion1: controller native escape-run.mjs green, normal cases in both engines:
  child count1/parent0, exact trigger restore, second Escape parent1. PASS.
- Criterion2: four native variants per engine plus browser ordering/bubbling and
  unchanged single-dialog suite. PASS.
- Criterion3: three-file product scope, compatible patch entry, Chromium/SSR64,
  WebKit57, TypeScript/lint/final format and git diff --check. PASS.
- Gates0 finished exit0; gate1 scoped product diff; gate2 controller suites pass;
  gate3 independent review3/3 DONE, unchanged guard, Batuta verifier PASS. Test hygiene clean.
- Full evidence/disposition: .batuta/v1-dialog-nested-escape-verification.md.

## Retries and escalation

One medium same-session formatting-only retry after Prettier flagged the new
browser test. No implementation escalation. An independent native probe also
flagged WebKit forward Tab; retained original baseline proves the same existing
failure. The dispatch's claim that both engines passed Tab was incorrect and is
explicitly corrected in the current brief/verification. A dedicated Escape
verdict preserves Tab observations, replays baseline0/10 and current10/10, and
completes the exact child restoration/second parent dismissal proof. Tab focus
containment remains a separate unqualified requirement; no green was fabricated.

## Independent review disposition

Independent OpenCode/opencode/glm-5.3-flash review completed exit0, status/diff/
scoped-file SHA256 guard unchanged, three criteria DONE; Batuta verifier PASS.
Findings are preserved verbatim in .batuta/runs/2026-09-09-dialog-nested-escape.review.md.
- Accepted verification observation: final test bytes had only lint/format checks.
  Resolved by controller Chromium/SSR64, WebKit57 and TypeScript reruns after review,
  all exit0. No product edit or implementation escalation was needed.
- Declined WORK.md ownership concern: the controller created the active task line
  before dispatch; the executor did not edit managed state. It is the intended log.
No unresolved product findings. Raw review prompt/log, before/after guard and verifier
result are in the main checkout .batuta/runs/2026-09-09-dialog-nested-escape-review/.
A transient claude-mem availability hook blocked some read/poll commands; they
subsequently succeeded. No hook or service configuration was changed.
Owned browsers/servers exited; the two controller-owned dependency symlinks were
removed after verification. No foreign files or services were cleaned up.

