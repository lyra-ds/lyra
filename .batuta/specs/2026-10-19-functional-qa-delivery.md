# Functional QA delivery contract

The maintainer approved a short public-product QA round, reproducible issues,
and small compatible corrections. The actual product fixes are #306 and #307.
Observation 308 was invalidated after effective-area hit testing and is not a
third product correction or a deferred task. No version bump/publication.

## Acceptance criteria

1. Sidebar navigation focus reaches the eligible desktop controlling trigger
   before either transition, while main-content focus, modal ownership,
   cancellation/eligibility and optional defaults remain intact. Four focused
   regressions prove red-before/green-after; native sidebar suites: 108 passes and 7 SSR passes are retained with the original persona replay.
2. Only ToastProvider docs previews use normal-flow notification layout;
   independent state, readable messages, close/Done/focus, copied examples,
   library default fixed positioning and 320px layout remain correct. The
   existing public Toast invitation example is the unwrapped default canary.
   Public visual replay and its automation intent replace a new test harness.
3. The living QA tree links personas, flows, immutable charters, current
   scenario verdicts, original dated failures and repaired-build reports.
   Two product findings are verified, one measurement is invalid; no failure,
   pending session or deferred repair is hidden as a pass. Native mobile,
   spoken assistive output and local hosting/CSP limitations stay explicit.
4. The source stays within the eight source/test/docs files plus the single
   React patch changeset established by the two bounded specs. QA bootstrap
   additionally adds two .gitignore paths for generated evidence and index. Manifests,
   dependencies, exports, styles package, CI, services and experiments do not
   change. Parent full pnpm test and recursive typecheck passed on source
   candidate 95d2831, product-identical to the delivery branch. Local lint and
   QA link/status checks must pass; remote required PR checks gate merge.

## Bounded sidebar contract (verbatim)

# Sidebar expansion focus — issue 306

The published rail can replace a focused link while expanding. BODY is not a
valid successful result. Reuse the existing visible, enabled controlling
trigger as the focus destination before either accepted desktop toggle when
focus is inside its navigation. Main-content focus stays in place. Dialog-owned
offcanvas navigation retains its modal focus ownership. No new API is needed.

This is a compatible accessibility repair, not an attempt to preserve every
child DOM identity. Current hotkey eligibility, editable-field exclusion,
preventDefault, multiple-owner arbitration, routing, controlled callbacks,
optional defaults, and disabled/hidden/inert guards remain intact.

Acceptance: a focused rail item expands to the eligible controlling trigger
for composed links and data items with and without railTooltips; the reverse
collapse and main-content case remain correct. Browser regression must fail
against the unfixed helper and pass with the repair. Update the existing focus
paragraph in both component locales. Add a React patch changeset; do not bump
versions or publish.

Fix governor: narrow (one helper, its focused tests, two locale paragraphs and
one changeset); understood (demo Tooltip/span remount plus shared collapse-only
focus guard); contained (sidebar controls and modal neighbor tests runnable);
unambiguous (the registered expected result explicitly permits the eligible
trigger, using the existing collapse policy in both directions). All pass.

## Bounded docs contract (verbatim)

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
  existing public Toast invitation and adjacent Popover are runnable canaries.
- Unambiguous: both available example actions must remain reachable; their
  state/timer semantics and actual library defaults remain unchanged.

All bounds pass. The visual replay must pass before the bug can be verified.
