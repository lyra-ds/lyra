---
'@lyra-ds/alpine': minor
---

`lyraDrawer` — modal slide-over porting the React Drawer state machine: named `overlay`/`panel`/`title`/`close` bindings over consumer-rendered markup (no teleport), `defaultOpen`/`labelId` seeding, `open` controllable via `x-modelable`, unconditional Escape/backdrop/close-button dismissal, initial focus + focus restore, focus trap, reference-counted body scroll lock, and exit presence (`--closing` classes with an animationend/fallback finalize).
