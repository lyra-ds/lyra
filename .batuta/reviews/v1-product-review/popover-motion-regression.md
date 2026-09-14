# Popover motion regression — verified 2026-09-14

One permanent case added to `packages/styles/tests/popover.test.ts`, using the existing Styles browser suite, real CSS and media command. It checks an enabled positive-duration default animation, then active reduced-motion with animation `none` and duration `0s`. The existing afterEach pattern resets media and removes the fixture even after a failed assertion. No runtime, CSS, configuration, dependency, command or producer change.

Controller proof: Chromium/Firefox/WebKit3/3 PASS. Temporarily removing only the repaired CSS media rule makes all3 fail with expected `none`, actual `lyra-popover-in`. Original CSS bytes restored to base; fresh3/3 PASS. Complete Styles suite276/276 PASS; full `pnpm test` exit0 in158.14s. Scoped formatting, diff and source-identity checks pass. Native macOS, pinned Node24.18.0/pnpm11.13.1; no Linux/Windows or full V1 claim.

Routing: OpenCode/GLM-5.3-Flash low, one invocation, no implementation retry or escalation. Controller independently inspected the file and reproduced all positive/negative/restored proofs. No independent cross-review required for this successful low-lane task. Raw commands, exact exits, source hashes and restoration proof are in MAIN `.batuta/runs/popover-motion-regression-20260914/`; final integrated commit is recorded in `completion.json`.

This completes the first proposed small regression from the coverage-gap review. Drawer/BottomSheet close-focus variants, other media/touch coverage, final-candidate qualification and contract decisions remain separate; no further lot was started.
