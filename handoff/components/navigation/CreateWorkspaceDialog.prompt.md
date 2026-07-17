Fluxo de criação de workspace pronto: nome → slug auto-gerado (editável), preview de avatar, validação de nome obrigatório.

```jsx
const [creating, setCreating] = React.useState(false);
<Button onClick={() => setCreating(true)}>Novo workspace</Button>
<CreateWorkspaceDialog
  open={creating}
  onClose={() => setCreating(false)}
  onCreate={({ name, slug }) => console.log(name, slug)}
/>
```
