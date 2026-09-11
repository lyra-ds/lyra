# Dialog focus in forced colors

The Dialog close button now has a 2px CanvasText outline with a 2px offset under `forced-colors: active`. The normal focus shadow, 44px target and original handoff CSS remain unchanged. The rule lives in the existing additive region of `packages/styles/components/feedback/feedback.css`; no JavaScript, dependencies, manifests or parity exceptions changed.

## Verification

The same committed packed-profile runner (`ab3b9cf`) ran against old and new Styles tarballs with the identical React tarball. Old Styles: 16/18 PASS, with the actual keyboard focus indicator missing in Chromium and Firefox. New Styles: 18/18 PASS across Chromium, Firefox and WebKit in 24.64 seconds. Each engine ran axe light/dark, forced colors, reduced motion, LTR and RTL. Source regression: both normal-mode and forced-colors tests pass in all three engines (6/6). Parity, targeted stylelint, formatting and diff checks pass.

The tarball comparison finds exactly one changed file: feedback.css, 20498→20938 raw bytes including comments. Every other Styles packed file and all React outputs are identical. New Styles SHA256: 3ab24cd7af1d955093f759ec648cb108ddf0bd62619cb725b7b8d5cf2c7ab9be. The emitted/minified/compressed CSS impact is measured separately; 440 raw source bytes is not a compressed page-payload claim.

The native focused screenshot was inspected after Tab navigation: the close glyph has a visible system-color outline. The canonical report preserves computed focus values and artifact/source/lock identities. Own browsers, preview, consumers and stores were removed. Browser media emulation on macOS is not OS-level high-contrast or a new Linux qualification.

## Routing and limits

GLM low 79.45 seconds plus one 170.81-second retry. Initial source tests measured transient entrance geometry and assumed ordinary-button Tab stops on WebKit. The retry waits for natural owned animation completion and opts the CSS fixture buttons into keyboard navigation, preserving strict assertions. The actual packed React component test is independent of that static CSS fixture. The retry briefly duplicated the CSS rule, then removed the duplicate; final CSS is byte-identical to the tested tarball.

Independent Codex/Terra medium review: 45.89 seconds, 3 DONE, no findings, unchanged tracked/new-file/status guard; Batuta verifier PASS. This closes the discovered Dialog CSS defect and this bounded host profile slice. Coarse pointer, remaining P1 components, final Linux/artifact ledger and historical bundle/runtime decisions remain open. No V1 stable, Alpine-wide profile or release claim.

Raw evidence: MAIN `.batuta/runs/v1-focus-closure/dialog-forced-colors-*`, `dialog-profiles-reviewed-old/` and `dialog-focus-visual/`. Old failures are retained as regression evidence.
