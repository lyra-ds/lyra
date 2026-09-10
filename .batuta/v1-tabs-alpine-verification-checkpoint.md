# Alpine Tabs — verification checkpoint, paused 2026-09-10

Task27 remains incomplete. Initial Codex gpt-5.6-terra/high delivery completed in499.21s, exit0, from49c8447. No implementation retry has been sent; one high retry remains available. Product work is deliberately uncommitted and must not be accepted from source-test success alone.

## Verification

Pinned Node24.18.0 controller checks passed: Tabs source tests in Chromium/WebKit/Firefox, TypeScript, scoped formatting, Alpine build, public type exports, generated catalog production and drift check. The separate public type consumer also passed. Protected1712 paths and450 React artifacts retain their pre-dispatch SHA256 bytes. Generated Alpine catalogs have no tracked changes. No runtime dependency or package configuration changed.

Compiled native verification ended48/63 PASS,15 FAIL, zero console/page errors; five scenarios fail identically in each of the three engines. Owned browsers and Vite server were closed in finally. This is failed acceptance, not V1 qualification.

The first native harness incorrectly included a consumer panel button in trigger snapshots and generated-ID setup. Original fixture/runner/result are retained as initial-* alongside the current fixture. The controller narrowed those queries to actual x-bind=tab elements; initial frame coherence and generated-value ID stability now pass. Product source was unchanged by this harness correction. Eligibility failures now record the precise mode: collapse.

## Findings for the first high retry

1. Invalid initial active and duplicate structure remove supplied trigger IDs. The unready :id binding returns null. Preserve supplied IDs throughout fallback, failure and teardown; both scenarios currently fail in all engines.
2. After native navigation to Two, an external active=One update correctly leaves focus on Two, but Home to already-selected One is discarded by the value===active early return. Preserve navigation to that eligible destination and the selected before-change cancellation contract before focus/state/result. The selected-destination native scenario currently fails before the before-event assertion.
3. visibility:collapse triggers remain eligible; ArrowRight selects invisible Two instead of visible Three. Other eligibility modes before collapse pass. The current combined scenario stops at collapse, so later fieldset/RTL checks are not yet proven by this run.
4. Destroy treats an owned button inside real panel content as an enhanced trigger, stealing its native focus. Restrict fallback focus transfer to actual enhanced trigger membership. The destroy-panel-button case reaches the consumer button through real Tab navigation and loses focus on teardown in every engine.
5. Source review also found removed meaningful coverage: server-rendered active-class deactivation, pills axe/classes and both directions of x-modelable propagation. Restore these regression obligations in the existing source test file. The obsolete invalid-value-select-first behavior is intentionally superseded and should not return.

No product correction or independent acceptance review has been performed for these findings. Do not weaken assertions, skip failing engines, silently raise budgets or refresh imported Blade snapshots.

## Evidence and next cycle point

Raw controller evidence lives in the main checkout at .batuta/runs/v1-tabs-alpine-checks/results.json, v1-tabs-alpine-native/{fixture.js,run.mjs,result.json,initial-*}, v1-tabs-alpine-native-pause-checks/results.json and v1-tabs-alpine-initial/{before.json,pause-scope-result.json}. Executor report/log lives in the active worktree at .batuta/runs/v1-tabs-alpine/. Existing seven-path scope and complete design/brief remain authoritative.

On explicit resume, read this checkpoint and current diff, prepare bounded feedback/retry brief, then dispatch the first high retry. Rebuild before compiled native checks; verify every exit. Retain both source and native proof, then independent review and a product commit only after acceptance. New Alpine bundle size has not been measured; the old21949/21200B overage remains unresolved under Task10, not a claim about current bytes.

After runtime acceptance: Alpine public MDX and actual snippet proof, plus owning-source Blade migration/qualification (current imported Blade markup is incompatible and remains read-only). Remaining V1 work includes DataTable, broader modal/API ownership,13 prior size overages and final packed/browser/React18+19/SSR/hydration/security/consumer/manual accessibility qualification. Nothing has been pushed, merged, versioned or published.
