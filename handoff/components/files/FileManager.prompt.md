Gestor de arquivos completo para dashboards. Pastas agrupam no topo; ícone segue a extensão do arquivo.

```jsx
<FileManager
  path={["Meu Drive", "Projetos"]}
  files={[
    { id: "f1", name: "Brand", type: "folder", items: 24, updated: "há 2 dias", shared: true },
    { id: "a1", name: "proposta-v3.pdf", size: 1840000, updated: "ontem" },
    { id: "a2", name: "orçamento.xlsx", size: 96000, updated: "há 1 semana" },
  ]}
  onOpen={(f) => console.log("abrir", f.id)}
  onNavigate={(i) => console.log("ir para", i)}
/>
```

Ações por item: padrão Abrir/Renomear/Baixar/Excluir; personalize com `actions={(file) => [...itens de Dropdown]}`. Combine com `FileUpload` para o fluxo de envio.
