---
phase: 03-react-infrastructure-pilot-components
plan: 08
subsystem: infra
tags: [tsup, publint, attw, size-limit, changesets, ci, react, packaging]

# Dependency graph
requires:
  - phase: 03-01
    provides: package.json exports map, tsup config (per-component entries, use-client banner), react eslint flat config, root barrel stub
  - phase: 03-03
    provides: committed 70-icon registry + tools/icon-registry/generate.mjs --check drift guard
  - phase: 03-05
    provides: Button pilot (simple-component test template)
  - phase: 03-06
    provides: Input pilot (form/controlled template + D-14 native-onChange composition lesson)
  - phase: 03-07
    provides: Dialog pilot (overlay/focus/portal template) and Icon pilot (registry template)
provides:
  - Final src/index.ts root barrel (named exports of Button/Input/Dialog/Icon + Props + IconName)
  - Calibrated size-limit per-minimal-import budgets (Button 300 B, Icon 7.5 kB)
  - packages/react/CONVENTIONS.md (Phase 4 conversion recipe + locked-decision table + pilot-test map)
  - .changeset/phase-03-react-pilots.md (minor, lockstep pair)
  - CONTRIBUTING.md link to the conventions note
  - Phase 3 CI gates as steps inside the four frozen jobs (eslint, icon-registry --check, publint, attw, size-limit, dist directive + no-CDN scans)
  - tools/dist-scan/{assert-use-client,no-cdn-scan}.mjs (shared scan scripts; no-cdn constants are the 03-09 source of truth)
affects: [03-09, phase-04-component-conversion, phase-07-release]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic no-CDN scan: fail on known CDN hosts + lucide-static + any non-allowlisted https?:// literal; allowlist = http://www.w3.org/ and https://react.dev/ prefixes"
    - "Shared scan constants factored into one script invoked by both 03-08 dist scan and 03-09 fixture scan (byte-identical by construction)"
    - "attw --profile node16 fallback when node10 ALONE flags legacy subpath resolution"
    - "size-limit per-minimal-import budgets with lucide-react measured (never ignored) as the machine proof of isolation + containment"

key-files:
  created:
    - packages/react/CONVENTIONS.md
    - .changeset/phase-03-react-pilots.md
    - tools/dist-scan/no-cdn-scan.mjs
    - tools/dist-scan/assert-use-client.mjs
  modified:
    - packages/react/src/index.ts
    - packages/react/package.json
    - CONTRIBUTING.md
    - .github/workflows/ci.yml

key-decisions:
  - "attw runs on --profile node16 in CI: node10 is the ONLY column that flags (legacy moduleResolution cannot resolve exports-map subpaths); node16 + bundler all green"
  - "size-limit budgets: Button 249 B measured -> 300 B (+20%); Icon 5.95 kB measured -> 7.5 kB; Button is 25x below Icon (isolation), Icon is ~85x below the full ~1,400-icon set (containment)"
  - "no-CDN scan is semantic (host+package+URL-allowlist), not protocol-blind; constants live in one shared script so the 03-09 fixture scan stays byte-identical"

patterns-established:
  - "Pattern: Phase 4 component conversion recipe lives in CONVENTIONS.md as an actionable checklist mapping component type -> pilot test suite to copy (no dead template file)"
  - "Pattern: all quality gates are steps inside the four frozen CI jobs (lint/typecheck/test/build), never new job names"

requirements-completed: [RCT-03, RCT-04, RCT-05]

coverage:
  - id: D1
    description: "Root barrel finalized; dual ESM+CJS build green (5 entries x 4 formats, zero chunk files, use-client directive on every js/cjs) validated by publint + attw"
    requirement: "RCT-04"
    verification:
      - kind: automated
        ref: "pnpm --filter @lyra-ds/react run build && pnpm exec publint packages/react && attw --pack . --profile node16"
        status: pass
      - kind: automated
        ref: "node tools/dist-scan/assert-use-client.mjs packages/react/dist"
        status: pass
    human_judgment: false
  - id: D2
    description: "size-limit per-minimal-import budgets calibrated and green; Button proves isolation (RCT-03), Icon proves registry containment (RCT-05)"
    requirement: "RCT-03"
    verification:
      - kind: automated
        ref: "pnpm --filter @lyra-ds/react exec size-limit"
        status: pass
    human_judgment: false
  - id: D3
    description: "Icon registry containment + no-CDN enforcement: 70-icon registry measured under budget; semantic no-CDN scan over dist finds zero CDN hosts / lucide-static / non-allowlisted URLs"
    requirement: "RCT-05"
    verification:
      - kind: automated
        ref: "node tools/dist-scan/no-cdn-scan.mjs packages/react/dist; node tools/icon-registry/generate.mjs --check"
        status: pass
    human_judgment: false
  - id: D4
    description: "CONVENTIONS.md conversion recipe + locked-decision table + pilot-test map written and linked from CONTRIBUTING; phase changeset created"
    verification:
      - kind: automated
        ref: "grep CONVENTIONS.md CONTRIBUTING.md; pnpm changeset status"
        status: pass
    human_judgment: true
    rationale: "Whether the Phase 4 recipe is actually usable as a conversion guide is a human editorial judgment; the automated checks only confirm existence + linkage."
  - id: D5
    description: "All Phase 3 gates wired as steps inside the four frozen CI jobs (no new job names); actionlint clean"
    requirement: "RCT-03"
    verification:
      - kind: automated
        ref: "four-job contract assertion (node) + actionlint .github/workflows/ci.yml"
        status: pass
    human_judgment: false

# Metrics
duration: 30min
completed: 2026-07-19
status: complete
---

# Phase 3 Plan 08: Package Assembly & Gate Wiring Summary

**RCT-03/04/05 became machine-enforced: green dual-format build (publint + attw), calibrated size-limit budgets that measure lucide-react, a semantic no-CDN dist scan, and the Phase 4 conversion recipe — all wired as steps inside the four frozen CI jobs.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-07-19
- **Tasks:** 3 of 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- Finalized `src/index.ts` as the named-only root barrel; proved the dual ESM+CJS build emits exactly 5 entries × {js,cjs,d.ts,d.cts} with **zero chunk files** and the `"use client"` directive on every js/cjs, validated by publint (clean) and attw.
- Calibrated the two size-limit budgets against real measurements — Button **249 B → 300 B**, Icon **5.95 kB → 7.5 kB** — with `lucide-react` deliberately measured (never ignored): Button is 25× below Icon (RCT-03 isolation) and Icon is ~85× below the full-icon-set cost (RCT-05 containment).
- Wrote `packages/react/CONVENTIONS.md` (the Phase 4 recipe), created the phase changeset, linked the note from CONTRIBUTING, and wired every Phase 3 gate as a step inside the frozen `lint`/`typecheck`/`test`/`build` jobs — including two shared dist scans (directive + semantic no-CDN).

## Task Commits

1. **Task 1: Finalize the barrel + prove build/publint/attw** - `70ccf4e` (feat)
2. **Task 2: Calibrate size-limit budgets** - `2fa3645` (feat)
3. **Task 3: CONVENTIONS.md + changeset + CI gates** - `61adab2` (feat)

## Files Created/Modified

- `packages/react/src/index.ts` - Final root barrel: named re-exports of Button/Input/Dialog/Icon + Props types + IconName (D-12/D-13)
- `packages/react/package.json` - `size-limit` config block (Button + Icon entries, calibrated limits)
- `packages/react/CONVENTIONS.md` - D-24 conversion checklist, locked-decision table (D-08..D-22), D-25 component-type→pilot-test map, deviations/extensions section, icon-only aria-label + no-raw-HTML rules, React 18 pre-publish note
- `CONTRIBUTING.md` - New "React component conventions" section linking CONVENTIONS.md (D-23)
- `.changeset/phase-03-react-pilots.md` - minor bump for the lockstep pair (@lyra-ds/react + @lyra-ds/styles)
- `.github/workflows/ci.yml` - Phase 3 gate steps inside the four frozen jobs
- `tools/dist-scan/no-cdn-scan.mjs` - Semantic no-CDN scan; single source of truth for CDN-host list + URL allowlist (shared byte-identically with the 03-09 fixture scan)
- `tools/dist-scan/assert-use-client.mjs` - Asserts the RSC directive survived to every dist js/cjs

## Decisions Made

- **attw runs on `--profile node16` in CI.** The default profile flags `node10: 💀 Resolution failed` on all four subpath exports (`./button`, `./input`, `./dialog`, `./icon`) because legacy `moduleResolution: node` cannot resolve exports-map subpaths — the root `.` entry passes node10. node16 (from CJS + from ESM) and bundler are 🟢 on every entry; the root also passes node10. Per RESEARCH A3 this is the sanctioned fallback: node10 is the ONLY flagging column, node16 is the correct target for a 2026 library, and the fallback masks no other problem kind. Rationale is written in the CI step comment where the fallback lands.

  **Captured default-profile failure output:**
  ```
  "@lyra-ds/react"          node10: 🟢   node16(CJS): 🟢   node16(ESM): 🟢   bundler: 🟢
  "@lyra-ds/react/button"   node10: 💀   node16(CJS): 🟢   node16(ESM): 🟢   bundler: 🟢
  "@lyra-ds/react/input"    node10: 💀   node16(CJS): 🟢   node16(ESM): 🟢   bundler: 🟢
  "@lyra-ds/react/dialog"   node10: 💀   node16(CJS): 🟢   node16(ESM): 🟢   bundler: 🟢
  "@lyra-ds/react/icon"     node10: 💀   node16(CJS): 🟢   node16(ESM): 🟢   bundler: 🟢
  ```

- **size-limit budgets (measured + ~20%, per D-07):**
  | Entry | Measured (min+brotli) | Limit | Headroom | ignore |
  |-------|-----------------------|-------|----------|--------|
  | `{ Button }` (dist/button.js) | 249 B | 300 B | +20% | react, react-dom |
  | `{ Icon }` (dist/icon.js, 70-icon registry) | 5.95 kB | 7.5 kB | +26% | react, react-dom |

  `lucide-react` is deliberately absent from both ignore lists — its absence from the Button measurement is the RCT-03 isolation proof, its presence in the Icon measurement is the RCT-05 containment proof. Button (300 B) is 25× below Icon (7.5 kB); a regression to full-barrel icon bundling (hundreds of kB) would overshoot the Icon budget by >10× and fail.

- **no-CDN scan is semantic, not protocol-blind.** Fails on any known CDN host (unpkg.com, cdn.jsdelivr.net, cdnjs.cloudflare.com, esm.sh, skypack.dev), on `lucide-static`, and on any other `https?://` literal not matching the two allowlisted prefixes (`http://www.w3.org/` for Lucide's SVG namespace, `https://react.dev/` for react-dom's error-decoder strings). @lyra-ds/react's own dist contains **zero** URL literals (react + lucide-react are external), so the allowlist matches nothing here — it exists so the constants stay byte-identical with the 03-09 fixture scan, which bundles react-dom and will contain the react.dev literal. Verified discriminating: a synthetic fixture with an unpkg URL + lucide-static + a non-allowlisted URL fails with all three violations; an allowlisted-only fixture passes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] package.json not prettier-clean after the Task 2 commit**
- **Found during:** Task 3 (running `prettier --check` before CI would have)
- **Issue:** The `size-limit` block committed in Task 2 (`2fa3645`) used inline `ignore` arrays; `prettier --check .` (the CI `lint` job) requires multi-line arrays, so the committed file would have failed CI.
- **Fix:** Ran `prettier --write` on `packages/react/package.json` (and `CONVENTIONS.md`); re-verified `size-limit` still passes after reformat.
- **Files modified:** packages/react/package.json, packages/react/CONVENTIONS.md
- **Verification:** `prettier --check` clean; `size-limit` exit 0
- **Committed in:** `61adab2` (part of Task 3 commit)

**2. [Rule 3 - Blocking] attw default profile fails (node10-only)**
- **Found during:** Task 1
- **Issue:** `attw --pack .` on the default profile exits non-zero because node10 cannot resolve the subpath exports.
- **Fix:** Adopted `--profile node16` per RESEARCH A3 (documented above and in the CI step comment); this is the plan's own contingency, not unplanned scope.
- **Verification:** `attw --pack . --profile node16` exits 0
- **Committed in:** `70ccf4e` / `61adab2`

---

**Total deviations:** 2 auto-fixed (both Rule 3 blocking).
**Impact on plan:** Both are anticipated contingencies (attw fallback is in the plan; the prettier fix prevents a CI failure). No scope creep.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all deliverables are complete and machine-verified.

## Threat Flags

None - no new security surface beyond the plan's `<threat_model>` (T-03-14/15/16 are all mitigated by the size-limit measurement, frozen-job steps + actionlint, and the no-CDN scan respectively).

## Self-Check: PASSED

All created files exist on disk; all three task commits (70ccf4e, 2fa3645, 61adab2) are in git history.
