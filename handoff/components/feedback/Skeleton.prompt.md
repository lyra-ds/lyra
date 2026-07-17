Placeholder de carregamento; monte a silhueta do conteúdo real (linhas + círculos), nunca um bloco único.

```jsx
<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
  <Skeleton circle height={32} />
  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
    <Skeleton width="40%" />
    <Skeleton width="70%" />
  </div>
</div>
```
