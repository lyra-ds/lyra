# Lyra V1 Core Beta Release Design

**Status:** Approved

**Date:** 2026-08-27

**Decision owner:** Lyra maintainer

## 1. Decision summary

Lyra will close the current delivery in two milestones instead of treating the
entire historical V1 roadmap as one release unit.

1. The first milestone is a consolidated beta release. It integrates the
   controlled FileUpload work, publishes `@lyra-ds/styles` and
   `@lyra-ds/react` as `0.5.0`, publishes `@lyra-ds/alpine` as `0.6.0`, and
   requires the complete automated release matrix.
2. The second milestone is the deliberate `1.0.0` release. It removes the
   remaining P1 contracts in Tabs, DataTable, and the overlay family, closes
   their automated acceptance matrices, and then promotes all three packages
   through major Changesets.

Manual Windows/NVDA and macOS/VoiceOver evidence is deferred in both
milestones. It remains useful post-release evidence, must be reported as not
executed when absent, and must never be represented as a pass. It is not a
merge or release blocker under the Automated Core profile defined here.

This decision supersedes earlier manual assistive-technology release-blocker
language only for releases that explicitly use the Automated Core profile. It
does not weaken any automated browser, accessibility, SSR, hydration,
packaging, performance, or consumer-smoke gate.

## 2. Context

The repository already has a pinned Playwright container and a CI browser
matrix for Chromium, Firefox, and WebKit. The public support guide and Phase 0
index still describe that matrix as Chromium-only, so public claims currently
lag the implemented gate.

The FileUpload migration has an approved family specification, controlled
React and Alpine implementations, CSS and adapter tests, React 18/19 coverage,
bundle and runtime evidence, a revision-bound Cloudflare preview, and passing
automated scenarios `DF-FU-17` and `DF-FU-18`. Its ingestion command currently
requires the separate manual `DF-FU-M01` and `DF-FU-M02` archives, even when a
release intentionally adopts an automated-only profile.

The remaining catalog is not uniformly eligible for a stable claim. In
particular, the approved interaction specification still names Tabs,
DataTable, and the overlay family as P1 contracts that V1 must replace. A
package-wide `1.0.0` now would either misrepresent those contracts or require a
special SemVer exemption for beta exports. This design rejects that exemption
and retains the existing `0.x` breaking-change convention until those P1
contracts are removed.

## 3. Goals

- Publish the completed FileUpload contract without requiring human evidence
  collection.
- Make the public release profile and evidence gap truthful in English and
  Brazilian Portuguese.
- Separate component stability from adapter availability in the public
  support matrix.
- Reuse the existing three-engine CI, evidence archive reader, ingestion
  transaction, Changesets, and release workflow.
- Fail closed on missing, invalid, stale, or mismatched automated evidence.
- Produce a reviewable beta release candidate before any merge, deployment, or
  npm publication.
- Preserve a direct path to `1.0.0` without creating new beta-specific package
  namespaces or SemVer exceptions.

## 4. Non-goals

- Do not migrate Tabs, DataTable, Dialog, Drawer, BottomSheet, Popover,
  Dropdown, Tooltip, CommandPalette, or WorkspaceSwitcher in the beta
  milestone.
- Do not redesign component APIs, markup, styles, or runtime behavior outside
  the already completed FileUpload delivery.
- Do not fabricate manual records, reviewers, screenshots, recordings,
  operating-system metadata, or assistive-technology results.
- Do not remove the existing full manual ingestion mode.
- Do not weaken the pinned browser revisions, bundle budgets, performance
  thresholds, accessibility automation, packaging checks, or consumer smokes.
- Do not publish `1.0.0` from the current minor Changesets.
- Do not merge to `main`, deploy production, or publish npm packages without a
  separate explicit checkpoint after the release candidate is green.

## 5. Release profiles

### 5.1 Full profile

The current evidence behavior remains the default and is named the Full
profile. It requires exactly:

- one approved `PASS` record for `DF-FU-M01`;
- one approved `PASS` record for `DF-FU-M02`;
- a derived `PASS` for `DF-FU-17`;
- a derived `PASS` for `DF-FU-18`;
- one exact full revision;
- one immutable deployment origin; and
- locale-correct immutable routes.

Existing CLI calls with `--automation` and one or two `--bundle` options retain
their current meaning and output. The default must not silently become
automated-only.

### 5.2 Automated Core profile

The Automated Core profile is selected only with the explicit CLI pair
`--profile automated-core`. It requires:

- exactly one automation archive;
- no manual `--bundle` option;
- valid manifest and archive structure;
- exactly `DF-FU-17` and `DF-FU-18` automated records;
- a derived `PASS` for both scenarios;
- complete real artifact sets required by each passing record;
- one exact full revision and immutable deployment origin; and
- locale-correct immutable routes.

The profile produces the same deterministic sibling Markdown and artifact
directory transaction as the Full profile. The generated record must include:

- `Release profile: Automated Core`;
- `Overall automated result: PASS`;
- `Manual assistive-technology evidence: deferred-by-release-profile`;
- no manual result row, artifact, reviewer, or implied pass; and
- the normalized automated records and their verified artifacts.

Providing `--bundle` together with `--profile automated-core`, omitting the
automation archive, using an unknown profile, or supplying a failed or partial
automated record must fail before publication.

## 6. Stability model and public documentation

Adapter support and lifecycle stability answer different questions and must
remain separate:

- adapter support describes whether CSS, React, Alpine, or Blade has a
  documented contract;
- lifecycle stability describes whether that component contract is
  `Experimental`, `Beta`, `Stable`, or `Deprecated`.

`apps/docs/lib/components.ts` remains the single catalog source of truth and
adds an explicit stability value to every component entry. No implicit
fallback may classify a new entry without review.

For the consolidated beta:

- FileUpload is `Stable` under the Automated Core profile;
- every other catalog component is `Beta`;
- Tabs, DataTable, and every overlay-family component are additionally named
  as the remaining P1 migration boundary; and
- no catalog entry is initially marked `Experimental` or `Deprecated`.

The support matrix presents one component-level Stability column alongside the
existing stack support columns. English and Brazilian Portuguese copy explain
that a stable FileUpload claim is based on automated evidence and that manual
assistive-technology review is deferred, not passed.

The public support guide and Phase 0 evidence index must report the implemented
pinned Chromium, Firefox, and WebKit CI matrix. Stale statements that the
current CI is Chromium-only must fail a documentation-policy test.

The FileUpload family specification moves its FileUpload implementation wave
to `Implemented under Automated Core`; Table, DataTable, and FileManager remain
boundary-only and are not promoted by that status change.

## 7. Evidence flow

The beta evidence flow is:

1. Run the guarded evidence workflow for the reviewed candidate revision.
2. Resolve the immutable Cloudflare deployment.
3. Require `DF-FU-17` and `DF-FU-18` to pass and package their real artifacts.
4. Download the workflow archive.
5. Invoke ingestion with `--profile automated-core --automation <path>`.
6. Validate and normalize the archive through the existing reader and
   validators.
7. Publish the deterministic Markdown and artifact directory through the
   existing no-clobber transaction.
8. Review and commit the generated evidence with the release-candidate changes.

The existing transaction, lock, recovery, no-clobber publication, and
idempotence rules remain unchanged. Profile selection changes which validated
record sets are required; it does not relax filesystem safety.

## 8. Failure handling

The release must stop without a partial evidence record when any of the
following occurs:

- the profile or CLI topology is invalid;
- an archive, manifest, result, or artifact is missing or malformed;
- either automated result is not derived `PASS`;
- revision, origin, locale, or immutable route differs;
- the destination pair already contains different bytes;
- an ingestion lock or recovery state cannot be resolved safely;
- the public stability matrix omits a component or uses an unknown lifecycle;
- documentation claims manual evidence passed when it did not run;
- documentation describes the implemented three-engine CI as Chromium-only;
- a focused or repository release gate fails; or
- the release candidate differs from the artifacts later selected for
  publication.

Infrastructure unavailability is reported as unavailable, not as a product
pass or failure. It blocks the beta release until the required automated gate
can execute successfully in CI.

## 9. Verification and CI

### 9.1 Focused verification

The implementation must add discriminating tests for:

- strict parsing of `--profile automated-core`;
- preservation of the default Full profile;
- rejection of manual bundles in Automated Core;
- automation-only PASS publication;
- failed, partial, duplicate, mismatched, and malformed automation archives;
- deterministic, idempotent, no-clobber ingestion under both profiles;
- exact `deferred-by-release-profile` Markdown output with no manual PASS;
- explicit stability for every catalog component;
- FileUpload Stable and all other entries Beta;
- localized stability labels and Automated Core disclosure; and
- absence of stale Chromium-only CI claims.

### 9.2 Repository gates

Before a pull request is eligible, the candidate must pass:

- formatting and lint;
- TypeScript checks and emitted public-type isolation;
- unit and pure-logic tests;
- Chromium, Firefox, and WebKit Browser Mode suites in the pinned container;
- React 18 and React 19 types, SSR, and hydration compatibility;
- accessibility automation, parity, and FileUpload conformance;
- build, documentation generation, and drift checks;
- bundle and runtime FileUpload thresholds;
- `publint`, `attw`, size limits, packed Vite/Next consumer smokes, and CDN
  scans; and
- `git diff --check` with a clean tracked worktree.

The four existing CI job names `lint`, `typecheck`, `test`, and `build` remain
unchanged. New policy assertions run inside those existing jobs or existing
package test suites; no new required status context is introduced.

## 10. Versioning and rollout

### 10.1 Consolidated beta

The existing controlled FileUpload Changeset remains `minor` for Styles,
React, and Alpine. From the current versions it produces:

- `@lyra-ds/styles@0.5.0`;
- `@lyra-ds/react@0.5.0`; and
- `@lyra-ds/alpine@0.6.0`.

The beta pull request must merge before the Changesets version pull request is
updated. The release workflow remains responsible for OIDC publication,
provenance, tags, and GitHub releases.

### 10.2 Deliberate 1.0

The later `1.0.0` milestone requires:

- no open P1 contract for Tabs, DataTable, or overlays;
- implemented automated acceptance matrices for those families;
- all Automated Core release gates passing against the exact packed
  candidates;
- public migration guidance and known-issue disposition;
- all three compatibility ranges recorded; and
- deliberate `major` Changesets for each package.

Manual assistive-technology evidence remains non-blocking and truthfully
reported under Automated Core. A future maintainer may collect it without
changing the release profile or historical result.

## 11. Remote-operation checkpoints

Implementation, local verification, commits, and a review-ready branch are one
work unit. The following actions remain separate checkpoints because they
change shared external state:

1. push the design and implementation branch;
2. open the beta pull request;
3. merge the beta pull request to `main`, which can deploy production and
   update the Changesets release pull request;
4. merge the version pull request, which can publish npm packages and tags.

The user must approve the merge and publication checkpoints after reviewing
their exact candidate SHA and green gates.

## 12. Acceptance criteria

- [x] The repository defines Full and Automated Core evidence profiles without
      changing the Full profile's existing behavior.
- [x] Automated Core ingestion succeeds only for one exact valid automation
      archive containing passing `DF-FU-17` and `DF-FU-18` evidence.
- [x] Automated Core output records manual evidence as
      `deferred-by-release-profile` and contains no fabricated manual result.
- [x] Both ingestion profiles preserve deterministic, atomic, idempotent, and
      no-clobber publication behavior.
- [x] Every documented component has an explicit lifecycle stability value.
- [x] FileUpload is Stable and every other component is Beta for the
      consolidated beta release.
- [x] English and Brazilian Portuguese support documentation expose stability,
      Automated Core limitations, and the current three-engine CI truthfully.
- [x] The FileUpload implementation wave is recorded as Implemented under
      Automated Core without promoting Table, DataTable, or FileManager.
- [ ] The existing four CI status contexts run all applicable automated release
      gates and pass for the exact candidate revision.
- [x] The release candidate has the expected minor version plan and no
      `1.0.0` package version.
- [ ] Merge and npm publication occur only after their separate explicit
      checkpoints.
