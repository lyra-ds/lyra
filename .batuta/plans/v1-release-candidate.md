# Plan — Lyra 1.0.0 release candidate
**Goal:** Produce, bind and qualify the exact 1.0.0 candidate for `@lyra-ds/styles`, `@lyra-ds/react` and `@lyra-ds/alpine`, so that one explicit maintainer merge publishes it.
**Created:** 2026-09-18 · **Status:** in progress — tasks 1–11 done on 2026-09-18; task 12 (PR B qualification) next; task 13 is the maintainer merge
**Base:** origin/main `c397575` (PR #234). Worktree `../lyra-v1-acceptance`.

## Release mechanics that shape this plan

`.github/workflows/release.yml` publishes to npm on a push to `main` only when (a) no changeset remains and (b) a package's local version differs from the published one. Therefore a commit that carries the 1.0.0 versions cannot exist on `main` without publishing. The candidate is built on a branch whose first commit is the `changeset version` result; the ledger, evidence and specification flips follow on the same branch; CI qualifies the exact head; the maintainer's merge of that PR is the final authorization and the publication act (program specification §11). The open Version Packages PR #224 is never merged; it disappears when the candidate PR removes the changesets.

Two PRs, in order:

1. **PR A — migration guides and major changesets** (no version change, no publication). Merging it makes PR #224 preview 1.0.0 for all three packages.
2. **PR B — the candidate** (`release/1.0.0-candidate`): version commit, refreshed evidence, `schemaVersion: 2` ledger, specification status flips, compatibility table. Merge only after CI is green on the exact head and the maintainer authorizes publication explicitly.

## Fixed constraints

- No new dependency, CI job, producer or test per ledger cell. Evidence is reruns of existing commands and retained scripts on the exact candidate archives (reconciliation record, refresh obligations 1–5).
- Candidate archives are not tracked (`path: null`, 2026-09-18 decision). Identity is the ledger SHA-256 plus the bundle gate's repack cross-check in CI.
- Manual AT stays `deferred-by-release-profile`. Overlay/Tabs/DataTable numerical runtime stays a `numerical-runtime` deferral pointing at `.batuta/specs/2026-09-15-v1-runtime-scope-proposal.md`. FileUpload numerical evidence is mandatory and must bind the candidate React/Styles hashes.
- No Colima/Docker changes; Linux/Windows/macOS matrices come from CI on the PR head.
- Every producer that checks for a clean tree runs at the version commit before any other commit on the branch.

## Tasks

- [ ] 1. Author the consolidated 1.0 migration guide in both locales and the three major changesets — docs/medium (Codex `gpt-5.6-terra`)
      Scope: apps/docs/content/docs/{en,pt-BR}/guides/migration-1-0.mdx, apps/docs/lib/guides.ts, apps/docs/messages/{en,pt-BR}.json, .changeset/v1-{styles,react,alpine}-major.md
      Brief: `.batuta/v1-migration-guide-brief.md`. Source of truth: the 43 pending `.changeset/*.md`, public interfaces of Tabs/DataTable/CreateWorkspaceDialog/WorkspaceSwitcher, Alpine Tabs fallback markup, overlay design clause 3 (inline overflow resolved by alignment flip only).
      Sections: intro and versions; React Tabs (breaking); React DataTable (breaking); React CreateWorkspaceDialog (breaking, no Alpine adapter); Alpine Tabs markup (breaking); WorkspaceSwitcher selectors; overlays (additive: `returnFocusTo`, `initialFocusTo`, containment, anchored scrolling, alignment flip, Tooltip coarse-pointer rule); Styles additive; known issues and removal timing.
      Accept: `pnpm --filter @lyra-ds/docs run build` succeeds and both locale routes render → controller proof; no slug collision → module-load assertion; `pnpm exec changeset status` lists the three packages as major → controller proof; prose review 3/3 DONE by OpenCode GLM → independent review.
- [x] 2. (folded into task 1) Major changesets ship in the same PR.
- [x] 3. Open, verify and merge PR A — release/critical
      Depends on: 2
      Scope: git branch `docs/v1-migration-guides`, PR with labels `documentation`, `pkg: styles`, `pkg: react`, `pkg: alpine`
      Accept: 9/9 checks on the exact head → CI; review findings adjudicated → controller; squash-merged (title checked against "version packages") → controller; PR #224 refreshed to 1.0.0 for all three packages → `gh pr view 224`.

- [x] 4. Create the version commit — release/critical
      Depends on: 3
      Scope: branch `release/1.0.0-candidate` from the merged main; `GITHUB_TOKEN=$(gh auth token) pnpm exec changeset version`; commit `chore(release): version packages 1.0.0`
      Accept: `packages/{styles,react,alpine}/package.json` at 1.0.0, CHANGELOGs regenerated, `.changeset/*.md` consumed → controller proof; tree clean at the commit `R` (the candidate `sourceRevision`) → `git status --porcelain` empty.
- [x] 5. FileUpload numerical evidence on the candidate pair — evidence/critical
      Depends on: 4
      Scope: `pnpm evidence:file-upload` at clean `R`, then `pnpm baseline:bundles --accept-comparison file-upload`; commit `docs/superpowers/baselines/lyra-v1/comparisons/file-upload/R{.json,.md,-runtime.json,-runtime.md}` and `current.json`
      Accept: six operations PASS with unchanged limits (p95 ≤ 100 ms, worst < 250 ms, longest task < 50 ms; 100 items, 20 active attempts, ≥ 30 samples) → producer output; `comparison.result === 'pass'`, `after.revision === R`, React/Styles hashes equal the fresh pack → controller proof.
- [x] 6. Package, consumer and compatibility gates on the candidate — evidence/critical
      Depends on: 4
      Scope: `pnpm build`; `pnpm baseline:bundles --check-budgets` (records the three fresh SHA-256); `pnpm test:react-compat` (React 18.3.1 and 19.2.8, 11 named P1 SSR/hydration cases each); `pnpm pack-smoke`; `pnpm smoke`; publint ×3; attw React/Alpine; size-limit React/Alpine; dist-scan ×3; `pnpm test`; `pnpm parity`
      Raw outputs to MAIN `.batuta/runs/v1-candidate-<date>/`.
      Accept: every command exits 0 and names the same three archive hashes → controller proof; `check-budgets` result `pass` 72/5/4 → gate output.
- [x] 7. Three-engine source suites on the candidate — evidence/critical
      Depends on: 4
      Scope: `pnpm test:browsers` (Styles, React, Alpine × Chromium/Firefox/WebKit) with `--reporter=json` outputs per package and engine
      Accept: zero failed tests per engine; WebKit results named with any pre-existing recorded failures → controller proof.
- [x] 8. Packed Alpine public run — evidence/critical
      Depends on: 6
      Scope: recreate the temporary consumer and Vitest config described in `.batuta/reviews/v1-product-review/alpine-packed-runtime.md` (extracted candidate Alpine and Styles archives under a temporary `node_modules/@lyra-ds/`, source-module load guard), run the Alpine browser suites against it in three engines, remove the temporary resources
      Accept: all cases PASS in three engines with module-load records pointing at the extracted archives whose hashes equal the ledger → controller proof; tracked tree unchanged → `git status`.
- [x] 9. Retained media screening and Dropdown native tap on the candidate — evidence/critical
      Depends on: 6
      Scope: `.batuta/runs/final-media-screening-20260916/p1-media.mjs` with the consumer at `../lyra-v1-touch/.batuta/p1-media-consumer` pointed at the candidate archives (6 profiles × 3 engines × 11 fixtures); `.batuta/runs/dropdown-native-tap-20260915/verification.mjs` with its retained fixture on the candidate React/Alpine/Styles
      Accept: no page errors, axe violations or failed assertions in the screening; six Dropdown tap cases PASS → controller proof; temporary consumers removed.
- [x] 10. Candidate binding artifacts — evidence/critical
      Depends on: 5, 6, 7, 8, 9
      Scope: `docs/superpowers/baselines/lyra-v1/comparisons/core/R/` with `acceptance.json` (one entry per component × cell naming the report that proves it), `bundle-budgets.json`, `react-compat.json`, `browsers/<package>-<engine>.json`, `package-gates.md`, `alpine-packed.json`, `media-screening.json`, `dropdown-native-tap.json`, `README.md` with the hash index. Keep each file bounded (summaries and per-case verdicts, not raw logs).
      Accept: every referenced artifact is Git-tracked under the core directory and its SHA-256 is recorded → controller proof; raw logs stay in MAIN `.batuta/runs/`.
- [x] 11. Ledger `schemaVersion: 2`, specification status flips, compatibility table — release/critical
      Depends on: 10
      Scope: `docs/superpowers/baselines/lyra-v1/program.json` (candidate block with `path: null`, 11 components `qualified`, 23 cells each `{result:'PASS', revision:R, artifact, sha256}`, `migrationGuides` en/ptBR paths, `compatibility` strings, `immutableEvidence` `{path, sha256}`, `runtimeEvidence` deferred `numerical-runtime`); `docs/superpowers/specs/2026-08-30-overlay-family-design.md` and `.batuta/specs/2026-09-10-tabs-owned-content-design.md` gain `**Status:** Implemented`; `apps/docs/content/docs/{en,pt-BR}/guides/compatibility.mdx` current versions and tested row at 1.0.0; `docs/superpowers/baselines/lyra-v1/README.md` candidate note; `.batuta/reviews/v1-product-review/v1-candidate-qualification.md`
      Accept: `pnpm v1-release:check` prints the consistent message → gate; `pnpm baseline:bundles --check-budgets` reports `candidateBinding` matched for the three packages → gate; `pnpm v1-core:check`, `pnpm lint`, `node --test tools/v1-release/check.test.mjs` pass → controller proof.
- [ ] 12. Open PR B and qualify the exact head — release/critical
      Depends on: 11
      Scope: PR `release/1.0.0-candidate` → `main`, labels `pkg: styles`, `pkg: react`, `pkg: alpine`, `documentation`; body lists the three hashes, R, and the evidence directory
      Accept: 9/9 checks on the exact head including native Linux/Windows/macOS → CI; review findings adjudicated with any fix followed by a fresh 9/9 → controller. **Stop here.** Report to the maintainer; do not merge.

- [ ] 13. Publication (maintainer only) — release/critical
      Depends on: 12
      The maintainer merges PR B. Release workflow publishes Styles, React and Alpine 1.0.0 with provenance, pushes tags and creates GitHub Releases. Controller then verifies `npm view @lyra-ds/<pkg> version` = 1.0.0, attaches the exact tarballs and ledger hashes to the GitHub Release if the maintainer wants durable copies, confirms PR #224 closed, and records the outcome in `WORK.md`.

## Decisions and context

- One consolidated guide per locale (`guides/migration-1-0.mdx`), decided by the maintainer on 2026-09-18: only five contract changes break consumers (React Tabs, DataTable, CreateWorkspaceDialog, Alpine Tabs markup, WorkspaceSwitcher selector); the rest is additive. All eleven ledger components point at the same tracked file per locale; the checker requires tracked paths, not one file per stream.
- `compatibility` strings per component are the exact tested tuple: `@lyra-ds/styles =1.0.0`, `@lyra-ds/react =1.0.0` (peer `react >=18 <20`), `@lyra-ds/alpine =1.0.0` (peer `alpinejs >=3.13 <4`); CreateWorkspaceDialog records Alpine as the tested Styles/React tuple with an explicit "no Alpine adapter" note in the guide, because the checker requires a non-empty string for all three packages and overlay components cannot declare `notApplicable`.
- Starters (`lyra-ds/starter-next`, `lyra-ds/starter-vite`) are verified after publication with `--config.minimum-release-age=0`; they need the published packages, so they are post-merge evidence, not candidate cells. `pnpm smoke` (Vite/Next/CommonJS) satisfies the packed-consumer cells.
- The 9 P1 overlay components, Tabs and DataTable all sit in `P1_IDS`, so the `numerical-runtime` deferral is accepted by the checker for every entry.
- Standing authorization covers PR A (documentation and changesets, no version change). PR B is opened and qualified under this plan once approved; its merge is the maintainer's explicit publication decision and is never automated.

## Execution notes — 2026-09-18

- PR A merged as `81714a6` (#235). Version commit R = `812e92f`; compatibility docs `a40caeb`; reference retired `cde21a0`; reference written `f688716` = candidate `sourceRevision`; FileUpload evidence accepted `9898b5e`.
- Two maintainer decisions taken during execution are recorded in `.batuta/specs/2026-09-18-v1-candidate-reference-and-policy-decisions.md`: bundle reference promotion (with the `budgets.mjs` re-pin and exception retirement it entails) and the V1 Core policy amendment accepting `**Status:** Implemented` for the Data and Files family.
- Gates, suites and reruns were measured on `812e92f`; the three package archives are byte-identical (same SHA-256) at the source revision because only documentation and baseline files changed in between. Raw evidence: MAIN `.batuta/runs/v1-candidate-20260918/`.
