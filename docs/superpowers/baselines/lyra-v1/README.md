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

The approved
[overlay-foundation evaluation design](../../specs/2026-08-31-overlay-foundation-evaluation-design.md)
defines the isolated harness, equal-fixture protocol, immutable
evidence model, and decision checkpoints. It does not select or install a
candidate.

The approved
[overlay-foundation core protocol implementation plan](../../plans/2026-08-31-overlay-foundation-core-protocol.md)
wires the repository-owned validation and incumbent-characterization harness.
It does not select or install a candidate.

The approved modal wave now exposes a container-only local diagnostic for the
same four candidates across 15 cells: `chromium`, `firefox`, `webkit`,
`react-18`, `react-19`, `ssr`, `hydration`, `keyboard-focus`, `axe-light`,
`axe-dark`, `forced-colors`, `reduced-motion`, `ltr`, `rtl`, and
`coarse-pointer`. Its external manifest binds the clean pre-manifest revision;
its external evidence preserves attempt 1 as the effective result. The eight
cells `bundle-standalone`, `bundle-composition`, `packed-esm`, `packed-cjs`,
`packed-types`, `consumer-vite`, `consumer-next`, and `consumer-commonjs`
remain owned by the later decision-evidence plan.

The container uses only
`mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`
and the explicit `OVERLAY_NODE_ROOT`, `OVERLAY_INPUT_ROOT`,
`OVERLAY_EVIDENCE_ROOT`, `OVERLAY_OWNED_WORK_ROOT`, and
`OVERLAY_EVALUATION_REVISION` bindings. The tracked manifest does not
authorize production use, change ledger status, select a foundation, or supply
the eight later cells. Modal evidence remains local diagnostic evidence and is
non-authoritative until the separately approved decision process is complete.

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

The anchored interaction wave adds a local diagnostic for `OF-ANCHORED`,
`OF-MENU`, and `OF-TOOLTIP`: 11 anchored, 14 menu, and 13 tooltip scenarios across
the same 15 behavioral cells. From a clean checkout, run
`env TMPDIR=/private/tmp mise exec node@24.18.0 -- pnpm overlay:evaluate:wave2:auto --output /Volumes/Home/francisross/tmp-builds/lyra-wave2-diagnostic-unique`.
Choose a new canonical external output directory. The command prepares the exact
Linux toolchain automatically, validates owned container networking, and retains
the external manifest, bundle, evidence and command logs. The manifest binds the
clean pre-manifest revision; only evaluated bytes are tracked afterward. Attempt
1 stays effective. A 656-record coverage total does not prove execution of tuples
marked unavailable after core failure. This local diagnostic does not authorize
production use, foundation selection or changes to V1 ledger statuses. See the
[harness documentation](../../../../tools/overlay-foundation-evaluation/README.md)
for the ten pinned artifacts, practical input/clock/SSR limitations and the eight
later decision-evidence cells.
