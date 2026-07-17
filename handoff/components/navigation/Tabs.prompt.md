Tabs para alternar vistas dentro da mesma página; controladas via `active` + `onChange`.

```jsx
const [tab, setTab] = React.useState("geral");
<Tabs
  active={tab}
  onChange={setTab}
  items={[
    { id: "geral", label: "Geral" },
    { id: "membros", label: "Membros", count: 12 },
    { id: "billing", label: "Cobrança" },
  ]}
/>
```

- `variant="pills"` para o estilo segmentado (filtros, períodos).
