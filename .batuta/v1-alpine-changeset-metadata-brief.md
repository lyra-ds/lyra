# Correct Alpine additive changeset metadata — low maintenance
## Goal
Correct the existing optional returnFocusTo changeset from minor to patch under current0.x policy.
## Context
Current Alpine is0.6.0. VERSIONING.md:20–37 defines0.x patch for compatible additions/fixes and minor for breaking changes. .changeset/alpine-modal-return-destination.md describes the optional returnFocusTo addition verified at3041be4; no existing option removed or required migration introduced. Task33 already corrected the same conductor metadata mistake for React initialFocusTo. The current metadata scout is read-only; the controller verifies its structured report and exact source snapshots before dispatch. All19incumbent changesets are audited for their declared metadata, not reclassified from hypothetical product behavior. Only this one metadata edit is authorized. No release or version command.
## Conventions
English project prose, Conventional Commits, pinned Node24.18.0/pnpm11.13.1. Existing package/versioning conventions. One reversible metadata correction requires no new tests or runtime build. Preserve exact other bytes and all existing source/compiled output.
Test the behavior, never the mock.
A failing test means fix the code, not the test.
No test-only flags or branches in production code.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
## Acceptance criteria
1. Exactly '@lyra-ds/alpine': minor changes to patch in the existing changeset frontmatter. Package key and all prose remain byte-identical. Controller exact before/after substitution and scoped formatting verify; no other changeset changes.
2. No product source, package.json version, lockfile, generated artifact, config or managed work state changed by worker. Controller scope and public artifact hash parity prove metadata-only delivery. No version/build/publish commands, no service operations.
## Boundaries
Do not create/edit/delete other files, including WORK/.batuta/hooks/ignores/config. No tests/builds/package managers/gitwrites/delegation/worktrees/services/remote/Docker/Colima. No approval interview or format unrelated files. Only controller commits and records.
## Scope
.changeset/alpine-modal-return-destination.md
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Report the exact one-line change, no unrun check claimed. Before editing criterion n print isolated BATUTA-PROGRESS <n> START; DONE only for proof actually executed. Read/edit/report only; controller owns verification. Do not run a formatter in worker; controller owns the trivial formatter check.
## Stop conditions
Policy/source contradicts, same unexpected command fails twice, or completion needs outside scope. Preserve and report; do not improvise a release.
