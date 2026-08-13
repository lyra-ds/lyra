# Lyra v1.0 quality and performance

**Status:** Approved

**Date:** 2026-08-12

**Owner:** Lyra maintainers

**Approved:** 2026-08-13 by the PRD owner and Lyra maintainer after review
against the published interaction standard

**Scope:** Quality levels, test architecture, merge and release gates, browser
and assistive-technology evidence, server-rendering and hydration verification,
flake policy, bundle and runtime performance, external-dependency adoption
evidence, traceability, and release evidence for `@lyra-ds/styles`,
`@lyra-ds/react`, and `@lyra-ds/alpine` in Lyra v1.0.

**Governing PRD:**
[Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)

## Decision summary

Lyra v1.0 MUST treat quality as cumulative evidence for the approved public
contract. Static analysis, unit tests, real-browser behavior, SSR and hydration,
accessibility automation, visual comparison, adapter conformance, package
validation, performance measurement, and manual assistive-technology review
MUST complement one another; a passing layer MUST NOT substitute for a missing
layer.

WCAG 2.2 Level AA is the release baseline. The required automated engines are
the exact Chromium, Firefox, and WebKit revisions supplied by the Playwright
version pinned in the repository lockfile; independently selected browser
releases MUST NOT be substituted in that gate. Every critical desktop workflow
MUST receive the Windows/NVDA and macOS/VoiceOver reviews defined by the
[interaction and accessibility specification](./03-interaction-accessibility.md#supported-browser-and-assistive-technology-matrix).
The release artifact MUST also prove SSR, hydration, package exports, emitted
public-type isolation, bundle budgets, and real-consumer installation and builds.

This document specifies the v1.0 evidence target. The current CI and test
harness are evidence inputs, not proof that every target already exists. In
particular, a Chromium-only project or a render-only SSR test MUST NOT be
reported as the complete browser or SSR-and-hydration gate.

The
[component architecture specification](./04-component-architecture.md#ssr-hydration-and-no-javascript-behavior)
owns SSR, hydration, and no-JavaScript behavior. This specification owns the
methods, execution, aggregation, and merge and release evidence used to prove
that behavior. It also owns bundle-budget thresholds and the complete evidence
gate for external-dependency adoption; Architecture supplies candidate-specific
contract and ADR inputs without becoming a second evidence owner.

## Quality levels, severity, and service-level objectives

The shared [`P1`](./README.md#p1), [`P2`](./README.md#p2),
[`P3`](./README.md#p3), and
[critical-workflow](./README.md#critical-workflow) definitions are canonical.
This section refines their response expectations and merge and release effects.

Severity describes user and contract impact, not implementation difficulty,
component popularity, or the number of failing tests. A missing required result
has the severity of the contract it leaves unproved. Each finding MUST link its
affected acceptance criterion, owner, status, reproduction or evidence, and
release disposition.

The response clock starts when a maintainer can reproduce the finding or when
required evidence is confirmed missing. It uses the maintainers' published
working days. A missed service-level objective MUST escalate to the release
owner; it MUST NOT lower severity or extend a release gate.

| Severity | Canonical impact definition             | Representative examples                                                                                                                                                                                                                                                                                                                                          | Response expectation                                                                                                                                                                                                                                                                                        | Merge and release effect                                                                                                                                                                                                                                          |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P1`     | [Shared P1 definition](./README.md#p1). | Any known WCAG 2.2 Level AA failure; a keyboard-blocked primary task; focus escaping an active modal; data loss or destructive action without its required confirmation; a broken root or documented subpath export; SSR or hydration corruption that blocks use; a public vendor-type leak; a missing required browser or critical assistive-technology result. | The first maintainer who confirms it MUST stop the affected merge or release and record it immediately. It MUST be acknowledged in the same working day, with an owner and containment decision assigned within one working day. Resolution evidence MUST be reviewed before the affected gate is reopened. | It MUST block an affected pull request, release candidate, and release. It MUST NOT be waived, suppressed, quarantined, relabeled, or documented away. Lyra v1.0 MUST ship with zero open `P1` findings.                                                          |
| `P2`     | [Shared P2 definition](./README.md#p2). | Incorrect behavior in a non-critical secondary path; a material visual or responsive regression with an accessible workaround; an adapter inconsistency outside a claimed critical workflow; a repeatable performance regression that remains inside an approved budget.                                                                                         | It MUST be triaged within two working days with an owner, workaround, affected versions, acceptance criterion, and planned release disposition.                                                                                                                                                             | It MUST block a pull request that introduces or expands it. A pre-existing `P2` MAY remain for a release only with a documented workaround, known-issues entry, target release, maintainer approval, and evidence that no v1.0 gate or `P1` contract is affected. |
| `P3`     | [Shared P3 definition](./README.md#p3). | Minor copy, spacing, or non-contractual polish; a diagnostic improvement; a low-impact edge case outside the supported matrix.                                                                                                                                                                                                                                   | It MUST be classified and placed in the owned backlog by the next scheduled triage.                                                                                                                                                                                                                         | It SHOULD NOT block merge or release unless the approved family spec makes that result an acceptance criterion. If shipped, it MUST appear in known issues when users can observe it.                                                                             |

A finding MUST retain its severity until fresh evidence proves the acceptance
criterion. Retrying, moving, muting, or deleting a check MUST NOT resolve the
finding. If investigation shows broader impact, the severity MUST be raised
immediately; lowering severity requires the evidence and maintainer approval to
be recorded on the finding.

### Stable-component eligibility

A component or public API is eligible for `Stable` only when its governing
family specification is `Implemented`. To move a family specification to
`Implemented`, the implementation owner MUST provide all of the following for
the exact shipped revision:

- a complete acceptance-criterion traceability matrix with no unexplained gap;
- passing evidence from every applicable layer and cadence in this document;
- current Chromium, Firefox, and WebKit conformance results for every
  interactive contract;
- completed Windows/NVDA and macOS/VoiceOver records for every critical desktop
  workflow, plus required mobile evidence;
- passing WCAG 2.2 Level AA, keyboard, focus, SSR, hydration, parity,
  public-type isolation, packaging, and consumer-smoke evidence;
- approved standalone, scenario, CSS, and complex-interaction performance
  evidence where applicable;
- public documentation, support-matrix entries, package compatibility, release
  notes, and migration guidance for every changed contract; and
- zero open `P1` findings and a release disposition for every open `P2` and
  user-observable `P3` finding.

Design-system maintainers MUST review that evidence before approving the
`Implemented` transition. Appearance in a stable package, passing one CI job,
or the absence of a reported defect MUST NOT establish stable eligibility.

## Test architecture

Every family specification MUST name the fixtures, assertions, artifact paths,
and test identifiers that supply each applicable layer below. Shared helpers
MAY reduce duplication, but they MUST NOT hide an adapter-specific outcome or
filter a known violation.

The architecture is a test pyramid by feedback cost: broad static and pure
logic checks form the fastest base; focused real-browser, SSR, hydration,
accessibility, visual, conformance, and package suites prove observable
contracts; manual browser, assistive-technology, exploratory, and real-consumer
checks provide the narrowest, highest-cost evidence. Cost MUST determine
cadence and selection, not whether a required contract is proved.

### 1. Static checks

Static gates MUST include formatting; JavaScript, TypeScript, React, and CSS
linting as applicable; source and consumer type checking; root and subpath
export validation; generated-documentation drift checks; and token, class,
state, and adapter parity checks.

Public API and public-type isolation checks MUST inspect source declarations,
inferred exports, emitted `.d.ts` and `.d.cts` files, packed tarballs, and a
consumer compile. A public declaration, callback, ref, option object, example,
or generated documentation MUST NOT name or structurally require a Radix, Base
UI, React Aria, or other primitive-vendor type. A source-only assertion MUST NOT
satisfy emitted public-type isolation.

### 2. Unit and pure-logic tests

Reducers, state transitions, value normalization, collection identity,
selection, range and date calculations, placement inputs, cancellation,
stale-result handling, and other environment-independent logic MUST be tested
without relying on browser timing. Boundary, invalid-input, disabled,
read-only, teardown, and recovery paths MUST be included when applicable.

### 3. Real-browser component contract tests

Interactive semantic, keyboard, pointer, touch, focus, portal, scroll-lock,
presence, form, event, and announcement contracts MUST run in real browsers.
DOM emulation MUST NOT be the sole evidence for behavior that depends on CSS,
layout, focus, accessibility trees, media queries, or browser event ordering.

The automated v1.0 gate MUST use the exact Chromium, Firefox, and WebKit
revisions supplied by the Playwright version pinned in the repository lockfile;
independently selected releases MUST NOT be substituted. Pull-request selection
MAY be limited to affected families and shared infrastructure, but every
selected interactive contract MUST run in all three engines. A Playwright
upgrade MUST trigger the full interactive conformance suite in all three engines
before the new version becomes the supported gate.

### 4. SSR and hydration tests

React tests MUST cover module evaluation, server rendering, the first client
render, `hydrateRoot`, generated and consumer IDs, controlled and uncontrolled
state, portals, live regions, environment-derived defaults, user input entered
before hydration, focus held before hydration, and teardown. They MUST fail on
hydration warnings, semantic-tree or attribute mismatch, duplicated
announcements, replayed user events, input loss, or focus movement not required
by the approved contract. React 18 and React 19 MUST both remain in the type,
build, SSR, hydration, and representative-browser verification range.

Alpine fixtures MUST start from the documented server-authored HTML, native,
ARIA, class, and data state. They MUST verify no-JavaScript access, delayed
initialization, idempotent registration, reconciliation without replacement,
preservation of user input and focus, event behavior, and cleanup. A capability
with no meaningful no-JavaScript fallback MUST test its documented inactive
server output and alternate route.

### 5. Accessibility automation

Automated semantic, accessible-name, relationship, state, keyboard, focus,
target-size, and axe checks MUST run against accepted component output. Axe and
applicable contrast checks MUST cover light, dark, and forced-colors
configurations where the browser and rule support reliable automated
evaluation. Known WCAG 2.2 Level AA violations MUST NOT be suppressed or
removed from reported results.

Automation MUST NOT be described as WCAG conformance and MUST NOT replace
manual keyboard, zoom, reflow, forced-colors, or assistive-technology review.
Final composited contrast measurements MUST cover every affected foreground,
boundary, state, focus, theme, brand, overlay, gradient, image, and fallback
pair.

### 6. Visual regression

Visual fixtures MUST use approved content and stable rendering controls. Each
affected component MUST cover light and dark themes, LTR and RTL where
direction can affect output, every supported density or the densest supported
configuration when density does not change anatomy, and representative desktop
and narrow viewports named by its family spec. Components that materially
change on touch, container size, high data volume, or long content MUST add
those fixtures.

The system suite MUST additionally cover explicit and system-resolved theme,
brand combinations, forced colors, reduced motion, 200% text zoom, 400% page
zoom and reflow, empty content, long translations, unbroken strings, and high
density. Pixel snapshots MAY support review, but semantic, contrast, reflow,
focus, or motion assertions MUST own outcomes that pixels cannot prove.

An intentional baseline update MUST include the changed image, reason, owning
acceptance criterion, exact browser and viewport, and reviewer approval. Bulk
baseline acceptance without per-change attribution MUST NOT pass the gate.

### 7. React and Alpine conformance fixtures

Every family that claims both adapters MUST run the same observable scenario
identifiers against React and Alpine fixtures. The fixtures MUST compare
semantics, public state, operations, cancellation, events and payloads, focus
outcomes, announcements, CSS classes and data states, progressive enhancement,
and cleanup. Stack-specific source, internal dependencies, and DOM nodes MAY
differ only within the documented support boundary.

The conformance result MUST link each intentional adapter difference to the
family support matrix with its missing capability, reason, user impact,
fallback, evidence, and reevaluation owner. Catalog coverage alone MUST NOT be
reported as parity.

### 8. Packaging and consumer smoke tests

Each release artifact MUST be packed before validation. Gates MUST inspect the
tarball allowlist, root and documented subpath exports, ESM and declared CJS
resolution, side effects, CSS import chains, declarations, `use client`
boundaries, external dependencies, tree shaking, and absence of development or
private files.

Fresh fixtures outside the workspace MUST install the exact tarballs as a real
consumer, typecheck against emitted declarations, and produce production Vite
and Next.js builds where the package claims those environments. CSS-only and
Alpine consumers MUST receive equivalent install, import, build, and runtime
smoke coverage for their documented support. The v1.0 release candidate MUST
also pass in at least two real or production-like consumer applications.

### 9. Manual assistive-technology and exploratory review

Every critical desktop workflow MUST be exercised on Windows with NVDA and
current stable Firefox or Chromium, and on macOS with VoiceOver and current
stable Safari. The exact browser, operating system, assistive technology,
versions, input method, scenario, revision, expected result, actual result, and
artifact link MUST be recorded. Browse and focus modes, navigation, activation,
forms, announcements, and layer transitions MUST be included when applicable.

Material touch or narrow-viewport differences MUST receive the mobile checks
defined by the family spec. iOS VoiceOver and Android TalkBack MUST each be
tested when support for both is claimed. Exploratory review MUST exercise
compositions, cancellation, error recovery, nested layers, long and localized
content, zoom, forced colors, reduced motion, coarse pointer, and teardown
risks applicable to the workflow. Missing manual evidence MUST NOT be recorded
as a pass.

## Cadence, merge gates, and release gates

All runs MUST identify the exact revision, lockfile, commands, selected tests,
tool and browser versions, operating system and architecture, artifacts, and
result. A cadence MAY reuse an unchanged, still-current artifact from a stricter
run only when the manifest proves that the candidate artifact is byte-for-byte
identical and every recorded measurement input is exactly equal. Those inputs
include source and packed artifacts, dependency graph and lockfile, fixtures,
acceptance criteria, tool and browser versions and configuration, operating
system and architecture, production mode, target, define values, tree-shaking
settings, externals, entry source, cache state, measurement command, and Brotli
mode, quality, and dictionary parameters. A missing, unrecorded, or different
input MUST rerun the applicable gate; an affected-input assertion alone MUST
NOT authorize reuse.

| Cadence                 | Required execution and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Gate                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull request            | Formatting, lint, types, emitted public-type isolation for affected packages, documentation generation, parity, unit tests, affected real-browser contracts in Chromium/Firefox/WebKit, affected SSR and hydration cases, accessibility automation, affected visual fixtures, React/Alpine conformance, and affected package, export, bundle, or consumer smokes MUST run. A behavior change that affects a critical workflow MUST also attach its required targeted manual record before merge. | Every required result MUST pass; an introduced or expanded `P1` or `P2` MUST NOT merge. Selection logic, sharding, and cached unchanged artifacts MAY optimize the run only when the report names what ran and why omitted areas were unaffected.                                                         |
| Nightly or scheduled CI | The complete unit, three-engine browser, SSR, hydration, accessibility, visual, adapter-conformance, packaging, export, tarball, consumer-smoke, scenario-bundle, CSS-payload, and applicable runtime-responsiveness suites MUST run without affected-file selection. Flake and duration trends MUST be published.                                                                                                                                                                               | Any failure MUST create or update an owned finding through the failure-classification process. A green retry MUST NOT erase the first failure. Nightly evidence MAY inform a release candidate only when it tests the exact candidate revision and artifacts.                                             |
| Release candidate       | Every layer MUST run against the exact packed candidate. The complete browser and manual assistive-technology matrix, two real or production-like consumer validations, traceability matrix, before/after bundle report, known issues, and migration guide MUST be complete.                                                                                                                                                                                                                     | Zero `P1` findings, no hidden known WCAG 2.2 Level AA violation, every budget and required result passing, and approved disposition for open `P2`/`P3` findings MUST be demonstrated before promotion. Required release evidence MUST NOT be skipped because a pull request or nightly run was optimized. |
| Release                 | The release process MUST verify package versions, provenance, checksums, tarball contents, manifest links, and byte identity with the approved release candidate; it MUST rerun publishing and registry-resolution smokes that can differ after publication.                                                                                                                                                                                                                                     | Only the approved candidate artifacts MAY be published. A rebuild, dependency change, failed registry smoke, stale or missing artifact, or manifest mismatch MUST return the candidate to the applicable gate.                                                                                            |

The existing `lint`, `typecheck`, `test`, and `build` CI job names are current
repository integration points. Their presence MUST NOT be interpreted as
permission to omit a required layer. New enforcement MAY run as steps, matrices,
or referenced workflows while preserving repository governance for required
status contexts.

## Browser, SSR, and flake policy

### Determinism and isolation

Tests MUST control time, timers, animation frames, randomness, generated IDs,
locale, time zone, reduced-motion preference, color scheme, direction, viewport,
device scale, input mode, network outcomes, and test data whenever any can
change the expected result. CSS transitions and animations MUST be disabled,
finished through a controlled clock, or awaited through a semantic completion
signal; arbitrary sleeps MUST NOT establish readiness.

Parallel fixtures MUST use unique dynamically assigned ports, isolated browser
contexts, fresh temporary directories, and unique storage and cache namespaces.
A test MUST NOT depend on execution order, a previous test's build, a fixed
shared port, workspace `node_modules` resolution in a consumer fixture, or
untracked machine state. External services MUST be replaced with deterministic
fixtures unless the test is explicitly classified as an external integration
check.

SSR and hydration fixtures MUST capture server HTML, first-client output,
console errors and warnings, recoverable hydration errors, DOM and accessible
relationships, focus, form values, announcements, and event counts. A render
that succeeds without executing hydration MUST NOT pass the hydration contract.

### Failure classification and retries

Every failing required test MUST preserve the first-attempt logs and, for
browser tests, the applicable screenshot, trace, video, DOM or accessibility
snapshot, console, and network artifacts. The owner MUST classify it as one of:

- product or contract defect;
- test or fixture defect;
- infrastructure or external-service failure;
- unsupported environment or incorrect matrix configuration; or
- confirmed nondeterminism with an identified or still-investigated trigger.

Retries MAY run automatically to collect comparison evidence. A test that
passes only after retry does not prove the component contract until the source
of nondeterminism is understood. Retry-only acceptance, averaged-away failure,
and a report that exposes only the final attempt MUST NOT make a required gate
green.

A quarantined test MUST have a linked issue, severity, acceptance criterion,
owner, first-failure evidence, bounded scope, quarantine date, review date, and
an objective removal condition. Quarantine MAY keep unrelated scheduled work
observable, but it MUST NOT satisfy pull-request, release-candidate, release,
WCAG, critical-workflow, or `P1` evidence. The affected contract remains
unproved until the test is restored and passes without relying on retry.

## Bundle and runtime performance

### Reproducible Brotli protocol

Bundle comparison MUST use the Node, pnpm, bundler, minifier, size-analysis,
and Brotli implementations pinned by the repository `package.json` and
lockfile. The evidence MUST record their exact versions and configuration; a
tool upgrade MUST remeasure both comparison revisions before any delta is
accepted.

Each before and after candidate MUST be built from a clean checkout in a fresh
temporary directory with the same production mode, target, define values,
tree-shaking settings, externals, entry source, lockfile, and measurement
command. Tool caches and previous build output MUST be absent. The exact packed
artifact, rather than workspace source aliases, MUST be installed into the
fixture. Measurements MUST report raw, minified, and Brotli byte counts. Brotli
comparison MUST compress the identical minified production bytes in text mode
at quality 11 with no custom dictionary; changing compression parameters
invalidates the comparison.

A standalone fixture MUST import one documented public
[consumer entry](./README.md#consumer-entry) and only the component or adapter
surface under measurement. Framework peers such as
React, React DOM, or Alpine MAY be external only when the report lists them and
uses the same external set before and after. A dependency introduced by the
migration MUST NOT be excluded merely to improve the result. Shared-dependency
deduplication MUST be measured in scenario bundles, not inferred from standalone
entries.

### Budgets and replacement scope

A simple primitive migration MUST add at most `+1.5 kB` Brotli per consumer
entry. A complex component migration MUST add at most `+3 kB` Brotli per
consumer entry. These are delta ceilings, not target entry sizes and not
permission to consume the entire increase. For these gates, `kB` means 1,000
bytes; reports MAY additionally show binary units but MUST evaluate the limits
in decimal bytes.

A larger delta MUST receive an explicit exception in the external-primitive or
architecture [ADR](./README.md#adr). The ADR MUST identify the user-facing
contract gain, rejected native, existing, and vendor alternatives, standalone
and scenario results, CSS and runtime impact, removed code and dependencies,
migration impact, owner, and maintainer approval. Existing budgets MUST NOT be
raised before all replaced production runtime paths, exports, tests tied only to
them, and dead dependencies are removed and the resulting production entry is
measured. Reduced implementation effort alone MUST NOT justify an exception.

### Representative scenario bundles

The [scenario-bundle](./README.md#scenario-bundle) definition is canonical.
This section owns the fixed compositions, measurement fields, and CI gate.

CI MUST protect these five PRD compositions with fixed, reviewable entry
fixtures:

| Scenario          | Required composition                                              |
| ----------------- | ----------------------------------------------------------------- |
| Form              | Button, Input, Checkbox, Select, and validation messaging.        |
| Overlays          | Dialog, Drawer, Popover, Dropdown, and Tooltip.                   |
| Application shell | Shell, Navbar, AppSidebar, WorkspaceSwitcher, and CommandPalette. |
| Scheduling        | DatePicker, TimePicker, CalendarView, and SlotPicker.             |
| Files and data    | DataTable, FileUpload, and FileManager.                           |

Before the first implementation wave, maintainers MUST record a cold-cache
baseline, approved ceiling or permitted delta, fixture revision, and owner for
each scenario. A scenario budget MUST NOT be raised to admit an already-built
candidate; a substantive change follows the same comparison and approval
protocol as an entry-budget change.

Each affected scenario MUST report before, after, absolute delta, percentage
delta, shared dependency contribution, deduplication, budget or baseline, and
result. A migration that affects a shared dependency MUST measure every affected
scenario even when only one family changed. Scenario fixtures MUST import only
public package entries and MUST remain representative applications rather than
synthetic concatenations of standalone measurements.

### CSS payload

CSS evidence MUST build the public aggregate stylesheet and every affected
documented opt-in or subpath through a production consumer fixture. It MUST
report raw, minified, and quality-11 Brotli bytes before and after, emitted CSS
asset count, duplicated declarations, unused or superseded component rules,
font or URL payload, source entry, themes and brands included, and whether the
consumer can select a narrower supported entry. JavaScript savings MUST NOT
hide a CSS regression; CSS and JavaScript results MUST remain separate in the
report.

### Complex-component responsiveness

Every complex component family MUST define representative operations and data
sizes before implementation. At minimum, the measurement MUST cover initial
open or activation, keyboard navigation, selection or commit, update under the
largest approved representative dataset, error or cancellation, and close or
teardown where applicable.

Browser measurements MUST use a pinned Chromium build, fixed viewport and
device profile, controlled network and CPU conditions, production artifacts,
an explicit warm-up, and at least 30 recorded iterations per operation. The
report MUST publish the median, 95th percentile, worst observed result, long
tasks, rendered-node or virtualization assumptions, and event-to-next-paint
measurement boundary. The family specification MUST set its user-facing
threshold before implementation. The candidate MUST meet that threshold and
MUST NOT introduce a statistically repeatable regression hidden by a faster
unrelated operation or by discarded outliers.

### Comparison artifacts

Every performance result MUST preserve:

- the before and after revisions, package versions, tarball checksums, lockfile,
  operating system, architecture, and exact commands;
- pinned tool versions, production configuration, externals, Brotli parameters,
  cache state, fixture source, and input data;
- per-entry, five-scenario, CSS, and applicable runtime tables with raw results,
  deltas, budgets or approved thresholds, and pass or fail;
- bundler metafiles or equivalent module-contribution evidence sufficient to
  explain the delta;
- a list and byte contribution of added, removed, replaced, retained, and
  duplicated code and dependencies; and
- links to the ADR exception and approval when a default budget is exceeded.

A summarized comment without downloadable raw artifacts and commands MUST NOT
satisfy the release evidence.

## Spec-to-test traceability

Every normative acceptance criterion in every approved family specification
MUST have a stable criterion identifier. Before implementation begins, its
traceability row MUST choose at least one of these evidence types:

1. an automated test with repository path and stable test identifier;
2. a manual test record with scenario identifier and required environment; or
3. a documented non-automatable review with the reason automation cannot prove
   the outcome, reviewer role, review method, expected result, and artifact.

An acceptance criterion MAY require multiple evidence types. A screenshot,
manual record, or non-automatable review MUST NOT replace an automated check for
an objectively automatable contract. `Not applicable` requires a family-spec
rationale and maintainer approval; blank, deferred, or missing rows MUST fail
the gate.

The traceability matrix MUST contain:

| Field               | Required content                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Criterion           | Family-spec path, approved version or revision, section, and stable criterion identifier.                                                   |
| Contract            | Observable requirement, affected packages and adapters, states, inputs, themes, direction, viewport, browser, and accessibility conditions. |
| Evidence            | Evidence type, test or scenario identifier, repository or artifact link, cadence, environment, and owner.                                   |
| Result              | Exact tested revision and package artifact, expected result, actual result, status, execution date, and finding link for failure.           |
| Release disposition | Required gate, severity when failed, approved exception where the governing spec permits one, and reviewer.                                 |

Renaming or splitting a criterion MUST update the matrix and linked tests in the
same specification change. Removing a test without replacing its mapped
evidence MUST fail traceability. Generated coverage counts MAY summarize the
matrix, but one hundred percent row coverage MUST NOT be reported when a result
is stale, quarantined, retry-only, or missing its required environment.

## Release evidence manifest

Every release candidate MUST publish a versioned, immutable evidence manifest
for the exact artifacts proposed for release. The manifest MUST contain:

- the foundational and family specification versions or revisions, lifecycle
  states, acceptance-criterion matrix, and approval links;
- every package name, candidate version, source revision, tarball checksum,
  registry provenance or candidate artifact link, and compatible package range;
- the operating systems and versions, architectures, lockfile, exact commands,
  tool versions including Playwright, exact automated browser revisions,
  selected and omitted tests with reasons, start and completion times, and raw
  results;
- links to static, unit, Chromium, Firefox, WebKit, SSR, hydration,
  accessibility, visual, React/Alpine conformance, packaging, export, tarball,
  consumer-smoke, and exploratory artifacts;
- the browser and assistive-technology matrix with browser, operating system,
  assistive technology and versions, input method, critical scenario, expected
  and actual result, exact revision, reviewer, date, and artifact link;
- the before/after bundle report covering standalone entries, all affected PRD
  scenarios, CSS payload, complex-component responsiveness, removed code,
  default budgets, and any approved ADR exception;
- the dependency-decision register with every spike accepted or rejected, its
  ADR and evidence links, selected version, replacement scope, and confirmation
  that no required decision remains unresolved;
- every open known issue with severity, affected criterion and versions,
  workaround, owner, target release, and approved release disposition;
- the complete migration guide from the final `0.x` line, including every
  breaking change, affected package versions, React and Alpine/CSS before and
  after examples where applicable, codemod decision, deprecation and removal
  timing, and accessibility, behavior, SSR, and bundle effects; and
- results from at least two real or production-like consumer applications plus
  final release approvers.

The release MUST publish the exact candidate artifacts represented by the
manifest. A link that can be overwritten, a green summary without raw result, a
missing manual record, an expired browser result, a retry-only pass, or evidence
from different bytes MUST NOT satisfy the manifest. Known issues MUST NOT be
used to waive a `P1`, a known WCAG 2.2 Level AA violation, a missing critical
assistive-technology review, or another mandatory v1.0 gate.

## Current repository evidence and gaps

The repository currently provides useful foundations:

- root scripts aggregate formatting, types, tests, builds, documentation
  generation, parity, packaging, and consumer smoke checks;
- React separates real-Chromium and Node SSR Vitest projects, while Alpine and
  Styles use real-Chromium Browser Mode;
- CI preserves four required status contexts and runs lint, typecheck, test,
  build, documentation drift, parity, package metadata, type resolution,
  size-limit, distribution scans, tarball, Vite, and Next.js checks;
- package smoke tools use fresh temporary directories and validate packed
  artifacts through real consumer builds; and
- size-limit entries provide current absolute tripwires for React and Alpine.

Those checks MUST remain truthfully labeled. The current Chromium-only browser
configuration is not the required Chromium/Firefox/WebKit matrix; render-to-string
alone is not hydration evidence; current absolute size-limit values are not the
before/after `+1.5 kB` and `+3 kB` migration protocol; and current consumer
smokes do not by themselves provide the complete accessibility, visual,
assistive-technology, scenario-bundle, or release manifest. This specification
does not authorize a runtime or CI change; approved implementation plans MUST
close each gap before the affected contract claims v1.0 evidence.

## Acceptance criteria

Before this document moves to `Approved`, reviewers MUST verify every criterion:

- [x] `P1`, `P2`, and `P3` define impact, examples, response expectations,
      merge and release effects, and any known WCAG 2.2 Level AA failure,
      keyboard-blocked primary task, focus escape from an active modal, data
      loss, or broken package entry is `P1`;
- [x] stable eligibility requires an `Implemented` family spec, complete current
      evidence, public documentation and migration material, and zero open
      `P1` findings;
- [x] static, unit, real-browser, SSR and hydration, accessibility, visual,
      React/Alpine conformance, packaging and consumer smoke, and manual review
      form cumulative layers with explicit pull-request, nightly, release-candidate,
      and release cadence;
- [x] the automated matrix preserves the exact Chromium, Firefox, and WebKit
      revisions from the pinned Playwright version plus required Windows/NVDA,
      macOS/VoiceOver, and conditional mobile records, and evidence records the
      Playwright, browser, operating-system, and assistive-technology versions;
- [x] deterministic clocks, animations, environments, unique ports, isolated
      fixtures, retry evidence, failure classification, and owned quarantine
      prevent retry-only acceptance from proving a contract;
- [x] SSR evidence covers server render, first client render, hydration,
      portals, IDs, environment state, input, focus, announcements, Alpine
      reconciliation, delayed initialization, and no-JavaScript behavior;
- [x] public-type isolation inspects source, emitted declarations, packed
      artifacts, consumer compilation, examples, and generated documentation;
- [x] the Brotli protocol uses pinned tooling, clean cold-cache packed artifacts,
      fixed production inputs, quality 11 text compression, standalone entries,
      all five PRD scenarios, separate CSS results, complex-component runtime
      measurements, and reproducible comparison artifacts;
- [x] simple primitive migrations add at most `+1.5 kB` Brotli per consumer
      entry, complex component migrations add at most `+3 kB`, and larger
      deltas require an approved ADR after replaced production code and
      dependencies are removed and measured;
- [x] every normative family-spec acceptance criterion maps to an automated
      test, manual test record, or justified documented non-automatable review;
- [x] the immutable release evidence manifest records spec and package versions,
      commands and results, artifact links, the browser and assistive-technology
      matrix, bundle and runtime reports, known issues, consumer validations,
      migration guide, and approvals for the exact published bytes; and
- [x] approval authority follows the [shared lifecycle](./README.md#lifecycle):
      design-system maintainers approve the transition, the PRD owner also
      approves any product scope or v1.0 gate change, and required technical or
      accessibility reviews are recorded as evidence rather than as additional
      approval authorities.
