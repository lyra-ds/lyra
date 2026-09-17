# Bundle reference and accepted policy reconciliation — 2026-09-14

Read-only research at `702476018f96e2fc047effc7321f9c8c1252ecd4`, reusing the exact `dc9d54f` artifact measurement from [current artifact validation](current-artifact-validation.md). The 72 absolute budgets pass and all five compositions match the accepted September 12 measurements. Historical `--check` remains FAIL. Absolute-cap approval, migration-delta approval, artifact identity and runtime qualification are separate obligations; updating a pointer alone does not resolve them.

## Approved numerical policy

The [September 11 decision](../../specs/2026-09-11-v1-standalone-budget-decision.md) explicitly approves eleven manifest thresholds, already implemented. Current installed-tarball Size Limit bytes:

| Entry | Old cap | Approved/current cap | Measured |
| --- | ---: | ---: | ---: |
| Drawer | 2000 | 5300 | 4989 |
| BottomSheet | 2000 | 5300 | 5030 |
| CreateWorkspaceDialog | 3200 | 7900 | 7476 |
| TimePicker | 4000 | 7900 | 7512 |
| DatePicker | 5000 | 9100 | 8638 |
| DateRangePicker | 5000 | 9200 | 8733 |
| Tooltip | 1500 | 2100 | 1954 |
| CommandPalette | 9500 | 13600 | 12901 |
| RecurrenceSelector | 7000 | 11000 | 10444 |
| WeeklyScheduleEditor | 14500 | 18700 | 17784 |
| Alpine plugin | 21200 | 24200 | 23335 |

Tabs retains its 1500-byte cap (1452 measured). Its fixture now imports Tabs, TabsList, TabsTrigger and TabsContent; matching only by display name falsely suggests a new budget. Match this entry by publicEntry. Size Limit measurements above are not interchangeable with the canonical Vite fixture's Brotli deltas below.

The [September 12 composition decision](../../specs/2026-09-12-v1-composition-budget-decision.md) approves three exact, one-time exceptions:

| Scenario | Historical Brotli JS | Current | Delta | Disposition |
| --- | ---: | ---: | ---: | --- |
| form | 1878 | 1878 | 0 | Unchanged |
| overlays | 4912 | 11030 | 6118 | Equals approved exception |
| application-shell | 12644 | 16954 | 4310 | Equals approved exception |
| scheduling | 19594 | 24084 | 4490 | Equals approved exception |
| files-data | 15158 | 11315 | -3843 | Decreased |

No additional composition allowance is needed for these measurements. Future simple/complex-or-composition migration ceilings remain 1500/3000 bytes; no 5% composition allowance was approved.

## Remaining migration disposition

The standalone decision expressly does not waive scenario/migration deltas. Section 7 of `docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md` requires a decision naming benefit, rejected alternatives and final package impact for larger increases. Against effective historical reference `0003123e`, nine canonical standalone React fixtures exceed even the 3000-byte ceiling:

| Public entry | Brotli JS increase |
| --- | ---: |
| @lyra-ds/react/drawer | 4004 |
| @lyra-ds/react/bottom-sheet | 3966 |
| @lyra-ds/react/create-workspace-dialog | 5008 |
| @lyra-ds/react/time-picker | 4173 |
| @lyra-ds/react/date-picker | 4200 |
| @lyra-ds/react/date-range-picker | 4193 |
| @lyra-ds/react/command-palette | 4251 |
| @lyra-ds/react/recurrence-selector | 4202 |
| @lyra-ds/react/weekly-schedule-editor | 4165 |

These are fixture deltas, not additive costs of individual fixes. The existing absolute-cap and composition approvals cannot silently authorize them. Alpine's aggregate fixture grows 2424 bytes; record its applicable category explicitly in a future decision. All other React fixture deltas are at most 1500 bytes. Tabs changes import shape, so its delta also needs that comparability annotation. Shared CSS grows from 13668 to 13776 Brotli bytes; the composition decision records only an intermediate 22-byte change, not attribution of the full historical difference. Lockfile contents and remaining CSS/module changes were not fully attributed in this bounded pass.

## Why the historical check fails

`tools/bundle-baseline/measure.mjs:660` drops only operatingSystem from comparison. `compareBaseline` at line 700 still compares architecture, lock/package hashes, configured limits, assets and module measurements exactly. The retained 466 leaf differences group into environment/identity 5, standalone 317, scenarios 138 and CSS 6. They are not 466 independent defects and are not merely identity differences. Approved size changes still differ from historical values.

`.github/workflows/ci.yml:132` invokes that exact check in the build job. Moving to Linux x64 would not erase the known lock, artifact, manifest and measurement differences; no Linux run is claimed here. The native contributor workflow separately runs frozen install, test and build on Linux/macOS/Windows. It does not execute the historical bundle command. Existing contributor policy requires neither Docker nor WSL, while retaining separate qualification obligations. This review does not change required CI checks or prove native Linux/Windows execution.

`measure.mjs:990` refuses baseline overwrite. Acceptance at line 1094 supports only FileUpload: exactly four canonical peers, HEAD binding, passing comparison, runtime validation and package pairing precede a pointer write. There is no generic core acceptance command. The September 12 decision explicitly requires separately reviewed immutable core acceptance and final artifact-bound family runtime evidence before promotion.

## Smallest next scope — proposed, not enacted

Prepare one bounded acceptance-policy amendment using the existing records and measurements: dispose of the nine excess React migration deltas, annotate Alpine/import-shape/CSS/lock differences, and specify the exact missing family runtime prerequisites. Reuse the already documented benefits and rejected alternatives where applicable; request new measurements only for a concrete evidence gap.

That amendment must also specify how native budget validation and exact artifact reproduction differ: retain OS, architecture, hashes and lock provenance in immutable evidence; bind runtime proof to the exact candidate; avoid requiring a contributor's architecture to equal a historical machine merely to evaluate approved budgets. Preserving architecture as an unconditional equality gate while changing only the reference would leave the portability problem unresolved. No fields are removed or comparisons weakened by this report.

Only after that contract is settled should a narrowly scoped extension of the existing collector/acceptance tooling be planned, preserving FileUpload evidence and validation, immutable history, fail-closed promotion and all approved ceilings. Do not use `--write` or `--accept-comparison file-upload` as a core-promotion workaround. No new benchmark platform, automatic implementation queue or release approval follows from this reconciliation.

## Verification and research adjudication

OpenCode/GLM5.3Flash research completed in 178.39 seconds with unchanged-tree guard; controller inspected the authoritative decisions, current command bodies and workflow, and independently calculated canonical deltas from retained JSON. No build, test suite or benchmark was rerun. This lot changes managed documentation only.

The controller rejects the scout's blanket claim that only identity drift blocks acceptance, its implied sufficiency of a new pointer, and its suggestion that Dropdown/Tooltip growth necessarily needs a new exception: their reported deltas are below the default simple ceiling. The nine larger canonical deltas above remain concrete disposition work. Absolute budget PASS does not imply runtime or migration PASS. Architecture-preserving exact comparison alone does not solve native portability. Historical FAIL and all package/media/platform/runtime gaps remain explicit.

Raw brief, transcript, report, exit/guard, adjudication, grouped drift and standalone delta JSON: MAIN `.batuta/runs/bundle-reference-reconciliation-20260914/`. Prior exact measurements remain in MAIN `.batuta/runs/current-artifact-validation-20260914/`. No source, manifest, lock, workflow, baseline pointer or canonical acceptance record changed; no remote action or container operation.
