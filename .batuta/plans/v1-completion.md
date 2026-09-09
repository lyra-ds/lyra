# Plan — incumbent V1 completion
**Goal:** Finish approved incumbent stabilization and produce honest release readiness evidence, including triage of existing Dependabot maintenance updates.
**Created:** 2026-09-09 · **Status:** in progress

## Tasks
- [x] 1. BottomSheet shared return-focus integration — react/high
      Scope: packages/react/src/bottom-sheet/bottom-sheet.tsx, packages/react/src/bottom-sheet/bottom-sheet.browser.test.tsx, packages/react/src/bottom-sheet/bottom-sheet.ssr.test.ts, .changeset/bottom-sheet-return-focus.md
      Accept: accepted-close and fresh-cycle behavior in Chromium/WebKit/SSR → read-only controller verdict; type and scope compatibility → read-only controller verdict
- [x] 2. BottomSheet public consumer documentation — react/medium
      Depends on: 1
      Scope: apps/docs/components/examples/bottom-sheet/*.tsx, apps/docs/content/docs/en/components/bottom-sheet.mdx, apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx, tools/docgen/output/props.json, tools/docgen/output/llms.txt
      Accept: actual invoking examples return focus on native pointer activation → read-only controller verdict; generated API matches source → read-only controller verdict
- [x] 3. Dependency maintenance disposition — maintenance/critical
      Scope: .batuta/v1-dependency-disposition.md
      Accept: each open Dependabot PR has evidence-backed integrate/defer disposition and concrete next task → read-only controller verdict
- [ ] 4. Remaining incumbent contracts and release qualification sequence — planning/critical
      Depends on: 1
      Scope: .batuta/plans/v1-completion.md, .batuta/v1-incumbent-backlog.md, .batuta/specs/*.md
      Accept: remaining backlog has concrete independently verifiable slices and exact qualification boundaries → read-only controller verdict

- [x] 5. Remove the obsolete live-checkout freeze while preserving experimental isolation — maintenance/critical
      Depends on: 3
      Scope: tools/overlay-foundation-evaluation/repository-policy.test.mjs, .batuta/v1-maintenance-policy-verification.md
      Accept: ordinary maintenance passes in a shallow clone and prohibited candidate integration fails → read-only controller verdict; historical candidate and no-live-diagnostic safeguards remain exercised → read-only controller verdict
- [x] 6. Apply pnpm action maintenance from PR 220 — maintenance/low
      Depends on: 5
      Scope: .github/workflows/ci.yml, .github/workflows/deploy.yml, .github/workflows/release.yml, .github/workflows/sponsors.yml, tools/file-upload-evidence/scripts/deploy-policy.mjs
      Accept: only reviewed action digest/version advances while pnpm stays 11.13.1 → read-only controller verdict; workflow and repository policy checks pass → read-only controller verdict
- [x] 7. Prepare and qualify the compatible existing-library maintenance batch — maintenance/high
      Depends on: 5
      Scope: package.json, pnpm-lock.yaml, apps/docs/package.json, apps/site/package.json, tools/file-upload-evidence/package.json
      Accept: only selected existing dependency versions change → read-only controller verdict; install/build/types and affected runtime checks pass with held bridge versions preserved → read-only controller verdict

- [x] 8. Clarify captured-target eligibility in public BottomSheet JSDoc — documentation/low
      Depends on: 2
      Scope: packages/react/src/bottom-sheet/bottom-sheet.tsx, tools/docgen/output/props.json, tools/docgen/output/llms.txt
      Accept: source and generated prop documentation explicitly require an eligible captured opener → read-only controller verdict; compiled runtime bytes unchanged and owner generation matches → read-only controller verdict

- [x] 9. Repair reproduced WorkspaceSwitcher metadata contrast — react/medium
      Scope: packages/styles/components/navigation/navigation.css, packages/react/src/workspace-switcher/workspace-switcher.browser.test.tsx, tools/parity/parity.mjs, .changeset/workspace-switcher-contrast.md
      Accept: actual light/dark rest/hover/focus axe coverage passes with original-CSS regression RED → controller proof; local additive change preserves handoff and parity → controller proof

- [ ] 10. Diagnose and resolve measured incumbent focus-size overages — performance/critical
      Scope: .batuta/v1-focus-size-diagnosis.md, .batuta/specs/*.md; product correction scope must follow measured diagnosis
      Accept: original nine overages plus the measured Tooltip delta attributed using same-tool old/new graph and source builds → controller proof; a reviewed bounded optimization or justified measured budget decision preserves all approved focus behavior → controller proof

- [x] 11. Repair existing Dropdown keyboard navigation contracts — react/critical (medium + high retries, controller completion)
      Scope: packages/react/src/dropdown/dropdown.tsx, packages/react/src/dropdown/dropdown.browser.test.tsx, packages/react/src/dropdown/dropdown.ssr.test.ts, .changeset/dropdown-keyboard-contract.md
      Accept: current-source regression proves roving tabindex/typeahead and consumer-first cancellation → native/browser/SSR proof; current public variants and native Tab behavior preserved → controller proof

## Decisions and context
The maintainer authorized continuing until completion on September 9. This operational continuation uses the previously approved incumbent direction and returnFocusTo contract; no redundant approval is required. This plan is the current executable tranche, not a claim that four tasks alone qualify V1. Subsequent concrete repair and qualification slices will be appended as diagnosis establishes their scope. Keep all 11 P1 components and all 23 required acceptance cells unqualified until bound evidence exists. Public release/versioning and remote writes remain separate actions. Never change Colima configuration or operate Docker/Colima. No foreign service changes. Existing dependency maintenance is being assessed at the maintainer's request; no new foundations or runtime libraries. Main checkout is managed dirt; feature work remains in the stabilization worktree. Keep raw experimental evidence immutable.

**Task 4.** Reproduce and specify remaining slices before dispatch: modal initial-focus/sibling/nested/inert ownership; Popover child-layer dismissal; Dropdown tab order/typeahead; Tooltip approved timing; WorkspaceSwitcher create-action semantics and Alpine cancellation/ARIA; CreateWorkspaceDialog async operation/cancellation/stale-result API; Tabs actual panel-content ownership; DataTable semantic keyboard row actions separate from selection; fresh Alpine BottomSheet proof. Then specify candidate/evidence binding and execute exact packed React18/19, browser, SSR/hydration, security, types, consumer and bundle checks. Public APIs require a concrete compatibility/migration design; do not adopt another foundation. This is a work sequence, not evidence that each historical allegation is a current defect.

**Task 5.** The obsolete test freezes all packages/workflows/lockfile git objects and blocks current stabilization as well as Dependabot. Replace that accidental maintenance prohibition with the actual suspended-experiment boundary. Preserve exact historical candidate metadata and existing live-diagnostic exclusions, reject direct experimental foundation dependencies in root/workspace manifests, and prove legitimate version/source/workflow maintenance is allowed in shallow checkout fixtures. Do not refresh snapshot constants, skip tests, edit historical evidence or promote the V1 ledger. Ledger qualification is owned by the V1 release gate rather than an experiment's checkout snapshot.

**Task 7.** Use .batuta/v1-dependency-disposition.md. Hold Playwright1.62.1 and Vite8.2.1 until a separate coordinated evidence/image migration. Defer Changesets majors. Do not install into controller-provided symlinks: remove only the exact owned links, then create this worktree's own dependency installation with pinned Node24.18.0/pnpm11.13.1. Existing global settings and Colima remain untouched. Numeric bundle budgets and final baseline binding belong to final candidate measurement; do not silently update baseline hashes here. If an individual maintenance update fails compatibility, retain the old version and record the concrete failure instead of broadening migration.

**Task 7.** First selected batch is the11 tooling/docs updates in the disposition follow-up. Also hold lucide-react, Alpine/CSP and tsdown with their current artifact/consumer fixture baseline. No published package manifest changes and no new changeset for private docs/development-only updates. The worktree now has its own current frozen dependencies, installed offline with exact pnpm11.13.1.

**Task 9 precedes Task 7.** The current-library React baseline at87f7775 is761/763 with only two WorkspaceSwitcher contrast failures. Correct the actual defect and empty-value dark fixture before dependency comparison. Guarded GLM scout required one retry after external evidence-file access was rejected; retry used controller-supplied evidence inline and completed unchanged. No fixture movement that hides hover failures.

**Task 7 completed locally.** Selected11 versions installed/generated with pinned pnpm11.13.1, current tests/builds/types/lints and export checks pass.453 generated public files unchanged; all9 React size-limit failures identical across old/new library graphs. Those measured source overages are Task10, not waived by this maintenance approval. All remaining P1/packed Linux requirements remain open.

## Remaining execution order and qualification boundary
After Task11, each item below requires a fresh bounded reproducer before an implementation brief. Historical source allegations are not release failures by themselves. Keep corrections in current owners, reuse existing hooks and styles, and introduce no additional runtime dependency.

1. Tooltip: current trigger/content ownership and approved focus-immediate, hover500ms, document-warm0ms/grace300ms, pointer-transition100ms, Escape and stale-timer cleanup contract. Primary owners packages/react/src/tooltip/tooltip.tsx and colocated browser/SSR tests; any additional internal timing owner needs an explicit scoped brief. Qualify real focus/hover ownership and deterministic clock boundaries; preserve semantic trigger, description IDs and native coarse-pointer action.
2. WorkspaceSwitcher: reproduce selected-option entry, create-action semantics and consumer cancellation separately for existing React/Alpine support. Scope each stack independently; do not imply cross-stack equivalence. Contrast is already closed and must remain passing.
3. Remaining modal and anchored ownership: prove one concrete initial-focus, sibling/nested, inert or Popover child-dismissal failure at a time. Reuse current focus/portal/presence/scroll-lock owners. Existing returnFocusTo and repaired native Tab/Escape behavior are mandatory regressions. Any shared coordination proposal must explain its minimum ownership and teardown before implementation.
4. CreateWorkspaceDialog lifecycle: author a concrete compatibility design in .batuta/specs/ for the existing synchronous onCreate surface and normative operationId/AbortSignal/result state lifecycle before changing that public API. Retain Dialog composition and consumer-owned creation effects. Verify duplicate submit, invalid input, abort, stale resolution, error/retry and accepted-close behavior.
5. Tabs and DataTable: settle actual content ownership and semantic keyboard row actions using the current public models. Public migration decisions need a concrete Batuta design; no enterprise grid or speculative variants. Selection and command activation must have separate behavioral proofs.
6. Alpine BottomSheet: establish fresh browser focus/teardown evidence; historical axe/focus allegations remain unconfirmed until reproduced. Scope any repair only from that result.
7. Final candidate: rebuild exact final artifacts; resolve Task10 using the specified same-pipeline packed comparison without silently refreshing limits or hashes. Bind package/version/file identities to evidence and run available React18/19, browser, SSR/hydration, types, security, export/consumer and bundle gates. A check on source builds is not a check on packed release artifacts.

The required pinned Linux/browser matrix cannot be substituted by local macOS Chromium/WebKit runs. Docker/Colima operations and remote workflow dispatch/publication are outside current authorization. Prepare everything locally that can be verified; retain unavailable cells as pending and identify the exact reviewable final remote action if one is needed. Existing Dependabot PRs remain open remotely; local adoption is not a merge. Do not label the11P1 components or23acceptance cells qualified before their bound evidence exists.

- [x] 12. Diagnose six current WebKit focus failures — verification/critical, read-only scout first
      Scope: current test evidence and the existing DatePicker, DateRangePicker, TimePicker, Tooltip and FileUpload owners; correction scope follows each reproduced cause.
      Accept: distinguish actual native input behavior and fixture assumptions from product regressions with a bounded reproducer; assign independently verifiable repairs without weakening exact focus assertions or introducing dependencies.

**Task 11 completed locally.** Final full React Chromium/SSR779/779; focused Chromium/SSR23, WebKit22 and Firefox22; compiled27 and synchronous consumer-reorder regression PASS. Dropdown remains within2kB. Independent GLM3/3 DONE/no findings/unchanged guard. Final source has no new runtime dependency or public API. Broader source baselines discovered6 separate WebKit failures (673/679) while full Firefox679/679 passed before the final Dropdown identity correction; Task12 diagnoses those exact failures before changing owners.

## WebKit baseline correction tranche
- [x] 13. Establish the Tooltip focus-lifecycle fixture's native tab stop — verification/low
      Scope: packages/react/src/tooltip/tooltip.browser.test.tsx
      Accept: exact focus/open/blur/close assertions pass across three engines and still catch a disabled blur close; no runtime change.
- [x] 14. Follow native Calendar entry without a fixed platform stop count — verification/low
      Scope: packages/react/src/date-picker/date-picker.browser.test.tsx, packages/react/src/date-range-picker/date-range-picker.browser.test.tsx
      Coupled fixtures share the same Calendar traversal cause. Accept: bounded real Tab traversal reaches the exact active day and retains selection/normalization/close assertions; making the active day unreachable still fails.
- [x] 15. Establish real focus ownership in FileUpload removal fixtures — verification/low
      Scope: packages/react/src/file-upload/file-upload.browser.test.tsx
      Accept: focused keyboard removal preserves next/previous/input fallback only after controlled commit; moving focus outside prevents stealing; no runtime change and no permissive assertions.
- [x] 16. Preserve the current TimePicker option tab sequence explicitly — react/low
      Scope: packages/react/src/time-picker/time-picker.tsx, packages/react/src/time-picker/time-picker.browser.test.tsx, .changeset/time-picker-keyboard-stops.md
      Accept: native Tab reaches the existing first option across engines, existing arrows/Home/End and keyboard activation work, selection closes normally; no API/dependency/variant change, measure the bounded size delta without changing budgets.

- [x] 17. Reproduce and specify the incumbent Tooltip timing/ownership gap — verification/design critical with guarded GLM scout
      Scope: .batuta/v1-tooltip-timing-diagnosis.md, .batuta/specs/2026-09-09-tooltip-timing-design.md, controller-owned native artifacts
      Accept: pinned native clock/input establishes actual cold/leave/combined/topmost/bubble behavior; minimal current-owner correction preserves public API, real content hoverability, description and cleanup without dependencies.

- [x] 18. Repair incumbent Tooltip timing and ownership — react/critical (high initial/retry, controller completion)
      Depends on: 17
      Scope: Tooltip source/browser/SSR tests, optional internal/tooltip-coordinator.ts, additive feedback.css/parity, React+styles patch changeset
      Accept: specs/2026-09-09-tooltip-timing-design.md criteria1–3, controlled clocks/native ownership/cleanup, public compatibility and measured size; independent review before commit.

- [x] 19. Focus the selected React workspace on every supported opening key — react/low
      Scope: packages/react/src/workspace-switcher/workspace-switcher.tsx, colocated browser test, .changeset/workspace-react-selected-entry.md
      Accept: native click/Enter/Space/ArrowDown/ArrowUp enters selected middle workspace; preserve post-open navigation, callbacks, create behavior and fallback; no API/dependency change.
- [x] 20. Prefer the served selected Alpine workspace on arrow opening — alpine/low
      Scope: packages/alpine/src/workspace-switcher.ts, colocated browser test, .changeset/workspace-alpine-selected-entry.md
      Accept: supported opening methods focus served selected workspace; retain no-selection arrow fallback, consumer-owned aria-selected, event payload/ordering and cleanup; no new API/dependency.

- [x] 21. Honor consumer-first React workspace keyboard cancellation — react/medium
      Scope: packages/react/src/workspace-switcher/workspace-switcher.tsx, colocated browser test, .changeset/workspace-react-keyboard-cancellation.md
      Accept: original root event delivered once before defaults; preventDefault stops opening/navigation/dismissal, stopPropagation alone preserves defaults; native/browser/SSR and compatibility proof, no API change.

- [ ] 22. Separate the existing React creation command from workspace selection — react/high
      Depends on: 21
      Scope: WorkspaceSwitcher source/browser/SSR, .changeset/workspace-create-command.md
      Accept: specs/2026-09-09-workspace-command-design.md; native command semantics, roving/native Tab, empty-state/activation and cancellation; unchanged API/styles and measured budget.
