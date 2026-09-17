# Alpine DatePicker mobile focus and public template — 2026-09-11

Status: bounded correction verified. Final V1 qualification remains open.

The canonical mobile composition now supplies the existing BottomSheet `returnFocusTo` option. Its resolver finds the current trigger within the sheet's enclosing DatePicker root. Two instances therefore return to their own triggers without global IDs. The existing generic eligibility and preventScroll behavior remains unchanged. Native keyboard opening and selection are retained; unprepared WebKit pointer opening no longer depends on captured BODY focus.

Controller verification found that the original public JSDoc template could not mount its mobile sheet: an Alpine x-if had two sibling roots, and desktop markup was malformed. The corrective retry makes both branches balanced single-root templates. Two new browser tests extract and execute the actual JSDoc HTML without replacing its markup. EN/PT docs show the same scoped integration. Duplicate sheet-title IDs were replaced by a static example dialog label.

## Reproduced evidence

- Final DatePicker, BottomSheet and return-focus helper suites: 27 tests per engine on both host and the pinned Linux Playwright container, all passed.
- Native pointer, native keyboard and two-instance focus return are covered. Existing selection/model and viewport tests remain.
- In a disposable copy, removing only the consumer resolver produces the original WebKit failure: active BODY instead of the trigger. Restoring it passes. The initial literal JSDoc mobile probe separately failed with “Expected bottom sheet”; final literal desktop/mobile cases pass.
- Alpine types, scoped Prettier, Alpine build, Alpine docgen check, docs ESLint, docs production build, Alpine Size Limit and diff checks pass. Alpine has no ESLint configuration; no extra gate was invented.
- Current Size Limit reports 23.05 kB against the approved 24.2 kB cap. DatePicker executable source is identical after comment removal, and old/new Alpine JavaScript minifies identically with the same esbuild options. Raw JS changes from 225,660 to 225,810 bytes because of JSDoc; source-map hashes also change, while declarations remain identical. This does not claim all 453 generated files retain their previous hashes or that the historical baseline passes.

## Review and boundaries

Codex Terra high initial 270.99 seconds, one high retry 521.38 seconds. The controller stopped two owned sandbox pnpm wrappers after 103 seconds without output; direct controller checks passed. No dependency, generic runtime, public API, size cap, historical baseline, Blade, VM/service or remote change.

Independent GLM 5.3 Flash review: 60.36 seconds, three DONE criteria, unchanged tracked/status guard and Batuta verifier pass. Controller declined a low timeout observation because the new literal desktop test uses the unchanged existing desktop close polling contract; no existing timeout was enlarged. Informational duplicate-ID correction accepted. Exact findings and adjudication are retained.

Raw evidence: MAIN `.batuta/runs/v1-focus-closure/`, including worker/retry reports, final host/Linux matrices, native negative/restored logs, runtime/artifact hashes, static results and independent review. Full Alpine matrix is a separate ongoing gate. CommandPalette timing, full Linux React gates, historical baseline disposition and formal P1 acceptance remain pending.
