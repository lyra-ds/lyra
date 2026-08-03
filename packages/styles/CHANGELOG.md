# @lyra-ds/styles

## 0.3.0

## 0.2.0

## 0.1.1

## 0.1.0

### Minor Changes

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`5e4ea38`](https://github.com/lyra-ds/lyra/commit/5e4ea389438f913143f5da86a567d902043ff58b) Thanks [@franciscpd](https://github.com/franciscpd)! - Accordion panels now animate open instead of appearing instantly

  The handoff mounts the panel on open, so Accordion was the one disclosure in the system with no
  motion while Dialog, the command palette and the popovers all animate. The panel now stays mounted
  inside `.lyra-acc__panel-wrap` and its height transitions through `grid-template-rows: 0fr → 1fr`,
  which animates to the content's real height without hard-coding one.

  A collapsed panel is `inert` and `visibility: hidden`, so mounting it does not put its content in
  the tab order or the accessibility tree. `prefers-reduced-motion: reduce` drops the transition.

  `.lyra-acc__panel` gains an unpadded `.lyra-acc__panel-clip` parent: a `0fr` grid row still reserves
  its item's padding, so a padded panel could not collapse to zero without it.

  Consumers using the plain CSS classes need the two new wrapper elements around the panel to get the
  animation; the markup without them still renders correctly, just without motion. Markup that adds
  the wrapper but omits the clip element degrades to an unpadded collapse rather than a blank gap.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`76f3217`](https://github.com/lyra-ds/lyra/commit/76f3217915e92d0ddc30360c76eb223ddb8e395d) Thanks [@franciscpd](https://github.com/franciscpd)! - Primary accent text and icons now automatically use a contrast-aware black or white ink for your
  white-label brand, while browsers without relative color syntax safely retain the white fallback.
  You can still set `--brand-contrast` when you need a specific ink color.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`ed465e1`](https://github.com/lyra-ds/lyra/commit/ed465e17289589716ee0d2cca829b30788526734) Thanks [@franciscpd](https://github.com/franciscpd)! - Add highlighter-agnostic code panels with optional copy and CSS line numbers, plus accessible
  single-choice segmented controls with roving keyboard navigation.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`a41de53`](https://github.com/lyra-ds/lyra/commit/a41de53a037fb9caaf57332241785a971b833aef) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the theme-aware Brand primitive for accessible linked, static, and framework-composed product marks.

- [#23](https://github.com/lyra-ds/lyra/pull/23) [`749203a`](https://github.com/lyra-ds/lyra/commit/749203ac5d05ea0276c30a21d935e57bc1dd9082) Thanks [@franciscpd](https://github.com/franciscpd)! - Adiciona a camada de layout (`components/layout/layout.css`) ao entry: AppShell, Container,
  PageHeader, Separator e ActionBar vêm do handoff v1.1 verbatim.

  Junto vão duas extensões aditivas que o handoff não tem, `.lyra-stack` e `.lyra-grid`. Os
  componentes React do handoff emitem essas duas classes mas o CSS não define regra nenhuma para
  elas — a aparência inteira mora num `style` inline, que é a única forma que um adapter Vue, Blade
  ou LiveView não consegue reaproveitar. As declarações passam a viver no CSS, com custom
  properties para o que não pode ser classe modificadora:

  - `--lyra-stack-direction`, `--lyra-stack-gap`, `--lyra-stack-align`, `--lyra-stack-justify`,
    `--lyra-stack-wrap`
  - `--lyra-grid-columns`, `--lyra-grid-gap`

  Os defaults espelham os dos componentes do handoff, então um wrapper só define o que difere.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`0628b78`](https://github.com/lyra-ds/lyra/commit/0628b78c3143bf13fbf43a627d82eca459a0bfec) Thanks [@franciscpd](https://github.com/franciscpd)! - Build responsive site chrome with `Navbar`, `NavLink`, and `Footer`. Compose branded navigation,
  actions, notes, and resource links through slots while the design system handles sticky behavior,
  responsive reflow, accessible active-page state, touch targets, and focus styling.

- [#8](https://github.com/lyra-ds/lyra/pull/8) [`3f852fc`](https://github.com/lyra-ds/lyra/commit/3f852fc2e1248053258c3303346eff66631beed4) Thanks [@franciscpd](https://github.com/franciscpd)! - Add accessible Dropdown and Combobox React components, including the dropdown trigger style hook.

- [#9](https://github.com/lyra-ds/lyra/pull/9) [`0ef4ada`](https://github.com/lyra-ds/lyra/commit/0ef4adaeedb5cc1d6544f9b316c5d6d4b916ea7c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add Table, SidebarGroup, Toast, ToastStack, and SSR-safe CookieBanner React wrappers.
  Promote the Toast icon's inline layout to the parity-allowlisted `.lyra-toast__icon`
  style hook.

- [#9](https://github.com/lyra-ds/lyra/pull/9) [`0ef4ada`](https://github.com/lyra-ds/lyra/commit/0ef4adaeedb5cc1d6544f9b316c5d6d4b916ea7c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add Drawer, CreateWorkspaceDialog, and WorkspaceSwitcher React components. Drawer provides a
  portaled modal focus trap and scroll lock; the workspace components compose the existing Dialog,
  Input, Button, Avatar, and Icon wrappers. Add the parity-allowlisted `.lyra-drawer__close` style.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`1f26db7`](https://github.com/lyra-ds/lyra/commit/1f26db7f5187b98e199e1cabd60a3ea87c993a5a) Thanks [@franciscpd](https://github.com/franciscpd)! - Build documentation pages and application frames from a reusable `Shell`, with optional navigation,
  topbar, and context rails in either page-scroll or content-scroll mode. The styles package now also
  ships `.lyra-prose`, so plain HTML documentation receives tokenized headings, links, lists, quotes,
  and resilient inline code without a React wrapper.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`f841deb`](https://github.com/lyra-ds/lyra/commit/f841deb397e09719bb405163b326b2f40d6462ec) Thanks [@franciscpd](https://github.com/franciscpd)! - Popups now open upward when there is no room below, instead of forcing a page scroll

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

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`f713085`](https://github.com/lyra-ds/lyra/commit/f7130859b286b4408d01ff484c004c0faff2ccc9) Thanks [@franciscpd](https://github.com/franciscpd)! - Add TableOfContents for labelled in-page navigation, plus the optional useScrollSpy hook for
  highlighting the topmost visible heading. CommandPalette now includes a responsive Trigger that
  keeps its accessible search name when its label collapses to an icon on narrow screens.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`0f0a422`](https://github.com/lyra-ds/lyra/commit/0f0a42206c5d75891472f1ad3c08c65c55ed5c8f) Thanks [@franciscpd](https://github.com/franciscpd)! - Touch presses no longer flash the browser's grey tap rectangle

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

### Patch Changes

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`232392e`](https://github.com/lyra-ds/lyra/commit/232392e7747c5acc603e3f6134220efc6a178040) Thanks [@franciscpd](https://github.com/franciscpd)! - Button: asChild to render links/other elements with button styling.

  Dialog: expand the close control to a 44px WCAG touch target.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`714c642`](https://github.com/lyra-ds/lyra/commit/714c642284ef0532aa8ff8677a5cd611091d16aa) Thanks [@franciscpd](https://github.com/franciscpd)! - Button: button-styled links (`Button asChild` / `<a class="lyra-btn">`) no longer
  inherit the base `a:hover` underline — `.lyra-btn:hover` now resets text-decoration.

- [#7](https://github.com/lyra-ds/lyra/pull/7) [`c8c2406`](https://github.com/lyra-ds/lyra/commit/c8c24068247907350c53ff9e183599aed67b67a0) Thanks [@franciscpd](https://github.com/franciscpd)! - Card: group header actions with a new `.lyra-card__actions` class instead of an
  inline flex style, keeping appearance entirely in `@lyra-ds/styles` (CSS-first).
  No visual change — the class carries the same `display:flex; gap` the inline
  style did. The parity additive-extension allowlist is generalized to allow
  documented package-only classes in more than one component file.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`1708d83`](https://github.com/lyra-ds/lyra/commit/1708d83428acfe263f33a998ec402fdd04c3fb0e) Thanks [@franciscpd](https://github.com/franciscpd)! - CommandPalette's dialog is named in English and can be translated; SidebarGroup's label clears AA

  **CommandPalette** named its modal dialog with a hard-coded Portuguese string, in a system whose
  public labels are otherwise English ("Search commands", "Previous page", "View mode"). That name is
  what a screen reader announces the moment the palette opens, so the one place the language leak was
  guaranteed to be heard. It is now `"Command palette"`, and a new optional `aria-label` prop overrides
  it — the same courtesy Pagination and Breadcrumb already extend — so a localized interface can
  announce the palette in its own language. Inline mode is not a dialog and stays unnamed.

  **SidebarGroup**'s section label was `--text-faint`: 2.45:1, the worst text ratio in the system, on
  the word that tells a person what a group of navigation items has in common. It takes
  `--text-secondary`, matching the repair already applied to the table, file-list and tab headings. Its
  hover moved with it, from `--text-muted` to `--text-primary`: the handoff brightened faint → muted,
  and leaving that alone would have made hover _less_ prominent than rest in both themes.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`2c2d49f`](https://github.com/lyra-ds/lyra/commit/2c2d49fb70bffefe6ac751994c96b9706a04ae6e) Thanks [@franciscpd](https://github.com/franciscpd)! - CookieBanner no longer slides in from off-centre

  The banner centres itself with `transform: translateX(-50%)` and borrowed the Toast's entrance
  keyframe, which animates `transform` — so for the whole entrance the centring was simply gone.
  Measured at a 1280px viewport: the banner appeared with its centre at 1000px instead of 640 and its
  right edge 80px outside the viewport, then snapped into place when the animation finished.

  It now uses a dedicated `lyra-cookies-in` keyframe that carries the centring in both frames. A
  keyframe that animates `transform` can never be shared with an element positioned by `transform`;
  Toast keeps `lyra-toast-in`, where nothing is centred.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`726141e`](https://github.com/lyra-ds/lyra/commit/726141e067e69db79fa15316907ce8ddf6706d2b) Thanks [@franciscpd](https://github.com/franciscpd)! - Dark-mode solid accent and danger fills now use accessible palette steps, so white control text
  meets WCAG AA contrast.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`2add65d`](https://github.com/lyra-ds/lyra/commit/2add65d600b76adf7184ac7561771a0be2a6c645) Thanks [@franciscpd](https://github.com/franciscpd)! - Drawer and CookieBanner animate out instead of vanishing

  Both entered with motion and then disappeared on the same frame the close was requested, while
  Dialog and the command palette hold a `--closing` class for their exit. Measured: the Dialog stays
  mounted for about 200ms of `lyra-overlay-out`, and these two were already gone in the first sample.

  Both now use the same `usePresence` state machine: the element stays mounted while its exit
  animation runs and leaves on `animationend`, with a timeout fallback so a reduced-motion or
  animation-disabled environment can never wedge it. The drawer leaves toward the edge it came from
  and its backdrop reuses the shared fade; the banner fades and settles downward.

  The banner's exit keyframe carries `translateX(-50%)` in both frames, for the same reason its
  entrance does: it is positioned by transform, so a keyframe animating transform without the centring
  would throw it sideways on the way out.

  `prefers-reduced-motion: reduce` disables all four animations.

  Note for consumers: unmounting either component from a parent inside its own callback cuts the exit
  short. Let it hide itself.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`03957f4`](https://github.com/lyra-ds/lyra/commit/03957f460e0406d209f9c0577801e0862f009932) Thanks [@franciscpd](https://github.com/franciscpd)! - The Dropdown trigger becomes the control, SidebarGroup gets its chevron back, and the palette's quiet text clears AA

  **Dropdown** wrapped whatever you passed as `trigger` in a `span[role="button"][tabIndex=0]`. With
  the documented usage — a `Button` — that produced two tab stops for one control: the span carrying
  `aria-haspopup` and `aria-expanded`, and the button inside it carrying neither, so the element a
  person actually focused announced nothing about opening a menu. axe reported it as
  `nested-interactive`, serious.

  The trigger element now _becomes_ the control. Dropdown merges the role, the tab stop and the menu
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

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`10e06f1`](https://github.com/lyra-ds/lyra/commit/10e06f1e75723c773787ec25c73d3097c6f8ccb6) Thanks [@franciscpd](https://github.com/franciscpd)! - FileManager: readable column headings and full-size touch targets in the file list

  The list's column headings (`.lyra-fm__head`) were `--text-faint`, which measures 2.56:1 on the card
  surface in light and 3.92:1 in dark — below WCAG AA's 4.5:1 for text at that size. They move one step
  up the ramp to `--text-secondary` (7.5:1 light, ~11:1 dark), keeping the quiet tone the handoff
  intended. This is the same call the docs site already made for its own group labels.

  Two hit areas in the row grow to 44×44 without anything moving on screen. `.lyra-fm__name` was 30px
  tall inside a row the handoff already sizes at 44px, so it stretches and reclaims the row's vertical
  padding with a negative margin; its box is transparent, so the only visible consequence is that the
  browser's focus ring now hugs the real target. `.lyra-fm__more` keeps its 30px visible box — it has a
  hover background that would have grown with it — and gains the extra area from a transparent
  `::after` overlay that stays inside the grid gap.

  The view toggle (30×28) and the breadcrumb (24px) were left alone: growing them would raise the
  toolbar and the path bar on every screen, and both already clear WCAG 2.2 AA's 24×24 minimum.

  Consumers on the plain CSS classes get all of this from the stylesheet with no markup change.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`3bce5f8`](https://github.com/lyra-ds/lyra/commit/3bce5f837c3d3580cc9845064b8183a1948cc7ee) Thanks [@franciscpd](https://github.com/franciscpd)! - Stepper wraps instead of overflowing, Tabs clears AA, and Breadcrumb lets you name its landmark

  **Stepper** is a flex row whose dots, labels and connectors all refuse to shrink, so an ordinary
  three-step flow measures about 453px and pushed the whole document sideways on a 375px phone. It now
  wraps. Giving it its own horizontal scroll was tried first and rejected on measurement: with no
  focusable content inside, a keyboard user cannot scroll the region, so the last step stayed 176px out
  of view with no way to reach it. Wrapping costs height on a narrow screen and changes nothing where
  the row already fits.

  **Tabs** had two contrast failures. `--text-muted` reads 4.83:1 on a card but only 4.34:1 on
  `--surface-sunken`, which is exactly where a pill tab's resting label and every count chip sit; both
  move to `--text-secondary`. In dark, an active line tab painted its label in `--accent` on the page
  background at 4.09:1, and now uses `--accent-soft-text`, the token the system already keeps for
  accent-colored text, which lightens with the brand and so survives white-labelling. The underline
  stays `--accent`.

  **Breadcrumb** placed its `aria-label="Breadcrumb"` after the spread props, so a consumer-supplied
  label was silently discarded — unlike Pagination, its sibling, which has always honored one. It now
  does the same: `aria-label` from the consumer wins, and "Breadcrumb" remains the default. Two trails
  on one page can finally be told apart by assistive technology, and a localized interface can name the
  landmark in its own language.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`892a45b`](https://github.com/lyra-ds/lyra/commit/892a45bea90fb901327b29424dff67125fd3eeb4) Thanks [@franciscpd](https://github.com/franciscpd)! - overlay motion: CommandPalette exit + more deliberate Dialog/CommandPalette entrance

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`ec3b627`](https://github.com/lyra-ds/lyra/commit/ec3b6271c592c091ed7dc0b30c346400adc64866) Thanks [@franciscpd](https://github.com/franciscpd)! - Table column headings clear WCAG AA

  `.lyra-table th` painted `--text-muted` on the `--surface-sunken` header band: 4.34:1, under AA's
  4.5:1. It takes `--text-secondary`, the same repair already applied to the file list's headings and
  to Tabs, so the three heading treatments in the system now agree.

  Headings are what a person reads to know what a column means, and at 12px uppercase they are the
  smallest text the table has — the ratio matters more here than anywhere else in the component.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`8066839`](https://github.com/lyra-ds/lyra/commit/80668395c8a5852f7e40bf5681be6a1a76987628) Thanks [@franciscpd](https://github.com/franciscpd)! - Toast's close button gets a usable hit area

  The close glyph measured 12×19 CSS px — the one control in the system that failed WCAG 2.2 AA's
  24×24 minimum outright, rather than merely sitting under the project's own 44px preference. It keeps
  its visible size and gains a transparent hit area from an `::after` overlay, the same repair already
  applied to the file list's action trigger.

  The overlay stops at 12px on each side because that is the flex gap to the message: any larger and a
  tap at the end of the message text would dismiss the toast. The result is 36×44 — the full height of
  the toast, and comfortably past the minimum.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`2f8d6e9`](https://github.com/lyra-ds/lyra/commit/2f8d6e994eee3a7f60934c3bc1d49e29b1cd72e3) Thanks [@franciscpd](https://github.com/franciscpd)! - Tooltip gains a placement, flips instead of being clipped, and can actually be dismissed

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
