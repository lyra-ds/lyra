# Lyra 1.0.0 release candidate — qualification record (2026-09-18)

Candidate `sourceRevision`: `cd282f198151a7901aad86ff837c4367e9f163cd` (the published `main` squash commit; first bound on the branch as `aae3e0e…`, see Rebinding below) on branch `release/1.0.0-candidate` (from merged main `81714a6`, PR #235). Package archives (identity = SHA-256 of the decompressed tar stream, decision 3): React `a86150e8f3c922073abc5e6e835b780e5604537d28b209815b2c1a44b96b99c2`, Alpine `dfef35092b979441e1399c71368ec973c45974124c6f1495800e7a12b93d9969`, Styles `9deeccbe16a532a8dfb3d60cd41e9a2627802d07cf38d90aebd0b28547a7e6ff`, all `1.0.0`; the same tar-stream hashes were produced on the native macOS host and by the Linux CI diagnostic, while the `.tgz` bytes differ only in the gzip header platform byte. The `.tgz` hashes measured locally (React `56ef23c0…`, Alpine `eda54b2e…`, Styles `91289e91…`) identify the same archives. Plan: `.batuta/plans/v1-release-candidate.md`. Raw evidence: MAIN `.batuta/runs/v1-candidate-20260918/`. Native macOS arm64; Node 24.18.0, pnpm 11.13.1, Playwright 1.62.1 (Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5), Vite 8.2.1.

## Branch composition

| Commit | Content |
| --- | --- |
| `812e92f` | `changeset version`: 46 changesets consumed, Styles/React/Alpine 1.0.0, CHANGELOGs regenerated. Gates, suites and reruns below were measured here; the three archives are identical (same decompressed tar SHA-256) at every later commit (no package file changed). |
| `a40caeb` | Compatibility guide tables at 1.0.0 (en, pt-BR). |
| `cde21a0`, `f688716`, `9898b5e` | First reference promotion and FileUpload evidence under the `.tgz` identity (superseded below; kept in history). |
| `3bbe868`, `3d242a5` | First qualification and review fix under the `.tgz` identity (ledger since regenerated). |
| `496506b`, `5178dbb` | CI: full-history checkout (`fetch-depth: 0`) for the ancestry checks; `safe.directory` in the Playwright container job. |
| `171944c` | Tar-stream artifact identity in the tools (decision 3); `.tgz`-hash reference retired; CI diagnostic removed. |
| `aae3e0e` | Candidate bundle reference written under the tar-stream identity. **Candidate source revision.** |
| `3588aa8` | FileUpload evidence (`pnpm evidence:file-upload`) and accepted pointer under the tar-stream identity. |
| this record | `budgets.mjs` re-pinned to `aae3e0e`, ledger regenerated with tar-stream hashes, core evidence moved to `comparisons/core/aae3e0e…/`. |

## Evidence

| Obligation (reconciliation record) | Result |
| --- | --- |
| 1. Pack and bind; `pnpm baseline:bundles --check-budgets` | `pass`, 72 standalone (71 React + Alpine), 5 scenarios, 4 CSS; zero Brotli deltas against the candidate reference; `candidateBinding` matches the ledger for all three packages. |
| 2. `pnpm test:react-compat` | React 18.3.1 and 19.2.8: types, build, ssr, hydration, browser, p1-ssr, p1-browser passed (11 named P1 SSR and hydration cases each). |
| 2. Package and consumer gates | build, docgen ×3, blade-api, publint ×3, pack-smoke, attw ×2, size-limit ×2, dist-scan ×3, smoke (Vite/Next/CommonJS), parity, icon-registry, `pnpm test` 349/349 — 22/22 exit 0. CI lint-job checks (phase0, release-policy, v1-core, v1-release, stylelint, eslint ×3) pass locally on the final tree. |
| 2. Packed Alpine public run | 341/341 per engine against the extracted 1.0.0 Alpine and Styles archives; negative control (extracted ESM replaced by a no-op plugin) fails 1/20; extracted bytes hash-verified before and after; module loads name `dist/index.js`, never `src/index.ts`. |
| 3. FileUpload numerical producer | Six operations PASS at `f688716` on the candidate React/Styles pair: p95 ≤ 1.2 ms, worst ≤ 1.7 ms, longest task 0 ms; 100 items, 20 active attempts, 3 warm-up + 30 samples; bundle comparison `pass` with zero deltas; pointer accepted. |
| 4. `p1-media.mjs` screening | 18 engine×profile cases (axe light/dark, forced-colors, reduced-motion, RTL, coarse pointer × 3 engines), 195 scenario observations over the 11 P1 fixtures, 0 page errors, 0 axe violations. |
| 4. Dropdown native tap | 6/6 (React and Alpine × 3 engines): trusted touch open, exactly-once selection, trigger focus restoration, outside-tap dismissal, interception control detected. |
| Tooltip native tap (retained `v1-media-next-20260915` script, rerun on the candidate archives) | 6/6 (React and Alpine × 3 engines): the tap keeps the native action exactly once, no hover tooltip is emulated, interception control detected. Tooltip owners are byte-identical since `e9b6cd6`. |
| Three-engine source suites | Styles 111/111, React 848/848, Alpine 348/348 in each of Chromium, Firefox and WebKit; `component-suites.json` attributes the owned React/Alpine/Styles suites to each P1 component per engine (all 0 failures). |
| 5. Deferrals | Manual AT `deferred-by-release-profile` on every entry; `runtimeEvidence` deferred with basis `numerical-runtime` and decision `.batuta/specs/2026-09-15-v1-runtime-scope-proposal.md` for all eleven P1 components; WebKit plain-Tab Popover qualification stays open in the migration guide; CreateWorkspaceDialog has no Alpine adapter (guide and compatibility string). |

## Ledger

`docs/superpowers/baselines/lyra-v1/program.json` is `schemaVersion: 2`, `releaseStatus: candidate`, `path: null` archives. Eleven components `qualified`, each with 23 `PASS` cells bound to `aae3e0e…` and to hash-verified artifacts under `comparisons/core/aae3e0e1e89ba2f642e5463038d5d3da7d35d4a0/` (`component-suites.json` for the three engines, `keyboard-focus` and `ltr`; `package-gates.md` for React 18/19, SSR, hydration, packed and consumer cells; `bundle-budgets.json` with the ledger binding for the bundle cells; `media-screening.json` for axe, forced-colors, reduced-motion, RTL and coarse-pointer; `dropdown-native-tap.json` and `tooltip-native-tap.json` for those two components' `coarse-pointer`; `alpine-packed.json`, `browsers/*.json` and the `README.md` hash index as immutable evidence). The core `README.md` states the cell mapping, including that Dialog has no standalone Size Limit entry of its own (its bytes are measured through `create-workspace-dialog`, the shared modal core of `drawer`/`bottom-sheet` and the `overlays` composition) — a standalone Dialog budget is a post-1.0 follow-up. Migration guides: `apps/docs/content/docs/{en,pt-BR}/guides/migration-1-0.mdx`. Compatibility: `@lyra-ds/styles =1.0.0`, `@lyra-ds/react =1.0.0` (peer `react >=18 <20`), `@lyra-ds/alpine =1.0.0` (peer `alpinejs >=3.13 <4`). Governing specifications read `**Status:** Implemented` (overlay family, Tabs owned-content, Data and Files). `pnpm v1-release:check`: consistent; `pnpm v1-core:check`: consistent.

## Tool changes in this candidate

- `tools/bundle-baseline/measure.mjs` and `tools/file-upload-performance/measure.mjs`: packed artifact identity is `artifactSha256` = SHA-256 of the decompressed tar stream (a corrupted or non-gzip archive gets a distinct deterministic identity); test proves the gzip OS-byte flip leaves the identity unchanged while content changes do not.
- `.github/workflows/ci.yml`, `.github/workflows/native-contributors.yml`: `fetch-depth: 0` on every checkout and `safe.directory` in the container job, so the ancestry checks can run in CI.

- `tools/bundle-baseline/budgets.mjs`: accepted reference revision is the candidate; the one-time standalone/scenario exceptions approved against the Core Beta reference are removed (realized in the reference); the complex entry list is explicit so ceilings stay 3000/1500 bytes. Tests updated to the candidate fixture (42/42).
- `tools/v1-core/check.mjs`: `**Status:** Implemented` accepted for the Data and Files family with the same exact Automated Core evidence requirement (16/16 tests).

Both follow `.batuta/specs/2026-09-18-v1-candidate-reference-and-policy-decisions.md`.

## Independent review

OpenCode GLM 5.3 Flash read-only review of the tool/spec diff, ledger and core artifacts: budget-gate policy DONE, V1 Core policy DONE; two findings accepted and closed here (engine/keyboard/ltr cells now bind per-component suite evidence; Tooltip `coarse-pointer` binds a fresh native tap proof; the bound bundle report now carries the ledger binding; Dialog standalone coverage disclosed in the core README). One finding declined with evidence: the gate's accepted reference is the pointer's comparison `after` (`resolveBaselineReference`), so `REFERENCE_REVISION` = `aae3e0e…` is correct while `bundles.json` records the retirement commit `cde21a0` as the FileUpload comparison's `before`; `pnpm baseline:bundles --check-budgets` passed twice on this branch.

## Publication — 2026-09-19

The maintainer authorized the admin merge; the controller verified head `4e6cab01e25e4eba38653b7d399c0580cdf779bf`, 9/9 checks and a non-Version-Packages title, then squash-merged PR #236 as `cd282f1` (18:08:44Z). Release run 35460259331: `changeset publish` published all three packages at 1.0.0, tags `@lyra-ds/{styles,react,alpine}@1.0.0` pushed, GitHub Releases created (18:10:53–55Z); the docs deploy on `cd282f1` succeeded. Registry `latest` is 1.0.0 for all three; the downloaded tarballs' decompressed tar SHA-256 equal the ledger (Styles `9deeccbe…`, React `a86150e8…`, Alpine `dfef3509…`) while their `.tgz` bytes carry the Linux gzip header byte. PR #224 was closed as obsolete. `starter-next` (4/4 static pages) and `starter-vite` (`tsc --noEmit`, `vite build`) build against the published 1.0.0 from clones outside the monorepo with `--config.minimum-release-age=0`; both starter repositories still pin `^0.4.0` and need their own bump. Open follow-ups: standalone Dialog Size Limit entry (post-1.0), starter bumps.

## Rebinding to the published `main` commit — 2026-09-19

PR #236 was squash-merged, so the branch commit `aae3e0e1e89ba2f642e5463038d5d3da7d35d4a0` that the ledger named as `sourceRevision` is not reachable from `main`; `pnpm v1-release:check` and `pnpm baseline:bundles --check-budgets` then fail on `main` and on every later PR with `candidate sourceRevision is not an ancestor of HEAD` (main CI run on `cd282f1` red; documentation PR #237 red). Repair under the standing bug-repair authorization: the ledger now binds `sourceRevision` `cd282f198151a7901aad86ff837c4367e9f163cd`, the squash commit that the Release workflow built and published. The three package archives are identical on both commits (decompressed tar SHA-256 Styles `9deeccbe…`, React `a86150e8…`, Alpine `dfef3509…`, equal to the registry tarballs). The FileUpload evidence was re-produced on `cd282f198151a7901aad86ff837c4367e9f163cd` itself and the pointer accepted; `tools/bundle-baseline/budgets.mjs` and its test fixture were re-pinned; the core evidence moved to `comparisons/core/cd282f198151a7901aad86ff837c4367e9f163cd/` with regenerated hash-bound summaries and a fresh bundle report carrying the ledger binding. Lesson recorded for the mechanism: under a squash-merge policy the candidate `sourceRevision` must be a `main` commit, so the release ledger is finalized (or rebound) after the candidate lands, not only on the candidate branch.

## Limits and boundary

Linux and Windows execution comes from CI on the PR head, not from this record. The Dropdown consumer and media consumer are throwaway installs of the extracted archives; the Alpine packed run uses a controller Vitest config kept in the raw archive, not in the repository. Nothing here merges, versions further or publishes: publication is the maintainer's merge of the candidate PR after every check passes on its exact head.
