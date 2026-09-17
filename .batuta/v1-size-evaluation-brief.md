# Size-limit evaluation contract

## Goal
Evaluate the13 current failed budgets with comparable packed evidence and ranked measured optimization opportunities. Evaluation only; no product optimization, cap change or release approval.
## Context
Task10 follows modal879b315 and Popoverb471a5c; current revision570fe37. Earlier packed collection compared against a historical repository lock. Use current common build/lock/consumer/scenario overlay on baseline9d214bf and candidate570fe37, preserving each revision's product source. Retain failed gate exits and distinguish individual-entry and full-composition savings.
## Conventions
Pinned Node24.18.0, pnpm11.13.1, current repository/consumer tool graph; sequential bounded checks. English documents. Existing CSS-first owners and public API unchanged. No new dependency, Blade, experimental integration, remote/release or resource/service changes.

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



## Acceptance criteria
1. Controller comparison proves matching tool/config/lock/consumer graph, fixed scenario inputs, exact packed hashes and current artifact identity; list any intentionally different standalone contract instead of comparing it blindly.
2. All13 failed budgets receive exact before/current/limit measurements in their own pipeline; diagnostic hypotheses retain exact isolated scope, numbers and nonqualification boundary. No budget waiver from collector exit0.
3. Recommendations follow measured evidence, preserve current contracts, and state missing implementation/behavior/release work. Independent guarded review and scoped documentation commit.
## Boundaries
No changes to active product source, public API, dependencies, budgets, immutable baseline, external configuration, services, Blade or experimental products. Do not weaken required behavior or use a source-alias consumer as packed evidence.
## Scope
Active .batuta/v1-size-limit-evaluation.md, .batuta/v1-size-evaluation-brief.md, .batuta/v1-focus-size-diagnosis.md, .batuta/scout/2026-09-11-size-evaluation.md and WORK.md. Main raw .batuta/runs/v1-size-evaluation/ and owned disposable checkouts for isolated measurement derivatives. Do not change anything outside this list; if the task requires it, stop and report.
## Expected evidence
Exact raw/minified/Brotli reports, size gate exits, source/packed/artifact hashes, controlled-overlay/derivative scope, untouched active source, cleanup proof, independent findings with disposition. Measurements are not behavior qualification.
## Stop conditions
Unexpected source changes, uncertain artifact identity, broader hypothesis scope or two repeated unexplained command failures require diagnosis before continuing. A failed budget remains failed; retain output while collecting diagnostic rows. Hypotheses are discarded after measurement and never promoted without normal implementation verification.
