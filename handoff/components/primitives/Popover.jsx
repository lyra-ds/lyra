import React from "react";

/**
 * Portal para document.body (usa window.ReactDOM quando disponível;
 * caso contrário renderiza in-place).
 */
export function Portal({ children }) {
  const RD = typeof window !== "undefined" ? window.ReactDOM : null;
  return RD && RD.createPortal ? RD.createPortal(children, document.body) : children;
}

/**
 * Popover primitivo — painel ancorado ao trigger, controlado ou não.
 * Fecha com clique fora e Escape. Base para menus, filtros e pickers.
 */
export function Popover({ trigger, open: openProp, defaultOpen = false, onOpenChange, side = "bottom", align = "start", width, className = "", children, ...rest }) {
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp != null ? openProp : openState;
  const ref = React.useRef(null);
  const setOpen = (v) => {
    if (openProp == null) setOpenState(v);
    onOpenChange && onOpenChange(v);
  };
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <span className={["lyra-popover-anchor", className].filter(Boolean).join(" ")} ref={ref} {...rest}>
      <span style={{ display: "inline-flex" }} onClick={() => setOpen(!open)}>{trigger}</span>
      {open && (
        <div className={`lyra-popover lyra-popover--${side} lyra-popover--align-${align}`} role="dialog" style={width ? { width } : undefined}>
          {children}
        </div>
      )}
    </span>
  );
}
