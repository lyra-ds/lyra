# CommandPalette backdrop gesture verification

Date: 2026-09-08. Implementation: `a98a953`. Base: `8cc15b5`, branch `feat/v1-incumbent-stabilization`.
Batuta frontend/medium, Codex `gpt-5.6-terra`; one fixture retry, no escalation.
Controller verdict: approved. Independent OpenCode `opencode/glm-5.3-flash`
review: 3/3 DONE, exit 0, unchanged status/diff/scoped-file hash guard; Batuta
verifier PASS. Documentation and commits are local; no release qualification.

## Behavior and scope

CommandPalette now requests backdrop dismissal only when mouse press and release
both occur on the backdrop, with gesture state consumed after the click. Dragging
from the search field to the backdrop, or the reverse, preserves the open palette
and query. Genuine backdrop clicks, Escape and selecting a command still close.
The runtime change is confined to CommandPaletteRoot: two refs and the existing
overlay handlers. No new dependency, public API, markup, styles or framework.
The accompanying React patch changeset does not bump or publish a version.

The existing return-focus test now explicitly focuses its opener before Enter
activation. Exact opener-precondition and restoration assertions remain. This
verifies a prepared keyboard invocation; it does not claim that unprepared mouse
consumers meet the remaining V1 focus contract.

## Controller evidence

Existing pinned Node24.18.0 and installed local dependencies were used directly
through their CLI entrypoints. No pnpm/install command or resource change.
Proof artifacts are retained at `.batuta/runs/v1-command-palette-pointer/`.

1. Native regression: original-source `red.json` exits1 with four expected
   failures among12 scenarios: both cross-boundary directions in Chromium and
   WebKit incorrectly call onClose once. The eight control scenarios pass.
   Current `green.json` and `trusted-green.log` pass12/12, including exact callback
   count, query preservation and trusted native mouse traces. Browser engines:
   Chromium151.0.7922.34 and WebKit26.5 on macOS. Owned browser/server closed.
2. Colocated regression: controller temporarily restored the byte-identical
   original runtime, ran Vitest Chromium with `-t 'cross|gesture|backdrop'`, and
   observed the new test fail at the unexpected onClose call (exit1, one failed,
   one passed, fourteen excluded by the filter). Fixed bytes were restored in
   finally. This injection followed implementation; the independent native RED
   preceded implementation. Final unfiltered runs have no excluded tests.
3. Final scoped Vitest: `run --project 'browser (chromium)' --project ssr
   src/command-palette/` passes20 (16 browser +4 SSR); separate `run --project
   'browser (webkit)' src/command-palette/` passes16. Logs:
   `retry-chromium-ssr.log`, `retry-webkit.log`, exits0 in `retry-checks.json`.
4. TypeScript `--noEmit`, scoped ESLint and Prettier all exit0 (`checks.json`).
   Fixture retry replaces only Tab with explicit opener.focus(); both engines
   and formatting were rechecked. `git diff --check` passes. No test suppression,
   weakened equality, new skip marker, snapshot adjustment or mock of runtime.
5. Product scope is exactly the component, its browser test and
   `.changeset/command-palette-pointer-origin.md`; WORK.md and .batuta records
   are controller-owned managed state. No manifest/lockfile/dependency change.

Original runtime SHA256:
`1e2bf1f8dc2ca3aa38b2298da18a0d8d7b55eb08b71ddf7738da06b557fb81fd`.
Verified current runtime SHA256:
`4378d7213c0b02182cd9f40e80bf0fd78aafc2d5af0a0fd704ef29dee13963d2`.

## Baseline failures and retry

The initial combined baseline run reported a Chromium tracing.stopChunk stream
error and the known WebKit unprepared-opener equality failure. A separate original
Chromium/SSR rerun passed19. First implementation verification passed native12,
Chromium/SSR20, types/lint/format, but WebKit15/16 because Tab did not focus the
opener. The one delegated retry changed only explicit fixture preparation;
WebKit then passed16/16 with strict assertions intact. No product workaround.

## Independent review disposition

The full review and before/after guard are retained in the main checkout under
`.batuta/runs/2026-09-08-command-palette-pointer-review/`. Findings were saved
verbatim in `.batuta/runs/2026-09-08-command-palette-pointer.review.md`.
Declined low finding WORK.md:17: Batuta explicitly treats controller-managed
WORK.md/.batuta state as exempt from product scope; this controller claims and
reviews that line. No unresolved product finding. The reviewer is corroboration;
all proof commands and the approval verdict belong to the controller.

## Remaining boundaries

No Colima operation or configuration change, foreign service cleanup, dependency
installation, experiment integration, push, PR, merge, versioning or publication.
Full packed Firefox/Linux release qualification, remaining modal/P1 gaps and
release evidence binding remain open. All11P1 ledger entries and23acceptance
cells retain their prior status. This bounded fix is not V1 qualification.
