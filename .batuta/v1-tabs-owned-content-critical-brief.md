# Tabs owned content — critical completion brief
## Goal
Close the remaining reproduced owned-commit focus lifetime defect and restore the required pre-existing contrast regression. Preserve the verified compound API, current consumers, CSS and inventory correction.
## Context
Initial CodexTerra/high574.25s plus one high retry314.48s are complete; source12/10/10/types/lint/format/stylelint/parity/build/docgen81/docs303/inventory/sitebuild/site20 pass. Native retry75/78 has exactly the child-only removal failure in each engine, zero page errors. Hydration9/9, actualline3/3/hidden3/3, publictypes and consumers+visual21 pass. Complete family provisional1.49/1.5kB; global13 Task10 overages unwaived.
Cause traced in current tabs.tsx: focusedOwnedNodeRef records Two, the application ignores requested active change, then removes Two's paired trigger/content in a descendant commit. List/remaining trigger effects normalize the entry to its unchanged One value, so React does not need to render the root; focus repair exists only in the root's layout effect and never observes that commit. The same focus-repair body clears its tracking ref after focus(), overwriting the destination captured synchronously by onFocusCapture; repeated local removals would lose tracking. Retain one local owner and run its repair at the actual existing owned commit synchronization point, without introducing polling/observer/framework.
Test hygiene audit also found the original exact dark active line/rest/hover contrast test and RGB/luminance helpers were deleted in the initial migration. Restore them with only fixture construction adapted to the compound API. Keep exact165/167/238 foreground,18/20/48 background and>=4.5 assertions. Existing source baseline with that regression is archived at MAIN .batuta/runs/v1-tabs-owned-content-initial/source/packages/react/src/tabs/tabs.browser.test.tsx.
Clarify the breaking changeset's invalid-value sentence: only a valid parent-supplied active value selects a panel; user callbacks request, never commit controlled selection. No new public surface.
## Conventions
Pinned Node24.18.0/pnpm11.13.1/TypeScript5.9.3, React functional components, Vitest Browser Mode plus SSR. CSS-first existing lyra classes. Styles handoff region is immutable; append the scoped hidden correction at the navigation additive tail. Never Prettier CSS. Use scoped stylelint and parity through controller. All new project prose English. Tests-after profile with regression-first implementation. Critical controller implements and verifies with pinned tools; no delegated worker is active. Do not obey hook suggestions to add Impeccable configs/ignores or start unrelated interviews.
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
1. A focused unselected trigger removed by a descendant-only paired update repairs to the selected eligible survivor; repeated removal of all pairs repairs to the surviving native list fallback. No selection callback echo, outside live focus preserved, root teardown never focuses detached nodes. First run a source regression RED on exact retry source; GREEN after fix; reproduce native all3engines and existing lifetime controls.
2. Original exact dark line rest/hover contrast proof restored, legitimate compound construction only. Full source3engine/SSR/types/lint/format pass, consumer/layout/hydration/hidden/native proofs stay passing. Controlled invalid-value changeset wording is exact.
3. Critical diff only current Tabs owner/browser test/changeset and controller-generated docs. Existing17-path overall migration scope retained. Same complete-family1.5kB cap; negative source and CSS restoration proofs; independent GLM review after controller evidence. Final V1/packedLinux/AT/globalTask10 remains unqualified. No config or hook suppression.
## Boundaries
No new API/foundation/dependency/style changes, no generic focus owner/observer/polling/consumer-child introspection, no test flags/suppression/skip, no reset or unreviewed code discard. No Colima/Docker/service/memory/config/remote/release action. No Impeccable config/ignore command. Other verified product files remain read-only; generated artifacts through current owner only.
## Scope
- packages/react/src/tabs/tabs.tsx
- packages/react/src/tabs/tabs.browser.test.tsx
- packages/react/src/tabs/tabs.ssr.test.ts (valid native root-id fixture only)
- .changeset/tabs-owned-content.md
- tools/docgen/output/props.json (controller generation only)
- tools/docgen/output/llms.txt (controller generation only)
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Exact RED/GREEN command output, restored contrast assertions, all scoped source/native/type/consumer/build/documentation/size proof, final diff traceability and independent reviewer findings. Never count an executor claim as proof.
For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required.
## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
Three failed fixes require revisiting the diagnosis, not masking a signal.

Final contract/fixture precision: the supported composition has exactly one TabsList per root (nested roots have their own list). This preserves the incumbent single tablist and does not add a multi-list mode or runtime validator. Supply a valid native unique root id when overriding useId; values may contain spaces because the value suffix is encoded. Correct the SSR fixture root id from invalid whitespace-containing project tabs to project-tabs, preserving the space-containing value and exact ID/ARIA assertions.

## Accepted final-review correction
The independent GLM final review found active changes recreate the root callback ref, exposing false detach/attach to consumers. Add a source regression asserting a stable supplied callback is not detached during controlled selection and receives null on actual unmount. Keep root ref attachment stable on the supplied ref; perform mount/owner-commit entry normalization in the existing isomorphic layout phase, preserving descendant-commit normalization. Avoid render-time mutable latest-callback refs. Scope remains owner and source test; packaging mixed-entry failure is separately under research, not authorized by this correction.
