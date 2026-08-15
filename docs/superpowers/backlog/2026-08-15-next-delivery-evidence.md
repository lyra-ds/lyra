# Next Delivery Evidence — 2026-08-15

## Baseline

- **Collected:** 2026-08-15T17:26:07-03:00
- **Product baseline:** `origin/main` at
  `ab3de31ec02bb3637bcd7a9528311a581380bb10`
- **Planning branch:** `docs/next-evidence-cycle-design` at
  `610872ad5710ef397d286f6205bf1f390533d76a`, three documentation commits
  ahead of `origin/main`
- **Worktree:** linked worktree at
  `/home/franciscpd/Projects/lyra-ds/lyra-next-evidence-cycle`; clean before
  this artifact was created
- **Runtime:** Node.js `v24.18.0`; pnpm `11.13.1`

The product baseline is `origin/main`, not the planning-branch SHA. The local
`main` checkout remains untouched with its divergent commits and unrelated
`.pnpm-store/` directory.

## Evidence Sources

### Default-branch CI

GitHub Actions run
[`31900005783`](https://github.com/lyra-ds/lyra/actions/runs/31900005783)
completed successfully for the exact product-baseline SHA. Its required jobs
all passed:

| Job         | Result  | Material gates                                                                                                                     |
| ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `lint`      | success | Prettier, Phase 0 artifacts, release policy, actionlint, Stylelint, React/docs/site ESLint                                         |
| `typecheck` | success | React build and repository typecheck                                                                                               |
| `test`      | success | root tests, Chromium/Firefox/WebKit suites, class parity, icon-registry drift                                                      |
| `build`     | success | workspace build, bundle baseline, docgen, Blade snapshot checks, publint, pack smoke, attw, size-limit, dist scans, consumer smoke |

There is no failing default-branch gate to select as a corrective delivery.

### Open GitHub work

The open-issue query returned nine issues. Six include concrete code or
consumer reproduction details that require eligibility review:

- [#185 — Shell content mode inherits page-mode layout rules](https://github.com/lyra-ds/lyra/issues/185)
- [#187 — Container keyword max emits invalid CSS](https://github.com/lyra-ds/lyra/issues/187)
- [#97 — SlotPicker overflows mobile viewports](https://github.com/lyra-ds/lyra/issues/97)
- [#96 — `.lyra-tzpicker` has no styles definition](https://github.com/lyra-ds/lyra/issues/96)
- [#95 — DateRangePicker lacks an accessible range announcement](https://github.com/lyra-ds/lyra/issues/95)
- [#28 — FileManager browser tests contain two vacuous assertions](https://github.com/lyra-ds/lyra/issues/28)

Issues [#186](https://github.com/lyra-ds/lyra/issues/186) and
[#189](https://github.com/lyra-ds/lyra/issues/189) propose a broad AppSidebar
redesign and a new OTP component rather than one demonstrated existing-contract
correction. Issue [#188](https://github.com/lyra-ds/lyra/issues/188) targets the
downstream Blade component path, which the v1 PRD explicitly keeps off the Lyra
release-critical track until the affected React contract stabilizes.

The only open pull request targeting `main` is the Changesets release pull
request [#193](https://github.com/lyra-ds/lyra/pull/193). It contains already
merged Alpine and Styles patch changes and does not describe a new candidate.

### Repository and roadmap scans

The unresolved-marker command

```text
rtk rg -n "TODO|FIXME|TBD|not implemented" packages apps tools .github --glob '!**/dist/**' --glob '!**/node_modules/**'
```

returned exit status `1` with no matches.

The targeted suppression scan found explicit ESLint suppressions in overlay
and interaction code, including Dialog, Drawer, BottomSheet, Dropdown,
Tooltip, WorkspaceSwitcher, CommandPalette, and CalendarView. These matches do
not independently prove a user-facing failure. The approved interaction spec
already records overlay divergence as a P1 family concern, so the matches
remain corroborating input for an overlay-readiness fallback rather than a
standalone defect claim.

The targeted public-contract scan confirmed that current source and public
documentation still expose all three P1 findings named by the approved
interaction spec:

- simulated FileUpload progress in React and Alpine;
- `DataTable.onRowClick` without keyboard-equivalent row activation;
- generated empty focusable React Tabs panels.

Recent path-scoped churn over the trailing 40 commits is Alpine `1,622` changed
lines, Styles `557`, and React `288`. The completed Alpine public API audit
already examined the highest-churn adapter surface and found no mismatch, so
churn alone does not reopen it as a candidate.

## Candidate Evidence

### Signal: FileUpload presents simulated progress as an upload lifecycle

- **Source:** `packages/react/src/file-upload/file-upload.tsx:71`,
  `packages/react/src/file-upload/file-upload.tsx:152`,
  `packages/alpine/src/file-upload.ts:120`, both FileUpload documentation
  pages, and `03-interaction-accessibility.md:432`
- **Observed state:** React and Alpine start timers after file selection,
  increment display progress, and mark items complete without a
  consumer-controlled upload operation. The English and Portuguese docs call
  the progress simulated.
- **Consumer or gate:** `@lyra-ds/react`, `@lyra-ds/alpine`, and the v1 P1
  requirement that file selection be separated from real progress, failure,
  retry, cancellation, and completion state.
- **Reproduction:** inspect both implementations and run their focused
  FileUpload browser tests plus the React SSR test.
- **Eligibility:** eligible; this is a current public lifecycle contract and an
  explicit v1 release criterion.

### Signal: DataTable exposes pointer-only row activation

- **Source:** `packages/react/src/data-table/data-table.tsx:88`,
  `packages/react/src/data-table/data-table.tsx:322`, both DataTable
  documentation pages, and `03-interaction-accessibility.md:433`
- **Observed state:** `onRowClick` installs an `onClick` handler on `<tr>` with
  no row `tabIndex`, semantic action, or keyboard handler. The docs explicitly
  warn that the row is not keyboard operable.
- **Consumer or gate:** `@lyra-ds/react` and the P1 prohibition on pointer-only
  primary actions.
- **Reproduction:** inspect the row rendering and run focused React DataTable
  browser and SSR tests; compare Alpine's table enhancement to determine
  whether adapter parity is applicable.
- **Eligibility:** eligible; current public behavior conflicts with an approved
  accessibility requirement.

### Signal: React Tabs owns empty focusable panels instead of real content

- **Source:** `packages/react/src/tabs/tabs.tsx:99`, both Tabs documentation
  pages, and `03-interaction-accessibility.md:431`
- **Observed state:** React renders generated `role="tabpanel"` elements with
  `tabIndex={0}` but no content, while applications render their actual view
  elsewhere. The public docs describe and demonstrate that split ownership.
  Alpine, by contrast, binds authored panels containing application content.
- **Consumer or gate:** `@lyra-ds/react`, the React/Alpine observable contract,
  and the P1 requirement for compound triggers and real named panel content.
- **Reproduction:** run focused React and Alpine Tabs browser tests plus the
  React SSR test and compare their documented anatomy.
- **Eligibility:** eligible; the current React contract conflicts with the
  approved Tabs family requirement and differs materially from Alpine.

### Signal: Shell content mode retains page-mode layout constraints

- **Source:** [issue #185](https://github.com/lyra-ds/lyra/issues/185) and
  `packages/styles/components/chrome/chrome.css:363-446`
- **Observed state:** `.lyra-shell--content` changes display, height, padding,
  and background but does not reset the base shell's `align-items: start` or
  `gap`. Its sidebar width override does not reset the base sidebar's
  `padding-right` or `align-self: start`.
- **Consumer or gate:** the shared CSS shell used by application layouts; the
  issue links a production-like starter flow where content clips and the
  footer becomes unreachable.
- **Reproduction:** render the documented content-mode shell and assert column
  stretch, zero inter-column gap, scroll reachability, and sidebar height.
- **Eligibility:** eligible; this is a bounded current supported-flow defect
  with source and external-consumer evidence.

### Signal: SlotPicker retains an intrinsic mobile overflow

- **Source:** [issue #97](https://github.com/lyra-ds/lyra/issues/97) and
  `packages/styles/components/scheduling/scheduling.css:4-14`
- **Observed state:** each `.lyra-slotpicker__main` retains `min-width: 232px`
  inside a horizontal flex layout, with no component-owned horizontal overflow
  or narrow-viewport collapse contract. Both locale docs reproduce the class
  without documenting a minimum supported width.
- **Consumer or gate:** `@lyra-ds/styles`, React/Alpine SlotPicker
  compositions, and the v1 narrow-viewport/reflow contract.
- **Reproduction:** render a three-column SlotPicker at 375 CSS pixels and
  measure page overflow and reachability.
- **Eligibility:** eligible; a public responsive-flow gap has current CSS and
  an explicit acceptance criterion, although existing automated proof is
  narrower than for the P1 findings.

### Signal: DateRangePicker lacks a translatable accessible range relation

- **Source:** [issue #95](https://github.com/lyra-ds/lyra/issues/95),
  `packages/react/src/date-range-picker/date-range-picker.tsx:117`, its browser
  tests, and both locale documentation pages
- **Observed state:** the visible range is one interpolated string using a
  visual separator. There is no `rangeAnnouncement` contract or accessible
  trigger name that expresses the relation between start and end dates.
- **Consumer or gate:** `@lyra-ds/react` DateRangePicker and the v1 localized
  date/time accessibility contract.
- **Reproduction:** render a complete range, inspect the trigger's accessible
  name, and verify that no consumer-provided relational announcement exists.
- **Eligibility:** eligible; this is a bounded, current accessibility and
  localization gap with an existing Browser Mode test location.

### Signal: TimeZonePicker publishes an undefined CSS hook

- **Source:** [issue #96](https://github.com/lyra-ds/lyra/issues/96),
  `packages/react/src/time-zone-picker/time-zone-picker.tsx:301`, and both
  locale documentation pages
- **Observed state:** React and the docs publish `.lyra-tzpicker`, while no
  definition exists in `packages/styles` and the docs do not call it an
  intentionally unstyled selection hook.
- **Consumer or gate:** React/CSS documentation parity and developer
  experience.
- **Reproduction:** compare the React root class and docs markup with the
  Styles package inventory.
- **Eligibility:** eligible as a documentation or CSS-contract mismatch, but
  it has lower priority class than confirmed release and supported-flow gaps.

### Signal: reported Container keyword failure does not match the current React contract

- **Source:** [issue #187](https://github.com/lyra-ds/lyra/issues/187),
  `packages/react/src/container/container.tsx:10-22`, and both Container docs
- **Observed state:** the current React public type accepts `max?: number`, the
  JSDoc says pixels, and both Lyra docs use numeric pixel examples. The issue's
  broken `max="sm"` copy path originates in the downstream Blade surface.
- **Consumer or gate:** Blade follow-up rather than the current React, Alpine,
  or CSS v1 contract.
- **Reproduction:** TypeScript rejects a string React `max`; Blade must be
  evaluated after the affected React/CSS contract is stable.
- **Eligibility:** excluded from this Lyra delivery cycle by the approved Blade
  sequencing boundary.

### Signal: FileManager browser assertions are vacuous but do not demonstrate product failure

- **Source:** [issue #28](https://github.com/lyra-ds/lyra/issues/28) and
  `packages/react/src/file-manager/file-manager.browser.test.tsx`
- **Observed state:** two lazy Browser Mode locators are asserted with
  `not.toBeNull()`, so those assertions cannot fail when the queried menu item
  is absent.
- **Consumer or gate:** test confidence only; no linked current public behavior
  is reported broken.
- **Reproduction:** temporarily query a nonexistent accessible name and observe
  the current assertion remain green.
- **Eligibility:** excluded because the cycle does not select internal test
  cleanup without demonstrated consumer or release impact.

## Candidates

| Identifier | Priority class                  | User impact                                                                                                       | Evidence                                                                                                                  | Bounded scope                                                                                          | Proof                                                                                                                  | Exclusions                                                                                                                 |
| ---------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BKL-02`   | Confirmed v1 release blocker    | React and Alpine consumers receive artificial completion state instead of a consumer-controlled upload lifecycle. | Both implementations use timers; both locale docs call progress simulated; the approved interaction spec assigns P1.      | Specify a production FileUpload lifecycle shared at the observable-contract level by React and Alpine. | Focused React browser/SSR tests, Alpine browser tests, public API comparison, then applicable package/build gates.     | No transport client, server endpoint, FileManager redesign, dependency adoption, or implementation in this evidence cycle. |
| `BKL-03`   | Confirmed v1 release blocker    | React consumers get focusable empty panels disconnected from the application content users actually operate.      | React source and docs generate empty panels; Alpine authors real panels; the approved interaction spec assigns P1.        | Specify a compound React Tabs trigger/content contract and explicit Alpine parity boundary.            | Focused React browser/SSR tests, Alpine browser tests, anatomy comparison, then cross-browser and accessibility gates. | No Select/Combobox migration, primitive selection, or implementation in this evidence cycle.                               |
| `BKL-04`   | Confirmed accessibility blocker | Keyboard and assistive-technology users cannot invoke a primary row action exposed through `onRowClick`.          | React installs only `<tr onClick>`; docs warn the row is not keyboard operable; the approved interaction spec assigns P1. | Specify semantic row-action ownership and the Table/DataTable boundary.                                | Focused React browser/SSR tests, source/API comparison, and keyboard/axe acceptance cases in the later delivery.       | No enterprise grid, virtualization, Alpine behavior not currently claimed, or implementation in this cycle.                |
| `BKL-05`   | Confirmed accessibility gap     | Screen-reader users lack a localized relation between the visible start and end dates.                            | Issue #95, current interpolated trigger text, absent `rangeAnnouncement`, and existing Browser Mode coverage.             | Specify and implement a translatable accessible range announcement without changing visible text.      | Focused DateRangePicker Browser Mode and SSR tests plus generated public-type documentation.                           | No calendar arithmetic, segmented date input, visible separator change, or date-family migration.                          |
| `BKL-06`   | Supported-flow defect           | Content-mode shell consumers can get clipped content, unreachable footer content, and phantom spacing.            | Issue #185 and current CSS retain page-mode alignment, gap, sidebar padding, and self-alignment.                          | Correct content-mode resets with a focused scrolling and layout regression fixture.                    | Styles browser test at representative viewport sizes, parity check, and starter-like smoke composition.                | No AppSidebar redesign, navigation API change, new tokens, or broader application-chrome refactor.                         |

The SlotPicker mobile-overflow signal remains eligible below the five-candidate
cap: its provisional score is `2 + 2 + 1 + 2 = 7`, below every table entry.
The TimeZonePicker hook mismatch is also eligible but belongs to the lowest
documentation/DX priority class and scores `1 + 1 + 2 + 1 = 5`. Neither can
displace a higher-priority current blocker or supported-flow defect.

## Scoring

| Identifier | User impact | Release/accessibility risk | Automated proof | Supported-surface reach | Arithmetic      | Total |
| ---------- | ----------: | -------------------------: | --------------: | ----------------------: | --------------- | ----: |
| `BKL-02`   |           3 |                          3 |               2 |                       2 | `3 + 3 + 2 + 2` |    10 |
| `BKL-03`   |           3 |                          3 |               2 |                       1 | `3 + 3 + 2 + 1` |     9 |
| `BKL-04`   |           3 |                          3 |               2 |                       1 | `3 + 3 + 2 + 1` |     9 |
| `BKL-05`   |           2 |                          3 |               2 |                       1 | `2 + 3 + 2 + 1` |     8 |
| `BKL-06`   |           3 |                          2 |               1 |                       2 | `3 + 2 + 1 + 2` |     8 |

`BKL-03` and `BKL-04` tie on score, priority class, and automated proof. The
selection-family contract that governs Tabs appears before the data-and-files
family in the approved implementation-family order, so `BKL-03` wins that
tie. `BKL-05` and `BKL-06` tie on score, but the confirmed accessibility gap
has a higher priority class than the supported-flow defect. No tie-break is
needed for `BKL-02`, the unique highest score.

## Focused Audit

**Target:** `BKL-02`

**Falsifiable claim:** the current React and Alpine FileUpload public contracts
autonomously advance files from selection to successful completion without a
consumer-controlled upload operation, and therefore cannot represent the
approved real progress, failure, retry, cancellation, and completion lifecycle.

### Source and contract comparison

The focused source query returned 83 matches across the two implementations,
their tests, and both locale docs. It confirmed the same observable model in
both adapters:

- `FileUploadItem.status` is limited to `uploading`, `done`, or `error` and is
  documented as simulated state;
- accepted files start at five percent and schedule a local interval;
- each interval increments progress until the component itself writes
  `progress: 100` and `status: 'done'`;
- `onFiles` hands real `File` objects to the consumer, but no public input lets
  the consumer control an item's progress, transport failure, retry,
  cancellation, or completion;
- both locale docs explicitly present `onChange` as reporting simulated
  progress.

The React browser suite covers dropzone keyboard operation, file handoff,
validation, removal, accessible names, axe, and consumer-supplied completed
items. It does not exercise or constrain the timer-driven transition. The
Alpine suite explicitly asserts that the adapter advances an accepted item to
`done` and emits progress ticks, proving that autonomous completion is an
intentional tested contract rather than dead code.

### Focused command evidence

| Command                                                                                                                                   | Result                 | Material observation                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `rtk pnpm --filter @lyra-ds/react exec vitest run --project browser --browser.name chromium src/file-upload/file-upload.browser.test.tsx` | PASS — 1 file, 8 tests | Current React selection, validation, removal, accessible-name, and axe behavior is green. |
| `rtk pnpm --filter @lyra-ds/react exec vitest run --project ssr src/file-upload/file-upload.ssr.test.ts`                                  | PASS — 1 file, 1 test  | Current FileUpload remains SSR renderable.                                                |
| `rtk pnpm --filter @lyra-ds/alpine exec vitest run --browser.name chromium src/file-upload.browser.test.ts`                               | PASS — 1 file, 9 tests | Alpine explicitly protects automatic progress ticks and transition to `done`.             |

**Classification:** `Confirmed`

The passing tests establish the current baseline but do not satisfy the
approved contract. The implementation, docs, and Alpine regression test all
confirm that Lyra currently presents synthetic success without a real upload
lifecycle. No second candidate audit is necessary.

## Recommendation

**Selected:** BKL-02

**Classification:** Confirmed

**Reason:** `BKL-02` has the unique highest score (`10/10`), affects both
runtime adapters, and is an explicit P1 v1 release criterion. The focused audit
confirmed its claim in source, public documentation, and existing tests. The
next delivery must define the data-and-files family contract for
consumer-controlled FileUpload state before any runtime change; it must not
mistake an implementation plan for permission to invent that public API.

## Next Delivery Contract

### Affected Contract

The next delivery is the approved component-family specification
`docs/superpowers/specs/2026-08-15-data-files-family-design.md`. It governs
Table, DataTable, FileUpload, and FileManager as the PRD's Data and Files
family, with FileUpload named as the first and only implementation wave
authorized after that specification is approved.

The specification must replace the current React `FileUploadProps`,
`FileUploadItem`, `onFiles`, and `onChange` lifecycle assumptions and the
corresponding Alpine `lyraFileUpload` options, state, bindings, and events with
one Lyra-owned observable contract. Consumers own the asynchronous upload
operation. Lyra owns file selection, validation presentation, operation
identity, semantic state rendering, recovery controls, announcements, and
adapter mapping. Styles remains the visual source of truth.

Table, DataTable, and FileManager enter the specification only far enough to
make data/file ownership and composition boundaries complete. Their runtime
APIs are not part of the first implementation wave.

### Scope

The family specification must make these FileUpload decisions explicit and
executable:

- anatomy and ownership for the dropzone, native file input, item list,
  progress, status, error, retry, cancellation, completion, and removal;
- stable per-file and per-attempt identity, including stale completion and
  replacement-file behavior;
- the complete `idle`, `selected`, `uploading`, `success`, `error`, `canceled`,
  and removed state transitions;
- whether the public collection is controlled, uncontrolled, or a deliberately
  bounded combination, including exact React callbacks and Alpine custom-event
  timing;
- real determinate progress, indeterminate work, validation failure, transport
  failure, retry, consumer-requested cancel, successful completion, and
  teardown;
- semantic HTML, accessible names, live announcements, deduplication, focus
  retention, keyboard operation, touch targets, forced colors, reduced motion,
  RTL, long file names, zoom, and narrow-viewport reflow;
- SSR output, hydration stability, no-JavaScript file-selection fallback, and
  Alpine idempotent initialization and cleanup;
- exact TypeScript signatures, Alpine options/bindings/events, CSS classes and
  state attributes, rendered outlines, transition tables, compatibility table,
  and before/after examples required by the component-architecture template;
- manual migration from autonomous timers to consumer-owned operations, with
  no compatibility shim that preserves synthetic success.

The specification and first implementation wave exclude an HTTP client,
server endpoint, storage provider, multipart/chunk scheduling, background
uploads, persistence across navigation, FileManager redesign, DataTable
correction, new primitive dependency, Blade changes, release publication, and
unrelated file-family styling.

### Adapter and Documentation Impact

- **React:** affected. The final spec must expose complete React 18/19-compatible
  public types and preserve native file selection while moving asynchronous
  outcome ownership to the consumer.
- **Alpine:** affected. It must expose equivalent observable states and
  operations through serializable options, bindings, and bubbling composed
  custom events; it need not share React implementation code.
- **CSS:** affected only if the approved state model needs new stable classes,
  attributes, or selectors. Existing visual classes must remain unless the
  spec documents a breaking replacement and migration.
- **English and Portuguese docs:** affected. Both FileUpload pages must teach
  real consumer-owned operation state, recovery, cancellation, and migration
  examples without calling synthetic progress production behavior.
- **Stack tabs:** the React and Alpine/HTML representations must each contain a
  working example for the contract they actually support. Empty or aspirational
  tabs are prohibited.
- **Blade:** deferred under the approved post-React sequencing rule. The family
  spec records the later compatibility boundary but the first wave does not
  modify the sibling adapter.

### Verification Gates

The specification delivery is documentation-only. It must pass:

```text
rtk pnpm exec prettier --check docs/superpowers/specs/2026-08-15-data-files-family-design.md
rtk git diff --check
```

Before the later FileUpload implementation can reach `Implemented`, the
approved family spec must turn the current P1 behavior into failing acceptance
cases in these existing test-first locations:

- `packages/react/src/file-upload/file-upload.browser.test.tsx`;
- `packages/react/src/file-upload/file-upload.ssr.test.ts`;
- `packages/alpine/src/file-upload.browser.test.ts`.

The acceptance matrix must prove the selected API across Chromium, Firefox,
and WebKit; light, dark, and forced-colors output; keyboard and touch-equivalent
selection/removal/retry/cancel actions; real and indeterminate progress; error,
stale result, retry, cancel, completion, removal, and teardown; React SSR and
hydration; Alpine initialization/reconnection cleanup; narrow viewport, long
names, RTL, reduced motion, and 200% zoom. The family spec must name the exact
hydration fixture or consumer-smoke scenario before approval because the
repository does not currently contain a FileUpload-specific hydration test.

The implementation wave must run, at minimum:

```text
rtk pnpm --filter @lyra-ds/react run test:ssr
rtk pnpm --filter @lyra-ds/react run test:browser
rtk pnpm --filter @lyra-ds/alpine run test:browser
rtk pnpm --filter @lyra-ds/react run typecheck
rtk pnpm --filter @lyra-ds/alpine run typecheck
rtk pnpm --filter @lyra-ds/react run build
rtk pnpm --filter @lyra-ds/alpine run build
rtk pnpm run parity
rtk pnpm baseline:bundles --check
rtk pnpm --filter @lyra-ds/react exec attw --pack . --profile node16
rtk pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm
rtk pnpm --filter @lyra-ds/react exec size-limit
rtk pnpm --filter @lyra-ds/alpine exec size-limit
rtk node tools/docgen/generate.mjs --check
rtk node tools/docgen/alpine.mjs --check
rtk node tools/pack-smoke/pack-smoke.mjs
rtk node tools/smoke/smoke.mjs
rtk pnpm test
rtk pnpm test:browsers
```

Any complex-migration bundle increase is limited to `+3 kB` Brotli per
consumer entry after synthetic timers and superseded behavior are removed. A
larger delta or any new primitive dependency requires the governing ADR and
maintainer approval before production adoption.

### Compatibility and Release

Creating and approving the family specification changes no package behavior,
so that delivery has no changeset.

The later runtime migration follows the unsafe-contract path: synthetic upload
success must not remain as a compatibility mode. Because React and Alpine are
both pre-`1.0.0` and their public behavior changes, each affected package must
receive its own controlled-breaking minor changeset, coordinated in one release
window with compatible Styles ranges. Styles receives no empty bump; it changes
only if its public classes or selectors change.

Release notes and a migration guide must identify affected versions, explain
consumer ownership of asynchronous work, and provide complete React and
Alpine/HTML before-and-after examples. No codemod is expected because mapping a
synthetic component-owned timer to a real transport, retry, and cancellation
policy requires a consumer product decision rather than a semantics-preserving
mechanical rewrite.

### Completion Condition

The next delivery is complete when
`docs/superpowers/specs/2026-08-15-data-files-family-design.md` reaches
`Approved` with every artifact in the component-family template, resolves the
FileUpload public API and all adapter/state/migration decisions above, names
the exact test and manual acceptance matrix, records required approvers, and
limits the first implementation wave to FileUpload. No production plan or code
begins before that approval.

## Verification

- **PASS — Baseline and evidence-source completeness:** product and planning
  SHAs, timestamp, runtime, worktree state, exact green CI run, all open issues,
  the open PR, approved specs, repository scans, and recent churn are recorded.
- **PASS — Candidate eligibility and score arithmetic:** five candidates meet
  the public-contract rule; two lower eligible signals and two exclusions are
  explained; every row recomputes correctly and the applied ties follow the
  approved order.
- **PASS — Focused audit result:** source, public docs, 8 React browser tests,
  1 React SSR test, and 9 Alpine browser tests confirm the current synthetic
  lifecycle without a consumer-controlled operation.
- **PASS — Unique recommendation:** `BKL-02` is the sole `10/10` candidate and
  the only identifier named by `Recommendation`.
- **PASS — Delivery-contract completeness:** affected surfaces, exact scope,
  adapter/docs impact, proof locations, full gates, bundle policy,
  compatibility, changesets, migration, and objective completion are resolved.
- **PASS — Documentation-only branch scope:** this cycle has changed only its
  approved design, execution plan, and evidence artifact; the final path and
  changeset checks below provide executable confirmation.
