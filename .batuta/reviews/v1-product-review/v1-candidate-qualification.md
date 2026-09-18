# Lyra 1.0.0 release candidate — qualification record (2026-09-18)

Candidate `sourceRevision`: `f688716c16bf6f3f1584ae618f926d0376e65d44` on branch `release/1.0.0-candidate` (from merged main `81714a6`, PR #235). Package archives: React `56ef23c0f2e10fc3d9c6d4be832adf169d1633cb1f92b6f7241a54c895535f32`, Alpine `eda54b2e0e92cda17b3011a3002e861b51bff6a9abc2658b7e73882b14d70969`, Styles `91289e91ebb4a801ed45da3d901bb6c95b3370fd899a4923c66cd534ebcd8558`, all `1.0.0`, reproduced by the bundle gate, an independent `pnpm pack`, the FileUpload evidence producer and the Alpine/media/Dropdown consumers. Plan: `.batuta/plans/v1-release-candidate.md`. Raw evidence: MAIN `.batuta/runs/v1-candidate-20260918/`. Native macOS arm64; Node 24.18.0, pnpm 11.13.1, Playwright 1.62.1 (Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5), Vite 8.2.1.

## Branch composition

| Commit | Content |
| --- | --- |
| `812e92f` | `changeset version`: 46 changesets consumed, Styles/React/Alpine 1.0.0, CHANGELOGs regenerated. Gates, suites and reruns below were measured here; the three archives are byte-identical at every later commit (no package file changed). |
| `a40caeb` | Compatibility guide tables at 1.0.0 (en, pt-BR). |
| `cde21a0` | Core Beta bundle reference (`6b26a35`, React/Styles 0.4.2, Alpine 0.5.0) retired. |
| `f688716` | Candidate bundle reference written (`pnpm baseline:bundles --write`). **Candidate source revision.** |
| `9898b5e` | FileUpload evidence (`pnpm evidence:file-upload`) and accepted pointer. |
| this record | `budgets.mjs` re-pin, V1 Core policy amendment, specification status flips, `schemaVersion: 2` ledger, core evidence artifacts. |

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
| Three-engine source suites | Styles 111/111, React 848/848, Alpine 348/348 in each of Chromium, Firefox and WebKit. |
| 5. Deferrals | Manual AT `deferred-by-release-profile` on every entry; `runtimeEvidence` deferred with basis `numerical-runtime` and decision `.batuta/specs/2026-09-15-v1-runtime-scope-proposal.md` for all eleven P1 components; WebKit plain-Tab Popover qualification stays open in the migration guide; CreateWorkspaceDialog has no Alpine adapter (guide and compatibility string). |

## Ledger

`docs/superpowers/baselines/lyra-v1/program.json` is `schemaVersion: 2`, `releaseStatus: candidate`, `path: null` archives. Eleven components `qualified`, each with 23 `PASS` cells bound to `f688716…` and to hash-verified artifacts under `comparisons/core/f688716c16bf6f3f1584ae618f926d0376e65d44/` (`bundle-budgets.json`, `package-gates.md`, `browsers/*.json`, `alpine-packed.json`, `media-screening.json`, `dropdown-native-tap.json`, `README.md` hash index); Dropdown `coarse-pointer` additionally binds `dropdown-native-tap.json`. Migration guides: `apps/docs/content/docs/{en,pt-BR}/guides/migration-1-0.mdx`. Compatibility: `@lyra-ds/styles =1.0.0`, `@lyra-ds/react =1.0.0` (peer `react >=18 <20`), `@lyra-ds/alpine =1.0.0` (peer `alpinejs >=3.13 <4`). Governing specifications read `**Status:** Implemented` (overlay family, Tabs owned-content, Data and Files). `pnpm v1-release:check`: consistent; `pnpm v1-core:check`: consistent.

## Tool changes in this candidate

- `tools/bundle-baseline/budgets.mjs`: accepted reference revision is the candidate; the one-time standalone/scenario exceptions approved against the Core Beta reference are removed (realized in the reference); the complex entry list is explicit so ceilings stay 3000/1500 bytes. Tests updated to the candidate fixture (42/42).
- `tools/v1-core/check.mjs`: `**Status:** Implemented` accepted for the Data and Files family with the same exact Automated Core evidence requirement (16/16 tests).

Both follow `.batuta/specs/2026-09-18-v1-candidate-reference-and-policy-decisions.md`.

## Limits and boundary

Linux and Windows execution comes from CI on the PR head, not from this record. The Dropdown consumer and media consumer are throwaway installs of the extracted archives; the Alpine packed run uses a controller Vitest config kept in the raw archive, not in the repository. Nothing here merges, versions further or publishes: publication is the maintainer's merge of the candidate PR after every check passes on its exact head.
