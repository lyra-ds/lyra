---
'@lyra-ds/styles': patch
---

Toast's close button gets a usable hit area

The close glyph measured 12×19 CSS px — the one control in the system that failed WCAG 2.2 AA's
24×24 minimum outright, rather than merely sitting under the project's own 44px preference. It keeps
its visible size and gains a transparent hit area from an `::after` overlay, the same repair already
applied to the file list's action trigger.

The overlay stops at 12px on each side because that is the flex gap to the message: any larger and a
tap at the end of the message text would dismiss the toast. The result is 36×44 — the full height of
the toast, and comfortably past the minimum.
