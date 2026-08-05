# Lot 08-8 — Snapshot release workflow (workflow_dispatch)

## Goal

Create `.github/workflows/snapshot.yml`: a manually-triggered workflow that
publishes `@lyra-ds/styles` and `@lyra-ds/react` to npm under the `snapshot`
dist-tag with versions like `0.0.0-snapshot-<timestamp>`, so contributors can
test a PR's packages without a real release. Nothing is committed, tagged, or
released on GitHub by this workflow.

## Context

- Read `.github/workflows/release.yml` IN FULL before writing anything. It is
  the proven publish path and documents two load-bearing OIDC lessons you MUST
  honor in snapshot.yml:
  1. npm trusted publishing (OIDC) only works when `pnpm publish` runs in a
     TOP-LEVEL workflow step — never nested inside another action's command
     chain. Do NOT use `changesets/action` or `seek-oss/changesets-snapshot`.
  2. `actions/setup-node` must NOT set `registry-url` — that routes auth
     through NODE_AUTH_TOKEN and breaks the OIDC exchange with a 404.
- Reuse release.yml's exact pinned action SHAs, pnpm/node setup steps,
  `NODE_OPTIONS: --max-old-space-size=8192` env, and the
  `if: github.repository == 'lyra-ds/lyra'` fork guard.
- Changesets config: `.changeset/config.json` — packages are `fixed` together,
  `access: public`. Snapshot versioning is `pnpm changeset version --snapshot snapshot`
  (produces `0.0.0-snapshot-<sha/timestamp>` versions). If no changesets exist
  on the ref, `changeset version --snapshot` fails — the workflow must surface
  that as a clear error (a step that checks `.changeset/*.md` besides README
  and exits with a friendly message is acceptable).
- Publish both packages from their directories with
  `pnpm publish --tag snapshot --no-git-checks` (top-level steps, one per
  package, styles first), after `pnpm run build`.
- Trigger: `workflow_dispatch` with one optional input `ref-note`
  (string, description only — shows up in the run name/log for humans; the
  actual ref is whatever the user selects in the dispatch UI).
- Permissions: only `id-token: write` and `contents: read`. No PR, no tags,
  no GitHub Release, no git push.
- Header comment (English, same documentation style as release.yml's header):
  explain what the workflow does, that versions/dist-tag are throwaway, and
  that BOTH packages need `snapshot.yml` added as a trusted publisher on
  npmjs.com before the first run (OIDC trusted publishing is configured per
  workflow file — release.yml's registration does not cover this file).

## Conventions

- This repo pins actions by full commit SHA with a `# vX.Y.Z` comment — copy
  the SHAs from release.yml verbatim.
- pnpm via `pnpm/action-setup`, node 24 via `actions/setup-node` with
  `cache: pnpm`. Install with `pnpm install --frozen-lockfile` if that is what
  release.yml does — mirror it exactly.
- YAML style (indentation, quoting, comment tone) mirrors release.yml.

## Acceptance criteria

- [ ] `.github/workflows/snapshot.yml` exists, valid YAML, `workflow_dispatch`
      only — no `push`/`pull_request` triggers.
- [ ] No use of `changesets/action`, `seek-oss/changesets-snapshot`, or
      `registry-url` anywhere in the file.
- [ ] Publish steps are top-level `run:` steps using
      `pnpm publish --tag snapshot --no-git-checks`, one per package.
- [ ] `changeset version --snapshot snapshot` runs before build; missing
      changesets produce a clear failure message.
- [ ] Fork guard, concurrency group (`snapshot`, cancel-in-progress true is
      fine here), pinned SHAs, NODE_OPTIONS present.
- [ ] Header comment documents the trusted-publisher-per-workflow-file
      requirement.

## Boundaries

- Create ONLY `.github/workflows/snapshot.yml`. Do not touch release.yml,
  ci.yml, deploy.yml, package.json files, or `.changeset/`.
- Do not commit.

## Expected evidence

Report: the full content of snapshot.yml; which parts were copied verbatim
from release.yml (SHAs, setup block) and which are new; any place where you
were uncertain, declared as such.

## Stop conditions

Stop and report instead of improvising if: release.yml's structure contradicts
this brief (e.g., no pinned SHAs to copy), or you believe the snapshot flow
needs to touch files outside the boundary.
