# @lyra-ds/react

## 0.4.2

## 0.4.1

### Patch Changes

- [#103](https://github.com/lyra-ds/lyra/pull/103) [`46dfe0e`](https://github.com/lyra-ds/lyra/commit/46dfe0e253dae01253a83114ba278e676d9b94d2) Thanks [@franciscpd](https://github.com/franciscpd)! - Accessibility: light-theme `--text-faint` raised from slate-400 to slate-500. At slate-400 the placeholder, group-label, calendar outside-month and hour-rail text it colors measured 2.34–2.56:1 against the light surfaces — below the WCAG AA 4.5:1 floor; it now lands at 4.76:1 on white. Dark theme is unchanged. The browser test suites now enforce axe's `color-contrast` rule with an explicit accepted-pair allowlist instead of filtering the rule out wholesale, so new contrast regressions fail CI.

- [#88](https://github.com/lyra-ds/lyra/pull/88) [`717e697`](https://github.com/lyra-ds/lyra/commit/717e697bee342e3b26d6b00d7ca7e8f4a4c707f2) Thanks [@franciscpd](https://github.com/franciscpd)! - Update package metadata: keywords and corrected catalog stats in the description.

## 0.4.0

### Minor Changes

- [#79](https://github.com/lyra-ds/lyra/pull/79) [`a34541a`](https://github.com/lyra-ds/lyra/commit/a34541ad1f018f517086a03c45bdac91935c9da4) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the CalendarView local-time scheduling component.

- [#76](https://github.com/lyra-ds/lyra/pull/76) [`f0bb8f9`](https://github.com/lyra-ds/lyra/commit/f0bb8f98c02684a5a68e35fe633c3232c9bbf03f) Thanks [@franciscpd](https://github.com/franciscpd)! - Add SegmentedRing and TimeInput React components.

- [#80](https://github.com/lyra-ds/lyra/pull/80) [`7dabe79`](https://github.com/lyra-ds/lyra/commit/7dabe794b1bd9a170ed3f97bd992d417ec0b8eb7) Thanks [@franciscpd](https://github.com/franciscpd)! - Add an opt-in CodeBlock wrap mode for long code lines.

- [#77](https://github.com/lyra-ds/lyra/pull/77) [`b287e3e`](https://github.com/lyra-ds/lyra/commit/b287e3e467e444869fe756d420913ce179ecbd95) Thanks [@franciscpd](https://github.com/franciscpd)! - Extend Combobox options with grouping, trailing content, and keyword search, and add TimeZonePicker.

- [#78](https://github.com/lyra-ds/lyra/pull/78) [`d4b5eea`](https://github.com/lyra-ds/lyra/commit/d4b5eea8bc717b09918bb89f8e93310e8e93f12c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add RecurrenceSelector, WeeklyScheduleEditor, and SlotPicker React components.

- [#73](https://github.com/lyra-ds/lyra/pull/73) [`9c776ed`](https://github.com/lyra-ds/lyra/commit/9c776ede6259a2ec0519173d55d8640ee02b852b) Thanks [@franciscpd](https://github.com/franciscpd)! - Add AppSidebar and BottomNav React components.

- [#75](https://github.com/lyra-ds/lyra/pull/75) [`523d282`](https://github.com/lyra-ds/lyra/commit/523d2826d18037d1b3c89f7dff6e05eb5c1b49ab) Thanks [@franciscpd](https://github.com/franciscpd)! - Add ToastProvider and useToast for queued, auto-dismissing notifications.

## 0.3.0

### Minor Changes

- [#68](https://github.com/lyra-ds/lyra/pull/68) [`6734448`](https://github.com/lyra-ds/lyra/commit/67344483060a6336f6bb65e59ea6dd51826769df) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the Calendar component with locale-aware local-date and range selection.

- [#66](https://github.com/lyra-ds/lyra/pull/66) [`371e431`](https://github.com/lyra-ds/lyra/commit/371e431b59c5267c26d9444913a43e933490ce04) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the Popover primitive with automatic viewport-aware placement.

- [#63](https://github.com/lyra-ds/lyra/pull/63) [`b608c61`](https://github.com/lyra-ds/lyra/commit/b608c6115851991cace5a62247b742f6396bee6f) Thanks [@franciscpd](https://github.com/franciscpd)! - Add DataTable, PersonCell, and ActionBar wrappers, and add SidebarGroup item tooltips.

- [#71](https://github.com/lyra-ds/lyra/pull/71) [`39ba3aa`](https://github.com/lyra-ds/lyra/commit/39ba3aa3bf044b6787c65ef478bdc3dd6e8e99c6) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the TimePicker, DatePicker, and DateRangePicker components.

- [#70](https://github.com/lyra-ds/lyra/pull/70) [`aa8a3e4`](https://github.com/lyra-ds/lyra/commit/aa8a3e4c5e969bbba52a61a5a0121c5cbd43efc3) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the BottomSheet modal overlay component.

## 0.2.0

### Minor Changes

- [#61](https://github.com/lyra-ds/lyra/pull/61) [`512e3d6`](https://github.com/lyra-ds/lyra/commit/512e3d648093ff577a0c30d8ae9e186e07dd556e) Thanks [@franciscpd](https://github.com/franciscpd)! - Add RadioGroup, CheckboxGroup, Fieldset, FormRow, and Separator wrappers.

## 0.1.1

### Patch Changes

- [#54](https://github.com/lyra-ds/lyra/pull/54) [`b4cc3bc`](https://github.com/lyra-ds/lyra/commit/b4cc3bc33e50698142159e0b0e2a8503d7bbee2a) Thanks [@franciscpd](https://github.com/franciscpd)! - Migrate the build from tsup to tsdown (Rolldown) while preserving the dist contract with no API changes.

## 0.1.0

### Minor Changes

- [#15](https://github.com/lyra-ds/lyra/pull/15) [`a2c67cf`](https://github.com/lyra-ds/lyra/commit/a2c67cf24894aa6595f97c54b5bb35ddc663049b) Thanks [@franciscpd](https://github.com/franciscpd)! - Every hard-coded English accessible name can now be translated

  Lyra is a white-label design system, but seventeen accessible names were written as fixed English
  strings inside the JSX. An app shipping in another language handed its screen-reader users
  "Close notification", "View mode" and "Loading" with no way to change them. Every English default is
  preserved, so nothing changes unless you pass the new prop.

  Two different defects were behind it.

  `Spinner` and `CookieBanner` wrote `aria-label` **after** the props spread, so a consumer who passed
  one had it dropped in silence — no error, no warning, and calling code that looked correct. They now
  honour it, the way `Breadcrumb` and `Pagination` already did. Those two also gained an explicit
  `'aria-label'` declaration so the prop finally shows up in their documented API.

  The rest live on internal elements that no consumer prop could reach, and gained one:

  - `Dialog`, `Drawer` and `Toast`: `closeLabel`
  - `Tag`: `removeLabel`
  - `Pagination`: `previousLabel` and `nextLabel`
  - `CommandPalette`: `searchLabel` for the search field
  - `Avatar`: `statusLabel` for the presence dot, which until now announced the raw enum token
    (`"online"`, `"busy"`, `"away"`)
  - `FileUpload`: `doneLabel`, plus `removeLabel` as a `(name: string) => string` callback
  - `FileManager`: a grouped `labels` object (`viewMode`, `listView`, `gridView`, `currentFolder`,
    `itemActions`) merged over the defaults, so partial objects work — the same contract as
    `CommandPalette`'s `hints`. The exported type is `FileManagerLabels`.

  The two labels that interpolate a file name take a function rather than a template string, because
  word order moves between languages and a fixed template cannot localize.

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

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`232392e`](https://github.com/lyra-ds/lyra/commit/232392e7747c5acc603e3f6134220efc6a178040) Thanks [@franciscpd](https://github.com/franciscpd)! - Button: asChild to render links/other elements with button styling.

  Dialog: expand the close control to a 44px WCAG touch target.

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

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`ed465e1`](https://github.com/lyra-ds/lyra/commit/ed465e17289589716ee0d2cca829b30788526734) Thanks [@franciscpd](https://github.com/franciscpd)! - Add highlighter-agnostic code panels with optional copy and CSS line numbers, plus accessible
  single-choice segmented controls with roving keyboard navigation.

- [#9](https://github.com/lyra-ds/lyra/pull/9) [`0ef4ada`](https://github.com/lyra-ds/lyra/commit/0ef4adaeedb5cc1d6544f9b316c5d6d4b916ea7c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the accessible CommandPalette React wrapper with grouped filtering, command shortcuts,
  global Command/Ctrl+K support, and inline or portaled modal rendering.

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

- [#27](https://github.com/lyra-ds/lyra/pull/27) [`18366ae`](https://github.com/lyra-ds/lyra/commit/18366ae0cfa7a4d7374f4ec4007e70627cd01fd6) Thanks [@franciscpd](https://github.com/franciscpd)! - PageHeader can now use an `h2` or `h3` title for a titled section, and Shell can render its main
  content as a `div` when it is nested or embedded in a page that already provides the main landmark.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`a41de53`](https://github.com/lyra-ds/lyra/commit/a41de53a037fb9caaf57332241785a971b833aef) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the theme-aware Brand primitive for accessible linked, static, and framework-composed product marks.

- [#23](https://github.com/lyra-ds/lyra/pull/23) [`4e3af60`](https://github.com/lyra-ds/lyra/commit/4e3af60dbe22bcf34a5eef59ab7acf82678270c2) Thanks [@franciscpd](https://github.com/franciscpd)! - Add React layout wrappers for Container, Stack, Inline, Grid, and PageHeader.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`0628b78`](https://github.com/lyra-ds/lyra/commit/0628b78c3143bf13fbf43a627d82eca459a0bfec) Thanks [@franciscpd](https://github.com/franciscpd)! - Build responsive site chrome with `Navbar`, `NavLink`, and `Footer`. Compose branded navigation,
  actions, notes, and resource links through slots while the design system handles sticky behavior,
  responsive reflow, accessible active-page state, touch targets, and focus styling.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`ebd3992`](https://github.com/lyra-ds/lyra/commit/ebd399234dfe9997b5acd3c4f6030b67d4d4e709) Thanks [@franciscpd](https://github.com/franciscpd)! - `CommandPalette` no longer ships Portuguese UI strings. The `placeholder` and `emptyMessage`
  defaults are now English (`"Type a command or search…"`, `"No results for"`), and the footer
  keyboard hints — previously hardcoded `navegar`/`selecionar`/`fechar` with no way to override
  them — are English by default and translatable through a new `hints` prop:

  ```tsx
  <CommandPalette hints={{ navigate: 'navegar', select: 'selecionar', close: 'fechar' }} />
  ```

  `hints` merges over the defaults, so partial objects work. The new `CommandPaletteHints` type
  is exported.

- [#3](https://github.com/lyra-ds/lyra/pull/3) [`cff0234`](https://github.com/lyra-ds/lyra/commit/cff0234d9b69e0caf94b58c156769c8ad7ec86b7) Thanks [@franciscpd](https://github.com/franciscpd)! - Introduce `@lyra-ds/react` as a real dual-format (ESM + CJS) package with four
  pilot components and the machinery Phase 4 repeats for the rest of the set:

  - **Pilots:** `Button` (simple), `Input` (form / controlled), `Dialog`
    (overlay / focus-trap / portal), and `Icon` (curated registry) — thin wrappers
    over `@lyra-ds/styles` `.lyra-*` classes, named exports only, `forwardRef` on
    every DOM-rendering component.
  - **Curated icon registry:** a committed, CI-drift-guarded 70-icon registry
    (69 `lucide-react` imports + a vendored `github` node) — no CDN, no full
    ~1,400-icon set in consumer bundles.
  - **Root barrel + per-component subpaths** (`@lyra-ds/react` and
    `@lyra-ds/react/button`, …) with a split-types exports map validated by
    publint + attw; per-minimal-import `size-limit` budgets enforce component
    isolation and icon-registry containment.
  - **Additive Dialog CSS** (`.lyra-dialog--closing`, `.lyra-dialog__close`) shipped
    from `@lyra-ds/styles` as documented parity-allowlisted extensions.

  Versioned in lockstep with `@lyra-ds/styles` (pre-1.0 convention: `minor` is the
  ceiling until the deliberate 1.0 release).

- [#5](https://github.com/lyra-ds/lyra/pull/5) [`296f0d6`](https://github.com/lyra-ds/lyra/commit/296f0d655308a911a4c86188bea40517ba1f5056) Thanks [@franciscpd](https://github.com/franciscpd)! - Add IconButton, Badge, Tag, Card, Avatar, Alert, Spinner, Skeleton, Progress, Stat, EmptyState, and Breadcrumb React wrappers.

- [#6](https://github.com/lyra-ds/lyra/pull/6) [`f678d38`](https://github.com/lyra-ds/lyra/commit/f678d386b0491cc13ce4ec8cdf5dc7e2f0c7225d) Thanks [@franciscpd](https://github.com/franciscpd)! - Add Textarea, Checkbox, Radio, Switch, and FileUpload React wrappers.

- [#8](https://github.com/lyra-ds/lyra/pull/8) [`3f852fc`](https://github.com/lyra-ds/lyra/commit/3f852fc2e1248053258c3303346eff66631beed4) Thanks [@franciscpd](https://github.com/franciscpd)! - Add Tabs, Accordion, Stepper, Pagination, Tooltip, and native Select wrappers.

- [#8](https://github.com/lyra-ds/lyra/pull/8) [`3f852fc`](https://github.com/lyra-ds/lyra/commit/3f852fc2e1248053258c3303346eff66631beed4) Thanks [@franciscpd](https://github.com/franciscpd)! - Add accessible Dropdown and Combobox React components, including the dropdown trigger style hook.

- [#9](https://github.com/lyra-ds/lyra/pull/9) [`0ef4ada`](https://github.com/lyra-ds/lyra/commit/0ef4adaeedb5cc1d6544f9b316c5d6d4b916ea7c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add Table, SidebarGroup, Toast, ToastStack, and SSR-safe CookieBanner React wrappers.
  Promote the Toast icon's inline layout to the parity-allowlisted `.lyra-toast__icon`
  style hook.

- [#9](https://github.com/lyra-ds/lyra/pull/9) [`0ef4ada`](https://github.com/lyra-ds/lyra/commit/0ef4adaeedb5cc1d6544f9b316c5d6d4b916ea7c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add Drawer, CreateWorkspaceDialog, and WorkspaceSwitcher React components. Drawer provides a
  portaled modal focus trap and scroll lock; the workspace components compose the existing Dialog,
  Input, Button, Avatar, and Icon wrappers. Add the parity-allowlisted `.lyra-drawer__close` style.

- [#9](https://github.com/lyra-ds/lyra/pull/9) [`0ef4ada`](https://github.com/lyra-ds/lyra/commit/0ef4adaeedb5cc1d6544f9b316c5d6d4b916ea7c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the FileManager React component with searchable list and grid views, breadcrumbs, and
  Dropdown-composed per-file action menus.

- [#24](https://github.com/lyra-ds/lyra/pull/24) [`1f26db7`](https://github.com/lyra-ds/lyra/commit/1f26db7f5187b98e199e1cabd60a3ea87c993a5a) Thanks [@franciscpd](https://github.com/franciscpd)! - Build documentation pages and application frames from a reusable `Shell`, with optional navigation,
  topbar, and context rails in either page-scroll or content-scroll mode. The styles package now also
  ships `.lyra-prose`, so plain HTML documentation receives tokenized headings, links, lists, quotes,
  and resilient inline code without a React wrapper.

- [#23](https://github.com/lyra-ds/lyra/pull/23) [`2903676`](https://github.com/lyra-ds/lyra/commit/290367647426ba0c04db26631f53bec95a0867de) Thanks [@franciscpd](https://github.com/franciscpd)! - Adiciona `ThemeProvider` e `useTheme`.

  Aplica `data-theme` no `<html>`, persiste a escolha em `localStorage` e opcionalmente fixa
  `data-brand` para white-label. Diferenças em relação ao protótipo do handoff, todas
  deliberadas:

  - **Seguro para SSR.** O handoff lia `localStorage` dentro do `useState`, que roda no render do
    servidor e produz divergência de hidratação. Aqui o estado vem de `useSyncExternalStore`, com
    snapshot de servidor fixo no `defaultTheme` — nenhuma API de navegador é tocada durante o
    render.
  - **`system` existe.** `theme` pode ser `"light" | "dark" | "system"`, e a API expõe
    `resolvedTheme` com o valor realmente aplicado. Em modo `system` ele acompanha mudanças do
    sistema operacional ao vivo.
  - **O atributo é escrito depois do commit**, em layout effect, não durante o render — um render
    descartado não pode deixar o documento com um tema que o React não confirmou.
  - `ThemeProvider.useTheme` não é reproduzido: era limitação do bundle de preview do handoff.

  O provider **não** evita o flash da primeira pintura e não tem como: React roda depois de o
  documento já ter pintado. Isso continua exigindo um script inline bloqueante no `<head>` lendo
  a mesma `storageKey` — o JSDoc do componente traz o trecho pronto.

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

- [#17](https://github.com/lyra-ds/lyra/pull/17) [`b709c1b`](https://github.com/lyra-ds/lyra/commit/b709c1bf62d33e7081a3ca967bbde5541e7eccf8) Thanks [@franciscpd](https://github.com/franciscpd)! - Add localized visible-text APIs for white-label applications: CookieBanner now accepts
  `essentialsLabel` and `acceptLabel`, while FileManager labels now cover list headers, default menu
  commands, and folder item counts.

- [#13](https://github.com/lyra-ds/lyra/pull/13) [`b62bd97`](https://github.com/lyra-ds/lyra/commit/b62bd9757602aa83066d1b0e4cb9c5a334541ac4) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `asChild` to `Card`, mirroring `Button`. Renders the single child element with the
  Lyra card classes instead of a wrapping `<div>`, so a whole card can be one link:
  `<Card asChild interactive><a href="…">…</a></Card>`. Only supported for the plain
  surface — combining it with `title` or `footer` throws.

### Patch Changes

- [#7](https://github.com/lyra-ds/lyra/pull/7) [`c8c2406`](https://github.com/lyra-ds/lyra/commit/c8c24068247907350c53ff9e183599aed67b67a0) Thanks [@franciscpd](https://github.com/franciscpd)! - Card: group header actions with a new `.lyra-card__actions` class instead of an
  inline flex style, keeping appearance entirely in `@lyra-ds/styles` (CSS-first).
  No visual change — the class carries the same `display:flex; gap` the inline
  style did. The parity additive-extension allowlist is generalized to allow
  documented package-only classes in more than one component file.

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

- [#10](https://github.com/lyra-ds/lyra/pull/10) [`61ba3d1`](https://github.com/lyra-ds/lyra/commit/61ba3d1351cadfa3b4a8b01938c3e73bc76b4f5e) Thanks [@franciscpd](https://github.com/franciscpd)! - Make Checkbox, Radio, and Switch labels fully clickable by using an implicit
  wrapping label association.

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
