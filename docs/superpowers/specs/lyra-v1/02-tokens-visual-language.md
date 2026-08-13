# Lyra v1.0 tokens and visual language

**Status:** Draft

**Date:** 2026-08-12

**Owner:** Lyra maintainers

**Scope:** Public visual tokens, theme and white-label contracts, component
styling, interaction-state presentation, and visual accessibility requirements
for `@lyra-ds/styles`, `@lyra-ds/react`, and `@lyra-ds/alpine` in Lyra v1.0.

**Governing PRD:**
[Lyra v1.0 roadmap PRD](../2026-08-12-lyra-v1-roadmap-prd.md)

## Decision summary

Lyra v1.0 MUST expose one CSS-first visual contract built from reference scales,
semantic aliases, bounded component tokens, and four consumer brand inputs.
Components MUST consume semantic or component tokens instead of choosing raw
visual values. Light, dark, and white-label output MUST preserve the same
meaning, state hierarchy, contrast, forced-colors behavior, reduced-motion
behavior, and direction-independent layout. The shadcn mapping MUST remain an
opt-in adapter and MUST NOT become the source of Lyra token semantics.

## Token tiers

The derived token graph MUST use these tiers in dependency order:

| Tier             | Responsibility                                                                                                                                                                                                                      | Examples                                                                                 | Consumer contract                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reference scales | Reference scales MUST hold stable default palette steps, type sizes and weights, spacing increments, radii, control sizes, motion values, elevation values, and stacking levels. They MUST NOT encode a component or product state. | `--indigo-600`, `--text-base`, `--space-4`, `--radius-md`, `--duration-fast`             | Consumers MAY inspect or use a reference value while defining a semantic or approved component token, but component CSS MUST NOT consume a reference token when a semantic role exists.    |
| Semantic aliases | Semantic aliases MUST describe visual intent independently of their current reference value. Each supported theme MUST resolve every alias used by a public component.                                                              | `--surface-card`, `--text-muted`, `--border-input`, `--accent-hover`, `--danger-text`    | Components and product CSS SHOULD consume this tier by default. Consumer theme overrides MAY replace aliases only when all affected pairs and states retain the requirements in this spec. |
| Component tokens | A component token MUST represent a reusable part, property, or state that cannot be named accurately at the semantic tier. It MUST fall back to a semantic token or another component token with a valid value.                     | `--lyra-dialog-surface`, `--lyra-button-padding-inline`, `--lyra-tab-indicator-selected` | A documented component token MAY be a public override point. An implementation-only component token MUST be marked private in source and MUST NOT be presented as a compatibility promise. |

The four consumer brand inputs are external roots, not a derived tier. They MUST
remain `--brand`, `--brand-contrast`, `--brand-radius`, and `--brand-font`;
`--brand` is the required seed and the other three inputs MAY use documented
defaults. A brand input MUST NOT depend on a derived token. Consumers MAY set
these inputs on a `[data-brand]` scope, and they MUST NOT need to replace
component markup, import a utility framework, or understand a component's
internal token graph.

A derived token MAY depend only on the same tier, an earlier tier, or a brand
input through the approved brand mappings below. A component token MAY expose a
documented consumer override before falling back to a semantic alias. A derived
token MUST NOT feed back into a brand input, and token references MUST NOT be
circular.

Theme and brand scopes MUST NOT redefine reference scales, with two closed
white-label compatibility exceptions: `--brand-radius` MAY override only
`--radius-md`, and `--brand-font` MAY override only `--font-sans` and
`--font-display`. These bridges MUST remain one-way from an external brand input
to the named reference token and MUST NOT authorize another reference-scale
override. `--brand` and `--brand-contrast` MAY feed the semantic accent aliases
defined by the brand contract.

## Naming and governance

Public custom-property names MUST use lowercase ASCII kebab case. A new name
MUST identify one durable responsibility and MUST NOT encode a temporary
implementation, framework, tenant, or visual value.

- A reference token MUST use `--<family>-<step-or-role>`. Ordered families MUST
  use a stable ascending scale; their names MUST NOT imply equal mathematical
  intervals unless the values provide them.
- A semantic token MUST use either compact `--<concept>` or expanded
  `--<concept>-<role-or-state>` form. Its name MUST remain accurate in light,
  dark, branded, and forced-color presentation. The incumbent compact names
  `--accent`, `--success`, `--warning`, `--danger`, and `--info` MUST remain
  canonical public semantic aliases and MUST NOT be treated as deprecated. A
  new semantic alias SHOULD use the expanded form; it MAY use the compact form
  only when one concept word expresses its complete durable meaning.
- A component token MUST use
  `--lyra-<component>-<part-or-property>[-<state>]`. A state suffix MUST use the
  state vocabulary in this document.
- A consumer brand input MUST use one of the four names in the brand contract.
  An additional brand input MUST pass the
  [Change protocol](./README.md#change-protocol) before it becomes public.

A proposal to add a token MUST demonstrate repeated semantic need or a necessary
consumer override, identify its tier and owner, and show that an existing token
cannot express the intent. A token MUST NOT be added only to mirror a literal
without a durable named responsibility or to expose an internal implementation
choice.

A proposal to change a token's value or meaning MUST identify every dependent
theme, brand derivation, public class, component, and adapter. A meaning change
MUST use a new name when an existing consumer could reasonably depend on the
old meaning.

An alias MAY bridge an approved migration or preserve a compatible synonym. It
MUST have one canonical target, documentation, an owner, and a removal
condition. An alias MUST NOT create a second canonical vocabulary.

A public token MUST be removed only through the deprecation policy below. A
private token MAY be removed with its implementation when parity and component
evidence show no public observable change.

## Fallbacks and browser-safe CSS

Every required semantic token MUST resolve to a syntactically valid computed
value in each supported theme. Component CSS SHOULD use `var(--semantic-token)`
for required aliases so a broken token graph remains observable. It MUST NOT
hide a missing required alias behind an unrelated literal fallback.

An optional public component override MUST use an explicit semantic fallback,
such as `var(--lyra-component-property, var(--semantic-token))`. A fallback MUST
preserve the same meaning and MUST NOT cross from one status, state, or content
role into another.

A declaration that uses CSS syntax outside the supported-browser baseline MUST
be preceded by a concrete safe declaration. The enhancement MUST be guarded by
an applicable `@supports` query when unsupported parsing or computed-value
resolution could invalidate the fallback. A custom-property fallback MUST be
placed outside the unsupported conditional block when the block would otherwise
leave the property unset.

Font and stylesheet behavior MUST NOT require a runtime CDN, remote `@import`,
or third-party `url()`. A browser-safe fallback MUST preserve content and
essential state even when an optional font, color function, filter, backdrop
effect, shadow, or animation is unavailable.

## File ownership

The canonical entry order MUST remain fonts, colors, typography, spacing,
effects, brand, base, and then component CSS unless an approved architecture
change documents a replacement order.

| File or layer           | Owned responsibility                                                                                                                                                              | Boundary                                                                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens/fonts.css`      | It MUST document the supported font acquisition and loading contract without initiating runtime network access.                                                                   | It MUST NOT define component typography or embed a remote font source.                                                                                                                                                    |
| `tokens/colors.css`     | It MUST own color reference scales, baseline light semantic color aliases, and dark semantic color overrides.                                                                     | It MUST NOT contain tenant names, component selectors, or brand derivation.                                                                                                                                               |
| `tokens/typography.css` | It MUST own font-family fallbacks, weights, sizes, leading, tracking, and semantic typography roles.                                                                              | It MUST NOT load fonts or style component selectors.                                                                                                                                                                      |
| `tokens/spacing.css`    | It MUST own spacing, radius, control-size, container, and shared layout reference values.                                                                                         | It MUST NOT define component anatomy or responsive layout rules.                                                                                                                                                          |
| `tokens/effects.css`    | It MUST own elevation, focus-shadow composition, motion durations and easing, and stacking levels, including theme-specific effect overrides.                                     | It MUST NOT own interaction semantics or use motion as the only state signal.                                                                                                                                             |
| `tokens/brand.css`      | It MUST map the four brand inputs onto approved semantic aliases for baseline light and dark themes. It MUST own progressive enhancement and safe fallbacks for brand derivation. | It MUST NOT redefine neutral surfaces, status meanings, unrelated spacing, or component anatomy. It MAY override only `--radius-md`, `--font-sans`, and `--font-display` under the closed compatibility exceptions above. |
| `tokens/base.css`       | It MUST apply semantic tokens to global element defaults, selection, links, and code typography.                                                                                  | It MUST NOT invent a parallel token tier or contain component styling.                                                                                                                                                    |
| Component CSS           | It MUST own component anatomy, state selectors, responsive behavior, and bounded component tokens.                                                                                | It MUST consume the canonical token graph and MUST NOT redefine global scales or status meanings.                                                                                                                         |
| `compat-shadcn.css`     | It MUST map shadcn-compatible names to Lyra semantic aliases as an opt-in stylesheet.                                                                                             | It MUST NOT be imported by the canonical Lyra entry, own original values, or cause Lyra components and documentation to consume shadcn names.                                                                             |

## Public-token deprecation and migration

A custom property is public when Lyra documents it as a consumer input or
override, or when a stable package contract identifies it as supported. A
public token deprecation MUST publish the deprecated name, canonical
replacement or removal rationale, affected themes and components, migration
examples, first deprecated release, and permitted removal release.

The deprecated name MUST continue to resolve compatibly for at least one
documented deprecation cycle and until the next permitted breaking release. A
replacement alias MUST flow from the deprecated name toward one canonical token
without a cycle. The removal release MUST include release notes and MUST verify
that public documentation, examples, adapters, component CSS, and the shadcn
adapter no longer depend on the removed name.

Before v1.0, an approved breaking token change MAY use the controlled-change
policy in the roadmap PRD, but it MUST still provide complete migration
guidance and change evidence. After a token is stable, removal MUST follow the
package versioning policy and MUST NOT occur in a compatible release.

## Raw values and exceptions

Component CSS MUST use semantic or approved component tokens for color,
typography, spacing, sizing, radius, elevation, borders, focus indication, and
motion. It MUST NOT consume a color reference scale directly when a semantic
alias exists. CSS-wide and structural values such as `inherit`, `currentColor`,
`transparent`, `none`, `auto`, percentages, and zero MAY remain literal when
they do not create a themeable visual decision.

An intrinsic data visualization MAY use a local palette, measured geometry, or
consumer-supplied series color when tokenization would change the represented
data. A consumer-provided value MAY pass through when it is the documented
purpose of the API, such as an avatar image, progress value, event color, or
layout measurement. Each exception MUST document the data meaning, validation
or sanitization boundary, theme behavior, contrast responsibility, forced-color
fallback, and non-color signal. An exception MUST NOT redefine a global status
meaning or weaken component readability.

## Color roles and status semantics

Surface tokens MUST communicate page, card, raised, sunken, and overlay
relationships. Text tokens MUST communicate primary, secondary, muted, faint,
inverse, and link roles. Border tokens MUST communicate default, strong, input,
and accent boundaries. Accent tokens MUST communicate primary action and brand
emphasis, not validation status.

The status families MUST retain these meanings across themes and brands:

- success MUST communicate a completed or valid outcome;
- warning MUST communicate risk or an action that deserves caution;
- danger MUST communicate an error, destructive action, or invalid outcome;
- info MUST communicate neutral guidance or noteworthy information.

Each status family MUST provide a strong signal, a soft surface, and readable
text where the supported component needs those roles. A component MUST NOT
exchange status meanings to obtain a preferred hue. Status, selection, and
interactivity MUST NOT be communicated by color alone.

## Typography and density

`--font-sans` and `--font-display` MUST use Plus Jakarta Sans first and MUST
retain system sans-serif fallbacks. `--font-mono` MUST use JetBrains Mono first
and MUST retain platform monospace fallbacks. Consumers MUST install and load
the weights they use from their own application origin or approved asset
pipeline. Lyra packages MUST NOT fetch fonts at runtime.

Semantic font shorthands MUST own display, heading, body, strong body, caption,
overline, and code roles. Components SHOULD choose a role before combining
reference size, weight, leading, or tracking values. Interface copy SHOULD use
the compact `--body-font` baseline; sustained reading SHOULD use at least the
`--text-md` size with relaxed leading. A dense variant MUST preserve readable
labels, zoom behavior, touch and pointer targets, and state differentiation; it
MUST NOT obtain density by clipping content or suppressing required labels.

Fallback-font rendering MUST preserve content order and usable controls while a
preferred font is unavailable. A consumer-defined `@font-face` SHOULD use a
loading strategy that avoids invisible text. Component layout MUST tolerate the
documented fallback stacks without truncating essential content.

## Geometry, elevation, borders, and focus

Spacing MUST follow the shared 4px reference rhythm unless an intrinsic data or
consumer-value exception applies. Sizing and component anatomy MUST use shared
or component tokens, and responsive changes MUST preserve semantic grouping.
Radius MUST express shape and grouping; `--radius-full` MUST be reserved for a
circle or pill whose shape carries that intent.

Elevation MUST use the smallest token that communicates the surface
relationship. A shadow MUST NOT replace a semantic border when the border is
needed to identify a control, region, or state. Dark presentation MAY reduce
ambient shadows, but it MUST retain visible surface boundaries.

Focus-visible presentation MUST be distinct from hover, active, selection, and
error. It MUST remain visible against adjacent colors, MUST meet the applicable
non-text contrast requirement, and MUST NOT be clipped by component overflow.
Components MUST NOT remove the user-agent outline before an equal or stronger
focus indicator is applied.

## Themes and white-label behavior

With no `data-theme` value, the baseline token graph MUST resolve to light.
`data-theme="light"` on the document root MUST resolve to that same baseline.
`data-theme="dark"` MUST replace semantic color and effect values without
requiring component-specific theme logic. A dark theme island inside a light
document MAY use the inherited `[data-theme="dark"]` contract. Lyra v1.0 does
not promise a nested light island inside a dark ancestor; documentation and
examples MUST NOT imply that inverse scope works.

The stored preference MAY be `light`, `dark`, or `system`. Before applying CSS,
`system` MUST resolve to a concrete `light` or `dark` document value from
`prefers-color-scheme`, and it MUST update when that preference changes. A
document that promises flash-free theming MUST apply the same resolution and
storage key before first paint that its runtime adapter uses after hydration.
Theme changes MUST preserve focus and MUST NOT replace meaningful content.

A `[data-brand]` scope MUST define `--brand` as one concrete, opaque CSS
`<color>` accepted by every engine in the supported browser matrix. Validation
MUST trim the value, parse it as a complete color rather than a declaration
fragment, resolve it in an isolated element, and reject an empty value,
CSS-wide keywords, `currentColor`, system colors, `transparent`, unresolved
`var()` or `env()` references, relative colors, and any result whose alpha is
less than `1`. Removing the brand MUST remove the attribute rather than set an
empty seed.

The same grammar and validation boundary MUST apply to `--brand-contrast`.
Validation MUST occur before derivation when brand configuration is loaded and
in the Chromium, Firefox, and WebKit brand fixtures used by the release gate. A
missing or invalid `--brand` MUST leave the complete default root token graph in
effect and MUST NOT derive a partial brand graph. A missing or invalid
`--brand-contrast` MUST use the concrete browser-safe default contrast fallback;
it MUST NOT erase an otherwise valid brand scope. An adapter that accepts brand
configuration MUST expose the invalid field and reason to its caller or
diagnostic channel rather than silently accepting it.

Brand derivation MUST map the validated seed to accent, hover, active, soft,
soft-text, on-accent, focus, link, and accent-border roles in both light and
dark presentation. It MAY also map the documented radius and font inputs. It
MUST NOT change status meanings or assume that a generated color pair satisfies
contrast without evidence. A valid `--brand-contrast` MUST take precedence over
the default derivation. The release gate MUST verify every generated foreground,
state, focus, and boundary pair against the applicable text or non-text contrast
criterion in both themes. A failing pair MUST use an approved valid override or
a different valid seed before release. Consumer overrides MUST be scoped,
valid, and complete enough that a missing value cannot erase essential content,
state, or focus indication.

## Interaction-state visuals

Every interactive component specification MUST define each applicable state
below. A state that does not apply MUST be recorded with a semantic rationale.

| State         | Visual contract                                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rest          | The rest state MUST establish the component's role, affordance, boundary, and content hierarchy without relying on interaction.                                                                                            |
| Hover         | Hover MUST add a perceivable pointer affordance without moving content or hiding the rest-state boundary. It MUST NOT be the only way to discover an action or information.                                                |
| Active        | Active MUST distinguish current press or activation from hover and rest. The difference MUST remain understandable when motion is reduced.                                                                                 |
| Focus-visible | Focus-visible MUST use a persistent indicator while keyboard focus remains, preserve layout, and satisfy the focus and contrast rules in this document.                                                                    |
| Selected      | Selected MUST remain visible without hover or focus and MUST pair its visual treatment with the applicable semantic or programmatic state.                                                                                 |
| Disabled      | Disabled MUST be visibly unavailable and MUST preserve legible identity. Color or opacity alone MUST NOT be the only signal when the state could otherwise be mistaken for an enabled control.                             |
| Read-only     | Read-only MUST preserve readable value content and MUST remain distinguishable from both editable and disabled presentation. It MUST NOT imply that the value is unavailable.                                              |
| Loading       | Loading MUST preserve the control or region's identity and dimensions, expose a non-motion cue, and avoid a false success or disabled meaning. Animation MAY reinforce progress but MUST NOT be required to understand it. |
| Error         | Error MUST use the danger semantic family, identify the affected control or content with more than color, and retain readable recovery guidance.                                                                           |
| Warning       | Warning MUST use the warning semantic family and distinguish caution from failure. It MUST include a non-color cue wherever the status affects a decision.                                                                 |
| Success       | Success MUST use the success semantic family and distinguish confirmation from neutral completion. It MUST include a non-color cue wherever the status is not already clear from adjacent content.                         |

State layers MUST have a documented precedence when more than one applies.
Disabled or read-only semantics MUST take precedence over hover and active
styling. Focus-visible MUST remain visible with selected, loading, warning,
error, and success styling. Validation and status presentation MUST NOT erase
selection or focus.

## Contrast and color independence

Text and images of text MUST meet WCAG 2.2 AA contrast of at least `4.5:1`
against their effective background. Large text MUST meet at least `3:1` when it
meets the WCAG large-text size and weight definition. Required non-text
boundaries, controls, states, icons, and focus indicators MUST meet at least
`3:1` against adjacent colors where WCAG requires non-text contrast.

Contrast evidence MUST use the final composited colors, including opacity,
overlay, gradient, image, theme, brand, state, and browser fallback. Lyra MUST
NOT maintain a general allowlist of assumed-safe color pairs. Every pair used by
the accepted output MUST pass on its own evidence; a reference-scale value,
automatic brand derivation, or passing pair in another theme MUST NOT substitute
for that measurement.

Meaningful status, selection, current location, validation, availability, and
focus MUST have a text, icon, shape, border, pattern, position, or programmatic
signal in addition to color. The additional signal MUST remain perceivable in
grayscale, forced colors, and relevant reduced-transparency conditions.

## Forced colors

Under `@media (forced-colors: active)`, components MUST preserve content,
boundaries, state differentiation, and visible focus with system colors. Text,
surfaces, links, controls, selection, and disabled content SHOULD map to
appropriate values such as `CanvasText`, `Canvas`, `LinkText`, `ButtonText`,
`Highlight`, `HighlightText`, and `GrayText` according to their semantics.

Required control and region boundaries MUST use semantic borders that remain
visible when backgrounds, shadows, gradients, and images are removed. Focus
MUST retain a visible outline or equivalent system-color indicator. Selected,
error, warning, success, loading, disabled, and read-only states MUST NOT depend
on authored color alone and MUST remain distinguishable when the user agent
substitutes colors.

`forced-color-adjust: none` MUST NOT be used as a general preservation strategy.
It MAY protect a bounded visual whose authored colors are essential to its
meaning only when the component documents the reason, supplies independent
state cues, and demonstrates contrast in every supported forced-color scheme.

## Reduced motion

Motion tokens MUST centralize supported durations and easing. Under
`prefers-reduced-motion: reduce`, decorative and spatial transition durations
MUST resolve to no motion or the shortest non-spatial feedback that preserves
function. Loading indicators MUST retain a static label, shape, or progress cue
when animation stops.

Motion MUST NOT be required to discover content, determine state, understand
sequence, or complete an action. A component MAY retain an essential motion
only when removing it would change the information itself, and its family spec
MUST document that decision and a non-motion alternative.

## Direction and logical properties

Component CSS MUST use logical properties for direction-sensitive inset,
margin, padding, border, sizing, alignment, and overflow behavior. It MUST NOT
encode `left` or `right` as a proxy for start, end, previous, next, increase, or
decrease. Physical properties MAY remain when the meaning is intrinsically
physical, such as a coordinate plane or consumer-supplied data position.

Directional icons, gradients, shadows, and motion MUST mirror or reorient when
their meaning changes in RTL. Neutral icons and content with an intrinsic
direction MUST NOT be mirrored. Theme, brand, focus, status, and forced-color
contracts MUST remain equivalent in LTR and RTL.

## shadcn compatibility

`compat-shadcn.css` MUST remain an explicit opt-in import after the canonical
Lyra stylesheet. It MUST map shadcn-compatible variables to Lyra semantic
tokens, including their resolved light, dark, and brand values. It MUST NOT
introduce original palette values, redefine the four brand inputs, or become a
dependency of Lyra components.

A shadcn naming collision MUST be documented and tested as adapter behavior.
Changes to shadcn expectations MAY update the adapter mapping only after the
canonical Lyra token meaning remains unchanged or passes the
[Change protocol](./README.md#change-protocol). Lyra documentation MUST teach
Lyra token names first.

## Change evidence

Every token or visual-language change MUST include:

- the token tier, owner, rationale, and affected dependency edges;
- impacted baseline light, explicit light, dark, system-resolved, branded light,
  branded dark, and forced-color presentations;
- measured contrast evidence for every affected foreground, boundary, state,
  focus, and fallback pair;
- affected public custom properties, `.lyra-*` classes, components, adapters,
  and shadcn mappings;
- a fresh parity result with token and class counts plus placement, at-rule
  ancestry, and no-CDN checks;
- screenshots for each relevant theme, brand, viewport, direction, and
  interaction state, including forced colors when the change affects authored
  color behavior;
- reduced-motion evidence when the change affects animation or transition;
- migration notes, replacement examples, release timing, and deprecation status
  when a public token changes meaning, name, fallback, or support.

Evidence MUST identify the exact revision, test method, browser or measurement
tool, and expected result. A screenshot MUST NOT replace a contrast measurement
or semantic-state assertion.

## Acceptance criteria

Before this document moves to `Approved`, reviewers MUST verify every criterion:

- [ ] the three derived token tiers plus the external brand-input roots form an
      acyclic dependency model, preserve the closed radius and font exceptions,
      and distinguish public overrides from private implementation details;
- [ ] naming, addition, value change, alias, deprecation, removal, fallback, and
      browser-enhancement rules produce one reviewable decision path;
- [ ] ownership covers `fonts.css`, `colors.css`, `typography.css`,
      `spacing.css`, `effects.css`, `brand.css`, `base.css`, component CSS, and
      `compat-shadcn.css` without competing canonical sources;
- [ ] baseline light, explicit light, dark, system preference, nested dark
      scope, branded light, and branded dark behavior match the documented v1.0
      support boundary;
- [ ] color roles, status meanings, typography roles, font loading, density,
      spacing, sizing, radius, elevation, borders, and focus requirements are
      explicit and verifiable;
- [ ] rest, hover, active, focus-visible, selected, disabled, read-only,
      loading, error, warning, and success each have visual requirements and a
      defined coexistence rule;
- [ ] normal text, large text, required non-text UI, focus, generated brand
      colors, and composited states have measured contrast requirements with no
      general color-pair allowlist;
- [ ] forced-colors, color independence, reduced motion, and RTL rules preserve
      meaning without color or motion alone;
- [ ] raw-value exceptions are limited to intrinsic data visualization and
      documented consumer-provided values with contrast, forced-color, and
      non-color responsibilities;
- [ ] change evidence identifies every impacted theme, state, public token,
      class, component, adapter, compatibility mapping, parity result,
      screenshot, contrast result, and migration obligation;
- [ ] downstream interaction, component architecture, quality, and
      component-family specifications can cite these contracts without an
      unresolved visual-language decision;
- [ ] the PRD owner, design-system maintainers, and required accessibility
      reviewer have recorded the approvals assigned to them by governance.
