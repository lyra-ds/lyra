# Lyra V1 Overlay Foundation Evaluation Design

**Status:** Approved

**Date:** 2026-08-31

**Owner:** Lyra maintainers

**Scope:** Evidence harness and decision process for the incumbent Lyra
implementation, Radix, Base UI, and the active Zag.js direction across
`OF-MODAL`, `OF-ANCHORED`, `OF-MENU`, `OF-TOOLTIP`, and `OF-COMPOSED`.

## Decision summary

Lyra will evaluate all four foundations through one repository-owned harness
before selecting or retaining a production foundation. The harness will expose
the same Lyra-owned fixture boundary to every candidate, execute the same
contract scenarios, and produce machine-validated evidence tied to exact
candidate artifacts and the exact Lyra revision.

Execution is staged by contract wave for diagnosis and review:

1. shared preflight and `OF-MODAL`;
2. `OF-ANCHORED`, `OF-MENU`, and `OF-TOOLTIP`;
3. `OF-COMPOSED` and the nine-component mapping; and
4. packaging, bundle, runtime, security, and consolidated ADR evidence.

Staging does not permit early selection. Every candidate must receive a
disposition for every required contract and acceptance cell. A hard failure
may reject a candidate, but its remaining runnable scenarios still execute so
the ADR preserves comparable diagnostic evidence.

The harness reports facts; it does not choose a winner. The final ADR may
retain the incumbent and requires a separate maintainer approval before any
production dependency or overlay implementation is authorized.

## Governing contracts

This design implements the evaluation gate in the approved
[overlay-family specification](./2026-08-30-overlay-family-design.md) and is
subordinate to the approved
[deliberate V1 release design](./2026-08-30-lyra-v1-deliberate-release-design.md).
The following sources remain normative:

- [Interaction and accessibility](./lyra-v1/03-interaction-accessibility.md)
- [Component architecture](./lyra-v1/04-component-architecture.md)
- [Quality and performance](./lyra-v1/05-quality-performance.md)
- [Overlay foundation ADR template](../templates/overlay-foundation-adr.md)
- [Machine-readable V1 ledger](../baselines/lyra-v1/program.json)

Candidate behavior is evaluated against Lyra contracts, not vendor examples.
The incumbent receives no compatibility exception. A vendor receives no
credit for behavior that requires a vendor type, selector, part, attribute, or
event to become public Lyra API.

## Scope and non-goals

The evaluation includes:

- all four named candidates;
- all five overlay contract IDs and all nine mapped components;
- Chromium, Firefox, WebKit, React 18, React 19, SSR, hydration, keyboard,
  focus, axe light/dark, forced colors, reduced motion, LTR, RTL, and coarse
  pointer;
- packed ESM, CommonJS, declarations, Vite, Next.js, and CommonJS consumers;
- standalone and representative-composition bundle measurements;
- production-artifact runtime responsiveness;
- candidate security and license inventory;
- public API isolation and removed-code accounting; and
- a generated evidence summary that fills the tracked ADR without inventing a
  decision.

This phase does not:

- modify a production component, export, style, Alpine registration, or
  runtime dependency;
- add a candidate to the root workspace lockfile;
- approve compatibility ranges, migrations, deprecations, or package majors;
- mark any component `implementing` or `qualified`;
- raise a bundle or performance budget;
- dispatch a remote workflow, deploy, publish, tag, or release; or
- merge the eventual ADR or implementation without a separate operator
  checkpoint.

## Repository boundaries

Evaluation code lives under `tools/overlay-foundation-evaluation/`. It is not
exported by Styles, React, or Alpine and is excluded from package tarballs.
The implementation plan will keep responsibilities separate:

- `contracts/` owns repository-authored scenario definitions and expected
  observable outcomes;
- `candidates/` owns experimental adapters for `incumbent`, `radix`,
  `base-ui`, and `zag`;
- `fixtures/` owns browser and consumer applications that depend only on the
  shared harness boundary;
- `runner/` owns preflight, execution, first-attempt preservation, and result
  aggregation;
- `evidence/` owns schema validation, checksums, archive creation, and ADR
  rendering; and
- `scripts/` exposes strict local and CI entry points.

No adapter may import another adapter. Scenario definitions may not branch on
candidate identity. Candidate-specific code is limited to translating the
shared fixture request into the candidate's private implementation and
normalizing private observations into the common evidence schema.

## Candidate manifest and isolated installation

A tracked `candidates.json` is the source of candidate identity. Each record
must contain:

- candidate ID exactly `incumbent`, `radix`, `base-ui`, or `zag`;
- exact package names and exact versions, with no range or tag;
- registry tarball URL and SHA-256 for each external artifact;
- license identifier and repository URL;
- the adapter entry path; and
- the applicable contract IDs.

The incumbent record binds to the current Lyra revision and packed package
SHA-256 values rather than a registry dependency.

Each external candidate installs into a unique directory below the
command-scoped `TMPDIR` with its own manifest and lockfile. Installation uses
the pinned Node and pnpm versions, disables dependency lifecycle scripts, and
must not read or write the repository workspace lockfile. The generated
fixture lockfile, pnpm metadata, audit output, license inventory, and installed
artifact checksums become evidence.

The preflight fails before browser execution when a version is not exact, an
artifact checksum differs, a lifecycle script would be required, a governed
high or critical advisory exists, a license is absent or incompatible, an
adapter claims an unsupported contract, or the repository worktree changes.

## Shared fixture protocol

Every scenario is a data record with:

- stable `contractId` and `scenarioId`;
- component mapping;
- initial semantic markup and state;
- ordered user operations;
- expected roles, relationships, state transitions, focus outcomes, events,
  announcements, and cleanup;
- required environment cells; and
- artifact capture policy.

The candidate adapter receives the record and returns only a fixture handle
with Lyra-owned operations such as `open`, `close`, `press`, `point`,
`setDirection`, `setMotionPreference`, `updateContent`, and `destroy`.
Assertions inspect rendered semantics, focus, events, accessibility snapshots,
and resource ownership through repository-owned helpers. Vendor nodes and
attributes may be observed for diagnostics but cannot be assertion selectors
or public contract outputs.

Scenario IDs are immutable once evidence exists. A changed expectation creates
a new scenario revision and invalidates prior evidence for that scenario.

## Contract waves

### Wave 1: shared preflight and modal

`OF-MODAL` covers Dialog, Drawer, BottomSheet, modal CommandPalette, and
CreateWorkspaceDialog. Scenarios include initial focus, ordinary and
destructive content, invalid and dynamically changing content, zero tabbables,
nested modals, inert background, topmost Escape, full pointer-origin outside
dismissal, controlled close, scroll-lock reference counting, exit teardown,
reopen during exit, connected and removed openers, logical successors, and
operation-scoped creation cancellation.

### Wave 2: anchored, menu, and tooltip

`OF-ANCHORED` covers trigger relationships, preferred placement, flip, shift,
available-size constraints, scroll/resize/content updates, nested child
interaction, outside-pointer origin, topmost Escape, portal context, direction,
trigger removal, and teardown.

`OF-MENU` covers every trigger key, Arrow/Home/End wrapping, disabled discovery
without activation, typeahead and repeated-character cycling, cancelable
selection, Tab exit, Escape restoration, and applicable submenu/check/radio
semantics.

`OF-TOOLTIP` covers focus and hover ownership, 500 ms initial delay, 0 ms warm
delay, 300 ms warm grace, 100 ms pointer-transition grace, pointer transit,
Escape without focus movement, stable description, coarse pointer alternatives,
trigger removal, and teardown.

### Wave 3: composed overlays

`OF-COMPOSED` reuses the lower-level scenario records rather than copying
them. It adds CommandPalette combobox/listbox search and selection,
WorkspaceSwitcher listbox selection, and CreateWorkspaceDialog validation,
submission, cancellation, stale-result suppression, and result commitment.

The wave also maps the shared results back to Dialog, Drawer, BottomSheet,
Popover, Dropdown, Tooltip, CommandPalette, WorkspaceSwitcher, and
CreateWorkspaceDialog. CreateWorkspaceDialog remains unsupported in Alpine;
the harness records that current support boundary without treating it as an
automated pass or silently adding a registration.

## Environment matrix

Browser execution uses the repository's digest-pinned Playwright 1.62.1 image
and exact Chromium, Firefox, and WebKit payloads. Host-browser substitutions do
not satisfy final evidence. React 18 and React 19 run through the existing
compatibility-fixture pattern with packed Lyra and candidate artifacts.

Every contract receives independent results for all 23 cells in the ledger's
`v1-interactive` profile. One result cannot stand in for another. In
particular, browser success does not imply keyboard, axe, direction, forced
colors, reduced motion, or coarse-pointer success.

Manual Windows/NVDA and macOS/VoiceOver records remain
`deferred-by-release-profile` under Automated Core. They are never generated
as `PASS` and do not replace required automated results.

## Packaging, bundle, and runtime evidence

Candidate adapters are built into packed experimental fixtures, not linked
from workspace source. ESM, CommonJS, declarations, Vite, Next.js, and CommonJS
consumer checks use the exact tarballs whose hashes appear in the run manifest.
Declaration scanning rejects vendor-owned public types. DOM and documentation
scans reject vendor-required public selectors, parts, and attributes.

Standalone entries are measured per affected component. Composition scenarios
cover at least modal nesting, anchored menu plus tooltip, and the composed
application shell. All candidates use the same externals, production defines,
minifier, tree-shaking, and quality-11 Brotli protocol.

The default maximum increase remains 1,500 decimal Brotli bytes for a simple
primitive and 3,000 decimal Brotli bytes for a complex component or
representative composition. The final comparison includes the bytes of
superseded incumbent ownership that the candidate would remove. A candidate
cannot pass by measuring both old and replacement infrastructure or by
excluding required adapter code.

Runtime measurements use production artifacts, pinned Chromium, fixed
viewport and device profiles, controlled CPU/network conditions, warm-up, and
at least 30 recorded iterations per operation. Raw iterations, traces, event-
to-next-paint boundaries, long tasks, node counts, median, P95, and worst value
are preserved. The harness reports measurements against approved thresholds;
it does not rewrite thresholds from observed results.

## Evidence model

Each run produces one canonical manifest with:

- schema version and run ID;
- full Lyra revision and clean-worktree proof;
- candidate ID, exact versions, artifact checksums, lockfile checksum, license,
  and audit summary;
- operating system, architecture, Node, pnpm, Playwright, browser, React,
  bundler, minifier, Brotli, and axe versions;
- contract/scenario/cell records with expected and observed results;
- result exactly `PASS`, `FAIL`, or `unavailable`;
- first-attempt artifact paths and any later diagnostic attempt paths;
- packed consumer, bundle, runtime, declaration, DOM, and removal-accounting
  records; and
- SHA-256 for every member in the evidence archive.

The archive is deterministic, path-safe, size-limited, and validated after it
is written. Summary Markdown is derived only from the validated archive. A
summary cannot upgrade, omit, merge, or reinterpret records.

Local evidence is diagnostic. Final ADR evidence must come from an immutable
CI run on the exact candidate revision, with the workflow run, artifact ID,
archive SHA-256, and retained raw artifacts recorded in the ADR.

## Failure handling and retries

The runner classifies failures as `product`, `fixture`, `infrastructure`,
`security`, `packaging`, `measurement`, or `policy`. Unknown classifications
fail closed. A required `FAIL` or `unavailable` blocks candidate acceptance.

The first attempt is immutable. A retry creates a new attempt record and may
add diagnostics, but it cannot replace the first result or turn a product
failure into a pass. Confirmed nondeterminism records both byte sets and blocks
the affected measurement until its cause is fixed.

The runner continues independent scenarios after a candidate failure whenever
the environment remains trustworthy. It stops that candidate immediately for
checksum mismatch, unsafe installation, corrupted harness state, or evidence
write failure. Cleanup removes only the unique temporary roots owned by the
current run and never deletes preserved evidence.

## Decision protocol

There is no weighted score and no automatic winner. Evaluation proceeds in
this order:

1. reject candidates with a hard contract, accessibility, browser,
   SSR/hydration, security, packaging, public-leak, or unapproved budget
   failure;
2. compare surviving candidates on complete contract coverage, production
   ownership removed, bundle/runtime impact, public API isolation, migration
   impact, and operational risk;
3. render all results into the overlay foundation ADR template; and
4. stop for explicit maintainer approval of the selected candidate, exact
   version, evidence archive, exceptions, and replacement scope.

Popularity, familiarity, implementation effort, and a vendor's documentation
claims are not decision evidence. The incumbent is retained when no external
candidate demonstrates an approved contract or quality advantage sufficient
to justify its migration cost and risk.

## Automation and operator checkpoints

The implementation plans will expose strict commands for manifest validation,
focused wave execution, full local execution, archive validation, and ADR
rendering. Focused commands exist for development; only the full matrix may
support a decision.

The eventual remote workflow is manually dispatched against an exact commit
and candidate manifest after an operator checkpoint. It installs candidates in
isolated fixtures, runs every lane, uploads the archive even on failure,
publishes a non-authoritative summary, and fails closed after artifact upload.
It cannot commit, merge, deploy, publish packages, push tags, or create a
release.

Separate explicit approval is required for:

- adding exact external artifacts to the evaluation manifest;
- dispatching the immutable CI evaluation;
- accepting the ADR;
- starting a production overlay implementation plan;
- pushing or merging any implementation branch; and
- publishing any package, tag, or release.

## Delivery decomposition

The evaluation is implemented through five sequential plans. Each plan has its
own tests, review, CI, and merge checkpoint:

1. **Core protocol and isolation:** candidate-manifest validation, exact
   artifact acquisition, script-disabled temporary installation, shared
   scenario types, result schema, first-attempt preservation, cleanup, and the
   incumbent adapter characterization.
2. **Modal wave:** `OF-MODAL` scenarios and all four candidate adapters for the
   modal boundary, including browser, React, SSR, hydration, accessibility,
   direction, motion, and coarse-pointer cells.
3. **Anchored interaction wave:** `OF-ANCHORED`, `OF-MENU`, and `OF-TOOLTIP`
   scenarios and adapters under the same environment and evidence protocol.
4. **Composed wave:** `OF-COMPOSED`, lower-level scenario reuse, and the exact
   nine-component mapping without duplicate fixture logic.
5. **Decision evidence:** packed-consumer, declaration/DOM isolation,
   bundle/runtime, security/license, removed-code accounting, deterministic
   archive, and ADR rendering.

A plan may expose a failing or rejected candidate but cannot select a winner,
change production, or omit later plans. The ADR checkpoint remains blocked
until all five plans are merged and the immutable full-matrix run exists.

## Acceptance criteria

This design is complete when:

- the approved overlay specification and all nine ledger entries agree;
- the five plans map every required scenario and all 23 cells to executable
  evidence;
- all four candidates share the same scenario records and assertion helpers;
- candidate installs are exact, isolated, checksum-verified, script-disabled,
  audited, and absent from the production workspace lockfile;
- first attempts and diagnostic retries are distinguishable and immutable;
- packed bytes, bundle/runtime inputs, raw outputs, and summary records share
  exact checksums;
- no score or summary can select a candidate automatically;
- the ADR remains unaccepted until the complete immutable matrix and a separate
  maintainer checkpoint exist; and
- no production runtime, dependency, migration, deployment, publication, tag,
  or release is changed by the evaluation phase.

## Approval checklist

- [x] Maintainer review confirms the four-candidate scope and staged execution
      do not permit early selection.
- [x] Accessibility review confirms every approved contract scenario maps to
      independent automated evidence cells.
- [x] Architecture review confirms candidate isolation, Lyra-owned fixtures,
      and the no-production-dependency boundary.
- [x] Quality review confirms artifact identity, first-attempt preservation,
      bundle/runtime fairness, and fail-closed behavior.
- [x] The decision owner approves this exact design before the first
      implementation plan, candidate manifest, dependency installation, or
      workflow is added.
