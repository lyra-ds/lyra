# V1 bundle size decision foundation

Current update2026-09-11: the maintainer accepted the11recommended standalone caps after the size discussion. They are applied and72/72installed-tarball entries pass with unchanged asset bytes; see [accepted decision](specs/2026-09-11-v1-standalone-budget-decision.md). Representative mobile laboratory evidence is now available in .batuta/v1-mobile-validation.md; broader approved-family/physical-device responsiveness, scenario/delta/baseline disposition and final release qualification remain separate.

Historical foundation below describes the measured15e1170 pre-approval state and the then-preliminary proposal. Its statements about unapproved caps/11failures apply to that earlier state, not the current accepted configuration. Original measurements and rejected experiments remain unchanged; this record does not establish latency or release readiness.

## What the measurements mean

All kB below are decimal:1kB=1,000bytes. A budget is a policy threshold; it is not an additional payload. Raising it changes what CI accepts and does not add or remove a byte from the current runtime.

- **Installed package:** the npm tarball contains all shipped entries, source maps, types and other files. Its compressed size is a package-manager download, not the browser's JavaScript payload. React's package contains multiple entries/formats; comparing its entire tarball to one Alpine component is misleading.
- **Minified JavaScript:** code bytes emitted by the pinned production consumer fixture before transport compression. This helps distinguish executable code volume from download size; it does not predict execution time by itself.
- **Vite Brotli JavaScript:** the fixture's minified JavaScript compressed in text mode at quality11. This is a reproducible approximation of transfer payload when equivalent compression is served, not a captured production HTTP response. Real application imports, bundler, compression settings, chunking and cache change the result. Headers and network latency are excluded.
- **Size Limit:** the repository's separate automated pipeline, with its own bundling/analysis behavior. Its values must be compared to its existing thresholds. They are not interchangeable with the Vite values, even though both are reported in bytes. A proposed Size Limit cap may be lower than Vite Brotli without contradiction.
- **CSS:** the aggregate stylesheet is a separate asset shared across components. Count it once when first loaded; do not add13.723kB for every component or import both root and styles.css as if they were different required layers.

React and React DOM peers are excluded from the consumer measurements. Alpine's engine is a separate peer, not included in the Lyra plugin measurement. Existing imported runtime dependencies such as Lucide remain included when retained by the consumer. These figures are Lyra-related payload, not a complete application's total download including framework, application code, fonts, images or HTML.

## The11 current failures: actual payload and policy gate

| Entry | Minified JS kB | Vite Brotli JS kB | Size Limit current kB | Existing cap kB |
| --- | ---: | ---: | ---: | ---: |
| drawer | 22.443 | 5.762 | 4.989 | 2.000 |
| bottom-sheet | 22.456 | 5.788 | 5.030 | 2.000 |
| create-workspace-dialog | 34.361 | 8.673 | 7.476 | 3.200 |
| time-picker | 33.382 | 8.575 | 7.512 | 4.000 |
| date-picker | 40.944 | 9.884 | 8.638 | 5.000 |
| date-range-picker | 41.229 | 9.982 | 8.733 | 5.000 |
| tooltip | 7.959 | 2.291 | 1.954 | 1.500 |
| command-palette | 53.853 | 13.686 | 12.901 | 9.500 |
| recurrence-selector | 51.785 | 11.925 | 10.444 | 7.000 |
| weekly-schedule-editor | 79.784 | 19.252 | 17.784 | 14.500 |
| alpine | 135.556 | 25.403 | 23.040 | 21.200 |

Alpine is the **whole registered Lyra plugin**, not one component: its root installs the named Alpine.data factories, so the current fixture retains all registered components. Its25.403kB cannot be directly compared to the5.762kB of an isolated React Drawer as if both supplied the same surface.

## Representative compositions and CSS

These are the repository's five fixed export/import composition fixtures. They model retained dependency payload; they are not rendered end-to-end applications and provide no interaction-latency result. The before revision is9d214bf rebuilt under the same current tools/configuration/lock/consumer fixtures; it is not an untouched older release. Current runtime isf4336e0, byte-identical throughafa7f36. The one intentionally changed standalone Tabs contract is excluded from like-for-like entry deltas; the11failed entries and these five canonical compositions preserve their imports.

| Composition | Before Brotli JS kB | Current minified JS kB | Current Brotli JS kB | Change kB | Current JS + aggregate CSS kB |
| --- | ---: | ---: | ---: | ---: | ---: |
| form | 1.878 | 7.686 | 1.878 | +0.000 | 15.601 |
| overlays | 4.912 | 66.141 | 11.030 | +6.118 | 24.753 |
| application-shell | 12.644 | 69.994 | 16.954 | +4.310 | 30.677 |
| scheduling | 19.594 | 142.632 | 24.084 | +4.490 | 37.807 |
| files-data | 15.158 | 47.977 | 11.315 | -3.843 | 25.038 |

The last column sums separately compressed JS and CSS assets for a cold load of that composition. It excludes framework/application assets and is not a sum across routes. A cached shared CSS asset does not download again on every navigation. Overlays means Dialog+Drawer+Dropdown+Popover+Tooltip; scheduling means CalendarView+DatePicker+SlotPicker+TimePicker. Summing isolated component sizes does not reproduce either scenario: tree shaking, retained shared code and compression are composition-dependent.

Files/data before is15.158kB at the selected9d214bf baseline, not12.508kB from the older immutable6b26a35 baseline. Earlier FileUpload changes precede this stabilization comparison. The accepted icon optimizations help explain the current decrease to11.315kB. Do not mix historical baselines to improve the apparent result.

| CSS entry | Before Brotli kB | Current minified kB | Current Brotli kB | Change bytes |
| --- | ---: | ---: | ---: | ---: |
| root | 13.668 | 106.916 | 13.723 | +55 |
| styles.css | 13.668 | 106.916 | 13.723 | +55 |
| tokens/brand.css | 0.361 | 1.292 | 0.361 | +0 |
| compat-shadcn.css | 0.208 | 0.649 | 0.208 | +0 |

The token and compatibility entries are opt-in assets, not replacements for the full component stylesheet. Do not subtract them from the aggregate without an actual consumer build.

## Why the bundles grew

The existing packed reports already include Rolldown module attribution. Their `renderedLength` values identify retained modules; they are **not additive final minified or Brotli byte shares**. React publishes each entry as an independent bundle. In the canonical overlays fixture, retained packaged modules include dialog.js34,929 rendered bytes and drawer.js34,310, plus dropdown.js10,670, popover.js9,315 and tooltip.js11,300. The final combined asset is66,141minified/11,030Brotli bytes. Those are different stages of bundling, not inconsistent totals.

For source-level explanation, the controller additionally inspected source-labelled compiled regions in exact retained tarballs. The following figures are unminified compiled region bytes **including comments**, not browser transfer cost and not the result of separately tree shaking each source. They support locating the growth, not assigning exact compressed savings to a function.

| Source region | Before compiled bytes | Current compiled bytes | Interpretation |
| --- | ---: | ---: | --- |
| react/drawer: src/internal/use-focus-trap.ts | 3333 | 12312 | Dynamic eligibility, native Tab boundaries and recovery when focused content changes. |
| react/drawer: src/internal/use-modal-layer.tsx | 0 | 11814 | Per-document registry, background inert, topmost and parent/child ownership. |
| react/drawer: src/internal/use-return-focus.ts | 0 | 3800 | Accepted-close restoration and current logical destination. |
| react/drawer: src/internal/use-initial-focus.ts | 0 | 3193 | Initial destination resolution and eligibility. |
| react/tooltip: src/tooltip/tooltip.tsx | 2767 | 6689 | Combined hover/focus ownership, timers, cancellation and lifecycle handling. |
| react/tooltip: src/internal/tooltip-coordinator.ts | 0 | 2907 | Per-document warm period and most-recent visible Escape owner. |
| alpine/index: src/tabs.ts | 3593 | 11147 | Owned structure/eligibility, native navigation and fallback teardown. |
| alpine/index: src/internal/focus-trap.ts | 1754 | 4188 | Native focus boundaries and cleanup. |
| alpine/index: src/internal/return-focus.ts | 0 | 2174 | Logical restoration shared by Alpine modal owners. |

Drawer and Dialog each include the same named focus/layer source regions because tsdown deliberately builds entries separately with codeSplitting=false. A global per-document registry shares state across those entries; that does not make the compiled implementation bytes disappear. This is an architectural packaging trade-off worth measuring. It does not prove a shared-chunk redesign is safe, nor that all growth is unavoidable. The earlier source-level shared-hook extraction grew the measured output and was rejected; it was not a complete packaging experiment.

No new runtime dependency was introduced by these stabilization fixes. Existing old focus bodies were replaced in their owning modules; the isolated prototypes are absent from production. FileManager/WorkspaceSwitcher no longer retain the full icon registry for their private glyphs. Other public registry consumers still retain it where applicable; removing it globally would change scope/behavior. None of the failed tiny deduplication prototypes justifies a blanket limit increase.

## Existing alternatives and retained contracts

- Reverting to the earlier incumbent bodies reduces size but restores failures demonstrated by the original-versus-fixed native tests. It would surrender approved focus, inert, ordering or timing contracts; it is not an equivalent size optimization.
- Timer/scan/focus predicate deduplication has measured savings of only12/14 or19–30B; the shared panel hook increased bytes. These exact alternatives were measured, not all possible designs.
- Native platform primitives alone are not a proven drop-in replacement for the controlled lifecycle, callbacks and cross-entry ownership now supported. No new native-only implementation was benchmarked here.
- A vendor/foundation replacement remains outside the maintainer's selected incumbent V1 scope. No claim is made that an unmeasured vendor is larger, smaller, faster or equivalent.
- Root versus subpath imports is measured separately below without changing shipped artifacts, canonical fixtures or existing caps. It is consumer packaging evidence, not a runtime migration or a replacement for the standalone gate.

## Preliminary standalone budget options

Recommend discussing a **5% maintenance allowance over the measured current Size Limit value, rounded up to100bytes**, applied only to these11entries. This is an explicit policy choice to leave bounded room for small maintenance changes, not measured performance headroom, statistical uncertainty, a universal standard, or permission for unrelated new features. Existing pinned builds are reproducible. The tighter option simply rounds current values up to100bytes and provides very little space in some entries.

| Entry | Current gate kB | Old cap kB | Tight proposal kB | Recommended discussion cap kB | Space above current bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| drawer | 4.989 | 2.000 | 5.000 | 5.300 | 311 |
| bottom-sheet | 5.030 | 2.000 | 5.100 | 5.300 | 270 |
| create-workspace-dialog | 7.476 | 3.200 | 7.500 | 7.900 | 424 |
| time-picker | 7.512 | 4.000 | 7.600 | 7.900 | 388 |
| date-picker | 8.638 | 5.000 | 8.700 | 9.100 | 462 |
| date-range-picker | 8.733 | 5.000 | 8.800 | 9.200 | 467 |
| tooltip | 1.954 | 1.500 | 2.000 | 2.100 | 146 |
| command-palette | 12.901 | 9.500 | 13.000 | 13.600 | 699 |
| recurrence-selector | 10.444 | 7.000 | 10.500 | 11.000 | 556 |
| weekly-schedule-editor | 17.784 | 14.500 | 17.800 | 18.700 | 916 |
| alpine | 23.040 | 21.200 | 23.100 | 24.200 | 1160 |

The5% is relative to the current measured runtime, not the old budget: several old modal caps would increase substantially. For example Drawer2.0→5.3kB is+165% of its old cap. That needs an explicit retained-contract exception, not a label suggesting a minor threshold correction. The unused budgets of the other61entries are not increased. No scenario ceiling, delta ceiling or immutable baseline is changed by this proposal. The default+1.5/+3kB migration ceilings remain separate policy gates; most modal Vite entry deltas exceed3kB and require explicit disposition.

## Runtime impact and decision readiness

Added observers, native focus listeners and document coordination perform real work while their owners are active. Existing native tests verify bounded behavior and cleanup, not parse/compile time, memory, p95 interaction latency or responsiveness under a large dataset. The fixed500/300/100ms Tooltip clocks are intentional UI timing boundaries, not performance measurements. Neither a5kB nor a25kB download proves an interaction is fast or slow.

**Ready now:** exact standalone/composition/CSS/package sizes, matched historical comparisons, packaged-module and source-region attribution with honest stage boundaries, measured rejected alternatives, and a numeric standalone-cap proposal for discussion. The prior report's blanket suggestion that module-contribution evidence was still missing is refined: package-level contribution data already existed; this work makes it readable and adds source-region attribution. It is not a complete causal compressed-byte attribution.

**Still required before claiming an accepted release exception:** an explicit decision on retained contracts versus larger budgets; the final ADR with owner/maintainer approval and migration/removal accounting; applicable quantified responsiveness under the approved operations/datasets and thresholds; explicit scenario-budget disposition; and final exact-artifact core/Alpine qualification. The bounded scout did not locate approved scenario ceilings or incumbent latency results in its selected evidence; that is not proof none exist elsewhere. No new thresholds are invented or declared passing here. The current historical baseline/check mechanism is not itself proof all scenario growth was approved.

Proposed decision owner: Lyra maintainers (Francis for this review). No public API or consumer migration is proposed by a cap-only change; the substantive runtime changes were already delivered and must retain their own verification. No dependency/foundation/Blade change, publication or remote action is included. User interest in possibly increasing a limit is not recorded as approval to apply these numbers.

## Package-manager download reference

| Package | Compressed tarball kB | Sum of unpacked file bytes kB | Files |
| --- | ---: | ---: | ---: |
| @lyra-ds/react | 2107.354 | 9178.992 | 453 |
| @lyra-ds/alpine | 154.049 | 721.314 | 6 |
| @lyra-ds/styles | 31.321 | 159.367 | 23 |

Tarball compression/metadata is a different format from the consumer's Brotli assets. Unpacked totals sum file contents and exclude filesystem block overhead. Do not call the2.107MB React tarball the cost of displaying a Drawer.

## Evidence binding

MAIN .batuta/runs/v1-budget-foundation/foundation.json contains all72entries, raw/minified/Brotli counts, normalized retained-module records, source-region hashes, source baseline/current revisions, tool/lock/peer metadata and six original tarball hashes. analyze.py rechecks matched tools/locks/externals and all453active compiled artifact hashes before deriving the tables. The underlying exact packed reports remain at v1-size-evaluation/before and v1-icon-optimizations/workspace-switcher-packed. This reuses verified unchanged bytes rather than rebuilding them gratuitously.

GLM5.3Flash/low bounded scout47.27s,2014-file unchanged guard. Controller declined its mixed-column shorthand: old Tooltip1,147B is Vite Brotli, while885B is Size Limit; old Alpine20,711B is Vite and18,806B Size Limit at the older immutable baseline, not the selected21,087B comparable baseline. Its universal absence claims about latency/datasets are narrowed to the inspected evidence. Existing report field names are `modules` in packed.json; no fabricated `moduleContributions` field is required. Research estimates and claims are not evidence by themselves.

## Same compositions through the public React root

A fresh detachedafa7f36 checkout rebuilt and packed the unchanged production sources. The only experimental change replaces React subpath specifiers in the five copied scenario fixtures with @lyra-ds/react; imported/exported names remain unchanged. Canonical tracked fixtures were not changed. Same tools/lock/frozen consumer graph, all453compiled artifact hashes, all72standalone results and fourCSS entries match the current canonical measurement. Three retained tarballs and owned-checkout cleanup verified. This measures consumer import packaging, not runtime behavior or a new publication.

| Composition | Subpath minified kB | Root minified kB | Subpath Brotli kB | Root Brotli kB | Brotli change kB |
| --- | ---: | ---: | ---: | ---: | ---: |
| form | 7.686 | 60.689 | 1.878 | 15.135 | +13.257 |
| overlays | 66.141 | 80.437 | 11.030 | 19.043 | +8.013 |
| application-shell | 69.994 | 69.763 | 16.954 | 16.969 | +0.015 |
| scheduling | 142.632 | 111.266 | 24.084 | 25.302 | +1.218 |
| files-data | 47.977 | 93.645 | 11.315 | 22.239 | +10.924 |

All five root variants are larger after Brotli. Root is therefore not recommended as a size workaround for these fixtures. Its graph retains89modules in every case, including the Lucide graph even in the simple form, compared with6modules in the canonical form. This is observable unwanted retention for that consumer; the precise responsible top-level expressions have not been isolated here. Scheduling has31,366 fewer minified bytes but1,218 more compressed bytes, illustrating why code volume and transfer size need separate reporting. No speed inference follows from that difference. This demonstrates why the import form matters under the current independent-entry packaging. It is not a guarantee for every bundler/application, and consumers must preserve API/context/SSR semantics when changing import strategy. The measured result is not permission to replace the canonical scenarios with smaller variants to turn a failing comparison green. The11standalone failures remain; the budget discussion uses their original unchanged Size Limit measurements. See root-import-proof.json and root-imports/ for exact reports, module records, fixture transformation hashes and cleanup.

## Independent review

GLM5.3Flash/low23.75s:3DONE/no findings,2015-file unchanged guard, Batuta verifierPASS. Review covers accurate size/cost explanation and the clearly preliminary policy proposal, not cap application, latency qualification, an accepted ADR or release approval. Controller re-ran the artifact/tool/lock/build-overlay/scenario bindings and budget arithmetic. All product files and existing caps remain unchanged.
