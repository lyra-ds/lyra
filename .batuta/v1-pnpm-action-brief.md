You are the implementation worker already delegated by Batuta. Edit directly in this existing worktree, no delegation/orchestration/worktree creation or commit.
# Apply reviewed pnpm action maintenance — low/maintenance
## Goal
Apply only the pnpm/action-setup6.0.10→6.1.0 update from Dependabot PR220 at head5c333c213c80c924372753f0aa6e41890d5cb3df.
## Context
The original PR failed only the obsolete experimental workflow-tree freeze; controller has repaired that gate in1b7629e. Primary release notes say6.1.0 adds pnpm12 support; this repo stays on pnpm11.13.1. Apply nine existing uses occurrences across four workflows: replace pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10 with pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0. Exactly the reviewed Dependabot delta, no other changes.
## Conventions
English. Follow existing YAML style and formatting. Every changed line traces to this digest/comment update; no cleanup/refactors. Preserve all triggers, permissions, inputs, other actions, images and package-manager pins. Do not invoke pnpm/npm/npx/corepack, install, or read WORK/history/raw executor logs. No new dependencies, no signal suppression. Work test-first from acceptance criteria; investigate failures instead of weakening checks. This reversible version-pin change needs existing checks, no new test implementation.
## Acceptance criteria
1. Exactly nine pnpm/action-setup uses in the four files receive the new reviewed SHA/comment, with no other diff. Proof: diff review and git diff --check.
2. Workflows remain valid; packageManager stays pnpm11.13.1 and no release operation occurs. Proof: controller actionlint1.7.12 and policy/security/release checks.
## Boundaries
No package/lock/source/config/runtime/other workflow edits, no services/Docker/Colima/remote actions. Do not touch WORK/.batuta or commit.
## Scope
.github/workflows/ci.yml
.github/workflows/deploy.yml
.github/workflows/release.yml
.github/workflows/sponsors.yml
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Actual changed paths/count and git diff --check output. Controller runs gates.
## Stop conditions
Code contradicts brief; same unexpected command failure twice; wider scope required.
For each criterion n, print isolated BATUTA-PROGRESS n START before first edit and BATUTA-PROGRESS n DONE after local proof passes.
