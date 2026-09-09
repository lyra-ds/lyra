You are the implementation worker already delegated by Batuta. Apply a single bounded retry directly, no delegation/orchestration/package managers/services/commit.
# pnpm action owner-pin retry — maintenance/low
## Goal
Align the deployment validator's exact action pin with the reviewed PR220 update already applied to workflows.
## Context
Controller actionlint, security check-lock, experimental repository policy and release-policy checks pass. The genuine deploy-policy CLI fails: production deploy semantics differ from the approved snapshot. The correct Vitest deploy-policy suite is23/80, with57 cascading expected-message failures because productionSteps still expects the old pnpm SHA at deploy-policy.mjs:10. Initial controller attempts used the wrong security filename/Node test runner; corrected runs confirm the specific owner-pin mismatch. The four workflow diffs are correct, preserve them.
## Conventions
All conventions/method/boundaries from .batuta/v1-pnpm-action-brief.md remain except explicitly expanded Scope. Exact pinned SHA security validation remains; no accepting arbitrary hashes. Read only this feedback, the original brief and owner file; do not read history. No new tests for this metadata-only change; existing80 tests exercise valid workflow and mutation rejection.
## Acceptance criteria
Replace only the old pnpm/action-setup SHA in productionSteps with ea17c68df8912ef543352723c149a84f56e3d413. No other semantics/check changes. Proof git diff --check and controller deploy-policy CLI + existing80 Vitest cases.
## Boundaries
No weaker matcher, skipped test, additional action changes, package/lock/service/Colima/remote change.
## Scope
tools/file-upload-evidence/scripts/deploy-policy.mjs — only the productionSteps pnpm/action-setup digest.
Preserve the four already correct workflow files; do not change anything else. Stop/report if wider changes required.
## Expected evidence
One-line diff and actual git diff --check result. Controller runs final checks.
## Stop conditions
Contradictory source; same command fails twice; wider scope needed.
Print isolated BATUTA-PROGRESS 1 START before editing and BATUTA-PROGRESS 1 DONE after local diff proof passes.
