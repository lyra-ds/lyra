# Incumbent focus-size diagnosis — 2026-09-09

Current status:12React+1Alpine overages after Task36; the dated sections below preserve earlier measurements. The final section and Task36 verification carry the latest values.

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
