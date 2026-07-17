---
phase: 1
slug: monorepo-foundation-governance
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-16
updated: 2026-07-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Filled 2026-07-17 during the reviews-mode replan (Codex review finding: this file was an untouched template claimed as the validation contract).
> Round-2 sync 2026-07-17: per-task commands updated for the round-2 review fixes (`.planning/`-inclusive secret scan + org description check, pnpm version assert, CoC NOTE-marker rejection, Ruby/Psych structural validation replacing `pnpm dlx js-yaml`, JSON-based PR-check assertion).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — Phase 1 is scaffold/governance/platform work; every task verifies via deterministic shell commands (`gh api`, `git`, `pnpm`, `grep`), not a test runner. Vitest arrives in Phase 3. |
| **Config file** | none — Wave 0 not required |
| **Quick run command** | `pnpm run lint && pnpm exec changeset status` (valid once plan 01-02 lands; before that, wave-1 checks are `gh api`/`git` assertions from 01-01's verify blocks) |
| **Full suite command** | Clean-clone gate (01-05 Task 1): fresh clone of the phase branch → `pnpm install --frozen-lockfile && pnpm run build && pnpm run test && pnpm run typecheck && pnpm exec changeset status` |
| **Estimated runtime** | quick ~10 s; full clean-clone gate ~60-90 s |

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` verify block (each is < 60 s); from wave 2 onward additionally run the quick command
- **After every plan wave:** Run the full clean-clone gate (wave 2+; wave 1 has no workspace yet — run 01-01's three verify blocks instead)
- **Before `/gsd-verify-work`:** Full clean-clone gate must be green AND the scaffold PR must show 4/4 green checks
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | OSS-03 | — | org handle claimed by owner | shell | `gh api orgs/lyra-ds --jq .login` prints `lyra-ds` | ✅ n/a | ⬜ pending |
| 1-01-02 | 01 | 1 | OSS-03 | T-1-03 / T-1-15 | disclosure audit (`.planning/` included) clean before public push; PR-only main; private vuln reporting on | shell | 01-01 Task 2 `<automated>` (org login + description contains CSS-first + push SHA + ruleset name `main-protection` + private-vulnerability-reporting enabled) | ✅ n/a | ⬜ pending |
| 1-01-03 | 01 | 1 | OSS-03 | — | no commits stranded on protected main | shell | branch name + `"branching_strategy": "phase"` grep | ✅ n/a | ⬜ pending |
| 1-02-01 | 02 | 2 | OSS-03 | T-1-SC | [SUS] packages human-approved before install | shell + human | `npm view` × 4 exact pins exist | ✅ n/a | ⬜ pending |
| 1-02-02 | 02 | 2 | OSS-03, OSS-05 | T-1-04 / T-1-09 | exact pins, no floating versions, TS 5.9.3 not 7.x, executing pnpm matches the packageManager pin | shell | 01-02 Task 2 `<automated>` (frozen-lockfile install + pnpm 11.13.1 assert + tsc version + pin check) | ✅ n/a | ⬜ pending |
| 1-02-03 | 02 | 2 | OSS-05 | T-1-06 | lockstep fixed group validates; stubs carry no packaging metadata | shell | 01-02 Task 3 `<automated>` (changeset status + build/test/typecheck + scoped prettier + stub-shape check) | ✅ n/a | ⬜ pending |
| 1-03-01 | 03 | 2 | OSS-02 | T-1-10 | canonical MIT/CoC texts; user-confirmed legal identity; live advisory channel | shell | 01-03 Task 1 `<automated>` (MIT 3-paragraph greps, CoC 3.0 markers, no bracketed fields, no Covenant NOTE markers) | ✅ n/a | ⬜ pending |
| 1-03-02 | 03 | 2 | OSS-05 | — | 0.MINOR=breaking policy written; API surface declared | shell | 01-03 Task 2 `<automated>` (VERSIONING/CONTRIBUTING greps) | ✅ n/a | ⬜ pending |
| 1-03-03 | 03 | 2 | OSS-01 | T-1-11 | pre-release warning present; pt-BR mirror valid UTF-8 | shell | 01-03 Task 3 `<automated>` (README pair greps + iconv) | ✅ n/a | ⬜ pending |
| 1-04-01 | 04 | 2 | OSS-03 | T-1-01 / T-1-02 / T-1-05 | all actions SHA-pinned with version comments; checksum-verified actionlint; read-only token; no injection surface | shell | 01-04 Task 1 `<automated>` (Ruby/Psych exact job set build,lint,test,typecheck, uses==SHA-pin+version-comment count, no curl-pipe, sha256sum -c present) | ✅ n/a | ⬜ pending |
| 1-04-02 | 04 | 2 | OSS-02 | T-1-SC | issue forms pass GitHub schema structure; blank issues off; no ephemeral package executions | shell | 01-04 Task 2 `<automated>` (Ruby/Psych issue-form schema validation × 3 + greps) | ✅ n/a | ⬜ pending |
| 1-05-01 | 05 | 3 | OSS-03 | — | clean clone fully green incl. typecheck; formatting scoped to declared files | shell | 01-05 Task 1 `<automated>` (lint + clean-clone install/build/test/typecheck/changeset) | ✅ n/a | ⬜ pending |
| 1-05-02 | 05 | 3 | OSS-03 | — | first PR merged only with 4/4 green checks | shell | 01-05 Task 2 `<automated>` (merged PR + `gh pr checks --json name,bucket` exact pass set build,lint,test,typecheck) | ✅ n/a | ⬜ pending |
| 1-05-03 | 05 | 3 | OSS-03 | T-1-03 / T-1-13 | required contexts exactly build,lint,test,typecheck on ruleset `main-protection` | shell | 01-05 Task 3 `<automated>` (sorted contexts grep) | ✅ n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no test framework or test files are needed for Phase 1; every task carries a deterministic shell `<automated>` verify. First test framework (Vitest Browser Mode) is Phase 3 scope.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub org `lyra-ds` creation + short description + copyright/contact confirmation | OSS-03 (D-01) | Org creation has no self-serve API (web-UI only); legal identity must be user-confirmed, never inferred | 01-01 Task 1 checkpoint steps 1-6; downstream API check `gh api orgs/lyra-ds` |
| Package legitimacy sign-off for 4 [SUS]-flagged devDependencies | OSS-03 (supply chain) | GSD supply-chain gate mandates a never-auto-approvable human checkpoint for [SUS] packages | 01-02 Task 1 checkpoint: verify 4 npmjs.com pages match canonical projects |
| Issue forms render under "New issue" (both forms visible, blank-issue option absent) | OSS-02 | Form rendering is only observable in the GitHub UI after templates land on the default branch; no API exposes it (round-2 review) | Post-merge (01-05 Task 2 step 6): visit https://github.com/lyra-ds/lyra/issues/new/choose during /gsd-verify-work |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (14/14 tasks carry `<automated>` blocks)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (streak = 0)
- [x] Wave 0 covers all MISSING references (none exist)
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-17 (planner, reviews-mode replan; `status` stays `draft` until validate-phase §6)
