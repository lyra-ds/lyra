# Candidate acceptance mechanism — 2026-09-18

Bounded implementation of the prepared candidate acceptance proposal, on branch `feat/v1-candidate-acceptance` from merged main `650b326`. Tool and test changes only: `tools/v1-release/check.mjs`, `check.test.mjs`, `tools/bundle-baseline/budgets.mjs`, `measure.mjs`, `measure.test.mjs`, and one README subsection under `docs/superpowers/baselines/lyra-v1/`. No product bytes, dependency, CI workflow, numerical limit, approved exception, `program.json`, `current.json`, FileUpload comparison or `comparisons/core/` directory changed. The tracked ledger remains `schemaVersion: 1` / `planning`; this delivers the mechanism, not a candidate claim.

## Contract delivered

- `schemaVersion: 1` keeps its planning-only rules; the only new rejection is an unknown top-level ledger key (a `candidate` block or `runtimeEvidence` entry in a v1 ledger).
- `schemaVersion: 2` requires `releaseStatus: 'candidate'` and a `candidate` block with `sourceRevision` (40-hex) and exactly `styles`/`react`/`alpine` packages, each `{ name, version: '1.0.0', tarball: lyra-ds-<pkg>-1.0.0.tgz, sha256, path }`. A non-null `path` must be a Git-tracked file under `comparisons/core/<sourceRevision>/` whose bytes hash to `sha256`; `null` defers archive identity to the bundle gate.
- Every component in a v2 ledger must be `qualified`. Each acceptance cell is `{ result: 'PASS', revision, artifact, sha256 }` with `revision === sourceRevision`, the artifact tracked under the core directory and hash-verified from bytes. Deferred, unavailable or failed cells are rejected as cells. `immutableEvidence` becomes `{ path, sha256 }` objects. `runtimeEvidence` is either PASS with a hash-bound core artifact or `{ result: 'deferred', basis: 'numerical-runtime', decision: '.batuta/specs/2026-09-15-v1-runtime-scope-proposal.md' }`, never PASS with a decision.
- The CLI reads bytes once per referenced path (`documents` for text, `hashes` for everything; archives are hashed, never decoded) and, for v2 ledgers, additionally requires the accepted FileUpload pointer's comparison to carry the candidate React and Styles hashes (`validateFileUploadBinding`).
- `checkBundleBudgets(reference, candidate, { ledgerCandidate })` cross-checks freshly packed version/tarball/sha256 for the three packages against the ledger and reports `candidateBinding`; `runBundleBaselineCli` passes the block only for `--check-budgets` and only when the program ledger is v2/candidate, otherwise `candidateBinding: null`.

## Verification (controller, Node 24.18.0 via mise, pnpm 11.13.1, macOS arm64)

| Check | Result |
| --- | --- |
| `node --test tools/v1-release/check.test.mjs` | 114 pass, 0 fail (108 pre-existing + 6 added) |
| `node --test tools/bundle-baseline/measure.test.mjs` (after React/Alpine builds) | 42 pass, 0 fail |
| `pnpm v1-release:check` on the unchanged tracked ledger | `Lyra V1 program ledger is internally consistent.` |
| `pnpm v1-core:check` after the README subsection | `Lyra V1 Core policy is internally consistent.` |
| `pnpm exec prettier --check .` | all files formatted |
| `pnpm baseline:bundles --check-budgets` on this tree | `pass`, 72 standalone, 5 scenarios, 4 CSS entries, `candidateBinding: null`; fresh archives React `9d07d9dd…`, Alpine `324c2adc…`, Styles `f88b5ada…`, identical to the PR #231 official gate |

Negative proofs live in the tests: nineteen v2 mutations each assert a distinct error string (planning status with v2, missing candidate keys, wrong package name/version/tarball/hash, archive path escape, archive hash mismatch, malformed `sourceRevision` with a non-null path reported without throwing, cell revision/location/hash mismatch, deferred cell, string or mismatched immutable evidence, missing/invalid/wrong-decision runtime evidence, PASS-with-decision, unqualified component); FileUpload binding rejects pointer, revision and hash mismatches; the CLI rejects an untracked archive path; the bundle gate rejects sha256, version and tarball mismatches and returns a report deep-equal to the option-less call when no ledger candidate is supplied. Existing tests are unchanged except `rejects wrong schema`, whose expectation moved from `schemaVersion must equal 1` to `schemaVersion 2 requires releaseStatus candidate` because a bare `schemaVersion: 2` is now a candidate-shape error.

Not run here: the full root `pnpm test` and browser suites; the change touches no package source, and CI runs both jobs on the pushed head.

## Routing and adjudication

Codex/`gpt-5.6-terra` medium implemented the brief in one round (its own verification failed only on sandbox limits: `ERR_PNPM_PNPM_ENGINE_IDENTITY_UNVERIFIABLE` and missing `dist`, both reproduced as environment-only). Controller corrections before verification: removed a misleading `schemaVersion must equal 1` message for a missing candidate block (now `schemaVersion 2 requires a candidate block`), removed a no-op `entryId` helper, and added a 40-hex guard in `isCoreEvidencePath` so a malformed `sourceRevision` with a non-null archive path reports an error instead of throwing from `path.resolve`; one regression test covers these. Independent OpenCode/`glm-5.3-flash` review of the final diff: 3/3 DONE, no findings (first invocation misparsed the attached-file argument and produced no verdict; the retry read the working tree). Raw logs: `.batuta/v1-candidate-acceptance-{brief,executor.log,review.log,budgets.log}` in this checkout (untracked).

## Open decisions and next steps

1. Inline-axis placement disposition (see the composed/media reconciliation) — unchanged, maintainer decision.
2. Whether to track candidate tarballs in `comparisons/core/<rev>/` (React ≈ 2.1 MB). The checker supports both; `path: null` relies on the bundle-gate cross-check.
3. Producing an actual candidate remains separate: 1.0.0 versions, refreshed evidence per the reconciliation's refresh obligations, FileUpload re-acceptance on the candidate pair, and a v2 ledger. None of that is authorized or started by this record; no push, Version Packages merge, versioning or publication.
