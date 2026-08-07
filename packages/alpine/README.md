# @lyra-ds/alpine

Alpine.js plugin for [Lyra DS](https://lyra-ds.dev) — the behavior layer of the
CSS-first design system. One `Alpine.data()` per interactive component, porting
the **exact state machine** of its `@lyra-ds/react` counterpart: same modifier
classes, same ARIA, same `inert`, same focus/scroll-lock/keyboard handling. All
appearance comes from [`@lyra-ds/styles`](https://www.npmjs.com/package/@lyra-ds/styles);
this package ships behavior only.

## Installation

```sh
npm install @lyra-ds/styles @lyra-ds/alpine alpinejs
```

`alpinejs` (>= 3.13) is a peer dependency — this package never bundles Alpine.

## Usage

```js
// e.g. resources/js/app.js
import Alpine from 'alpinejs';
import lyra from '@lyra-ds/alpine';

Alpine.plugin(lyra);
Alpine.start();
```

Then use the registered components in your markup:

```html
<div x-data="lyraDropdown({ align: 'end' })" class="lyra-dropdown">
  <button x-bind="trigger">Actions</button>
  <div x-bind="menu" x-cloak>
    <button x-bind="item">Edit</button>
  </div>
</div>
```

Put `x-cloak` on initially-hidden parts (like the menu above): bindings only
apply once Alpine starts, and without it a server-rendered page flashes the
raw markup. Add the standard `[x-cloak] { display: none !important; }` rule
to your CSS.

Initial state is seeded through the `x-data` arguments (`defaultOpen`,
`active`, …). Every controllable state is exposed via `x-modelable`, so
`x-model` — and Livewire's `wire:model` / `$wire.entangle` — work with no extra
code.

This package is ESM-only: consume it through a bundler (Vite, esbuild, webpack)
or a Node version with ESM support. There is no CommonJS build.

## Components (wave 1)

| `Alpine.data()` | Named bindings                          | Controllable state (`x-modelable`) |
| --------------- | --------------------------------------- | ---------------------------------- |
| `lyraDropdown`  | `trigger`, `menu`, `item`               | `open`                             |
| `lyraDialog`    | `overlay`, `panel`, `title`, `close`    | `open`                             |
| `lyraDrawer`    | `overlay`, `panel`, `title`, `close`    | `open`                             |
| `lyraTabs`      | `list`, `tab`, `panel`                  | `active`                           |
| `lyraAccordion` | `item`, `trigger`, `panelWrap`, `panel` | `openItems` (array)                |
| `lyraTooltip`   | `root`, `target`, `bubble`              | — (parity: React exposes none)     |
| `lyraPopover`   | `trigger`, `panel`                      | `open`                             |

Each component lands with a browser test suite (keyboard, focus, `inert`, axe)
run against the real `@lyra-ds/styles` CSS.

## Compatibility

Every release of `@lyra-ds/alpine` records which `@lyra-ds/styles` version it
was tested against. The Blade package's README carries the full matrix
(`blade 0.x ⇄ styles ^0.4 ⇄ alpine 0.x`).

| @lyra-ds/alpine | tested against @lyra-ds/styles |
| --------------- | ------------------------------ |
| 0.1.0           | ^0.4 (validated on 0.4.1)      |

## License

MIT
