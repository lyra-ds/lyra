# Task 2 report — Styles contrast remediation

## Changes

- Corrected dark `--text-faint` to `var(--night-300)` and dark default `--accent-hover` to `var(--indigo-700)`.
- CalendarView session/program-session event text now uses the existing `--text-primary` token. The temporary `--calendar-event-text` alias was removed during Task 5 final reconciliation; event bars and class selectors are unchanged.
- Retained Acme’s `--brand` derivation, `--brand-contrast`, and `@supports` fallback. Its light hover/active mixes use `8%` / `16%` white sRGB mixes; the ordering contract test matches the source.

## Evidence

- Task 1 RED, in the pinned Docker browser service: dark faint card `3.923:1`, light CalendarView session time `4.169:1`, and Acme primary hover `4.138:1` in Chromium/Firefox/WebKit. `.lyra-kbd` was already green.
- Focused Task-2-owned contrast probes: 4 passed, 1 deferred probe skipped, in each of Chromium, Firefox, and WebKit.
- `brand-theme.test.ts`: 48 passed in each of Chromium, Firefox, and WebKit.
- Historical Task-2 canonical runs reported four corrected passes plus the intentionally deferred
  generic light `faint-sunken` RED (`4.344:1`) in Chromium and Firefox. The concurrent WebKit
  diagnostic hit an unrelated `tracing.stopChunk` byte-stream error after the CalendarView and
  keyboard probes passed; it did not block acceptance because the later complete pinned matrix
  exited 0 in all three engines.

## Deferred concern

The generic light `faint-sunken` fixture remains RED by design. It is not a measured component ownership target, and the plan requires Task 3’s unfiltered React axe result to supply the real selector before replacing that fixture probe. No global light `--text-muted` or `--text-faint` was changed.

## Fix round 1 — branded state calibration

- RED: the new light-Acme ordering contract required derived hover/active fills to be lighter than the base brand, but the prior black mixes made hover darker (`112.7082` versus base `118.4326` perceived luminance) in pinned Chromium.
- GREEN: light brand hover/active now derive from `var(--brand)` through 8%/16% white sRGB mixes. The test asserts their lighter ordered relationship, teal-family preservation, and normal-text AA using the final resolved `--on-accent` against rest, hover, and active fills.
- Pinned Docker verification: `brand-theme.test.ts` passed 49/49 in Chromium, Firefox, and WebKit; the four Task-2-owned canonical contrast assertions passed in each engine. The generic deferred light-sunken probe remained excluded from the focused command as documented above.

## Task 5 disposition

The synthetic light `faint-sunken` assertion was retired after the unfiltered React and Alpine runs identified and corrected the actual shipped nodes. The same fixture remains in the dark-only token-surface contract, where `--text-faint` on `--surface-sunken` is a real dark regression target.

The final light-sunken owners are the Combobox option hint/trailing text, File Manager inactive
view, and Workspace slug prefix; their narrow source declarations now use `--text-secondary`,
yielding `rgb(71, 85, 105)` on `rgb(241, 245, 249)` at `6.917:1` in Chromium, Firefox, and
WebKit. `.lyra-kbd`/`sunken-label` remains an additional, already-green regression and was not the
owner of the original axe finding. The historical generic light `faint-sunken` RED is therefore
not part of the final assertion; only the real dark token-surface probe remains.
