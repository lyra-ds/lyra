# Remaining V1 acceptance work — 2026-09-15

Consolidated at `d21c78f328f0385c96d6f469b656dbcb1ff3a9c1`. This is the current short disposition of the historical [coverage review](coverage-gaps.md), not a new unattended plan or a claim that only four tests remain. Existing approved requirements still apply. A missing evidence mapping is not automatically a product defect or an instruction to create a test.

## Update after the next bounded lot

The [FileUpload current-candidate runtime](file-upload-current-runtime.md) now passes at3ea446a on the same shared React/Styles hashes: six operations,30 samples each, maximum p951.200ms, worst1.400ms, no long task observed in measured windows. Front1's measurement condition is complete; canonical acceptance remains front4. Next: front2's bounded media/interaction mapping. Front3 still awaits ordinary integration. The table below preserves the original execution order and reason for measurement.

## Execution order and completion conditions

| Order / front | Actual remaining work | Existing evidence or tooling to reuse | Completion condition |
| --- | --- | --- | --- |
| 1. FileUpload current-candidate runtime — local | Accepted runtime artifacts differ from the current React/Styles pair. Collect a fresh observation using `pnpm performance:file-upload` from a clean checkout with the pinned toolchain, capturing stdout in raw evidence. | Existing `tools/file-upload-performance/measure.mjs`; approved DF-FU-15 workload and validator. | All six operations meet the existing thresholds; record exact candidate, environment, artifact hashes and raw results. Confirm packed identities match the shared candidate. No automatic canonical report or pointer write. |
| 2. Remaining applicable media / interaction evidence — local, bounded | Reconcile the concrete requirements below against existing proof; run only the uncovered observation with current public fixtures and existing browser tools. | Modal media reports, source behavior suites, packed React compatibility and Alpine runtime, Popover motion regression, Tooltip/Dropdown native tap reports. | Every claimed scenario has exact-artifact evidence and honest limits; unresolved applicability remains explicit. Relevant defects get their own bounded repair. Do not infer complete cells from a narrow slice. |
| 3. Native platform observations — external integration | Linux and Windows results remain unobserved in this session. | Existing [native contributor workflow](../../../.github/workflows/native-contributors.yml), with frozen installation, test and build jobs on all three OSes. | Observe successful ordinary integration jobs on the applicable candidate. No Docker/WSL prerequisite or new workflow is needed; this consolidation authorizes no push or remote dispatch. |
| 4. Consolidated acceptance — after prerequisite evidence | Bind reused and fresh evidence to the candidate and approved release profile; represent allowed deferrals as non-PASS. Scope any necessary existing ledger/validator change from actual evidence requirements. | Existing [program](../../../docs/superpowers/baselines/lyra-v1/program.json), checkers, package/compatibility/budget records and approved decisions. | Preserved gates satisfied, each deferral has its approved basis, exact identities agree, existing checks pass and no unsupported qualification is claimed. Checker success alone is not full acceptance. Canonical promotion and release remain separate actions. |

The immediate next executable lot is front1. Front2 can continue locally while front3 awaits authorized integration. Front4 must not fabricate evidence or introduce a new schema merely to make the ledger look complete.

## Concrete media and interaction remainder

The [overlay contract](../../../docs/superpowers/specs/2026-08-30-overlay-family-design.md), lines555–609, requires forced colors, reduced motion, direction and coarse-pointer outcomes across its five contract groups. Retain the existing lower-level proofs; determine what each consumer composition additionally owes.

| Scope | Reusable proof | Still needs mapping or observation |
| --- | --- | --- |
| Dialog / Drawer / BottomSheet | Recorded18/18 packed media slices per component; committed close-focus regressions. | Coarse-pointer target operability, touch scrolling and applicable outside-dismissal behavior are not established by the six-profile emulation slice. Physical-device claims remain distinct. |
| Popover | Existing focus/dismissal tests and motion regression. | Native sequential Tab traversal, logical start/end placement in RTL, remaining forced-color/state/focus and coarse-pointer outcomes are not all established by motion or programmatic-focus proof. |
| Dropdown / Tooltip | [Dropdown enabled-command tap](dropdown-native-tap.md) and [Tooltip submit-button tap](tooltip-native-tap.md); existing keyboard/timing tests. | Remaining forced-color, reduced-motion and direction outcomes; target geometry and applicable touch scenarios beyond the named actions. Tooltip essential-information alternatives remain a consumer-content obligation. React has no public disabled Dropdown item variant; do not invent one. |
| CommandPalette / WorkspaceSwitcher / CreateWorkspaceDialog | Existing composition/ownership tests and React18/19 P1 compatibility. | Map actual composed scenarios to inherited modal/anchored proofs first, then observe remaining media/direction/touch outcomes. CreateWorkspaceDialog has no supported Alpine counterpart. Exact uncovered scenario count is not established by this audit. |
| Tabs / DataTable | Tabs RTL-arrow and owned-content proofs; existing table semantic/interaction coverage. | [Tabs contract](../../specs/2026-09-10-tabs-owned-content-design.md), line122, names actual examples at375/1280, long content, light/dark, RTL,200/400% zoom, reduced motion and forced colors. Match existing evidence before collecting gaps. DataTable-specific media applicability still needs bounded mapping; its historical ledger lifecycle is not evidence of product absence. |

Target geometry can be measured locally. Browser-emulated media and trusted touch events do not qualify physical devices or OS-native high contrast. Only the manual requirements explicitly deferred by Automated Core may be deferred; the Full profile is unchanged. This table identifies evidence boundaries, not blanket exemptions or a per-component producer queue.

## FileUpload: confirmed identity gap, existing measurement path

The accepted [pointer](../../../docs/superpowers/baselines/lyra-v1/current.json) names `0003123e22ec57d21946b3f6f383fd2da7d1bd0a`. Its [runtime report](../../../docs/superpowers/baselines/lyra-v1/comparisons/file-upload/0003123e22ec57d21946b3f6f383fd2da7d1bd0a-runtime.md), lines3–12, measured on August29 with React0.5.0 and Styles0.5.0. The versions match today's names, but the bytes do not:

| Package | Accepted SHA256 | Current shared candidate SHA256 |
| --- | --- | --- |
| React | `5985f48a358acec6574c49d66df4ce05f27919918da8dccb9935fc1c8adb05a9` | `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da` |
| Styles | `8a36f14faee20a4ad285a0ffecb4311a96148c9dbb197c363fd0e18670fa45d0` | `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3` |

Controller compared the accepted JSON identities with retained current artifact identities. This is a confirmed provenance mismatch, not an observed performance regression; no measurement or check command was run during consolidation. Commit/date differences alone were not used to invalidate behavior evidence.

[measure.mjs](../../../tools/file-upload-performance/measure.mjs), lines556–590, collects and validates evidence and prints JSON in no-argument mode after requiring a clean worktree. It does not automatically write canonical reports. Its `--check` mode additionally compares the freshly packed pair with the accepted pair; it is not a way to accept new hashes. Capture fresh measurement stdout without using the separate acceptance workflow.

The existing [DF-FU-15 contract](../../../docs/superpowers/specs/2026-08-15-data-files-family-design.md), lines831–835, and validator preserve100 controlled items/20 active attempts, pinned production Chromium, three warm-ups and at least30 measured iterations per operation. Selection intent, controlled progress, cancel, retry, confirmed removal/focus recovery and teardown must each pass p95≤100ms, worst<250ms and the existing long-task validator. No new SLA, threshold relaxation or benchmark platform is needed.

## Settled work retained

- Reproduced Popover motion and Drawer/BottomSheet close-focus regressions are implemented and verified; Alpine Dropdown typeahead and Tabs contract reference are reconciled.
- [Current package evidence](current-artifact-validation.md), [packed Alpine public runtime](alpine-packed-runtime.md) and [native budget gate](native-bundle-budget.md) are reusable within their matching artifact/environment scope. Do not rerun them merely because this documentation commit changes HEAD.
- The [September15 runtime decision](../../specs/2026-09-15-v1-runtime-scope-proposal.md) is approved and enacted. Missing Overlay/Tabs/DataTable numerical protocols are deferred only for V1 Automated Core as non-PASS. FileUpload and every other already-approved budget remain mandatory; other families require contract inspection before applying any deferral.
- Historical exact bundle-reproduction failures remain recorded; the approved native budget gate does not rewrite them as passes. No baseline/pointer is promoted here.
- Blade work, the old38-task loop, new permanent test producers, dependency changes, containers/services/resources and remote/release actions remain outside this lot.

## Verification and limits

OpenCode/GLM read-only research plus one targeted correction; controller checked the governing contract, actual CLI behavior, accepted/current JSON hashes, profile scope and cited paths. Both research guards preserved all2155 tracked files. The initial scout conflated an older0.4.x report with the accepted0.5.0 report, used an incorrect overlay path and overstated manual/geometry exclusions; those claims are rejected above. No tests/builds/benchmarks or product changes occurred.

Raw MAIN `.batuta/runs/v1-remaining-consolidation-20260915/` retains briefs, reports, corrections, guards and `runtime-identity-check.json`. This is a bounded evidence reconciliation, not an exhaustive audit of every acceptance cell or final V1 qualification. Exact unproved scenario counts and DataTable/composition applicability remain explicit work within front2.
