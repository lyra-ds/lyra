# CreateWorkspaceDialog canceled-close prose — high completion
## Goal
Resolve the accepted final review's two matching low wording findings after the medium initial/retry. Complete only the pending-cancel closure statement in the two existing MDX pages.
## Context
Both pages currently say: “While an operation is pending, user close first aborts the owned signal once and waits for that operation's matching canceled acknowledgement; a matching accepted acknowledgement requests onClose, while a matching rejection stays open as an error.” This omits explicitly saying that the matching canceled acknowledgment requests onClose for the pending close. The current runtime does so; source/nativenew87 plus exact documentation consumer24 demonstrate it. Reviewer GLM3DONE with this one duplicated precision finding,100.04s unchanged guard. The original medium run260.61s plus168.7s prose retry otherwise passed all MDX/snippettypes/stack303/format and protected source/artifact checks. The complete WorkspaceCreator snippet and staticHTML/frontmatter are correct and must remain byte-identical.
Selected normative contract: “Lyra MUST then wait for the result carrying that ID; canceled MUST allow the pending user close, while the other terminal results retain their outcomes above.” Controlled onClose requests parent input change; it cannot force visibility. Unsolicited cancellation with no pending close returnsediting with valuespreserved and must not close. This completion must not imply otherwise.
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
1. Both existing pendingclose bullets explicitly say matching canceled acknowledgment requests onClose, preserving idle/accepted/rejected/forced-close semantics. Directdiff + independentread-onlyverdict.
2. Only the wording clause in the two scoped files changes; all other prose, fullcurrentTSXsnippet, historicaldiff, frontmatter and completeHTMLtail remain byte-identical. Controller SHA/diff/MDX/snippettypes/stack303/format prove it. No new example or runtime correction.
## Boundaries
Only read/edit/report. No tests/build/package managers/install/gitwrites/remote/Colima/Docker/services/config/hooks/delegation/planning/other files. Exact pinned Node24.18.0 scoped Prettier allowed; controller owns validation. Do not add broad warnings, qualifications, headings, APIs or additional cleanup. This is a two-clause prose completion, not a new design.
## Scope
apps/docs/content/docs/en/components/create-workspace-dialog.mdx
apps/docs/content/docs/pt-BR/components/create-workspace-dialog.mdx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Exactchangedclause in bothfiles, formatting command and honest unruncontrollerchecks. Report only those paths; no broadscan.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test the executor just wrote is not that).
3. The fix needs edits beyond Scope or Boundaries.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
