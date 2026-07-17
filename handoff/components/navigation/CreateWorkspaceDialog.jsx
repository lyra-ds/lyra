import React from "react";
import { Dialog } from "../feedback/Dialog.jsx";
import { Input } from "../forms/Input.jsx";
import { Button } from "../buttons/Button.jsx";
import { Avatar } from "../display/Avatar.jsx";

/**
 * Modal de criação de workspace — nome, slug (auto-gerado, editável) e
 * preview do avatar. Chama onCreate({ name, slug }).
 */
export function CreateWorkspaceDialog({
  open = false,
  onClose,
  onCreate,
  title = "Criar workspace",
  slugPrefix = "lyra.dev/",
  ...rest
}) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (open) { setName(""); setSlug(""); setTouched(false); }
  }, [open]);

  const slugify = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleName = (e) => {
    setName(e.target.value);
    if (!touched) setSlug(slugify(e.target.value));
  };

  const submit = () => {
    if (!name.trim()) return;
    onCreate && onCreate({ name: name.trim(), slug });
    onClose && onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <React.Fragment>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!name.trim()}>Criar workspace</Button>
        </React.Fragment>
      }
      {...rest}
    >
      <div className="lyra-wscreate">
        <div className="lyra-wscreate__preview">
          <Avatar name={name || "?"} size="lg" shape="square" />
          <span className="lyra-wscreate__preview-hint">O avatar usa as iniciais do nome.</span>
        </div>
        <Input
          label="Nome do workspace"
          placeholder="Acme Inc"
          value={name}
          onChange={handleName}
        />
        <div className="lyra-field">
          <label className="lyra-label" htmlFor="lyra-wscreate-slug">URL</label>
          <span className="lyra-wscreate__slug">
            <span className="lyra-wscreate__slug-prefix">{slugPrefix}</span>
            <input
              id="lyra-wscreate-slug"
              className="lyra-wscreate__slug-input"
              placeholder="acme-inc"
              value={slug}
              onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }}
            />
          </span>
          <span className="lyra-hint">Letras minúsculas, números e hífens.</span>
        </div>
      </div>
    </Dialog>
  );
}
