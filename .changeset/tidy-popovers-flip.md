---
'@lyra-ds/styles': minor
'@lyra-ds/react': minor
---

Popups now open upward when there is no room below, instead of forcing a page scroll

`Combobox`, `Dropdown` and `WorkspaceSwitcher` measure the space under their trigger when they
open and flip above it when the popup does not fit and there is more room above. Placement is
re-measured while open on scroll and resize.

Space is measured against `visualViewport`, not `window.innerHeight`: on iOS Safari the layout
viewport extends behind the dynamic toolbar and ignores pinch zoom, so a popup could "fit" below
while sitting off-screen. Placement also updates when the visual viewport itself changes — toolbar
collapse, pinch zoom, or the on-screen keyboard opening under the Combobox search input.

Focusing the popup's first target (the Combobox search input, the first menu item, the selected
workspace) now passes `preventScroll`, so opening a popup near the bottom of the viewport no
longer scrolls the page out from under the trigger.

Adds the `.lyra-combobox__pop--up`, `.lyra-menu--up` and `.lyra-wssw__pop--up` modifiers and the
`lyra-pop-in-up` entrance keyframe to `@lyra-ds/styles`. Consumers using the plain CSS classes can
apply the modifier themselves; the default downward placement is unchanged.
