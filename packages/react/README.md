# @lyra-ds/react

Thin, tree-shakable React wrappers for the [Lyra Design System](https://github.com/lyra-ds). Each component is a light wrapper that renders the canonical `.lyra-*` markup — all appearance lives in [`@lyra-ds/styles`](https://www.npmjs.com/package/@lyra-ds/styles), never in JS. This keeps the visual layer portable across frameworks and the React layer minimal.

## Install

```sh
npm i @lyra-ds/react @lyra-ds/styles
```

`@lyra-ds/styles` is required: it ships the CSS that makes every component look correct. Import it once at your app root:

```ts
import '@lyra-ds/styles';
```

Then use components from their subpath or the root barrel:

```tsx
import { Button } from '@lyra-ds/react';
```

## Notes

- **Styling:** This package emits no CSS. Appearance comes entirely from the `.lyra-*` classes in `@lyra-ds/styles`. Nothing under `src/` may import a `.css` file — the package is published with `sideEffects: false`, so any stray CSS import would be silently dropped by consumer bundlers.
- **Peers:** `react` and `react-dom` (`>=18 <20`).
- **Fonts:** Install `@fontsource/plus-jakarta-sans` and `@fontsource/jetbrains-mono` as documented by `@lyra-ds/styles`.

MIT © Lyra DS contributors
