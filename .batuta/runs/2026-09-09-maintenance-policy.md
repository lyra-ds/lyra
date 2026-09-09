# Run — incumbent maintenance policy

**Date:** 2026-09-09 · **Lane:** maintenance/critical · **Executor:** controller/self
**Commit:** pending · **Verdict:** ✅ approved

## Brief
# Experimental isolation without freezing incumbent maintenance
Lane: maintenance/critical — controller. This governance correction requires the current maintainer's superseding direction, not a package-version snapshot refresh.
## Goal
Allow ordinary incumbent source/dependency/workflow maintenance while preserving suspended-experiment isolation and honest V1 qualification ownership.
## Context
Maintainer retained incumbent Lyra and suspended comparisons; current request authorizes continuous stabilization and existing-library update assessment. The old repository-policy test freezes root dependency versions and git objects for all packages, workflows, lockfile and V1 ledger. It rejects stabilization commit88c5211 and Dependabot PR221/220. Raw old-source proof in .batuta/runs/v1-bottom-sheet-focus/policy-freeze-baseline.log; primary CI failures and reviewed disposition in main .batuta/runs/v1-dependency-triage/. Current workspace patterns are packages/*, apps/*, tools/*. Experimental artifacts remain in their catalog/manifests; regular tests must not run live diagnostics. V1 ledger transitions/evidence are owned by tools/v1-release/check.mjs and its tests, not an experiment's permanent live-checkout freeze.
## Conventions

- Follow the existing code style of the files you touch — naming, formatting,
  import order.
- Change only what the brief asks. Every changed line must trace directly
  back to the brief.
- Clean up only your own mess: remove imports/variables/functions that YOUR
  change made unused. Leave pre-existing dead code alone — mention it in your
  output instead of deleting it.
- Keep functions small and names descriptive; prefer clarity over cleverness.
- Comments only for constraints the code cannot express — never to narrate what
  a line does.
- If the brief references tests, make them deterministic: no real network, no
  time-dependent assertions.

Never:

- Reformat code you were not asked to change.
- Add a dependency the brief does not explicitly allow; no lockfile changes
  except from an allowed dependency.
- Drive-by refactors or "improvements" outside the brief's scope.
- Touch CI config, license, or anything listed under the brief's Boundaries.
- Silence a signal instead of fixing its source (casts, empty catch blocks,
  sleeps, copy-paste to dodge the real fix) — the method line says how to
  mark an unavoidable workaround.


Use existing Node builtins and test runner; no new library, shared framework or product runtime changes. English docs only under .batuta. Run sequentially with pinned Node24.18.0/pnpm11.13.1; no global configuration, Colima/Docker or foreign-service changes.
Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark WORKAROUND and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.
## Acceptance criteria
1. Current checkout and one-commit shallow fixtures permit ordinary existing dependency version, package source, workflow and lockfile maintenance. No frozen live dependency/object snapshot constants, no refreshed hashes or skipped tests. Proof: original focused freeze test RED, corrected full repository-policy test GREEN with real temporary shallow checkout containing legitimate edits.
2. Root and every workspace manifest reject direct or npm-aliased experimental candidate artifact dependencies in dependency sections, while preserving ordinary dependencies. Proof: real temporary manifest mutations rejected by the repository check with precise candidate-integration failure; restored legitimate fixture passes.
3. Existing exact historical candidate-record checks and no-live-diagnostic-in-ordinary-test rules remain exercised. No historical evidence or live ledger edits; legitimate V1 qualification stays guarded by its canonical owner. Proof: full repository-policy suite plus v1-release tests/CLI, diff/scope review and independent GLM review.
## Boundaries
Only the repository-policy test file may change outside managed state. No runtime/source packages, manifest/version/lockfile/workflow edits yet; PR adoption follows separately. Never edit historical evidence/catalog/manifests, promote ledger, weaken candidate filesystem/security checks, or launch experiments. Existing installation can be materialized locally in this worktree to run checks, using frozen current lockfile and existing allowBuilds policy; it must not traverse controller-provided dependency symlinks. No global configuration or services.
## Scope
tools/overlay-foundation-evaluation/repository-policy.test.mjs
WORK.md and .batuta managed records/evidence
Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Before/after command outputs, genuine shallow-clone mutation regression, scope/hygiene review, canonical ledger gate results, independent review report and guarded tree. Report installation/environment failures independently from policy outcomes.
## Stop conditions
Code contradicts the brief; same unexpected command failure twice; fix needs wider scope. Preserve good work and report blockers without disabling gates or changing Colima.

## Executor report
Controller implemented and verified the single-file correction directly. No delegated product executor.

## Verification
# Maintenance policy verification — 2026-09-09

Approved critical/controller correction; implementation commit pending. The experiment no longer freezes ordinary live root dependencies, packages, workflows, lockfile or ledger git objects. It checks the actual current suspended-candidate boundary in root and immediate workspace manifests (packages/*, apps/*, tools/*), including direct dependencies and npm aliases in all four dependency sections. Eight historical policy cases remain intact. Qualification belongs to the existing V1 release owner, not a permanent experiment status freeze.

Controller original baseline8/10: exactly the two immutable-checkout tests fail at current stabilization HEAD. Final policy10/10, zero skipped; real one-commit shallow fixture allows maintenance edits, rejects four experimental manifest mutations and passes after each restoration. Canonical release tests108/108 and CLI PASS (internal consistency, not qualified release). Format/diff PASS. Scope: one test file only; no product runtime, historical artifact, manifest/version/lockfile/workflow/live-ledger edits.

Before these checks the controller removed only its exact two borrowed dependency symlinks and materialized this worktree's own current installation from the frozen lockfile offline, Node24.18.0/pnpm11.13.1. Install completed in2.7s; versions unchanged. A run-local pnpm shim invokes the existing pinned CLI JS through pinned Node, avoiding the global launcher; no settings are overridden. Earlier launcher-related failures disappeared; only the genuine freeze failures remained in baseline. Main installation and all service/Colima configuration untouched.

Independent OpenCode GLM5.3Flash review3/3 DONE/no findings, exit0, status/diff/source guard unchanged; Batuta verifier PASS. No retries/escalation. Informational limitation retained: current three workspace pattern roots are explicit; changing pnpm-workspace.yaml patterns requires revisiting discovery coverage. This check does not claim to detect transitive dependencies or maliciously renamed tarballs; package/install/security/review gates remain separate.

Raw controller proof in .batuta/runs/v1-maintenance-policy/. Raw review/guards/verifier in main .batuta/runs/2026-09-09-maintenance-policy-review/. Continue with selected Dependabot maintenance; no dependency update has been installed yet. Full V1 contracts and packed Firefox/Linux qualification remain open.
