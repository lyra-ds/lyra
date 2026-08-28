# Lyra v1.0 Phase 1 — System accessibility design

**Status:** Draft — reviewed design, awaiting maintainer review of this file

**Date:** 2026-08-13

**Owner:** Lyra maintainers

**Scope:** Cross-catalog accessibility remediation and evidence for
`@lyra-ds/styles`, `@lyra-ds/react`, `@lyra-ds/alpine`, and the existing
required CI `test` job.

**Governing documents:**

- [Lyra v1.0 roadmap PRD](./2026-08-12-lyra-v1-roadmap-prd.md#phase-1--system-accessibility)
- [Tokens and visual language](./lyra-v1/02-tokens-visual-language.md)
- [Interaction and accessibility](./lyra-v1/03-interaction-accessibility.md)
- [Quality and performance](./lyra-v1/05-quality-performance.md)
- [Phase 0 evidence index](../baselines/lyra-v1/README.md)

## 1. Decision summary

Phase 1 removes catalog-wide accessibility blockers before Lyra changes its
interaction foundation. It introduces reproducible Chromium, Firefox, and
WebKit execution in the existing `test` CI job, corrects every currently
suppressed color-contrast output, adds forced-colors and reduced-motion
coverage, establishes an RTL contract through logical CSS properties, and
audits target size against WCAG 2.2 AA and Lyra's touch ergonomics target.

Automated changes may merge one wave at a time after the required technical
checks and automated code reviews complete without actionable findings. Manual
Windows/NVDA and macOS/VoiceOver records remain a later, explicit evidence gate
for Full-profile completion: they remain `pending` until executed and never
count as a pass by omission. Under Automated Core, Phase 1 can report the
implemented automation complete while labeling the non-blocking manual evidence
`deferred-by-release-profile`; only the Full profile withholds completion until
those manual records are recorded.

This phase does not select or migrate an overlay primitive. That work remains
Phase 2 and requires its own approved overlay-family specification.

### 2026-08-27 amendment: Automated Core release profile

The [canonical Automated Core release profile](./lyra-v1/README.md#automated-core-release-profile)
and the approved
[Lyra V1 Core Beta Release Design](./2026-08-27-lyra-v1-core-beta-release-design.md)
make the implemented automated Phase 1 matrix release-blocking for the active
beta. The manual procedures remain required for Full-profile releases and
optional post-release evidence under Automated Core. Missing manual evidence is
non-blocking only under Automated Core, MUST be labeled
`deferred-by-release-profile`, and MUST NOT be represented as a pass.

## 2. Current gaps and desired outcome

The Phase 0 evidence index now records that CI runs the pinned Playwright 1.62.1
Chromium, Firefox, and WebKit matrix inside the existing `test` job. Manual
NVDA and VoiceOver evidence remains deferred and non-blocking under Automated
Core; no assistive-technology review is represented as completed. The current
React and Alpine axe helpers each suppress the same seven failing color pairs
through an allowlist. The styles package has reduced-motion rules but no
forced-colors rules, and direction-sensitive CSS still uses physical properties
in catalog components.

At the end of Phase 1:

- the same supported Playwright revisions execute in Chromium, Firefox, and
  WebKit from a reproducible container;
- no known WCAG 2.2 AA contrast violation is filtered, accepted by helper code,
  or hidden by a retry;
- affected styles preserve readable content, boundaries, state, and focus in
  forced colors, reduced motion, LTR, and RTL;
- every interactive target has either the required documented size evidence or
  a specific WCAG 2.5.8 exception and coarse-pointer treatment;
- each wave publishes test, browser, artifact, and review status; and
- required NVDA and VoiceOver workflows have actionable scripts and a truthful
  pending-or-complete record.

## 3. Browser execution architecture

### 3.1 Container contract

Local and CI browser runs use the official Playwright Noble image:

```text
mcr.microsoft.com/playwright:v1.62.1-noble
@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e
```

The tag and digest are both recorded so that the human-readable Playwright
release and the immutable image identity are reviewable. The implementation
uses the digest as the runnable pin. The image was verified on 2026-08-13 to
provide Node `24.18.1` and Playwright `1.62.1`, matching the repository's
`playwright@1.62.1` dependency and `>=24 <25` Node engine range.

The container runs trusted repository tests with `--init` and `--ipc=host`.
It is not a sandbox for untrusted browsing. No custom browser executable or
unrelated browser channel may substitute for the three Playwright-managed
engines pinned by the lockfile.

### 3.2 Test command and CI boundary

A root `test:browsers` command owns the complete browser matrix for Styles,
React, and Alpine. It runs their Browser Mode suites in Chromium, Firefox, and
WebKit and is runnable locally through the same container command used by CI.
Existing SSR and pure-unit suites retain their current execution environment.

The frozen required-check context remains named `test`. The existing job gains
the container and invokes the matrix as a step; it does not create, rename, or
replace a protected check. Browser installation commands become unnecessary
inside that container because the exact browsers and their system dependencies
are already present.

Every browser failure preserves its relevant screenshot, trace, and CI-only
video as a CI artifact. The artifact paths identify the affected package and
retain the exact evidence emitted by the failing browser project.

### 3.3 Coverage selection

The shared test helpers and fixtures make the following variations explicit
when an affected component or style has the corresponding behavior:

| Condition      | Required automated evidence                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| Light and dark | Accepted output has no axe, contrast, semantic, focus, or keyboard regression.             |
| Forced colors  | System colors preserve content, control/state differentiation, and visible focus.          |
| Reduced motion | No decorative or spatial transition is required to perceive state or finish an operation.  |
| RTL            | Direction-sensitive layout and directional semantics match the documented mirror behavior. |
| Coarse pointer | Target-size and alternate interaction assertions cover the relevant control.               |

An irrelevant condition may be omitted only when the wave records why that
condition cannot affect the component and links the governing specification.

## 4. Remediation contracts

### 4.1 Contrast and axe

The seven current allowlisted pairs in the React and Alpine axe helpers are
findings, not exceptions. Each must be traced to the final rendered
foreground/background/state pair, corrected in the appropriate token or
component-state source, and covered by a final composited contrast test in
light, dark, branded, and affected interaction states.

The two duplicate allowlists are deleted only after those tests pass. The
shared axe helper then fails every reported violation, including
`color-contrast`. A test move, retry, filter, disablement, snapshot update, or
severity change cannot close a known WCAG 2.2 AA finding.

Token changes remain exceptional: every changed public token or state value
must identify its affected classes, adapters, themes, brands, migration effect,
and parity result. The explicit accessibility correction is the required
justification under the repository's design-token review rules.

### 4.2 Forced colors and reduced motion

Styles add bounded `@media (forced-colors: active)` behavior where authored
colors would otherwise hide content, controls, boundaries, selected/disabled
state, or focus. The preferred values are appropriate system colors such as
`Canvas`, `CanvasText`, `LinkText`, `ButtonText`, and `Highlight`; the exact
choice is based on each semantic role. `forced-color-adjust: none` is not a
general fix and may be used only under the narrow exception in the tokens
specification.

All animation and transition behavior remains expressed through the token
system. Under `prefers-reduced-motion: reduce`, decorative and spatial motion
must stop or reduce to the shortest non-spatial feedback that preserves
function. Loading, success, error, selection, and focus still provide a
non-motion cue.

### 4.3 RTL and logical properties

Direction-sensitive CSS migrates from physical `left`, `right`,
`margin-left`, `margin-right`, `padding-left`, `padding-right`, and physical
border/inset shorthands to the appropriate logical property. The migration is
incremental by component family and must not rewrite intrinsically physical
coordinates, such as calendar geometry or consumer-supplied plot positions.

Each converted family gains LTR and RTL fixtures. Icons, gradients, shadows,
and motion mirror only when their meaning is directional; neutral icons and
intrinsically directed content remain unchanged. Theme, brand, focus, status,
and forced-colors behavior remain equivalent in both directions.

### 4.4 Target size and coarse pointer

The audit treats `24 × 24 CSS px` as the WCAG 2.5.8 compliance floor and
`44 × 44 CSS px` as Lyra's ergonomics target. A compact target below 44 px is
permitted only with the documented user need, its measured 24 px compliance or
named WCAG exception, a coarse-pointer treatment or equivalent action, and
manual touch evidence. Density, compactness, and catalog scale are not
exceptions by themselves.

Hover-only access is removed from required operations. Drag, path, swipe, and
long-press behavior expose an equivalent single-pointer or keyboard path unless
the interaction is essential to the represented activity.

## 5. Delivery waves

| Wave                          | Outcome                                                                      | Primary evidence                                                     | Merge unit                          |
| ----------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| 1. Browser infrastructure     | Docker-pinned three-engine matrix in the existing `test` job                 | Container smoke, all three engine results, failure artifacts         | One infrastructure PR               |
| 2. Contrast                   | Seven known pairs corrected and axe suppression removed                      | Final composited contrast and clean axe results in affected adapters | One or more focused remediation PRs |
| 3. Environmental presentation | Forced-colors and reduced-motion behavior tested                             | Media-emulation assertions and visual/semantic evidence              | One or more focused style PRs       |
| 4. Direction                  | Logical-property migration and RTL fixtures                                  | LTR/RTL layout and semantic assertions                               | Family-scoped PRs                   |
| 5. Targets                    | Interactive-target inventory, fixes, exceptions, and coarse-pointer behavior | Geometry assertions plus documented exceptions                       | Family-scoped PRs                   |
| 6. Assistive technology       | NVDA and VoiceOver records for critical desktop workflows                    | Manual records with artifacts and finding links                      | Evidence-only or remediation PRs    |

Waves 2 through 5 may overlap only when their changed component families and
evidence do not conflict. Wave 6 may start after Wave 1 establishes the
automated matrix, but the phase exit gate remains blocked until it finishes.

## 6. Evidence and review governance

Each wave maintains a machine-readable or reviewable matrix with requirement,
affected package and adapter, component family, automated scenarios, engines,
artifact links, manual-scenario identifier, and status. The allowed manual
statuses are `pending`, `pass`, `fail`, and `not-applicable` with a documented
approval; a missing entry is invalid and never implies `pass`.

Every named critical desktop workflow has two manual rows:

- Windows, NVDA, and current stable Firefox or Chromium; and
- macOS, VoiceOver, and current stable Safari.

Each row records operating system, browser and version, assistive technology
and version, input method, exact revision, scenario, expected result, actual
result, and an artifact link. Workflows with material narrow-viewport or touch
differences additionally name the required mobile review under the approved
interaction specification.

A wave PR may merge only when all applicable conditions hold:

1. `lint`, `typecheck`, `test`, and `build` are green.
2. Its test/evidence matrix is complete for the automated scope.
3. CodeRabbit and Greptile completed their automated reviews.
4. No actionable CodeRabbit or Greptile comment remains unresolved.
5. The PR template's applicable changeset and documentation requirements are
   satisfied.

Manual review may remain `pending` during these merges. For a Full-profile
release and Full-profile Phase 1 completion it remains required. Under
Automated Core, missing NVDA or VoiceOver evidence is non-blocking optional
post-release evidence labeled `deferred-by-release-profile`, not a pass; a
manual failure still receives P1, P2, or P3 severity and links the affected
acceptance criterion.

## 7. Acceptance criteria

- [ ] Browser Mode runs the exact lockfile-selected Chromium, Firefox, and
      WebKit revisions from the pinned official Docker image in local and CI
      commands, while the required CI context remains `test`.
- [ ] Browser failures retain report, trace, screenshot, and video artifacts
      with enough metadata to reproduce the failing revision and engine.
- [ ] React and Alpine contain no accepted contrast-pair allowlist; every axe
      violation, including color contrast, fails the relevant suite.
- [ ] Every corrected pair has final composited contrast evidence for every
      affected theme, brand, state, and adapter.
- [ ] Affected output preserves content, boundaries, states, and focus in
      forced colors without general `forced-color-adjust: none` use.
- [ ] Affected motion remains understandable and operable with reduced motion.
- [ ] Direction-sensitive component CSS uses logical properties unless the
      physical coordinate is intrinsically physical and documented, with LTR
      and RTL fixture coverage.
- [ ] Every interactive target has measured `24 × 24 CSS px` compliance or a
      named WCAG 2.5.8 exception; every target below Lyra's 44 px goal records
      its user need, coarse-pointer treatment, and manual touch evidence.
- [ ] Every wave PR has green required checks, a complete automated evidence
      matrix, completed CodeRabbit and Greptile reviews, and no actionable
      automated-review finding pending.
- [ ] Under the Full profile, every critical desktop workflow has Windows/NVDA
      and macOS/VoiceOver records. Under Automated Core, absent records are
      optional post-release evidence labeled `deferred-by-release-profile` and
      are never represented as passed.
- [ ] The roadmap and Phase 0 evidence index are updated to report Phase 1
      complete under the selected profile only after all applicable gates pass
      and no P1 finding remains open.

## 8. Out of scope

- Selecting, adopting, or migrating a React overlay/menu primitive.
- Replacing Lyra's portal, focus, presence, dismiss, or scroll-lock
  infrastructure.
- Treating Playwright WebKit as Safari or as VoiceOver evidence.
- Automating NVDA or VoiceOver and representing its output as a manual review.
- Changing catalog APIs except where a documented accessibility correction
  requires a compatible or explicitly migrated contract change.

## 9. Change record

| Date       | Decision                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | Approved the browser infrastructure: official Playwright 1.62.1 Noble image pinned by digest; Chromium, Firefox, and WebKit run in Docker under the existing required `test` job. |
| 2026-08-13 | Approved wave-by-wave automated merges after green required checks and resolved CodeRabbit and Greptile findings; NVDA/VoiceOver evidence remains an explicit later gate.         |
