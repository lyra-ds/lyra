---
phase: 01-monorepo-foundation-governance
plan: 01
subsystem: platform-governance
tags: [github, git, branch-protection, security, bootstrap]
status: complete
requires: []
provides:
  - "GitHub org lyra-ds (user-created, D-01)"
  - "Public repo github.com/lyra-ds/lyra with full main history (D-02)"
  - "Ruleset 'main-protection' on default branch: pull_request + deletion + non_fast_forward, NO required status checks (D-07)"
  - "Private vulnerability reporting enabled on lyra-ds/lyra (consumed by plan 01-03 SECURITY.md)"
  - "Local branch gsd/phase-1-monorepo-foundation-governance"
  - "Confirmed LICENSE copyright line + public enforcement contact (consumed by plan 01-03)"
affects:
  - "plan 01-03 (LICENSE, CODE_OF_CONDUCT.md, SECURITY.md consume the recorded decisions below)"
  - "plan 01-05 (adds required_status_checks to the ruleset selected BY NAME 'main-protection')"
  - "all Phase-1 plans (must commit to the phase branch; main is PR-only)"
tech-stack:
  added: []
  patterns:
    - "Two-step branch-protection bootstrap (research Pattern 3): protect main with PR rule first, add required checks only after CI reports once"
    - "Pre-publication disclosure audit gates the first public push"
key-files:
  created: []
  modified:
    - ".planning/config.json (git.branching_strategy: none -> phase)"
    - ".planning/STATE.md (execution-start bookkeeping)"
decisions:
  - "LICENSE copyright holder line confirmed by user (corrected from the plan's proposed default)"
  - "Public enforcement/security contact changed by user to a domain alias"
  - "Ruleset created with required_approving_review_count: 0 (solo maintainer merges own PRs after green CI)"
metrics:
  duration: "~47m (including human checkpoint wait)"
  completed: 2026-07-17
---

# Phase 01 Plan 01: GitHub Remote Bootstrap & Branch Protection Summary

Bootstrapped the public `lyra-ds/lyra` repo behind a PR-only ruleset, published the existing history after a clean pre-publication disclosure audit, and flipped GSD to phase-branch mode so no commit can strand on protected main.

## Recorded decisions

**These two values are authoritative and were explicitly confirmed/corrected by the user at the Task 1 checkpoint. Plan 01-03 consumes them verbatim — do NOT re-infer either value.**

| Decision | Confirmed value | Notes |
|---|---|---|
| LICENSE copyright line | `Copyright (c) 2026 Francisross Soares de Oliveira and Lyra DS contributors` | **CORRECTED by the user.** The plan proposed `Francisco Soares de Oliveira` — that was wrong. The legal first name is **Francisross** (one word, matches `git config user.name`). This is exactly the inference error the review finding warned about: git author name and legal name must never be guessed. |
| Public enforcement / security contact | `security@francisross.com.br` | **CHANGED by the user** from the proposed default `franciscpd@gmail.com`. The user chose a domain alias. Goes into CODE_OF_CONDUCT.md (enforcement) and SECURITY.md (reporting) in plan 01-03. |

## What was built

| Artifact | State |
|---|---|
| Org `lyra-ds` | Exists; description contains `CSS-first` (verified via API, not merely declared) |
| Repo `lyra-ds/lyra` | PUBLIC, created empty (no auto-init/license/gitignore — LICENSE is plan 01-03's) |
| main history | Pushed; `git ls-remote` SHA == local `git rev-parse main` == `6c9b91d` |
| Ruleset `main-protection` | id 19106586, enforcement `active`, target `~DEFAULT_BRANCH`, `bypass_actors: []`, `current_user_can_bypass: "never"` |
| Private vulnerability reporting | `{"enabled": true}` |
| Branch `gsd/phase-1-monorepo-foundation-governance` | Active local branch |

## Pre-publication disclosure audit (Task 2 step 4)

Both scans ran **before** the first push and **both exited non-zero (no matches)**:

- **4a — sensitive filename scan** across all history (`--diff-filter=A` over `--all`): no hits.
- **4b — secret-pattern scan** across **all 23 revisions**, with **`.planning/` INCLUDED** per the round-2 review finding. Only `node_modules` was excluded. No hits, so **no suppressions were needed and no directory was re-excluded**.

`gitleaks` is **not installed** on this machine (confirmed at execution time), so the regex scan ran as the documented fallback — not as an equivalent substitute. Installing `gitleaks` remains the preferred gate for future publication events.

## Verification results

Task 2 `<automated>` — **PASS** (org login + `CSS-first` description + remote/local SHA match + ruleset name + PVR enabled, all chained).

| Acceptance criterion | Result |
|---|---|
| `gh repo view --json visibility` | `PUBLIC` |
| remote main SHA == local main SHA | `6c9b91d8d6d8...` both sides |
| Both disclosure scans clean pre-push, `.planning/` included | Confirmed above |
| org description contains `CSS-first` | Verified via API |
| rulesets include exactly `main-protection` | `main-protection` |
| rules on main | `deletion,non_fast_forward,pull_request` |
| `required_status_checks` absent | Confirmed absent |
| PVR enabled | `true` |

Task 3 `<automated>` — **PASS**. `git branch --show-current` = `gsd/phase-1-monorepo-foundation-governance`; config contains `"branching_strategy": "phase"`. Path-based check `git diff main..HEAD --name-only -- ':(exclude).planning/phases'` printed **exactly** `.planning/config.json`.

## Prohibitions — both hold

1. **No required status checks in this plan.** Verified absent from the live rules on main. Plan 01-05 adds them by selecting the ruleset by the exact name `main-protection` (never positionally).
2. **No commit on local main after the ruleset is active.** Local main and remote main are both pinned at `6c9b91d`; the only post-ruleset commit (`c004984`) landed on the phase branch.

## Threat mitigations applied

- **T-1-03 (Tampering, main):** ruleset requires PR, blocks force-push and deletion, `bypass_actors: []`, `current_user_can_bypass: "never"`.
- **T-1-15 (Information Disclosure, history goes public):** disclosure audit ran clean before push; publication of `.planning/`/`handoff/` is intentional per CONTEXT.md.
- **T-1-08 (Elevation):** org-wide 2FA requirement was presented as a recommended step in the Task 1 checkpoint (user-side org setting).

## Deviations from Plan

**1. [Rule 3 — Ordering] Ran the disclosure audit (step 4) before creating the repo (step 3)**

- **Found during:** Task 2
- **Issue:** The plan orders create-repo → audit → push. If the audit had hit, a public repo would already exist.
- **Fix:** Ran the audit first. The load-bearing constraint ("audit before the first push") is strictly preserved and, in fact, strengthened. No behavior change since the audit was clean.
- **Commit:** n/a (no local file change)

**2. [Rule 3 — Precondition] Committed uncommitted planning artifacts instead of aborting**

- **Found during:** Task 2 step 2
- **Issue:** `.planning/STATE.md` and `.planning/config.json` were dirty at the clean-tree precondition.
- **Fix:** Both are GSD planning artifacts (intentionally public history), so the plan's own step 2 mandates a `docs(01):` commit rather than a hard stop. `branching_strategy` was still `"none"` at that point, so this did not pre-empt Task 3.
- **Commit:** `6c9b91d`

**No commit exists for Task 2 itself** — the task is remote platform state only (`<files>` is explicitly "no local files"). Its only local artifact is the step-2 precondition commit `6c9b91d`.

## Notes for downstream plans

- **`admin:org` was NOT required.** The pre-flight warning anticipated a scope error on the ruleset and PVR calls; both are **repo-scoped** endpoints and succeeded with the existing `gist, read:org, repo` token. No `gh auth refresh` was needed.
- The ruleset POST payload from RESEARCH.md ("Ruleset via gh api", Assumption A4) was **accepted as-is minus `required_status_checks`** — no field-name adjustment was necessary, and no web-UI fallback was used.
- The PVR endpoint did not 404 (Assumption A6 did not materialize); no web-UI fallback was used.
- `origin` uses ssh (`git@github.com:lyra-ds/lyra.git`); the https fallback was not needed.
- The phase branch is **not yet pushed** — plan 01-05 pushes it and opens the PR.

## Self-Check: PASSED

- `.planning/phases/01-monorepo-foundation-governance/01-01-SUMMARY.md` — FOUND
- `.planning/config.json` contains `"branching_strategy": "phase"` — FOUND
- Commit `6c9b91d` — FOUND
- Commit `c004984` — FOUND
- Remote `lyra-ds/lyra` main @ `6c9b91d` — FOUND
