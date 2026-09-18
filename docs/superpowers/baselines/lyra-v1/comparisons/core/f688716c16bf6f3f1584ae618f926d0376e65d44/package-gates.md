# Package, consumer and compatibility gates

- Source revision: `f688716c16bf6f3f1584ae618f926d0376e65d44`
- Measured revision: `812e92f341decf6c9b51da47ee0a729f576ca74d` (Measured on an earlier commit of the candidate branch whose three package archives are byte-identical (same SHA-256) to the candidate source revision; only documentation and baseline files changed in between.)
- Platform: macOS arm64, Node 24.18.0, pnpm 11.13.1, Playwright 1.62.1

| Gate                | Exit code | Duration |
| ------------------- | --------: | -------: |
| `build`             |         0 |      44s |
| `check-budgets`     |         0 |      46s |
| `docgen-check`      |         0 |       0s |
| `docgen-alpine`     |         0 |       1s |
| `blade-api`         |         0 |       0s |
| `docgen-blade`      |         0 |       0s |
| `publint-styles`    |         0 |       3s |
| `pack-smoke`        |         0 |       2s |
| `publint-react`     |         0 |       3s |
| `publint-alpine`    |         0 |       3s |
| `attw-alpine`       |         0 |       3s |
| `size-limit-alpine` |         0 |       2s |
| `dist-alpine-types` |         0 |       0s |
| `attw-react`        |         0 |       3s |
| `size-limit-react`  |         0 |       3s |
| `use-client`        |         0 |       0s |
| `no-cdn`            |         0 |       0s |
| `smoke`             |         0 |      20s |
| `react-compat`      |         0 |      87s |
| `parity`            |         0 |       2s |
| `icon-registry`     |         0 |       0s |
| `test`              |         0 |     150s |

## React compatibility (tools/react-compat)

- React 18.3.1: types passed
- React 18.3.1: build passed
- React 18.3.1: ssr passed
- React 18.3.1: hydration passed
- React 18.3.1: browser passed
- React 18.3.1: p1-ssr passed
- React 18.3.1: p1-browser passed
- React 19.2.8: types passed
- React 19.2.8: build passed
- React 19.2.8: ssr passed
- React 19.2.8: hydration passed
- React 19.2.8: browser passed
- React 19.2.8: p1-ssr passed
- React 19.2.8: p1-browser passed

Cells: bundle-standalone, bundle-composition (bundle-budgets.json); packed-esm, packed-cjs, packed-types (publint, attw, dist-scan, size-limit); consumer-vite, consumer-next, consumer-commonjs (smoke, pack-smoke); react-18, react-19, ssr, hydration (react-compat).
