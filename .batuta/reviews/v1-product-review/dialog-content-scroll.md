# Dialog long-content repair — 2026-09-17

Historical initial repair: the body-scroll layout below was superseded before merge by [overlay scrolling and popup visibility](dialog-overlay-scroll.md), after a reproduced Dropdown clipping regression. Retain these original observations with their original artifacts.

The [native touch diagnosis](native-touch-scroll-diagnosis.md) found a public Dialog whose1226px body extended outside a390×844viewport, could not scroll and left Close unreachable. Shared CSS now bounds the panel to its padded viewport, lets the body scroll internally, and keeps header/footer outside that scroll region. Short dialogs retain natural sizing. Public classes, React/Alpine code, theme and motion behavior are unchanged. Child layout declarations stay explicitly owned by `.lyra-dialog`; no parity policy/baseline change.

Controller verification on541ff844203dfae02f8c71327ace901f55247a6a:

- All322 Styles tests pass: Chromium110, Firefox106, WebKit106. The existing Dialog test adds only long/short public-markup cases. Restoring priorCSS makes the new long case fail at visible overflow; repaired bytes were restored before the full passing suite.
- Stylelint/parity and formatting pass. The complete native72-entry/5-scenario/4-CSS budget gate passes unchanged. The gate's pre-rebase revisionf5e369d has the identical complete Git tree; its local evidence branch is retained, and the measured archive matches the fresh post-rebase pack.
- Styles archive `45d9ef785a89d23236f4b6f75772ad899436ac0bbb28c718ac9591562a16be4b` binds all23files of a new isolated packed consumer. React archiveae3cf0039dca3eea026de16b148a1e07572bcd15d66be90b1214cf2b7b987b54 and Alpine09c6351db2f7ad35dfe44e68c91e782d4f71b3e84aa0c00fa0d02a0ed8f1c0b3 remain unchanged.
- The same production public native-touch probe now passes all4cases. Dialog scrolls220px and closes through a trusted tap; Drawer/BottomSheet/table retain their passing behavior. Modal page offsets remain240px through open/scroll/close; table selection remains intact. Trusted touchmove and error-free execution are required.
- An additional public Dialog with a body action and footer passes actual Chromium tabs.setZoom at100/200/400%. CSS zoom remains1; viewport widths are1280/640/320 and heights900/450/225. Native wheel scrolling, keyboard focus to body/footer actions, viewport containment, closing and page-position preservation pass. The settled400% compositor screenshot shows the full focus ring and reachable controls. The temporary browser profile is removed after execution.

Executor Codex/gpt-5.6-terra medium, one bounded retry for insufficient initial test text and owner-scoped parity. Independent GLM review closes3criteria; the optional legacy viewport fallback nit is explicitly adjudicated in the adjacent review. No dependency, resource, threshold, permanent producer or component API change.

Raw logs and one-off probe bindings remain under controller `.batuta/runs/pr223-followup/`; adjacent index hashes them. Initial failed fixture attempts are retained: the zoom fixture lacked a favicon, and the first screenshot method did not capture the scrolled native-zoom compositor correctly. The fixture now supplies its own empty favicon, keeps console errors strict, waits for focus transitions and uses direct compositor capture. These were verification-fixture issues, not product fixes.

This record closes the demonstrated Dialog long-content defect and the stated bounded scroll/zoom cases. It does not infer physical-device, virtual-keyboard, nested-modal, anchored-scroll, complete composed-media or exact1.0candidate acceptance. CI must pass before the maintainer-authorized admin merge; Version Packages/publication are separate.
