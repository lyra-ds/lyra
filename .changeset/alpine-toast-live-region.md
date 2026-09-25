---
'@lyra-ds/alpine': patch
---

Fix toasts not being announced by screen readers (#257). `lyraToastStack()` now exposes `politeToasts` and `assertiveToasts` getters (alongside `toasts`); served markup renders them in two persistent `data-lyra-toast-region` regions (`aria-live="polite"` and `"assertive"`) inside a non-live `.lyra-toast-stack`, and toast rows drop their own `role="status"`. Danger toasts are announced assertively.
