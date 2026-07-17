Slide-over lateral para formulários e detalhes contextuais (convidar membro, editar registro) sem sair da página. Dialog interrompe; Drawer acompanha.

```jsx
<Drawer
  open={open}
  onClose={() => setOpen(false)}
  title="Convidar membros"
  footer={<>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
    <Button>Enviar convites</Button>
  </>}
>
  <Textarea label="E-mails" placeholder="um por linha…" rows={4} />
</Drawer>
```
