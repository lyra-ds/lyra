Work only inside /Volumes/Home/francisross/Projects/lyra/lyra-v1-review-loop/.batuta/worktrees/native-bundle-budget. Implement directly as the delegated high-lane executor; no nested agents, Batuta workflow or approval requests.
# Goal
Implement the approved native bundle budget check in the existing bundle tool and use it in the existing CI build job, retaining exact reproduction and FileUpload acceptance untouched. Smallest focused implementation; no core promotion or new benchmark framework.
# Context
Base 9ffc45409e43da178745502138454d8e0b80bab6. Read .batuta/specs/2026-09-14-v1-acceptance-policy-amendment.md in full: maintainer approved it with “De acordo”. Existing9 standalone exceptions and3composition exceptions are exact ceilings vs pinned historical reference0003123e22ec57d21946b3f6f383fd2da7d1bd0a, not extra allowances added each run. Numerical policy is fully authorized; no permission stop. Existing ./tools/bundle-baseline/measure.mjs exports collectBaseline, installPackedArtifacts, compareBaseline, resolveBaselineReference, runBundleBaselineCli. Current --check compares exact historical architecture/hash/metrics and fails466leafdifferences; all72current absolute budgets pass. Existing measurement consumers/install/toolchain are retained. Scout: installPackedArtifacts extracts the archive then checks package name; tarballMetadata later hashes archive, so bind the verified packed bytes to actual extraction/measurement instead of merely trusting a JSON hash. No existing entry category registry. The existing measure.test.mjs has real temporary tarball fixture tests and injected collectors for CLI (reuse). Main root test already includes measure.test.mjs. CI build job has one baseline:bundles --check line, frozen four job names. Baseline README has active command table; historical plans/evidence remain historical, not rewrite targets.
# Conventions
English docs. Node24.18.0/pnpm11.13.1 pinned and provided PATH. No new dependency, lock change, product runtime/CSS/API edit. Existing native contribution policy wins over older Linux-container prerequisites. Profile methodology tests-after; meaningful existing node:test cases. Root pnpm test and actual collector are controller-owned after delivery; you run focused node:test and formatting only. No benchmark/model research.

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



The generic CI prohibition is overridden only for the explicitly scoped CI bundle step required by this accepted task; do not alter other gates or job names.
# Acceptance criteria
1. New `pnpm baseline:bundles --check-budgets` reuses collector and existing immutable reference data, checks all expected72 standalone/5scenario/4CSS entries without omissions/duplicates, validates finite nonnegative integer measurements and required provenance, and enforces approved absolute caps from historical caps plus the11approved overrides (not a candidate's self-reported passed flag or silently raised manifest cap). Applies JS migration ceilings:1500 default simple;3000 for the9named complex React entries, Alpine aggregate and5scenarios; named accepted exceptions replace the ceiling only for pinned0003123e. Never add future headroom to an exception or shift the reference automatically. Unknown reference, unsupported fixture/toolchain/externals/import changes or missing/malformed measurements fail with actionable messages. Only Tabs' exact approved import transition is allowed. Preserve actual OS/architecture/package hashes as provenance; differences from historical arch/package hashes do not alone fail budgets. Root-lock approved historical→current transition is accounted for; new undeclared measurement protocol/lock changes fail comparability. Preserve and report CSS/module drift separately without inventing a CSS JS-budget or dropping their measurements. A focused test uses historical fixture plus exact approved candidate values; controller will independently replay full retained real JSON.
2. Candidate identity is bound to the actual archives extracted for measurement with portable native logic and no new dependency. Reject wrong/mutated archive identity rather than copying historical hashes; meaningful real-tarball positive/negative test. Keep this bounded to collector-owned files/lifetimes, not an archive-security framework. Return budget result with actual environment/artifact identities and per-entry deltas/approved exceptions (enough to retain provenance and distinguish budget PASS from exact reproduction/runtime acceptance). No writes of canonical evidence/pointers by check-budgets.
3. Existing --check/--write/--accept-comparison file-upload semantics, immutable pointers/evidence and FileUpload runtime validation stay intact (full existing measure.test.mjs + affected FileUpload tests must pass). No core acceptance added because family runtime protocols remain undefined. CI changes only the bundle check step to --check-budgets; active command docs explain both modes and no release/runtime PASS implication. Native-contributors workflow unchanged. Focused meaningful regressions cover budget breach, exception boundary+1, missing/duplicate/invalid data, unapproved import/protocol/cap change, cross-architecture/currenthash success, immutable checks and archive binding; reuse/parameterize existing tests, avoid one test per component or implementation-mirroring assertions.
# Boundaries
No changes to canonical bundles.json/bundles.md/current.json/comparisons/runtime datasets/program.json, locks/manifests, dependencies, production packages, hooks/settings/AGENTS/CLAUDE, release commands, browser fixtures or network/container/resources/services. No full suites/builds/measurement/install from executor; controller owns installs and heavy gates. No broad refactor and no automatic next task. Work test-first from the acceptance criteria. Investigate root cause before fixing a bug; never silence a signal (cast, suppression, empty catch, sleep) instead of fixing its source — if you must, mark // WORKAROUND: <reason> and say so in your report.
Test the behavior, never the mock. A failing test means fix the code, not the test. No test-only flags or branches in production code.
# Scope
Only tools/bundle-baseline/measure.mjs, tools/bundle-baseline/measure.test.mjs, optional tools/bundle-baseline/budgets.mjs (small policy/comparison owner), .github/workflows/ci.yml (one bundle step), docs/superpowers/baselines/lyra-v1/README.md (active command docs), CONTRIBUTING.md (only optional native bundle command explanation). Do not change anything outside this list; if task requires it stop and report. .batuta/native-bundle-budget-brief.md is controller input, do not edit. Do not commit; controller snapshots/reviews/integrates.
# Expected evidence
Report touched files, behavior, focused commands with actual exits/results, explicit unresolved limits. For each acceptance criterion n, print an isolated line BATUTA-PROGRESS <n> START before the first edit toward it and BATUTA-PROGRESS <n> DONE when its proof passes locally. Plain text, nothing else on that line, no tool required. Final exact TASK1/2/3 DONE or INCOMPLETE verdicts. Keep stdout concise; no repeated full file dumps.
# Stop conditions
The code's shape contradicts brief. Same command fails twice for same unexpected reason (new red regression is not that). Needed change outside Scope/Boundaries. Do not invent missing family-runtime policy or broaden into generic acceptance tooling. Deliver this bounded native budget gate only.
# Approved measurement extract (controller-derived; not an extra approval)
{
  "referenceRevision": "0003123e22ec57d21946b3f6f383fd2da7d1bd0a",
  "candidateRevision": "dc9d54f7f5d503c879538fbf1557177149dc064c",
  "configuredCaps": {
    "@lyra-ds/react/drawer": "5.3 kB",
    "@lyra-ds/react/bottom-sheet": "5.3 kB",
    "@lyra-ds/react/create-workspace-dialog": "7.9 kB",
    "@lyra-ds/react/time-picker": "7.9 kB",
    "@lyra-ds/react/date-picker": "9.1 kB",
    "@lyra-ds/react/date-range-picker": "9.2 kB",
    "@lyra-ds/react/tooltip": "2.1 kB",
    "@lyra-ds/react/command-palette": "13.6 kB",
    "@lyra-ds/react/recurrence-selector": "11 kB",
    "@lyra-ds/react/weekly-schedule-editor": "18.7 kB",
    "@lyra-ds/alpine": "24.2 kB"
  },
  "standaloneExceptions": {
    "@lyra-ds/react/drawer": 4004,
    "@lyra-ds/react/bottom-sheet": 3966,
    "@lyra-ds/react/create-workspace-dialog": 5008,
    "@lyra-ds/react/time-picker": 4173,
    "@lyra-ds/react/date-picker": 4200,
    "@lyra-ds/react/date-range-picker": 4193,
    "@lyra-ds/react/command-palette": 4251,
    "@lyra-ds/react/recurrence-selector": 4202,
    "@lyra-ds/react/weekly-schedule-editor": 4165
  },
  "scenarioExceptions": {
    "overlays": 6118,
    "application-shell": 4310,
    "scheduling": 4490
  },
  "tabs": {
    "previousName": "import { Tabs } from '@lyra-ds/react/tabs'",
    "currentName": "import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lyra-ds/react/tabs'",
    "sizeLimit": {
      "name": "import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lyra-ds/react/tabs'",
      "passed": true,
      "size": 1452,
      "sizeLimit": 1500
    }
  },
  "css": {
    "root": {
      "publicEntry": "@lyra-ds/styles",
      "rawBytes": 151863,
      "minifiedBytes": 107171,
      "brotliBytes": 13776,
      "files": [
        "css-1.css"
      ],
      "modules": []
    },
    "styles.css": {
      "publicEntry": "@lyra-ds/styles/styles.css",
      "rawBytes": 151863,
      "minifiedBytes": 107171,
      "brotliBytes": 13776,
      "files": [
        "css-2.css"
      ],
      "modules": []
    },
    "tokens/brand.css": {
      "publicEntry": "@lyra-ds/styles/tokens/brand.css",
      "rawBytes": 1702,
      "minifiedBytes": 1292,
      "brotliBytes": 361,
      "files": [
        "css-3.css"
      ],
      "modules": []
    },
    "compat-shadcn.css": {
      "publicEntry": "@lyra-ds/styles/compat-shadcn.css",
      "rawBytes": 1400,
      "minifiedBytes": 649,
      "brotliBytes": 208,
      "files": [
        "css-4.css"
      ],
      "modules": []
    }
  },
  "rootLock": "33e367f83f485e9235c99698fa43acb75f41c7b1ff715411c64d09c42754db4a"
}
