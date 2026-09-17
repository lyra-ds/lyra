# Popover logical alignment repair — 2026-09-15

Explicit Popover `start`/`end` now follows inherited writing direction in React and Alpine. At base390944a, packed native tests reproduced a160px wrong-edge offset in RTL for a120px anchor and280px panel. LTR worked. The correction preserves automatic placement, public classes and shared helper behavior.

## Change

The [anchored-layer contract](../../../docs/superpowers/specs/2026-08-30-overlay-family-design.md), lines300–301, requires logical start/end to mirror in RTL. Existing modifier classes used physical left/right. The Styles additive extension now supplies logical inline offsets while preserving the canonical handoff prefix. React/Alpine emit their original classes and supply inline physical coordinates only for automatic placement, whose unchanged shared helpers return physical start/end. Explicit center and inherited/nested direction remain supported. No public prop/class, helper default, manifest, budget or policy changed.

Existing React/Alpine browser files now contain geometry regressions for explicit LTR/RTL start/end/center, nested LTR within RTL and automatic placement at both viewport edges. Measurements wait for actual geometry, without fixed sleeps. The patch changeset names React, Alpine and Styles; package versions were not bumped.

## Controller verification

| Proof | Result |
| --- | --- |
| Packed baseline, both adapters × three engines, explicit/center/nested/auto geometry |60/72PASS;12 explicit RTL start/end failures at160px|
| Same expanded proof with corrected packed artifacts |72/72PASS; all measured edge/center errors within1px|
| React Popover source suite |35 per engine ×3 =105PASS|
| Alpine Popover source suite |22 per engine ×3 =66PASS|
| New regression subset with original product files temporarily restored, Chromium |Each adapter:2 expected RTL failures,6 passed; unrelated cases filtered by test name|
| Exact corrected bytes restored after negative control |Verified; corrected packed proof passes|
| Common `pnpm test`, React/Alpine type checks, scoped React ESLint |PASS|
| Styles lint and existing parity |PASS;211 tokens/436 classes preserved|
| Existing React and Alpine size-limit commands |PASS; Popover1.79kB/3kB, Alpine23.39kB/24.2kB|

The first expanded diagnostic sampled two Alpine automatic placements before their asynchronous measurement finished. The corrected proof waits for the required in-viewport geometry and preserves that initial attempt; no product change was made to hide the timing issue. The settled baseline has exactly the12 explicit RTL failures. Reduced-motion emulation removes animation from the packed geometry measurement; this is not new reduced-motion qualification. Source tests also retain the existing animation and wait for its geometry to settle.

The first implementation candidate failed existing exact class assertions and handoff parity, and its new center assertions sampled the entry animation too early. One implementation retry preserved classes/canonical CSS and added geometry-based readiness. All first-attempt failures remain retained.

## Packed identity

Native macOS arm64, Node24.18.0, Vite8.2.1 and Playwright1.62.1 with installed Chromium/Firefox/WebKit. The final packages were built by the common verification in the isolated worktree, then freshly packed. Source candidatebb95249 contains the final correction and formatting; the final integration commit changes managed records only beyond those verified product bytes.

- react: `3b77c2bc90a4b39ad6dbb94de8989dd4930f094edd5d0704e32e70074614f647`.
- alpine: `127640d55d595ba6b252d9ca00d41d6d477211425924651ca88032ee927bbee0`.
- styles: `63266c45a567c33f2d05b67c3a13333165b4f53b5e4ad50d8922634d747d93eb`.

The production consumer extracts those exact archives and uses their public entries. A separate module-inventory build verifies extracted React Popover/Alpine/Styles resolution, rejects workspace product source/dist/component paths, and emits byte-identical assets to the executed proof. Workspace React/ReactDOM/Alpine peers are explicitly reused; this is not fresh-install compatibility. All extracted files stayed unchanged. The original review checkout's tracked files stayed unchanged until the reviewed squash.

Raw MAIN `.batuta/runs/popover-rtl-20260915/` retains initial and settled failures, exact consumer/scripts, final72-case geometry, final archives and distribution hashes, negative controls, source/common/static/size logs, review, scope guards and built assets. Temporary proof consumer/script and owned browsers/server were cleaned up. The verified distribution files were copied into the review checkout so local dist matches the integrated source.

## Review, scope and next work

Batuta medium implementation used Codex/gpt-5.6-terra in an isolated worktree. Its first sandboxed package commands stalled before browser startup; only owned processes were terminated, implementation continued without test execution there, and the controller ran all native verification. One implementation retry; no lane escalation. Independent GLM review completed3criteria after retracting an unreachable auto-center concern: both unchanged helper type/runtime domains are start/end only. No speculative branch was added.

This fixes explicit logical horizontal alignment and checks the bounded automatic/center/nested cases. It does not qualify dynamic direction mutation, general viewport collision/shift, oversized panels, portals, scrolling, touch, forced colors or complete V1 acceptance. Event/focus ownership code is unchanged; the previous native keyboard report remains historical evidence on its named artifacts, not a fresh keyboard run on these new archives.

All three package hashes changed. Prior package/compatibility, touch, keyboard and FileUpload runtime observations remain valid for their original artifacts; they must not be silently labeled exact-current-candidate proofs. The final qualification step must refresh affected artifact-bound evidence (including FileUpload runtime) or establish justified scoped reuse. Remaining media/direction mapping, native Linux/Windows observations and consolidated acceptance remain separate. No remote/release/container/resource, canonical pointer/ledger, threshold or old-loop change.
