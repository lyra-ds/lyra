---
'@lyra-ds/styles': patch
---

Fix selected items losing their accent treatment under the pointer. An idle `:hover` rule outweighed the `--active` class beside it on specificity, so the selection read as unselected exactly while a person pointed at it — in SegmentedControl and the sidebar group item (accent surface replaced by the idle hover surface) and in the underline Tab (accent text dropping to `--text-primary` while its underline stayed accent, light theme only). Each hovered-active state is now stated explicitly as a tinted step of the active one, matching the `.lyra-page--active:hover` precedent.
