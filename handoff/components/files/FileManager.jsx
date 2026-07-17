import React from "react";
import { Icon } from "../icons/Icon.jsx";
import { Dropdown } from "../navigation/Dropdown.jsx";

const fmFormatBytes = (n) => {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const fmIconFor = (file) => {
  if (file.type === "folder") return "folder";
  const ext = (file.name || "").split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return "file-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "file-spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "file-archive";
  if (["mp4", "mov", "webm"].includes(ext)) return "film";
  if (["mp3", "wav", "ogg"].includes(ext)) return "music";
  return "file";
};

/**
 * Gestor de arquivos — toolbar (busca + alternância lista/grade), breadcrumb
 * de pasta e listagem com ações por item via Dropdown.
 * files: [{ id, name, type?: "folder", size?, updated?, shared? }]
 */
export function FileManager({
  files = [],
  path = [],
  view: viewProp,
  defaultView = "list",
  onViewChange,
  onOpen,
  onNavigate,
  actions,
  searchPlaceholder = "Buscar arquivos…",
  emptyMessage = "Nenhum arquivo encontrado.",
  className = "",
  ...rest
}) {
  const [query, setQuery] = React.useState("");
  const [internalView, setInternalView] = React.useState(defaultView);
  const view = viewProp || internalView;
  const setView = (v) => { setInternalView(v); onViewChange && onViewChange(v); };

  const q = query.toLowerCase();
  const visible = files.filter((f) => !q || f.name.toLowerCase().includes(q));
  const folders = visible.filter((f) => f.type === "folder");
  const docs = visible.filter((f) => f.type !== "folder");
  const ordered = [...folders, ...docs];

  const defaultActions = (file) => [
    { id: "open", label: "Abrir", icon: <Icon name="external-link" size={15} /> },
    { id: "rename", label: "Renomear", icon: <Icon name="pencil" size={15} /> },
    { id: "download", label: "Baixar", icon: <Icon name="download" size={15} /> },
    { type: "separator" },
    { id: "delete", label: "Excluir", icon: <Icon name="trash-2" size={15} />, danger: true },
  ];

  const renderActions = (file) => (
    <Dropdown
      align="end"
      trigger={
        <button type="button" className="lyra-fm__more" aria-label={`Ações de ${file.name}`}>
          <Icon name="ellipsis" size={17} />
        </button>
      }
      items={(actions ? actions(file) : defaultActions(file))}
    />
  );

  return (
    <div className={["lyra-fm", className].filter(Boolean).join(" ")} {...rest}>
      <div className="lyra-fm__toolbar">
        <div className="lyra-fm__search">
          <Icon name="search" size={15} color="var(--text-faint)" />
          <input value={query} placeholder={searchPlaceholder} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="lyra-fm__views" role="group" aria-label="Modo de exibição">
          <button type="button" className={["lyra-fm__view", view === "list" && "lyra-fm__view--on"].filter(Boolean).join(" ")} aria-pressed={view === "list"} aria-label="Lista" onClick={() => setView("list")}>
            <Icon name="list" size={15} />
          </button>
          <button type="button" className={["lyra-fm__view", view === "grid" && "lyra-fm__view--on"].filter(Boolean).join(" ")} aria-pressed={view === "grid"} aria-label="Grade" onClick={() => setView("grid")}>
            <Icon name="layout-grid" size={15} />
          </button>
        </div>
      </div>
      {path.length > 0 && (
        <nav className="lyra-fm__path" aria-label="Pasta atual">
          {path.map((seg, i) => (
            <React.Fragment key={`${seg}-${i}`}>
              {i > 0 && <Icon name="chevron-right" size={13} color="var(--text-faint)" />}
              <button type="button" className="lyra-fm__crumb" onClick={() => onNavigate && onNavigate(i)} disabled={i === path.length - 1}>
                {i === 0 && <Icon name="folder-open" size={15} />}
                {seg}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}
      {ordered.length === 0 ? (
        <p className="lyra-fm__empty">{emptyMessage}</p>
      ) : view === "list" ? (
        <ul className="lyra-fm__list">
          <li className="lyra-fm__head" aria-hidden="true">
            <span>Nome</span><span>Tamanho</span><span>Modificado</span><span></span>
          </li>
          {ordered.map((f) => (
            <li className="lyra-fm__row" key={f.id}>
              <button type="button" className="lyra-fm__name" onClick={() => onOpen && onOpen(f)}>
                <span className={["lyra-fm__icon", f.type === "folder" && "lyra-fm__icon--folder"].filter(Boolean).join(" ")}>
                  <Icon name={fmIconFor(f)} size={17} />
                </span>
                <span className="lyra-fm__label">{f.name}</span>
                {f.shared && <span className="lyra-fm__shared"><Icon name="users" size={13} /></span>}
              </button>
              <span className="lyra-fm__cell">{f.type === "folder" ? `${f.items ?? "—"} itens` : fmFormatBytes(f.size)}</span>
              <span className="lyra-fm__cell">{f.updated || "—"}</span>
              <span className="lyra-fm__actions">{renderActions(f)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="lyra-fm__grid">
          {ordered.map((f) => (
            <div className="lyra-fm__card" key={f.id}>
              <span className="lyra-fm__card-actions">{renderActions(f)}</span>
              <button type="button" className="lyra-fm__card-body" onClick={() => onOpen && onOpen(f)}>
                <span className={["lyra-fm__icon", "lyra-fm__icon--big", f.type === "folder" && "lyra-fm__icon--folder"].filter(Boolean).join(" ")}>
                  <Icon name={fmIconFor(f)} size={26} />
                </span>
                <span className="lyra-fm__label">{f.name}</span>
                <span className="lyra-fm__card-meta">
                  {f.type === "folder" ? `${f.items ?? "—"} itens` : fmFormatBytes(f.size)}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
