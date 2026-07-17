Modal para decisões que interrompem o fluxo (confirmações, formulários curtos). Máximo um por vez.

```jsx
const [open, setOpen] = React.useState(false);
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Excluir projeto?"
  footer={<>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button variant="danger">Excluir</Button>
  </>}
>
  Essa ação não pode ser desfeita.
</Dialog>
```
