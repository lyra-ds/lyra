# Run — pnpm action maintenance

**Date:** 2026-09-09 · **Lane:** maintenance/low · **Executor:** OpenCode opencode/glm-5.3-flash
**Commit:** pending · **Verdict:** ✅ approved

## Brief
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

## Executor report
BATUTA-PROGRESS 2 DONE
```

Evidence:
- Changed paths/count: `.github/workflows/ci.yml` (4), `deploy.yml` (2), `release.yml` (2), `sponsors.yml` (1) — nine `pnpm/action-setup@0977fd9… # v6.0.10` → `pnpm/action-setup@ea17c68… # v6.1.0`
- `git diff --check`: clean (no output, exit 0)
- `git status --porcelain`: only the 4 workflow files modified (rest are pre-existing untracked `.batuta` run logs, untouched)
- Old SHA grep in workflows: zero matches; new SHA: 9 matches
- Note: `tools/file-upload-evidence/scripts/deploy-policy.mjs:10` still lists the old SHA — outside scope list, left untouched per boundaries

Criterion 2 actionlint/policy gates: controller-run.

## Retry report
Report:

- Change: `tools/file-upload-evidence/scripts/deploy-policy.mjs:10` only — old pnpm SHA `0977fd99725f1db4007ccb2928dbb4e90d06cc86` → `ea17c68df8912ef543352723c149a84f56e3d413`. One-line diff shown above.
- `git diff --check`: clean (exit 0), "git-diff-check-OK".
- Controller deploy-policy CLI (`deploy-policy.mjs .github/workflows/deploy.yml`): passes ("DEPLOY-CLI-OK").
- Vitest deploy-policy suite: `scripts/deploy-policy.test.mjs` → **80/80 passed**.
- Note: full package suite has 1 unrelated pre-existing failure in `src/static-output.test.mjs` (vite/rolldown fails resolving `@lyra-ds/alpine`). Verified pre-existing by stashing my change — same failure occurs without it. Not touched; no scope expansion.
- Four workflow files and everything else untouched. No commit.

## Verification
# pnpm action maintenance verification

Approved local adoption of PR220's workflow update; implementation commit pending. OpenCode GLM5.3Flash/low, one owner-pin retry, no escalation. Four workflow diffs are byte-identical to the retained PR220 diff: nine pnpm/action-setup SHA/comment updates6.0.10→6.1.0. The matching deployment validator productionSteps pin advances to the same exact SHA; no matcher or other deployment behavior is relaxed. packageManager remains pnpm11.13.1. No remote PR merge/push/dispatch/publication.

Controller final checks under pinned Node24.18.0: actionlint1.7.12, repository policy10/10, security check-lock, release-policy, deploy-policy CLI, deploy80/80, complete evidence package349/349 after existing Alpine build prerequisite, and format PASS. Initial genuine old-owner pin failure: deploy-policy CLI snapshot mismatch and deploy57failed/23passed; exact pin alignment fixes it. Initial controller wrong security filename and Node runner for a Vitest file were invocation errors; corrected paths/runner are recorded. Executor's broad package probe found missing Alpine dist; controller built the existing Alpine owner and verified all349 without source fixes.

Independent GLM review2/2 DONE/no findings, unchanged status/diff/five-file guard, Batuta verifier PASS. Controller clarification: final-checks.json is controller-run evidence, despite review calling it executor-recorded. Raw .batuta/runs/v1-pnpm-action/; review raw/guards/verifier in main .batuta/runs/2026-09-09-pnpm-action-review/.

No library dependency versions have changed yet. First selected batch is11 tooling/docs updates; six compiler/native/runtime-fixture updates and Changesets majors are deferred. Before dependency updates, full React Chromium/SSR baseline763 tests reports761 pass and2 existing WorkspaceSwitcher color-contrast failures. This is an independent current V1 defect, not caused by dependency updates; preserve exact failures and repair before final release qualification.
