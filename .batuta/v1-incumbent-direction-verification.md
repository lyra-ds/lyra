# Incumbent direction verification — 2026-09-08

Controller verification and independent four-criterion review complete: approved.
Base 9d214bfb8dbf572aebc967d6a78321294356ba63. New isolated branch
feat/v1-incumbent-stabilization; unmerged composed source not integrated.
This is a governance/policy update, not product implementation or qualification.

## Proofs

- Original policy106/106 PASS,0skip, exit0. Main's original checker/test Git
  blobs match origin/main 9d214bf exactly. Retained log in MAIN .batuta/runs/
  2026-09-08-v1-direction-policy-baseline.log.
- New decision-clause omission, incumbent-only positive, and comparative-only
  rejection tests ran against the original checker:3/3 correctly RED, exit1.
  policy-red.log retains exact failures; no runtime source changed before RED.
- Updated checker/full existing suite:108/108 PASS,0fail/skip, exit0,
  policy-green.log. Only the obsolete candidate-name policy was replaced;
  approval, normative clauses, eleven P1 entries,23cells, immutable evidence,
  failed-evidence rejection and planning qualification prohibition remain.
- Actual pinned Node24.18.0 CLIs for phase0, independent release policy,
  v1-core and v1-release all exit0. gates.json contains command/stdout/stderr.
  The last command means ledger consistency, NOT release readiness.
- Pinned Prettier passes scoped source and managed changed files; full diff
  whitespace passes. New plan has3numbered scoped/laned tasks and3Accept
  fields plus one valid Status line. Tasks 1–2 are approved; Task 3 is
  solely a future Drawer pointer-origin reproduction and remains incomplete.
- Root package.json, lock, CI workflow, program.json and candidates.json hashes
  match baseline; complete packages tree unchanged. No generated evidence,
  dependency, product API, ledger or workflow edits. No Docker/Colima command,
  configuration write, restart or heavyweight build/browser work in this update.

## Scope and semantic review

Seven source paths from the original brief plus managed Batuta/WORK records.
Current design and overlay gate now record incumbent retention without a
comparative prerequisite, and explicitly preserve automated quality and exact
release evidence. The harness README identifies its remaining command text as
historical research; the baseline index points to the current decision. Future
substitution needs separate approval. No future dependency or release is granted.

Read-only GLM scout: exit0 and unchanged HEAD/status/diff guard. Original report
is retained verbatim. Its recommendation to leave the compulsory comparison
spec untouched and advance ledger status was declined because it contradicts
the explicit maintainer decision and no implementation began. Its proposed
combined Drawer pointer/focus fix was split: only pointer-origin reproduction
is next. Controller checked Drawer:97–101 and Dialog's guard/test precedent;
all current-contract paths and narrowed backlog owner paths exist. Remaining
static findings are labelled source observations or historical/runtime unknowns,
not new behavioral PASS/FAIL claims. A complete product gap audit/qualification
is not claimed.

Current resource prohibition is copied into Batuta profiles for all existing
Lyra checkouts, including old research checkouts. Their WORK/experimental plan
record suspension and point to the new branch; raw historical results remain
unchanged. The old composed plan is deliberately marked suspended to prevent
its earlier runnable status from reviving revoked diagnostic authorization.
Main checkout's unrelated preexisting changes are preserved; no commit to main.

Final reviewer received the original full brief, current plan and dated decision,
this proof and exact gate/log evidence. Four DONE criteria, unchanged guard and
verifier PASS; one cosmetic managed-record finding accepted and corrected.
See v1-incumbent-direction-review.md. Tested source bytes remain unchanged.
