# Overlay foundation ADR

Use this record for every decision that adopts, replaces, or retains an
overlay foundation. Complete it with immutable evidence for the exact candidate
revision and artifacts under review.

## Status and owners

| Field                                  | Record                                                     |
| -------------------------------------- | ---------------------------------------------------------- |
| Status                                 | [Proposed, accepted, rejected, or superseded]              |
| Overlay family and affected components | [Family and components]                                    |
| Decision owner                         | [Name or team]                                             |
| Implementation owner                   | [Name or team]                                             |
| Evidence owner                         | [Name or team]                                             |
| ADR date                               | [YYYY-MM-DD]                                               |
| Exact candidate revision and artifacts | [Commit, package versions, checksums, and immutable links] |

## Accepted contract

State the approved requirement, current failure, and the observable Lyra
contract that remains unchanged or intentionally changes. Link the governing
architecture and quality specification revisions.

| Criterion                     | Expected result                | Actual result       | Exact revision/artifact       | Artifact link        | Owner          | Disposition                |
| ----------------------------- | ------------------------------ | ------------------- | ----------------------------- | -------------------- | -------------- | -------------------------- |
| [Approved contract criterion] | [Required observable behavior] | [Observed behavior] | [Commit and package artifact] | [Immutable evidence] | [Name or team] | [Pass, fail, or exception] |

## Candidates

Compare each candidate against the same contract, browser, assistive-technology,
SSR, bundle, replacement, and migration requirements.

| Candidate               | Version/revision         | Contract gain          | Constraints and risks   | Evaluation disposition |
| ----------------------- | ------------------------ | ---------------------- | ----------------------- | ---------------------- |
| Incumbent Lyra          | [Commit/package version] | [Observed gain or gap] | [Constraints and risks] | [Continue or reject]   |
| Radix                   | [Version/revision]       | [Observed gain or gap] | [Constraints and risks] | [Continue or reject]   |
| Base UI                 | [Version/revision]       | [Observed gain or gap] | [Constraints and risks] | [Continue or reject]   |
| Active Zag.js direction | [Version/revision]       | [Observed gain or gap] | [Constraints and risks] | [Continue or reject]   |

## Rejected alternatives

Record native HTML, the incumbent implementation, and every viable primitive
candidate rejected against the accepted contract. Reduced implementation effort
alone is not an acceptance rationale.

| Alternative   | Exact revision/artifact        | Expected result     | Actual result       | Rejection rationale                              | Artifact link        | Owner          | Disposition |
| ------------- | ------------------------------ | ------------------- | ------------------- | ------------------------------------------------ | -------------------- | -------------- | ----------- |
| [Alternative] | [Commit, version, or artifact] | [Required behavior] | [Observed behavior] | [Why it fails or is inferior under the contract] | [Immutable evidence] | [Name or team] | Rejected    |

## Public API isolation

Document the Lyra-owned adapter boundary. Public declarations, callbacks,
refs, options, generated documentation, selectors, and examples must not leak
vendor types, DOM, or `data-*` contracts.

| Check                                 | Expected result                  | Actual result     | Exact revision/artifact       | Artifact link        | Owner          | Disposition                |
| ------------------------------------- | -------------------------------- | ----------------- | ----------------------------- | -------------------- | -------------- | -------------------------- |
| [Public API/type/DOM isolation check] | [Lyra-owned observable contract] | [Observed result] | [Commit and package artifact] | [Immutable evidence] | [Name or team] | [Pass, fail, or exception] |

## Browser and assistive-technology evidence

Include automated Chromium, Firefox, and WebKit evidence and the applicable
manual Windows/NVDA, macOS/VoiceOver, and mobile scenarios. Record operating
system, browser and assistive-technology versions, input method, and scenario.

| Environment and scenario               | Expected result     | Actual result       | Exact revision/artifact       | Artifact link        | Owner          | Disposition                |
| -------------------------------------- | ------------------- | ------------------- | ----------------------------- | -------------------- | -------------- | -------------------------- |
| [Browser/OS/AT version/input/scenario] | [Required behavior] | [Observed behavior] | [Commit and package artifact] | [Immutable evidence] | [Name or team] | [Pass, fail, or exception] |

## SSR and hydration evidence

Record server render, first client render, hydration, portal, generated-ID,
and no-JavaScript results for the exact candidate revision.

| Scenario                                        | Expected result     | Actual result       | Exact revision/artifact       | Artifact link        | Owner          | Disposition                |
| ----------------------------------------------- | ------------------- | ------------------- | ----------------------------- | -------------------- | -------------- | -------------------------- |
| [SSR, hydration, portal, ID, or no-JS scenario] | [Required behavior] | [Observed behavior] | [Commit and package artifact] | [Immutable evidence] | [Name or team] | [Pass, fail, or exception] |

## Standalone bundle comparison

Measure one documented public consumer entry per affected component with the
same externals, pinned tools, build configuration, and Brotli protocol before
and after the change.

| Entry                               | Before  | After   | Absolute delta | Percentage delta | Shared contribution | Deduplication                                      | Limit    | Pass/fail      |
| ----------------------------------- | ------- | ------- | -------------- | ---------------- | ------------------- | -------------------------------------------------- | -------- | -------------- |
| [Package/public entry and artifact] | [Bytes] | [Bytes] | [Bytes]        | [Percent]        | [Bytes and source]  | [Not applicable for standalone or measured result] | [Budget] | [Pass or fail] |

## Scenario bundle comparison

Measure every representative application composition affected by shared
dependencies; deduplication must be measured rather than inferred.

| Scenario                | Before  | After   | Absolute delta | Percentage delta | Shared contribution | Deduplication                       | Limit    | Pass/fail      |
| ----------------------- | ------- | ------- | -------------- | ---------------- | ------------------- | ----------------------------------- | -------- | -------------- |
| [Scenario and artifact] | [Bytes] | [Bytes] | [Bytes]        | [Percent]        | [Bytes and source]  | [Measured shared-dependency result] | [Budget] | [Pass or fail] |

## CSS and runtime impact

Record CSS payload changes and runtime-responsiveness evidence, including the
measurement environment, command, and any approved exception.

### Shared measurement context and immutable artifacts

Use one shared context for the standalone, scenario, CSS, and runtime results.
Each link must resolve to immutable before or after bytes, raw results, and the
bundler metafile or equivalent module-contribution evidence.

| Artifact metadata            | Before record                              | After record                               |
| ---------------------------- | ------------------------------------------ | ------------------------------------------ |
| Revision and package version | [Commit and package versions]              | [Commit and package versions]              |
| Packed artifact and checksum | [Tarball URL and SHA-256]                  | [Tarball URL and SHA-256]                  |
| Lockfile and checksum        | [Lockfile revision and SHA-256]            | [Lockfile revision and SHA-256]            |
| Raw artifact and metafile    | [Immutable raw artifact and metafile link] | [Immutable raw artifact and metafile link] |
| Exact measurement command    | [Command]                                  | [Command]                                  |

| Shared measurement context        | Record                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Operating system and architecture | [OS/version and architecture]                                                |
| Pinned tool versions              | [Node, pnpm, bundler, minifier, size analysis, Brotli, and browser versions] |
| Production configuration          | [Mode, target, define values, tree-shaking settings, and externals]          |
| Fixture source and input data     | [Public entry, fixture revision, and representative data]                    |
| Cache and checkout state          | [Fresh temporary directory; cold cache; no prior build output]               |
| Brotli parameters                 | [Text mode, quality 11, no custom dictionary]                                |

### CSS payload evidence

Build the public aggregate stylesheet and every affected documented opt-in or
subpath in a production consumer fixture. Keep CSS evidence separate from
JavaScript results.

| Source entry and artifact             | Themes and brands included | Narrower supported entry     | Before raw CSS | Before minified CSS | Before quality-11 Brotli | After raw CSS | After minified CSS | After quality-11 Brotli | CSS asset count before → after | Duplicate or superseded rules        | Font or URL payload before → after | Immutable artifact link | Limit    | Pass/fail      |
| ------------------------------------- | -------------------------- | ---------------------------- | -------------- | ------------------- | ------------------------ | ------------- | ------------------ | ----------------------- | ------------------------------ | ------------------------------------ | ---------------------------------- | ----------------------- | -------- | -------------- |
| [Aggregate, opt-in, or subpath entry] | [Themes and brands]        | [Yes/no and supported entry] | [Bytes]        | [Bytes]             | [Bytes]                  | [Bytes]       | [Bytes]            | [Bytes]                 | [Count → count]                | [Declarations/rules and disposition] | [Bytes, URLs, and disposition]     | [Raw CSS and report]    | [Budget] | [Pass or fail] |

### Runtime responsiveness evidence

Use production artifacts and a pinned Chromium build. Record at least 30
iterations for each representative operation: open or activation, keyboard
navigation, selection or commit, largest approved data update, error or
cancellation, and close or teardown.

| Operation and representative data | Chromium revision | Viewport and device           | CPU and network         | Warm-up     | Recorded iterations (≥30) | Median     | P95        | Worst observed | Long tasks       | Rendered-node or virtualization assumptions | Event-to-next-paint measurement boundary | Threshold               | Immutable raw-result artifact link | Pass/fail      |
| --------------------------------- | ----------------- | ----------------------------- | ----------------------- | ----------- | ------------------------- | ---------- | ---------- | -------------- | ---------------- | ------------------------------------------- | ---------------------------------------- | ----------------------- | ---------------------------------- | -------------- |
| [Operation and data size]         | [Pinned revision] | [Viewport and device profile] | [Controlled conditions] | [Procedure] | [Count]                   | [Duration] | [Duration] | [Duration]     | [Count/duration] | [Assumptions]                               | [Boundary]                               | [User-facing threshold] | [Raw iterations and trace]         | [Pass or fail] |

## Removed code and dependencies

List every superseded runtime path, export, test, dependency, and byte total
removed. Explain every retained responsibility; duplicate production ownership
is not permitted.

| Item                                            | Expected result                      | Actual result     | Exact revision/artifact       | Artifact link        | Owner          | Disposition                         |
| ----------------------------------------------- | ------------------------------------ | ----------------- | ----------------------------- | -------------------- | -------------- | ----------------------------------- |
| [File, export, test, dependency, or byte total] | [Removal or retained responsibility] | [Observed result] | [Commit and package artifact] | [Immutable evidence] | [Name or team] | [Pass, fail, or approved retention] |

## Migration impact

Identify public API, DOM, state, event, CSS, package, adapter, and documentation
effects with before/after examples, compatibility, and release plan.

| Surface                                                  | Expected result         | Actual result                              | Exact revision/artifact       | Artifact link        | Owner          | Disposition                               |
| -------------------------------------------------------- | ----------------------- | ------------------------------------------ | ----------------------------- | -------------------- | -------------- | ----------------------------------------- |
| [API, DOM, state, event, CSS, package, adapter, or docs] | [Migration requirement] | [Observed impact and before/after example] | [Commit and package artifact] | [Immutable evidence] | [Name or team] | [Compatible, breaking, or not applicable] |

## Decision and consequences

Record the selected candidate, exact version, decision rationale, required
implementation scope, accepted exceptions, and consequences. A decision cannot
proceed with failed WCAG 2.2 Level AA or SSR evidence, a public vendor-type
leak, an unapproved bundle failure, or duplicated replaced infrastructure.

| Decision                             | Record                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Selected candidate and exact version | [Candidate/version]                                                       |
| Rationale and contract gain          | [Why this candidate satisfies the approved contract better]               |
| Required replacement scope           | [Infrastructure, exports, tests, dependencies, and byte totals to remove] |
| Exceptions and expiry                | [Approved exception link, owner, and expiry; or none]                     |
| Consequences and follow-up           | [Implementation, release, and migration actions]                          |

## Approvals

All approvals apply to the exact revision and artifacts recorded above. Cite
the repository guidance this ADR supersedes, if any.

| Decision owner           | Accessibility review         | Maintainer approval            | Date         | Superseded repository guidance |
| ------------------------ | ---------------------------- | ------------------------------ | ------------ | ------------------------------ |
| [Name and approval link] | [Reviewer and approval link] | [Maintainer and approval link] | [YYYY-MM-DD] | [Guidance path/link or none]   |
