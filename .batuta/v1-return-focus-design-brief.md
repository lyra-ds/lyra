# Modal return-focus contract drafting brief

## Goal

Produce a concrete approvable API contract for the observed WebKit invoking-control gap, retaining incumbent Lyra and minimal scope.

## Context

Current b6a3c6c; actual WebKit mouse entry captures body, keyboard and prepared fixtures restore correctly. Approved overlay focus requirements 218–239 still apply. No new public API choice has been approved. Existing Dialog/Drawer capture and restore owners are known; shared focus trap eligibility is internal and Tab-specific. User authorized moving to contract definition, not automatic API publication.

## Conventions

Critical/self design with independent read-only OpenCode GLM5.3Flash review. English project records; Portuguese conversation. Keep scope React Dialog/Drawer return focus, use no dependency/service/configuration workaround. Colima configuration/restart is prohibited. This is design only.

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

1. Proposed API, ownership, compatibility, valid/invalid target behavior, transition timing and limits are explicit, consistent with the approved modal contract. Proof: source anchor checks, internal consistency review and independent review. Invalid composition must not be described as qualified or body fallback as acceptable.
2. Draft gives concrete consumer usage and behavioral verification obligations, distinguishes proposal from approval/implementation, and changes only the named design document plus Batuta state. Proof: diff scope, source hashes/clean production and independent review. No new API implemented or resource changed.

## Boundaries

No source/test/dependency/configuration/ledger edits, Colima/Docker operations, benchmark research, runtime implementation, release qualification or remote operation. No silent relaxation of no-body restoration.

## Scope

docs/superpowers/specs/2026-09-08-modal-return-focus-design.md, plus managed .batuta/ and WORK.md. Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence

Self-contained proposal, precise remaining approval boundary, source-based rationale and independent review with findings adjudicated.

## Stop conditions

Stop if the proposal contradicts the existing contract, needs unrelated subsystem design or scope expansion. Print BATUTA-PROGRESS n START/DONE at each criterion. Do not implement an unapproved API. No redelegation.
