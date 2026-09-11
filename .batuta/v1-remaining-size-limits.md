# V1 remaining size limits — 2026-09-11

Status: bounded evaluation complete; **11 budget failures remain unresolved** at47d0dc1. None of the three measured derivatives should be promoted. This is not an architecture exception, approval request, release qualification or proof that all optimization is impossible.

## Scope and evidence

The controller evaluated the remaining Tooltip, Alpine and nine modal-bearing failures after the accepted FileManager/WorkspaceSwitcher icon changes. Current production artifacts remain byte-identical (453 files); tracked product sources, dependencies, public API, CSS, absolute caps and immutable baselines were not changed. All measurements use separate clean detached47d0dc1 checkouts with the same explicit current build/configuration/lock/fixture overlay, pinned tools and frozen consumer graph as the prior comparison. Each derivative builds fresh and installs exact retained tarballs into a cold consumer/store:72 standalone imports, five fixed compositions and four CSS entries. Nine tarball hashes, three guarded checkout cleanups, identical measurement imports/caps/tools/locks/externals and unchanged active source/artifact hashes pass. Raw/minified/quality11-text-Brotli data are in packed.json. Size Limit and Vite are different pipelines; only Size Limit bytes are compared to the absolute caps below.

## Current failures (Size Limit bytes)

| Entry | Current | Limit | Excess |
| --- | ---: | ---: | ---: |
| import { Drawer } from '@lyra-ds/react/drawer' | 4989 | 2000 | 2989 |
| import { BottomSheet } from '@lyra-ds/react/bottom-sheet' | 5030 | 2000 | 3030 |
| import { CreateWorkspaceDialog } from '@lyra-ds/react/create-workspace-dialog' | 7476 | 3200 | 4276 |
| import { TimePicker } from '@lyra-ds/react/time-picker' | 7512 | 4000 | 3512 |
| import { DatePicker } from '@lyra-ds/react/date-picker' | 8638 | 5000 | 3638 |
| import { DateRangePicker } from '@lyra-ds/react/date-range-picker' | 8733 | 5000 | 3733 |
| import { Tooltip } from '@lyra-ds/react/tooltip' | 1954 | 1500 | 454 |
| CommandPalette (curated icon registry + portal) | 12901 | 9500 | 3401 |
| RecurrenceSelector (DatePicker composition) | 10444 | 7000 | 3444 |
| WeeklyScheduleEditor (Popover and local inputs) | 17784 | 14500 | 3284 |
| import lyra from '@lyra-ds/alpine' | 23040 | 21200 | 1840 |

## Measured alternatives and disposition

1. **Tooltip timer cancellation consolidation — reject for this task.** One private ref-taking callback replaces the two structurally identical cancellation callbacks; timer ownership, clear/reset ordering and all dependency references are retained in the prototype.1954→1942B, saving12B, still442B over1500. All other Size Limit entries unchanged. No behavioral qualification or implementation acceptance is claimed.
2. **Alpine Tabs query/presentation consolidation — reject for this task.** A module-private owned-query helper replaces five scans using their original root/list/fallback scopes and dynamic owns callbacks; another private helper shares the hidden/inert/aria-disabled presentation predicate. The fallback path intentionally has no ready gate, preserving its availability after destroy sets ready=false.23040→23026B, saving14B, still1826B over21200. React entries unchanged. No new public Alpine method or production API change.
3. **Drawer/BottomSheet shared panel hook — reject.** The disposable helper extracts press ownership/revocation, modal activity/registration, initial focus, trap/scroll wiring and dismissal handlers, retaining the existing low-level registry. It does not remove a focus, inert, cancellation or lifecycle path. Actual retained size grows: Drawer4989→5064 (+75), BottomSheet5030→5093 (+63), TimePicker7512→7601 (+89), DatePicker8638→8739 (+101), DateRangePicker8733→8824 (+91), RecurrenceSelector10444→10448 (+4), WeeklyScheduleEditor17784→17886 (+102). Other standalone entries are unchanged. Shared code in two source components is not evidence of duplicated cost inside a standalone import. This experiment is not a verified refactor and must not be merged.

Each derivative independently leaves11 failures. No combined derivative was built. CSS is identical in all three. The modal helper's fixed Vite overlays composition grows11030→11154B (+124); scheduling24084→24243 (+159). Form1878, application-shell16954 and files/data11315 are unchanged in that derivative. Full per-hypothesis scenario raw/minified/Brotli values remain in proof.json and packed.json; no aggregate savings are inferred from standalone values.

## Research claims not accepted

GLM5.3Flash/low scouted Tooltip/Alpine in75.71s and modal owners in49.40s; both2013-file before/after guards were unchanged. Controller verified the cited source and measured the three bounded candidates. Scout estimates are not evidence. The suggestion to delete Alpine's Tab keyup boundary cleanup was rejected: neither source reasoning nor native evidence established equivalence for all focus-to-body/boundary paths. That listener remains. The modal scout's proposed API parameters were insufficient to represent every captured owner/ref/handler, so the prototype passed the actual dependencies explicitly. Its assertion that extraction preserves every contract is not adopted; no derivative has behavior proof. A separate close-glyph/attachment extraction was not measured or accepted: the cited duplication is across Drawer and BottomSheet, with one copy per standalone owner, and there is no demonstrated standalone saving. Do not report that unmeasured variant as a measured failure or as impossible.

The prior focus-predicate extraction saved19–30B for some modals and grew others; it was not repeated. The meaningful icon-registry reductions already merged remain intact. No further bounded candidate from these two scouts demonstrates a useful reduction against the remaining gaps.

## Architectural decision still required

Current modal growth accompanies required dynamic focus recovery, per-document/topmost and parent-child ownership, background inert isolation, logical close and restoration. Tooltip's retained timing/coordinator contract and Alpine's eligible Tabs/native focus/teardown contracts must also survive any optimization. The existing verification reports establish bounded behavior, not quantitative responsiveness or all release gates.

The next useful work is an explicit architecture/budget decision with applicable runtime and module-contribution evidence, not another cosmetic deduplication or blanket cap increase. Two materially different paths remain: a bounded redesign with full original-versus-candidate regression proof under existing ceilings, or a justified exception for the retained V1 contracts. This evaluation does not select a replacement foundation, weaken the contracts or authorize larger caps. Comparative foundation research remains suspended under the incumbent direction.

For an exception, the existing performance specification requires the contract gain; considered native/existing/vendor alternatives; removed/replaced runtime and dead dependencies; matched standalone/scenario/CSS results; runtime impact; migration impact; owner and maintainer approval. The +1.5/+3kB migration ceilings are not automatic permission to change absolute limits. Quantitative responsiveness and complete module attribution have not been produced by these size-only experiments; a release-ready exception cannot be claimed from them. Keep those missing inputs explicit before presenting a final cap proposal. Scenario budgets and immutable historical evidence must not be silently rewritten to admit the current bytes. See docs/superpowers/specs/lyra-v1/05-quality-performance.md:346–465 for the technical evidence contract; historical specs do not introduce a Superpowers planning workflow.

Task10 remains open. Task39 exact core/Alpine qualification and anchored placement/ownership audit remain separate; no V1 completion, Blade compatibility, publication or remote action is claimed. Blade stays deferred.

## Reproduction and limitations

Raw MAIN .batuta/runs/v1-remaining-budgets/ retains scout prompts/logs/guards, experiments.py, modal-experiment.py, three packed reports and tarballs, source and artifact hashes, cleanup records and proof.py/proof.json. Run proof.py to recheck sources/artifacts, matched environment, imports/caps, tarball hashes and cleanups. Controller builds completed in38.14s,38.45s and36.49s. A first local script-generation attempt failed Python parsing before creating a checkout; the corrected script and raw error history are retained. No behavior tests were added or run for rejected size-only derivatives; previous product regression evidence is unchanged and is not relabeled as testing the prototypes.

## Independent review

GLM5.3Flash/low initial10.32s returned no findings but omitted explicit verdicts for tasks2/3; the controller did not count that as approval. A format-corrected12.77s review returned3DONE/no findings with an unchanged2014-file guard; Batuta verifierPASS. This approves evaluation accuracy and scope only. It does not approve a derivative, increased budget, architecture exception or V1 release.
