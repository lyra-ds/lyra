import React from "react";

const cmp = (a, b) => {
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
};

const ic = (d) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d === "asc" ? <path d="m18 15-6-6-6 6" /> : d === "desc" ? <path d="m6 9 6 6 6-6" /> : <React.Fragment><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></React.Fragment>}
  </svg>
);

/**
 * Tabela de dados completa — ordenação, seleção múltipla, header sticky,
 * densidade, loading e vazio. Presentacional e controlável: pareia com
 * ActionBar (seleção) e Pagination (footer). Sem dependências externas —
 * adaptadores (TanStack etc.) só mapeiam estado para estes props.
 */
export function DataTable({
  columns = [], rows = [],
  sorting: sortingProp, defaultSorting = null, onSortChange,
  selectable = false, selected: selectedProp, defaultSelected = [], onSelectionChange,
  stickyHeader = false, maxHeight, density = "comfortable",
  loading = false, empty, footer, hover = false, onRowClick,
  className = "", ...rest
}) {
  const [sortState, setSortState] = React.useState(defaultSorting);
  const sorting = sortingProp !== undefined ? sortingProp : sortState;
  const [selState, setSelState] = React.useState(defaultSelected);
  const selected = selectedProp !== undefined ? selectedProp : selState;
  const headRef = React.useRef(null);

  const ids = React.useMemo(() => rows.map((r, i) => (r.id != null ? r.id : i)), [rows]);
  const setSel = (next) => { if (selectedProp === undefined) setSelState(next); onSelectionChange && onSelectionChange(next); };
  const setSort = (next) => { if (sortingProp === undefined) setSortState(next); onSortChange && onSortChange(next); };

  const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
  const someSelected = selected.length > 0 && !allSelected;
  React.useEffect(() => { if (headRef.current) headRef.current.indeterminate = someSelected; }, [someSelected]);

  const toggleSort = (col) => {
    if (!sorting || sorting.key !== col.key) return setSort({ key: col.key, dir: "asc" });
    if (sorting.dir === "asc") return setSort({ key: col.key, dir: "desc" });
    setSort(null);
  };

  const sorted = React.useMemo(() => {
    if (!sorting) return rows;
    const col = columns.find((c) => c.key === sorting.key);
    if (!col) return rows;
    const val = col.sortValue || ((r) => r[sorting.key]);
    const arr = rows.slice().sort((a, b) => cmp(val(a), val(b)));
    return sorting.dir === "desc" ? arr.reverse() : arr;
  }, [rows, sorting, columns]);

  const span = columns.length + (selectable ? 1 : 0);
  const tableCls = [
    "lyra-table",
    (hover || onRowClick) && "lyra-table--hover",
    density === "compact" && "lyra-table--compact",
    stickyHeader && "lyra-table--sticky",
  ].filter(Boolean).join(" ");

  return (
    <div className={["lyra-table-wrap", className].filter(Boolean).join(" ")} {...rest}>
      <div className="lyra-table-scroll" style={maxHeight ? { maxHeight } : undefined}>
        <table className={tableCls}>
          <thead>
            <tr>
              {selectable && (
                <th className="lyra-table__check">
                  <input ref={headRef} type="checkbox" className="lyra-checkbox" aria-label="Selecionar tudo" checked={allSelected} onChange={() => setSel(allSelected ? [] : ids.slice())} />
                </th>
              )}
              {columns.map((c) => {
                const active = sorting && sorting.key === c.key;
                const st = {};
                if (c.align) st.textAlign = c.align;
                if (c.width) st.width = c.width;
                return (
                  <th key={c.key} style={Object.keys(st).length ? st : undefined} aria-sort={active ? (sorting.dir === "asc" ? "ascending" : "descending") : undefined}>
                    {c.sortable ? (
                      <button type="button" className={["lyra-table__sortbtn", active && "lyra-table__sortbtn--active"].filter(Boolean).join(" ")} onClick={() => toggleSort(c)}>
                        {c.label}
                        {ic(active ? sorting.dir : null)}
                      </button>
                    ) : c.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: typeof loading === "number" ? loading : 5 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {selectable && <td className="lyra-table__check"><span className="lyra-skeleton" style={{ width: 16, height: 16, display: "inline-block" }}></span></td>}
                  {columns.map((c) => <td key={c.key}><span className="lyra-skeleton" style={{ width: "60%", height: 12, display: "inline-block" }}></span></td>)}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={span} className="lyra-table__emptycell">{empty || "Nenhum registro."}</td></tr>
            ) : (
              sorted.map((r, i) => {
                const id = r.id != null ? r.id : i;
                const isSel = selected.includes(id);
                return (
                  <tr key={id} className={isSel ? "lyra-table__row--selected" : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                    {selectable && (
                      <td className="lyra-table__check">
                        <input type="checkbox" className="lyra-checkbox" aria-label="Selecionar linha" checked={isSel} onClick={(e) => e.stopPropagation()} onChange={() => setSel(isSel ? selected.filter((s) => s !== id) : [...selected, id])} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{r[c.key]}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer && <div className="lyra-table__footer">{footer}</div>}
    </div>
  );
}
