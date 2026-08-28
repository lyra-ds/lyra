export type LyraFileUploadProgress =
  { kind: 'indeterminate' } | { kind: 'determinate'; value: number };

export type LyraFileUploadError =
  | {
      kind: 'validation';
      code: 'accept' | 'max-size';
      message: string;
      retryable: false;
    }
  | {
      kind: 'transport';
      code?: string;
      message: string;
      retryable: boolean;
    };

export type LyraFileUploadItem =
  | { id: string; name: string; size: number; type: string; status: 'selected' }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'uploading' | 'canceling';
      attemptId: string;
      progress: LyraFileUploadProgress;
    }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'success' | 'canceled';
      attemptId: string;
    }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'error';
      error: Extract<LyraFileUploadError, { kind: 'validation' }>;
    }
  | {
      id: string;
      name: string;
      size: number;
      type: string;
      status: 'error';
      attemptId: string;
      error: Extract<LyraFileUploadError, { kind: 'transport' }>;
    };

export type LyraFileUploadSelection =
  | {
      id: string;
      file: File;
      name: string;
      size: number;
      type: string;
      proposedItem: Extract<LyraFileUploadItem, { status: 'selected' }>;
      proposedAttemptId: string;
    }
  | {
      id: string;
      file: File;
      name: string;
      size: number;
      type: string;
      proposedItem: Extract<LyraFileUploadItem, { status: 'error'; error: { kind: 'validation' } }>;
      proposedAttemptId?: never;
    };

export interface LyraFileUploadMessages {
  selectionUnavailable?: string;
  validationAccept?: string;
  validationMaxSize?: string;
  selected?: string;
  progress?: string;
  progressIndeterminate?: string;
  canceling?: string;
  success?: string;
  error?: string;
  canceled?: string;
  removed?: string;
  retry?: string;
  cancel?: string;
  remove?: string;
}

export interface LyraFileUploadOptions {
  items?: LyraFileUploadItem[];
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  messages?: LyraFileUploadMessages;
}

export interface LyraFileUploadSelectDetail {
  selections: LyraFileUploadSelection[];
}

export interface LyraFileUploadRetryDetail {
  id: string;
  previousAttemptId: string;
  proposedAttemptId: string;
}

export interface LyraFileUploadCancelDetail {
  id: string;
  attemptId: string;
}

export interface LyraFileUploadRemoveDetail {
  id: string;
}

export type LyraFileUploadBinding = Record<string, unknown>;
export type LyraFileUploadAction = 'retry' | 'cancel' | 'remove';

export interface LyraFileUploadData {
  items: LyraFileUploadItem[];
  dragging: boolean;
  pendingIntentKeys: string[];
  setItems(items: LyraFileUploadItem[]): void;
  select(fileList: FileList | null): void;
  retry(item: Extract<LyraFileUploadItem, { status: 'error' | 'canceled' }>): void;
  cancel(item: Extract<LyraFileUploadItem, { status: 'uploading' }>): void;
  remove(
    item: Extract<LyraFileUploadItem, { status: 'selected' | 'success' | 'error' | 'canceled' }>,
  ): void;
  zone: LyraFileUploadBinding;
  input: LyraFileUploadBinding;
  liveRegion: LyraFileUploadBinding;
  itemBindings(item: LyraFileUploadItem): LyraFileUploadBinding;
  progressBindings(
    item: Extract<LyraFileUploadItem, { status: 'uploading' | 'canceling' }>,
  ): LyraFileUploadBinding;
  actionBindings(action: LyraFileUploadAction, item: LyraFileUploadItem): LyraFileUploadBinding;
}

interface LyraFileUploadState extends LyraFileUploadData {
  init(): void;
  destroy(): void;
}

interface LyraFileUploadMagics {
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: LyraFileUploadItem[]) => void): void;
}

type InternalState = LyraFileUploadState & LyraFileUploadMagics;

interface AttemptRecord {
  attemptIds: string[];
  latestItem: LyraFileUploadItem | null;
}

type AcceptedFileProposal = Extract<LyraFileUploadSelection, { proposedAttemptId: string }>;

interface PendingFileProposal {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  proposedAttemptId: string;
}

const DEFAULT_MESSAGES: Required<LyraFileUploadMessages> = {
  selectionUnavailable: 'File replacement is unavailable while an upload is active.',
  validationAccept: '{name} must match {accept}.',
  validationMaxSize: '{name} must not exceed {maxSizeMB} MB.',
  selected: '{name} selected.',
  progress: '{name} is {percent}% uploaded.',
  progressIndeterminate: '{name} is uploading.',
  canceling: 'Canceling {name}.',
  success: '{name} uploaded.',
  error: '{name}: Upload failed.',
  canceled: '{name} canceled.',
  removed: '{name} removed.',
  retry: 'Retry {name}',
  cancel: 'Cancel {name}',
  remove: 'Remove {name}',
};

const MESSAGE_TOKENS = new Set(['name', 'percent', 'accept', 'maxSizeMB']);

function interpolate(template: string, values: Partial<Record<string, string | number>>): string {
  return template.replace(/\{([^{}]+)\}/g, (placeholder, token: string) => {
    const value = values[token];
    if (value !== undefined) return String(value);
    if (!MESSAGE_TOKENS.has(token)) {
      console.warn(`[Lyra FileUpload] Unknown message token {${token}}.`);
    }
    return placeholder;
  });
}

function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string): boolean {
  let hasSupportedToken = false;

  for (const token of accept.split(',').map((value) => value.trim())) {
    if (/^\.[^\s,/]+$/.test(token)) {
      hasSupportedToken = true;
      if (file.name.toLowerCase().endsWith(token.toLowerCase())) return true;
      continue;
    }

    if (token === 'audio/*' || token === 'video/*' || token === 'image/*') {
      hasSupportedToken = true;
      if (file.type.startsWith(token.slice(0, -1))) return true;
      continue;
    }

    if (/^[!#$%&'+.^_`|~0-9A-Za-z-]+\/[!#$%&'+.^_`|~0-9A-Za-z-]+$/.test(token)) {
      hasSupportedToken = true;
      if (file.type === token) return true;
    }
  }

  return !hasSupportedToken;
}

function itemAttemptId(item: LyraFileUploadItem): string | null {
  return 'attemptId' in item ? item.attemptId : null;
}

function identityKey(...parts: Array<string | number | null>): string {
  return JSON.stringify(parts);
}

function intentKey(item: LyraFileUploadItem): string {
  return identityKey(item.id, item.status, itemAttemptId(item));
}

function isActive(item: LyraFileUploadItem): boolean {
  return item.status === 'uploading' || item.status === 'canceling';
}

function isValidationItem(item: LyraFileUploadItem): boolean {
  return item.status === 'error' && item.error.kind === 'validation';
}

function matchesFileProposal(item: LyraFileUploadItem, proposal: PendingFileProposal): boolean {
  if (
    isValidationItem(item) ||
    item.id !== proposal.id ||
    item.name !== proposal.name ||
    item.size !== proposal.size ||
    item.type !== proposal.type
  ) {
    return false;
  }
  const attemptId = itemAttemptId(item);
  return attemptId === null || attemptId === proposal.proposedAttemptId;
}

function canRetry(item: LyraFileUploadItem): boolean {
  return item.status === 'canceled' || (item.status === 'error' && item.error.retryable);
}

function canRemove(item: LyraFileUploadItem): boolean {
  return !isActive(item);
}

function progressMilestone(previous: number, next: number): 25 | 50 | 75 | 100 | null {
  return ([100, 75, 50, 25] as const).find((value) => previous < value && next >= value) ?? null;
}

function replaceInputFiles(
  input: HTMLInputElement,
  files: LyraFileUploadSelection['file'][],
): void {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}

function itemsFingerprint(items: LyraFileUploadItem[]): string {
  return JSON.stringify(items);
}

export function lyraFileUpload({
  items: initialItems = [],
  name,
  accept,
  maxSizeMB,
  multiple = true,
  disabled = false,
  required = false,
  messages,
}: LyraFileUploadOptions = {}): LyraFileUploadData {
  const resolvedMessages = { ...DEFAULT_MESSAGES, ...messages };
  let currentItems = initialItems;
  let root: HTMLElement | null = null;
  let inputElement: HTMLInputElement | null = null;
  let liveElement: HTMLElement | null = null;
  let counter = 0;
  let nativeSyncRequested = false;
  let preservedNativeInput = false;
  let lastFocusedAction: string | null = null;
  const pendingKeys = new Set<string>();
  const usedItemIds = new Set<string>();
  const usedAttemptIds = new Set<string>();
  const proposedFiles = new Map<string, PendingFileProposal>();
  const committedFiles = new Map<string, File>();
  const attemptHistory = new Map<string, AttemptRecord>();
  let announcedKeys = new Set<string>();
  const previousProgress = new Map<string, number>();

  const message = (
    key: keyof LyraFileUploadMessages,
    values: Partial<Record<'name' | 'percent' | 'accept' | 'maxSizeMB', string | number>> = {},
  ): string => interpolate(resolvedMessages[key], values);

  const announce = (text: string): void => {
    liveElement?.replaceChildren(document.createTextNode(text));
  };

  const trackFocus = (event: FocusEvent): void => {
    const target = event.target;
    if (
      !(target instanceof HTMLButtonElement) ||
      root?.contains(target) !== true ||
      target.closest('.lyra-upload__item') === null
    ) {
      lastFocusedAction = null;
    }
  };

  const selectionBlocked = (): boolean => !multiple && currentItems.some(isActive);

  const rememberIdentities = (items: LyraFileUploadItem[]): void => {
    for (const item of items) {
      usedItemIds.add(item.id);
      const attemptId = itemAttemptId(item);
      if (attemptId !== null) usedAttemptIds.add(attemptId);
    }
  };

  const reserveCounter = (rootId: string, reserveItemId: boolean): number => {
    let itemId: string;
    let attemptId: string;
    do {
      counter += 1;
      itemId = `${rootId}-${counter}`;
      attemptId = `${rootId}-attempt-${counter}`;
    } while (usedAttemptIds.has(attemptId) || (reserveItemId && usedItemIds.has(itemId)));
    if (reserveItemId) usedItemIds.add(itemId);
    usedAttemptIds.add(attemptId);
    return counter;
  };

  const reconcileAttempts = (items: LyraFileUploadItem[]): LyraFileUploadItem[] => {
    const visible: LyraFileUploadItem[] = [];
    const itemIds = new Set(items.map((item) => item.id));

    for (const [id, record] of attemptHistory) {
      if (!itemIds.has(id) && record.latestItem !== null) record.latestItem = null;
    }

    for (const item of items) {
      const attemptId = itemAttemptId(item);
      if (attemptId === null) {
        visible.push(item);
        continue;
      }

      const record = attemptHistory.get(item.id);
      const knownAttempts = record?.attemptIds ?? [];
      const latestAttempt = knownAttempts.at(-1);
      if (record?.latestItem === null && knownAttempts.includes(attemptId)) continue;
      if (latestAttempt === attemptId) {
        visible.push(item);
        if (record) record.latestItem = item;
        continue;
      }
      if (knownAttempts.includes(attemptId)) {
        if (record?.latestItem) visible.push(record.latestItem);
        continue;
      }

      attemptHistory.set(item.id, {
        attemptIds: [...knownAttempts, attemptId],
        latestItem: item,
      });
      visible.push(item);
    }

    return visible;
  };

  const syncNativeInput = (controlledItems: LyraFileUploadItem[]): void => {
    if (!nativeSyncRequested || name === undefined || inputElement === null) return;

    const controlled = new Map(controlledItems.map((item) => [item.id, item]));
    for (const [id, proposal] of proposedFiles) {
      const item = controlled.get(id);
      if (item === undefined) continue;
      if (isValidationItem(item)) {
        proposedFiles.delete(id);
        continue;
      }
      if (!matchesFileProposal(item, proposal)) continue;
      committedFiles.set(id, proposal.file);
      proposedFiles.delete(id);
    }
    for (const id of committedFiles.keys()) {
      const item = controlled.get(id);
      if (item === undefined || isValidationItem(item)) committedFiles.delete(id);
    }

    const files = controlledItems.flatMap((item) => {
      const file = committedFiles.get(item.id);
      return file === undefined || isValidationItem(item) ? [] : [file];
    });
    replaceInputFiles(inputElement, files);
    if (files.length === 0) inputElement.removeAttribute('name');
    else inputElement.name = name;
  };

  const recordAnnouncements = (
    previousItems: LyraFileUploadItem[],
    nextItems: LyraFileUploadItem[],
    controlledItems: LyraFileUploadItem[],
    suppress: boolean,
  ): void => {
    const controlledIds = new Set(controlledItems.map((item) => item.id));
    const retainedProgressKeys = new Set<string>();
    const candidates: Array<{ key: string; text: string }> = [];

    for (const item of nextItems) {
      const attemptId = itemAttemptId(item);
      const stateKey = identityKey(item.id, attemptId, item.status);
      if (attemptId !== null) retainedProgressKeys.add(identityKey(item.id, attemptId));

      if (item.status === 'uploading' && item.progress.kind === 'determinate') {
        const progressKey = identityKey(item.id, attemptId);
        const previousValue = previousProgress.get(progressKey) ?? 0;
        const milestone = progressMilestone(previousValue, item.progress.value);
        previousProgress.set(progressKey, Math.max(previousValue, item.progress.value));
        if (milestone !== null) {
          const milestoneKey = identityKey(item.id, attemptId, item.status, milestone);
          if (!announcedKeys.has(milestoneKey)) {
            candidates.push({
              key: milestoneKey,
              text: message('progress', { name: item.name, percent: milestone }),
            });
          }
        }
        continue;
      }

      if (announcedKeys.has(stateKey)) continue;
      const text =
        item.status === 'selected'
          ? message('selected', { name: item.name })
          : item.status === 'canceling'
            ? message('canceling', { name: item.name })
            : item.status === 'success'
              ? message('success', { name: item.name })
              : item.status === 'error'
                ? message('error', { name: item.name })
                : item.status === 'canceled'
                  ? message('canceled', { name: item.name })
                  : null;
      if (text !== null) candidates.push({ key: stateKey, text });
    }

    for (const key of previousProgress.keys()) {
      if (!retainedProgressKeys.has(key)) previousProgress.delete(key);
    }

    for (const item of previousItems) {
      if (controlledIds.has(item.id)) continue;
      const removalKey = identityKey(item.id, itemAttemptId(item), 'removed');
      if (!announcedKeys.has(removalKey)) {
        candidates.push({
          key: removalKey,
          text: message('removed', { name: item.name }),
        });
      }
    }

    for (const candidate of candidates) announcedKeys.add(candidate.key);
    if (!suppress && candidates.length > 0) {
      announce(candidates.map((candidate) => candidate.text).join(' '));
    }

    const pruned = new Set<string>();
    for (const item of nextItems) {
      if (item.status === 'uploading') continue;
      const key = identityKey(item.id, itemAttemptId(item), item.status);
      if (announcedKeys.has(key)) pruned.add(key);
    }
    announcedKeys = pruned;
  };

  const focusAfterRemoval = (
    context: InternalState,
    previousItems: LyraFileUploadItem[],
    nextItems: LyraFileUploadItem[],
  ): void => {
    const focusedId = lastFocusedAction;
    if (focusedId === null || nextItems.some((item) => item.id === focusedId)) return;
    const removedIndex = previousItems.findIndex((item) => item.id === focusedId);
    if (removedIndex < 0) return;

    const nextIds = new Set(nextItems.map((item) => item.id));
    const candidates = [
      ...previousItems.slice(removedIndex + 1).map((item) => item.id),
      ...previousItems
        .slice(0, removedIndex)
        .map((item) => item.id)
        .reverse(),
    ];
    lastFocusedAction = null;
    context.$nextTick(() => {
      let target: HTMLButtonElement | null = null;
      for (const id of candidates) {
        if (!nextIds.has(id)) continue;
        const row = Array.from(
          root?.querySelectorAll<HTMLElement>('.lyra-upload__item') ?? [],
        ).find((element) => element.dataset.uploadId === id);
        target = row?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? null;
        if (target !== null) break;
      }
      (target ?? inputElement)?.focus();
    });
  };

  const replaceItems = (
    context: InternalState,
    controlledItems: LyraFileUploadItem[],
    suppressAnnouncements = false,
  ): void => {
    rememberIdentities(controlledItems);
    const previousItems = currentItems;
    const visibleItems = reconcileAttempts(controlledItems);
    currentItems = visibleItems;
    const visibleFingerprint = itemsFingerprint(visibleItems);
    if (itemsFingerprint(context.items) !== visibleFingerprint) {
      context.items = visibleItems;
    }
    const visibleKeys = new Set(visibleItems.map(intentKey));
    for (const key of pendingKeys) {
      if (!visibleKeys.has(key)) pendingKeys.delete(key);
    }
    context.pendingIntentKeys = [...pendingKeys];

    root?.setAttribute('data-state', visibleItems.length === 0 ? 'idle' : 'active');
    if (disabled) root?.setAttribute('data-disabled', 'true');
    else root?.removeAttribute('data-disabled');
    syncNativeInput(controlledItems);
    recordAnnouncements(previousItems, visibleItems, controlledItems, suppressAnnouncements);
    focusAfterRemoval(context, previousItems, visibleItems);
  };

  const currentItem = (item: LyraFileUploadItem): LyraFileUploadItem | null => {
    const current = currentItems.find((candidate) => candidate.id === item.id);
    return current !== undefined && intentKey(current) === intentKey(item) ? current : null;
  };

  const lock = (context: InternalState, item: LyraFileUploadItem): boolean => {
    const key = intentKey(item);
    if (pendingKeys.has(key)) return false;
    pendingKeys.add(key);
    context.pendingIntentKeys = [...pendingKeys];
    return true;
  };

  const dispatchIntent = (eventName: string, detail: unknown): boolean =>
    root?.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true, composed: true })) ??
    false;

  const dispatchAction = (
    context: InternalState,
    action: LyraFileUploadAction,
    item: LyraFileUploadItem,
  ): void => {
    const visible = currentItem(item);
    if (disabled || visible === null) return;
    if (action === 'retry') {
      const previousAttemptId = itemAttemptId(visible);
      if (
        !canRetry(visible) ||
        previousAttemptId === null ||
        root === null ||
        root.id === '' ||
        !lock(context, visible)
      ) {
        return;
      }
      const sequence = reserveCounter(root.id, false);
      dispatchIntent('lyra:file-upload:retry', {
        id: visible.id,
        previousAttemptId,
        proposedAttemptId: `${root.id}-attempt-${sequence}`,
      } satisfies LyraFileUploadRetryDetail);
      return;
    }
    if (action === 'cancel') {
      if (visible.status !== 'uploading' || !lock(context, visible)) return;
      dispatchIntent('lyra:file-upload:cancel', {
        id: visible.id,
        attemptId: visible.attemptId,
      } satisfies LyraFileUploadCancelDetail);
      return;
    }
    if (!canRemove(visible) || !lock(context, visible)) return;
    dispatchIntent('lyra:file-upload:remove', {
      id: visible.id,
    } satisfies LyraFileUploadRemoveDetail);
  };

  const state: LyraFileUploadState & ThisType<InternalState> = {
    items: initialItems,
    dragging: false,
    pendingIntentKeys: [],

    init() {
      root = this.$el;
      inputElement = root.querySelector<HTMLInputElement>('input[type="file"]');
      liveElement = root.querySelector<HTMLElement>('.lyra-upload__live');
      preservedNativeInput = (inputElement?.files?.length ?? 0) > 0;
      for (const element of root.querySelectorAll<HTMLElement>(
        '[data-upload-id],[data-attempt-id]',
      )) {
        const { uploadId, attemptId } = element.dataset;
        if (uploadId) usedItemIds.add(uploadId);
        if (attemptId) usedAttemptIds.add(attemptId);
      }
      if (root.id === '') {
        console.error('[Lyra FileUpload] The server-authored root requires a unique id.');
      }
      document.addEventListener('focusin', trackFocus);
      replaceItems(this, currentItems, true);
      this.$watch('items', (items) => replaceItems(this, items));
    },

    destroy() {
      document.removeEventListener('focusin', trackFocus);
      liveElement?.replaceChildren();
      this.dragging = false;
      this.pendingIntentKeys = [];
      pendingKeys.clear();
      usedItemIds.clear();
      usedAttemptIds.clear();
      proposedFiles.clear();
      committedFiles.clear();
      attemptHistory.clear();
      announcedKeys.clear();
      previousProgress.clear();
      lastFocusedAction = null;
      preservedNativeInput = false;
      inputElement = null;
      liveElement = null;
      root = null;
    },

    setItems(items) {
      replaceItems(this, items);
    },

    select(fileList) {
      if (disabled) return;
      if (selectionBlocked()) {
        announce(message('selectionUnavailable'));
        if (inputElement !== null) inputElement.value = '';
        return;
      }
      if (root === null || root.id === '') return;
      const rootId = root.id;

      const files = Array.from(fileList ?? []);
      const proposedFilesForOperation = multiple ? files : files.slice(0, 1);
      const selections = proposedFilesForOperation.map((file): LyraFileUploadSelection => {
        const validationError: Extract<LyraFileUploadError, { kind: 'validation' }> | null =
          accept && !matchesAccept(file, accept)
            ? {
                kind: 'validation',
                code: 'accept',
                message: message('validationAccept', { name: file.name, accept }),
                retryable: false,
              }
            : maxSizeMB !== undefined && file.size > maxSizeMB * 1_000_000
              ? {
                  kind: 'validation',
                  code: 'max-size',
                  message: message('validationMaxSize', { name: file.name, maxSizeMB }),
                  retryable: false,
                }
              : null;
        const sequence = reserveCounter(rootId, true);
        const id = `${rootId}-${sequence}`;
        const proposedAttemptId = `${rootId}-attempt-${sequence}`;

        if (validationError !== null) {
          return {
            id,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            proposedItem: {
              id,
              name: file.name,
              size: file.size,
              type: file.type,
              status: 'error',
              error: validationError,
            },
          };
        }

        const proposal: AcceptedFileProposal = {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          proposedItem: {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'selected',
          },
          proposedAttemptId,
        };
        if (name !== undefined) {
          proposedFiles.set(id, {
            id,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            proposedAttemptId,
          });
        }
        return proposal;
      });

      if (name !== undefined) {
        nativeSyncRequested = true;
        preservedNativeInput = false;
        syncNativeInput(currentItems);
      }
      if (selections.length > 0) {
        dispatchIntent('lyra:file-upload:select', {
          selections,
        } satisfies LyraFileUploadSelectDetail);
      }
      if (name === undefined && inputElement !== null) inputElement.value = '';
    },

    retry(item) {
      dispatchAction(this, 'retry', item);
    },

    cancel(item) {
      dispatchAction(this, 'cancel', item);
    },

    remove(item) {
      dispatchAction(this, 'remove', item);
    },

    itemBindings(item) {
      return {
        [':data-state'](this: InternalState) {
          return this.items.find((candidate) => candidate.id === item.id)?.status ?? item.status;
        },
        [':data-upload-id']() {
          return item.id;
        },
        [':class'](this: InternalState) {
          const visible = this.items.find((candidate) => candidate.id === item.id) ?? item;
          return { 'lyra-upload__item--error': visible.status === 'error' };
        },
      };
    },

    progressBindings(item) {
      const binding: LyraFileUploadBinding = {
        max: 100,
        'aria-label':
          item.progress.kind === 'determinate'
            ? message('progress', { name: item.name, percent: item.progress.value })
            : message('progressIndeterminate', { name: item.name }),
      };
      if (item.progress.kind === 'determinate') binding.value = item.progress.value;
      return binding;
    },

    actionBindings(action, item) {
      return {
        type: 'button',
        'aria-label': message(action, { name: item.name }),
        [':disabled'](this: InternalState) {
          return disabled || this.pendingIntentKeys.includes(intentKey(item));
        },
        ['@focus']() {
          lastFocusedAction = item.id;
        },
        ['@click'](this: InternalState, event: MouseEvent) {
          dispatchAction(this, action, item);
          if (
            pendingKeys.has(intentKey(item)) &&
            event.currentTarget instanceof HTMLButtonElement
          ) {
            event.currentTarget.disabled = true;
          }
        },
      };
    },

    zone: {
      [':class'](this: InternalState) {
        return { 'lyra-upload__zone--drag': this.dragging };
      },
      [':aria-disabled'](this: InternalState) {
        return disabled || (!multiple && this.items.some(isActive)) ? 'true' : null;
      },
      ['@click'](event: MouseEvent) {
        if (disabled || !selectionBlocked()) return;
        event.preventDefault();
        announce(message('selectionUnavailable'));
      },
      ['@dragover.prevent'](this: InternalState) {
        if (!disabled && !selectionBlocked()) this.dragging = true;
      },
      ['@dragleave'](this: InternalState) {
        this.dragging = false;
      },
      ['@drop.prevent'](this: InternalState, event: DragEvent) {
        this.dragging = false;
        if (disabled) return;
        if (selectionBlocked()) {
          announce(message('selectionUnavailable'));
          return;
        }
        this.select(event.dataTransfer?.files ?? null);
      },
    },

    input: {
      type: 'file',
      [':name'](this: InternalState) {
        void this.items;
        return name !== undefined && (preservedNativeInput || committedFiles.size > 0)
          ? name
          : null;
      },
      [':accept']() {
        return accept ?? null;
      },
      [':multiple']() {
        return multiple;
      },
      [':disabled']() {
        return disabled;
      },
      [':required']() {
        return required;
      },
      ['@change'](this: InternalState, event: Event) {
        if (event.target instanceof HTMLInputElement) this.select(event.target.files);
      },
    },

    liveRegion: {
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
  };

  return state;
}
