import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Avatar } from '../avatar';
import { Button } from '../button';
import { Dialog } from '../dialog';
import { Input } from '../input';

/** A creation operation owned by {@link CreateWorkspaceDialog}. */
export interface CreateWorkspaceRequest {
  operationId: string;
  data: { name: string; slug: string };
  signal: AbortSignal;
}

/** The terminal acknowledgement a creation consumer returns for its operation. */
export type CreateWorkspaceResult =
  | { operationId: string; status: 'accepted' }
  | { operationId: string; status: 'rejected'; error: string }
  | { operationId: string; status: 'canceled' };

/** Props for {@link CreateWorkspaceDialog}. */
export interface CreateWorkspaceDialogProps {
  /** Controls visibility. Default `false`. */
  open?: boolean;
  /** Called when the dialog is dismissed or a creation operation is accepted. */
  onClose?: () => void;
  /** Receives one owned request and explicitly acknowledges its terminal outcome. */
  onCreate?: (
    request: CreateWorkspaceRequest,
  ) => CreateWorkspaceResult | Promise<CreateWorkspaceResult>;
  /** Dialog heading. Default `"Create workspace"`. */
  title?: string;
  /** Text rendered before the editable slug. Default `"lyra.dev/"`. */
  slugPrefix?: string;
  /** Resolves the focus destination after an accepted close. */
  returnFocusTo?: () => HTMLElement | null;
}

type CreateWorkspacePhase = 'editing' | 'submitting' | 'canceling' | 'error' | 'accepted';

interface CurrentOperation {
  id: string;
  controller: AbortController;
  phase: 'submitting' | 'canceling';
  closeRequested: boolean;
  aborted: boolean;
}

interface FieldErrors {
  name?: string;
  slug?: string;
}

const fallbackError = 'We could not create the workspace. Please try again.';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resultError(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') return fallbackError;
  if (!('status' in result) || result.status !== 'rejected') return fallbackError;
  if (!('error' in result) || typeof result.error !== 'string' || !result.error.trim()) {
    return fallbackError;
  }
  return result.error;
}

function hasDifferentOperationId(result: unknown, operationId: string): boolean {
  return (
    result !== null &&
    typeof result === 'object' &&
    'operationId' in result &&
    typeof result.operationId === 'string' &&
    result.operationId !== operationId
  );
}

function hasResultStatus(
  result: unknown,
  operationId: string,
  status: CreateWorkspaceResult['status'],
): boolean {
  return (
    result !== null &&
    typeof result === 'object' &&
    'operationId' in result &&
    result.operationId === operationId &&
    'status' in result &&
    result.status === status
  );
}

function isNativePromise(
  result: CreateWorkspaceResult | Promise<CreateWorkspaceResult> | undefined,
): result is Promise<CreateWorkspaceResult> {
  return (
    result !== null &&
    typeof result === 'object' &&
    Object.prototype.toString.call(result) === '[object Promise]'
  );
}

/** A composed Dialog for naming a new workspace and choosing its URL slug. */
export function CreateWorkspaceDialog({
  open = false,
  onClose,
  onCreate,
  title = 'Create workspace',
  slugPrefix = 'lyra.dev/',
  returnFocusTo,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [phase, setPhase] = useState<CreateWorkspacePhase>('editing');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [operationError, setOperationError] = useState('');
  const formId = useId();
  const slugInputId = useId();
  const slugErrorId = useId();
  const operationPrefix = useId();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const slugInputRef = useRef<HTMLInputElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const operationRef = useRef<CurrentOperation | null>(null);
  const operationSequence = useRef(0);
  const previouslyOpenRef = useRef(open);

  const resetForOpen = (): void => {
    setName('');
    setSlug('');
    setTouched(false);
    setPhase('editing');
    setFieldErrors({});
    setOperationError('');
  };

  const invalidateOperation = (): void => {
    const operation = operationRef.current;
    if (!operation) return;

    // Invalidate before aborting: an abort observer can settle synchronously.
    operationRef.current = null;
    if (!operation.aborted) {
      operation.aborted = true;
      operation.controller.abort({ operationId: operation.id });
    }
  };

  useLayoutEffect(() => {
    const wasOpen = previouslyOpenRef.current;
    previouslyOpenRef.current = open;

    if (open && !wasOpen) {
      resetForOpen();
      return;
    }

    if (!open && wasOpen) {
      invalidateOperation();
      setPhase('editing');
      setFieldErrors({});
      setOperationError('');
    }
  }, [open]);

  useLayoutEffect(() => {
    return () => {
      invalidateOperation();
    };
  }, []);

  const isPending = open && (phase === 'submitting' || phase === 'canceling');
  const displayedPhase = open ? phase : 'editing';
  const displayedFieldErrors: FieldErrors = open ? fieldErrors : {};
  const displayedOperationError = open ? operationError : '';

  const beginEditing = (field: keyof FieldErrors): void => {
    if (isPending) return;
    if (phase === 'error') setPhase('editing');
    if (operationError) setOperationError('');
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const settle = (result: unknown, operationId: string): void => {
    const operation = operationRef.current;
    if (
      !operation ||
      operation.id !== operationId ||
      hasDifferentOperationId(result, operationId)
    ) {
      return;
    }

    operationRef.current = null;

    if (hasResultStatus(result, operationId, 'accepted')) {
      flushSync(() => {
        setPhase('accepted');
        setFieldErrors({});
        setOperationError('');
      });
      onClose?.();
      return;
    }

    if (hasResultStatus(result, operationId, 'canceled')) {
      flushSync(() => {
        setPhase('editing');
        setFieldErrors({});
        setOperationError('');
      });
      if (operation.closeRequested) onClose?.();
      return;
    }

    const error = resultError(result) ?? fallbackError;
    flushSync(() => {
      setPhase('error');
      setFieldErrors({});
      setOperationError(error);
    });
    errorSummaryRef.current?.focus();
  };

  const requestClose = (): void => {
    const operation = operationRef.current;
    if (!operation) {
      onClose?.();
      return;
    }
    if (operation.phase === 'canceling') return;

    operation.phase = 'canceling';
    operation.closeRequested = true;
    flushSync(() => setPhase('canceling'));
    if (!operation.aborted) {
      operation.aborted = true;
      operation.controller.abort({ operationId: operation.id });
    }
  };

  const focusFirstInvalidField = (errors: FieldErrors): void => {
    if (errors.name) {
      nameInputRef.current?.focus();
      return;
    }
    slugInputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (operationRef.current || phase === 'accepted') return;

    const trimmedName = name.trim();
    const errors: FieldErrors = {
      ...(trimmedName ? {} : { name: 'Enter a workspace name.' }),
      ...(slug ? {} : { slug: 'Enter a workspace URL.' }),
    };
    if (errors.name || errors.slug) {
      flushSync(() => {
        setPhase('error');
        setFieldErrors(errors);
        setOperationError('');
      });
      focusFirstInvalidField(errors);
      return;
    }

    const id = `${operationPrefix}-${++operationSequence.current}`;
    const controller = new AbortController();
    const operation: CurrentOperation = {
      id,
      controller,
      phase: 'submitting',
      closeRequested: false,
      aborted: false,
    };
    operationRef.current = operation;
    const form = event.currentTarget;
    flushSync(() => {
      setPhase('submitting');
      setFieldErrors({});
      setOperationError('');
    });
    if (!form.contains(document.activeElement)) nameInputRef.current?.focus();

    const request: CreateWorkspaceRequest = {
      operationId: id,
      data: { name: trimmedName, slug },
      signal: controller.signal,
    };

    let result: CreateWorkspaceResult | Promise<CreateWorkspaceResult> | undefined;
    try {
      result = onCreate?.(request);
    } catch {
      settle({ operationId: id, status: 'rejected', error: fallbackError }, id);
      return;
    }

    if (isNativePromise(result)) {
      result.then(
        (resolved) => settle(resolved, id),
        () => settle({ operationId: id, status: 'rejected', error: fallbackError }, id),
      );
      return;
    }
    settle(result, id);
  };

  return (
    <Dialog
      open={open}
      onClose={requestClose}
      title={title}
      returnFocusTo={returnFocusTo}
      initialFocusTo={() => nameInputRef.current}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={requestClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={isPending} disabled={isPending}>
            Create workspace
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="lyra-wscreate"
        aria-label={title}
        data-state={displayedPhase}
        aria-busy={isPending || undefined}
        onSubmit={handleSubmit}
      >
        <div className="lyra-wscreate__preview">
          <Avatar name={name || '?'} size="lg" shape="square" />
          <span className="lyra-wscreate__preview-hint">The avatar uses the name initials.</span>
        </div>
        {displayedOperationError && (
          <div
            ref={errorSummaryRef}
            className="lyra-hint lyra-hint--error"
            role="alert"
            aria-label="Workspace creation error"
            tabIndex={-1}
          >
            {displayedOperationError}
          </div>
        )}
        <Input
          ref={nameInputRef}
          label="Workspace name"
          placeholder="Acme Inc"
          value={name}
          readOnly={isPending}
          error={displayedFieldErrors.name}
          onChange={(event) => {
            if (isPending) return;
            const value = event.target.value;
            beginEditing('name');
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
              ref={slugInputRef}
              id={slugInputId}
              className="lyra-wscreate__slug-input"
              placeholder="acme-inc"
              value={slug}
              readOnly={isPending}
              aria-invalid={displayedFieldErrors.slug ? true : undefined}
              aria-describedby={displayedFieldErrors.slug ? slugErrorId : undefined}
              onChange={(event) => {
                if (isPending) return;
                beginEditing('slug');
                setTouched(true);
                setSlug(slugify(event.target.value));
              }}
            />
          </span>
          {displayedFieldErrors.slug ? (
            <span id={slugErrorId} className="lyra-hint lyra-hint--error">
              {displayedFieldErrors.slug}
            </span>
          ) : (
            <span className="lyra-hint">Lowercase letters, numbers, and hyphens.</span>
          )}
        </div>
      </form>
    </Dialog>
  );
}
