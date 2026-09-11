# Incumbent focus-size diagnosis — 2026-09-09

Current status:10React+1Alpine overages after the two verified private-icon optimizations (2026-09-11). Dated sections below retain earlier measurements; the final section carries the latest values.

Critical/controller diagnosis with guarded GLM5.3Flash support; no production edits. The71 existing standalone size-limit entries were measured with pinned Node24.18.0, pnpm11.13.1, tsdown0.22.14, size-limit12.1.0 and existing configuration. Same current dist/old library graph and current dist/new library graph produce exactly identical sizes and9 failures. All453 React/Alpine dist files also remain identical across the library maintenance batch. Libraries are not the source of this growth.

A fresh detached checkout at9d214bf, sharing only read-only existing tool installations, rebuilt original React with the same compiler and measured all71 entries PASS. Baseline source was unchanged. Owned borrowed symlinks were verified and removed; the temporary checkout was removed, preserving the stabilization installation. Raw .batuta/runs/v1-size-diagnosis in main checkout records commit, source, dist hashes, build/measurement logs, comparison and cleanup. Initial cleanup guard correctly stopped because node_modules symlinks appeared as untracked files; the second guard accepted only those two known owned links before removal.

| Entry | Original | Current | Existing limit |
|---|---:|---:|---:|
| Drawer |1.39kB|2.25kB|2kB|
| BottomSheet |1.47kB|2.28kB|2kB|
| CreateWorkspaceDialog |3.02kB|3.85kB|3.2kB|
| TimePicker |3.75kB|4.52kB|4kB|
| DatePicker |4.86kB|5.65kB|5kB|
| DateRangePicker |4.94kB|5.73kB|5kB|
| CommandPalette |9kB|9.94kB|9.5kB|
| RecurrenceSelector |6.58kB|7.38kB|7kB|
| WeeklyScheduleEditor |13.95kB|14.77kB|14.5kB|

These are displayed decimal Brotli values from size-limit, not exact final packed release protocol results. React package budgets did not change across9d214bf..a4686af. The source range adds approved return-focus eligibility/lifecycle and native WebKit containment. No other foundation was added. This attribution is not permission to call a failed budget PASS.

The inline-source GLM scout found two tiny selector consolidations and a possible shared visibility helper; none has measured savings or demonstrates closure of9 overages. No micro-refactor or new helper is justified merely to give an impression of optimization. Preserve existing dynamic eligibility, cancellation, native intermediate Tab and teardown proofs. Potential future optimization must measure savings and rerun those behavioral proofs.

Budget decision remains pending. The quality/performance contract requires exact packed before/after standalone and affected scenario measurements with the pinned pipeline before budget changes. Its default delta ceilings (+1.5kB simple/+3kB complex) are not automatic permission to spend that increase or silently raise current absolute limits. Run that final protocol after the remaining approved behavior changes; keep all9 current failures explicit until resolved. No budget, baseline hash, source, dependency or gate change in this diagnosis. Independent release qualification remains open. Task11 (Dropdown) is independently executable and keeps its existing2kB budget as an acceptance requirement.

## Later verified incumbent slices
Tooltip now1954B/1500B and WorkspaceSwitcher8326B/8250B add2entries to the original9 (11React overages). These source behavior changes are separate from the byte-identical library maintenance graph. Exact packed final protocol and disposition remain pending; no budget/hash change or waiver. See the Tooltip and workspace creation verification records.

Task24click cancellation: WorkspaceSwitcher8364/8250B (+38B versusTask22), same11Reactoverages; no limit/hash update. Current callback correctness verified separately; final packed budget decision remainsopen.

Task25Alpine nativeTab repair: completeAlpine artifact21394/21200B, about304Baboveprevious21.09kB build. Additional Alpineoveragejoins11Reactentries (12totalcurrentoverages). No limits/hashes changed; exactpacked before/after protocol and budgetresolutionpending.

Task29 current Drawer2253/2000B and BottomSheet2296/2000B after local Escape consumption correction. Same11React+1Alpine overages; no limits/hashes changed.

Task30 Alpine explicit return destination:21949/21200B (+555B versusTask25) atartifact8378a723069d2b94bdf3cafe7a7132719f3ef4d83908bfc8727454a1c8eeb6da, sourcecommit3041be4. Same12overall overages. No new dependency; one shared private return helper and four option/caller integrations. This is actual product behavior cost, distinct from suspended experimental evidence and the byte-identical maintenance batch. Final packed comparison/resolution remainspending.

## Task33 initial delivery — provisional source sizes

Pinned controller build and size-limit on the initial367.62s delivery introduces FileManager9808/9500B, now12React+1Alpine=13overages. Drawer2490/2000, BottomSheet2527/2000, CreateWorkspace4065/3200, CommandPalette10253/9500, TimePicker4776/4000, DatePicker5868/5000, DateRange5965/5000, Recurrence7602/7000, WeeklySchedule14992/14500; unchanged Workspace8364/8250, Tooltip1954/1500 and Alpine21949/21200 remain. Raw MAIN .batuta/runs/v1-react-modal-initial-focus-checks/sizes.log. Runtime repair is still in flight; these are provisional measurements, no cap/baseline update and no final packed-size qualification.

## Task33 final source measurements
Final numeric-filter/CPpanel repair:12React+1Alpineoverages. Drawer2530/2000B, BottomSheet2560/2000, CreateWorkspace4107/3200, Workspace8364/8250, FileManager9808/9500, TimePicker4817/4000, DatePicker5910/5000, DateRange approximately6/5kB, Tooltip1954/1500, CP10298/9500, Recurrence7636/7000, Weekly15044/14500; Alpine21949/21200 unchanged. Exact readable size-limit output and parsedrows under MAIN v1-react-modal-initial-focus-critical/checks/sizes.log and sizes.json. No cap/baseline update or final packed qualification.

## Task36 — 2026-09-10 logical-close activity
Current12Reactoverages: Drawer2616/2000B, BottomSheet2640/2000B, CreateWorkspace4194/3200B, Workspace8364/8250B, FileManager9808/9500B, TimePicker4883/4000B, DatePicker5997/5000B, DateRange approximately6.08/5kB (console-rounded), Tooltip1954/1500B, CommandPalette10409/9500B, Recurrence7725/7000B, Weekly15143/14500B. Alpine21949/21200B remains unchanged and was not rebuilt for this React-only slice. The runtime correction adds small per-entry/composition growth, not a new dependency; budgets remain failed, not waived. Current raw sizes.log/size-overages.json are in MAIN .batuta/runs/v1-react-modal-logical-close-checks. Final packed protocol/disposition remainsTask10.

## Task26 — 2026-09-10 operation lifecycle
CreateWorkspaceDialog is now approximately5.12kB/3.2kB, compared with4194B before this lifecycle change. The console rounds to decimal kB; no invented exact byte delta. The same12React+1Alpine entries fail, no new runtime dependency or budget/hash change. Current source native87+examples6 verify behavior independently of the failing size gate. MAIN v1-create-workspace-operation-retry-native-checks/sizes.log preserves the measurement; exact final packed protocol and disposition remain Task10.

## Task10 current packed diagnostic — 2026-09-10, bd9bb5d

A fresh detached checkout rebuilt React and Alpine, packed React/Alpine/Styles, and measured the installed tarballs in a fresh consumer and package store using pinned Node24.18.0/pnpm11.13.1/Vite8.2.1/size-limit12.1.0. Collection finished in35.98s. All450 rebuilt React artifacts match the verified Popover manifest exactly. Raw/minified/quality11 text Brotli measurements cover72 standalone entries, five fixed compositions and four CSS entries. Exact tarballs and checksums are retained.

The size gate still exits1 with13 standalone failures (12React,1Alpine). Collector exit0 means diagnostic collection completed, never budget approval. Popover remains1755/3000B. No absolute limit, scenario ceiling or immutable baseline changed.

| Composition | Historical Brotli B | Current Brotli B | Descriptive delta B |
| --- | ---: | ---: | ---: |
| Form |1878|1878|0|
| Overlays |4912|11030|6118|
| Application shell |12644|17000|4356|
| Scheduling |19594|24084|4490|
| Files and data |12508|15599|3091|

Historical main tools and consumer lock match; repository lock differs. These deltas are descriptive only, not final same-lock before/after qualification or scenario pass/fail verdicts. Next required work is a same-lock comparison and measured optimization scope that preserves verified behavior. The13 failures refer to standalone entries, not the five scenarios.

The controller-only collector retained failed size-limit JSON while measuring remaining rows, retained tarballs before cleanup, and invoked the identical package build tools directly. Initial pnpm run attempted dependency validation against borrowed tool links and aborted before removal; its log is retained. No purge setting or CI bypass was enabled. All borrowed links and the owned temporary checkout were removed after an exact untracked-file guard; active product files were unchanged.

Independent GLM7.24s3DONE/2003-file unchanged guard/verifierPASS approves diagnostic evidence honesty only. Its incidental arithmetic connecting13 failed budgets to five scenarios is declined: those are distinct measurements, and no scenario gate verdict was established. Raw main .batuta/runs/v1-size-current-packed/ includes current-packed.json, packed-size-gate.json, diagnosis.json, retained tarballs, collector adaptation, failed initial log, review and cleanup proof. Task10 and Task39 remain open; Blade deferred.

## Task10 matched size evaluation — 2026-09-11
Controlled same-lock/build/consumer comparison9d214bf→570fe37 now resolves the earlier comparison gap for13failed entries and five scenarios. All453candidate artifacts match active bytes;15packed tarballs across5runs retained and verified, allowned temporary checkouts removed. Before72PASS, current13FAIL, allcaps unchanged; one changed Tabs standalone import is excluded from like-for-like delta conclusions.

Separate measured prototypes: FileManager9808→5654/9500B, files/data15599→11440B; WorkspaceSwitcher8364→2886/8250B, application-shell17000→16949B. Qualify these two icon optimizations first. Pure focus-predicate extraction saves19–30B in three modal entries and resolves no overage; do not pursue it for size. Nine modal-bearing entries, Tooltip and Alpine remain unresolved after those two potential wins; active product still has13failures. Packed Alpine23040/21200B is reproduced independently of the earlier workspace23051B invocation. No combined prototype, production optimization, budget increase, baseline update or behavior qualification.

Independent GLM13.35s3DONE/no findings/unchanged2006-file guard/verifierPASS approves the evaluation only. See .batuta/v1-size-limit-evaluation.md and MAIN .batuta/runs/v1-size-evaluation/. Task10/39 remain open; Blade deferred.

## Task10 private icons — implemented and verified, 2026-09-11
FileManagerae229b2 and WorkspaceSwitcherf4336e0 deliver the two measured optimizations. Final packed FileManager5530/9500B (was9808), WorkspaceSwitcher2889/8250B (was8364). Files/data11315B (was15599); application-shell16954B (was17000). Exact final artifacts, SVG/pixel/keyboard proof and source/static/API checks pass. Both existing caps now pass; no cap/baseline change. Current10React+1Alpine=11failures remain below.

| Entry | Current packed Size Limit B | Limit B |
| --- | ---: | ---: |
| import { Drawer } from '@lyra-ds/react/drawer' | 4989 | 2000 |
| import { BottomSheet } from '@lyra-ds/react/bottom-sheet' | 5030 | 2000 |
| import { CreateWorkspaceDialog } from '@lyra-ds/react/create-workspace-dialog' | 7476 | 3200 |
| import { TimePicker } from '@lyra-ds/react/time-picker' | 7512 | 4000 |
| import { DatePicker } from '@lyra-ds/react/date-picker' | 8638 | 5000 |
| import { DateRangePicker } from '@lyra-ds/react/date-range-picker' | 8733 | 5000 |
| import { Tooltip } from '@lyra-ds/react/tooltip' | 1954 | 1500 |
| CommandPalette (curated icon registry + portal) | 12901 | 9500 |
| RecurrenceSelector (DatePicker composition) | 10444 | 7000 |
| WeeklyScheduleEditor (Popover and local inputs) | 17784 | 14500 |
| import lyra from '@lyra-ds/alpine' | 23040 | 21200 |

Controller final combined453-file identity check confirms FileManager evidence still binds after WorkspaceSwitcher.58source tests per engine, SSR2 and54native exact SVG/pixel frames across both components. Independent GLM/verifier approval per component. See .batuta/v1-file-manager-icons-verification.md and .batuta/v1-workspace-switcher-icons-verification.md; raw MAIN .batuta/runs/v1-icon-optimizations/. Next: remaining modal/Tooltip/Alpine budgets require bounded measured optimization or a justified reviewed budget decision. Task39 and anchored placement audit remain open; Blade deferred.

## Remaining11 limits — bounded evaluation, 2026-09-11

At47d0dc1, three disposable packed hypotheses retain all11failures: Tooltip timer consolidation saves12B (1954→1942/1500), Alpine Tabs scan/presentation consolidation14B (23040→23026/21200); shared Drawer/BottomSheet panel hook grows seven entries (+4–102B), overlays+124B and scheduling+159B. All rejected; these derivative values are NOT the active sizes. Current production remains the11-entry table above.453active artifact hashes unchanged;9tarballs/3cleanups and same72imports/tools/locks/caps verified. GLM final3DONE/no findings/2014-file unchanged guard/verifierPASS approves evaluation only. See .batuta/v1-remaining-size-limits.md. Next architecture/budget decision needs applicable runtime and module-contribution evidence; no exception or cap proposal is approved or release-ready. Task10/39 remain open, Blade deferred.
