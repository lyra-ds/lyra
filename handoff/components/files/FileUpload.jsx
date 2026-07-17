import React from "react";
import { Icon } from "../icons/Icon.jsx";

const uploadFormatBytes = (n) => {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const uploadIconFor = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "file-text";
  if (["xls", "xlsx", "csv"].includes(ext)) return "file-spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "file-archive";
  if (["mp4", "mov", "webm"].includes(ext)) return "film";
  return "file";
};

/**
 * Upload múltiplo de arquivos — dropzone (drag & drop ou clique) + lista
 * com progresso por arquivo e remoção. Sem backend: simula o progresso
 * (uploadDuration) e chama onFiles ao adicionar / onChange a cada mudança.
 */
export function FileUpload({
  label = "Arraste arquivos aqui ou clique para selecionar",
  hint,
  accept,
  maxSizeMB,
  multiple = true,
  uploadDuration = 1800,
  defaultItems = [],
  onFiles,
  onChange,
  className = "",
  ...rest
}) {
  const [items, setItems] = React.useState(defaultItems);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);
  const timersRef = React.useRef({});

  React.useEffect(() => () => Object.values(timersRef.current).forEach(clearInterval), []);

  const update = (fn) => setItems((prev) => {
    const next = fn(prev);
    onChange && onChange(next);
    return next;
  });

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    onFiles && onFiles(files);
    const stamped = files.map((f, i) => {
      const tooBig = maxSizeMB && f.size > maxSizeMB * 1024 * 1024;
      return {
        id: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        size: f.size,
        progress: tooBig ? 0 : 5,
        status: tooBig ? "error" : "uploading",
        error: tooBig ? `Acima de ${maxSizeMB} MB` : undefined,
      };
    });
    update((prev) => (multiple ? [...prev, ...stamped] : stamped.slice(0, 1)));
    stamped.filter((s) => s.status === "uploading").forEach((s) => {
      const step = 100 / Math.max(uploadDuration / 120, 1);
      timersRef.current[s.id] = setInterval(() => {
        update((prev) => prev.map((it) => {
          if (it.id !== s.id) return it;
          const p = Math.min(it.progress + step * (0.6 + Math.random() * 0.8), 100);
          if (p >= 100) {
            clearInterval(timersRef.current[s.id]);
            delete timersRef.current[s.id];
            return { ...it, progress: 100, status: "done" };
          }
          return { ...it, progress: p };
        }));
      }, 120);
    });
  };

  const remove = (id) => {
    if (timersRef.current[id]) { clearInterval(timersRef.current[id]); delete timersRef.current[id]; }
    update((prev) => prev.filter((it) => it.id !== id));
  };

  return (
    <div className={["lyra-upload", className].filter(Boolean).join(" ")} {...rest}>
      <button
        type="button"
        className={["lyra-upload__zone", dragging && "lyra-upload__zone--drag"].filter(Boolean).join(" ")}
        onClick={() => inputRef.current && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      >
        <span className="lyra-upload__zone-icon"><Icon name="cloud-upload" size={22} /></span>
        <span className="lyra-upload__zone-label">{label}</span>
        {(hint || accept || maxSizeMB) && (
          <span className="lyra-upload__zone-hint">
            {hint || [accept, maxSizeMB && `até ${maxSizeMB} MB por arquivo`].filter(Boolean).join(" · ")}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </button>
      {items.length > 0 && (
        <ul className="lyra-upload__list">
          {items.map((it) => (
            <li className={["lyra-upload__item", it.status === "error" && "lyra-upload__item--error"].filter(Boolean).join(" ")} key={it.id}>
              <span className="lyra-upload__item-icon">
                <Icon name={it.status === "error" ? "circle-alert" : uploadIconFor(it.name)} size={17} />
              </span>
              <span className="lyra-upload__item-body">
                <span className="lyra-upload__item-row">
                  <span className="lyra-upload__item-name">{it.name}</span>
                  <span className="lyra-upload__item-meta">
                    {it.status === "error" ? it.error
                      : it.status === "done" ? uploadFormatBytes(it.size)
                      : `${Math.round(it.progress)}%`}
                  </span>
                </span>
                {it.status === "uploading" && (
                  <span className="lyra-upload__bar"><span className="lyra-upload__bar-fill" style={{ width: `${it.progress}%` }}></span></span>
                )}
              </span>
              {it.status === "done" && <span className="lyra-upload__check"><Icon name="circle-check" size={17} /></span>}
              <button type="button" className="lyra-upload__remove" aria-label={`Remover ${it.name}`} onClick={() => remove(it.id)}>
                <Icon name="x" size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
