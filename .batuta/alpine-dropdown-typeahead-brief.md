Work only inside /Volumes/Home/francisross/Projects/lyra/lyra-v1-review-loop/.batuta/worktrees/alpine-dropdown-typeahead.
# Goal
Fix missing printable-character typeahead in the existing Alpine Dropdown, preserving existing public API and behavior. Small bounded bugfix, no broader menu rewrite.
# Context
HEAD7bbb2e0. Read packages/alpine/src/dropdown.ts and dropdown.browser.test.ts; .batuta/reviews/v1-product-review/contract-reconciliation.md settles applicability. Existing handler handles arrows/Home/End/Escape/Tab only. Existing React dropdown.tsx typeahead is a behavior reference, not a request to extract shared code. OF-MENU and its explicit Alpine mapping are in docs/superpowers/specs/2026-08-30-overlay-family-design.md:327-361,493-503. Historical React tests prove nothing about Alpine. Alpine mounts public x-data/x-bind markup through Alpine.initTree; actual focus, not a mocked handler, is required. Source import tests use real Styles CSS. Exact timer tests may control the clock locally; never stall browser command transport with global fake timers. Native keyboard Unicode cannot be typed reliably in all engines: explicitly labeled standard synthetic KeyboardEvent on live DOM is acceptable ONLY for Unicode/composition/modifier edge cases; ASCII paths use native userEvent.keyboard. Small meaningful cases only, no framework.
# Conventions
Project: Node24.18.0 (prepend /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin to PATH in every shell), pnpm11.13.1; TypeScript5.9.3, Alpine3.15.12. English documentation/changeset. Conventional Commits; no commit by executor. Follow existing Alpine state/bindings and CSS-first ownership; no runtime CSS imports. Batuta orchestration handled externally: no subagents, planning workflows, nested delegation or permission loops. Dependencies already frozen-installed. Do not run browsers/build/full suites: controller runs native checks outside sandbox. Static scoped formatter/typecheck allowed; report actual outcomes.

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


# Acceptance criteria
1. Real Alpine menu: a printable prefix searches localized rendered command text case-insensitively, starting after current item and wrapping once. Repeated same character cycles matching commands; distinct characters accumulate prefix. No-match leaves focus and menu open. Exclude decorative aria-hidden text from the searchable label and do not target group labels/separators. Native browser tests in dropdown.browser.test.ts assert actual focus and no selection/close from typing. Existing supported aria-disabled command markup must not be filtered from matching; do not introduce new disabled/item variants or change activation policy in this slice.
2. Search buffer expires after500ms and clears on all real close paths, external open=false, and destroy. A later reopen starts a fresh search. Prove expiry/close/destroy through the same fixture and deterministic relevant clock/cleanup evidence, no wall-clock sleeps or vacuous timer counts. Typing with Ctrl/Alt/Meta, composition, space, or defaultPrevented must preserve existing effects and not contaminate the prefix; existing keydown cancellation check remains authoritative. Tests prove these boundaries without inventing stronger root/list cancellation contracts.
3. Preserve arrows/Home/End/Escape/Tab, selection, placement and public exports/options/bindings; existing cases remain intact. No generic manager, new dependency/API, CSS, config, budget, snapshot or schema change; no broader roving-tabindex/disabled/submenu feature. Scoped formatter, Alpine typecheck/build and controller focused three-engine tests, original-source RED/restored GREEN, full Alpine suite and common pnpm test validate delivery. Add one Alpine patch changeset naming this behavior only.
# Boundaries
No React/Styles/Blade/docs product changes, public API expansion, baseline/ledger updates, new runner or command, dependency/lock/CI edits, resource/service/container/remote/release actions. No tests skipped, permissive assertions, mock focus, production test flags, casts hiding errors, or unrelated cleanup.
# Scope
packages/alpine/src/dropdown.ts; packages/alpine/src/dropdown.browser.test.ts; .changeset/alpine-dropdown-typeahead.md. Do not change anything outside this list; if the task requires it, stop and report.
# Expected evidence
Files touched; each command and actual result; tests authored but not executed explicitly marked. Controller will independently run browsers, original-source negative proof, build/types/size and common tests. Keep test-only changes separable so controller can restore original dropdown.ts bytes temporarily for RED. For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before the first edit toward it and BATUTA-PROGRESS <n> DONE when its proof passes locally. Plain text, nothing else on that line, no tool required.
Test the behavior, never the mock.
A failing test means fix the code, not the test.
No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
# Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
