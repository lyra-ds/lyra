# Lyra DS review context

Lyra is a CSS-first, white-label design system for SaaS products. The core value:
any developer installs `@lyra-ds/styles` plus a framework adapter (`@lyra-ds/react`,
`@lyra-ds/alpine`) and gets a pixel-perfect, themeable UI (light/dark + white-label
via 4 tokens) with the same CSS core shared across frameworks.

## Architecture laws (locked decisions)

- **CSS-first**: 100% of appearance lives in `.lyra-*` classes in `@lyra-ds/styles`.
  Framework packages are thin behavior wrappers. This is what makes the system
  multi-framework — treat violations as architectural regressions, not style nits.
- **No Tailwind** in any package or app. A Tailwind preset may exist later as a
  satellite package only.
- **Fidelity**: colors, typography, spacing, radii, shadows and states come from the
  design handoff and are final.
- **No runtime CDN dependencies** — everything ships in the package.
- **Fonts** (Plus Jakarta Sans, JetBrains Mono) are peer dependencies via
  `@fontsource/*`, never bundled.

## Alpine-specific laws

- `x-for` templates mount exactly one root element (`display: contents` wrapper
  when needed).
- Component custom events dispatch from the component root when a guard is present.
- `select` elements populated via `x-for` bind `:selected` per option.
- Components revealed via `x-show` need the rAF-deferred `mounted` flag +
  `whenVisible` pattern to avoid first-paint flicker.
- Blade components build on top of the Alpine bindings (Blade ⊃ Alpine); they are
  not an independent stack.

## Docs apps

- The docs site dogfoods the design system: site chrome is built from Lyra
  components, not ad-hoc CSS.
- Every component page follows the multi-stack tab pattern and exists in both
  locales (en, pt-BR).
