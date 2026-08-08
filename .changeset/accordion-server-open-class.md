---
'@lyra-ds/alpine': patch
---

Accordion: remove `lyra-acc__item--open` on close even when the class was rendered statically by the server (the `:class` binding now uses object syntax so Alpine reconciles pre-existing classes)
