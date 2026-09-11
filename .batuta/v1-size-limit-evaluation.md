# V1 size-limit evaluation — 2026-09-11

The13 current size failures are real source regressions under the same measurement tools. Two isolated icon prototypes each remove their own failure without changing a budget. Consolidating repeated focus predicates does not resolve any failure. Recommend qualifying the two icon optimizations first; do not raise all limits based on this evaluation.

## Comparable evidence
Baseline9d214bf and candidate570fe37 were rebuilt separately with the same current build configuration, repository lock, pinned tools, frozen consumer graph and five scenario fixtures. Product source/manifests remain revision-specific. The controlled build overlay is explicit; these are size comparisons, not untouched historical release artifacts. Fresh consumers/stores install exact packed React, Alpine and Styles tarballs, retained with SHA256. All453 candidate build files match the active verified artifacts. Both runs measure72 entries, five compositions and four CSS entries. All baseline budgets pass;13 candidate budgets fail. All absolute limits are unchanged.

One standalone contract intentionally differs: old Tabs versus the new compound Tabs exports. That entry is excluded from like-for-like delta conclusions. The13 failed entries and five fixed scenarios retain identical measurement imports. Root/fixture lock and resolved-graph hashes match across this controlled comparison. Node24.18.0/pnpm11.13.1/Vite8.2.1/size-limit12.1.0; Brotli text quality11.

## Failed standalone limits
Values below are exact Size Limit bytes. Vite raw/minified/Brotli measurements are a separate pipeline in evaluation-proof.json; do not compare Vite values to these caps.

| Entry | Before | Current | Limit | Excess |
| --- | ---: | ---: | ---: | ---: |
| drawer | 1392 | 4989 | 2000 | 2989 |
| bottom-sheet | 1471 | 5030 | 2000 | 3030 |
| create-workspace-dialog | 3016 | 7476 | 3200 | 4276 |
| workspace-switcher | 8174 | 8364 | 8250 | 114 |
| file-manager | 9360 | 9808 | 9500 | 308 |
| time-picker | 3745 | 7512 | 4000 | 3512 |
| date-picker | 4858 | 8638 | 5000 | 3638 |
| date-range-picker | 4937 | 8733 | 5000 | 3733 |
| tooltip | 885 | 1954 | 1500 | 454 |
| command-palette | 8996 | 12901 | 9500 | 3401 |
| recurrence-selector | 6580 | 10444 | 7000 | 3444 |
| weekly-schedule-editor | 13947 | 17784 | 14500 | 3284 |
| Alpine | 21087 | 23040 | 21200 | 1840 |

Alpine is23040B in this installed-tarball pipeline, also reproduced in the previous packed diagnostic. The earlier23051B workspace result is a different invocation; the453-file identity check confirms unchanged compiled bytes. Neither number passes21200B. No pipeline mixing or cap waiver.

## Composition measurements
These are fixed Vite quality11 Brotli scenarios, not standalone-budget verdicts.

| Scenario | Before | Current | Delta | Growth |
| --- | ---: | ---: | ---: | ---: |
| form | 1878 | 1878 | 0 | 0.0% |
| overlays | 4912 | 11030 | 6118 | 124.55% |
| application-shell | 12644 | 17000 | 4356 | 34.45% |
| scheduling | 19594 | 24084 | 4490 | 22.92% |
| files-data | 15158 | 15599 | 441 | 2.91% |

Files/data starts at15158B in the selected incumbent baseline9d214bf, not12508B from the older immutable baseline. Historical FileUpload work predates this stabilization comparison. CSS root/styles each13668→13723B (+55B); brand tokens361B and compatibility CSS208B unchanged.

## Measured disposable hypotheses
1. **FileManager fixed icon subset — prioritize.** Replace only its private finite glyph set with exact existing Lucide components; custom action ReactNodes remain consumer-owned. Size Limit9808→5654B (-4154), below9500. Files/data15599→11440B (-4159); other scenarios unchanged. This is one isolated source-file prototype, not a product change. Preserve exact decorative semantics, classes, dimensions, color, file-type mapping, actions and both display modes when qualifying it.
2. **WorkspaceSwitcher three fixed icons — prioritize.** Exact existing glyph imports instead of dynamic global-registry lookup. Size Limit8364→2886B (-5478), below8250. Application-shell17000→16949B (-51) because the composition still includes other registry consumers; do not advertise5478B aggregate app savings. Preserve classes, decorative semantics, roving focus, keyboard/click cancellation, creation operation and visual states.
3. **Shared programmatic-focus predicate — do not pursue for this budget task.** Three bodies match after parameter/whitespace normalization, while eligibility/containment remains owner-specific. Exact extraction only saves19–30B in Drawer/BottomSheet/CreateWorkspace; some picker bundles grow3–8B after compression. All13 failures remain. No merge or broader eligibility consolidation justified by this result.

Each icon prototype independently leaves12failed budgets. They were measured separately; no combined candidate or runtime/visual qualification is claimed. All owned temporary checkouts and borrowed tool links were removed after scope guards; active production source is untouched.

## Remaining decision
Nine modal-bearing entries have multi-kilobyte growth; their Vite standalone deltas are approximately3966–5008B. Current focus/inert/branch/lifecycle behavior is required and cannot be removed to meet a size limit. The small deduplication experiment proves only that this specific idea is insufficient; it does not prove all optimization impossible. Further ownership/bundling work needs a bounded design and full regression proof. Tooltip and Alpine also remain unresolved. A measured, justified budget/architecture decision may be needed after useful optimizations; this evaluation requests and grants no exception. Existing +1.5/+3kB migration ceilings are not automatic permission to raise absolute caps.

Task10 remains open until optimizations or an approved measured budget decision resolve the failures. Task39 core/Alpine qualification and the anchored placement audit remain separate; Blade remains deferred. No product code, absolute budget or immutable baseline changed.

Raw proof: main .batuta/runs/v1-size-evaluation/ (comparison-setup.json, before/after packed.json and tarballs, evaluation-proof.json, isolated hypothesis scripts/results, source hashes, cleanup, scout and final review). Controller ran every measurement; scout estimates were never accepted as evidence.

## Independent review
GLM5.3Flash/low13.35s:3DONE, no findings,2006-file unchanged guard; Batuta verifierPASS. Approval covers the evaluation and recommendations only. Prototype implementation, behavior/visual regression and budget resolution are still pending.
