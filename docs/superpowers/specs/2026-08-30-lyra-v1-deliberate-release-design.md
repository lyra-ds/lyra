# Lyra Deliberate V1.0 Release Design

**Status:** Approved

**Date:** 2026-08-30

**Decision owner:** Lyra maintainer

**Supersedes:** treating the consolidated Core Beta as the complete Lyra V1

## 1. Decision summary

Lyra will reach `1.0.0` through four bounded delivery streams in dependency
order:

1. select and migrate one overlay behavior foundation;
2. replace the Tabs P1 contract;
3. replace the DataTable P1 contract; and
4. qualify and publish one exact release candidate.

The consolidated Core Beta remains a valid published milestone. It delivered
Styles 0.5.0, React 0.5.0, Alpine 0.6.0, the production FileUpload lifecycle,
the three-engine browser matrix, Automated Core evidence, dependency-security
enforcement, and a verified release pipeline. It did not deliver `1.0.0`.

This design narrows the deliberate V1 milestone to the remaining P1 contracts
named by the approved Core Beta design. It does not reopen every historical
roadmap item as a release blocker. Components may retain a `Beta` lifecycle
label when their automated evidence does not support `Stable`, but lifecycle
labels do not exempt any public export from package SemVer after `1.0.0`.

## 2. Current release boundary

The implementation baseline is merge commit
`e9ce1120d67ff6903573f3b0868e06741285b456`:

- `@lyra-ds/styles@0.5.0`;
- `@lyra-ds/react@0.5.0`;
- `@lyra-ds/alpine@0.6.0`;
- FileUpload is the only catalog component labeled `Stable`;
- the other 74 catalog entries are labeled `Beta`; and
- the required `lint`, `typecheck`, `test`, and `build` contexts pass on the
  published beta revision.

The historical `.planning/` roadmap is context, not current completion truth.
The approved V1 PRD, approved foundational specifications, current public
support matrix, executable CI, immutable evidence, package manifests, and this
design own the release decision.

## 3. Goals

- Close every remaining P1 contract without broadening the milestone.
- Use one coherent overlay/menu behavior foundation in React.
- Preserve Lyra-owned public props, CSS classes, tokens, and data attributes.
- Keep React, Alpine, and CSS compatibility explicit rather than implying
  identical implementations.
- Make every breaking `0.x` migration documented and testable before the
  package APIs freeze at `1.0.0`.
- Qualify the exact packed artifacts that the release workflow later
  publishes.
- Preserve the current automated security, accessibility, browser,
  performance, bundle, packaging, and consumer-smoke gates.

## 4. Non-goals

- Vue, Svelte, Web Components, Blade, MCP, Tailwind presets, or a copyable
  registry.
- A visual redesign, token-system replacement, or CSS namespace change.
- An enterprise data grid with virtualization, editing, pivoting, or column
  authoring.
- Migration of advanced date, time, calendar, combobox, or scheduling
  families.
- Promoting every catalog component to `Stable` merely because packages reach
  `1.0.0`.
- Exposing Radix, Base UI, React Aria, Zag, or any other vendor type in public
  Lyra APIs.
- Fabricating or treating missing manual assistive-technology evidence as a
  pass.

## 5. Delivery architecture

### 5.1 Program ledger

Before a runtime migration, create one machine-checked V1 ledger that maps
each named P1 component to:

- governing specification and status;
- current public contract;
- target contract;
- implementation status;
- automated acceptance matrix;
- migration guide;
- compatible Styles, React, and Alpine ranges; and
- immutable candidate evidence.

The ledger fails closed when a required field is absent or a completed claim
does not reference tracked evidence. It replaces narrative status inference
from `.planning/`; it does not rewrite historical planning documents.

### 5.2 Overlay foundation stream

The first stream covers three waves:

| Wave     | Components                                               | Responsibility                                                                                     |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Modal    | Dialog, Drawer, BottomSheet                              | portal ownership, focus scope, Escape, outside interaction, scroll lock, presence, restoration     |
| Anchored | Popover, Dropdown, Tooltip                               | positioning, dismissal, keyboard interaction, typeahead where applicable, focus/hover coordination |
| Composed | CommandPalette, WorkspaceSwitcher, CreateWorkspaceDialog | reuse the selected foundation while preserving Lyra domain APIs                                    |

An approved overlay-family specification and decision record precede
production migration. The evaluation compares the incumbent implementation,
Radix, Base UI, and the approved Zag direction against the same fixtures. It
may retain the incumbent. If a new foundation wins, exactly one dependency
owns equivalent production responsibilities and superseded internal portal,
focus, presence, scroll-lock, and dismiss code is removed in the same stream.

The selected foundation is wrapped behind Lyra-owned internal interfaces.
Public component types, DOM attributes, CSS classes, tokens, and documented
composition remain Lyra contracts.

### 5.3 Tabs stream

Tabs receives an approved selection-family specification and a compound
trigger/content contract. Real panel content is owned by the tab system;
inactive panels are not empty focusable placeholders. The contract defines:

- controlled and uncontrolled selection;
- automatic or manual activation;
- horizontal and vertical orientation;
- LTR and RTL arrow behavior;
- disabled tabs;
- focus retention when items change;
- stable IDs and relationships between tab and panel; and
- SSR and hydration behavior.

The migration guide maps the beta API to the compound API with before/after
examples. The implementation may reuse the chosen overlay-era dependency only
when the selection specification and measured evidence justify it.

### 5.4 DataTable stream

The implemented Data and Files family specification is amended for DataTable.
Table remains semantic static markup. DataTable remains a bounded Lyra
composition and does not become an enterprise grid.

The replacement contract removes pointer-only row actions. Every row-level
operation is represented by a semantic focusable control with an accessible
name. Row selection and row activation, if both exist, are separate intents.
Keyboard navigation, focus behavior, sorting, selection, empty/loading/error
states, responsive behavior, and controlled state are explicit. The stream
must document when consumers should use Table, DataTable, or a future data-grid
product.

FileUpload remains complete under Automated Core and is not redesigned.
FileManager changes only when required to consume the approved DataTable
boundary.

### 5.5 Release-candidate stream

The release candidate is a new commit after all three implementation streams
are merged. It records:

- zero open P1 contracts;
- all family specifications at `Implemented`;
- exact package compatibility ranges;
- consolidated migration and known-issue guidance;
- immutable bundle and runtime evidence for the candidate;
- successful packed-artifact installation in at least two real consumer
  applications; and
- major Changesets for Styles, React, and Alpine.

The Changesets version PR must target `1.0.0` for all three packages and must
pass against the exact versioned tarballs before merge.

## 6. Acceptance model

Every affected component has one executable acceptance matrix derived from its
approved family specification. Applicable cells include:

- Chromium, Firefox, and WebKit;
- React 18 and React 19;
- SSR render and hydration;
- keyboard and focus behavior;
- axe in light and dark themes;
- forced-colors behavior;
- reduced-motion behavior;
- LTR and RTL behavior;
- touch target and coarse-pointer behavior;
- standalone and representative-composition bundle measurements;
- packed ESM, CJS, and type declarations; and
- Vite, Next.js, and CommonJS consumer smoke tests.

An inapplicable cell must be justified in the family specification. It may not
be silently omitted. A missing or failed applicable automated cell blocks the
stream.

Manual Windows/NVDA and macOS/VoiceOver evidence remains optional
post-release evidence under Automated Core. When absent, it is rendered as
`deferred-by-release-profile`; it is never represented as `PASS`.

## 7. Bundle and dependency policy

- Evaluate dependencies with the exact same contract fixtures and packed
  consumer scenarios as the incumbent.
- Do not raise a bundle budget before removed incumbent code is reflected in
  the measurement.
- Default maximum increase is `1.5 kB` Brotli for a simple primitive and
  `3 kB` Brotli for a complex component or representative composition.
- A larger increase requires an approved decision record naming the user
  benefit, rejected alternatives, and final measured package impact.
- Do not ship two foundations for equivalent overlay/menu responsibilities.
- Keep dependency types out of public declaration files.
- Preserve the security lock policy and zero governed high/critical
  vulnerabilities before every publication path.

## 8. Migration and compatibility

Each stream publishes one migration guide in English and Brazilian Portuguese.
Guides include beta and target signatures, before/after examples, focus and
keyboard changes, CSS/DOM compatibility, and removal timing.

Styles, React, and Alpine retain independent package identities but coordinate
the V1 release window. The compatibility table records exact minimum ranges.
After `1.0.0`, all public package exports follow standard SemVer even when a
component lifecycle label remains `Beta`; `Beta` describes evidence maturity,
not permission for undocumented breaking changes.

## 9. Failure handling and stop conditions

A stream stops without promotion when:

- its governing family specification or decision record is not approved;
- two candidate foundations remain in production for equivalent behavior;
- an automated acceptance cell is missing, skipped without justification, or
  failing;
- packed artifacts differ from the artifacts measured by evidence;
- a public vendor type appears in generated declarations;
- a bundle or performance budget fails;
- migration guidance is incomplete in either locale;
- compatibility ranges are absent or contradicted by consumer tests;
- the required CI contexts are not green on the exact candidate; or
- a security policy or registry audit fails.

Infrastructure unavailability is reported separately and blocks the affected
gate until the pinned CI environment executes it successfully. A retry cannot
turn a product failure into a pass.

## 10. Delivery sequence and checkpoints

Each stream follows this sequence:

1. approve the family specification or amendment;
2. record the current contract and a failing acceptance test;
3. run the bounded decision spike when a dependency choice exists;
4. approve the decision record;
5. implement the smallest coherent wave;
6. run focused and full automated gates;
7. publish migration and compatibility documentation;
8. obtain independent code and evidence review;
9. open a PR and pass exact-head CI; and
10. merge only after an explicit operator checkpoint.

Remote pushes, workflow dispatches, PR merges, deployments, Changesets version
PR merges, npm publication, tags, and GitHub Releases remain separate explicit
operator checkpoints. Approval of this design does not authorize those remote
actions.

## 11. V1.0 exit gate

Lyra V1.0 is complete only when all of the following are true:

- [ ] Overlay, Tabs, and DataTable have no open P1 contract.
- [ ] Their governing family specifications are `Implemented`.
- [ ] Exactly one overlay/menu behavior foundation is present in production.
- [ ] Every applicable automated acceptance cell passes on the exact release
      candidate.
- [ ] Public migration, known-issue, support, security, deprecation, and SemVer
      guidance is current in both locales where applicable.
- [ ] Styles, React, and Alpine compatibility ranges are tracked and proven by
      packed consumers.
- [ ] Immutable bundle and runtime evidence identifies the exact candidate.
- [ ] Major Changesets produce Styles 1.0.0, React 1.0.0, and Alpine 1.0.0.
- [ ] The version PR passes `lint`, `typecheck`, `test`, and `build` against the
      exact versioned tarballs.
- [ ] Merge and npm publication occur only after explicit final authorization.

## 12. First implementation boundaries

The first implementation plan covers only the V1 ledger plus the overlay
family specification. It stops for explicit approval of that specification,
as required by the Phase 0 evidence index.

After that approval, a second plan covers the evidence harness and foundation
decision. Production overlay migration receives a third plan only after the
decision record is approved. None of these approvals authorizes a remote or
production action.

These boundaries prevent an evaluation plan or library preference from
preceding the governing contract, and prevent a candidate from becoming
production code before the alternatives are measured against that contract.
