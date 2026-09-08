# Incumbent direction — independent review

Reviewed source commit: `2d02444b02bf7c77b2ea27926fb2602b40a42b71`.
Critical/self implementation; independent OpenCode `opencode/glm-5.3-flash`,
exit 0, unchanged HEAD/status/diff guard, Batuta verifier: 4/4 DONE, PASS.
No retry or escalation. Controller verdict: approved.

## Verbatim report

Independent read-only review complete. Diff 9d214bf..HEAD (single commit 2d02444, 14 files: exactly 7 scoped paths + 6 managed .batuta/WORK.md). Lenses: Skeptic (evidence consistency, re-verified hashes/clauses/anchors myself), Architect (policy layering decision→spec→checker→tests), Minimalist (scope, no overreach).

TASK 1: DONE — All scoped docs retain incumbent and suspend comparative runs as V1 prerequisite: deliberate-release-design.md (stream 1 "stabilize the existing Lyra overlay behavior foundation", §12 supersedes comparison sequence), overlay-family-design.md (gate renamed "Foundation decision gate", 4 decision clauses each present exactly once, verified by grep), new dated decision spec 2026-09-08, baselines/lyra-v1/README.md "Current V1 direction" section, harness README marks commands historical. program.json hash 6b03edd1… matches baseline (ledger `planning`, 11 P1 + 23 cells untouched); overlay spec acceptance matrix and normative clause groups unmodified in diff. No qualification claim anywhere.

TASK 2: DONE — check.mjs:129-133 replaces candidate list with 4 OVERLAY_FOUNDATION_DECISION_CLAUSES enforced against normalized text (check.mjs:402-409); no candidate-name requirement remains (grep clean). Heading rename synced in checker, test, and doc. RED: supplied policy-red.log shows new tests failing against original checker with correct semantics (clause assertion + 4 candidate-name errors + comparative-only rejection), test line numbers 613-641 consistent with inserted tests. GREEN: policy-green.log 108/108 pass 0 fail/skip + actual check.mjs exit 0 ("ledger internally consistent" only). Math consistent: 106 original − 1 replaced candidate test + 3 new = 108; other 105 regression names all present in green log incl. approval/normative/P1/23-cell/planning-prohibition/failed-evidence tests. Omission-mutation loop covers each clause individually; incumbent-only fixture asserted free of Radix/Base UI/Zag; comparative-only fixture rejected.

TASK 3: DONE — Plan has 3 numbered scoped/laned tasks with Accept fields and one Status line; explicit Colima prohibition, no-restart/no-foreign-stop, sequential bounded checks, experimental branch 94aa4b5 kept separate with suspension note, "All 11 P1 entries remain unqualified and all 23 acceptance cells stay required", release gate/qualification deferred, Status: in progress with unchecked tasks (no completion claim). Backlog/scout distinguish [S] source / [H] historical / [R] runtime-unknown; first task (Drawer pointer-origin) is a bounded reproduction-only with valid anchors — verified drawer.tsx:97-101 (unguarded backdrop click, target===currentTarget) and Dialog WR-02 precedent dialog.tsx:137 + dialog.browser.test.tsx:352 exist.

TASK 4: DONE — Diff touches only scoped source paths + managed records; package.json/pnpm-lock/ci.yml/program.json/candidates.json SHA-256 independently recomputed and match controller evidence exactly; `git diff --stat -- packages/` empty; `git diff --check` clean; no workflow/ledger/dependency/evidence edits; single local commit, no remote/push/merge artifacts; no Docker/Colima traces in diff.

Governance/policy qualification only — no product runtime qualification claimed or implied; consistent with brief.

## Verbatim findings

WORK.md:3 · low · sentence-glue typos in managed records: "on2026-09-08", "origin/main9d214bf"; same class in .batuta/plans/v1-incumbent-stabilization.md:8 ("on2026-09-08"), :33-34 ("integrated9d214bf", "at94aa4b5"), .batuta/v1-incumbent-direction-verification.md:11. Cosmetic; no semantic, scope, or criterion impact; managed files only.

## Adjudication

Accepted low cosmetic finding: corrected the named sentence-glue typos in
current managed records only. Tested seven source files remain byte-identical.
No other findings. Tasks 1–2 complete; Drawer reproduction remains pending.
Historical suspension notes committed separately: composed `a868e8d`, anchored
`3335702`; no product changes in those commits. Main remains uncommitted.
