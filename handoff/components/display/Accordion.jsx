import React from "react";

/**
 * Accordion — lista de itens expansíveis. items: [{ id, title, content }].
 * Por padrão um aberto por vez; `multiple` permite vários.
 */
export function Accordion({ items = [], defaultOpen, multiple = false, className = "", ...rest }) {
  const [open, setOpen] = React.useState(() => new Set(defaultOpen != null ? [defaultOpen] : []));
  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  return (
    <div className={["lyra-accordion", className].filter(Boolean).join(" ")} {...rest}>
      {items.map((it) => {
        const isOpen = open.has(it.id);
        return (
          <div key={it.id} className={["lyra-acc__item", isOpen && "lyra-acc__item--open"].filter(Boolean).join(" ")}>
            <button type="button" className="lyra-acc__trigger" aria-expanded={isOpen} onClick={() => toggle(it.id)}>
              {it.title}
              <span className="lyra-acc__chevron" aria-hidden="true"></span>
            </button>
            {isOpen && <div className="lyra-acc__panel">{it.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
