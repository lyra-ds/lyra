# V1 backlog after the bounded Popover review

Reassessed on 2026-09-13 at the maintainer's request. This is scope triage, not evidence qualification or authorization to execute a queue.

## Working rule

The maintainer requested reassessment of all 38 historical tasks under the native, small-lot workflow. The old loop stays suspended. A task enters execution only when it names an unmet product requirement or reproduced defect, an existing evidence gap, the narrowest responsible files, and a finite verification command. Prefer existing tests and producers. A missing component-specific runner alone does not justify new tooling. Reuse evidence after checking the relevant product, artifact, tool and environment identities; do not rerun broad matrices solely for documentation changes.

## Disposition of all old tasks

| Old tasks | Decision | Remaining useful work |
| --- | --- | --- |
| 1 | Remove from execution | Discard the audit framework, registry, validator and report-contract test project. Existing focused reports suffice. |
| 2 | Fold into each accepted lot | Source/package/lock/tool/environment provenance is a verification step, not a separate implementation project. |
| 3–4 | Reuse verified modal slice | Dialog, Drawer and BottomSheet each have 18/18 packed browser-media cases on the repaired Styles artifact. Recheck only relevant invalidated evidence; other acceptance dimensions remain separate. |
| 5 | End the bounded attempt; retain only the reproduced repair | The proposed Popover producer was aborted after its retry/escalation left WebKit keyboard harness failures. Preserve its raw observations, not its implementation in the product branch. The independently reproduced reduced-motion CSS defect has a separate bounded repair. Full Popover profile qualification remains pending; inspect existing coverage before proposing another producer. |
| 6–22 | Replace automatic producer queue with gap review | For React Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog, Tabs and DataTable, and the listed Alpine components, inspect existing coverage first. Keep only missing contract checks; consolidate shared behavior where it is actually identical. React evidence does not establish Alpine compatibility. No commitment to one new runner per component. |
| 23–26 | Consolidate into a focused interaction review | Retain supported coarse-pointer behavior; select representative interaction families and exceptional contracts. Keep physical-device/manual evidence separate and deferred where the existing release profile permits. Do not create four new harnesses or invent target thresholds. |
| 27 | Keep existing size qualification | Use the existing collector at the candidate milestone, preserving approved caps, three composition exceptions and future ceilings. No new benchmark platform or baseline overwrite. |
| 28–29 | Park implementation; retain explicit decisions | Runtime protocols/thresholds and immutable acceptance policy are unresolved decisions. Existing diagnostic measurements are reusable within their limits; no invented SLA, schema or acceptance mechanism. |
| 30–33 | Consolidate native/platform qualification | Use existing CI and the separate native contributor workflow. macOS evidence is available; current Linux/Windows native workflow evidence is pending. Keep required CI checks; a Linux/container reproduction is warranted only by an actual platform-specific failure or existing release qualification requirement, never as a contributor prerequisite. No remote dispatch is authorized. |
| 34 | Reuse React 18/19 compatibility evidence conditionally | Rerun the existing producer only when its relevant candidate identity or contract has changed or coverage is missing. |
| 35 | Keep existing package checks | Run existing pack-smoke, consumer smoke, publint, attw and distribution checks for the final candidate; avoid duplicate tooling. |
| 36 | Keep targeted contract/documentation review | Fix demonstrated mismatches in supported core/Alpine migration and compatibility documentation. Blade remains deferred and read-only. |
| 37–38 | Consolidate the final readiness review | Use existing acceptance records and focused reports to show proven, failed and pending requirements. Preserve the 11 P1 × 23 acceptance obligations; this triage neither qualifies them nor promotes the canonical ledger. No separate 253-cell infrastructure project. Propose only reproduced repairs and unresolved decisions. |

## Order and stop condition

After the bounded Popover CSS repair, perform one read-only coverage-gap review before selecting another implementation lot. Package/platform checks belong at an integration candidate unless a change directly affects them. Policy decisions and manual availability are reported separately. No replacement task count or unattended queue is approved by this document. An evidence gap may justify a test; an old task number does not.

## Evidence and boundaries

See `../reviews/test-simplification.md`, `../reviews/v1-product-review/react-bottom-sheet-focus.md`, and `../reviews/v1-product-review/react-popover-motion.md`. The aborted Popover producer, failures and candidate source are preserved below MAIN `.batuta/runs/v1-popover-20260913/`; no negative-control success or completed Popover qualification is claimed. Mac native contribution gates passed; Linux/Windows native workflow runs remain pending. Manual deferral follows the existing release profile and is not newly waived here. Blade stays deferred. No push, merge to main, release, container operation or remote dispatch.

## Coverage comparison completed — 2026-09-13

[Coverage-gap review](../reviews/v1-product-review/coverage-gaps.md) now supplies the concrete comparison. It retains six gap categories, recommends first protecting the reproduced Popover CSS regression through the existing native Styles suite, and separates package/platform reruns from contract and acceptance decisions. No replacement producer or implementation task was started. The old loop remains suspended.
