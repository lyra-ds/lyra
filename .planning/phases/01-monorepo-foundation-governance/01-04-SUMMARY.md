---
phase: 01-monorepo-foundation-governance
plan: 04
subsystem: infra
tags: [github-actions, ci, supply-chain, issue-forms, codeowners, oss-governance]
status: complete

# Dependency graph
requires:
  - phase: 01-01
    provides: "Root package.json fan-out scripts (lint/typecheck/test/build) the CI jobs invoke; packageManager pnpm@11.13.1 read by pnpm/action-setup"
provides:
  - "Base-CI workflow (.github/workflows/ci.yml) with the four FROZEN job names lint/typecheck/test/build — the required-check contract plan 01-05 references"
  - "Supply-chain-hardened CI: all action refs SHA-pinned with version comments; actionlint 1.7.12 verified against a committed sha256 checksum; read-only top-level token"
  - "OSS-02 community templates: YAML issue forms (bug/feature), config.yml with blank issues disabled + security contact link, PR template with 0.x changeset checkbox, CODEOWNERS"
affects:
  - "plan 01-05 (adds the four job names as ruleset required-status-check contexts; records post-merge issue-form UI spot-check)"
  - "Phases 2-4 (activate publint/attw/size-limit/parity/stylelint as STEPS inside these four jobs — never new job names)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Every GitHub Action uses: ref pinned to a full 40-char commit SHA with a trailing # vN version comment — first-party actions included (no mutable tag refs)"
    - "Third-party CLI binaries fetched from version-pinned release URLs and verified against a committed sha256 checksum before execution — never curl-pipe-to-shell"
    - "CI job names are a frozen required-check contract; future quality gates land as steps inside existing jobs, never as new jobs"
    - "Issue-form YAML validated with the preinstalled Ruby/Psych parser against GitHub's issue-forms schema — zero new installs, zero ephemeral executions"

key-files:
  created:
    - .github/workflows/ci.yml
    - .github/ISSUE_TEMPLATE/bug_report.yml
    - .github/ISSUE_TEMPLATE/feature_request.yml
    - .github/ISSUE_TEMPLATE/config.yml
    - .github/pull_request_template.md
    - .github/CODEOWNERS
  modified: []

key-decisions:
  - "OSS-03 recorded as PARTIAL by design: Phase 1 ships base-CI infrastructure only (visible lint/typecheck/test/build + frozen contexts + commented hooks); publint/attw/size-limit/parity activate in Phases 2-4 as steps once the packages they gate exist"
  - "Resolved each action tag to its immutable commit SHA at execution time (pnpm/action-setup v6.0.9 was an annotated tag, dereferenced to the commit SHA)"
  - "actionlint step downloads the release tarball then verifies sha256sum -c against a committed checksum literal before running the binary — tamper-evident despite tag-based release URLs"

patterns-established:
  - "SHA-pinned + version-commented action refs; checksum-verified binaries; read-only token; unfiltered PR trigger so docs-only PRs still report all checks"
  - "Ruby/Psych structural validation of issue forms in the automated verify (no pnpm dlx / no ephemeral installs)"

requirements-completed: [OSS-02]

coverage:
  - id: D1
    description: "CI workflow defines EXACTLY the four frozen jobs build/lint/test/build with SHA-pinned refs, read-only token, no path filters, checksum-verified actionlint"
    requirement: "OSS-03"
    verification:
      - kind: automated_ui
        ref: "ruby -ryaml structural assert (job set == build,lint,test,typecheck) + grep suite in Task 1 verify block"
        status: pass
    human_judgment: true
    rationale: "OSS-03 is PARTIAL by design and the definitive proof (all four checks report on the scaffold PR) is only observable after the scaffold PR runs on GitHub — recorded in plan 01-05"
  - id: D2
    description: "OSS-02 community templates: schema-valid issue forms, blank issues disabled, security contact link, PR changeset checkbox, CODEOWNERS"
    requirement: "OSS-02"
    verification:
      - kind: automated_ui
        ref: "ruby -ryaml issue-forms schema validation + grep suite in Task 2 verify block"
        status: pass
    human_judgment: true
    rationale: "Definitive rendering proof (both forms appear under GitHub 'New issue') is only observable after the scaffold PR merges — plan 01-05 Task 2 records the post-merge UI spot-check"

# Metrics
duration: 6min
completed: 2026-07-17
status: complete
---

# Phase 1 Plan 04: GitHub CI & Community Templates Summary

**Base-CI GitHub Actions workflow with four frozen required-check job names and full supply-chain hardening (SHA-pinned refs, checksum-verified actionlint), plus OSS-02 issue forms, PR template, and CODEOWNERS.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-17T22:00:15Z
- **Completed:** 2026-07-17T22:06:43Z
- **Tasks:** 2
- **Files modified:** 6 (all created)

## Accomplishments
- Authored `.github/workflows/ci.yml` with the four FROZEN job names (`lint`, `typecheck`, `test`, `build`) that become the ruleset's required-check contexts in plan 01-05 — verified structurally via Ruby/Psych that the sorted job-key set is exactly `build,lint,test,typecheck` (a 5th or renamed job fails).
- Hardened the workflow against the plan's review findings: all 12 `uses:` refs pinned to full commit SHAs with trailing `# vN` comments; top-level `contents: read`; concurrency group; unfiltered `pull_request` trigger (docs-only PRs still report); actionlint 1.7.12 fetched from a version-pinned URL and verified with `sha256sum -c` against a committed checksum — no curl-pipe-to-shell anywhere.
- Placed publint/attw/size-limit/parity/stylelint as commented future-gate hooks INSIDE the four jobs (never new jobs), preserving the ruleset contract for Phases 2-4.
- Shipped OSS-02 templates: schema-valid YAML issue forms, `config.yml` with `blank_issues_enabled: false` + security-policy contact link, PR template reinforcing the 0.x "breaking = minor changeset" convention, and `* @franciscpd` CODEOWNERS.

## Task Commits

Each task was committed atomically:

1. **Task 1: CI workflow with frozen job names and future-gate hooks (OSS-03)** - `61bbf92` (ci)
2. **Task 2: Issue forms, PR template, CODEOWNERS (OSS-02)** - `382eee6` (docs)

## Files Created/Modified
- `.github/workflows/ci.yml` - Base-CI: four frozen jobs, SHA-pinned refs, checksum-verified actionlint, commented future-gate hooks
- `.github/ISSUE_TEMPLATE/bug_report.yml` - Structured bug intake form (schema-valid)
- `.github/ISSUE_TEMPLATE/feature_request.yml` - Structured feature intake form (schema-valid)
- `.github/ISSUE_TEMPLATE/config.yml` - Blank issues disabled + security-policy contact link
- `.github/pull_request_template.md` - PR checklist with the 0.x changeset (breaking = minor) reminder
- `.github/CODEOWNERS` - `* @franciscpd` (enables require_code_owner_review later)

## Decisions Made
- **OSS-03 is PARTIAL by design.** Only OSS-02 was marked complete in REQUIREMENTS. Phase 1 ships the base-CI half of OSS-03 (visible checks + frozen contexts + commented hooks); the publint/attw/size-limit/parity gates activate in Phases 2-4 as steps inside these jobs once the packages exist. No plan may claim OSS-03 fully satisfied at Phase-1 end.
- Resolved each action tag to its immutable commit SHA at execution via `gh api`; `pnpm/action-setup@v6.0.9` was an annotated tag and was dereferenced once more to the commit SHA `0ebf471…`.
- actionlint checksum (`8aca8db9…`) copied from the official `v1.7.12` checksums file and committed in the workflow so the binary is verified before it runs.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. (Definitive issue-form rendering and CI check reporting are observable only after the scaffold PR runs/merges on GitHub — captured by plan 01-05.)

## Next Phase Readiness
- The four required-check contexts (`lint`, `typecheck`, `test`, `build`) exist and are frozen — plan 01-05 can add them to the branch ruleset.
- The full `.github/` governance surface (workflow + community templates) is ready for the scaffold PR that proves CI green.

## Self-Check: PASSED
- All 6 files present on disk.
- Both task commits (`61bbf92`, `382eee6`) exist in git history.

---
*Phase: 01-monorepo-foundation-governance*
*Completed: 2026-07-17*
