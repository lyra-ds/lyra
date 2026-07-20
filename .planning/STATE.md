---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 4
current_phase_name: Component Batch Conversion & A11y
status: "Phase 3 shipped — PR #3"
stopped_at: Completed 03-09-PLAN.md
last_updated: "2026-07-20T22:14:12.450Z"
last_activity: 2026-07-20
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 20
  completed_plans: 20
last_activity_desc: Phase 03 complete, transitioned to Phase 4
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-16)

**Core value:** Qualquer desenvolvedor consegue instalar `@lyra-ds/styles` + `@lyra-ds/react` e ter uma UI pixel-perfect, tematizável (light/dark + white-label em 4 tokens), com o mesmo CSS core reutilizável em outros frameworks.
**Current focus:** Phase 03 — react-infrastructure-pilot-components

## Current Position

Phase: 4 — Component Batch Conversion & A11y
Plan: Not started
Status: Phase 3 shipped — PR #3
Last activity: 2026-07-20

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 20
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 6 | - | - |
| 03 | 9 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P02 | 15min | 2 tasks | 13 files |
| Phase 01 P03 | ~15m | 3 tasks | 7 files |
| Phase 01 P04 | 6min | 2 tasks | 6 files |
| Phase 01 P05 | 76min | 3 tasks | 7 files |
| Phase 02 P01 | 2min | 2 tasks | 7 files |
| Phase 02 P02 | 5min | 2 tasks | 7 files |
| Phase 02 P03 | 8min | 2 tasks | 4 files |
| Phase 02 P04 | 35min | 3 tasks | 8 files |
| Phase 02 P05 | 7min | 2 tasks | 6 files |
| Phase 02 P06 | 20min | 2 tasks | 8 files |
| Phase 03 P01 | 13min | 2 tasks | 15 files |
| Phase 03 P02 | 6min | 2 tasks | 2 files |
| Phase 03 P03 | 15min | 2 tasks | 4 files |
| Phase 03 P04 | 37min | 2 tasks | 7 files |
| Phase 03 P05 | 62min | 2 tasks | 10 files |
| Phase 03 P06 | 20min | 2 tasks | 4 files |
| Phase 03 P07 | 25min | 2 tasks | 4 files |
| Phase 03 P08 | 30min | 3 tasks | 8 files |
| Phase 03-react-infrastructure-pilot-components P09 | 45min | 3 tasks | 19 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 7-phase dependency-ordered structure per research (foundation → styles → react pilot → batch conversion → docgen → docs site → release)
- [Roadmap]: Parity/CI guards (token parity, publint/attw, size-limit) front-loaded into Phases 1-3, before mass conversion
- [Roadmap]: Docs stack = Next.js 16 + fumadocs-core headless (no fumadocs-ui); Astro Starlight is the fallback
- [Roadmap]: JSDoc language decision (EN canonical) locked into Phase 3 conventions, before docgen/docs consume it
- [Phase ?]: Plan 01-02: Node engines pinned >=24 <25 (not bare >=24) so engine-strict fails fast on untested Node majors
- [Phase ?]: Plan 01-02: .npmrc save-exact=true added to enforce no-floating-versions for future pnpm add (belt-and-suspenders with explicit manifest pins)
- [Phase ?]: Plan 01-05: changesets ignore private packages (privatePackages.version=false) so scaffold packages don't block the changeset gate until they go public
- [Phase ?]: Plan 01-05: main-protection ruleset now requires build,lint,test,typecheck; every change to main rides a PR with 4 green checks (D-07). OSS-03 recorded PARTIAL (base CI only; package gates in Phases 2-4)
- [Phase ?]: Plan 02-01: token comment policy — strip ALL inherited handoff comments (pt-BR prose + structural labels); keep exactly one EN banner per .css (fonts.css exempt as comment-only stub)
- [Phase ?]: Plan 02-01: fonts.css intentionally diverges from handoff — drops Google Fonts CDN @import, ships token-free @fontsource peer-install stub (T-02-CDN)
- [Phase ?]: Plan 02-02: component CSS comment policy enforced identically to 02-01 (one EN banner, no non-ASCII beyond line 1); the command-palette and pt-BR labels are stripped
- [Phase ?]: Plan 02-02: three unpkg.com chevron mask URLs rewritten to local inline data: SVG URIs with stroke=black keyword (no-runtime-CDN; avoids #-hex fragment truncation)
- [Phase ?]: compat-shadcn.css lives at package root for a cleaner ./compat-shadcn.css exports entry (D-02)
- [Phase ?]: @lyra-ds/styles CSS files stay handoff-verbatim (not prettier-formatted); stylelint gates CSS, prettier gates JSON/MD
- [Phase ?]: STY-06 parity uses a zero-dep Node tokenizer with placement/cascade-aware declaration diff + external-URL guard vs handoff/
- [Phase ?]: stylelint selector-class-pattern enforces .lyra-* namespace only; reformatting rules disabled to preserve locked handoff token values
- [Phase ?]: Plan 02-05: Browser Mode fixture loads entry CSS via import '../styles.css' (Vite injects @import graph) + in-test DOM injection; no testerHtmlPath
- [Phase ?]: Plan 02-05: colors read via 1x1 canvas getImageData (chromium serializes color-mix as oklab()); assertions verify ordered luminance direction + teal-family, mutation-proof
- [Phase ?]: Plan 02-05: chevron data: mask DECODE proof via new Image()+decode() on direct-mask .lyra-acc__chevron; Vitest __screenshots__/.vitest-attachments gitignored
- [Phase ?]: Plan 02-06: Phase-2 quality gates wired as STEPS in the four frozen CI jobs (never new jobs); tools via pnpm exec (publint@0.3.21, vite@8.1.5 pinned), chromium install ordered before root test
- [Phase ?]: Plan 02-06: packed-artifact smoke test bundles the pnpm-packed tarball through a real vite@8.1.5 consumer build (root + ./styles.css + ./tokens/* imports), asserting .lyra-btn + --accent in emitted CSS (STY-01/STY-02)
- [Phase ?]: Plan 03-01: RSC 'use client' directive emitted via tsup onSuccess post-write step — tsup 8.5.1 routes output through Rollup which strips directive prologues from banner/esbuildOptions/renderChunk/source alike; deterministic prepend is the only reliable mechanism
- [Phase ?]: Plan 03-01: onlyBuiltDependencies:[] in pnpm-workspace.yaml — no dependency runs install/postinstall scripts; esbuild binary ships via optional deps so its build script is unnecessary
- [Phase ?]: Plan 03-01: @lyra-ds/react exports-map subpath keys == tsup entry keys == dist basenames (D-13); lucide-react 1.25.0 is the sole runtime dep (D-11)
- [Phase ?]: Plan 03-02: additive Dialog CSS appended at EOF of feedback.css (never mid-file) so the parity diff stays index-aligned — extras land past handoff length as skippable no-counterpart records
- [Phase ?]: Plan 03-02: parity ADDITIVE_EXTENSIONS is exact-name enumeration (classes + keyframes, no wildcards) wired into classCheck + diffFile; EXPECTED_CLASSES 248 / EXPECTED_TOKENS 209 unchanged (handoff-side counts); negative-proof green (D-18/D-19, T-03-03)
- [Phase ?]: Prettier-ignore the generated icon-registry.ts + fixtures — --check owns their byte-exact format (D-02); prettier --write would break the drift guard
- [Phase ?]: Portal SSR guard uses useSyncExternalStore (not useState+useEffect) to satisfy react-hooks/set-state-in-effect (03-04)
- [Phase ?]: internal/ utilities live in src/internal/, excluded from exports map — private, consumed by pilots via relative imports (03-04)
- [Phase ?]: Plan 03-05: Button/Icon pilots lock the SIMPLE + REGISTRY conversion recipes; two reusable Phase-4 test templates (smoke matrix light/dark + axe per fixture, renderToString)
- [Phase ?]: Plan 03-05: eslint carve-out — test files (src/**/*.test.{ts,tsx}) exempt from the RCT-03 CSS-import ban so browser tests import @lyra-ds/styles in-test; shipped source stays banned
- [Phase ?]: Plan 03-05: frozen dark primary/danger AA contrast (4.39:1, indigo-500+white) logged to deferred-items.md — NOT fixed (locked Phase-2 tokens); smoke axe allows only that specific finding
- [Phase ?]: Input D-14 locked by composition: public onChange stays native ChangeEventHandler; useControllableState composed internally (no onValueChange prop)
- [Phase ?]: Input id = id prop ?? useId(); prototype's label-derived slug dropped (documented deviation — duplicate-id bug for same-labeled inputs)
- [Phase ?]: Dialog: inner Portal-child panel owns all DOM-dependent effects (initial focus + trap) so they never race the portal mount (Pitfall 8); outer forwardRef owns useId/usePresence/useScrollLock/restore
- [Phase ?]: Dialog focus restore keys on the controlled open prop flipping false (not on onClose request); opener captured in the panel mount effect before focus moves; panel tabIndex -1 unconditional (D-20 fallback + zero-candidate trap target)
- [Phase ?]: Dialog close glyph is a self-contained inline svg (no Icon import) so importing Dialog pulls no lucide-react; × renders only with onClose; jsx-a11y line-disabled with justification for the backdrop click + panel Esc keydown
- [Phase ?]: 03-08: attw runs on --profile node16 in CI (node10-only flags legacy subpath resolution; node16+bundler green)
- [Phase ?]: 03-08: size-limit budgets Button 300 B / Icon 7.5 kB, lucide-react measured (never ignored) as the RCT-03/RCT-05 machine proof
- [Phase ?]: 03-08: semantic no-CDN dist scan (host+lucide-static+URL allowlist) factored into a shared script for byte-identical reuse in 03-09

### Pending Todos

None yet.

### Blockers/Concerns

- REQUIREMENTS.md previously stated "31 total" v1 requirements; actual REQ-ID count is 40 (corrected in traceability)
- Phase 4 research flag: WAI-ARIA APG per-pattern specifics before batch conversion planning
- Phase 6 research flag: fumadocs-core headless without Tailwind at this fidelity has only one community example — scaffold docs framework early (after Phase 3) to de-risk
- Phase 7 research flag: re-check npm/cli#8976 (OIDC scoped-monorepo E404) at planning time
- Phase 7 dependency: GitHub org `lyra-ds` must be created manually by the user (guided)

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-20T20:31:10.389Z
Stopped at: Completed 03-09-PLAN.md
Resume file: None
