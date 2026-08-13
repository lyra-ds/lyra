# Lyra v1 bundle baseline

- Revision: `98a462fdff39ab1e3ff10a1c291912088f78f908`
- Measured at: `2026-08-13T13:21:28.830Z`
- Owner: Lyra maintainers
- Exact command: `pnpm baseline:bundles --write`
- Environment: linux 6.18.42-1-MANJARO, x64, Node v24.18.0, pnpm 11.13.1
- Tools: Vite 8.2.1, Size Limit 12.1.0
- Cache: cold: fresh temporary consumer and npm cache
- Externals: `react`, `react-dom`, `react-dom/client`
- Brotli: mode=text, quality=11
- Lockfile SHA-256: `6e91cc7873c95a4b3777228e8dbfb4f25736af5ed09a82d877271dbe74c3185f`

## Packed artifacts

| Package         | Version | Tarball                    | SHA-256                                                            |
| --------------- | ------- | -------------------------- | ------------------------------------------------------------------ |
| @lyra-ds/react  | 0.4.2   | `lyra-ds-react-0.4.2.tgz`  | `5e51331c99907127e4de3358e5eec63fd3d6d4cb5b4e5ed3886370856693e8fe` |
| @lyra-ds/alpine | 0.5.0   | `lyra-ds-alpine-0.5.0.tgz` | `3b4a12be3ba4ef25f41cfa7be69f6111fd847c3ec6c7a859216e580344da8241` |
| @lyra-ds/styles | 0.4.2   | `lyra-ds-styles-0.4.2.tgz` | `fe414bc17e16dae4c86bdfb5220b286058ed3c6fb2663c8883d6bc113d561a0b` |

## Standalone entries

| Package | Entry                                    |    Raw JS | Minified JS | Brotli JS | Size Limit |   Limit |
| ------- | ---------------------------------------- | --------: | ----------: | --------: | ---------: | ------: |
| react   | `@lyra-ds/react/shell`                   |  15,342 B |    10,262 B |   2,874 B |      363 B |    1 kB |
| react   | `@lyra-ds/react/navbar`                  |  15,059 B |    10,025 B |   2,811 B |      290 B |    2 kB |
| react   | `@lyra-ds/react/nav-link`                |  16,004 B |    10,385 B |   3,014 B |      494 B |    2 kB |
| react   | `@lyra-ds/react/footer`                  |  15,000 B |     9,979 B |   2,798 B |      265 B |    2 kB |
| react   | `@lyra-ds/react/brand`                   |  17,426 B |    11,415 B |   3,230 B |      662 B |    2 kB |
| react   | `@lyra-ds/react/drawer`                  |  25,458 B |    14,514 B |   4,082 B |    1,392 B |    2 kB |
| react   | `@lyra-ds/react/bottom-sheet`            |  25,950 B |    14,730 B |   4,164 B |    1,471 B |    2 kB |
| react   | `@lyra-ds/react/create-workspace-dialog` |  41,268 B |    22,992 B |   6,156 B |    3,016 B |  3.2 kB |
| react   | `@lyra-ds/react/workspace-switcher`      |  67,655 B |    41,235 B |  10,801 B |    8,174 B | 8.25 kB |
| react   | `@lyra-ds/react/button`                  |  17,449 B |    11,080 B |   3,222 B |      671 B |   800 B |
| react   | `@lyra-ds/react/icon`                    |  56,461 B |    33,481 B |   8,923 B |    6,510 B |  7.5 kB |
| react   | `@lyra-ds/react/icon-button`             |  14,043 B |     9,214 B |   2,657 B |      150 B |   400 B |
| react   | `@lyra-ds/react/textarea`                |  17,551 B |    10,718 B |   3,113 B |      447 B |   600 B |
| react   | `@lyra-ds/react/checkbox`                |  16,636 B |    10,099 B |   2,948 B |      303 B |   500 B |
| react   | `@lyra-ds/react/radio`                   |  16,610 B |    10,090 B |   2,949 B |      304 B |   500 B |
| react   | `@lyra-ds/react/radio-group`             |  18,816 B |    11,797 B |   3,352 B |      632 B |    1 kB |
| react   | `@lyra-ds/react/checkbox-group`          |  18,971 B |    11,832 B |   3,359 B |      640 B |    1 kB |
| react   | `@lyra-ds/react/fieldset`                |  14,870 B |     9,859 B |   2,778 B |      253 B |   700 B |
| react   | `@lyra-ds/react/separator`               |  14,367 B |     9,449 B |   2,672 B |      162 B |   500 B |
| react   | `@lyra-ds/react/switch`                  |  16,703 B |    10,242 B |   2,974 B |      329 B |   500 B |
| react   | `@lyra-ds/react/file-upload`             |  63,886 B |    39,638 B |  10,446 B |    7,824 B |    8 kB |
| react   | `@lyra-ds/react/file-manager`            |  77,660 B |    48,261 B |  12,302 B |    9,360 B |  9.5 kB |
| react   | `@lyra-ds/react/calendar`                |  27,228 B |    18,307 B |   4,842 B |    2,021 B |    3 kB |
| react   | `@lyra-ds/react/time-picker`             |  41,787 B |    24,389 B |   6,829 B |    3,745 B |    4 kB |
| react   | `@lyra-ds/react/time-input`              |  22,644 B |    14,202 B |   4,195 B |    1,451 B |    2 kB |
| react   | `@lyra-ds/react/date-picker`             |  51,995 B |    32,124 B |   8,093 B |    4,858 B |    5 kB |
| react   | `@lyra-ds/react/date-range-picker`       |  52,382 B |    32,409 B |   8,188 B |    4,937 B |    5 kB |
| react   | `@lyra-ds/react/badge`                   |  14,058 B |     9,239 B |   2,661 B |      161 B |   400 B |
| react   | `@lyra-ds/react/tag`                     |  57,080 B |    33,970 B |   9,094 B |    6,629 B | 8.25 kB |
| react   | `@lyra-ds/react/card`                    |  16,845 B |    11,210 B |   3,154 B |      601 B |   700 B |
| react   | `@lyra-ds/react/container`               |  14,101 B |     9,214 B |   2,656 B |      153 B |   300 B |
| react   | `@lyra-ds/react/code-block`              |  15,876 B |    10,589 B |   3,023 B |      469 B |    1 kB |
| react   | `@lyra-ds/react/segmented-control`       |  16,005 B |    10,521 B |   3,078 B |      528 B |    1 kB |
| react   | `@lyra-ds/react/grid`                    |  14,427 B |     9,497 B |   2,758 B |      251 B |   400 B |
| react   | `@lyra-ds/react/page-header`             |  14,810 B |     9,898 B |   2,734 B |      215 B |   400 B |
| react   | `@lyra-ds/react/stack`                   |  14,333 B |     9,515 B |   2,742 B |      254 B |   400 B |
| react   | `@lyra-ds/react/avatar`                  |  14,529 B |     9,648 B |   2,792 B |      278 B |   500 B |
| react   | `@lyra-ds/react/alert`                   |  14,325 B |     9,501 B |   2,690 B |      189 B |   500 B |
| react   | `@lyra-ds/react/spinner`                 |  13,955 B |     9,151 B |   2,637 B |      135 B |   400 B |
| react   | `@lyra-ds/react/skeleton`                |  14,022 B |     9,234 B |   2,666 B |      157 B |   500 B |
| react   | `@lyra-ds/react/progress`                |  14,179 B |     9,362 B |   2,700 B |      198 B |   500 B |
| react   | `@lyra-ds/react/segmented-ring`          |  18,642 B |    12,674 B |   3,471 B |      821 B |    1 kB |
| react   | `@lyra-ds/react/stat`                    |  14,429 B |     9,597 B |   2,737 B |      219 B |   500 B |
| react   | `@lyra-ds/react/empty-state`             |  14,436 B |     9,570 B |   2,686 B |      170 B |   500 B |
| react   | `@lyra-ds/react/breadcrumb`              |  14,588 B |     9,653 B |   2,746 B |      224 B |   500 B |
| react   | `@lyra-ds/react/tabs`                    |  15,965 B |    10,555 B |   3,086 B |      543 B |  1.5 kB |
| react   | `@lyra-ds/react/accordion`               |  15,548 B |    10,447 B |   2,964 B |      425 B |    1 kB |
| react   | `@lyra-ds/react/stepper`                 |  15,015 B |    10,110 B |   2,880 B |      343 B |    1 kB |
| react   | `@lyra-ds/react/pagination`              |  15,560 B |    10,498 B |   2,986 B |      472 B |    1 kB |
| react   | `@lyra-ds/react/tooltip`                 |  19,144 B |    12,084 B |   3,479 B |      885 B |  1.5 kB |
| react   | `@lyra-ds/react/select`                  |  17,601 B |    10,911 B |   3,144 B |      483 B |  1.5 kB |
| react   | `@lyra-ds/react/dropdown`                |  23,218 B |    14,427 B |   4,210 B |    1,556 B |    2 kB |
| react   | `@lyra-ds/react/popover`                 |  23,105 B |    13,690 B |   4,053 B |    1,289 B |    3 kB |
| react   | `@lyra-ds/react/combobox`                |  70,045 B |    41,780 B |  11,092 B |    8,331 B |  8.5 kB |
| react   | `@lyra-ds/react/time-zone-picker`        |  76,524 B |    47,803 B |  12,693 B |    9,798 B |   10 kB |
| react   | `@lyra-ds/react/table`                   |  14,930 B |     9,915 B |   2,810 B |      285 B |   700 B |
| react   | `@lyra-ds/react/data-table`              |  24,366 B |    16,140 B |   4,469 B |    1,661 B | 2.25 kB |
| react   | `@lyra-ds/react/person-cell`             |  15,419 B |    10,332 B |   2,916 B |      391 B |   800 B |
| react   | `@lyra-ds/react/action-bar`              |  15,056 B |    10,234 B |   2,930 B |      363 B |   700 B |
| react   | `@lyra-ds/react/sidebar-group`           |  15,988 B |    10,953 B |   3,066 B |      504 B |   900 B |
| react   | `@lyra-ds/react/app-sidebar`             |  21,554 B |    14,212 B |   3,911 B |    1,117 B |    2 kB |
| react   | `@lyra-ds/react/bottom-nav`              |  14,493 B |     9,628 B |   2,738 B |      222 B |   700 B |
| react   | `@lyra-ds/react/toast`                   |  14,382 B |     9,567 B |   2,735 B |      229 B |   700 B |
| react   | `@lyra-ds/react/toast-provider`          |  18,148 B |    12,354 B |   3,478 B |      882 B |  1.5 kB |
| react   | `@lyra-ds/react/cookie-banner`           |  21,611 B |    13,160 B |   3,823 B |    1,195 B |  1.5 kB |
| react   | `@lyra-ds/react/command-palette`         |  75,817 B |    45,359 B |  11,878 B |    8,996 B |  9.5 kB |
| react   | `@lyra-ds/react/theme-provider`          |  16,870 B |    10,361 B |   3,031 B |      470 B |  0.7 kB |
| react   | `@lyra-ds/react/recurrence-selector`     |  64,201 B |    43,233 B |  10,141 B |    6,580 B |    7 kB |
| react   | `@lyra-ds/react/weekly-schedule-editor`  | 114,700 B |    71,724 B |  17,552 B |   13,947 B | 14.5 kB |
| react   | `@lyra-ds/react/slot-picker`             | 100,313 B |    65,349 B |  16,411 B |   13,090 B |   14 kB |
| react   | `@lyra-ds/react/calendar-view`           |  73,238 B |    45,572 B |  11,776 B |    8,884 B |  9.5 kB |
| alpine  | `@lyra-ds/alpine`                        | 195,226 B |   114,387 B |  20,784 B |   18,866 B | 18.9 kB |

## Scenarios

| Scenario          |    Raw JS | Minified JS | Brotli JS | Rolldown modules |
| ----------------- | --------: | ----------: | --------: | ---------------: |
| form              |  35,366 B |    17,932 B |   4,386 B |               10 |
| overlays          |  67,686 B |    33,995 B |   7,327 B |               10 |
| application-shell | 105,634 B |    63,529 B |  15,115 B |               97 |
| scheduling        | 190,305 B |   118,342 B |  22,133 B |               96 |
| files-data        | 101,427 B |    64,041 B |  15,006 B |               95 |

## CSS entries

| Entry                               |   Raw CSS | Minified CSS | Brotli CSS |
| ----------------------------------- | --------: | -----------: | ---------: |
| `@lyra-ds/styles`                   | 146,764 B |    103,871 B |   13,274 B |
| `@lyra-ds/styles/styles.css`        | 146,764 B |    103,871 B |   13,274 B |
| `@lyra-ds/styles/tokens/brand.css`  |   1,706 B |      1,296 B |      352 B |
| `@lyra-ds/styles/compat-shadcn.css` |   1,400 B |        649 B |      208 B |

The JSON beside this report is the machine-readable source of truth, including the complete Rolldown module-contribution records.
