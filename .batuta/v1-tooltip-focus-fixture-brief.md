You are the implementation worker already delegated by Batuta. Edit directly; no further delegation, orchestration, worktrees, package managers, hooks/config/ignores, services or commits.
# Tooltip focus-lifecycle fixture — low/verification
## Goal
Make the existing focused-lifecycle fixture declare the keyboard stop it expects on native Tab.
## Context
Current d25f433 source is verified; full WebKit has one Tooltip failure at tooltip.browser.test.tsx:44: after before.focus()+Tab, BODY rather than the fixture Focused target button. The controller's32-case native control matrix proved that this WebKit skips implicit native button stops; adding explicit tabIndex0 makes the intended button reachable on Tab. Tooltip runtime correctly opens on focus and closes on blur; the fixture supplies the target button through children. Before/After controls are focused directly and need no change.
## Conventions
Follow existing React/TypeScript test formatting and role/label queries. Preserve every current strict assertion and handler. No new helper, mock, delay, skip or package. A comment is appropriate only to explain the non-obvious native tab-stop precondition. Product runtime and docs remain unchanged. Pinned Node24.18.0/pnpm11.13.1; controller runs all browsers.
## Acceptance criteria
1. Add tabIndex={0} ONLY to the focused-lifecycle fixture's button labeled Focused target (the one with onBlur setting blurred=true), with one concise comment explaining the native keyboard precondition. Keep the real Tab gesture and exact focus/open/hover/blur/close assertions unchanged. Controller proves three-engine green and a runtime blur-close mutation RED.
2. Diff is only this one test file. No Tooltip source, styles, public API, dependencies, generated docs or changeset changes. Existing baseline theme/class/axe tests remain intact. Controller verifies scope, types, lint and format.
## Boundaries
No test skips/only/relaxed assertions, programmatic focus substituted for the tested Tab gesture, runtime changes, new dependencies/configs/hooks/ignores, WORK/.batuta edits, Colima/Docker/foreign services or remote writes.
## Scope
packages/react/src/tooltip/tooltip.browser.test.tsx
Do not change anything outside this list; stop and report if more is needed.
## Expected evidence
Exact changed lines and actual diff --check/format output if run. Browser and mutation proofs are pending for controller; do not claim them. No package-manager commands; direct pinned Node static tools may be used.
## Stop conditions
The target fixture differs from this description; another source/config edit is required; a check fails twice for the same unexpected reason. Preserve all unrelated work.
