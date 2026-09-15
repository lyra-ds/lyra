# V1 coverage-gap review — 2026-09-13

Read-only comparison at `30644f7`, following the maintainer's [backlog triage](../../plans/v1-backlog-triage.md). OpenCode/GLM research, one targeted correction, both unchanged-tree guards. The controller checked source assertions, contract references, actual CLI options and raw package/source identities. This report proposes bounded next actions; it approves no implementation queue. No tests, builds, package installs or remote workflows were executed.

## What already exists

The acceptance profile in `docs/superpowers/baselines/lyra-v1/program.json` names 23 dimensions across 11 P1 components. These are requirements, not 253 instructions to create new tests.

| Components | Existing behavioral coverage to retain | Qualification still distinct |
| --- | --- | --- |
| Dialog, Drawer, BottomSheet | React/Alpine component tests; shared modal focus, dismissal and lifecycle checks. Latest repair evidence has 18/18 packed media cases each. | Physical/coarse-pointer evidence and full platform/release acceptance. |
| Popover | React outside-close, accepted/cancelled/nested Escape, focus-return eligibility and programmatic-close tests; Alpine toggle, outside-close, Escape, placement and axe. | Native sequential Tab traversal is not proved merely by setting focus before Escape. Full packed profile remains incomplete; motion repair alone is proved. |
| Dropdown | React keyboard opening, roving/typeahead, cancellation and Tab continuation; Alpine arrows/Home/End/Escape/Tab, selection and placement. | Alpine typeahead contract discrepancy below; remaining media/coarse-pointer qualification. |
| Tooltip | React timing, document warmth, ownership, Escape and placement; Alpine focus/hover, Escape and placement. | React timing is explicitly scoped: the later timing contract preserves CSS-only/Alpine behavior. Remaining media/coarse-pointer qualification. |
| CommandPalette, WorkspaceSwitcher | React/Alpine modal or inline ownership, focus/selection, cancellation, navigation and placement tests. | Complete media/direction/touch qualification is not established by those behavioral cases. |
| CreateWorkspaceDialog | React validation, async operation identity, cancellation/retry and Dialog composition; named compatibility cases. | No Alpine counterpart is claimed by the support inventory. Remaining media/touch qualification. |
| Tabs, DataTable | React/Alpine owned panels or native table behavior, keyboard/selection/sort checks; Tabs has explicit RTL-arrow assertions in both stacks. | Tabs reference drift below; RTL-arrow proof does not qualify every visual/media/direction requirement. |

Evidence anchors: React `src/popover/popover.browser.test.tsx:57,78,101,121`; Alpine `src/popover.browser.test.ts:98,138,160`; React `src/tabs/tabs.browser.test.tsx:233`; Alpine `src/tabs.browser.test.ts:203`; `.batuta/v1-p1-react-compat-verification.md`; `.batuta/reviews/v1-product-review/react-popover-motion.md`. Paths beginning `src/` in this paragraph belong to their named `packages/react` or `packages/alpine` package.

Across the 23 dimensions: Chromium/Firefox/WebKit source suites already exist; React18/19, SSR and hydration have named packed P1 evidence; keyboard and axe checks exist in component suites. Forced colors, reduced motion, direction and coarse-pointer need their own applicable observations. Standalone/composition size, packed ESM/CJS/types and Vite/Next/CommonJS consumer checks already have package tools. Existing tools are not proof that every final-candidate acceptance cell has passed.

## Six retained gaps, with the smallest useful next action

1. **Permanent regression coverage for reproduced CSS defects — justified small test work.** The Popover motion repair is proved by archived diagnostics, but the committed Styles suite has no Popover motion assertion. `packages/styles/tests/dialog.test.ts:85` protects Dialog close focus; searches of the Styles tests found no Drawer/BottomSheet close variants. Those two fixes also have raw packed evidence. Reuse the existing native media command in `packages/styles/vitest.config.ts:51` and browser suite. Start with one Popover normal-motion/reduced-motion regression; later consider the two already-reproduced close-focus variants. No new report producer, wrapper command or framework. Suggested first scope: `packages/styles/tests/popover.test.ts` only, importing existing Styles CSS and using the existing command. A meaningful proof must fail when the repaired CSS rule is temporarily reverted, then pass after exact restoration.

2. **Applicable media and coarse-pointer evidence beyond the modal slice — coverage gap, not an automatic producer queue.** Bounded searches found committed media assertions mainly in Styles Dialog and FileUpload tests, with explicit Tabs RTL navigation in both component stacks. Existing modal packed media reports and Popover motion diagnostics are reusable only within their recorded scope. The remaining anchored/composed/selection and Alpine media/touch coverage is not established. Use current public fixtures and existing browser tooling to inspect the next concrete requirement; add an assertion only for an actual uncovered contract. Do not restart the failed Popover keyboard producer or infer a new runner from a missing filename. Native Tab, programmatic focus, browser media emulation and physical device proof remain different claims.

3. **Final-candidate compatibility and package evidence — execute existing tools later.** Controller compared all five compatibility source hashes with `p1-final-artifact-binding.json`: all match. React tarball `658d9faf…` also matches. Styles changed from `38c568b3…` in compatibility evidence to `74fd16fc…` in the latest repair stage; current React/Styles product trees match that latest stage. Therefore retain historical behavior evidence and revalidate the existing packed consumer against the final Styles candidate. Actual existing commands include `pnpm test:react-compat`, `pnpm pack-smoke`, and `pnpm smoke`; use the existing CI commands for publint/attw/distribution and bundle checks. Do not create replacement tooling or label the old combined artifact as current. Exact final release coverage remains to be qualified.

4. **Native Linux/Windows execution — environment evidence.** `.github/workflows/native-contributors.yml` already defines native jobs with frozen installation, `pnpm test` and `pnpm build`, triggered by PRs or pushes to main. macOS results exist; Linux/Windows runs remain unobserved here. Let these checks run through the ordinary authorized integration workflow; no Docker/WSL contributor prerequisite, remote dispatch or push is introduced by this review.

5. **Contract/reference reconciliation — concrete documentation/behavior discrepancy.** `program.json:218` says the Tabs specification is null/not-authored, but `.batuta/specs/2026-09-10-tabs-owned-content-design.md` already defines it. Reconcile the reference during the acceptance-record update; do not author another Tabs spec or silently promote the canonical ledger. Separately, the overlay Menu contract at `docs/superpowers/specs/2026-08-30-overlay-family-design.md:348` requires printable-character typeahead. Current Alpine Dropdown `handleMenuItemKeyDown` at `packages/alpine/src/dropdown.ts:182` handles arrows/Home/End/Escape/Tab, with no printable-character path. The recorded keyboard repair is React-scoped. No explicit later Alpine typeahead deferral was found. Resolve applicability before claiming parity or proposing a bounded fix; missing implementation alone does not prove intentional exclusion. Alpine arrow-focus coverage does exist. In contrast, Tooltip's later contract explicitly preserves Alpine behavior at `.batuta/specs/2026-09-09-tooltip-timing-design.md:16`.

6. **Remaining acceptance policy and manual availability — retain decisions, not implementation projects.** Runtime family thresholds/protocols, immutable baseline acceptance and the final consolidated verdict remain separate decisions. Keep existing approved size caps, three composition exceptions and future ceilings; no new benchmark platform. The current program explicitly defers manual evidence by release profile; coarse-pointer obligations are not thereby silently waived. Blade remains deferred/read-only.

## Recommended next lot and stop

The first justified implementation is the small Popover CSS regression case in gap 1. Its source defect and before/after evidence already exist, and the native Styles suite supplies the machinery. The broader failed producer is not needed for that proof. Gap 5 deserves a bounded contract reconciliation before any Alpine feature work. Package/platform qualification belongs at the integration candidate. None of these actions was executed by this review.

## Verification limits and scout adjudication

This is a requirement/evidence comparison with sampled test-body inspection, not exhaustive execution of 253 acceptance cells. No newly reproduced product defect or full V1 PASS is asserted. The raw review files, both scout outputs, guards, controller anchor checks and exact hash comparison are in MAIN `.batuta/runs/v1-coverage-gap-review-20260913/`.

Controller corrected the scout's nonexistent `--profile` suggestion (the existing CLI has `--browser`), rejected immediate creation of another Popover producer, replaced the claim that Tabs lacks a spec, and rejected inferring Alpine feature scope from absent code. Blanket claims that all behavioral gaps are closed or that focus-based tests prove native Tab traversal were not adopted. Media absence statements are bounded by the inspected suites; unrelated diagnostic evidence may exist elsewhere. The complete normalized scout transcript is preserved as research, not adopted wholesale as the verdict.

## First bounded follow-up complete — 2026-09-14

The proposed permanent Popover CSS motion regression is now implemented and verified in the existing Styles suite. See [verification](popover-motion-regression.md):3/3 positive,3/3 original-rule failures,3/3 restored,276 complete Styles cases and common suite PASS. This resolves the Popover part of gap1 only; no replacement packed producer or automatic next task.

## Remaining gap1 regressions complete — 2026-09-14

Drawer and BottomSheet now reuse the Dialog native close-focus cases in the existing Styles suite. See [verification](modal-close-focus-regressions.md): six isolated selector-removal runs fail only their target case; exact CSS restoration; all288 Styles cases pass across three separately invoked engines, and common pnpm test passes. Combined reruns encountered trace-stop errors and remain failed attempts. This completes the reproduced CSS regressions in gap1, not the other five gap categories or full platform qualification.

## Gap5 reconciliation recorded — 2026-09-14

See [contract reconciliation](contract-reconciliation.md). Tabs has an authored controller-selected contract; canonical reference correction remains a separately scoped record update. The conservative proposed lifecycle pair is draft/specified, not the invalid draft/planned combination. Alpine Dropdown typeahead is an applicable OF-MENU obligation with no waiver found in the bounded current records and no implementation branch in its handler. It remains a concrete open product gap. This resolves the applicability questions, not the implementation or final acceptance.

## Alpine typeahead follow-up complete — 2026-09-14

The concrete missing behavior identified in gap5 is now implemented in the existing Alpine Dropdown owner, with three meaningful browser cases and an Alpine patch changeset. See [verification](alpine-dropdown-typeahead.md): final966 Alpine cases across three engines, common suite and scoped build/type/size checks PASS; original-source and cleanup mutation evidence retained. This closes that implementation gap only. Tabs canonical record correction remains outstanding; final-candidate Alpine evidence must account for this source change. No full OF-MENU or release qualification is claimed.

## Tabs record follow-up complete — 2026-09-14

The canonical Tabs reference now names the existing tracked contract with the conservative draft/specified lifecycle pair; see [verification](tabs-ledger-reference.md). Exactly three leaf values changed, all other evidence and records stayed identical, and the existing checker/common suite pass. This closes the remaining bounded reference correction in gap5 after Alpine typeahead delivery. It does not qualify broader Tabs capabilities or the remaining media/package/platform/runtime acceptance gaps.

## Current package evidence refreshed — 2026-09-14

See [artifact validation](current-artifact-validation.md). React18/19 compatibility and existing React/Styles packed consumers now use the current exact artifact pair; exports/types and current72 installed-tarball budgets pass for the applicable packages. This advances gap3 but does not close it wholesale: historical bundle comparison fails466 differences, Alpine packed consumer runtime remains unproved, and final release/platform acceptance is separate. Source and immutable references remain unchanged; no automatic baseline promotion.

## Bundle policy reconciliation recorded — 2026-09-14

See [bundle reconciliation](bundle-reference-reconciliation.md): all11 changed absolute caps are approved and five composition measurements match the accepted decision. Nine canonical standalone React deltas exceed3000B and still need migration disposition; absolute-cap approval is not a delta waiver. The historical exact check also compares architecture, hashes and changed measurements. FileUpload-only acceptance cannot promote core evidence. No baseline, CI or product change; gap6 acceptance policy and final runtime/platform obligations remain pending.

## Acceptance amendment prepared — 2026-09-14

The [proposed amendment](../../specs/2026-09-14-v1-acceptance-policy-amendment.md) presents the nine exact migration exceptions, Alpine category, attributed CSS/lock changes and native budget versus exact reproduction rules. Existing numerical approvals and FileUpload runtime policy remain intact. Controller data checks and independent review pass for the proposal only; maintainer acceptance, missing family runtime protocols, tooling implementation and final qualification remain separate. No baseline or required CI gate changed.

## Native numerical gate implemented — 2026-09-14

The acceptance amendment was approved and the [native budget gate](native-bundle-budget.md) now passes on current packed artifacts. CI uses the new budget command while strict historical reproduction remains available. The72 absolute checks and9/3 exception ceilings pass without rewriting a reference; full provenance is emitted. Common/focused/workflow checks pass. This resolves the numerical CI comparison mismatch in gaps3/6, not core promotion, missing family runtime protocols, packed Alpine runtime or platform/media qualification.

## Packed Alpine public runtime closure — 2026-09-14

The packed-Alpine portion of gap3 now has observed browser-runtime evidence for candidate1ed9c60:32 existing public test files,315 passed per native Chromium/Firefox/WebKit (945 total), exact archive hashes matching previous artifact qualification, source fallback rejection and a failing no-op-plugin control followed by exact restoration. The7 source-only internal tests are not counted as packed evidence. No new test suite or permanent runner was added. See `alpine-packed-runtime.md` and MAIN `.batuta/runs/alpine-packed-runtime-20260914/`. This closes that bounded package-runtime gap only; other operating systems, applicable profiles/performance protocols and final V1 acceptance remain separate.

## Tooltip native tap-action slice verified — 2026-09-15

Gap2 now has a bounded native submit-button observation for Tooltip: React and Alpine each pass Chromium/Firefox/WebKit with coarse/no-hover emulation and trusted touch events, exactly-once native action, fixture interception control and restored action. Exact packed artifacts match the current checkout. See [verification](tooltip-native-tap.md). maxTouchPoints reports1/0/0 across the engines and is not treated as positive device-capability evidence. This adds no permanent test/producer and does not qualify other Tooltip actions, target geometry, physical devices or remaining media/interaction/platform cells. The approved September15 numerical-runtime deferral remains separate and unchanged.

## Dropdown enabled-command native tap slice verified — 2026-09-15

Gap2 now has a bounded Dropdown observation: React/Alpine each pass native Chromium/Firefox/WebKit coarse/no-hover emulation for opening, exactly-once enabled selection, explicit trigger-focus restoration and outside-tap dismissal. Fixture click-interception control is detected and removal restores the action. Exact packed artifacts/current shipped files match. See [verification](dropdown-native-tap.md). Disabled variants remain outside this public-model slice; no physical-device, geometry, other media/direction/platform or complete Dropdown/V1 qualification. No product change, new permanent suite or numerical-policy change.

## Current remaining-work consolidation — 2026-09-15

Use [remaining acceptance work](remaining-acceptance.md) for the current disposition and execution order. Historical open entries above are superseded only by their named completion records. Four fronts remain: current-candidate FileUpload runtime, bounded applicable media/interaction reconciliation, native Linux/Windows observations, then consolidated acceptance. Controller confirmed accepted FileUpload React/Styles hashes differ from the current pair; existing measurement CLI emits raw JSON without canonical writes. No new producer queue or policy approval is proposed.
