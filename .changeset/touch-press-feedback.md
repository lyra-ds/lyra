---
'@lyra-ds/styles': minor
---

Touch presses no longer flash the browser's grey tap rectangle

On iOS, Safari paints its own translucent grey rectangle at the moment of a tap. It reads as a
glitch on light surfaces, is invisible on dark ones, and was the only touch feedback most Lyra
controls had — only Button defined an `:active` state.

The 20 interactive recipes now suppress that highlight and answer a press with the same half-pixel
push Button already used, so the acknowledgement belongs to the design system rather than the
platform.

These rules are deliberately not gated behind `hover`/`pointer` media queries. An iPad in its
default "desktop site" mode reports `hover: hover` and `pointer: fine`, so a touch-gated rule never
reaches the device that needs it most. `-webkit-tap-highlight-color` has no effect on a mouse
anyway, and the press feedback matches what Button already applied unconditionally.
