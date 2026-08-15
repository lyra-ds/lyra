# Sequential Delivery Cycle

## Goal

Run future Lyra work as a single ordered delivery stream: establish the
current baseline, deliver one capability through its supported surfaces, then
verify and release it before selecting the next capability.

## Current Baseline

The repository—not the historical `.planning/` roadmap—is the source of
truth. It already contains the React component library, the Alpine adapter,
the documentation and marketing applications, published package versions, and
automated verification.

At the start of this cycle, `pnpm test` is green for the library packages:

- `@lyra-ds/styles`: 69 tests
- `@lyra-ds/react`: 665 tests
- `@lyra-ds/alpine`: 268 tests

The existing test command also builds the React package before the application
test suites. A future block must preserve these gates rather than replace
them with a parallel workflow.

## Delivery Model

Work proceeds in this fixed order. A later block never starts before the
previous block has its stated proof recorded.

1. **Baseline and backlog.** Reconcile the repository, published package
   contracts, tests, documentation, and issue reports into one prioritized
   backlog. Every candidate must name the affected package(s), user impact,
   evidence, acceptance criteria, and verification command.
2. **React capability.** Implement the selected capability or correction in
   `@lyra-ds/react` with test-first coverage, including SSR and Browser Mode
   checks whenever it changes interactive or DOM-dependent behavior.
3. **Alpine parity.** Apply the same user-visible capability to
   `@lyra-ds/alpine` when that adapter exposes the relevant component. The
   public behavior, accessibility semantics, and labels must agree with the
   React contract; adapter-specific mechanics may differ.
4. **Consumer surface.** Update the documentation application and any
   generated/API presentation that describes the changed contract. This
   includes examples, both locales, and stack tabs only where the capability
   is available for that stack.
5. **Integrated verification and release readiness.** Run the affected
   package tests first, then the repository gates required by the change.
   Add a changeset only for a user-visible package change. A release is
   considered only after the verification results are clean.

## Selection Rule

The next capability is selected only from the baseline backlog, using this
order:

1. Regressions, accessibility defects, broken public contracts, or release
   blockers.
2. Gaps that prevent a documented supported flow from working in a published
   adapter.
3. Parity gaps between React and Alpine for supported components.
4. Improvements to documentation, examples, and developer experience.

Ties are broken by the smallest independently releasable change with clear
automated proof. Refactors without an observed user or reliability benefit do
not enter the cycle on their own.

## Boundaries

- The current repository structure and package contracts are preserved unless
  a selected backlog item explicitly requires a compatibility change.
- No historical planning status is treated as an implementation queue without
  corroboration in the code or current published contract.
- New dependencies require a documented need, compatibility check, and
  verification impact.
- Every source change follows test-first development; test output is evidence,
  not a substitute for acceptance criteria.
- Each block is completed, reviewed, and verified before the next block is
  planned or implemented.

## First Block

The first concrete block is **Baseline and backlog**. Its output is a compact,
evidence-backed backlog with one recommended next capability. It makes no
product behavior change and does not alter public package APIs.

## Completion Criteria

The cycle is working when:

- exactly one prioritized backlog is maintained from current evidence;
- each selected capability passes through React, applicable Alpine parity,
  consumer documentation, and integrated verification in order;
- release decisions cite the resulting test and build evidence; and
- subsequent work can resume from the recorded backlog without relying on the
  stale historical roadmap.

## Non-goals

- Rebuilding the existing component library from the old Phase 4 plan.
- Forcing every feature into every adapter when it is not part of that
  adapter's public surface.
- Scheduling a release merely because a planning block finished.
