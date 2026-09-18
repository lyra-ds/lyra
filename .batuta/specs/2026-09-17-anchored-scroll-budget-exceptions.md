# Anchored scrolling budget exceptions — 2026-09-17

Status: **approved by the maintainer on 2026-09-17**: “aprovo sim, quais os novos limites?”. This approval covers only the 13 exact numerical limits below, adopted without any numerical change after approval. The product repair remains uncommitted in `fix/v1-anchored-scroll`, based on `9207dac`; PR #230 independently merged as `56f3a637` after its CI passed.

## Finding

Before the repair, the existing implementation let a 40-command popup in a 390 × 844 viewport extend to y=2120, where a native touch gesture scrolled the page instead of the menu. Dropdown, Popover and WorkspaceSwitcher now constrain their chosen viewport side and retain native scrolling; keyboard focus reveals offscreen commands and the selected workspace; inline consumer geometry is preserved when it fits and restored on cleanup. There are no new dependencies or public APIs. Combobox and TimeZonePicker inherit some shared-helper code while retaining their existing behavior; this is disclosed rather than hidden by the exception. One bounded size-optimization attempt (separating the observer through render-version state) caused continuous idle renders and was rejected; the exact earlier verified source was restored by byte comparison and the same idle diagnostic passes. No speculative architecture work is proposed.

The normal budget command fails at the four absolute caps and therefore does not reach the historical/scenario gates. The isolated diagnostic reuses the same preserved archives, the original cold-consumer measurement routines and unchanged limits, retaining failed Size Limit rows so all 72 standalone entries, five scenarios and four CSS entries can be measured; it is diagnostic evidence only, and its different command metadata correctly fails the formal protocol check. Historical deltas below are calculated against the existing reference `0003123e22ec57d21946b3f6f383fd2da7d1bd0a` without changing or waiving that protocol.

## Accepted decision

Adopt exactly these 13 limits. Values are decimal bytes with no spare margin. Absolute limits are Size Limit measurements; historical/scenario limits are Brotli growth relative to the existing approved baseline, not total bundle sizes. The two metrics are never added together.

| Kind | Entry | Current limit | Approved limit | Increase |
| --- | --- | ---: | ---: | ---: |
| Absolute | Dropdown | 2,000 | 2,440 | 440 |
| Absolute | TimePicker | 7,900 | 7,912 | 12 |
| Absolute | Combobox | 8,500 | 8,678 | 178 |
| Absolute | TimeZonePicker | 10,000 | 10,219 | 219 |
| Historical Brotli growth | TimePicker | 4,218 | 4,591 | 373 |
| Historical Brotli growth | DatePicker | 4,260 | 4,616 | 356 |
| Historical Brotli growth | DateRangePicker | 4,242 | 4,621 | 379 |
| Historical Brotli growth | RecurrenceSelector | 4,235 | 4,622 | 387 |
| Historical Brotli growth | WeeklyScheduleEditor | 4,240 | 4,618 | 378 |
| Historical Brotli growth | Alpine | 3,000 | 3,023 | 23 |
| Scenario Brotli growth | overlays | 6,137 | 6,642 | 505 |
| Scenario Brotli growth | application-shell | 4,310 | 4,747 | 437 |
| Scenario Brotli growth | scheduling | 4,546 | 4,976 | 430 |

Implementation files: `packages/react/package.json` (the four absolute Size Limit caps), `tools/bundle-baseline/budgets.mjs` (the same four approved-absolute entries, including explicit newly excepted Dropdown, Combobox and TimeZonePicker, plus the nine approved growth caps), and `tools/bundle-baseline/measure.test.mjs` (existing unit cases moved to the new approved boundaries). No product source, package version, lockfile, baseline artifact, fixture identity, other cap, CI or release change. The reference revision, approved fixture source SHA-256 and root lockfile identity remain unchanged; all other absolute caps and the 1500/3000 default ceilings stay as they are.

## Artifact and measurement identity

- React archive: `4240060ad234d030c00fd5cb0556a53307c504014361c31fe94180e5a8c75ef3`.
- Alpine archive: `324c2adc2bc25c77ad34d857baa3aef195017d01f31e8018e5b4ed50c15998a8`.
- Styles archive, unchanged: `f88b5ada8c154d45e824e243984a4c9bb880c465b57744ca507d9d253dec42bd`.

Raw records under `.batuta/runs/pr223-followup/` in the main checkout: `anchored-critical-budget-diagnostic.json`, `anchored-critical-budget-deltas.json`, `anchored-critical-budgets.log`, `anchored-critical-checks.json`, `anchored-critical-native.json`, and `anchored-critical-selected.json`; the exact source diff is `anchored-critical-verified.diff`. Controller verification passed 93 React and 65 Alpine focused cases in each of Chromium, Firefox and WebKit (474), both type checks, formatting, and React lint (one unrelated existing warning), plus six public packed touch/keyboard/action cases and selected-last WorkspaceSwitcher native hit testing with unchanged page position.

## Release boundary

This approval does not authorize versioning or publication. Authorized follow-through: update only these caps, their existing policy assertions and this record; run the real unmodified budget command on the same product source; complete the record; integrate onto current main and use the existing CI, merging only after all required checks pass under the maintainer's standing admin-merge authorization. Composed/media acceptance reconciliation and exact versioned candidate acceptance remain separate V1 work.
