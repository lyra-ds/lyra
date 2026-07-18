---
phase: 01-monorepo-foundation-governance
plan: 05
subsystem: platform-governance
tags: [ci, github-actions, branch-protection, ruleset, changesets, pnpm, prettier, pull-request]

requires:
  - phase: 01-01
    provides: "Ruleset 'main-protection' (PR-only, no required checks); phase branch; repo bootstrap"
  - phase: 01-02
    provides: "pnpm workspace, changesets config, private @lyra-ds/styles + @lyra-ds/react packages, pnpm-lock.yaml"
  - phase: 01-03
    provides: "Governance docs (README EN/pt-BR, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, VERSIONING, LICENSE)"
  - phase: 01-04
    provides: "CI workflow (four frozen job names), issue forms, PR template, CODEOWNERS"
provides:
  - "First PR on lyra-ds/lyra (#1) merged to main with a merge commit (1f8bcb7) — D-07 flow proven end to end"
  - "Ruleset 'main-protection' now requires exactly build,lint,test,typecheck in addition to a PR"
  - "Clean-clone proof (SC-5): fresh clone passes install --frozen-lockfile, build, test, typecheck, changeset status"
  - "changesets configured to ignore private packages (privatePackages.version=false) so scaffold packages don't block the release gate"
  - "Base-CI half of OSS-03 delivered (PARTIAL — package-quality gates activate in Phases 2-4)"
affects:
  - "all future PRs (must pass the four required checks before merge)"
  - "phase-end /gsd-ship docs PR (the live proof that required checks now block merges)"
  - "Phases 2-4 (add publint/attw, size-limit, parity as STEPS inside the four existing jobs — never new job names)"

tech-stack:
  added: []
  patterns:
    - "Two-step branch-protection bootstrap completed: required checks added only AFTER CI reported once on a real PR (research Pattern 3 steps 5-6)"
    - "Ruleset mutation via explicit writable-fields PUT body (name/target/enforcement/bypass_actors/conditions/rules) — never round-trip the read-only GET response"
    - "Scoped prettier reconciliation: format only files reported by prettier --list-different, all pre-declared in files_modified"
    - "changesets privatePackages.version=false so private/scaffold packages are exempt from the changeset-required gate until they go public"

key-files:
  created: []
  modified:
    - ".changeset/config.json (added privatePackages: {version:false, tag:false})"
    - "README.md, README.pt-BR.md, CODE_OF_CONDUCT.md, SECURITY.md (prettier reconciliation)"
    - ".github/ISSUE_TEMPLATE/bug_report.yml, .github/ISSUE_TEMPLATE/feature_request.yml (prettier reconciliation)"

key-decisions:
  - "changesets privatePackages.version=false: private 0.0.0 scaffold packages cannot be released, so they are exempt from the changeset gate until a later phase makes them public"
  - "Merged PR #1 with a merge commit (not squash) to keep the still-active phase branch contained in main's ancestry for the phase-end docs PR"
  - "Used the actual phase branch name gsd/phase-01-... (the plan text said gsd/phase-1-...; the -01- form is the real branch per init context)"

patterns-established:
  - "Every change to main now rides a PR with four green required checks (D-07) — no direct pushes"
  - "Ruleset required contexts are a frozen 1:1 mirror of the CI job names build/lint/test/typecheck"

requirements-completed: []

coverage:
  - id: D1
    description: "First PR (#1) ran visible CI with all four checks green and merged via merge commit (D-07 flow, base-CI half of OSS-03)"
    requirement: "OSS-03"
    verification:
      - kind: automated
        ref: "gh pr checks 1 --json name,bucket -> sorted pass set == build,lint,test,typecheck; gh pr view 1 state==MERGED, mergeCommit 1f8bcb7"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ruleset 'main-protection' requires exactly build,lint,test,typecheck plus the pre-existing pull_request/deletion/non_fast_forward rules"
    requirement: "OSS-03"
    verification:
      - kind: automated
        ref: "gh api repos/lyra-ds/lyra/rules/branches/main -> required_status_checks contexts sorted == build,lint,test,typecheck; pull_request rule present"
        status: pass
    human_judgment: false
  - id: D3
    description: "Clean-clone proof (SC-5): fresh git clone of the phase branch passes install --frozen-lockfile, build, test, typecheck, changeset status"
    verification:
      - kind: integration
        ref: "git clone --branch <phasebranch> file://$PWD; git branch main origin/main; pnpm install --frozen-lockfile && build && test && typecheck && changeset status — all exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Issue forms render at /issues/new/choose with the blank-issue option absent (only observable in the GitHub UI once templates land on the default branch)"
    requirement: "OSS-02"
    verification:
      - kind: manual_procedural
        ref: "Visit https://github.com/lyra-ds/lyra/issues/new/choose — confirm both 'bug report' and 'feature request' forms appear and no blank-issue link is offered"
        status: unknown
    human_judgment: true
    rationale: "Template rendering + blank-issue suppression are only provable in the GitHub UI; no API exposes the rendered chooser. API confirms both forms + blank_issues_enabled:false exist on main, but visual render is a manual /gsd-verify-work step."
  - id: D5
    description: "Required checks live-block the next PR (phase-end /gsd-ship docs PR) until the four contexts pass"
    verification:
      - kind: manual_procedural
        ref: "Open the phase-end docs PR from the phase branch; confirm merge is blocked until build/lint/test/typecheck report success"
        status: unknown
    human_judgment: true
    rationale: "Live-blocking behavior is only observable on the next real PR, which does not exist yet at this plan's completion. The ruleset end-state is proven structurally (D2); the enforcement moment is the phase-end ship PR."

duration: 76min
completed: 2026-07-17
status: complete
---

# Phase 01 Plan 05: Scaffold PR, CI Proof & Branch-Protection Completion Summary

**First PR (#1) landed the whole Phase-1 scaffold on main with 4/4 green CI, then the `main-protection` ruleset was completed to require exactly `build,lint,test,typecheck` — closing the two-step bootstrap and proving the D-07 loop end to end.**

## Performance

- **Duration:** ~76 min
- **Started:** 2026-07-17T22:23:41Z
- **Completed:** 2026-07-17T23:40:00Z
- **Tasks:** 3
- **Files modified:** 7 (local) + remote platform state (PR #1, ruleset)

## Accomplishments

- **Repo-wide format reconciliation, scoped:** `prettier --list-different` reported exactly 6 files (all pre-declared in `files_modified`); formatted only those and committed formatting-only changes. `pnpm run lint` now exits 0 for CI.
- **Clean-clone proof (SC-5):** a literal fresh `git clone` of the phase branch passes `pnpm install --frozen-lockfile`, `build`, `test`, `typecheck`, and `changeset status` — all exit 0, typecheck included.
- **First PR proven end to end (D-07):** pushed the phase branch, opened PR #1, watched all four checks (`build,lint,test,typecheck`) go green, asserted the exact sorted pass-set structurally via `gh pr checks --json name,bucket`, merged with a **merge commit** (`1f8bcb7`), and kept the phase branch alive for the phase-end docs PR.
- **Branch protection completed:** added `required_status_checks` (`build,lint,test,typecheck`) to the `main-protection` ruleset — selected BY NAME, built from an explicit writable-fields PUT body, verified via `repos/.../rules/branches/main`.

## Task Commits

1. **Task 1: Format reconciliation + changeset-gate fix** — `f7ce90e` (style: prettier reconciliation), `15b0d99` (fix: changeset privatePackages)
2. **Task 2: Open PR #1, watch CI green, merge** — no local commit (remote platform state); PR #1 merge commit `1f8bcb7`
3. **Task 3: Add four required checks to ruleset** — no local commit (remote platform state); ruleset `main-protection` id 19106586 updated

**Plan metadata:** final `docs(01-05)` commit (this SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `.changeset/config.json` — added `privatePackages: { version: false, tag: false }` so private scaffold packages don't trip the changeset gate
- `README.md`, `README.pt-BR.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` — prettier reconciliation (ordered-list markers, table separators, fenced-code quote style)
- `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml` — prettier reconciliation

## Decisions Made

- **changesets ignore private packages (`privatePackages.version=false`).** Both `@lyra-ds/styles` and `@lyra-ds/react` are `private: true` at `0.0.0` and cannot be released in Phase 1. With the changesets default (`privatePackages.version: true`), `changeset status` errored "changed but no changesets found" at the SC-5 gate because `main` had no `packages/` to diff against. Exempting private packages is the forward-looking fix (avoids the same wall on every Phases 2-4 PR); they re-enter the gate automatically once a later phase drops `private`.
- **Merge commit, not squash.** Preserves the phase branch's ancestry in `main` so the still-active branch and the phase-end `/gsd-ship` docs PR remain contained.
- **Explicit writable-fields ruleset PUT.** The body was built from only `name/target/enforcement/bypass_actors/conditions/rules` (read-only `id/source/_links`/timestamps never round-tripped) — the round-2 review recipe. It succeeded first try (no 422).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `changeset status` failed the SC-5 gate — added `privatePackages` config**
- **Found during:** Task 1 (local phase gate + clean-clone proof)
- **Issue:** `pnpm exec changeset status` exited 1 ("Some packages have been changed but no changesets were found"). Root cause: `main` (6c9b91d) had no `packages/`, so both private 0.0.0 packages read as newly changed, and the changesets default versions private packages — demanding a changeset for packages that cannot be published. The plan's gate requires `changeset status` to exit 0; this is a 01-02 scaffold-completeness gap surfacing here (analogous to the plan's declared lockfile-recovery path).
- **Fix:** Added `"privatePackages": { "version": false, "tag": false }` to `.changeset/config.json` (declared in this plan's `files_modified`). Surgical one-line edit, prettier-clean.
- **Files modified:** `.changeset/config.json`
- **Verification:** `pnpm exec changeset status` now exits 0 (working repo AND clean clone); `pnpm run lint` still exits 0.
- **Committed in:** `15b0d99`

**2. [Rule 3 - Plan drift] Branch name in plan text was `gsd/phase-1-...`; actual branch is `gsd/phase-01-...`**
- **Found during:** Task 2 (push + PR)
- **Issue:** The plan's push/clone/PR commands used `gsd/phase-1-monorepo-foundation-governance`, but the real branch (per init context and 01-01) is `gsd/phase-01-monorepo-foundation-governance`.
- **Fix:** Used the actual `-01-` branch name in every push/clone/PR command.
- **Verification:** `git push`, `gh pr create`, and the clean clone all resolved the branch correctly.
- **Committed in:** n/a (no file change)

**3. [Rule 3 - Tool precondition] Clean-clone `changeset status` needs a local `main` ref**
- **Found during:** Task 1 (clean-clone proof)
- **Issue:** `git clone --branch <phasebranch>` checks out the phase branch with only `origin/main` (no local `main`). changesets' `getDivergedCommit` resolves the configured `baseBranch: main` as a LOCAL ref and errored "Failed to find where HEAD diverged from main". This is a tool precondition (CI satisfies it via `actions/checkout` `fetch-depth: 0`), not a workspace defect — build/test/typecheck all passed in the clone regardless.
- **Fix:** Materialized the base ref in the clone (`git branch main origin/main`) before running `changeset status`, faithfully replicating the CI condition. After that, `changeset status` exits 0 in the clean clone.
- **Files modified:** none (clean-clone setup step)
- **Verification:** Clean clone: install/build/test/typecheck/changeset-status all exit 0.
- **Committed in:** n/a

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking-issue / precondition fixes)
**Impact on plan:** All three were required to satisfy the plan's own SC-5 gate and the D-07 flow. Deviation 1 is the only content change (a one-line, in-scope config fix). No scope creep.

## Issues Encountered

- The `changeset status` failure (deviation 1) is a genuine 01-02 gap (changeset config never exempted the private scaffold packages). Resolved here within declared file ownership; noted for the phase record.

## OSS-03 status: PARTIAL (base CI only)

Per the plan's success criteria and the round-2 review reconciliation, **OSS-03 is recorded as PARTIAL, not complete.** Delivered here: visible CI on every PR + the four required checks enforced by the ruleset. NOT yet delivered (activate as STEPS inside the four existing jobs in Phases 2-4): publint/attw, size-limit, token/class parity, stylelint. `requirements-completed` is intentionally empty and `requirements mark-complete` was NOT run for OSS-03.

## Manual verification for /gsd-verify-work

- **Issue-forms rendering (D4, closes the 01-04 loop):** visit https://github.com/lyra-ds/lyra/issues/new/choose and confirm both the bug-report and feature-request forms render and no blank-issue option is offered. API confirms both forms + `blank_issues_enabled: false` exist on `main`; the visual render is UI-only.
- **Required checks live-block (D5):** the next PR from the phase branch (the phase-end `/gsd-ship` docs PR) is the natural live proof that merges block until `build/lint/test/typecheck` pass.

## Next Phase Readiness

- Branch protection is complete: `main` accepts only PR-merged, CI-green changes. Phase 1's technical objectives (workspace, governance, base CI, protection) are all landed on `main`.
- The phase branch remains active for the phase-end summaries/verification, which ride the `/gsd-ship` PR.
- Blocker/concern: none. Phase 2 adds real package build/test/lint scripts as STEPS inside the existing four CI jobs (never new job names — that would orphan the ruleset contract).

## Self-Check: PASSED

- `.planning/phases/01-monorepo-foundation-governance/01-05-SUMMARY.md` — FOUND
- `.changeset/config.json` (privatePackages) — FOUND
- Commit `f7ce90e` (prettier reconciliation) — FOUND
- Commit `15b0d99` (changeset config fix) — FOUND
- Merge commit `1f8bcb7` (PR #1) — FOUND
- Ruleset `main-protection` required contexts == `build,lint,test,typecheck` — VERIFIED

---
*Phase: 01-monorepo-foundation-governance*
*Completed: 2026-07-17*
