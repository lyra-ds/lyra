# Approved migration ceilings — 2026-09-16

**The complete native bundle-budget gate passes.** The maintainer approved the [seven exact exception values](../../specs/2026-09-16-popover-migration-exceptions.md) with “De acordo”. OpenCode/GLM low lane applied exactly seven numeric substitutions in `tools/bundle-baseline/budgets.mjs`, without retry or escalation. No runtime, manifest, dependency, default ceiling or other cap changed.

Controller verification:

- `pnpm baseline:bundles --check-budgets`: PASS for 72 standalone entries, five scenarios and four CSS entries, using the existing cold installed-tarball producer.
- Existing budget tests, `pnpm test` and scoped formatting: PASS.
- The captured exact candidate passes the amended policy; each of seven independent +1-byte growth probes fails with the expected entry and threshold. No permanent test or producer was added.
- Fresh standalone/scenario raw, minified and Brotli measurements match the preceding collection exactly. All three archive SHA-256 values are identical, and all 479 non-manifest shipped files remain byte-identical after checks.

React: `36ccce5faa6495204e421ee9880b9e7e6a83bfae6d5e308e3e29e22fc5b7abaf`.
Alpine: `09c6351db2f7ad35dfe44e68c91e782d4f71b3e84aa0c00fa0d02a0ed8f1c0b3`.
Styles: `e45ff57fd43e8bc0094c9c574e25ff5721128cd185e7a12979ae8892a8c33bf6`.

The fresh report records base `b57c4d5` plus the retained seven-value diff; it is not presented as a clean pre-change measurement. Previous failures and the fixed reference remain unchanged. No canonical acceptance pointer was promoted. Existing runtime/compatibility/media proofs retain their identities and remain reusable through the exact byte binding.

Raw evidence: controller `.batuta/runs/approved-migration-caps-20260916/` contains approval/scope proof, executor output, exact diff, public report, command exits, seven boundary probes and measurement/artifact reconciliation. This closes the recorded size blockers. Remaining media/touch applicability, native Linux/Windows integration and consolidated V1 acceptance are distinct from this PASS; no push, version or release action occurred.
