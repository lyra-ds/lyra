---
'@lyra-ds/styles': minor
---

Fix checkbox, radio and switch non-text contrast (lyra-ds/lyra#264). The check mark is now drawn with a CSS mask filled by `--on-accent` instead of a hardcoded white SVG, and the radio ring uses `--on-accent`. Unchecked checkbox/radio borders and the switch track use `--border-input`, which is now darker in both themes (light `#7C8CA3`, dark `#707AB8`) so it reaches 3:1 on the raised and sunken surfaces.

Visible token change: `--border-input` is darker in both themes, so the border of every field that uses it (inputs, selects, textareas and the other form controls, not only checkbox/radio/switch) is now darker to meet 3:1.

Visible token change: `--border-input` is darker in both themes, so the border of every field that uses it (inputs, selects, textareas and other form controls, not only checkbox/radio/switch) is now darker to meet 3:1.
