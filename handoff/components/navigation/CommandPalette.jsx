import React from "react";
import { Icon } from "../icons/Icon.jsx";

/**
 * Command palette (⌘K) — busca global de comandos em overlay.
 * groups: [{ label, items: [{ id, label, icon?, hint?, shortcut?, onSelect? }] }]
 * Controlado por `open`/`onClose`; com `onOpen`, registra o atalho ⌘K / Ctrl+K.
 */
export function CommandPalette({
  open = false,
  onClose,
  onOpen,
  onSelect,
  groups = [],
  placeholder = "Digite um comando ou busque…",
  emptyMessage = "Nenhum resultado para",
  hotkey = "k",
  inline = false,
  className = "",
  ...rest
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);

  // atalho global ⌘K / Ctrl+K
  React.useEffect(() => {
    if (!hotkey || !onOpen) return;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        if (open) { onClose && onClose(); } else { onOpen(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey, onOpen, onClose, open]);

  React.useEffect(() => {
    if (open || inline) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current && inputRef.current.focus());
    }
  }, [open, inline]);

  const q = query.toLowerCase();
  const visible = groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) => !q || it.label.toLowerCase().includes(q) || (it.hint || "").toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.items.length > 0);
  const flat = visible.flatMap((g) => g.items);

  const pick = (item) => {
    item.onSelect && item.onSelect();
    onSelect && onSelect(item);
    onClose && onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) pick(flat[active]);
    } else if (e.key === "Escape") {
      onClose && onClose();
    }
  };

  let cursor = -1;
  const panel = (
    <div className={["lyra-cmdk", className].filter(Boolean).join(" ")} role="dialog" aria-label="Paleta de comandos" {...rest}>
      <div className="lyra-cmdk__search">
        <Icon name="search" size={17} color="var(--text-faint)" />
        <input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
        />
        <kbd className="lyra-kbd">esc</kbd>
      </div>
      <div className="lyra-cmdk__body">
        {flat.length === 0 && (
          <p className="lyra-cmdk__empty">{emptyMessage} “{query}”.</p>
        )}
        {visible.map((g, gi) => (
          <div className="lyra-cmdk__group" key={g.label || gi}>
            {g.label && <span className="lyra-cmdk__group-label">{g.label}</span>}
            {g.items.map((item) => {
              cursor += 1;
              const idx = cursor;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={["lyra-cmdk__item", idx === active && "lyra-cmdk__item--active"].filter(Boolean).join(" ")}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => pick(item)}
                >
                  {item.icon && <span className="lyra-cmdk__item-icon">{item.icon}</span>}
                  <span className="lyra-cmdk__item-label">{item.label}</span>
                  {item.hint && <span className="lyra-cmdk__item-hint">{item.hint}</span>}
                  {item.shortcut && (
                    <span className="lyra-cmdk__shortcut">
                      {item.shortcut.split(" ").map((k) => <kbd className="lyra-kbd" key={k}>{k}</kbd>)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="lyra-cmdk__footer">
        <span><kbd className="lyra-kbd">↑</kbd><kbd className="lyra-kbd">↓</kbd> navegar</span>
        <span><kbd className="lyra-kbd">↵</kbd> selecionar</span>
        <span><kbd className="lyra-kbd">esc</kbd> fechar</span>
      </div>
    </div>
  );

  if (inline) return panel;
  if (!open) return null;
  return (
    <div
      className="lyra-cmdk-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      {panel}
    </div>
  );
}
