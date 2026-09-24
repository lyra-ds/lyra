---
'@lyra-ds/react': patch
---

Fix toasts not being announced by screen readers (#257). `ToastStack` is now a persistent `aria-live="polite"` region and `Toast` drops its own `role="status"` when rendered inside it (it stays on a standalone `Toast`). `ToastProvider` mounts persistent polite and assertive regions before any toast, so error toasts are announced assertively.
