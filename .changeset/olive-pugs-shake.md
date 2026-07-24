---
'@lyra-ds/react': minor
---

`CommandPalette` no longer ships Portuguese UI strings. The `placeholder` and `emptyMessage`
defaults are now English (`"Type a command or search…"`, `"No results for"`), and the footer
keyboard hints — previously hardcoded `navegar`/`selecionar`/`fechar` with no way to override
them — are English by default and translatable through a new `hints` prop:

```tsx
<CommandPalette hints={{ navigate: 'navegar', select: 'selecionar', close: 'fechar' }} />
```

`hints` merges over the defaults, so partial objects work. The new `CommandPaletteHints` type
is exported.
