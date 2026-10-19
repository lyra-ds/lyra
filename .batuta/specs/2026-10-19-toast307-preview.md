# Notification preview coexistence — issue 307

The ToastProvider documentation page presents two independently scoped examples
in one document. Each provider correctly uses the default fixed viewport stack;
the same anchor causes one example to cover the other's text and close control.
The fix belongs to documentation preview presentation, not the library API.

## Contract

Keep both providers independent, their original copied source unchanged, and all
library defaults untouched. Scope a normal-flow notification presentation to
ToastProvider previews through docs-owned markup and .lw-* styles. No global
ToastStack selector, public positioning prop, shared state, arbitrary vertical
offsets, iframe infrastructure, dependency or CI workflow change.

Explain the preview-local presentation and real consumer default in both locale
pages. The existing public Toast page's “Send an invite” stack remains an unwrapped
consumer example and must retain viewport-fixed placement. The originally
assumed /example-preview/toast-provider/basic route is not exported (only the
ThemeProvider isolated documents are generated); do not create a new route to
satisfy that mistaken planning assumption.

## Proof

The original production walk and one clean retry already prove the failure:
Publish project, Add reminder, then the confirmation close button is blocked.
After repair, repeat both real UI actions with normal pointer clicks; independently
reread each named region and dismiss each without removing the other. Repeat
Done, focus return, and narrow/mobile layout. Check the existing public Toast invitation stack
remains fixed and an adjacent documentation example remains unchanged.

This is a reversible, visual-only docs composition change. Existing docs Node
assertions cannot prove browser pointer reachability. Follow the documented
visual replay exception: preserve exact before/after public UI evidence and a
linked automation-backlog intent. Do not add a browser test project, static
server framework, source-mirroring test or CI change for this bounded repair.

## Fix governor

- Narrow: docs preview composition, scoped CSS, two explanatory locale paragraphs.
- Understood: actual public stack bounds overlap; both unisolated providers use
  the same default viewport anchor. IsolatedPreview currently measures content
  at fixed 1200px width; a fixed toast contributes no layout height, so merely
  toggling its isolation flag does not provide a suitable bounded correction.
- Contained: only this page's two preview wrappers receive the override; the
  standalone consumer and adjacent example are runnable public canaries.
- Unambiguous: both available example actions must remain reachable; their
  state/timer semantics and actual library defaults remain unchanged.

All bounds pass. The visual replay must pass before the bug can be verified.
