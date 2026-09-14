# V1 acceptance-policy amendment — 2026-09-14

**Status: approved by the maintainer on 2026-09-14; native budget gate implemented and verified, core promotion pending.** After reviewing proposal98a6c28 and the explicit approval question, the maintainer replied “De acordo”. This accepts the nine exact one-time migration exceptions, Alpine category and native-budget/exact-reproduction separation below, subject to the preserved runtime and immutability prerequisites. Scope: incumbent Styles/React/Alpine before Blade. Existing September 11 absolute-cap and September 12 composition approvals remain in force.

## Accepted one-time migration decision

Accept only the following nine historical-to-current canonical standalone JavaScript Brotli increases. These are exact byte allowances without an extra percentage or maintenance margin. Reference: `0003123e22ec57d21946b3f6f383fd2da7d1bd0a`; measured product candidate: `dc9d54f`, retained in MAIN `.batuta/runs/current-artifact-validation-20260914/current-bundle-measurement.json`.

| React public entry | Historical bytes | Candidate bytes | Approved exception: increase |
| --- | ---: | ---: | ---: |
| @lyra-ds/react/drawer | 1758 | 5762 | 4004 |
| @lyra-ds/react/bottom-sheet | 1822 | 5788 | 3966 |
| @lyra-ds/react/create-workspace-dialog | 3665 | 8673 | 5008 |
| @lyra-ds/react/time-picker | 4402 | 8575 | 4173 |
| @lyra-ds/react/date-picker | 5684 | 9884 | 4200 |
| @lyra-ds/react/date-range-picker | 5789 | 9982 | 4193 |
| @lyra-ds/react/command-palette | 9435 | 13686 | 4251 |
| @lyra-ds/react/recurrence-selector | 7723 | 11925 | 4202 |
| @lyra-ds/react/weekly-schedule-editor | 15087 | 19252 | 4165 |

Keep all 72 absolute manifest limits unchanged. Preserve the three accepted composition increases exactly: overlays 6118, application-shell 4310, scheduling 4490 bytes. Future changes retain the 1500-byte simple/3000-byte complex-or-composition delta ceilings; repeated incremental changes must not silently reset the accepted reference. A new reference requires the explicit immutable acceptance step described below.

Benefit: retain the incumbent's verified dynamic focus recovery, background inert isolation, nested/topmost ownership, accepted-close restoration and composed picker/dialog behavior. Existing negative regression evidence shows that removing owning fixes restores failures. These shared contracts explain why retaining the current implementation has value; they do not assign an additive compressed cost to each fix or imply all nine components have completed release qualification.

Rejected alternatives are already documented in `2026-09-11-v1-standalone-budget-decision.md`, `2026-09-12-v1-composition-budget-decision.md`, `.batuta/v1-size-limit-evaluation.md` and `.batuta/v1-remaining-size-limits.md`: accepted private-icon reductions are included; bounded deduplication saved 12–30 bytes; shared-panel and root-import prototypes grew measured output. Reverting verified behavior sacrifices required contracts. Native-only or alternate foundations were not qualified as equivalent and comparative work remains suspended. This does not claim that every optimization is exhausted.

The approved allowance changes no shipped byte, public API, dependency or version. It accepts the recorded migration impact, distinct from the already approved Size Limit pipeline. Do not sum these entry sizes as page payload: overlapping dependencies are shared, and actual consumer composition determines the payload. The older representative mobile lab remains diagnostic, not current-candidate runtime qualification.

## Candidate and comparability disposition

- Treat the whole Alpine plugin as a complex aggregate entry: 23306→25730 Brotli bytes (+2424), within the 3000-byte default. This category assignment is part of this approval, not a newly granted size exception.
- Tabs now measures the complete Tabs/TabsList/TabsTrigger/TabsContent public composition: 748→1780 canonical Brotli bytes (+1032). Preserve both import definitions and label this fixture-shape change; do not claim identical-fixture performance. Its independent Size Limit cap remains 1500 bytes, current 1452.
- Shared stylesheet root and styles.css are aliases of the same emitted CSS: 13668→13776 Brotli bytes (+108 each alias, not 216 bytes of mandatory payload). Preserve all four CSS entry records and attribute source changes; numerical JS exceptions do not erase CSS history.
- Retain toolchain, collector/configuration, compression, externals, consumer lock and resolved graph identities. Current and reference Node 24.18.0, pnpm 11.13.1, Vite 8.2.1, Size Limit 12.1.0 and Brotli settings match. Tool or fixture changes require a labeled comparison/migration decision, never an unexplained automatic reset.

Root lock attribution: `git log 0003123e..dc9d54f -- pnpm-lock.yaml` contains only `c5cfaae`, the compatible tooling/docs-library update. Its changed manifests are root, Docs, Site and FileUpload evidence tooling; no `packages/*` runtime manifest changes in that commit. This does not constitute a fresh audit of every transitive dependency. Preserve the current root lock SHA256 `33e367f83f485e9235c99698fa43acb75f41c7b1ff715411c64d09c42754db4a` and retain the unchanged frozen measurement-consumer graph separately.

CSS attribution: the diff touches only `packages/styles/components/feedback/feedback.css`, `navigation/navigation.css` and `primitives/primitives.css`: Tooltip open-state ownership (`a9265c4`), workspace metadata contrast (`a4686af`), Tabs hidden panels (`d1ad2ad`), Dialog/Drawer/BottomSheet forced-colors focus (`7ba835c`, `0c6d21d`, `bc2f7e5`) and Popover reduced motion (`6b881d7`). The two later Styles test commits do not add shipped CSS. This accounts for source changes, not an additive per-commit Brotli allocation; no rebuild was needed for attribution.

The candidate's exact tarball SHA256 values are:

| Package | SHA256 |
| --- | --- |
| React 0.5.0 | 658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da |
| Styles 0.5.0 | 74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3 |
| Alpine 0.6.0 | de296884efffe7bcad7f74af9a93595a74ce763edb8bb8e21587559cac09e8aa |

These identify the measured candidate only. Different future package bytes need their own artifact-bound evidence; a documentation-only commit may reuse identical artifacts with explicit source/content binding.

## Native budget validation and exact reproduction

Approved behavior for the bounded extension of the existing tool:

| Purpose | Required decision | Environment and identity rule |
| --- | --- | --- |
| Native contributor budget check | Fail on any absolute-cap breach, unapproved applicable migration increase, missing entry, unaccounted import/fixture change or invalid measurement. Report approved historical exceptions separately. | Record actual OS/architecture and candidate hashes. Validate the measured/extracted candidate against those hashes. Equality to historical package hashes or historical architecture is not a budget criterion. |
| Exact reference reproduction | Pass only when the declared reference's artifact, measurement and reproduction requirements match; otherwise report drift or non-comparability explicitly. | Preserve strict provenance comparison, including architecture where required by that reproduction contract. Never call a budget-only PASS a reproduction PASS. |
| Immutable candidate acceptance | Refuse promotion until approved numerical policy, required runtime evidence and exact artifact binding all pass. | Verify the actual candidate bytes against their own declared hashes, all related reports against the same package set/revision, and preserve predecessor history. Historical package identity is retained, not required to equal newly approved product bytes. |

Native Linux/macOS/Windows contribution keeps frozen install/test/build through the existing workflow. No Docker, WSL or matching historical host prerequisite. A cross-host output difference still counts toward the numerical budget; OS/architecture provenance is never deleted to hide it. If the measurement protocol cannot establish comparability, report that condition and do not promote evidence. Native cross-platform success remains to be observed through ordinary authorized integration.

Keep the current exact `--check` semantics and required CI wiring until an explicit implementation replaces the budget gate with the approved contract and retains reproduction as a named, accessible operation. Approval alone disables nothing. Native budget success cannot stand in for release acceptance or browser/platform qualification.

## Runtime prerequisites and immutable promotion

The September 12 composition decision's “Conditions before accepting a new baseline” requires exact packages/environment bound to approved family datasets, thresholds and passing evidence. `docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md:171` requires immutable candidate runtime evidence. The bounded search found explicit numerical policy for FileUpload in `docs/superpowers/specs/2026-08-15-data-files-family-design.md:831`: 100 controlled items, 20 active attempts, at least 30 iterations in pinned production Chromium; each named selection/progress/cancel/retry/removal-and-focus/teardown operation has p95 ≤ 100ms, worst < 250ms and no long task > 50ms. Preserve that existing family-specific contract. No corresponding approved numerical incumbent policy for the other reviewed families was located; do not infer that no other historical document could exist.

Before core acceptance, each applicable family must identify the existing public consumer/fixture, covered interactions and dataset sizes, exact metric, sampling/warm-up/aggregation policy, workload-specific threshold, environment and artifact set. Approve missing protocol/threshold choices before collecting qualification measurements. Reuse valid existing evidence and runners; add a producer only when a specific uncovered obligation cannot be observed through them. Do not create one test per acceptance-ledger cell.

Do not turn the representative mobile lab's operation-proxy p95 ≤ 200ms or its load/layout diagnostic references into a retroactive family SLA. Do not extrapolate existing FileUpload results to unrelated core or Alpine behaviors. Current React 18/19 and packaging evidence remains reusable within its verified scope; it does not supply the missing packed Alpine runtime or all family/media/platform acceptance evidence.

Core acceptance must reuse existing collection and immutable-record patterns, with a separately identified core reference that preserves the FileUpload pointer, comparison peers and runtime validators. Validate complete canonical peer sets, unambiguous paths, matching candidate identity/revision, passing evidence and absence of unrelated dirty changes before any pointer update. Refuse missing, failed, mismatched or overwritten evidence. Keep old records immutable. An incomplete runtime result can be recorded honestly but cannot promote a reference. Exact storage/schema/CLI names belong to the later bounded implementation; no new registry or benchmark framework is required by this amendment.

## Decision and execution boundary

The accepted decision is the nine exact one-time migration exceptions plus the Alpine category and separation of native budget validation from exact reproduction, subject to the preserved runtime/immutability conditions above. It grants no runtime PASS, baseline promotion, release, dependency change or remote action. Missing family protocol approval remains a concrete prerequisite; this amendment does not invent numeric thresholds.

The maintainer acceptance is recorded above. Implement the smallest existing-tool change against this contract. Do not launch the old 38-task loop or a replacement automatic queue. The historical 466-difference check remains a retained FAIL until its proper reconciliation; no result is relabeled by adopting this proposal.

## Proposal verification

Controller recalculated all nine rows from retained current/reference JSON and checked all three candidate package hashes and the root lock hash. Source history attributes the three CSS files and single root-lock update. OpenCode/GLM5.3Flash research151.48s, unchanged guard; independent review162.48s,3DONE/no findings, unchanged status and proposal hash. First review attempt ended after an external-directory read denial without a verdict; the retry received the exact raw JSON inline. No approval-review bypass or widened permissions was needed. No test/build/benchmark rerun for this prose-only amendment. Raw proofs and complete transcripts: MAIN `.batuta/runs/v1-acceptance-policy-20260914/`.

## Native gate delivery

The approved native budget command and CI bundle step are implemented; see [verification](../reviews/v1-product-review/native-bundle-budget.md). Fresh packed budgets, focused/common tests, formatting and workflow validation pass. Exact reproduction and FileUpload acceptance remain intact; no core baseline promotion or runtime qualification follows from this delivery.
