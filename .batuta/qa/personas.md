# Product personas

## Keyboard navigator

- Base: accessibility-reliant
- Goal: choose a destination and dismiss transient UI without losing position.
- Familiarity: knows web keyboard conventions, new to this component gallery.
- Device/network: desktop Chromium, 1440×1000, ordinary connection.
- Modality/locale: keyboard, en-US; DOM accessibility semantics inspected.
- Patience: controls respond within 5 seconds; one clean retry after a stall.
- Reveals: hidden focus, ambiguous names, traps, shortcut conflicts.
- Exclusion: no spoken screen-reader output or specialist accessibility audit.

## Mobile teammate

- Base: mobile
- Goal: open navigation, reach the destination, and recover after cancellation.
- Familiarity: casual SaaS user, no library implementation knowledge.
- Device/network: touch-emulated Chromium, 375×812 then 320px and orientation.
- Modality/locale: touch, en-US; dark and reduced-motion preferences.
- Patience: 5 seconds per direct action; no workaround through private state.
- Reveals: covered controls, duplicate navigation, scroll and resize failures.
- Exclusion: emulation does not qualify real iOS Safari or Android hardware.

## Integrating developer

- Base: new
- Goal: use the documented confirmation and persistent-reminder examples.
- Familiarity: React developer evaluating the published examples.
- Device/network: desktop Chromium, 1280×900, ordinary connection.
- Modality/locale: pointer plus keyboard, en-US.
- Patience: reads the documented 8-second policy; waits up to 12 seconds.
- Reveals: premature dismissal, inaccessible actions, misleading guidance.
