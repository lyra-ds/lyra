import React from "react";
import { Icon } from "../icons/Icon.jsx";
import { Avatar } from "../display/Avatar.jsx";

/**
 * Seletor de workspace/tenant — trigger com avatar + plano e popover com a
 * lista de workspaces e ação "Criar workspace".
 * workspaces: [{ id, name, plan?, members? }]
 */
export function WorkspaceSwitcher({
  workspaces = [],
  current,
  onChange,
  onCreate,
  createLabel = "Criar workspace",
  defaultOpen = false,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  const cur = workspaces.find((w) => w.id === current) || workspaces[0];

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className={["lyra-wssw", className].filter(Boolean).join(" ")} ref={ref} {...rest}>
      <button type="button" className="lyra-wssw__trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Avatar name={cur ? cur.name : "?"} size="sm" shape="square" />
        <span className="lyra-wssw__id">
          <span className="lyra-wssw__name">{cur ? cur.name : "Selecionar workspace"}</span>
          {cur && cur.plan && <span className="lyra-wssw__plan">{cur.plan}</span>}
        </span>
        <Icon name="chevrons-up-down" size={15} color="var(--text-faint)" />
      </button>
      {open && (
        <div className="lyra-wssw__pop" role="listbox">
          <span className="lyra-wssw__pop-label">Workspaces</span>
          {workspaces.map((w) => (
            <button
              type="button"
              key={w.id}
              role="option"
              aria-selected={cur && w.id === cur.id}
              className="lyra-wssw__item"
              onClick={() => { setOpen(false); onChange && onChange(w.id, w); }}
            >
              <Avatar name={w.name} size="sm" shape="square" />
              <span className="lyra-wssw__id">
                <span className="lyra-wssw__name">{w.name}</span>
                {(w.plan || w.members != null) && (
                  <span className="lyra-wssw__meta">
                    {[w.plan, w.members != null ? `${w.members} membros` : null].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              {cur && w.id === cur.id && <Icon name="check" size={15} color="var(--accent)" />}
            </button>
          ))}
          {onCreate && (
            <React.Fragment>
              <hr className="lyra-wssw__sep" />
              <button type="button" className="lyra-wssw__item lyra-wssw__create" onClick={() => { setOpen(false); onCreate(); }}>
                <span className="lyra-wssw__plus"><Icon name="plus" size={15} /></span>
                <span className="lyra-wssw__create-label">{createLabel}</span>
              </button>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}
