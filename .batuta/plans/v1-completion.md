# Plan — incumbent V1 completion
**Goal:** Finish approved incumbent stabilization and produce honest release readiness evidence, including triage of existing Dependabot maintenance updates.
**Created:** 2026-09-09 · **Status:** in progress

## Current release scope and order — 2026-09-10

Maintainer correction: finish Lyra core (Styles/React, its first-party docs and
release tooling) and Alpine V1 before working on Blade. Earlier "next Blade"
notes below are historical and superseded. Blade migration/qualification is a
later satellite task, not a core/Alpine release prerequisite. Preserve the
imported snapshot and existing checks; do not claim compatibility with the new
Alpine Tabs markup before its producer migrates.

Execute in this order:
1. Task28: reproduce DataTable row-command keyboard access and its separation
   from selection; select a bounded native-table API/migration contract, then
   implement and verify the current owner and public examples.
2. Task31 and Task38: close remaining modal/inert/dynamic-focus/sibling teardown
   and Popover child-layer ownership using fresh reproducers and bounded fixes.
3. Task10: standalone overages are resolved under the11explicitly approved caps
   (72/72packedPASS, unchanged assets). Complete remaining performance, scenario/
   migration-delta and historical-baseline disposition while preserving behavior.
4. Task39: qualify the exact final core/Alpine candidate across the required
   browser, React18/19, SSR/hydration, types, security, consumer, visual and manual
   accessibility checks. Unavailable Linux/remote/manual evidence stays pending.
5. Only after core/Alpine closure, resume the deferred Blade producer migration
   and its own compatibility qualification.

Tabs React/Alpine implementation and public documentation are locally verified
through3446d98. Their final release qualification remains part of Task39, not a
reason to begin Blade now. No new release/resource/remote authorization follows
from this priority correction.

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
      Accept: original nine overages plus measured Tooltip/WorkspaceSwitcher deltas attributed using same-tool old/new graph and source builds → controller proof; a reviewed bounded optimization or justified measured budget decision preserves all approved focus behavior → controller proof

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

- [x] 22. Separate the existing React creation command from workspace selection — react/high
      Depends on: 21
      Scope: WorkspaceSwitcher source/browser/SSR, .changeset/workspace-create-command.md
      Accept: specs/2026-09-09-workspace-command-design.md; native command semantics, roving/native Tab, empty-state/activation and cancellation; unchanged API/styles and measured budget.

- [x] 23. Migrate public workspace documentation to verified behavior — documentation/low
      Depends on: 22
      Scope: apps/docs/content/docs/{en,pt-BR}/components/workspace-switcher.mdx
      Accept: selected entry, separate React creation command/native Tab accurately described; actual Alpine selection-only bindings/data-id/ARIA example executes and no unsupported creation claim remains.
- [x] 24. Honor consumer-first React workspace click cancellation — react/medium
      Depends on: 23
      Scope: WorkspaceSwitcher source/browser, .changeset/workspace-click-cancellation.md
      Accept: original root click precedes defaults, prevents opening/domain effects; stable clicked identity under synchronous consumer reorder; native/browser/static proof, no API change.
- [x] 25. Design and repair native Alpine modal Tab containment — alpine/high after critical design
      Scope: existing internal/focus-trap.ts and bounded direct-consumer tests, Alpine patch changeset; exact brief follows the guarded scout.
      Accept: actual non-edge forward/reverse Tabs remain contained with native intermediate navigation, cancellation and complete teardown; current return-focus pointer issue stays separate.

## Remaining public contract designs
- [x] 26. CreateWorkspaceDialog operation lifecycle runtime — high initial/retry then critical/controller test-fixture completion. Native87, source12/11/11, actual examples6/12creates, public types/build/docgen/visual8 PASS; GLM3DONE/no concrete findings/unchanged guard. Existing size cap fails at approximately5.12/3.2kB (Task10). Public MDX follows as Task37; no overall V1 qualification.
- [x] 27. Tabs compound real-content implementation and public migration — React and Alpine runtime/docs locally verified through3446d98, including native fallback and panel-container teardown. Final core/Alpine qualification belongs to Task39. Blade producer migration is deferred until core/Alpine V1 closure; no Blade compatibility claim.
- [x] 28. DataTable semantic cell actions — removed unsafe onRowClick under the pre1 compatibility exception; existing native action cells, real example and both public snippets locally verified. Source10eachengine/SSR2/native66/actualSSR4/types/MDX2/stack303/docgen PASS; oldsourceRED/restoredPASS, DataTable1638/2250B. GLM3DONE/no findings/unchangedguard/verifierPASS. See .batuta/v1-data-table-verification.md. Final core/Alpine qualification remains Task39.

## Remaining modal ownership order
Current guarded scout at19bf93a locates missing initial-target/inert/dynamic-focus ownership and cross-family Escape inconsistency; source gaps require native reproduction before repair.
- [x] 29. Complete the existing cross-family Escape consumption protocol for Drawer/BottomSheet — medium coupled current-owner repair after native reproduction, covering both parent/child directions and CommandPalette descendants. Preserve Dialog precedent, consumer cancellation and non-Escape behavior; no newAPI/manager.
- [x] 30. Alpine captured-opener and successor contract — critical diagnosis/design from the six old WebKit failures before publicoptions/callerfixture changes. Do not confuse pointerfocus ownership with nativeTab containment.
- [x] 31. React modal initial-target, inert, dynamic-focus and sibling/teardown ownership — critical design split into independently verifiable current-owner slices after freshnative proof. Preserve currentreturnFocusTo/Tab/Escape/presence/scroll behavior; no newfoundation/runtime dependency.
Task29 followsTask25 because its existing-owner inconsistency is directly localized. Then close the bounded modal/API prerequisites for Task26; the lifecycle draft remains in controller artifacts and is not dispatched prematurely. Tasks27/28 still require finalfamilydesigns.

- [x] 32. Publish Alpine modal return destination examples — documentation/medium, depends30. Scope eight en/pt-BR Dialog/Drawer/BottomSheet/CommandPalette pages; actual registered binding snippets and explicit/current successor, eligible fallback, no-call/inline/scroll boundaries. Accept exact snippets native three-engine plus MDX/stack/format proof; no runtime/API changes.

- [x] 33. React safe initial modal destination — critical after high initial/retry, first bounded Task31 slice. Scope four current modal source/browser/SSR owners, private internal/use-initial-focus.ts and directbrowser test, React patchchangeset under current0.x convention and owner-generated catalogs. Accept exact .batuta/specs/2026-09-09-react-modal-initial-focus-design.md; threeengine hidden-first/declared/fallback/lifecycle/StrictMode/SSR/native and negative proof, retain return/Tab/Escape. Public docs follow immediately; no validation/inert/dynamic/topmost qualification by this slice.

- [x] 34. Publish React initial destination examples — documentation/medium, depends33. Scope two existing liveexamples (DialogBasic Cancel, DrawerWithoutFooter readingheading) and eight en/pt-BR React MDXsections; preserve existing returnFocusTo and natural palette search. Accept exactMDX/publictype/native examples plus unchanged Alpine/Blade portions and independent review. Brief .batuta/v1-react-modal-initial-focus-docs-brief.md.
- [x] 35. Audit incumbent pre1.0 changeset metadata — maintenance/low after read-only diagnosis. Scope .changeset/*.md for actual justified compatible metadata corrections; no version commands. Accept VERSIONING.md0.x patch/additive and minor/breaking convention on current incumbent changesets; no product artifact changes. Known Alpine return-focus additive minor requires correction; final deliberate1.0 release remains separate.

- [x] 36. Logical-close React modal activity — high initial/test retry then critical fixture completion; final153/139/139 source,186compiled native, two source fault proofs, static/build/docgen PASS; GLM3DONE/no findings/unchanged guard/verifierPASS. Runtime11file scope, no dependencies or broader modal qualification. See .batuta/v1-react-modal-logical-close-verification.md. SizeTask10 remains12React+1Alpine failures.

## Immediate documentation follow-up
- [x] 37. CreateWorkspaceDialog public lifecycle and migration — medium260.61s +168.7s retry, high130.12s two-clause completion. Current twoMDX/snippettypes/stack303/format PASS; exactcurrentconsumer24native and finalsnippet/453artifactSHAparity. GLMfinal36.75s3DONE/no findings/unchangedguard/verifierPASS. CompleteHTML/frontmatter/Exampleids preserved; no new demo. See .batuta/v1-create-workspace-docs-verification.md.

Task27 fresh baseline on2026-09-10: actual TabsLine example/currentpubliccompiledcode has empty named panels with real Project summary outside in all3engines, no pageerrors. See .batuta/v1-tabs-owned-content-diagnosis.md and .batuta/scout/2026-09-10-tabs-compound-design-support.md. Support proposals are advisory; exact compound/SSR/invalidvalue/Alpine/migration design remains to be selected and technically reviewed before implementation.

Task27 design selected2026-09-10 after GLM301.61s and346.17s technical reviews, all findings adjudicated under .batuta/runs/. React high scope is closed in .batuta/v1-tabs-owned-content-brief.md: four named parts, three current consumers, deterministic SSR/native behavior and proven shared CSS hidden repair. No Alpine runtime/MDX edits in this first slice, no cap/dependency/global configuration changes.

Task27 Alpine preparation: real native baseline3preinitPASS/12contractFAIL, source3enginePASS, event-order probe24PASS. Selected implementation uses the owned-root bubble boundary after list/trigger consumers; no new async default or manager. Imported Blade Tabs markup is incompatible with the required fallback contract and needs owning-source migration/qualification before declaring full family/V1 compatibility; imported snapshot stays read-only.

Task27 paused2026-09-10 at failed initial Alpine verification: source/static/build/publictypes PASS, compiled native48/63 PASS,15FAIL, zero browser errors. Four runtime defects and source coverage obligations recorded in .batuta/v1-tabs-alpine-verification-checkpoint.md. Initial high executor finished; first high retry not dispatched. User requested pause; do not start another slice automatically.

Task27 Alpine runtime accepted locally2026-09-10 after one high retry and critical source-fixture/coverage correction:17source tests each engine,63native, public/static/build checks PASS; GLMfinal245.2s3DONE/no findings/unchanged guard. WholeAlpine23022/21200bytes unwaived Task10. Next public Alpine MDX/snippet proof, then owning-source Blade migration; see .batuta/v1-tabs-alpine-verification.md. No remote/release/Colima action.

Task27 Alpine public docs and focused panel-container teardown accepted locally2026-09-10: two current MDX snippets,90native scenarios plus63existing native and20source tests eachengine PASS; old runtime2RED/restored2PASS. GLM3DONE/unchangedguard/verifierPASS. WholeAlpine23051/21200B remains unwaivedTask10. Next owning-source Blade migration/qualification; current imported snapshot remains read-only/incompatible. See .batuta/v1-tabs-alpine-docs-verification.md.

## Final core/Alpine closure tasks
- [x] 38. Popover child-layer ownership — critical diagnosis, then bounded
      current-owner repair only if reproduced. Scope starts with the existing
      Popover owner, native child-layer scenarios and colocated tests. Accept:
      child interactions/dismissal do not incorrectly close parent layers;
      native cancellation, focus, placement and teardown remain correct.
- [ ] 39. Exact core/Alpine V1 candidate qualification — critical verification,
      after Tasks28/31/38/10. Bind exact package/version/file identities to the
      required evidence and existing CI/release policy. Accept: required
      Styles/React/Alpine browser, packed consumer, React18/19, SSR/hydration,
      security/types/exports/size, visual and manual accessibility evidence is
      complete and reviewed. No false qualification of missing cells; prepare
      concrete final external actions for review if required by the unchanged
      authorization boundary. Blade-specific migration/compatibility is deferred,
      existing checks are preserved, and no publication is implied.

- [x] 40. Local React modal dynamic focus recovery — bounded Task31 slice in existing shared hook;35shared +121four-owner tests each engine, SSR14, compiled252native, types/lint/build/docgen/publicAPI/hash proof PASS. Original source2RED/restoredPASS and four critical regression negatives prove corrections. CodexTerra/high initial+retry then critical completion; final GLM3DONE/no findings/unchangedguard/verifierPASS. See .batuta/v1-modal-dynamic-focus-verification.md. Background inert/topmost/parent-child ownership remains Task31;12React size failures remain unwaived Task10.

**Task31 completed locally at879b315.** Initial focus33, logical close36 and dynamic recovery40 are joined by final background isolation, coherent topmost/parent-child branch ownership and teardown. Source201each engine/SSR14/native342/static/build/docgen and153protected hashes PASS;450React artifacts bound. Independent GLM3DONE/no findings/unchanged1995-file guard/verifierPASS after focused review corrections. See .batuta/v1-modal-isolation-verification.md. Twelve React and one Alpine size failures remain unwaived Task10. Next Task38 Popover current-owner child-layer diagnosis/repair, Task10 measured size resolution, then Task39 exact core/Alpine qualification; Blade deferred.

**Task38 bounded correction completed locally atb471a5c.** Source40eachengine/SSR5/native51/static/build/docgen and153protected hashes PASS; original14RED/restored23PASS. Independent GLM3DONE/no behavioral findings/unchanged2002-file guard/verifierPASS. See .batuta/v1-popover-child-ownership-verification.md. Task39 must explicitly audit remaining anchored placement/RTL/resize and ownership coverage, including the constrained BottomSheet observation; this slice does not qualify those cells. Next Task10 sizes, then exact core/Alpine automated qualification. Blade deferred.

**Task10 private-icon optimization tranche completed locally (2026-09-11).** FileManagerae229b2 and WorkspaceSwitcherf4336e0 now pass their unchanged standalone caps at5530/9500B and2889/8250B. Source58eachengine/SSR2/native54exactSVG+pixel/public153/final453artifact identity and independent review PASS. Remaining10React+1Alpine budgets stay failed and unwaived; Task10 is not closed. See the two component verification records and latest .batuta/v1-focus-size-diagnosis.md. No release/Blade action.

**Task10 remaining-budget evaluation completed locally (2026-09-11); resolution still open.** At47d0dc1, disposable Tooltip/Alpine simplifications save12/14B and still fail; modal shared-hook extraction grows seven entries and two scenarios. No prototype promoted.453active artifacts unchanged,9tarball hashes/3cleanups/same72imports+cold consumer graph verified; GLM final3DONE/no findings/2014-file guard/verifierPASS. See .batuta/v1-remaining-size-limits.md for exact measurements, rejected unproven cleanup deletion and missing architecture-exception inputs. Next applicable runtime/module-contribution evidence and explicit architecture/budget decision; no cap/baseline waiver. All11failures, Task39 and Blade boundary unchanged.

**Task10 size foundation prepared for maintainer discussion (2026-09-11).** .batuta/v1-budget-foundation.md separates actual Vite minified/Brotli, Size Limit, npm-package and shared CSS costs, explains retained modules/source-region growth, and proposes only11standalone caps with explicit5%maintenance allowance rounded100B (not approved). Existing453artifact identities and matchedgraph/buildoverlay verified; extra exact packed root-import scenario experiment grows all5Brotli totals and is not adopted. GLM3DONE/no findings/2015-file guard/verifierPASS. All11current gates remain failed; quantified responsiveness, scenario-budget disposition, accepted ADR and exact core/Alpine qualification remain distinct pending work. Blade remains deferred.

**Task10 standalone cap resolution complete locally (2026-09-11).** Maintainer accepted the11previously proposed values after discussing page payload. GLM5.3Flash/low59.63s config-only/no retry; controller cold packed37.91s,72/72PASS with same actualsizes/453compiled artifacts/5scenarios/4CSS,3tarball hashes and guarded cleanup. Complete packed files differ only in two package manifests. Workspace71+1 and format/scope PASS. GLM final7.80s3DONE/no defects/2016-file guard/verifierPASS. See .batuta/specs/2026-09-11-v1-standalone-budget-decision.md. Remaining performance/scenario/delta/baseline disposition andTask39/mobile-page qualification stay pending; no V1 release or Blade action.

**Task39 representative mobile production-consumer laboratory slice complete (2026-09-11).** .batuta/v1-mobile-validation.md records exact6dacf7e packed consumers,60coldloads and510trusted timed operations with30recorded samples peroperation,3warmups, controlled mobile viewport/CPU/network and separate blocking controls. React/Alpine LCPp75 836/520ms and layout-shift sum0; actual compressed pagepayload77724/53471B inclframeworks. Routine/nested p95 below56ms;1000row expansion83.1/151.5ms with long tasks explicitly retained. No JS errors/horizontaloverflow or product edits;453artifact identities, fullfileguard, installed-byte hashes and owned cleanupPASS. Independent GLM13.48s3DONE/no findings/2018guard/verifierPASS. This resolves the requested representative lab validation, not the entire Task39 release matrix or field/physical-phone/approved-family performance evidence. Next exact final core/Alpine qualification and explicit scenario/migration-delta/historical-baseline disposition; Blade remains deferred.

**Task39 final-gate audit remains open (2026-09-11).** See `.batuta/v1-final-gates.md`: local static/build/packaging and72standalone caps pass except historicalbundlebaseline; hostReact818perenginePASS. FullLinuxbuild/matrix remain incomplete, and hostAlpineWebKit has2reproduced native-focus failures (AccordionTab and DatePickerBODYopener capture). No runtime changes from this gate audit; docs/example and test-fixture prerequisites committed through4b324ef,453generated artifacts unchanged. Complete nativefocus disposition and canonicalLinux gates before final23-cell/P1packed qualification; no false ledger completion or Blade/release action.

**Task39 focus follow-up (2026-09-11):** Accordion40d8084 and DatePicker040f210 close the two reproduced Alpine WebKit failures. Complete pinned Linux Alpine now319tests/34files perengine PASS. CommandPalette fixture correction also passes31cases perengine host/Linux with native negatives, real delayed-reopen proof, clean static checks and unchanged450React artifacts; see .batuta/v1-cmdk-reopen-verification.md. Full Linux React matrix is running separately. Canonical Linux React build remains memory-limited without authorized environment changes; historical baseline/path normalization and exact23-cell/P1qualification remain distinct open work. Blade stays deferred.

Task39 Drawer fixture verified: desktop native backdrop hit and scoped viewport restoration;20cases/engine host+Linux, real resolver fault caught. React partitioned WebKit coverage82files/818cases complete; original continuous resource failure remains. Fresh baseline collector confirms72standalone caps pass and1109modulelabels contain no absolute paths, but historical environment/artifact/scenario drift remains unwaived. See .batuta/v1-drawer-backdrop-verification.md; next exact Linux build and P1 qualification.

Task39 canonical Linux React build resolved by fresh per-entry512MiB processes: all450outputs byte-identical; actual failure and full recovery verified. See .batuta/v1-bounded-build-verification.md. Next P1compat producer correction requires disposition of missing fixture Node types (maintainer exception question pending), named per-component hydration/native proof and fail-closed report validation. Draft and original failed runs preserved in MAIN raw p1-proposal-attempt1; not integrated. Historical bundle/scenario acceptance and formal ledger remain pending.

Task39 P1packedcompat slice completed: all11components eachReact18/19 have namedNodeSSR plusmatchingHTMLhydration/native cases, strict report guards and actualnegativeproof. ExistingFileUpload proofs retained. See .batuta/v1-p1-react-compat-verification.md. Historicalbaseline/scenario and remaining forcedcolors/motion/RTL/coarsepointer/axe/ledger evidence stayopen; this is not wholeV1qualification.

- Dialog profile follow-up: new packedReact19 producer verifies6media/theme/directioncases perengine.18executed;16PASS and2real Chromium/FirefoxforcedcolorsfocusFAIL exposed. Toolreviewed; owningCSSfix pending. Othercomponents/coarsepointer/ledger/baseline stillpending.
