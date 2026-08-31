# Lyra v1.0 Phase 0 evidence

This index records the Phase 0 contract and baseline artifacts. Phase 0 defines
the supported browser and assistive-technology matrix; it does not claim that
the complete matrix has already been executed.

## Deliberate V1 program

- [Machine-readable V1 program ledger](./program.json)
- [Approved deliberate-release design](../../specs/2026-08-30-lyra-v1-deliberate-release-design.md)

The ledger is the machine-readable completion source for the remaining P1
contracts. A `planned`, `specified`, `evaluating`, or `implementing` entry is
not complete. Only `qualified` with complete immutable evidence can satisfy the
V1 exit gate.

## Approved product and foundational specifications

- [Lyra v1.0 roadmap PRD](../../specs/2026-08-12-lyra-v1-roadmap-prd.md)
- [Design and product principles](../../specs/lyra-v1/01-design-product-principles.md)
- [Tokens and visual language](../../specs/lyra-v1/02-tokens-visual-language.md)
- [Interaction and accessibility](../../specs/lyra-v1/03-interaction-accessibility.md)
- [Component architecture](../../specs/lyra-v1/04-component-architecture.md)
- [Quality and performance](../../specs/lyra-v1/05-quality-performance.md)

## Public support policy

The component-by-stack matrix and environment policy are published in the
[English support guide](../../../../apps/docs/content/docs/en/guides/support.mdx)
and
[Brazilian Portuguese support guide](../../../../apps/docs/content/docs/pt-BR/guides/support.mdx).

The automated v1.0 policy pins Playwright 1.62.1 with Chromium revision 1234
(`151.0.7922.34`), Firefox revision 1538 (`153.0`), and WebKit revision 2336
(`26.5`). Current CI runs this Chromium, Firefox, and WebKit matrix inside the
existing `test` job.

Under the active Automated Core beta profile, manual Windows/NVDA and
macOS/VoiceOver evidence is non-blocking post-release evidence labeled
`deferred-by-release-profile`; it has not been completed and is not a pass. The
optional Full profile retains the original desktop and conditional mobile
manual-review requirements.

## Bundle baseline

The [machine-readable baseline](./bundles.json) and
[review report](./bundles.md) record revision
`fcde81582ad8b60f9cf42fc5989d71e45b10efc7`, owned by Lyra maintainers. They
cover the standalone React and Alpine entries, five representative scenarios,
and four public CSS entries using packed artifacts and the reproducible
quality-11 Brotli protocol.

## Overlay decision evidence

The
[overlay-foundation ADR template](../../templates/overlay-foundation-adr.md)
defines the evidence required to evaluate the incumbent Lyra implementation,
Radix, Base UI, and the active Zag.js direction. It is a template only; no
overlay candidate evaluation or implementation plan is part of Phase 0.

The draft
[overlay-foundation evaluation design](../../specs/2026-08-31-overlay-foundation-evaluation-design.md)
defines the proposed isolated harness, equal-fixture protocol, immutable
evidence model, and decision checkpoints. It does not select or install a
candidate.

## Release policy

- [Independent package versioning policy](../../../../VERSIONING.md)
- [Changesets configuration](../../../../.changeset/config.json)
- [Release-policy checker](../../../../tools/release-policy/check.mjs)

Styles, React, and Alpine use independent SemVer. Shared-contract changes
coordinate only the affected package releases, while the Lyra v1.0 suite still
requires all three packages to reach `1.0.0` independently.

## CI commands

| Required job | Command                         | Protected evidence                                      |
| ------------ | ------------------------------- | ------------------------------------------------------- |
| `lint`       | `pnpm phase0:check`             | Overlay ADR template structure                          |
| `lint`       | `pnpm release-policy:check`     | Independent-versioning policy and release configuration |
| `build`      | `pnpm baseline:bundles --check` | Packed-artifact bundle baseline drift                   |

These checks run as steps inside the existing `lint` and `build` jobs. The
frozen required-check contexts remain `lint`, `typecheck`, `test`, and `build`.

## Phase 0 exit checklist

- [x] The roadmap PRD and all five foundational specifications are approved.
- [x] The component-by-stack support matrix and browser/assistive-technology
      policy are public in English and Brazilian Portuguese.
- [x] Reproducible standalone, scenario, and CSS bundle evidence is recorded
      with an immutable revision and owner.
- [x] The overlay ADR evidence template exists and its structure is checked.
- [x] Independent package versioning is documented and machine-checked.
- [x] Bundle, ADR-template, and release-policy drift gates are integrated into
      the existing required CI jobs.
- [x] The pinned Chromium, Firefox, and WebKit matrix runs in the existing
      `test` job.
- [ ] Manual Windows/NVDA and macOS/VoiceOver workflow execution is deferred to
      optional post-release evidence under Automated Core and is not passed.

The overlay-family specification is approved. A separately approved evaluation
design and implementation plan must compare the incumbent, Radix, Base UI, and
the active Zag direction before any candidate dependency or production overlay
migration is authorized.
