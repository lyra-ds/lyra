# Drawer pointer-origin reproduction brief

## Goal

Reproduce the current Drawer pointer-origin hypothesis in a real browser, using current Dialog as the comparison control. Record evidence and a bounded repair brief if confirmed; do not repair production code in this task.

## Context

Approved incumbent plan task 3; clean source 75e536b on feat/v1-incumbent-stabilization. Drawer backdrop handler packages/react/src/drawer/drawer.tsx:97 checks click target identity only. Dialog records mousedown origin at dialog.tsx:137–168; dialog.browser.test.tsx:352 is the WR-02 precedent, but manually dispatches DOM events. This proof must use trusted browser mouse input. Existing local Node 24.18.0, Playwright 1.62.1, Chromium and Vite are installed in the sibling main checkout. No dependency installation required. Current source and CSS come from this checkout, dependencies from the existing installation. No Colima operations.

## Conventions

English repository records, Portuguese conversation. Evidence/critical self, independent read-only GLM 5.3 Flash verification. Use existing React state and real current components/styles, no simulated close implementation. Diagnostic fixture/runner live only in managed .batuta/runs, outside shipped packages. Local diagnostic is not pinned Linux release qualification.

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

1. Trusted pointer gestures compare direct backdrop click, inside click and press-inside/release-outside on current Drawer and Dialog. Proof: execute the local runner, capture targets, isTrusted, close callback count, browser version and source identity; establish root cause from actual event trace or honestly record unavailable execution.
2. Packages, dependency files, workflow, ledger and historical experimental evidence remain unchanged; no Colima configuration/restart, dependency install or remote operation. Proof: source hashes and git scope, owned browser/server cleanup. Record a narrow subsequent repair boundary only if the failure is reproduced.

## Boundaries

No production edits, dependency installation, resource setting changes, Colima/Docker invocation, comparative research, full release qualification, API redesign, push or publication.

## Scope

.batuta/v1-drawer-pointer-proof.md, plus managed .batuta/ coordination records and local diagnostic fixtures/raw output under .batuta/runs/v1-drawer-pointer/. Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence

Exact command/result, trusted mouse event trace, version and source hashes, outcome for both controls, root cause, limitations, cleanup and independent review.

## Stop conditions

Stop if code contradicts this brief, the same command fails twice unexpectedly, or scope needs to expand. No workaround to missing resources. For each acceptance criterion n print an isolated BATUTA-PROGRESS n START before edit and BATUTA-PROGRESS n DONE after its proof passes. No redelegation.
