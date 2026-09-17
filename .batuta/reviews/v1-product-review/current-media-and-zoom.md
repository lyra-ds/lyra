# Current media screening and native Chromium zoom — 2026-09-16

Verification-only progress at `7b7fd96`; no product code or permanent tests/producers changed.

## Existing P1 screening

The existing temporary public-component consumer and runner pass **195 interactions and 66 axe observations** across Chromium, Firefox and WebKit: light/dark, forced-colors, reduced-motion, RTL and coarse-pointer profiles. Coarse activation uses native Playwright tap, not mouse click. This refreshes the old screening with the final Styles and unchanged React runtime. No page errors or axe violations were reported. The 18 profiles remain screening slices, not complete family or physical-device qualification.

## Native page zoom

The existing long-content Tabs/DataTable consumer passes **12 observations**: Chromium 151.0.7922.34 at 100%, 200% and 400%, LTR/RTL and light/dark. Native `chrome.tabs.setZoom` runs inside an isolated disposable browser profile, using the [documented browser API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-setZoom). No extension is installed into the user's browser. The temporary profile is removed after every run. Native UI control was unavailable (`CUA_REPL_ENABLED_SURFACES` missing), so no claim is made about operating the user's browser UI.

Zoom is verified through the browser's getZoom result and actual layout: 1280/640/320 CSS-pixel widths, devicePixelRatio 1/2/4, CSS zoom unchanged at 1. This is browser page zoom, not viewport-only resizing, CSS zoom or CDP pinch scaling. Each observation proves page containment within the existing 1 CSSpx tolerance, native End-key selection/panel activation, focus clearance within the already documented 0.5 CSSpx scroll-quantization tolerance, and the real DataTable Open Orbit action.

The initial exact float comparison rejected 3.9999999999999996 versus 4; only numerical comparison precision was corrected to 1e-10. The original output is retained. Full-page screenshot capture under native zoom produced unusable blank images; those are retained and excluded from visual proof. Viewport captures were taken instead. The controller inspected LTR/light, RTL/dark and focused RTL/dark 400% captures. They show enlarged, wrapped line labels and the selected pill. Screenshots are bounded viewport observations, not a full-page or all-state visual certification.

## Exact binding and limits

All 482 physical installed package files match the retained React `f8d99e…`, Alpine `09c635…`, Styles `e45ff…` archives. The approved cap's fresh React `36ccce5f…` differs only in its manifest, as proved by the preceding artifact binding; all 479 non-manifest shipped files are identical. Results retain the original runtime archive identities and explicitly reuse them through that byte proof.

This adds actual Chromium 200/400% page zoom. The governing interaction specification requires 200% text enlargement but does not prescribe a text-only browser mode. [W3C technique G142](https://www.w3.org/WAI/WCAG22/Techniques/general/G142) accepts browser page zoom as a resize-text technique. These observations therefore contribute resize-text evidence for the tested fixtures; a separate text-only-mode test is not an additional gate. This does not establish all content/state coverage, Firefox/WebKit native zoom, physical touch devices, OS high-contrast settings or all composed media contracts. Applicable touch scrolling/outside dismissal and final requirement mapping remain open. Manual-AT deferrals do not silently waive those requirements.

Raw controller `.batuta/runs/final-media-screening-20260916/`: 18-profile JSON/log, 12-case zoom JSON, exact temporary runners, scoped extension source, screenshots, initial failures, profile cleanup and artifact binding verdict. No browser settings, system service, dependency or canonical evidence pointer was changed.
