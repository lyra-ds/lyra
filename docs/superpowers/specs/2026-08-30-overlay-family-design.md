# Lyra V1 Overlay Family Design

**Status:** Draft — awaiting written review

**Date:** 2026-08-30

**Owner:** Lyra maintainers

**Scope:** Dialog, Drawer, BottomSheet, Popover, Dropdown, Tooltip,
CommandPalette, WorkspaceSwitcher, and CreateWorkspaceDialog across the public
Styles, React, and claimed Alpine surfaces.

## Decision summary

Lyra V1 MUST govern the nine overlay components through five
technology-neutral observable contracts:

- `OF-MODAL` owns modal layering, focus, dismissal, background isolation,
  scroll locking, presence, and restoration for Dialog, Drawer, and
  BottomSheet.
- `OF-ANCHORED` owns trigger relationships, placement, collision response,
  outside interaction, and anchored-layer teardown for Popover, Dropdown, and
  Tooltip.
- `OF-MENU` owns menu keyboard and selection behavior for Dropdown.
- `OF-TOOLTIP` owns descriptive hover, focus, timing, touch, and dismissal
  behavior for Tooltip.
- `OF-COMPOSED` requires CommandPalette, WorkspaceSwitcher, and
  CreateWorkspaceDialog to reuse the applicable lower-level contract without
  forking it.

This draft defines the behavior that a later evaluation MUST measure. It does
not approve this specification, select an implementation foundation, authorize
a dependency, claim compatibility or migration completion, or authorize a
runtime change. The incumbent Lyra implementation, Radix, Base UI, and the
active Zag direction remain unevaluated alternatives.

## Scope and ownership

This specification specializes the approved
[deliberate V1 release design](./2026-08-30-lyra-v1-deliberate-release-design.md)
and is subordinate to the five approved foundational specifications:

- [Design and product principles](./lyra-v1/01-design-product-principles.md)
- [Tokens and visual language](./lyra-v1/02-tokens-visual-language.md)
- [Interaction and accessibility](./lyra-v1/03-interaction-accessibility.md)
- [Component architecture](./lyra-v1/04-component-architecture.md)
- [Quality and performance](./lyra-v1/05-quality-performance.md)

Styles owns the `.lyra-*` visual contract, semantic-state presentation,
themes, direction, forced colors, and reduced motion. React owns typed React
rendering, refs, controlled and uncontrolled state wiring, and React lifecycle.
Alpine owns opt-in enhancement of consumer-served semantic markup only for the
registrations it actually publishes. Application code owns domain data,
business operations, destructive-action policy, labels, validation, and any
documented logical focus successor.

The family owns layer classification, observable state transitions, semantic
relationships, keyboard and pointer behavior, focus outcomes, and teardown.
It does not own a vendor API, product navigation, data persistence, command
execution, workspace creation, or application authorization.

The following target mapping is normative for the V1 program ledger:

| Component             | Required target contracts    |
| --------------------- | ---------------------------- |
| Dialog                | `OF-MODAL`                   |
| Drawer                | `OF-MODAL`                   |
| BottomSheet           | `OF-MODAL`                   |
| Popover               | `OF-ANCHORED`                |
| Dropdown              | `OF-ANCHORED`, `OF-MENU`     |
| Tooltip               | `OF-ANCHORED`, `OF-TOOLTIP`  |
| CommandPalette        | `OF-COMPOSED`, `OF-MODAL`    |
| WorkspaceSwitcher     | `OF-COMPOSED`, `OF-ANCHORED` |
| CreateWorkspaceDialog | `OF-COMPOSED`, `OF-MODAL`    |

## Current contract inventory

Current behavior is evidence, not normative precedent. The props, export
paths, classes, roles, and relationships below are the shipped public surface
that a later migration must preserve or change through an approved migration.
An Alpine registration is listed only when it exists in the current plugin.

| Component             | Current React export and props                                                                                                                                                                                                                                                                                                                                                | Current Alpine support                                                                                                                                                                                       | Current public root, parts, and modifiers                                                                                                                                                                                                                              | Current roles and relationships                                                                                                                                                                                                                                                                         | Current open/close owner                                                                                                                       | Known V1 P1 gap                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog                | `@lyra-ds/react/dialog`: `DialogProps` extends panel `div` attributes except native `title`; `open`, `onClose`, `closeLabel`, `title`, `footer`, `closeOnEsc`, `closeOnOverlayClick`, `container`, `children`; panel ref                                                                                                                                                      | `lyraDialog({ defaultOpen, closeOnEsc, closeOnOverlayClick, labelId })`; `overlay`, `panel`, `title`, `close` bindings                                                                                       | `.lyra-dialog-overlay`, `.lyra-dialog-overlay--closing`, `.lyra-dialog`, `.lyra-dialog--closing`, `__header`, `__title`, `__close`, `__body`, `__footer`                                                                                                               | Panel is `role="dialog"`, `aria-modal="true"`, named by the generated or supplied title ID                                                                                                                                                                                                              | React is controlled by `open` and requests closure through `onClose`; Alpine owns `open`, initialized by `defaultOpen`                         | Separate focus, portal, presence, scroll-lock, and dismiss paths have no family layer manager, complete inert isolation, nested topmost rule, or connected-opener successor |
| Drawer                | `@lyra-ds/react/drawer`: `DrawerProps` extends panel `div` attributes except native `title`; `open`, `onClose`, `closeLabel`, `title`, `footer`, `container`, `children`; panel ref                                                                                                                                                                                           | `lyraDrawer({ defaultOpen, labelId })`; `overlay`, `panel`, `title`, `close` bindings                                                                                                                        | `.lyra-drawer-overlay`, `.lyra-drawer-overlay--closing`, `.lyra-drawer`, `.lyra-drawer--closing`, `__header`, `__title`, `__close`, `__body`, `__footer`                                                                                                               | Panel is `role="dialog"`, `aria-modal="true"`, named by its title ID                                                                                                                                                                                                                                    | React is controlled by `open` and requests closure through `onClose`; Alpine owns `open`, initialized by `defaultOpen`                         | Duplicates Dialog infrastructure; backdrop handling is not consistently pointer-origin safe and restoration has no logical successor                                        |
| BottomSheet           | `@lyra-ds/react/bottom-sheet`: `open`, `onClose`, `closeLabel`, `container`, `children`, plus either required `title` or required `aria-label`; panel `div` attributes and ref                                                                                                                                                                                                | `lyraBottomSheet({ defaultOpen })`; `overlay`, `panel`, `close` bindings over consumer-served title or label markup                                                                                          | `.lyra-bottomsheet-overlay`, `.lyra-bottomsheet-overlay--closing`, `.lyra-bottomsheet`, `.lyra-bottomsheet--closing`, `__header`, `__title`, `__close`, `__body`                                                                                                       | Panel is `role="dialog"`, `aria-modal="true"`, named by `aria-labelledby` or `aria-label`                                                                                                                                                                                                               | React is controlled by `open`; Alpine owns `open`, initialized by `defaultOpen`; both request close through their adapter event/callback       | Duplicates modal infrastructure; the known Alpine focus-trap baseline failure remains open and nested isolation/restoration is incomplete                                   |
| Popover               | `@lyra-ds/react/popover`: root `span` attributes and ref; `trigger`, controlled `open`, `defaultOpen`, `onOpenChange`, `side`, `align`, `width`, `ariaLabel`, `children`                                                                                                                                                                                                      | `lyraPopover({ defaultOpen, side, align, width, ariaLabel })`; `trigger`, `panel` bindings                                                                                                                   | `.lyra-popover-anchor`, `.lyra-popover`, `--bottom`, `--top`, `--align-start`, `--align-end`, `--align-center`                                                                                                                                                         | One semantic trigger has `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`; panel is a named non-modal `dialog`                                                                                                                                                                            | React is controlled when `open` is defined, otherwise internal; Alpine owns `open` from `defaultOpen`                                          | In-flow, component-local positioning and dismissal do not establish family portal, stack, pointer-origin, nested-layer, or full viewport-update behavior                    |
| Dropdown              | `@lyra-ds/react/dropdown`: root `span` attributes and ref; `trigger`, `items`, `align`, `defaultOpen`; item union supports command, separator, and label                                                                                                                                                                                                                      | `lyraDropdown({ defaultOpen, align })`; `trigger`, `menu`, `item` bindings                                                                                                                                   | `.lyra-dropdown`, `__trigger`; `.lyra-menu`, `--start`, `--end`, `--up`, `__item`, `__item--danger`, `__sep`, `__label`                                                                                                                                                | Trigger exposes `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`; popup is `role="menu"`; commands are `menuitem`                                                                                                                                                                               | React and Alpine own uncontrolled open state initialized by `defaultOpen`; item callbacks/events own command effects                           | No complete disabled discovery, typeahead, submenu, check/radio, controlled-state, or shared anchored-layer contract                                                        |
| Tooltip               | `@lyra-ds/react/tooltip`: root `span` attributes and ref; required `tip`, `children`; `placement`                                                                                                                                                                                                                                                                             | `lyraTooltip({ tip, placement })`; `root`, `target`, `bubble` bindings                                                                                                                                       | `.lyra-tooltip`, `--bottom`, `--left`, `--right`; public `data-tip` and `data-state`                                                                                                                                                                                   | Target receives a stable `aria-describedby`; hidden bubble is `role="tooltip"`                                                                                                                                                                                                                          | Both adapters own transient focus/hover state; there is no controlled open prop                                                                | No coordinated family delay, explicit coarse-pointer policy, or shared anchored-layer ownership; visible and semantic tooltip output remain split                           |
| CommandPalette        | `@lyra-ds/react/command-palette`: `open`, `onClose`, `onOpen`, `onSelect`, `groups`, <code>place&#x68;older</code>, `emptyMessage`, `searchLabel`, `hints`, `hotkey`, `inline`, `className`, `aria-label`; `CommandItem`, `CommandGroup`, and hint types; panel ref; static `CommandPalette.Trigger` takes native button props except `children`, plus `label` and `shortcut` | <code>lyraCommandPalette({ groups, open, place&#x68;older, emptyMessage, searchLabel, hints, hotkey, inline, label })</code>; modelable `open`, overlay/panel/search/list/item bindings and selection events | `.lyra-cmdk-trigger` and its icon/label; `.lyra-cmdk-overlay`, `--closing`; `.lyra-cmdk`, `--closing`, `__search`, `__body`, `__empty`, `__group`, `__group-label`, `__item`, `__item--active`, `__item-icon`, `__item-label`, `__item-hint`, `__shortcut`, `__footer` | Modal mode is a named modal `dialog`; input is a `combobox` controlling a `listbox` through `aria-controls` and `aria-activedescendant`; items are options                                                                                                                                              | Modal visibility is consumer-controlled in React and modelable in Alpine; query/active option are local; command effects remain consumer-owned | It duplicates modal focus, portal, presence, scroll-lock, dismissal, and restoration instead of consuming one modal contract                                                |
| WorkspaceSwitcher     | `@lyra-ds/react/workspace-switcher`: root `div` attributes and ref except `onChange`; `workspaces`, `current`, `onChange`, `onCreate`, `createLabel`, `defaultOpen`; `Workspace` type                                                                                                                                                                                         | `lyraWorkspaceSwitcher({ defaultOpen })`; `trigger`, `popover`, `option` bindings and `lyra:change` event                                                                                                    | `.lyra-wssw`, `__trigger`, `__id`, `__name`, `__plan`, `__pop`, `__pop--up`, `__pop-label`, `__item`, `__meta`, `__sep`, `__create`, `__plus`, `__create-label`                                                                                                        | React trigger has `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`; its popup is a labelled `listbox`; Alpine binds `aria-haspopup`/`aria-expanded` and listbox/option roles but does not currently create the controls relationship; workspace buttons are options with `aria-selected` | Selection value/data are consumer inputs; open state is internal from `defaultOpen`; consumer owns change/create effects                       | It duplicates anchored placement and dismissal and lacks the full stable-relationship, dynamic, typeahead, pointer-origin, portal, and direction contract                   |
| CreateWorkspaceDialog | `@lyra-ds/react/create-workspace-dialog`: `open`, `onClose`, `onCreate`, `title`, `slugPrefix`; composes React Dialog                                                                                                                                                                                                                                                         | Unsupported: no `lyraCreateWorkspaceDialog` registration or public Alpine option type exists                                                                                                                 | `.lyra-wscreate`, `__preview`, `__preview-hint`, `__slug`, `__slug-prefix`, `__slug-input`, plus composed Dialog and field classes                                                                                                                                     | Semantics and naming come from Dialog plus native labelled inputs and buttons                                                                                                                                                                                                                           | Consumer owns `open` and creation; local React state owns name, slug, and touched state                                                        | It inherits the divergent Dialog foundation and has no Alpine component surface; validation focus and safe initial focus are not a family composition contract              |

### React export paths

Every React overlay value and type is available from both the package root and
the component subpath. These two paths are part of the current inventory; the
root is not merely an internal barrel.

| Component             | `@lyra-ds/react` root exports                                                                 | Component subpath and the same exports                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dialog                | `Dialog`; `DialogProps`                                                                       | `@lyra-ds/react/dialog`: `Dialog`; `DialogProps`                                                                                |
| Drawer                | `Drawer`; `DrawerProps`                                                                       | `@lyra-ds/react/drawer`: `Drawer`; `DrawerProps`                                                                                |
| BottomSheet           | `BottomSheet`; `BottomSheetProps`                                                             | `@lyra-ds/react/bottom-sheet`: `BottomSheet`; `BottomSheetProps`                                                                |
| Popover               | `Popover`; `PopoverProps`                                                                     | `@lyra-ds/react/popover`: `Popover`; `PopoverProps`                                                                             |
| Dropdown              | `Dropdown`; `DropdownItem`, `DropdownProps`                                                   | `@lyra-ds/react/dropdown`: `Dropdown`; `DropdownItem`, `DropdownProps`                                                          |
| Tooltip               | `Tooltip`; `TooltipProps`                                                                     | `@lyra-ds/react/tooltip`: `Tooltip`; `TooltipProps`                                                                             |
| CommandPalette        | `CommandPalette`; `CommandGroup`, `CommandItem`, `CommandPaletteHints`, `CommandPaletteProps` | `@lyra-ds/react/command-palette`: `CommandPalette`; `CommandGroup`, `CommandItem`, `CommandPaletteHints`, `CommandPaletteProps` |
| WorkspaceSwitcher     | `WorkspaceSwitcher`; `Workspace`, `WorkspaceSwitcherProps`                                    | `@lyra-ds/react/workspace-switcher`: `WorkspaceSwitcher`; `Workspace`, `WorkspaceSwitcherProps`                                 |
| CreateWorkspaceDialog | `CreateWorkspaceDialog`; `CreateWorkspaceDialogProps`                                         | `@lyra-ds/react/create-workspace-dialog`: `CreateWorkspaceDialog`; `CreateWorkspaceDialogProps`                                 |

### Alpine public adapter contracts

`@lyra-ds/alpine` has one default plugin export. Installing that plugin
registers the eight `lyra…` data names below; those registration functions are
not named root exports. The option and data model types listed here are named
type exports from the package root.

| Component         | Registered data and exact exported root types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Current custom event contract                                                                                                                               | Material current difference from React                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog            | `lyraDialog`; `LyraDialogOptions` is `{ defaultOpen?: boolean; closeOnEsc?: boolean; closeOnOverlayClick?: boolean; labelId?: string }`                                                                                                                                                                                                                                                                                                                                                                                                                       | None                                                                                                                                                        | Alpine owns `open` and has no `onClose` notification; React is controlled and requests dismissal through `onClose`.                                                                                                                                                     |
| Drawer            | `lyraDrawer`; `LyraDrawerOptions` is `{ defaultOpen?: boolean; labelId?: string }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | None                                                                                                                                                        | Alpine owns `open` and has no `onClose` notification; React is controlled and requests dismissal through `onClose`.                                                                                                                                                     |
| BottomSheet       | `lyraBottomSheet`; `LyraBottomSheetOptions` is `{ defaultOpen?: boolean }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `lyra:close`, detail `{}`. Close button, Escape, and accepted backdrop click set local `open` to `false` before dispatch.                                   | React requests each dismissal through `onClose`. The Alpine event bubbles, crosses a shadow boundary, and is cancelable, but the current adapter does not inspect cancellation, so prevention cannot undo or stop the local close.                                      |
| Popover           | `lyraPopover`; `LyraPopoverOptions` is `{ defaultOpen?: boolean; side?: 'auto' \| 'bottom' \| 'top'; align?: 'start' \| 'end' \| 'center'; width?: number; ariaLabel?: string }`                                                                                                                                                                                                                                                                                                                                                                              | None                                                                                                                                                        | Alpine owns `open`; React may be controlled and reports transitions through `onOpenChange`.                                                                                                                                                                             |
| Dropdown          | `lyraDropdown`; `LyraDropdownOptions` is `{ defaultOpen?: boolean; align?: 'start' \| 'end' }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                | None                                                                                                                                                        | Alpine consumes served command markup, closes after item activation, and emits no selection result; React receives typed `items` and runs an item's `onSelect`.                                                                                                         |
| Tooltip           | `lyraTooltip`; `LyraTooltipOptions` is `{ tip: string; placement?: 'top' \| 'bottom' \| 'left' \| 'right' }`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | None                                                                                                                                                        | Both adapters own transient focus/hover state, but Alpine derives the bubble from served bindings and CSS while React renders it.                                                                                                                                       |
| CommandPalette    | `lyraCommandPalette`; `LyraCommandPaletteOptions` is <code>{ groups?: LyraCommandPaletteGroup[]; open?: boolean; place&#x68;older?: string; emptyMessage?: string; searchLabel?: string; hints?: LyraCommandPaletteHints; hotkey?: string \| false; inline?: boolean; label?: string }</code>; `LyraCommandPaletteItem` is `{ id: string; label: string; hint?: string; shortcut?: string }`; `LyraCommandPaletteGroup` is `{ label?: string; items: LyraCommandPaletteItem[] }`; `LyraCommandPaletteHints` has optional string `navigate`, `select`, `close` | `lyra:select`, detail `{ item: LyraCommandPaletteItem }`. It dispatches before a non-inline palette sets local `open` to `false`; inline mode remains open. | Alpine items have no per-item callback and selection is event-owned. React calls the item's `onSelect`, then palette `onSelect(item)`, then `onClose`; Alpine event cancellation is not inspected and therefore does not prevent the current close.                     |
| WorkspaceSwitcher | `lyraWorkspaceSwitcher`; `LyraWorkspaceSwitcherOptions` is `{ defaultOpen?: boolean }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `lyra:change`, detail `{ id: string }`, where `id` is the activated served option's `data-id` or `''`. It dispatches before closing and restoring focus.    | Alpine reads consumer-served options, does not update their served `aria-selected`, and has no create event. React receives typed `workspaces` and invokes `onChange(id, workspace)` or `onCreate`. Alpine event cancellation is not inspected and does not stop close. |

All three Alpine `$dispatch` events bubble, are composed, and are cancelable
under the shipped Alpine event mechanism, so a listener on the served component
root observes them. The payload shapes above are structural current contracts;
the package does not export separately named event-detail types. There is no
`lyraCreateWorkspaceDialog` registration, Alpine option type, or creation event.

The existing support inventory therefore claims Alpine behavior for eight of
the nine components. CreateWorkspaceDialog MUST remain explicitly unsupported
in Alpine until an approved change supplies a real registration, server-markup
contract, events, tests, documentation, and support-matrix entry.

## Shared layer contract

The shared rules below apply whenever their specialized contract classifies a
surface as a layer.

1. A layer registry MUST assign a deterministic logical order from parent to
   child. A child layer MUST be above its parent, and DOM portal order or an
   application-supplied `z-index` MUST NOT redefine the logical stack.
2. Only the topmost active layer MUST handle Escape, outside interaction,
   focus containment, or background isolation. One user operation MUST dismiss
   at most one layer. A child dismissal MUST NOT cascade to its parent.
3. The component that creates a layer MUST own its layer record and portal
   lifecycle. A consumer-supplied host MAY choose placement in the document,
   but it MUST NOT take ownership of focus guards, stack registration, or
   teardown. Theme, brand, direction, and accessible relationships MUST survive
   portaling.
4. Every trigger, label, description, popup, option, and active-descendant ID
   MUST be stable for the mounted instance and deterministic across server and
   first client render. Identity MUST NOT use time, randomness, display text,
   or collection index.
5. Logical open state MUST be distinct from exit presence. When logical state
   becomes closed, the layer MUST immediately stop interaction, dismissal,
   focus containment, background isolation, scroll locking, and assistive-
   technology exposure even if presentation remains mounted for exit motion.
6. Reopening during exit MUST cancel the pending removal and restore exactly
   one active layer record, portal subtree, focus scope, scroll-lock claim, and
   announcement path. It MUST NOT replay opening merely because a node stayed
   mounted.
7. Outside-pointer dismissal MUST be based on the complete pointer sequence.
   The pointer-down origin and activation endpoint MUST both be outside the
   owning layer and all of its child layers. Dragging across the boundary,
   selection gestures, canceled pointers, context-menu activation, and an
   interaction inside a child layer MUST NOT count as unambiguous outside
   activation.
8. Consumer handlers MUST run before a cancellable Lyra default. A prevented
   default MUST leave state, focus, ARIA, data attributes, announcements, and
   resource ownership unchanged. Each accepted operation MUST notify its
   callback or Alpine event at most once.
9. Cleanup MUST release document/window listeners, observers, timers, pending
   animation work, temporary portal nodes, focus guards, inert state, and
   shared-resource claims. Cleanup MUST make stale async or animation callbacks
   unable to mutate or announce.

Portal implementation, focus guards, registry data structures, placement
measurement nodes, presence machinery, scroll-lock counters, scrollbar
compensation nodes, and dismiss listeners are internal, replaceable Lyra
details. They MUST NOT become public selectors or consumer integration points.

## Modal contract

`OF-MODAL` classifies Dialog, Drawer, BottomSheet, modal CommandPalette, and
CreateWorkspaceDialog as modal layers. Dialog is the semantic behavior base.
Drawer and BottomSheet MUST reuse its behavior and may differ only in
presentation, responsive geometry, and motion.

### Semantics and logical lifetime

- The active panel MUST expose `role="dialog"` and `aria-modal="true"` and MUST
  have an accessible name from a visible title relationship or an explicit
  translated label. `aria-modal` MUST be absent whenever modal behavior is not
  active.
- From the accepted open transition until the accepted close transition, all
  content outside the active modal branch MUST be inert and unavailable to the
  accessibility tree through the platform `inert` contract or an equivalent
  three-engine-tested mechanism. A nested modal MUST keep the page isolated
  while allowing only its parent modal restoration context.
- Focus MUST remain inside the topmost logically open modal. Tab and Shift+Tab
  MUST wrap over the current eligible tabbables. Disabled, hidden, inert,
  disconnected, and removed nodes MUST be excluded on every navigation step.
  If no eligible tabbable exists, the named panel container MUST retain focus.
- Dynamic insertion, disabling, hiding, inerting, or removal of the focused
  node MUST recompute the focus set and move focus to the nearest safe element
  in the modal, then to the panel when none remains. Focus MUST NOT escape to
  inert background content.

### Initial and restored focus

- Each modal opening API MUST allow the composition to declare an initial-focus
  target. On every open or validation re-entry, the focus resolver MUST choose
  the first applicable safe target in this order: after a validation failure,
  the first invalid enabled field or its focusable error summary; for large
  reading content, the named heading or panel; for a destructive confirmation,
  the least destructive action; the declared target; the first safe task
  control in DOM order; and finally the named panel container with
  `tabindex="-1"`. A candidate is safe only when connected, visible, enabled,
  non-inert, and not the destructive action. The final panel fallback is
  mandatory, so an absent or invalid declared target MUST never leave focus in
  background content or without an outcome.
- The opener MUST be captured immediately before focus moves into the modal.
  On close, focus MUST return to that opener only if it remains connected,
  focusable, visible, enabled, non-inert, and meaningful.
- When the opener unmounts or becomes unavailable, the invoking composition
  MUST provide a documented logical successor. Restoration MUST try the control
  replacing or following the opener, then the nearest stable control in the
  invoking workflow, then a named focusable workflow or page region. It MUST
  NOT silently fall to `body`, browser chrome, or an inert ancestor.
- A nested modal MUST restore within its parent modal before that parent
  resumes dismissal or focus containment. Closing the parent while a child is
  active MUST close or transfer the child through one explicit operation; it
  MUST NOT strand a child portal.

### Dismissal, scrolling, and presence

- Escape MUST dismiss only the topmost dismissible modal. Text editing or an
  assistive-technology interaction that owns Escape MUST receive its documented
  behavior before the modal processes the key. A non-dismissible safety step
  MUST expose a named completion or exit control and document why Escape is
  disabled.
- Backdrop dismissal MAY be enabled only when it cannot discard work or commit
  a destructive result. It MUST follow the shared pointer-origin rule and MUST
  remain a convenience in addition to an explicit accessible dismissal path.
  Pointer cancellation or consumer `preventDefault()` MUST cancel the default.
- The first modal MUST acquire one page scroll lock without changing the
  content width or page position. Nested modals MUST increment a shared claim;
  closing or destroying one owner MUST decrement only its claim, and scrolling
  MUST resume only after the final claim is released. Scrollbar compensation,
  zoom, touch scrolling, usable visual viewport, and virtual keyboard behavior
  MUST avoid layout shift and keep the panel's own content scrollable.
- Controlled React state MUST remain authoritative: a close interaction calls
  the Lyra callback with the requested next state or existing close signal, but
  the layer remains logically open until the controlled prop commits closed.
  Alpine model/event ownership MUST provide the equivalent accepted transition
  without pretending a request is already committed.
- On a committed close, exit presence MAY retain visual nodes but MUST satisfy
  the shared inactive-exit rules. Reduced motion MUST complete teardown without
  waiting for animation events. Unmount during entry, open, or exit MUST release
  all resources exactly once.

The current `.lyra-dialog*`, `.lyra-drawer*`, `.lyra-bottomsheet*`,
`.lyra-cmdk*`, and `.lyra-wscreate*` classes and the roles/relationships listed
in the inventory remain Lyra-owned public presentation and semantic contracts.
The choice of portal, focus, presence, scroll-lock, inert, and dismiss
implementation remains internal and replaceable.

## Anchored layer contract

`OF-ANCHORED` governs Popover, Dropdown, Tooltip, and the anchored portion of
WorkspaceSwitcher.

1. Popover, Dropdown, and WorkspaceSwitcher MUST expose exactly one semantic
   trigger for one popup. The consumer MAY supply the trigger element, but Lyra
   MUST merge refs, required classes, handlers, `aria-haspopup`,
   `aria-expanded`, and a stable `aria-controls` without creating a second
   interactive wrapper or tab stop.
2. The controlled popup ID MUST remain stable while closed and open. Tooltip is
   intentionally different: descriptive content is not a controlled region,
   so `aria-controls` and `aria-expanded` are inapplicable; `OF-TOOLTIP` instead
   requires a stable `aria-describedby` relationship.
3. Preferred side and logical start/center/end alignment MUST be inputs, not
   promises that content may clip. Placement MUST first fit on the preferred
   side, flip to the opposite side when necessary, then shift along that side
   within the usable visual viewport. If neither side fits, the popup MUST use
   a bounded scroll region and remain reachable rather than render offscreen.
4. Placement MUST update after open, content or trigger resize, viewport resize,
   visual-viewport change, and scrolling of any relevant ancestor. Measurement
   MUST stop on logical close and teardown. Updates MUST NOT move keyboard focus
   or generate a semantic state event.
5. Logical `start` and `end` MUST follow writing direction. In RTL, horizontal
   alignment and submenu direction MUST mirror; physical top and bottom do not.
   Placement data exposed to CSS MUST use Lyra-owned values.
6. Escape MUST close only the topmost anchored layer. When focus is inside a
   Popover, Dropdown, or WorkspaceSwitcher popup, Escape MUST restore the
   connected trigger or its documented successor. When focus never left a
   Popover trigger, closing MUST NOT move it. Tooltip dismissal follows
   `OF-TOOLTIP` and never moves focus.
7. Outside interaction MUST follow the shared pointer-origin and child-layer
   rules. Outside focus MAY close a non-modal popup only after focus has moved
   outside the trigger, popup, and child layers; it MUST NOT preempt a pointer
   activation that is still being resolved.
8. The anchored layer owner MUST own the portal record and placement observer.
   A consumer host MAY be supplied through a Lyra prop or server marker. Portal
   movement MUST preserve accessible relationships, theme, brand, direction,
   events, and trigger restoration.

Popover content is a non-modal dialog or generic disclosure surface; menu
roving focus, character typeahead, menu-item roles, and selection-on-activation
are inapplicable unless the consumer uses a separately specified composite.
Dropdown is a menu and therefore additionally obeys `OF-MENU`; arbitrary
interactive dialog content is inapplicable to it. Tooltip is descriptive,
non-interactive content; focus entry, selection, outside-focus dismissal, and
trigger restoration are inapplicable because focus MUST remain on the trigger.

## Menu contract

`OF-MENU` applies to Dropdown and to a future explicitly declared menu surface;
it does not apply to Popover dialog content, Tooltip descriptions, or the
WorkspaceSwitcher listbox. Any future surface MUST be added through a separately
approved revision of this specification before adopting `OF-MENU`.

- Enter, Space, and ArrowDown on the trigger MUST open the menu and focus the
  first enabled item. ArrowUp MUST open it and focus the last enabled item. A
  pointer activation MAY open without moving focus until the user navigates,
  provided the menu remains reachable and named.
- The menu MUST use one real-DOM-focus roving model. Exactly one command item,
  whether enabled or `aria-disabled`, MUST own `tabindex="0"` while focus is in
  the menu; every other command item MUST use `-1`. ArrowDown and ArrowUp MUST
  move and wrap through every command item, including disabled items. Home and
  End MUST move to the first and last command item. Separators and group labels
  MUST never receive composite focus.
- An `aria-disabled="true"` item MUST remain discoverable by arrow navigation
  when present in the public item model. It MAY receive DOM focus and become
  the sole `tabindex="0"` item so assistive technology can announce it, but it
  MUST NOT activate, select, close the menu, or emit a result. A native disabled
  item outside focus navigation MUST not be used when it would make the item
  undiscoverable.
- Printable-character typeahead MUST compare localized item text
  case-insensitively, start after the current item, wrap once, and include
  disabled matches in the same sequence as arrow navigation. A disabled match
  MUST receive focus and become the sole `tabindex="0"` item, but MUST retain
  the no-activation outcome above. The buffer resets after 500 ms. Repeating
  one character within the buffer MUST cycle through all matching command
  items, enabled or disabled, instead of building a repeated-character query.
- Enter or Space on an enabled command MUST invoke its consumer selection
  handler once and close according to the item policy. Consumer cancellation
  MUST prevent Lyra's selection and close defaults without a partial state
  change.
- Tab and Shift+Tab MUST close the menu and allow native sequential navigation
  to continue; they MUST NOT restore focus to the trigger. Escape MUST close
  and restore to the connected trigger or documented successor.
- A submenu trigger, when the public model supports one, MUST expose
  `aria-haspopup="menu"` and `aria-expanded`. ArrowRight opens and enters a
  submenu in LTR and ArrowLeft does so in RTL; the opposite arrow closes it and
  restores its parent item. Escape closes only the topmost submenu. Pointer
  travel between a submenu trigger and its panel MUST not be treated as outside
  interaction.
- Checkable and radio items, when supported by the public item model, MUST use
  `menuitemcheckbox` or `menuitemradio`, expose `aria-checked`, retain the menu's
  roving model, and distinguish focus from checked state. Radio items MUST be
  grouped and allow one checked value per group. The current Dropdown item type
  does not expose disabled, submenu, checkbox, or radio variants, so docs MUST
  NOT claim those current capabilities before an approved API migration.

## Tooltip contract

`OF-TOOLTIP` applies only to short, non-interactive descriptive content.
Interactive help, links, buttons, forms, and dismissible teaching content MUST
use Popover or another non-modal dialog pattern.

- Keyboard focus on the semantic trigger MUST expose the tooltip immediately
  without moving focus. Hover MUST expose it after a 500 ms initial delay. All
  tooltips in one document MUST share a coordinator. The coordinator becomes
  warm when any tooltip logically opens. The warm delay is exactly 0 ms: while
  it is warm, entering another trigger MUST expose its tooltip in the same
  interaction turn without starting the 500 ms timer. The
  300 ms warm grace begins when the last visible tooltip logically closes and
  no trigger or tooltip branch retains focus or hover ownership. Opening or
  retaining any tooltip cancels that expiry; after the next logical close, a
  fresh 300 ms interval begins. If the interval expires with no owner and no
  visible tooltip, the coordinator becomes cold and the next hover uses 500 ms.
  Destroying the final coordinator owner MUST cancel all timers and reset cold.
- Leaving both trigger and tooltip MUST close after a 100 ms pointer-transition
  grace period so the pointer can cross into hoverable content. Focus leaving
  the trigger and tooltip branch MUST close immediately unless the pointer is
  still within that branch. Focus and hover ownership MUST be combined so one
  input leaving does not close content still owned by the other.
- Escape MUST dismiss the topmost visible tooltip immediately without moving
  focus or activating the trigger. It MUST work for both focus-opened and
  hover-opened content.
- Content exposed on hover MUST remain visible while the pointer is over the
  tooltip, remain dismissible without pointer movement, and remain perceivable
  without clipping. Because tooltip content is non-interactive, pointer entry
  preserves visibility but MUST NOT create a tab stop.
- A coarse pointer MUST NOT be required to emulate hover. A tap MUST retain the
  trigger's native action and MUST NOT be intercepted solely to show a tooltip.
  The default contract does not use long press. Any essential name,
  instruction, error, or operation MUST therefore exist visibly or through an
  independently operable disclosure; it MUST NOT exist only in a tooltip.
- The trigger MUST reference one stable tooltip ID through
  `aria-describedby`, preserving any consumer description IDs. The described
  content MUST exist whenever the relationship is exposed and MUST match the
  visible text. Opening MUST NOT announce duplicate copies.
- Close, trigger removal, content replacement, and destroy MUST cancel delay
  timers and placement observers and remove document listeners. A stale timer
  MUST NOT reopen or announce a removed tooltip.

## Composed overlay contract

`OF-COMPOSED` prohibits domain components from copying lower-level overlay
infrastructure.

- CommandPalette MUST reuse `OF-MODAL` in overlay mode while retaining its
  combobox/listbox model. Focus begins in the combobox; ArrowDown and ArrowUp
  change `aria-activedescendant`, Enter commits the active command, and the
  listbox owns options and groups. Inline mode is not modal and MUST NOT acquire
  a portal, inert background, focus scope, or scroll lock.
- WorkspaceSwitcher MUST reuse `OF-ANCHORED` while retaining its listbox
  selection model. Its current workspace data and selected ID remain
  consumer-owned; opening the popup MUST focus the selected option when
  available, and change/create effects MUST remain consumer operations.
- CreateWorkspaceDialog MUST compose `OF-MODAL` through Dialog and MUST NOT
  implement another focus scope, portal, presence controller, scroll lock, or
  dismiss listener. Its creation state machine MUST expose `editing`,
  `submitting`, `canceling`, `error`, or `accepted` through a Lyra-owned
  `data-state` on the composition root and MUST retain at most one current
  operation ID. `submitting` and `canceling` MUST also expose `aria-busy="true"`
  on the form and disable duplicate submission. An invalid submit MUST stay in
  `editing` or enter `error`, MUST NOT notify the consumer, and MUST focus the
  first invalid field under the modal focus order. A valid submit MUST create a
  fresh operation ID and one Lyra-owned `AbortController`. The public
  Lyra-owned `CreateWorkspaceRequest` is
  `{ operationId: string; data: { name: string; slug: string }; signal: AbortSignal }`.
  Lyra MUST commit `submitting` and then notify the consumer exactly once in the
  same interaction task with that request; duplicate submits for its ID MUST be
  ignored. The signal MUST be initially un-aborted, MUST belong only to that
  operation ID, and MUST be the only cancellation interface exposed to the
  consumer.
  The consumer handler MUST synchronously return or asynchronously settle with
  a Lyra-owned `CreateWorkspaceResult`. `CreateWorkspaceResult` MUST carry the
  same `operationId`. Its status MUST be exactly `accepted`, `rejected` with an
  error message, or `canceled`. Returning `undefined`, throwing, or rejecting
  the asynchronous operation MUST be treated as `rejected` for the current ID,
  never as implicit acceptance.
  `accepted` MUST commit the `accepted` state and domain result and only then
  request modal close; `rejected` MUST commit `error`, keep the dialog open,
  preserve the entered values, expose the error, and focus its summary or first
  invalid field; `canceled` MUST return to `editing` with values preserved. On
  an accepted user close while `submitting`, Lyra MUST retain `aria-busy="true"`
  and the current ID. Lyra MUST commit `canceling` before calling
  `controller.abort({ operationId })` synchronously in the same accepted close
  interaction task. The consumer MUST observe exactly one `abort` event during
  that call, `signal.aborted` MUST be `true`, and `signal.reason` MUST equal
  `{ operationId }`. Duplicate close requests while `canceling` MUST NOT call
  `abort` again. Destroying a pending composition MUST use the same single-abort
  path before releasing the operation and MUST NOT request another close. Lyra
  MUST then wait for the result carrying that ID; `canceled` MUST allow the
  pending user close, while the other terminal results retain their outcomes
  above. The first terminal result wins. A terminal result with a noncurrent
  `operationId` MUST be ignored as stale. Results after destroy and any later
  settlement MUST likewise be ignored without closing, announcing, or changing
  state.

React controlled props and domain callbacks remain application inputs. A Lyra
close or selection callback communicates one requested next state or committed
domain selection according to its documented timing; it MUST NOT mutate a
controlled value. Alpine modelable state and bubbling, composed Lyra custom
events MUST preserve the same accepted transition, payload meaning,
cancelation point, and at-most-once effect.

After a migration, the production graph MUST contain one owner for each of
focus containment, portal registration, presence, scroll locking, outside
dismissal, and placement. A composed component MUST NOT retain a fallback or
parallel owner for equivalent responsibilities.

## React and Alpine boundary

Observable equivalence means the same supported semantics, state transitions,
keyboard and pointer operations, focus outcomes, required classes and public
state, callbacks/events, SSR or server-markup baseline, and cleanup. It does
not require React and Alpine to share source, runtime dependencies, component
rendering, or private DOM.

| Component             | React target                             | Alpine target                                                                                                                 |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Dialog                | `OF-MODAL`                               | `lyraDialog` MUST meet the same observable modal scenarios over consumer-served markup                                        |
| Drawer                | `OF-MODAL` with Drawer presentation      | `lyraDrawer` MUST meet the same scenarios and presentation states                                                             |
| BottomSheet           | `OF-MODAL` with BottomSheet presentation | `lyraBottomSheet` MUST meet the same scenarios; the existing focus-trap failure remains a failure until fresh evidence passes |
| Popover               | `OF-ANCHORED` non-modal dialog content   | `lyraPopover` MUST meet the same anchored scenarios                                                                           |
| Dropdown              | `OF-ANCHORED` plus `OF-MENU`             | `lyraDropdown` MUST meet the same anchored and menu scenarios                                                                 |
| Tooltip               | `OF-ANCHORED` geometry plus `OF-TOOLTIP` | `lyraTooltip` MUST meet the same descriptive scenarios                                                                        |
| CommandPalette        | `OF-COMPOSED` plus `OF-MODAL`            | `lyraCommandPalette` MUST preserve modal and combobox/listbox outcomes over server markup                                     |
| WorkspaceSwitcher     | `OF-COMPOSED` plus `OF-ANCHORED`         | `lyraWorkspaceSwitcher` MUST preserve anchored listbox outcomes over server markup                                            |
| CreateWorkspaceDialog | `OF-COMPOSED` plus `OF-MODAL`            | Unsupported; no Alpine parity or registration is claimed in this draft                                                        |

An unsupported Alpine surface MUST remain marked `Unsupported` in public docs
and the support matrix, with React as the supported component surface and
semantic Styles markup available only for appearance. CSS alone MUST NOT be
described as supplying modal, menu, tooltip, focus, dismissal, or state-machine
behavior.

A future foundation MUST remain below unexported Lyra-owned React and Alpine
adapter interfaces. Public source types, inferred exports, emitted `.d.ts` and
`.d.cts`, callback/event payloads, refs, option objects, examples, generated
documentation, CSS selectors, and supported `data-*` attributes MUST NOT name
or structurally require vendor types, parts, selectors, enums, DOM, or events.
Incidental vendor attributes MUST NOT appear in the public contract or the
conformance fixtures.

## SSR, hydration, and no-JavaScript contract

- Module evaluation and React server render MUST NOT access `window`,
  `document`, layout, storage, media queries, browser constructors, time, or
  randomness. Browser work begins only in a guarded client lifecycle.
- For identical inputs, server output and the first client render MUST have the
  same semantic tree, stable IDs, roles, relationships, logical state, classes,
  and text. React 18 and React 19 MUST both hydrate without mismatch warnings,
  recoverable hydration errors, lost input, duplicate events, duplicate
  announcements, or unrequested focus movement.
- Server-rendered open content MUST remain semantically available before
  enhancement. A portal MAY render inline at a deterministic anchor and
  move after hydration, or use another documented strategy that preserves the
  same content and usable route. Portal movement MUST not count as a new open
  event or break labels, descriptions, direction, theme, or focus restoration.
- Environment-derived placement, visual viewport, coarse pointer, direction,
  and reduced-motion state MUST use deterministic server defaults and reconcile
  after hydration without changing logical open state or moving focus.
- Alpine markup MUST contain its initial semantic HTML, classes, IDs, roles,
  relationships, and state before initialization. Initialization MUST reconcile
  it idempotently and MUST NOT duplicate listeners, observers, timers, portal
  nodes, focus guards, scroll locks, inert state, or announcements.
- With delayed or absent JavaScript, content and essential meaning MUST remain
  available. A native link, form, `details`, always-visible region, or explicit
  unavailable-enhancement message MUST replace any operation that cannot work.
  Server markup MUST NOT present a dead modal/menu trigger as operable.
- Tooltip-only information is prohibited, so no-JavaScript and coarse-pointer
  output MUST retain the equivalent visible or independently operable content.
  CreateWorkspaceDialog has no Alpine component contract; server applications
  MUST use a native form/dialog route rather than a nonexistent registration.

## Acceptance matrix

Every cell in the ledger's `v1-interactive` profile is applicable to every
contract ID because each contract has a React surface and an interactive
browser outcome. `required` means that the later harness MUST map the cell to
contract-specific scenarios and produce exact-candidate evidence. No automated
cell is excluded by this draft.

| `v1-interactive` cell | `OF-MODAL` | `OF-ANCHORED` | `OF-MENU` | `OF-TOOLTIP` | `OF-COMPOSED` | Required outcome                                                                                         |
| --------------------- | ---------- | ------------- | --------- | ------------ | ------------- | -------------------------------------------------------------------------------------------------------- |
| `chromium`            | required   | required      | required  | required     | required      | All applicable semantic, input, focus, placement, layer, and teardown scenarios pass in pinned Chromium  |
| `firefox`             | required   | required      | required  | required     | required      | The same accepted fixtures pass in pinned Firefox                                                        |
| `webkit`              | required   | required      | required  | required     | required      | The same accepted fixtures pass in pinned WebKit                                                         |
| `react-18`            | required   | required      | required  | required     | required      | Public types, rendering, behavior, SSR, and hydration pass with React 18                                 |
| `react-19`            | required   | required      | required  | required     | required      | The same React surface passes with React 19                                                              |
| `ssr`                 | required   | required      | required  | required     | required      | Module evaluation and server output meet the deterministic server contract                               |
| `hydration`           | required   | required      | required  | required     | required      | First render and `hydrateRoot` preserve tree, state, input, focus, events, and announcements             |
| `keyboard-focus`      | required   | required      | required  | required     | required      | Contract-specific entry, navigation, dismissal, dynamic content, nesting, and restoration scenarios pass |
| `axe-light`           | required   | required      | required  | required     | required      | Accepted light-theme output has no known WCAG 2.2 Level AA axe violation                                 |
| `axe-dark`            | required   | required      | required  | required     | required      | Accepted dark-theme output has no known WCAG 2.2 Level AA axe violation                                  |
| `forced-colors`       | required   | required      | required  | required     | required      | Boundaries, focus, selected/disabled state, and content remain perceivable with system colors            |
| `reduced-motion`      | required   | required      | required  | required     | required      | State, dismissal, restoration, and teardown complete without animation dependence                        |
| `ltr`                 | required   | required      | required  | required     | required      | Logical placement and keyboard direction pass in LTR                                                     |
| `rtl`                 | required   | required      | required  | required     | required      | Logical alignment, submenu direction, content order, and directional presentation pass in RTL            |
| `coarse-pointer`      | required   | required      | required  | required     | required      | Targets, outside dismissal, touch scrolling, and tooltip information alternatives remain operable        |
| `bundle-standalone`   | required   | required      | required  | required     | required      | Each affected public entry is measured from packed production artifacts after replacement removal        |
| `bundle-composition`  | required   | required      | required  | required     | required      | Overlay and application-shell compositions report shared contribution and measured deduplication         |
| `packed-esm`          | required   | required      | required  | required     | required      | Packed ESM public and subpath entries resolve and execute without private/vendor leakage                 |
| `packed-cjs`          | required   | required      | required  | required     | required      | Declared packed CommonJS entries resolve and execute for supported consumers                             |
| `packed-types`        | required   | required      | required  | required     | required      | Emitted declarations resolve for consumers and contain only Lyra-owned public types                      |
| `consumer-vite`       | required   | required      | required  | required     | required      | Fresh Vite consumer installs exact tarballs and builds representative public imports                     |
| `consumer-next`       | required   | required      | required  | required     | required      | Fresh Next.js consumer proves server/client boundaries, SSR, hydration, and production build             |
| `consumer-commonjs`   | required   | required      | required  | required     | required      | Fresh CommonJS consumer installs and resolves every declared compatible entry                            |

### Contract scenario sets

- `OF-MODAL` MUST include initial focus for ordinary, large, destructive, and
  invalid content; dynamic and zero-tabbable content; nested modals; connected
  and removed openers; topmost Escape; pointer-origin backdrop dismissal;
  reference-counted scroll locking; controlled close; exit teardown; and
  reopen-during-exit.
- `OF-ANCHORED` MUST include a single semantic trigger, stable relationships,
  preferred/flip/shift/constrained placement, scroll/resize/content updates,
  nested child interaction, outside pointer origin, Escape, connected and
  removed triggers, LTR/RTL, portal context, and teardown.
- `OF-MENU` MUST include every trigger key, Arrow/Home/End wrapping, disabled
  discovery/non-activation, typeahead and repeated-character cycling,
  selection cancellation, Tab exit, Escape restoration, and applicable
  submenu/check/radio semantics.
- `OF-TOOLTIP` MUST include focus and hover ownership, exact coordinated
  delays, pointer transit, Escape without focus movement, stable description,
  coarse pointer, no essential-only content, trigger removal, and teardown.
- `OF-COMPOSED` MUST run the reused lower-level scenarios plus CommandPalette
  combobox/listbox, WorkspaceSwitcher listbox selection, and
  CreateWorkspaceDialog validation/creation without duplicate infrastructure.

Automated axe MUST run in light and dark themes without filtering known
violations. Forced colors, reduced motion, direction, coarse pointer, keyboard,
focus, SSR, and hydration are separate assertions; one result MUST NOT
substitute for another.

Manual Windows/NVDA and macOS/VoiceOver records remain absent under the active
Automated Core profile and MUST be rendered only as
`deferred-by-release-profile`, never `PASS`. The critical manual scenarios are
modal open/navigate/nested/close/restoration, anchored open/navigate/close,
menu discovery/typeahead/selection, tooltip description/dismissal, command
search/selection, workspace selection, and workspace creation/validation.

Every later evidence record MUST contain:

- contract ID and scenario ID;
- expected result and observed result;
- result exactly `PASS`, `FAIL`, or `unavailable`;
- the full candidate revision;
- exact dependency versions;
- artifact SHA-256;
- operating system, architecture, Node, pnpm, framework, Playwright, browser,
  and applicable assistive-technology environment versions; and
- an immutable artifact path containing raw logs and the applicable trace,
  screenshot, DOM/accessibility snapshot, bundle metafile, or consumer output.

An `unavailable` automated result blocks the applicable gate. A retry-only pass
does not replace the preserved first-attempt result.

## Public API and migration policy

The current React props, exported value/item types, root and subpath exports,
Alpine registration names/options/events, required `.lyra-*` classes, native
and ARIA relationships, public `data-tip` and `data-state`, and DOM/ref targets
listed in the inventory are Lyra-owned current contracts. The later foundation
evaluation MUST use them as the incumbent boundary; it MUST NOT silently treat
a vendor surface as the target API.

This draft does not freeze a replacement signature or claim compatibility.
Before implementation, any source, type, DOM, event, behavior, ref, class,
attribute, server-markup, or adapter-support change MUST be added to an
approved revision of this specification and then mapped in English and
Brazilian Portuguese migration guides with affected versions and concrete
before/after examples. Deterministic syntax-only changes MAY receive an
idempotent codemod; focus policy, content ownership, logical successors,
validation, and domain decisions require manual guidance.

The following details are private and replaceable when observable behavior is
preserved: vendor adapters and types, portal host nodes, focus guards, layer
registry shape, presence states, scroll-lock counters and compensation,
placement observers and measurement nodes, internal IDs not referenced by a
public relationship, and vendor-emitted parts/selectors/`data-*` attributes.
No migration guide or documentation may teach those details.

Styles, React, and Alpine remain independently versioned. This draft records no
compatibility ranges, deprecation release, removal release, migration path, or
completed codemod. Those fields remain absent in the program ledger until the
approved implementation and exact packed-consumer evidence exist.

## Foundation evaluation gate

After this specification receives written approval, a later decision phase
MUST run the incumbent Lyra implementation, Radix, Base UI, and the active Zag
direction against the same accepted fixtures, inputs, production build
configuration, and evidence schema. The comparison MAY retain the incumbent
and MUST NOT preselect a winner by popularity, familiarity, implementation
effort, or this draft's wording.

The later ADR MUST use the
[overlay foundation ADR template](../templates/overlay-foundation-adr.md) and
MUST include exact candidate versions/revisions, the complete contract matrix,
browser and assistive-technology disposition, SSR/hydration results, public API
isolation, standalone and composition bundle results, CSS/runtime impact,
removed-code and dependency accounting, migration impact, and immutable raw
artifacts.

The default maximum Brotli increase is `1.5 kB` for a simple primitive and
`3 kB` for a complex component or representative composition, measured in
decimal bytes from packed production artifacts under the approved quality-11
protocol. The measurement MUST remove superseded production code and dead
dependencies before evaluating the final delta. A larger result requires the
approved ADR exception defined by the foundational specifications; reduced
implementation effort is not a user benefit and cannot justify it.

The ADR cannot be accepted when any applicable WCAG 2.2 Level AA, browser, SSR,
or hydration cell fails; a known violation is filtered; a vendor type or
vendor-required public part/selector/attribute leaks; a bundle limit fails
without approval; evidence is mutable, incomplete, stale, retry-only, or for
different bytes; or equivalent focus, portal, presence, scroll-lock, dismiss,
positioning, or menu responsibilities would remain duplicated in production.

## Failure handling

Any known WCAG 2.2 Level AA violation, focus escape from an active modal,
keyboard-blocked primary overlay workflow, SSR/hydration corruption, public
vendor-type leak, broken packed entry, missing required browser result, or
missing required automated evidence is `P1` and blocks the affected stream.
It MUST NOT be waived, filtered, quarantined into acceptance, relabelled, or
documented away.

A product/contract failure, fixture failure, infrastructure failure,
unsupported-environment configuration, and confirmed nondeterminism MUST be
reported separately with first-attempt artifacts. Infrastructure
unavailability yields `unavailable` and blocks the cell; it does not convert an
expected result to `PASS`. Retrying MAY gather diagnostics but MUST NOT erase
the first failure.

The stream MUST stop without promotion when this specification is not approved,
an evaluation uses unequal fixtures, two equivalent foundations remain in
production, a required automated cell is absent or failing, a public contract
leaks vendor details, packed bytes differ from evidence, a bundle gate fails,
removed-code accounting is incomplete, or migration/compatibility evidence is
claimed before it exists. Stopping the stream does not authorize a runtime
rollback or remote action; the owner must record the failing scenario and await
an approved correction.

## Approval checklist

This checklist records the review required to move this document beyond Draft.
Unchecked items are not evidence of failure or completion; they are the written
approval gate.

- [ ] A Lyra maintainer confirms all nine current React contracts and eight
      actual Alpine registrations are inventoried truthfully, with
      CreateWorkspaceDialog explicitly unsupported in Alpine.
- [ ] Accessibility review confirms `OF-MODAL`, `OF-ANCHORED`, `OF-MENU`, and
      `OF-TOOLTIP` cover semantics, keyboard, focus, pointer/touch, nesting,
      restoration, motion, direction, and teardown without preserving the
      known overlay P1 findings.
- [ ] Architecture review confirms `OF-COMPOSED` reuses lower-level contracts,
      public Lyra APIs stay vendor-neutral, and duplicate production
      responsibilities are prohibited.
- [ ] Quality review confirms every `v1-interactive` cell is mapped for all
      five contract IDs, evidence fields are exact, manual absence is
      `deferred-by-release-profile`, and bundle limits match the approved
      program.
- [ ] The decision owner records written approval of this exact revision before
      any candidate evaluation, dependency change, evidence-harness plan, or
      runtime migration begins.
