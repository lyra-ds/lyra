import type {
  LyraFileUploadCancelDetail,
  LyraFileUploadItem,
  LyraFileUploadRemoveDetail,
  LyraFileUploadRetryDetail,
  LyraFileUploadSelectDetail,
} from '@lyra-ds/alpine';
import type { Locale } from './contracts';

type UploadStatus = LyraFileUploadItem['status'];

const STATUS_LABELS = {
  en: {
    selected: 'Selected',
    uploading: 'Uploading',
    canceling: 'Canceling',
    success: 'Uploaded',
    error: 'Upload failed',
    canceled: 'Canceled',
  },
  'pt-BR': {
    selected: 'Selecionado',
    uploading: 'Enviando',
    canceling: 'Cancelando',
    success: 'Enviado',
    error: 'Falha no envio',
    canceled: 'Cancelado',
  },
} as const satisfies Record<Locale, Record<UploadStatus, string>>;

export interface UploadItemsControllerOptions {
  locale: Locale;
}

export interface UploadItemsController {
  uploadItems: LyraFileUploadItem[];
  initializations: number;
  selectionIntents: number;
  controlledEchoes: number;
  connects: number;
  disconnects: number;
  init(): void;
  destroy(): void;
  controlledIdentities(): string;
  statusLabel(item: LyraFileUploadItem): string;
  selectFiles(detail: LyraFileUploadSelectDetail): void;
  retryFile(detail: LyraFileUploadRetryDetail): void;
  cancelFile(detail: LyraFileUploadCancelDetail): void;
  removeFile(detail: LyraFileUploadRemoveDetail): void;
}

interface FixtureDiagnostics {
  initializations: number;
  selectionIntents: number;
  controlledEchoes: number;
  connects: number;
  disconnects: number;
}

const fixtureDiagnostics = new WeakMap<HTMLElement, FixtureDiagnostics>();

function diagnosticsFor(root: HTMLElement): FixtureDiagnostics {
  const existing = fixtureDiagnostics.get(root);
  if (existing !== undefined) return existing;
  const diagnostics = {
    initializations: 0,
    selectionIntents: 0,
    controlledEchoes: 0,
    connects: 0,
    disconnects: 0,
  };
  fixtureDiagnostics.set(root, diagnostics);
  return diagnostics;
}

function uploadingItem(item: LyraFileUploadItem, attemptId: string): LyraFileUploadItem {
  return {
    id: item.id,
    name: item.name,
    size: item.size,
    type: item.type,
    status: 'uploading',
    attemptId,
    progress: { kind: 'indeterminate' },
  };
}

export function uploadItemsController({
  locale,
}: UploadItemsControllerOptions): UploadItemsController {
  const statusLabels = STATUS_LABELS[locale];

  return {
    uploadItems: [],
    initializations: 0,
    selectionIntents: 0,
    controlledEchoes: 0,
    connects: 0,
    disconnects: 0,

    init(this: UploadItemsController): void {
      const root = (this as UploadItemsController & { readonly $root: HTMLElement }).$root;
      const diagnostics = diagnosticsFor(root);
      diagnostics.initializations += 1;
      diagnostics.connects += 1;
      this.initializations = diagnostics.initializations;
      this.selectionIntents = diagnostics.selectionIntents;
      this.controlledEchoes = diagnostics.controlledEchoes;
      this.connects = diagnostics.connects;
      this.disconnects = diagnostics.disconnects;
    },

    destroy(this: UploadItemsController): void {
      const root = (this as UploadItemsController & { readonly $root: HTMLElement }).$root;
      const diagnostics = diagnosticsFor(root);
      diagnostics.disconnects += 1;
      this.disconnects = diagnostics.disconnects;
      const output = root.querySelector<HTMLElement>('#alpine-disconnects');
      if (output !== null) output.textContent = String(diagnostics.disconnects);
    },

    controlledIdentities(this: UploadItemsController): string {
      return this.uploadItems
        .map((item) => ('attemptId' in item ? `${item.id}/${item.attemptId}` : item.id))
        .join(', ');
    },

    statusLabel(item: LyraFileUploadItem): string {
      return statusLabels[item.status];
    },

    selectFiles(this: UploadItemsController, detail: LyraFileUploadSelectDetail): void {
      const root = (this as UploadItemsController & { readonly $root: HTMLElement }).$root;
      const diagnostics = diagnosticsFor(root);
      diagnostics.selectionIntents += 1;
      this.selectionIntents = diagnostics.selectionIntents;
      this.uploadItems = [
        ...this.uploadItems,
        ...detail.selections.map(({ proposedItem }) => proposedItem),
      ];
      diagnostics.controlledEchoes += 1;
      this.controlledEchoes = diagnostics.controlledEchoes;
    },

    retryFile(this: UploadItemsController, detail: LyraFileUploadRetryDetail): void {
      this.uploadItems = this.uploadItems.map((item) => {
        if (
          item.id !== detail.id ||
          !('attemptId' in item) ||
          item.attemptId !== detail.previousAttemptId ||
          (item.status !== 'error' && item.status !== 'canceled')
        ) {
          return item;
        }
        return uploadingItem(item, detail.proposedAttemptId);
      });
    },

    cancelFile(this: UploadItemsController, detail: LyraFileUploadCancelDetail): void {
      this.uploadItems = this.uploadItems.map((item) =>
        item.id === detail.id && item.status === 'uploading' && item.attemptId === detail.attemptId
          ? {
              id: item.id,
              name: item.name,
              size: item.size,
              type: item.type,
              status: 'canceled',
              attemptId: item.attemptId,
            }
          : item,
      );
    },

    removeFile(this: UploadItemsController, detail: LyraFileUploadRemoveDetail): void {
      this.uploadItems = this.uploadItems.filter((item) => item.id !== detail.id);
    },
  };
}
