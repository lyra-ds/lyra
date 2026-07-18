# Phase 02 — Deferred Items

Out-of-scope discoveries logged during execution (not fixed in the discovering plan).

## Pre-existing: root `prettier --check .` (`lint` CI job) is red

- **Discovered during:** plan 02-06 (CI integration), Task 1.
- **Symptom:** `pnpm run lint` (`prettier --check .`) exits non-zero with 18 warnings.
- **Files (all committed by plans 02-01..02-05, NOT modified by 02-06):**
  - `packages/styles/**/*.css` (15 files — tokens + components + entry + compat) — intentionally handoff-verbatim, must NOT be prettier-formatted (locked decision: "CSS files stay handoff-verbatim; stylelint gates CSS, prettier gates JSON/MD").
  - `tools/parity/parity.mjs`, `tools/parity/fixtures/data-uri.css`, `tools/parity/fixtures/keyframes.css`.
- **Root cause:** `.prettierignore` does not exclude `packages/styles/**/*.css` (or the `tools/parity` CSS fixtures / script), so the Phase-1 `prettier --check` gate flags files that the locked decision says prettier should not own.
- **Why deferred (scope boundary):** 02-06 wires the Phase-2 quality gates (stylelint, parity, publint, Browser Mode test, pack-smoke). The prettier `lint` gate is a Phase-1 contract; these warnings pre-date this plan and live in unrelated files. Fixing `.prettierignore` touches a Phase-1 tooling decision and is out of this plan's scope.
- **Suggested fix (future plan):** add `packages/styles/**/*.css` to `.prettierignore` (aligns with the locked "CSS stays handoff-verbatim" decision), and decide whether `tools/parity` CSS fixtures / `.mjs` should be prettier-formatted or ignored. All 02-06-authored files (`tools/pack-smoke/**`, `package.json`, `.github/workflows/ci.yml`) already pass `prettier --check`.
