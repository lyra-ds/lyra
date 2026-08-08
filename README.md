# Lyra Design System

[Português (pt-BR)](./README.pt-BR.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/lyra-ds/lyra/actions/workflows/ci.yml/badge.svg)](https://github.com/lyra-ds/lyra/actions/workflows/ci.yml)
[![npm @lyra-ds/styles](https://img.shields.io/npm/v/@lyra-ds/styles?label=%40lyra-ds%2Fstyles)](https://www.npmjs.com/package/@lyra-ds/styles)
[![npm @lyra-ds/react](https://img.shields.io/npm/v/@lyra-ds/react?label=%40lyra-ds%2Freact)](https://www.npmjs.com/package/@lyra-ds/react)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=github)](https://github.com/sponsors/lyra-ds)

> Open source, CSS-first design system. Semantic tokens, white-label theming, thin React wrappers — Vue, Svelte and Web Components on the same CSS core.

Lyra keeps every visual decision in CSS custom properties and `.lyra-*` classes —
framework adapters are thin wrappers on top of the same core. Rebrand an entire
app by setting four tokens.

- **211 semantic tokens** — light and dark built in, no manual dark styles.
- **White-label** — brands define `--brand`, `--brand-contrast`, `--brand-radius`,
  and `--brand-font`; everything else is derived via `color-mix`.
- **`@lyra-ds/react`** — 78 components as thin wrappers; Vue, Svelte and Web
  Components adapters on the roadmap (Zag.js), plus a shadcn-style component
  registry.
- **shadcn interop** — an opt-in compat layer maps `--background`, `--primary`,
  `--ring` and friends to Lyra tokens.
- **LLM-first** — `llms.txt` is generated from the real `.d.ts` sources, so agents
  write correct Lyra code.

## Packages

| Package           | Description                     |
| ----------------- | ------------------------------- |
| `@lyra-ds/styles` | Tokens + component CSS, zero JS |
| `@lyra-ds/react`  | React 18+ components            |

## Installation

Install the styles and React packages, then import the stylesheet once at your app
root:

```bash
npm i @lyra-ds/styles @lyra-ds/react
```

```ts
// Import the Lyra stylesheet once, at your application root.
import '@lyra-ds/styles';
```

## Usage

```tsx
import { Button } from '@lyra-ds/react';

export function Example() {
  return <Button variant="primary">Get started</Button>;
}
```

## Links

- [Versioning policy](./VERSIONING.md) — how the `0.x` line and breaking changes
  work.
- [Contributing](./CONTRIBUTING.md) — local setup, changesets, and locked
  decisions.
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)

## License

[MIT](./LICENSE) © Francisross Soares de Oliveira and Lyra DS contributors.
