# Lyra Blade follow-up integration

**Status:** Approved for roadmap integration

**Date:** 2026-08-13

**Decision owner:** Lyra maintainer

## Context

The Blade port already exists in the sibling `lyra-ds/blade` repository. Its
`v0.10.0` release provides 42 static and 30 interactive components, consumes
`@lyra-ds/styles` as the visual source of truth, and uses `@lyra-ds/alpine` for
interactive behavior. Class-emission fixtures enforce parity with the current
React component surface.

The Lyra v1.0 roadmap will change React component contracts and interaction
infrastructure. Updating Blade before those contracts stabilize would create
avoidable rework, but treating Blade as an unbuilt future adapter would
misrepresent the existing product.

## Decision

Blade remains outside the Lyra v1.0 release gate. It MUST NOT delay the v1.0
release of `@lyra-ds/styles`, `@lyra-ds/react`, or `@lyra-ds/alpine`.

After the affected React contracts stabilize, Lyra MUST run a separate Blade
follow-up track against the approved React, Alpine, and CSS contracts. The Blade
release MAY occur later and keep independent SemVer. Documentation MUST NOT
claim compatibility with a changed contract until the Blade repository records
the corresponding conformance evidence and version ranges.

An affected React contract is stable for this handoff only when its governing
family specification is `Implemented`, its public API and migration material
are published, and the compatible Styles and Alpine ranges are known.

## Sequence

1. Approve the Lyra v1.0 foundational and relevant component-family specs.
2. Stabilize the affected React public contracts and shared CSS/Alpine behavior.
3. Publish the contract changes, migration examples, and compatible package
   ranges needed by downstream adapters.
4. Create a scoped implementation plan in `lyra-ds/blade` for affected
   components only.
5. Update Blade markup, props, documentation artifacts, Alpine bindings, and
   migration guidance where required.
6. Verify class parity, observable interaction conformance, rendered HTML,
   documentation-artifact freshness, Laravel/PHP support, and compatibility
   ranges.
7. Release Blade independently when its evidence is complete.

## Boundaries

- Current Lyra foundational work MUST NOT modify Blade runtime code.
- Blade MUST remain a real downstream adapter in roadmap language, not an
  unevaluated future possibility.
- Blade parity MUST mean compatibility with every contract it claims, not full
  React catalog identity.
- Components intentionally absent from Blade MAY remain absent when the Blade
  repository documents the reason and supported composition.
- A delayed Blade release MUST NOT weaken Lyra v1.0 gates or create unsupported
  compatibility claims.

## Acceptance criteria

- [x] the roadmap recognizes the released Blade port and its separate
      repository;
- [x] Blade evolution begins only after affected React contracts stabilize;
- [x] Blade does not block the Lyra v1.0 release gate;
- [x] Blade may retain independent versioning and release timing;
- [x] compatibility claims require explicit package ranges and conformance
      evidence; and
- [x] current foundational work remains documentation-only for Blade.
