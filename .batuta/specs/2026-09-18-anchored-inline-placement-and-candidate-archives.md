# Anchored inline placement and candidate archive storage — maintainer decisions (2026-09-18)

**Status:** Approved by the maintainer on 2026-09-18 ("Concordo com os dois"), after the recommendation recorded below. Documentation-only; no product, test, budget, ledger status or release change.

## Decision 1 — inline-axis placement contract for V1

The `OF-ANCHORED` placement owners (`packages/react/src/internal/use-flip-placement.ts`, `packages/alpine/src/internal/flip-placement.ts`) implement a vertical preferred-side fit with flip and a bounded scroll region, plus a measured logical alignment flip between `start` and `end` against the visual viewport. They do not implement the continuous "shift along that side" originally worded in the overlay family design, clause 3 of the anchored layer contract.

Decision: accept the discrete `start`/`end` alignment flip as the V1 contract. Clause 3 of `docs/superpowers/specs/2026-08-30-overlay-family-design.md` is amended to state this explicitly; the continuous inline shift becomes a post-1.0 enhancement, not a V1 requirement. The `rtl`/`ltr` and `coarse-pointer` cells for `OF-ANCHORED` continue to map to the existing source alignment cases and the PR #231 native scroll proofs recorded in `.batuta/reviews/v1-product-review/composed-media-tooltip-reconciliation.md`.

Rationale: the flip covers the reproduced consumer geometry (a popup wider than the room on one inline side); no public fixture reproduced a popup that fits on neither inline side at 390 px. Implementing a continuous shift now would change both placement owners and their CSS alignment rules, add test cases and require a new packed budget round against the thirteen limits approved on 2026-09-17, with a real risk of breaching the `@lyra-ds/react/dropdown` and `popover` caps.

Follow-up obligations: when the component migration guides are authored for the candidate ledger, the Popover, Dropdown and WorkspaceSwitcher entries state that inline overflow is resolved by alignment flip only. A post-1.0 issue may propose the continuous shift with its own budget decision.

## Decision 2 — candidate archives are not tracked in Git

The candidate acceptance mechanism (`tools/v1-release/check.mjs` schemaVersion 2, PR #232) allows each candidate package to carry either `path: null` or a tracked archive path under `docs/superpowers/baselines/lyra-v1/comparisons/core/<sourceRevision>/`.

Decision: use `path: null`. Candidate identity is proved by the recorded SHA-256 in the ledger and by `pnpm baseline:bundles --check-budgets`, which repacks the three packages in CI and compares name, version, tarball and SHA-256 against the ledger in candidate mode. Tracking the archives (React ≈ 2.1 MB per candidate) would add permanent binary history without adding proof; the FileUpload comparison pattern never tracked archives either.

Durable copies of the exact `1.0.0` tarballs, if wanted, are attached to the GitHub Release for 1.0.0 together with the ledger hashes, outside Git. No checker change is needed for either choice.

## Boundaries

This record grants no candidate qualification, versioning, Version Packages merge or publication. It closes the two decisions left open by the composed/media reconciliation and the candidate acceptance mechanism records.
