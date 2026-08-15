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
