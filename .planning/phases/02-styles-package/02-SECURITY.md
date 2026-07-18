---
phase: 02
slug: styles-package
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on (high) severity
threats_open: 0
asvs_level: 1
created: 2026-07-18
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Framing: `@lyra-ds/styles` is a pure-CSS, no-build published package. There is no runtime
> JavaScript in the shipped artifact, no network I/O, and no user-input handling — so the
> threat surface is packaging / supply-chain integrity plus the no-runtime-CDN constraint.
> The only executable code authored this phase is dev-time tooling (parity.mjs, pack-smoke.mjs,
> the Vitest Browser Mode test), which never enters the published `files` allowlist.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| package → consumer runtime | shipped CSS loads in every consumer's browser; a stray CDN `@import`/`url()` would create a third-party runtime dependency (availability + supply-chain risk) | CSS (no PII) |
| handoff/ (canonical) → package (candidate) | the copy must stay byte-faithful; the parity validator is the integrity check | token values + `.lyra-*` class surface |
| package manifest → consumer bundler | `sideEffects` + `exports` + `files` decide what ships and whether the CSS import survives tree-shaking | package metadata |
| npm registry → dev toolchain / CI | new devDependencies pulled at install; a typosquat/compromised package could run install-time code | dev-only packages (not shipped) |
| CI workflow → required-status-check ruleset | job names are ruleset contexts; renaming/adding a job orphans the Phase-1 branch-protection contract | CI config |
| packed tarball → consumer install | `files` allowlist + relative CSS imports can pass in-workspace yet break post-publish | published tarball surface |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-CDN | Denial/Info-disclosure | tokens/fonts.css | high | mitigate | fonts.css shipped as token-free peer stub, no `@import url(...)`; `grep -c '@import url' = 0`; parity no-CDN guard (url() **and** `@import`) green in CI | closed |
| T-02-VAL | Tampering | tokens/*.css values | medium | mitigate | parity.mjs placement-aware declaration diff vs handoff/ — `209 tokens` match, green in CI | closed |
| T-02-CLS | Tampering | components/**/*.css `.lyra-*` names | medium | mitigate | parity.mjs class inventory — `248` unique classes match handoff, fails on any add/drop/rename | closed |
| T-02-ICON | Denial/Info-disclosure | forms/display/navigation mask icons | high | mitigate | 3 `unpkg.com` chevron masks rewritten to inline `data:` SVG; `grep -rnE "url\(\s*['\"]?https?://" = none`; parity allowlist pins exact canonical payloads; both distinct payloads decode-proved in Browser Mode | closed |
| T-02-SE | Tampering | package.json `sideEffects` | high | mitigate | exact `["**/*.css"]` (asserted); publint "All good!" green in build job | closed |
| T-02-FILES | Info-disclosure/Integrity | package.json `files` | high | mitigate | explicit allowlist `[styles.css, tokens, components, compat-shadcn.css, README.md, LICENSE]`; pack-smoke asserts tarball surface — no handoff/scratch leakage | closed |
| T-02-COMPAT | Tampering | styles.css / exports | medium | mitigate | `grep -c compat styles.css = 0` (never in entry) AND `./compat-shadcn.css` is a standalone opt-in export (STY-05) | closed |
| T-02-EXPORTS | Tampering | exports map | medium | mitigate | 4-key map `[., ./styles.css, ./tokens/*, ./compat-shadcn.css]`, no `/components/` subpath leaked; publint green + pack-smoke resolves entry + token subpath from a real vite build | closed |
| T-02-SC | Tampering | npm devDep installs (stylelint, vitest, playwright, publint, vite) | high | mitigate | blocking human legitimacy checkpoint cleared all 7 on npmjs.com; pinned + `save-exact`; dev-only — styles package ships zero deps/devDeps; invoked via `pnpm exec` not `dlx`/`npx` | closed |
| T-02-PARITY | Tampering | copy-verify integrity | high | mitigate | parity.mjs runs on every PR (test job); placement + at-rule ancestry + external-URL guard; fails on any unlisted drift/relocation | closed |
| T-02-BRAND | Repudiation/Integrity | STY-04 color-mix contract | medium | mitigate | real-browser (chromium) canvas pixel-readback assertion across 4 theme×brand permutations — 10/10 tests; catches silently-broken derivation jsdom/parity cannot see | closed |
| T-02-JOBS | Tampering | ci.yml frozen jobs | high | mitigate | exactly 4 jobs (lint/typecheck/test/build) — gates added as STEPS only; actionlint validates the workflow | closed |
| T-02-ORDER | Denial | fresh CI runner | high | mitigate | `playwright install chromium --with-deps` (ci.yml:74) ordered BEFORE `pnpm run test` (:75) so a clean runner cannot fail on a missing browser | closed |
| T-02-PACK | Info-disclosure/Integrity | packed tarball surface | medium | mitigate | pack-smoke asserts tarball file allowlist (incl. LICENSE) + resolves entry and a token subpath from a real `vite@8.1.5` consumer install (STY-01/STY-02) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `high` count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks — every threat was mitigated in implementation.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-18 | 14 | 14 | 0 | /gsd-secure-phase (L1 grep-depth; register authored at plan time, ASVS L1 short-circuit) |

Evidence corroborated by the independent phase verifier (02-VERIFICATION.md), which re-ran all six
quality gates green (parity, stylelint, prettier, Browser Mode 10/10, publint, pack-smoke), and by
the code-review fix pass (02-REVIEW-FIX.md), which hardened the no-CDN guard (`@import` string form),
the color-mix test's unresolved-value backstop, and the chevron-mask decode proofs.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (none)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-18
