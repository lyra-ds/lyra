Paleta de comandos ⌘K. Monte-a sempre (ela retorna null fechada); passe `onOpen` para ganhar o atalho global ⌘K/Ctrl+K de graça.

```jsx
const [open, setOpen] = React.useState(false);
<CommandPalette
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
  groups={[
    { label: "Ações", items: [
      { id: "new", label: "Novo projeto", icon: <Icon name="plus" size={17} />, shortcut: "⌘ N" },
      { id: "invite", label: "Convidar membro", icon: <Icon name="user-plus" size={17} /> },
    ]},
    { label: "Ir para", items: [
      { id: "dash", label: "Dashboard", icon: <Icon name="layout-dashboard" size={17} />, shortcut: "G D" },
    ]},
  ]}
  onSelect={(item) => console.log(item.id)}
/>
```

Use `inline` para renderizar só o painel (sem overlay) em documentação.
