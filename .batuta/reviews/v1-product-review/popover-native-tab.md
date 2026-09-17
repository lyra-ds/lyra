# Popover native sequential keyboard proof — 2026-09-15

At `513418baf3a8dd676b57233905096ed8ee284646`, the existing packed React/Alpine Popover passes the bounded non-modal focus journey in the contexts below. No product change was necessary. This advances the native sequential traversal gap from [remaining acceptance](remaining-acceptance.md); it is not an unqualified three-engine plain-Tab PASS.

## Observed result

| Browser on native macOS arm64 | React | Alpine | Navigation keys |
| --- | --- | --- | --- |
| Chromium151.0.7922.34 | PASS | PASS | Tab / Shift+Tab |
| Firefox153.0 | PASS | PASS | Tab / Shift+Tab |
| WebKit26.5 | PASS with stated key combination | PASS with stated key combination | Option+Tab / Option+Shift+Tab (Playwright Alt modifier) |

The initial WebKit React attempt timed out before interacting with Popover: plain Tab did not focus the ordinary Before button. A separate page containing only native button/input/button controls reproduced the boundary: Tab selected the input then body, skipping both buttons; Option+Tab selected button, input, button and reversed with Option+Shift+Tab. This supports an environment-specific keyboard traversal explanation, not a reproduced Lyra defect. No Mac or browser preference was changed. Full WebKit plain-Tab behavior remains unqualified; the initial failed run is retained and not relabeled PASS. Alpine was not reached in that initial attempt.

## Journey and contract

The [anchored-layer contract](../../../docs/superpowers/specs/2026-08-30-overlay-family-design.md), lines303–323, requires Escape restoration from inside the panel and defines Popover as non-modal content. Outside-focus dismissal is optional. Menu-specific Tab-to-close rules do not apply to this Popover fixture. Keeping the panel open after focus exits is observed current behavior, not a new mandatory rule for every consumer.

The temporary production consumer used a native Before button, one semantic Options trigger, two native panel buttons and a native After button. Each successful case checked:

- Initial keyboard navigation reaches Before then Options; Enter opens without moving focus off Options. The trigger has aria-haspopup=dialog and stable aria-controls naming the actual labeled dialog.
- Forward traversal reaches First, Second, After without a trap or extra stop. Reverse traversal reaches Second, First, Options, Before. Panel remains open after focus exits in this implementation.
- Enter closes from the trigger; subsequent traversal skips the hidden/unmounted panel and reaches After.
- Space reopens; traversal enters First; Escape closes and restores Options. Closed content is again skipped.
- A consumer-side keydown listener prevents the traversal key on First. The expected Second-focus assertion fails, leaving focus on First. Removing the exact listener restores movement to Second; Escape restores Options. This is a fixture sensitivity control, not a source-defect mutation.

All actual keydown events were trusted. The proof never seeds traversal with focus(), dispatchEvent or a fabricated key event. It asserts the result of real Playwright keyboard input. Enter/Space and Escape remain unchanged in the WebKit variant; only forward/reverse traversal adds Alt. The generic raw log label "native Tab PASS" must be read with that variant's actualKey fields and this qualification.

## Artifact binding and preservation

Vite8.2.1 production build imported extracted public React Popover and Alpine plugin with packed Styles; Playwright1.62.1 on Node24.18.0. Module inventory confirms the extracted entries and rejects workspace product src/dist/component paths. Installed React/ReactDOM19.2.8 and Alpine3.15.12 peers were reused; this is not a new fresh-install compatibility matrix. Emitted JavaScript/CSS matched hashes in additional served-asset requests.

Complete archive identities remained:

- React0.5.0: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`.
- Alpine0.6.0: `de296884efffe7bcad7f74af9a93595a74ce763edb8bb8e21587559cac09e8aa`.
- Styles0.5.0: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`.

All extracted files stayed unchanged;450 React/3 Alpine distribution files and20 Styles CSS files matched the checkout. All2157 tracked files stayed unchanged before reporting. Both production builds emitted identical assets. Owned browsers/servers closed; temporary consumer/script removed and built assets retained.

Raw MAIN `.batuta/runs/popover-native-tab-20260915/` contains the exact fixture, initial and Option+Tab scripts, initial failed results, qualified successful results, input/focus paths, native-control observations, artifact/preservation checks, cleanup and summary. No broad suite or permanent test/producer was added. Existing matching package/compatibility/common evidence was reused.

## Disposition

OpenCode/GLM read-only scout with unchanged guard, followed by controller native verification and minimal native-control diagnosis. No implementation retry or escalation. The scout's speculative opening-focus caveat was resolved by observed Enter/Space results. This proof covers an inline non-modal panel with two native controls: no nested/portal/dynamic/controlled consumer claim, no media/RTL/touch/geometry/performance claim, and no final V1 qualification. WebKit plain-Tab capability remains explicitly separate from the observed Option+Tab journey.

Next bounded work remains the applicable media/direction/interaction evidence mapping; native Linux/Windows integration and consolidated acceptance remain separate. No product/dependency/policy, baseline/pointer or remote/release/container/resource change; no restart of the old loop.
