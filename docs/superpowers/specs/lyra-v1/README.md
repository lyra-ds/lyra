# Lyra v1.0 frontend specifications

## Purpose

This directory is the normative frontend contract for Lyra v1.0. It turns the
product scope in the roadmap PRD into reviewable requirements that govern
component-family specifications, implementation plans, shipped behavior, and
public documentation.

## Document map

1. [Design and product principles](./01-design-product-principles.md)
2. [Tokens and visual language](./02-tokens-visual-language.md)
3. [Interaction and accessibility](./03-interaction-accessibility.md)
4. [Component architecture](./04-component-architecture.md)
5. [Quality and performance](./05-quality-performance.md)
6. [Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)

## Dependency order

The foundational specifications are interpreted in this order:

1. Design and product principles establish product boundaries and ownership.
2. Tokens and visual language plus interaction and accessibility establish the
   visual and behavioral contracts.
3. Component architecture defines how those contracts become public APIs and
   stack-specific implementations.
4. Quality and performance defines the evidence required to accept them.

Every component-family specification depends on all five foundational
specifications. A family specification may narrow a permitted choice for its
components, but it cannot weaken a foundational requirement.

## Lifecycle

Every specification moves through `Draft → Approved → Implemented`.

| State         | Transition owner                                                                                                                                                 | Required evidence                                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Draft`       | A spec author or Lyra maintainer                                                                                                                                 | The problem, scope, decisions, dependencies, open questions, and verifiable acceptance criteria are recorded. Draft requirements can be reviewed but cannot authorize implementation.                                                                    |
| `Approved`    | Design-system maintainers; the PRD owner also approves changes to product scope or v1.0 gates; accessibility-sensitive specs require interaction-standard review | All required decisions and acceptance criteria are present, open questions that block implementation are resolved, conflicts are reconciled, downstream effects are identified, and required product, technical, and accessibility reviews are recorded. |
| `Implemented` | Design-system maintainers, after the implementation owner assembles the evidence                                                                                 | Shipped behavior, public documentation, conformance results, migration material, and any required bundle or dependency record satisfy the approved spec.                                                                                                 |

Only an `Approved` specification may generate an implementation plan. Moving a
specification to `Implemented` records conformance; it does not silently change
what was approved.

## Normative language

The uppercase key words `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`,
`SHOULD`, `SHOULD NOT`, `RECOMMENDED`, `MAY`, and `OPTIONAL` use the meanings
defined by [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119):

- `MUST`, `REQUIRED`, and `SHALL` express an absolute requirement.
- `MUST NOT` and `SHALL NOT` express an absolute prohibition.
- `SHOULD` and `RECOMMENDED` mean there may be a valid reason to choose
  differently, but the consequences must be understood and weighed.
- `SHOULD NOT` means there may be a valid reason to allow the behavior, but the
  consequences must be understood and weighed.
- `MAY` and `OPTIONAL` identify a genuinely optional choice.

Only these uppercase key words are normative. Their lowercase forms and prose
without an uppercase key word are explanatory.

## Shared vocabulary

- **Primitive:** The smallest reusable semantic or interaction building block.
  It may be native HTML, Lyra-owned behavior, or a vetted external dependency;
  it does not define Lyra's public product model by itself.
- **Component:** A reusable design-system unit with a Lyra-owned public contract
  for semantics, states, styling, composition, and supported adapters.
- **Domain component:** A component that encodes a recognizable product concept,
  workflow, or data model, such as scheduling, workspace, or file management,
  while composing lower-level primitives and components.
- **Adapter:** A stack-specific implementation of a shared Lyra contract, such
  as React or Alpine. An adapter may use different internals while preserving
  its documented observable behavior and support boundary.
- **Experimental:** A clearly marked contract governed by a `Draft` spec and
  available for evaluation without compatibility guarantees.
- **Stable:** A public contract whose governing spec is `Implemented`, whose
  acceptance evidence is current, and whose changes follow Lyra's versioning
  and migration policy.
- **Deprecated:** A still-supported public contract scheduled for removal. Its
  approved deprecation record identifies the replacement or rationale,
  migration guidance, and removal version.
- **P1:** A release-blocking defect or missing contract that can prevent access
  to a critical workflow, violate a required accessibility or safety guarantee,
  expose an invalid production lifecycle, or invalidate a v1.0 gate.
- **P2:** A significant contract, usability, compatibility, or quality defect
  with a viable workaround that does not by itself invalidate a v1.0 gate.
- **P3:** A bounded improvement or low-impact defect that does not prevent a
  supported workflow or required conformance result.
- **Parity:** Equivalence of the documented, externally observable contract
  across the adapters that claim support. Parity does not require identical
  source code, runtime dependencies, or catalog coverage.
- **Evidence:** A reproducible artifact tied to an acceptance criterion, such as
  an automated result, manual test record, conformance matrix, measurement,
  migration example, or approved architectural decision record.

## Conflict resolution

Authority descends in this order:

1. The roadmap PRD owns product scope and v1.0 product gates.
2. The foundational specifications own cross-component requirements.
3. Approved component-family specifications own component details.

Shipped behavior never silently overrides an approved specification. A
divergence is either an implementation defect to correct or a substantive spec
change that must pass the change protocol before the behavior becomes the
contract.

## Change protocol

A substantive requirement change MUST receive maintainer review, identify the
affected downstream foundational, family, implementation, test, migration, and
documentation artifacts, and add a changelog note below. A change that affects
product scope or a v1.0 gate also requires PRD-owner approval. Editorial changes
that do not alter meaning MAY omit downstream review but still use normal
repository review.

## Changelog

| Date       | Change                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- |
| 2026-08-12 | Created the Lyra v1.0 specification index, lifecycle, vocabulary, and governance rules. |
