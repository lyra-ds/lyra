# Phase 1: Monorepo Foundation & Governance - Research

**Researched:** 2026-07-16
**Domain:** OSS repo scaffolding — pnpm workspaces, changesets, GitHub governance, GitHub Actions CI, branch protection
**Confidence:** HIGH (all critical behaviors verified via local experiment, npm registry, gh api, or official docs this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### GitHub org & repo (timing and naming)
- **D-01:** Create the GitHub org **`lyra-ds`** during Phase 1 (user creates it manually, guided step). Availability verified 2026-07-16: `lyra` and `lyra-ui` are taken on GitHub; `@lyra` npm scope is occupied (`@lyra/core` exists); `lyra-ds` is free on GitHub and `@lyra-ds/react`/`@lyra-ds/styles` are unclaimed on npm. Org handle matches the npm scope 1:1.
- **D-02:** Repository is **`lyra-ds/lyra`** (short URL, "Lyra" is the product; the org already says "ds"). Local directory stays `lyra-ds` — only the remote name matters.
- **D-03:** Full org branding (avatar, profile README, social preview from `handoff/assets/github/`) remains Phase 7 scope (OSS-04). Phase 1 only creates the org + repo and pushes.

#### Repo/governance language
- **D-04:** Governance surface is **English**: README, CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue/PR templates.
- **D-05:** README gets a **pt-BR mirror** (`README.pt-BR.md`) linked prominently from the top of README.md (badge/link "Português"). Only the README is mirrored — CONTRIBUTING/CoC/templates are EN-only.

#### Package versioning strategy
- **D-06:** **Lockstep versioning** — changesets `fixed` group covering `@lyra-ds/styles` + `@lyra-ds/react`. "Lyra 0.x" is one version; compatibility between the two packages is self-evident to users. Aligned with research (class contract couples the packages).

#### Repo workflow
- **D-07:** **PRs from day one** — branch protection on `main`, all work (including each GSD phase) lands via PR with green CI. The PR history doubles as the project's public build log, and the flow contributors will use is exercised from the start.
- **D-08:** Planner must reconcile the GSD commit flow with branch protection: `.planning/` docs ride the same feature-branch → PR flow (GSD's branching strategy setting / `/gsd-ship`), or branch protection is configured to allow the workflow. Don't leave planning commits stranded on protected main.

### Claude's Discretion
- Linter/formatter choice (ESLint+Prettier vs Biome vs oxlint), CI job layout, tsconfig.base details, .gitignore/.npmrc specifics, changesets config beyond the fixed group, CODEOWNERS — standard patterns per research STACK.md; decide at planning/execution time.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OSS-01 | Dev finds a README with pitch (CSS-first, white-label in 4 tokens, adapters/registry roadmap), install instructions, minimal snippet | README content plan below; canonical pitch copy exists in `handoff/assets/github/org-profile.md`; pt-BR mirror pattern (D-05) |
| OSS-02 | MIT LICENSE, CONTRIBUTING.md, Code of Conduct, issue/PR templates present | Governance file inventory below; Contributor Covenant 3.0 (current, released 2025-07-28); YAML issue forms |
| OSS-03 | Every PR runs visible CI (lint, typecheck, test, build) with hooks ready for publint/attw/size-limit/parity gates | CI workflow shape verified (action versions via gh api); `pnpm -r --if-present run <script>` pattern makes jobs green with placeholder packages and real as code lands |
| OSS-05 | Written 0.x versioning policy: 0.MINOR = breaking; declared API = props + `.lyra-*` classes + token names | VERSIONING.md content plan; changesets has NO built-in 0.x mode — policy is convention enforced in CONTRIBUTING + review (verified: `major` bump on 0.1.0 produces 1.0.0) |
</phase_requirements>

## Summary

Phase 1 is pure scaffolding + governance — no library code. The technical risk is not in writing files but in **sequencing and platform mechanics**: (1) changesets' `fixed` group hard-fails validation when the named packages don't exist in the workspace (verified empirically this session), so Phase 1 must ship minimal placeholder `package.json` stubs for `@lyra-ds/styles` and `@lyra-ds/react`; (2) branch protection (D-07) creates a bootstrap ordering problem — you cannot require status checks from a CI workflow that doesn't exist on `main` yet, so protection must be tightened in two steps; (3) GSD's current `git.branching_strategy` is `"none"`, which directly conflicts with D-07 once `main` is protected — the config must flip to `"phase"` as part of this phase (D-08).

Everything else is well-trodden: pnpm workspace with `packages/*`, `apps/*`, `tools/*` globs (verified that unmatched globs are harmless), `packageManager` pinning, a single `ci.yml` with four stable job names (`lint`, `typecheck`, `test`, `build`) that required status checks reference, Contributor Covenant 3.0 for the CoC, YAML issue forms, and a `VERSIONING.md` that declares the unusually broad API surface (props + `.lyra-*` classes + token names) in writing.

**Primary recommendation:** Scaffold locally → push existing `main` history to new `lyra-ds/lyra` repo → enable PR-required ruleset (no required checks yet) → land the workspace/CI/governance scaffold as the repo's first PR (CI runs from the PR branch) → after merge, add the four required status checks to the ruleset → flip GSD branching to `"phase"`.

## Project Constraints (from CLAUDE.md)

Directives from `.claude/CLAUDE.md` that bind this phase:

- **Stack (locked):** monorepo pnpm workspaces + changesets; Node 24 LTS; pnpm 11.13.1 pinned via `packageManager`; TypeScript **pinned 5.9.3** (npm `latest` is 7.0.2 / tsgo — do NOT float); tsup 8.5.1 arrives in Phase 3, not now.
- **No Tailwind anywhere in packages** — and CONTRIBUTING should state this as a locked decision so PRs don't re-litigate it.
- **License:** MIT with CONTRIBUTING.md and Code of Conduct **from the start** (this phase).
- **Infra:** GitHub org `lyra-ds` created manually by the user (guided), npm org `lyra-ds` (Phase 7), docs on Vercel (Phase 6).
- **CI shape per CLAUDE.md:** `pnpm/action-setup` + `actions/setup-node` with `cache: pnpm`, Node 24; jobs lint → build → test; changesets release job is Phase 7.
- **Conventional commits** — repo history already uses `docs:`/`chore:`; keep the convention (also feeds `@changesets/changelog-github` later).
- **GSD workflow enforcement:** all file changes via GSD commands; `commit_docs=true` — interacts with D-07/D-08 (see Pitfall 3).

## Architectural Responsibility Map

This is an infra phase; "tiers" here are repo/platform layers, not runtime tiers.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Workspace resolution, script fan-out | Repo root (`pnpm-workspace.yaml`, root `package.json`) | — | pnpm owns the graph; root scripts are the single entry (`pnpm -r --if-present run X`) |
| Versioning policy + release intent | `.changeset/` config + `VERSIONING.md` | CONTRIBUTING.md | changesets encodes lockstep (D-06); the 0.x semantics are human policy, not tooling |
| CI gates | `.github/workflows/ci.yml` | GitHub ruleset (required checks) | Workflow produces the checks; ruleset makes them blocking |
| Merge discipline (D-07) | GitHub ruleset on `main` | GSD config (`branching_strategy: "phase"`) | Platform enforces PRs; GSD config makes the local workflow comply |
| Governance / contributor UX | `.github/` + root docs (LICENSE, CONTRIBUTING, CoC, templates) | README | Standard GitHub community-health file locations so GitHub surfaces them in UI |
| Public pitch (OSS-01) | `README.md` + `README.pt-BR.md` | `handoff/assets/github/org-profile.md` (copy source) | README is the repo landing page; org profile branding is Phase 7 (D-03) |
| Org/repo existence | GitHub platform (manual + `gh` CLI) | — | Org creation has no self-serve API — user does it in web UI (guided); repo + ruleset via `gh` |

## Standard Stack

### Core (installed this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pnpm | 11.13.1 | Workspace manager | Locked. `[VERIFIED: npm registry]` latest is 11.13.1; pin via `packageManager` field (local machine has 11.13.0 — the pinned version is auto-fetched) |
| @changesets/cli | 2.31.1 | Versioning scaffold (D-06 lockstep) | Locked. `[VERIFIED: npm registry]` |
| @changesets/changelog-github | 0.7.0 | PR/author-linked changelogs | Per STACK.md. `[VERIFIED: npm registry]` Needs `repo: "lyra-ds/lyra"` option |
| prettier | 3.9.5 | Formatting + the real substance of the Phase-1 `lint` job | `[VERIFIED: npm registry]` OSS contributor expectation; only linter with something to lint in Phase 1 (md/json/yaml) |
| typescript | **5.9.3 (pin exact)** | `tsconfig.base.json` + root typecheck hook | CLAUDE.md locked pin. `[VERIFIED: npm registry]` npm `latest` is **7.0.2** (tsgo) — installing `typescript` without an exact version gets the wrong compiler |

### GitHub Actions (referenced in ci.yml, not npm deps)

| Action | Latest | Purpose |
|--------|--------|---------|
| actions/checkout | v7.0.0 (2026-06-18) | Checkout. `[VERIFIED: gh api releases]` |
| actions/setup-node | v7.0.0 (2026-07-14) | Node 24 + `cache: pnpm`. `[VERIFIED: gh api releases]` (STACK.md said v4 — superseded; v7 is current major) |
| pnpm/action-setup | v6 (v6.0.9, 2026-06-15) | Installs pnpm from `packageManager` field. `[VERIFIED: gh api releases]` |
| rhysd/actionlint | v1.7.12 (2026-03-30) | Lint workflow files (optional but recommended). `[VERIFIED: gh api releases]` Not installed locally — run in CI only |
| changesets/action | v1.9.0 | **Phase 7, not now** — noted so the ruleset bypass design accounts for it. `[VERIFIED: gh api releases]` |

**Not installed this phase (deliberate):** ESLint/typescript-eslint (arrives Phase 3 with TS code), stylelint (Phase 2 with CSS), tsup/vitest (Phase 3), fumadocs/next (Phase 6). Installing linters with nothing to lint produces fake-green CI jobs.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prettier now, ESLint in Phase 3 | Biome / oxlint | Biome would replace both, but STACK.md prescribes ESLint 10 flat + jsx-a11y for the React package (jsx-a11y has no Biome equivalent at parity); switching later churns config. Stay on the STACK.md path. |
| Rulesets (new API) | Classic branch protection | Both free on public repos; rulesets support multiple layered rules + bypass actors (org repos only — ours is one) and are GitHub's current direction. Use a ruleset. `[CITED: docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets]` |
| Contributor Covenant 3.0 | Contributor Covenant 2.1 | 3.0 (released 2025-07-28) is current, clearer, less US-centric; adopted by changesets itself. No reason to adopt the older one. `[CITED: contributor-covenant.org/version/3/0/code_of_conduct/]` |
| Placeholder package stubs | Empty `fixed: []` until Phase 2 | Deferring the fixed group leaves D-06 un-encoded and success criterion 5 ("changesets scaffold works") unverifiable. Stubs are verified to work (see below). |

**Installation:**
```bash
pnpm add -D -w @changesets/cli @changesets/changelog-github prettier typescript@5.9.3
pnpm exec changeset init
```

## Package Legitimacy Audit

Seam command run this session: `gsd-tools query package-legitimacy check --ecosystem npm @changesets/cli @changesets/changelog-github prettier typescript eslint`

| Package | Registry | Latest publish | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @changesets/cli | npm | 2026-07-15 | 3.28M/wk | github.com/changesets/changesets | [SUS: too-new] | Approved — see note |
| @changesets/changelog-github | npm | 2026-05-05 | 656K/wk | github.com/changesets/changesets | [OK] | Approved |
| prettier | npm | 2026-07-09 | 91.4M/wk | github.com/prettier/prettier | [SUS: too-new] | Approved — see note |
| typescript | npm | 2026-07-08 | 216M/wk | github.com/microsoft/TypeScript | [SUS: too-new] | Approved — **pin 5.9.3**, latest is TS 7 (tsgo) |
| eslint | npm | 2026-07-10 | 133M/wk | github.com/eslint/eslint | [SUS: too-new] | Not installed this phase (Phase 3) |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged [SUS]:** the seam's `too-new` signal fired because each package's *latest version* was published within days of this research — a recency heuristic, not an age signal. All four are canonical, decade-old packages with official source repos and 3M–216M weekly downloads. **Mitigation instead of a human-verify checkpoint:** the plan must install *exact pinned versions already verified against the registry* (`@changesets/cli@2.31.1`, `prettier@3.9.5`, `typescript@5.9.3`) rather than floating `latest`, which also neutralizes any fresh-release risk. The typescript pin is doubly mandatory (CLAUDE.md: latest = TS 7 breaks the toolchain assumption).

## Architecture Patterns

### System Architecture Diagram

```
 contributor / GSD phase work
        │  git push (feature branch: gsd/phase-N-slug)
        ▼
 ┌─────────────────────────────┐     pull_request event      ┌──────────────────────────────┐
 │ GitHub PR on lyra-ds/lyra   │ ───────────────────────────▶│ .github/workflows/ci.yml     │
 │  (only path into main)      │                             │  jobs: lint │ typecheck │    │
 └───────────┬─────────────────┘                             │        test │ build          │
             │  merge allowed only when…                     │  (each: checkout → pnpm →    │
             ▼                                               │   node24+cache → install →   │
 ┌─────────────────────────────┐   required status checks    │   pnpm -r --if-present run X)│
 │ Ruleset on main             │◀────────────────────────────┴──────────────────────────────┘
 │  • require PR               │        job names = required check names (stable contract)
 │  • require checks:          │
 │    lint/typecheck/test/build│                ┌────────────────────────────────────────┐
 │  • block force-push/delete  │                │ future gate hooks (commented steps):   │
 └───────────┬─────────────────┘                │ publint · attw · size-limit · parity   │
             ▼                                  │ (Phases 2–4 uncomment as pkgs land)    │
 ┌─────────────────────────────┐                └────────────────────────────────────────┘
 │ main (protected)            │
 │  workspace scaffold:        │      ┌───────────────────────────────────────────┐
 │  pnpm-workspace.yaml        │─────▶│ .changeset/config.json                    │
 │  packages/{styles,react}    │ feeds│  fixed: [["@lyra-ds/styles",              │
 │   (placeholder manifests)   │      │           "@lyra-ds/react"]]  (D-06)      │
 │  governance files           │      │  validates ONLY if both pkgs exist ───────┼─▶ placeholder stubs required
 └─────────────────────────────┘      └───────────────────────────────────────────┘
```

### Recommended Project Structure (end of Phase 1)

```
lyra-ds/                          # local dir name unchanged (D-02)
├── .changeset/
│   └── config.json               # fixed group, changelog-github, access public, baseBranch main
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml        # YAML issue form
│   │   ├── feature_request.yml   # YAML issue form
│   │   └── config.yml            # blank_issues_enabled: false, contact links
│   ├── pull_request_template.md
│   ├── CODEOWNERS                # * @franciscpd (discretion — recommended)
│   └── workflows/
│       └── ci.yml                # lint / typecheck / test / build
├── .gitignore                    # node_modules, dist, .turbo, *.tsbuildinfo, .env*
├── .npmrc                        # engine-strict=true
├── .nvmrc                        # 24
├── .prettierrc.json + .prettierignore
├── CODE_OF_CONDUCT.md            # Contributor Covenant 3.0
├── CONTRIBUTING.md               # setup, changesets, locked decisions, dep policy
├── LICENSE                       # MIT
├── README.md                     # pitch + install + snippet + link to README.pt-BR.md
├── README.pt-BR.md               # mirror (D-05)
├── SECURITY.md                   # vuln reporting policy (recommended)
├── VERSIONING.md                 # 0.x policy (OSS-05)
├── package.json                  # private, packageManager, engines, root scripts
├── pnpm-workspace.yaml           # packages/* , apps/* , tools/*  (unmatched globs OK — verified)
├── pnpm-lock.yaml
├── tsconfig.base.json            # strict base; packages extend from Phase 2+
├── packages/
│   ├── styles/package.json       # placeholder: @lyra-ds/styles 0.0.0 private
│   └── react/package.json        # placeholder: @lyra-ds/react 0.0.0 private
├── handoff/                      # untouched (read-only reference)
└── .planning/                    # GSD state (rides PRs after protection — D-08)
```

### Pattern 1: Placeholder package manifests unblock the changesets fixed group

**What:** Ship `packages/styles/package.json` and `packages/react/package.json` containing only `name`, `version: "0.0.0"`, `private: true` (+ a `description`). No source code — that's Phases 2–3.
**When to use:** Now — the changesets `fixed` group (D-06) requires it.
**Why (verified this session):** `changeset status` throws `ValidationError: The package or glob expression "@lyra-ds/styles" specified in the 'fixed' option does not match any package in the project` when the packages don't exist — **and the glob form `"@lyra-ds/*"` with zero matches fails identically**. With the two stubs present, `changeset status` runs clean. `[VERIFIED: local experiment, @changesets/cli 2.31.1 + pnpm 11.13.0]`
**Notes:** `private: true` prevents any accidental publish and is removed when real packaging metadata is authored (Phases 2–3). changesets' default `privatePackages: { version: true, tag: false }` still versions them, so the fixed group is fully functional. Placeholders also make `pnpm install` from a clean clone produce a real lockfile with workspace entries (success criterion 5).

### Pattern 2: `--if-present` recursive scripts — CI is real now, meaningful later

**What:** Root scripts fan out with `pnpm -r --if-present run <script>`; packages without the script are skipped without error.
**When to use:** All four CI jobs.

```jsonc
// root package.json (scripts excerpt)
{
  "scripts": {
    "lint": "prettier --check .",
    "typecheck": "pnpm -r --if-present run typecheck && tsc -p tsconfig.base.json --noEmit false --composite false --emitDeclarationOnly false 2>/dev/null || pnpm -r --if-present run typecheck",
    "test": "pnpm -r --if-present run test",
    "build": "pnpm -r --if-present run build"
  }
}
```

**Simplify:** keep `typecheck` as plain `pnpm -r --if-present run typecheck` (a no-op until Phase 3 adds a package `typecheck` script) — don't invent a root tsc run against a base config with no sources. The *job* exists and is green; the *content* arrives with code. That is exactly the "hooks ready" shape success criterion 3 asks for.

### Pattern 3: Two-step protection bootstrap (resolves the D-07 chicken-and-egg)

**What:** You cannot make `lint/typecheck/test/build` required checks before a workflow that produces them has ever run — a required check that never reports leaves PRs stuck at "Expected — waiting for status" `[ASSUMED]`. Sequence:

1. Scaffold nothing remote yet; user creates org `lyra-ds` in the GitHub web UI (guided — org creation has no self-serve API `[ASSUMED]`), sets the short description from `handoff/assets/github/org-profile.md` (allowed by D-03; full branding is Phase 7).
2. `gh repo create lyra-ds/lyra --public` (or create empty via UI), then `git remote add origin git@github.com:lyra-ds/lyra.git && git push -u origin main` — pushes the existing history (`.planning/` + `handoff/` + CLAUDE.md), which CONTEXT confirms is intended.
3. Create ruleset on `main`: require PR, block force-push, block deletion — **no required status checks yet**.
4. Flip GSD `git.branching_strategy` from `"none"` to `"phase"` in `.planning/config.json` (D-08 reconciliation — see Pattern 4). From here on, all work is branch → PR.
5. Land the entire Phase-1 scaffold (workspace, governance, CI, policy docs) as the repo's **first PR**. The `ci.yml` in the PR branch runs on the `pull_request` event (workflows added in a PR run from the head branch for same-repo PRs `[ASSUMED]`) — the first PR is also the first CI proof.
6. After merge, update the ruleset to add required status checks `lint`, `typecheck`, `test`, `build` (job names are the check names — keep them stable forever; they are referenced by the ruleset).
7. Verify: open a trivial follow-up PR (e.g., README badge) and confirm merge is blocked until all four checks pass (success criterion 3 evidence).

**Alternative rejected:** enabling full protection before the scaffold PR (PRs get permanently stuck on never-reporting checks); or scaffolding directly on `main` then protecting (violates "PRs from day one" and leaves the CI untested by a PR).

### Pattern 4: GSD ↔ branch protection reconciliation (D-08)

**What:** `.planning/config.json` currently has `git.branching_strategy: "none"` and `commit_docs: true` — GSD commits planning docs straight to the current branch. Once `main` is protected, direct pushes fail.
**Fix:** set `git.branching_strategy` to `"phase"` (template already present: `gsd/phase-{phase}-{slug}`). Each phase's work — code *and* `.planning/` docs — accumulates on the phase branch and lands via `/gsd-ship` PR. No bypass actors needed for the human/GSD flow; the ruleset stays clean.
**Timing:** flip the config *in the same phase execution*, after the initial push (step 4 above) and before any further commits. The planner should make this an explicit task, not a footnote.
**Phase 7 forward-note:** the changesets "Version Packages" PR flow needs either a bypass actor (GitHub App/PAT) or `pull-request` permissions on the workflow — that ruleset adjustment is Phase 7 scope, but choosing rulesets now (which support bypass actors on org repos `[CITED: docs.github.com]`) keeps the door open.

### Anti-Patterns to Avoid

- **Path-filtering the CI workflow (`paths-ignore: ['.planning/**', '**.md']`):** required status checks from a skipped workflow never report, and docs-only PRs (every GSD planning PR!) become unmergeable. Keep CI unconditional — the Phase-1 jobs cost ~1 minute. Revisit only with `paths` + a merge-queue-safe strategy much later.
- **Floating action majors or npm `latest`:** `typescript@latest` is now the tsgo compiler; actions move majors fast (checkout v7, setup-node v7). Pin actions to major tag at minimum; pin third-party actions (pnpm/action-setup, actionlint) **by commit SHA** per security section.
- **Writing package build/exports metadata into the placeholder stubs:** exports maps, `sideEffects`, `files` are Phases 2–3 decisions with their own pitfalls (PITFALLS.md #1, #2). Stubs stay name+version+private only, so nothing half-authored leaks into the real packaging work.
- **A CoC or license with unfilled template fields:** Contributor Covenant 3.0 requires you to fill enforcement contact; MIT requires copyright holder line. Empty placeholders read as negligence to the exact audience Phase 1 targets.
- **Putting the versioning policy only in CONTRIBUTING:** OSS-05 says *written policy*; consumers (not contributors) need it too. `VERSIONING.md` at root, linked from README **and** CONTRIBUTING.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Code of Conduct | Custom CoC text | Contributor Covenant 3.0 (CC BY-SA 4.0) | Industry standard, GitHub community-profile detects it; 3.0 current since 2025-07-28 `[CITED: contributor-covenant.org]` |
| License text | Paraphrased MIT | Verbatim MIT text (`gh repo create --license mit` or SPDX text) | GitHub license detection requires canonical text |
| Issue intake | Markdown issue templates | YAML issue forms (`.github/ISSUE_TEMPLATE/*.yml`) + `config.yml` | Structured fields, required inputs, dropdown for component name later `[ASSUMED]` |
| Version bump orchestration | Manual version edits / scripts | changesets `fixed` group | Locked (D-06); verified working with stubs |
| Workflow linting | Eyeballing YAML | actionlint in CI | Catches expression/typing errors in workflows before they bite `[VERIFIED: gh api — v1.7.12]` |
| Branch rules | Documented convention only | GitHub ruleset (API-managed via `gh api`) | Convention doesn't block a push; ruleset does. Free on public repos `[CITED: docs.github.com]` |

**Key insight:** every artifact in this phase has a canonical, GitHub-recognized form; deviation costs credibility with the exact audience (OSS devs) the phase exists to convince.

## Common Pitfalls

### Pitfall 1: changesets config references packages that don't exist yet
**What goes wrong:** `changeset status`/`version` throws `ValidationError` and every changesets command is dead — success criterion 5 fails from a clean clone.
**Why it happens:** `fixed`/`linked` entries (exact names *and* globs) must match ≥1 workspace package. `[VERIFIED: local experiment]`
**How to avoid:** placeholder manifests (Pattern 1). Smoke check in the plan: `pnpm exec changeset status` exits 0.
**Warning signs:** 🦋 ValidationError in CI or locally.

### Pitfall 2: Required status checks block docs-only PRs (GSD planning PRs)
**What goes wrong:** if `ci.yml` uses `paths`/`paths-ignore`, a `.planning/`-only PR triggers no workflow, required checks stay "Expected", and the PR can never merge.
**Why it happens:** required checks are satisfied only by a reported status; skipped workflows report nothing. `[ASSUMED — well-documented GitHub behavior]`
**How to avoid:** no path filters on `ci.yml`. All jobs are cheap in Phase 1 and stay cheap for docs PRs (pnpm cache).
**Warning signs:** PR stuck with grey "Expected" checks.

### Pitfall 3: Branch protection enabled before GSD branching flips → stranded commits
**What goes wrong:** GSD (`branching_strategy: "none"`, `commit_docs: true`) commits to local `main`; push rejected; planning state diverges from remote.
**How to avoid:** Pattern 3 step ordering + Pattern 4 config flip as an explicit plan task. If a commit does land on local `main` post-protection, recover with `git branch rescue && git reset --hard origin/main` and PR the rescue branch.
**Warning signs:** `! [remote rejected] main -> main (protected branch hook declined)`.

### Pitfall 4: `typescript` or actions installed at floating latest
**What goes wrong:** `pnpm add -D typescript` today installs 7.0.2 (tsgo) — a different compiler than the pinned toolchain; STACK.md's `setup-node@v4` reference is stale (current major v7).
**How to avoid:** exact pins: `typescript@5.9.3`; use action versions verified this session (checkout v7, setup-node v7, pnpm/action-setup v6). `[VERIFIED: npm registry + gh api]`
**Warning signs:** `tsc --version` printing 7.x; deprecation warnings on setup-node.

### Pitfall 5: Required-check names drift from job names
**What goes wrong:** renaming a CI job later (e.g., `lint` → `lint-and-format`) silently orphans the ruleset's required check — merges block on a check that no longer exists.
**How to avoid:** treat job names `lint`, `typecheck`, `test`, `build` as a frozen contract (document in the workflow file header). Future gates (publint/attw/size-limit/parity) land as **steps inside `build`/`test`**, not as new jobs — no ruleset churn (matches OSS-03's "hooks ready" language).
**Warning signs:** PR blocked on a check name CI never reports.

### Pitfall 6: `pnpm install` works locally but not from a clean clone
**What goes wrong:** lockfile out of sync with stubs, or `engines`/`packageManager` mismatch surprising contributors with old Node/pnpm.
**How to avoid:** commit `pnpm-lock.yaml`; `engines: { "node": ">=24" }` + `.npmrc` `engine-strict=true` + `.nvmrc` `24`; CI installs with `--frozen-lockfile` (default in CI for pnpm, but be explicit). Verify criterion 5 with an actual `git clone` into a temp dir.
**Warning signs:** `ERR_PNPM_OUTDATED_LOCKFILE` in CI.

### Pitfall 7: 0.x policy written but not wired to the release mechanism
**What goes wrong:** policy says "0.MINOR = breaking" but a contributor selects `major` in a changeset → changesets bumps 0.1.0 → **1.0.0** (plain semver, no 0.x special-casing in changesets `[ASSUMED — semver.inc behavior]`).
**How to avoid:** VERSIONING.md + CONTRIBUTING state the convention explicitly: pre-1.0, breaking = `minor` changeset, everything else = `patch`; `major` reserved for the deliberate 1.0 decision. PR template checkbox reinforces it. (Tooling enforcement isn't available; review is the gate — acceptable at this team size.)

## Code Examples

Verified/prescriptive configs for the planner. All file contents below are ready to adapt.

### pnpm-workspace.yaml
```yaml
# unmatched globs (apps/*, tools/* have no members yet) are harmless — verified with pnpm 11.13
packages:
  - "packages/*"
  - "apps/*"
  - "tools/*"
```

### Root package.json (shape)
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

### .changeset/config.json  `[VERIFIED: local experiment — validates with stubs present]`
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

### Placeholder package manifest (both packages)
```jsonc
// packages/styles/package.json
{
  "name": "@lyra-ds/styles",
  "version": "0.0.0",
  "private": true,
  "description": "Lyra DS — tokens + component CSS, zero JS. Placeholder until Phase 2."
}
// packages/react/package.json — same shape, "@lyra-ds/react", Phase 3 note
```

### .github/workflows/ci.yml (skeleton — job names are the required-check contract)
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7          # pin to SHA at execution time
      - uses: pnpm/action-setup@v6         # reads packageManager field
      - uses: actions/setup-node@v7
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      # actionlint (recommended): download pinned binary and lint .github/workflows
      # future hook (Phase 2): stylelint on packages/styles

  typecheck:
    runs-on: ubuntu-latest
    steps:
      # …same setup steps…
      - run: pnpm run typecheck            # no-op until Phase 3 adds package scripts

  test:
    runs-on: ubuntu-latest
    steps:
      # …same setup steps…
      - run: pnpm run test                 # Vitest arrives Phase 3
      # future hook (Phase 2): token parity script (STY-06)

  build:
    runs-on: ubuntu-latest
    steps:
      # …same setup steps…
      - run: pnpm run build
      # future hooks (Phases 2-4): publint, attw --pack, size-limit  (OSS-03)
```

### Ruleset via gh api (step 6 of Pattern 3)
```bash
gh api repos/lyra-ds/lyra/rulesets -X POST --input - <<'JSON'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request",
      "parameters": { "required_approving_review_count": 0,
                      "dismiss_stale_reviews_on_push": false,
                      "require_code_owner_review": false,
                      "require_last_push_approval": false,
                      "required_review_thread_resolution": false } },
    { "type": "required_status_checks",
      "parameters": { "strict_required_status_checks_policy": false,
                      "required_status_checks": [
                        { "context": "lint" }, { "context": "typecheck" },
                        { "context": "test" }, { "context": "build" } ] } }
  ]
}
JSON
```
`required_approving_review_count: 0` — solo maintainer can merge own PRs after green CI (raise later when contributors arrive). Create initially **without** the `required_status_checks` rule (step 3), add it after the first CI run (step 6). `[ASSUMED — endpoint shape per GitHub REST docs; verify with gh api at execution]`

### VERSIONING.md (content outline — OSS-05)
```markdown
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

### README.md skeleton (OSS-01, D-04/D-05)
```markdown
# Lyra Design System
[Português (pt-BR)](./README.pt-BR.md) · MIT · CI badge

> Open source, CSS-first design system. Semantic tokens, white-label theming,
> thin React wrappers — Vue, Svelte & Web Components on the same CSS core.
<!-- pitch bullets adapted from handoff/assets/github/org-profile.md:
     209 tokens · white-label in 4 tokens (--brand, --brand-contrast,
     --brand-radius, --brand-font) · CSS-first architecture · adapters (Zag.js)
     + shadcn-style registry on the roadmap · llms.txt generated from real .d.ts -->

## Status
> ⚠️ Pre-release. Packages are not yet published to npm. (removed at Phase 7)

## Installation  (documented target state)
npm i @lyra-ds/styles @lyra-ds/react
import '@lyra-ds/styles';           // once, at app root
## Usage
<Button variant="primary">Save changes</Button>
## Versioning → VERSIONING.md · ## Contributing → CONTRIBUTING.md · License MIT
```
The pt-BR mirror translates this file 1:1 and links back ("English"). Only README is mirrored (D-05).

### CONTRIBUTING.md must include (per PITFALLS.md #9)
- Setup: Node 24 (`.nvmrc`), `corepack enable` or pnpm ≥11.13, `pnpm install`, root scripts.
- Changeset required on package-touching PRs; pre-1.0 bump convention (breaking = minor).
- **Locked decisions section** (prevents re-litigation): CSS-first, no Tailwind in core, Lyra naming canonical, entry keyframes animate transform only, no runtime CDN deps.
- Dependency policy: new runtime deps need maintainer approval; `@lyra-ds/styles` stays zero-dep.
- Conventional commits.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Classic branch protection rules | Repository rulesets (layered, bypass actors, API-first) | GA 2023, now default guidance | Use rulesets; bypass actors need an org repo (we have one) `[CITED: docs.github.com]` |
| Contributor Covenant 2.1 | Contributor Covenant 3.0 | 2025-07-28 | Adopt 3.0 directly `[CITED: contributor-covenant.org]` |
| actions/setup-node@v4 (per STACK.md) | v7.0.0 | 2026-07-14 | Use v7; STACK.md's v4 note is stale `[VERIFIED: gh api]` |
| Markdown issue templates | YAML issue forms | GA since 2022 | Structured intake from day one |
| `NPM_TOKEN` publishes | npm trusted publishing (OIDC) | GA mid-2025 | Phase 7 concern; no npm secrets should ever be added to this repo |

**Deprecated/outdated:** corepack no longer ships with newer Node lines — don't make `corepack enable` the *only* documented pnpm install path in CONTRIBUTING; mention standalone install too `[ASSUMED]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub org creation is web-UI-only (no self-serve API) | Pattern 3 | Low — user creates via UI regardless (D-01 says manual, guided) |
| A2 | Workflows added in a same-repo PR branch run on that PR's `pull_request` event | Pattern 3 step 5 | Medium — if wrong, first CI proof needs one direct push to main *before* protection; sequencing already permits this |
| A3 | Required checks that never report leave PRs blocked at "Expected" | Pitfall 2, Pattern 3 | Low — motivates the two-step ruleset, which is safe either way |
| A4 | Ruleset REST payload shape (`required_status_checks` contexts, `~DEFAULT_BRANCH`) | Code example | Low — verify interactively with `gh api` at execution; UI fallback exists |
| A5 | changesets applies plain semver (major on 0.1.0 → 1.0.0); no built-in 0.x mode | Pitfall 7 | Low — policy is convention-enforced either way |
| A6 | GitHub private vulnerability reporting is enableable on free org public repos (for SECURITY.md) | Structure | Low — SECURITY.md can point to an email instead |

## Open Questions (RESOLVED)

1. **Should the scaffold PR (Pattern 3 step 5) also carry `.planning/` history reconciliation?** *(RESOLVED — one scaffold PR)*
   - What we know: existing `main` history (planning docs) pushes cleanly before protection.
   - What's unclear: whether the planner wants Phase-1 execution commits split into multiple PRs (scaffold PR + governance PR) or one.
   - Recommendation: one scaffold PR is fine — reviewability matters less than an exercised PR flow; planner's call on granularity.
   - **Decision adopted by plans:** one single scaffold PR carrying all Phase-1 file work, implemented in plan 01-05 (the whole-tree scaffold PR that exercises the CI + protection flow).

2. **CODEOWNERS now or later?** *(RESOLVED — now)* Single maintainer makes it near-decorative. Recommendation: include `* @franciscpd` (cheap, enables `require_code_owner_review` later without a new file).
   - **Decision adopted by plans:** included as `* @franciscpd`, implemented in plan 01-04.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | all tooling | ✓ | v24.18.0 (meets 24 LTS) | — |
| pnpm | workspace | ✓ | 11.13.0 (pin 11.13.1 auto-fetched via packageManager) | — |
| git | repo | ✓ | 2.55.0 | — |
| gh CLI | repo create, rulesets, PR flow | ✓ **authenticated as franciscpd (ssh)** | 2.96.0 | web UI |
| corepack | pnpm pinning (contributors) | ✓ | 0.35.0 | pnpm standalone install |
| actionlint | workflow lint | ✗ locally | — | run in CI only (pinned binary/action) — no blocker |
| GitHub org `lyra-ds` | D-01 | ✗ (not yet created) | — | none — **guided manual step, user does it in web UI mid-phase** |

**Missing dependencies with no fallback:** GitHub org `lyra-ds` — by design a user-performed step (D-01); the plan must include a `checkpoint:human-verify`-style guided task for org creation before the push task.
**Missing dependencies with fallback:** actionlint (CI-only).

## Validation Architecture

Test framework note: **no unit-test framework is needed or appropriate in Phase 1** — there is no library code. Vitest 4 arrives in Phase 3 per STACK.md. Phase-1 validation is command-based verification of scaffold integrity and platform state.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (shell-based checks); Vitest deferred to Phase 3 by design |
| Config file | n/a |
| Quick run command | `pnpm run lint && pnpm exec changeset status` |
| Full suite command | clean-clone check (below) + `gh pr checks` on the scaffold PR |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OSS-01 | README with pitch/install/snippet + pt-BR mirror | file + content | `test -f README.md && test -f README.pt-BR.md && grep -qi "css-first" README.md && grep -q "@lyra-ds/styles" README.md` | ❌ created this phase |
| OSS-02 | Governance files present | file | `test -f LICENSE && test -f CONTRIBUTING.md && test -f CODE_OF_CONDUCT.md && ls .github/ISSUE_TEMPLATE/*.yml && test -f .github/pull_request_template.md` | ❌ created this phase |
| OSS-03 | PR CI visible + required | platform | `gh pr checks <scaffold-pr>` shows lint/typecheck/test/build; `gh api repos/lyra-ds/lyra/rulesets --jq '.[].name'` | ❌ created this phase |
| OSS-05 | Written 0.x policy incl. API surface | file + content | `test -f VERSIONING.md && grep -q "0.MINOR" VERSIONING.md && grep -q "lyra-" VERSIONING.md && grep -qi "token" VERSIONING.md` | ❌ created this phase |
| SC-5 | Clean clone works | integration | `git clone <repo> /tmp/x && cd /tmp/x && pnpm install --frozen-lockfile && pnpm run build && pnpm run test && pnpm exec changeset status` | ❌ created this phase |

### Sampling Rate
- **Per task commit:** `pnpm run lint` (prettier --check) + relevant `test -f` checks
- **Per wave merge:** `pnpm install --frozen-lockfile && pnpm run build && pnpm run test && pnpm exec changeset status`
- **Phase gate:** clean-clone integration check + `gh pr checks` green on a real PR + ruleset verification via `gh api` before `/gsd-verify-work`

### Wave 0 Gaps
None — no test infrastructure is required for this phase; all validations run with tools already available (`pnpm`, `gh`, coreutils).

## Security Domain

### Applicable ASVS Categories

No application code ships this phase; classic ASVS categories are mostly N/A. What applies is supply-chain and platform hardening:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (platform-level) | GitHub org: user should enable 2FA requirement on org (guided step, cheap now) |
| V3 Session Management | no | — |
| V4 Access Control | yes (repo) | Ruleset on `main`; default `GITHUB_TOKEN` scoped `permissions: contents: read` at workflow top level |
| V5 Input Validation | no code | — (workflow-injection rule below) |
| V6 Cryptography | no | — |
| V14 Config / supply chain | yes | Pinned exact npm versions; actions pinned (SHA for third-party); no secrets in repo; `SECURITY.md` reporting policy |

### Known Threat Patterns for GitHub Actions repos

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Script injection via untrusted event data (`${{ github.event.pull_request.title }}` in `run:`) | Tampering/Elevation | Never interpolate event strings into `run:`; use env vars. Phase-1 workflow uses none — keep it that way; actionlint flags it |
| `pull_request_target` misuse | Elevation | Don't use `pull_request_target` at all in this repo's CI |
| Mutable action tags hijacked | Tampering | Pin third-party actions (pnpm/action-setup, actionlint runner) to full commit SHA; first-party `actions/*` at major tag is acceptable, SHA preferred |
| Over-privileged GITHUB_TOKEN | Elevation | Top-level `permissions: contents: read`; widen per-job only when Phase 7 needs it |
| Malicious/typosquatted dev deps | Spoofing | Legitimacy audit above; exact version pins; lockfile committed; CONTRIBUTING dependency policy |
| Protected-branch bypass | Tampering | Ruleset: block force-push + deletion; no bypass actors in Phase 1 |

## Sources

### Primary (HIGH confidence)
- Local experiment (this session): changesets 2.31.1 `fixed`-group validation with missing packages (exact + glob both fail), success with placeholder stubs; pnpm 11.13 tolerance of unmatched workspace globs
- npm registry via `npm view` (2026-07-16): @changesets/cli 2.31.1, @changesets/changelog-github 0.7.0, prettier 3.9.5, eslint 10.7.0, typescript latest 7.0.2, pnpm 11.13.1
- `gh api` releases (2026-07-16): actions/checkout v7.0.0, actions/setup-node v7.0.0, pnpm/action-setup v6.0.9, changesets/action v1.9.0, rhysd/actionlint v1.7.12
- Local environment probes: node v24.18.0, pnpm 11.13.0, gh 2.96.0 (authenticated), corepack 0.35.0
- Project canon: `handoff/design_handoff_lyra_lib/README.md`, `handoff/assets/github/org-profile.md`, `.planning/research/{STACK,ARCHITECTURE,PITFALLS}.md`, `.planning/config.json`, 01-CONTEXT.md

### Secondary (MEDIUM confidence)
- [GitHub Docs — About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) — rulesets free on public repos; bypass actors require org-owned repo
- [Contributor Covenant 3.0](https://www.contributor-covenant.org/version/3/0/code_of_conduct/) + [OES announcement](https://ethicalsource.dev/blog/contributor-covenant-3/) — current CoC version, released 2025-07-28

### Tertiary (LOW confidence — flagged [ASSUMED] inline)
- GitHub behaviors from training knowledge: never-reporting required checks block merges; PR-branch workflows run on `pull_request`; org creation UI-only; ruleset REST payload shape — all cheap to confirm interactively during execution with `gh api`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified against registry/gh api today
- Changesets scaffold behavior: HIGH — verified by local experiment, not docs-inference
- CI/ruleset mechanics: MEDIUM-HIGH — action versions verified; ruleset API payload and required-check edge behaviors tagged [ASSUMED] with execution-time verification paths
- Governance content: HIGH — canonical sources (Contributor Covenant 3.0, MIT, handoff copy) all identified

**Research date:** 2026-07-16
**Valid until:** ~2026-08-15 (30 days — stable domain; re-check action majors and pnpm patch at execution)
