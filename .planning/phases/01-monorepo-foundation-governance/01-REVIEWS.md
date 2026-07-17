---
phase: 1
reviewers: [codex]
reviewed_at: 2026-07-17T00:12:46-03:00
plans_reviewed: [01-01-PLAN.md, 01-02-PLAN.md, 01-03-PLAN.md, 01-04-PLAN.md, 01-05-PLAN.md]
---

# Cross-AI Plan Review — Phase 1

## Codex Review

# Cross-AI plan review — Phase 1

## Overall assessment

The architecture and sequencing are thoughtful, especially the two-step ruleset bootstrap, fixed Changesets group, and real-PR integration proof. However, the phase is **not ready to execute unchanged**. Three cross-plan blockers stand out:

- OSS-03 requires publint, attw, size-limit, and parity checks, while these plans add only comments for future implementation.
- The official phase validation file is still an untouched template.
- GSD state and the working tree are not synchronized with the five completed plans.

Overall risk: **HIGH until these traceability and readiness issues are corrected; MEDIUM afterward.**

An independent Claude CLI review was attempted, but the local CLI could not connect to its API (`ENOTIMP`). The review below is therefore source-grounded but not a multi-reviewer consensus.

---

## Plan 01-01 — GitHub bootstrap

### Summary

The bootstrap order is sound: publish the existing history, protect `main` without checks, then create the phase branch and change GSD’s branching mode. This directly reconciles D-07/D-08 with the current configuration. The immediate problem is that the clean-tree precondition already fails.

### Strengths

- The plan correctly identifies the current state: `branching_strategy` is still `"none"` while the phase branch template already exists in [config.json](/home/franciscpd/Projects/lyra-ds/.planning/config.json:14).
- Creating the ruleset before scaffold work, but delaying required checks until CI has reported, is a sensible bootstrap sequence. GitHub confirms rulesets are available for public repositories on GitHub Free.
- The plan preserves the user’s scope decision: Phase 1 creates the organization and repository, while branding remains deferred as specified in [01-CONTEXT.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-CONTEXT.md:19).

### Concerns

- **HIGH — The current working tree fails Task 2’s precondition.** Task 2 requires `git status --porcelain` to be empty at [01-01-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:114), but `01-PATTERNS.md` is currently untracked. Execution will stop unless that artifact is committed or explicitly handled first.
- **MEDIUM — Publishing the entire history lacks a disclosure scan.** The plan recognizes that local history becomes public at [01-01-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:164), but its threat register addresses branch tampering, not secrets, private data, or unwanted historical assets.
- **LOW — One acceptance criterion is ambiguous.** “Exactly the config-flip commit” conflicts with “except this plan’s metadata commits” at [01-01-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-01-PLAN.md:152).

### Suggestions

- Commit or intentionally discard the untracked pattern map before Task 2, then record the expected clean SHA.
- Add a pre-publication audit: tracked sensitive filenames, secret-pattern scan across history, and confirmation that all committed handoff assets are intended to be public.
- Replace the ambiguous commit-count assertion with a path-based check: only `.planning/config.json` may differ from `main` after Task 3.

### Risk assessment

**MEDIUM.** The architecture is good, but the present working-tree state blocks execution and the first public push deserves a disclosure gate.

---

## Plan 01-02 — Workspace and Changesets

### Summary

This is a careful scaffold plan with strong package-boundary discipline. The placeholder packages correctly allow the fixed Changesets group to exist before production package code. Its main weaknesses are incomplete verification and overstating what no-op CI scripts prove.

### Strengths

- The workspace globs match the future architecture and Phase 1 integration decision in [01-CONTEXT.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-CONTEXT.md:69).
- The placeholder manifests avoid prematurely defining exports, `files`, or `sideEffects`, while still supporting lockstep versioning.
- Exact dependency pins and a committed lockfile are appropriate supply-chain controls.
- The plan correctly keeps React independent of styles; that separation is central to the architecture in [ARCHITECTURE.md](/home/franciscpd/Projects/lyra-ds/.planning/research/ARCHITECTURE.md:48).

### Concerns

- **MEDIUM — Verification does not execute everything the task promises.** Task 3 says it will run typecheck and scoped Prettier at [01-02-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:175), but its automated verification omits both at [01-02-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:178).
- **MEDIUM — The scripts are status-check placeholders, not functional gates.** The plan explicitly makes typecheck/test/build no-ops at [01-02-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-02-PLAN.md:28). That is acceptable for Phase 1’s roadmap wording, but it should not be treated as satisfying the full OSS-03 requirement.
- **LOW — Node is not actually pinned.** `"engines": {"node": ">=24"}` allows future major versions, while the plan repeatedly describes a pinned Node 24 toolchain. Use `24.x` or `>=24 <25` if Node 24 is truly the supported line.
- **LOW — The package legitimacy checkpoint is disproportionate.** The research already identifies canonical repositories, exact versions, and a committed lockfile. A blocking manual review of four established packages adds friction without a clearly defined additional decision.

### Suggestions

- Make Task 3 verification exactly match its action: add `pnpm run typecheck` and the scoped Prettier command.
- Describe empty recursive scripts as “reserved CI contexts” rather than working validation.
- Narrow the Node engine if Node 24 compatibility is a real constraint.
- Convert the legitimacy checkpoint into a recorded automated provenance check, or explain which concrete uncertainty requires human judgment.

### Risk assessment

**MEDIUM.** The scaffold design is strong; verification and requirement semantics need tightening.

---

## Plan 01-03 — Governance documents

### Summary

The governance scope is comprehensive and well aligned with OSS-01, OSS-02, and OSS-05. The pre-release warning and bilingual README boundaries are particularly good. The security channel and legal attribution need explicit confirmation.

### Strengths

- README content is grounded in the supplied organization copy, including the canonical four-token and adapter story in [org-profile.md](/home/franciscpd/Projects/lyra-ds/handoff/assets/github/org-profile.md:24).
- The pre-release warning prevents unpublished npm instructions from being presented as currently usable.
- The versioning policy recognizes the real public contract: props, classes, tokens, and export paths, consistent with [PITFALLS.md](/home/franciscpd/Projects/lyra-ds/.planning/research/PITFALLS.md:200).
- Only the README is translated, matching D-04/D-05 in [01-CONTEXT.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-CONTEXT.md:21).

### Concerns

- **MEDIUM — Private vulnerability reporting is never enabled.** The plan publishes an `/security/advisories/new` reporting path at [01-03-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:112), but no plan enables the repository feature. GitHub states that private reports work only after the repository owner explicitly enables private vulnerability reporting. The email fallback prevents total failure, but the primary path may be unusable. [GitHub documentation](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository)
- **MEDIUM — Legal attribution is hardcoded without a recorded decision.** The copyright holder at [01-03-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-03-PLAN.md:110) is not specified in CONTEXT.md and differs from the name currently used in Git commits. Legal identity should not be inferred.
- **LOW — “Verbatim” is weakly verified.** The checks prove that characteristic strings and contact details exist, but do not establish that MIT or Contributor Covenant 3.0 is complete and unmodified.
- **LOW — “Component entry points” may prematurely become public API.** The architecture currently guarantees a barrel export at [ARCHITECTURE.md](/home/franciscpd/Projects/lyra-ds/.planning/research/ARCHITECTURE.md:85); deep component exports have not yet been finalized.

### Suggestions

- Add private vulnerability reporting enablement and verification to Plan 01-01 or 01-05.
- Ask the user to confirm the legal copyright holder and public enforcement contact.
- Pin canonical governance sources and validate their full text, not just selected substrings.
- Phrase export paths generically until Phase 3 defines the React exports map.

### Risk assessment

**MEDIUM.** Governance coverage is excellent, but the security-reporting channel and legal identity should not be assumed.

---

## Plan 01-04 — CI and templates

### Summary

The workflow structure is clear and robust against docs-only PR deadlocks. Stable job names and read-only permissions are good design decisions. This plan contains the most important requirement and supply-chain gaps.

### Strengths

- Unconditional PR execution correctly supports GSD planning-only PRs.
- Stable `lint`, `typecheck`, `test`, and `build` job names match GitHub’s required-check naming mechanism; GitHub documents workflow check names as the job name.
- Top-level `contents: read` and avoidance of the privileged PR trigger reduce exposure to untrusted forks.
- Issue forms, disabled blank issues, CODEOWNERS, and the pre-1.0 changeset reminder form a coherent contributor surface.

### Concerns

- **HIGH — OSS-03 is not actually satisfied.** The canonical requirement says every PR runs publint/attw, size-limit, and parity scripts in [REQUIREMENTS.md](/home/franciscpd/Projects/lyra-ds/.planning/REQUIREMENTS.md:14). Plan 01-04 explicitly implements those as comments only at [01-04-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:107). The roadmap silently weakens this to “hooks ready” in [ROADMAP.md](/home/franciscpd/Projects/lyra-ds/.planning/ROADMAP.md:35).
- **HIGH — The actionlint installer is mutable remote code executed on every PR.** The plan uses `curl ... raw.githubusercontent.com/.../v1.7.12 | bash` at [01-04-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:106). A version tag is movable, and the script is executed without a committed checksum. GitHub states that a full commit SHA is the only immutable action reference. [GitHub secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use)
- **MEDIUM — First-party actions remain on mutable major tags.** `actions/checkout@v7` and `actions/setup-node@v7` are trusted publishers, but this is inconsistent with the plan’s explicit supply-chain-hardening posture.
- **LOW — Issue-form parsing is not in the automated verifier.** The acceptance criteria require YAML parsing at [01-04-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-04-PLAN.md:144), while the automated command only checks file presence and strings.

### Suggestions

- Either split OSS-03 into “base CI infrastructure” and later package-specific gates, or leave OSS-03 pending until Phases 2–4 activate every required gate.
- Pin every action to a full commit SHA.
- Replace `curl | bash` with a release artifact whose checksum is committed and verified, or pin the installer source to a commit and verify the downloaded binary.
- Put an actual YAML parser or GitHub issue-form validation into the task verifier.

### Risk assessment

**HIGH.** The workflow shape is good, but it presently claims a requirement it does not meet and introduces an avoidable mutable-code execution path.

---

## Plan 01-05 — Integration and protection

### Summary

This is a strong end-to-end integration plan: it tests a clean clone, exercises CI on a real PR, uses a merge commit so later phase artifacts remain manageable, and only then activates required checks. Its completion claim is currently invalid because OSS-03 and phase validation remain incomplete.

### Strengths

- The clean-clone test validates committed state rather than relying on the working directory.
- A real PR and four observed checks provide better evidence than merely linting the workflow locally.
- Merge-commit reasoning is correct: it keeps the first branch history ancestral to `main`, avoiding the duplicate-diff problem that squash merging would create for the subsequent phase-doc PR.
- Required check contexts exactly match the four job names, consistent with GitHub’s ruleset behavior.

### Concerns

- **HIGH — It declares OSS-03 “fully TRUE” despite missing gates.** The completion claim appears at [01-05-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:174), while publint, attw, size-limit, and parity remain comments.
- **HIGH — The official validation contract is still a template.** [01-VALIDATION.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-VALIDATION.md:22) contains framework placeholders, its task map is empty at [01-VALIDATION.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-VALIDATION.md:41), and `nyquist_compliant` remains false at [01-VALIDATION.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-VALIDATION.md:7).
- **MEDIUM — Repo-wide formatting exceeds declared file ownership.** The plan lists seven potentially modified files at [01-05-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:7), but `pnpm run format` at [01-05-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:84) can rewrite package manifests, issue forms, Changesets config, and other Wave 2 files.
- **MEDIUM — Clean-clone verification omits typecheck.** The action includes typecheck at [01-05-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:85), but the automated clean-clone command omits it at [01-05-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:89).
- **LOW — Ruleset selection is positional.** `.[0].id` at [01-05-PLAN.md](/home/franciscpd/Projects/lyra-ds/.planning/phases/01-monorepo-foundation-governance/01-05-PLAN.md:132) should select the `main-protection` ruleset by name.

### Suggestions

- Do not close OSS-03 here unless its wording is split or revised.
- Complete and validate `01-VALIDATION.md` before execution.
- Format only files reported by `prettier --check`, or expand `files_modified` to cover every possible output.
- Add typecheck to the clean-clone command.
- Select and verify the ruleset by exact name before mutation.

### Risk assessment

**HIGH.** The integration mechanism is solid, but requirement closure and validation evidence are presently unsound.

---

## Required revisions before execution

1. Reconcile OSS-03 between REQUIREMENTS, ROADMAP, and Plans 01-04/01-05.
2. Fill and approve `01-VALIDATION.md`.
3. Synchronize `STATE.md`, which still reports zero plans at [STATE.md](/home/franciscpd/Projects/lyra-ds/.planning/STATE.md:15), and commit the untracked pattern map.
4. Add a pre-publication history/secret disclosure audit.
5. Enable private vulnerability reporting or remove the unusable advisory URL.
6. Replace mutable action references and `curl | bash`.
7. Align automated verification commands with every promised task action.
---

## Consensus Summary

Single-reviewer run (Codex only) — no cross-reviewer consensus is possible; all findings below carry one reviewer's weight. The review is source-grounded (findings cite `file:line` evidence from the actual repo and plans). Note: the reviewer's aside about attempting a Claude CLI review is incidental — this run only requested Codex.

### Agreed Strengths
N/A (single reviewer). Codex's standout strengths: two-step ruleset bootstrap sequencing (protection before checks, checks after first CI run), fixed changesets group with placeholder stubs, real-PR integration proof with merge-commit reasoning, and read-only CI permissions with stable job names.

### Agreed Concerns
N/A (single reviewer). Codex's highest-severity findings, in priority order:

1. **HIGH — OSS-03 traceability conflict**: REQUIREMENTS.md says every PR runs publint/attw/size-limit/parity, but plans 01-04/01-05 implement those as comments only and 01-05 declares OSS-03 "fully TRUE". Reconcile the requirement wording (split into "base CI infrastructure" now + package gates later) or leave OSS-03 pending.
2. **HIGH — Supply-chain gaps in CI**: `curl | bash` actionlint installer from a mutable version tag on every PR; first-party actions on mutable major tags instead of commit SHAs.
3. **HIGH — Execution readiness**: 01-VALIDATION.md is an unfilled template claimed as the validation contract; STATE.md/working tree not synchronized (untracked 01-PATTERNS.md would fail plan 01-01 Task 2's clean-tree precondition).
4. **MEDIUM — Security/legal assumptions**: private vulnerability reporting is referenced but never enabled; LICENSE copyright holder hardcoded without a recorded user decision; no pre-publication secret/history disclosure audit before the first public push.
5. **MEDIUM — Verify-command drift**: several tasks promise actions (typecheck, scoped prettier) their automated verification never runs; repo-wide `pnpm run format` in 01-05 exceeds declared files_modified.

### Divergent Views
N/A (single reviewer).
