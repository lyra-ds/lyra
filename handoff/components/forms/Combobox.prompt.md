Select com busca; use quando a lista passa de ~7 opções ou precisa de filtro. Para listas curtas e estáticas, prefira `Select`.

```jsx
<Combobox
  label="Responsável"
  placeholder="Atribuir a…"
  options={[
    { value: "ana", label: "Ana Souza", hint: "ana@lyra.dev" },
    { value: "bruno", label: "Bruno Lima", hint: "bruno@lyra.dev" },
    { value: "carla", label: "Carla Reis", hint: "carla@lyra.dev" },
  ]}
  onChange={(value) => console.log(value)}
/>
```

Opções aceitam `icon` (ex. `<Icon name="circle-dot" size={15}/>`). Controlado via `value`/`onChange` ou não-controlado via `defaultValue`.
