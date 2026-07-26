---
'@lyra-ds/styles': minor
'@lyra-ds/react': minor
---

Accordion panels now animate open instead of appearing instantly

The handoff mounts the panel on open, so Accordion was the one disclosure in the system with no
motion while Dialog, the command palette and the popovers all animate. The panel now stays mounted
inside `.lyra-acc__panel-wrap` and its height transitions through `grid-template-rows: 0fr → 1fr`,
which animates to the content's real height without hard-coding one.

A collapsed panel is `inert` and `visibility: hidden`, so mounting it does not put its content in
the tab order or the accessibility tree. `prefers-reduced-motion: reduce` drops the transition.

`.lyra-acc__panel` gains an unpadded `.lyra-acc__panel-clip` parent: a `0fr` grid row still reserves
its item's padding, so a padded panel could not collapse to zero without it.

Consumers using the plain CSS classes need the two new wrapper elements around the panel to get the
animation; the markup without them still renders correctly, just without motion.
