---
'@lyra-ds/styles': patch
---

Give CommandPalette search inputs and command items a 44px minimum interactive target on all
pointer profiles in inline and modal palettes. Their minimum height follows the existing
`--control-md` sizing token with a 44px floor, allowing consumers to configure larger controls.
Keep search inputs within narrow panels.
