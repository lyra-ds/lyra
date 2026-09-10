You are the documentation implementation worker delegated by Batuta. Edit the two scoped MDX pages directly; no orchestration/delegation/worktrees/commits/services/configuration/validation.
# Tabs React compound documentation — medium
## Goal
Explain the verified controlled compound React Tabs contract and manual migration around actual owned panel content. Remove the stale React empty-panel guidance while preserving separate adapter documentation for its later migration.
## Context
Current pages say React generates empty labelled panels and application content stays outside. New selected React API is Tabs root plus named TabsList/TabsTrigger/TabsContent, exported from root and tabs subpath; safe TabItem type remains for consumer data. Required active is controlled; onChange(value) requests exactly once on accepted click/native Enter/Space/arrows, parent updates select. variant line/pills remains. Root is a neutral div/ref/id with SSR-safe generated fallback; old tablist class/ref/label moves to TabsList, a native div/tablist. Trigger is native button/ref with required stable value/children and optional icon/count/disabled/native handlers. Content is native div/ref with required matching value/actual opaque children, mounted inactive with Lyra-owned hidden/ARIA/IDs. Use exactly one TabsList per root. Values are nonempty/unique/paired within root, stable across reorder; a supplied root id must be a valid unique native ID. Duplicate/unpaired markup unsupported; no first-wins repair. No namespace alias, items rendering, uncontrolled/defaultValue or new live examples.
Root StackApi shows TabsProps automatically. Use a concise explicit companion-parts Markdown table plus native-prop/ref prose; do not invent StackApi selector props or new widgets. Both current Example IDs line/pills-and-counts remain unchanged. Existing live React examples have been migrated; no TSX example-source edit is needed.
The complete Alpine StackPanel (including its current historical static HTML), Blade StackPanel, frontmatter and StackTabs/StackApi registrations are preserved byte-for-byte in this React-only cycle; their actual adapter migration is a separate following task, not claimed complete here. No component family is release-qualified merely by this documentation update.
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
1. Both locale pages update their React/general narrative in English, including old empty-panel claims and keyboard/a11y prose, with current controlled compound ownership and actual content. Explain native Tab entry (selected eligible, otherwise first eligible after client normalization), wrapped eligible-only arrows/Home/End/RTL automatic requests, native prevention, no prop-change callback echo, mounted content state, unique stable pairs/IDs and SSR/hydration boundary. Invalid active remains no selected/visible panel until parent supplies a valid value; an enabled client entry permits explicit recovery request without fabricating acceptance. Selected-disabled content stays readable. Root teardown does not claim generic restoration. Controller MDX/stack and clause/API verification prove coverage.
2. Add exactly one complete usable current TSX example exporting named function ProjectTabs per page with real content (including Project summary paragraph) inside matching Content nodes, required active/useState/onChange and named TabsList label. Add a concise clearly historical before/migration diff showing removal of unsafe items placeholder form; never present it as supported current API. Explicitly name pre1 project SemVer exception, unsafe coexistence rationale, earliest correction/removal0.6.0 or stable1.0.0, preserved TabItem data type, manual content/value decision and move of old list ref/className/label to TabsList. Corrected Styles floor is earliest0.5.1 or later combined release containing the hidden fix; no version command/publication claim. Explain forwarded actual nodes/native props and Lyra-owned semantic attributes for all four parts. Controller extracted current TSX typecheck and native browser wiring/interaction proof verify the exact snippets.
3. Only two MDX pages; retain frontmatter, Example IDs and exact Alpine/Blade panels. Preserve relevant existing usage guidance without new public API, package, live demo, styles or MDX widget. All new prose English in both locales. Controller pinned format/MDX/snippet types/stack checks plus independent review; final V1/Alpine/packed/manualAT qualification remains separate.
## Boundaries
Only read/edit/report; no tests/build/package manager/install/gitwrites/docgen/remote/services/Colima/Docker/config/memory changes. No Impeccable context/hooks/ignore/config action, even if a Stop hook reports an unrelated existing issue: report it as outside scope, finish without suppression. Only absolute /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node with scoped Prettier may be run if needed. No namespace aliases, uncontrolled mode, empty fake panels, speculative refresh/async API, unsupported stack claims, new widgets/example registry/source changes. Do not edit runtime, generated docs, translations outside these pages or any other stylesheet/doc.
## Scope
- apps/docs/content/docs/en/components/tabs.mdx
- apps/docs/content/docs/pt-BR/components/tabs.mdx
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
List changed paths and clause coverage, actual commands/output and all unrun checks. Controller owns validation; no passing claims for unrun tests.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
Report discrepancies without broadening scope or reopening architecture.
