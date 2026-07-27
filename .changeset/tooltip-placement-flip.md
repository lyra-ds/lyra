---
'@lyra-ds/react': minor
'@lyra-ds/styles': patch
---

Tooltip gains a placement, flips instead of being clipped, and can actually be dismissed

The handoff recipe only ever drew the tip above its target, so a tooltip near the top of the viewport
was clipped with no way to recover — the same problem the popovers already solved. A new `placement`
prop takes `top` (default), `bottom`, `left` or `right`, and the tip flips to the opposite side on
its own when the chosen one does not fit. Space is measured against `visualViewport` rather than
`window.innerHeight`: on iOS the layout viewport extends behind the dynamic toolbar and ignores pinch
zoom, so a bubble can "fit" on paper while sitting off-screen. The flip is one-way, so a tip does not
oscillate as the page scrolls. Because the bubble is a `::after` pseudo-element with no node of its
own, its size is read from `getComputedStyle(node, '::after')`.

`Escape` now really dismisses the tip. The stylesheet drove visibility purely from `:hover` and
`:focus-within`, so pressing Escape changed the component's state while the bubble stayed on screen —
the opposite of what WCAG 1.4.13 asks. A `[data-state='closed']` rule now wins over the hover rule,
and the key is heard at the document, because a tip opened by hovering never has focus inside it.
