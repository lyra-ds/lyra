# Lot sponsors-03 — zero-sponsor run fixes

## Goal

Fix two defects revealed by the first real run of `.github/workflows/sponsors.yml`
(run 31235146067, zero sponsors):

1. `apps/site/scripts/update-sponsors.mjs` — sponsorkit writes
   `apps/site/data/sponsors.json` as `[]` with NO trailing newline; the
   committed placeholder is `[]\n`. Every zero-change run therefore produces a
   spurious diff. After the sponsorkit run, the script must rewrite
   `data/sponsors.json` deterministically as
   `JSON.stringify(parsedArray, null, 2) + '\n'` (prettier-compatible: 2-space
   indent, trailing newline) so byte-identical data produces no git diff.
2. `.github/workflows/sponsors.yml`, step "Refresh the sponsors data pull
   request" — `git add apps/site/data/sponsors.json apps/site/public/sponsors.svg`
   is fatal when `sponsors.svg` does not exist
   (`fatal: pathspec ... did not match any files`, exit 128). Stage with
   pathspecs that cannot fail and still capture an svg deletion:
   `git add -A -- apps/site/data/sponsors.json` always, and stage the svg only
   when the file exists on disk OR is currently tracked (deletion case).

## Context

- The script's contract and structure: see the file itself; keep its style
  (ESM, explicit errors) and its existing exports/flow. The rewrite happens in
  `updateSponsors()` right after the JSON is parsed/validated, before the SVG
  handling, so both the empty and populated branches emit normalized JSON.
- The workflow's detection step already scopes to the two contract paths and
  is correct; only the staging inside the PR step is broken.
- Actions in this repo run scripts with `bash -e`; any command returning
  non-zero kills the step.

## Conventions

- `.claude/CLAUDE.md` applies. English comments explaining why, house style.
- Do not commit.

## Acceptance criteria

- With a pre-existing `data/sponsors.json` of `[]\n`, simulating a sponsorkit
  output of `[]` (no newline) followed by the script's normalization yields a
  file byte-identical to `[]\n` (prove with a small local simulation: write
  `[]` to the file, run the normalization code path or a node -e equivalent,
  `xxd` shows `5b5d 0a`).
- A local shell simulation of the staging logic with NO sponsors.svg present
  exits 0 and stages only the json; with an svg present it stages both; with a
  tracked svg deleted it stages the deletion. Show the three runs.
- `node apps/site/scripts/update-sponsors.mjs` without token still fails with
  the SPONSORKIT_GITHUB_TOKEN message (behavior unchanged).
- `pnpm --filter @lyra-ds/site run lint`, root `pnpm run lint` pass; YAML
  still parses.

## Boundaries

Do NOT touch anything except the two Scope files. Test laws apply.

## Scope (closed list)

- `apps/site/scripts/update-sponsors.mjs`
- `.github/workflows/sponsors.yml`

Do not change anything outside this list; if the task requires it, stop and
report.

## Expected evidence

Files touched; commands run with real output (the xxd proof and the three
staging simulations); anything unverifiable declared as such.

## Stop conditions

Stop and report when: the same command fails twice, or the fix needs edits
beyond Scope.
