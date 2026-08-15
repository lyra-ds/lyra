# Current Delivery Baseline — 2026-08-15

## Identity

The following command outputs were captured from the repository root.

```text
$ rtk git rev-parse HEAD
b932ee20350a3cce07f7a91dea2251332f82cb55

$ rtk git status --short

$ rtk git log -1 --format='%H%n%ad%n%s' --date=iso-strict
b932ee20350a3cce07f7a91dea2251332f82cb55
2026-08-15T08:51:17-03:00
docs: plan current baseline backlog

$ rtk node --version
v24.18.0

$ rtk pnpm --version
11.13.1
```

`rtk git status --short` produced no entries before this snapshot was created, so this worktree had no user-owned changes to preserve at capture time.

## Package Surface

| Package           | Version   | Public purpose                                                                                            | Verification command                     |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `@lyra-ds/styles` | `0.4.2`   | CSS-first design tokens and component styles with zero JavaScript.                                        | `pnpm --filter @lyra-ds/styles run test` |
| `@lyra-ds/react`  | `0.4.2`   | Thin, tree-shakable React wrappers over `@lyra-ds/styles`, with appearance supplied by `.lyra-*` classes. | `pnpm --filter @lyra-ds/react run test`  |
| `@lyra-ds/alpine` | `0.5.0`   | Alpine.js plugin that ports the interactive React component state machines.                               | `pnpm --filter @lyra-ds/alpine run test` |
| `@lyra-ds/docs`   | `private` | Private documentation application; no public description field is present.                                | `pnpm --filter @lyra-ds/docs run test`   |
| `@lyra-ds/site`   | `private` | Private site application; no public description field is present.                                         | `pnpm --filter @lyra-ds/site run test`   |

Repeatable inventory commands and their outputs:

```text
$ rtk git ls-files 'packages/react/src/*/*.tsx' | rg '/[^/]+\.tsx$' | rg -v '\.(browser\.test|ssr\.test)\.tsx$' | wc -l
76

$ rtk git ls-files 'packages/react/src/*/*.browser.test.tsx' | wc -l
76

$ rtk git ls-files 'packages/react/src/*/*.ssr.test.ts' | wc -l
74

$ rtk git ls-files 'packages/alpine/src/*.ts' | rg -v '\.browser\.test\.ts$' | wc -l
42

$ rtk git ls-files 'apps/docs/content/docs/en/components/*.mdx' | wc -l
75

$ rtk git ls-files 'apps/docs/content/docs/pt-BR/components/*.mdx' | wc -l
75
```

The 76 React `.tsx` files are tracked component source files after the two named test-file suffixes are excluded.
The 76 React browser-test files are a separate tracked browser-test inventory.
The 74 React SSR-test files are a separate tracked SSR-test inventory.
The 42 Alpine `.ts` files are tracked source files after browser-test files are excluded.
The 75 English MDX files are tracked component documentation pages in the English documentation directory.
The 75 Brazilian Portuguese MDX files are tracked component documentation pages in the Brazilian Portuguese documentation directory.

## Verification Evidence

```text
$ rtk pnpm test
exit status: 0

packages/styles
Test Files  4 passed (4)
Tests  69 passed (69)

packages/react
Test Files  150 passed (150)
Tests  665 passed (665)

packages/alpine
Test Files  32 passed (32)
Tests  268 passed (268)
```

## CI Gates

The following are the executed `run` commands in `.github/workflows/ci.yml`, grouped by required job.

### `lint`

```text
pnpm install --frozen-lockfile
pnpm run lint
curl -sSfLO https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz
echo "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8  actionlint_1.7.12_linux_amd64.tar.gz" | sha256sum -c -
tar xzf actionlint_1.7.12_linux_amd64.tar.gz actionlint
./actionlint -color
pnpm --filter @lyra-ds/styles run lint:css
pnpm --filter @lyra-ds/react run lint
pnpm --filter @lyra-ds/docs run lint
pnpm --filter @lyra-ds/site run lint
```

### `typecheck`

```text
pnpm install --frozen-lockfile
pnpm --filter @lyra-ds/react run build
pnpm run typecheck
```

### `test`

```text
pnpm install --frozen-lockfile
pnpm exec playwright install chromium --with-deps
pnpm run test
pnpm run parity
node tools/icon-registry/generate.mjs --check
```

### `build`

```text
pnpm install --frozen-lockfile
pnpm run build
node tools/docgen/generate.mjs --check
node tools/docgen/alpine.mjs --check
node tools/blade-api/check.mjs
node tools/docgen/blade.mjs --check
pnpm exec publint packages/styles
node tools/pack-smoke/pack-smoke.mjs
pnpm exec publint packages/react
pnpm exec publint packages/alpine
pnpm --filter @lyra-ds/alpine exec attw --pack . --profile node16 --ignore-rules cjs-resolves-to-esm
pnpm --filter @lyra-ds/alpine exec size-limit
node tools/dist-scan/alpine-types.mjs
pnpm --filter @lyra-ds/react exec attw --pack . --profile node16
pnpm --filter @lyra-ds/react exec size-limit
node tools/dist-scan/assert-use-client.mjs packages/react/dist
node tools/dist-scan/no-cdn-scan.mjs packages/react/dist
node tools/smoke/smoke.mjs
```
