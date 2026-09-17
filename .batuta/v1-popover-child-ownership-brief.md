# Popover child ownership implementation

## Goal
Implement the exact selected .batuta/specs/2026-09-10-popover-child-ownership-design.md in the current Popover owner. You are the delegated high-lane implementation worker; controller owns routing, verification/build, review and commit. Do not delegate, start a new workflow or ask for approval.

## Context
Base2935cda, modal product879b315. Task31 modals are verified; do not edit them. Read the selected design in full and .batuta/scout/2026-09-10-popover-child-ownership.md. Current compiled native2/24PASS,22FAIL, no page errors, while existing five source tests pass. Causes are native document Escape occurring after ancestor modal React handlers; DOM-only outside containment missing React child portals; consumer cancellation ignored; unconditional request-time focus stealing under ignored/delayed/outside close. Root-bubble ownership is deliberate. The scout's document-capture/global-registry proposal was rejected for violating consumer-first cancellation; do not implement it.

## Conventions
English code/JSDoc, current named forwardRef component, CSS-first classes, current Slot/controllable-state/placement owners. No new public API or dependency. Root consumer original event delivered once before default; preventDefault cancels, root stopPropagation alone does not cancel a same-owner default. Actual React portal ancestry is observable at the root event boundary; no modal DOM scan or registry dependency.

Use existing hook/style patterns and typed props/refs; no any, cast to silence a failing signal, conditional hooks, class components or copied framework. New code must trace to the selected design. Clear your unused code, no drive-by cleanup. Pending focus intent must survive a normal controlled rerender/delayed acceptance while still relevant; listener callback replacement must not erase it accidentally. An explicit accepted close, new cycle, another close path or newer outside focus cannot replay old intent. No global state mutation during render. Existing trigger Enter/Space, Slot consumer behavior, ARIA/ref/ID and positioning stay intact.

Work test-first on actual behavior. Use vitest-browser-react/userEvent and exact activeElement/DOM presence/callback counts. expect.element for locator existence; never expect(locator).toBeTruthy. No focus mocks, permissive assertions, timer sleeps, test-only production branches, console suppression or weakening old tests. If an actual workaround is necessary mark it and explain why; prefer fixing the owning cause.

## Acceptance criteria
1. Exact child/cancellation contract: nested accepted/ignored Popovers; Dialog/Drawer/BottomSheet content parent + Popover; Popover + portalled modal child, root preventDefault vs stopPropagation, no cascade/no outside classification of a child. Native controller repeats all current baseline cases plus supported mixed root/subpath family combinations. Child-modal close remains owned by that modal and leaves its Popover parent open. Existing returnFocusTo may be used in native consumer fixtures to select the real invoker explicitly; do not alter modal semantics for WebKit pointer focus.
2. Accepted-close focus/lifetime: zero focus change for ignored close, trigger/outside focus, programmatic close without Escape intent, disconnected/ineligible trigger and newer outside focus after a delayed request. Accepted Escape from the panel restores once to the current eligible trigger; ordinary rerender/reopen/unmount cleans safely. Canceled/stopped inside event cannot poison a later normal outside event; preserve actual outside click action execution. Event classification is keyed to the native event identity, not a stale Boolean. Do not use modal-only initial-focus eligibility for a nonmodal root.
3. Scope/compatibility: no public signature, dependency, CSS, export/build or modal helper change. Source+SSR/format/types/lint/build/docgen/public declaration parity and size measured by controller; direct consumers DatePicker, DateRangePicker, TimePicker and WeeklyScheduleEditor remain passing. Original Popover runtime substituted against the new tests must fail and restored final bytes pass. Controller independently reviews before commit; no broader V1/placement/sibling-stack/pointer-sequence qualification claim.

## Boundaries
Do not install dependencies, run package managers/tests/builds, change service/browser/system/global configuration or hooks, or use Docker/Colima. Worker cannot bind Browser Mode; controller runs proofs. No git writes, commit, merge, push, remote action, Alpine/Blade/styles or generated artifact edits. Do not modify .impeccable or other tool configuration. Existing pinned Node24.18.0/pnpm11.13.1 remain. You may format scoped files with /Volumes/Home/francisross/.local/share/mise/installs/node/24.18.0/bin/node node_modules/prettier/bin/prettier.cjs.

## Scope
packages/react/src/popover/popover.tsx
packages/react/src/popover/popover.browser.test.tsx
packages/react/src/popover/popover.ssr.test.ts
.changeset/popover-child-ownership.md (React patch per current VERSIONING.md0.x convention)
No new helper file or shared-owner modification. If genuinely required, stop and report exact reason; do not widen silently.

## Expected evidence
Report exact changed files, chosen local event/lifetime mechanics, contract-to-test mapping, commands actually run and everything unverified. Tests/build passing may not be claimed because the controller runs them. No documentation-app or generated catalogs edit for this unchanged public API.

## Stop conditions
The current code contradicts the brief, the fix needs out-of-scope files, or an unexpected command fails twice for the same cause. Stop and report a concrete contradiction rather than inventing another orchestration workflow. Emit BATUTA-PROGRESS n START before the first edit for criterion n; emit DONE only if its actual proof passed locally, not for controller-pending tests. Finish with the implementation report, without committing.
