import { lyraDialog, type LyraDialogOptions } from './dialog';

export interface LyraCreateWorkspaceDialogOptions extends LyraDialogOptions {
  /** Text before the editable slug. Default `lyra.dev/`. */
  slugPrefix?: string;
  /** Validation and error copy. */
  messages?: Partial<LyraCreateWorkspaceMessages>;
}

export interface LyraCreateWorkspaceMessages {
  nameRequired: string;
  slugRequired: string;
  createFailed: string;
}

export interface LyraCreateWorkspaceFieldErrors {
  name?: string;
  slug?: string;
}

export interface LyraCreateWorkspaceDetail {
  operationId: string;
  name: string;
  slug: string;
}

export type LyraCreateWorkspacePhase =
  'editing' | 'submitting' | 'canceling' | 'error' | 'accepted';

type Binding = Record<string, unknown>;

export interface LyraCreateWorkspaceDialogData {
  open: boolean;
  name: string;
  slug: string;
  slugPrefix: string;
  touchedSlug: boolean;
  phase: LyraCreateWorkspacePhase;
  fieldErrors: LyraCreateWorkspaceFieldErrors;
  operationError: string;
  operationId: string | null;
  pending: boolean;
  initials: string;
  submit(event: Event): void;
  requestClose(): void;
  accept(operationId: string): void;
  reject(
    operationId: string,
    result?: { fieldErrors?: LyraCreateWorkspaceFieldErrors; message?: string },
  ): void;
  cancel(operationId: string): void;
  overlay: Binding;
  panel: Binding;
  title: Binding;
  close: Binding;
  form: Binding;
  nameInput: Binding;
  slugInput: Binding;
  errorSummary: Binding;
  createButton: Binding;
  cancelButton: Binding;
  slugPrefixBinding: Binding;
  avatar: Binding;
}

interface Magics {
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type State = LyraCreateWorkspaceDialogData & Magics & ReturnType<typeof lyraDialog>;

const defaults: LyraCreateWorkspaceMessages = {
  nameRequired: 'Enter a workspace name.',
  slugRequired: 'Enter a workspace URL.',
  createFailed: 'We could not create the workspace. Please try again.',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

let nextInstance = 0;

/** Controlled workspace creation composed over lyraDialog. The consumer owns persistence. */
export function lyraCreateWorkspaceDialog(
  options: LyraCreateWorkspaceDialogOptions = {},
): LyraCreateWorkspaceDialogData {
  const dialog = lyraDialog(options);
  const messages = { ...defaults, ...options.messages };
  let sequence = 0;
  let instance = 0;
  let closeRequested = false;
  let wasOpen = options.defaultOpen ?? false;
  const emit = (root: HTMLElement, name: string, detail: object) =>
    root.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  const focus = (state: State, selector: string) =>
    state.$nextTick(() =>
      state.$nextTick(() => {
        if (state.open) state.$el.querySelector<HTMLElement>(selector)?.focus();
      }),
    );
  const reset = (state: State) => {
    state.name = '';
    state.slug = '';
    state.touchedSlug = false;
    state.phase = 'editing';
    state.fieldErrors = {};
    state.operationError = '';
    state.operationId = null;
    closeRequested = false;
  };
  const invalidateOperation = (state: State) => {
    const operationId = state.operationId;
    const cancellationRequested = state.phase === 'canceling';
    state.operationId = null;
    if (operationId !== null && !cancellationRequested)
      emit(state.$el, 'lyra:create-workspace:cancel', { operationId });
  };
  const onName = function (this: State, event: Event) {
    if (this.pending) return;
    this.name = (event.target as HTMLInputElement).value;
    if (!this.touchedSlug) this.slug = slugify(this.name);
    this.fieldErrors = { ...this.fieldErrors, name: undefined };
    this.operationError = '';
    if (this.phase === 'error') this.phase = 'editing';
  };
  const onSlug = function (this: State, event: Event) {
    if (this.pending) return;
    this.touchedSlug = true;
    this.slug = slugify((event.target as HTMLInputElement).value);
    this.fieldErrors = { ...this.fieldErrors, slug: undefined };
    this.operationError = '';
    if (this.phase === 'error') this.phase = 'editing';
  };
  // slugify(target.value) can equal the already-stored slug (a discarded trailing
  // separator, e.g. "acme!" -> "acme"): Alpine then skips reapplying :value, so the
  // field keeps showing the un-normalized text until it settles.
  const onSlugBlur = function (this: State, event: Event) {
    (event.target as HTMLInputElement).value = this.slug;
  };

  const state = {
    ...dialog,
    name: '',
    slug: '',
    slugPrefix: options.slugPrefix ?? 'lyra.dev/',
    touchedSlug: false,
    phase: 'editing' as LyraCreateWorkspacePhase,
    fieldErrors: {} as LyraCreateWorkspaceFieldErrors,
    operationError: '',
    operationId: null as string | null,
    get pending() {
      return this.phase === 'submitting' || this.phase === 'canceling';
    },
    get initials() {
      return (
        this.name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0].toUpperCase())
          .join('') || '?'
      );
    },
    init(this: State) {
      dialog.init.call(this);
      instance = ++nextInstance;
      this.$watch('open', (open) => {
        if (open && !wasOpen) reset(this);
        if (!open && wasOpen) {
          invalidateOperation(this);
          this.phase = 'editing';
          this.fieldErrors = {};
          this.operationError = '';
          closeRequested = false;
        }
        wasOpen = open;
      });
    },
    destroy(this: State) {
      invalidateOperation(this);
      dialog.destroy.call(this);
    },
    focusInitial(this: State) {
      this.$el.querySelector<HTMLElement>('[data-lyra-wscreate-name]')?.focus();
    },
    submit(this: State, event: Event) {
      event.preventDefault();
      if (!this.open || this.pending || this.phase === 'accepted') return;
      const name = this.name.trim();
      const errors = {
        ...(name ? {} : { name: messages.nameRequired }),
        ...(this.slug ? {} : { slug: messages.slugRequired }),
      };
      if (errors.name || errors.slug) {
        this.fieldErrors = errors;
        this.operationError = '';
        this.phase = 'error';
        focus(this, errors.name ? '[data-lyra-wscreate-name]' : '[data-lyra-wscreate-slug]');
        return;
      }
      const form = this.$el.querySelector('form');
      if (!form || !form.contains(document.activeElement)) {
        this.$el.querySelector<HTMLElement>('[data-lyra-wscreate-name]')?.focus();
      }
      this.fieldErrors = {};
      this.operationError = '';
      this.phase = 'submitting';
      this.operationId = `${this.$el.id || 'lyra-wscreate'}-operation-${instance}-${++sequence}`;
      emit(this.$el, 'lyra:create-workspace', {
        operationId: this.operationId,
        name,
        slug: this.slug,
      });
    },
    requestClose(this: State) {
      if (!this.open) return;
      if (this.operationId !== null) {
        if (this.phase === 'canceling') return;
        closeRequested = true;
        this.phase = 'canceling';
        emit(this.$el, 'lyra:create-workspace:cancel', { operationId: this.operationId });
        return;
      }
      this.open = false;
    },
    accept(this: State, operationId: string) {
      if (this.operationId !== operationId || !this.open) return;
      this.operationId = null;
      this.phase = 'accepted';
      this.fieldErrors = {};
      this.operationError = '';
      this.open = false;
    },
    reject(
      this: State,
      operationId: string,
      result: { fieldErrors?: LyraCreateWorkspaceFieldErrors; message?: string } = {},
    ) {
      if (this.operationId !== operationId || !this.open) return;
      this.operationId = null;
      closeRequested = false;
      this.phase = 'error';
      this.fieldErrors = result.fieldErrors ?? {};
      this.operationError = result.message?.trim() || messages.createFailed;
      focus(this, '[data-lyra-wscreate-error]');
    },
    cancel(this: State, operationId: string) {
      if (this.operationId !== operationId || !this.open) return;
      this.operationId = null;
      this.phase = 'editing';
      this.fieldErrors = {};
      this.operationError = '';
      if (closeRequested) this.open = false;
      closeRequested = false;
    },
    overlay: {
      ...dialog.overlay,
      ['@click'](this: State, event: MouseEvent) {
        if (this.closeOnOverlayClick && this.downOnOverlay && event.target === event.currentTarget)
          this.requestClose();
      },
    },
    panel: {
      ...dialog.panel,
      ['@keydown'](this: State, event: KeyboardEvent) {
        if (event.key === 'Escape' && this.closeOnEsc) {
          event.preventDefault();
          this.requestClose();
        }
      },
    },
    close: {
      ...dialog.close,
      ['@click'](this: State) {
        this.requestClose();
      },
    },
    form: {
      ['@submit'](this: State, event: Event) {
        this.submit(event);
      },
      [':data-state'](this: State) {
        return this.phase;
      },
      [':aria-busy'](this: State) {
        return this.pending ? 'true' : null;
      },
    },
    nameInput: {
      ['@input']: onName,
      [':value'](this: State) {
        return this.name;
      },
      [':readonly'](this: State) {
        return this.pending;
      },
      [':aria-invalid'](this: State) {
        return this.fieldErrors.name ? 'true' : null;
      },
    },
    slugInput: {
      ['@input']: onSlug,
      ['@blur']: onSlugBlur,
      [':value'](this: State) {
        return this.slug;
      },
      [':readonly'](this: State) {
        return this.pending;
      },
      [':aria-invalid'](this: State) {
        return this.fieldErrors.slug ? 'true' : null;
      },
    },
    errorSummary: {
      role: 'alert',
      tabindex: '-1',
      ['x-text'](this: State) {
        return this.operationError;
      },
      [':style'](this: State) {
        return { display: this.operationError ? null : 'none' };
      },
    },
    createButton: {
      type: 'submit',
      [':disabled'](this: State) {
        return this.pending || this.phase === 'accepted';
      },
      [':aria-busy'](this: State) {
        return this.pending ? 'true' : null;
      },
      [':class'](this: State) {
        return { 'lyra-btn--loading': this.pending };
      },
    },
    cancelButton: {
      type: 'button',
      ['@click'](this: State) {
        this.requestClose();
      },
    },
    slugPrefixBinding: {
      ['x-text'](this: State) {
        return this.slugPrefix;
      },
    },
    avatar: {
      ['x-text'](this: State) {
        return this.initials;
      },
    },
  } as LyraCreateWorkspaceDialogData & ReturnType<typeof lyraDialog> & ThisType<State>;
  return state;
}
