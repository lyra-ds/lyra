Menu de ações contextual aberto por um trigger; use em linhas de tabela, headers de card e menus de usuário.

```jsx
<Dropdown
  align="end"
  trigger={<IconButton label="Mais ações" variant="ghost"><Icon name="ellipsis" /></IconButton>}
  items={[
    { id: "edit", label: "Editar", icon: <Icon name="pencil" size={16} />, onSelect: edit },
    { type: "separator" },
    { id: "del", label: "Remover", icon: <Icon name="trash-2" size={16} />, danger: true, onSelect: del },
  ]}
/>
```
