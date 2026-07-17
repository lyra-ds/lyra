Empilhe vários `SidebarGroup` dentro de uma sidebar para criar seções de menu. Combina com `WorkspaceSwitcher` no topo.

```jsx
<SidebarGroup
  label="Geral"
  items={[
    { id: "home", label: "Início", icon: <Icon name="house" size={17} />, active: true },
    { id: "inbox", label: "Caixa de entrada", icon: <Icon name="inbox" size={17} />, badge: 12 },
  ]}
  onSelect={(id) => console.log(id)}
/>
<SidebarGroup
  label="Projetos"
  collapsible
  items={[
    { id: "atlas", label: "Atlas", icon: <Icon name="folder" size={17} /> },
  ]}
/>
```
