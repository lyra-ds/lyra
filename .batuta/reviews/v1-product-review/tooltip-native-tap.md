# Tooltip coarse-pointer native action — 2026-09-15

Candidate `e9b6cd6defef9453a28fd6eb4142d689e856e86a`. **React and Alpine each passed the native-tap action proof in Chromium, Firefox and WebKit: six adapter/engine cases.** This is a bounded observation of existing behavior; no product defect or fix is claimed.

## Contract and result

The [Overlay contract](../../../docs/superpowers/specs/2026-08-30-overlay-family-design.md) requires a coarse-pointer tap to retain the trigger's native action, without requiring hover emulation or long press (OF-TOOLTIP, lines405-409). The [interaction contract](../../../docs/superpowers/specs/lyra-v1/03-interaction-accessibility.md) separately requires operability without hover. Synthetic pointer/click dispatch alone would not prove that native touch action.

A temporary consumer reused the existing React Tooltip child-button and Alpine root/target/bubble markup contracts, changing the button to a native form submit trigger so the browser's default action was observable. Existing pinned Vite8.2.1 built the real packed React Tooltip, Alpine plugin and Styles packages in production mode. Existing Playwright1.62.1 launched native headless engines sequentially with touch enabled and an800×700 viewport. Every context reported primary `pointer: coarse` and `hover: none`. `navigator.maxTouchPoints` reported1 in Chromium but0 in Firefox and WebKit; those exact values are retained rather than treated as positive touch-capability evidence. In all six cases the observed trusted pointerdown/pointerup events had `pointerType=touch`. The controller used `page.touchscreen.tap` at the actual button center; it did not dispatch synthetic DOM events or request hover/long press.

For each of the six cases:

- The initialized Tooltip root had the intended tip, and the native submit button referenced one existing semantic `role=tooltip` description with the expected text.
- First tap submitted exactly once; second tap raised the total to two. Both pointerdown/pointerup pairs were trusted touch events; both clicks were trusted. None of those events was default-prevented.
- A temporary consumer-side capture listener prevented the click's default action. A third-submit assertion then failed as expected: the total stayed two. This is a fixture negative control proving the action assertion detects interception, not a reproduced defect or product-source mutation.
- Removing that exact listener restored the next native tap's action: total three. No page or console errors were captured.

The form submit observer prevents navigation only after the native submit event and records the count; it never fabricates a click or submission. All six cases passed again after adding the explicit semantic-initialization assertions. Initial results remain retained separately.

## Artifact binding and preservation

Complete archive SHA256 values match the retained current artifact qualification:

- React0.5.0: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`
- Alpine0.6.0: `de296884efffe7bcad7f74af9a93595a74ce763edb8bb8e21587559cac09e8aa`
- Styles0.5.0: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`

The consumer extracted these packages locally. Its explicit React/ReactDOM/Alpine peers reused pinned installed versions; this is not a fresh dependency-install compatibility matrix. Vite's module inventory identifies the extracted public entries and rejects workspace product source/dist/component paths. The emitted JavaScript/CSS responses matched their recorded output hashes. All extracted package files stayed unchanged;450 React distribution files,3 Alpine distribution files and20 Styles CSS files matched the current checkout. All2153 tracked files were unchanged before this managed report. Node24.18.0, actual browser versions, macOS arm64 and exact artifacts are retained in raw evidence.

The temporary consumer, script, owned browsers and preview server were cleaned up. Built assets, complete scripts/fixture, module inventory, input events, native submit counts, control/restoration observations and hashes remain under MAIN `.batuta/runs/v1-media-next-20260915/`. Existing still-matching common/source/packed test results were reused; no broad suite, permanent test or producer was added.

## Limits and disposition

This closes only the observed native submit-button slice of the OF-TOOLTIP tap-action obligation for the named artifacts and emulated contexts. It does not qualify physical devices, every target's size, visual/media profiles, independent access to essential information in all consumer content, long-press behavior beyond this ordinary tap, or the complete Tooltip/V1 acceptance matrix. No universal tap-focus behavior, tooltip-visibility behavior on touch, or performance result is inferred. Future relevant package changes invalidate reuse until their identities and behavior are checked; this one-off observation is not a new CI regression gate.

Batuta research used OpenCode/GLM; the controller rejected its proposed synthetic tap and universal tap-focus assumption, then ran this native proof. Independent review is retained with the raw evidence. No product, dependency, CI, numerical policy, canonical ledger or baseline/pointer changed; no remote action, release, container/service change or old-loop restart.

Independent OpenCode/GLM review returned3/3 DONE. Its maxTouchPoints finding was accepted and the prose corrected to the exact1/0/0 observations; touch-event assertions, coarse/no-hover results and native submission counts remain the behavioral proof. No new maxTouchPoints prerequisite was invented. An unused local variable in the retained execution script was left unchanged to preserve the exact executed evidence. Review findings and adjudication are retained; no runtime rerun was needed for this reporting correction.
