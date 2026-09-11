# V1 representative mobile-page validation — 2026-09-11

Status: **bounded current-candidate laboratory validation complete**. Both representative pages meet the predefined diagnostic load/layout references and the measured operation p95 proxy reference. This is not physical-phone evidence, field Core Web Vitals/INP certification, an adapter ranking, approved performance for every family, or final V1 release qualification. No product source, approved size cap, dependency, build configuration or historical baseline changed.

## What was tested

Candidate6dacf7e, exact retained React0.5.0/Alpine0.6.0/Styles0.5.0 tarballs from the accepted-budget run. Each installed file was compared with the original tarball; all453compiled runtime/declaration hashes still match active production. Fresh frozen bundle-consumer lock/peer installation, existing Vite8.2.1 production build, no aliases to source or development server. Framework peers are bundled in these page measurements, unlike the earlier library-only size tables. Brotli text quality11 HTTP responses serve actual HTML/JS/CSS from a local server; cache disabled and no external fonts/images/API requests.

React page: scheduling dashboard, actual Drawer with DatePicker/TimePicker, native form fields and a200row unvirtualized appointment list expandable to1000. Alpine page: same broad dashboard workflow, actual Lyra Drawer and the whole registered Lyra plugin, native date/time fields. These are deliberately related but non-identical consumers, not a controlled React-versus-Alpine efficiency comparison. They are synthetic production-consumer fixtures, not a deployed customer application with authentication/backend/analytics or third-party media.

Profile:390×844 CSSpixels,DPR2,touch/mobile emulation, normal product motion, English locale/light scheme. Chromium151.0.7922.34 through the repository's pinned Playwright installation; executable SHA256 retained. Host macOS/Darwin25.6.0, arm64 AppleM4. DevTools CPU4× slowdown;150msnetwork latency,1.6Mbpsdownload/750kbpsupload. These settings emulate a constrained profile on this host; they are not calibrated to a named physical phone. Each cold-load sample uses a fresh browser context and disabled HTTP cache; OS/CPU/V8 caches are not claimed to be physically cold.

## Samples and measurement boundaries

Principal series:3warm-up cold navigations and3warm-up workflow cycles per page, then30recorded cold navigations and30recorded six-operation workflows per page:60loads and360trusted measured operations. Supplemental React nested-picker series:3warm-up then30recorded five-operation workflows,150additional trusted measured operations. Total510recorded timed operations; warm-ups, preflights, blocking controls and extra functional probes remain separate and retained. No outliers were discarded or clipped.

Load: FCP/LCP via buffered browser PerformanceObservers; LCP observed before input, after readiness/fonts and a300mssettling window. That settling window is not called rendering latency. Layout metric is the sum of observed layout shifts without recent input, not a full-session/windowed field CLS implementation. The reported zero also means no such shifts were observed in this bounded window. Native navigation/resource timing provides encoded/decoded payload and transferSize; encoded-body totals exclude HTTP headers and transport overhead.

Interactions: actual trusted touch-generated clicks and keyboard events, successful relevant DOM-state assertions, then an intervening animation-frame paint opportunity. The recorded **event-to-ready-frame proxy** includes that frame boundary; it is not exact presentation time, animation completion or INP. Normal opening/closing animations remain enabled and are settled outside consecutive operations to avoid cross-operation contamination. Native PerformanceEventTiming is also retained separately at16msthreshold; entries are8msquantized, some fast events are not exposed, and absence is never imputed as0ms. This is not full INP interaction aggregation.

Diagnostic references were written before observing the principal results: LCPp75≤2500ms and layout-shift sum p75≤0.1, informed by [Web Vitals guidance](https://web.dev/articles/vitals); chosen operation-proxy p95≤200ms for investigation, explicitly not an approved family SLA or formal INP threshold. [Event Timing documentation](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming) describes the exposure threshold and quantization. Pre-existing specification requires broader approved family datasets/thresholds for formal qualification; this diagnostic does not silently supply approval retrospectively.

## Observed page loading

All numbers below are from30recorded cold HTTP-cache loads per page. p75/p95 use nearest-rank order statistics; median is the conventional middle-pair mean.

| Page | Encoded HTML+JS+CSS kB | FCP median ms | LCP median ms | LCP p75 ms | LCP p95 ms | Worst LCP ms | Layout-shift sum p75 | Initial DOM nodes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| react | 77.724 | 832.0 | 832.0 | 836.0 | 852.0 | 856.0 | 0.000 | 629 |
| alpine | 53.471 | 516.0 | 516.0 | 520.0 | 540.0 | 556.0 | 0.000 | 674 |

Totals include the framework, app fixture code, HTML and shared app+Lyra CSS actually requested by that page, with no cached-asset deduction. They do not include hypothetical images/fonts/backend payload. No horizontal overflow was found at the390pxviewport. Initial/open/expanded screenshots were inspected; native app buttons and actual Lyra fields/panels are visible. This is not pixel-parity or a complete accessibility audit.

| Page | Long tasks across30coldloads | Long-task duration median / p95 / worst ms |
| --- | ---: | --- |
| react | 0 | none observed |
| alpine | 30 | 63.0 / 73.0 / 74.0 |

A fast observed LCP does not imply that no main-thread work occurs. The Alpine fixture initializes200unvirtualized rows after loading its plugin; the cold-load long tasks are reported rather than hidden. No causal attribution of their complete duration to a specific Lyra function is claimed.

## Principal workflows

Each row has30successful trusted-input measurements. All proxy values are milliseconds. Selection alternates appointments2/3 so repeated samples cannot pass by selecting an unchanged value. Expansion starts at200rows and verifies1000actual rendered listitems; reset is outside that operation's timing.

| Page / operation | Median | p95 | Worst | Samples exposing EventTiming | Overlapping long tasks |
| --- | ---: | ---: | ---: | ---: | ---: |
| react: open | 36.9 | 50.4 | 50.7 | 30/30 | 0 |
| react: keyboard-tab | 17.9 | 42.1 | 42.5 | 17/30 | 0 |
| react: save-commit | 38.9 | 55.4 | 58.1 | 30/30 | 0 |
| react: escape-close | 20.2 | 41.9 | 43.3 | 30/30 | 0 |
| react: select-row | 39.9 | 55.5 | 59.9 | 30/30 | 0 |
| react: expand-1000 | 71.8 | 83.1 | 91.7 | 30/30 | 24 |
| alpine: open | 40.1 | 53.4 | 53.7 | 30/30 | 0 |
| alpine: keyboard-tab | 21.3 | 41.3 | 41.9 | 11/30 | 0 |
| alpine: save-commit | 38.0 | 52.7 | 57.4 | 30/30 | 0 |
| alpine: escape-close | 19.3 | 36.6 | 41.2 | 24/30 | 0 |
| alpine: select-row | 30.8 | 47.4 | 50.2 | 30/30 | 0 |
| alpine: expand-1000 | 132.4 | 151.5 | 153.2 | 30/30 | 30 |

Open is actual Drawer activation. Keyboard is native Tab from appointment name to the next form control. Save changes the displayed committed name and closes; focus restoration is asserted. Escape closes and restores opener focus. Separate functional probes in both adapters also prove Escape/Cancel do not overwrite committed names with unsaved drafts.

The1000row update is a deliberately heavier unvirtualized app workload, not an already-approved maximum dataset for every Lyra family. It causes long tasks despite staying under this run's p95proxy reference. Do not generalize those results into a recommendation to render arbitrarily large lists. Production datasets and lower-end physical devices still need their own validation; this finding does not justify changing the approved asset caps.

## Nested mobile pickers and Cancel

Supplemental React-only series exercises actual mobile BottomSheets inside the Drawer. Parent inert ownership is asserted while the date sheet is active, and closing by selection returns focus to each picker trigger. Dates12/13 and times09:30/10:00 alternate so the selected value changes every cycle. Cancel discards an edited name while preserving the displayed saved value.

| Operation | Median proxy ms | p95 proxy ms | Worst proxy ms | EventTiming samples | Long tasks |
| --- | ---: | ---: | ---: | ---: | ---: |
| date-open | 35.2 | 45.7 | 47.3 | 30/30 | 0 |
| date-select | 40.3 | 52.6 | 60.2 | 30/30 | 0 |
| time-open | 36.8 | 52.2 | 58.1 | 30/30 | 0 |
| time-select | 39.2 | 47.9 | 56.3 | 30/30 | 0 |
| cancel-button | 33.2 | 51.4 | 57.0 | 30/30 | 0 |

## Instrumentation controls and corrections

Separate disposable blocking controls insert300msof synchronous work into the trusted Open event. Every recorded control produced a proxy≥250ms and an observed long task≥250ms; the collector therefore detects a known main-thread stall. Exact control rows remain in the raw reports and are excluded from normal samples by design. No workload sample was excluded for being slow.

The initial medium fixture executor could not write the sibling evidence directory and delivered no files. The retry explicitly granted only that fixture directory, and instructed the executor to implement directly. Initial101.46s/ retry207.56s; no product changes. Controller created the measurement harness/protocol. Principal preflight passed on its first runtime execution. Before any principal result, the selection protocol was clarified to alternate values, avoiding a same-value no-op benchmark.

Two supplemental preflights exposed harness expectations, not product defects: a label query also matched the newly opened sheet's accessible label; it was narrowed to the actual trigger buttons. The time-choice expectation assumed AM/PM while TimePicker explicitly formats h23; it was corrected to09:30/10:00. Both failed preflights are retained; third preflight and the full supplemental series pass. No assertion threshold, product code, motion or workload was relaxed. The supplemental coverage was declared after the principal run and before observing supplemental performance; it is not retroactively described as part of the original frozen series.

## Conclusion and remaining scope

These two bounded pages loaded and responded within the stated diagnostic references under the synthetic mobile profile. The measurements support the earlier assessment that the accepted current asset sizes can be reasonable for representative pages; they do not prove every application or phone will behave the same. Raising SizeLimit itself did not increase the byte-identical runtime, so no causal speed improvement/regression is attributed to that policy-only change.

Task39 gains this production-consumer laboratory evidence. Remaining release work includes exact final candidate qualification across the required browser/React18/19/SSR/hydration/security/types/export/consumer/visual/assistive-technology scope, applicable approved family responsiveness datasets/thresholds, and scenario/migration-delta/historical-baseline disposition. Physical-phone and real-user evidence are not supplied by this run. Blade remains deferred; no release, version, remote, dependency, foundation or service/resource change was made.

## Reproduction and raw evidence

MAIN .batuta/runs/v1-mobile-validation/ contains protocol.md, eight-section worker briefs and complete logs, six fixture files, setup/build scripts, exact consumer installation metadata, production site plus Brotli assets/maps, source/build hashes, Playwright runners/instrumentation, principal/supplemental/preflight/negative/control JSON and screenshots, summary.json/nested-summary.json and the analysis scripts. Three exact candidate tarballs remain in v1-approved-budgets/approved/tarballs. Read input-proof.json for whole-file scope and exact installed-byte checks. Owned server/browser lifetimes are closed in finally; temporary consumer cleanup is recorded separately. Failed and successful raw results are preserved. No new runtime or measurement dependency was introduced.

## Independent review and disposition

GLM5.3Flash/low13.48s returned3DONE/no findings with an unchanged2018-file guard; Batuta verifierPASS. Controller rechecked60loads/510trusted timed operations, all diagnostic references, original protocol hash, exact asset hashes and owned cleanup. Final temporary consumer/store removed; production site/fixtures/raw reports/screenshots retained. Review approves this bounded laboratory evidence and its honest limitations only. No product fix was needed.
