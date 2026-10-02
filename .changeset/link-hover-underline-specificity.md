---
'@lyra-ds/styles': patch
---

Fix the global `a:hover { text-decoration: underline }` rule outranking component and app classes on hover. The rule now reads `a:where(:hover) { text-decoration: underline }`, tying the resting `a { text-decoration: none }` rule's specificity instead of beating any class selector, so a consumer's own `.some-class { text-decoration: none }` wins on hover without needing its own `:hover` override. The `.lyra-menu__item:hover` reset fixes menu links, whose resting class does not declare `text-decoration`; the existing `.lyra-wssw__item:hover`, breadcrumb, and footer link resets remain.
