Botão do Lyra DS para qualquer ação; use `primary` apenas para a ação principal da tela (uma por vista).

```jsx
<Button>Criar projeto</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="soft" iconLeft={<Icon name="plus" size={16} />}>Adicionar</Button>
<Button variant="danger" loading>Excluindo…</Button>
```

- `variant`: primary (ação principal), secondary (outline neutro), soft (preenchimento accent suave), ghost (sem fundo), danger (destrutivo).
- `size`: sm 32px · md 40px · lg 48px.
- `loading` exibe spinner e desabilita; `full` estica a 100%.
