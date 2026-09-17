# Coarse-pointer targets — 2026-09-17

The settled public packed React fixture exposed nine shared CSS owners below the existing 44×44 Lyra touch target: Button, Tab, table sort button, Drawer close, menu item, command item/search, input and workspace slug input. The repair adds minimum dimensions only under `(pointer: coarse)`, preserving fine-pointer declarations and the handoff baseline. The same Styles rules serve React and Alpine; the packed interaction observation here covers React only.

## Verified scope

- Packed public fixture, Chromium/Firefox/WebKit, real `hasTouch` browser contexts: each engine recorded 92 visible/enabled target observations and successful interaction checks. All three changed from 81 below-target observations to zero. Counts include repeat observations across open/closed scenarios; they are not distinct controls. Animations finish naturally before measurement.
- Focused source regression: 8 tests in four contexts pass. Full Styles suite: Chromium106, Firefox104, WebKit104 pass. Fine geometry is preserved. The fixture uses the public `lyra-table` class, matching its 18px header sort control; an unstyled table is not equivalent.
- Negative proof: restoring all five pre-fix CSS files makes the coarse test fail on the medium button's40px height while the fine cases pass. All current CSS bytes were restored and checked.
- Stylelint and parity pass; baseline unchanged (211 tokens/436 classes). Both browser matrix/config suites pass28 tests. Changed non-CSS files pass Prettier.
- Existing complete native bundle gate passes72 standalone entries, five scenarios and four CSS entries. No budget increase. React/Alpine package archives are unchanged; new Styles archive is `6185b2706ed28ba5136a2814b2f6b573816e458313a6b6a0ed2d8b749951e2d4`. All23 packed Styles files match the observed consumer. Later changes to the regression fixture/config do not alter these shipped package bytes.

## Commands and retained evidence

`pnpm --filter @lyra-ds/styles run test:browser`; `pnpm --filter @lyra-ds/styles exec vitest run tests/coarse-targets.test.ts`; `pnpm --filter @lyra-ds/styles run lint:css`; `pnpm parity`; `node --test tools/phase1/browser-matrix.test.mjs tools/phase1/browser-config.test.mjs`; `pnpm baseline:bundles --check-budgets`.

The controller checkout retains raw observations, the one-off probe binding, full command logs and failed intermediate fixture attempts under `.batuta/runs/pr223-followup/`. The SHA-256 index beside this report binds those retained local files. This report is bounded verification, not the immutable candidate acceptance record, whole-profile PASS, physical-device/manual touch proof, or release authorization. Modal touch scrolling, constrained anchored scrolling and composed-media acceptance retain their separate pending disposition.

## Portable CI follow-up

PR228's first Linux run exposed a test-only font assumption: a content-sized tab is40px there, versus39px on macOS. The regression now requires visible compact sizing below44px for fine pointers, with exact comparisons only for CSS-authored fixed heights; the strict44px coarse checks are unchanged. Browser contexts run in distinct Vitest sequence groups because Playwright temporary trace chunk names omit the project identity. Traces remain enabled.

Controller reran all314 Styles tests, the four-context/eight-test regression,28 matrix/config tests and formatting: PASS. Making the coarse rules unconditional makes the fine-pointer test fail, confirming the portable check still detects desktop expansion. Exact shipped CSS bytes are unchanged, so the packed geometry and72/5/4budget proofs remain applicable. Failed CI and diagnostic attempts remain retained; updated CI must still pass before merge.
