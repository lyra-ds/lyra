Tabela de dados com header em caps e células flexíveis (aceitam Badge, Avatar, botões).

```jsx
<Table
  hover
  columns={[
    { key: "name", label: "Projeto" },
    { key: "status", label: "Status" },
    { key: "updated", label: "Atualizado", align: "right" },
  ]}
  rows={[
    { id: 1, name: <span className="lyra-table__primary">lyra-react</span>, status: <Badge tone="success" dot>Ativo</Badge>, updated: "há 2h" },
  ]}
/>
```
