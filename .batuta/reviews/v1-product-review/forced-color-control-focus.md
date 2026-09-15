# Forced-colors control focus — 2026-09-15

Button, Input, Tabs and DataTable sort controls now show a2px solid CanvasText outline with2px offset when keyboard-focused under forced-colors. The four existing shadow-only focus rules lost their shadows in Chromium/Firefox forced-color emulation. Native packed interaction confirmed focus-visible on the intended elements while outlineStyle remained none. Screenshots confirmed the missing Button indicator. WebKit's emulation retains some ordinary colors/shadows; no native OS-high-contrast claim is made.

Four additive media rules preserve canonical CSS and normal-mode appearance. Parity registration adds only the existing `lyra-input` and `lyra-table__sortbtn` classes; Button/Tabs were already registered. Styles-only patch changeset; no adapter, dependency, global selector or baseline changes.

## Verification

- Existing Styles native-browser harness:4 focused regression cases plus6 unchanged modal cases per engine,30PASS across Chromium/Firefox/WebKit. Each new test checks native Tab focus, normal shadow, unfocused outline absence, forced-color outline dimensions/color and restores media afterward. Fixture explicit tabindex0 is declared for consistent native WebKit traversal.
- Restoring original four CSS files yields4/4 expected forced-outline failures in Chromium; exact corrected bytes restored.
- Production packed P1 consumer:12 type/engine focus outcomesPASS (four controls ×three engines), with actual Tab in Chromium/Firefox and separately qualified Option+Tab in WebKit. Input is focused by keyboard-opened CreateWorkspaceDialog. No programmatic focus seeding. Original and corrected screenshots/geometry/styles retained.
- `pnpm test`, stylelint and parityPASS (211tokens/436classes). Controller applied normal Prettier formatting to the changed test. No implementation retry or escalation.
- Current Styles archive SHA256 `9803cf191f3e349c6b4880dec537f95ed02ae095254e4c74e2b515d3cfdba82a`; extracted files match. React/Alpine archives remain those of the preceding Dropdown/Popover candidate. This newer Styles hash needs binding in subsequent qualification; the previous FileUpload observation is not automatically relabeled as its exact-artifact evidence.

Batuta Codex/gpt-5.6-terra medium. A post-executor hook wrote an unrelated `.impeccable/config.json` suppression/cache in the fresh worktree. Controller preserved it in rejected raw evidence and removed the newly created directory before snapshot; no suppression or other out-of-scope config was accepted. Product diff review and all criteria were controller-verified.

## Remaining media work

The same packed two-command consumer exposes a separate CommandPalette defect: in Chromium forced colors, native ArrowDown changes aria-selected but the active and inactive rows are visually indistinguishable. This is the next bounded repair, not covered by the focus fix. Other media, actual-example reflow/zoom, composition, native OS and final acceptance obligations remain explicit; these12 outcomes do not qualify complete V1 or all forced-color cells.

Raw MAIN `.batuta/runs/forced-controls-20260915/` retains brief/executor/formatter output, rejected hook config, scoped source diff, tests/negative control/common logs, exact Styles tarball, packed focus outcomes/screenshots and verification. Initial native focus evidence is in `.batuta/runs/v1-stable-closure-20260915/p1-forced-focus*`.
