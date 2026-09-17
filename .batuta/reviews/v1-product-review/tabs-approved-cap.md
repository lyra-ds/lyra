# Approved Tabs cap — 2026-09-16

The maintainer approved the [1,600-byte Tabs-only decision](../../specs/2026-09-15-tabs-budget-proposal.md). OpenCode/GLM 5.3 Flash, low lane, no retry or escalation, changed only the Tabs manifest threshold and matching native absolute cap. Controller verification confirms **Tabs 1,567 <= 1,600 bytes**. Runtime implementation, CSS, dependencies, versions, other limits and historical references are unchanged.

## Verification

- Exact semantic manifest comparison: only the Tabs size-limit value changed. Native cap table gained only Tabs.
- Existing budget tests, `pnpm test`, formatting and workspace React Size Limit: PASS.
- Existing cold installed-tarball collection: all 72 absolute size limits PASS; all five scenarios and four CSS entries collected.
- Boundary proof through the unchanged public checker: Tabs at 1,600 bytes is accepted; 1,601 bytes is rejected. For this targeted proof, Tabs is ordered first in both in-memory entry maps so unrelated earlier migration failures do not hide its result. At 1,600 the independent TimePicker migration failure remains visible; this is not a fabricated whole-gate PASS.
- All 479 non-manifest shipped files remain byte-identical to the previously verified archives. Fresh React archive differs only in the normalized manifest's Tabs cap. Alpine/Styles archives are fully identical. Every fresh archive hash matches the collector's installed artifact identity.

The existing CLI entry function and unchanged collector were invoked with `--check-budgets` through a temporary output-capture wrapper. The wrapper retains the complete candidate before ordinary validation and cleanup; no canonical evidence, accepted pointers or producer code is changed. Candidate provenance is base `52c5501` plus the retained exact two-file configuration diff. Historical failures remain retained.

## Complete native gate — FAIL, separate from the Tabs cap

The old Tabs Size Limit failure stopped collection before migration comparisons. With that absolute limit resolved, the complete current comparison exposes these existing growth overruns against the approved fixed reference:

| Entry or scenario | Actual Brotli growth | Approved ceiling | Excess |
| --- | ---: | ---: | ---: |
| @lyra-ds/react/time-picker | 4218 B | 4173 B | 45 B |
| @lyra-ds/react/date-picker | 4260 B | 4200 B | 60 B |
| @lyra-ds/react/date-range-picker | 4242 B | 4193 B | 49 B |
| @lyra-ds/react/recurrence-selector | 4235 B | 4202 B | 33 B |
| @lyra-ds/react/weekly-schedule-editor | 4240 B | 4165 B | 75 B |
| overlays | 6137 B | 6118 B | 19 B |
| scheduling | 4546 B | 4490 B | 56 B |

The native checker reports the first failure, TimePicker. The remaining rows are a read-only enumeration from the captured candidate/reference and the existing exception constants. No exception was increased. This records all concrete blockers together, avoiding repeated full collections solely to discover the next one. Follow-up should first reconcile these small growth deltas with already approved repairs and exact measurement provenance; no new optimization or cap increase is authorized by the Tabs decision.

## Artifact identities

- react: `36ccce5faa6495204e421ee9880b9e7e6a83bfae6d5e308e3e29e22fc5b7abaf`
- alpine: `09c6351db2f7ad35dfe44e68c91e782d4f71b3e84aa0c00fa0d02a0ed8f1c0b3`
- styles: `e45ff57fd43e8bc0094c9c574e25ff5721128cd185e7a12979ae8892a8c33bf6`

The previous Tabs runtime, packed examples, React compatibility and FileUpload observations remain applicable by unchanged shipped-code proof; their original archive identities are retained, not relabeled. No behavioral suite was repeated solely for a manifest-only change.

Raw evidence: controller `.batuta/runs/tabs-approved-cap-20260916/` includes approval, exact diff, executor output, test logs, full candidate, boundary proof, all migration overruns, fresh archives and byte binding. The [remaining acceptance record](remaining-acceptance.md) still lists media/zoom/touch, native Linux/Windows and consolidated acceptance. Stable V1 is not yet accepted; nothing was published or pushed.
