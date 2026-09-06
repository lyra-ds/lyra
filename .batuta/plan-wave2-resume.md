# Resume checkpoint — Overlay Foundation Wave 2

Imported into Batuta on 2026-09-06 at the user's request.
This record resumes the existing checkpoint without restarting plan execution.

Local run reports and absolute evidence paths below refer to the operator's
persistent workspace; they are not shipped evidence attachments.

## Current status

- [x] Tasks 1–7 completed and reviewed, according to the handoff and SDD history.
- [x] Task 8: implementation, Run 10, manifest, and local verification completed.
- [x] Import: HEAD, manifest, 328 evidence files, and protected scope checked.
- [x] Independent final review of Task 8 and the branch completed; controller approved the local checkpoint.
- [x] User authorized the remote checkpoint; pushed 28 commits and updated draft PR #219 on 2026-09-06.

The import checks establish the integrity and revision binding of existing
evidence. Independent local review and subsequent CI verification are recorded
separately below.

## Next checkpoint

Local review is approved. The detailed verdict and dispositions are in
`runs/2026-09-06-wave2-final-review.md`. The user-selected GLM model completed
all eight criteria; no blocking defects remained after controller judgment.
All 656 individual attempt hashes and expected records were also verified in
this review, extending the earlier import-only checks below.

The user authorized the remote checkpoint and subsequent readiness after green CI.
The initial push/update proof is `runs/2026-09-06-wave2-pr-219-update.json`.
PR #219 is now OPEN and ready for review at
`cb6bf30d785189203dd1f25e43f5d267cb851c38`; its exact English body matches
`pr-219-body.md`. All four CI jobs passed in run `34044794817`.
CodeRabbit was pending and reviewer approval was required at readback, with
zero unresolved review threads. Await remote review before considering merge.
No merge, release, deployment, or manual dispatch occurred.
Readiness proof: `runs/2026-09-06-wave2-ready-proof.json`.
Batuta profile, routing taxonomy, and project map were refreshed on 2026-09-06
and are included in this PR with the imported checkpoint.

## CI follow-up — 2026-09-06

The user authorized marking PR #219 ready for review once CI passes. Merge
remains a separate decision. Run `34043225940` completed: lint, typecheck, and
build passed; test failed at two real-Vite fixture tests with Git dubious
checkout ownership. No review threads exist; CodeRabbit skipped the draft.
The controller reproduced the same failure using
`GIT_TEST_ASSUME_DIFFERENT_OWNER=1`. The one-file test-only correction was completed by OpenCode /
`opencode/glm-5.3-flash` and pushed as `cb6bf30`. Controller verification passed
56/56 tests with simulated different ownership and the formatting/scope checks.
Production Git/ownership boundaries and the evaluated manifest remain unchanged.
CI run `34044794817` passed lint, typecheck, build, and test, including the
browser matrix and compatibility checks. The authorized ready-for-review
transition completed and was verified; the implementation worktree is clean
and synchronized. The evaluated evidence remains bound to its original revisions.

## Reviewed target and contract

Reviewed worktree `/Volumes/Home/francisross/Projects/lyra/lyra-anchored-wave`,
branch `feat/v1-overlay-anchored-wave`, HEAD
`cd087978c6fd8d9bc2e7bbd98458110cf9310c36`.
Read the original plan and the reports referenced below. Use the briefs,
reviews, and decisions under `.superpowers/sdd/2026-09-03-overlay-foundation-anchored-wave/`
in that worktree. Record each finding and its disposition, or a verdict with
no findings, including evidence limitations. Reuse evidence matching HEAD;
repeat commands only when a change, failure, or unresolved question warrants it.

The current session owns coordination and judgment (`critical` / `self`).
Independent review completed through OpenCode with `opencode/glm-5.3-flash`,
selected by the user on 2026-09-06. The existing medium/high models are retained;
do not presume additional model selections,
parallel execution, or creation of AGENTS.md. Allowed executors are listed in
`routing.md`.

## Import verification

- Implementation worktree clean; HEAD matches the index and final gate report.
- HEAD differs from evaluated implementation `ce36f326c8fc4bd2907d63598066422bb6811a4c`
  only in `tools/overlay-foundation-evaluation/candidates.json`.
- The 5781-byte manifest matches the evaluated input exactly; SHA256
  `7289eee93d453c5b1144406b01471beea630275b40bccd190043d8319b37b79f`.
- All 328 files in `restart-evidence-index.json` exist and match their recorded
  sizes and SHA256 hashes. The attempt checksum index was verified as a file;
  individual attempts were not separately reread during this import.
- `final-gates-report.json`: 13 gates, all with exit 0 and disposalVerified=true.
- Run 10: 656 attempts, 620 completed tuples, 632 underlying executions, and 36
  candidate execution failures. Aggregate results: 97 PASS and 559 FAIL.
  Completing the diagnostic does not imply behavioral approval.
- `git diff --check origin/main...HEAD` passed; protected diff empty for
  `pnpm-lock.yaml`, `packages`, `.github/workflows`, and the V1 program.
- Docker resource absence is historical evidence from `completion-proof.json`;
  Docker was neither started nor inspected again during this import.
- Control files were updated only in the main checkout; evidence and the
  implementation worktree remain intact. No commit or remote action performed.

## Preserved source

Source: `/Volumes/Home/francisross/Projects/lyra/HANDOFF-WAVE2-2026-09-05.md`.
Its filename contains 05, but its content records an update on 2026-09-06.
Source SHA256: `0d40ff81a97abea40d8a0f6629634908d6899813746e9857e9757accd40f9729`.
The external original remains unchanged. The obsolete August Batuta handoff is
preserved in Git at `37b4fe8:.batuta/handoff.md`; it is no longer an active
handoff. This checkpoint is referenced from `WORK.md`.

The following is an English translation of the imported handoff. Process states
and authorizations describe the source checkpoint; current import checks are
listed above. The source hash applies to the original, not this translation.

---

# Lyra handoff — Wave 2

Status updated on 2026-09-06: LOCAL VERIFICATION COMPLETE; PROCESSES CLOSED;
READY TO RESTART THE MAC.
Independent final review of the complete change remains pending for resumption.
Completed execution is not final approval for integration.

## Location and Git

- Worktree: `/Volumes/Home/francisross/Projects/lyra/lyra-anchored-wave`
- Branch: `feat/v1-overlay-anchored-wave`
- Clean HEAD: `cd087978c6fd8d9bc2e7bbd98458110cf9310c36`
- Evaluated implementation: `ce36f326c8fc4bd2907d63598066422bb6811a4c`
- HEAD contains only the exact evaluated manifest in a separate commit.
- Main checkout preserved: `/Volumes/Home/francisross/Projects/lyra/lyra`
- Plan: `docs/superpowers/plans/2026-09-03-overlay-foundation-anchored-wave.md`
- Decision, cost, review, and report history: `.superpowers/sdd/2026-09-03-overlay-foundation-anchored-wave/`

## Results and persistent evidence

Run 10 finished with exit 0: 656 immutable first-attempt records, 620 completed
tuples / 632 underlying executions, 36 candidate execution-stage failures,
no unavailable tuples, and no preparation failures. Candidate failures are
diagnostic results; they do not imply approval of all behavior. There is no
winner or production authorization.

All 13 final checks passed without filters: build, core, modal, Wave 2,
manifest, V1 release, lint, typecheck, workspace tests, pack-smoke, diff check,
protected scope, and status. No OOM in the final proofs.

- Diagnostic, final report, and copied ledger: `/Volumes/Home/francisross/tmp-builds/lyra-wave2-diagnostic-ce36f32-run10-20260906/`
- Full report: `final-task-8-report.md`; chronological decisions and costs:
  `final-progress.md` in that directory.
- Evidence index: `restart-evidence-index.json`. The controller checked the
  size and SHA256 of every entry before this handoff.
- Final gates: `/Volumes/Home/francisross/tmp-builds/lyra-task8-final-gates-cd08797-20260906/`
- Commands and outputs: `evidence/final-gates-report.json`; completion:
  `completion-proof.json` in that directory.
- Manifest: 5781 bytes, SHA256
  `7289eee93d453c5b1144406b01471beea630275b40bccd190043d8319b37b79f`;
  the controller confirmed equality between the tracked file and evaluated input.
- Additional historical logs: `/Volumes/Home/francisross/tmp-builds/lyra-task8-authoritative-logs-c522f89/index.json`.

## Restart and environment

All implementation/review agents have finished. Owned diagnostic, monitor,
and gate sessions closed with exit 0. Owned project containers and networks
were removed; the diagnostic working directory was removed and caches/evidence
were preserved. The controller checked Docker and processes again: no active
containers or verification executors were found. No new work was started.

The Mac has 16 GiB of physical memory; Colima was configured with authorization
for 12 GiB / 4 CPUs (12514037760 bytes visible to Docker). The user will restart
for an update; the agent did not restart the Mac.

Exact Node 24.18.0 and pnpm 11.13.1. Host:
`env TMPDIR=/private/tmp mise exec node@24.18.0 -- ...`.
Browsers run only in the Playwright image pinned by the plan; Safari was not
used. Gates ran build before typecheck, used an owned npm cache, and used one
CPU to avoid the pre-existing docs test race in `_headers`; that race was not
fixed. Root dependencies, lockfile, packages, public exports, workflows, and
the V1 program were preserved.

## Resumption

1. Read this handoff, `final-task-8-report.md`, `final-progress.md`, and the plan;
   confirm branch, HEAD, and `git status --short` in the worktree above.
2. Tasks 1–7 are complete/reviewed. Task 8 completed implementation, diagnostic,
   and gates; independent final review of Task 8/the branch and recording the
   decision remain. Reuse evidence matching the current state without routinely
   repeating tests.
3. Do not edit evidence, attempts, hashes, or expectations. Earlier runs remain
   historical evidence for their specific revisions. The original intermittent
   timeout cause was not established retroactively; runs 9 and 10 completed
   after reviewed fixes.
4. Eight subsequent packaging/decision cells remain outside this wave.
   Two-worker parallelism was only discussed, not implemented. Heavy builds
   remain separate because of the observed memory peak.
5. No push, PR or issue message/edit, merge, dispatch, deployment, or publication
   occurred. The existing draft PR is #219; remote actions remain a separate
   checkpoint requiring authorization. Do not remove worktrees or evidence files.
