# Remaining V1 acceptance work — 2026-09-15

The latest repaired candidate includes [pill Tabs reflow and focused visibility](tabs-reflow-focus.md), [CommandPalette forced-color selection](command-palette-forced-state.md), [control focus indicators](forced-color-control-focus.md), [Dropdown RTL](dropdown-rtl-and-current-screening.md) and [Popover RTL](popover-rtl-alignment.md). These bounded defects are verified; the branch is not yet fully qualified for stable V1.

This replaces the stale execution pointers in the preceding revision. It is a short disposition of the existing [coverage review](coverage-gaps.md), not a new task queue or permission to create a test for every ledger cell.

The [final local qualification](final-local-qualification.md) now passes the package, compatibility, Alpine runtime and FileUpload checks listed there. Tabs remains 1,567 bytes against the unchanged 1,500-byte cap. A [1,600-byte Tabs-only proposal](../../specs/2026-09-15-tabs-budget-proposal.md) awaits a decision; failed optimization prototypes were not integrated.

## Remaining fronts

| Front | Next action | Completion condition |
| --- | --- | --- |
| Final current-artifact qualification — local | Resolve the proposed Tabs-only cap decision, then re-run the existing budget gate and bind any manifest-only artifact changes to the completed local qualification. | All applicable checks pass; fresh exact artifact identities agree. Reused evidence has explicit byte/owner/environment applicability. No historical measurement is relabeled as the new package pair. |
| Remaining media and interaction acceptance — local evidence reconciliation | Bind source/packed proofs to actual contract requirements. The current 84-case Tabs/DataTable example proof adds narrow/wide, long-content, light/dark, RTL and narrow forced-focus observations. Existing P1 screening and modal/media/native-tap records remain bounded evidence. | Actual 200/400% zoom, applicable touch scrolling and composed media requirements are either proved or remain explicitly pending. A 320px viewport is not actual 400% browser zoom; emulation is not a physical-device or OS-high-contrast result. A narrow successful observation does not fill an entire media cell. |
| Native platforms — ordinary integration | Observe the existing [native contributor workflow](../../../.github/workflows/native-contributors.yml) for the applicable candidate. Linux and Windows are still unobserved in this session. | Successful applicable integration jobs; no Docker/WSL prerequisite for contributors. Push/PR integration remains separately authorized under the profile. |
| Consolidated acceptance — after prerequisite evidence | Reconcile the existing [program](../../../docs/superpowers/baselines/lyra-v1/program.json), immutable acceptance mechanism, exact candidate binding and approved profile dispositions. Scope any necessary ledger/checker update from concrete evidence requirements. | Required evidence is present, allowed deferrals remain non-PASS, exact identities match and existing checks pass. Checker consistency alone is not full acceptance. Canonical promotion, versioning and publication remain separate actions. |

## Evidence to retain

- [Tabs reflow/focus](tabs-reflow-focus.md): 126 source cases, 84 packed observations, common/types/stylelint/parity PASS; original CSS and runtime fail 16 negative cases. Geometry has an explicitly recorded 0.5 CSSpx scroll-quantization tolerance and the existing 1 CSSpx page-width tolerance. No actual zoom claim.
- [Dropdown/current screening](dropdown-rtl-and-current-screening.md): 24 packed direction cases and 141 source cases; 195 P1 interaction observations and 66 axe observations on their recorded earlier archive pair. These are screening slices, not complete media or current-artifact acceptance.
- [Popover](popover-rtl-alignment.md): 72 packed alignment cases and 171 source cases; native Tab/Shift+Tab evidence has a separately documented [WebKit Option+Tab qualification](popover-native-tab.md).
- [Current package evidence](current-artifact-validation.md), [packed Alpine runtime](alpine-packed-runtime.md) and [native budget gate](native-bundle-budget.md) provide existing commands and reusable evidence within their recorded identities. The upcoming final round reuses those tools, not a new producer.
- FileUpload already has passing observations in [its runtime report](file-upload-current-runtime.md) and the later Dropdown report. Its exact package binding must be refreshed after the newer runtime/Styles changes. Run the existing `pnpm performance:file-upload` from clean source, capture and validate the output; do not use historical `--check` as a promotion mechanism.

## Preserved policy

The [September 15 runtime decision](../../specs/2026-09-15-v1-runtime-scope-proposal.md) defers creation/qualification of missing numerical protocols only for the approved incumbent V1 Automated Core scope, located as Overlay, Tabs and DataTable. These dispositions are non-PASS. FileUpload and every already-approved numerical budget remain mandatory. Manual assistive-technology deferrals retain their separate approved basis; other missing requirements are not automatically waived.

FileUpload retains 100 controlled items, 20 active attempts, at least 30 measured iterations for each of six operations, p95 ≤ 100ms, worst < 250ms and the existing long-task check. The native bundle gate retains its approved absolute limits and 9/3 migration exceptions. Historical exact-reproduction failures are preserved; no baseline or pointer is rewritten here.

The old 38-task loop, Blade work, comparative foundation research, permanent test producers, new dependencies, containers/services/resource changes and release actions remain outside this execution. The immediate decision is the proposed Tabs-only cap. Passing local package checks does not resolve the separately listed media, platform or consolidated-acceptance requirements.
