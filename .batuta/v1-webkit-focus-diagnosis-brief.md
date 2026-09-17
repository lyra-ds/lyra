# WebKit focus-restoration diagnosis

## Goal

Identify the cause of six local WebKit focus-restoration failures in current Drawer and Dialog before choosing any repair.

## Context

Source 574faa1. Prior full local suites: Chromium/SSR 43/43, WebKit 32 pass and 6 focus failures, identical six on pre-Drawer-fix baseline (30 pass). Five Dialog and one Drawer assertions expect the trigger, but activeElement is body. Dialog openHarness explicitly focuses its trigger and then clicks it; Drawer clicks without explicit focus. Components capture activeElement in their portal child effect and restore it on open=false. Mouse behavior versus keyboard activation must be observed, not guessed. Existing local Chromium/WebKit, Vite, React and Playwright only; no installs or Colima commands.

## Conventions

English repository records; Portuguese conversation. Evidence/critical self for observed behavior and scope decisions. Real current component source and CSS; trusted browser input. No alteration of success behavior, no mock focus restoration. Any implementation follows a separately bounded Batuta brief after diagnosis.

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

1. Compare real mouse opening (with and without pre-focus) against keyboard opening in Chromium and WebKit, capturing activeElement before opening, event trace and restored focus after Escape. Proof: retained local Playwright runner/result and source trace; name a mechanism or exact unknown without inferring a product defect merely from a failed test.
2. No production, dependency, configuration or historical evidence edits during diagnosis. Proof: git scope and hashes; owned browser/server close; record narrow next correction only after evidence, preserving meaningful focus-return assertions and release obligations.

## Boundaries

No Colima configuration/restart or Docker commands, dependencies, baseline regeneration, API change, broader overlay framework, global test relaxation, skipped browser or remote action. Missing release qualification stays pending.

## Scope

Managed .batuta/v1-webkit-focus*.md and .batuta/runs/v1-webkit-focus/ only, plus WORK.md and existing Batuta backlog/plan when recording the result. Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence

Browser/Node/source identity, precise trusted input and activeElement history, source ownership, limits and next atomic repair boundary. No full matrix qualification claim.

## Stop conditions

Stop if code contradicts the brief, the same command fails twice unexpectedly or broader changes are required. Print BATUTA-PROGRESS n START before each criterion work and BATUTA-PROGRESS n DONE when proven. No unapproved product edits or redelegation.
