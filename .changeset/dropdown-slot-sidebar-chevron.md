---
'@lyra-ds/react': minor
'@lyra-ds/styles': patch
---

The Dropdown trigger becomes the control, SidebarGroup gets its chevron back, and the palette's quiet text clears AA

**Dropdown** wrapped whatever you passed as `trigger` in a `span[role="button"][tabIndex=0]`. With
the documented usage — a `Button` — that produced two tab stops for one control: the span carrying
`aria-haspopup` and `aria-expanded`, and the button inside it carrying neither, so the element a
person actually focused announced nothing about opening a menu. axe reported it as
`nested-interactive`, serious.

The trigger element now *becomes* the control. Dropdown merges the role, the tab stop and the menu
ARIA onto the element you pass, using the same internal Slot that backs `Button asChild` and
`Card asChild`; props already on your element win the merge, so a trigger with its own `aria-label`
keeps it. A bare string trigger still gets a span of its own. Consumers who were working around this
by passing a non-interactive span — as FileManager did internally — can now pass the real control.

**SidebarGroup**'s collapse chevron was an empty `<span>`: 0×0, no mask, nothing drawn. The handoff
renders an `Icon` there and the CSS class only supplies the rotation, so the conversion had dropped
the icon and left a collapsible group with no visible affordance and no indication of its state. It
renders the icon again, at the handoff's 13px, and rotates as it always meant to.

**CommandPalette**'s group headings and item hints were `--text-faint` — 2.56:1 on the card and
2.34:1 on a highlighted row in light. The heading names the group a command belongs to and the hint
is what tells two similarly-named commands apart; both take `--text-secondary`. `.lyra-kbd`, the
keyboard chip, had the same 4.34:1 pair at 11px and takes the same repair — a key cap you have to
squint at defeats the point of printing the shortcut.
