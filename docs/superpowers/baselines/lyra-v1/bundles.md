# Lyra v1 bundle baseline

- Revision: `554c6d2588d9aa6bcf59e71c5c1d967b803d8c05`
- Measured at: `2026-08-14T22:23:11.709Z`
- Owner: Lyra maintainers
- Exact command: `pnpm baseline:bundles --write`
- Environment: linux 6.18.42-1-MANJARO, x64, Node v24.18.0, pnpm 11.13.1
- Tools: Vite 8.2.1, Size Limit 12.1.0
- Cache: cold: fresh temporary consumer and pnpm store
- Fixture package manager: pnpm@11.13.1
- Fixture lockfile SHA-256: `95572dd351377c8d9e6d05ecdc67cfe78e1a6405d08cde5063c2aa973bf446cb`
- Fixture external graph SHA-256: `d10c3eb213f86fcf523fc3a32ccb96fe963399c93e36d81f9b4ed3561111f74c`
- Lyra artifact installation: offline tar extraction after frozen external install
- Externals: `react`, `react-dom`, `react-dom/client`
- Brotli: mode=text, quality=11
- Repository lockfile SHA-256: `fc29524a77a292a02d32bb910a142940e83ee51bf2be7403713edf78245a1907`

## Packed artifacts

| Package         | Version | Tarball                    | SHA-256                                                            |
| --------------- | ------- | -------------------------- | ------------------------------------------------------------------ |
| @lyra-ds/react  | 0.4.2   | `lyra-ds-react-0.4.2.tgz`  | `ed7111ade672b945c23db206073623fba3eb9b5e26c01d285d4be9b748404da6` |
| @lyra-ds/alpine | 0.5.0   | `lyra-ds-alpine-0.5.0.tgz` | `29ea1fa64b2dbbf4d477d7920d5c4105277e5c14c816710041d1ed2d0ffd0d7c` |
| @lyra-ds/styles | 0.4.2   | `lyra-ds-styles-0.4.2.tgz` | `b72d4b9034cc47cb18fda65f24e2a1f1b06f1894970032454b7ba8ba2bfece56` |

## Standalone entries

| Package | Entry                                    |    Raw JS | Minified JS | Brotli JS | Size Limit |   Limit |
| ------- | ---------------------------------------- | --------: | ----------: | --------: | ---------: | ------: |
| react   | `@lyra-ds/react/shell`                   |   2,605 B |     1,526 B |     529 B |      363 B |    1 kB |
| react   | `@lyra-ds/react/navbar`                  |   2,322 B |     1,288 B |     453 B |      290 B |    2 kB |
| react   | `@lyra-ds/react/nav-link`                |   3,357 B |     1,664 B |     681 B |      494 B |    2 kB |
| react   | `@lyra-ds/react/footer`                  |   2,263 B |     1,242 B |     428 B |      265 B |    2 kB |
| react   | `@lyra-ds/react/brand`                   |   4,589 B |     2,635 B |     894 B |      662 B |    2 kB |
| react   | `@lyra-ds/react/drawer`                  |  12,601 B |     5,689 B |   1,758 B |    1,392 B |    2 kB |
| react   | `@lyra-ds/react/bottom-sheet`            |  13,117 B |     5,914 B |   1,822 B |    1,471 B |    2 kB |
| react   | `@lyra-ds/react/create-workspace-dialog` |  26,906 B |    13,276 B |   3,665 B |    3,016 B |  3.2 kB |
| react   | `@lyra-ds/react/workspace-switcher`      |  53,948 B |    32,070 B |   8,388 B |    8,174 B | 8.25 kB |
| react   | `@lyra-ds/react/button`                  |   4,727 B |     2,346 B |     895 B |      671 B |   800 B |
| react   | `@lyra-ds/react/icon`                    |  43,457 B |    24,507 B |   6,457 B |    6,510 B |  7.5 kB |
| react   | `@lyra-ds/react/icon-button`             |   1,420 B |       514 B |     270 B |      150 B |   400 B |
| react   | `@lyra-ds/react/textarea`                |   4,380 B |     1,635 B |     665 B |      447 B |   600 B |
| react   | `@lyra-ds/react/checkbox`                |   3,513 B |     1,036 B |     491 B |      303 B |   500 B |
| react   | `@lyra-ds/react/radio`                   |   3,487 B |     1,027 B |     492 B |      304 B |   500 B |
| react   | `@lyra-ds/react/radio-group`             |   5,477 B |     2,645 B |     899 B |      632 B |    1 kB |
| react   | `@lyra-ds/react/checkbox-group`          |   5,632 B |     2,680 B |     914 B |      640 B |    1 kB |
| react   | `@lyra-ds/react/fieldset`                |   2,157 B |     1,129 B |     415 B |      253 B |   700 B |
| react   | `@lyra-ds/react/separator`               |   1,696 B |       731 B |     291 B |      162 B |   500 B |
| react   | `@lyra-ds/react/switch`                  |   3,556 B |     1,170 B |     516 B |      329 B |   500 B |
| react   | `@lyra-ds/react/file-upload`             |  50,377 B |    30,513 B |   7,992 B |    7,824 B |    8 kB |
| react   | `@lyra-ds/react/file-manager`            |  62,900 B |    38,476 B |   9,747 B |    9,360 B |  9.5 kB |
| react   | `@lyra-ds/react/calendar`                |  13,745 B |     9,092 B |   2,413 B |    2,021 B |    3 kB |
| react   | `@lyra-ds/react/time-picker`             |  28,007 B |    15,063 B |   4,402 B |    3,745 B |    4 kB |
| react   | `@lyra-ds/react/time-input`              |   9,281 B |     5,045 B |   1,782 B |    1,451 B |    2 kB |
| react   | `@lyra-ds/react/date-picker`             |  37,759 B |    22,623 B |   5,684 B |    4,858 B |    5 kB |
| react   | `@lyra-ds/react/date-range-picker`       |  38,146 B |    22,908 B |   5,789 B |    4,937 B |    5 kB |
| react   | `@lyra-ds/react/badge`                   |   1,417 B |       540 B |     287 B |      161 B |   400 B |
| react   | `@lyra-ds/react/tag`                     |  44,011 B |    24,981 B |   6,608 B |    6,629 B | 8.25 kB |
| react   | `@lyra-ds/react/card`                    |   4,060 B |     2,444 B |     829 B |      601 B |   700 B |
| react   | `@lyra-ds/react/container`               |   1,478 B |       514 B |     298 B |      153 B |   300 B |
| react   | `@lyra-ds/react/code-block`              |   3,115 B |     1,836 B |     679 B |      469 B |    1 kB |
| react   | `@lyra-ds/react/segmented-control`       |   3,358 B |     1,810 B |     742 B |      528 B |    1 kB |
| react   | `@lyra-ds/react/grid`                    |   1,804 B |       797 B |     393 B |      251 B |   400 B |
| react   | `@lyra-ds/react/page-header`             |   2,049 B |     1,152 B |     364 B |      215 B |   400 B |
| react   | `@lyra-ds/react/stack`                   |   1,873 B |       805 B |     397 B |      254 B |   400 B |
| react   | `@lyra-ds/react/avatar`                  |   1,840 B |       931 B |     442 B |      278 B |   500 B |
| react   | `@lyra-ds/react/alert`                   |   1,612 B |       774 B |     326 B |      189 B |   500 B |
| react   | `@lyra-ds/react/spinner`                 |   1,332 B |       451 B |     261 B |      135 B |   400 B |
| react   | `@lyra-ds/react/skeleton`                |   1,399 B |       534 B |     293 B |      157 B |   500 B |
| react   | `@lyra-ds/react/progress`                |   1,532 B |       653 B |     333 B |      198 B |   500 B |
| react   | `@lyra-ds/react/segmented-ring`          |   5,613 B |     3,825 B |   1,123 B |      821 B |    1 kB |
| react   | `@lyra-ds/react/stat`                    |   1,740 B |       879 B |     364 B |      219 B |   500 B |
| react   | `@lyra-ds/react/empty-state`             |   1,723 B |       844 B |     311 B |      170 B |   500 B |
| react   | `@lyra-ds/react/breadcrumb`              |   1,875 B |       925 B |     376 B |      224 B |   500 B |
| react   | `@lyra-ds/react/tabs`                    |   3,252 B |     1,824 B |     748 B |      543 B |  1.5 kB |
| react   | `@lyra-ds/react/accordion`               |   2,787 B |     1,698 B |     627 B |      425 B |    1 kB |
| react   | `@lyra-ds/react/stepper`                 |   2,230 B |     1,354 B |     518 B |      343 B |    1 kB |
| react   | `@lyra-ds/react/pagination`              |   2,847 B |     1,768 B |     639 B |      472 B |    1 kB |
| react   | `@lyra-ds/react/tooltip`                 |   6,503 B |     3,367 B |   1,147 B |      885 B |  1.5 kB |
| react   | `@lyra-ds/react/select`                  |   4,406 B |     1,819 B |     705 B |      483 B |  1.5 kB |
| react   | `@lyra-ds/react/dropdown`                |  10,457 B |     5,652 B |   1,893 B |    1,556 B |    2 kB |
| react   | `@lyra-ds/react/popover`                 |   9,958 B |     4,595 B |   1,639 B |    1,289 B |    3 kB |
| react   | `@lyra-ds/react/combobox`                |  56,064 B |    32,320 B |   8,538 B |    8,331 B |  8.5 kB |
| react   | `@lyra-ds/react/time-zone-picker`        |  62,511 B |    38,334 B |  10,148 B |    9,798 B |   10 kB |
| react   | `@lyra-ds/react/table`                   |   2,145 B |     1,162 B |     453 B |      285 B |   700 B |
| react   | `@lyra-ds/react/data-table`              |  10,586 B |     6,830 B |   2,062 B |    1,661 B | 2.25 kB |
| react   | `@lyra-ds/react/person-cell`             |   2,610 B |     1,566 B |     572 B |      391 B |   800 B |
| react   | `@lyra-ds/react/action-bar`              |   2,295 B |     1,488 B |     548 B |      363 B |   700 B |
| react   | `@lyra-ds/react/sidebar-group`           |   3,131 B |     2,168 B |     699 B |      504 B |   900 B |
| react   | `@lyra-ds/react/app-sidebar`             |   8,023 B |     4,979 B |   1,458 B |    1,117 B |    2 kB |
| react   | `@lyra-ds/react/bottom-nav`              |   1,804 B |       911 B |     376 B |      222 B |   700 B |
| react   | `@lyra-ds/react/toast`                   |   1,693 B |       850 B |     367 B |      229 B |   700 B |
| react   | `@lyra-ds/react/toast-provider`          |   5,095 B |     3,484 B |   1,139 B |      882 B |  1.5 kB |
| react   | `@lyra-ds/react/cookie-banner`           |   8,659 B |     4,322 B |   1,502 B |    1,195 B |  1.5 kB |
| react   | `@lyra-ds/react/command-palette`         |  62,040 B |    36,141 B |   9,435 B |    8,996 B |  9.5 kB |
| react   | `@lyra-ds/react/theme-provider`          |   4,247 B |     1,641 B |     664 B |      470 B |  0.7 kB |
| react   | `@lyra-ds/react/recurrence-selector`     |  49,274 B |    33,462 B |   7,723 B |    6,580 B |    7 kB |
| react   | `@lyra-ds/react/weekly-schedule-editor`  |  98,620 B |    61,497 B |  15,087 B |   13,947 B | 14.5 kB |
| react   | `@lyra-ds/react/slot-picker`             |  84,937 B |    55,395 B |  13,936 B |   13,090 B |   14 kB |
| react   | `@lyra-ds/react/calendar-view`           |  58,972 B |    35,988 B |   9,242 B |    8,884 B |  9.5 kB |
| alpine  | `@lyra-ds/alpine`                        | 194,833 B |   114,140 B |  20,711 B |   18,806 B | 18.9 kB |

## Scenarios

| Scenario          |    Raw JS | Minified JS | Brotli JS | Rolldown modules |
| ----------------- | --------: | ----------: | --------: | ---------------: |
| form              |  20,243 B |     7,686 B |   1,878 B |                6 |
| overlays          |  53,547 B |    24,600 B |   4,912 B |                6 |
| application-shell |  89,660 B |    53,211 B |  12,644 B |               93 |
| scheduling        | 170,470 B |   106,059 B |  19,594 B |               92 |
| files-data        |  84,813 B |    53,243 B |  12,508 B |               91 |

## CSS entries

| Entry                               |   Raw CSS | Minified CSS | Brotli CSS |
| ----------------------------------- | --------: | -----------: | ---------: |
| `@lyra-ds/styles`                   | 146,764 B |    103,871 B |   13,274 B |
| `@lyra-ds/styles/styles.css`        | 146,764 B |    103,871 B |   13,274 B |
| `@lyra-ds/styles/tokens/brand.css`  |   1,706 B |      1,296 B |      352 B |
| `@lyra-ds/styles/compat-shadcn.css` |   1,400 B |        649 B |      208 B |

The JSON beside this report is the machine-readable source of truth, including the complete Rolldown module-contribution records.
