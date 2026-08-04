# @lyra-ds/styles

CSS-first design tokens and component styles for the Lyra Design System — 211 tokens and 78 components, zero JavaScript. The look of every Lyra component lives in `.lyra-*` classes, so the same CSS is reusable across any framework.

## Install

```bash
npm install @lyra-ds/styles
```

## Usage

A single import wires up all tokens and every component:

```js
import '@lyra-ds/styles';
```

or, from a stylesheet:

```css
@import '@lyra-ds/styles';
```

Both resolve to `styles.css`, which `@import`s the 7 token layers followed by the 11 component layers in the canonical handoff order. The literal subpath also works if you prefer to be explicit:

```js
import '@lyra-ds/styles/styles.css';
```

With no `data-theme` or `data-brand` attribute set, importing the entry yields the baseline light appearance.

### Individual token files

Need only a slice? Each token file is reachable through the `./tokens/*` subpath:

```css
@import '@lyra-ds/styles/tokens/colors.css';
@import '@lyra-ds/styles/tokens/spacing.css';
```

There are no per-component subpaths — import the full entry for component styles.

## White-label brand contract

Re-brand Lyra by defining **only 4 input tokens** on a `[data-brand]` scope. The entire accent group is derived via `color-mix(in oklab, …)` — no rebuild, and it works in both light and dark.

| Input token        | Required?    | Default                 | Purpose                                          |
| ------------------ | ------------ | ----------------------- | ------------------------------------------------ |
| `--brand`          | **required** | —                       | Brand primary color                              |
| `--brand-contrast` | optional     | `#FFFFFF`               | Text/foreground on brand fills (`--on-accent`)   |
| `--brand-radius`   | optional     | `10px`                  | Overrides `--radius-md` (default control radius) |
| `--brand-font`     | optional     | Plus Jakarta Sans stack | Overrides `--font-sans` + `--font-display`       |

Set `data-brand="acme"` on your `<html>` (or any ancestor) and define the brand tokens:

```css
[data-brand='acme'] {
  --brand: #0d9488;
  --brand-radius: 6px;
}
```

```html
<html data-brand="acme"></html>
```

The `[data-brand]` layer is inert until the attribute is present, and every derived accent value (hover, active, soft, focus-ring, link, border) is mixed automatically for both light and dark themes.

## Fonts (peer install)

Fonts are **not** bundled and are **never** loaded from a runtime CDN. Install them as peers and import the weights you need from your own app — this replaces the CDN request the prototype used.

```bash
npm install @fontsource/plus-jakarta-sans @fontsource/jetbrains-mono
```

Plus Jakarta Sans backs `--font-sans` / `--font-display`; JetBrains Mono backs `--font-mono`. Import every weight the design system uses:

```js
// Plus Jakarta Sans — weights 400–800
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';

// JetBrains Mono — weights 400–600
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
```

## shadcn/ui compatibility (opt-in)

Apps that mix Lyra with shadcn/ui components can import the opt-in compatibility layer, which maps shadcn's semantic variables onto Lyra tokens. It is **never** imported by `styles.css` — import it explicitly, after the entry:

```js
import '@lyra-ds/styles';
import '@lyra-ds/styles/compat-shadcn.css';
```

## License

MIT
