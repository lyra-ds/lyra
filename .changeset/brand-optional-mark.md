---
'@lyra-ds/react': patch
'@lyra-ds/styles': patch
---

Make `Brand`'s `mark` optional (lyra-ds/lyra#188). Without it, Brand draws an initial-letter mark from the wordmark text (or `aria-label` for a mark-only brand) styled by the new `.lyra-brand__mark--initial` class, so copy-pasted bare snippets no longer break. Explicit `mark`/`markDark` behave as before.
