<<<FINDINGS
apps/docs/content/docs/en/components/bottom-sheet.mdx:169: medium: close button is icon-only with no accessible name — `lyraBottomSheet` `x-bind="close"` supplies only type/button+click (packages/alpine/src/bottom-sheet.ts:200-205, no aria-label unlike dialog.ts:221-227/drawer.ts:202-208), and the example dropped the old static `aria-label="Close"`, contradicting the same page's a11y contract "close button defaults to accessible name Close" (bottom-sheet.mdx:45-46). Fix: add static `aria-label="Close"` to the served close button in both locale snippets.
apps/docs/content/docs/pt-BR/components/bottom-sheet.mdx:170: medium: same unnamed close button in pt-BR path. Fix: same static `aria-label="Close"`.
FINDINGS>>>

Controller adjudication: accept bothlocale BottomSheet missing meaningful Close label; glyph× is technically a computed name, but not the required descriptive close name. Also controller found Dialog/Drawer footer visibleDone overridden by fixed close-binding aria-labelClose, violating label-in-name; make visible label Close. No runtime fixes needed. Medium initial+retry consumed; escalate six-file label completion to CodexTerra/high. Priorreview3DONE/guardunchanged is retained, but accepted findings mean delivery not approved yet.

## Bounded final review
<<<FINDINGS
FINDINGS>>>

Final3/3DONE, unchangedguard, verifierPASS. Empty findings block retained verbatim; no new finding returned. Accepted labels resolved by six-line high completion, native12/12 from3/12; current48focusallPASS. Controller approves finaldelivery.
