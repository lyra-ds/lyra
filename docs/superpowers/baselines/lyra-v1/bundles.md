# Lyra v1 bundle baseline

- Revision: `ca034e7ca17f2a20a803257655236d16034f05a4`
- Measured at: `2026-09-25T19:24:40.345Z`
- Owner: Lyra maintainers
- Exact command: `pnpm baseline:bundles --write`
- Environment: darwin 25.6.0, arm64, Node v24.21.0, pnpm 11.13.1
- Tools: Vite 8.2.1, Size Limit 12.1.0
- Cache: cold: fresh temporary consumer and pnpm store
- Fixture package manager: pnpm@11.13.1
- Fixture lockfile SHA-256: `95572dd351377c8d9e6d05ecdc67cfe78e1a6405d08cde5063c2aa973bf446cb`
- Fixture external graph SHA-256: `d10c3eb213f86fcf523fc3a32ccb96fe963399c93e36d81f9b4ed3561111f74c`
- Lyra artifact installation: offline tar extraction after frozen external install
- Externals: `react`, `react-dom`, `react-dom/client`
- Brotli: mode=text, quality=11
- Repository lockfile SHA-256: `204ad5137996d68239a9263d490c7052e48ca0c5cbae44c36b03b295d9952210`

## Packed artifacts

| Package         | Version | Tarball                    | SHA-256                                                            |
| --------------- | ------- | -------------------------- | ------------------------------------------------------------------ |
| @lyra-ds/react  | 1.0.2   | `lyra-ds-react-1.0.2.tgz`  | `b18ce85c93e6d70a18357168005ab1445f27fc2d73f0df668b3c1883347278b7` |
| @lyra-ds/alpine | 1.0.0   | `lyra-ds-alpine-1.0.0.tgz` | `9e8e8a440789534e32a369a86db68c6c6b41e19bbbd8d6bfc259122058b3b4d8` |
| @lyra-ds/styles | 1.0.3   | `lyra-ds-styles-1.0.3.tgz` | `1cec40dc94d6789ac373a3898833a781abe82359d4525525aee6f1640b583c1a` |

## Standalone entries

| Package | Entry                                    |    Raw JS | Minified JS | Brotli JS | Size Limit |     Limit |
| ------- | ---------------------------------------- | --------: | ----------: | --------: | ---------: | --------: |
| react   | `@lyra-ds/react/shell`                   |   4,076 B |     2,414 B |     833 B |      639 B |      1 kB |
| react   | `@lyra-ds/react/navbar`                  |   2,886 B |     1,582 B |     588 B |      410 B |      2 kB |
| react   | `@lyra-ds/react/nav-link`                |   3,468 B |     1,664 B |     681 B |      494 B |      2 kB |
| react   | `@lyra-ds/react/footer`                  |   2,827 B |     1,536 B |     559 B |      405 B |      2 kB |
| react   | `@lyra-ds/react/brand`                   |   5,206 B |     2,981 B |     996 B |      758 B |      2 kB |
| react   | `@lyra-ds/react/otp-input`               |   6,941 B |     3,861 B |   1,352 B |    1,071 B |    1.2 kB |
| react   | `@lyra-ds/react/dialog`                  |  43,208 B |    22,660 B |   5,815 B |    5,040 B |    5.3 kB |
| react   | `@lyra-ds/react/drawer`                  |  41,628 B |    22,443 B |   5,762 B |    4,989 B |    5.3 kB |
| react   | `@lyra-ds/react/bottom-sheet`            |  41,894 B |    22,456 B |   5,788 B |    5,030 B |    5.3 kB |
| react   | `@lyra-ds/react/create-workspace-dialog` |  61,931 B |    34,287 B |   8,668 B |    7,476 B |    7.9 kB |
| react   | `@lyra-ds/react/workspace-switcher`      |  23,963 B |    12,968 B |   3,805 B |    3,469 B |   8.25 kB |
| react   | `@lyra-ds/react/button`                  |   4,838 B |     2,346 B |     895 B |      671 B |     800 B |
| react   | `@lyra-ds/react/icon`                    |  44,456 B |    24,507 B |   6,457 B |    6,510 B |    7.5 kB |
| react   | `@lyra-ds/react/icon-button`             |   1,531 B |       514 B |     270 B |      150 B |     400 B |
| react   | `@lyra-ds/react/textarea`                |   4,491 B |     1,635 B |     665 B |      447 B |     600 B |
| react   | `@lyra-ds/react/checkbox`                |   3,624 B |     1,036 B |     491 B |      303 B |     500 B |
| react   | `@lyra-ds/react/radio`                   |   3,598 B |     1,027 B |     492 B |      304 B |     500 B |
| react   | `@lyra-ds/react/radio-group`             |   5,588 B |     2,645 B |     899 B |      632 B |      1 kB |
| react   | `@lyra-ds/react/checkbox-group`          |   5,743 B |     2,680 B |     914 B |      640 B |      1 kB |
| react   | `@lyra-ds/react/fieldset`                |   2,268 B |     1,129 B |     415 B |      253 B |     700 B |
| react   | `@lyra-ds/react/separator`               |   1,807 B |       731 B |     291 B |      162 B |     500 B |
| react   | `@lyra-ds/react/switch`                  |   3,667 B |     1,170 B |     516 B |      329 B |     500 B |
| react   | `@lyra-ds/react/file-upload`             |  24,249 B |    16,704 B |   4,332 B |    3,700 B |      8 kB |
| react   | `@lyra-ds/react/file-manager`            |  42,541 B |    26,399 B |   6,536 B |    5,968 B |    9.5 kB |
| react   | `@lyra-ds/react/calendar`                |  13,856 B |     9,092 B |   2,413 B |    2,021 B |      3 kB |
| react   | `@lyra-ds/react/time-picker`             |  62,507 B |    35,025 B |   8,993 B |    7,912 B |  7.912 kB |
| react   | `@lyra-ds/react/time-input`              |   9,392 B |     5,045 B |   1,782 B |    1,451 B |      2 kB |
| react   | `@lyra-ds/react/date-picker`             |  72,243 B |    42,588 B |  10,300 B |    9,059 B |    9.1 kB |
| react   | `@lyra-ds/react/date-range-picker`       |  73,585 B |    43,561 B |  10,574 B |    9,307 B |   9.35 kB |
| react   | `@lyra-ds/react/badge`                   |   1,528 B |       540 B |     287 B |      161 B |     400 B |
| react   | `@lyra-ds/react/tag`                     |  45,010 B |    24,981 B |   6,608 B |    6,629 B |   8.25 kB |
| react   | `@lyra-ds/react/card`                    |   4,171 B |     2,444 B |     829 B |      601 B |     700 B |
| react   | `@lyra-ds/react/container`               |   2,042 B |       808 B |     416 B |      271 B |     300 B |
| react   | `@lyra-ds/react/code-block`              |   3,226 B |     1,836 B |     679 B |      469 B |      1 kB |
| react   | `@lyra-ds/react/segmented-control`       |   3,469 B |     1,810 B |     742 B |      528 B |      1 kB |
| react   | `@lyra-ds/react/grid`                    |   1,915 B |       797 B |     393 B |      251 B |     400 B |
| react   | `@lyra-ds/react/page-header`             |   2,160 B |     1,152 B |     364 B |      215 B |     400 B |
| react   | `@lyra-ds/react/stack`                   |   1,984 B |       805 B |     397 B |      254 B |     400 B |
| react   | `@lyra-ds/react/avatar`                  |   1,951 B |       931 B |     442 B |      278 B |     500 B |
| react   | `@lyra-ds/react/alert`                   |   1,723 B |       774 B |     326 B |      189 B |     500 B |
| react   | `@lyra-ds/react/spinner`                 |   1,443 B |       451 B |     261 B |      135 B |     400 B |
| react   | `@lyra-ds/react/skeleton`                |   1,510 B |       534 B |     293 B |      157 B |     500 B |
| react   | `@lyra-ds/react/progress`                |   1,643 B |       653 B |     333 B |      198 B |     500 B |
| react   | `@lyra-ds/react/segmented-ring`          |   5,724 B |     3,825 B |   1,123 B |      821 B |      1 kB |
| react   | `@lyra-ds/react/stat`                    |   1,851 B |       879 B |     364 B |      219 B |     500 B |
| react   | `@lyra-ds/react/empty-state`             |   1,834 B |       844 B |     311 B |      170 B |     500 B |
| react   | `@lyra-ds/react/breadcrumb`              |   1,986 B |       925 B |     376 B |      224 B |     500 B |
| react   | `@lyra-ds/react/tabs`                    |   9,340 B |     5,863 B |   1,903 B |    1,567 B |    1.6 kB |
| react   | `@lyra-ds/react/accordion`               |   2,898 B |     1,698 B |     627 B |      425 B |      1 kB |
| react   | `@lyra-ds/react/stepper`                 |   2,341 B |     1,354 B |     518 B |      343 B |      1 kB |
| react   | `@lyra-ds/react/pagination`              |   2,958 B |     1,768 B |     639 B |      472 B |      1 kB |
| react   | `@lyra-ds/react/tooltip`                 |  13,454 B |     7,959 B |   2,291 B |    1,954 B |    2.1 kB |
| react   | `@lyra-ds/react/select`                  |   4,517 B |     1,819 B |     705 B |      483 B |    1.5 kB |
| react   | `@lyra-ds/react/dropdown`                |  16,256 B |     9,179 B |   2,904 B |    2,440 B |   2.44 kB |
| react   | `@lyra-ds/react/popover`                 |  15,796 B |     8,028 B |   2,584 B |    2,167 B |      3 kB |
| react   | `@lyra-ds/react/combobox`                |  59,482 B |    33,732 B |   8,958 B |    8,678 B |  8.678 kB |
| react   | `@lyra-ds/react/time-zone-picker`        |  65,929 B |    39,744 B |  10,581 B |   10,219 B | 10.219 kB |
| react   | `@lyra-ds/react/table`                   |   2,256 B |     1,162 B |     453 B |      285 B |     700 B |
| react   | `@lyra-ds/react/data-table`              |  11,702 B |     7,826 B |   2,303 B |    1,853 B |   2.25 kB |
| react   | `@lyra-ds/react/person-cell`             |   2,721 B |     1,566 B |     572 B |      391 B |     800 B |
| react   | `@lyra-ds/react/action-bar`              |   2,406 B |     1,488 B |     548 B |      363 B |     700 B |
| react   | `@lyra-ds/react/sidebar-group`           |   3,242 B |     2,168 B |     699 B |      504 B |     900 B |
| react   | `@lyra-ds/react/app-sidebar`             |   8,134 B |     4,979 B |   1,458 B |    1,117 B |      2 kB |
| react   | `@lyra-ds/react/bottom-nav`              |   1,915 B |       911 B |     376 B |      222 B |     700 B |
| react   | `@lyra-ds/react/toast`                   |   2,053 B |       929 B |     411 B |      257 B |     700 B |
| react   | `@lyra-ds/react/toast-provider`          |   6,546 B |     4,332 B |   1,369 B |    1,073 B |    1.5 kB |
| react   | `@lyra-ds/react/cookie-banner`           |   8,770 B |     4,322 B |   1,502 B |    1,195 B |    1.5 kB |
| react   | `@lyra-ds/react/command-palette`         |  93,422 B |    53,853 B |  13,686 B |   12,901 B |   13.6 kB |
| react   | `@lyra-ds/react/theme-provider`          |   4,358 B |     1,641 B |     664 B |      470 B |    0.7 kB |
| react   | `@lyra-ds/react/recurrence-selector`     |  83,758 B |    53,429 B |  12,345 B |   10,755 B |     11 kB |
| react   | `@lyra-ds/react/weekly-schedule-editor`  | 134,076 B |    81,427 B |  19,705 B |   18,155 B |   18.7 kB |
| react   | `@lyra-ds/react/slot-picker`             |  88,466 B |    56,805 B |  14,338 B |   13,462 B |     14 kB |
| react   | `@lyra-ds/react/calendar-view`           |  59,971 B |    35,988 B |   9,242 B |    8,884 B |    9.5 kB |
| alpine  | `@lyra-ds/alpine`                        | 236,742 B |   143,932 B |  27,249 B |   24,686 B |  24.75 kB |

## Scenarios

| Scenario          |    Raw JS | Minified JS | Brotli JS | Rolldown modules |
| ----------------- | --------: | ----------: | --------: | ---------------: |
| form              |  20,798 B |     7,686 B |   1,878 B |                6 |
| overlays          | 129,946 B |    69,432 B |  11,554 B |                6 |
| application-shell | 124,939 B |    73,277 B |  17,935 B |               93 |
| scheduling        | 243,217 B |   147,328 B |  24,570 B |               92 |
| files-data        |  78,247 B |    50,679 B |  12,058 B |               32 |

## CSS entries

| Entry                               |   Raw CSS | Minified CSS | Brotli CSS |
| ----------------------------------- | --------: | -----------: | ---------: |
| `@lyra-ds/styles`                   | 166,501 B |    114,626 B |   14,561 B |
| `@lyra-ds/styles/styles.css`        | 166,501 B |    114,626 B |   14,561 B |
| `@lyra-ds/styles/tokens/brand.css`  |   1,702 B |      1,292 B |      361 B |
| `@lyra-ds/styles/compat-shadcn.css` |   1,400 B |        649 B |      208 B |

The JSON beside this report is the machine-readable source of truth, including the complete Rolldown module-contribution records.
