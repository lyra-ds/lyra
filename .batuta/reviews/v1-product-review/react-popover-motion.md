# Popover reduced-motion repair and review disposition

Verified narrow repair on 2026-09-13. OpenCode/GLM-5.3-Flash low, one corrective retry to register the existing parity extension. Product change is one additive reduced-motion rule in `packages/styles/components/primitives/primitives.css`; `tools/parity/parity.mjs` registers the existing Popover class using the established extension mechanism. Canonical handoff, normal-motion keyframes, React/Alpine, dependencies and locks are unchanged.

## Evidence

Before: active reduced-motion media still produced `lyra-popover-in`, `0.12s` in Chromium, Firefox and WebKit. After a fresh Styles pack: all three reduced-motion cases PASS with `none`, `0s`; six light/dark cases retain normal `lyra-popover-in`, `0.12s`. The old failing observation is the regression control. Existing Dialog, Drawer and BottomSheet each pass18/18 on the new Styles artifact. All owned browser contexts, preview processes and temporary consumers cleaned up.

Controller native macOS Node24.18.0/pnpm11.13.1: full `pnpm test` exit0 in164.54s; Styles `lint:css`, `pnpm parity`, scoped formatting and diff checks exit0. A temporary canonical Popover background change to red is rejected by parity; original CSS bytes restored and parity passes. Two initially mistyped controller aliases (`lint`, `parity:check`) did not run checks; their failures are retained, with the actual corrected commands and exits recorded separately.

Independent read-only Codex/gpt-5.6-terra review:3DONE, no findings, unchanged tree guard. The reviewer confirmed the narrow interpretation below, not full component qualification.

## Aborted producer: do not integrate or count as qualification

The proposed packed Popover producer failed controller verification after a Terra/high retry and critical conductor correction. It is aborted, absent from the delivered branch, and preserved only as diagnostic source/raw evidence. The final diagnostic report exits1:16/18 cases pass, while WebKit LTR/RTL still fail a native reverse-Tab harness precondition. These are not proven Popover product defects. No successful producer negative control or full Popover profile qualification is claimed. The separately isolated three-engine motion observation establishes only the CSS repair above; it does not turn the diagnostic command green.

The diagnostic worktree used candidate ancestry d3a5252 and CSS snapshot342cabb; integration cherry-picks only the repair commit diff, excluding the failed producer and shared-runner changes. Raw original attempts: MAIN `.batuta/runs/v1-popover-20260913/`, including `aborted.md` and `aborted-candidate-source/`. Raw repair: MAIN `.batuta/runs/v1-popover-motion-20260913/`, including stage, exact tarballs, all reports/screenshots, command exits, canonical mutation proof, reviewer output/guard and final integration identity.

Styles tarball SHA256: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`. React tarball reused after exact tree/hash check: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`. Report hashes are in the raw `verified-report-index.json`.

No OS high-contrast, physical-device, Linux/Windows, hydration, baseline acceptance, release or full V1 claim. The remaining task list is reassessed separately under the maintainer's small-lot, native-contribution direction. No push, merge to main, release or remote dispatch.
