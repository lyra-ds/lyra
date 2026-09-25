---
'@lyra-ds/styles': patch
---

Stop `SlotPicker` overflowing narrow viewports (lyra-ds/lyra#97). The row now wraps so the slot column sits under the calendar, the calendar shrinks to its container, and the slot column's 232px minimum is capped to the container width. Desktop layout and 44px slot targets are unchanged.
