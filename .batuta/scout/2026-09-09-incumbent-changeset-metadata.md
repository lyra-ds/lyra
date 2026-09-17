# Incumbent pre1.0 changeset metadata — read-only scout

GLM5.3Flash, unchanged guards. Initial report used an incorrectly requested delimiter; conductor corrected the report contract, and the format-only retry supplies allfourmandatorysections. Not an implementation retry. All20source snapshot hashes and cited paths verified.

<<<REPORT
## Answer
One declared bump demonstrably conflicts with the 0.x convention: `.changeset/alpine-modal-return-destination.md` declares `minor` for `@lyra-ds/alpine` (0.6.0) while its stated content — "Add explicit `returnFocusTo` support for modal return-focus workflows" — is purely additive. Under the policy, `0.MINOR` = breaking and `0.x.PATCH` = additive/fix, and each package receives the smallest required bump, so the smallest correct bump for this stated content is `patch` (0.6.1), not `minor` (0.7.0, which asserts breaking). Payload-internal parity corroborates this: the equivalent React `returnFocusTo` changesets are all declared `patch`. All other 18 changesets declare `patch`, and none of their summaries states a removal or incompatible change to a declared public surface, so no patch is a demonstrable conflict.

## Files
- `.changeset/alpine-modal-return-destination.md` — the conflicting declaration (`@lyra-ds/alpine: minor`)
- Corroborating same-feature patch declarations:
  - `.changeset/bottom-sheet-return-focus.md`
  - `.changeset/command-palette-return-focus.md`
  - `.changeset/explicit-modal-return-focus.md`
  - `.changeset/modal-initial-focus-destination.md` (parallel additive option addition, declared `patch`)

## Evidence
- Policy snippets: "**`0.MINOR` (the minor segment) = breaking changes.**"; "**`0.x.PATCH` (the patch segment) = additive features or fixes**, backwards compatible within the same minor."; "Each package receives the smallest bump required by changes to its own public surface."; during 0.x, breaking changes must be filed as `minor`, never `major`.
- Conflicting changeset: declared `'@lyra-ds/alpine': minor`; summary "Add explicit `returnFocusTo` support for modal return-focus workflows." Alpine "option and data types" are declared public API (item 4), so adding an option is a backwards-compatible addition; smallest required bump = `patch`.
- Parity within the payload: React ships the same feature as `patch` — bottom-sheet-return-focus ("Add explicit `returnFocusTo` support for BottomSheet…"), command-palette-return-focus ("…CommandPalette…"), explicit-modal-return-focus ("…Dialog and Drawer…"); the analogous `initialFocusTo` option addition (modal-initial-focus-destination) is also `patch`. The Alpine `minor` is the sole outlier across all 19 changesets.
- Classification summary of all 19 changesets:
  - `minor`, additive-only content, conflict: alpine-modal-return-destination.
  - `patch`, additive, consistent: bottom-sheet-return-focus; command-palette-return-focus; modal-initial-focus-destination; dropdown-keyboard-contract (adds roving focus, typeahead, cancellable defaults); time-picker-keyboard-stops; workspace-click-cancellation; workspace-react-keyboard-cancellation; workspace-create-command (addition plus consumer selector note — see Uncertain).
  - `patch`, corrective framing (bug corrections, not inferred breaking), consistent: alpine-native-modal-tab; command-palette-pointer-origin; dialog-nested-escape; modal-escape-consumption; modal-native-tab-containment; tooltip-timing-ownership (react + styles); workspace-switcher-contrast (styles).
  - `patch`, behavior-alignment framing, consistent: workspace-alpine-selected-entry (alpine); workspace-react-selected-entry.

## Uncertain
- The `minor` changeset's summary may not enumerate everything it contains; if it silently bundles a removal or incompatible change to an Alpine behavior contract (state attributes, custom events, documented behavior), `minor` would be correct. The conflict is proven only against the stated additive content.
- Whether `returnFocusTo` alters prior implicit return-focus behavior of Alpine modals is source-dependent and unresolved here.
- `.changeset/workspace-create-command.md` (`patch`) documents a consumer selector migration (`.lyra-wssw__pop > button` → `.lyra-wssw__pop .lyra-wssw__item`). The policy lists "Internal DOM structure of components" as not public API and the `.lyra-*` class names persist, so `patch` is policy-consistent; it would become a conflict only if that direct-child selector pattern were documented public usage, which this metadata-only audit cannot verify.
- Keyboard-behavior changes (Tab containment in `alpine-native-modal-tab.md` and `modal-native-tab-containment.md`, the selected-entry changes, Dropdown cancellable defaults): whether React/Alpine keyboard behavior is a documented public behavior contract is source-dependent. This audit cannot establish that keyboard behavior is never a public contract, nor that these patches are breaking; their contract status stays unclassified.
REPORT>>>

## Controller adjudication

Accepted the single Alpine additive metadata correction. Prior verified Task30 design separates compatible explicit target addition from repair of invalid captured targets; no source option removal or required consumer migration was introduced. Retain the other18patch records. The scout correctly limits metadata-only claims about behavior/DOM contract status; existing owner verification/designs establish these as repairs to normative incumbent behavior. No blanket claim that keyboard behavior is outside the public contract. Do not predict final published numbers from this single patch: the eventual release plan combines all changesets and deliberate1.0 intent.
