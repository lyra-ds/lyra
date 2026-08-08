---
'@lyra-ds/alpine': patch
---

Accordion and Tabs: remove the state classes (`lyra-acc__item--open`, `lyra-tab--active`) even when they were rendered statically by the server — the `:class` bindings now use object syntax so Alpine reconciles pre-existing classes
