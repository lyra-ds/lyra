# DataTable

A versão "produto real" da Table: ordenação (ciclo asc → desc → sem ordem, `aria-sort`), seleção com selecionar-tudo indeterminate, header sticky em área rolável, densidade compacta, skeleton de loading e estado vazio — tudo controlável ou não por prop.

Decisões:
- **Sem dependência de TanStack**: presentacional e controlado. Um adaptador externo só mapeia o estado do TanStack para `sorting`/`selected`/`onSortChange` — quem usa outra lib (ou nenhuma) consome o mesmo visual.
- Células são ReactNode; ordenação de células ricas usa `sortValue(row)`.
- Seleção emite ids — ligue `selected.length` direto no `count` do ActionBar.
- `Table` continua existindo para listas simples; DataTable é para grids operacionais.
