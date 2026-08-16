# Next Delivery Evidence Cycle Design

**Status:** Approved

**Date:** 2026-08-15

**Scope:** A short, read-only evidence cycle that selects the next bounded Lyra delivery

## 1. Purpose

The previous prioritized backlog selected an Alpine public API compatibility
audit. That audit found no product defect or public-contract mismatch, so it
does not supply an automatic follow-up implementation.

This cycle will inspect current repository and product evidence, rank a small
set of eligible candidates, and audit the highest-ranked candidate first. It
may audit the next-ranked candidate after a rejection, with at most two focused
audits for the entire cycle as defined in section 5. Its output is a
reproducible decision about the next delivery, not a production change.

## 2. Outcome

The cycle produces one evidence artifact at
`docs/superpowers/backlog/2026-08-15-next-delivery-evidence.md`. The artifact
records the baseline, evidence sources, candidates, scoring, focused audit,
selection, and next delivery contract.

The cycle succeeds when it identifies one uniquely selected delivery with:

- an affected public package or supported consumer flow;
- a demonstrated problem, gap, or roadmap-backed fallback;
- bounded inclusions and exclusions;
- objective acceptance criteria;
- applicable test, build, accessibility, packaging, and documentation gates;
- compatibility and release expectations.

No production source, dependency, public API, package version, or generated
artifact changes during this cycle.

## 3. Baseline and isolation

The evidence branch starts from the latest fetched `origin/main`. Before
collecting evidence, the executor runs a fast-forward-only pull from
`origin/main` and records the resulting commit SHA and collection time.

The existing local `main` checkout is not rewritten, rebased, reset, or used as
the evidence baseline. This preserves its divergent local commits and unrelated
`.pnpm-store/` directory.

## 4. Evidence funnel

### 4.1 Broad collection

The first pass collects only decision-relevant signals from:

1. required CI and repository gates on the current default branch;
2. open GitHub issues and pull requests that describe supported user flows;
3. public package contracts, documentation claims, and package exports;
4. the approved v1 PRD, foundational specifications, and roadmap exit gates;
5. focused searches for unresolved work markers and explicit suppressions;
6. recent path-scoped commit volume across supported package surfaces;
7. existing React, Alpine, and CSS conformance or parity evidence.

Collection remains broad enough to avoid preselecting overlays, but it does not
inventory every file or rerun the entire test matrix. Expensive gates run only
when they are necessary to confirm the selected candidate.

### 4.2 Candidate eligibility

A candidate is eligible only when it has all of the following:

- a concrete public behavior, release gate, or documented support claim;
- evidence that can be cited and reproduced;
- a scope that can become one delivery plan;
- a plausible automated or manual proof of completion.

Internal cleanup, speculative refactoring, unsupported adapters, and feature
ideas without current evidence are excluded. The artifact should contain two
to five eligible candidates when evidence supports them. It may contain fewer
only when it explicitly records why no additional candidate qualified.

### 4.3 Priority classes

Candidates are classified in this order:

1. failing gate, confirmed defect, or v1 release blocker;
2. gap in a documented supported flow;
3. React, Alpine, or CSS contract-parity gap;
4. documentation or developer-experience mismatch.

This order prevents churn or roadmap preference from outranking demonstrated
consumer harm.

### 4.4 Scoring

Each eligible candidate receives a score out of ten:

| Dimension                     | Range | Meaning                                                         |
| ----------------------------- | ----: | --------------------------------------------------------------- |
| User impact                   |   0–3 | Severity and frequency for supported consumers                  |
| Release or accessibility risk |   0–3 | Risk to v1 gates, accessibility, compatibility, or distribution |
| Automated proof available now |   0–2 | Strength of existing reproducible verification                  |
| Supported-surface reach       |   0–2 | Number and importance of affected public stacks or flows        |

The artifact shows the arithmetic rather than only the total. Ties follow the
governing rule in the sequential-delivery cycle design: after priority class,
prefer the smallest independently releasable change with clear automated
proof. For deterministic application, compare the smaller bounded scope, then
stronger automated proof, then the earliest applicable v1 roadmap phase. If a
tie still remains, the older independently recorded consumer-facing evidence
wins. The selected candidate must therefore be unique.

## 5. Focused audit

Only the selected candidate receives a deeper audit. The audit:

1. states the suspected contract or gap as a falsifiable claim;
2. compares the relevant source, built or packed surface, tests, and public
   documentation;
3. runs the smallest existing commands that can confirm or reject the claim;
4. records exact commands, exit results, and material observations;
5. classifies the claim as confirmed, rejected, or inconclusive.

A rejected claim cannot authorize an implementation. The runner may audit the
next ranked eligible candidate, with a limit of two focused audits for the
entire cycle. If neither survives, the cycle uses the fallback in section 6.
An inconclusive claim may remain selected only when the next delivery is
explicitly an evidence-producing spike with a bounded completion condition; it
cannot be described as a product defect.

## 6. Fallback

If no defect, failing gate, supported-flow gap, or parity mismatch survives the
focused audit, the cycle selects a bounded overlay-foundation readiness audit.
This fallback follows the approved v1 PRD, which names the overlay family as the
first implementation-family specification and Phase 2 interaction
infrastructure as the next roadmap outcome.

The fallback may compare current Dialog, Drawer, BottomSheet, Popover,
Dropdown, and Tooltip contracts with the approved foundational requirements.
It does not adopt Radix, Base UI, React Aria, Zag.js, or any other dependency,
and it does not change production components.

## 7. Evidence handling

- A failed command is product evidence only after the failure is reproduced and
  distinguished from dependency, network, credential, or runner problems.
- Transient external lookup failures are retried once. A material unavailable
  source blocks final ranking instead of being silently omitted.
- Conflicting sources are reported together. Approved specifications and
  executable current behavior take precedence over stale narrative text, but
  the conflict itself may qualify as a documentation candidate.
- Missing evidence is labeled as missing. It is never converted into a pass,
  failure, or compatibility claim.
- No test suppression, ignored failure, widened budget, or assertion weakening
  is allowed to make a candidate disappear.

## 8. Next delivery contract

The winner's contract in the evidence artifact must state:

- affected package, component family, and consumer-facing behavior;
- React, Alpine, CSS, and documentation impact;
- exact inclusions and exclusions;
- test-first files or, for a read-only spike, the proof artifacts;
- focused verification commands and all applicable repository gates;
- accessibility, browser, SSR, hydration, bundle, packaging, and consumer-smoke
  requirements when relevant;
- compatibility, changeset, migration, and release policy;
- an objective completion condition.

The contract authorizes planning the next delivery. It does not itself
authorize production implementation.

## 9. Verification

Before the evidence cycle is considered complete:

1. every cited command includes its result and every score includes arithmetic;
2. candidate ordering follows the documented priority and tie-break rules;
3. the focused audit supports the winner or explicitly selects an
   evidence-producing spike;
4. the next delivery contract contains no placeholders or unresolved choices;
5. Markdown formatting passes the repository's formatter check;
6. the branch diff contains only the intended evidence documentation;
7. no changeset is present because no package behavior changes.

## 10. Non-goals

- implementing the selected candidate;
- writing an overlay component-family specification;
- choosing or adopting a primitive dependency;
- changing test infrastructure, budgets, or release gates;
- exhaustively auditing every component;
- updating Blade or adding another framework adapter;
- publishing packages or creating a release.
