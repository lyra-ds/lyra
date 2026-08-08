# @lyra-ds/alpine

## 0.1.1

### Patch Changes

- [#130](https://github.com/lyra-ds/lyra/pull/130) [`3757c78`](https://github.com/lyra-ds/lyra/commit/3757c78624670703d1f5a3b59a953acee131cb54) Thanks [@franciscpd](https://github.com/franciscpd)! - Accordion and Tabs: remove the state classes (`lyra-acc__item--open`, `lyra-tab--active`) even when they were rendered statically by the server — the `:class` bindings now use object syntax so Alpine reconciles pre-existing classes

## 0.1.0

### Minor Changes

- [#120](https://github.com/lyra-ds/lyra/pull/120) [`7e3ff43`](https://github.com/lyra-ds/lyra/commit/7e3ff43ac13cc12f9f292231c2035dff438a9ff1) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraAccordion` — disclosure-list port of the React Accordion state machine: named `item`/`trigger`/`panelWrap`/`panel` bindings over consumer-rendered markup, `defaultOpen` and `multiple` seeding, array-based `openItems` controllable via `x-modelable`, generated-or-preserved IDs with ARIA links, reactive open modifiers, and inert collapsed panels that remain mounted for CSS height animation.

- [#117](https://github.com/lyra-ds/lyra/pull/117) [`6dc5762`](https://github.com/lyra-ds/lyra/commit/6dc5762d4ea7ba58b40f05da233171ba55d50863) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraDialog` — APG modal dialog porting the React Dialog state machine: named `overlay`/`panel`/`title`/`close` bindings over consumer-rendered markup (no teleport), `defaultOpen`/`closeOnEsc`/`closeOnOverlayClick`/`labelId` seeding, `open` controllable via `x-modelable`, initial focus + focus restore, focus trap, reference-counted body scroll lock, WR-02 backdrop press+release dismissal, and exit presence (`--closing` classes with an animationend/fallback finalize). Shared internals `focus-trap`, `scroll-lock`, and `presence` land for Drawer.

- [#118](https://github.com/lyra-ds/lyra/pull/118) [`0a848c3`](https://github.com/lyra-ds/lyra/commit/0a848c3ee96baa770d4b255600746d96914b961a) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraDrawer` — modal slide-over porting the React Drawer state machine: named `overlay`/`panel`/`title`/`close` bindings over consumer-rendered markup (no teleport), `defaultOpen`/`labelId` seeding, `open` controllable via `x-modelable`, unconditional Escape/backdrop/close-button dismissal, initial focus + focus restore, focus trap, reference-counted body scroll lock, and exit presence (`--closing` classes with an animationend/fallback finalize).

- [#116](https://github.com/lyra-ds/lyra/pull/116) [`7e69b44`](https://github.com/lyra-ds/lyra/commit/7e69b44e0c138e4a9a50968ad789188f69f67c39) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraDropdown` — APG menu button porting the React Dropdown state machine: named `trigger`/`menu`/`item` bindings, `defaultOpen`/`align` seeding, `open` controllable via `x-modelable`, roving focus, flip placement (`lyra-menu--up`), document-level outside-click, and `type="button"` protection inside forms. Shared internals `flip-placement` and `test-axe` land for the next wave-1 components.

- [#125](https://github.com/lyra-ds/lyra/pull/125) [`42550f4`](https://github.com/lyra-ds/lyra/commit/42550f4d4d5439be54a035b534551f56052a1364) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraPopover` — React Popover state-machine port with named `trigger`/`panel` bindings, modelable `open` state, generated dialog ARIA wiring, keyboard and outside-click dismissal, and trigger-anchored flip placement.

- [#119](https://github.com/lyra-ds/lyra/pull/119) [`5568657`](https://github.com/lyra-ds/lyra/commit/5568657023201fc9d4c148f767034f2e6ff5de41) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraTabs` — APG tabs porting the React Tabs state machine: named `list`/`tab`/`panel` bindings over consumer-rendered markup, required controllable `active` state for `x-modelable`, matching `data-value` identity, generated-or-preserved IDs with ARIA links, roving focus with automatic Arrow/Home/End activation, and reactive `lyra-tab--active`/panel visibility.

- [#124](https://github.com/lyra-ds/lyra/pull/124) [`4f93fe1`](https://github.com/lyra-ds/lyra/commit/4f93fe1b6c8fa9d8b09aeacf71817889f82a88c7) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraTooltip` — React Tooltip state-machine port with named `root`/`target`/`bubble` bindings, always-closed non-modelable state, generated tooltip ARIA wiring, hover/focus and document Escape dismissal, and visual-viewport-aware pseudo-element placement flipping.

- [#113](https://github.com/lyra-ds/lyra/pull/113) [`f285352`](https://github.com/lyra-ds/lyra/commit/f28535239ebcadb3a5d1bfa27afa7fbfaf2b7258) Thanks [@franciscpd](https://github.com/franciscpd)! - New package: `@lyra-ds/alpine` — Alpine.js plugin (`Alpine.plugin(lyra)`) scaffold. ESM-only build (tsdown), Browser Mode test harness against the real `@lyra-ds/styles` CSS, and the plugin shell that wave-1 components (`lyraDropdown`, `lyraDialog`, `lyraDrawer`, `lyraTabs`, `lyraAccordion`, `lyraTooltip`, `lyraPopover`) register into.
