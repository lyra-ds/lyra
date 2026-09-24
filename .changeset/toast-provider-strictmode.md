---
'@lyra-ds/react': patch
---

Fix `ToastProvider` ignoring new toasts under React StrictMode after its effect cleanup runs. Reset the unmounted flag on effect setup so the provider accepts notifications after the development-only effect replay. Fixes lyra-ds/lyra#256.
