---
'@lyra-ds/styles': patch
---

Add an `--on-danger` token (default `#FFFFFF`, light and dark) and use it for the text of `.lyra-btn--danger` instead of a hardcoded `#fff`, so brands with a light `--danger` can set an accessible label colour. Fixes lyra-ds/lyra#263.
