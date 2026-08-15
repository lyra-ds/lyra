# Task 1 report — rendered-composite RED coverage

## Changes

- Added `packages/styles/tests/fixtures/contrast-regressions.html` with the seven required probes and shipped classes.
- Added `packages/styles/tests/contrast-regressions.test.ts`, importing `../styles.css` and the fixture via `?raw`.
- Added canvas CSS-color conversion, WCAG relative luminance, and exported `contrast(foreground, background)` helper.
- Dark translucent CalendarView surfaces are composited onto the rendered page surface before the AA assertion; primary hover is driven with `userEvent.hover`, then finite animations are settled directly before the final computed-style assertion.

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

## Reviewer fix round 1 evidence

- CalendarView assertions now select `.lyra-calview__evt-time`, multiply its shipped `opacity: 0.85` into the foreground alpha, and composite that visible text over its event chip's final rendered background before calculating WCAG contrast. This produces the intended baseline failure: light `session` time is `rgb(74, 72, 184)` over `rgb(224, 225, 251)` at `4.169:1`.
- Primary hover no longer uses polling or a timeout. It calls `userEvent.hover`, finishes finite `document.getAnimations()` with the existing try/catch behavior for infinite animations, forces a computed-style read, then asserts the final pair directly. Baseline branded primary hover is `4.138:1` (`oklch(0 0 184.7)` over `oklab(0.528191 -0.0910448 -0.00748483)`) in Chromium.

Focused pinned Docker Browser Mode commands, all exit 1 with 5 tests: 4 failed, 1 passed:

```text
rtk env UID=$(id -u) GID=$(id -g) docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name chromium'
```

Chromium: `faint-sunken` 4.344:1, dark `faint-card` 3.923:1, light `session` time 4.169:1, branded primary hover 4.138:1. `sunken-label` passed.

```text
rtk env UID=$(id -u) GID=$(id -g) docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name firefox'
```

Firefox: same four RED pairs and ratios (serialization differs for Oklab/Oklch only); `sunken-label` passed.

```text
rtk env UID=$(id -u) GID=$(id -g) docker compose -f compose.playwright.yml run --rm --entrypoint sh browser-tests -lc 'corepack pnpm@11.13.1 --filter @lyra-ds/styles exec vitest run tests/contrast-regressions.test.ts --browser.name webkit'
```

WebKit: same four RED pairs and ratios; `sunken-label` passed.
