# React BottomSheet P1 packed review

**Status:** product failure observed — 16/18 expected passing profiles passed; Chromium and Firefox
forced-colors profiles failed. This is a React 19 packed BottomSheet six-profile browser-media
emulation slice only. It makes no claim about OS high contrast, physical touch, hydration, Linux,
Windows, release readiness, or other V1 components.

## Identity-bound evidence

The two controller reports are distinct, immutable evidence; neither is reused as evidence for a
future runner source. Both bind to
`candidate-stage.json` (SHA-256 `4acbd6feed92fb07f643a52f7126253f06163e46669adc5eadf058e27aa5647e`),
whose head is `4ac1d94cee19557368c29fbef70e34942895ed61`, built from original stage head
`f00caac1b3391a229f9b714565c98ad87a83f9d2`. The candidate and original stages remain unchanged.

| Identity | Value |
| --- | --- |
| React product tree | `f34b5f2e73dbcddbb652975361c510bb2f694460` |
| Styles product tree | `fc976eaaa89989de9a455f05b879a56b7cebee8d` |
| Root lock SHA-256 | `33e367f83f485e9235c99698fa43acb75f41c7b1ff715411c64d09c42754db4a` |
| React 19 fixture lock SHA-256 | `198b207e9e1645b2f5d72cd795c8825c889296e2a5697b34f26a98993526c563` |
| Packed React (`0.5.0`) SHA-256 | `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da` |
| Packed Styles (`0.5.0`) SHA-256 | `fbe39e8f0ac94f71df91cf60923e158cd5e69d10652a9b7148d4f4fa517ce05c` |

The positive report is
`/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-20260913/controller-bottom-sheet-positive/report.json`
(SHA-256 `73d8577a03771a25d00b30cc7e0b258e15a9c5ea716b7d905b8f6f958d939451`).
It records the executed runner source hashes: `dialog.mjs`
`19ba692f5f5f92012aaed094e26127781626d2b10be5a34f3ca5087e965c8822`,
`bottom-sheet.mjs` `e9470e1f2d5ac06afb9c0557bb9b6fbf2d06a05daea02094d880f18b7c5ba745`,
and fixture `705bf9f0ab334535274d316b8fc9a6cc0d85b6a519d5dbb77f86177e0f5c1681`.

The negative report is
`/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-20260913/controller-bottom-sheet-negative/report.json`
(SHA-256 `65e35d11873b1e95eeaa5016337ef2db2d931a3424a878b993eaa1bc3dd0c77a`).
It uses the same runner and packed identities, with only the deliberate fixture mutation
(`7414faa56fcd3020c338f7fa7b89115d34c1c7277f4598649ca1dda1e9cd0249`).

The current `dialog.mjs` SHA-256 is `56c33b409951aa1849ef3c23a789d71ed6cde1c7fd14276e93c8cd69b7146092`
after the required Prettier-only follow-up. It was not profile-executed here; the controller must
bind any fresh rerun to its own new source identity. This preserves the actual report binding
instead of implying that its former runner hash covers a formatting successor.

## Actual positive run

The controller ran all 18 cases with React 19.2.8, Vite 8.2.1, Node 24.18.0, Playwright 1.62.1,
and axe-core 4.13.0 on Darwin 25.6.0 arm64. Chromium 151.0.7922.34, Firefox 153.0, and WebKit
26.5 were the recorded browser versions. Browser contexts, preview process, and temporary root
all report owned cleanup closed.

| Engine | axe-light | axe-dark | forced-colors | reduced-motion | ltr | rtl |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium | PASS | PASS | **FAIL** | PASS | PASS | PASS |
| Firefox | PASS | PASS | **FAIL** | PASS | PASS | PASS |
| WebKit | PASS | PASS | PASS | PASS | PASS | PASS |

All named cases are therefore recorded: `chromium-axe-light`, `chromium-axe-dark`,
`chromium-forced-colors`, `chromium-reduced-motion`, `chromium-ltr`, `chromium-rtl`,
`firefox-axe-light`, `firefox-axe-dark`, `firefox-forced-colors`, `firefox-reduced-motion`,
`firefox-ltr`, `firefox-rtl`, `webkit-axe-light`, `webkit-axe-dark`, `webkit-forced-colors`,
`webkit-reduced-motion`, `webkit-ltr`, and `webkit-rtl`.

BottomSheet-specific observations passed where applicable: the packed public
`@lyra-ds/react/bottom-sheet` export rendered a bottom-attached panel, the close control measured
44 × 44 px, and no public handle contract was invented. The fixture also exercised controlled
open/close, initial and return focus, dialog name/description, Escape, labelled controls, and the
footer callback. Screenshots are named per case in the report.

Both failed forced-colors cases reached the shared native keyboard boundary check. The Close
control had `:focus-visible` true but computed `outline-style: none` and `box-shadow: none`; the
runner therefore correctly reported `Forced-colors focus indicator is not perceivable after native
keyboard focus`. These remain product failures, not unavailable evidence or weakened assertions.

## Executed reversible negative control

The controller saved fixture SHA-256
`705bf9f0ab334535274d316b8fc9a6cc0d85b6a519d5dbb77f86177e0f5c1681`, changed exactly
`setCommitted('Preferences saved')` to `setCommitted('Negative control committed')`, and ran a
fresh Chromium-only output. It exited 1: `chromium-axe-light` and `chromium-axe-dark` changed from
PASS to FAIL with `Footer action did not commit visible output`; existing `chromium-forced-colors`
remained FAIL; reduced-motion, ltr, and rtl remained PASS. The fixture was restored byte-exact to
SHA-256 `705bf9f0ab334535274d316b8fc9a6cc0d85b6a519d5dbb77f86177e0f5c1681`.

For a repeat, copy the fixture to a fresh owned temporary backup, record its SHA-256, make only
that exact substitution, invoke `bottom-sheet.mjs` with the same tarballs and identity stage,
`--browser chromium`, and a never-before-used `executor-*` output path, then restore the backup
and require the original SHA-256 before any independent attempt. This alters fixture bytes only:
it introduces no production branch, post-render repair, fake failure, or report reuse.

## Finding and separate repair proposal

**Trigger:** native keyboard focus reaches BottomSheet Close under active forced colors in Chromium
or Firefox. **Expected:** a perceivable focus indicator. **Observed:** `:focus-visible` is true,
but the inherited shadow is suppressed and the current forced-colors selector omits
`.lyra-bottomsheet__close:focus-visible`. **Narrow owner:** Styles feedback primitives.

Propose a separate, bounded repair task for
`packages/styles/components/feedback/feedback.css`: extend the existing forced-colors close-focus
selector at lines 621–626 to include `.lyra-bottomsheet__close:focus-visible` and retain its
system-color outline treatment. This review makes no product or style edit and does not authorize
that repair.

No release, physical-device, hydration, Linux/Windows, all-V1, or OS high-contrast conclusion is
made. The controller owns the fresh restored BottomSheet rerun and Dialog/Drawer regression runs
after this formatting-only correction.

## Final controller verification

The formatted/restored source was rerun with a fresh `final-candidate-stage.json` at worktree commitfb028f5. BottomSheet remains16/18 PASS: only Chromium/Firefox forced-colors close focus FAIL, exit1. Dialog18/18 and Drawer18/18 PASS, each exit0. All54 named cases are present once, every report source SHA matches final source, and all contexts/browsers/preview processes/temporary roots closed. The earlier failed product results and negative-control report remain immutable.

- bottom-sheet: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-20260913/controller-final-bottom-sheet/report.json` SHA256 `59ab6d51e685da90617660020b1d7185e460737e6b9ba5f524501073183e599e`.
- dialog: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-20260913/controller-final-dialog/report.json` SHA256 `adc4c27354f2354fd5dcdae2aad60d12efda01fa6afec8bdc3405e94c5707c41`.
- drawer: `/Volumes/Home/francisross/Projects/lyra/lyra/.batuta/runs/v1-bottom-sheet-20260913/controller-final-drawer/report.json` SHA256 `9e508ecfca83c9fe330827de5ac4f691b4916b3c2e6e00ffe6af553ad4dbca50`.

Controller `pnpm test` exited0 in163.56s before the formatting-only correction; no semantic code changed afterward. Final source syntax and scoped Prettier PASS. CLI negative probes reject missing identity and a mismatched tarball hash before output creation. GLM independent review4/4DONE; its pending final-source binding/regression note is satisfied by the three fresh runs above. One Terra retry corrected formatting and documented the controller-found product defect; initial executor raw-output permissions were resolved through authorized controller execution, not by altering the output contract. No product repair was performed.

This completes the approved producer/review slice, not BottomSheet profile qualification. The separate proposed repair remains limited to the existing forced-colors focus rule in `packages/styles/components/feedback/feedback.css`, preserving the established outline treatment and all existing Dialog/Drawer selectors. Its acceptance requires fresh Styles packaging, BottomSheet18/18, Dialog/Drawer18/18, stylelint/parity and the full common gate. It is not approved by completion of this review.
