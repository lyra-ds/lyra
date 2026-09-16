# Popover RTL migration exception reconciliation — 2026-09-16

Status: **proposed; awaiting explicit approval of the seven values below**. The asynchronous decision question has been presented. No budget has been changed by this proposal. Tabs approval remains separate.

## Finding

All seven overruns arise in entries/scenarios containing the approved Popover RTL repair. The controller compared the exact last-passing React archive (`658d9faf…`, bound to the retained native gate report) with the current archive (`36ccce5f…`). Popover and each of the five affected standalone entries have exactly the same added/removed code lines: automatic physical left/right alignment plus its style merge from commit `3f6b855`. Each built module adds 235 uncompressed bytes. Their compressed deltas differ with bundle context; source bytes are not presented as additive Brotli costs.

The complete old/current module measurements show only those affected modules changing in the overlays/scheduling scenarios; form, application-shell and files-data remain unchanged. OpenCode/GLM read-only research independently confirms the import graph, decision history and purposeful implementation; no redundant or broken code was found. The controller's archive comparison supplies stronger byte attribution than the scout's commit-only inference. No optimization task or new producer is needed to diagnose these seven records.

## Proposed decision

Keep the validated RTL correction and amend only these five standalone and two scenario migration-growth exceptions, against the same fixed reference `0003123e`. These are growth allowances, not total standalone sizes. All 72 existing absolute package limits already pass and remain unchanged.

| Entry/scenario | Existing growth ceiling | Proposed ceiling = measured growth | Increase |
| --- | ---: | ---: | ---: |
| @lyra-ds/react/time-picker | 4173 B | 4218 B | 45 B |
| @lyra-ds/react/date-picker | 4200 B | 4260 B | 60 B |
| @lyra-ds/react/date-range-picker | 4193 B | 4242 B | 49 B |
| @lyra-ds/react/recurrence-selector | 4202 B | 4235 B | 33 B |
| @lyra-ds/react/weekly-schedule-editor | 4165 B | 4240 B | 75 B |
| overlays | 6118 B | 6137 B | 19 B |
| scheduling | 4490 B | 4546 B | 56 B |

The only implementation file would be `tools/bundle-baseline/budgets.mjs`, updating the seven specified values. No runtime, CSS, manifest, dependency, lockfile, fixture, reference, canonical acceptance pointer or general default ceiling changes. Raising these thresholds adds no bytes to the current artifacts. The proposal uses the measured values without a new general maintenance allowance.

After approval: delegate the literal configuration edit through Batuta; run existing budget tests and the public native gate; prove each new exception rejects +1 byte and preserve exact artifact identities. Record the decision beside the earlier September 12/14 approvals. A prior failure remains a failure in its historical report.

## Evidence and remaining boundary

Controller raw `.batuta/runs/migration-delta-diagnosis-20260916/`: full guarded scout report, whole-entry comparison, module differences, six archive diffs and identical-change proof. `.batuta/runs/tabs-approved-cap-20260916/` retains the actual cold consumer measurements and seven failure values. The guard confirmed unchanged working-tree status during research; quoted file/import/decision anchors were checked.

Approval is required because the previous decisions define fixed exception values and the latest approval covers only Tabs. This is not a request to publish or declare stable V1. Media/touch, native Linux/Windows and consolidated immutable acceptance remain separately tracked.
