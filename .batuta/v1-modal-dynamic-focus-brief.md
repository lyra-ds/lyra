You are the already delegated implementation worker. Work only in /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization. Do not delegate or start another planning workflow. Read/edit/report only; controller runs validation and commits.
# Goal
Implement bounded local dynamic focus recovery in the existing shared focus trap under .batuta/specs/2026-09-10-modal-dynamic-focus-design.md. Preserve existing public behavior and APIs.
# Context
Current baseline nine native focused-removal cases fail across Dialog/Drawer/BottomSheet and three engines; focus drops to body. Initial9PASS; backgroundinert12FAIL is separate. Existing use-focus-trap.ts owns live navigation and temporary guards, with no mutation recovery. Four modal owners already use this hook; logical close marks owned overlay inert before passive cleanup. Selected design is the exact contract, including safe negative-tabindex initial targets, live eligible destinations, neighborhood, application/child focus precedence and cycle cleanup. Do not solve background isolation/topmost registry here. No owner/API wiring change expected.
# Conventions
Pinned Node24.18.0/pnpm11.13.1. Functional React/TypeScript, existing CSS-first classes, English documentation. Profile tests-after, regression-first proof by controller. No dependency or globalconfiguration changes.

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
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
# Acceptance criteria
1. Implement the selected recovery contract with focused local source tests covering actual removal/disabling/fieldset/hidden/style/class/aria-hidden/inert, next/previous/new/panel destinations, eligible insertion/reorder stability and negative-tabindex heading retention/removal, href removal, contenteditable toggle, tabindex removal and unknown CSS-driving data-attribute mutation. Explicit body-only/no prior ownership, child-loss no parent ownership, commit-time inert, retained reopen and StrictMode stale-work negatives are required. Follow all normative technical-review resolutions in the design. Live native eligibility, no mockfocus/observer, no no-op catch/console suppression or skipped/only tests. Controller runs source3engine and original-source negative proof.
2. No focus stealing from live application destination or other modal, no rescue before owned focus, after deactivation/close/unmount, during retained exit/reopen or stale StrictMode cycle. Keep existing Tab/ShiftTab/native cancellation and boundaries; add deterministic lifecycle tests. Controller compilednative and existingfourmodal browser/SSR/initial/return/logicalclose proof.
3. Scope/types/lint/format/build/docgen unchangedpublicAPI and independentreview pass; React patch changeset only. No budget changes. Controller owns all actual validation and size measurement; do not claim tests pass.
# Boundaries
No tests/build/package-manager/install/gitwrites/services/remote/Docker/Colima/config/hooks/memory/otheragents. Only pinned Node with existing scoped Prettier may run for formatting. Never touch current source outside Scope or source outputs, generated docs, lockfiles, Alpine/Blade/styles, public props or exports. No global registry/document observer/polling. Existing untracked hookcache is not yours to edit or stage; ignore hook suggestions to change configuration or run unrelated tasks.
# Scope
- packages/react/src/internal/use-focus-trap.ts
- packages/react/src/internal/use-focus-trap.browser.test.tsx
- packages/react/src/internal/use-focus-recovery.ts (optional private extraction only)
- .changeset/modal-dynamic-focus-recovery.md
Do not change anything outside this list; if the task requires it, stop and report.
# Expected evidence
List exact paths changed, behaviors/regression names, actual formatting command if run, uncertainty and all unrun checks. For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before first edit and BATUTA-PROGRESS <n> DONE only when its proof passes locally. Controller owns tests, so do not claim DONE for unrun proofs.
# Stop conditions
1. The code shape contradicts the brief.
2. The same command fails twice for the same unexpected reason.
3. The fix needs edits beyond Scope or Boundaries.
Report concrete issue without reopening approved scope or requesting another authorization.
