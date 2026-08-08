/** An item rendered by a consumer's upload-list `x-for` template. */
export interface LyraFileUploadItem {
  /** Stable item identifier. */
  id: string;
  /** File name shown to the user. */
  name: string;
  /** File size in bytes, when known. */
  size?: number;
  /** Upload progress from 0 through 100. */
  progress: number;
  /** Current simulated upload state. */
  status: 'uploading' | 'done' | 'error';
  /** Validation error shown when `status` is `"error"`. */
  error?: string;
}

/** Initial configuration accepted by `x-data="lyraFileUpload(...)"`. */
export interface LyraFileUploadOptions {
  /** Files larger than this many megabytes are added as error items. */
  maxSizeMB?: number;
  /** Whether more than one file can be added. Defaults to `true`. */
  multiple?: boolean;
  /** Simulated upload duration in milliseconds. Defaults to `1800`. */
  uploadDuration?: number;
  /** Items used to seed the upload list. */
  defaultItems?: LyraFileUploadItem[];
}

type Binding = Record<string, unknown>;
type UploadTimer = ReturnType<typeof setInterval>;

interface LyraFileUploadData {
  items: LyraFileUploadItem[];
  dragging: boolean;
  root: HTMLElement | null;
  timers: Record<string, UploadTimer>;
  nextId: number;
  init(): void;
  destroy(): void;
  updateItems(updater: (items: LyraFileUploadItem[]) => LyraFileUploadItem[]): void;
  addFiles(fileList: FileList | null): void;
  remove(id: string): void;
  formatBytes(bytes: number | undefined): string;
  iconFor(
    name: string,
  ): 'image' | 'file-text' | 'file-spreadsheet' | 'file-archive' | 'film' | 'file';
  zone: Binding;
  input: Binding;
}

interface LyraFileUploadMagics {
  $dispatch(name: string, detail?: unknown): void;
  $el: HTMLElement;
}

type LyraFileUploadState = LyraFileUploadData & LyraFileUploadMagics;

/**
 * A controllable drag-and-drop upload state machine over consumer-rendered markup.
 *
 * The dropzone and hidden input are served markup using `x-bind="zone"` and
 * `x-bind="input"`. Upload rows are runtime data, so render them from a served
 * template: `<template x-for="item in items" :key="item.id"><button type="button"
 * x-on:click="remove(item.id)" x-text="item.name"></button><span
 * x-bind:style="`width: ${item.progress}%`"></span></template>`.
 */
export function lyraFileUpload({
  maxSizeMB,
  multiple = true,
  uploadDuration = 1800,
  defaultItems = [],
}: LyraFileUploadOptions = {}): LyraFileUploadData {
  const state: LyraFileUploadData & ThisType<LyraFileUploadState> = {
    items: defaultItems,
    dragging: false,
    root: null,
    timers: {},
    nextId: 0,

    init() {
      // In x-bind object handlers Alpine's $el is the bound element, not this root.
      // Capture it once so the zone can target its own served file input.
      this.root = this.$el;
    },

    destroy() {
      Object.values(this.timers).forEach(clearInterval);
      this.timers = {};
    },

    updateItems(updater) {
      this.items = updater(this.items);
      this.$dispatch('lyra:change', { items: this.items });
    },

    addFiles(fileList) {
      const files = Array.from(fileList ?? []);
      if (files.length === 0) return;

      this.$dispatch('lyra:files', { files });
      const stamped = files.map((file) => {
        const tooLarge = maxSizeMB !== undefined && file.size > maxSizeMB * 1024 * 1024;
        this.nextId += 1;
        return {
          id: `lyra-upload-${this.nextId}-${file.name}`,
          name: file.name,
          size: file.size,
          progress: tooLarge ? 0 : 5,
          status: tooLarge ? 'error' : 'uploading',
          error: tooLarge ? `Over ${maxSizeMB} MB` : undefined,
        } satisfies LyraFileUploadItem;
      });
      const accepted = multiple ? stamped : stamped.slice(0, 1);
      this.updateItems((items) => (multiple ? [...items, ...accepted] : accepted));

      accepted
        .filter((item) => item.status === 'uploading')
        .forEach((item) => {
          const step = 100 / Math.max(uploadDuration / 120, 1);
          this.timers[item.id] = setInterval(() => {
            this.updateItems((items) =>
              items.map((current) => {
                if (current.id !== item.id) return current;
                const progress = Math.min(current.progress + step, 100);
                if (progress === 100) {
                  clearInterval(this.timers[item.id]);
                  delete this.timers[item.id];
                  return { ...current, progress, status: 'done' };
                }
                return { ...current, progress };
              }),
            );
          }, 120);
        });
    },

    remove(id) {
      const timer = this.timers[id];
      if (timer) {
        clearInterval(timer);
        delete this.timers[id];
      }
      this.updateItems((items) => items.filter((item) => item.id !== id));
    },

    formatBytes(bytes) {
      if (bytes === undefined) return '';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },

    iconFor(name) {
      const extension = name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension ?? '')) return 'image';
      if (extension === 'pdf') return 'file-text';
      if (['xls', 'xlsx', 'csv'].includes(extension ?? '')) return 'file-spreadsheet';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension ?? '')) return 'file-archive';
      if (['mp4', 'mov', 'webm'].includes(extension ?? '')) return 'film';
      return 'file';
    },

    zone: {
      type: 'button',
      [':class']() {
        // Object syntax removes a server-rendered drag modifier after a drop.
        return { 'lyra-upload__zone--drag': this.dragging };
      },
      ['@click']() {
        this.root?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
      },
      ['@dragover.prevent']() {
        this.dragging = true;
      },
      ['@dragleave']() {
        this.dragging = false;
      },
      ['@drop.prevent'](event: DragEvent) {
        this.dragging = false;
        this.addFiles(event.dataTransfer?.files ?? null);
      },
    },

    input: {
      ['@change'](event: Event) {
        const input = event.target as HTMLInputElement;
        this.addFiles(input.files);
        input.value = '';
      },
    },
  };

  return state;
}
