import React from "react";

/**
 * Dropdown de ações. items: [{ id, label, icon?, danger?, onSelect? }] ou { type: "separator" } ou { type: "label", label }.
 * Fecha ao clicar fora ou selecionar. `defaultOpen` abre no primeiro render (demos).
 */
export function Dropdown({ trigger, items = [], align = "start", defaultOpen = false, className = "", ...rest }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <span className={["lyra-dropdown", className].filter(Boolean).join(" ")} ref={ref} {...rest}>
      <span onClick={() => setOpen(!open)} style={{ display: "inline-flex" }}>{trigger}</span>
      {open && (
        <div className={`lyra-menu lyra-menu--${align}`} role="menu">
          {items.map((it, i) => {
            if (it.type === "separator") return <hr key={i} className="lyra-menu__sep" />;
            if (it.type === "label") return <span key={i} className="lyra-menu__label">{it.label}</span>;
            return (
              <button
                key={it.id || i}
                role="menuitem"
                className={["lyra-menu__item", it.danger && "lyra-menu__item--danger"].filter(Boolean).join(" ")}
                onClick={() => { setOpen(false); it.onSelect && it.onSelect(); }}
              >
                {it.icon}
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
