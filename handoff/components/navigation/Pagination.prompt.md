Paginação numérica com prev/next; colapsa com reticências acima de 7 páginas.

```jsx
const [page, setPage] = React.useState(1);
<Pagination page={page} total={12} onChange={setPage} />
```
