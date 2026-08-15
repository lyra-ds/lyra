# Task 1 report — rendered-composite RED coverage

## Changes

- Added `packages/styles/tests/fixtures/contrast-regressions.html` with the seven required probes and shipped classes.
- Added `packages/styles/tests/contrast-regressions.test.ts`, importing `../styles.css` and the fixture via `?raw`.
- Added canvas CSS-color conversion, WCAG relative luminance, and exported `contrast(foreground, background)` helper.
- Dark translucent CalendarView surfaces are composited onto the rendered page surface before the AA assertion; primary hover is driven with `userEvent.hover` and polled after transition settlement.

## RED evidence

All commands ran through `compose.playwright.yml`'s pinned `browser-tests` service (no Playwright installation command was run):

```text
rtk env UID=$(id -u) GID=$(id -g) docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name firefox'
```

Exit 1, 5 tests: 2 failed, 3 passed. Failing pairs:

- `faint-sunken`: `rgb(100, 116, 139)` on `rgb(241, 245, 249)`, `4.344:1`.
- dark `faint-card`: `rgb(108, 115, 158)` on `rgb(18, 20, 48)`, `3.923:1`.

The CalendarView session/program-session, light sunken label, and branded primary hover executed successfully.

```text
rtk env UID=$(id -u) GID=$(id -g) docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name chromium'
```

Exit 1, 5 tests: 2 failed, 3 passed. Same two pairs and ratios as Firefox.

```text
rtk env UID=$(id -u) GID=$(id -g) docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name webkit'
```

Exit 1, 5 tests: 2 failed, 3 passed. Same two pairs and ratios as Firefox/Chromium.

## Commit

- `41dc2fed297fe5cee94483d519b7fd0f59bb416b` — `test(styles): cover known contrast composites`

## Concerns

- The Docker run created an untracked `.pnpm-store/` directory in the worktree; it is intentionally not staged.
- Baseline RED is intentionally retained; no production CSS or component/helper source was modified.
