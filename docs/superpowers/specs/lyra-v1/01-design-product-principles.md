# Lyra v1.0 design and product principles

**Status:** Approved

**Date:** 2026-08-12

**Owner:** Lyra maintainers

**Approved:** 2026-08-13 by the PRD owner and Lyra maintainer after review
against the published interaction standard

**Scope:** Product identity, component ownership, inclusion decisions, stability,
and public commitments for `@lyra-ds/styles`, `@lyra-ds/react`, and
`@lyra-ds/alpine` in Lyra v1.0.

**Governing PRD:**
[Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)

## Decision summary

Lyra v1.0 MUST remain a CSS-first, semantic, white-label design system with
Lyra-owned public contracts. It MUST support stable React APIs and explicit
Alpine enhancements for server-rendered applications without requiring the two
adapters to share runtime dependencies. Components MUST enter the catalog only
when they address evidenced user needs and improve a coherent Lyra contract;
they MUST NOT enter to maximize component count. Native HTML MUST be the
default, external primitives MUST remain implementation candidates subject to
evidence, and domain-oriented components MUST remain a deliberate source of
product differentiation.

## Job, audiences, and open-source position

Lyra's job is to give teams a trustworthy frontend foundation for product
interfaces: semantic CSS without a React requirement, stable React APIs,
Alpine enhancements for server-rendered applications, white-label theming, and
domain-oriented compositions for application shells, scheduling, workspaces,
and files.

The primary audiences are:

- product teams building branded applications on the CSS core;
- React teams that need production-grade component contracts;
- server-rendered application teams that add behavior through Alpine;
- designers, accessibility reviewers, and maintainers who need auditable
  decisions and acceptance evidence;
- external open-source evaluators, adopters, and contributors who have no
  private repository context.

As an open-source product, Lyra MUST make support boundaries, stability,
accessibility, performance, migration costs, and contribution criteria publicly
inspectable. Evaluation MUST NOT depend on roadmap claims or undocumented
maintainer knowledge.

## Product truths

1. **CSS-first:** Semantic CSS custom properties and `.lyra-*` classes are the
   portable visual core. A supported CSS contract MUST NOT require React-only
   markup unless that boundary is explicitly documented.
2. **Semantic tokens:** Components consume intent through semantic tokens.
   White-label and theme changes MUST NOT require product markup to adopt a
   utility framework.
3. **White-label:** The brand contract MUST remain based on `--brand`,
   `--brand-contrast`, `--brand-radius`, and `--brand-font`, with derived accent
   values for light and dark themes.
4. **React plus Alpine:** React and Alpine share behavioral specifications and
   acceptance cases. Each adapter MAY use stack-appropriate internals and MUST
   publish intentional differences or unsupported contracts.
5. **Domain-oriented components:** Application shells, scheduling, workspace,
   and file experiences are first-class product territory. External primitives
   MAY support their interactions but MUST NOT replace their Lyra-owned product
   model.

## Principles

### 1. Native first

Lyra MUST use semantic HTML when the platform provides the required semantics
and behavior. A third-party primitive MUST demonstrate a contract gain;
internal convenience alone MUST NOT be sufficient.

### 2. Evidence over preference

Library familiarity, popularity, or aesthetic preference MUST NOT decide an
adoption. A candidate MUST improve an approved functional contract and pass the
applicable accessibility, browser, SSR, hydration, API, and bundle gates.
Rejection evidence MUST satisfy the same measurement and contract-comparison
standard as adoption evidence.

### 3. Lyra owns the public contract

Consumers interact with Lyra props, events, data attributes, tokens, CSS
classes, and documented DOM expectations. External-library types MUST NOT enter
the public API, and an internal primitive change MUST NOT require consumers to
learn its vendor contract.

### 4. Stack-appropriate implementation

React and Alpine MUST share externally observable requirements, not necessarily
runtime dependencies or internal architecture. Each adapter SHOULD use the
simplest implementation that satisfies its accepted contract in that stack.

### 5. Progressive enhancement

Where a component claims a CSS or server-rendered baseline, its content and
essential meaning MUST remain available before JavaScript enhancement. Enhanced
behavior MUST preserve semantic HTML and document any capability that genuinely
requires a runtime.

### 6. Composability

Components SHOULD expose focused parts, state, and extension points that let
products compose real content without duplicating interaction behavior. Lyra
MUST NOT make a monolithic convenience API the only path when it prevents
semantic structure, controlled state, or accessible customization.

### 7. Accessible defaults

The default path MUST satisfy the approved semantic, keyboard, focus, touch,
motion, direction, contrast, zoom, and announcement contracts. Unsafe behavior
MUST NOT be the easiest or primary public API, and known violations MUST NOT be
silently filtered from evidence.

### 8. Domain differentiation

Lyra SHOULD invest in domain components when they encode repeated product
knowledge beyond a generic primitive. Those components MUST retain Lyra-owned
models and APIs even when lower-level interactions use an external foundation.

## Ownership levels

The [shared vocabulary](./README.md#shared-vocabulary) defines primitive,
component, and domain component. This section owns their catalog entry and exit
rules.

| Level                   | Entry rule                                                                                                                                                                | Exit rule                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitive               | The capability MUST be a smallest reusable semantic or interaction building block that native HTML or a bounded internal/external primitive can express.                  | Lyra MUST promote it to a design-system component when Lyra needs to own a reusable public state, styling, or composition contract. Lyra MUST remove or replace it when evidence shows it no longer meets its internal responsibility. |
| Design-system component | The scorecard and decision framework MUST justify a reusable Lyra public contract across products, with defined anatomy, states, accessibility, styling, and adapters.    | Lyra MUST promote it to a domain component when a stable product model becomes central. Lyra MUST deprecate it when the need disappears, a native contract supersedes it, or maintenance cannot meet the approved guarantees.          |
| Domain component        | Repeated product workflows or data models MUST require a differentiated Lyra composition that lower-level components cannot express without duplicating domain knowledge. | Lyra MUST decompose shared behavior into lower levels when it becomes general. Lyra MUST deprecate the domain component when evidence no longer supports the workflow or Lyra cannot maintain its complete product contract.           |

An internal implementation MAY move between native, external, and Lyra-owned
behavior without changing its ownership level. A public ownership-level change
is substantive and MUST follow the [Change protocol](./README.md#change-protocol).

## Component inclusion scorecard

A proposal MUST score each dimension with current evidence and MUST use this
scale: `0` means absent or contradicted, `1` means bounded or partially
demonstrated, and `2` means strong and repeated.

| Dimension              | 0                                                                 | 1                                                            | 2                                                                                             |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Repeated user need     | Hypothetical or one-off                                           | Repeats in one product or one verified workflow              | Repeats across products, teams, or verified workflows                                         |
| Semantic ownership     | Native HTML already supplies the complete contract                | Lyra adds a bounded state or composition contract            | A distinct, durable Lyra public model is necessary                                            |
| Accessibility leverage | Adds no shared accessibility value                                | Centralizes a limited semantic or interaction requirement    | Removes repeated accessibility risk across consumers                                          |
| Cross-product reuse    | Product-specific with no credible reuse                           | Reusable within one product family                           | Reusable across distinct product contexts                                                     |
| Maintenance cost       | Cost or expertise exceeds sustainable ownership                   | Sustainable with explicit constraints                        | Low or already funded by shared infrastructure                                                |
| Adapter feasibility    | Cannot meet the declared CSS, React, or Alpine support boundary   | Feasible with documented intentional differences             | Shared observable contract is feasible across every claimed adapter                           |
| Bundle impact          | Exceeds policy without approved user benefit or replacement scope | Fits an approved exception or has a measured mitigation path | Fits the default budget and removes superseded code where applicable                          |
| Differentiation        | Duplicates a commodity catalog item without a Lyra advantage      | Improves consistency or adoption                             | Expresses Lyra's semantic, white-label, application, scheduling, workspace, or file strengths |

Every proposal MUST attach evidence for each score and identify its intended
ownership level. Inclusion MUST satisfy all of these gates:

- the proposal MUST have no `0` for repeated user need, accessibility leverage,
  maintenance cost, or adapter feasibility;
- the proposal MUST score at least `10` out of `16`;
- the proposal MUST record an explicit decision from the
  native/external/Lyra-owned framework below;
- the proposal MUST have an approved family spec before implementation.

A score MUST NOT override an anti-goal, dependency gate, or bundle gate. A
maintainer exception MUST record the user benefit, rejected alternatives,
ongoing owner, and acceptance evidence in the family spec and MUST NOT waive an
anti-goal or mandatory PRD gate.

## Native, external, or Lyra-owned decision framework

Reviewers MUST apply these questions in order:

1. **Can native HTML and CSS satisfy the approved contract?** If yes, Lyra MUST
   use the native foundation and add only the styling or bounded enhancement the
   contract requires.
2. **If native behavior is insufficient, is the missing behavior a generic,
   high-risk interaction already solved by a mature external primitive?** If
   yes, compare candidates against the same public API, accessibility, browser,
   SSR, hydration, maintenance, and bundle evidence. Lyra MAY adopt one only
   when it produces a demonstrated net contract gain.
3. **Does the behavior encode Lyra-specific product semantics, composition, or
   domain knowledge?** If yes, Lyra MUST own the public model and behavior.
   External primitives MAY remain internal implementation details for bounded
   interactions.
4. **Does no option meet the accepted contract?** Lyra MAY keep or build
   Lyra-owned behavior only with an explicit maintenance owner and acceptance
   matrix; otherwise the proposal MUST remain out of scope.

Equivalent production responsibilities MUST NOT ship on simultaneous Radix and
Base UI foundations. A dependency adopted for internal behavior MUST remain
replaceable behind the Lyra public contract.

## Stability model

The [shared lifecycle and stability vocabulary](./README.md#shared-vocabulary)
is canonical. This model applies the `Beta` pre-stable stage and
product-specific eligibility rules without redefining `Experimental`, `Stable`,
or `Deprecated`.

| Stability      | Required spec lifecycle                           | Public meaning                                                                                                                                                    |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Experimental` | `Draft`                                           | Evaluation only. The surface MUST be clearly marked and MAY change or be removed without compatibility guarantees.                                                |
| `Beta`         | `Approved`                                        | The contract and acceptance matrix are approved, but implementation evidence is incomplete. Changes remain possible and MUST include release and migration notes. |
| `Stable`       | `Implemented`                                     | Shipped behavior and documentation MUST satisfy the approved spec. Versioning, deprecation, support, and migration policies MUST apply.                           |
| `Deprecated`   | `Implemented` plus an approved deprecation change | The contract MUST remain supported temporarily while its replacement or rationale, migration guidance, and explicit removal version are published.                |

A component MUST NOT be labeled `Stable` before its governing specification is
`Implemented`. A deprecated component MUST NOT lose the guarantees of its last
stable contract before the published removal version unless retaining the
behavior would preserve an unsafe contract; that exception still requires
release notes and migration examples.

## Public commitments

Lyra MUST satisfy the following commitments, copied verbatim from the roadmap
PRD and not expanded by this specification.

### Product commitments

1. Publish stable v1.0 APIs for CSS, React, and Alpine.
2. Meet WCAG 2.2 AA without silently suppressing known violations.
3. Make keyboard, focus, responsive, RTL, forced-colors, and reduced-motion behavior explicit product requirements.
4. Reduce proprietary interaction code where a mature primitive produces a demonstrated reliability gain.
5. Preserve Lyra's visual language and CSS contract independently of third-party primitive libraries.
6. Define React and Alpine parity precisely instead of promising identical implementation coverage.
7. Support controlled breaking changes before v1.0 with complete migration guidance.
8. Make adoption, evaluation, and contribution credible for external open-source consumers.

### Engineering commitments

1. Test supported interactive components in Chromium, Firefox, and WebKit.
2. Maintain SSR safety and hydration correctness.
3. Protect bundle size both per entry and in representative application compositions.
4. Remove internal focus, portal, presence, and dismiss implementations when an adopted primitive supersedes them.
5. Keep all third-party primitive types out of Lyra's public API.
6. Require an approved spec and an executable acceptance matrix for every migration wave.

## Explicit anti-goals

The v1.0 scope MUST NOT include any of the following anti-goals, copied verbatim
from the roadmap PRD and not expanded by this specification.

- Shipping Vue, Svelte, or Web Components adapters before v1.0.
- Making Blade evolution or release a Lyra v1.0 release blocker.
- Making Zag.js the cross-framework foundation before those adapters become active scope.
- Building an enterprise data grid with virtualization, editing, pivoting, or column authoring.
- Replacing semantic CSS with Tailwind utilities.
- Matching every component currently available in shadcn/ui.
- Exposing Radix, Base UI, or React Aria types as part of the public API.
- Adopting a dependency solely to reduce internal implementation effort.
- Shipping an MCP server as a v1.0 requirement.

## Icon direction

Lucide MUST remain the default icon library. The curated `Icon` registry and its
escape hatch MUST remain the supported React contract. Lyra MUST improve
registry discovery, document use of icons outside the registry, and define an
adapter path for organization-specific icon sets without importing every
available glyph into consumer bundles. Brand icons MUST remain separate from
the general-purpose registry so trademarked assets and visual-style exceptions
do not erode the core set.

## Acceptance criteria

Before this document moves to `Approved`, reviewers MUST verify every criterion:

- [x] the job, audiences, CSS-first position, semantic tokens, white-label
      contract, React and Alpine boundary, and domain differentiation agree with
      the PRD and current architecture documentation;
- [x] each principle uses the normative language defined by the specification
      index and does not expose an external primitive as a product requirement;
- [x] primitive, design-system component, and domain component have distinct,
      reviewable entry and exit rules;
- [x] the scorecard evaluates all eight required dimensions, defines its scoring
      evidence, and cannot override anti-goals or quality gates;
- [x] the native, external, or Lyra-owned decision framework yields one recorded
      implementation direction and preserves a Lyra-owned public contract;
- [x] `Experimental`, `Beta`, `Stable`, and `Deprecated` map to the shared spec
      lifecycle, and `Stable` requires an `Implemented` spec;
- [x] public commitments and anti-goals match PRD sections 4 and 5 without added
      scope;
- [x] icon policy retains Lucide, the curated registry, the escape hatch, an
      organization adapter path, and a separate brand-icon policy;
- [x] downstream token, interaction, architecture, quality, and family specs can
      cite these decisions without unresolved placeholders;
- [x] the PRD owner, design-system maintainers, and required accessibility
      reviewer have recorded the approvals assigned to them by governance.
