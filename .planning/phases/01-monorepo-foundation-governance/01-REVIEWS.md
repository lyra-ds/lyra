---
phase: 1
reviewers: [codex]
reviewed_at: 2026-07-17T08:20:40-03:00
review_round: 2
plans_reviewed: [01-01-PLAN.md, 01-02-PLAN.md, 01-03-PLAN.md, 01-04-PLAN.md, 01-05-PLAN.md]
---

# Cross-AI Plan Review — Phase 1 (Round 2)

> Round 1 (2026-07-17, Codex) found 3 HIGH cross-plan blockers; all were incorporated via the reviews-mode replan (commit d818111) and verified by the plan checker. This round reviews the revised plans. **Round-1 findings are historical — the actionable findings are the ones below.**

## Codex Review

# Cross-AI Plan Review — Phase 1, round 2

## Overall assessment

The replan materially resolves the first-round blockers: OSS-03 is explicitly partial, the validation contract maps all 13 tasks, state is synchronized, CI dependencies are hardened, and clean-clone verification includes typecheck. The plans are close to executable, but four operational gaps remain: incomplete Code of Conduct placeholder detection, undeclared `pnpm dlx` execution, an unsafe ruleset update recipe, and a disclosure scan that excludes `.planning/`.

**Overall risk: MEDIUM.** No remaining HIGH-severity blocker, but the MEDIUM findings should be corrected before execution.

---

## Plan 01-01 — GitHub bootstrap

### Summary

The bootstrap sequence is sound and correctly reconciles protected `main` with GSD’s current branch configuration. The disclosure audit is a good addition, but one exclusion weakens its core guarantee.

### Strengths

- The ordering is load-bearing and correct: publish the existing history, create protection without checks, then switch from the current `"none"` strategy to the configured phase branch template. See [01-01-PLAN.md:128](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:128) and the actual current setting in [config.json:14](/home/franciscpd/Projects/lyra-ds/.planning/config.json:14).
- The legal identity and contact are now explicitly user-confirmed and passed through `01-01-SUMMARY.md`, avoiding inference from Git metadata. See [01-01-PLAN.md:103](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:103).
- Private vulnerability reporting is enabled and verified before SECURITY.md publishes its advisory URL. See [01-01-PLAN.md:137](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:137).
- The branch-content assertion is now path-based and allows only the intended config change outside phase metadata. See [01-01-PLAN.md:174](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:174).

### Concerns

- **MEDIUM — The secret scan excludes a directory that will be made public.** The plan publishes `.planning/` as part of the full history but excludes it from secret-pattern scanning. See [01-01-PLAN.md:133](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:133) and [01-01-PLAN.md:135](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:135). Running the same detector against the current history without that exclusion produces no matches, so the claimed self-match problem does not currently occur.
- **LOW — The org description is declared complete but never verified.** Task 1 instructs the user to set it, while acceptance checks only the org login and legal/contact decisions. See [01-01-PLAN.md:100](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:100) and [01-01-PLAN.md:107](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:107).

### Suggestions

- Scan `.planning/` too. If a real false positive appears, suppress that exact path or fingerprint instead of excluding the whole directory.
- Add `gh api orgs/lyra-ds --jq .description` and compare it with the intended short description.
- Prefer `gitleaks` when available, with the regex scan retained as a fallback rather than an equivalent substitute.

### Risk assessment

**LOW–MEDIUM.** The platform sequencing is strong; the main risk is incomplete pre-publication coverage.

---

## Plan 01-02 — Workspace and Changesets

### Summary

This is the strongest plan in the set. The placeholder manifests, lockstep Changesets configuration, exact dependency pins, and scoped validation all align with the repository architecture.

### Strengths

- The placeholders remain deliberately minimal while unblocking Changesets validation. Their exact four-key shape is enforced in the automated check. See [01-02-PLAN.md:179](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:179) and [01-02-PLAN.md:185](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:185).
- Lockstep versioning implements D-06 directly and is appropriate for the shared class-name contract. See [01-02-PLAN.md:180](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:180) and the architectural boundary in [ARCHITECTURE.md:48](/home/franciscpd/Projects/lyra-ds/.planning/research/ARCHITECTURE.md:48).
- The revised text now accurately calls typecheck/test/build “reserved CI contexts,” not meaningful validation gates. See [01-02-PLAN.md:28](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:28).
- Task 3 verification now matches the promised action, including typecheck and scoped Prettier. See [01-02-PLAN.md:182](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:182).

### Concerns

- **LOW — The pinned pnpm runtime is not actually asserted.** The manifest will declare `pnpm@11.13.1`, but verification checks TypeScript and manifest strings without checking the executing pnpm version. See [01-02-PLAN.md:146](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:146) and [01-02-PLAN.md:156](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:156). The workspace currently runs pnpm 11.13.0 before the scaffold is created.

### Suggestions

- Add `pnpm --version | grep -qx '11.13.1'` after the package-manager field exists.
- Preserve the current explicit distinction between green reserved contexts and real package gates.

### Risk assessment

**LOW.** The remaining issue is verification precision, not architecture.

---

## Plan 01-03 — Governance documents

### Summary

The governance scope and cross-plan dependencies are well designed, but the revised “no placeholders” verification still misses the placeholders actually used by Contributor Covenant 3.0.

### Strengths

- README content is grounded in the canonical handoff pitch and four-token story. See [org-profile.md:24](/home/franciscpd/Projects/lyra-ds/handoff/assets/github/org-profile.md:24) and [01-03-PLAN.md:171](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:171).
- The pre-release warning prevents unpublished package instructions from being presented as currently usable. See [01-03-PLAN.md:176](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:176).
- VERSIONING.md covers the broad public API while avoiding a premature promise of per-component deep exports. See [01-03-PLAN.md:147](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:147).
- The README-only translation boundary matches the explicit user decision. See [01-CONTEXT.md:21](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-CONTEXT.md:21).

### Concerns

- **MEDIUM — The CoC verifier misses real Contributor Covenant placeholders.** The plan rejects only `[INSERT|year|fullname|email]`, but the official 3.0 template uses `[NOTE: ...]` placeholders for reporting and enforcement customization. See [01-03-PLAN.md:126](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:126). The official template explicitly instructs adopters to search for `[NOTE`. [Contributor Covenant 3.0](https://www.contributor-covenant.org/version/3/0/code_of_conduct/)
- **LOW — The MIT comparison does not normalize the permitted copyright substitution.** The plan allows the copyright line to differ but compares both files from line two onward, which can still include that line. See [01-03-PLAN.md:120](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:120) and [01-03-PLAN.md:129](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:129).

### Suggestions

- Reject every remaining `\[NOTE` in CODE_OF_CONDUCT.md and explicitly define the solo maintainer’s reporting and enforcement role.
- Describe the CoC as “canonical template with filled project-specific sections,” not strictly “verbatim.”
- Compare MIT text beginning at “Permission is hereby granted,” or normalize the copyright line before diffing.

### Risk assessment

**MEDIUM.** Without the placeholder fix, OSS-02 can pass verification while shipping an unfinished Code of Conduct.

---

## Plan 01-04 — CI and templates

### Summary

The CI hardening is substantially improved and OSS-03 traceability is now honest. The remaining weakness is Task 2: its validation both introduces an undeclared package execution and proves only YAML syntax, not valid GitHub issue forms.

### Strengths

- OSS-03 is consistently recorded as partial across the plan and requirement. See [01-04-PLAN.md:71](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:71) and [REQUIREMENTS.md:14](/home/franciscpd/Projects/lyra-ds/.planning/REQUIREMENTS.md:14).
- Every action is required to use an immutable commit SHA, and actionlint is checksum-verified before execution. See [01-04-PLAN.md:116](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:116).
- Unconditional PR triggers correctly prevent planning-only PRs from being stranded without required checks. See [01-04-PLAN.md:113](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:113).
- The workflow keeps a read-only token and avoids attacker-controlled event interpolation. See [01-04-PLAN.md:114](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:114).

### Concerns

- **MEDIUM — `pnpm dlx` contradicts the plan’s supply-chain statement.** Task 2 downloads and executes `js-yaml@4.1.0` three times, while the threat model states that this plan performs no new installs and relies on the four-package checkpoint from Plan 01-02. See [01-04-PLAN.md:154](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:154) and [01-04-PLAN.md:182](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:182).
- **MEDIUM — YAML parsing does not establish a valid GitHub issue form.** GitHub requires specific top-level and body schemas; syntactically valid YAML can still be rejected or not displayed. The current verifier only parses and greps a few strings. See [01-04-PLAN.md:147](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:147) and [GitHub’s issue-form schema](https://docs.github.com/en/enterprise-cloud%40latest/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms).
- **LOW — “Exactly four jobs” is not fully asserted.** The grep proves the four expected keys exist but would not reject a fifth job. It also does not automate the required trailing version-comment check. See [01-04-PLAN.md:123](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:123).

### Suggestions

- Use the already-installed Ruby/Psych parser, or add a YAML/schema validator as an exact-pinned locked devDependency covered by Plan 01-02’s supply-chain gate.
- Validate issue forms against the GitHub schema, then add a post-merge UI check that both forms appear under “New issue.”
- Parse workflow job keys structurally and assert the exact set `build,lint,test,typecheck`.

### Risk assessment

**MEDIUM.** CI itself is robust; template validation and dependency provenance need correction.

---

## Plan 01-05 — Integration and protection

### Summary

The real-PR proof, merge-commit strategy, and clean-clone gate are strong. The ruleset mutation recipe and recovery-file ownership remain underspecified.

### Strengths

- The clean-clone gate now executes install, build, test, typecheck, and Changesets validation from committed state. See [01-05-PLAN.md:108](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:108).
- The plan requires a real PR with four green checks before merging. See [01-05-PLAN.md:129](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:129).
- Merge-commit use preserves the phase branch’s ancestry for the later summary/verification PR. See [01-05-PLAN.md:132](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:132).
- Ruleset selection is now by exact name, and OSS-03 remains explicitly partial. See [01-05-PLAN.md:155](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:155) and [01-05-PLAN.md:198](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:198).

### Concerns

- **MEDIUM — “GET, modify, PUT it back” is not a safe API recipe.** A GitHub ruleset GET response includes read-only fields such as `id`, `source`, `_links`, and timestamps, while the update endpoint accepts a defined request schema. See [01-05-PLAN.md:156](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:156) and [GitHub’s ruleset API](https://docs.github.com/en/rest/repos/rules?apiVersion=2026-03-10). Blindly returning the GET object is likely to produce a 422.
- **MEDIUM — The lockfile recovery path exceeds declared ownership.** If the clone fails, Task 1 instructs the executor to update and commit `pnpm-lock.yaml`, but that path is absent from both the task’s `<files>` and the plan frontmatter. See [01-05-PLAN.md:7](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:7), [01-05-PLAN.md:98](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:98), and [01-05-PLAN.md:108](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:108).
- **LOW — PR-check verification relies on human-formatted CLI text.** The grep at [01-05-PLAN.md:136](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:136) is more brittle than `gh pr checks --json name,bucket`.

### Suggestions

- Construct the ruleset update body explicitly with only `name`, `target`, `enforcement`, `bypass_actors`, `conditions`, and `rules`; append the required-check rule with `jq`.
- Add `pnpm-lock.yaml` to frontmatter/task ownership or treat an out-of-sync lockfile as a return to Plan 01-02 rather than an inline repair.
- Verify checks structurally using JSON and assert the exact `{name, bucket: "pass"}` set.

### Risk assessment

**MEDIUM.** The end-to-end strategy is strong, but the privileged ruleset update should be deterministic before execution.

---

## Priority revisions

1. Detect and remove all Contributor Covenant `[NOTE` placeholders.
2. Remove `.planning/` from the disclosure-scan exclusion.
3. Replace the Plan 01-04 `pnpm dlx` verifier and validate the GitHub issue-form schema.
4. Define an explicit, schema-safe ruleset PUT payload.
5. Reconcile Plan 01-05 lockfile recovery with declared file ownership.

With those changes, the phase risk drops to **LOW** and the plans should achieve all five Phase 1 success criteria while correctly leaving OSS-03 partial until Phases 2–4.
---

## Consensus Summary

Single-reviewer run (Codex only) — no cross-reviewer consensus is possible. The review is source-grounded (`file:line` citations against the actual repo). Convergence signal is clear: zero HIGH findings remain (round 1 had three), and the reviewer states risk drops to LOW once the five priority revisions land.

### Agreed Strengths
N/A (single reviewer). Codex confirms the round-1 incorporations are real: honest OSS-03 partial tracking, SHA-pinned + checksum-verified CI, user-confirmed legal identity, enabled private vulnerability reporting, path-based branch assertions, and a complete clean-clone gate.

### Agreed Concerns
N/A (single reviewer). Current actionable findings (all MEDIUM or LOW):

1. **MEDIUM — CoC placeholder detection incomplete (01-03)**: verifier rejects `[INSERT|year|fullname|email]` but Contributor Covenant 3.0 uses `[NOTE: ...]` placeholders — an unfinished CoC could pass. Reject `\[NOTE` too.
2. **MEDIUM — Disclosure scan excludes `.planning/` (01-01)**: the directory is published with the history but excluded from the secret scan; reviewer verified scanning it currently produces no matches, so the exclusion is unnecessary.
3. **MEDIUM — Undeclared `pnpm dlx js-yaml` execution (01-04)**: contradicts the plan's own no-new-installs threat-model statement; also YAML parsing alone doesn't prove valid GitHub issue forms.
4. **MEDIUM — Unsafe ruleset update recipe (01-05)**: GET→modify→PUT returns read-only fields (`id`, `_links`, timestamps) likely producing a 422; construct an explicit request body with only the schema's writable fields.
5. **MEDIUM — Lockfile recovery exceeds ownership (01-05)**: failure path commits `pnpm-lock.yaml` which is absent from `<files>`/frontmatter.
6. **LOW** — pnpm version not asserted (01-02); org description never verified (01-01); MIT diff doesn't normalize the copyright line (01-03); "exactly four jobs" not fully asserted + version-comment check not automated (01-04); PR-check grep brittle vs `gh pr checks --json` (01-05).

### Divergent Views
N/A (single reviewer).
