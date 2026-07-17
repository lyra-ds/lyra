---
phase: 01-monorepo-foundation-governance
plan: 02
subsystem: infra
tags: [pnpm, workspace, changesets, typescript, prettier, monorepo, toolchain]

# Dependency graph
requires:
  - phase: 01-01
    provides: GitHub org/repo bootstrap, protected main, phase branch strategy (gsd/phase-*)
provides:
  - Installable pnpm workspace (packages/*, apps/*, tools/* globs)
  - Root manifest with pinned toolchain (pnpm@11.13.1, Node >=24 <25) and fan-out scripts
  - Exact-pinned devDependencies (no float): @changesets/cli 2.31.1, @changesets/changelog-github 0.7.0, prettier 3.9.5, typescript 5.9.3
  - Committed pnpm-lock.yaml (frozen-lockfile reproducible)
  - Changesets lockstep scaffold encoding D-06 (fixed group @lyra-ds/styles + @lyra-ds/react)
  - Placeholder package manifests for @lyra-ds/styles and @lyra-ds/react (0.0.0 private)
  - Strict shared tsconfig.base.json (no project references)
  - Repo hygiene: .npmrc, .nvmrc, .gitignore, prettier config
affects: [02-styles-package, 03-react-package, 05-ci-and-clean-clone, 06-docs-site, 07-release]

# Tech tracking
tech-stack:
  added:
    - "@changesets/cli 2.31.1"
    - "@changesets/changelog-github 0.7.0"
    - "prettier 3.9.5"
    - "typescript 5.9.3"
  patterns:
    - "Exact version pinning (no ^/~) enforced by .npmrc save-exact=true + explicit manifest pins"
    - "Root fan-out scripts via pnpm -r --if-present run <name> (reserved CI contexts, real gates land Phases 2-4)"
    - "Changesets fixed group requires matching workspace stubs — placeholder manifests are load-bearing"
    - "engine-strict=true fails fast on Node/pnpm version mismatch for clean-clone contributors"

key-files:
  created:
    - pnpm-workspace.yaml
    - package.json
    - pnpm-lock.yaml
    - tsconfig.base.json
    - .npmrc
    - .nvmrc
    - .prettierrc.json
    - .prettierignore
    - .changeset/config.json
    - .changeset/README.md
    - packages/styles/package.json
    - packages/react/package.json
  modified:
    - .gitignore

key-decisions:
  - "Node engines narrowed to >=24 <25 (not bare >=24) so engine-strict fails fast on untested majors (round-1 review fix)"
  - "Added save-exact=true to .npmrc to reinforce the no-floating-versions prohibition for future pnpm add commands"
  - "TypeScript pinned to 5.9.3 — registry latest 7.0.2 is the tsgo compiler line, a different compiler (CLAUDE.md lock)"
  - "Placeholder stubs carry exactly four keys (name, version, private, description) — zero packaging metadata until Phases 2-3"

patterns-established:
  - "Pattern 1: changesets fixed group validation requires matching workspace package stubs (verified — status exits 0)"
  - "Pattern 2: pnpm self-managed version switching honors the packageManager pin from inside the project (11.13.0 -> 11.13.1)"

requirements-completed: [OSS-03, OSS-05]

coverage:
  - id: D1
    description: "pnpm workspace installs reproducibly from committed lockfile (pnpm install --frozen-lockfile exits 0)"
    requirement: "OSS-03"
    verification:
      - kind: integration
        ref: "pnpm install --frozen-lockfile (repo root)"
        status: pass
    human_judgment: false
  - id: D2
    description: "devDependencies are exact pins with no range prefix (@changesets/cli 2.31.1, @changesets/changelog-github 0.7.0, prettier 3.9.5, typescript 5.9.3)"
    requirement: "OSS-03"
    verification:
      - kind: automated_ui
        ref: "node -e pin-prefix check (Task 2 verify)"
        status: pass
      - kind: integration
        ref: "pnpm exec tsc --version == Version 5.9.3"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pinned pnpm runtime matches packageManager field (pnpm --version == 11.13.1)"
    requirement: "OSS-03"
    verification:
      - kind: integration
        ref: "pnpm --version | grep -qx '11.13.1'"
        status: pass
    human_judgment: false
  - id: D4
    description: "Changesets lockstep fixed group validates (D-06): pnpm exec changeset status exits 0 with @lyra-ds/styles + @lyra-ds/react in one group"
    requirement: "OSS-05"
    verification:
      - kind: integration
        ref: "pnpm exec changeset status (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Placeholder package stubs are four-keys-only (name, version 0.0.0, private true, description)"
    requirement: "OSS-05"
    verification:
      - kind: automated_ui
        ref: "node -e stub-shape check (Task 3 verify)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Root fan-out scripts (build, test, typecheck) exit 0 as reserved CI contexts; scoped prettier --check passes on this plan's own files"
    requirement: "OSS-03"
    verification:
      - kind: integration
        ref: "pnpm run build && pnpm run test && pnpm run typecheck && pnpm exec prettier --check <scoped files>"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min active
completed: 2026-07-17
status: complete
---

# Phase 1 Plan 02: Monorepo Workspace Scaffold Summary

**Installable pnpm workspace with pinned toolchain (pnpm@11.13.1, TS 5.9.3, prettier 3.9.5, changesets 2.31.1), committed frozen lockfile, changesets lockstep scaffold (D-06), and @lyra-ds/styles + @lyra-ds/react placeholder stubs.**

## Performance

- **Duration:** ~15 min active execution (continuation agent, post-checkpoint)
- **Started:** 2026-07-17T16:53:05Z
- **Completed:** 2026-07-17T19:46:23Z
- **Tasks:** 2 executed (Task 2, Task 3); Task 1 resolved via approved blocking-human checkpoint
- **Files modified:** 13 (12 created, 1 modified)

## Accomplishments
- Root workspace substrate: `pnpm-workspace.yaml` (packages/*, apps/*, tools/*), root `package.json` with exact-pinned toolchain and fan-out scripts, committed reproducible `pnpm-lock.yaml`
- Toolchain pins with zero float — verified `tsc --version` == 5.9.3 (not the 7.x tsgo line) and `pnpm --version` == 11.13.1 after the `packageManager` pin landed
- Changesets lockstep scaffold encoding D-06: `fixed: [["@lyra-ds/styles", "@lyra-ds/react"]]` with `@changesets/changelog-github` → `lyra-ds/lyra`; `changeset status` exits 0
- Placeholder package manifests (four-keys-only) that make the fixed group validate without carrying any premature packaging metadata
- Strict shared `tsconfig.base.json` (no project references) and repo hygiene files (`.npmrc` engine-strict, `.nvmrc` 24, `.gitignore` append, prettier config scoped to exclude handoff/.planning/.claude)

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy verification** - no commit (verify-only gate; resolved via approved blocking-human checkpoint before this agent resumed)
2. **Task 2: Root workspace config, toolchain pins, hygiene files** - `6ea238b` (chore)
3. **Task 3: Placeholder package stubs + changesets lockstep config (D-06)** - `0e59fff` (feat)

_Task 1 was a verification-only supply-chain gate — the four [SUS: too-new] flagged packages (@changesets/cli, @changesets/changelog-github, prettier, typescript) were confirmed canonical and registry-present, and the user approved. No files, no commit._

## Files Created/Modified
- `pnpm-workspace.yaml` - Workspace globs (packages/*, apps/*, tools/*)
- `package.json` - Root manifest: private, packageManager pnpm@11.13.1, engines node >=24 <25, fan-out scripts, exact-pinned devDependencies
- `pnpm-lock.yaml` - Committed lockfile (frozen-lockfile reproducible; picks up 2 workspace packages)
- `tsconfig.base.json` - Strict shared TS base, no project references
- `.npmrc` - engine-strict=true, save-exact=true
- `.nvmrc` - 24
- `.gitignore` - Preserved existing line; appended node_modules/, dist/, *.tsbuildinfo, .env*
- `.prettierrc.json` - printWidth 100, singleQuote, semi, trailingComma all
- `.prettierignore` - Excludes handoff/, .planning/, .claude/, pnpm-lock.yaml, CHANGELOG.md, .changeset/*.md
- `.changeset/config.json` - Lockstep fixed group (D-06), changelog-github, access public, baseBranch main
- `.changeset/README.md` - Default changesets README (from init)
- `packages/styles/package.json` - Placeholder @lyra-ds/styles 0.0.0 private (four keys)
- `packages/react/package.json` - Placeholder @lyra-ds/react 0.0.0 private (four keys)

## Decisions Made
- **Node engines `>=24 <25`** (not bare `>=24`) — Node 24 LTS is the supported line; engine-strict should fail fast on untested majors (round-1 review fix, carried from plan).
- **`save-exact=true` in `.npmrc`** beyond the plan's `engine-strict=true` anchor — reinforces the no-floating-versions prohibition so any future `pnpm add` also produces exact pins. Belt-and-suspenders with the explicit manifest pins.
- **Manifest-first install** — wrote exact devDependency versions into `package.json`, then `pnpm install` to generate the lockfile (deterministically identical to `pnpm add -E` with the exact pins). Reproducibility then re-verified with `--frozen-lockfile`.
- **pnpm version switching** — the machine ran 11.13.0 pre-scaffold; once the `packageManager: "pnpm@11.13.1"` field existed, pnpm self-managed the switch to 11.13.1 from inside the project (also `corepack prepare pnpm@11.13.1 --activate` as belt-and-suspenders). Assert confirmed 11.13.1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Formatted pnpm-workspace.yaml to prettier style**
- **Found during:** Task 3 (scoped `prettier --check` verification)
- **Issue:** `pnpm-workspace.yaml` (created in Task 2 with double-quoted globs) failed the Task 3 scoped `prettier --check` because `.prettierrc.json` sets `singleQuote: true`.
- **Fix:** Ran `prettier --write pnpm-workspace.yaml` only (single file — did NOT run whole-tree prettier, which is plan 01-05's job). Globs now single-quoted; the `packages/*` glob string is still present so the must_haves `contains` assertion holds.
- **Files modified:** pnpm-workspace.yaml
- **Verification:** Task 3 scoped `prettier --check` now passes ("All matched files use Prettier code style!").
- **Committed in:** `0e59fff` (Task 3 commit)

**2. [Rule 2 - Missing hardening] Added save-exact=true to .npmrc**
- **Found during:** Task 2 (root config authoring)
- **Issue:** The plan's `.npmrc` anchor only specifies `engine-strict=true`; a bare install policy would let a future `pnpm add` reintroduce caret ranges, contradicting the no-float prohibition (T-1-04, T-1-09).
- **Fix:** Added `save-exact=true` so future adds are exact by default. Existing pins were already exact.
- **Files modified:** .npmrc
- **Verification:** Task 2 `node -e` pin-prefix check exits 0 (all four devDependencies exact, no ^/~).
- **Committed in:** `6ea238b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking-verify formatting, 1 supply-chain hardening)
**Impact on plan:** Both minor and in-scope. No architectural change, no scope creep, all three prohibitions (four-keys-only stubs, no floating versions, no Tailwind) hold.

## Issues Encountered
- **pnpm version pre-scaffold was 11.13.0, pinned target 11.13.1.** Resolved cleanly: pnpm honored the `packageManager` pin from inside the project (corepack `prepare --activate` used as belt-and-suspenders). `pnpm --version` asserted `11.13.1`. Not a real blocker — the pin worked as designed.

## User Setup Required
None - no external service configuration required. (Task 1's package-legitimacy checkpoint was the only human touchpoint, already resolved with "approved".)

## Next Phase Readiness
- Clean-clone proof (phase success criterion 5) is locally true: `pnpm install --frozen-lockfile`, all four root scripts, and `pnpm exec changeset status` all exit 0. The formal clean-clone run belongs to plan 01-05.
- `@lyra-ds/styles` (Phase 2) and `@lyra-ds/react` (Phase 3) placeholder manifests are in place — those phases fill in exports/sideEffects/files packaging metadata. Reminder: never set `sideEffects: false` on the styles package.
- `tsconfig.base.json` ready for packages to extend from Phase 2+.
- Remaining wave-2/3 plans (01-03 governance docs, 01-04, 01-05 CI + clean-clone) may write files in parallel; whole-tree lint reconciliation is 01-05's job.

## Self-Check: PASSED

All 14 claimed files exist on disk; both task commits (`6ea238b`, `0e59fff`) are present in git history.

---
*Phase: 01-monorepo-foundation-governance*
*Completed: 2026-07-17*
