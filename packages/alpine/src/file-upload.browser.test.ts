import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function fileList(...files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

function mountFileUpload(options: Record<string, unknown> = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="lyra-upload" x-data='lyraFileUpload(${JSON.stringify(options)})'>
      <button class="lyra-upload__zone lyra-upload__zone--drag" x-bind="zone">
        <span class="lyra-upload__zone-label">Drag files here or click to select</span>
        <input type="file" hidden tabindex="-1" multiple x-bind="input">
      </button>
      <ul class="lyra-upload__list" x-show="items.length > 0">
        <template x-for="item in items" :key="item.id">
          <li class="lyra-upload__item" :class="{ 'lyra-upload__item--error': item.status === 'error' }">
            <span class="lyra-upload__item-name" x-text="item.name"></span>
            <span class="lyra-upload__item-meta" x-text="item.status === 'error' ? item.error : item.status === 'done' ? formatBytes(item.size) : Math.round(item.progress) + '%'"></span>
            <span class="lyra-upload__bar" x-show="item.status === 'uploading'"><span class="lyra-upload__bar-fill" :style="{ width: item.progress + '%' }"></span></span>
            <span class="lyra-upload__check" role="img" aria-label="Upload complete" x-show="item.status === 'done'"></span>
            <button class="lyra-upload__remove" type="button" :aria-label="'Remove ' + item.name" x-on:click="remove(item.id)">Remove</button>
          </li>
        </template>
      </ul>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-upload');
  if (!element) throw new Error('Expected file upload root');
  return element;
}

function zone(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-upload__zone');
  if (!element) throw new Error('Expected upload zone');
  return element;
}

function input(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('input[type="file"]');
  if (!element) throw new Error('Expected upload input');
  return element;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function selectFiles(inputElement: HTMLInputElement, ...files: File[]): void {
  Object.defineProperty(inputElement, 'files', {
    configurable: true,
    value: fileList(...files),
  });
  inputElement.dispatchEvent(new Event('change', { bubbles: true }));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraFileUpload', () => {
  it('adds input files, dispatches their real File objects and resets the input for repeat selection', async () => {
    const host = mountFileUpload({ uploadDuration: 10_000 });
    const receivedFiles: File[][] = [];
    const receivedChanges: Array<{ items: Array<{ name: string }> }> = [];
    root(host).addEventListener('lyra:files', (event) => {
      receivedFiles.push((event as CustomEvent<{ files: File[] }>).detail.files);
    });
    root(host).addEventListener('lyra:change', (event) => {
      receivedChanges.push((event as CustomEvent<{ items: Array<{ name: string }> }>).detail);
    });
    const upload = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const inputClick = vi.fn();
    input(host).addEventListener('click', inputClick);

    zone(host).click();
    expect(inputClick).toHaveBeenCalledOnce();

    selectFiles(input(host), upload);
    await flush();
    selectFiles(input(host), upload);
    await flush();

    expect(receivedFiles).toEqual([[upload], [upload]]);
    expect(receivedChanges).toHaveLength(2);
    expect(root(host).querySelectorAll('.lyra-upload__item')).toHaveLength(2);
    expect(input(host).value).toBe('');
  });

  it('exposes the React byte-formatting and icon-token helpers to list templates', () => {
    const host = mountFileUpload();
    const data = Alpine.$data(root(host)) as unknown as {
      formatBytes(bytes: number | undefined): string;
      iconFor(name: string): string;
    };

    expect([undefined, 10, 1024, 1024 * 1024].map((bytes) => data.formatBytes(bytes))).toEqual([
      '',
      '10 B',
      '1 KB',
      '1.0 MB',
    ]);
    expect(
      ['photo.jpeg', 'report.pdf', 'table.csv', 'archive.tar', 'clip.webm', 'unknown.bin'].map(
        (name) => data.iconFor(name),
      ),
    ).toEqual(['image', 'file-text', 'file-spreadsheet', 'file-archive', 'film', 'file']);
  });

  it('advances uploads to done and emits changes for progress ticks', async () => {
    const host = mountFileUpload({ uploadDuration: 10 });
    const changes: Array<{ items: Array<{ status: string; progress: number }> }> = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push(
        (event as CustomEvent<{ items: Array<{ status: string; progress: number }> }>).detail,
      );
    });
    selectFiles(input(host), new File(['report'], 'report.pdf', { type: 'application/pdf' }));

    // The check span is x-show-gated, so it exists (hidden) from the first render — wait for
    // real visibility, not mere existence, or the assertions run before the first progress tick.
    await vi.waitFor(() => {
      const check = root(host).querySelector<HTMLElement>('.lyra-upload__check');
      expect(check).not.toBeNull();
      expect(check!.style.display).not.toBe('none');
    });
    expect(changes.some((change) => change.items[0]?.status === 'done')).toBe(true);
    expect(changes).toHaveLength(2);
  });

  it('creates exact error items for over-limit files and never schedules their progress', async () => {
    const host = mountFileUpload({ maxSizeMB: 1, uploadDuration: 10 });
    const changes: Array<{ items: Array<{ status: string }> }> = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ items: Array<{ status: string }> }>).detail);
    });
    selectFiles(input(host), new File([new Uint8Array(1024 * 1024 + 1)], 'large.pdf'));
    await flush();

    expect(root(host).querySelector('.lyra-upload__item--error')).not.toBeNull();
    expect(root(host).querySelector('.lyra-upload__item-meta')?.textContent).toBe('Over 1 MB');
    await new Promise<void>((resolve) => setTimeout(resolve, 180));
    expect(changes).toHaveLength(1);
  });

  it('replaces the list with the first file when multiple is false', async () => {
    const host = mountFileUpload({ multiple: false, uploadDuration: 10_000 });
    selectFiles(input(host), new File(['one'], 'one.txt'), new File(['two'], 'two.txt'));
    await flush();
    selectFiles(input(host), new File(['three'], 'three.txt'));
    await flush();

    expect(Array.from(root(host).querySelectorAll('.lyra-upload__item-name'))).toHaveLength(1);
    expect(root(host).querySelector('.lyra-upload__item-name')?.textContent).toBe('three.txt');
  });

  it('sets and clears dragging through real drag events and drop adds files', async () => {
    const host = mountFileUpload({ uploadDuration: 10_000 });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(['drop'], 'drop.txt'));
    const dragOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer });

    expect(zone(host).classList).not.toContain('lyra-upload__zone--drag');
    zone(host).dispatchEvent(dragOver);
    await flush();
    expect(dragOver.defaultPrevented).toBe(true);
    expect(zone(host).classList).toContain('lyra-upload__zone--drag');

    const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer });
    zone(host).dispatchEvent(drop);
    await flush();
    expect(drop.defaultPrevented).toBe(true);
    expect(zone(host).classList).not.toContain('lyra-upload__zone--drag');
    expect(root(host).querySelector('.lyra-upload__item-name')?.textContent).toBe('drop.txt');
  });

  it('cancels an uploading item timer when it is removed', async () => {
    const host = mountFileUpload({ uploadDuration: 240 });
    const changes: Array<{ items: Array<{ status: string }> }> = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ items: Array<{ status: string }> }>).detail);
    });
    selectFiles(input(host), new File(['remove'], 'remove.txt'));
    await flush();
    root(host).querySelector<HTMLButtonElement>('.lyra-upload__remove')?.click();
    await flush();

    expect(root(host).querySelectorAll('.lyra-upload__item')).toHaveLength(0);
    // An orphaned interval would keep dispatching lyra:change every 120 ms on the (identity)
    // item map — freeze the count and prove the timer is really gone.
    const settledCount = changes.length;
    await new Promise<void>((resolve) => setTimeout(resolve, 400));
    expect(changes).toHaveLength(settledCount);
    expect(changes.at(-1)?.items).toEqual([]);
    expect(changes.some((change) => change.items.some((item) => item.status === 'done'))).toBe(
      false,
    );
  });

  it('synchronizes items and dragging through x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outerItems: [], outerDragging: false }">
        <div class="lyra-upload" x-data="lyraFileUpload({ uploadDuration: 10000 })" x-modelable="items" x-model="outerItems">
          <button class="lyra-upload__zone" x-bind="zone"><input type="file" hidden tabindex="-1" multiple x-bind="input"></button>
          <ul><template x-for="item in items" :key="item.id"><li class="model-item" x-text="item.name"></li></template></ul>
        </div>
        <div class="lyra-upload" x-data="lyraFileUpload()" x-modelable="dragging" x-model="outerDragging">
          <button class="lyra-upload__zone" x-bind="zone"><input type="file" hidden tabindex="-1" multiple x-bind="input"></button>
          <ul><template x-for="item in items" :key="item.id"><li x-text="item.name"></li></template></ul>
        </div>
        <button type="button" data-testid="set-items" x-on:click="outerItems = [{ id: 'outside', name: 'outside.txt', progress: 100, status: 'done' }]">Set items externally</button>
        <button type="button" data-testid="set-dragging" x-on:click="outerDragging = true">Set dragging externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    const modelRoots = host.querySelectorAll<HTMLElement>('.lyra-upload');
    const outer = Alpine.$data(host.firstElementChild as HTMLElement) as {
      outerItems: Array<{ name: string }>;
      outerDragging: boolean;
    };
    const setItems = host.querySelector<HTMLButtonElement>('[data-testid="set-items"]');
    const setDragging = host.querySelector<HTMLButtonElement>('[data-testid="set-dragging"]');
    if (!setItems || !setDragging) throw new Error('Expected external model controls');

    setItems.click();
    setDragging.click();
    await flush();
    expect(modelRoots[0].querySelector('.model-item')?.textContent).toBe('outside.txt');
    expect(zone(modelRoots[1]).classList).toContain('lyra-upload__zone--drag');

    selectFiles(input(modelRoots[0]), new File(['inside'], 'inside.txt'));
    zone(modelRoots[1]).dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
    await flush();
    expect(outer.outerItems.map((item) => item.name)).toEqual(['outside.txt', 'inside.txt']);
    expect(outer.outerDragging).toBe(false);
  });

  it('is axe clean with uploading, done, and error items', async () => {
    const host = mountFileUpload({
      defaultItems: [
        { id: 'uploading', name: 'uploading.txt', progress: 50, status: 'uploading' },
        { id: 'done', name: 'done.pdf', size: 1024, progress: 100, status: 'done' },
        { id: 'error', name: 'error.zip', progress: 0, status: 'error', error: 'Over 1 MB' },
      ],
    });
    await expectNoAxeViolations(host);
  });
});
