You are the implementation worker already delegated by Batuta. Edit directly in the existing worktree; no delegation, orchestration, worktrees, package-manager commands, hook/config changes, installs, services or commits.
# Existing Dropdown keyboard contract — high/react
## Goal
Complete current Dropdown command navigation: one roving tab stop, label typeahead, and consumer cancellation before keyboard/selection defaults. Preserve the current public API and2kB entry budget.
## Context
Atc5cfaae, Dropdown owns open/pendingFocus, commandItems, trigger/item key handlers and outside listener in packages/react/src/dropdown/dropdown.tsx. Every command button currently has implicit tabindex0. Arrow/Home/End move focus but do not assign roving tabIndex; typeahead is absent. Item keydown defaults precede the root consumer onKeyDown bubble callback, defeating cancellation. Item onClick calls onSelect/close before root consumer onClick. Trigger Slot already merges consumer handlers; preserve one notification and the root passthrough semantics. DropdownItem.label and icon are ReactNode; search the rendered command label, excluding separate decorative icon content and group labels. No disabled/submenu/check/radio variants exist or are authorized. Existing browser tests cover classes/axe, trigger slot semantics, basic arrow/Home/End/Escape, selection, weak Tab exit and placement; SSR renders defaultOpen. Approved OF-MENU contract is reproduced below. Source baseline scout .batuta/scout/2026-09-09-v1-dropdown-contract.md is controller context; you need only this brief and scoped files/nearby test conventions, not raw logs/history.
## Conventions

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


CSS-first and current React patterns; English prose; no new styling or dependency. Node24.18.0/pnpm11.13.1, installed Vitest4.1.10/vitest-browser-react2.3.0/Playwright1.62.1. Controller runs native browsers outside your sandbox; do not invoke pnpm/npm/npx/corepack. Direct pinned Node static tools are permitted. Do not configure or suppress Impeccable/other hooks; report unrelated findings standing. Preserve exact existing class/axe assertions. Query by real DOM role/label; locator existence requires expect.element, not truthiness. Clock controls are allowed only for deterministic timing proof, never to mock the successful focus/selection behavior.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
## Acceptance criteria
1. Exactly one current command owns tabindex0, every other command -1, labels/separators excluded. ArrowUp/Down wrap, Home/End endpoints; trigger Enter/Space/ArrowDown opens first and ArrowUp last. Pointer/programmatic focus updates the roving owner; defaultOpen SSR is deterministic; empty and changed command collections retain a valid single owner when commands exist. Tab/ShiftTab close and continue native sequential navigation to the exact adjacent control, without forced restoration; Escape restores trigger. Proof: browser/SSR tests + controller native Chromium/WebKit replay.
2. Printable typeahead uses case-insensitive rendered label prefixes, starts after current and wraps once; repeated single characters cycle matches; buffer expires after500ms. Separate icon text and noncommand group labels do not match. Multi-character, no-match, Unicode case pair, timeout, fresh reopen and unmount/stale work covered. Ctrl/Alt/Meta/composition input retains native semantics; Enter/Space remain activation. No new locale/public option; use the existing browser locale for case comparison, preserve accents (case-insensitive does not mean accent-insensitive). Proof: meaningful browser coverage with deterministic clock control and controller original-source mutation RED.
3. Existing consumer onKeyDown/onClick cancellation precedes corresponding Lyra defaults and runs once, including item Escape/Tab/navigation and keyboard-generated/pointer activation. Cancellation retains menu/focus/selection and emits no onSelect; unprevented enabled activation emits once and closes normally. Preserve root event passthrough and trigger child Slot cancellation. Public types/exports/variants, styling and placement unchanged; existing Dropdown2kB size-limit passes. Proof: cancellation/activation tests, types/lint/build/docgen/scope, controller size measurement. Other9 known focus-source budget failures are separately pending; do not adjust any budget.
## Boundaries
No global layer registry/foundation, outside-pointer redesign, new public props/variants/dependencies, style/token/config/manifest/budget edits, generated docs changes, test skips or suppressed signals. No WORK/.batuta edits or commits. No Colima/Docker/foreign services/remote actions.
## Scope
packages/react/src/dropdown/dropdown.tsx
packages/react/src/dropdown/dropdown.browser.test.tsx
packages/react/src/dropdown/dropdown.ssr.test.ts
.changeset/dropdown-keyboard-contract.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Actual paths/commands/output; browser/native/size checks honestly pending for controller. Explain old-source failure hypotheses and remaining uncertainties. No hand-written success summaries without execution.
## Stop conditions
Code shape contradicts the brief; same command fails twice for the same unexpected reason; edits beyond Scope/Boundaries required. If2kB cannot be maintained, report the measured gap instead of raising it.
For each acceptance criterion n, print isolated BATUTA-PROGRESS <n> START before the first edit toward it and BATUTA-PROGRESS <n> DONE when its proof passes locally.

## High escalation — actual medium initial and retry failures
Medium exhausted its initial attempt and one retry. Controller backed up all four owned files in .batuta/runs/v1-dropdown-keyboard/medium-final-backup/ and restored ONLY those product files to HEAD c5cfaae. Managed state and independent native harness remain untouched. Implement afresh using the complete original criteria above; failed snapshots are diagnostic only, not a design to preserve.
- Initial implementation manually forwarded callbacks from buttons with WeakSets; native replay caught wrong event.currentTarget. Retry mapped bubble props onClick/onKeyDown onto onClickCapture/onKeyDownCapture. This is also WRONG: native replay18/18 failed phase1 versus expected3, explicit consumer capture callbacks were overwritten, and child cancellation no longer preceded root bubble callbacks. Preserve real root bubbling callback semantics/currentTarget, separately supplied capture handlers, child stopPropagation/preventDefault, and one notification before corresponding Lyra defaults. Do not substitute capture, fabricate/patch SyntheticEvent properties, or manually counter-forward callbacks. Controller oracle checks child click order capture-click,child-click,bubble-click and root bubble defaultPrevented=true after child cancellation. The original exact root delegated-event lint directive may remain; no new suppression/config/ignore.
- Retry Chromium/SSR17/18; WebKit15/17. Both failed browser test line168: after a finds Archive, second a expected Ångström. That expectation contradicts accent-preserving contract: a does not match å. Fix fixture/assertion to prove repeated ASCII cycling and retain a SEPARATE synthetic Unicode å→Ångström case. Do not normalize away accents. Actual Playwright keyboard.type('å') emits0 keydown events; keyboard.press('å') is unsupported, so standard dispatched Unicode KeyboardEvent with real DOM focus assertions is allowed and must be labeled synthetic. Trusted ASCII controller replay is independent.
- WebKit also failed exact native Tab test line369: body instead of After, whereas controller native public build Tab scenario reached correct target before phase check. Diagnose runner delivery/render boundary vs actual product bug. Keep exact adjacent-target assertion, no weakened truthiness/skip/sleep/arbitrary focus restoration. Controller owns independent published-entry native proof.
- Initial2.06kB exceeded2kB; retry1.99kB passed. Retain2kB, simplify event/state ownership clearly, do not raise budgets. Other9 existing focus-source overages are out of scope. Initial/retry static build/types/lint/format/docgen all passed.
- Coverage must make reopen reset meaningful (a later key that would fail with stale prefix), deterministic500ms expiry, stale unmount work, rich rendered labels/decorative-icon exclusion, no modifiers/composition, valid single owner through empty/changed collections, exact native Tab/ShiftTab, root currentTarget/phase/capture/child cancellation and all corresponding canceled defaults. No test-only product paths.
High lane: codex gpt-5.6-terra with explicit high reasoning. You may inspect scoped baseline/tests and the saved failed scoped snapshots. No further delegation, package-manager invocations, controller harness edits, managed-state edits, hook configs/ignores, services or commits. Controller reruns browser/native/size proofs.
