# Phase 1: Monorepo Foundation & Governance - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 24 new/modified files
**Analogs found:** 4 in-repo copy sources + verified RESEARCH.md configs / 24

**Greenfield note:** This repo contains zero production code (`handoff/` is a read-only design reference; `.planning/` is GSD state). There are no controllers/services/components to mine. The "analogs" for this phase are: (a) verified-by-experiment config excerpts in `01-RESEARCH.md` (§Code Examples), (b) ready-made copy in `handoff/`, (c) two existing files that must be **modified**, and (d) canonical external sources (MIT text, Contributor Covenant 3.0). The planner should treat RESEARCH.md excerpts as the primary "code to copy" — they were verified against the live registry/gh api on 2026-07-16.

## File Classification

Role/data-flow vocabulary adapted for an infra phase: roles are `workspace-config`, `ci-config`, `governance-doc`, `template`, `placeholder-manifest`, `gsd-config`; data flow is `static` (read by tooling) or `human-read`.

| New/Modified File | Role | Data Flow | Pattern Source | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `pnpm-workspace.yaml` | workspace-config | static | RESEARCH.md lines 314-320 (verified) | exact |
| `package.json` (root) | workspace-config | static | RESEARCH.md lines 323-344 (verified versions) | exact |
| `packages/styles/package.json` | placeholder-manifest | static | RESEARCH.md lines 362-371 (verified w/ changesets) | exact |
| `packages/react/package.json` | placeholder-manifest | static | RESEARCH.md lines 362-371 (same shape) | exact |
| `.changeset/config.json` | workspace-config | static | RESEARCH.md lines 347-359 (verified locally) | exact |
| `tsconfig.base.json` | workspace-config | static | No analog — Claude's discretion (D: strict base, no project refs per ARCHITECTURE.md) | none |
| `.github/workflows/ci.yml` | ci-config | static | RESEARCH.md lines 374-420 (action versions verified) | exact |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | template | human-read | No analog — standard YAML issue form | none |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | template | human-read | No analog — standard YAML issue form | none |
| `.github/ISSUE_TEMPLATE/config.yml` | template | static | No analog — `blank_issues_enabled: false` per RESEARCH structure | none |
| `.github/pull_request_template.md` | template | human-read | Must include changeset checkbox (RESEARCH Pitfall 7) | partial |
| `.github/CODEOWNERS` | workspace-config | static | RESEARCH Open Question 2: `* @franciscpd` | exact |
| `LICENSE` | governance-doc | human-read | Canonical MIT text (verbatim, filled copyright line) | external-canonical |
| `CODE_OF_CONDUCT.md` | governance-doc | human-read | Contributor Covenant 3.0 verbatim (filled enforcement contact) | external-canonical |
| `CONTRIBUTING.md` | governance-doc | human-read | RESEARCH.md lines 489-495 content plan + CLAUDE.md locked constraints | partial |
| `SECURITY.md` | governance-doc | human-read | No analog — point to GitHub private vuln reporting or email | none |
| `VERSIONING.md` | governance-doc | human-read | RESEARCH.md lines 450-463 (content outline) | exact |
| `README.md` | governance-doc | human-read | `handoff/assets/github/org-profile.md` + `handoff/design_handoff_lyra_lib/README.md` line 149 + RESEARCH.md lines 465-487 | exact |
| `README.pt-BR.md` | governance-doc | human-read | 1:1 translation of README.md (D-05) | derived |
| `.gitignore` | workspace-config | static | **MODIFY existing** `/home/franciscpd/Projects/lyra-ds/.gitignore` (currently 1 line) | modify |
| `.npmrc` / `.nvmrc` | workspace-config | static | RESEARCH Pitfall 6: `engine-strict=true` / `24` | exact |
| `.prettierrc.json` / `.prettierignore` | workspace-config | static | Claude's discretion; must ignore `handoff/` (prototype code isn't formatted) | none |
| `.planning/config.json` | gsd-config | static | **MODIFY existing** — flip line 14 (D-08) | modify |

## Pattern Assignments

### `pnpm-workspace.yaml` (workspace-config)

**Source:** `01-RESEARCH.md` lines 314-320 — verified: unmatched globs are harmless on pnpm 11.13.

```yaml
# unmatched globs (apps/*, tools/* have no members yet) are harmless — verified with pnpm 11.13
packages:
  - "packages/*"
  - "apps/*"
  - "tools/*"
```

All three globs required now (CONTEXT.md Integration Points: docgen tool arrives Phase 5, docs app Phase 6).

---

### Root `package.json` (workspace-config)

**Source:** `01-RESEARCH.md` lines 323-344. Versions verified against npm registry 2026-07-16 — **install these exact pins, never `latest`** (`typescript@latest` = 7.0.2/tsgo, wrong compiler):

```jsonc
{
  "name": "lyra-ds-monorepo",
  "private": true,
  "packageManager": "pnpm@11.13.1",
  "engines": { "node": ">=24" },
  "scripts": {
    "lint": "prettier --check .",
    "format": "prettier --write .",
    "typecheck": "pnpm -r --if-present run typecheck",
    "test": "pnpm -r --if-present run test",
    "build": "pnpm -r --if-present run build",
    "changeset": "changeset"
  },
  "devDependencies": {
    "@changesets/cli": "2.31.1",
    "@changesets/changelog-github": "0.7.0",
    "prettier": "3.9.5",
    "typescript": "5.9.3"
  }
}
```

Note: RESEARCH.md line 220 shows a convoluted `typecheck` script, then line 227 explicitly says to **simplify** to plain `pnpm -r --if-present run typecheck` — use the simple form above.

---

### `packages/styles/package.json` + `packages/react/package.json` (placeholder-manifests)

**Source:** `01-RESEARCH.md` lines 362-371 (Pattern 1, verified: changesets `fixed` group hard-fails without these stubs — exact names AND globs both fail).

```jsonc
// packages/styles/package.json
{
  "name": "@lyra-ds/styles",
  "version": "0.0.0",
  "private": true,
  "description": "Lyra DS — tokens + component CSS, zero JS. Placeholder until Phase 2."
}
```

`packages/react/package.json` is identical in shape with `"@lyra-ds/react"` and a Phase-3 note. **Anti-pattern (RESEARCH line 254):** do NOT add `exports`, `sideEffects`, or `files` to the stubs — that metadata belongs to Phases 2-3.

---

### `.changeset/config.json` (workspace-config)

**Source:** `01-RESEARCH.md` lines 347-359 — verified locally with @changesets/cli 2.31.1 + the stubs present. Encodes D-06 (lockstep):

```jsonc
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "lyra-ds/lyra" }],
  "commit": false,
  "fixed": [["@lyra-ds/styles", "@lyra-ds/react"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Smoke check per plan task: `pnpm exec changeset status` exits 0.

---

### `.github/workflows/ci.yml` (ci-config)

**Source:** `01-RESEARCH.md` lines 374-420. Action versions verified via `gh api` 2026-07-16: checkout **v7**, setup-node **v7** (STACK.md's v4 is stale), pnpm/action-setup **v6**. Job names `lint`/`typecheck`/`test`/`build` are a **frozen contract** (ruleset required-check names — Pitfall 5); document that in the workflow header comment.

Setup-step block repeated in every job:

```yaml
      - uses: actions/checkout@v7          # pin to SHA at execution time
      - uses: pnpm/action-setup@v6         # reads packageManager field
      - uses: actions/setup-node@v7
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
```

Top-level hardening (RESEARCH Security Domain):

```yaml
permissions:
  contents: read
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

Future-gate hooks go in as **commented steps inside existing jobs** (publint/attw/size-limit in `build`, token parity in `test`, stylelint in `lint`) — never as new jobs (would orphan the ruleset).

**Anti-pattern (Pitfall 2):** no `paths`/`paths-ignore` filters — docs-only GSD planning PRs would be unmergeable against required checks.

---

### `README.md` (governance-doc) — OSS-01

**Analog 1:** `/home/franciscpd/Projects/lyra-ds/handoff/assets/github/org-profile.md` — canonical pitch copy.

Short description / tagline (lines 11-12):
```
> Open source, CSS-first design system. Semantic tokens, white-label theming, thin React wrappers — Vue, Svelte & Web Components on the same CSS core.
```

Pitch bullets to adapt (lines 24-30):
```md
**Lyra** keeps every visual decision in CSS custom properties and `.lyra-*` classes — framework adapters are thin wrappers on top of the same core. Rebrand an entire app by setting four tokens.

- **209 semantic tokens** — light/dark built in, no manual dark styles
- **White-label** — brands define `--brand`, `--brand-contrast`, `--brand-radius`, `--brand-font`; everything else is derived via `color-mix`
- **`@lyra-ds/react`** — 40 components as thin wrappers; Vue, Svelte & Web Components adapters on the roadmap (Zag.js)
- **shadcn interop** — opt-in compat layer maps `--background`, `--primary`, `--ring`… to Lyra tokens
- **LLM-first** — `llms.txt` generated from the real `.d.ts` sources, so agents write correct Lyra code
```
(Emoji bullets are flagged optional in the source, line 40 — Lyra copywriting voice is "sem emoji" per `handoff/design_handoff_lyra_lib/README.md` line 139; drop them.)

Package table (lines 32-35):
```md
| Package | Description |
|---|---|
| `@lyra-ds/styles` | Tokens + component CSS, zero JS |
| `@lyra-ds/react` | React 18+ components |
```

**Analog 2:** `handoff/design_handoff_lyra_lib/README.md` line 149 — the publication-checklist spec for README content: "instalação (`npm i @lyra-ds/react` + import único do CSS), filosofia CSS-first, white-label em 4 tokens, roadmap de adapters (Vue/Svelte/WC via Zag.js) e registry".

**Structure:** RESEARCH.md lines 465-487 skeleton — pt-BR link badge at top (D-05), pre-release status warning (removed at Phase 7), install as "documented target state", `<Button variant="primary">` snippet, links to VERSIONING.md and CONTRIBUTING.md.

---

### `README.pt-BR.md` (governance-doc)

**Pattern:** 1:1 translation of README.md, links back with "English" at top (D-05). No other governance file is mirrored. Copywriting rules from `handoff/design_handoff_lyra_lib/README.md` lines 139-140: sentence case, no emoji, Brazilian number formats in examples.

---

### `VERSIONING.md` (governance-doc) — OSS-05

**Source:** `01-RESEARCH.md` lines 450-463 (ready content outline). Key content — must declare the unusually broad API surface:

```md
# Versioning policy (0.x)
- @lyra-ds/styles and @lyra-ds/react version in lockstep (one "Lyra 0.x" version).
- While 0.x: **0.MINOR = breaking**, 0.x.PATCH = additive or fix. `major` changesets are
  reserved for the deliberate 1.0 release.
- The public API surface covered by this policy:
  1. Component props (the published .d.ts contracts)
  2. `.lyra-*` class names (shared contract with CSS-only usage and future adapters)
  3. Design token names (CSS custom properties)
  4. Package export paths (`@lyra-ds/styles`, `./tokens/*`, component entry points)
- Explicitly NOT API: internal DOM structure, undocumented classes, file layout inside dist.
- Every breaking change ships with a migration note in the changelog.
```

Linked from README **and** CONTRIBUTING (RESEARCH anti-pattern, line 256). Pitfall 7: changesets has no 0.x mode — `major` on 0.1.0 produces 1.0.0; the convention (breaking = `minor` changeset) must be stated here, in CONTRIBUTING, and reinforced by a PR-template checkbox.

---

### `CONTRIBUTING.md` (governance-doc) — OSS-02

**Source:** `01-RESEARCH.md` lines 489-495 content plan + CLAUDE.md constraints. Must include:

1. Setup: Node 24 (`.nvmrc`), pnpm ≥11.13 (`corepack enable` OR standalone install — corepack no longer ships with newer Node lines, RESEARCH line 506), `pnpm install`, root scripts.
2. Changeset required on package-touching PRs; **pre-1.0 bump convention: breaking = `minor`**.
3. **Locked decisions section** (prevents re-litigation): CSS-first, no Tailwind in core, Lyra naming canonical (`compat-shadcn.css` opt-in outside entry), entry keyframes animate transform only, no runtime CDN deps.
4. Dependency policy: new runtime deps need maintainer approval; `@lyra-ds/styles` stays zero-dep.
5. Conventional commits (existing repo convention — see Shared Patterns).

---

### `LICENSE` + `CODE_OF_CONDUCT.md` (governance-docs)

**Sources:** canonical external texts — never paraphrase (RESEARCH Don't Hand-Roll):
- LICENSE: verbatim MIT (SPDX text or `gh repo create --license mit`), copyright line filled ("2026 Francisco …" — GitHub license detection requires canonical text).
- CoC: Contributor Covenant **3.0** (current since 2025-07-28, adopted by changesets itself), enforcement contact filled with a real address (`franciscpd@gmail.com` unless user prefers another). **Anti-pattern:** unfilled template fields read as negligence to the exact target audience.

---

### `.github/ISSUE_TEMPLATE/*` + `pull_request_template.md` (templates)

No analog. Standard shapes:
- `bug_report.yml` / `feature_request.yml`: YAML issue forms (structured fields; a component dropdown can arrive when components exist).
- `config.yml`: `blank_issues_enabled: false` + contact links (RESEARCH structure line 176).
- PR template: checklist including "changeset added (breaking = minor while 0.x)" checkbox (Pitfall 7 reinforcement) and conventional-commit title reminder.

---

### `.gitignore` (MODIFY existing)

**Current content** of `/home/franciscpd/Projects/lyra-ds/.gitignore` (entire file, 1 line):
```
.planning/research/.cache/
```
**Preserve that line** and append: `node_modules/`, `dist/`, `*.tsbuildinfo`, `.env*` (RESEARCH structure line 181; `.turbo` optional — no turbo in stack).

---

### `.planning/config.json` (MODIFY existing) — D-08

**Current state** of `/home/franciscpd/Projects/lyra-ds/.planning/config.json` lines 13-19:
```jsonc
  "git": {
    "branching_strategy": "none",          // ← line 14: flip to "phase"
    "create_tag": true,
    "phase_branch_template": "gsd/phase-{phase}-{slug}",
    "milestone_branch_template": "gsd/{milestone}-{slug}",
    "quick_branch_template": null
  },
```
The only change is `"none"` → `"phase"` on line 14 — the branch template is already configured. **Timing is load-bearing** (RESEARCH Pattern 4): flip *after* the initial push to `lyra-ds/lyra` and *before* any further commits, as an explicit plan task, or GSD strands commits on protected local `main` (Pitfall 3).

---

### `.npmrc` / `.nvmrc` / `.prettierrc.json` / `.prettierignore` / `tsconfig.base.json` / `CODEOWNERS` / `SECURITY.md`

Claude's discretion (CONTEXT.md), with these anchors:
- `.npmrc`: `engine-strict=true` (Pitfall 6).
- `.nvmrc`: `24`.
- `.prettierignore`: **must exclude `handoff/`** (prototype bundle is read-only reference; `pnpm run lint` = `prettier --check .` would otherwise fail on it) and `pnpm-lock.yaml`.
- `tsconfig.base.json`: strict base, no TS project references (per `.planning/research/ARCHITECTURE.md`); packages extend it from Phase 2+.
- `CODEOWNERS`: `* @franciscpd` (RESEARCH Open Question 2 — cheap now, enables `require_code_owner_review` later).
- `SECURITY.md`: point at GitHub private vulnerability reporting with email fallback (Assumption A6).

## Shared Patterns

### Conventional commits
**Source:** existing git history (`docs:`, `chore:` — e.g., `a93f08e docs(state): record phase 1 context session`).
**Apply to:** every commit this phase; also feeds `@changesets/changelog-github` later. Document in CONTRIBUTING.

### Exact version pinning (no floating `latest`)
**Source:** RESEARCH Package Legitimacy Audit + Pitfall 4.
**Apply to:** all `pnpm add` commands (`@changesets/cli@2.31.1`, `@changesets/changelog-github@0.7.0`, `prettier@3.9.5`, `typescript@5.9.3`) and all action refs in `ci.yml` (majors for `actions/*`, commit SHA for third-party like `pnpm/action-setup`).

### Two-step protection bootstrap sequencing
**Source:** RESEARCH Pattern 3 (7 numbered steps) + ruleset `gh api` payload at RESEARCH.md lines 424-447.
**Apply to:** plan task ordering — org creation (guided human step) → push → ruleset *without* required checks → GSD config flip → scaffold PR → add the four required checks → verification PR. The ruleset JSON payload is ready to adapt; verify endpoint shape with `gh api` at execution (Assumption A4).

### Stable CI check names as a contract
**Source:** RESEARCH Pitfall 5.
**Apply to:** `ci.yml` job names AND the ruleset `required_status_checks` contexts — `lint`, `typecheck`, `test`, `build`, frozen forever; future gates land as steps inside these jobs.

## No Analog Found

| File | Role | Reason | Fallback |
|------|------|--------|----------|
| `tsconfig.base.json` | workspace-config | No TS config exists anywhere in repo | `.planning/research/ARCHITECTURE.md` (strict base, no project refs) + Claude's discretion |
| Issue forms / `config.yml` | template | No `.github/` dir exists | Standard GitHub YAML issue-form shape |
| `.prettierrc.json` | workspace-config | No formatter config exists | Prettier defaults + discretion; the `.prettierignore` handoff exclusion is the only hard requirement |
| `SECURITY.md` | governance-doc | Nothing comparable in repo | GitHub private vuln reporting pattern (Assumption A6) |

## Metadata

**Analog search scope:** entire repo root, `handoff/` (incl. `design_handoff_lyra_lib/`, `assets/github/`), `.planning/`, `.claude/`
**Files scanned:** repo tree + 5 files read in full (CONTEXT, RESEARCH, org-profile.md, design_handoff README, config.json, .gitignore)
**Pattern extraction date:** 2026-07-16
