# Lyra v1.0 frontend specifications

## Purpose

This directory is the normative frontend contract for Lyra v1.0. It turns the
product scope in the roadmap PRD into reviewable requirements that govern
component-family specifications, implementation plans, shipped behavior, and
public documentation.

## Document map

| Review order | Document                                                           | Primary ownership                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context      | [Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)      | Owns v1.0 product scope, product and engineering goals, non-goals, architecture direction, and release gates.                                                     |
| 1            | [Design and product principles](./01-design-product-principles.md) | Owns product identity, catalog inclusion, ownership levels, implementation-choice principles, and stability policy.                                               |
| 2            | [Tokens and visual language](./02-tokens-visual-language.md)       | Owns token tiers, visual roles and states, themes, white-label behavior, contrast, forced colors, and motion.                                                     |
| 3            | [Interaction and accessibility](./03-interaction-accessibility.md) | Owns observable input, focus, overlay, feedback, accessibility, browser, and assistive-technology contracts.                                                      |
| 4            | [Component architecture](./04-component-architecture.md)           | Owns package boundaries, public APIs, adapter contracts, SSR and hydration behavior, vendor isolation, and versioning.                                            |
| 5            | [Quality and performance](./05-quality-performance.md)             | Owns severity, evidence architecture, test and release gates, bundle budgets and measurement, external-dependency adoption evidence, traceability, and manifests. |

## Review order

Review the roadmap PRD first. The foundational specifications MUST then be
interpreted in this order:

1. Design and product principles establish product boundaries and ownership.
2. Tokens and visual language plus interaction and accessibility establish the
   visual and behavioral contracts.
3. Component architecture defines how those contracts become public APIs and
   stack-specific implementations.
4. Quality and performance defines the evidence required to accept them.

Every component-family specification MUST depend on all five foundational
specifications. A family specification MAY narrow a permitted choice for its
components, but it MUST NOT weaken a foundational requirement.

## PRD traceability

Each requirement below has exactly one primary owning specification. Secondary
specifications depend on that requirement or define complementary enforcement;
they do not create a second source of truth.

| PRD section 9.2 requirement                                                                                  | Primary owner                                                      | Secondary dependencies                                                                                                                                                                           | Owning acceptance section                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1. Design and product principles — identity and differentiation                                              | [Design and product principles](./01-design-product-principles.md) | [Component architecture](./04-component-architecture.md), [Tokens and visual language](./02-tokens-visual-language.md)                                                                           | [Acceptance criteria](./01-design-product-principles.md#acceptance-criteria) |
| 1. Design and product principles — component inclusion criteria                                              | [Design and product principles](./01-design-product-principles.md) | [Component architecture](./04-component-architecture.md), [Quality and performance](./05-quality-performance.md)                                                                                 | [Acceptance criteria](./01-design-product-principles.md#acceptance-criteria) |
| 1. Design and product principles — boundary between primitive, design-system component, and domain component | [Design and product principles](./01-design-product-principles.md) | [Component architecture](./04-component-architecture.md)                                                                                                                                         | [Acceptance criteria](./01-design-product-principles.md#acceptance-criteria) |
| 1. Design and product principles — native versus external versus custom implementation rules                 | [Design and product principles](./01-design-product-principles.md) | [Component architecture](./04-component-architecture.md), [Quality and performance](./05-quality-performance.md)                                                                                 | [Acceptance criteria](./01-design-product-principles.md#acceptance-criteria) |
| 2. Tokens and visual language — color, typography, spacing, radius, elevation, and density                   | [Tokens and visual language](./02-tokens-visual-language.md)       | [Interaction and accessibility](./03-interaction-accessibility.md), [Quality and performance](./05-quality-performance.md)                                                                       | [Acceptance criteria](./02-tokens-visual-language.md#acceptance-criteria)    |
| 2. Tokens and visual language — interaction states                                                           | [Tokens and visual language](./02-tokens-visual-language.md)       | [Interaction and accessibility](./03-interaction-accessibility.md), [Component architecture](./04-component-architecture.md), [Quality and performance](./05-quality-performance.md)             | [Acceptance criteria](./02-tokens-visual-language.md#acceptance-criteria)    |
| 2. Tokens and visual language — light, dark, white-label, and forced-colors behavior                         | [Tokens and visual language](./02-tokens-visual-language.md)       | [Interaction and accessibility](./03-interaction-accessibility.md), [Quality and performance](./05-quality-performance.md)                                                                       | [Acceptance criteria](./02-tokens-visual-language.md#acceptance-criteria)    |
| 2. Tokens and visual language — contrast requirements and exception policy                                   | [Tokens and visual language](./02-tokens-visual-language.md)       | [Interaction and accessibility](./03-interaction-accessibility.md), [Quality and performance](./05-quality-performance.md)                                                                       | [Acceptance criteria](./02-tokens-visual-language.md#acceptance-criteria)    |
| 3. Interaction and accessibility — keyboard and focus contracts                                              | [Interaction and accessibility](./03-interaction-accessibility.md) | [Tokens and visual language](./02-tokens-visual-language.md), [Component architecture](./04-component-architecture.md), [Quality and performance](./05-quality-performance.md)                   | [Acceptance criteria](./03-interaction-accessibility.md#acceptance-criteria) |
| 3. Interaction and accessibility — overlays, live regions, and announcements                                 | [Interaction and accessibility](./03-interaction-accessibility.md) | [Component architecture](./04-component-architecture.md), [Quality and performance](./05-quality-performance.md)                                                                                 | [Acceptance criteria](./03-interaction-accessibility.md#acceptance-criteria) |
| 3. Interaction and accessibility — touch targets, reduced motion, RTL, locale, zoom, and reflow              | [Interaction and accessibility](./03-interaction-accessibility.md) | [Tokens and visual language](./02-tokens-visual-language.md), [Component architecture](./04-component-architecture.md), [Quality and performance](./05-quality-performance.md)                   | [Acceptance criteria](./03-interaction-accessibility.md#acceptance-criteria) |
| 3. Interaction and accessibility — WCAG and APG baseline                                                     | [Interaction and accessibility](./03-interaction-accessibility.md) | [Design and product principles](./01-design-product-principles.md), [Quality and performance](./05-quality-performance.md)                                                                       | [Acceptance criteria](./03-interaction-accessibility.md#acceptance-criteria) |
| 3. Interaction and accessibility — browser and assistive-technology support matrix                           | [Interaction and accessibility](./03-interaction-accessibility.md) | [Quality and performance](./05-quality-performance.md)                                                                                                                                           | [Acceptance criteria](./03-interaction-accessibility.md#acceptance-criteria) |
| 4. Component architecture — compound versus monolithic APIs                                                  | [Component architecture](./04-component-architecture.md)           | [Design and product principles](./01-design-product-principles.md), [Interaction and accessibility](./03-interaction-accessibility.md), [Quality and performance](./05-quality-performance.md)   | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 4. Component architecture — controlled and uncontrolled state                                                | [Component architecture](./04-component-architecture.md)           | [Interaction and accessibility](./03-interaction-accessibility.md), [Quality and performance](./05-quality-performance.md)                                                                       | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 4. Component architecture — slots, refs, DOM attributes, and composition                                     | [Component architecture](./04-component-architecture.md)           | [Design and product principles](./01-design-product-principles.md), [Interaction and accessibility](./03-interaction-accessibility.md)                                                           | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 4. Component architecture — dependency and public-type policy                                                | [Component architecture](./04-component-architecture.md)           | [Design and product principles](./01-design-product-principles.md), [Quality and performance](./05-quality-performance.md)                                                                       | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 4. Component architecture — React, Alpine, and CSS contract boundaries                                       | [Component architecture](./04-component-architecture.md)           | [Design and product principles](./01-design-product-principles.md), [Interaction and accessibility](./03-interaction-accessibility.md), [Quality and performance](./05-quality-performance.md)   | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 4. Component architecture — semver and deprecation                                                           | [Component architecture](./04-component-architecture.md)           | [Design and product principles](./01-design-product-principles.md), [Tokens and visual language](./02-tokens-visual-language.md), [Quality and performance](./05-quality-performance.md)         | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 5. Quality and performance — per-entry and scenario bundle budgets                                           | [Quality and performance](./05-quality-performance.md)             | [Component architecture](./04-component-architecture.md)                                                                                                                                         | [Acceptance criteria](./05-quality-performance.md#acceptance-criteria)       |
| 5. Quality and performance — SSR and hydration requirements                                                  | [Component architecture](./04-component-architecture.md)           | [Quality and performance](./05-quality-performance.md)                                                                                                                                           | [Acceptance criteria](./04-component-architecture.md#acceptance-criteria)    |
| 5. Quality and performance — contract, accessibility, screenshot, and cross-browser testing                  | [Quality and performance](./05-quality-performance.md)             | [Tokens and visual language](./02-tokens-visual-language.md), [Interaction and accessibility](./03-interaction-accessibility.md), [Component architecture](./04-component-architecture.md)       | [Acceptance criteria](./05-quality-performance.md#acceptance-criteria)       |
| 5. Quality and performance — evidence required to adopt external dependencies                                | [Quality and performance](./05-quality-performance.md)             | [Design and product principles](./01-design-product-principles.md), [Interaction and accessibility](./03-interaction-accessibility.md), [Component architecture](./04-component-architecture.md) | [Acceptance criteria](./05-quality-performance.md#acceptance-criteria)       |

## Lifecycle

Every specification MUST move through `Draft → Approved → Implemented`. The
transition owner MUST verify the required evidence for the target state:

| State         | Transition owner                                                                                                                                                                                       | Required evidence                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Draft`       | A spec author or Lyra maintainer MUST initiate the transition.                                                                                                                                         | The spec MUST record the problem, scope, decisions, dependencies, open questions, and verifiable acceptance criteria. Draft requirements MAY be reviewed but MUST NOT authorize implementation.                                              |
| `Approved`    | Design-system maintainers MUST approve the transition. The PRD owner MUST also approve changes to product scope or v1.0 gates. Accessibility-sensitive specs MUST receive interaction-standard review. | The spec MUST contain all required decisions and acceptance criteria, resolve open questions that block implementation, reconcile conflicts, identify downstream effects, and record required product, technical, and accessibility reviews. |
| `Implemented` | Design-system maintainers MUST approve the transition after the implementation owner assembles the evidence.                                                                                           | The evidence MUST demonstrate that shipped behavior, public documentation, conformance results, migration material, and any required bundle or dependency record satisfy the approved spec.                                                  |

A specification MUST reach `Approved` before it generates an implementation
plan. Moving a specification to `Implemented` MUST record conformance and MUST
NOT silently change what was approved.

## Normative language

The uppercase key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY`
use the meanings defined by
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119):

- `MUST` expresses an absolute requirement.
- `MUST NOT` expresses an absolute prohibition.
- `SHOULD` means there may be a valid reason to choose differently, but the
  consequences must be understood and weighed.
- `SHOULD NOT` means there may be a valid reason to allow the behavior, but the
  consequences must be understood and weighed.
- `MAY` identifies a genuinely optional choice.

Only these five uppercase key words are permitted and normative. Their lowercase
forms and prose without a permitted uppercase key word are explanatory.

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
- **Beta:** A clearly marked pre-`Stable` contract governed by an `Approved`
  spec with incomplete implementation evidence or known limitations. It may
  evolve before `Stable`, with release and migration notes for each change.
- **Stable:** A public contract whose governing spec is `Implemented`, whose
  acceptance evidence is current, and whose changes follow Lyra's versioning
  and migration policy.
- **Deprecated:** A still-supported public contract scheduled for removal. Its
  approved deprecation record identifies the replacement or rationale,
  migration guidance, and removal version.
- <a id="critical-workflow"></a>**Critical workflow:** A supported end-to-end
  user journey that its family specification identifies as necessary to complete
  a primary task or safely access, create, change, submit, cancel, recover, or
  understand essential product information. Criticality is determined from the
  supported task and its documented consequence before classifying any finding.
- <a id="p1"></a>**P1:** A release-blocking defect or missing contract that
  prevents or may prevent access to a critical workflow, violates a required
  accessibility or safety guarantee, exposes an invalid production lifecycle,
  loses user data, breaks a documented public package entry, or invalidates a
  v1.0 gate.
- <a id="p2"></a>**P2:** A significant supported-contract, usability,
  compatibility, performance, or quality defect with a viable workaround that
  does not itself invalidate a v1.0 gate or prevent a critical workflow.
- <a id="p3"></a>**P3:** A bounded improvement or low-impact defect that does not prevent a
  supported workflow or required conformance result.
- **Parity:** Equivalence of the documented, externally observable contract
  across the adapters that claim support. Parity does not require identical
  source code, runtime dependencies, or catalog coverage.
- **Evidence:** A reproducible artifact tied to an acceptance criterion, such as
  an automated result, manual test record, conformance matrix, measurement,
  migration example, or approved architectural decision record.
- <a id="consumer-entry"></a>**Consumer entry:** One documented public package entry imported by a
  consumer fixture and measured with its complete production dependency graph.
- <a id="scenario-bundle"></a>**Scenario bundle:** A fixed representative application composition that
  imports only public consumer entries and measures shared-dependency effects.
- <a id="adr"></a>**ADR:** An architectural decision record that captures the decision owner,
  accepted requirements, evidence, alternatives, consequences, and approval.

## Conflict resolution

Authority MUST descend in this order:

1. The roadmap PRD MUST own product scope and v1.0 product gates.
2. The foundational specifications MUST own cross-component requirements.
3. Approved component-family specifications MUST own component details.

Shipped behavior MUST NOT silently override an approved specification. A
divergence MUST be treated as either an implementation defect to correct or a
substantive spec change that passes the [Change protocol](#change-protocol) before the behavior
becomes the contract.

## Change protocol

A substantive requirement change MUST receive maintainer review, identify the
affected downstream foundational, family, implementation, test, migration, and
documentation artifacts, and add a changelog note below. A change that affects
product scope or a v1.0 gate MUST also receive PRD-owner approval. Editorial
changes that do not alter meaning MAY omit downstream review but MUST still use
normal repository review.

## Changelog

| Date       | Change                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-12 | Restricted normative language to the five permitted terms and made lifecycle, authority, and inclusion gates explicitly normative. |
| 2026-08-12 | Created the Lyra v1.0 specification index, lifecycle, vocabulary, and governance rules.                                            |
