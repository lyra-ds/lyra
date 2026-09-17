Work only inside /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization. Do not commit.
# Goal
Add the smallest reusable packed React19 Drawer six-profile evidence producer, preserving the verified Dialog CLI and assertions. This is test tooling, not a CSS repair or V1 qualification.
# Context
Base f92c689. tools/v1-profiles/dialog.mjs contains the verified packed production consumer, frozen React19 lock, sequential browser/profile lifecycle, hash-bound reports, native interactions and bounded cleanup. fixtures/dialog.tsx is the current fixture. Read .batuta/scout/2026-09-12-drawer-profiles.md and .batuta/v1-dialog-profiles-verification.md. Existing Dialog source6/6 and packed18/18 pass. Drawer uses .lyra-drawer*, an edge panel sliding in X, controlled open/onClose, title, footer, initialFocusTo and returnFocusTo. Current Drawer close focus uses box-shadow without forced-colors outline; record actual failure rather than concealing it. Its28px close differs from Dialog44px; resolve profile target criterion from the normative overlay/design contract, do not copy44 blindly or lower a required threshold. RTL panel sits at logical inline-end; header/close and text must follow direction. Existing Dialog labels/control mixture may be reused for an equivalent Drawer fixture. Active worktree has only controller state and pre-existing .impeccable hook cache; preserve all. Controller operates from MAIN separately, no product edits there.
# Conventions
Pinned Node24.18.0 at /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin; pnpm11.13.1. Set PATH appropriately for any checks. No new dependencies/lockfiles or installs. Existing style is CSS-first, no runtime styling shortcuts. English documentation. Sequential bounded checks; no Docker/Colima/VM/resource/service changes, foreign cleanup or remote actions. No skills that introduce additional planning/approval workflow; this scoped implementation is already authorized. Controller runs actual browser tests outside your session; do not claim browser evidence you cannot run.

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



Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.
# Acceptance criteria
1. Public Drawer CLI accepts same explicit tarball/output/browser arguments as Dialog and runs all six profiles per requested engine with frozen production React19 consumer. Packaging must validate Drawer export and evidence must bind every contributing runner/fixture source plus exact tarballs, lock and environment. Proof: syntax/help + actual controller18-case run. Actual product failures are valid producer evidence, never PASS.
2. Profile assertions use native keyboard/pointer, real theme computed changes and axe WCAG2.2AA, forced-colors visible focus/surface/disabled distinction, reduced-motion and scroll/inert restoration, LTR/RTL geometry/keyboard. Wait only actual owned finite entrance completion, no synthetic animation finishing/canceling/events or sleeps, no focus injections to manufacture native keyboard proof. Retain meaningful current contract thresholds. Proof: controller18-case report and separate artifact mutation negative.
3. Existing Dialog CLI and outcome semantics/assertions remain intact, including full source hash binding, startup/fewer-case failure, bounded SIGTERM/SIGKILL cleanup, screenshot/error diagnostics and natural completed-animation case. Avoid duplicating the877-line engine for Drawer; keep reuse narrow to these actual two consumers. Proof: original Dialog18cases controller rerun against exact same tarballs, scope/diff review and CLI failure probes. No library/ledger/CI change.
# Boundaries
Do not change component runtime, CSS, package metadata, dependencies, locks, generated outputs, historical evidence, policies, baseline pointers, ledger, workflows, Blade, WORK.md, handoff or other state. Product failures become observations for separate repair. No package builds/install, remote writes, Docker/Colima, service operations, global config, synthetic focus/style/animation fixes, threshold waivers or broad framework. Do not use memory tools. Do not stop unrelated processes.
# Scope
Allowed: tools/v1-profiles/dialog.mjs; new tools/v1-profiles/modal.mjs (only if needed for actual shared runner code); new tools/v1-profiles/drawer.mjs; new tools/v1-profiles/fixtures/drawer.tsx. Existing fixtures/dialog.tsx is read-only. Do not change anything outside this list; if the task requires it, stop and report.
# Expected evidence
Report exact files changed, every command/output, which criteria proven locally and which need controller browser proof, actual observed product failures and uncertainties. Syntax/help checks available; controller owns packed/native proof. Keep implementation concise and no generated artifacts.
# Stop conditions
Stop if the code shape contradicts the brief, the same command fails twice for the same unexpected reason, or edits beyond Scope/Boundaries are needed. Do not silently broaden the task.
For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before the first edit toward it and BATUTA-PROGRESS <n> DONE when its proof passes locally. Plain text, nothing else on that line, no tool required.
