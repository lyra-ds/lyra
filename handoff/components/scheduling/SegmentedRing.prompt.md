# SegmentedRing

Anel segmentado para decompor um total em categorias — o bloco herói de telas de progresso (ex.: pacote de sessões: consumidas · agendadas · disponíveis · perdidas).

```jsx
<SegmentedRing
  total={8}
  centerValue="5 de 8" centerLabel="Sessão"
  segments={[
    { value: 5, label: "Consumidas", tone: "success" },
    { value: 2, label: "Agendadas", tone: "accent" },
    { value: 1, label: "Disponíveis", tone: "neutral" },
  ]}
/>
```

- Legenda com valores é **obrigatória** — o anel nunca fica sozinho (a11y). SVG é `aria-hidden`; o texto equivalente embutido é a fonte.
- `size="md"` (96px) para cartões, `lg` (160px) para tela; `stacked` no mobile.
- Em listas e cartões compactos, use `Progress` + "Sessão 5 de 8" — não o anel.
- Derive os valores dos eventos reais (desfechos), nunca de um contador editável.
