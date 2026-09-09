# CommandPalette explicit return focus — implementation brief

## Goal
Integrate modal CommandPalette with the existing return-focus owner, using the same optional returnFocusTo API as Dialog/Drawer. Deliver regression coverage and consistent first-party examples/docs as one compatible change.

## Context
You are the implementation executor ALREADY delegated by Batuta. Implement directly, do not conduct or recursively delegate, invoke Superpowers, request workflow approval or commit. Active checkout /Volumes/Home/francisross/Projects/lyra/lyra-v1-stabilization, base8d23c3d. Full task contract below is authoritative. Existing approved modal contract .batuta/specs/2026-09-08-modal-return-focus-design.md provides exact shared semantics; read it and existing owner use-return-focus.ts. No redesign is required.
Named runtime owner packages/react/src/command-palette/command-palette.tsx: props56-87; capture/open effect214-220; obsolete local openerRef380/capture426/restore430; overlay499. use-return-focus.ts already supplies safe once-per-cycle capture/restore; Dialog uses it at270 and Drawer at187. CommandPalette captures before input focus; reuse must preserve open transitions, inline suppression and StrictMode. The backdrop press/release guard from a98a953 must remain unchanged. Source-only scout completed unchanged; controller actual baseline20/24 native paths passes, four WebKit mouse paths end on body. Proof in MAIN checkout .batuta/runs/v1-command-palette-focus/baseline.json. This is RED before implementation.
Public modal callers: apps/docs/components/examples/command-palette/trigger.tsx and apps/docs/components/command-menu.tsx (header trigger + hotkey, command selection navigates via router). Existing inline/hints examples need no edits. API docs en and pt-BR components/command-palette.mdx. Existing docgen reads built React declarations and writes tools/docgen/output/props.json and llms.txt.
Controller owns temporary node_modules symlinks and .batuta evidence; preserve them. No pnpm, installs, test/build/format commands in your sandbox. Controller runs all proof and existing build/docgen owner commands outside it. Do not hand-edit generated files; they are controller-owned output in this task. Report all checks pending, not green.

# CommandPalette explicit return focus

Status: active bounded task under the maintainer's 2026-09-09 instruction to
continue verifying CommandPalette focus and reuse the existing modal mechanism.
The approved Dialog/Drawer contract remains at
.batuta/specs/2026-09-08-modal-return-focus-design.md. This addendum applies its
existing optional synchronous returnFocusTo resolver, eligibility, accepted-close,
latest-committed callback, successor, warning, SSR and cycle rules to modal React
CommandPalette. It introduces no alternative mechanism or new dependency.

Baseline8d23c3d: native StrictMode Chromium/WebKit, mouse/keyboard/hotkey opening,
and Escape/backdrop/selection/hotkey closing:20/24 pass. All four WebKit mouse
cases land on body after panel removal. Source and proof are retained in the main
checkout .batuta/runs/v1-command-palette-focus/baseline.json. Keyboard capture is
valid; mouse callers need an explicit destination, as for Dialog/Drawer.

CommandPaletteProps gains returnFocusTo?: () => HTMLElement | null, consumed by
the existing shared owner instead of its separate restoration implementation.
Resolve only after accepted modal close, once per cycle. Ignored close requests,
initially closed renders, closed callback rerenders, SSR and permanently inline
palettes must never invoke it. Inline open-prop toggles remain silently ignored.
Capture from the panel's ownerDocument before initial focus; preserve StrictMode
and rapid close/reopen cycle behavior. Exclude the closing panel/overlay and their
children even while exit presence retains them. The shared owner remains unchanged.

Keep keyboard fallback to a valid captured opener, current successor eligibility,
preventScroll and development diagnostics for invalid compositions. No arbitrary
fallback, body/html focus call, global trigger tracking, delayed restoration,
initial-focus change, nested-layer design or unrelated modal migration.

Migrate the docs' trigger example and header CommandMenu to a stable trigger ref
resolver. Header remains the declared return destination for hotkey as well as
pointer invocation; router/command behavior stays intact. Inline examples need
no resolver. Both API pages explain explicit mouse usage, valid captured-keyboard
fallback, current logical successor, once-per-accepted-close timing, eligibility,
invalid-target fallback/diagnostic, and inline no-op. New prose is English,
including changed pt-BR prose, per maintainer. Generated props/llms must come from
the existing docgen owner after a React build. One additive React patch changeset;
no versioning or publication.

This closes only the verified CommandPalette return-focus slice. Other modal/P1
and exact packed Firefox/Linux release requirements remain pending.

## Conventions
Batuta coordination only; English documentation; React TypeScript CSS-first existing classes, no style changes. Node24.18.0/pnpm11.13.1 repository; global pnpm differs and must not be invoked. Worktree high lane sequential; Conventional Commits controller-owned. Follow surrounding file naming/style. New .changeset entry uses React patch per 0.x additive version policy.

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


Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark `// WORKAROUND: <reason>` and say so in your report.
1. Test the behavior, never the mock.
2. A failing test means fix the code, not the test.
3. No test-only flags or branches in production code.

## Acceptance criteria
1. Modal optional returnFocusTo uses the existing shared owner; explicit mouse closing by Escape/backdrop/selection/hotkey returns exactly to the valid target without activation-time pre-focus. Test removed-trigger successor after closing commit, valid omitted keyboard capture, ignored close requests, latest resolver and fresh rapid reopen. Preserve strict focus assertions after exit removal. Proof: controller original-source RED/current GREEN and native48 paths (two engines, three invocation modes, four close modes, stable trigger/successor), component browser suite and shared-owner suite.
2. No resolution on SSR, initially closed/closed callback rerenders or inline open toggles. No prop forwarding to DOM; invalid panel/overlay targets must fall back to a valid opener; callback once per accepted cycle and preventScroll retained. Preserve inline input focus, hotkey, selection callback ordering, filtering, presence/scroll and pointer-origin fixes. Proof: explicit integration browser/SSR cases, existing suites, types/lint; shared-owner eligibility tests reused, not copied wholesale.
3. Trigger example and header CommandMenu declare stable trigger refs and resolver; both API pages explain contract with a valid current-state successor example and inline behavior. Controller built declarations and owner-generated props/llms include only the new prop; new React patch changeset present. Proof: actual trigger example trusted Chromium/WebKit close paths, scoped docs type/lint/format checks, build/docgen --check and diff review. Header navigation semantics must be unchanged; do not claim route-transition qualification from mocked navigation.

## Boundaries
No Colima/Docker operations or ANY resource configuration/restart. No new dependencies/install/lockfile/manifests/styles/framework/other-component or shared-owner changes, unrelated cleanup, CI/ledger changes, experiment integration, remote action, versioning/publication. Do not run checks or generators yourself; controller owns them. Preserve all existing .batuta files and dependency links. No automatic focus in consumer click handlers; use declared resolver.

## Scope
- packages/react/src/command-palette/command-palette.tsx
- packages/react/src/command-palette/command-palette.browser.test.tsx
- packages/react/src/command-palette/command-palette.ssr.test.ts
- apps/docs/components/examples/command-palette/trigger.tsx
- apps/docs/components/command-menu.tsx
- apps/docs/content/docs/en/components/command-palette.mdx
- apps/docs/content/docs/pt-BR/components/command-palette.mdx
- .changeset/command-palette-return-focus.md (new)
- tools/docgen/output/props.json (controller generator only)
- tools/docgen/output/llms.txt (controller generator only)
Do not change anything outside this list; if the task requires it, stop and report.

## Expected evidence
Report exact changed files, commands actually run/output, uncertainties and pending controller proof. For each acceptance criterion n, print an isolated line `BATUTA-PROGRESS <n> START` before the first edit toward it and `BATUTA-PROGRESS <n> DONE` when its proof passes locally. Plain text, nothing else on that line, no tool required. Never claim DONE from code inspection; controller proof is pending.

## Stop conditions
1. The code's shape contradicts the brief.
2. The same command fails twice for the same unexpected reason (a red test just written is not that).
3. The fix needs edits beyond Scope or Boundaries.
