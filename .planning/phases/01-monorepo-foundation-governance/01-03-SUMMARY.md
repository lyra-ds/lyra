---
phase: 01-monorepo-foundation-governance
plan: 03
subsystem: platform-governance
tags: [oss, license, code-of-conduct, security, readme, versioning, i18n]
status: complete

requires:
  - phase: 01-01
    provides: "Recorded decisions — user-confirmed LICENSE copyright line (Francisross Soares de Oliveira) and public security contact (security@francisross.com.br); live private vulnerability reporting on lyra-ds/lyra"
provides:
  - "MIT LICENSE with the user-confirmed copyright line (OSS-02)"
  - "Contributor Covenant 3.0 Code of Conduct with filled reporting/enforcement sections (OSS-02)"
  - "SECURITY.md with live GitHub private-advisory URL + email fallback (mitigates T-1-10)"
  - "VERSIONING.md — the written 0.x policy: 0.MINOR = breaking, lockstep, four-part API surface (OSS-05)"
  - "CONTRIBUTING.md — setup, pre-1.0 changeset convention, locked decisions, dependency policy, conventional commits"
  - "README.md (EN canonical) carrying the OSS-01 pitch + pre-release warning (mitigates T-1-11)"
  - "README.pt-BR.md — valid UTF-8 1:1 pt-BR mirror, cross-linked (D-05)"
affects:
  - "plan 01-04 (issue/PR templates complete the OSS-02 governance surface)"
  - "plan 01-05 (CI badge in README turns green once the scaffold PR merges; adds required checks)"

tech-stack:
  added: []
  patterns:
    - "Canonical external texts copied verbatim (MIT, Contributor Covenant 3.0) — never paraphrased; only sanctioned customization points filled"
    - "Only README is mirrored to pt-BR; all other governance docs are EN-only (D-04/D-05)"

key-files:
  created:
    - LICENSE
    - CODE_OF_CONDUCT.md
    - SECURITY.md
    - CONTRIBUTING.md
    - VERSIONING.md
    - README.md
    - README.pt-BR.md
  modified: []

key-decisions:
  - "LICENSE copyright line and CoC/SECURITY contact consumed verbatim from 01-01-SUMMARY Recorded decisions — not re-inferred (Francisross, security@francisross.com.br)"
  - "Contributor Covenant 3.0 (not 2.1); both [NOTE] customization markers filled and the TOML frontmatter stripped so zero bracketed placeholders survive"
  - "MIT LICENSE uses the standard GitHub ~70-col wrap; diff vs SPDX text is word-identical (differs only in line wrapping, which the acceptance criterion permits)"
  - "VERSIONING.md phrases export paths generically (documented public export paths) — no premature per-component deep-export promise (Phase 3 owns the exports map)"

patterns-established:
  - "Governance docs are emoji-free (Lyra voice); org-profile emoji bullets were dropped when adapting the README pitch"

requirements-completed: [OSS-01, OSS-02, OSS-05]

coverage:
  - id: D1
    description: "MIT LICENSE with user-confirmed copyright line, all three canonical paragraphs, zero bracketed fields"
    requirement: "OSS-02"
    verification:
      - kind: automated
        ref: "grep three MIT paragraphs + copyright line + no [INSERT/year/fullname/email brackets"
        status: pass
    human_judgment: false
  - id: D2
    description: "Contributor Covenant 3.0 with filled reporting channel and solo-maintainer enforcement role (7-day ack), no surviving [NOTE] markers"
    requirement: "OSS-02"
    verification:
      - kind: automated
        ref: "grep Contributor Covenant + 3.0 + Our Pledge + Enforcement + email; grep -Fc '[NOTE' == 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "SECURITY.md with live private-advisory URL and email fallback"
    requirement: "OSS-02"
    verification:
      - kind: automated
        ref: "grep security/advisories/new + security@francisross.com.br"
        status: pass
    human_judgment: false
  - id: D4
    description: "VERSIONING.md declares 0.MINOR = breaking, lockstep, and the four-part public API surface"
    requirement: "OSS-05"
    verification:
      - kind: automated
        ref: "grep 0.MINOR + .lyra- + token + lockstep + both package names + major reserved for 1.0"
        status: pass
    human_judgment: false
  - id: D5
    description: "CONTRIBUTING.md — Node 24/pnpm setup, pre-1.0 changeset convention linking VERSIONING.md, Locked decisions, dependency policy, conventional commits"
    requirement: "OSS-02"
    verification:
      - kind: automated
        ref: "grep Locked decisions heading + tailwind + VERSIONING.md link + pnpm install + Node 24"
        status: pass
    human_judgment: false
  - id: D6
    description: "README.md (EN) — CSS-first pitch, white-label 4-token story, adapter/registry roadmap, install, Button snippet, pre-release warning, cross-links"
    requirement: "OSS-01"
    verification:
      - kind: automated
        ref: "grep css-first + --brand + roadmap/registry + npm i cmd + <Button + pre-release + pt-BR link in first 5 lines + VERSIONING/CONTRIBUTING links"
        status: pass
    human_judgment: false
  - id: D7
    description: "README.pt-BR.md — valid UTF-8 1:1 pt-BR mirror cross-linking back to README.md"
    requirement: "OSS-01"
    verification:
      - kind: automated
        ref: "iconv -f UTF-8 -t UTF-8 exits 0; grep Instala + back-link README.md in first 5 lines"
        status: pass
    human_judgment: false

metrics:
  duration: "~15m"
  completed: 2026-07-17
---

# Phase 01 Plan 03: Governance & Policy Surface Summary

Authored the complete public governance surface in English (D-04) plus the pt-BR
README mirror (D-05): verbatim MIT LICENSE, Contributor Covenant 3.0, SECURITY.md,
CONTRIBUTING.md, the OSS-05 VERSIONING.md 0.x policy, and the README pair carrying
the OSS-01 pitch — all with filled fields, canonical texts, and cross-links.

## What was built

| File | Role | Notes |
|---|---|---|
| `LICENSE` | MIT | Copyright line = the exact 01-01 recorded value (`Francisross Soares de Oliveira and Lyra DS contributors`); GitHub-standard wrap for license detection |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 3.0 | Fetched canonical text; both `[NOTE]` customization points filled; solo-maintainer enforcement role with 7-day ack; TOML frontmatter stripped so no bracket survives |
| `SECURITY.md` | Vulnerability policy | Live `security/advisories/new` URL (PVR enabled in 01-01) + `security@francisross.com.br` fallback; 7-day response window; no-disclosure-before-fix |
| `VERSIONING.md` | OSS-05 0.x policy | 0.MINOR = breaking, lockstep, four-part API surface (props, `.lyra-*`, token names, documented export paths); `major` reserved for 1.0 |
| `CONTRIBUTING.md` | Contributor guide | Node 24/pnpm (corepack OR standalone), pre-1.0 changeset convention → VERSIONING.md, Locked decisions, dependency policy, conventional commits |
| `README.md` | EN landing (OSS-01) | Pitch + white-label-in-4-tokens + adapter/registry roadmap + install + `<Button>` snippet + pre-release warning; Português link in line 3 |
| `README.pt-BR.md` | pt-BR mirror (D-05) | Valid UTF-8; 1:1 translation; English back-link at top; the only mirrored governance file |

## Recorded-decision inputs consumed (from 01-01-SUMMARY)

The Task 1 STOP-if-missing guard was satisfied — both authoritative values were
present in 01-01-SUMMARY "Recorded decisions" and consumed **verbatim**, not
re-inferred:

- Copyright line: `Copyright (c) 2026 Francisross Soares de Oliveira and Lyra DS contributors` (legal first name **Francisross**, one word).
- Public security/enforcement contact: `security@francisross.com.br`.

## Verification results

All three task `<automated>` verify blocks **PASS**; all acceptance-criteria greps
returned their expected counts.

| Check | Result |
|---|---|
| MIT three canonical paragraphs + copyright line | 1 each; present |
| MIT diff vs SPDX (from operative text) | word-identical, differs only in line wrapping (permitted) |
| CoC: Contributor Covenant + 3.0 + Our Pledge + Enforcement + email | present |
| CoC: `[INSERT/year/fullname/email]` brackets / `[NOTE` markers | 0 / 0 |
| SECURITY.md: advisories URL + email | present |
| VERSIONING.md: 0.MINOR, `.lyra-`, token, lockstep, both packages, major→1.0 | all present |
| CONTRIBUTING.md: Locked decisions, no-Tailwind, VERSIONING link, pnpm install, Node 24 | all present |
| README.md: css-first, `--brand`, roadmap/registry, `npm i`, `<Button`, pre-release, pt-BR link (line 3), VERSIONING/CONTRIBUTING links | all present |
| README.pt-BR.md: valid UTF-8 (iconv exit 0), `Instala`, back-link | pass |

## Prohibitions — all three hold

1. **Pre-release warning present** — README.md has a "Pre-release status" section stating the packages are not yet on npm; the `npm i` block is framed as documented target state (mitigates T-1-11, name-squat window).
2. **Zero unfilled bracketed template fields** — LICENSE copyright filled; CoC reporting + enforcement `[NOTE]` markers filled and the placeholder-defining frontmatter removed; grep confirms 0 `[INSERT…]` and 0 `[NOTE` survivors.
3. **Only README is mirrored** — CONTRIBUTING, CoC, SECURITY, VERSIONING are EN-only; the sole pt-BR file is `README.pt-BR.md`.

## Threat mitigations applied

- **T-1-10 (Repudiation — lost vuln reports):** SECURITY.md provides a live private-advisory channel + email fallback + 7-day window.
- **T-1-11 (Spoofing — install docs for unpublished packages):** README pre-release section prevents the install instructions from reading as currently working.
- **T-1-12 (Info disclosure — personal-ish contact in public docs):** accepted per plan; a domain alias (`security@francisross.com.br`), not a personal gmail, is used.

## Deviations from Plan

None — plan executed exactly as written. The one judgment call (MIT line-wrapping
vs the SPDX source) is explicitly permitted by the acceptance criterion ("no
wording differences beyond line wrapping") and the standard GitHub wrap is what
GitHub license detection expects.

## Known Stubs

None. The README `npm i` instructions reference not-yet-published packages, but
this is intentional and explicitly framed by the "Pre-release status" section —
Phase 7 publishes the packages. This is a documented target state, not a stub.

## Self-Check: PASSED

- `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`, `VERSIONING.md`, `README.md`, `README.pt-BR.md` — all FOUND
- Commit `5ffa467` (LICENSE/CoC/SECURITY) — FOUND
- Commit `d894053` (VERSIONING/CONTRIBUTING) — FOUND
- Commit `45abeff` (README pair) — FOUND
