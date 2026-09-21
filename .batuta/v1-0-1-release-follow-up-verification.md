# Lyra 1.0.1 release follow-up — verification handoff

**Date:** 2026-09-21  
**Plan:** `.batuta/plans/v1-0-1-release-follow-up.md`  
**Worktree:** `/home/francisross/Projects/lyra-ds/lyra-v1-0-1-release-follow-up`  
**Branch:** `feat/v1-0-1-release-follow-up`  
**Base commit:** `0b76f55d2f6f972e4e6a863cf9b53984727ff296`  
**Current HEAD:** `0b76f55d2f6f972e4e6a863cf9b53984727ff296`  
**`origin/main`:** `0b76f55d2f6f972e4e6a863cf9b53984727ff296`

The base, current HEAD, and `origin/main` are identical because this handoff intentionally stops with an uncommitted working tree. No commit, push, pull request, merge, versioning command, publication, or remote workflow dispatch was performed.

## Delivered package surfaces

- `@lyra-ds/styles` — patch changeset for CSS-only AppSidebar width defaults, compact WorkspaceSwitcher brand presentation in icon rails, and reduced-motion behavior.
- `@lyra-ds/react` — patch changeset because shipped source JSDoc and generated API artifacts now document AppSidebar/Shell width precedence.
- `@lyra-ds/alpine` — unchanged.

`pnpm exec changeset status` reports only `@lyra-ds/styles` and `@lyra-ds/react` as patch releases. No package version was changed and `changeset version` was not run.

## Changed files

### Product and tests

- `packages/styles/components/navigation/navigation.css`
- `packages/styles/tests/app-sidebar.test.ts`
- `packages/react/src/app-sidebar/app-sidebar.browser.test.tsx`
- `packages/react/src/app-sidebar/app-sidebar.tsx`
- `packages/react/src/shell/shell.tsx`
- `tools/parity/parity.mjs`

### Generated API artifacts

- `tools/docgen/output/llms.txt`
- `tools/docgen/output/props.json`

### Local browser infrastructure

- `package.json`
- `compose.playwright.yml`
- `tools/phase1/browser-matrix.mjs`
- `tools/phase1/browser-matrix.test.mjs`
- `CONTRIBUTING.md`

### Documentation

- `apps/docs/content/docs/en/components/app-sidebar.mdx`
- `apps/docs/content/docs/en/components/shell.mdx`
- `apps/docs/content/docs/en/components/workspace-switcher.mdx`
- `apps/docs/content/docs/en/guides/compatibility.mdx`
- `apps/docs/content/docs/en/guides/support.mdx`
- `apps/docs/content/docs/pt-BR/components/app-sidebar.mdx`
- `apps/docs/content/docs/pt-BR/components/shell.mdx`
- `apps/docs/content/docs/pt-BR/components/workspace-switcher.mdx`
- `apps/docs/content/docs/pt-BR/guides/compatibility.mdx`
- `apps/docs/content/docs/pt-BR/guides/support.mdx`

### Release and evidence

- `.changeset/bright-rivers-rest.md`
- `.batuta/plans/v1-0-1-release-follow-up.md`
- `.batuta/v1-0-1-release-follow-up-verification.md`

`WORK.md` was not changed because this plan does not require a separate checkpoint entry and this focused handoff is the repository-owned resume/evidence artifact.

## Implemented contracts

1. CSS-only `.lyra-appsidebar` defaults to `260px` through `--appsidebar-width`.
2. CSS-only `.lyra-appsidebar--rail` defaults to `64px`.
3. Consumer `--appsidebar-width` overrides remain authoritative.
4. A direct AppSidebar in a content-scroll Shell owns the sidebar rail width; ordinary content-scroll rails still use `--shell-sidebar`, and page-scroll Shell behavior is unchanged.
5. A WorkspaceSwitcher in an AppSidebar icon rail becomes a 44×44 compact avatar trigger. Its text remains in the accessibility tree, its chevron does not consume layout, and its opened popover remains usable within a 320px LTR or RTL viewport.
6. `prefers-reduced-motion: reduce` removes AppSidebar width interpolation while preserving immediate final geometry.
7. React source JSDoc, generated API artifacts, and both documentation locales describe the width precedence and compact brand contract.
8. Compatibility documentation records the published and tested tuple Styles `1.0.1`, React `1.0.1`, Alpine `1.0.0`; historical migration-to-1.0.0 material remains historical.

## Focused browser regressions

All focused runs used Node `24.18.0`, pnpm `11.13.1`, Vitest `4.1.11`, and Playwright `1.62.1`.

| Package / file | Chromium | Firefox | WebKit |
| --- | ---: | ---: | ---: |
| Styles `tests/app-sidebar.test.ts` | 3/3 | 3/3 | 3/3 |
| React `src/app-sidebar/app-sidebar.browser.test.tsx` | 11/11 | 11/11 | 11/11 |

Chromium and Firefox focused runs passed on the host. The host could not launch WebKit because the operating system lacks `libicu74`, `libxml2`, and `libflite1`; no system packages or services were changed. WebKit was rerun successfully in the exact CI image:

`mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`

The reusable local entry point is `pnpm test:browsers:docker`. It mounts the worktree, runs as the invoking user, uses the image's Node `24.18.1` (within the repository's Node 24 contract), and keeps HOME, Corepack, the pnpm store, and isolated executable `node_modules` tmpfs mounts outside the bind-mounted checkout. The image and pnpm versions remain pinned to Playwright `1.62.1` and pnpm `11.13.1`.

## Full browser matrix

The complete repository Browser Mode matrix passed in the pinned Playwright container:

| Package | Chromium | Firefox | WebKit |
| --- | ---: | ---: | ---: |
| Styles | 13 files / 114 tests | 11 files / 110 tests | 11 files / 110 tests |
| React | 82 files / 853 tests | 82 files / 853 tests | 82 files / 853 tests |
| Alpine | 34 files / 348 tests | 34 files / 348 tests | 34 files / 348 tests |

The Chromium Styles total includes the configured `chromium-coarse` and `chromium-hybrid` instances.

The repository-owned entry point `pnpm test:browsers:docker` was then executed directly after its Compose isolation changes and exited `0`, reproducing the full matrix above without creating `.pnpm-store` in the checkout or changing host `node_modules` ownership.

## Deliberate rollback proofs

Each proof used a byte backup outside the repository, removed only the relevant final CSS block, ran the narrow Chromium regression, restored the file from the backup, and reran the same test green.

1. **CSS-only width block removed**
   - Expected failure: expanded width computed as `25px` instead of `260px`; direct content Shell rail measured `25px` instead of `260px`.
   - Result: 2 intended failures; restoration passed 2/2.
2. **Compact WorkspaceSwitcher rail block removed**
   - Expected failure: brand `scrollWidth` was `45px` while `clientWidth` was `39px` in light/dark and LTR/RTL.
   - Result: 4 intended failures; restoration passed 4/4.
3. **Reduced-motion block removed**
   - Expected failure: transition duration remained `0.18s` instead of `0s` under reduced motion.
   - Result: 1 intended failure; restoration passed 1/1.

The failures were caused by the original declarations, not timing or font metrics.

## Qualification commands and results

All commands below exited `0` unless an explicit expected rollback failure is described above.

### Lint-equivalent gates

- `pnpm security:check`
- `pnpm run lint`
- `pnpm phase0:check`
- `pnpm release-policy:check`
- `pnpm v1-core:check`
- `pnpm v1-release:check`
- checksum-verified `actionlint v1.7.12` against `.github/workflows/ci.yml`
- `pnpm --filter @lyra-ds/styles run lint:css`
- `pnpm --filter @lyra-ds/react run lint`
- `pnpm --filter @lyra-ds/docs run lint`
- `pnpm --filter @lyra-ds/site run lint`

React ESLint retains one pre-existing non-blocking warning in `packages/react/src/code-block/code-block.tsx` for an unused disable directive; there are zero ESLint errors and the changed files introduce no new warning.

### Typecheck-equivalent gates

- `pnpm --filter @lyra-ds/react run build`
- `pnpm --filter @lyra-ds/alpine run build`
- `pnpm run typecheck`

### Test-equivalent gates

- `pnpm run test`
- `node --test tools/phase1/browser-matrix.test.mjs`
  - 29/29 Docker/browser-matrix contract tests passed, including non-root checkout wiring, Compose-safe `$$PATH`, pinned frozen installation, matrix execution, tmpfs isolation, writable mode, and executable mounts.
- `pnpm test:browsers:docker`
  - complete Styles/React/Alpine Chromium, Firefox, and WebKit matrix passed in the pinned CI image; exit `0`.
- `pnpm run test:react-compat`
  - React `18.3.1`: types, build, SSR, hydration, browser, P1 SSR, and P1 browser passed.
  - React `19.2.8`: types, build, SSR, hydration, browser, P1 SSR, and P1 browser passed.
- `pnpm run parity`
  - `211` tokens and `436` classes; placement, at-rule ancestry, and no-CDN checks passed.
- `node tools/icon-registry/generate.mjs --check`
  - committed registry matched the scan; 79 icons, 78 generated imports validated.

### Build-equivalent and distribution gates

- `pnpm run build`
- `pnpm baseline:bundles --check-budgets`
- `node tools/docgen/generate.mjs --check`
- `node tools/docgen/alpine.mjs --check`
- `node tools/blade-api/check.mjs`
- `node tools/docgen/blade.mjs --check`
- `pnpm exec publint packages/styles`
- `pnpm exec publint packages/react`
- `pnpm exec publint packages/alpine`
- `pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm`
- `pnpm --filter @lyra-ds/alpine exec size-limit`
  - `23.85 kB` against `24.2 kB`.
- `node tools/dist-scan/alpine-types.mjs`
  - all 53 exported interfaces reached `dist`.
- `pnpm --filter @lyra-ds/react exec attw --pack . --profile node16`
- `pnpm --filter @lyra-ds/react exec size-limit`
  - Dialog remained `5.04 kB` against `5.3 kB`.
  - AppSidebar remained below its `2 kB` budget.
- `node tools/dist-scan/assert-use-client.mjs packages/react/dist`
  - all 150 JS/CJS files carried the directive.
- `node tools/dist-scan/no-cdn-scan.mjs packages/react/dist`
- `node tools/pack-smoke/pack-smoke.mjs`
- `node tools/smoke/smoke.mjs`
- `pnpm exec changeset status`
- `git diff --check`

`pnpm run build` includes the production docs and site builds. Next.js emitted its established warning that custom headers are not automatically applied to static export; both builds completed successfully.

## Security and independent review

A scan of added diff lines found no hardcoded secrets, shell injection, dangerous dynamic evaluation, unsafe deserialization, or formatted SQL execution patterns. The generic `exec(` pattern matched only the safe `RegExp.prototype.exec` call used by the Compose validator.

Independent read-only review used the configured low/research lane (`opencode/glm-5.3-flash`). It reported no blocking findings and marked Tasks 1–8 accepted. Its non-blocking observations were:

1. The RTL popover rule follows the tested/documented root `dir` convention; a nested non-root `dir="rtl"` wrapper is not separately supported by this patch.
2. The React regression restores the browser viewport to 1200×800 after narrow tests; no later assertion depends on another default.
3. The reduced-motion rule sets AppSidebar's complete transition duration to zero; AppSidebar currently transitions only width.
4. This handoff must retain the browser totals and rollback proofs so evidence does not live only in the conducting session; those details are recorded above.

A second independent review covered only the newly added local Docker entry point. Its first pass correctly blocked on host-side `$PATH` interpolation and incomplete contract enforcement. Both findings were fixed by preserving `$$PATH` in Compose and expanding the validator/tests to require the invoking UID/GID, `/workspace` bind mount and working directory, `CI=true`, pinned pnpm `11.13.1`, `--frozen-lockfile`, and `test:browsers` execution. The bounded correction review then approved the five infrastructure files with no blocking or non-blocking findings.

## Operational notes and remaining limitations

- A first dependency-install invocation used a mis-scoped `mise` wrapper and reported Node `26.8.1`. It changed no tracked dependency or lockfile. Product acceptance and CI-equivalent qualification used Node `24.18.0`; the final reusable Docker entry point uses the pinned image's Node `24.18.1`, which satisfies the repository's Node 24 contract, and pnpm `11.13.1`.
- Native host WebKit execution remains unavailable because of host library dependencies. The exact pinned CI container passed the complete WebKit matrix, so no host-only result was substituted for browser evidence.
- `compose.playwright.yml` and the root package script were intentionally changed to define the local Docker entry point. No Docker daemon, Colima service, CPU, memory, disk, or VM setting was changed.
- Early container attempts exposed three infrastructure defects: repository-local pnpm store creation, non-interactive module-purge prompting, and non-writable/non-executable tmpfs mounts. The final Compose definition keeps HOME/Corepack/store under `/tmp`, isolates root plus browser-package `node_modules`, and mounts those tmpfs paths as `rw,exec,mode=1777` for the invoking non-root UID/GID.
- Temporary Vite and pnpm caches created during setup were removed or isolated. The final run left no `.pnpm-store` in the working tree, and host root/Styles/React/Alpine `node_modules` remained owned by UID/GID `1000:1000`.

## Final authorization boundary

The implementation and verification are complete in the dedicated worktree. Stop here. A separate maintainer authorization is required before any commit, push, pull request, merge, package version change, publication, or remote workflow action.
