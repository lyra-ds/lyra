# Modal close-focus regressions — 2026-09-14

One shared variant table extends the existing Dialog Styles tests to Drawer and BottomSheet. The two assertions per variant retain real native Tab navigation and computed CSS: normal focus shadow and forced-colors solid 2px outline with 2px offset, perceivable color and the existing profile target minima (Dialog/BottomSheet 44px, Drawer 24px). Media and DOM cleanup remain in afterEach. No product, CSS, configuration, dependency or command change.

Controller proof on native macOS with Node24.18.0/pnpm11.13.1: initial focused matrix 18/18 PASS. Removing only each repaired variant selector makes only its forced-colors case fail in Chromium, Firefox and WebKit when run separately (six runs, each 1 expected failure and 5 passes). Chromium reports expected solid/received none; Firefox/WebKit report the matching assertion stack. Exact original CSS bytes restored after both mutations. The restored complete Styles suite passes 96/96 per engine, 288/288 overall, including all 18 modal cases.

The first combined negative run also hit Vitest trace errors, and the combined restored run failed five cases in __vitest_stopChunkTrace/onAfterRetryTask with Error: empty. These attempts remain archived and are not PASS. Running each engine separately preserves all assertions and trace settings and passes; the cause of the combined-run trace error remains unresolved. No configuration or test was weakened to suppress it. This is not a clean combined-matrix or Linux/Windows qualification claim.

Common gate: full `pnpm test` exit0 in228.10s.

Routing: OpenCode/GLM-5.3-Flash low, one invocation, no implementation retry or escalation. The controller inspected scope and test hygiene and independently ran the proofs. No independent cross-review required for this low-lane delivery. Raw commands, exits, reports, exact restoration/source hashes and final integration record: MAIN `.batuta/runs/modal-close-focus-regressions-20260914/`. Formatting and diff checks pass.

This completes the two remaining permanent regressions in coverage gap1, alongside the previously committed Popover motion test. Other gaps remain separate; the old loop stays suspended.
