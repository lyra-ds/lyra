# Lyra v1 — Phase 1, Wave 2: Contrast Remediation Design

**Status:** Reviewed design awaiting user approval  
**Date:** 2026-08-14  
**Scope:** Remove the seven known `color-contrast` exceptions from the React and Alpine browser-test helpers by correcting the final rendered CSS at its source.  
**Constraint:** Preserve every public component API, adapter API, and theme/brand customization contract.

## Goal

Wave 1 made Chromium, Firefox, and WebKit an enforceable browser matrix. Wave 2 uses that matrix to turn the seven currently allowlisted axe contrast findings into ordinary, failing accessibility checks. The result is one unfiltered axe contract shared by React and Alpine: any future `color-contrast` violation fails the relevant test.

This wave is limited to contrast. Forced colors, reduced motion, RTL, touch-target sizing, and overlay migration remain later waves of the Phase 1 design.

## Decision

Use a hybrid remediation strategy.

- Correct a shared token only when its semantic role is invalid across all affected contexts.
- Correct a component/state declaration when the weak contrast is specific to one composite surface or interaction state.
- Keep the existing token names, component variants, adapters, markup contracts, and brand override mechanism. A visual token value or an internal component declaration may change; no public API is added, removed, or renamed.
- Remove the allowlist and filtering logic only after every known pair has a rendered regression test. The helpers will pass axe results directly to their assertion.

The Styles package remains the source of truth. React and Alpine consume the same CSS, so their work is restricted to shared axe-helper cleanup and adapter-level regression fixtures.

## Findings ledger

| Current foreground/background | Rendered context                                                     | Ownership decision                                                                                                                       | Required regression proof                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `#339357` on `#dcfce7`        | CalendarView program-session text on a success-tinted event          | Component semantic text/surface pairing in scheduling CSS; do not weaken all success text globally without measuring its other surfaces. | CalendarView event in light and dark themes, including its final chip background, passes axe and computed contrast.          |
| `#615fc2` on `#e0e1fb`        | CalendarView session text on an accent-tinted event                  | Component semantic text/surface pairing in scheduling CSS.                                                                               | CalendarView session event passes the same rendered-composite check.                                                         |
| `#6c739e` on `#121430`        | Dark `--text-faint` on card surface                                  | Shared dark faint-text role; it fails on all listed dark base surfaces.                                                                  | Representative faint text on card surface meets AA in dark mode.                                                             |
| `#6c739e` on `#0e1023`        | Dark `--text-faint` on page surface                                  | Shared dark faint-text role.                                                                                                             | Representative faint text on page surface meets AA in dark mode.                                                             |
| `#6c739e` on `#0b0d1d`        | Dark `--text-faint` on sunken surface                                | Shared dark faint-text role.                                                                                                             | Representative faint text on sunken surface meets AA in dark mode.                                                           |
| `#64748b` on `#f1f5f9`        | Light faint/muted text on a sunken surface                           | Contextual declaration where the quiet role is used as body-sized text; retain the token for contexts where it remains compliant.        | Affected component on `--surface-sunken` passes axe without an exception.                                                    |
| `#ffffff` on `#6e6ade`        | White `--on-accent` text while the dark accent hover state is active | Dark accent state ramp / on-accent-compatible state declaration; protect pointer hover, not just the resting button.                     | Primary interactive control is hovered in dark mode and passes axe plus a computed foreground/background contrast assertion. |

The precise selector changes are deliberately selected by rendered-composite measurement, not by matching color literals. This prevents a token edit from silently fixing one fixture while regressing another consumer.

## Implementation boundaries

### CSS and tokens

1. Map each ledger item to the final computed foreground, background, opacity, and state selector in `packages/styles`.
2. Change only the narrowest correct source:
   - the dark `--text-faint` semantic token for its three universally failing dark surfaces;
   - the CalendarView event treatment for the two tinted chip combinations;
   - the specific light sunken-surface consumer(s) for the light muted/faint combination;
   - the dark hover-state accent treatment for white-on-accent content.
3. Validate the standard theme plus the existing branded fixture. Brand custom properties remain supported; no fixed brand color is introduced as a substitute for a semantic token.

### Tests and axe helpers

1. Add or extend Styles Browser Mode fixtures that render every ledger context as users see it, including light, dark, brand, and hover state where relevant.
2. Add focused React and Alpine browser tests that exercise the affected adapters against the same final composites. Their assertions must use normal axe output and, for hover/state-sensitive cases, computed colors and the WCAG AA ratio.
3. Delete `ACCEPTED_CONTRAST_PAIRS` and every contrast-specific filter from:
   - `packages/react/src/internal/test-axe.ts`
   - `packages/alpine/src/internal/test-axe.ts`
4. Keep normal animation stabilization only; introduce no retry, timeout extension, rule disablement, severity change, snapshot, or new suppression.

### Release and documentation

- Add a patch changeset for `@lyra-ds/styles`, because rendered visual accessibility changes are published from that package.
- React and Alpine changes are test-helper/test-fixture only unless implementation evidence proves otherwise; they do not receive a changeset merely for test removal.
- Update the Phase 1 evidence/reporting record with the seven-pair mapping, measurements, and three-engine results. The Phase 1 design document remains the governing scope; this file defines Wave 2 execution decisions.

## Acceptance contract

Wave 2 is complete only when all of the following are true:

1. Neither axe helper contains an accepted contrast-pair set or filters `color-contrast` results.
2. Each ledger condition has a deterministic final-composite regression test; no test asserts only token source text.
3. The affected React and Alpine fixtures have zero axe violations with the unfiltered helpers.
4. Focused tests pass in Chromium, Firefox, and WebKit, then the complete Docker browser matrix passes in all three engines.
5. The standard and representative branded themes preserve their public token override behavior.
6. Type checking, formatting/lint checks, existing Phase 1 guardrails, and diff checks pass.

## Risks and controls

| Risk                                                       | Control                                                                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A global token change alters unrelated quiet text.         | Use the shared-token path only for roles failing across their documented surfaces; test representative unaffected consumers before accepting it. |
| A hover-only failure is missed by a resting-state fixture. | Drive real pointer hover and end the transition before measuring and running axe.                                                                |
| A brand override masks or reintroduces a failing state.    | Run the affected composite in the established brand fixture as well as the default theme.                                                        |
| Removing the filter exposes unrelated historical findings. | Treat each new violation as a defect to locate and remediate at source; do not reinstate a broad exception.                                      |
| Adapter fixtures diverge from Styles behavior.             | Share the final rendered CSS contract and verify the same scenario through Styles, React, and Alpine browser suites.                             |

## Verification sequence

1. Establish a failing rendered regression for one ledger item before changing its CSS source.
2. Apply the minimal token or selector correction and rerun that fixture in Chromium, Firefox, and WebKit.
3. Repeat until all seven entries are green; then remove the shared helper exceptions.
4. Run focused Styles, React, and Alpine browser tests in all engines.
5. Run the complete Docker Compose browser matrix serially by engine, followed by the normal TypeScript, lint, Phase 1 guardrail, and diff checks.
6. Request independent code review before the Wave 2 PR is created; only then open the PR and monitor its required CI and automated review to merge eligibility.
