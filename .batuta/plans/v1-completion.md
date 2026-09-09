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
      Accept: nine overages attributed using same-tool old/new graph and source builds → controller proof; a reviewed bounded optimization or justified measured budget decision preserves all approved focus behavior → controller proof

- [ ] 11. Repair existing Dropdown keyboard navigation contracts — react/medium
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
