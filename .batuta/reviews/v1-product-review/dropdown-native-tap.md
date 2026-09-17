# Dropdown native tap verification — 2026-09-15

Bounded verification at candidate `d6cf5cc84bc5d330acb4f44cdbbbd436b7d2f52f`, using the retained packed React0.5.0, Alpine0.6.0 and Styles0.5.0 artifacts. No product change was necessary.

## Contract and scope

The overlay family design OF-MENU Dropdown contract (docs/superpowers/specs/2026-08-30-overlay-family-design.md, lines320–379) supplies the applicable menu model. This observation covers pointer opening, one enabled command, explicit trigger-focus restoration after selection, and outside-tap dismissal. React's public DropdownItem has no disabled variant; the conditional disabled-item obligation is not tested or declared supported here. Alpine's internal aria-disabled fixture alone does not establish a shared public disabled model. Other item policies, keyboard behavior and menu variants are outside this lot.

## Native observations

A temporary production Vite consumer imported the extracted public React Dropdown and Alpine plugin, with packed Styles. Playwright touchscreen.tap used actual target bounding boxes, without dispatchEvent, fabricated compatibility mousedown or synthetic hover. Each adapter ran in a fresh hasTouch context on native macOS arm64: Chromium151.0.7922.34, Firefox153.0, WebKit26.5. Node24.18.0, Playwright1.62.1 and Vite8.2.1 were reused.

All six cases passed:

- Initialized trigger had aria-haspopup=menu and aria-expanded=false; the menu was hidden/unmounted. A native tap opened a visible role=menu without invoking any command.
- Tapping the enabled Choose menuitem invoked the consumer command exactly once, updated its visible result to Chosen:1, closed the menu and restored trigger focus. Both opening and selection generated trusted touch pointerdown/up and trusted non-prevented clicks.
- Reopening and tapping Outside action closed the menu, ran that button's action once and left selection count at one. A trusted native compatibility mousedown on that button was observed in every case. Outside-button focus was recorded, with no universal focus assertion.
- A temporary capture listener prevented and stopped an item click. The expected second-selection assertion failed, count stayed one and menu stayed open. Removing that exact listener restored selection: count two, menu closed and trigger focus restored. This is a fixture interception control, not a reproduced product-source defect.
- Both coarse-pointer and no-hover media matched in all contexts. maxTouchPoints was1 in Chromium and0 in Firefox/WebKit; trusted touch events provide the input proof. No page or console errors occurred.

## Artifact binding and preservation

Archive SHA256 identities:

- React: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`
- Alpine: `de296884efffe7bcad7f74af9a93595a74ce763edb8bb8e21587559cac09e8aa`
- Styles: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`

Vite's module inventory includes the extracted public entries and rejects workspace product source/dist/component paths. Explicit installed React/ReactDOM19.2.8 and Alpine3.15.12 peers were reused, so this is not a fresh-install compatibility matrix. Additional HTTP requests for the emitted JavaScript/CSS matched their output hashes. All extracted package files stayed unchanged;450 React distribution files,3 Alpine distribution files and20 Styles CSS files matched the checkout. All2154 tracked files were unchanged before managed reporting.

Raw MAIN `.batuta/runs/dropdown-native-tap-20260915/` retains exact fixture/script, built assets, events and snapshots, results, summaries, package hashes and preservation/cleanup records. The temporary consumer/script and owned browsers/preview server were removed. Existing unchanged common/source/packed test evidence was reused; no permanent test, new runner or broad-suite rerun.

## Disposition and limits

This closes only the observed enabled-command native tap slice for these artifacts and emulated browser contexts. It does not qualify physical devices, target geometry, other media/direction profiles, disabled items, all Dropdown behavior, performance, Linux/Windows or final V1 acceptance. Relevant package changes require renewed identity/behavior checks. This one-off proof is not a new CI regression gate.

Batuta research used OpenCode/opencode/glm-5.3-flash. The controller rejected the scout's Chromium-only focus suggestion because both adapters explicitly restore trigger focus, and proved restoration in all three engines. No product/dependency/CI, numerical policy, ledger or baseline/pointer changed; no remote/release/container action or old-loop restart.

Independent OpenCode/GLM review returned3/3 DONE after one review-only retry: its first invocation attempted redundant external evidence reads, was denied by the executor, and exited without a verdict. The successful inline review made no tool calls. Controller unchanged guards passed. Archive/current-file hashes are separately verified in artifact-identities.json and preservation.json; module inventory alone is not their proof. Installed Playwright/Vite versions were additionally recorded in tool-versions.json. The review's narrower workspace-regex observation is accepted within this three-package scope; workspace peer reuse remains disclosed. No implementation retry, escalation or further runtime run was needed.
