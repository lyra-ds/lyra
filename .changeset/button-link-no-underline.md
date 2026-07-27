---
'@lyra-ds/styles': patch
---

Button: button-styled links (`Button asChild` / `<a class="lyra-btn">`) no longer
inherit the base `a:hover` underline — `.lyra-btn:hover` now resets text-decoration.
