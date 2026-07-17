import React from "react";

/**
 * Tabela de dados. columns: [{ key, label, align? }], rows: objetos.
 * Valores podem ser ReactNode (badges, avatares…).
 */
export function Table({ columns = [], rows = [], hover = false, className = "", ...rest }) {
  return (
    <div className={["lyra-table-wrap", className].filter(Boolean).join(" ")} {...rest}>
      <table className={["lyra-table", hover && "lyra-table--hover"].filter(Boolean).join(" ")}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id != null ? r.id : i}>
              {columns.map((c) => (
                <td key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
