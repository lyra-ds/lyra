# Lot sponsors-01 — SponsorKit data pipeline

## Goal

Create the sponsors data pipeline for the lyra-ds org: a pinned `sponsorkit`
setup that regenerates committed sponsor artifacts (`apps/site/data/sponsors.json`

- `apps/site/public/sponsors.svg`), and a scheduled GitHub workflow that runs it
  and opens a PR when the data changed. GitHub Sponsors profile:
  https://github.com/sponsors/lyra-ds (organization).

## Context

- pnpm monorepo, Node 24. Landing site app: `apps/site` (Next.js static export,
  package name `@lyra-ds/site`). Its scripts live in `apps/site/scripts/*.mjs`
  (see `derive-stats.mjs` for the house style: ESM, `node:` imports, explicit
  errors, exported functions + `outputPath` consumed by tests).
- `apps/site/lib/generated/` is **gitignored** — committed sponsor data must NOT
  go there. Use `apps/site/data/sponsors.json` (committed) and
  `apps/site/public/sponsors.svg` (committed only when there are sponsors).
- `sponsorkit@18.0.0` is ALREADY installed as an exact devDependency of
  `apps/site` (done by the maestro; do not touch the lockfile or run pnpm add).
- SponsorKit facts (from its README, v18): config file `sponsorkit.config.ts`
  with `defineConfig` from `'sponsorkit'`; provider config
  `github: { login: 'lyra-ds', type: 'organization' }`; env var
  `SPONSORKIT_GITHUB_TOKEN` (scopes `read:user` + `read:org`); `formats` may
  include `'json'` and `'svg'`; `outputDir` controls where files are written;
  output basename default is `sponsors` (`sponsors.json`, `sponsors.svg`).
  Tier presets: `tierPresets` export.
- Existing workflows: `.github/workflows/{ci.yml,deploy.yml,release.yml}`.
  House style (see deploy.yml): actions pinned by full SHA with version
  comment, `pnpm/action-setup` + `actions/setup-node` node-version 24 with
  pnpm cache, `pnpm install --frozen-lockfile`, comments explaining every
  non-obvious decision. Never a floating `npx` — run binaries via `pnpm exec`
  / package scripts.
- `main` is a protected branch (PR + green checks + 1 approval required).
  The scheduled workflow must therefore open a PR with the regenerated
  artifacts, NEVER push to main directly. `gh` CLI is available on
  ubuntu-latest runners; `GITHUB_TOKEN` can create branches and PRs when the
  workflow declares `permissions: contents: write, pull-requests: write`.
- The repo convention for PRs: assignee `franciscpd`, labels exist including
  `docs site`, `github_actions`, `enhancement`.

## Conventions

- Follow `.claude/CLAUDE.md` constraints (CSS-first DS; this lot touches no
  DS package code).
- Exact versions only (`save-exact`); engines Node `>=24 <25`.
- Conventional commits are handled by the maestro — do NOT commit.
- Comments in workflows/scripts: English, explain the why (house style).

## Deliverables

1. `apps/site/sponsorkit.config.ts` — org `lyra-ds`, JSON + SVG output, at
   least two tiers (Backers / Sponsors $10+; add higher tiers if trivial),
   past-sponsors tier included.
2. `apps/site/scripts/update-sponsors.mjs` — runs sponsorkit (via its
   programmatic API or `pnpm exec sponsorkit`), then places the outputs at the
   committed contract paths: `apps/site/data/sponsors.json` (always, `[]` when
   no sponsors) and `apps/site/public/sponsors.svg` (present only when at
   least one sponsor; delete it when the count is zero). Add an npm script
   `update-sponsors` in `apps/site/package.json` wiring it.
3. Placeholder committed now: `apps/site/data/sponsors.json` containing `[]`.
   No placeholder SVG.
4. `.github/workflows/sponsors.yml` — triggers: `schedule` (weekly) +
   `workflow_dispatch`. Steps: checkout, pnpm + node 24 setup, frozen install,
   run the update script with `SPONSORKIT_GITHUB_TOKEN: ${{ secrets.SPONSORKIT_GITHUB_TOKEN }}`,
   and if `git status --porcelain` shows changes under the two contract paths,
   create/refresh a branch `chore/sponsors-data`, commit the two paths only,
   and open (or update) a PR to main titled `chore: refresh sponsors data`
   with assignee `franciscpd` and labels `docs site`. No changes → workflow
   ends green with no PR. The workflow must fail loudly if the secret is
   missing (clear error, not a silent empty regeneration).

## Acceptance criteria

- `node apps/site/scripts/update-sponsors.mjs` with NO token exits non-zero
  with a clear message naming `SPONSORKIT_GITHUB_TOKEN` (never writes empty
  data over real data in that case).
- `apps/site/data/sponsors.json` exists and parses as `[]`.
- `pnpm --filter @lyra-ds/site run lint` and `pnpm run lint` (prettier check)
  pass.
- `sponsors.yml` parses (valid YAML), pins actions by SHA, declares the
  minimal permissions listed above, and only ever commits the two contract
  paths.
- No edits outside the Scope list.

## Boundaries

- Do NOT touch: `pnpm-lock.yaml`, `packages/**`, `apps/docs/**`, `handoff/**`,
  `tools/**`, `.github/workflows/{ci,deploy,release}.yml`, any component or
  page of `apps/site` (the landing section is a separate lot).
- Do not run `pnpm install`/`pnpm add` (offline sandbox; deps are ready).
- Do not commit; leave the worktree dirty.

## Scope (closed list)

- `apps/site/sponsorkit.config.ts` (new)
- `apps/site/scripts/update-sponsors.mjs` (new)
- `apps/site/data/sponsors.json` (new)
- `apps/site/package.json` (only the `scripts` block — the sponsorkit devDep
  line is already there)
- `.github/workflows/sponsors.yml` (new)

Do not change anything outside this list; if the task requires it, stop and
report.

## Expected evidence

Report: files created/changed; the exact commands you ran with their real
output (at minimum the no-token failure run of `update-sponsors.mjs` and the
lint runs, if the sandbox allows them); any criterion you could NOT verify in
the sandbox, declared as such — never reported as passing.

## Stop conditions

Stop and report instead of improvising when: the sponsorkit API surface does
not match the Context facts; the same command fails twice; or satisfying the
task would require edits outside Scope.
