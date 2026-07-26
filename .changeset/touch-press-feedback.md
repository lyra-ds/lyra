---
'@lyra-ds/styles': minor
---

Touch presses no longer flash the browser's grey tap rectangle

On iOS, Safari paints its own translucent grey rectangle at the moment of a tap. It reads as a
glitch on light surfaces, is invisible on dark ones, and was the only touch feedback most Lyra
controls had — only Button defined an `:active` state.

Under `@media (hover: none)`, the 20 interactive recipes now suppress that highlight and answer a
press with the same half-pixel push Button already used, so the acknowledgement belongs to the
design system rather than the platform. Devices with a hover-capable pointer are untouched: no
desktop appearance changes.
