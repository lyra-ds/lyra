# V1 incumbent direction — approved governance update

## Goal

Implement the maintainer's2026-09-08 instruction to retain current Lyra for1.0, suspend comparative foundation research and replace that prerequisite with focused incumbent stabilization. Produce a compact actionable backlog and explicit resource boundary without claiming any component qualified.

## Context

Base origin/main9d214bfb8dbf572aebc967d6a78321294356ba63 in ../lyra-v1-stabilization, branch feat/v1-incumbent-stabilization. Do not integrate the composed experimental branch94aa4b5. The user explicitly rejected any Colima configuration change, including restoration, and restarting Colima. Existing experiments/evidence remain historical. The current release/overlay specs require four-way evaluation, and tools/v1-release/check(.test).mjs has candidate-name presence assertions. Preserve all other normative acceptance/approval/lifecycle/security checks, especially planning status,11P1 entries and23cells. Current component sources exist but have no release qualification. User approved keeping incumbent, not waiving accessibility or redesigning every component.

## Conventions

English repository docs, Portuguese conversation. Pinned Node24.18.0/pnpm11.13.1. Critical/self for the coupled maintainer governance decision, independent GLM5.3Flash review. Use existing node:test/policy structure, no new framework. No Docker/build/browser activity for this update; only lightweight host tests, actual policy CLI, formatting, scope and independent review.

- Follow the project's existing state approach (props drilling, context,
  zustand, redux…).
- Components: PascalCase file and export names, one main component per file,
  colocate with the existing folder pattern (check neighbors before creating).
- Hooks: `use` prefix, rules of hooks respected.
- Styling: match the project's existing method (CSS modules, styled-components,
  Tailwind…).
- Derive state where possible; `useEffect` only for real external
  synchronization, with a complete dependency array.
- Tests: follow the project's runner (vitest/jest + testing-library). Query by
  role/label, not by test-id, unless the project already standardizes test-ids.

Never:

- Class components in new code.
- A second state or styling library alongside the project's existing one.
- Conditional hooks.
- `any` in a TypeScript project — type props and returns explicitly.

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

1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.

## Acceptance criteria

1. Current release design, overlay selection section, new dated decision and public evidence/harness indices consistently retain the incumbent and suspend comparative runs as a V1 prerequisite. Existing observable contracts and all23acceptance cells remain intact. Proof: scoped diff/source comparison and independent review.
2. Release policy checks require the incumbent decision, no comparative prerequisite, unchanged automated acceptance and future substitution requiring new approval; they no longer require a competitor list. Mutation tests reject omission of each decision clause, original comparative-only fixture fails and incumbent-only fixture succeeds, preserving all other existing policy regression coverage. Proof: controller old-source RED, full node --test tools/v1-release/check.test.mjs and actual node tools/v1-release/check.mjs GREEN.
3. Batuta profile/WORK/new plan reflect explicit user authorization, no Colima configuration changes/restarts, sequential bounded existing-environment verification, no experimental integration and honest11P1 status. Scope the next small reproducer from source-audited evidence, distinguish historical claims and runtime unknowns. Do not present the entire V1 as approved implementation or complete. Proof: plan shape, source anchors and independent review.
4. Production packages, dependency manifests, lockfile, workflow, V1 ledger and historical raw evidence remain unchanged; only scoped governance/tool-policy files plus managed state change. No remote operations. Proof: git diff scope, protected hashes, pinned formatter and git diff --check. Final review receives this full original brief, current decision and plan.

## Boundaries

No package/runtime edits, dependencies, lock/workflows/ledger changes, vendor installation or adoption, evidence regeneration, skipped/relaxed acceptance cells, qualified claims, Colima/Docker setting changes/restart/foreign cleanup, full heavy verification, push/PR/merge/release. Historical evidence is not rewritten to fit the new direction. No implementation of a new Tabs/DataTable API in this governance task.

## Scope

Only docs/superpowers/specs/2026-08-30-lyra-v1-deliberate-release-design.md, docs/superpowers/specs/2026-08-30-overlay-family-design.md, docs/superpowers/specs/2026-09-08-v1-incumbent-direction.md, docs/superpowers/baselines/lyra-v1/README.md, tools/overlay-foundation-evaluation/README.md, tools/v1-release/check.mjs, tools/v1-release/check.test.mjs. Managed .batuta/ and WORK.md record direction, audit, plan, verification and research suspension. Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence

Exact baseline/RED/GREEN command outputs and counts, unchanged protected hashes, self-contained plan/backlog with valid source anchors, historical-versus-current proof labels, independent four-criterion review and every finding adjudicated. Tests prove changed policy behavior without pretending to qualify product runtime.

## Stop conditions

Stop if code contradicts the brief, the same command fails twice unexpectedly or scope must widen. No additional permission required for this already approved direction update. New implementation contracts and final publication remain separate decisions. For each criterion n print BATUTA-PROGRESS n START before edit and BATUTA-PROGRESS n DONE only when proof passes. No redelegation.
