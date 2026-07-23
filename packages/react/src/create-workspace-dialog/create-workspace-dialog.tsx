import { useId, useState } from 'react';
import { Avatar } from '../avatar';
import { Button } from '../button';
import { Dialog } from '../dialog';
import { Input } from '../input';

/** Props for {@link CreateWorkspaceDialog}. */
export interface CreateWorkspaceDialogProps {
  /** Controls visibility. Default `false`. */
  open?: boolean;
  /** Called when the dialog is dismissed or creation succeeds. */
  onClose?: () => void;
  /** Receives the trimmed workspace name and its URL-safe slug after submission. */
  onCreate?: (data: { name: string; slug: string }) => void;
  /** Dialog heading. Default `"Create workspace"`. */
  title?: string;
  /** Text rendered before the editable slug. Default `"lyra.dev/"`. */
  slugPrefix?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** A composed Dialog for naming a new workspace and choosing its URL slug. */
export function CreateWorkspaceDialog({
  open = false,
  onClose,
  onCreate,
  title = 'Create workspace',
  slugPrefix = 'lyra.dev/',
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);
  const slugInputId = useId();

  // Reset synchronously on each closed→open transition so a newly opened dialog is blank
  // before it paints. This is the React-approved adjusted-state pattern used by usePresence.
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) {
      setName('');
      setSlug('');
      setTouched(false);
    }
  }

  const handleSubmit = (): void => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onCreate?.({ name: trimmedName, slug });
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create workspace
          </Button>
        </>
      }
    >
      <div className="lyra-wscreate">
        <div className="lyra-wscreate__preview">
          <Avatar name={name || '?'} size="lg" shape="square" />
          <span className="lyra-wscreate__preview-hint">The avatar uses the name initials.</span>
        </div>
        <Input
          label="Workspace name"
          placeholder="Acme Inc"
          value={name}
          onChange={(event) => {
            const value = event.target.value;
            setName(value);
            if (!touched) setSlug(slugify(value));
          }}
        />
        <div className="lyra-field">
          <label className="lyra-label" htmlFor={slugInputId}>
            URL
          </label>
          <span className="lyra-wscreate__slug">
            <span className="lyra-wscreate__slug-prefix">{slugPrefix}</span>
            <input
              id={slugInputId}
              className="lyra-wscreate__slug-input"
              placeholder="acme-inc"
              value={slug}
              onChange={(event) => {
                setTouched(true);
                setSlug(slugify(event.target.value));
              }}
            />
          </span>
          <span className="lyra-hint">Lowercase letters, numbers, and hyphens.</span>
        </div>
      </div>
    </Dialog>
  );
}
