# FileUpload current-candidate runtime — 2026-09-15

`pnpm performance:file-upload` completed with exit0 at candidate `3ea446a56739ffd508bc2bcec975e8f0e574ece1`. The existing DF-FU-15 production consumer and validator passed all six operations on native macOS arm64. This closes the current artifact-pair measurement gap identified in [remaining acceptance](remaining-acceptance.md), not canonical acceptance or complete V1 qualification.

## Results

100 controlled items,20 active attempts; three warm-ups then30 measured samples per operation. Chromium151.0.7922.34, Node24.18.0, Playwright1.62.1, Vite8.2.1;1280×720 at1x, en-US, light. All limits are unchanged: p95≤100ms, worst<250ms, longest task<50ms under the existing validator. Values below are milliseconds rounded for display; raw JSON preserves full precision.

| Operation | Samples | Median | p95 | Worst | Longest task | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `selectionIntentDispatch` | 30 | 0.200 | 0.300 | 0.300 | 0.000 | PASS |
| `controlledProgressReconciliation` | 30 | 0.600 | 0.900 | 1.100 | 0.000 | PASS |
| `cancelIntent` | 30 | 0.400 | 0.500 | 0.500 | 0.000 | PASS |
| `retryIntent` | 30 | 0.400 | 0.400 | 0.500 | 0.000 | PASS |
| `confirmedRemovalFocusRecovery` | 30 | 0.800 | 1.200 | 1.400 | 0.000 | PASS |
| `teardown` | 30 | 0.100 | 0.200 | 0.200 | 0.000 | PASS |

The largest operation p95 was1.200ms and the worst sample1.400ms. Longest task was0 in the producer's measured operation windows; this does not assert the application never generates a long task outside those windows. Results are scoped to the existing fixture-owned measurement boundaries and environment, not a universal input-to-paint SLA or an OS performance comparison.

## Exact identity and preservation

The existing producer rebuilt React, packed and extracted React/Styles, built its production Vite fixture and measured through Chromium. Its reported complete tarball identities match the previously qualified shared pair:

- React0.5.0: `658d9faf2987c5401baf2e665b92ad9b12d7b2f507d6385035006cd06c18a5da`.
- Styles0.5.0: `74fd16fc24d58345b4fccdf30681b37218079dea0646f09c765727aa570489f3`.

Controller checked all2156 tracked files and473 shipped distribution/CSS files before/after: unchanged. The worktree stayed clean before reporting. Existing producer cleanup completed; no newly created runtime temporary directory remained. No custom runner, permanent test, dependency or product change was needed. Installed peer reuse in the existing producer is not fresh-install compatibility proof.

Raw MAIN `.batuta/runs/file-upload-current-runtime-20260915/` retains original stdout/stderr, exit and duration, exact parsed `runtime.json`, the existing renderer's `runtime.md`, tracked/shipped guards, temp inventory and preservation checks. Controller independently invoked the existing evidence validator and renderer on the captured JSON; no second benchmark or unrelated broad test run was needed.

## Acceptance disposition

The accepted pointer still names `0003123e22ec57d21946b3f6f383fd2da7d1bd0a` and its old artifact hashes. No canonical report, baseline/pointer, ledger or validator was changed. `--check` was not invoked: it requires the accepted pair's exact hashes and does not accept a new pair. Fresh measurement PASS and canonical acceptance remain different outcomes; consolidate this evidence through the eventual bounded acceptance step.

Verification-only controller execution using the established Batuta verification workflow; no delegable implementation, retry or escalation. Existing common/source/packed/compatibility/budget evidence remains reusable within unchanged identities. Applicable media/interaction mapping, native Linux/Windows integration observations and final acceptance remain open. No new queue, remote/release/container/resource action or old-loop restart.
