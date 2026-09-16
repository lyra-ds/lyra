# Pill Tabs reflow and focused visibility — 2026-09-15

Long pill labels and counts now stay in their named horizontal tablist. React and Alpine keep the keyboard-focused destination visible after selection changes its typography. Scrolling is local to the list. React also reveals a focused destination when a controlled consumer declines the requested selection; Alpine checks current focus, active value, ownership and connectivity after its reactive commit.

The additive Styles change bounds the pill list and preserves its original padding and intrinsic fit for short/wide content. Line Tabs keep their existing layout. No public prop, dependency, permanent test producer, canonical stylesheet prefix, budget or acceptance pointer changes. All three changed packages have patch Changesets.

## Verification

- 18 React tests and 24 Alpine tests per engine: 126 total PASS in native Chromium, Firefox and WebKit. The nine added regression cases reuse the existing browser files: long-content widths 343/288 in both directions, plus one declined controlled React selection. They assert real panels, native focus, containment and first/middle/last visibility.
- Original CSS:4 expected failures per adapter. Original runtime with corrected CSS:4 expected failures per adapter. These 16 negative failures are retained separately; exact candidate bytes were restored afterward.
- Controller `pnpm test`, both package typechecks, stylelint and canonical parity PASS. Tracked source remained unchanged by verification.
- Packed production React consumer:84/84 observations PASS, no page errors. Exact current documentation examples for line Tabs, pill Tabs and DataTable; widths 1280/375/320, light/dark, LTR/RTL, short/long content, plus narrow long-content forced-colors cases. Native click, directional arrow, Home/End and the table's Open Orbit action work. First/middle/last pill focus is visible. Chromium LTR and WebKit RTL forced-focus screenshots were inspected.
- All 482 extracted archive files match their tarballs; 479 shipped content files also match the verified worktree (pnpm-normalized package manifests are compared to their archives). Source fallback is rejected by the packed consumer build.

## Measurement precision and limits

The browser rounds its scroll range while DOMRects remain fractional. At the actual maximum scroll, the final last-tab inset is3.578125px, despite original4px padding and a runtime4px target. The geometry test permits at most0.5CSSpx quantization; the CSS2px outline/2px offset, original padding, full label visibility and negative controls remain unchanged. This corrects an overstrict controller interpretation, not a product or budget relaxation. No claim of zero fractional-pixel clipping is made. Page-width checks retain the original 1 CSSpx layout tolerance; some WebKit long-content examples report 321px at a 320px viewport.

The 320px viewport is a reflow approximation, not an actual 400% browser zoom or 200% text-only zoom observation. Browser forced-colors emulation is not native OS high contrast. This packed scenario is React; source Alpine proof is recorded separately, and final packed Alpine runtime qualification remains to be refreshed. Full V1 media/platform/acceptance qualification is not established by this lot.

## Exact archives

- react: `f8d99e449fd5ed7e514b7e80e0b96edcd42a1d987f84d4e73fa108401fff63c9`
- alpine: `09c6351db2f7ad35dfe44e68c91e782d4f71b3e84aa0c00fa0d02a0ed8f1c0b3`
- styles: `e45ff57fd43e8bc0094c9c574e25ff5721128cd185e7a12979ae8892a8c33bf6`

Verified source snapshot: 5dabc2a. These replace the preceding exact artifact identities for subsequent qualification; historical records are not relabeled as measurements of this pair.

## Batuta trail

The preceding CSS-only attempt was aborted without integration after medium + one retry and high failure: containment passed but native focus alone did not reliably reveal the destination. The newly scoped runtime repair used Codex/Terra high + one rounding/controlled-selection retry. A separate OpenCode/GLM low correction documented only the measured test-geometry precision. Controller formatting and all proofs followed. Two GLM reviews timed out without a verdict; neither counts as approval. Independent review: GLM returned three DONE verdicts. Two low-severity findings were declined:4px is a minimum clearance rather than an exact resting position, and the4px runtime floor follows the fixed focus-outline extent. The claimed repeated correction at a larger native inset is contradicted by the zero-offset condition. Raw verdicts/findings and controller adjudication are retained.

Raw MAIN `.batuta/runs/tabs-focused-visibility-20260915/` retains briefs, executor output, snapshots, failed and final checks, geometric observations, precision adjudication, exact archives, packed build/fixtures/screenshots and review records. The rejected CSS-only attempts remain in `.batuta/runs/tabs-pill-reflow-20260915/`. No remote or release action occurred.
