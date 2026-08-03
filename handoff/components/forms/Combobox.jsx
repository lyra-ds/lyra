import React from "react";
import { Icon } from "../icons/Icon.jsx";

/**
 * Combobox — select com busca. Abre um popover com campo de filtro e lista
 * de opções navegável por teclado (↑ ↓ ↵ esc).
 * options: [{ value, label, icon?, hint?, group?, trailing? }]
 */
export function Combobox({
  label,
  hint,
  error,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = "Selecionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Nenhum resultado.",
  disabled,
  defaultOpen = false,
  id,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [internal, setInternal] = React.useState(defaultValue ?? null);
  const current = value !== undefined ? value : internal;
  const rootRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const listRef = React.useRef(null);

  const filtered = options.filter(
    (o) => !query || o.label.toLowerCase().includes(query.toLowerCase()) || (o.keywords && o.keywords.toLowerCase().includes(query.toLowerCase()))
  );
  const selected = options.find((o) => o.value === current);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  React.useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
    if (open) {
      setQuery("");
      const idx = options.findIndex((o) => o.value === current);
      setActive(idx >= 0 ? idx : 0);
    }
  }, [open]);

  const pick = (opt) => {
    if (value === undefined) setInternal(opt.value);
    onChange && onChange(opt.value, opt);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    const list = listRef.current;
    const el = list && list.querySelectorAll("[data-cbx-option]")[active];
    if (el && list) {
      if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
      else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
    }
  }, [active]);

  const inputId = id || (label ? `lyra-cbx-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);

  const control = (
    <span className={["lyra-combobox", className].filter(Boolean).join(" ")} ref={rootRef} {...rest}>
      <button
        type="button"
        id={inputId}
        className={["lyra-input", "lyra-combobox__trigger", error && "lyra-input--error"].filter(Boolean).join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <span className={selected ? "lyra-combobox__value" : "lyra-combobox__placeholder"}>
          {selected ? (
            <React.Fragment>{selected.icon}{selected.label}</React.Fragment>
          ) : (
            placeholder
          )}
        </span>
        <Icon name="chevrons-up-down" size={15} color="var(--text-faint)" />
      </button>
      {open && (
        <div className="lyra-combobox__pop">
          <div className="lyra-combobox__search">
            <Icon name="search" size={15} color="var(--text-faint)" />
            <input
              ref={searchRef}
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="lyra-combobox__list" role="listbox" ref={listRef}>
            {filtered.length === 0 && <span className="lyra-combobox__empty">{emptyMessage}</span>}
            {filtered.map((opt, i) => (
              <React.Fragment key={opt.value}>
                {opt.group && (i === 0 || filtered[i - 1].group !== opt.group) && (
                  <span className="lyra-combobox__group" role="presentation">{opt.group}</span>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === current}
                  data-cbx-option
                  className={[
                    "lyra-combobox__option",
                    i === active && "lyra-combobox__option--active",
                  ].filter(Boolean).join(" ")}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(opt)}
                >
                  {opt.icon}
                  <span className="lyra-combobox__option-label">
                    {opt.label}
                    {opt.hint && <span className="lyra-combobox__option-hint">{opt.hint}</span>}
                  </span>
                  {opt.trailing && <span className="lyra-combobox__trailing">{opt.trailing}</span>}
                  {opt.value === current && <Icon name="check" size={15} color="var(--accent)" />}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </span>
  );

  if (!label && !hint && !error) return control;
  return (
    <div className="lyra-field">
      {label && <label className="lyra-label" htmlFor={inputId}>{label}</label>}
      {control}
      {error ? <span className="lyra-hint lyra-hint--error">{error}</span> : hint ? <span className="lyra-hint">{hint}</span> : null}
    </div>
  );
}
