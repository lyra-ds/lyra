# @lyra-ds/alpine

## 0.5.0

### Minor Changes

- [#176](https://github.com/lyra-ds/lyra/pull/176) [`c01fa26`](https://github.com/lyra-ds/lyra/commit/c01fa26b1a58d51544ef0f953b4ffa54919b4421) Thanks [@franciscpd](https://github.com/franciscpd)! - Exporta as interfaces de opções dos bindings das ondas iniciais (`LyraDropdownOptions`, `LyraDialogOptions`, `LyraCalendarOptions`, `LyraTimePickerLabels`, `LyraThemeStore`, …) no entry do pacote. As dos bindings mais novos já saíam; estas 29 existiam só no fonte, então o consumidor não conseguia tipar o objeto passado em `x-data` e a documentação não tinha de onde ler o contrato. Nenhuma mudança de runtime — o bundle segue idêntico.

## 0.4.0

### Minor Changes

- [#173](https://github.com/lyra-ds/lyra/pull/173) [`fdbafe0`](https://github.com/lyra-ds/lyra/commit/fdbafe0a77adb5ab37d9e1b2d9735b2e0c8de774) Thanks [@franciscpd](https://github.com/franciscpd)! - Permite configurar a chave de storage do `$store.theme` por `<html data-lyra-theme-key>`.

- [#173](https://github.com/lyra-ds/lyra/pull/173) [`fdbafe0`](https://github.com/lyra-ds/lyra/commit/fdbafe0a77adb5ab37d9e1b2d9735b2e0c8de774) Thanks [@franciscpd](https://github.com/franciscpd)! - Adiciona suporte a `labels.timeOptions` em `lyraTimePicker` para traduzir o `aria-label` da listbox.

## 0.3.0

### Minor Changes

- [#166](https://github.com/lyra-ds/lyra/pull/166) [`49da62a`](https://github.com/lyra-ds/lyra/commit/49da62aa405713daa0ff9f31e7299bb077bcce10) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraAppSidebar`, an Alpine.js port of the app-sidebar icon-rail state machine with modelable collapsed state, served-markup bindings, localized collapse labels, and bubbling collapse events.

- [#169](https://github.com/lyra-ds/lyra/pull/169) [`4ad14a4`](https://github.com/lyra-ds/lyra/commit/4ad14a4715daca0d532f54aede3cf017147e2182) Thanks [@franciscpd](https://github.com/franciscpd)! - Add the `lyraToasts` Alpine singleton store and `lyraToastStack` served-markup binding, with Livewire event support, auto-dismiss controls, accessible close buttons, and inlined tone icons.

## 0.2.0

### Minor Changes

- [#143](https://github.com/lyra-ds/lyra/pull/143) [`e6c7e67`](https://github.com/lyra-ds/lyra/commit/e6c7e673f3c52ec8341fe004c78202289f3bc035) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraBottomSheet`, an Alpine.js modal bottom-sheet state machine over consumer-rendered markup with controllable open state, focus trapping, scroll locking, guarded backdrop dismissal, and bubbling close events.

- [#150](https://github.com/lyra-ds/lyra/pull/150) [`4a227f6`](https://github.com/lyra-ds/lyra/commit/4a227f6fe30c9683474edaf430a96e7f66167adf) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraCalendar`, an Alpine.js port of the React calendar state machine with served `x-for` grids, controllable single or range selection, keyboard navigation, locale-aware labels, and interaction-only change events.

- [#136](https://github.com/lyra-ds/lyra/pull/136) [`76513e5`](https://github.com/lyra-ds/lyra/commit/76513e5f1aecc43d57b75fed8cea0d1bf05fe945) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraCodeBlock` — React CodeBlock copy-feedback state-machine port with named `copyButton`/`status` bindings over consumer-rendered markup, internal non-modelable `copied` feedback, `data-copy-text` override support, polite live-region ARIA, and reset-timer cleanup.

- [#155](https://github.com/lyra-ds/lyra/pull/155) [`7db8d58`](https://github.com/lyra-ds/lyra/commit/7db8d580d465753978ecd0898b6f019c714cdcf3) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraCombobox`, an Alpine.js data-driven port of the React searchable combobox with controllable selected/open state, stable active-descendant navigation, filtering, grouping, popup placement, and interaction-only change events.

- [#157](https://github.com/lyra-ds/lyra/pull/157) [`75046c1`](https://github.com/lyra-ds/lyra/commit/75046c142418127cc50930d67d6922f9045659ce) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraCommandPalette`, an Alpine.js port of the grouped Command/Ctrl+K command palette with modelable overlay state, APG active-descendant filtering, focus trapping, scroll locking, exit presence, global hotkeys, and bubbling command-selection events over consumer-served templates.

- [#138](https://github.com/lyra-ds/lyra/pull/138) [`2a0cf6f`](https://github.com/lyra-ds/lyra/commit/2a0cf6f532f755302bfaa598c1af5721ae0fcd7b) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraCookieBanner`, an Alpine.js cookie-consent state machine that persists all or essential-only choices, emits consent events, and keeps the existing banner mounted for its exit animation.

- [#159](https://github.com/lyra-ds/lyra/pull/159) [`0773bbc`](https://github.com/lyra-ds/lyra/commit/0773bbc8bc0e79106584f2be40ef35a660d2a58b) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraDataTable`, an Alpine.js DOM-driven data-table state layer for consumer-served table markup with controllable, modelable row selection and sorting, accessible header and checkbox bindings, and optional client-side row reordering.

- [#151](https://github.com/lyra-ds/lyra/pull/151) [`641a27f`](https://github.com/lyra-ds/lyra/commit/641a27f77d32cfa98531f9cfc32910a02d86a18f) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraDatePicker`, an Alpine.js thin coordinator that composes the shipped Calendar with Popover on desktop and BottomSheet on mobile, supports controllable date and open state, normalizes serialized date models, and formats the consumer-served trigger.

- [#152](https://github.com/lyra-ds/lyra/pull/152) [`4e6b704`](https://github.com/lyra-ds/lyra/commit/4e6b704687ce39a80f6b9882ebb0c6435faa293b) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraDateRangePicker`, an Alpine.js thin coordinator that composes the shipped range Calendar with Popover on desktop and BottomSheet on mobile, supports controllable range and open state, normalizes serialized range models, and closes only once both range bounds are selected.

- [#147](https://github.com/lyra-ds/lyra/pull/147) [`4389b1f`](https://github.com/lyra-ds/lyra/commit/4389b1f5335fe3f4aca2e19084f518c6d2014b4e) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraFileManager`, an Alpine.js port of the React file-manager shell with served-markup bindings, controllable list/grid and search state, DOM-driven filtering, empty-state support, and interaction-only view events.

- [#146](https://github.com/lyra-ds/lyra/pull/146) [`e40601d`](https://github.com/lyra-ds/lyra/commit/e40601dbee78ed71783f1373731e5c7b80c297f6) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraFileUpload`, an Alpine.js port of the React upload state machine with served dropzone bindings, runtime `x-for` upload items, controllable items and dragging state, simulated progress, validation, and bubbling file/change events.

- [#161](https://github.com/lyra-ds/lyra/pull/161) [`3a4d875`](https://github.com/lyra-ds/lyra/commit/3a4d8757585272b8ce1ebabc2de6cc1583b886fa) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraRecurrenceSelector`, an Alpine.js RRULE-subset editor with JSON-safe modelable recurrence state, native preset and custom controls, a nested date picker, whole-sentence recurrence summaries, and interaction-only change events; the React function-valued conflict label is represented by JSON-safe `conflictsOne` and `conflictsMany` templates.

- [#140](https://github.com/lyra-ds/lyra/pull/140) [`8476f17`](https://github.com/lyra-ds/lyra/commit/8476f17902242c2fe1bc9a9b5e79a95e5ce75d61) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraSegmentedControl`, an Alpine.js port of the React segmented-control radiogroup state machine with served-markup bindings, controllable `value`, roving keyboard focus, and interaction-only change events.

- [#139](https://github.com/lyra-ds/lyra/pull/139) [`3ba8c53`](https://github.com/lyra-ds/lyra/commit/3ba8c5308fe0be164bcffb199fb1dde6d1e332f3) Thanks [@franciscpd](https://github.com/franciscpd)! - `lyraSidebarGroup` — React SidebarGroup disclosure-state-machine port with named root, label, and item bindings over consumer-rendered markup, controllable `collapsed` state, template-based item unmounting, and bubbling `lyra:select` events.

- [#163](https://github.com/lyra-ds/lyra/pull/163) [`47c506f`](https://github.com/lyra-ds/lyra/commit/47c506f7e2532775784cba323586a0cb67a12b0c) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraSlotPicker`, an Alpine.js coordinator for timezone-aware bookable slots with modelable local day and IANA zone state, embedded Calendar and TimeZonePicker templates, empty/loading/temporary-hold states, and interaction-only change and confirmation events; React's function-valued slot labels are represented by JSON-safe interpolation templates.

- [#144](https://github.com/lyra-ds/lyra/pull/144) [`b098c7f`](https://github.com/lyra-ds/lyra/commit/b098c7fa4f94ee5fb026274af81681c8851d12aa) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraTableOfContents`, an Alpine.js port of the React in-page navigation rail with served-markup link bindings, controllable `activeId`, and scroll-spy tracking over document headings.

- [#145](https://github.com/lyra-ds/lyra/pull/145) [`50eab3e`](https://github.com/lyra-ds/lyra/commit/50eab3e868823ef506bfeedb9c62aaaf7328f66f) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraTimeInput`, an Alpine.js port of the React time-input state machine with served-markup bindings, controllable `selected` state, tolerant time parsing, clamped stepping, ARIA spinbutton support, and interaction-only change events.

- [#153](https://github.com/lyra-ds/lyra/pull/153) [`311b8e2`](https://github.com/lyra-ds/lyra/commit/311b8e2c8e91461698bc6ab95520c47580dc40af) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraTimePicker`, an Alpine.js thin coordinator that composes consumer-served time options with Popover on desktop and BottomSheet on mobile, supports controllable selected and open state, formatted trigger text, accessible list navigation, selection scrolling, and interaction-only change events.

- [#156](https://github.com/lyra-ds/lyra/pull/156) [`5471e4d`](https://github.com/lyra-ds/lyra/commit/5471e4d723b0c2f7f2dfca2d9e4a0135ba40d72a) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraTimeZonePicker`, an Alpine.js data layer that extends `lyraCombobox` with the curated IANA zone list, localized live times, reference-date GMT offsets, detected/recent pinning, and modelable IANA value selection.

- [#164](https://github.com/lyra-ds/lyra/pull/164) [`49f9256`](https://github.com/lyra-ds/lyra/commit/49f92567c611f387c3150d7eb9b3c44b25066b3e) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraWeeklyScheduleEditor`, an Alpine.js weekly local-time availability editor with modelable schedule and exception state, nested time-input, popover, and date-picker compositions, cloned day copying, inline range validation, and interaction-only schedule and exception events; React's function-valued sentence labels are represented by JSON-safe `{day}` templates while date and range formatters retain their defaults.

- [#141](https://github.com/lyra-ds/lyra/pull/141) [`c91e63c`](https://github.com/lyra-ds/lyra/commit/c91e63ccb8ca9f0a66530d022a8a4a44bceaf1c9) Thanks [@franciscpd](https://github.com/franciscpd)! - Add `lyraWorkspaceSwitcher`, an Alpine.js listbox-popover state machine over consumer-rendered workspace markup with controllable open state, real-focus navigation, flip placement, and bubbling workspace-change events.

- [#148](https://github.com/lyra-ds/lyra/pull/148) [`adf5648`](https://github.com/lyra-ds/lyra/commit/adf5648a1222d2d1bcd098a21d8a0260c6041fb5) Thanks [@franciscpd](https://github.com/franciscpd)! - Add a reactive `theme` Alpine store that persists light, dark, and system choices, resolves the OS preference onto `data-theme`, synchronizes cross-tab storage changes, and exposes a resolved-theme toggle.

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
