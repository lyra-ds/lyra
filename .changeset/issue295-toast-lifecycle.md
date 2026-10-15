---
"@lyra-ds/react": major
"@lyra-ds/alpine": major
"@lyra-ds/styles": patch
---

Change implicit toast duration to 8000 ms for info/success and persistent for danger/error.
Per-toast durations override explicit global configuration, including 0 and explicit global 8000.
Only newly queued notifications use configuration changes; retained React methods read committed
configuration. Pointer and focus interaction independently pause remaining time. Use an explicit
`duration: 0` for action-bearing React messages.

Dismissal of a focused row restores its eligible opener or its persistent named notification region
(a landmark), including after the last row disappears. The fallback has a CSS focus indicator.
React `ToastProvider` accepts the standard optional `aria-label` to name coexisting notification
regions distinctly; the default name remains "Notifications". Existing Alpine
markup remains supported without an additional row binding. Announcement regions and standalone
Toast/ToastStack contracts are preserved. React teardown invalidates retained calls and SSR calls create no state or timers. Alpine store
timers continue without a renderer and renderer teardown releases only its own pause claims.

Migration: set React `<ToastProvider duration={4000}>` or assign
`Alpine.store('lyraToasts').duration = 4000` to retain the previous delay for every tone. Explicit
per-toast durations still take precedence. Coordinate these React/Alpine releases with the Styles
focus fallback update; imported Blade contracts are unchanged and compatibility is not asserted.
