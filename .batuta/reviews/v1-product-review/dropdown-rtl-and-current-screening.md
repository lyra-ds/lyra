# Dropdown direction repair and current-candidate checks — 2026-09-15

A reproduced Dropdown defect is repaired: logical `start`/`end` now follow inherited direction in React and Alpine. Two additive CSS rules neutralize the corresponding original physical offset and set the logical inset. Original handoff declarations and public class names remain unchanged; exactly the two intended modifiers are registered with the existing parity check. No runtime adapter code, shared placement helper, dependency or baseline changed. The changeset is Styles-only.

## Behavior and regression proof

The production packed matrix covers React/Alpine × Chromium/Firefox/WebKit × LTR/RTL × explicit start/end. Original CSS:12LTR PASS,12RTL FAIL (167–180px wrong edge). Corrected CSS:24/24 PASS, with preserved menu widths. The initial measurement sampled the entrance animation; settled measurements await actual animation completion. Raw initial output is retained. A later replay reproduces both settled results in separately named files after a controller output-path collision; use `dropdown-baseline-replay.json` and `dropdown-final-replay.json` as authoritative pair.

Existing browser test files add seven geometry cases each: default/explicit LTR/RTL and nested LTR within RTL. Restoring original CSS produces exactly3RTL failures and4passes per adapter in Chromium. Corrected focused suites pass29React +18Alpine cases per engine,141total. Existing up-placement, class, keyboard/selection and focus tests remain intact. Types, stylelint, formatting, parity211tokens/436classes and `pnpm test` pass.

Batuta: Codex/gpt-5.6-terra medium, one implementation retry, then high-effort escalation to register the exact additive classes and format one assertion. Initial direct canonical edits and unregistered additive selectors failed parity and were not accepted. Independent GLM review raised base-inset/type/stretch hypotheses; complete source, actual tsc results and measured widths disproved them. Reviewer retracted all three; tracked-file guard passed. Hook-generated cache was removed and not integrated.

## Current exact artifacts

- react: `3b77c2bc90a4b39ad6dbb94de8989dd4930f094edd5d0704e32e70074614f647`.
- alpine: `127640d55d595ba6b252d9ca00d41d6d477211425924651ca88032ee927bbee0`.
- styles: `916e9eeef1047da32dca7237ae1e61961b7faeebb333e55ce6df86a42d427c25`.

React/Alpine archives match the previous Popover repair; only Styles changed in this repair. Full extracted input files match these retained tarballs. Raw source revision is the isolated verified WIP candidate; the integration record binds the final commit to the same source and artifact bytes.

## Reused P1 fixture screening

The existing eleven-component React P1 compatibility fixture was reused in a temporary production consumer, with its raw trigger buttons replaced by public Lyra `Button` components. No permanent producer was added. Across three engines and six profiles (light/dark axe, forced colors, reduced motion, RTL, coarse pointer),195 named interaction observations pass. Tooltip hover is excluded from the coarse-pointer profile; its separate native touch evidence remains distinct. Light/dark axe:66 component-state observations pass with no WCAG2/2.1/2.2 AA violation filters.

The original fixture's raw adjacent trigger buttons produced target-size violations; those results remain recorded, not relabeled PASS. An apparent CreateWorkspaceDialog contrast failure disappeared after waiting for its parent entrance animation; no product contrast change was justified. This consumer variant does not change the tracked compatibility fixture or substitute for its SSR/hydration proof.

These observations establish the named state/selection/dismissal flows under media emulation. Computed visual properties were captured, but they do not establish every forced-color boundary, selected state or focus indicator, full direction/zoom/long-content geometry, touch scrolling, physical-device behavior or all composed contract scenarios. No complete media cell or V1 qualification is claimed.

## FileUpload refresh

The unchanged `pnpm performance:file-upload` producer passes against the current exact React/Styles hashes above at verified source22a830e. Six operations,100items/20active attempts,3warm-ups/30samples each. Maximum p95:1.100ms; worst sample:1.300ms; longest task0 within the measured windows. Existing p95≤100ms, worst<250ms, long-task<50ms limits are preserved. Controller independently reran the validator/renderer on captured JSON and checked exact archive identities. Native macOSarm64, Node24.18.0, Playwright1.62.1, Vite8.2.1, Chromium151.0.7922.34. No acceptance pointer or canonical report was promoted.

## Remaining acceptance

This closes the Dropdown direction defect and refreshes the named screening/runtime evidence. Detailed applicable media outcomes, scoped reuse or refresh of older package/compatibility/budget evidence, native Linux/Windows integration observations and consolidated profile acceptance remain open. The approved numerical-protocol deferrals stay non-PASS. No release, remote action, container/service/resource change, dependency or old38-task-loop restart occurred.

Raw MAIN `.batuta/runs/v1-stable-closure-20260915/` retains briefs, rejected attempts, controller logs, final diff, negative controls, review/adjudication, tarballs, extracted identities, module/asset inventories, fixtures, runtime JSON/Markdown and bindings.
