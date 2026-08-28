import { FileUpload } from '@lyra-ds/react/file-upload';
import type { FileUploadItem } from '@lyra-ds/react/file-upload';
import '@lyra-ds/styles/styles.css';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { isConfirmedRemovalFocusRecovery } from './removal-focus.mjs';

type OperationName =
  | 'selectionIntentDispatch'
  | 'controlledProgressReconciliation'
  | 'cancelIntent'
  | 'retryIntent'
  | 'confirmedRemovalFocusRecovery'
  | 'teardown';

interface OperationSample {
  durationMs: number;
  startTime: number;
  endTime: number;
  longTasks: Array<{ startTime: number; duration: number }>;
}

interface FixtureController {
  ready: () => Promise<void>;
  run: (operation: OperationName) => Promise<OperationSample>;
}

declare global {
  interface Window {
    fileUploadPerformance: FixtureController;
  }
}

function requireRootNode(): HTMLDivElement {
  const node = document.querySelector<HTMLDivElement>('#root');
  if (node === null) throw new Error('performance fixture root is missing');
  return node;
}

const rootNode = requireRootNode();

function baseItems(generation = 0): FileUploadItem[] {
  return Array.from({ length: 100 }, (_, index): FileUploadItem => {
    const id = `file-${generation}-${index}`;
    const common = { id, name: `${id}.pdf`, size: 1_024 + index, type: 'application/pdf' };
    if (index < 20) {
      return {
        ...common,
        status: 'uploading',
        attemptId: `${id}-attempt-${generation}`,
        progress: { kind: 'determinate', value: 40 },
      };
    }
    if (index === 20) {
      return {
        ...common,
        status: 'error',
        attemptId: `${id}-attempt-${generation}`,
        error: { kind: 'transport', message: 'Network unavailable', retryable: true },
      };
    }
    return { ...common, status: 'selected' };
  });
}

let setControlledItems: ((items: FileUploadItem[]) => void) | null = null;
let controlledItems = baseItems();
let controlledGeneration = 0;
let appReadyResolve: (() => void) | null = null;
let appReady = new Promise<void>((resolve) => {
  appReadyResolve = resolve;
});
let root = createRoot(rootNode);

function App() {
  const [items, setItems] = useState<FileUploadItem[]>(() => baseItems());

  useEffect(() => {
    setControlledItems = (nextItems) => setItems(nextItems);
    appReadyResolve?.();
    return () => {
      setControlledItems = null;
    };
  }, []);

  return (
    <FileUpload
      items={items}
      onSelect={() => completeIntent('selectionIntentDispatch')}
      onCancel={() => completeIntent('cancelIntent')}
      onRetry={() => completeIntent('retryIntent')}
      onRemove={({ id }) => {
        setItems((current) => current.filter((item) => item.id !== id));
      }}
    />
  );
}

function mount(): void {
  appReady = new Promise<void>((resolve) => {
    appReadyResolve = resolve;
  });
  root = createRoot(rootNode);
  root.render(<App />);
}

root.render(<App />);

const longTasks: PerformanceEntry[] = [];
if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
  const observer = new PerformanceObserver((list) => longTasks.push(...list.getEntries()));
  observer.observe({ type: 'longtask', buffered: true });
}

let activeOperation:
  | {
      name: OperationName;
      resolve: () => void;
    }
  | undefined;
let sequence = 0;

function completeIntent(name: OperationName): void {
  if (activeOperation?.name !== name) return;
  const resolve = activeOperation.resolve;
  activeOperation = undefined;
  resolve();
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function reset(): Promise<void> {
  if (setControlledItems === null) {
    mount();
    await appReady;
  }
  const update = setControlledItems;
  if (update === null) throw new Error('fixture did not expose controlled state');
  controlledGeneration += 1;
  controlledItems = baseItems(controlledGeneration);
  flushSync(() => update(controlledItems));
}

function button(selector: string): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>(selector);
  if (element === null) throw new Error(`fixture control is missing: ${selector}`);
  return element;
}

async function execute(operation: OperationName): Promise<void> {
  if (operation === 'controlledProgressReconciliation') {
    const update = setControlledItems;
    if (update === null) throw new Error('fixture did not expose controlled state');
    let updated = false;
    flushSync(() => {
      update(
        controlledItems.map((item) => {
          if (updated || item.status !== 'uploading') return item;
          updated = true;
          return { ...item, progress: { kind: 'determinate', value: 41 } };
        }),
      );
    });
    return;
  }

  if (operation === 'teardown') {
    root.unmount();
    if (rootNode.childElementCount !== 0) throw new Error('teardown left fixture content mounted');
    return;
  }

  if (operation === 'confirmedRemovalFocusRecovery') {
    const controls = document.querySelectorAll<HTMLButtonElement>('.lyra-upload__remove');
    const control = controls.item(controls.length - 1);
    if (control === null) throw new Error('fixture removal control is missing');
    const expectedTarget = controls.item(controls.length - 2);
    if (expectedTarget === null) throw new Error('fixture previous removal control is missing');
    control.focus();
    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(checkCompletion);
      function checkCompletion() {
        if (
          !isConfirmedRemovalFocusRecovery({
            removedControl: control,
            expectedTarget,
            activeElement: document.activeElement,
          })
        )
          return;
        observer.disconnect();
        document.removeEventListener('focusin', handleFocus);
        resolve();
      }
      const handleFocus = () => checkCompletion();
      observer.observe(rootNode, { childList: true, subtree: true });
      document.addEventListener('focusin', handleFocus);
      control.click();
      checkCompletion();
    });
    return;
  }

  await new Promise<void>((resolve) => {
    activeOperation = { name: operation, resolve };
    if (operation === 'selectionIntentDispatch') {
      const input = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (input === null) throw new Error('native file input is missing');
      const transfer = new DataTransfer();
      transfer.items.add(new File(['fixture'], 'fixture.pdf', { type: 'application/pdf' }));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (operation === 'cancelIntent') {
      button('.lyra-upload__item[data-state="uploading"] button').click();
      return;
    }
    button('.lyra-upload__item[data-state="error"] button').click();
  });
}

window.fileUploadPerformance = {
  ready: () => appReady,
  async run(operation) {
    await reset();
    sequence += 1;
    const marker = `file-upload:${operation}:${sequence}`;
    const startMark = `${marker}:start`;
    const endMark = `${marker}:end`;
    performance.mark(startMark);
    const startTime = performance.now();
    await execute(operation);
    const endTime = performance.now();
    performance.mark(endMark);
    performance.measure(marker, startMark, endMark);
    await nextPaint();
    return {
      durationMs: endTime - startTime,
      startTime,
      endTime,
      longTasks: longTasks.map((entry) => ({
        startTime: entry.startTime,
        duration: entry.duration,
      })),
    };
  },
};
