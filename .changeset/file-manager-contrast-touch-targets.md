---
'@lyra-ds/styles': patch
---

FileManager: readable column headings and full-size touch targets in the file list

The list's column headings (`.lyra-fm__head`) were `--text-faint`, which measures 2.56:1 on the card
surface in light and 3.92:1 in dark — below WCAG AA's 4.5:1 for text at that size. They move one step
up the ramp to `--text-secondary` (7.5:1 light, ~11:1 dark), keeping the quiet tone the handoff
intended. This is the same call the docs site already made for its own group labels.

Two hit areas in the row grow to 44×44 without anything moving on screen. `.lyra-fm__name` was 30px
tall inside a row the handoff already sizes at 44px, so it stretches and reclaims the row's vertical
padding with a negative margin; its box is transparent, so the only visible consequence is that the
browser's focus ring now hugs the real target. `.lyra-fm__more` keeps its 30px visible box — it has a
hover background that would have grown with it — and gains the extra area from a transparent
`::after` overlay that stays inside the grid gap.

The view toggle (30×28) and the breadcrumb (24px) were left alone: growing them would raise the
toolbar and the path bar on every screen, and both already clear WCAG 2.2 AA's 24×24 minimum.

Consumers on the plain CSS classes get all of this from the stylesheet with no markup change.
