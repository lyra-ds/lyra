---
'@lyra-ds/alpine': minor
---

`lyraDialog` — APG modal dialog porting the React Dialog state machine: named `overlay`/`panel`/`title`/`close` bindings over consumer-rendered markup (no teleport), `defaultOpen`/`closeOnEsc`/`closeOnOverlayClick`/`labelId` seeding, `open` controllable via `x-modelable`, initial focus + focus restore, focus trap, reference-counted body scroll lock, WR-02 backdrop press+release dismissal, and exit presence (`--closing` classes with an animationend/fallback finalize). Shared internals `focus-trap`, `scroll-lock`, and `presence` land for Drawer.
