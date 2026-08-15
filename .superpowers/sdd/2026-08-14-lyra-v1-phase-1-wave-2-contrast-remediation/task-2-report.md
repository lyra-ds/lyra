# Task 2 report — Styles contrast remediation

## Changes

- Corrected dark `--text-faint` to `var(--night-300)` and dark default `--accent-hover` to `var(--indigo-700)`.
- Added the narrow `--calendar-event-text` semantic token, paired with `--text-primary` in each theme, and used it for CalendarView session/program-session event text. The event bars and class selectors are unchanged.
- Retained Acme’s `--brand` derivation, `--brand-contrast`, and `@supports` fallback. Its light hover/active mixes now use the smallest measured black-on-hover AA-safe steps (`5%` / `9%`) in sRGB; the ordering contract test was updated so its description matches the source.

## Evidence

- Task 1 RED, in the pinned Docker browser service: dark faint card `3.923:1`, light CalendarView session time `4.169:1`, and Acme primary hover `4.138:1` in Chromium/Firefox/WebKit. `.lyra-kbd` was already green.
- Focused Task-2-owned contrast probes: 4 passed, 1 deferred probe skipped, in each of Chromium, Firefox, and WebKit.
- `brand-theme.test.ts`: 48 passed in each of Chromium, Firefox, and WebKit.
- Full canonical contrast runs now report four corrected passes plus the same intentionally deferred generic `faint-sunken` RED (`4.344:1`) in Chromium and Firefox. The concurrent WebKit full run hit an unrelated `tracing.stopChunk` byte-stream error after the CalendarView and keyboard probes passed; the subsequent isolated focused WebKit command passed all four Task-2-owned probes.

## Deferred concern

The generic light `faint-sunken` fixture remains RED by design. It is not a measured component ownership target, and the plan requires Task 3’s unfiltered React axe result to supply the real selector before replacing that fixture probe. No global light `--text-muted` or `--text-faint` was changed.

## Fix round 1 — branded state calibration

- RED: the new light-Acme ordering contract required derived hover/active fills to be lighter than the base brand, but the prior black mixes made hover darker (`112.7082` versus base `118.4326` perceived luminance) in pinned Chromium.
- GREEN: light brand hover/active now derive from `var(--brand)` through 8%/16% white sRGB mixes. The test asserts their lighter ordered relationship, teal-family preservation, and normal-text AA using the final resolved `--on-accent` against rest, hover, and active fills.
- Pinned Docker verification: `brand-theme.test.ts` passed 49/49 in Chromium, Firefox, and WebKit; the four Task-2-owned canonical contrast assertions passed in each engine. The generic deferred light-sunken probe remained excluded from the focused command as documented above.
