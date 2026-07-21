---
'@lyra-ds/styles': patch
'@lyra-ds/react': patch
---

Card: group header actions with a new `.lyra-card__actions` class instead of an
inline flex style, keeping appearance entirely in `@lyra-ds/styles` (CSS-first).
No visual change — the class carries the same `display:flex; gap` the inline
style did. The parity additive-extension allowlist is generalized to allow
documented package-only classes in more than one component file.
